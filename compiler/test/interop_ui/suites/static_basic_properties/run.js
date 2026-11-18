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
const { runAdapterCases } = require('./adapter.test');
const { runFullChainCases } = require('./full_chain_runner');
const { runUnitCases } = require('./unit.test');

const name = 'static_basic_properties';

async function run(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  if (group === 'unit') {
    const results = await runUnitCases(options);
    results.push(...await runAdapterCases(options));
    return results;
  }
  if (group === 'compile') {
    return runFullChainCases(options);
  }
  throw new Error(`${name} does not support group ${group}`);
}

function parseArguments(args) {
  const options = { group: 'unit', direction: undefined, env: process.env };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!['--group', '--direction'].includes(argument) || index + 1 >= args.length) {
      throw new Error(`invalid argument: ${argument}`);
    }
    const value = args[index + 1];
    index += 1;
    if (argument === '--group') {
      if (!['unit', 'compile'].includes(value)) {
        throw new Error(`unsupported group: ${value}`);
      }
      options.group = value;
    } else {
      if (!['12-to-11', '11-to-12'].includes(value)) {
        throw new Error(`unsupported direction: ${value}`);
      }
      options.direction = value;
    }
  }
  return options;
}

function printResult(testCase) {
  if (testCase.status === 'passed') {
    console.log(`PASS ${testCase.group}/${testCase.direction}/${testCase.name}`);
    return;
  }
  const failure = testCase.failure;
  console.error(`FAIL ${testCase.group}/${testCase.direction}/${testCase.name} ` +
    `stage=${failure.stage} category=${failure.category} code=${failure.code}`);
  console.error(failure.message);
}

async function directMain(args = process.argv.slice(2)) {
  const options = parseArguments(args);
  const cases = await run(options);
  cases.forEach(printResult);
  const failed = cases.filter(testCase => testCase.status === 'failed');
  const existing = failed.filter(testCase => testCase.failure.category === 'existing').length;
  const environment = failed.filter(testCase => testCase.failure.category === 'environment').length;
  const implementation = failed.length - existing - environment;
  console.log(`SUITE ${name} group=${options.group} direction=${options.direction || 'all'} ` +
    `effective=${cases.length} passed=${cases.length - failed.length} failed=${failed.length} ` +
    `implementation=${implementation} existing=${existing} environment=${environment}`);
  if (cases.length === 0) {
    console.error('NO_CASES: selection did not match this suite');
    return 1;
  }
  return failed.length > 0 ? 1 : 0;
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
