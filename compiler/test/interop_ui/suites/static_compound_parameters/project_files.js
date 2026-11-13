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
const {
  linkDependency,
  projectFiles: basicProjectFiles
} = require('../static_calls_dynamic_basic/project_files');
const {
  compoundModels,
  entryAbility,
  moduleIdentity,
  scenarios
} = require('./source_cases');

function replaceProjectIdentity(content) {
  return content
    .replaceAll('com.example.interopuipr01', moduleIdentity.bundleName)
    .replaceAll('Interop UI PR01', 'Interop UI PR07')
    .replaceAll('InteropUiPr01', 'InteropUiPr07');
}

function compoundProjectFiles(sdkRoot, scenarioId = 'compound') {
  const scenario = scenarios[scenarioId];
  if (!scenario) {
    throw new Error(`unknown compound scenario: ${scenarioId}`);
  }
  const files = basicProjectFiles(sdkRoot);
  for (const [relativePath, content] of Object.entries(files)) {
    if (typeof content === 'string') {
      files[relativePath] = replaceProjectIdentity(content);
    }
  }
  delete files['dynamic_component/src/main/ets/DynamicCounter.ets'];
  files['dynamic_component/Index.ets'] = scenario.indexSource;
  files[`dynamic_component/src/main/ets/${scenario.componentFile}`] = scenario.componentSource;
  files['dynamic_component/src/main/ets/CompoundModels.ets'] = compoundModels;
  files['entry/src/main/ets/pages/Index.ets'] = scenario.callerSource;
  files['entry/src/main/ets/entryability/EntryAbility.ets'] = entryAbility;
  files['entry/src/main/resources/base/element/string.json'] = `{
  "string": [
    {
      "name": "module_desc",
      "value": "PR07 static caller consuming compound dynamic parameters"
    }
  ]
}
`;
  files['AppScope/resources/base/element/string.json'] = `{
  "string": [
    {
      "name": "app_name",
      "value": "Interop UI PR07 compound parameters"
    }
  ]
}
`;
  return files;
}

function materializeCompoundProject(workspace, sdkRoot, scenarioId = 'compound') {
  const files = compoundProjectFiles(sdkRoot, scenarioId);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, 'dynamic_component', 'dynamic_component');
  const scenario = scenarios[scenarioId];
  const dynamicFiles = [
    path.join(workspace.root, 'dynamic_component/Index.ets'),
    path.join(workspace.root, `dynamic_component/src/main/ets/${scenario.componentFile}`),
    path.join(workspace.root, 'dynamic_component/src/main/ets/CompoundModels.ets')
  ];
  return {
    projectRoot: workspace.root,
    dependency,
    dynamicFiles,
    fileCount: Object.keys(files).length,
    callerSource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    componentSource: dynamicFiles[1],
    modelSource: dynamicFiles[2],
    scenario,
    scenarioId
  };
}

function expectedGeneratedRelativePaths(scenarioId = 'compound') {
  const scenario = scenarios[scenarioId];
  return [
    'Index.d.ets',
    `src/main/ets/${scenario.componentFile.replace(/\.ets$/, '.d.ets')}`,
    'src/main/ets/CompoundModels.d.ets'
  ].sort();
}

module.exports = {
  compoundProjectFiles,
  expectedGeneratedRelativePaths,
  materializeCompoundProject,
  replaceProjectIdentity
};
