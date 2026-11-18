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
const { compileScenario } = require('../static_parent_child_parameters/compile.test');
const { fixtures } = require('./project_cases');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

async function compile(t, fixture) {
  const actual = await compileScenario(t, fixture);
  const text = fs.readFileSync(actual.paths.callerTransformedPage, 'utf8');
  const parsed = ts.createSourceFile(actual.paths.callerTransformedPage, text,
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
  t.equal(parsed.parseDiagnostics.length, 0);
  const exports = parsed.statements.filter(statement =>
    ts.isExportDeclaration(statement) && statement.moduleSpecifier &&
    statement.moduleSpecifier.text === fixture.exportContract.module);
  t.equal(exports.length, 1, 'SDK consumer must retain the exact normalized re-export identity');
  const declaration = exports[0];
  let names;
  if (fixture.exportContract.kind === 'namespace') {
    t.ok(ts.isNamespaceExport(declaration.exportClause));
    names = [declaration.exportClause.name.text];
  } else {
    t.ok(ts.isNamedExports(declaration.exportClause));
    names = declaration.exportClause.elements.map(element => element.name.text);
    t.equal(declaration.isTypeOnly, fixture.exportContract.kind === 'type');
  }
  t.deepEqual(names, fixture.exportContract.names);
  const generated = fs.readFileSync(actual.paths.staticDeclaration, 'utf8');
  t.includes(generated, 'StaticCounter');
  t.includes(generated, 'count');
  t.record('sdk-reexport-support', { boundary: fixture.boundary,
    compilerPipeline: 'SDK 26.0.0.35 declgenV1 and old TS bridge',
    source: fixture.caller, generatedDeclaration: actual.paths.staticDeclaration,
    consumedCaller: actual.paths.callerTransformedPage,
    normalizedExport: declaration.moduleSpecifier.text, kind: fixture.exportContract.kind, names,
    stages: actual.stages });
  return actual;
}

const cases = fixtures.map(fixture => ({
  id: `compile-${fixture.id}`,
  group: 'compile',
  direction: '11-to-12',
  run: t => compile(t, fixture)
}));

module.exports = { cases, compile };
