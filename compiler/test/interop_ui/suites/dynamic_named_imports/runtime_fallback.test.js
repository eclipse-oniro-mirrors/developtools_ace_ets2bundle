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

const { executeFixture } = require('./transform_worker');

const operations = [
  {
    name: 'property-get',
    trap: 'get',
    expression: 'Reflect.get(Card, "missing")'
  },
  {
    name: 'property-set',
    trap: 'set',
    expression: 'Reflect.set(Card, "missing", 1)'
  },
  {
    name: 'property-has',
    trap: 'has',
    expression: 'Reflect.has(Card, "missing")'
  },
  {
    name: 'property-delete',
    trap: 'delete',
    expression: 'Reflect.deleteProperty(Card, "missing")'
  },
  {
    name: 'function-apply',
    trap: 'apply',
    expression: 'Reflect.apply(Card, undefined, [])'
  },
  {
    name: 'class-construct',
    trap: 'construct',
    expression: 'Reflect.construct(Card, [])'
  },
  {
    name: 'property-keys',
    trap: 'ownKeys',
    expression: 'Reflect.ownKeys(Card)'
  },
  {
    name: 'property-descriptor',
    trap: 'getOwnPropertyDescriptor',
    expression: 'Reflect.getOwnPropertyDescriptor(Card, "missing")'
  },
  {
    name: 'property-define',
    trap: 'defineProperty',
    expression: 'Reflect.defineProperty(Card, "missing", { value: 1 })'
  },
  {
    name: 'prototype-get',
    trap: 'getPrototypeOf',
    expression: 'Reflect.getPrototypeOf(Card)'
  },
  {
    name: 'prototype-set',
    trap: 'setPrototypeOf',
    expression: 'Reflect.setPrototypeOf(Card, {})'
  },
  {
    name: 'extensibility-get',
    trap: 'isExtensible',
    expression: 'Reflect.isExtensible(Card)'
  },
  {
    name: 'extensibility-prevent',
    trap: 'preventExtensions',
    expression: 'Reflect.preventExtensions(Card)'
  }
];

function fixtureFor(operation) {
  return {
    id: `fallback-${operation.name}`,
    metadata: { ExportedCard: { kind: 'class', name: 'ExportedCard', runtimeName: 'Lcards/Unavailable;' } },
    staticSource: "'use static'\nexport class ExportedCard {}\n",
    evaluate: true,
    runtimeFailure: 'native class unavailable',
    source: `import { ExportedCard as Card } from './Static';
let caught: Error | undefined = undefined;
try {
  ${operation.expression};
} catch (error) {
  caught = error as Error;
}
globalThis.probe = {
  failed: caught !== undefined,
  message: caught && caught.message,
  cause: caught && (caught as any).cause && (caught as any).cause.message
};
`
  };
}

function verifyFallback(t, operation) {
  const actual = executeFixture(t, fixtureFor(operation));
  t.deepEqual(actual.errors, []);
  t.equal(actual.runtime.probe.failed, true);
  t.includes(actual.runtime.probe.message, "Interop: Access failed on 'Card'");
  t.includes(actual.runtime.probe.message, `(${operation.trap})`);
  t.includes(actual.runtime.probe.message, 'native class unavailable');
  t.equal(actual.runtime.probe.cause, 'native class unavailable');
  t.equal(actual.runtime.fallbackLogs.length, 1);
  t.includes(actual.runtime.fallbackLogs[0], 'Load target Card failed');
  t.deepEqual(actual.runtime.runtimeCalls, [['getClass', 'Lcards/Unavailable;']]);
}

const cases = operations.map(operation => ({
  id: `fallback-${operation.name}`,
  group: 'unit',
  run: t => verifyFallback(t, operation)
}));

module.exports = { cases, operations, fixtureFor };
