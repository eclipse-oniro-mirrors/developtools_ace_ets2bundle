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
const { spawnSync } = require('child_process');
const { fixtures: modules } = require('./module_cases');
const { fixtures: aliases } = require('./alias_cases');
const { fixtures: relatives } = require('./relative_cases');

function execute(t, fixture) {
  const child = spawnSync(process.execPath, [path.join(__dirname, 'path_worker.js')], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 4 * 1024 * 1024
  });
  t.equal(child.status, 0, child.stderr || 'Path identity worker failed');
  const file = path.join(t.workspace, 'observations.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.equal(data.providers, fixture.providers.length);
  for (let index = 0; index < fixture.requests.length; index += 1) {
    const request = fixture.requests[index];
    const actual = data.resolutions[index];
    t.equal(actual.request, request.request);
    t.equal(actual.path, request.expectedPath);
    t.equal(actual.language, request.expectedLanguage);
    t.equal(actual.packageName, request.expectedPackage);
    t.deepEqual(actual.missing, request.missing || []);
    if (request.marker) {
      t.includes(actual.content, request.marker);
      t.greater(actual.bytes, 0);
    }
  }
  t.record('qualified-paths', { observations: file, boundary: fixture.boundary, results: data.resolutions });
}

const cases = [...modules, ...aliases, ...relatives].map(fixture => ({
  id: fixture.id,
  direction: '11-to-12',
  group: 'unit',
  run: t => execute(t, fixture)
}));

cases.push(...require('./binding_cases.test').cases);

module.exports = { cases };
