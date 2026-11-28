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
const { spawnSync } = require('child_process');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const compiler = path.resolve(__dirname, '../../../..');
const ts = require(path.join(compiler, 'node_modules/typescript'));
const interop = path.join(compiler, 'lib/fast_build/ark_compiler/interop');
const { DeclfileProductor } = require(path.join(interop, 'run_declgen_standalone'));
const { FileManager } = require(path.join(interop, 'interop_manager'));

function generate(root, inputs) {
  const modulePath = path.join(root, 'dynamic');
  const output = path.join(modulePath, 'build/declgenV2');
  const dynamicFiles = Object.entries(inputs).map(([name, content]) => {
    const input = path.join(modulePath, 'src/main/ets', name);
    fs.mkdirSync(path.dirname(input), { recursive: true });
    fs.writeFileSync(input, content);
    return input;
  });
  const moduleInfo = {
    language: '1.1', interopConfigPath: '', packageName: 'dynamic', moduleName: 'dynamic',
    modulePath, declgenV2OutPath: output, dynamicFiles, staticFiles: [],
    cachePath: path.join(modulePath, 'build/cache'), packageVersion: '1.0.0', moduleType: 'har'
  };
  const params = {
    dependentModuleMap: new Map([['dynamic', moduleInfo]]),
    projectConfig: {
      cachePath: path.join(root, 'cache'), bundleName: 'com.test.interop.signature',
      mainModuleName: 'entry', projectRootPath: root, sdkAliasMap: new Map()
    }
  };
  FileManager.init(params.dependentModuleMap, params.projectConfig.sdkAliasMap);
  try {
    DeclfileProductor.init(params);
    DeclfileProductor.getInstance().runDeclgen(params);
  } finally {
    FileManager.cleanFileManagerObject();
  }
  const files = dynamicFiles.map(input => {
    const relative = path.relative(modulePath, input).replace(/\.ets$/, '.d.ets');
    const file = path.join(output, relative);
    const text = fs.readFileSync(file, 'utf8');
    assert.ok(text.trim(), `Empty output: ${file}`);
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
    assert.deepStrictEqual(ast.parseDiagnostics, []);
    return { ...fileMetadata(file), text, relative };
  });
  return { files, inputs: dynamicFiles.map(fileMetadata), output, cache: path.join(root, 'build/.declgen-cache') };
}

function diagnostic(diagnostic) {
  const start = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  return { code: diagnostic.code, line: start.line + 1, column: start.character + 1,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
    file: path.basename(diagnostic.file.fileName) };
}

function consume(root, generated, text) {
  const file = path.join(root, 'Consumer.ets');
  fs.writeFileSync(file, text);
  const entry = path.join(generated.output, 'src/main/ets/API.d.ets');
  const options = { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs, allowNonTsExtensions: true,
    strict: true, skipLibCheck: true, experimentalDecorators: true, noEmit: true, types: [] };
  const host = ts.createCompilerHost(options);
  const interopTypes = path.join(root, 'InteropTypes.d.ts');
  // The repository checker uses the TypeScript array surface for projected interop collections.
  fs.writeFileSync(interopTypes, 'declare namespace interop { type Array<T> = T[]; } export default interop;');
  const resolutions = [];
  host.resolveModuleNames = (names, containing) => names.map(name => {
    if (name === '@ohos.lang.interop') {
      return { resolvedFileName: interopTypes, extension: ts.Extension.Dts, isExternalLibraryImport: false };
    }
    const dependency = name.startsWith('./') &&
      path.join(path.dirname(containing), name + '.d.ets');
    const fileName = name === 'generated' ? entry : dependency;
    if (fileName && fs.existsSync(fileName)) {
      resolutions.push({ specifier: name, containing, ...fileMetadata(fileName) });
      return { resolvedFileName: fileName, extension: ts.Extension.Dts, isExternalLibraryImport: false };
    }
    return ts.resolveModuleName(name, containing, options, host).resolvedModule;
  });
  const program = ts.createProgram([file], options, host);
  try {
    const source = program.getSourceFile(file);
    assert.ok(program.getSourceFile(entry), 'Consumer did not load the regenerated entry declaration');
    return {
      input: fileMetadata(file), interopTypes: fileMetadata(interopTypes), resolutions,
      diagnostics: [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map(diagnostic)
    };
  } finally {
    program.releaseTypeChecker();
    program.dispose?.();
  }
}

function snapshot(root, name, generated) {
  const archive = path.join(root, 'snapshots', name);
  for (const artifact of generated.files) {
    const destination = path.join(archive, artifact.relative);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(artifact.path, destination);
    assert.strictEqual(fileMetadata(destination).sha256, artifact.sha256);
  }
}

function runTransition(root, fixture) {
  const before = generate(root, fixture.before.sources);
  snapshot(root, 'before', before);
  const original = consume(root, before, fixture.before.caller);
  const cacheFiles = fs.readdirSync(before.cache);
  assert.ok(cacheFiles.length > 0, 'Declgen did not create a warm cache');
  const after = generate(root, fixture.after.sources);
  snapshot(root, 'after', after);
  const stale = consume(root, after, fixture.before.caller);
  const updated = consume(root, after, fixture.after.caller);
  const cleanRoot = path.join(root, 'cold-control');
  const cold = generate(cleanRoot, fixture.after.sources);
  const coldConsumers = [consume(cleanRoot, cold, fixture.before.caller),
    consume(cleanRoot, cold, fixture.after.caller)];
  return { before, after, cold, cacheFiles, original, stale, updated, coldConsumers };
}

function executeTransition(t, fixture) {
  const processResult = spawnSync(process.execPath, [__filename], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 60000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(processResult.status, 0, processResult.stderr || 'Regeneration worker failed');
  const report = path.join(t.workspace, 'transition-result.json');
  const actual = JSON.parse(fs.readFileSync(report, 'utf8'));
  t.record('transition-artifacts', { report, before: actual.before.files, after: actual.after.files,
    cold: actual.cold.files, retainedCache: actual.cacheFiles });
  return actual;
}

if (require.main === module) {
  const { root, fixture } = JSON.parse(fs.readFileSync(0, 'utf8'));
  writeJson(path.join(root, 'transition-result.json'), runTransition(root, fixture));
}

module.exports = { executeTransition };
