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

const { executeFixture } = require('./transform_worker');
const { assertOutput } = require('./output_assertions');
const { fixtures } = require('./source_cases');

function verify(t, fixture) {
  const actual = executeFixture(t, fixture);
  assertOutput(t, fixture, actual);
  t.equal(actual.analysis.parseErrors, 0);
  for (const exported of fixture.expected.sourceExports) {
    t.ok(actual.sourceContract.exports.includes(exported), `Static source must export ${exported}`);
  }
  t.equal(actual.sourceContract.checker, 'real TypeScript Program');
  t.deepEqual(actual.analysis.declarations, fixture.expected.declarations);
  t.deepEqual(actual.analysis.lookups, fixture.expected.lookups);
  t.deepEqual(actual.analysis.imports, fixture.expected.imports || []);
  t.deepEqual(actual.errors.map(error => error.code), fixture.expected.errors || []);
  const helperCount = fixture.expected.helpers;
  t.equal(actual.analysis.helpers.filter(name => name === '__createLazy__').length, helperCount);
  t.equal(actual.analysis.helpers.filter(name => name === '__createUnsupportedObject__').length, helperCount);
  for (const resolution of actual.resolutions) {
    if (resolution.specifier.startsWith('./Static')) {
      if (resolution.resolved) {
        t.ok(resolution.resolved.endsWith('/Static.ets'));
      } else {
        t.equal(fixture.evaluate, false);
      }
    }
  }
  for (const text of fixture.expected.contains || []) {
    t.includes(actual.output, text);
  }
  for (const text of fixture.expected.forbidden || []) {
    t.notIncludes(actual.output, text);
  }
  if (fixture.evaluate) {
    t.deepEqual(actual.runtime.probe, fixture.expected.probe);
    t.deepEqual(actual.runtime.runtimeCalls, fixture.expected.lookups);
  }
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  run: t => verify(t, fixture)
}));

cases.push(...require('./runtime_fallback.test').cases);

cases.push(...require('./metadata_contract.test').cases);

cases.push(...require('./source_contract.test').cases);

module.exports = { cases, verify };
