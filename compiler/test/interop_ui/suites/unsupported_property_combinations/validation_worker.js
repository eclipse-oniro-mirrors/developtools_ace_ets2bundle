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
const { spawnSync } = require('child_process');
const { production } = require('../dynamic_calls_static_basic/unit.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

function inspect(root, fixture) {
  const modules = production();
  const ui = require(path.join(COMPILER_ROOT, 'lib/process_ui_syntax'));
  const file = path.join(root, 'Card.ets');
  fs.writeFileSync(file, fixture.source);
  const source = ts.createSourceFile(file, fixture.source, ts.ScriptTarget.ES2021,
    true, ts.ScriptKind.ETS);
  if (source.parseDiagnostics.length) {
    throw new Error('Property fixture contains invalid syntax');
  }
  const struct = source.statements.find(ts.isStructDeclaration);
  if (!struct) {
    throw new Error('Property fixture has no struct declaration');
  }
  modules.validate.resetValidateUiSyntax();
  ui.transformLog.errors = [];
  ui.transformLog.sourceFile = source;
  try {
    const collected = modules.validate.getComponentSet(struct, fixture.uiCheck);
    const collections = {};
    const storageBindings = {};
    for (const [name, value] of Object.entries(collected)) {
      if (value instanceof Set) {
        collections[name] = Array.from(value);
      } else if (value instanceof Map) {
        collections[name] = Array.from(value.keys());
        storageBindings[name] = Array.from(value, ([property, keys]) => [property, Array.from(keys)]);
      }
    }
    const diagnostics = ui.transformLog.errors.map(diagnostic => {
      const point = source.getLineAndCharacterOfPosition(diagnostic.pos);
      return { code: diagnostic.code || null, type: diagnostic.type,
        message: diagnostic.message, file: path.basename(file),
        line: point.line + 1, column: point.character + 1 };
    });
    return { collections, storageBindings, diagnostics, parseErrors: source.parseDiagnostics.length,
      source: file, validation: 'repository-getComponentSet' };
  } finally {
    ui.transformLog.errors = [];
    modules.validate.resetValidateUiSyntax();
  }
}

function executeFixture(t, fixture) {
  const result = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(result.status, 0, result.stderr || 'Property validation worker failed');
  const file = path.join(t.workspace, 'property-result.json');
  const actual = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.record('actual-property-validation', { file, ...actual });
  return actual;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    const result = inspect(input.root, input.fixture);
    fs.writeFileSync(path.join(input.root, 'property-result.json'), JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture };
