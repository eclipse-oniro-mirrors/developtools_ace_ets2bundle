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
const {
  linkDependency,
  projectFiles: basicProjectFiles
} = require('../static_calls_dynamic_basic/project_files');
const {
  assert,
  readNonemptyFile
} = require('../static_calls_dynamic_basic/harness');
const {
  DYNAMIC_PROJECT_FILES,
  ENTRY_ABILITY,
  PACKAGE_NAME,
  STATIC_CALLER
} = require('./source_cases');
const { declarationKey } = require('./declaration_ast');

const DYNAMIC_SOURCE_KEYS = Object.keys(DYNAMIC_PROJECT_FILES)
  .map(declarationKey)
  .sort();

function createProjectFiles(sdkRoot) {
  assert.strictEqual(typeof sdkRoot, 'string');
  assert.ok(sdkRoot.length > 0 && !/[\r\n]/.test(sdkRoot), 'a portable SDK root is required');
  const files = basicProjectFiles(sdkRoot);
  delete files['dynamic_component/src/main/ets/DynamicCounter.ets'];
  files['entry/src/main/ets/pages/Index.ets'] = STATIC_CALLER;
  files['entry/src/main/ets/entryability/EntryAbility.ets'] = ENTRY_ABILITY;
  files['AppScope/app.json5'] = files['AppScope/app.json5']
    .replace('com.example.interopuipr01', 'com.example.interopuipr10');
  files['AppScope/resources/base/element/string.json'] = files['AppScope/resources/base/element/string.json']
    .replace('Interop UI PR01', 'Interop UI PR10');
  for (const [relativePath, content] of Object.entries(DYNAMIC_PROJECT_FILES)) {
    files[`dynamic_component/${relativePath}`] = content;
  }
  return files;
}

function materializeProject(workspace, sdkRoot) {
  const files = createProjectFiles(sdkRoot);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, PACKAGE_NAME, PACKAGE_NAME);
  const written = Object.keys(files).sort();
  for (const key of DYNAMIC_SOURCE_KEYS) {
    const source = path.join(workspace.root, PACKAGE_NAME, `${key}.ets`);
    assert.ok(fs.existsSync(source), `dynamic source was not materialized: ${source}`);
  }
  return {
    projectRoot: workspace.root,
    dependency,
    fileCount: written.length,
    files: written,
    callerSource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    abilitySource: path.join(workspace.root, 'entry/src/main/ets/entryability/EntryAbility.ets'),
    dynamicSources: DYNAMIC_SOURCE_KEYS.map(key => path.join(workspace.root, PACKAGE_NAME, `${key}.ets`))
  };
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function sourcePath(workspace, key) {
  return path.join(workspace.root, PACKAGE_NAME, `${key}.ets`);
}

function declarationPath(workspace, outputRoot, key) {
  return path.join(workspace.root, outputRoot, `${key}.d.ets`);
}

function ohmUrl(key, version = '') {
  return `@normalized:N&&&${PACKAGE_NAME}/${key}&${version}`;
}

function readDeclarations(workspace, outputRoot, keys = DYNAMIC_SOURCE_KEYS) {
  const declarations = {};
  for (const key of keys) {
    const filePath = declarationPath(workspace, outputRoot, key);
    declarations[key] = {
      content: readNonemptyFile(filePath, 'declgenV2'),
      path: filePath,
      sourcePath: sourcePath(workspace, key),
      ohmUrl: ohmUrl(key)
    };
  }
  return declarations;
}

function createCurrentDeclarationMap(workspace, outputRoot, keys = DYNAMIC_SOURCE_KEYS) {
  const files = {};
  for (const key of keys) {
    files[key] = {
      declPath: declarationPath(workspace, outputRoot, key),
      filePath: sourcePath(workspace, key),
      ohmUrl: ohmUrl(key)
    };
  }
  return { packageName: PACKAGE_NAME, files };
}

function projectContract() {
  return {
    product: 'default',
    module: 'entry',
    target: 'default',
    buildMode: 'debug',
    callerLanguage: '1.2',
    calleeLanguage: '1.1',
    callerModuleType: 'entry',
    calleeModuleType: 'har',
    dependency: PACKAGE_NAME,
    buildTasks: ['clean', 'assembleHap']
  };
}

function validateProjectSources(files) {
  assert.ok(files['entry/src/main/ets/pages/Index.ets'].startsWith(`'use static'`));
  assert.ok(files['entry/src/main/ets/pages/Index.ets'].includes(
    'ProfileCard as DynamicProfileCard'));
  assert.ok(files['entry/src/main/ets/pages/Index.ets'].includes(
    'AliasedProfileCard as SecondaryDynamicCard'));
  for (const [relativePath, content] of Object.entries(DYNAMIC_PROJECT_FILES)) {
    const projectPath = `dynamic_component/${relativePath}`;
    assert.strictEqual(files[projectPath], content, `${projectPath} was replaced by a fixture`);
    assert.ok(!content.includes(`'use static'`), `${projectPath} must remain ArkTS 1.1 input`);
    assert.ok(!content.includes('static@'), `${projectPath} must not use the reverse static import syntax`);
  }
  assert.ok(!files['dynamic_component/src/main/ets/DynamicCounter.ets']);
  assert.ok(files['AppScope/app.json5'].includes('com.example.interopuipr10'));
  return true;
}

module.exports = {
  DYNAMIC_SOURCE_KEYS,
  canonicalPath,
  createCurrentDeclarationMap,
  createProjectFiles,
  declarationPath,
  materializeProject,
  ohmUrl,
  projectContract,
  readDeclarations,
  sourcePath,
  validateProjectSources
};
