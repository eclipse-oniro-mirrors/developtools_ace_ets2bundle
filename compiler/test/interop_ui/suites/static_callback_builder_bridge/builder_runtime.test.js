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
const { fixtures } = require('./runtime_cases');

function verifyRuntime(t, fixture) {
  const actual = executeFixture(t, fixture);
  t.equal(actual.returnsResult, true);
  t.equal(actual.runtime.presence, true);
  t.equal(actual.runtime.receiverValue, fixture.expected.receiverValue);
  t.deepEqual(actual.runtime.received, fixture.arguments);
  t.deepEqual(actual.runtime.helperCalls, fixture.expected.helperCalls);
  t.includes(actual.output, `__options_has_${fixture.parameter}`);
  if (fixture.expected.helper) {
    t.includes(actual.output, fixture.expected.helper);
    t.includes(actual.output, 'this.buildContent.bind(this)');
  } else {
    t.notIncludes(actual.output, '__Interop_transferCompatibleDynamicBuilder');
  }
  t.record('runtime-scope', {
    source: 'actual generated options and original TypeScript Host in Node vm',
    transfer: 'JavaScript forwarding model of the selected native bridge entry point',
    receiver: 'actual Host instance',
    arguments: fixture.arguments,
    actual: actual.runtime
  });
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  run: t => verifyRuntime(t, fixture)
}));

module.exports = { cases, verifyRuntime };
