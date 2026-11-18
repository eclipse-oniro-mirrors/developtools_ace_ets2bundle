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

const fixtures = [
  ...require('./source_cases').fixtures,
  ...require('./concurrent_cases').fixtures
];
const { executeFixture } = require('./import_worker');

function reportKnownFailure(t, fixture, actual) {
  const fixed = JSON.stringify(actual.analysis.bridges) === JSON.stringify(fixture.expected.bridges);
  const error = new Error(fixed ? 'Known failure expectation needs review after a compiler change' :
    fixture.knownFailure.message);
  if (!fixed) {
    t.deepEqual(actual.analysis.bridges, fixture.knownFailure.observed);
  }
  Object.assign(error, { stage: 'concurrent-import-value-analysis',
    category: fixed ? 'implementation' : 'existing',
    code: fixed ? 'STALE_KNOWN_FAILURE' : fixture.knownFailure.code,
    details: { source: fixture.source, expected: fixture.expected.bridges,
      actual: actual.analysis.bridges } });
  throw error;
}

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  group: 'unit',
  direction: '11-to-12',
  run(t) {
    const actual = executeFixture(t, fixture);
    t.equal(actual.analysis.parseErrors, 0);
    t.equal(new Set(actual.analysis.bridges).size, actual.analysis.bridges.length);
    t.equal(new Set(actual.analysis.imports).size, actual.analysis.imports.length);
    t.ok(actual.sourceFile.endsWith('Caller.ets'));
    t.ok(actual.staticFile.endsWith('Static.ets'));
    t.greater(actual.output.length, 0);
    t.ok(actual.errors.every(error => error.type === 'ERROR'));
    t.equal(actual.concurrentFlag, fixture.concurrent);
    if (fixture.knownFailure) {
      reportKnownFailure(t, fixture, actual);
    }
    t.deepEqual(actual.analysis.bridges, fixture.expected.bridges);
    t.deepEqual(actual.analysis.imports, fixture.expected.imports);
    t.equal(actual.analysis.dynamicImports, fixture.expected.dynamicImports);
    t.equal(actual.analysis.reexports.length, fixture.expected.reexports);
    t.equal(actual.errors.length, fixture.expected.errors.length);
    for (let index = 0; index < actual.errors.length; index += 1) {
      const diagnostic = actual.errors[index];
      const expected = fixture.expected.errors[index];
      t.equal(diagnostic.code, expected.code);
      t.equal(diagnostic.pos, expected.pos);
      for (const fragment of expected.fragments) {
        t.includes(diagnostic.message, fragment);
      }
      t.includes(diagnostic.message, actual.staticFile);
    }
    for (const fragment of fixture.expected.contains) {
      t.includes(actual.output, fragment);
    }
    for (const fragment of fixture.expected.absent) {
      t.notIncludes(actual.output, fragment);
    }
    for (const bridge of fixture.expected.bridges) {
      t.includes(actual.output, `${bridge} as `);
      t.match(actual.output, new RegExp(`export (?:const|namespace) ${bridge}`));
    }
    t.record('restricted-import-contract', { boundary: fixture.boundary,
      source: fixture.source, expected: fixture.expected, analysis: actual.analysis });
  }
}));

module.exports = { cases };
