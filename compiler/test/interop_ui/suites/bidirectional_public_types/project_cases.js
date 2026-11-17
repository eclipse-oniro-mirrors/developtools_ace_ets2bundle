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
const aliasSource = parameterSource.replace('@Component', 'export type Caption = string;\n@Component').replace(
  "@State public title: string = 'default';",
  "@State public title: string = 'default';\n  public caption: Caption = 'fallback';");
const callbackSource = parameterSource.replace(
  "@State public title: string = 'default';",
  `@State public title: string = 'default';
  public format: (value: number) => string = (value: number): string => value.toString();`).replace(
  'Text(this.title + this.cardEnabled.toString())', 'Text(this.format(this.count))');
function page(properties) {
  return caller(properties, '@State counterSeed: number = 7;')
    .replace('PR14 parent/child parameters', 'Interop public type contract');
}
const fixtures = [
  {
    id: 'exported-caption-alias',
    staticSource: aliasSource,
    staticIndex: STATIC_INDEX_SOURCE.replace('StaticCounter }', 'StaticCounter, Caption }'),
    caller: page("count: this.counterSeed, caption: 'typed alias'"),
    expected: {
      properties: ['count', 'caption'],
      assignments: [],
      bytecode: ['__options_has_caption', 'typed alias']
    },
    contract: {
      declaration: ['type Caption\\s*=\\s*string', 'caption\\s*:\\s*Caption'],
      caller: ['__options_has_caption', 'typed alias']
    }
  },
  {
    id: 'callback-return-contract',
    staticSource: callbackSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed, format: (value: number): string => value.toString()'),
    expected: {
      properties: ['count', 'format'],
      assignments: [],
      bytecode: ['__options_has_format', 'toString']
    },
    contract: {
      declaration: ['format\\s*:\\s*\\(value\\s*:\\s*number\\)\\s*=>\\s*string'],
      caller: ['__options_has_format', 'value.toString()']
    }
  }
];
module.exports = { fixtures };
