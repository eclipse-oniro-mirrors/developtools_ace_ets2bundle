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

function caller(imports, component, extraBody = '') {
  return `${imports}
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  build() {
    Column() {
      Text('PR11 named import')
      ${component}({ count: this.counterSeed })
      ${extraBody}
      Button('update').id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
    }
    .width('100%').height('100%')
  }
}
`;
}

const fixtures = [
  {
    id: 'aliased-component',
    caller: caller("import { StaticCounter as CounterCard } from 'static_component';", 'CounterCard'),
    expected: {
      component: 'CounterCard',
      bytecode: ['__Interop_CreateStaticComponent_Internal', '__Options_CounterCard']
    }
  },
  {
    id: 'two-local-names-one-export',
    caller: caller(
      "import { StaticCounter as FirstCounter, StaticCounter as SecondCounter } from 'static_component';",
      'FirstCounter',
      'SecondCounter({ count: this.counterSeed + 1 })'),
    expected: {
      component: 'FirstCounter',
      secondComponent: 'SecondCounter',
      bytecode: ['__Options_FirstCounter', '__Options_SecondCounter']
    }
  },
  {
    id: 'component-and-runtime-function',
    caller: caller(
      "import { StaticCounter, formatCount as renderCount } from 'static_component';",
      'StaticCounter',
      'Text(renderCount(this.counterSeed))'),
    staticSource: STATIC_COUNTER_SOURCE + '\nexport function formatCount(value: number): string {\n' +
      "  return 'count=' + value.toString();\n}\n",
    staticIndex: STATIC_INDEX_SOURCE + "export { formatCount } from './src/main/ets/StaticCounter';\n",
    expected: {
      component: 'StaticCounter',
      contains: ['renderCount(this.counterSeed)'],
      bytecode: ['formatCount']
    }
  }
];

function assertComponent(t, output, component) {
  t.includes(output, `static_${component}`);
  t.includes(output, `new ${component}(undefined, undefined)`);
  t.includes(output, `new __Options_${component}()`);
  t.includes(output, `ViewStackProcessor.push(static_${component}[1])`);
  t.includes(output, `static_${component}[0]()`);
}

function assertScenario(t, output, fixture, paths) {
  assertComponent(t, output, fixture.expected.component);
  if (fixture.expected.secondComponent) {
    assertComponent(t, output, fixture.expected.secondComponent);
  }
  for (const snippet of fixture.expected.contains || []) {
    t.includes(output, snippet);
  }
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  const bridge = fs.readFileSync(paths.staticBridge, 'utf8');
  t.includes(declaration, 'StaticCounter');
  t.includes(bridge, 'StaticCounter');
  t.includes(bridge, 'Lstatic_component/src/main/ets/StaticCounter/StaticCounter;');
  t.notIncludes(bridge, 'Lstatic_component/src/main/ets/StaticCounter/CounterCard;');
  t.match(output, /__options_has_count["']\]\s*=\s*true/);
}

module.exports = { fixtures, assertScenario };
