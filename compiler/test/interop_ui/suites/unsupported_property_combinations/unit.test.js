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

const fixtures = [
  ...require('./property_cases').fixtures,
  ...require('./access_required_cases').fixtures
];
const { executeFixture } = require('./validation_worker');

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  direction: '11-to-12',
  run(t) {
    const actual = executeFixture(t, fixture);
    t.equal(actual.parseErrors, 0);
    t.equal(actual.validation, 'repository-getComponentSet');
    t.deepEqual(actual.collections.properties, fixture.expected.properties);
    if (fixture.expected.collection) {
      t.ok(actual.collections[fixture.expected.collection].includes(fixture.property));
    }
    if (['localStorageProp', 'localStorageLink'].includes(fixture.expected.collection)) {
      t.deepEqual(actual.storageBindings[fixture.expected.collection], [['value', ["'value'"]]]);
    }
    for (const collection of fixture.expected.requiredCollections || []) {
      t.ok(actual.collections[collection].includes(fixture.property));
    }
    t.equal(actual.diagnostics.length, fixture.expected.diagnostics.length,
      JSON.stringify(actual.diagnostics));
    for (let index = 0; index < actual.diagnostics.length; index += 1) {
      const diagnostic = actual.diagnostics[index];
      const expected = fixture.expected.diagnostics[index];
      for (const field of ['code', 'type', 'line', 'column']) {
        t.equal(diagnostic[field], expected[field], JSON.stringify(diagnostic));
      }
      t.equal(diagnostic.file, 'Card.ets');
      for (const fragment of expected.fragments) {
        t.includes(diagnostic.message, fragment);
      }
    }
    t.record('property-combination-contract', { boundary: fixture.boundary,
      source: fixture.source, uiCheck: fixture.uiCheck,
      expected: fixture.expected, diagnostics: actual.diagnostics });
  }
}));

module.exports = { cases };
