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

const assert = require('assert');
const path = require('path');
const {
  linkDependency,
  projectContract,
  projectFiles
} = require('../static_calls_dynamic_basic/project_files');

function builderProjectFiles(sdkRoot, testCase) {
  assert.ok(testCase && testCase.calleeFile && testCase.callee && testCase.caller,
    'a compile case must provide independent caller and callee sources');
  assert.ok(!testCase.calleeFile.includes('/') && testCase.calleeFile.endsWith('.ets'),
    `invalid callee file name: ${testCase.calleeFile}`);
  const files = projectFiles(sdkRoot);
  delete files['dynamic_component/src/main/ets/DynamicCounter.ets'];
  files[`dynamic_component/src/main/ets/${testCase.calleeFile}`] = testCase.callee;
  files['dynamic_component/Index.ets'] = testCase.index;
  files['entry/src/main/ets/pages/Index.ets'] = testCase.caller;
  files['AppScope/resources/base/element/string.json'] =
    files['AppScope/resources/base/element/string.json'].replace(
      'Interop UI PR01', `Interop UI PR08 ${testCase.id}`);
  return files;
}

function materializeCompileProject(workspace, sdkRoot, testCase) {
  const files = builderProjectFiles(sdkRoot, testCase);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, 'dynamic_component', 'dynamic_component');
  return {
    projectRoot: workspace.root,
    dependency,
    fileCount: Object.keys(files).length,
    callerSource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    calleeSource: path.join(workspace.root,
      `dynamic_component/src/main/ets/${testCase.calleeFile}`),
    dynamicIndex: path.join(workspace.root, 'dynamic_component/Index.ets'),
    buildContract: projectContract()
  };
}

module.exports = {
  builderProjectFiles,
  materializeCompileProject,
  projectContract
};
