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
const { AssertionContext } = require('../dynamic_calls_static_basic/harness');
const { executeFixture } = require('../static_component_creation_update/component_worker');
const { fixtures: properties } = require('./property_revisions');
const { fixtures: expressions } = require('./expression_revisions');
const { fixtures: models } = require('./model_revisions');

function captureRevision(t, fixture, revision, label) {
  const workspace = path.join(t.workspace, label);
  fs.mkdirSync(workspace);
  const context = new AssertionContext(t.testCase, workspace, t.options);
  const actual = executeFixture(context, {
    component: fixture.component,
    source: revision.source,
    state: revision.state,
    evaluate: true
  });
  t.assertions += context.assertions;
  t.ok(actual.returnsResult);
  t.greater(actual.statementCount, 0);
  t.includes(actual.output, `new __Options_${fixture.component}()`);
  t.notIncludes(actual.output, 'isInitialRender');
  t.deepEqual(JSON.parse(JSON.stringify(actual.runtime.values)), revision.expected);
  t.deepEqual(actual.runtime.calls, []);
  t.record(`${label}-options`, { file: path.join(workspace, 'options.ts'),
    expected: revision.expected, output: actual.output });
  return actual;
}

function verify(t, fixture) {
  const original = captureRevision(t, fixture, fixture.before, 'before');
  const updated = captureRevision(t, fixture, fixture.after, 'after');
  t.notEqual(original.output, updated.output, 'The revised caller must generate different bridge options');
  for (const name of fixture.removed) {
    t.includes(original.output, `__options_has_${name}`);
    t.notIncludes(updated.output, `__options_has_${name}`);
  }
  for (const name of fixture.added) {
    t.notIncludes(original.output, `__options_has_${name}`);
    t.includes(updated.output, `__options_has_${name}`);
  }
  t.record('revision-boundary', { reason: fixture.boundary, added: fixture.added, removed: fixture.removed });
}

const cases = [...properties, ...expressions, ...models].map(fixture => ({
  id: fixture.id,
  direction: '11-to-12',
  group: 'unit',
  run: t => verify(t, fixture)
}));

module.exports = { cases };
