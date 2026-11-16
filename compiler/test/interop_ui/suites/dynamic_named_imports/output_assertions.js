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

function bodyText(code) {
  const source = ts.createSourceFile('actual.ts', code, ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
  const statements = source.statements.filter(statement => !(ts.isFunctionDeclaration(statement) &&
    statement.name && ['__createLazy__', '__createUnsupportedObject__'].includes(statement.name.text)));
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printFile(ts.factory.updateSourceFile(source, statements));
}

function assertOutput(t, fixture, actual) {
  t.ok(Object.prototype.hasOwnProperty.call(outputs, fixture.id), `Missing reviewed output ${fixture.id}`);
  t.equal(bodyText(actual.output), outputs[fixture.id], 'Generated import body differs from the fixture contract');
}

module.exports = { assertOutput, bodyText };
