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

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { assertInteropLibFresh } = require('../dynamic_calls_static_basic/unit.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

function inspect(source) {
  const imports = [];
  const bridges = [];
  const reexports = [];
  let dynamicImports = 0;
  function visit(node) {
    if (ts.isImportDeclaration(node)) {
      imports.push(node.moduleSpecifier.text);
    }
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      reexports.push(node.moduleSpecifier.text);
    }
    if (ts.isVariableStatement(node) && node.modifiers &&
        node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      const declarations = node.declarationList.declarations.filter(declaration =>
        ts.isIdentifier(declaration.name) &&
        declaration.name.text.startsWith('__staticInteropConcurrent_'));
      bridges.push(...declarations.map(declaration => declaration.name.text));
    }
    if (ts.isModuleDeclaration(node) && node.name &&
        node.name.text.startsWith('__staticInteropConcurrent_')) {
      bridges.push(node.name.text);
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      dynamicImports += 1;
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return { imports, bridges, reexports, dynamicImports, parseErrors: source.parseDiagnostics.length };
}

function worker(root, fixture) {
  assertInteropLibFresh();
  const checker = require(path.join(COMPILER_ROOT, 'lib/ets_checker'));
  Object.assign(checker.compilerOptions, { target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true });
  const { FileManager } = require(path.join(COMPILER_ROOT,
    'lib/fast_build/ark_compiler/interop/interop_manager'));
  const production = require(path.join(COMPILER_ROOT,
    'lib/fast_build/ark_compiler/interop/process_static_interop_imports'));
  const staticFile = path.join(root, 'Static.ets');
  const dynamicFile = path.join(root, 'Dynamic.ets');
  const caller = path.join(root, 'Caller.ets');
  fs.writeFileSync(staticFile, "'use static';\nexport class Card {}\n");
  fs.writeFileSync(dynamicFile, 'export class DynamicCard {}\n');
  fs.writeFileSync(caller, fixture.source);
  const metadata = path.join(root, 'metadata.json');
  fs.writeFileSync(metadata, JSON.stringify({ files: { [staticFile]: { root: fixture.metadata } } }));
  FileManager.initForTest(new Map([['cards', { language: 'hybrid', packageName: 'cards',
    moduleName: 'cards', modulePath: root, cachePath: path.join(root, 'cache'),
    staticFiles: [staticFile], dynamicFiles: [caller, dynamicFile], byteCodeHarInfo: {} }]]),
  new Map(), undefined, undefined, undefined, root);
  FileManager.initStaticInteropMetadata({ projectConfig: { declgenBridgeConfigPath: metadata } });
  if (fixture.concurrent) {
    FileManager.setStaticInteropConcurrentImport(caller);
  }
  const source = ts.createSourceFile(caller, fixture.source, ts.ScriptTarget.ES2021,
    true, ts.ScriptKind.ETS);
  if (source.parseDiagnostics.length) {
    throw new Error('Restricted import fixture contains invalid syntax');
  }
  production.resetStaticInteropTransformLog();
  const transformed = ts.transform(source, [context => node =>
    production.processStaticInteropImports(node, caller, context)]);
  try {
    const output = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(transformed.transformed[0]);
    const outputPath = path.join(root, 'transformed.ts');
    fs.writeFileSync(outputPath, output);
    const parsed = ts.createSourceFile(outputPath, output, ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
    return { output, analysis: inspect(parsed), errors: production.staticInteropTransformLog.errors,
      sourceFile: caller, staticFile, concurrentFlag: FileManager.hasStaticInteropConcurrentImport(caller) };
  } finally {
    transformed.dispose();
    production.resetStaticInteropTransformLog();
    FileManager.cleanFileManagerObject();
  }
}

function executeFixture(t, fixture) {
  const result = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(result.status, 0, result.stderr || 'Static import worker failed');
  const file = path.join(t.workspace, 'import-result.json');
  const actual = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.record('actual-restricted-import', { file, ...actual });
  return actual;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    const result = worker(input.root, input.fixture);
    fs.writeFileSync(path.join(input.root, 'import-result.json'), JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture };
