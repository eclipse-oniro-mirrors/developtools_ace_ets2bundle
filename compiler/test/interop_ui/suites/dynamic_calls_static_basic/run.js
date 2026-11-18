#!/usr/bin/env node
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
const {
  createOutputRoot,
  errorDetails,
  parseArgs,
  runCases,
  selectCases,
  usage,
  validateRegistry
} = require('./harness');
const { DIRECTION } = require('./source_cases');
const name = 'dynamic_calls_static_basic';
const groups = new Set(['unit', 'compile', 'project']);
function registry() {
  return validateRegistry([
    ...require('./unit.test').cases,
    ...require('./compile.test').cases,
    ...require('./project.test').cases
  ]);
}
async function execute(options) {
  const selected = selectCases(registry(), options);
  const outputRoot = createOutputRoot(options.output);
  if (!options.quiet) {
    console.log(`[SUITE] ${name} direction=${DIRECTION}`);
    console.log(`[OUTPUT] ${outputRoot}`);
  }
  return runCases(selected, options, outputRoot);
}
async function run(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  if (!groups.has(group)) {
    throw new Error(`${name} does not support group ${group}`);
  }
  const summary = await execute({
    group,
    direction: DIRECTION,
    caseId: '',
    output: options.output || options.parent || '',
    env: options.env || process.env,
    quiet: true
  });
  return summary.cases;
}
async function main(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    if (options.help) {
      console.log(usage());
      return 0;
    }
    const summary = await execute(options);
    if (summary.failed === 0) {
      console.log(`[DONE] ${summary.passed}/${summary.total} cases passed`);
    }
    return summary.failed > 0 ? 1 : 0;
  } catch (error) {
    console.error(`[FATAL] ${error.message}`);
    if (process.env.INTEROP_UI_DEBUG === '1') {
      console.error(JSON.stringify(errorDetails(error), null, 2));
    }
    return 1;
  }
}
if (require.main === module) {
  main().then(exitCode => {
    process.exitCode = exitCode;
  }).catch(error => {
    console.error(`[FATAL] ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}
module.exports = { name, direction: DIRECTION, run };
