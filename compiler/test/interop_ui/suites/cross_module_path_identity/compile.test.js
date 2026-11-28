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
const { AssertionContext, fileMetadata } = require('../dynamic_calls_static_basic/harness');
const { executeFullChain } = require('../dynamic_calls_static_basic/compile.test');
const { executeZipTest, listZipEntries } = require('../dynamic_calls_static_basic/toolchain');

function verify(t, folder) {
  const workspace = path.join(t.workspace, folder);
  fs.mkdirSync(workspace);
  const context = new AssertionContext(t.testCase, workspace, t.options);
  const result = executeFullChain(context);
  t.assertions += context.assertions;
  const { paths, tools } = result;
  const generatedMap = JSON.parse(fs.readFileSync(paths.declarationMap, 'utf8'));
  const snapshot = JSON.stringify(generatedMap);
  t.includes(snapshot, folder);
  t.includes(snapshot, 'StaticCounter.d.ets');
  t.ok(paths.staticDeclaration.startsWith(workspace + path.sep));
  t.ok(paths.callerTransformedPage.startsWith(workspace + path.sep));
  t.equal(executeZipTest(tools, paths.unsignedHap, workspace).exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, workspace);
  t.ok(entries.includes('ets/modules.abc'));
  t.ok(entries.includes('ets/modules_static.abc'));
  t.toolchain = context.toolchain;
  t.record('mixed-path-artifacts', { folder, declaration: fileMetadata(paths.staticDeclaration),
    caller: fileMetadata(paths.callerTransformedPage), entries, artifacts: result.summary });
}

const cases = [
  { id: 'space-in-project-directory', direction: '11-to-12', group: 'compile',
    run: t => verify(t, 'UI composition') },
  { id: 'punctuation-in-project-directory', direction: '11-to-12', group: 'compile',
    run: t => verify(t, 'UI package-v2.1') }
];

module.exports = { cases };
