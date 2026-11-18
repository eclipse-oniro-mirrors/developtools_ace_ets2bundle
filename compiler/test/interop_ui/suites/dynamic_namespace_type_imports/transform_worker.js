/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));
const { assertInteropLibFresh } = require('../dynamic_calls_static_basic/unit.test');

function writeMetadataFixture(metadataPath, files, fixture) {
  const mode = fixture.metadataMode || 'valid';
  const staticFile = Object.keys(files)[0];
  const malformed = {
    'files-missing': {},
    'files-null': { files: null },
    'files-array': { files: [] },
    'files-string': { files: 'invalid' },
    'root-null': { files: { [staticFile]: { root: null } } },
    'root-array': { files: { [staticFile]: { root: [] } } },
    'root-string': { files: { [staticFile]: { root: 'invalid' } } },
    'entry-missing': { files: {} },
    'entry-other-path': { files: { [`${staticFile}.other`]: files[staticFile] } }
  };
  if (mode === 'missing-file') {
    return;
  }
  const text = mode === 'invalid-json' ? '{ "files":' : JSON.stringify(malformed[mode] || { files });
  fs.writeFileSync(metadataPath, text);
}

function configure(root, fixture) {
  assertInteropLibFresh();
  const checker = require(path.join(COMPILER_ROOT, 'lib/ets_checker'));
  Object.assign(checker.compilerOptions, {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true
  });
  const { FileManager } = require(path.join(
    COMPILER_ROOT, 'lib/fast_build/ark_compiler/interop/interop_manager'));
  const staticFile = path.join(root, 'Static.ets');
  const dynamicFile = path.join(root, 'Dynamic.ets');
  fs.writeFileSync(staticFile, fixture.staticSource || "'use static'\nexport class StaticCard {}\n");
  fs.writeFileSync(dynamicFile, 'export class DynamicCard {}\n');
  FileManager.initForTest(new Map([['cards', {
    language: 'hybrid',
    packageName: 'cards',
    moduleName: 'cards',
    modulePath: root,
    staticFiles: [staticFile],
    dynamicFiles: [dynamicFile],
    cachePath: path.join(root, 'cache'),
    byteCodeHarInfo: {}
  }]]), undefined, undefined, undefined, undefined, root);
  const metadataPath = path.join(root, 'metadata.json');
  const files = {};
  if (fixture.metadata !== null) {
    files[staticFile.replace(/\\/g, '/')] = { root: fixture.metadata };
  }
  writeMetadataFixture(metadataPath, files, fixture);
  FileManager.initStaticInteropMetadata({ projectConfig: { declgenBridgeConfigPath: metadataPath } });
  return { checker, FileManager, staticFile, metadataPath };
}

function inspectSourceContract(root, sourceFile) {
  const importer = path.join(root, 'Caller.ets');
  const staticFile = path.join(root, 'Static.ets');
  const program = ts.createProgram([importer, staticFile], {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    skipLibCheck: true
  });
  const checker = program.getTypeChecker();
  const moduleSource = program.getSourceFile(staticFile);
  const moduleSymbol = checker.getSymbolAtLocation(moduleSource);
  const exports = moduleSymbol ? checker.getExportsOfModule(moduleSymbol).map(symbol => symbol.name) : [];
  const bindings = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) {
      continue;
    }
    const programSource = program.getSourceFile(importer);
    const original = programSource.statements.find(node => node.pos === statement.pos);
    if (!original || !original.importClause.namedBindings ||
        !ts.isNamedImports(original.importClause.namedBindings)) {
      continue;
    }
    for (const specifier of original.importClause.namedBindings.elements) {
      const alias = checker.getSymbolAtLocation(specifier.name);
      const target = alias && checker.getAliasedSymbol(alias);
      bindings.push({ local: specifier.name.text, target: target && target.name });
    }
  }
  return { exports, bindings, staticFile, importer, checker: 'real TypeScript Program' };
}

function transform(root, fixture, environment) {
  const importer = path.join(root, 'Caller.ets');
  fs.writeFileSync(importer, fixture.source);
  const source = ts.createSourceFile(importer, fixture.source,
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  assert.strictEqual(source.parseDiagnostics.length, 0);
  const imports = source.statements.filter(ts.isImportDeclaration);
  const resolutions = imports.map(node => {
    const specifier = node.moduleSpecifier.text;
    const resolved = environment.checker.resolveModuleName(specifier, importer).resolvedModule;
    return { specifier, resolved: resolved && resolved.resolvedFileName };
  });
  const production = require(path.join(COMPILER_ROOT,
    'lib/fast_build/ark_compiler/interop/process_static_interop_imports'));
  production.resetStaticInteropTransformLog();
  const result = ts.transform(source, [context => node =>
    production.processStaticInteropImports(node, importer, context)]);
  try {
    const output = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(result.transformed[0]);
    fs.writeFileSync(path.join(root, 'transformed.ts'), output);
    return { output, resolutions, errors: production.staticInteropTransformLog.errors,
      sourceContract: inspectSourceContract(root, source) };
  } finally {
    result.dispose();
  }
}

function analyze(output) {
  const source = ts.createSourceFile('Output.ts', output,
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
  const declarations = [];
  const lookups = [];
  const helpers = [];
  const imports = [];
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
      if (node.initializer && ts.isCallExpression(node.initializer) &&
          node.initializer.expression.getText(source) === '__createLazy__') {
        declarations.push(node.name.text);
      }
    }
    if (ts.isFunctionDeclaration(node) && node.name && node.name.text.startsWith('__create')) {
      helpers.push(node.name.text);
    }
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const method = node.expression.name.text;
      if (['getClass', 'getFunction'].includes(method)) {
        lookups.push([method, ...node.arguments.map(argument => argument.text)]);
      }
    }
    if (ts.isImportDeclaration(node)) {
      imports.push(node.moduleSpecifier.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { declarations, lookups, helpers, imports, parseErrors: source.parseDiagnostics.length };
}

function evaluate(output, fixture) {
  const emitted = ts.transpileModule(output, {
    compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const calls = [];
  const properties = fixture.runtimeProperties || {};
  const sandbox = {
    exports: {},
    console: { error() {}, warn() {}, info() {}, log() {} },
    Panda: {
      getClass(record) {
        calls.push(['getClass', record]);
        class RuntimeCard {}
        RuntimeCard.identity = record;
        Object.assign(RuntimeCard, properties);
        return RuntimeCard;
      },
      getFunction(record, method) {
        calls.push(['getFunction', record, method]);
        return value => `${record}/${method}/${value}`;
      }
    }
  };
  vm.runInNewContext(emitted, sandbox, { timeout: 2000, filename: 'transformed.js' });
  return { probe: sandbox.probe, runtimeCalls: calls };
}

function worker(request) {
  const environment = configure(request.root, request.fixture);
  try {
    const transformed = transform(request.root, request.fixture, environment);
    const analysis = analyze(transformed.output);
    const runtime = request.fixture.evaluate ? evaluate(transformed.output, request.fixture) : null;
    return { ...transformed, analysis, runtime, isolation: 'child-process' };
  } finally {
    environment.FileManager.cleanFileManagerObject();
  }
}

function executeFixture(t, fixture) {
  const input = JSON.stringify({ root: t.workspace, fixture });
  const processResult = spawnSync(process.execPath, [__filename, '--worker'], {
    input,
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024
  });
  t.equal(processResult.status, 0, processResult.stderr || 'transform worker failed');
  const resultPath = path.join(t.workspace, 'worker-result.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  t.record('actual-transform', { resultPath, ...result });
  return result;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    fs.writeFileSync(path.join(request.root, 'worker-result.json'), JSON.stringify(worker(request), null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { analyze, executeFixture };
