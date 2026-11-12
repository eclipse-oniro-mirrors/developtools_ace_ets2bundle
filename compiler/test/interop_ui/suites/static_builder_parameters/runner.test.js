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

const path = require('path');
const {
  assert,
  executeCase,
  runProcess
} = require('../static_calls_dynamic_basic/harness');
const { caseLines, normalizeOptions } = require('./options');
const { classifyHvigorDiagnostics } = require('./compile.test');

const DIRECTION = '12-to-11';
const SUITE_NAME = 'static_builder_parameters';

function runnerDefinition(id, boundary) {
  return {
    name: `${SUITE_NAME}/${id}`,
    group: 'unit',
    direction: DIRECTION,
    kind: 'runner',
    coverage: boundary
  };
}

function nodeToolchain() {
  return [{
    name: 'node',
    path: process.execPath,
    version: process.version
  }];
}
async function runKeepOptionRegression(options) {
  return executeCase(runnerDefinition(
    'runner-keep-artifacts-mapping',
    'keepArtifacts is mapped to keep for unit and compile workspaces'
  ), async context => {
    const fromFlag = normalizeOptions({ keepArtifacts: true });
    const fromProtocol = normalizeOptions({ keep: true });
    const fromDefault = normalizeOptions({});
    const fromFalse = normalizeOptions({ keepArtifacts: false });
    assert.strictEqual(fromFlag.keep, true);
    assert.strictEqual(fromFlag.keepArtifacts, true);
    assert.strictEqual(fromProtocol.keep, true);
    assert.strictEqual(fromDefault.keep, false);
    assert.strictEqual(fromFalse.keep, false);
    assert.strictEqual(fromFlag.direction, undefined);
    const selected = normalizeOptions({
      group: 'compile',
      direction: DIRECTION,
      keepArtifacts: true,
      env: { marker: 'isolated' }
    });
    assert.strictEqual(selected.group, 'compile');
    assert.strictEqual(selected.direction, DIRECTION);
    assert.strictEqual(selected.keep, true);
    assert.deepStrictEqual(selected.env, { marker: 'isolated' });
    context.passStage('normalizeOptions', {
      keepArtifacts: fromFlag.keep,
      keep: fromProtocol.keep,
      default: fromDefault.keep
    });
    return { toolchain: nodeToolchain() };
  }, options);
}
async function runListRegression(options) {
  return executeCase(runnerDefinition(
    'runner-list-includes-registry',
    '--list includes source-registry-independence once and every registered case'
  ), async context => {
    const result = runProcess(process.execPath, [path.join(__dirname, 'run.js'), '--list']);
    assert.strictEqual(result.status, 0, result.output);
    const expected = caseLines();
    const actual = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    assert.strictEqual(actual.length, expected.length);
    assert.deepStrictEqual(actual, expected);
    const names = actual.map(line => line.split('\t')[0]);
    assert.strictEqual(new Set(names).size, names.length);
    assert.strictEqual(names.filter(name =>
      name === `${SUITE_NAME}/source-registry-independence`).length, 1);
    context.passStage('list', {
      entries: actual.length,
      registryEntries: 1,
      uniqueNames: new Set(names).size
    });
    return { toolchain: nodeToolchain() };
  }, options);
}

function baselineLog(f0016Location, additional = []) {
  return [
    'generate Declaration',
    `Fatal error F0014: Unresolved module name for path: ''`,
    `[entry/src/main/ets/pages/Index.ets/:3:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*`,
    `[entry/src/main/ets/pages/Index.ets/:${f0016Location}] Fatal error F0016: ` +
      `Can't find prefix for 'dynamic_component' in /tmp/arktsconfig.json`,
    ...additional
  ].join('\n');
}

function capturedFailure(body) {
  try {
    body();
  } catch (error) {
    return error;
  }
  assert.fail('expected a StageFailure');
  return undefined;
}
async function runDiagnosticRegression(id, boundary, options, body) {
  return executeCase(runnerDefinition(id, boundary), async context => {
    body();
    context.passStage('diagnostic-contract');
    return { toolchain: nodeToolchain() };
  }, options);
}
async function runNamedModelDiagnostic(options) {
  return runDiagnosticRegression(
    'diagnostic-named-model-whitelist',
    'ESE0371 NamedSlotModel is accepted only at its declared source location',
    options,
    () => {
      const result = classifyHvigorDiagnostics({
        output: baselineLog('3:47', [
          `[entry/src/main/ets/pages/Index.ets/:14:22] Semantic error ESE0371: ` +
            `Cannot find type 'NamedSlotModel'.`
        ])
      }, { id: 'named-local-builder-references' });
      assert.deepStrictEqual(result.existing.map(item => item.code),
        ['F0014', 'ESE0360', 'F0016', 'ESE0371']);
      assert.strictEqual(result.existing[3].issue, 'PR08-NAMED-MODEL-DECLARATION');
      assert.strictEqual(result.existing[3].category, 'existing');
      const wrongLocation = capturedFailure(() => classifyHvigorDiagnostics({
        output: baselineLog('3:47', [
          `[entry/src/main/ets/pages/Index.ets/:14:23] Semantic error ESE0371: ` +
            `Cannot find type 'NamedSlotModel'.`
        ])
      }, { id: 'named-local-builder-references' }));
      assert.strictEqual(wrongLocation.category, 'implementation');
      assert.strictEqual(wrongLocation.code, 'ESE0371');
    }
  );
}
async function runLocalReferenceDiagnostic(options) {
  return runDiagnosticRegression(
    'diagnostic-local-reference-whitelist',
    'ESE0143 ExplicitSlotCard has an independent symbol and location contract',
    options,
    () => {
      const result = classifyHvigorDiagnostics({
        output: baselineLog('3:34', [
          '[entry/src/main/ets/pages/Index.ets/:15:5] Semantic error ESE0143: ' +
            'Unresolved reference ExplicitSlotCard'
        ])
      }, { id: 'local-builder-call-position' });
      assert.strictEqual(result.existing.length, 4);
      assert.strictEqual(result.existing[3].issue, 'PR08-LOCAL-BUILDER-DECLARATION');
      assert.strictEqual(result.existing[3].category, 'existing');
    }
  );
}
async function runBackendDiagnosticRejection(options) {
  return runDiagnosticRegression(
    'diagnostic-backend-is-implementation-failure',
    'backend diagnostics are never converted into existing successes',
    options,
    () => {
      const failure = capturedFailure(() => classifyHvigorDiagnostics({
        output: `${baselineLog('8:8')}\n[ERROR] ERROR Code: 11410001 Compile abc files failed.`
      }, { id: 'global-builder-calls' }));
      assert.strictEqual(failure.category, 'implementation');
      assert.strictEqual(failure.code, 'DRIVER_ERROR');
      assert.strictEqual(failure.details.classification, 'unexpected-backend-diagnostic');
    }
  );
}
async function runRunnerCases(options = {}) {
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  return [
    await runKeepOptionRegression(options),
    await runListRegression(options),
    await runNamedModelDiagnostic(options),
    await runLocalReferenceDiagnostic(options),
    await runBackendDiagnosticRejection(options)
  ];
}

module.exports = {
  runKeepOptionRegression,
  runListRegression,
  runRunnerCases
};
