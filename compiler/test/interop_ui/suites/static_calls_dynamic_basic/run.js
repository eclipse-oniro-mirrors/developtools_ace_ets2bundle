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

const { DIRECTION } = require('./harness');
const { runSpecializedDeclarations } = require('./declaration.test');
const { runFullChain } = require('./compile.test');
const { runRunnerUnits } = require('./runner.test');

const name = 'static_calls_dynamic_basic';

async function run(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  if (group === 'unit') {
    const results = [];
    results.push(...await runRunnerUnits(options));
    results.push(...await runSpecializedDeclarations(options));
    return results;
  }
  if (group === 'compile') {
    return [await runFullChain('compile', options)];
  }
  if (group === 'project') {
    return [await runFullChain('project', options)];
  }
  throw new Error(`${name} does not support group ${group}`);
}

async function directMain() {
  const args = process.argv.slice(2);
  const groupIndex = args.indexOf('--group');
  const directionIndex = args.indexOf('--direction');
  const group = groupIndex >= 0 ? args[groupIndex + 1] : 'unit';
  const direction = directionIndex >= 0 ? args[directionIndex + 1] : undefined;
  const cases = await run({ group, direction, env: process.env });
  let failed = 0;
  for (const testCase of cases) {
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
    console.error('NO_CASES: selection did not match this suite');
    process.exitCode = 1;
    return;
  }
  process.exitCode = failed > 0 ? 1 : 0;
}

if (require.main === module) {
  directMain().catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  name,
  direction: DIRECTION,
  run
};
