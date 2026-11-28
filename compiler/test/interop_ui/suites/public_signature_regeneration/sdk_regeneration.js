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
const { stripVTControlCharacters } = require('util');
const { STATIC_COUNTER_SOURCE } = require('../dynamic_calls_static_basic/source_cases');
const { assertAbcHeader, findFatalDiagnostics, readAbcHeader } =
  require('../dynamic_calls_static_basic/expected_cases');
const { AssertionContext, fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const { assertBridgeIdentity, validateDeclarationAndBridge } =
  require('../dynamic_calls_static_basic/compile.test');
const { getScenarioPaths, materializeProject, validateDeclarationMap, validateProjectionEvidence } =
  require('../dynamic_calls_static_basic/project_files');
const {
  executeDisassembler, executeHvigor, executeOhpmInstall, executeZipTest, listZipEntries,
  publicToolchain, readToolchainVersions, resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');

function caller(expression) {
  return `import { StaticCounter, initialCount } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = ${expression};
  build() {
    Column() {
      Text(this.counterSeed.toString()).id('seed')
      StaticCounter({ count: this.counterSeed })
    }
  }
}
`;
}

function snapshotInputs(t, materialized, label) {
  const files = materialized.manifest.files.map(file => ({ ...file, ...fileMetadata(file.path) }));
  const report = path.join(t.workspace, 'evidence', `${label}-inputs.json`);
  writeJson(report, { projectRoot: materialized.projectRoot, files });
  t.record(`${label}-inputs`, { report, files });
}

function build(t, project, tools, label) {
  const result = executeHvigor(project, t.workspace, tools);
  const archive = path.join(t.workspace, 'evidence', `${label}-hvigor.log`);
  fs.copyFileSync(result.record.logPath, archive);
  const output = stripVTControlCharacters(`${result.stdout || ''}\n${result.stderr || ''}`);
  t.record(label, { ...result.record, logPath: archive });
  return { exitCode: result.record.exitCode, output };
}

function assertFreshDeclarations(t, paths, declaration, prefix, notBeforeMs) {
  const observed = new AssertionContext(t.testCase, path.join(t.workspace, 'snapshots', prefix), t.options);
  const projection = validateProjectionEvidence(observed, paths);
  const map = validateDeclarationMap(observed, paths);
  const artifacts = validateDeclarationAndBridge(observed, paths, notBeforeMs);
  t.assertions += observed.assertions;
  t.includes(fs.readFileSync(paths.staticDeclaration, 'utf8'), declaration);
  t.includes(fs.readFileSync(paths.staticIndexDeclaration, 'utf8'), 'initialCount');
  t.record(`${prefix}-declaration-map`, { artifacts, projection, map });
  return artifacts;
}

function assertBuildArtifacts(t, paths, tools, prefix, expression) {
  const generated = fs.readFileSync(paths.callerTransformedPage, 'utf8');
  t.includes(generated.replace(/'/g, '"'), expression);
  t.includes(generated, '__Interop_CreateStaticComponent_Internal');
  const observed = new AssertionContext(t.testCase, path.join(t.workspace, 'snapshots', prefix), t.options);
  assertBridgeIdentity(observed, paths.staticBridge, paths.callerCachedBridge, false);
  t.assertions += observed.assertions;
  const kinds = [['dynamic', paths.dynamicAbc], ['static', paths.staticAbc]];
  const results = {};
  for (const [kind, abc] of kinds) {
    const data = fileMetadata(abc);
    t.ok(assertAbcHeader(readAbcHeader(fs.readFileSync(abc)), kind));
    const disassembly = executeDisassembler(tools, kind, abc, t.workspace, prefix + '-');
    t.includes(disassembly.content, 'initialCount');
    t.includes(disassembly.content, 'StaticCounter');
    results[kind] = { ...data, disassembly: disassembly.outputPath };
  }
  t.equal(executeZipTest(tools, paths.unsignedHap, t.workspace).exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, observed.workspace);
  t.ok(entries.includes('ets/modules.abc'));
  t.ok(entries.includes('ets/modules_static.abc'));
  t.record(`${prefix}-package`, { ...results, entries, hap: fileMetadata(paths.unsignedHap) });
  return results;
}

function assertRejection(t, paths, result, fixture) {
  t.notEqual(result.exitCode, 0, 'Old caller must reject the new library signature');
  t.includes(result.output, fixture.diagnostic);
  const entries = [...result.output.matchAll(/Index\.ets:(\d+):(\d+)/g)];
  t.ok(entries.some(match => Number(match[1]) === 5 && Number(match[2]) > 0));
  const line = fs.readFileSync(paths.dynamicSource, 'utf8').split('\n')[4];
  t.includes(line, fixture.oldCall);
  t.record('stale-caller-diagnostic', { rejectedCall: line, diagnostic: fixture.diagnostic });
}

function writeLibrary(paths, signature) {
  fs.writeFileSync(paths.staticSource, STATIC_COUNTER_SOURCE + '\n' + signature + '\n');
}

function verify(t, fixture) {
  const tools = resolveToolchain(t.options.env || process.env);
  t.toolchain = publicToolchain(readToolchainVersions(tools));
  const project = materializeProject(t.workspace, tools.sdkHome);
  const paths = getScenarioPaths(project.projectRoot);
  fs.appendFileSync(paths.staticIndexSource, "export { initialCount } from './src/main/ets/StaticCounter';\n");
  writeLibrary(paths, fixture.before);
  fs.writeFileSync(paths.dynamicSource, caller(fixture.oldCall));
  snapshotInputs(t, project, 'original');
  const installed = executeOhpmInstall(project.projectRoot, t.workspace, tools);
  t.equal(installed.record.exitCode, 0);
  t.record('ohpm', installed.record);
  const startedAt = Date.now();
  const original = build(t, project.projectRoot, tools, 'original');
  t.equal(original.exitCode, 0);
  t.deepEqual(findFatalDiagnostics(original.output), []);
  const before = assertFreshDeclarations(t, paths, fixture.oldDeclaration, 'original', startedAt);
  const originalPackage = assertBuildArtifacts(t, paths, tools, 'original', fixture.oldCall);

  writeLibrary(paths, fixture.after);
  snapshotInputs(t, project, 'stale');
  const rejected = build(t, project.projectRoot, tools, 'stale');
  assertRejection(t, paths, rejected, fixture);
  const changed = assertFreshDeclarations(t, paths, fixture.newDeclaration, 'stale', startedAt);
  t.notEqual(before.declarationArtifact.sha256, changed.declarationArtifact.sha256);
  t.equal(before.bridgeArtifact.sha256, changed.bridgeArtifact.sha256,
    'The old protocol looks up this top-level function by its stable exported name');

  fs.writeFileSync(paths.dynamicSource, caller(fixture.newCall));
  snapshotInputs(t, project, 'updated');
  const recovered = build(t, project.projectRoot, tools, 'updated');
  t.equal(recovered.exitCode, 0);
  t.deepEqual(findFatalDiagnostics(recovered.output), []);
  t.equal(fileMetadata(paths.staticDeclaration).sha256, changed.declarationArtifact.sha256);
  t.equal(fileMetadata(paths.staticBridge).sha256, changed.bridgeArtifact.sha256);
  const updatedPackage = assertBuildArtifacts(t, paths, tools, 'updated', fixture.newCall);
  t.notEqual(originalPackage.dynamic.sha256, updatedPackage.dynamic.sha256);
  t.notEqual(originalPackage.static.sha256, updatedPackage.static.sha256);
}

const fixtures = [
  {
    id: 'parameter-retyped-and-caller-rebuilt',
    before: 'export function initialCount(seed: number): number { return seed; }',
    after: 'export function initialCount(seed: string): number { return seed.length; }',
    oldCall: 'initialCount(7)',
    newCall: 'initialCount("seven")',
    oldDeclaration: 'initialCount(seed: number)',
    newDeclaration: 'initialCount(seed: string)',
    diagnostic: "Argument of type 'number' is not assignable to parameter of type 'string'"
  },
  {
    id: 'required-offset-added-to-export',
    before: 'export function initialCount(seed: number): number { return seed; }',
    after: 'export function initialCount(seed: number, offset: number): number { return seed + offset; }',
    oldCall: 'initialCount(7)',
    newCall: 'initialCount(7, 2)',
    oldDeclaration: 'initialCount(seed: number)',
    newDeclaration: 'initialCount(seed: number, offset: number)',
    diagnostic: 'Expected 2 arguments, but got 1'
  }
];

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'compile',
  direction: '11-to-12',
  run: t => verify(t, fixture)
}));

module.exports = { cases };
