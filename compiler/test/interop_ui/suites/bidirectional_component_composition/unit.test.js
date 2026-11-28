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
const { executeFixture: generate } = require('../bidirectional_public_types/declaration_worker');
const { executeFixture: render } = require('../static_component_creation_update/component_worker');
const { fixtures: declarations } = require('./dynamic_declarations');
const { fixtures: siblingOptions } = require('./static_siblings');

function verifyDeclarations(t, fixture) {
  const result = generate(t, { id: 'Composed', boundary: fixture.boundary, mode: 'declgen', source: fixture.source });
  t.deepEqual(result.diagnostics, []);
  const symbols = result.inspection.symbols.map(item => item.name);
  for (const component of fixture.components) {
    t.ok(symbols.includes(component.name));
    const members = result.inspection.members.filter(item => item.owner === component.name && item.name !== 'build');
    for (const [name, type] of Object.entries(component.properties)) {
      const property = members.find(item => item.name === name);
      t.ok(property, `Missing ${component.name}.${name}`);
      t.equal(property.type, type);
    }
    for (const field of component.absent) {
      t.ok(!members.some(item => item.name === field), `${component.name} leaks a sibling's field ${field}`);
    }
  }
  t.record('same-file-component-shapes', { generated: result.outputPath, components: fixture.components,
    members: result.inspection.members, boundary: fixture.boundary });
}

function options(t, component, label) {
  const folder = path.join(t.workspace, label);
  fs.mkdirSync(folder);
  const context = new AssertionContext(t.testCase, folder, t.options);
  const result = render(context, {
    component: component.name, source: component.source, state: component.state, evaluate: true
  });
  t.assertions += context.assertions;
  const snapshot = JSON.parse(JSON.stringify(result.runtime.values));
  t.deepEqual(snapshot, component.expected);
  t.includes(result.output, `new __Options_${component.name}()`);
  t.record(`${label}-bridge`, { file: path.join(folder, 'options.ts'), snapshot });
  return result;
}

function verifyOptions(t, fixture) {
  const left = options(t, fixture.left, 'left');
  const right = options(t, fixture.right, 'right');
  t.notIncludes(left.output, `__Options_${fixture.right.name}`);
  t.notIncludes(right.output, `__Options_${fixture.left.name}`);
  for (const name of fixture.onlyLeft || []) {
    t.includes(left.output, `__options_has_${name}`);
    t.notIncludes(right.output, `__options_has_${name}`);
  }
  for (const name of fixture.onlyRight || []) {
    t.includes(right.output, `__options_has_${name}`);
    t.notIncludes(left.output, `__options_has_${name}`);
  }
  t.record('sibling-contract', { boundary: fixture.boundary, left: fixture.left.name, right: fixture.right.name });
}

const declarationCases = declarations.map(fixture => ({
  id: fixture.id, direction: '12-to-11', group: 'unit', run: t => verifyDeclarations(t, fixture)
}));
const optionCases = siblingOptions.map(fixture => ({
  id: fixture.id, direction: '11-to-12', group: 'unit', run: t => verifyOptions(t, fixture)
}));

module.exports = { cases: [...declarationCases, ...optionCases, ...require('./render_cases.test').cases] };
