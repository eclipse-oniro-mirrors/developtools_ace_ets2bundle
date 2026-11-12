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
const ts = require('typescript');
const {
  COMPILER_ROOT,
  DIRECTION,
  StageFailure,
  assert,
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
  hvigorEnvironment,
  resolveToolchain
} = require('../static_calls_dynamic_basic/compile.test');
const {
  assertDeclarationContract
} = require('../property_ref_contract/ast_assertions');
const {
  assertGlobalStateRestored,
  captureGlobalState,
  restoreGlobalState
} = require('../property_ref_contract/declgen_smoke');
const {
  assertGeneratedMethods,
  assertIndexDeclaration,
  assertStateImportOrigins,
  assertStaticBridge,
  assertV1Only
} = require('./state_assertions');
const {
  artifactContracts,
  bridgeContract,
  integratedDeclaration,
  knownStateStorageDeclarationFailure
} = require('./expected_cases');
const {
  integratedCase,
  moduleIdentity,
  staticCaller,
  storageParameterCases
} = require('./source_cases');
const {
  activateStaticCaller,
  hvigorArguments,
  materializeProject,
  projectContract
} = require('./project_files');

function validateToolchain(toolchain) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  const sdkPackage = path.join(toolchain.sdkRoot, 'default/openharmony/ets/oh-uni-package.json');
  requireFile(sdkPackage, 'INTEROP_UI_SDK ets package');
  requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
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
    {
      name: 'ohos-typescript',
      path: require.resolve('typescript'),
      version: require('typescript/package.json').version
    }
  ];
}

function executeHvigor(workspace, toolchain, options = {}) {
  const environment = options.env || process.env;
  const args = hvigorArguments();
  const result = runProcess(toolchain.node, [toolchain.hvigor, ...args], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, environment),
    timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 240000)
  });
  workspace.write(artifactContracts.buildLog, result.output);
  workspace.write(artifactContracts.hvigorCommand,
    [toolchain.node, toolchain.hvigor, ...args].join(' ') + '\n');
  return result;
}

function knownDeclarationDiagnostic(diagnostics) {
  const first = diagnostics[0];
  if (!first) {
    return undefined;
  }
  const known = knownStateStorageDeclarationFailure;
  const sequenceMatches = diagnostics.length === known.sequence.length &&
    known.sequence.every((code, index) => diagnostics[index].code === code);
  const textMatches = known.requiredText.every(fragment =>
    diagnostics.some(item => item.message.includes(fragment)));
  if (first.stage !== known.stage || first.code !== known.code || !sequenceMatches || !textMatches) {
    return undefined;
  }
  return known;
}

function verifyHvigorResult(result) {
  const diagnostics = diagnosticsFromLog(result.output);
  const known = knownDeclarationDiagnostic(diagnostics);
  if (known) {
    throw new StageFailure(known.stage, 'existing', known.code, diagnostics[0].message, {
      classification: known.classification,
      diagnostics,
      logPath: artifactContracts.buildLog
    });
  }
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    throw new StageFailure(first.stage, 'implementation', first.code, first.message, {
      classification: 'unclassified compiler diagnostic',
      diagnostics,
      logPath: artifactContracts.buildLog
    });
  }
  if (result.error || result.status !== 0) {
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`,
      { status: result.status, signal: result.signal, diagnostics });
  }
  return diagnostics;
}

function parseEts(filePath, stage) {
  const text = readNonemptyFile(filePath, stage);
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.ES2021,
    true,
    ts.ScriptKind.ETS
  );
  assert.deepStrictEqual((sourceFile.parseDiagnostics || []).map(diagnostic => ({
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
  })), [], `${stage}: generated ETS declaration is not parseable`);
  return { sourceFile, text };
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function declarationPaths(workspace) {
  const root = workspace.root;
  const repositoryRoot = path.join(root, artifactContracts.repositoryDeclgenRoot);
  return {
    sdkComponent: path.join(root, artifactContracts.componentDeclaration),
    sdkIndex: path.join(root, artifactContracts.indexDeclaration),
    repositoryComponent: path.join(repositoryRoot, 'src/main/ets/DynamicStateStorage.d.ets'),
    repositoryIndex: path.join(repositoryRoot, 'Index.d.ets'),
    sdkMap: path.join(root, artifactContracts.declarationMap),
    repositoryMap: path.join(root, artifactContracts.repositoryDeclarationMap),
    projectionInput: path.join(root, artifactContracts.projectionConfig),
    repositoryProjection: path.join(root, artifactContracts.repositoryProjection),
    repositoryCallerConfig: path.join(root, artifactContracts.repositoryCache, 'entry/arktsconfig.json')
  };
}

function verifyComponentDeclaration(filePath, label) {
  const parsed = parseEts(filePath, 'declgenV2');
  assertDeclarationContract(parsed.sourceFile, integratedDeclaration, { declaration: true });
  const methods = assertGeneratedMethods(parsed.sourceFile, integratedCase, moduleIdentity.componentName);
  const decorators = assertV1Only(parsed.sourceFile, label);
  const origins = assertStateImportOrigins(parsed.sourceFile);
  assertFragments(parsed.text, [
    `@StoragePropRef('pr09.runtime.score')`,
    `@LocalStoragePropRef('pr09.runtime.draft')`,
    `@StorageLink('pr09.runtime.muted')`
  ], label);
  return {
    declarationPath: filePath,
    bytes: Buffer.byteLength(parsed.text, 'utf8'),
    decorators,
    methods,
    origins
  };
}

function verifyIndexDeclaration(filePath) {
  const parsed = parseEts(filePath, 'declgenV2.index');
  const identity = assertIndexDeclaration(
    parsed.sourceFile,
    moduleIdentity.componentName,
    './src/main/ets/DynamicStateStorage'
  );
  return { declarationPath: filePath, bytes: Buffer.byteLength(parsed.text, 'utf8'), identity };
}

function verifyPreparationArtifacts(workspace) {
  const paths = declarationPaths(workspace);
  const projection = readJsonFile(paths.projectionInput, 'arktsconfig.projection');
  const declarationMap = readJsonFile(paths.sdkMap, 'declgenV2.map');
  const identities = verifyDeclarationMap(declarationMap, {
    repositoryComponent: paths.sdkComponent,
    repositoryIndex: paths.sdkIndex
  }, 'SDK preparation declaration map');
  const moduleLists = ['dependentModuleList', 'dependencyModuleList'];
  for (const key of moduleLists) {
    assert.ok((projection[key] || []).some(module => module.packageName === moduleIdentity.packageName),
      `${key} does not identify ${moduleIdentity.packageName}`);
  }
  // Only preparation metadata comes from the SDK. The caller below consumes this repository's fresh declarations.
  return {
    projectionPath: paths.projectionInput,
    declarationMapPath: paths.sdkMap,
    packageName: declarationMap.packageName,
    componentOhmUrl: identities.componentEntry.ohmUrl,
    indexOhmUrl: identities.indexEntry.ohmUrl
  };
}

function loadInteropModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  requireFile(absolutePath, 'compiler interopBuild output');
  return require(absolutePath);
}

function realDeclgenParameters(workspace, outputRoot) {
  const moduleRoot = path.join(workspace.root, moduleIdentity.packageName);
  const dynamicFiles = [
    path.join(moduleRoot, 'Index.ets'),
    path.join(moduleRoot, 'src/main/ets/DynamicStateStorage.ets')
  ];
  for (const input of dynamicFiles) {
    requireFile(input, 'PR09 dynamic source');
  }
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: path.join(workspace.root, 'interop-config.json5'),
    packageName: moduleIdentity.packageName,
    moduleName: moduleIdentity.packageName,
    modulePath: moduleRoot,
    declgenV1OutPath: path.join(workspace.root, 'repository-declgen-v1-unused'),
    declgenV2OutPath: path.join(workspace.root, outputRoot),
    dynamicFiles,
    staticFiles: [],
    cachePath: path.join(workspace.root, 'repository-module-cache'),
    packageVersion: moduleIdentity.packageVersion,
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[moduleIdentity.packageName, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(workspace.root, 'repository-declgen-cache'),
      bundleName: moduleIdentity.bundleName,
      mainModuleName: moduleIdentity.callerModule,
      projectRootPath: workspace.root,
      sdkAliasMap: new Map()
    }
  };
}

function generateRepositoryDeclarations(workspace) {
  const parameters = realDeclgenParameters(workspace, artifactContracts.repositoryDeclgenRoot);
  const { FileManager } = loadInteropModule('fast_build/ark_compiler/interop/interop_manager.js');
  const { DeclfileProductor } = loadInteropModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  const globalState = captureGlobalState();
  let failure;
  try {
    FileManager.cleanFileManagerObject();
    FileManager.isInteropSDKEnabled = false;
    DeclfileProductor.systemModules = [];
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
  } catch (error) {
    failure = error;
  }
  try {
    restoreGlobalState(globalState);
    assertGlobalStateRestored(globalState);
  } catch (error) {
    error.stage = 'declgen.cleanup';
    error.code = error.code || 'GLOBAL_STATE_RESTORE';
    failure = failure || error;
  }
  if (failure) {
    throw failure;
  }
  const paths = declarationPaths(workspace);
  const dynamicFiles = parameters.dependentModuleMap.get(moduleIdentity.packageName).dynamicFiles;
  const dynamicSourceText = readNonemptyFile(dynamicFiles[1], 'dynamic.source');
  assertFragments(dynamicSourceText, integratedCase.updates.updateValues,
    'dynamic source local updates for State, Link, Prop, StorageProp, LocalStorageProp and StorageLink');
  return {
    component: verifyComponentDeclaration(paths.repositoryComponent, 'repository declgenV2 component'),
    index: verifyIndexDeclaration(paths.repositoryIndex),
    dynamicFiles,
    localUpdates: integratedCase.updates.updateValues,
    outputRoot: path.join(workspace.root, artifactContracts.repositoryDeclgenRoot)
  };
}

function verifyDeclarationMap(map, paths, label) {
  assert.strictEqual(map.packageName, moduleIdentity.packageName, `${label}: package identity changed`);
  const componentEntry = map.files['src/main/ets/DynamicStateStorage'];
  const indexEntry = map.files.Index;
  assert.ok(componentEntry, `${label}: component source entry is missing`);
  assert.ok(indexEntry, `${label}: Index source entry is missing`);
  assert.strictEqual(canonicalPath(componentEntry.declPath), canonicalPath(paths.repositoryComponent));
  assert.strictEqual(canonicalPath(indexEntry.declPath), canonicalPath(paths.repositoryIndex));
  assert.strictEqual(componentEntry.ohmUrl, moduleIdentity.componentOhmUrl.replace(/1\.0\.0$/, ''));
  assert.strictEqual(indexEntry.ohmUrl, moduleIdentity.indexOhmUrl.replace(/1\.0\.0$/, ''));
  return { componentEntry, indexEntry };
}

function prepareRepositoryProjection(workspace) {
  const paths = declarationPaths(workspace);
  const declarationMap = readJsonFile(paths.sdkMap, 'declgenV2.map');
  verifyDeclarationMap(declarationMap, {
    repositoryComponent: paths.sdkComponent,
    repositoryIndex: paths.sdkIndex
  }, 'SDK declaration map');
  declarationMap.files['src/main/ets/DynamicStateStorage'].declPath = paths.repositoryComponent;
  declarationMap.files.Index.declPath = paths.repositoryIndex;
  workspace.write(artifactContracts.repositoryDeclarationMap, JSON.stringify(declarationMap, null, 2));
  verifyDeclarationMap(declarationMap, paths, 'repository declaration map');

  const projection = readJsonFile(paths.projectionInput, 'arktsconfig.projection');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== moduleIdentity.packageName) {
        continue;
      }
      module.declgenV2OutPath = path.join(workspace.root, artifactContracts.repositoryDeclgenRoot);
      module.declFilesPath = paths.repositoryMap;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'both projection dependency lists must consume repository declarations');
  projection.cachePath = path.join(workspace.root, artifactContracts.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, artifactContracts.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, artifactContracts.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  workspace.write(artifactContracts.repositoryProjection, JSON.stringify(projection, null, 2));
  return paths;
}

function executeRepositoryStaticCompile(workspace, toolchain, paths, options = {}) {
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const environment = options.env || process.env;
  const result = runProcess(toolchain.node, [driver, paths.repositoryProjection], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, environment),
    timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 240000)
  });
  workspace.write(artifactContracts.repositoryBuildLog, result.output);
  const diagnostics = diagnosticsFromLog(result.output);
  if (result.error || result.status !== 0 || diagnostics.length > 0) {
    const first = diagnostics[0];
    fail('repository-static-compile', 'implementation', first?.code || 'STATIC_COMPILE_FAILED',
      `repository declaration consumption failed: ${normalizeText(result.output).split('\n').slice(-20).join('\n')}`,
      { status: result.status, signal: result.signal, diagnostics });
  }
  return {
    command: [toolchain.node, driver, paths.repositoryProjection],
    diagnostics,
    status: result.status
  };
}

function verifyCallerConfig(workspace) {
  const paths = declarationPaths(workspace);
  const config = readJsonFile(paths.repositoryCallerConfig, 'arktsconfig');
  const options = config.compilerOptions;
  assert.ok(options, 'arktsconfig compilerOptions must exist');
  assert.strictEqual(options.package, moduleIdentity.callerModule);
  const dependencies = options.dependencies || {};
  const component = dependencies[moduleIdentity.componentModule];
  const index = dependencies[moduleIdentity.indexModule];
  const packageEntry = dependencies[moduleIdentity.packageName];
  for (const [name, entry] of Object.entries({ component, index, packageEntry })) {
    assert.ok(entry, `arktsconfig dependency ${name} must exist`);
    assert.strictEqual(entry.language, 'js', `${name} must retain dynamic language identity`);
  }
  assert.strictEqual(canonicalPath(component.path), canonicalPath(paths.repositoryComponent));
  assert.strictEqual(canonicalPath(index.path), canonicalPath(paths.repositoryIndex));
  assert.strictEqual(canonicalPath(packageEntry.path), canonicalPath(paths.repositoryIndex));
  assert.strictEqual(canonicalPath(component.sourceFilePath), canonicalPath(path.join(
    workspace.root, 'dynamic_state_storage/src/main/ets/DynamicStateStorage.ets')));
  assert.strictEqual(canonicalPath(index.sourceFilePath), canonicalPath(path.join(
    workspace.root, 'dynamic_state_storage/Index.ets')));
  assert.strictEqual(component.ohmUrl, moduleIdentity.componentOhmUrl);
  assert.strictEqual(index.ohmUrl, moduleIdentity.indexOhmUrl);
  assert.strictEqual(packageEntry.ohmUrl, moduleIdentity.indexOhmUrl);
  return {
    configPath: paths.repositoryCallerConfig,
    package: options.package,
    dependencies: { component, index, packageEntry }
  };
}

function storageParameterCaller(testCase) {
  const marker = 'localCount: 12,';
  assert.ok(staticCaller.includes(marker), 'positive caller lost its legal State initializer');
  return staticCaller.replace(marker, `${marker}\n        ${testCase.assignment},`);
}

function verifyStorageParameterDiagnostics(workspace, toolchain, paths, options = {}) {
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const environment = options.env || process.env;
  const evidence = [];
  try {
    for (const testCase of storageParameterCases) {
      workspace.write('entry/src/main/ets/pages/Index.ets', storageParameterCaller(testCase));
      const projection = readJsonFile(paths.repositoryProjection, 'arktsconfig.projection');
      const outputRoot = path.join('negative-storage-parameters', testCase.id);
      projection.cachePath = path.join(workspace.root, outputRoot, 'cache');
      projection.loaderOutPath = path.join(workspace.root, outputRoot, 'ets');
      projection.aceModuleBuild = path.join(workspace.root, outputRoot, 'dynamic-ets');
      const projectionPath = workspace.write(`${outputRoot}/projection.json`, JSON.stringify(projection, null, 2));
      const result = runProcess(toolchain.node, [driver, projectionPath], {
        cwd: workspace.root,
        env: hvigorEnvironment(toolchain, workspace, environment),
        timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 240000)
      });
      const logPath = workspace.write(`evidence/${testCase.id}.log`, result.output);
      const diagnostics = diagnosticsFromLog(result.output);
      const normalized = normalizeText(result.output);
      const expectedMessage = `The '@${testCase.decorator}' property '${testCase.property}' in the custom component ` +
        `'${moduleIdentity.componentName}' cannot be initialized here (forbidden to specify).`;
      assert.notStrictEqual(result.status, 0,
        `${testCase.id}: explicit parent initialization must fail instead of producing ABC`);
      assert.ok(normalized.includes(normalizeText(expectedMessage)),
        `${testCase.id}: missing diagnostic ${expectedMessage}\nactual:\n${normalized}`);
      assert.ok(normalized.includes('entry/src/main/ets/pages/Index.ets'),
        `${testCase.id}: diagnostic must identify the caller source`);
      assert.ok(normalized.includes('ERROR Code: 11410001'), `${testCase.id}: missing driver error code`);
      assert.ok(normalized.includes('Plugin error EP0001'), `${testCase.id}: missing UI validator error code`);
      evidence.push({
        id: testCase.id,
        property: testCase.property,
        decorator: testCase.decorator,
        status: result.status,
        diagnostics,
        expectedMessage,
        logPath
      });
    }
  } finally {
    workspace.write('entry/src/main/ets/pages/Index.ets', staticCaller);
  }
  return evidence;
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or empty ${filePath}`, { filePath });
  }
  const content = fs.readFileSync(filePath);
  assert.strictEqual(content.subarray(0, 5).toString('ascii'), 'PANDA', `${stage}: invalid ABC header`);
  return content;
}

function disassemble(workspace, toolchain) {
  const abcPath = path.join(workspace.root, artifactContracts.repositoryStaticAbc);
  const outputPath = path.join(workspace.root, artifactContracts.staticDisassembly);
  const content = assertBinaryArtifact(abcPath, 'static-abc');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const executable = toolchain.staticDisassembler;
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.status !== 0) {
    fail('disassembly', 'environment', 'ARK_DISASM_FAILED',
      `static ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  workspace.record(path.relative(workspace.root, outputPath));
  const text = readNonemptyFile(outputPath, 'disassembly');
  assertFragments(text, [
    moduleIdentity.componentModule,
    moduleIdentity.componentOhmUrl,
    moduleIdentity.callerRecord,
    'CompatibleComponentInfo'
  ], 'repository static ABC identity');
  const bridge = assertStaticBridge(text, bridgeContract);
  return { abcPath, outputPath, bytes: content.length, bridge };
}

function firstFailure(failures, details) {
  const first = failures.find(item => (item.category || 'implementation') !== 'existing') || failures[0];
  const failure = first instanceof StageFailure ? first : new StageFailure(
    first.stage || 'full-chain',
    first.category || 'implementation',
    first.code || 'ASSERTION',
    first.message,
    first.details || {}
  );
  failure.details = { ...failure.details, ...details };
  failure.diagnostics = details.diagnostics;
  return failure;
}

async function runFullChain(options = {}) {
  const definition = {
    name: `pr09-${integratedCase.id}`,
    group: 'compile',
    direction: DIRECTION,
    kind: 'full-chain',
    coverage: 'Hvigor project preparation and dynamic declgen, current repository declgen, activated ArkTS 1.2 caller, State/Link/Prop parameters, storage rejection diagnostics, ABC and module identity'
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const tools = toolchainReport(toolchain);
    context.passStage('toolchain', { tools });
    const project = materializeProject(workspace, toolchain.sdkRoot);
    assert.strictEqual(projectContract().callerLanguage, '1.2');
    assert.strictEqual(projectContract().calleeLanguage, '1.1');
    context.passStage('materialize', project);
    const result = executeHvigor(workspace, toolchain, options);
    const failures = [];
    const generated = {};
    const attempt = (stage, body) => {
      try {
        const value = body();
        context.passStage(stage);
        return value;
      } catch (error) {
        error.stage = error.stage || stage;
        context.failStage(stage, error);
        failures.push(error);
        return undefined;
      }
    };
    attempt('Hvigor.prepare.project', () => verifyHvigorResult(result));
    generated.consumerSource = attempt('activate-static-caller', () => activateStaticCaller(workspace));
    const preparation = attempt('preparation-projection', () => verifyPreparationArtifacts(workspace));
    if (preparation) {
      generated.preparation = preparation;
    }
    const repositoryDeclarations = attempt('DeclfileProductor.runDeclgen', () =>
      generateRepositoryDeclarations(workspace));
    let repositoryPaths;
    if (repositoryDeclarations) {
      tools.push({
        name: 'declgen',
        path: path.join(COMPILER_ROOT, 'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
        version: require('declgen/package.json').version
      });
      generated.repository = repositoryDeclarations;
      repositoryPaths = attempt('repository-projection', () => prepareRepositoryProjection(workspace));
    }
    if (repositoryPaths) {
      generated.repositoryCompile = attempt('repository-static-compile', () =>
        executeRepositoryStaticCompile(workspace, toolchain, repositoryPaths, options));
      generated.callerConfig = attempt('arktsconfig', () => verifyCallerConfig(workspace));
    }
    generated.static = attempt('static-abc', () => disassemble(workspace, toolchain));
    if (repositoryPaths) {
      generated.storageParameterDiagnostics = attempt('storage-parent-parameter-diagnostics', () =>
        verifyStorageParameterDiagnostics(workspace, toolchain, repositoryPaths, options));
    }
    const details = {
      tools,
      generated,
      diagnostics: diagnosticsFromLog(result.output),
      command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()],
      projectRoot: workspace.root
    };
    if (failures.length > 0) {
      throw firstFailure(failures, details);
    }
    return {
      toolchain: tools,
      generated,
      diagnostics: details.diagnostics,
      command: details.command
    };
  }, options);
}

module.exports = {
  assertBinaryArtifact,
  disassemble,
  executeHvigor,
  executeRepositoryStaticCompile,
  firstFailure,
  generateRepositoryDeclarations,
  knownDeclarationDiagnostic,
  prepareRepositoryProjection,
  realDeclgenParameters,
  runFullChain,
  toolchainReport,
  validateToolchain,
  verifyCallerConfig,
  verifyComponentDeclaration,
  verifyHvigorResult,
  verifyPreparationArtifacts,
  verifyStorageParameterDiagnostics
};
