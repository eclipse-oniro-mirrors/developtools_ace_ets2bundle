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

const { DIRECTION } = require('./source_cases');
const { runDeclarationUnits } = require('./declaration.test');
const { runAdapterUnits } = require('./unit.test');
const { runFullChain } = require('./compile.test');

const name = 'static_multifile_exports';
const groups = new Set(['unit', 'compile', 'project']);

function parseCliArgs(argv) {
  const options = { group: 'unit', direction: undefined, caseId: '', help: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (!['--group', '--direction', '--case'].includes(argument)) {
      throw new Error(`unknown argument: ${argument}`);
    }
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) {
      throw new Error(`${argument} requires a value`);
    }
    const value = argv[index + 1];
    index += 1;
    if (argument === '--group') {
      if (!groups.has(value)) {
        throw new Error(`invalid --group ${value}; expected unit, compile or project`);
      }
      options.group = value;
    } else if (argument === '--direction') {
      options.direction = value;
    } else {
      options.caseId = value;
    }
  }
  return options;
}

async function run(options = {}) {
  const group = options.group || 'unit';
  if (!groups.has(group)) {
    throw new Error(`${name} does not support group ${group}`);
  }
  if ((options.direction && options.direction !== DIRECTION) || group === 'project') {
    return [];
  }
  let results;
  if (group === 'unit') {
    results = [
      ...await runAdapterUnits(options),
      ...await runDeclarationUnits(options)
    ];
  } else {
    const compileName = 'multifile-static-consumer-uses-current-declarations-and-abc';
    results = options.caseId && options.caseId !== compileName ? [] : [await runFullChain(options)];
  }
  return options.caseId ? results.filter(testCase => testCase.name === options.caseId) : results;
}

function printUsage() {
  console.log(`Usage:
  node compiler/test/interop_ui/suites/static_multifile_exports/run.js [options]

Options:
  --group unit|compile|project  Select a test group (default: unit).
  --direction 12-to-11         This suite consumes ArkTS 1.1 from ArkTS 1.2.
  --case <effective-name>      Run one effective case by its public protocol name.
  --help                       Print this help without executing cases.

Compile requires INTEROP_UI_NODE, INTEROP_UI_HVIGOR and INTEROP_UI_SDK.
An empty selection is reported as NO_CASES and exits with status 1.`);
}

async function directMain(argv = process.argv.slice(2)) {
  const options = parseCliArgs(argv);
  if (options.help) {
    printUsage();
    return 0;
  }
  const cases = await run({ ...options, env: process.env });
  let failed = 0;
  for (const testCase of cases) {
    if (testCase.kind === 'full-chain') {
      for (const stage of testCase.stages || []) {
        console.log(`STAGE ${testCase.name} ${stage.stage} ${stage.status}`);
      }
    }
    if (testCase.status === 'failed') {
      failed += 1;
      console.error(`FAIL ${testCase.name} stage=${testCase.failure.stage} ` +
        `category=${testCase.failure.category} code=${testCase.failure.code}: ${testCase.failure.message}`);
    } else {
      console.log(`PASS ${testCase.name}`);
    }
  }
  console.log(`SUITE ${name} effective=${cases.length} passed=${cases.length - failed} failed=${failed}`);
  if (cases.length === 0) {
    console.error(`NO_CASES: group=${options.group} direction=${options.direction || 'all'} ` +
      `case=${options.caseId || '*'} effective=0`);
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
  direction: DIRECTION,
  directMain,
  name,
  parseCliArgs,
  run
};
