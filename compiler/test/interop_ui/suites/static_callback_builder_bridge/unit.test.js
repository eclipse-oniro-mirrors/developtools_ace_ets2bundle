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

const { executeFixture } = require('./component_worker');
const { assertOutput } = require('./output_assertions');
const { fixtures } = require('./source_cases');

function verify(t, fixture) {
  const actual = executeFixture(t, fixture);
  assertOutput(t, fixture, actual);
  t.equal(actual.returnsResult, true);
  t.includes(actual.output, `new __Options_${fixture.component}()`);
  t.includes(actual.output, `__options_has_${fixture.parameter}`);
  const expected = fixture.expected;
  if (expected.helper) {
    t.includes(actual.output, expected.helper);
    t.equal((actual.output.match(/__Interop_transferCompatibleDynamicBuilder\d*_Internal/g) || []).length, 1);
  } else {
    t.notIncludes(actual.output, '__Interop_transferCompatibleDynamicBuilder');
  }
  for (const snippet of expected.contains) {
    t.includes(actual.output, snippet);
  }
  for (const snippet of expected.forbidden || []) {
    t.notIncludes(actual.output, snippet);
  }
  t.equal(actual.statementCount, 4);
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  run: t => verify(t, fixture)
}));

cases.push(...require('./builder_runtime.test').cases);

module.exports = { cases, verify };
