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
const { AssertionContext, writeJson } = require('../dynamic_calls_static_basic/harness');
const name = 'adapter_resolution_recovery';

function parseArgs(argv) {
  const options = { group: 'unit', output: '', caseId: '' };
  const keys = new Map([['--group', 'group'], ['--direction', 'direction'],
    ['--case', 'caseId'], ['--output', 'output']]);
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--help') {
      options.help = true;
      continue;
    }
    assert.ok(keys.has(flag), `Unknown argument ${flag}`);
    assert.ok(!seen.has(flag), `Duplicate argument ${flag}`);
    seen.add(flag);
    const value = argv[++index];
    assert.ok(value && !value.startsWith('--'), `Missing value for ${flag}`);
    options[keys.get(flag)] = value;
  }
  assert.ok(['unit', 'compile', 'all'].includes(options.group));
  assert.ok(!options.direction || ['11-to-12', '12-to-11'].includes(options.direction));
  return options;
}

function registry() {
  const cases = [...require('./unit.test').cases, ...require('./compile.test').cases];
  const ids = new Set();
  for (const testCase of cases) {
    assert.ok(testCase.id && typeof testCase.run === 'function');
    assert.ok(['11-to-12', '12-to-11'].includes(testCase.direction));
    assert.ok(['unit', 'compile'].includes(testCase.group));
    assert.ok(!ids.has(testCase.id), `Duplicate case ${testCase.id}`);
    ids.add(testCase.id);
  }
  return cases;
}

async function run(options = {}) {
  const group = options.group || 'unit';
  const selected = registry().filter(testCase =>
    (group === 'all' || testCase.group === group) &&
    (!options.direction || testCase.direction === options.direction) &&
    (!options.caseId || testCase.id === options.caseId));
  if (!selected.length && options.direction) {
    return [];
  }
  assert.ok(selected.length, `NO_CASES ${name} group=${group}`);
  const results = [];
  for (const testCase of selected) {
    const definition = { name: `${name}/${testCase.id}`, group: testCase.group,
      direction: testCase.direction, kind: testCase.group === 'unit' ? 'specialized' : 'full-chain' };
    results.push(await executeCase(definition, async context => {
      const t = new AssertionContext(testCase, context.workspace.root, options);
      const returned = await testCase.run(t);
      assert.ok(t.assertions > 0, `ZERO_ASSERTIONS ${testCase.id}`);
      context.passStage(testCase.group === 'unit' ? 'repository-contract' : 'generated-consumer');
      return { assertions: t.assertions, evidence: t.evidence, toolchain: t.toolchain, returned };
    }, { ...options, parent: options.output || options.parent, keep: true }));
  }
  return results;
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(`Usage: node ${name}/run.js --group unit|compile|all [--direction 11-to-12|12-to-11]`);
    return 0;
  }
  const cases = await run(options);
  assert.ok(cases.length, 'NO_CASES selected by CLI');
  const report = { suite: name, group: options.group, total: cases.length,
    passed: cases.filter(c => c.status === 'passed').length,
    failed: cases.filter(c => c.status === 'failed').length, cases };
  if (options.output) {
    writeJson(path.join(options.output, `${name}-${options.group}.json`), report);
  }
  for (const testCase of cases) {
    console.log(`${testCase.status.toUpperCase()} ${testCase.name}`);
    if (testCase.failure) {
      console.error(JSON.stringify(testCase.failure));
    }
  }
  console.log(`SUMMARY ${JSON.stringify({ ...report, cases: undefined })}`);
  return report.failed ? 1 : 0;
}

if (require.main === module) {
  main().then(code => {
    process.exitCode = code;
  }).catch(error => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = { name, run, main };
