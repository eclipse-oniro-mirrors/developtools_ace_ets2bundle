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
const lifecycleSource = parameterSource.replace(
  "@State public title: string = 'default';",
  `@State public title: string = 'default';
  public onEnter: (value: number) => void = (value: number): void => {};
  public onLeave: (value: number) => void = (value: number): void => {};
  aboutToDisappear(): void {
    this.onLeave(this.count);
  }`).replace(
  "console.info('[DynamicCallsStaticProbe] static component appeared');", 'this.onEnter(this.count);');
const eventSource = parameterSource.replace(
  "@State public title: string = 'default';",
  `@State public title: string = 'default';
  public onState: (value: number, label: string) => void =
    (value: number, label: string): void => {};`).replace(
  'this.count += 1;', 'this.count += 1;\n        this.onState(this.count, this.title);');
const resultSource = parameterSource.replace(
  "@State public title: string = 'default';",
  `@State public title: string = 'default';
  public describe: (value: number) => string | null = (value: number): string | null => null;`).replace(
  'Text(this.title + this.cardEnabled.toString())', "Text(this.describe(this.count) ?? 'empty')");
function page(parameters, fields) {
  return caller(parameters, '@State counterSeed: number = 7;\n  ' + fields)
    .replace('PR14 parent/child parameters', 'Interop lifecycle and event signature');
}
const fixtures = [
  {
    id: 'typed-lifecycle-callbacks',
    staticSource: lifecycleSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page(`count: this.counterSeed,
        onEnter: (value: number): void => { this.lastEnter = value; },
        onLeave: (value: number): void => { this.lastLeave = value; }`,
    '@State lastEnter: number = -1;\n  @State lastLeave: number = -1;'),
    expected: {
      properties: ['count', 'onEnter', 'onLeave'],
      assignments: [],
      bytecode: ['lastEnter', 'lastLeave', '__options_has_onEnter', '__options_has_onLeave']
    },
    contract: {
      declaration: ['onEnter\\s*:\\s*\\(value\\s*:\\s*number\\)\\s*=>\\s*void',
        'aboutToAppear\\(\\)\\s*:\\s*void', 'aboutToDisappear\\(\\)\\s*:\\s*void'],
      caller: ['this.lastEnter = value', 'this.lastLeave = value', '__options_has_onLeave']
    }
  },
  {
    id: 'ordered-ui-event-parameters',
    staticSource: eventSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed, onState: this.acceptState.bind(this)',
      `@State lastLabel: string = '';
  acceptState(value: number, label: string): void {
    this.counterSeed = value;
    this.lastLabel = label;
  }`),
    expected: {
      properties: ['count', 'onState'],
      assignments: [],
      bytecode: ['acceptState', '__options_has_onState']
    },
    contract: {
      declaration: ['onState\\s*:\\s*\\(value\\s*:\\s*number,\\s*label\\s*:\\s*string\\)\\s*=>\\s*void'],
      caller: ['this.acceptState.bind(this)', '__options_has_onState']
    }
  },
  {
    id: 'nullable-event-return',
    staticSource: resultSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page(`count: this.counterSeed,
        describe: (value: number): string | null => value > 0 ? value.toString() : null`,
    '@State lastEnter: number = -1;'),
    expected: {
      properties: ['count', 'describe'],
      assignments: [],
      bytecode: ['__options_has_describe', 'toString']
    },
    contract: {
      declaration: ['describe\\s*:\\s*\\(value\\s*:\\s*number\\)\\s*=>\\s*string\\s*\\|\\s*null'],
      caller: ['__options_has_describe', 'value.toString()', 'null']
    }
  }
];
module.exports = { fixtures };
