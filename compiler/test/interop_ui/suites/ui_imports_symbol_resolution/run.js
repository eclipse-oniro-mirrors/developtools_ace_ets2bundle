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
const assert = require('assert');
const {
  runTransformCase,
  toolchainFacts,
  COMPILER_ROOT
} = require('./transform_adapter');
const { cases } = require('./source_cases');
const { expectationFor, expectationIds } = require('./expected_cases');
const { verifyCommonExpectations } = require('./ast_contract');
const { runIsolatedDeclgenSmoke, smokeCases } = require('./declgen_smoke');

const SUITE_NAME = 'ui_imports_symbol_resolution';
const RESULT_PREFIX = 'INTEROP_UI_SUITE_RESULT=';
const DIRECTION = '12-to-11';
const EXISTING_FAILURES = {
  'named-import-alias': {
    stage: 'HandleUIImports.createCustomTransformer',
    code: 'SPURIOUS_NAMED_ALIAS_UI_IMPORT'
  },
  'namespace-qualified-symbols': {
    stage: 'HandleUIImports.createCustomTransformer',
    code: 'SPURIOUS_NAMESPACE_UI_IMPORT'
  },
  'declgen-after-declaration-v2': {
    stage: 'DeclfileProductor.runDeclgen.after-declaration',
    code: 'DECLGEN_REUSABLE_V2_DROPPED'
  }
};

function validateCaseRegistry() {
  const transformIds = cases.map(item => item.id).sort();
  const expectedIds = expectationIds();
  if (JSON.stringify(transformIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`Source/expectation mismatch: ${transformIds.join(',')} != ${expectedIds.join(',')}`);
  }
  const allIds = [...transformIds, ...smokeCases.map(item => item.id)];
  if (new Set(allIds).size !== allIds.length) {
    throw new Error('Every transform and declgen smoke case must have a unique id');
  }
  [...cases, ...smokeCases].forEach(item => {
    if (!item.branch) {
      throw new Error(`${item.id}: the added control-flow branch must be documented`);
    }
  });
  smokeCases.forEach(item => {
    if (typeof item.verify !== 'function') {
      throw new Error(`${item.id}: smoke assertions are required`);
    }
  });
  if (allIds.length < 12) {
    throw new Error(`At least twelve independent cases are required; registered ${allIds.length}`);
  }
}

function executeTransformCase(caseDefinition) {
  const expectation = expectationFor(caseDefinition);
  return runTransformCase(caseDefinition, context => {
    verifyCommonExpectations(context, expectation);
    return expectation.verify(context);
  });
}

function failureFor(caseDefinition, error) {
  const known = EXISTING_FAILURES[caseDefinition.name];
  const isExistingAssertion = known && error.name === 'AssertionError';
  return {
    stage: isExistingAssertion ? known.stage : caseDefinition.kind,
    category: isExistingAssertion ? 'existing' : 'test',
    code: isExistingAssertion ? known.code : error.name === 'AssertionError'
      ? 'UNEXPECTED_ASSERTION'
      : 'TEST_EXECUTION_ERROR',
    message: error.message,
    stack: error.stack,
    transformedOutput: error.transformedOutput || null
  };
}

function executeCase(caseDefinition) {
  const startedAt = Date.now();
  const base = {
    name: caseDefinition.name,
    group: caseDefinition.group,
    direction: caseDefinition.direction,
    kind: caseDefinition.kind
  };
  try {
    const evidence = caseDefinition.kind === 'declgen'
      ? runIsolatedDeclgenSmoke(caseDefinition.definition)
      : executeTransformCase(caseDefinition.definition);
    return {
      ...base,
      status: 'passed',
      durationMs: Date.now() - startedAt,
      evidence
    };
  } catch (error) {
    return {
      ...base,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      failure: failureFor(caseDefinition, error)
    };
  }
}

function registeredCases() {
  return [
    ...cases.map(definition => ({
      name: definition.id,
      group: 'unit',
      direction: DIRECTION,
      kind: 'transform',
      definition
    })),
    ...smokeCases.map(definition => ({
      name: definition.id,
      group: 'compile',
      direction: DIRECTION,
      kind: 'declgen',
      definition
    }))
  ];
}

function validateResultContract(results) {
  assert.ok(Array.isArray(results), `${SUITE_NAME}.run must return an array`);
  const requiredFields = ['name', 'group', 'direction', 'kind', 'status'];
  const names = new Set();
  results.forEach(result => {
    requiredFields.forEach(field => {
      assert.strictEqual(
        typeof result[field],
        'string',
        `${result.name || '<unknown>'}: ${field} must be a non-empty string`
      );
      assert.ok(result[field].length > 0, `${result.name}: empty ${field}`);
    });
    assert.ok(['passed', 'failed'].includes(result.status));
    assert.strictEqual(result.direction, DIRECTION, `${result.name}: unexpected direction`);
    assert.ok(['unit', 'compile'].includes(result.group), `${result.name}: unexpected group`);
    assert.strictEqual(
      result.kind,
      result.group === 'unit' ? 'transform' : 'declgen',
      `${result.name}: group/kind mismatch`
    );
    assert.strictEqual(names.has(result.name), false, `Duplicate result name ${result.name}`);
    names.add(result.name);
    if (result.status === 'passed') {
      assert.strictEqual(result.failure, undefined, `${result.name}: passed case has failure data`);
      return;
    }
    assert.ok(result.failure, `${result.name}: failed case needs failure data`);
    ['stage', 'category', 'code', 'message'].forEach(field => {
      assert.strictEqual(
        typeof result.failure[field],
        'string',
        `${result.name}: failure.${field} must be a string`
      );
      assert.ok(result.failure[field].length > 0, `${result.name}: empty failure.${field}`);
    });
    assert.ok(
      ['existing', 'test'].includes(result.failure.category),
      `${result.name}: unsupported failure category`
    );
    if (result.failure.category === 'existing') {
      assert.ok(EXISTING_FAILURES[result.name], `${result.name}: unregistered existing failure`);
      assert.strictEqual(result.failure.code, EXISTING_FAILURES[result.name].code);
    }
  });
  return results;
}

function run(options = {}) {
  validateCaseRegistry();
  const results = registeredCases()
    .filter(item => !options.group || item.group === options.group)
    .filter(item => !options.direction || item.direction === options.direction)
    .filter(item => !options.caseId || item.name === options.caseId)
    .map(executeCase);
  return validateResultContract(results);
}

function declgenToolchain() {
  const declgenRoot = path.join(COMPILER_ROOT, 'node_modules', 'declgen');
  const declgenPackage = require(path.join(declgenRoot, 'package.json'));
  return {
    declgen: `${declgenPackage.name}@${declgenPackage.version}`,
    declgenPath: declgenRoot,
    entry: 'DeclfileProductor.getInstance().runDeclgen(params)',
    uiStage: 'ui-imports@after-declaration',
    isolation: 'fresh-process-per-case'
  };
}

function printCaseResult(result, logger) {
  if (result.status === 'passed') {
    logger.log(`PASS ${result.group}/${result.direction} ${result.kind} ${result.name}`);
    logger.log(`  branch: ${result.evidence.branch}`);
    logger.log(`  evidence: ${JSON.stringify(result.evidence)}`);
    return;
  }
  const failure = result.failure;
  logger.error(`FAIL ${result.group}/${result.direction} ${result.kind} ${result.name}`);
  logger.error(`  failure: ${JSON.stringify({
    stage: failure.stage,
    category: failure.category,
    code: failure.code,
    message: failure.message
  })}`);
  if (failure.transformedOutput) {
    logger.error('  transformed output begins');
    logger.error(failure.transformedOutput);
    logger.error('  transformed output ends');
  }
  if (failure.stack) {
    logger.error(failure.stack);
  }
}

function summarize(results) {
  const failedResults = results.filter(result => result.status === 'failed');
  return {
    suite: SUITE_NAME,
    total: results.length,
    effective: results.length,
    passed: results.length - failedResults.length,
    failed: failedResults.length,
    existingFailures: failedResults.filter(result => result.failure.category === 'existing').length,
    transformCases: results.filter(result => result.kind === 'transform').length,
    declgenSmokeCases: results.filter(result => result.kind === 'declgen').length,
    zeroCases: results.length === 0,
    toolchain: {
      ...toolchainFacts(),
      ...declgenToolchain()
    },
    results
  };
}

function parseOptions(argv) {
  const options = {};
  const flags = new Map([
    ['--case', 'caseId'],
    ['--group', 'group'],
    ['--direction', 'direction']
  ]);
  flags.forEach((key, flag) => {
    const index = argv.indexOf(flag);
    if (index !== -1) {
      if (!argv[index + 1]) {
        throw new Error(`${flag} requires a value`);
      }
      options[key] = argv[index + 1];
    }
  });
  return options;
}

function main(argv = process.argv.slice(2)) {
  let results;
  try {
    results = run(parseOptions(argv));
  } catch (error) {
    console.error(`${SUITE_NAME}: runner setup failed: ${error.stack || error.message}`);
    process.exitCode = 1;
    return null;
  }
  results.forEach(result => printCaseResult(result, console));
  const summary = summarize(results);
  console.log(
    `${SUITE_NAME}: effective=${summary.effective} passed=${summary.passed} ` +
    `failed=${summary.failed} existingFailures=${summary.existingFailures} ` +
    `transform=${summary.transformCases} declgen=${summary.declgenSmokeCases} zeroCases=${summary.zeroCases}`
  );
  results.filter(result => result.failure && result.failure.category === 'existing')
    .forEach(result => console.error(
      `EXISTING_FAILURE ${result.name} ${result.failure.code} ${result.failure.stage}: ` +
      result.failure.message.split('\n')[0]
    ));
  console.log(RESULT_PREFIX + JSON.stringify(summary));
  process.exitCode = summary.failed === 0 && summary.effective > 0 ? 0 : 1;
  return summary;
}

if (require.main === module) {
  main();
}

module.exports = {
  name: SUITE_NAME,
  RESULT_PREFIX,
  SUITE_NAME,
  executeCase,
  main,
  registeredCases,
  run,
  summarize,
  validateCaseRegistry,
  validateResultContract
};
