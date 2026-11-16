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
const { stripVTControlCharacters } = require('util');
const {
  getScenarioPaths,
  materializeProject,
  validateProjectionEvidence
} = require('../dynamic_calls_static_basic/project_files');
const {
  executeHvigor,
  executeOhpmInstall,
  publicToolchain,
  readToolchainVersions,
  resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');
const { caller, parameterSource } = require('./project_cases');
const path = require('path');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');

const fixtures = [
  {
    id: 'numeric-property-rejects-string',
    properties: 'count: "wrong", title: "valid", cardEnabled: true',
    expectedMessage: "Type 'string' is not assignable to type 'number'",
    property: 'count'
  },
  {
    id: 'string-property-rejects-number',
    properties: 'count: 1, title: 12, cardEnabled: true',
    expectedMessage: "Type 'number' is not assignable to type 'string'",
    property: 'title'
  },
  {
    id: 'boolean-property-rejects-string',
    properties: 'count: 1, title: "valid", cardEnabled: "wrong"',
    expectedMessage: "Type 'string' is not assignable to type 'boolean'",
    property: 'cardEnabled'
  }
];

function inputProject(t, fixture, tools) {
  const materialized = materializeProject(t.workspace, tools.sdkHome);
  const paths = getScenarioPaths(materialized.projectRoot);
  const source = caller(fixture.properties, '@State counterSeed: number = 7;');
  fs.writeFileSync(paths.dynamicSource, source);
  fs.writeFileSync(paths.staticSource, parameterSource);
  const manifest = {
    ...materialized.manifest,
    files: materialized.manifest.files.map(file => ({ ...file, ...fileMetadata(file.path) }))
  };
  writeJson(path.join(t.workspace, 'evidence', 'input-manifest.json'), manifest);
  for (const file of manifest.files) {
    t.equal(file.sha256, fileMetadata(file.path).sha256, 'Negative input manifest differs from source');
  }
  t.record('negative-input', {
    fixture,
    source,
    caller: paths.dynamicSource,
    staticSource: paths.staticSource,
    manifest
  });
  return { projectRoot: materialized.projectRoot, paths, source };
}

function assertDiagnostic(t, result, fixture, paths) {
  const output = stripVTControlCharacters(`${result.stdout || ''}\n${result.stderr || ''}`);
  t.record('negative-build', { process: result.record, output });
  t.notEqual(result.record.exitCode, 0, 'An invalid property type must fail compilation');
  t.includes(output, '10505001');
  t.includes(output, fixture.expectedMessage);
  t.includes(output, '/entry/src/main/ets/pages/Index.ets:');
  const messages = output.split(/\r?\n/).filter(line => line.startsWith('Error Message:'));
  t.greater(messages.length, 0);
  for (const message of messages) {
    t.includes(message, fixture.expectedMessage, 'Unexpected compiler error in negative property case');
  }
  const match = output.match(/Index\.ets:(\d+):(\d+)/);
  t.ok(match, 'Property diagnostics must contain a source line and column');
  const sourceLines = fs.readFileSync(paths.dynamicSource, 'utf8').split('\n');
  const line = sourceLines[Number(match[1]) - 1];
  t.includes(line, 'StaticCounter(');
  t.includes(line, `${fixture.property}:`);
  t.greater(Number(match[2]), 0);
}

function assertGeneratedInterface(t, paths, startedAt) {
  for (const [name, filePath] of Object.entries({
    declaration: paths.staticDeclaration,
    bridge: paths.staticBridge
  })) {
    t.freshArtifact(`negative-fresh-${name}`, filePath, { notBeforeMs: startedAt, minimumBytes: 32 });
  }
  validateProjectionEvidence(t, paths);
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  t.match(declaration, /count\s*:\s*number/);
  t.match(declaration, /title\s*:\s*string/);
  t.match(declaration, /cardEnabled\s*:\s*boolean/);
}

async function runNegative(t, fixture) {
  const startedAt = Date.now();
  const tools = resolveToolchain(t.options.env || process.env);
  const versions = readToolchainVersions(tools);
  t.toolchain = publicToolchain(versions);
  const { projectRoot, paths } = inputProject(t, fixture, tools);
  const install = executeOhpmInstall(projectRoot, t.workspace, tools);
  t.record('negative-ohpm', install.record);
  t.equal(install.record.exitCode, 0);
  const result = executeHvigor(projectRoot, t.workspace, tools);
  assertGeneratedInterface(t, paths, startedAt);
  assertDiagnostic(t, result, fixture, paths);
  return {
    expectedRejection: true,
    stage: 'dynamic-caller-checker',
    code: '10505001',
    source: paths.dynamicSource,
    generatedDeclaration: paths.staticDeclaration,
    generatedBridge: paths.staticBridge,
    consumerProjection: paths.consumerProjection,
    compilerExitCode: result.record.exitCode
  };
}

const cases = fixtures.map(fixture => ({
  id: `negative-${fixture.id}`,
  group: 'compile',
  kind: 'negative-compile',
  run: t => runNegative(t, fixture)
}));

module.exports = { cases, fixtures, assertDiagnostic };
