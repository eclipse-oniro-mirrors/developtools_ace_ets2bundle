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
  assertFragments,
  executeCase,
  fail,
  readNonemptyFile
} = require('../static_calls_dynamic_basic/harness');
const {
  DECLARATION_CASES,
  PACKAGE_NAME
} = require('./source_cases');
const {
  DECLARATION_EXPECTATIONS
} = require('./expected_cases');
const {
  assertExport,
  assertImport,
  assertOrigins,
  assertRelativeModulesResolve,
  buildDeclarationGraph,
  listExportedNames
} = require('./declaration_ast');
const {
  canonicalPath,
  createCurrentDeclarationMap,
  readDeclarations,
  sourcePath
} = require('./project_files');
const { declarationKey } = require('./declaration_ast');

function loadInteropModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail('toolchain', 'environment', 'INTEROP_LIB_MISSING',
      `run npm run interopBuild before PR10: ${absolutePath}`, { absolutePath });
  }
  try {
    return require(absolutePath);
  } catch (error) {
    return fail('toolchain', 'environment', 'INTEROP_LIB_LOAD_FAILED',
      `cannot load ${absolutePath}: ${error.message}`, { absolutePath });
  }
}

function cloneState(value) {
  if (Array.isArray(value)) {
    return value.map(cloneState);
  }
  if (value instanceof Map) {
    return new Map(Array.from(value, ([key, item]) => [cloneState(key), cloneState(item)]));
  }
  if (value instanceof Set) {
    return new Set(Array.from(value, cloneState));
  }
  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneState(item)]));
    }
  }
  return value;
}

const STATIC_BUILTINS = new Set(['length', 'name', 'prototype']);

function snapshotStaticFields(owner) {
  const snapshot = {};
  for (const key of Object.getOwnPropertyNames(owner)) {
    if (STATIC_BUILTINS.has(key)) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    snapshot[key] = {
      ...descriptor,
      value: key === 'instance' ? descriptor.value : cloneState(descriptor.value)
    };
  }
  return snapshot;
}

function restoreStaticFields(owner, snapshot) {
  for (const key of Object.getOwnPropertyNames(owner)) {
    if (!STATIC_BUILTINS.has(key) && !Object.prototype.hasOwnProperty.call(snapshot, key)) {
      assert.ok(delete owner[key], `cannot remove added static field ${key}`);
    }
  }
  for (const [key, descriptor] of Object.entries(snapshot)) {
    Object.defineProperty(owner, key, {
      ...descriptor,
      value: key === 'instance' ? descriptor.value : cloneState(descriptor.value)
    });
  }
}

function declgenOwners() {
  const { DeclfileProductor } = loadInteropModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  const { FileManager } = loadInteropModule('fast_build/ark_compiler/interop/interop_manager.js');
  const DeclgenLogger = require(path.join(COMPILER_ROOT, 'node_modules/declgen')).logger.Logger;
  return { DeclfileProductor, FileManager, DeclgenLogger };
}

function withDeclgenIsolation(callback) {
  const { DeclfileProductor, FileManager, DeclgenLogger } = declgenOwners();
  const owners = [DeclfileProductor, FileManager, DeclgenLogger];
  const snapshots = owners.map(snapshotStaticFields);
  FileManager.cleanFileManagerObject();
  try {
    return callback({ DeclfileProductor, FileManager });
  } finally {
    FileManager.cleanFileManagerObject();
    for (let index = owners.length - 1; index >= 0; index -= 1) {
      restoreStaticFields(owners[index], snapshots[index]);
    }
  }
}

function declgenParameters(workspace, sourceFiles, outputRoot) {
  const modulePath = path.join(workspace.root, PACKAGE_NAME);
  const dynamicFiles = sourceFiles.map(relativePath => path.join(modulePath, relativePath)).sort();
  for (const filePath of dynamicFiles) {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) {
      fail('materialize', 'implementation', 'MISSING_DYNAMIC_INPUT',
        `dynamic input is missing or empty: ${filePath}`, { filePath });
    }
  }
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: path.join(workspace.root, 'interop-config.json5'),
    packageName: PACKAGE_NAME,
    moduleName: PACKAGE_NAME,
    modulePath,
    declgenV2OutPath: path.join(workspace.root, outputRoot),
    dynamicFiles,
    staticFiles: [],
    cachePath: path.join(workspace.root, 'declgen-cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[PACKAGE_NAME, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(workspace.root, 'repository-declgen-cache'),
      bundleName: 'com.example.interopuipr10',
      mainModuleName: 'entry',
      projectRootPath: workspace.root,
      sdkAliasMap: new Map()
    }
  };
}

function generateDeclarations(workspace, sourceFiles, outputRoot) {
  const parameters = declgenParameters(workspace, sourceFiles, outputRoot);
  withDeclgenIsolation(({ DeclfileProductor, FileManager }) => {
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
  });
  const keys = sourceFiles.map(declarationKey).sort();
  const declarations = readDeclarations(workspace, outputRoot, keys);
  const declarationMap = createCurrentDeclarationMap(workspace, outputRoot, keys);
  assert.deepStrictEqual(Object.keys(declarationMap.files).sort(), keys);
  const identities = new Set();
  for (const key of keys) {
    const entry = declarationMap.files[key];
    assert.strictEqual(canonicalPath(entry.declPath), canonicalPath(declarations[key].path));
    assert.strictEqual(canonicalPath(entry.filePath), canonicalPath(sourcePath(workspace, key)));
    assert.strictEqual(entry.ohmUrl, declarations[key].ohmUrl);
    assert.ok(!identities.has(entry.ohmUrl), `duplicate OHM identity: ${entry.ohmUrl}`);
    identities.add(entry.ohmUrl);
    assert.ok(entry.declPath.startsWith(workspace.root), `${key} mapped to a stale declaration`);
  }
  workspace.write('evidence/current-decl-fileInfo.json', JSON.stringify(declarationMap, null, 2));
  return { declarations, declarationMap, parameters, keys };
}

function verifyDeclarationCase(workspace, generated, expectation) {
  const graph = buildDeclarationGraph(generated.declarations);
  const resolvedModules = assertRelativeModulesResolve(graph);
  for (const expectationImport of expectation.imports) {
    assertImport(graph, expectationImport);
  }
  for (const expectationExport of expectation.exports) {
    assertExport(graph, expectationExport);
  }
  const origins = assertOrigins(graph, expectation.origins);
  if (expectation.exportedNames) {
    assert.deepStrictEqual(listExportedNames(graph, 'Index'), expectation.exportedNames);
  }
  for (const [key, fragments] of Object.entries(expectation.fragments)) {
    assertFragments(generated.declarations[key].content, fragments, `generated ${key}`);
  }
  const evidence = {
    declarationMap: generated.declarationMap,
    resolvedModules,
    origins,
    exportedNames: listExportedNames(graph, 'Index')
  };
  workspace.write('evidence/declaration-graph.json', JSON.stringify(evidence, null, 2));
  return evidence;
}

function validateDeclarationCases() {
  const ids = new Set();
  const coverage = new Set();
  assert.strictEqual(Object.keys(DECLARATION_EXPECTATIONS).length, DECLARATION_CASES.length);
  for (const sourceCase of DECLARATION_CASES) {
    assert.ok(!ids.has(sourceCase.id), `duplicate declaration case ${sourceCase.id}`);
    ids.add(sourceCase.id);
    assert.ok(!coverage.has(sourceCase.coverage), `duplicate coverage ${sourceCase.coverage}`);
    coverage.add(sourceCase.coverage);
    assert.ok(sourceCase.files['Index.ets'], `${sourceCase.id} needs a package entry`);
    const expectation = DECLARATION_EXPECTATIONS[sourceCase.id];
    assert.ok(expectation, `${sourceCase.id} has no expectation`);
    for (const key of Object.keys(expectation.fragments)) {
      assert.ok(sourceCase.files[`${key}.ets`], `${sourceCase.id} fragment ${key} has no source input`);
    }
    for (const [exportedName, origin] of Object.entries(expectation.origins)) {
      assert.ok(exportedName.length > 0, `${sourceCase.id} has an empty export name`);
      assert.ok(sourceCase.files[`${origin.file}.ets`], `${sourceCase.id} origin ${origin.file} has no source`);
    }
    for (const [relativePath, content] of Object.entries(sourceCase.files)) {
      assert.ok(relativePath.endsWith('.ets'), `${sourceCase.id} input must be dynamic ETS`);
      assert.ok(!content.includes(`'use static'`), `${sourceCase.id}/${relativePath} became static input`);
      assert.ok(!content.includes('static@'), `${sourceCase.id} must not test the reverse direction`);
    }
  }
  return ids.size;
}

async function runDeclarationUnits(options = {}) {
  const results = [];
  for (const sourceCase of DECLARATION_CASES) {
    const caseName = `multifile-declaration-${sourceCase.id}`;
    if (options.caseId && options.caseId !== caseName) {
      continue;
    }
    results.push(await executeCase({
      name: caseName,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: sourceCase.coverage
    }, async context => {
      const files = Object.fromEntries(Object.entries(sourceCase.files)
        .map(([relativePath, content]) => [`${PACKAGE_NAME}/${relativePath}`, content]));
      context.workspace.materialize(files);
      context.passStage('materialize', { inputCount: Object.keys(files).length });
      const generated = generateDeclarations(
        context.workspace,
        Object.keys(sourceCase.files).sort(),
        'generated/declgenV2'
      );
      context.passStage('DeclfileProductor.runDeclgen', { outputCount: generated.keys.length });
      const graphEvidence = verifyDeclarationCase(
        context.workspace,
        generated,
        DECLARATION_EXPECTATIONS[sourceCase.id]
      );
      context.passStage('declaration-export-graph', {
        exportedNames: graphEvidence.exportedNames,
        relativeModuleCount: graphEvidence.resolvedModules.length
      });
      context.passStage('decl-fileInfo-and-ohm-identity', { fileCount: generated.keys.length });
      return {
        toolchain: [{
          name: 'declgen',
          path: path.join(COMPILER_ROOT,
            'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
          version: 'DeclfileProductor.runDeclgen'
        }],
        generated: {
          declarationCount: generated.keys.length,
          declarationMap: generated.declarationMap,
          origins: graphEvidence.origins
        }
      };
    }, options));
  }
  return results;
}

module.exports = {
  declgenParameters,
  generateDeclarations,
  loadInteropModule,
  runDeclarationUnits,
  validateDeclarationCases,
  verifyDeclarationCase,
  withDeclgenIsolation
};
