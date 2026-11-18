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
  COMPILER_ROOT,
  DIRECTION,
  assert,
  assertForbidden,
  assertFragments,
  executeCase,
  fail,
  readNonemptyFile
} = require('./harness');
const { moduleIdentity, specializedCases } = require('./source_cases');
const {
  expectations,
  realDeclaration
} = require('./expected_cases');

function loadInteropModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail('toolchain', 'environment', 'INTEROP_LIB_MISSING',
      `run npm run interopBuild before this suite: ${absolutePath}`, { absolutePath });
  }
  try {
    return require(absolutePath);
  } catch (error) {
    return fail('toolchain', 'environment', 'INTEROP_LIB_LOAD_FAILED',
      `cannot load ${absolutePath}: ${error.message}`, { absolutePath });
  }
}

function transformDeclaration(workspace, source) {
  const inputDirectory = path.join(workspace.root, 'input');
  const inputPath = path.join(inputDirectory, 'Index.d.ets');
  const outputPath = path.join(workspace.root, 'transformed', 'Index.d.ets');
  workspace.write('input/Index.d.ets', source);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const { processInteropUI } = loadInteropModule('process_interop_ui.js');
  processInteropUI(inputDirectory, outputPath);
  const actual = fs.existsSync(outputPath) ? readNonemptyFile(outputPath) : source;
  workspace.write('evidence/transformed.txt', actual);
  return { actual, inputPath, outputPath };
}

async function runSpecializedDeclarations(options = {}) {
  const results = [];
  for (const sourceCase of specializedCases) {
    const definition = {
      name: `declaration-${sourceCase.id}`,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: sourceCase.name
    };
    results.push(await executeCase(definition, async context => {
      const expectation = expectations[sourceCase.expectation];
      assert.ok(expectation, `missing expectation ${sourceCase.expectation}`);
      const transformed = transformDeclaration(context.workspace, sourceCase.source);
      assertFragments(transformed.actual, expectation.required, sourceCase.id);
      assertForbidden(transformed.actual, expectation.forbidden, sourceCase.id);
      context.passStage('processInteropUI', { outputPath: transformed.outputPath });
      context.passStage('declaration-contract', { expectation: sourceCase.expectation });
      return {
        toolchain: [{
          name: 'compiler-interop',
          path: path.join(COMPILER_ROOT, 'lib/process_interop_ui.js'),
          version: 'interopBuild'
        }]
      };
    }, options));
  }
  return results;
}

function realDeclgenParameters(workspace, outputRoot) {
  const moduleRoot = path.join(workspace.root, 'dynamic_component');
  const dynamicFiles = [
    path.join(moduleRoot, 'Index.ets'),
    path.join(moduleRoot, 'src/main/ets/DynamicCounter.ets')
  ];
  const declgenV2OutPath = path.join(workspace.root, outputRoot);
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: path.join(workspace.root, 'interop-config.json5'),
    packageName: moduleIdentity.packageName,
    moduleName: moduleIdentity.packageName,
    modulePath: moduleRoot,
    declgenV2OutPath,
    dynamicFiles,
    staticFiles: [],
    cachePath: path.join(workspace.root, 'cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  const dependentModuleMap = new Map([[moduleIdentity.packageName, moduleInfo]]);
  return {
    dependentModuleMap,
    projectConfig: {
      cachePath: path.join(workspace.root, 'repository-declgen-cache'),
      bundleName: 'com.example.interopuipr01',
      mainModuleName: 'entry',
      projectRootPath: workspace.root,
      sdkAliasMap: new Map()
    }
  };
}

function verifyRealDeclaration(workspace, relativePath, expectation, label) {
  const declarationPath = path.join(workspace.root, relativePath);
  const content = readNonemptyFile(declarationPath, 'declgenV2');
  assertFragments(content, expectation.required, label);
  assertForbidden(content, expectation.forbidden, label);
  workspace.write(`evidence/${label}.txt`, content);
  return declarationPath;
}

function generateRepositoryDeclarations(workspace, outputRoot) {
  const parameters = realDeclgenParameters(workspace, outputRoot);
  const { FileManager } = loadInteropModule('fast_build/ark_compiler/interop/interop_manager.js');
  const { DeclfileProductor } = loadInteropModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  try {
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
  } finally {
    FileManager.cleanFileManagerObject();
  }
  const componentDeclaration = verifyRealDeclaration(workspace,
    path.join(outputRoot, 'src/main/ets/DynamicCounter.d.ets'), realDeclaration.component, 'repository-component');
  const indexDeclaration = verifyRealDeclaration(workspace,
    path.join(outputRoot, 'Index.d.ets'), realDeclaration.index, 'repository-index');
  return { componentDeclaration, indexDeclaration, parameters };
}

module.exports = {
  generateRepositoryDeclarations,
  runSpecializedDeclarations
};
