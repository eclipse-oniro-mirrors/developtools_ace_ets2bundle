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

const { fixtures } = require('./source_cases');
const { executeFixture } = require('./evolution_worker');

function interfaceRecords(directives) {
  return directives.filter(text => text.startsWith('implements static:'))
    .flatMap(text => text.slice('implements static:'.length).split(','));
}

function assertClass(t, actual, expected) {
  t.equal(actual.name, expected.name);
  t.deepEqual(interfaceRecords(actual.directives), expected.records);
  t.equal(actual.directives.filter(text => text.startsWith('implements static:')).length,
    expected.records.length ? 1 : 0);
  t.equal(new Set(interfaceRecords(actual.directives)).size, expected.records.length);
  t.deepEqual(actual.methods, expected.methods);
  if (expected.signatures) {
    t.deepEqual(actual.signatures, expected.signatures);
  }
  if (expected.parameters !== null) {
    t.deepEqual(actual.parameters, expected.parameters);
  } else {
    t.equal(actual.parameters.length, 1);
    t.match(actual.parameters[0], /^\.\.\./);
  }
  if (expected.records.length) {
    t.match(actual.statements[0], /^['"]implements static:/);
  }
  if (expected.superCall) {
    const calls = actual.statements.filter(statement => statement.startsWith('super('));
    t.equal(calls.length, 1);
    if (expected.superCall.includes('...')) {
      t.match(calls[0], /^super\(\.\.\./);
    } else {
      t.equal(calls[0], expected.superCall + ';');
    }
  }
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  direction: '11-to-12',
  group: 'unit',
  run(t) {
    const actual = executeFixture(t, fixture);
    t.equal(actual.checker, 'real ohos-typescript Program');
    t.deepEqual(actual.errors, []);
    t.deepEqual(actual.analysis.imports, fixture.expected.imports);
    t.equal(actual.analysis.classes.length, fixture.expected.classes.length);
    t.deepEqual([...new Set(actual.diagnostics.map(d => d.code))], fixture.expected.diagnostics);
    for (let index = 0; index < fixture.expected.classes.length; index += 1) {
      assertClass(t, actual.analysis.classes[index], fixture.expected.classes[index]);
    }
    for (const diagnostic of actual.diagnostics) {
      t.greater(diagnostic.line, 0);
      t.greater(diagnostic.column, 0);
    }
    t.record('interface-heritage-contract', { boundary: fixture.boundary,
      source: fixture.source, expected: fixture.expected, actual: actual.analysis.classes });
  }
}));

module.exports = { cases };
