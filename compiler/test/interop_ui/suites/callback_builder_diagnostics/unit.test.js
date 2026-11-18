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

const fs = require('fs');
const path = require('path');
const { fixtures } = require('./callback_cases');
const { executeFixture } = require('../bidirectional_public_types/declaration_worker');

function check(t, fixture, positive) {
  const actual = executeFixture(t, { ...fixture,
    consumer: positive ? fixture.validConsumer : fixture.consumer });
  t.greater(actual.text.length, 0);
  t.ok(fs.existsSync(actual.outputPath));
  t.equal(actual.consumer.checker, 'real ohos-typescript Program');
  t.equal(actual.consumer.generatedPath, actual.outputPath);
  t.greater(actual.consumer.imports.length, 0);
  for (const imported of actual.consumer.imports) {
    t.equal(path.resolve(imported.resolved), path.resolve(actual.outputPath));
    t.greater(imported.bytes, 0);
  }
  const diagnostics = actual.consumer.diagnostics;
  if (positive) {
    t.deepEqual(diagnostics, [], 'The repaired consumer must accept the freshly generated declaration');
  } else {
    const expected = fixture.expected.diagnostics || [fixture.expected];
    t.equal(diagnostics.length, expected.length, JSON.stringify(diagnostics));
    for (let index = 0; index < diagnostics.length; index += 1) {
      const diagnostic = diagnostics[index];
      for (const field of ['code', 'file', 'line', 'column']) {
        t.equal(diagnostic[field], expected[index][field], JSON.stringify(diagnostic));
      }
      for (const fragment of expected[index].fragments) {
        t.includes(diagnostic.message, fragment);
      }
    }
  }
  t.record('generated-callback-diagnostic', { boundary: fixture.boundary, positive,
    source: fixture.source, consumer: positive ? fixture.validConsumer : fixture.consumer,
    generatedPath: actual.outputPath, generated: actual.text, diagnostics });
}

const cases = fixtures.flatMap(fixture => [false, true].map(positive => ({
  id: `${fixture.id}-${positive ? 'repaired' : 'rejected'}`,
  group: 'unit',
  direction: '12-to-11',
  run: t => check(t, fixture, positive)
})));

cases.push(...require('./builder_reference.test').cases);

module.exports = { cases };
