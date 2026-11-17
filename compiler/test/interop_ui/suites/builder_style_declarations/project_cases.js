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

const { parameterSource, caller } = require('../static_parent_child_parameters/project_cases');
const { STATIC_INDEX_SOURCE } = require('../dynamic_calls_static_basic/source_cases');

function page(properties, fields = '@State counterSeed: number = 7;') {
  return caller(properties, fields).replace('PR14 parent/child parameters', 'Interop builder and style contract');
}
const builderSource = parameterSource.replace(
  "import { Component, Column, Text, Button } from '@ohos.arkui.component';",
  "import { Component, Column, Text, Button, BuilderParam, Builder } from '@ohos.arkui.component';").replace(
  '@State public count: number = 0;',
  `@State public count: number = 0;
  @BuilderParam public content: (value: number) => void = this.fallbackContent;
  @Builder
  fallbackContent(value: number): void {
    Text(value.toString())
  }`).replace(
  "Text('ArkTS 1.2 静态组件')", 'this.content(this.count)');

const fixtures = [
  {
    id: 'numeric-builder-slot',
    staticSource: builderSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed, content: this.dynamicContent',
      `@State counterSeed: number = 7;
  @Builder
  dynamicContent(value: number) {
    Text('content=' + value.toString()).id('typedBuilderContent')
  }`),
    expected: {
      properties: ['count', 'content'],
      assignments: [],
      bytecode: ['dynamicContent', '__options_has_content']
    },
    contract: {
      declaration: ['BuilderParam', 'content\\s*:\\s*\\(value\\s*:\\s*number\\)\\s*=>\\s*void'],
      caller: ['__Interop_transferCompatibleDynamicBuilder1_Internal', 'dynamicContent']
    }
  },
  {
    id: 'host-styles-with-static-child',
    staticSource: parameterSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed', `@State counterSeed: number = 7;
  @Styles
  focused() {
    .width('80%')
    .height(120)
  }`).replace("Text('Interop builder and style contract')",
      "Text('Interop builder and style contract').focused()"),
    expected: {
      properties: ['count'],
      assignments: [],
      bytecode: ['width', 'height', '__options_has_count']
    },
    contract: {
      declaration: ['struct StaticCounter'],
      caller: ['width', 'height', '__Interop_CreateStaticComponent_Internal']
    }
  },
  {
    id: 'host-text-extend-with-static-child',
    staticSource: parameterSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed').replace('@Entry',
      `@Extend(Text)
function tone() {
  .fontSize(18)
}
@Entry`).replace("Text('Interop builder and style contract')",
      "Text('Interop builder and style contract').tone()"),
    expected: {
      properties: ['count'],
      assignments: [],
      bytecode: ['fontSize', '__options_has_count']
    },
    contract: {
      declaration: ['count\\s*:\\s*number'],
      caller: ['fontSize', '__Interop_CreateStaticComponent_Internal']
    }
  }
];
module.exports = { fixtures };
