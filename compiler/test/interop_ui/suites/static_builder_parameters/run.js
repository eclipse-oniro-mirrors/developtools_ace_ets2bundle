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

const { runUnitCases } = require('./unit.test');
const { runRunnerCases } = require('./runner.test');
const { caseLines, normalizeOptions } = require('./options');

const name = 'static_builder_parameters';
const direction = '12-to-11';

function selectedDirection(options) {
  return !options.direction || options.direction === direction;
}

async function run(options = {}) {
  const normalized = normalizeOptions(options);
  if (!selectedDirection(normalized)) {
    return [];
  }
  const group = normalized.group || 'unit';
  if (group === 'unit') {
    const results = await runRunnerCases(normalized);
    results.push(...runUnitCases(normalized));
    return results;
  }
  if (group === 'compile') {
    const { runCompileCases } = require('./compile.test');
    return runCompileCases(normalized);
  }
  if (group === 'project') {
    return [];
  }
  throw new Error(`${name} does not support group ${group}`);
}

function parseArguments(argv) {
  const options = {
    group: 'unit',
    keepArtifacts: false,
    list: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--keep-artifacts') {
      options.keepArtifacts = true;
    } else if (argument === '--list') {
      options.list = true;
    } else if (argument === '--group' || argument === '--direction') {
      index += 1;
      if (index >= argv.length || argv[index].startsWith('--')) {
        throw new Error(`${argument} requires a value`);
      }
      const value = argv[index];
      if (argument === '--group') {
        if (!['unit', 'compile'].includes(value)) {
          throw new Error(`invalid --group ${value}; expected unit or compile`);
        }
        options.group = value;
      } else {
        if (!['12-to-11', '11-to-12'].includes(value)) {
          throw new Error(`invalid --direction ${value}`);
        }
        options.direction = value;
      }
    } else {
      throw new Error(`unknown argument: ${argument}`);
    }
  }
  return options;
}

function listCases() {
  for (const line of caseLines()) {
    console.log(line);
  }
}

function printCase(testCase) {
  if (testCase.status === 'passed') {
    console.log(`PASS ${testCase.name} [${testCase.kind}]`);
    return;
  }
  const failure = testCase.failure;
  console.error(`FAIL ${testCase.name} stage=${failure.stage} category=${failure.category} ` +
    `code=${failure.code}: ${failure.message}`);
  if (failure.details?.evidencePath) {
    console.error(`EVIDENCE ${failure.details.evidencePath}`);
  }
}

async function directMain(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.list) {
    listCases();
    return 0;
  }
  const cases = await run({ ...options, env: process.env });
  for (const testCase of cases) {
    printCase(testCase);
  }
  const failed = cases.filter(testCase => testCase.status === 'failed').length;
  console.log(`SUITE ${name} group=${options.group} direction=${options.direction || direction} ` +
    `effective=${cases.length} passed=${cases.length - failed} failed=${failed}`);
  if (cases.length === 0) {
    console.error('NO_CASES: selection did not match this suite');
    return 1;
  }
  return failed > 0 ? 1 : 0;
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
  directMain,
  direction,
  listCases,
  name,
  parseArguments,
  run
};
