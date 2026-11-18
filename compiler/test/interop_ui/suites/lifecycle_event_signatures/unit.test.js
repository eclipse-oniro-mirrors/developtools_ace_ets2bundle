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
const { executeFixture } = require('./declaration_worker');

function assertResourcesAndConsumer(t, fixture, actual) {
  for (const node of [...actual.inspection.symbols, ...actual.inspection.members]) {
    t.greater(node.line, 0);
    t.greater(node.column, 0);
  }
  t.equal(actual.stats.programsCreated, actual.stats.programReferencesReleased);
  t.equal(actual.stats.typeCheckersCreated, actual.stats.typeCheckersReleased);
  t.equal(actual.stats.tempDirectoriesCreated, actual.stats.tempDirectoriesRemoved);
  t.equal(actual.stats.declgenStateSnapshots, actual.stats.declgenStateRestores);
  if (fixture.mode === 'declgen') {
    t.equal(actual.stats.declgenRuns, 2);
    t.equal(actual.stats.declgenRepeatChecks, 1);
  }
  if (fixture.consumer) {
    t.equal(actual.consumer.checker, 'real ohos-typescript Program');
    if (fixture.expected.consumerDiagnostics) {
      t.deepEqual(actual.consumer.diagnostics.map(d => ({ code: d.code, line: d.line })),
        fixture.expected.consumerDiagnostics);
    }
    t.deepEqual([...new Set(actual.consumer.diagnostics.map(d => d.code))], fixture.expected.consumerCodes);
    t.equal(actual.consumer.imports.length, 1);
    t.equal(actual.consumer.imports[0].resolved, actual.outputPath);
    t.greater(actual.consumer.imports[0].bytes, 0);
    for (const diagnostic of actual.consumer.diagnostics) {
      t.equal(diagnostic.file, 'Consumer.ets');
      t.greater(diagnostic.line, 0);
      t.greater(diagnostic.column, 0);
    }
  }
  if (fixture.expected.imports) {
    t.deepEqual(actual.inspection.imports, fixture.expected.imports);
  }
}

function assertContract(t, fixture, actual) {
  t.greater(actual.bytes, 0);
  t.equal(actual.mode, fixture.mode);
  t.deepEqual(actual.diagnostics, []);
  t.deepEqual(actual.inspection.symbols.map(s => s.name), fixture.expected.symbols);
  for (const contract of fixture.expected.members || []) {
    const member = actual.inspection.members.find(m => m.owner === contract.owner && m.name === contract.name);
    t.ok(member, `Missing ${contract.owner}.${contract.name}`);
    for (const [key, expected] of Object.entries(contract)) {
      t.deepEqual(member[key], expected, `${contract.owner}.${contract.name} ${key}`);
    }
  }
  for (const contract of fixture.expected.types || []) {
    const symbol = actual.inspection.symbols.find(s => s.name === contract.name);
    t.ok(symbol, `Missing public type ${contract.name}`);
    for (const [key, expected] of Object.entries(contract)) {
      t.deepEqual(symbol[key], expected, `${contract.name} ${key}`);
    }
  }
  for (const required of fixture.expected.contains || []) {
    t.includes(actual.text, required);
  }
  for (const forbidden of fixture.expected.absent || []) {
    t.notIncludes(actual.text, forbidden);
  }
  assertResourcesAndConsumer(t, fixture, actual);
  t.record('declaration-boundary', { id: fixture.id, boundary: fixture.boundary,
    source: fixture.source, consumer: fixture.consumer, expected: fixture.expected });
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  direction: fixture.direction || '12-to-11',
  group: 'unit',
  run(t) {
    return assertContract(t, fixture, executeFixture(t, fixture));
  }
}));

module.exports = { cases, assertContract };
