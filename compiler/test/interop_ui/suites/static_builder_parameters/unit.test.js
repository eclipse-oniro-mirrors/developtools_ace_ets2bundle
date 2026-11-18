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
const os = require('os');
const path = require('path');
const {
  runCase,
  toolchainDescription
} = require('../monitor_declaration_signatures/test_support');
const {
  declarationCases,
  transformCases
} = require('./source_cases');
const {
  declarationExpectations,
  transformExpectations
} = require('./expected_cases');
const { assertDeclarationContract } = require('./assertions');

const DIRECTION = '12-to-11';
const SUITE_NAME = 'static_builder_parameters';
const ENVIRONMENT_CODES = new Set([
  'EACCES',
  'ENOENT',
  'ENOMEM',
  'ENOSPC',
  'ETIMEDOUT',
  'MODULE_NOT_FOUND',
  'INTEROP_LIB_MISSING',
  'INTEROP_LIB_LOAD_FAILED'
]);

function initialStats() {
  return {
    tempDirectoriesCreated: 0,
    tempDirectoriesRemoved: 0,
    programsCreated: 0,
    programReferencesReleased: 0,
    programsDisposed: 0,
    typeCheckersCreated: 0,
    typeCheckersReleased: 0,
    handleUIImportsTransforms: 0,
    transformationResultsDisposed: 0,
    afterDeclarationsCaptures: 0,
    declgenRuns: 0,
    declgenRepeatChecks: 0,
    declgenStateSnapshots: 0,
    declgenStateRestores: 0
  };
}

function expectationFor(testCase) {
  return testCase.mode === 'declgen' ?
    declarationExpectations[testCase.id] : transformExpectations[testCase.id];
}

function registryChecks() {
  const cases = [...declarationCases, ...transformCases];
  const ids = cases.map(testCase => testCase.id);
  const boundaries = cases.map(testCase => testCase.boundary);
  const fileNames = cases.map(testCase => testCase.fileName);
  assert.strictEqual(new Set(ids).size, ids.length, 'case ids must be unique');
  assert.strictEqual(new Set(boundaries).size, boundaries.length, 'coverage boundaries must be unique');
  assert.strictEqual(new Set(fileNames).size, fileNames.length, 'materialized file names must be unique');
  assert.strictEqual(new Set(cases.map(testCase => testCase.source)).size, cases.length,
    'every case must provide an independent source input');
  for (const testCase of cases) {
    const expectation = expectationFor(testCase);
    assert.ok(expectation, `${testCase.id} has no independently reviewed expectation`);
    assert.ok((expectation.required || []).length > 0, `${testCase.id} has no text assertions`);
    assert.ok(expectation.functions || expectation.structs || expectation.imports || expectation.directive,
      `${testCase.id} has no structural assertion`);
    assert.ok(!/Styles|Extend|onClick|hdc|UiDriver/.test(testCase.source),
      `${testCase.id} escapes the Builder parameter theme`);
  }
  assert.ok(declarationCases.length >= 9, 'real declgen matrix must retain its signature coverage');
  assert.ok(transformCases.length >= 6, 'direct transform matrix must retain its import controls');
  return {
    declarationCases: declarationCases.length,
    transformCases: transformCases.length,
    independentSources: cases.length
  };
}

function toolchainList() {
  const tools = toolchainDescription();
  return [
    { name: 'node', path: process.execPath, version: tools.node },
    { name: 'ohos-typescript', path: tools.typescriptPath, version: tools.typescript },
    { name: 'declgen', path: tools.declgenPath, version: tools.declgen }
  ];
}

function normalizeFailure(testCase, error) {
  const category = error.category === 'environment' || ENVIRONMENT_CODES.has(error.code) ?
    'environment' : 'implementation';
  return {
    stage: error.failureStage || error.stage || 'assertion',
    category,
    code: String(error.code || error.name || 'Error'),
    message: error.message || String(error),
    details: {
      classification: category === 'environment' ? 'environment' : 'regression',
      evidencePath: error.evidencePath,
      inputPath: error.inputPath,
      outputPath: error.outputPath
    }
  };
}

function resultRecord(testCase, outcome, tools) {
  const result = outcome.result || {};
  const error = outcome.error || {};
  const artifacts = [
    result.inputPath,
    result.outputPath,
    result.repeatOutputPath,
    error.inputPath,
    error.outputPath,
    error.repeatOutputPath,
    error.evidencePath
  ].filter((item, index, all) => item && all.indexOf(item) === index && fs.existsSync(item));
  return {
    name: `${SUITE_NAME}/${testCase.id}`,
    group: 'unit',
    direction: DIRECTION,
    kind: testCase.mode,
    status: outcome.status,
    failure: outcome.failure || null,
    coverage: testCase.boundary,
    stages: [{
      stage: outcome.failure?.stage || result.stage || 'registry',
      status: outcome.status
    }],
    artifacts,
    output: {
      inputPath: result.inputPath || error.inputPath,
      outputPath: result.outputPath || error.outputPath,
      repeatOutputPath: result.repeatOutputPath || error.repeatOutputPath,
      bytes: result.bytes || 0
    },
    toolchain: tools
  };
}

function executeDeclarationCase(testCase, context, tools) {
  let outcome;
  try {
    const result = runCase(testCase, context, actual => {
      const counts = assertDeclarationContract(actual, expectationFor(testCase), testCase.id);
      assert.ok(counts.functions + counts.structs > 0 || expectationFor(testCase).imports ||
        expectationFor(testCase).directive, `${testCase.id} did not execute a structural check`);
    });
    outcome = { status: 'passed', result };
  } catch (error) {
    outcome = {
      status: 'failed',
      error,
      failure: normalizeFailure(testCase, error)
    };
  }
  return resultRecord(testCase, outcome, tools);
}

function executeRegistryCase(tools) {
  const testCase = {
    id: 'source-registry-independence',
    boundary: 'all Builder cases have unique inputs, boundaries and structural expectations',
    mode: 'registry'
  };
  let outcome;
  try {
    const details = registryChecks();
    outcome = {
      status: 'passed',
      result: { stage: 'registry', bytes: details.independentSources }
    };
  } catch (error) {
    outcome = { status: 'failed', error, failure: normalizeFailure(testCase, error) };
  }
  return resultRecord(testCase, outcome, tools);
}

function checkIsolation(stats, selectedCases) {
  const errors = [];
  const comparisons = [
    ['temporary directories', stats.tempDirectoriesCreated, stats.tempDirectoriesRemoved],
    ['Program references', stats.programsCreated, stats.programReferencesReleased],
    ['TypeChecker references', stats.typeCheckersCreated, stats.typeCheckersReleased],
    ['transformation disposal', stats.handleUIImportsTransforms, stats.transformationResultsDisposed],
    ['declgen state restoration', stats.declgenStateSnapshots, stats.declgenStateRestores]
  ];
  for (const [label, created, released] of comparisons) {
    if (created !== released) {
      errors.push(`${label}: ${created} != ${released}`);
    }
  }
  const declgenCount = selectedCases.filter(testCase => testCase.mode === 'declgen').length;
  const directCount = selectedCases.filter(testCase => testCase.mode === 'direct').length;
  if (stats.declgenRuns !== declgenCount * 2 || stats.declgenRepeatChecks !== declgenCount) {
    errors.push('each real declgen case must run twice and compare repeatable output');
  }
  if (stats.handleUIImportsTransforms !== directCount) {
    errors.push('each direct transform case must execute exactly one transformer');
  }
  if (stats.afterDeclarationsCaptures !== 0) {
    errors.push('this suite must use real declgen rather than a synthetic afterDeclarations substitute');
  }
  return errors;
}

function infrastructureFailure(message, index, tools) {
  const testCase = {
    id: `__isolation__${index}`,
    boundary: 'toolchain and mutable state isolation',
    mode: 'infrastructure'
  };
  const error = new Error(message);
  error.stage = 'isolation';
  error.code = 'ISOLATION_FAILURE';
  return resultRecord(testCase, {
    status: 'failed',
    error,
    failure: normalizeFailure(testCase, error)
  }, tools);
}

function summarize(cases, stats, artifactRoot) {
  return {
    suite: SUITE_NAME,
    direction: DIRECTION,
    total: cases.length,
    passed: cases.filter(testCase => testCase.status === 'passed').length,
    failed: cases.filter(testCase => testCase.status === 'failed').length,
    declarationCases: cases.filter(testCase => testCase.kind === 'declgen').length,
    transformCases: cases.filter(testCase => testCase.kind === 'direct').length,
    stats,
    generated: cases.map(testCase => testCase.output).filter(item => item.outputPath),
    artifactRoot
  };
}

function runUnitDetailed(options = {}) {
  const parent = options.parent || options.env?.INTEROP_UI_WORK_ROOT || os.tmpdir();
  fs.mkdirSync(parent, { recursive: true });
  const artifactRoot = fs.mkdtempSync(path.join(parent, 'interop-pr08-builder-unit-'));
  const context = { artifactRoot, stats: initialStats() };
  const tools = toolchainList();
  const selectedCases = [...declarationCases, ...transformCases];
  const cases = [executeRegistryCase(tools)];
  for (const testCase of selectedCases) {
    cases.push(executeDeclarationCase(testCase, context, tools));
  }
  for (const [index, error] of checkIsolation(context.stats, selectedCases).entries()) {
    cases.push(infrastructureFailure(error, index, tools));
  }
  const summary = summarize(cases, context.stats, artifactRoot);
  const summaryPath = path.join(artifactRoot, 'summary.json');
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  const preserve = options.keepArtifacts || options.keep ||
    options.env?.INTEROP_UI_KEEP_TEMP === '1' || summary.failed > 0;
  if (!preserve) {
    fs.rmSync(artifactRoot, { recursive: true, force: true });
  }
  return { cases, summary, artifactRoot, summaryPath, preserve };
}

function runUnitCases(options = {}) {
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  return runUnitDetailed(options).cases;
}

module.exports = {
  DIRECTION,
  SUITE_NAME,
  checkIsolation,
  executeDeclarationCase,
  initialStats,
  normalizeFailure,
  registryChecks,
  runUnitCases,
  runUnitDetailed
};
