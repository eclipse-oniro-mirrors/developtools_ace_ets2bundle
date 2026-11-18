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

const crypto = require('crypto');
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
} = require('../static_calls_dynamic_basic/harness');
const {
  captureGlobalState,
  restoreGlobalState,
  assertGlobalStateRestored,
  seedGlobalStateForIsolation
} = require('../property_ref_contract/declgen_smoke');
const {
  compilerOptions,
  writeFileTree
} = require('../property_ref_contract/program_harness');
const {
  declarationProbes,
  moduleIdentity
} = require('./source_cases');
const {
  artifactContracts,
  consumerSource,
  generatedDeclarations,
  mockSdkFiles
} = require('./expected_cases');
const {
  expectedGeneratedRelativePaths,
  materializeCompoundProject
} = require('./project_files');

const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));
const silentLogger = require(path.join(COMPILER_ROOT, 'node_modules/declgen/build/src/logger/SilentLogger'));

function loadInteropModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail('toolchain', 'environment', 'INTEROP_LIB_MISSING',
      `run npm run interopBuild before PR07: ${absolutePath}`, { absolutePath });
  }
  try {
    return require(absolutePath);
  } catch (error) {
    return fail('toolchain', 'environment', 'INTEROP_LIB_LOAD_FAILED',
      `cannot load ${absolutePath}: ${error.message}`, { absolutePath });
  }
}

function toolchain() {
  const typescriptPackage = require(path.join(COMPILER_ROOT, 'node_modules/typescript/package.json'));
  const declgenPackage = require(path.join(COMPILER_ROOT, 'node_modules/declgen/package.json'));
  return [
    { name: 'node', path: process.execPath, version: process.version },
    {
      name: 'ohos-typescript',
      path: path.join(COMPILER_ROOT, 'node_modules/typescript'),
      version: typescriptPackage.version
    },
    {
      name: 'declgen',
      path: path.join(COMPILER_ROOT, 'node_modules/declgen'),
      version: declgenPackage.version
    }
  ];
}

function declgenParameters(project, outputRoot) {
  const moduleRoot = path.join(project.projectRoot, 'dynamic_component');
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: '',
    packageName: moduleIdentity.packageName,
    moduleName: moduleIdentity.packageName,
    modulePath: moduleRoot,
    declgenV2OutPath: outputRoot,
    dynamicFiles: project.dynamicFiles,
    staticFiles: [],
    cachePath: path.join(project.projectRoot, 'declgen-cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[moduleIdentity.packageName, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(project.projectRoot, 'repository-declgen-cache'),
      bundleName: moduleIdentity.bundleName,
      mainModuleName: moduleIdentity.callerPackage,
      projectRootPath: project.projectRoot,
      sdkAliasMap: new Map()
    }
  };
}

function fileDigest(filePath) {
  const content = readNonemptyFile(filePath, 'declgenV2');
  return {
    path: filePath,
    bytes: Buffer.byteLength(content),
    sha256: crypto.createHash('sha256').update(content).digest('hex')
  };
}

function prepareDeclgenState(FileManager, DeclfileProductor) {
  FileManager.cleanFileManagerObject();
  FileManager.isInteropSDKEnabled = false;
  DeclfileProductor.systemModules = [];
  silentLogger.logMessages.length = 0;
  const prepared = {
    systemModules: [...DeclfileProductor.systemModules],
    loggerMessageCount: silentLogger.logMessages.length,
    isInteropSDKEnabled: FileManager.isInteropSDKEnabled
  };
  assert.deepStrictEqual(prepared, {
    systemModules: [],
    loggerMessageCount: 0,
    isInteropSDKEnabled: false
  }, 'declgen global state must be prepared before FileManager.init');
  return prepared;
}

function generateFreshDeclarations(workspace, project, relativeOutputRoot = artifactContracts.repositoryDeclgenRoot) {
  const outputRoot = path.isAbsolute(relativeOutputRoot) ? relativeOutputRoot :
    path.join(workspace.root, relativeOutputRoot);
  assert.ok(!fs.existsSync(outputRoot),
    `fresh output root must not pre-exist in a new case: ${outputRoot}`);
  const parameters = declgenParameters(project, outputRoot);
  const { FileManager } = loadInteropModule('fast_build/ark_compiler/interop/interop_manager.js');
  const { DeclfileProductor } = loadInteropModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  const globalState = captureGlobalState();
  let failure;
  let prepared;
  try {
    fs.rmSync(path.join(workspace.root, 'build/.declgen-cache'), { recursive: true, force: true });
    prepared = prepareDeclgenState(FileManager, DeclfileProductor);
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
  } catch (error) {
    failure = error;
  }
  try {
    FileManager.cleanFileManagerObject();
    restoreGlobalState(globalState);
    assertGlobalStateRestored(globalState);
  } catch (error) {
    error.stage = 'declgen.cleanup';
    error.code = error.code || 'DECLGEN_STATE_RESTORE';
    error.category = 'implementation';
    failure = failure || error;
  }
  if (failure) {
    throw failure;
  }
  const relativePaths = expectedGeneratedRelativePaths(project.scenarioId || 'compound');
  const files = relativePaths.map(relativePath => path.join(outputRoot, relativePath));
  const digests = files.map(fileDigest);
  const evidence = {
    outputRoot,
    generatedDuringThisCase: true,
    prepared,
    dynamicFiles: project.dynamicFiles,
    files: digests
  };
  workspace.write(artifactContracts.generationEvidence, JSON.stringify(evidence, null, 2));
  return { outputRoot, files, digests, parameters, evidence };
}

function declarationPath(generated, basename) {
  const suffix = basename === 'Index' ? 'Index.d.ets' : `src/main/ets/${basename}.d.ets`;
  const match = generated.files.find(filePath => filePath.endsWith(suffix));
  assert.ok(match, `generated declaration is missing ${basename}: ${generated.files.join(', ')}`);
  return match;
}

function verifyDeclaration(generated, basename, expectation) {
  const filePath = declarationPath(generated, basename);
  const content = readNonemptyFile(filePath, 'declgenV2');
  assertFragments(content, expectation.required, `${basename} declaration`);
  assertForbidden(content, expectation.forbidden, `${basename} declaration`);
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  assert.deepStrictEqual((sourceFile.parseDiagnostics || []).map(item => item.code), [],
    `${basename} generated declaration must be parseable`);
  return { filePath, content, sourceFile };
}

function transformDeclarationProbe(workspace, source) {
  workspace.write('input/Index.d.ets', source);
  const outputPath = path.join(workspace.root, 'transformed/Index.d.ets');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const { processInteropUI } = loadInteropModule('process_interop_ui.js');
  processInteropUI(path.join(workspace.root, 'input'), outputPath);
  const actual = readNonemptyFile(outputPath, 'processInteropUI');
  workspace.write('evidence/probe-output.txt', actual);
  return { actual, outputPath };
}

function materializeConsumerSdk(workspace) {
  return writeFileTree(workspace.root, mockSdkFiles);
}

function consumeCurrentDeclarations(workspace, generated) {
  const cardPath = declarationPath(generated, 'CompoundCard');
  const modelPath = declarationPath(generated, 'CompoundModels');
  const indexPath = declarationPath(generated, 'Index');
  const consumerPath = path.join(generated.outputRoot, 'Consumer.ets');
  workspace.write(path.relative(workspace.root, consumerPath), consumerSource);
  const sdk = materializeConsumerSdk(workspace);
  const options = compilerOptions(workspace.root);
  const rootNames = [consumerPath, cardPath, modelPath, indexPath, ...Object.values(sdk)];
  const program = ts.createProgram({ rootNames, options });
  let evidence;
  try {
    const consumer = program.getSourceFile(consumerPath);
    assert.ok(consumer, 'consumer source must belong to the Program');
    const syntactic = program.getSyntacticDiagnostics(consumer).map(item => item.code);
    const semantic = program.getSemanticDiagnostics(consumer).map(item => ({
      code: item.code,
      message: ts.flattenDiagnosticMessageText(item.messageText, ' ')
    }));
    assert.deepStrictEqual(syntactic, [], 'consumer syntactic diagnostics');
    assert.deepStrictEqual(semantic, [], 'consumer semantic diagnostics');
    const resolved = ts.resolveModuleName('./src/main/ets/CompoundCard', consumerPath, options, ts.sys).resolvedModule;
    assert.ok(resolved, 'generated CompoundCard module did not resolve');
    assert.strictEqual(path.resolve(resolved.resolvedFileName), path.resolve(cardPath));
    assert.strictEqual(resolved.extension, '.d.ets');
    const importDeclaration = consumer.statements.find(statement =>
      ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === './src/main/ets/CompoundCard');
    const specifier = importDeclaration.importClause.namedBindings.elements[0];
    const checker = program.getTypeChecker();
    const imported = checker.getSymbolAtLocation(specifier.name);
    assert.ok(imported, 'CompoundCard import has no checker symbol');
    const symbol = checker.getAliasedSymbol(imported);
    assert.ok(symbol.declarations.some(declaration =>
      path.resolve(declaration.getSourceFile().fileName) === path.resolve(cardPath) &&
      ts.isStructDeclaration(declaration)), 'import must resolve to the fresh struct declaration');
    evidence = {
      consumerPath,
      resolvedFileName: resolved.resolvedFileName,
      consumedGeneratedPaths: [cardPath, modelPath, indexPath],
      symbolDeclarations: symbol.declarations.map(item => item.getSourceFile().fileName),
      syntactic,
      semantic
    };
  } finally {
    if (typeof program.releaseTypeChecker === 'function') {
      program.releaseTypeChecker();
    }
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
  }
  workspace.write(artifactContracts.consumptionEvidence, JSON.stringify(evidence, null, 2));
  return evidence;
}

async function executeDeclarationCase(definition, options, body) {
  return executeCase({
    name: definition.name,
    group: 'unit',
    direction: DIRECTION,
    kind: definition.kind || 'declaration',
    coverage: definition.coverage
  }, async context => {
    const details = await body(context);
    context.passStage(definition.stage || 'DeclfileProductor.runDeclgen');
    return {
      toolchain: toolchain(),
      ...details
    };
  }, options);
}

async function runRealDeclarationCase(definition, options, assertion) {
  return executeDeclarationCase(definition, options, async context => {
    const project = materializeCompoundProject(context.workspace, '/unit-sdk', 'compound');
    const generated = generateFreshDeclarations(context.workspace, project);
    const result = await assertion(context, project, generated);
    return { generated, ...result };
  });
}

async function runDeclarationUnits(options = {}) {
  const results = [];
  for (const probe of declarationProbes) {
    results.push(await executeDeclarationCase({
      name: `compound-probe-${probe.id}`,
      kind: 'specialized',
      stage: 'processInteropUI',
      coverage: probe.title
    }, options, async context => {
      const transformed = transformDeclarationProbe(context.workspace, probe.source);
      assertFragments(transformed.actual, probe.required, probe.id);
      assertForbidden(transformed.actual, probe.forbidden, probe.id);
      context.passStage('compound-type-contract');
      return { generated: transformed };
    }));
  }
  results.push(await runRealDeclarationCase({
    name: 'compound-declgen-public-models-and-nesting',
    coverage: 'Observed classes, public interfaces, nested named models and constructors'
  }, options, async (context, project, generated) => {
    const models = verifyDeclaration(generated, 'CompoundModels', generatedDeclarations.CompoundModels);
    const index = verifyDeclaration(generated, 'Index', generatedDeclarations.Index);
    context.passStage('public-model-signatures');
    return { declarations: { models, index } };
  }));
  results.push(await runRealDeclarationCase({
    name: 'compound-declgen-component-arrays-and-unions',
    coverage: 'Array suffix/generic forms, nullable union aliases and component PropRef signatures'
  }, options, async (context, project, generated) => {
    const component = verifyDeclaration(generated, 'CompoundCard', generatedDeclarations.CompoundCard);
    assertFragments(component.content, [
      'aliases: ReadonlyArray<string>;',
      'matrix: ScoreMatrix;',
      'profileHistory: ProfileList;',
      'optionalProfile: NullableProfile;'
    ], 'compound public parameter types');
    context.passStage('component-parameter-signatures');
    return { declarations: { component } };
  }));
  results.push(await runRealDeclarationCase({
    name: 'compound-consumer-checker-resolves-current-declarations',
    coverage: 'Consumer Program resolves the exact fresh declaration paths and public callable types'
  }, options, async (context, project, generated) => {
    verifyDeclaration(generated, 'CompoundCard', generatedDeclarations.CompoundCard);
    verifyDeclaration(generated, 'CompoundModels', generatedDeclarations.CompoundModels);
    const consumption = consumeCurrentDeclarations(context.workspace, generated);
    assert.strictEqual(consumption.semantic.length, 0);
    assert.ok(consumption.consumedGeneratedPaths.every(filePath => generated.files.includes(filePath)));
    context.passStage('consumer-checker');
    return { consumption };
  }));
  results.push(await runRealDeclarationCase({
    name: 'compound-declgen-repeat-is-fresh-and-deterministic',
    coverage: 'Two newly generated roots contain identical contracts and cannot reuse a checked-in adapter'
  }, options, async (context, project, generated) => {
    const repeated = generateFreshDeclarations(context.workspace, project,
      'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2-repeat');
    assert.notStrictEqual(repeated.outputRoot, generated.outputRoot);
    assert.deepStrictEqual(repeated.digests.map(item => item.sha256),
      generated.digests.map(item => item.sha256));
    assert.ok(repeated.files.every(filePath => !generated.files.includes(filePath)));
    context.passStage('fresh-repeat');
    return { repeated };
  }));
  results.push(await runRealDeclarationCase({
    name: 'compound-declgen-prepares-and-restores-polluted-globals',
    coverage: 'Prepared systemModules, logger messages and interop flag stay isolated from pre-seeded pollution'
  }, options, async (context, project, generated) => {
    const polluted = seedGlobalStateForIsolation();
    try {
      const isolated = generateFreshDeclarations(context.workspace, project,
        'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2-polluted');
      assert.deepStrictEqual(isolated.evidence.prepared, {
        systemModules: [],
        loggerMessageCount: 0,
        isInteropSDKEnabled: false
      });
      assertGlobalStateRestored(polluted.seeded);
      return { isolated };
    } finally {
      restoreGlobalState(polluted.original);
      assertGlobalStateRestored(polluted.original);
    }
  }));
  return results;
}

module.exports = {
  consumeCurrentDeclarations,
  declarationPath,
  declgenParameters,
  fileDigest,
  generateFreshDeclarations,
  loadInteropModule,
  prepareDeclgenState,
  runDeclarationUnits,
  toolchain,
  transformDeclarationProbe,
  verifyDeclaration
};
