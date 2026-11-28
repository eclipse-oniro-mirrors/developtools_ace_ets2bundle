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
const { executeTransition } = require('./regeneration_worker');
const { fixtures: callable } = require('./callable_cases');
const { fixtures: models } = require('./model_cases');
const { fixtures: modules } = require('./module_cases');

function relativeHashes(files) {
  return Object.fromEntries(files.map(file => [file.relative, file.sha256]));
}

function assertConsumer(t, result, generated, diagnostics) {
  const adapters = new Map(generated.files.map(file => [file.path, file.sha256]));
  const entry = result.resolutions.find(item => item.specifier === 'generated');
  t.ok(entry, 'Missing generated declaration resolution');
  t.equal(entry.path, path.join(generated.output, 'src/main/ets/API.d.ets'));
  for (const resolved of result.resolutions) {
    t.equal(resolved.sha256, adapters.get(resolved.path), 'Resolution must consume this build output');
    t.greater(resolved.bytes, 0);
  }
  t.deepEqual(result.diagnostics.map(item => [item.code, item.line]), diagnostics);
  for (const item of result.diagnostics) {
    t.equal(item.file, 'Consumer.ets');
    t.greater(item.column, 0);
    t.greater(item.message.length, 0);
  }
}

function assertTransition(t, fixture, actual) {
  t.equal(actual.before.cache, actual.after.cache);
  t.ok(actual.cacheFiles.length > 0);
  const before = relativeHashes(actual.before.files);
  const after = relativeHashes(actual.after.files);
  t.deepEqual(Object.keys(before), Object.keys(after));
  t.deepEqual(after, relativeHashes(actual.cold.files));
  const changed = Object.keys(before).filter(name => before[name] !== after[name]);
  t.deepEqual(changed, fixture.changedDeclarations);
  assertConsumer(t, actual.original, actual.before, []);
  assertConsumer(t, actual.stale, actual.after, fixture.diagnostics);
  assertConsumer(t, actual.updated, actual.after, []);
  assertConsumer(t, actual.coldConsumers[0], actual.cold, fixture.diagnostics);
  assertConsumer(t, actual.coldConsumers[1], actual.cold, []);
  t.deepEqual(actual.stale.diagnostics, actual.coldConsumers[0].diagnostics);
  for (const [name, fragment] of Object.entries(fixture.newSignature)) {
    const output = actual.after.files.find(file => file.relative === name);
    t.ok(output, `Missing signature artifact ${name}`);
    t.includes(output.text, fragment);
  }
  t.record('consumer-diagnostics', { original: actual.original, stale: actual.stale,
    updated: actual.updated, cold: actual.coldConsumers, boundary: fixture.boundary });
}

const cases = [...callable, ...models, ...modules].map(fixture => ({
  id: fixture.id,
  direction: '12-to-11',
  group: 'unit',
  run(t) {
    assertTransition(t, fixture, executeTransition(t, fixture));
  }
}));

module.exports = { cases };
