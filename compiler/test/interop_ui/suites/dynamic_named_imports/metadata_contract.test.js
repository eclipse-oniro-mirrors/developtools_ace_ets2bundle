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

const schemaCases = [
  {
    mode: 'missing-file',
    reason: 'A configured metadata path that does not exist must not create runtime bindings'
  },
  {
    mode: 'invalid-json',
    reason: 'Malformed JSON is diagnosed by the import stage with the configured source identity'
  },
  {
    mode: 'files-missing',
    reason: 'A document without a files map must not be treated as valid symbol metadata'
  },
  {
    mode: 'files-null',
    reason: 'A null files value must be rejected before a path lookup'
  },
  {
    mode: 'files-array',
    reason: 'An array with no absolute source key cannot provide the imported symbol'
  },
  {
    mode: 'files-string',
    reason: 'A string files value cannot provide the imported symbol'
  },
  {
    mode: 'root-null',
    reason: 'The resolved file entry must contain an object root'
  },
  {
    mode: 'root-array',
    reason: 'An array root must not accidentally create the named class binding'
  },
  {
    mode: 'root-string',
    reason: 'A string root must not accidentally create the named class binding'
  },
  {
    mode: 'entry-missing',
    reason: 'Metadata for other files cannot satisfy the resolved static target'
  },
  {
    mode: 'entry-other-path',
    reason: 'The complete normalized absolute path must match instead of only a prefix'
  }
];

function missingMetadataFixture(testCase) {
  return {
    id: `metadata-${testCase.mode}`,
    metadataMode: testCase.mode,
    metadata: {
      Card: { kind: 'class', name: 'Card', runtimeName: 'Lcards/Card;' }
    },
    staticSource: "'use static'\nexport class Card {}\n",
    evaluate: false,
    source: `import { Card as LocalCard } from './Static';
const untouched = 'caller-body';
`
  };
}

function verifyMissingMetadata(t, testCase) {
  const actual = executeFixture(t, missingMetadataFixture(testCase));
  t.deepEqual(actual.analysis.declarations, []);
  t.deepEqual(actual.analysis.helpers, []);
  t.deepEqual(actual.analysis.lookups, []);
  t.deepEqual(actual.analysis.imports, ['./Static']);
  t.equal(actual.errors.length, 1);
  const diagnostic = actual.errors[0];
  t.equal(diagnostic.code, '10310026');
  t.equal(diagnostic.type, 'ERROR');
  t.equal(diagnostic.description, 'ArkTS: ERROR');
  t.equal(diagnostic.pos, 0);
  t.includes(diagnostic.message, 'Missing static interop metadata');
  t.includes(diagnostic.message, '/Static.ets');
  t.includes(diagnostic.message, 'Current module is');
  t.includes(diagnostic.message, 'interop-config.json5');
  t.includes(actual.output, "const untouched = 'caller-body'");
  t.record('schema-contract', testCase);
}

const cases = schemaCases.map(testCase => ({
  id: `metadata-${testCase.mode}`,
  group: 'unit',
  run: t => verifyMissingMetadata(t, testCase)
}));

module.exports = { cases, schemaCases, missingMetadataFixture };
