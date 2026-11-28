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

const fs = require('fs');
const path = require('path');
const { stripVTControlCharacters } = require('util');
const { executeFullChain } = require('../dynamic_calls_static_basic/compile.test');
const { findFatalDiagnostics } = require('../dynamic_calls_static_basic/expected_cases');
const { fileMetadata } = require('../dynamic_calls_static_basic/harness');
const { executeHvigor, executeZipTest, listZipEntries } =
  require('../dynamic_calls_static_basic/toolchain');

function inspect(t, result, label) {
  const { paths, tools } = result;
  const outputs = {};
  for (const key of ['staticDeclaration', 'staticIndexDeclaration', 'staticBridge', 'staticIndexBridge',
    'callerTransformedPage', 'callerCachedBridge', 'callerCachedIndexBridge', 'dynamicAbc', 'staticAbc']) {
    outputs[key] = fileMetadata(paths[key]);
  }
  const folder = path.join(t.workspace, 'observations', label);
  fs.mkdirSync(folder, { recursive: true });
  t.equal(executeZipTest(tools, paths.unsignedHap, folder).exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, folder);
  const binaryEntries = ['ets/modules.abc', 'ets/modules_static.abc'];
  for (const entry of binaryEntries) {
    t.ok(entries.includes(entry));
  }
  t.record(`${label}-artifacts`, { outputs, entries, hap: fileMetadata(paths.unsignedHap) });
  return { outputs, entries };
}

function cacheHits(output) {
  return output.split('\n').map(line => line.trim())
    .filter(line => line.includes('UP-TO-DATE')).sort();
}

function run(t) {
  const first = executeFullChain(t);
  const cold = inspect(t, first, 'cold');
  const { paths, projectRoot, tools } = first;
  const inputs = [paths.staticSource, paths.staticIndexSource, paths.dynamicSource];
  const before = inputs.map(fileMetadata);
  const coldLog = path.join(t.workspace, 'evidence/cold-assembleHap.log');
  fs.copyFileSync(first.build.logPath, coldLog);
  const repeated = executeHvigor(projectRoot, t.workspace, tools);
  const output = stripVTControlCharacters(`${repeated.stdout}\n${repeated.stderr}`);
  t.equal(repeated.record.exitCode, 0);
  t.includes(output, 'BUILD SUCCESSFUL');
  t.deepEqual(findFatalDiagnostics(output), []);
  const observedHits = cacheHits(output);
  t.ok(observedHits.some(line => line.includes(':entry:default@PreBuild')));
  t.ok(observedHits.some(line => line.includes(':static_component:default@PreBuild')));
  t.deepEqual(inputs.map(fileMetadata), before);
  const warm = inspect(t, first, 'warm');
  for (const [key, file] of Object.entries(warm.outputs)) {
    t.equal(file.sha256, cold.outputs[key].sha256, `${key} differs with retained caches`);
    t.equal(file.bytes, cold.outputs[key].bytes);
  }
  t.deepEqual(warm.entries.sort(), cold.entries.sort());
  t.record('cached-build', { command: repeated.record, coldLog,
    cacheHits: observedHits, unchangedInputs: before, artifactsVerified: Object.keys(warm.outputs) });
}

const cases = [{ id: 'unchanged-mixed-project-retains-artifact-identity',
  direction: '11-to-12', group: 'compile', run }];

module.exports = { cases };
