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
  t.deepEqual(actual.runtime.trace, fixture.expected.trace);
  t.deepEqual(actual.runtime.optionsSnapshots, fixture.expected.options);
  const output = actual.output;
  t.includes(output, `let static_${fixture.component}`);
  t.includes(output.replace(/\s+/g, ''), `:[${fixture.component},number]`);
  t.includes(output, 'if (isInitialRender)');
  t.includes(output, `new ${fixture.component}(undefined, undefined)`);
  t.includes(output, `new __Options_${fixture.component}()`);
  const create = output.indexOf('__Interop_CreateStaticComponent_Internal');
  const push = output.indexOf(`ViewStackProcessor.push(static_${fixture.component}[1])`);
  const pop = output.indexOf('ViewStackProcessor.pop()');
  const update = output.indexOf(`static_${fixture.component}[0]()`);
  t.ok(create < push && push < pop && pop < update);
  t.equal((output.match(/__Interop_CreateStaticComponent_Internal/g) || []).length, 1);
  t.equal((output.match(/ViewStackProcessor\.push/g) || []).length, 1);
  t.equal((output.match(/ViewStackProcessor\.pop/g) || []).length, 1);
  const constructCount = actual.runtime.trace.filter(event => event[0] === 'construct').length;
  t.equal(constructCount, fixture.renders.filter(render => render.initial).length);
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  run: t => verify(t, fixture)
}));

cases.push(...require('./render_contract.test').cases);

module.exports = { cases, verify };
