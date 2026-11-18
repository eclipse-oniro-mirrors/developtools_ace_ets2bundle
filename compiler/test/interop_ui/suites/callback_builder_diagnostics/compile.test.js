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
const {
  assertNoPreexistingArtifacts,
  getScenarioPaths,
  materializeProject,
  validateDeclarationMap,
  validateDependencyMap,
  validateProjectionEvidence
} = require('../dynamic_calls_static_basic/project_files');
const { validateDeclarationAndBridge } = require('../dynamic_calls_static_basic/compile.test');
const { assertAbcHeader, findFatalDiagnostics, readAbcHeader } =
  require('../dynamic_calls_static_basic/expected_cases');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const {
  executeDisassembler,
  executeHvigor,
  executeOhpmInstall,
  executeZipTest,
  listZipEntries,
  publicToolchain,
  readToolchainVersions,
  resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');
const { fixtures } = require('./project_cases');

function updateManifest(t, materialized, phase) {
  const manifest = { ...materialized.manifest,
    files: materialized.manifest.files.map(file => ({ ...file, ...fileMetadata(file.path) })) };
  const file = path.join(t.workspace, 'evidence', `${phase}-input-manifest.json`);
  writeJson(file, manifest);
  for (const input of manifest.files) {
    t.equal(input.sha256, fileMetadata(input.path).sha256);
    t.greater(input.bytes, 0);
  }
  t.record(`${phase}-input`, { file, manifest });
  return manifest;
}

function archiveBuild(t, result, name) {
  const target = path.join(t.workspace, 'evidence', `${name}.log`);
  fs.copyFileSync(result.record.logPath, target);
  const output = stripVTControlCharacters(`${result.stdout || ''}\n${result.stderr || ''}`);
  t.record(name, { process: { ...result.record, logPath: target }, output });
  return output;
}

function assertRejection(t, fixture, result, output, paths) {
  t.notEqual(result.record.exitCode, 0, 'The deliberately invalid caller must fail compilation');
  t.includes(output, fixture.diagnostic.code);
  for (const fragment of fixture.diagnostic.fragments) {
    t.includes(output, fragment);
  }
  t.includes(output, '/entry/src/main/ets/pages/Index.ets:');
  const positions = Array.from(output.matchAll(/Index\.ets:(\d+):(\d+)/g));
  t.greater(positions.length, 0);
  t.ok(positions.some(match => Number(match[1]) === fixture.diagnostic.line));
  for (const match of positions) {
    t.greater(Number(match[2]), 0);
  }
  const sourceLine = fs.readFileSync(paths.dynamicSource, 'utf8')
    .split('\n')[fixture.diagnostic.line - 1];
  t.includes(sourceLine, fixture.diagnostic.anchor);
  t.record('expected-sdk-rejection', { fixture: fixture.id, diagnostic: fixture.diagnostic,
    caller: paths.dynamicSource, sourceLine, compilerExitCode: result.record.exitCode });
}

function assertRecovery(t, tools, paths, startedAt, fixture) {
  validateDeclarationAndBridge(t, paths, startedAt);
  validateProjectionEvidence(t, paths);
  validateDeclarationMap(t, paths);
  validateDependencyMap(t, paths);
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  const caller = fs.readFileSync(paths.callerTransformedPage, 'utf8');
  for (const token of fixture.recovery.declaration) {
    t.includes(declaration, token);
  }
  for (const token of fixture.recovery.caller) {
    t.includes(caller, token);
  }
  for (const kind of ['dynamic', 'static']) {
    const abc = kind === 'dynamic' ? paths.dynamicAbc : paths.staticAbc;
    t.freshArtifact(`recovered-${kind}-abc`, abc, { notBeforeMs: startedAt, minimumBytes: 16 });
    t.ok(assertAbcHeader(readAbcHeader(fs.readFileSync(abc)), kind));
    const disassembly = executeDisassembler(tools, kind, abc, t.workspace, 'recovered-');
    t.includes(disassembly.content, 'StaticCounter');
  }
  t.freshArtifact('recovered-hap', paths.unsignedHap, { notBeforeMs: startedAt, minimumBytes: 128 });
  t.equal(executeZipTest(tools, paths.unsignedHap, t.workspace).exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, t.workspace);
  t.ok(entries.includes('ets/modules.abc'));
  t.ok(entries.includes('ets/modules_static.abc'));
  t.record('recovered-mixed-artifacts', { hap: fileMetadata(paths.unsignedHap),
    dynamic: fileMetadata(paths.dynamicAbc), static: fileMetadata(paths.staticAbc), entries });
}

async function compile(t, fixture) {
  const startedAt = Date.now();
  const tools = resolveToolchain(t.options.env || process.env);
  t.toolchain = publicToolchain(readToolchainVersions(tools));
  const materialized = materializeProject(t.workspace, tools.sdkHome);
  const paths = getScenarioPaths(materialized.projectRoot);
  assertNoPreexistingArtifacts(paths);
  fs.writeFileSync(paths.staticSource, fixture.staticSource);
  fs.writeFileSync(paths.staticIndexSource, fixture.staticIndex);
  fs.writeFileSync(paths.dynamicSource, fixture.invalidCaller);
  updateManifest(t, materialized, 'invalid');
  const installed = executeOhpmInstall(materialized.projectRoot, t.workspace, tools);
  t.record('ohpm-install', installed.record);
  t.equal(installed.record.exitCode, 0);
  const rejected = executeHvigor(materialized.projectRoot, t.workspace, tools);
  const output = archiveBuild(t, rejected, 'rejected-build');
  assertRejection(t, fixture, rejected, output, paths);
  for (const [name, file] of [['declaration', paths.staticDeclaration], ['bridge', paths.staticBridge]]) {
    t.freshArtifact(`rejection-generated-${name}`, file, { notBeforeMs: startedAt, minimumBytes: 32 });
  }
  fs.writeFileSync(paths.dynamicSource, fixture.validCaller);
  if (fixture.validStaticSource) {
    fs.writeFileSync(paths.staticSource, fixture.validStaticSource);
  }
  updateManifest(t, materialized, 'repaired');
  const repaired = executeHvigor(materialized.projectRoot, t.workspace, tools);
  const repairedOutput = archiveBuild(t, repaired, 'repaired-build');
  t.equal(repaired.record.exitCode, 0, 'Repair must complete the normal mixed-project build');
  t.deepEqual(findFatalDiagnostics(repairedOutput), []);
  assertRecovery(t, tools, paths, startedAt, fixture);
  return { expectedRejection: true, diagnostic: fixture.diagnostic,
    firstCompilerExitCode: rejected.record.exitCode, repairedCompilerExitCode: repaired.record.exitCode,
    generatedDeclaration: paths.staticDeclaration, consumer: paths.callerTransformedPage,
    mixedHap: paths.unsignedHap, deviceExecution: false };
}

const cases = fixtures.map(fixture => ({
  id: `compile-${fixture.id}`,
  group: 'compile',
  direction: '11-to-12',
  run: t => compile(t, fixture)
}));

module.exports = { cases, compile };
