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
const { fixtures } = require('./render_cases');

function verify(t, fixture) {
  const child = spawnSync(process.execPath, [path.join(__dirname, 'render_worker.js')], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(child.status, 0, child.stderr || 'UI transform worker failed');
  const file = path.join(t.workspace, 'render-evidence.json');
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.deepEqual(result.diagnostics, []);
  for (const constructor of fixture.componentOrder) {
    t.includes(result.output, `new ${constructor}(`);
  }
  const offsets = fixture.componentOrder.map(name => result.output.indexOf(`new ${name}(`));
  t.deepEqual([...offsets].sort((a, b) => a - b), offsets);
  for (const token of fixture.required) {
    t.includes(result.output, token);
  }
  t.record('page-ui-transform', { file, boundary: fixture.boundary, constructors: fixture.componentOrder });
}

const cases = fixtures.map(fixture => ({
  id: fixture.id, group: 'unit', direction: '12-to-11', run: t => verify(t, fixture)
}));

module.exports = { cases };
