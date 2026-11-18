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

const invalidModes = [
  'missing-file',
  'invalid-json',
  'files-null',
  'root-null'
];

function invalidFixture(mode, typeOnly) {
  return {
    id: `metadata-${mode}-${typeOnly ? 'type-only' : 'value'}`,
    metadataMode: mode,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    staticSource: "'use static'\nexport class Card {}\n",
    evaluate: false,
    source: `import ${typeOnly ? 'type ' : ''}{ Card as LocalCard } from './Static';
const untouched = 'caller-body';
`
  };
}

function verifyInvalidMetadata(t, mode, typeOnly) {
  const actual = executeFixture(t, invalidFixture(mode, typeOnly));
  t.equal(actual.isolation, 'child-process');
  t.equal(actual.sourceContract.checker, 'real TypeScript Program');
  t.ok(actual.sourceContract.staticFile.endsWith('/Static.ets'));
  t.ok(actual.sourceContract.importer.endsWith('/Caller.ets'));
  t.deepEqual(actual.analysis.declarations, []);
  t.deepEqual(actual.analysis.helpers, []);
  t.deepEqual(actual.analysis.lookups, []);
  t.equal(actual.errors.length, typeOnly ? 0 : 1);
  t.deepEqual(actual.analysis.imports, typeOnly ? [] : ['./Static']);
  t.includes(actual.output, "const untouched = 'caller-body'");
  if (!typeOnly) {
    t.equal(actual.errors[0].code, '10310026');
    t.equal(actual.errors[0].pos, 0);
    t.includes(actual.errors[0].message, '/Static.ets');
  }
}

const cases = [];
for (const mode of invalidModes) {
  for (const typeOnly of [true, false]) {
    cases.push({
      id: `metadata-${mode}-${typeOnly ? 'type-only' : 'value'}`,
      group: 'unit',
      run: t => verifyInvalidMetadata(t, mode, typeOnly)
    });
  }
}

module.exports = { cases, invalidFixture };
