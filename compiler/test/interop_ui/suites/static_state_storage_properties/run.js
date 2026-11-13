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

const { DIRECTION } = require('../static_calls_dynamic_basic/harness');
const { runFullChain } = require('./compile.test');
const { runDeclgenCases, runUnitCases } = require('./state_harness');

const name = 'static_state_storage_properties';

async function run(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  if (group === 'unit') {
    return runUnitCases(options);
  }
  if (group === 'compile') {
    const results = await runDeclgenCases(options);
    results.push(await runFullChain(options));
    return results;
  }
  throw new Error(`${name} does not support group ${group}`);
}

function parseArguments(args) {
  const options = { group: 'unit', direction: undefined, env: process.env };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!['--group', '--direction'].includes(argument)) {
      throw new Error(`invalid argument: ${argument}`);
    }
    if (index + 1 >= args.length || args[index + 1].startsWith('--')) {
      throw new Error(`${argument} requires a value`);
    }
    const value = args[index + 1];
    index += 1;
    if (argument === '--group') {
      if (!['unit', 'compile'].includes(value)) {
        throw new Error(`${name} supports only unit and compile groups`);
      }
      options.group = value;
    } else {
      if (!['12-to-11', '11-to-12'].includes(value)) {
        throw new Error(`invalid direction: ${value}`);
      }
      options.direction = value;
    }
  }
  return options;
}

function printResult(testCase) {
  const prefix = `${testCase.group}/${testCase.direction}/${testCase.name}`;
  if (testCase.status === 'passed') {
    console.log(`PASS ${prefix}`);
    return;
  }
  const failure = testCase.failure;
  const category = failure.category === 'existing' ? 'EXISTING' : 'FAIL';
  console.error(`${category} ${prefix} stage=${failure.stage} ` +
    `category=${failure.category} code=${failure.code}`);
  console.error(failure.message);
  if (failure.details?.classification) {
    console.error(`classification: ${failure.details.classification}`);
  }
}

function printSummary(cases, options) {
  const failed = cases.filter(testCase => testCase.status === 'failed');
  const existing = failed.filter(testCase => testCase.failure.category === 'existing');
  const kinds = {};
  for (const testCase of cases) {
    kinds[testCase.kind] = (kinds[testCase.kind] || 0) + 1;
  }
  console.log(`SUITE ${name} group=${options.group} direction=${options.direction || 'all'} ` +
    `effective=${cases.length} passed=${cases.length - failed.length} failed=${failed.length} ` +
    `existing=${existing.length} kinds=${JSON.stringify(kinds)}`);
}

async function directMain(args = process.argv.slice(2)) {
  const options = parseArguments(args);
  const cases = await run(options);
  cases.forEach(printResult);
  printSummary(cases, options);
  if (cases.length === 0) {
    console.error('NO_CASES: selection did not match this suite');
    return 1;
  }
  return cases.some(testCase => testCase.status === 'failed') ? 1 : 0;
}

if (require.main === module) {
  directMain().then(exitCode => {
    process.exitCode = exitCode;
  }).catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  name,
  direction: DIRECTION,
  directMain,
  parseArguments,
  run
};
