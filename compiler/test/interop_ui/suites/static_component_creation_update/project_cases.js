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
const {
  STATIC_COUNTER_SOURCE,
  STATIC_INDEX_SOURCE
} = require('../dynamic_calls_static_basic/source_cases');

function caller(body, fields = '') {
  return `import { StaticCounter, StaticBadge } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  @State visible: boolean = true;
  ${fields}
  build() {
    Column() {
      Text('PR13 create/update')
      ${body}
      Button('update').id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
      Button('toggle').id('toggleStaticChild').onClick(() => {
        this.visible = !this.visible;
      })
    }
    .width('100%').height('100%')
  }
}
`;
}
const badgeSource = STATIC_COUNTER_SOURCE + `
@Component
export struct StaticBadge {
  @State public count: number = 1;
  build(): void {
    Text('badge=' + this.count.toString()).id('staticBadge')
  }
}
`;
const badgeIndex = STATIC_INDEX_SOURCE +
  "export { StaticBadge } from './src/main/ets/StaticCounter';\n";
const fixtures = [
  {
    id: 'different-static-siblings',
    caller: caller('StaticCounter({ count: this.counterSeed })\n' +
      'StaticBadge({ count: this.counterSeed + 1 })'),
    staticSource: badgeSource,
    staticIndex: badgeIndex,
    expected: {
      components: ['StaticCounter', 'StaticBadge'],
      bytecode: ['__Options_StaticCounter', '__Options_StaticBadge']
    }
  },
  {
    id: 'conditional-static-child',
    caller: caller('if (this.visible) {\n' +
      '  StaticCounter({ count: this.counterSeed })\n' +
      '} else {\n  StaticBadge({ count: 0 })\n}'),
    staticSource: badgeSource,
    staticIndex: badgeIndex,
    expected: {
      components: ['StaticCounter', 'StaticBadge'],
      contains: ['this.visible', 'ifElseBranchUpdateFunction'],
      bytecode: ['StaticCounter', 'StaticBadge']
    }
  }
];

function componentOffsets(output, component) {
  const initial = output.indexOf(`new ${component}(undefined, undefined)`);
  const push = output.indexOf(`ViewStackProcessor.push(static_${component}[1])`, initial);
  const pop = output.indexOf('ViewStackProcessor.pop()', push);
  const update = output.indexOf(`static_${component}[0]()`, pop);
  return { initial, push, pop, update };
}

function assertScenario(t, output, fixture, paths) {
  const offsets = {};
  for (const component of fixture.expected.components) {
    const order = componentOffsets(output, component);
    t.ok(order.initial >= 0 && order.push > order.initial);
    t.ok(order.pop > order.push && order.update > order.pop);
    t.includes(output, `__Options_${component}`);
    offsets[component] = order;
  }
  for (const snippet of fixture.expected.contains || []) {
    t.includes(output, snippet);
  }
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  for (const component of fixture.expected.components) {
    t.includes(declaration, component);
  }
  t.record('per-component-order', offsets);
}

module.exports = { fixtures, assertScenario };
