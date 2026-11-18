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
const { assertDeclarationContract } = require('./ast_assertions');
const {
  assertGlobalStateRestored,
  restoreGlobalState,
  seedGlobalStateForIsolation,
  withDeclgenCase
} = require('./declgen_smoke');
const {
  declgenExpectations,
  declgenKnownFailures,
  expectedCases,
  knownFailures
} = require('./expected_cases');
const {
  assertNoActiveResources,
  resourceStats,
  withTransformedCase
} = require('./program_harness');
const { declgenCases, sourceCases } = require('./source_cases');

const DIRECTION = '12-to-11';
const TOOLCHAIN = [
  { name: 'ohos-typescript', path: require.resolve('typescript'), version: require('typescript/package.json').version },
  { name: '@panda/declgen', path: require.resolve('declgen'), version: require('declgen/package.json').version }
];

function assertContract(sourceFile, expected, options) {
  try {
    assertDeclarationContract(sourceFile, expected, options);
  } catch (error) {
    error.contractAssertion = true;
    throw error;
  }
}

function cleanupReport(context) {
  const report = {
    artifactsRemoved: context.artifacts.every(filePath => !fs.existsSync(filePath)),
    temporaryDirectoriesRemoved: context.temporaryDirectories.every(directory => !fs.existsSync(directory)),
    activePrograms: resourceStats.activePrograms,
    activeTransformations: resourceStats.activeTransformations,
    activeTemporaryDirectories: resourceStats.activeTemporaryDirectories
  };
  report.ok = report.artifactsRemoved && report.temporaryDirectoriesRemoved &&
    report.activePrograms === 0 && report.activeTransformations === 0 && report.activeTemporaryDirectories === 0;
  return report;
}

function failureFrom(error, definition) {
  const existing = error.contractAssertion ? definition.existing : undefined;
  const classified = existing || {
    stage: error.stage || definition.stage,
    category: error.category || 'implementation',
    code: error.code || error.name || 'Error'
  };
  return {
    ...classified,
    message: error.message || String(error),
    details: error.details || {}
  };
}

async function executeCase(definition, body) {
  const context = { artifacts: [], temporaryDirectories: [] };
  let details = {};
  let error;
  try {
    details = await body(context) || {};
  } catch (caught) {
    error = caught;
  }
  const cleanup = cleanupReport(context);
  if (!cleanup.ok) {
    error = Object.assign(new Error(`resource cleanup failed: ${JSON.stringify(cleanup)}`), {
      stage: 'resource.cleanup', code: 'RESOURCE_LEAK', category: 'implementation'
    });
  }
  const result = {
    name: definition.name,
    group: definition.group,
    direction: DIRECTION,
    kind: definition.kind,
    coverage: definition.coverage,
    artifacts: context.artifacts,
    cleanup,
    toolchain: TOOLCHAIN,
    ...details
  };
  if (!error) {
    return { ...result, status: 'passed', stages: [{ stage: definition.stage, status: 'passed' }] };
  }
  const failure = failureFrom(error, definition);
  return {
    ...result,
    status: 'failed',
    failure,
    stages: [{ stage: failure.stage, status: 'failed', code: failure.code, category: failure.category }]
  };
}

function runTransformCase(testCase) {
  return executeCase({
    name: testCase.id,
    group: 'unit',
    kind: 'specialized',
    stage: 'HandleUIImports.transform',
    coverage: 'TypeChecker and HandleUIImports declaration AST contract',
    existing: knownFailures[testCase.knownFailureId]
  }, context => withTransformedCase(testCase, result => {
    context.temporaryDirectories.push(result.temporaryDirectory);
    assertContract(result.sourceFile, expectedCases[testCase.id]);
    return { inputResolution: result.inputResolution };
  }));
}

function recordDeclgenEvidence(context, evidence) {
  context.temporaryDirectories.push(evidence.temporaryDirectory);
  context.artifacts.push(
    evidence.sourcePath,
    evidence.consumerPath,
    ...evidence.generatedFiles,
    ...evidence.generatedCacheFiles
  );
  return { declarationConsumer: evidence.consumerEvidence };
}

function runDeclgenCase(testCase) {
  return executeCase({
    name: testCase.id,
    group: 'compile',
    kind: 'declaration-consumer',
    stage: 'declgen.consumer',
    coverage: 'real declgen UI stage plus consumer declaration resolution and type-check only',
    existing: declgenKnownFailures[testCase.knownFailureId]
  }, context => withDeclgenCase(testCase, evidence => {
    const details = recordDeclgenEvidence(context, evidence);
    assert.strictEqual(evidence.consumerEvidence.propertyType, testCase.consumerType);
    assert.strictEqual(evidence.generatedFiles.length, 1);
    assertContract(evidence.declarationSourceFile, declgenExpectations[testCase.id], { declaration: true });
    return details;
  }));
}

function verifyMatrix() {
  const sourceIds = sourceCases.map(testCase => testCase.id);
  const declgenIds = declgenCases.map(testCase => testCase.id);
  assert.strictEqual(new Set(sourceIds).size, sourceIds.length);
  assert.deepStrictEqual(Object.keys(expectedCases).sort(), [...sourceIds].sort());
  assert.deepStrictEqual(Object.keys(declgenExpectations).sort(), [...declgenIds].sort());
  for (const testCase of [...sourceCases, ...declgenCases]) {
    const registry = testCase.id.startsWith('declgen-') ? declgenKnownFailures : knownFailures;
    if (testCase.knownFailureId) {
      const failure = registry[testCase.knownFailureId];
      assert.strictEqual(failure.category, 'existing');
      assert.strictEqual(failure.code, testCase.knownFailureId);
      assert.ok(failure.stage);
      assert.deepStrictEqual(Object.keys(failure).sort(), ['category', 'code', 'stage']);
    }
  }
}

function repeatTransform(context) {
  const outputs = [];
  for (let iteration = 0; iteration < 2; iteration += 1) {
    withTransformedCase(sourceCases[0], result => {
      context.temporaryDirectories.push(result.temporaryDirectory);
      assertContract(result.sourceFile, expectedCases[sourceCases[0].id]);
      outputs.push(result.printedText);
    });
  }
  assert.strictEqual(outputs[0], outputs[1]);
}

function repeatDeclgen(context) {
  const { original, seeded } = seedGlobalStateForIsolation();
  const outputs = [];
  let failure;
  try {
    for (let iteration = 0; iteration < 2; iteration += 1) {
      withDeclgenCase(declgenCases[0], evidence => {
        const details = recordDeclgenEvidence(context, evidence);
        assertContract(evidence.declarationSourceFile, declgenExpectations[declgenCases[0].id], { declaration: true });
        outputs.push({ text: evidence.declarationText, path: evidence.declarationPath, details });
      });
      assertGlobalStateRestored(seeded);
    }
    assert.strictEqual(outputs[0].text, outputs[1].text);
    assert.notStrictEqual(outputs[0].path, outputs[1].path);
  } catch (error) {
    failure = error;
  }
  restoreGlobalState(original);
  assertGlobalStateRestored(original);
  if (failure) {
    throw failure;
  }
}

function verifyIsolation(context) {
  repeatTransform(context);
  repeatDeclgen(context);
  assertNoActiveResources();
}

async function runUnitCases() {
  const results = [await executeCase({
    name: 'contract-matrix', group: 'unit', kind: 'specialized', stage: 'contract.matrix',
    coverage: 'source, expectation and failure metadata completeness'
  }, verifyMatrix)];
  for (const testCase of sourceCases) {
    results.push(await runTransformCase(testCase));
  }
  results.push(await executeCase({
    name: 'repeat-and-global-state-isolation', group: 'unit', kind: 'specialized', stage: 'resource.isolation',
    coverage: 'repeat transform and declgen; Logger, logMessages, FileManager and DeclfileProductor restoration'
  }, verifyIsolation));
  return results;
}

async function runDeclgenCases() {
  const results = [];
  for (const testCase of declgenCases) {
    results.push(await runDeclgenCase(testCase));
  }
  return results;
}

module.exports = {
  DIRECTION,
  runDeclgenCases,
  runUnitCases
};
