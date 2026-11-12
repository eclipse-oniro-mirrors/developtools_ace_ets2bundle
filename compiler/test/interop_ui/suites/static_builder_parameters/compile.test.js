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
const fs = require('fs');
const path = require('path');
const {
  COMPILER_ROOT,
  StageFailure,
  assertForbidden,
  assertFragments,
  executeCase,
  fail,
  normalizeText,
  readJsonFile,
  readNonemptyFile,
  requireDirectory,
  requireExecutable,
  requireFile,
  runProcess,
  versionText
} = require('../static_calls_dynamic_basic/harness');
const {
  diagnosticsFromLog,
  hvigorArguments,
  hvigorEnvironment,
  resolveToolchain
} = require('../static_calls_dynamic_basic/compile.test');
const { compileCases, moduleIdentity } = require('./source_cases');
const {
  artifactContracts,
  compileExpectations,
  diagnosticContracts
} = require('./expected_cases');
const { materializeCompileProject } = require('./project_files');
const {
  assertEmptyUpdaters,
  assertFunctionContracts,
  countOccurrences
} = require('./assertions');
const { captureDeclgenState, restoreDeclgenState } = require('./declgen_state');

const DIRECTION = '12-to-11';
const SUITE_NAME = 'static_builder_parameters';
const ORIGINAL_DECLARATION_MAP =
  'dynamic_component/build/default/intermediates/declgen/default/decl-fileInfo.json';
const BRIDGE_SOURCE =
  'entry/build/default/intermediates/declgen/default/declgenBridgeCode/entry/src/main/ets/pages/Index.ts';

function loadInteropModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail('toolchain', 'environment', 'INTEROP_LIB_MISSING',
      `run npm run interopBuild before compile cases: ${absolutePath}`, { absolutePath });
  }
  try {
    return require(absolutePath);
  } catch (error) {
    return fail('toolchain', 'environment', 'INTEROP_LIB_LOAD_FAILED',
      `cannot load ${absolutePath}: ${error.message}`, { absolutePath });
  }
}

function validateToolchain(toolchain) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  const sdkPackage = path.join(toolchain.sdkRoot, 'default/openharmony/ets/oh-uni-package.json');
  requireFile(sdkPackage, 'INTEROP_UI_SDK ets package');
  requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
  requireExecutable(toolchain.dynamicDisassembler, 'INTEROP_UI_DYNAMIC_ARK_DISASM');
  return sdkPackage;
}

function toolchainReport(toolchain) {
  const sdkPackagePath = validateToolchain(toolchain);
  const nodeResult = runProcess(toolchain.node, ['--version']);
  assert.strictEqual(nodeResult.status, 0, `node --version failed: ${nodeResult.output}`);
  const hvigorPackagePath = path.resolve(path.dirname(toolchain.hvigor), '../hvigor/package.json');
  const hvigorPackage = readJsonFile(hvigorPackagePath, 'toolchain');
  const sdkPackage = readJsonFile(sdkPackagePath, 'toolchain');
  return [
    { name: 'node', path: toolchain.node, version: versionText(nodeResult) },
    { name: 'hvigor', path: toolchain.hvigor, version: hvigorPackage.version },
    { name: 'sdk', path: toolchain.sdkRoot, version: sdkPackage.version },
    { name: 'static-ark-disasm', path: toolchain.staticDisassembler, version: 'SDK-matched' },
    { name: 'dynamic-ark-disasm', path: toolchain.dynamicDisassembler, version: 'SDK-matched' },
    {
      name: 'declgen',
      path: path.join(COMPILER_ROOT,
        'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
      version: 'DeclfileProductor.runDeclgen'
    }
  ];
}

function executeHvigor(workspace, toolchain, options) {
  const args = [toolchain.hvigor, ...hvigorArguments()];
  const result = runProcess(toolchain.node, args, {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, options.env || {}),
    timeout: Number((options.env || {}).INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.buildLog, result.output);
  workspace.write(artifactContracts.commandLog,
    `${[toolchain.node, ...args].join(' ')}\n`);
  return result;
}

function diagnosticMatches(actual, expected) {
  if (!actual || actual.stage !== expected.stage || actual.code !== expected.code ||
      !actual.message.includes(expected.message)) {
    return false;
  }
  return !expected.location || actual.message.includes(`[${expected.location}]`);
}

function classifyHvigorDiagnostics(result, testCase) {
  const expected = diagnosticContracts[testCase.id];
  assert.ok(Array.isArray(expected), `missing diagnostic whitelist for ${testCase.id}`);
  const diagnostics = diagnosticsFromLog(result.output);
  const backendDiagnostics = diagnostics.filter(diagnostic =>
    diagnostic.stage !== 'GenerateDeclaration' || diagnostic.code === 'DRIVER_ERROR');
  if (backendDiagnostics.length > 0) {
    const first = backendDiagnostics[0];
    throw new StageFailure(first.stage, 'implementation', first.code,
      `backend diagnostic is never allowed: ${first.message}`, {
        classification: 'unexpected-backend-diagnostic',
        diagnostics: backendDiagnostics
      });
  }
  const generateDiagnostics = diagnostics.filter(diagnostic =>
    diagnostic.stage === 'GenerateDeclaration' && diagnostic.code !== 'DRIVER_ERROR');
  const count = Math.max(generateDiagnostics.length, expected.length);
  for (let index = 0; index < count; index += 1) {
    const actual = generateDiagnostics[index];
    const wanted = expected[index];
    if (!wanted || !diagnosticMatches(actual, wanted)) {
      const code = actual?.code || wanted?.code || 'MISSING_KNOWN_DIAGNOSTIC';
      const message = actual?.message || `missing whitelisted diagnostic ${wanted?.code}`;
      throw new StageFailure('GenerateDeclaration', 'implementation', code,
        `diagnostic is outside the per-case/symbol/location whitelist: ${message}`, {
          classification: 'unexpected-declaration-diagnostic',
          actual,
          expected: wanted,
          diagnostics: generateDiagnostics
        });
    }
  }
  return {
    diagnostics,
    backend: backendDiagnostics,
    existing: generateDiagnostics.map((diagnostic, index) => ({
      ...diagnostic,
      category: 'existing',
      issue: expected[index].issue,
      classification: 'per-case/symbol/location whitelisted SDK declaration diagnostic'
    }))
  };
}

function verifyHvigorResult(result, testCase) {
  const classified = classifyHvigorDiagnostics(result, testCase);
  if (result.error || result.status !== 0) {
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`,
      { status: result.status, signal: result.signal });
  }
  return classified;
}

function declarationBaseName(testCase) {
  return testCase.calleeFile.slice(0, -path.extname(testCase.calleeFile).length);
}

function declarationKey(testCase) {
  return `src/main/ets/${declarationBaseName(testCase)}`;
}

function declarationPaths(workspace, testCase) {
  const outputRoot = path.join(workspace.root, artifactContracts.declgenRoot);
  return {
    outputRoot,
    component: path.join(outputRoot, 'src/main/ets', testCase.declaration),
    index: path.join(outputRoot, 'Index.d.ets'),
    map: path.join(workspace.root, artifactContracts.declarationMap),
    projection: path.join(workspace.root, artifactContracts.repositoryProjection),
    staticAbc: path.join(workspace.root, artifactContracts.repositoryStaticAbc),
    staticDisassembly: path.join(workspace.root, artifactContracts.repositoryDisassembly),
    dynamicAbc: path.join(workspace.root, artifactContracts.dynamicAbc),
    dynamicDisassembly: path.join(workspace.root, artifactContracts.dynamicDisassembly),
    callerConfig: path.join(workspace.root, artifactContracts.callerConfig)
  };
}

function realDeclgenParameters(workspace, testCase, paths) {
  const moduleRoot = path.join(workspace.root, 'dynamic_component');
  const dynamicFiles = [
    path.join(moduleRoot, 'Index.ets'),
    path.join(moduleRoot, 'src/main/ets', testCase.calleeFile)
  ];
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: path.join(workspace.root, 'interop-config.json5'),
    packageName: moduleIdentity.packageName,
    moduleName: moduleIdentity.packageName,
    modulePath: moduleRoot,
    declgenV2OutPath: paths.outputRoot,
    dynamicFiles,
    staticFiles: [],
    cachePath: path.join(workspace.root, 'cache'),
    packageVersion: moduleIdentity.packageVersion,
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[moduleIdentity.packageName, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(workspace.root, 'repository-declgen-cache'),
      bundleName: moduleIdentity.bundleName,
      mainModuleName: moduleIdentity.callerPackage,
      projectRootPath: workspace.root,
      sdkAliasMap: new Map()
    }
  };
}

function generateCurrentDeclarations(workspace, testCase, paths) {
  const parameters = realDeclgenParameters(workspace, testCase, paths);
  const { FileManager } = loadInteropModule('fast_build/ark_compiler/interop/interop_manager.js');
  const { DeclfileProductor } = loadInteropModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  const DeclgenLogger = require(path.join(COMPILER_ROOT, 'node_modules/declgen')).logger.Logger;
  const snapshots = captureDeclgenState([DeclfileProductor, FileManager, DeclgenLogger]);
  let isolation;
  try {
    FileManager.cleanFileManagerObject();
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
  } finally {
    FileManager.cleanFileManagerObject();
    isolation = restoreDeclgenState(snapshots);
  }
  const declaration = readNonemptyFile(paths.component, 'repository-declgen');
  const index = readNonemptyFile(paths.index, 'repository-declgen');
  workspace.write(`evidence/${testCase.id}-component.d.ets.txt`, declaration);
  workspace.write(`evidence/${testCase.id}-index.d.ets.txt`, index);
  return { declaration, index, parameters, isolation };
}

function verifyCurrentDeclaration(testCase, generated) {
  const expectation = compileExpectations[testCase.id];
  assertFragments(generated.declaration, [
    `'use static'`,
    `@ohos.arkui.component`,
    ...expectation.declarationRequired
  ], `${testCase.id} repository declaration`);
  assertForbidden(generated.declaration, [
    `constructor(`,
    `Text(`,
    `Column(`
  ], `${testCase.id} repository declaration`);
  assertFragments(generated.index, [
    `'use static'`,
    declarationKey(testCase)
  ], `${testCase.id} declaration barrel`);
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function prepareRepositoryProjection(workspace, testCase, paths) {
  const originalMapPath = path.join(workspace.root, ORIGINAL_DECLARATION_MAP);
  const declarationMap = readJsonFile(originalMapPath, 'decl-fileInfo');
  const componentEntry = declarationMap.files[declarationKey(testCase)];
  const indexEntry = declarationMap.files.Index;
  assert.ok(componentEntry, `decl-fileInfo is missing ${declarationKey(testCase)}`);
  assert.ok(indexEntry, 'decl-fileInfo is missing Index');
  componentEntry.declPath = paths.component;
  indexEntry.declPath = paths.index;
  assert.strictEqual(declarationMap.packageName, moduleIdentity.packageName);
  workspace.write(artifactContracts.declarationMap, JSON.stringify(declarationMap, null, 2));

  const projectionPath = path.join(workspace.root, artifactContracts.projectionConfig);
  const projection = readJsonFile(projectionPath, 'projectionConfig');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== moduleIdentity.packageName) {
        continue;
      }
      module.declgenV2OutPath = paths.outputRoot;
      module.declFilesPath = paths.map;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'both projection dependency lists must use current declgen output');
  projection.cachePath = path.join(workspace.root, artifactContracts.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, artifactContracts.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, artifactContracts.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  workspace.write(artifactContracts.repositoryProjection, JSON.stringify(projection, null, 2));
  return { componentEntry, indexEntry, declarationMap };
}

function executeRepositoryStaticCompile(workspace, toolchain, paths, options) {
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const result = runProcess(toolchain.node, [driver, paths.projection], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, options.env || {}),
    timeout: Number((options.env || {}).INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.repositoryBuildLog, result.output);
  const diagnostics = diagnosticsFromLog(result.output);
  if (result.error || result.status !== 0 || diagnostics.length > 0) {
    throw new StageFailure('repository-static-compile', 'implementation',
      diagnostics[0]?.code || 'STATIC_COMPILE_FAILED',
      `current declaration consumption failed: ${normalizeText(result.output).split('\n').slice(-18).join('\n')}`,
      { status: result.status, diagnostics });
  }
  return result;
}

function verifyCallerConfig(paths, projection, testCase) {
  const config = readJsonFile(paths.callerConfig, 'arktsconfig');
  assert.ok(config.compilerOptions, 'arktsconfig compilerOptions must exist');
  assert.strictEqual(config.compilerOptions.package, moduleIdentity.callerPackage);
  const dependencies = config.compilerOptions.dependencies || {};
  const componentModule = `${moduleIdentity.packageName}/${declarationKey(testCase)}`;
  const indexModule = `${moduleIdentity.packageName}/Index`;
  const component = dependencies[componentModule];
  const index = dependencies[indexModule];
  const packageEntry = dependencies[moduleIdentity.packageName];
  for (const [name, entry] of Object.entries({ component, index, packageEntry })) {
    assert.ok(entry, `arktsconfig dependency ${name} must exist`);
    assert.strictEqual(entry.language, 'js', `${name} must retain dynamic module identity`);
  }
  assert.strictEqual(canonicalPath(component.path), canonicalPath(paths.component));
  assert.strictEqual(canonicalPath(index.path), canonicalPath(paths.index));
  assert.strictEqual(canonicalPath(packageEntry.path), canonicalPath(paths.index));
  assert.strictEqual(canonicalPath(component.sourceFilePath), canonicalPath(path.join(
    path.dirname(paths.outputRoot), '../../../../..', 'src/main/ets', testCase.calleeFile)));
  assert.strictEqual(component.ohmUrl,
    `${projection.componentEntry.ohmUrl}${moduleIdentity.packageVersion}`);
  assert.strictEqual(index.ohmUrl, `${projection.indexEntry.ohmUrl}${moduleIdentity.packageVersion}`);
  assert.strictEqual(packageEntry.ohmUrl, `${projection.indexEntry.ohmUrl}${moduleIdentity.packageVersion}`);
  return { componentModule, indexModule, dependencies: [component, index, packageEntry] };
}

function verifyBridgeSource(workspace, testCase) {
  const bridgePath = path.join(workspace.root, BRIDGE_SOURCE);
  const bridge = readNonemptyFile(bridgePath, 'declgenBridgeCode');
  assertFragments(bridge, [
    `from "dynamic_component"`,
    testCase.componentName,
    `globalThis as any`,
    `Panda.getClass('Lentry/src/main/ets/pages/Index/ETSGLOBAL;')`
  ], `${testCase.id} bridge source`);
  return bridgePath;
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or empty ${filePath}`, { filePath });
  }
  const content = fs.readFileSync(filePath);
  assert.strictEqual(content.subarray(0, 5).toString('ascii'), 'PANDA', `${filePath} has no PANDA header`);
  return content;
}

function disassemble(workspace, toolchain, executable, abcPath, outputPath, stage) {
  assertBinaryArtifact(abcPath, stage);
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.error || result.status !== 0) {
    fail(stage, 'environment', 'ARK_DISASM_FAILED',
      `ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  return readNonemptyFile(outputPath, stage);
}

function verifyDisassembly(testCase, staticText, dynamicText) {
  const expectation = compileExpectations[testCase.id];
  assertFragments(staticText, [
    moduleIdentity.packageName,
    declarationKey(testCase),
    moduleIdentity.callerRecord,
    ...expectation.staticRequired
  ], `${testCase.id} static ABC`);
  assertForbidden(staticText, expectation.staticForbidden, `${testCase.id} static ABC`);
  assertFragments(dynamicText, [
    moduleIdentity.packageName,
    declarationBaseName(testCase),
    ...expectation.dynamicRequired
  ], `${testCase.id} dynamic ABC`);
  assert.ok(countOccurrences(staticText, 'compatibleComponent') > 0,
    `${testCase.id} did not generate a compatible component call`);
  return {
    functions: assertFunctionContracts(staticText, expectation.functions),
    knownIssues: assertEmptyUpdaters(staticText, expectation.emptyUpdaters)
  };
}

function artifactList(paths) {
  return [
    paths.component,
    paths.index,
    paths.map,
    paths.projection,
    paths.callerConfig,
    paths.staticAbc,
    paths.staticDisassembly,
    paths.dynamicAbc,
    paths.dynamicDisassembly
  ];
}

async function runCompileCase(testCase, options = {}) {
  const definition = {
    name: `${SUITE_NAME}/${testCase.id}`,
    group: 'compile',
    direction: DIRECTION,
    kind: 'full-chain',
    coverage: testCase.boundary
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const tools = toolchainReport(toolchain);
    context.passStage('toolchain', { tools });
    const project = materializeCompileProject(workspace, toolchain.sdkRoot, testCase);
    context.passStage('materialize', {
      callerSource: project.callerSource,
      calleeSource: project.calleeSource,
      fileCount: project.fileCount
    });
    const hvigorResult = executeHvigor(workspace, toolchain, options);
    const classified = verifyHvigorResult(hvigorResult, testCase);
    context.passStage('Hvigor', {
      status: hvigorResult.status,
      existingDiagnostics: classified.existing.length
    });
    const paths = declarationPaths(workspace, testCase);
    const generated = generateCurrentDeclarations(workspace, testCase, paths);
    verifyCurrentDeclaration(testCase, generated);
    context.passStage('DeclfileProductor.runDeclgen', {
      component: paths.component,
      index: paths.index
    });
    context.passStage('declgen-state-restoration', { owners: generated.isolation });
    const projection = prepareRepositoryProjection(workspace, testCase, paths);
    context.passStage('repository-projection', { declarationMap: paths.map });
    executeRepositoryStaticCompile(workspace, toolchain, paths, options);
    context.passStage('repository-static-compile', { log: artifactContracts.repositoryBuildLog });
    const callerIdentity = verifyCallerConfig(paths, projection, testCase);
    context.passStage('arktsconfig', callerIdentity);
    const bridgePath = verifyBridgeSource(workspace, testCase);
    context.passStage('declgenBridgeCode', { bridgePath });
    const staticText = disassemble(workspace, toolchain, toolchain.staticDisassembler,
      paths.staticAbc, paths.staticDisassembly, 'repository-static-disassembly');
    context.passStage('repository-static-disassembly', { output: paths.staticDisassembly });
    const dynamicText = disassemble(workspace, toolchain, toolchain.dynamicDisassembler,
      paths.dynamicAbc, paths.dynamicDisassembly, 'dynamic-disassembly');
    context.passStage('dynamic-disassembly', { output: paths.dynamicDisassembly });
    const disassembly = verifyDisassembly(testCase, staticText, dynamicText);
    context.passStage('builder-contract', {
      expectation: testCase.id,
      functions: disassembly.functions
    });
    const knownIssues = [
      ...classified.existing.map(diagnostic => ({
        stage: diagnostic.stage,
        category: 'existing',
        code: diagnostic.code,
        message: diagnostic.message,
        details: {
          classification: diagnostic.classification,
          issue: diagnostic.issue,
          line: diagnostic.line
        }
      })),
      ...disassembly.knownIssues
    ];
    for (const issue of knownIssues) {
      context.failStage(issue.stage, new StageFailure(
        issue.stage, issue.category, issue.code, issue.message, issue.details));
    }
    const generatedArtifacts = {
      declarations: [paths.component, paths.index],
      bridgePath,
      staticAbc: paths.staticAbc,
      dynamicAbc: paths.dynamicAbc,
      staticDisassembly: paths.staticDisassembly,
      dynamicDisassembly: paths.dynamicDisassembly
    };
    if (knownIssues.length > 0) {
      const first = knownIssues[0];
      const failure = new StageFailure(first.stage, first.category, first.code, first.message, {
        classification: first.details?.classification || 'known-existing-contract',
        knownIssues,
        generated: generatedArtifacts,
        diagnostics: classified.diagnostics,
        declgenStateRestoration: generated.isolation,
        command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()]
      });
      failure.diagnostics = classified.diagnostics;
      throw failure;
    }
    return {
      toolchain: tools,
      generated: generatedArtifacts,
      diagnostics: classified.diagnostics,
      existingDiagnostics: classified.existing,
      declgenStateRestoration: generated.isolation,
      artifacts: artifactList(paths),
      command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()]
    };
  }, options);
}

function validateCompileRegistry() {
  const ids = compileCases.map(testCase => testCase.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'compile case ids must be unique');
  for (const testCase of compileCases) {
    assert.ok(compileExpectations[testCase.id], `missing compile expectation ${testCase.id}`);
    assert.ok(testCase.callee.includes('@Builder') || testCase.callee.includes('@BuilderParam'),
      `${testCase.id} does not exercise Builder contracts`);
    assert.ok(testCase.caller.includes(testCase.componentName),
      `${testCase.id} caller does not instantiate its component`);
    assert.ok(testCase.index.includes(declarationKey(testCase)),
      `${testCase.id} barrel points at the wrong source module`);
  }
}

async function runCompileCases(options = {}) {
  if (options.direction && options.direction !== DIRECTION) {
    return [];
  }
  validateCompileRegistry();
  const results = [];
  for (const testCase of compileCases) {
    results.push(await runCompileCase(testCase, options));
  }
  return results;
}

module.exports = {
  classifyHvigorDiagnostics,
  declarationPaths,
  executeRepositoryStaticCompile,
  generateCurrentDeclarations,
  prepareRepositoryProjection,
  runCompileCase,
  runCompileCases,
  validateCompileRegistry,
  verifyCallerConfig,
  verifyCurrentDeclaration,
  verifyDisassembly
};
