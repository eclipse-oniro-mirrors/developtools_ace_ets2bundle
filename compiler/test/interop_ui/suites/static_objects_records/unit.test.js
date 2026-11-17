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

const path = require('path');
const { fixtures } = require('./source_cases');
const { executeFixture } = require('./evolution_worker');

function assignedKey(text) {
  const member = text.match(/\.([^.[\]]+)$/);
  if (member) {
    return member[1];
  }
  const element = text.match(/\[([^\]]+)\]$/);
  return element && element[1].replace(/^['"]|['"]$/g, '');
}

function assertContract(t, fixture, actual) {
  t.equal(actual.checker, 'real ohos-typescript Program');
  t.ok(actual.output.length > 0);
  t.equal(path.basename(actual.declaration), 'Models.d.ets');
  t.deepEqual(actual.analysis.imports, ['models']);
  t.deepEqual(actual.analysis.records, fixture.expected.records);
  const assignments = actual.analysis.assignments.filter(a => a.left.includes('.') || a.left.includes('['));
  t.deepEqual(assignments.map(a => assignedKey(a.left)), fixture.expected.properties);
  t.deepEqual([...new Set(actual.diagnostics.map(d => d.code))], fixture.expected.diagnostics);
  for (const diagnostic of actual.diagnostics) {
    t.ok(diagnostic.file.endsWith('.ets') || diagnostic.file.endsWith('.ts'));
    t.greater(diagnostic.line, 0);
    t.greater(diagnostic.column, 0);
  }
  const errorCodes = actual.errors.map(error => error.message.match(/Code: (\d+)/)[1]);
  t.deepEqual(errorCodes, fixture.expected.errorCodes || []);
  for (const error of actual.errors) {
    t.equal(error.type, 'ERROR');
    t.greater(error.pos, 0);
    t.includes(error.message, 'no-argument constructor');
  }
  for (const snippet of fixture.expected.contains) {
    t.includes(actual.output, snippet);
  }
  const recordLookup = fixture.expected.records.includes('Lstd.core.Record;');
  t.equal(actual.analysis.lookups.filter(l => l.method === 'getInstance').length, recordLookup ? 1 : 0);
  t.equal(actual.analysis.lookups.filter(l => l.method === 'getClass').length,
    fixture.expected.records.length - (recordLookup ? 1 : 0));
  if (recordLookup) {
    t.ok(actual.contextual.some(c => c.staticRecord));
    t.equal(actual.analysis.constructors.length, 0);
  }
  if (Object.prototype.hasOwnProperty.call(fixture.expected, 'runtime')) {
    t.ok(actual.runtime);
    t.deepEqual(actual.runtime.values, [fixture.expected.runtime]);
    t.deepEqual(actual.runtime.lookups, fixture.expected.records);
  }
  t.record('case-boundary', { id: fixture.id, boundary: fixture.boundary,
    source: fixture.source, expected: fixture.expected, contextualTypes: actual.contextual });
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  direction: '11-to-12',
  group: 'unit',
  run(t) {
    return assertContract(t, fixture, executeFixture(t, fixture));
  }
}));

module.exports = { cases, assertContract };
