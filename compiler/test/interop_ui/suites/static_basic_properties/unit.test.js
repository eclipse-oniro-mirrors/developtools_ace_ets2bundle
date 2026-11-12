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
const { spawnSync } = require('child_process');
const ts = require('typescript');
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
  assertGlobalStateRestored,
  captureGlobalState,
  restoreGlobalState
} = require('../property_ref_contract/declgen_smoke');
const {
  compilerOptions,
  sdkFiles,
  trackProgram,
  writeFileTree
} = require('../property_ref_contract/program_harness');
const {
  callerLocations,
  projectFiles
} = require('./project_files');
const {
  associatedConsumersFor,
  dynamicIndex,
  dynamicSource,
  moduleIdentity,
  precompileScenario,
  scenarios
} = require('./source_cases');
const {
  consumerCodes,
  projectContract
} = require('./expected_cases');
const publicRunner = require('../../test');

const UNIT_TOOLCHAIN = [
  { name: 'ohos-typescript', path: require.resolve('typescript'), version: require('typescript/package.json').version },
  { name: '@panda/declgen', path: require.resolve('declgen'), version: require('declgen/package.json').version }
];

function loadCompilerModule(relativePath) {
  const absolutePath = path.join(COMPILER_ROOT, 'lib', relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail('toolchain', 'environment', 'INTEROP_LIB_MISSING',
      `run npm run interopBuild before PR06: ${absolutePath}`, { absolutePath });
  }
  try {
    return require(absolutePath);
  } catch (error) {
    return fail('toolchain', 'environment', 'INTEROP_LIB_LOAD_FAILED',
      `cannot load ${absolutePath}: ${error.message}`, { absolutePath });
  }
}

function declgenParameters(workspace, testCase, outputRoot) {
  const modulePath = path.join(workspace.root, 'dynamic_component');
  const sourcePath = path.join(modulePath, 'src/main/ets', testCase.sourceName);
  const indexPath = path.join(modulePath, 'Index.ets');
  const identity = moduleIdentity(testCase);
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: '',
    packageName: identity.packageName,
    moduleName: identity.packageName,
    modulePath,
    declgenV1OutPath: path.join(workspace.root, 'declgenV1'),
    declgenV2OutPath: outputRoot,
    dynamicFiles: [sourcePath, indexPath],
    staticFiles: [],
    cachePath: path.join(workspace.root, 'cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[identity.packageName, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(workspace.root, 'cache'),
      bundleName: projectContract.bundleName,
      mainModuleName: 'entry',
      projectRootPath: workspace.root,
      sdkAliasMap: new Map()
    },
    sourcePath,
    indexPath
  };
}

function generateDeclarations(workspace, testCase, relativeOutputRoot = 'generated') {
  const globalState = captureGlobalState();
  const { FileManager } = loadCompilerModule('fast_build/ark_compiler/interop/interop_manager.js');
  const { DeclfileProductor } = loadCompilerModule(
    'fast_build/ark_compiler/interop/run_declgen_standalone.js');
  try {
    FileManager.cleanFileManagerObject();
    FileManager.isInteropSDKEnabled = false;
    DeclfileProductor.systemModules = [];
    workspace.write(`dynamic_component/src/main/ets/${testCase.sourceName}`, dynamicSource(testCase));
    workspace.write('dynamic_component/Index.ets', dynamicIndex(testCase));
    const outputRoot = path.join(workspace.root, relativeOutputRoot);
    const parameters = declgenParameters(workspace, testCase, outputRoot);
    FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
    DeclfileProductor.init(parameters);
    DeclfileProductor.getInstance().runDeclgen(parameters);
    const componentDeclaration = path.join(outputRoot, 'src/main/ets/PropertyCard.d.ets');
    const indexDeclaration = path.join(outputRoot, 'Index.d.ets');
    readNonemptyFile(componentDeclaration, 'DeclfileProductor.runDeclgen');
    readNonemptyFile(indexDeclaration, 'DeclfileProductor.runDeclgen');
    return {
      componentDeclaration,
      indexDeclaration,
      outputRoot,
      parameters,
      sourcePath: parameters.sourcePath,
      indexPath: parameters.indexPath
    };
  } finally {
    restoreGlobalState(globalState);
    assertGlobalStateRestored(globalState);
  }
}

function parseDeclaration(filePath) {
  const text = readNonemptyFile(filePath, 'declaration-contract');
  const sourceFile = ts.createSourceFile(filePath, text, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  assert.deepStrictEqual((sourceFile.parseDiagnostics || []).map(diagnostic => diagnostic.code), []);
  return { sourceFile, text };
}

function findStruct(sourceFile, componentName) {
  const struct = sourceFile.statements.find(statement =>
    ts.isStructDeclaration(statement) && statement.name?.text === componentName);
  assert.ok(struct, `generated declaration has no struct ${componentName}`);
  return struct;
}

function findProperty(struct, propertyName) {
  const property = struct.members.find(member =>
    ts.isPropertyDeclaration(member) && member.name.text === propertyName);
  assert.ok(property, `generated struct ${struct.name.text} has no property ${propertyName}`);
  return property;
}

function decoratorNames(member) {
  const sourceFile = member.getSourceFile();
  return ts.getAllDecorators(member).map(decorator => {
    const expression = decorator.expression;
    return ts.isCallExpression(expression) ? expression.expression.getText(sourceFile) : expression.getText(sourceFile);
  });
}

function normalizedType(text) {
  return text.replace(/\s+/g, ' ').replace(/\s*=>\s*/g, ' => ').trim();
}

function assertGeneratedProperty(struct, declaration, checker) {
  const sourceFile = struct.getSourceFile();
  const generated = findProperty(struct, declaration.name);
  assert.strictEqual(Boolean(generated.questionToken), declaration.optional,
    `${declaration.name}: optional token differs`);
  assert.strictEqual(normalizedType(generated.type.getText(sourceFile)), normalizedType(declaration.type),
    `${declaration.name}: property type differs`);
  assert.strictEqual(generated.initializer, undefined,
    `${declaration.name}: declaration emit must not retain a runtime initializer`);
  const names = decoratorNames(generated);
  if (declaration.decorator) {
    const expectedDecorator = declaration.decorator === 'Prop' ? 'PropRef' : declaration.decorator;
    assert.ok(names.includes(expectedDecorator),
      `${declaration.name}: expected ${expectedDecorator}, actual ${names.join(',')}`);
  } else {
    assert.ok(!names.includes('Prop') && !names.includes('PropRef'),
      `${declaration.name}: plain event property must not acquire a state decorator`);
  }
  if (declaration.access) {
    const modifiers = (ts.getModifiers(generated) || []).map(modifier => ts.tokenToString(modifier.kind));
    if (declaration.access === 'public') {
      assert.ok(!modifiers.includes('private') && !modifiers.includes('protected'),
        `${declaration.name}: public property became non-public`);
    } else {
      assert.ok(modifiers.includes(declaration.access),
        `${declaration.name}: ${declaration.access} modifier was lost`);
    }
  }
  const symbol = checker.getSymbolAtLocation(generated.name);
  assert.ok(symbol, `${declaration.name}: generated property symbol is missing`);
  const type = checker.getTypeOfSymbolAtLocation(symbol, generated);
  assert.strictEqual(normalizedType(checker.typeToString(type)), normalizedType(declaration.type),
    `${declaration.name}: checker type differs`);
  return generated;
}

function verifyDeclarationContract(generated, testCase) {
  const parsed = parseDeclaration(generated.componentDeclaration);
  const barrel = parseDeclaration(generated.indexDeclaration);
  assertFragments(parsed.text, [`'use static'`, `export declare struct ${testCase.componentName}`],
    `${testCase.id} component declaration`);
  assertFragments(barrel.text, [
    `'use static'`,
    `export { ${testCase.componentName} } from './src/main/ets/PropertyCard';`
  ], `${testCase.id} barrel declaration`);
  const program = ts.createProgram({
    rootNames: [generated.componentDeclaration, generated.indexDeclaration, ...Object.values(writeFileTree(
      path.dirname(generated.outputRoot), sdkFiles))],
    options: compilerOptions(path.dirname(generated.outputRoot))
  });
  const release = trackProgram(program);
  try {
    const sourceFile = program.getSourceFile(generated.componentDeclaration);
    assert.ok(sourceFile, 'generated component was not included in its declaration Program');
    const struct = findStruct(sourceFile, testCase.componentName);
    const expectedOrder = [...testCase.properties,
      ...testCase.stateProperties.filter(declaration => declaration.access !== 'private')].map(item => item.name);
    const actualOrder = struct.members.filter(ts.isPropertyDeclaration).map(member => member.name.text);
    assert.deepStrictEqual(actualOrder, expectedOrder, `${testCase.id}: public property order differs`);
    const checker = program.getTypeChecker();
    for (const declaration of testCase.properties) {
      assertGeneratedProperty(struct, declaration, checker);
    }
    for (const declaration of testCase.stateProperties) {
      if (declaration.access === 'private') {
        assert.ok(!struct.members.some(member => ts.isPropertyDeclaration(member) &&
          member.name.text === declaration.name), `${declaration.name}: private state leaked into the public declaration`);
        continue;
      }
      assertGeneratedProperty(struct, declaration, checker);
    }
    return { declarationText: parsed.text, barrelText: barrel.text };
  } finally {
    release();
  }
}

function moduleRequest(fromFile, declarationPath) {
  const withoutExtension = declarationPath.replace(/\.d\.ets$/, '');
  const relative = path.relative(path.dirname(fromFile), withoutExtension).replace(/\\/g, '/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function consumerSource(testCase, request) {
  return `'use static'
import { ${testCase.componentName} } from '${request}';

export function consume(card: ${testCase.componentName}): void {
  const observed: ${testCase.consumerType} = card.${testCase.consumerProperty};
}
`;
}

function diagnosticRecords(sourceFile, diagnostics) {
  return diagnostics.map(diagnostic => {
    const location = sourceFile.getLineAndCharacterOfPosition(diagnostic.start || 0);
    return {
      code: `TS${diagnostic.code}`,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
      file: sourceFile.fileName,
      line: location.line + 1,
      column: location.character + 1
    };
  });
}

function verifyConsumer(testCase, generated, workspace) {
  const consumerPath = path.join(workspace.root, 'consumer/consumer.ets');
  const request = moduleRequest(consumerPath, generated.componentDeclaration);
  const source = consumerSource(testCase, request);
  workspace.write('consumer/consumer.ets', source);
  const materializedSdk = writeFileTree(workspace.root, sdkFiles);
  const program = ts.createProgram({
    rootNames: [consumerPath, generated.componentDeclaration, ...Object.values(materializedSdk)],
    options: compilerOptions(workspace.root)
  });
  const release = trackProgram(program);
  try {
    const resolved = ts.resolveModuleName(request, consumerPath, program.getCompilerOptions(), ts.sys).resolvedModule;
    assert.ok(resolved, `${testCase.id}: generated declaration did not resolve`);
    assert.strictEqual(path.resolve(resolved.resolvedFileName), path.resolve(generated.componentDeclaration));
    assert.strictEqual(resolved.extension, '.d.ets');
    const consumer = program.getSourceFile(consumerPath);
    assert.ok(consumer, `${testCase.id}: consumer was not included in Program`);
    assert.deepStrictEqual(diagnosticRecords(consumer, program.getSyntacticDiagnostics(consumer)), []);
    const diagnostics = diagnosticRecords(consumer, program.getSemanticDiagnostics(consumer));
    const sourceLines = source.split('\n');
    const assignmentLine = sourceLines.findIndex(line => line.includes('const observed:')) + 1;
    if (!testCase.expectedConsumerCode) {
      assert.deepStrictEqual(diagnostics, [], `${testCase.id}: valid consumer must have no semantic diagnostics`);
    } else {
      assert.ok(diagnostics.length > 0, `${testCase.id}: mismatch was accepted by the consumer checker`);
      const first = diagnostics[0];
      assert.strictEqual(first.code, testCase.expectedConsumerCode);
      assert.strictEqual(first.line, assignmentLine);
      const marker = testCase.expectedConsumerCode === consumerCodes.privateProperty ?
        testCase.consumerProperty : 'observed';
      const expectedColumn = sourceLines[assignmentLine - 1].indexOf(marker) + 1;
      assert.ok(expectedColumn > 0, `${testCase.id}: diagnostic marker is absent`);
      assert.strictEqual(first.column, expectedColumn, `${testCase.id}: wrong diagnostic column`);
      assert.strictEqual(first.file, consumerPath);
      assert.ok(first.message.length > 0);
    }
    return { consumerPath, request, diagnostics, assignmentLine };
  } finally {
    release();
  }
}

async function runDeclarationCase(testCase, options) {
  return executeCase({
    name: testCase.id,
    group: 'unit',
    direction: DIRECTION,
    kind: 'declaration-consumer',
    coverage: `${testCase.branch}: ${testCase.purpose}`
  }, async context => {
    const generated = generateDeclarations(context.workspace, testCase);
    context.passStage('DeclfileProductor.runDeclgen', {
      componentDeclaration: generated.componentDeclaration,
      indexDeclaration: generated.indexDeclaration
    });
    verifyDeclarationContract(generated, testCase);
    context.passStage('declaration-contract', { branch: testCase.branch });
    const consumer = verifyConsumer(testCase, generated, context.workspace);
    context.passStage('static-consumer-typecheck', {
      diagnostics: consumer.diagnostics,
      assignmentLine: consumer.assignmentLine
    });
    return {
      toolchain: UNIT_TOOLCHAIN,
      generated: {
        componentDeclaration: generated.componentDeclaration,
        indexDeclaration: generated.indexDeclaration,
        consumerPath: consumer.consumerPath
      },
      diagnostics: consumer.diagnostics
    };
  }, options);
}

function verifyScenarioMatrix() {
  const ids = scenarios.map(testCase => testCase.id);
  const branches = scenarios.map(testCase => testCase.branch);
  const purposes = scenarios.map(testCase => testCase.purpose);
  assert.strictEqual(new Set(ids).size, ids.length);
  assert.strictEqual(new Set(branches).size, branches.length);
  assert.strictEqual(new Set(purposes).size, purposes.length);
  assert.ok(scenarios.length >= 20);
  assert.strictEqual(scenarios.filter(testCase => testCase.fullChain).length, 13);
  const associated = scenarios.filter(testCase => testCase.fullChain).flatMap(associatedConsumersFor);
  assert.deepStrictEqual(associated.map(testCase => testCase.id).sort(),
    scenarios.filter(testCase => !testCase.fullChain).map(testCase => testCase.id).sort());
  assert.strictEqual(new Set(associated.map(testCase => testCase.id)).size, associated.length);
  assert.strictEqual(associated.length, scenarios.length - 13);
  assert.ok(scenarios.filter(testCase => testCase.properties.some(property => property.abcValue)).length >= 4);
  for (const testCase of scenarios) {
    assert.ok(testCase.id.startsWith('pr06-'));
    assert.ok(testCase.properties.length > 0);
    assert.ok(testCase.purpose.length > 40);
    assert.ok(dynamicSource(testCase).includes(`export struct ${testCase.componentName}`));
    const identities = moduleIdentity(testCase);
    assert.ok(identities.componentOhmUrl.includes('PropertyCard'));
    if (testCase.expectedConsumerCode) {
      assert.ok(Object.values(consumerCodes).includes(testCase.expectedConsumerCode));
    }
    if (testCase.expectedStaticDiagnostic) {
      assert.strictEqual(testCase.fullChain, true);
      assert.ok(testCase.expectedStaticDiagnostic.messageFragments.length > 0);
      const precompile = precompileScenario(testCase);
      for (const property of precompile.properties.filter(item => item.hasCaller)) {
        assert.notStrictEqual(property.caller, undefined, `${testCase.id}: missing legal precompile caller`);
      }
      assert.ok(precompile.properties.some((property, index) =>
        property.caller !== testCase.properties[index].caller), `${testCase.id}: negative caller was not replaced`);
    }
  }
  for (const type of ['number', 'string', 'boolean']) {
    assert.ok(scenarios.some(testCase => testCase.properties.some(property => property.type === type)));
    assert.ok(scenarios.some(testCase => testCase.properties.some(property =>
      property.type === type && property.initializer !== undefined)));
  }
  assert.ok(scenarios.some(testCase => testCase.properties.some(property => property.optional)));
  assert.ok(scenarios.some(testCase => testCase.properties.some(property => property.event)));
}

function verifySourceLocations() {
  for (const testCase of scenarios.filter(item => item.expectedStaticDiagnostic)) {
    const locations = callerLocations(testCase);
    const expectation = testCase.expectedStaticDiagnostic;
    assert.ok(locations.componentCallLine > 0, testCase.id);
    assert.ok(locations.argumentLines[expectation.sourceProperty] > 0, testCase.id);
  }
}

function verifyProjectStringIsolation() {
  for (const testCase of scenarios.filter(item => item.fullChain)) {
    const files = projectFiles(testCase, '/selected/pr06/sdk root');
    assert.strictEqual(files['local.properties'], 'sdk.dir=/selected/pr06/sdk root\n');
    assert.ok(!JSON.stringify(files).includes('/Users/lxc/'));
    assert.ok(files['build-profile.json5'].includes('"arkTSVersion": "1.2"'));
    assert.ok(files['entry/src/main/ets/pages/Index.ets'].startsWith(`'use static'`));
    assert.ok(files[`dynamic_component/src/main/ets/${testCase.sourceName}`].includes('@Component'));
    assert.strictEqual(projectContract.callerLanguage, '1.2');
    assert.strictEqual(projectContract.calleeLanguage, '1.1');
  }
}

function verifyCaseProtocol() {
  const valid = {
    name: 'pr06-protocol-sample',
    group: 'unit',
    direction: DIRECTION,
    kind: 'specialized',
    status: 'failed',
    failure: {
      stage: 'static-consumer-typecheck',
      category: 'implementation',
      code: 'TS2322',
      message: 'wrong primitive type'
    }
  };
  assert.strictEqual(publicRunner.validateCaseResult(valid, 'static_basic_properties', { group: 'unit' }), valid);
  assert.throws(() => publicRunner.validateCaseResult({
    ...valid,
    failure: { stage: '', category: '', code: '', message: '' }
  }, 'static_basic_properties', { group: 'unit' }), /incomplete failure/);
}

function verifyIndependentCli() {
  const entry = path.join(__dirname, 'run.js');
  const empty = spawnSync(process.execPath, [entry, '--group', 'unit', '--direction', '11-to-12'], {
    encoding: 'utf8'
  });
  assert.notStrictEqual(empty.status, 0, 'opposite-direction zero-case CLI run must fail');
  assert.ok(`${empty.stdout}${empty.stderr}`.includes('NO_CASES'));
  const invalid = spawnSync(process.execPath, [entry, '--group', 'invalid'], { encoding: 'utf8' });
  assert.notStrictEqual(invalid.status, 0, 'invalid independent CLI arguments must fail');
}

const registryCases = [
  {
    id: 'pr06-matrix-completeness',
    coverage: 'unique scenarios, primitive/default/optional/event coverage and full-chain selection',
    body: verifyScenarioMatrix
  },
  {
    id: 'pr06-negative-source-locations',
    coverage: 'each negative static caller has an independently computed diagnostic source location',
    body: verifySourceLocations
  },
  {
    id: 'pr06-project-string-isolation',
    coverage: 'SDK paths, source language markers and all project fixtures are materialized from strings',
    body: verifyProjectStringIsolation
  },
  {
    id: 'pr06-public-case-protocol',
    coverage: 'case fields and structured failure records satisfy the shared runner without modifying it',
    body: verifyCaseProtocol
  },
  {
    id: 'pr06-independent-cli-zero-cases',
    coverage: 'standalone CLI rejects empty selection and invalid arguments with nonzero exit codes',
    body: verifyIndependentCli
  }
];

async function runUnitCases(options = {}) {
  const results = [];
  for (const registryCase of registryCases) {
    results.push(await executeCase({
      name: registryCase.id,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: registryCase.coverage
    }, registryCase.body, options));
  }
  for (const testCase of scenarios) {
    results.push(await runDeclarationCase(testCase, options));
  }
  return results;
}

module.exports = {
  UNIT_TOOLCHAIN,
  consumerSource,
  diagnosticRecords,
  findProperty,
  findStruct,
  generateDeclarations,
  loadCompilerModule,
  parseDeclaration,
  runDeclarationCase,
  runUnitCases,
  verifyConsumer,
  verifyDeclarationContract
};
