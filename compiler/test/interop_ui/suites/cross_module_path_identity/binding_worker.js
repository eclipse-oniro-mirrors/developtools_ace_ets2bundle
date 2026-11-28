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
const { analyze } = require('../dynamic_named_imports/transform_worker');
const { assertInteropLibFresh } = require('../dynamic_calls_static_basic/unit.test');
const { writeJson } = require('../dynamic_calls_static_basic/harness');
const compiler = path.resolve(__dirname, '../../../..');
const ts = require(path.join(compiler, 'node_modules/typescript'));
const interop = path.join(compiler, 'lib/fast_build/ark_compiler/interop');
const { FileManager } = require(path.join(interop, 'interop_manager'));

function configure(root, fixture) {
  assertInteropLibFresh();
  const checker = require(path.join(compiler, 'lib/ets_checker'));
  Object.assign(checker.compilerOptions, { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs, allowNonTsExtensions: true,
    baseUrl: root, paths: fixture.aliases || {} });
  const modules = new Map();
  const files = {};
  for (const spec of fixture.providers) {
    const source = path.join(root, spec.path);
    fs.mkdirSync(path.dirname(source), { recursive: true });
    const declaration = spec.kind === 'function' ?
      `export function ${spec.symbol}(): string { return '${spec.record}'; }` :
      `export class ${spec.symbol} { public static identity: string = '${spec.record}'; }`;
    fs.writeFileSync(source, `${spec.dynamic ? '' : "'use static'\n"}${declaration}\n`);
    modules.set(spec.packageName, { language: 'hybrid', moduleName: spec.packageName,
      packageName: spec.packageName, modulePath: path.join(root, spec.packageName),
      staticFiles: spec.dynamic ? [] : [source], dynamicFiles: spec.dynamic ? [source] : [],
      cachePath: path.join(root, 'cache', spec.packageName), byteCodeHarInfo: {} });
    if (!spec.missingMetadata) {
      const name = spec.metadataSymbol || spec.symbol;
      files[source.split(path.sep).join('/')] = {
        root: { [name]: { kind: spec.kind, name, runtimeName: spec.record } }
      };
    }
  }
  FileManager.initForTest(modules, undefined, undefined, undefined, undefined, root);
  const metadataPath = path.join(root, 'metadata.json');
  writeJson(metadataPath, { files });
  FileManager.initStaticInteropMetadata({ projectConfig: { declgenBridgeConfigPath: metadataPath } });
  return checker;
}

function sourceContracts(root, fixture, importer, options) {
  const sources = fixture.providers.map(spec => path.join(root, spec.path));
  const program = ts.createProgram([importer, ...sources], options);
  const checker = program.getTypeChecker();
  return sources.map(file => {
    const source = program.getSourceFile(file);
    assert.ok(source, `Program did not load ${file}`);
    const symbol = checker.getSymbolAtLocation(source);
    return { path: path.relative(root, file), exports: checker.getExportsOfModule(symbol).map(item => item.name) };
  });
}

function transform(root, fixture, checker) {
  const importer = path.join(root, 'Caller.ets');
  fs.writeFileSync(importer, fixture.source);
  const source = ts.createSourceFile(importer, fixture.source, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  assert.strictEqual(source.parseDiagnostics.length, 0);
  const resolutions = source.statements.filter(ts.isImportDeclaration).map(node => {
    const resolved = checker.resolveModuleName(node.moduleSpecifier.text, importer).resolvedModule;
    return { request: node.moduleSpecifier.text,
      path: resolved ? path.relative(root, resolved.resolvedFileName) : null };
  });
  const production = require(path.join(interop, 'process_static_interop_imports'));
  production.resetStaticInteropTransformLog();
  const transformed = ts.transform(source, [context => input =>
    production.processStaticInteropImports(input, importer + (fixture.importerQuery || ''), context)]);
  try {
    const output = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(transformed.transformed[0]);
    fs.writeFileSync(path.join(root, 'transformed.ts'), output);
    return { output, resolutions, errors: production.staticInteropTransformLog.errors,
      contracts: sourceContracts(root, fixture, importer, checker.compilerOptions), analysis: analyze(output) };
  } finally {
    transformed.dispose();
  }
}

function evaluate(output) {
  const calls = [];
  const sandbox = { exports: {}, Panda: {
    getClass(record) {
      calls.push(['getClass', record]);
      class RuntimeCard {}
      RuntimeCard.identity = record;
      return RuntimeCard;
    },
    getFunction(record, name) {
      calls.push(['getFunction', record, name]);
      return argument => `${record}/${name}/${argument}`;
    }
  } };
  const emitted = ts.transpileModule(output, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 }
  }).outputText;
  vm.runInNewContext(emitted, sandbox, { timeout: 2000, filename: 'path-bindings.js' });
  return { probe: sandbox.probe, calls, mode: 'Panda boundary stub' };
}

const { root, fixture } = JSON.parse(fs.readFileSync(0, 'utf8'));
try {
  const checker = configure(root, fixture);
  const result = transform(root, fixture, checker);
  result.runtime = fixture.evaluate ? evaluate(result.output) : null;
  writeJson(path.join(root, 'bindings.json'), result);
} finally {
  FileManager.cleanFileManagerObject();
}
