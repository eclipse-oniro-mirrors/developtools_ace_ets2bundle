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
const { fixtures } = require('./source_cases');

const selected = [
  'class-Card',
  'class-StaticCard',
  'function-createCard',
  'property-cardTheme',
  'renamed-runtime-function',
  'renamed-runtime-property',
  'multiline-import',
  'comment-between-bindings',
  '2-independent-exports',
  '3-independent-exports',
  '4-independent-exports',
  'one-export-2-aliases',
  'one-export-3-aliases',
  'separate-import-helper-dedup'
];

function expectedSourceName(metadata, exportedName) {
  if (metadata.kind === 'function' && metadata.localName) {
    return metadata.localName;
  }
  return exportedName;
}

function verifySourceBindings(t, fixture) {
  const actual = executeFixture(t, fixture);
  const bindings = actual.sourceContract.bindings;
  t.greater(bindings.length, 0);
  const locals = new Set();
  for (const binding of bindings) {
    t.equal(locals.has(binding.local), false);
    locals.add(binding.local);
    const metadata = fixture.metadata[binding.imported];
    t.ok(metadata, `No public metadata for ${binding.imported}`);
    t.equal(binding.target, expectedSourceName(metadata, binding.imported));
    t.equal(binding.kind, metadata.kind);
    t.ok(binding.sourceFile.endsWith('/Static.ets'));
    t.equal(binding.sourceFile, actual.sourceContract.staticFile);
    t.ok(actual.analysis.declarations.includes(binding.local));
  }
  t.record('source-bindings', {
    bindings,
    source: actual.sourceContract.staticFile,
    caller: actual.sourceContract.importer,
    resolution: actual.resolutions
  });
}

const cases = selected.map(id => {
  const fixture = fixtures.find(candidate => candidate.id === id);
  if (!fixture) {
    throw new Error(`Missing source-contract fixture ${id}`);
  }
  return {
    id: `source-contract-${id}`,
    group: 'unit',
    run: t => verifySourceBindings(t, fixture)
  };
});

module.exports = { cases, selected, expectedSourceName };
