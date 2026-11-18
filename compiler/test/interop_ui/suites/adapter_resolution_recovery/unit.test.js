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

const { fixtures } = require('./resolution_cases');
const { executeFixture } = require('./resolution_worker');

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  direction: '11-to-12',
  run(t) {
    const actual = executeFixture(t, fixture);
    const expected = fixture.steps.filter(step => step.action === 'resolve');
    t.equal(actual.observations.length, expected.length);
    t.equal(actual.dependencyCount, 1);
    t.equal(actual.isolation, 'child-process');
    for (let index = 0; index < expected.length; index += 1) {
      const observation = actual.observations[index];
      t.equal(observation.path, expected[index].expected,
        `${fixture.id} resolved an unexpected source or adapter at step ${index}`);
      t.deepEqual(observation.missing, expected[index].missing);
      if (fixture.operation === 'query' && observation.path) {
        t.equal(observation.extension, '.d.ets');
      }
    }
    t.record('resolution-contract', { boundary: fixture.boundary, steps: fixture.steps,
      observations: actual.observations });
  }
}));

cases.push(...require('./declaration_selection.test').cases);

module.exports = { cases };
