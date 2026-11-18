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
const { directOptions, parseDirectArguments } = require('./cli');
const { runDeclarationUnits } = require('./declaration.test');
const { runConsumerDiagnosticUnits } = require('./consumer_diagnostics.test');
const { runCompoundCompilations } = require('./compile.test');
const { runRunnerUnits } = require('./runner.test');

const name = 'static_compound_parameters';

async function run(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  if (group === 'unit') {
    const results = [];
    results.push(...await runRunnerUnits(options));
    results.push(...await runDeclarationUnits(options));
    results.push(...await runConsumerDiagnosticUnits(options));
    return results;
  }
  if (group === 'compile') {
    return runCompoundCompilations(options);
  }
  if (group === 'project') {
    return [];
  }
  throw new Error(`${name} does not support group ${group}`);
}

async function directMain(argv = process.argv.slice(2)) {
  const options = directOptions(argv);
  const cases = await run(options);
  let failed = 0;
  for (const testCase of cases) {
    if (testCase.status === 'failed') {
      failed += 1;
      const failure = testCase.failure;
      console.error(`FAIL ${testCase.name} stage=${failure.stage} ` +
        `category=${failure.category} code=${failure.code}: ${failure.message}`);
      for (const diagnostic of testCase.diagnostics || []) {
        console.error(`  diagnostic ${diagnostic.stage} ${diagnostic.code}: ${diagnostic.message}`);
      }
    } else {
      console.log(`PASS ${testCase.name}`);
    }
  }
  console.log(`SUITE ${name} effective=${cases.length} ` +
    `passed=${cases.length - failed} failed=${failed}`);
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
  name,
  direction: DIRECTION,
  directMain,
  parseDirectArguments,
  run
};
