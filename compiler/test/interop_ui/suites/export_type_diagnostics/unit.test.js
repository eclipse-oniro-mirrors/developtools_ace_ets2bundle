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
const { fixtures } = require('./source_cases');
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
    t.equal(diagnostics.length, 1, JSON.stringify(diagnostics));
    const diagnostic = diagnostics[0];
    for (const field of ['code', 'file', 'line', 'column']) {
      t.equal(diagnostic[field], fixture.expected[field], JSON.stringify(diagnostic));
    }
    for (const fragment of fixture.expected.fragments) {
      t.includes(diagnostic.message, fragment);
    }
  }
  t.record('generated-export-diagnostic', { boundary: fixture.boundary, positive,
    source: fixture.source, consumer: positive ? fixture.validConsumer : fixture.consumer,
    generatedPath: actual.outputPath, generated: actual.text, diagnostics });
}

const cases = fixtures.flatMap(fixture => [false, true].map(positive => ({
  id: `${fixture.id}-${positive ? 'repaired' : 'rejected'}`,
  group: 'unit',
  direction: '12-to-11',
  run: t => check(t, fixture, positive)
})));

cases.push(...require('./module_contract.test').cases);

module.exports = { cases };
