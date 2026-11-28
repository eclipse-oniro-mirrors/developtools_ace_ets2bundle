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
const { fixtures } = require('./binding_cases');

function verify(t, fixture) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'binding_worker.js')], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 4 * 1024 * 1024
  });
  t.equal(result.status, 0, result.stderr || 'Binding transform worker failed');
  const observed = path.join(t.workspace, 'bindings.json');
  const actual = JSON.parse(fs.readFileSync(observed, 'utf8'));
  t.deepEqual(actual.resolutions.map(item => item.path), fixture.resolved);
  for (const provider of fixture.providers) {
    const contract = actual.contracts.find(item => item.path === provider.path);
    t.ok(contract, `Program must load ${provider.path}`);
    t.ok(contract.exports.includes(provider.symbol));
  }
  t.equal(actual.analysis.parseErrors, 0);
  t.deepEqual(actual.analysis.lookups, fixture.lookups);
  t.deepEqual(actual.analysis.imports, fixture.retainedImports || []);
  t.equal(actual.errors.length, fixture.errorCount || 0);
  for (const helper of ['__createLazy__', '__createUnsupportedObject__']) {
    t.equal(actual.analysis.helpers.filter(name => name === helper).length, 1);
  }
  for (const error of actual.errors) {
    t.includes(error.message, 'Missing static interop metadata');
    t.includes(error.message, fixture.errorTarget);
    t.greater(error.code, 0);
  }
  if (fixture.evaluate) {
    t.equal(actual.runtime.mode, 'Panda boundary stub');
    t.deepEqual(actual.runtime.probe, fixture.probe);
    t.deepEqual(actual.runtime.calls, fixture.lookups);
  }
  t.record('multi-provider-bindings', { observed, resolutions: actual.resolutions,
    lookups: actual.analysis.lookups, sourceContracts: actual.contracts, errors: actual.errors });
}

const cases = fixtures.map(fixture => ({ id: fixture.id, group: 'unit', direction: '11-to-12',
  run: t => verify(t, fixture) }));

module.exports = { cases };
