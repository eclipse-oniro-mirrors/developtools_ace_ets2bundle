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

const { fixtures: lifecycleCases } = require('../lifecycle_event_signatures/project_cases');

function negative(id, base, invalidCaller, fragments, anchor) {
  const lines = invalidCaller.split('\n');
  const index = lines.findIndex(line => line.includes(anchor));
  if (index < 0 || invalidCaller === base.caller) {
    throw new Error(`Callback negative fixture ${id} was not materialized`);
  }
  return {
    id,
    boundary: 'The generated UI callback rejects an incompatible caller and accepts its repaired signature.',
    staticSource: base.staticSource,
    staticIndex: base.staticIndex,
    invalidCaller,
    validCaller: base.caller,
    diagnostic: { code: '10505001', line: index + 1, anchor, fragments },
    recovery: {
      declaration: ['StaticCounter', 'count', 'title', 'cardEnabled'],
      caller: ['__Interop_CreateStaticComponent_Internal', '__options_has_count']
    }
  };
}

const event = lifecycleCases[1];
const result = lifecycleCases[2];
const lifecycle = lifecycleCases[0];
const fixtures = [
  negative('event-parameter-domain', event,
    event.caller.replace('onState: this.acceptState.bind(this)',
      'onState: (value: string, label: string): void => {}'),
    ['string', 'number', 'not assignable'], 'onState:'),
  negative('callback-result-domain', result,
    result.caller.replace('(value: number): string | null => value > 0 ? value.toString() : null',
      '(value: number): number => value'),
    ['number', 'string', 'not assignable'], 'describe:'),
  negative('callback-value-not-callable', lifecycle,
    lifecycle.caller.replace('onEnter: (value: number): void => { this.lastEnter = value; }',
      'onEnter: 1'),
    ['number', 'not assignable'], 'onEnter:')
];

module.exports = { fixtures };
