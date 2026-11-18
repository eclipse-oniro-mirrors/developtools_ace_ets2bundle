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
const path = require('path');
const { executeCase } = require('../static_calls_dynamic_basic/harness');
const { AssertionContext, parseArgs, writeJson } = require('../dynamic_calls_static_basic/harness');
const name = 'static_parent_child_parameters';
const direction = '11-to-12';

function selectedCases(options) {
  const registry = [...require('./unit.test').cases, ...require('./compile.test').cases];
  const selected = registry.filter(testCase =>
    (options.group === 'all' || testCase.group === options.group) &&
    (!options.caseId || options.caseId === testCase.id));
  assert.ok(selected.length > 0, `NO_CASES ${name} group=${options.group}`);
  assert.strictEqual(new Set(selected.map(testCase => testCase.id)).size, selected.length);
  return selected;
}

async function runOne(testCase, options) {
  const definition = {
    name: `${name}/${testCase.id}`,
    group: testCase.group,
    direction,
    kind: testCase.kind || (testCase.group === 'unit' ? 'specialized' : 'full-chain')
  };
  return executeCase(definition, async context => {
    const t = new AssertionContext(testCase, context.workspace.root, options);
    const returned = await testCase.run(t);
    assert.ok(t.assertions > 0, `ZERO_ASSERTIONS ${testCase.id}`);
    context.passStage(testCase.group === 'unit' ? 'repository-transform' : 'generate-consume-abc');
    return { assertions: t.assertions, evidence: t.evidence, returned, toolchain: t.toolchain };
  }, { ...options, parent: options.output || options.parent, keep: true });
}

async function run(options = {}) {
  if (options.direction && options.direction !== direction) {
    return [];
  }
  const selectedOptions = { ...options, group: options.group || 'unit' };
  const results = [];
  for (const testCase of selectedCases(selectedOptions)) {
    results.push(await runOne(testCase, selectedOptions));
  }
  return results;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(`Usage: node ${name}/run.js --group unit|compile|all --direction ${direction}`);
    return 0;
  }
  const results = await run(options);
  for (const result of results) {
    const failure = result.failure;
    console.log(`${result.status.toUpperCase()} ${name}/${result.name}`);
    if (failure) {
      console.error(JSON.stringify(failure));
    }
  }
  const report = {
    suite: name,
    group: options.group,
    direction,
    total: results.length,
    passed: results.filter(result => result.status === 'passed').length,
    failed: results.filter(result => result.status === 'failed').length,
    assertions: results.reduce((sum, result) => sum + (result.assertions || 0), 0),
    cases: results
  };
  if (options.output) {
    writeJson(path.join(options.output, `${name}-${options.group}.json`), report);
  }
  console.log(`SUMMARY ${JSON.stringify({ ...report, cases: undefined })}`);
  return report.failed > 0 || report.total === 0 ? 1 : 0;
}

if (require.main === module) {
  main().then(code => {
    process.exitCode = code;
  }).catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { name, direction, main, run };
