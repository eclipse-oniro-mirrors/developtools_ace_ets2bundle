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

function verifyOptions(t, fixture, actual) {
  t.equal(actual.returnsResult, true);
  t.deepEqual(actual.runtime.values, fixture.expected.values);
  t.equal(actual.statementCount, fixture.expected.assignmentCount * 2 + 2);
  for (const name of fixture.expected.present) {
    t.includes(actual.output, `__options_has_${name}`);
  }
  for (const name of fixture.links || []) {
    t.includes(actual.output, `__backing_${name}`);
    t.includes(actual.output, '__Interop_createCompatibleStaticState_Internal');
  }
  for (const snippet of fixture.expected.contains || []) {
    t.includes(actual.output, snippet);
  }
  for (const snippet of fixture.expected.forbidden || []) {
    t.notIncludes(actual.output, snippet);
  }
}

function verifyValidation(t, fixture, actual) {
  t.equal(actual.result, fixture.expected.rejected);
  t.equal(actual.log.length, fixture.expected.rejected ? 1 : 0);
  if (fixture.expected.rejected) {
    const diagnostic = actual.log[0];
    t.equal(diagnostic.type, 'ERROR');
    t.equal(diagnostic.code, '10905501');
    t.equal(diagnostic.pos, actual.callStart);
    t.includes(diagnostic.message, fixture.component);
    t.includes(diagnostic.message, 'ParentCard');
    t.includes(diagnostic.message, fixture.expected.parentDecorator);
    t.includes(diagnostic.message, fixture.expected.childDecorator);
  }
}

function verify(t, fixture) {
  const actual = executeFixture(t, fixture);
  assertOutput(t, fixture, actual);
  if (fixture.operation === 'validation') {
    verifyValidation(t, fixture, actual);
  } else {
    verifyOptions(t, fixture, actual);
  }
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  run: t => verify(t, fixture)
}));

module.exports = { cases, verifyOptions, verifyValidation };
