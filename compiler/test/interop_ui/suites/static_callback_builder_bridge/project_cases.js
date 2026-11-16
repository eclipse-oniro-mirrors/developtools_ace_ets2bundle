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

const callbackSource = STATIC_COUNTER_SOURCE.replace(
  '@State public count: number = 0;',
  `@State public count: number = 0;
  public onAction: (value: number) => void = (value: number): void => {
    console.info('default action ' + value.toString());
  };`).replace(
  'this.count += 1;',
  'this.count += 1;\n        this.onAction(this.count);');

const builderSource = STATIC_COUNTER_SOURCE.replace(
  "import { Component, Column, Text, Button } from '@ohos.arkui.component';",
  "import { Component, Column, Text, Button, BuilderParam, Builder } from '@ohos.arkui.component';").replace(
  '@State public count: number = 0;',
  `@State public count: number = 0;
  @BuilderParam public content: () => void = this.fallbackContent;

  @Builder
  fallbackContent(): void {
    Text('fallback content')
  }`).replace(
  "Text('ArkTS 1.2 静态组件')",
  'this.content()\n      Text(\'ArkTS 1.2 静态组件\')');

function caller(body, members = '') {
  return `import { StaticCounter } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  @State lastAction: number = -1;
  ${members}
  build() {
    Column() {
      Text('PR15 callback/builder bridge')
      Text('action=' + this.lastAction.toString()).id('lastAction')
      ${body}
      Button('update').onClick(() => { this.counterSeed += 1; })
    }
    .width('100%').height('100%')
  }
}
`;
}

const fixtures = [
  {
    id: 'typed-arrow-callback',
    staticSource: callbackSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: caller('StaticCounter({ count: this.counterSeed, onAction: (value: number): void => {\n' +
      '  this.lastAction = value;\n} })'),
    expected: {
      contains: ['__options_has_onAction', 'this.lastAction = value'],
      bytecode: ['onAction', '__options_has_onAction']
    }
  },
  {
    id: 'bound-method-callback',
    staticSource: callbackSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: caller('StaticCounter({ count: this.counterSeed, onAction: this.acceptAction.bind(this) })',
      'acceptAction(value: number): void {\n    this.lastAction = value;\n  }'),
    expected: {
      contains: ['__options_has_onAction', 'this.acceptAction.bind(this)'],
      bytecode: ['acceptAction', 'onAction']
    }
  },
  {
    id: 'dynamic-builder-reference',
    staticSource: builderSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: caller('StaticCounter({ count: this.counterSeed, content: this.dynamicContent })',
      '@Builder\n  dynamicContent() {\n    Text(\'dynamic builder content\').id(\'dynamicBuilderContent\')\n  }'),
    expected: {
      contains: ['__options_has_content', '__Interop_transferCompatibleDynamicBuilder_Internal', 'dynamicContent'],
      bytecode: ['content', 'dynamicContent']
    }
  }
];

function assertScenario(t, output, fixture, paths) {
  for (const snippet of fixture.expected.contains) {
    t.includes(output, snippet);
  }
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  if (fixture.id.includes('callback')) {
    t.includes(declaration, 'onAction');
    t.match(declaration, /value\s*:\s*number/);
  } else {
    t.includes(declaration, 'content');
    t.includes(declaration, 'BuilderParam');
  }
  t.match(output, /__options_has_count["']\]\s*=\s*true/);
  t.includes(output, '__Interop_CreateStaticComponent_Internal');
}

module.exports = { fixtures, assertScenario };
