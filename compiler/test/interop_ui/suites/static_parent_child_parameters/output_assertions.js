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
const ts = require(path.resolve(__dirname, '../../../../node_modules/typescript'));
const { outputs } = require('./expected_outputs');
const fixtureIds = new Set(require('./source_cases').fixtures.map(fixture => fixture.id));
for (const id of Object.keys(outputs)) {
  if (!fixtureIds.has(id)) {
    throw new Error(`Unused output snapshot ${id}`);
  }
}

function tokens(code) {
  const scanner = ts.createScanner(ts.ScriptTarget.ES2021, true, ts.LanguageVariant.Standard, code);
  const result = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    result.push([token, scanner.getTokenValue() || scanner.getTokenText()]);
    token = scanner.scan();
  }
  return result;
}

function assertOutput(t, fixture, actual) {
  if (!Object.prototype.hasOwnProperty.call(outputs, fixture.id)) {
    return;
  }
  const actualCode = actual.branchOutput || actual.output;
  t.deepEqual(tokens(actualCode), tokens(outputs[fixture.id]),
    'Generated component tokens differ from the reviewed fixture contract');
}

module.exports = { assertOutput, tokens };
