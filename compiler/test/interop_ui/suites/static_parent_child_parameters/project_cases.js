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

const parameterSource = STATIC_COUNTER_SOURCE.replace(
  '@State public count: number = 0;',
  `@State public count: number = 0;
  @State public title: string = 'default';
  @State public cardEnabled: boolean = true;`).replace(
  "Text('ArkTS 1.2 静态组件')",
  'Text(this.title + this.cardEnabled.toString())');

function caller(properties, fields) {
  return `import { StaticCounter } from 'static_component';
@Entry
@Component
struct Index {
  ${fields}
  build() {
    Column() {
      Text('PR14 parent/child parameters')
      StaticCounter({ ${properties} })
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
    id: 'falsy-literals-presence',
    caller: caller('count: 0, title: "", cardEnabled: false', '@State counterSeed: number = 7;'),
    staticSource: parameterSource,
    staticIndex: STATIC_INDEX_SOURCE,
    expected: {
      properties: ['count', 'title', 'cardEnabled'],
      assignments: ['count["\']\\]\\s*=\\s*0', 'cardEnabled["\']\\]\\s*=\\s*false'],
      bytecode: ['__options_has_count', '__options_has_title', '__options_has_cardEnabled']
    }
  },
  {
    id: 'parent-state-expressions',
    caller: caller('count: this.counterSeed, title: this.title, cardEnabled: this.cardEnabled',
      '@State counterSeed: number = 7;\n  @State title: string = "parent";\n  @State cardEnabled: boolean = true;'),
    staticSource: parameterSource,
    staticIndex: STATIC_INDEX_SOURCE,
    expected: {
      properties: ['count', 'title', 'cardEnabled'],
      assignments: ['count["\']\\]\\s*=\\s*this.counterSeed', 'title["\']\\]\\s*=\\s*this.title'],
      bytecode: ['__options_has_count', '__options_has_title', '__options_has_cardEnabled']
    }
  },
  {
    id: 'omitted-properties-use-static-defaults',
    caller: caller('count: this.counterSeed', '@State counterSeed: number = 7;'),
    staticSource: parameterSource,
    staticIndex: STATIC_INDEX_SOURCE,
    expected: {
      properties: ['count'],
      omitted: ['title', 'cardEnabled'],
      assignments: ['count["\']\\]\\s*=\\s*this.counterSeed'],
      bytecode: ['__options_has_count']
    }
  }
];

function assertScenario(t, output, fixture, paths) {
  for (const name of fixture.expected.properties) {
    t.match(output, new RegExp(`__options_has_${name}["']\\]\\s*=\\s*true`));
  }
  for (const name of fixture.expected.omitted || []) {
    t.notIncludes(output, `__options_has_${name}`);
  }
  for (const expression of fixture.expected.assignments) {
    t.match(output, new RegExp(expression));
  }
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  t.match(declaration, /count\s*:\s*number/);
  t.match(declaration, /title\s*:\s*string/);
  t.match(declaration, /cardEnabled\s*:\s*boolean/);
  t.includes(output, '__Interop_CreateStaticComponent_Internal');
}

module.exports = { fixtures, assertScenario, caller, parameterSource };
