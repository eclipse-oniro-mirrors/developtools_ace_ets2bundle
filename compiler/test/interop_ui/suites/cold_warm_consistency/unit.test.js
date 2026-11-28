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
const { generateDeclarations } = require('../static_multifile_exports/declaration.test');
const {
  assertOrigins, assertRelativeModulesResolve, buildDeclarationGraph
} = require('../static_multifile_exports/declaration_ast');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const { fixtures: models } = require('./model_cases');
const { fixtures: controls } = require('./control_cases');
const { fixtures: exportsCases } = require('./export_cases');
const { fixtures: callers } = require('./consumer_cases');
const { consume } = require('./consumer_checker');

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function snapshot(t, workspace, files, fixture, phase) {
  const generated = generateDeclarations(workspace, Object.keys(fixture.sources), 'generated');
  const graph = buildDeclarationGraph(generated.declarations);
  const dependencies = assertRelativeModulesResolve(graph);
  const origins = assertOrigins(graph, fixture.origins);
  const wrappers = {};
  for (const [key, declaration] of Object.entries(generated.declarations)) {
    const source = generated.declarationMap.files[key];
    t.equal(source.declPath, declaration.path);
    t.equal(source.filePath, files[key + '.ets']);
    for (const fragment of fixture.signatures[key] || []) {
      t.includes(declaration.content, fragment);
    }
    const copy = write(workspace.root, `snapshots/${phase}/${key}.d.ets`, declaration.content);
    const bytes = fileMetadata(copy);
    t.equal(bytes.sha256, fileMetadata(declaration.path).sha256);
    wrappers[key] = { ohmUrl: declaration.ohmUrl, sha256: bytes.sha256, bytes: bytes.bytes };
  }
  const diagnostics = fixture.caller ? consume(workspace.root, fixture.caller, generated.declarations) : [];
  t.deepEqual(diagnostics.map(item => [item.code, item.line]), fixture.diagnostics || []);
  return { wrappers, origins, dependencies, diagnostics };
}

function run(t, fixture) {
  const workspace = { root: t.workspace, write: (relative, text) => write(t.workspace, relative, text) };
  const input = Object.fromEntries(Object.entries(fixture.sources)
    .map(([relative, source]) => [relative, write(t.workspace, `dynamic_component/${relative}`, source)]));
  const sourcePaths = Object.values(input);
  const before = sourcePaths.map(fileMetadata);
  const cache = path.join(t.workspace, 'build/.declgen-cache');
  t.ok(!fs.existsSync(cache));
  const cold = snapshot(t, workspace, input, fixture, 'cold');
  const retained = fs.readdirSync(cache).sort();
  t.ok(retained.length > 0, 'Declgen did not create reusable cache artifacts');
  const warm = snapshot(t, workspace, input, fixture, 'warm');
  t.deepEqual(sourcePaths.map(fileMetadata), before);
  t.deepEqual(cold, warm);
  t.deepEqual(fs.readdirSync(cache).sort(), retained);
  const evidence = path.join(t.workspace, 'evidence/cold-warm.json');
  writeJson(evidence, { cold, warm, input: before, cache, retained });
  t.record('declaration-cache-comparison', { evidence, comparison: warm, boundary: fixture.boundary });
}

const cases = [...models, ...controls, ...exportsCases, ...callers].map(fixture => ({
  id: fixture.id,
  direction: '12-to-11',
  group: 'unit',
  run: t => run(t, fixture)
}));

module.exports = { cases };
