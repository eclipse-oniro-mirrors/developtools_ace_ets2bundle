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
const {
  DIRECTION,
  StageFailure,
  executeCase
} = require('../static_calls_dynamic_basic/harness');
const {
  firstFailure,
  verifyHvigorResult
} = require('./compile.test');

function knownLog(moduleName) {
  return `generate Declaration
Fatal error F0014: Unresolved module name for path: ''
[entry/src/main/ets/pages/Index.ets/:4:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*
[entry/src/main/ets/pages/Index.ets/:4:37] Fatal error F0016: Can't find prefix for '${moduleName}' in /tmp/arktsconfig.json
`;
}

function failureFromLog(output) {
  try {
    verifyHvigorResult({ output, status: 0 });
  } catch (error) {
    return error;
  }
  throw new Error('diagnostic input unexpectedly passed');
}

function assertDiagnosticClassification() {
  const moduleName = 'dynamic_state_storage/src/main/ets/DynamicStateStorage';
  const known = failureFromLog(knownLog(moduleName));
  assert.strictEqual(known.category, 'existing');
  assert.strictEqual(known.code, 'F0014');
  assert.strictEqual(known.stage, 'GenerateDeclaration');

  const withUnknown = failureFromLog(knownLog(moduleName) +
    '[entry/src/main/ets/pages/Index.ets/:8:1] Semantic error ESE9999: unrelated new diagnostic\n');
  assert.strictEqual(withUnknown.category, 'implementation',
    'known F0014 plus an unknown diagnostic must not be classified as existing');

  const wrongModule = failureFromLog(knownLog('dynamic_component'));
  assert.strictEqual(wrongModule.category, 'implementation',
    'PR01 dynamic_component text must not match the dynamic_state_storage contract');

  const existing = new StageFailure('GenerateDeclaration', 'existing', 'F0014', 'known');
  const implementation = new StageFailure('repository-static-compile', 'implementation', 'ESE9999', 'new');
  const selected = firstFailure([existing, implementation], { diagnostics: [] });
  assert.strictEqual(selected, implementation, 'an implementation failure must take priority over existing');
  return {
    known: known.category,
    withUnknown: withUnknown.category,
    wrongModule: wrongModule.category,
    selectedFailure: selected.category
  };
}

async function runDiagnosticContractCase(options = {}) {
  return executeCase({
    name: 'pr09-diagnostic-classification-and-priority',
    group: 'unit',
    direction: DIRECTION,
    kind: 'specialized',
    coverage: 'exact dynamic_state_storage known sequence, unknown diagnostic rejection and implementation-first selection'
  }, async context => {
    const evidence = assertDiagnosticClassification();
    context.passStage('diagnostic.classification', evidence);
    context.passStage('failure.priority', { selected: evidence.selectedFailure });
    return {
      evidence,
      toolchain: [{
        name: 'ohos-typescript',
        path: require.resolve('typescript'),
        version: require('typescript/package.json').version
      }]
    };
  }, options);
}

module.exports = {
  assertDiagnosticClassification,
  knownLog,
  runDiagnosticContractCase
};
