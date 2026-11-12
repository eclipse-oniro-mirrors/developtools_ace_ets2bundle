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
const ts = require('typescript');
const { Logger } = require('declgen/build/src/logger/Logger');
const silentLogger = require('declgen/build/src/logger/SilentLogger');
const { DeclfileProductor } = require('../../../../lib/fast_build/ark_compiler/interop/run_declgen_standalone');
const { FileManager } = require('../../../../lib/fast_build/ark_compiler/interop/interop_manager');
const { findStruct } = require('./ast_assertions');
const {
  compilerOptions,
  createTemporaryDirectory,
  sdkFiles,
  trackProgram,
  writeFileTree
} = require('./program_harness');

function staticFieldNames(owner) {
  return Object.getOwnPropertyNames(owner).filter(field =>
    !['length', 'name', 'prototype'].includes(field) && typeof owner[field] !== 'function').sort();
}

function snapshotField(value) {
  if (Array.isArray(value)) {
    return { kind: 'array', reference: value, value: [...value] };
  }
  if (value instanceof Map) {
    return { kind: 'map', reference: value, value: new Map(value) };
  }
  if (value instanceof Set) {
    return { kind: 'set', reference: value, value: new Set(value) };
  }
  return { kind: 'value', value };
}

function snapshotStatics(owner) {
  return Object.fromEntries(staticFieldNames(owner).map(field => [field, snapshotField(owner[field])]));
}

function restoreField(snapshot) {
  if (snapshot.kind === 'array') {
    snapshot.reference.splice(0, snapshot.reference.length, ...snapshot.value);
    return snapshot.reference;
  }
  if (snapshot.kind === 'map') {
    snapshot.reference.clear();
    snapshot.value.forEach((value, key) => snapshot.reference.set(key, value));
    return snapshot.reference;
  }
  if (snapshot.kind === 'set') {
    snapshot.reference.clear();
    snapshot.value.forEach(value => snapshot.reference.add(value));
    return snapshot.reference;
  }
  return snapshot.value;
}

function restoreStatics(owner, snapshot) {
  staticFieldNames(owner).filter(field => !Object.hasOwn(snapshot, field)).forEach(field => {
    delete owner[field];
  });
  Object.entries(snapshot).forEach(([field, value]) => {
    owner[field] = restoreField(value);
  });
}

function assertStaticsRestored(owner, snapshot) {
  assert.deepStrictEqual(staticFieldNames(owner), Object.keys(snapshot).sort());
  Object.entries(snapshot).forEach(([field, saved]) => {
    if (saved.kind === 'value') {
      assert.strictEqual(owner[field], saved.value, `${field} was not restored`);
      return;
    }
    assert.strictEqual(owner[field], saved.reference, `${field} identity was not restored`);
    if (saved.kind === 'array') {
      assert.deepStrictEqual(owner[field], saved.value, `${field} contents were not restored`);
    } else {
      assert.deepStrictEqual(Array.from(owner[field]), Array.from(saved.value), `${field} entries were not restored`);
    }
  });
}

function captureGlobalState() {
  return {
    loggerInstance: Logger.instance,
    logMessages: { reference: silentLogger.logMessages, value: [...silentLogger.logMessages] },
    fileManager: snapshotStatics(FileManager),
    declfileProductor: snapshotStatics(DeclfileProductor)
  };
}

function prepareGlobalState() {
  FileManager.cleanFileManagerObject();
  FileManager.isInteropSDKEnabled = false;
  DeclfileProductor.systemModules = [];
  silentLogger.logMessages.length = 0;
}

function restoreGlobalState(state) {
  Logger.instance = state.loggerInstance;
  state.logMessages.reference.splice(0, state.logMessages.reference.length, ...state.logMessages.value);
  silentLogger.logMessages = state.logMessages.reference;
  FileManager.cleanFileManagerObject();
  restoreStatics(FileManager, state.fileManager);
  restoreStatics(DeclfileProductor, state.declfileProductor);
}

function seedGlobalStateForIsolation() {
  const original = captureGlobalState();
  Logger.instance = { sentinel: 'pr04-logger' };
  silentLogger.logMessages.push('pr04-log-message');
  FileManager.instance = { sentinel: 'pr04-file-manager' };
  FileManager.dynamicLibPath.add('/pr04-dynamic-lib');
  FileManager.isInteropSDKEnabled = true;
  DeclfileProductor.declFileProductor = { sentinel: 'pr04-productor' };
  DeclfileProductor.systemModules.push('pr04-system-module');
  DeclfileProductor.compilerOptions = { sentinel: true };
  return { original, seeded: captureGlobalState() };
}

function assertGlobalStateRestored(state) {
  assert.strictEqual(Logger.instance, state.loggerInstance, 'declgen Logger instance was not restored');
  assert.strictEqual(silentLogger.logMessages, state.logMessages.reference, 'logMessages array identity changed');
  assert.deepStrictEqual(silentLogger.logMessages, state.logMessages.value, 'logMessages contents changed');
  assertStaticsRestored(FileManager, state.fileManager);
  assertStaticsRestored(DeclfileProductor, state.declfileProductor);
  assert.strictEqual(FileManager.isInteropSDKEnabled, state.fileManager.isInteropSDKEnabled.value);
}

function listFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }
  const files = [];
  fs.readdirSync(directory, { withFileTypes: true }).forEach(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  });
  return files.sort();
}

function declarationPathFor(testCase, outputDirectory) {
  return path.join(outputDirectory, 'src/main/ets', testCase.sourceName.replace(/\.ets$/, '.d.ets'));
}

function createDeclgenParameters(testCase, temporaryDirectory, modulePath, sourcePath, outputDirectory) {
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: '',
    packageName: `property_ref_${testCase.id}`,
    moduleName: 'propertyRefHar',
    modulePath,
    declgenV1OutPath: path.join(temporaryDirectory, 'declgenV1'),
    declgenV2OutPath: outputDirectory,
    dynamicFiles: [sourcePath],
    staticFiles: [],
    cachePath: path.join(temporaryDirectory, 'cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  return {
    dependentModuleMap: new Map([[moduleInfo.packageName, moduleInfo]]),
    projectConfig: {
      cachePath: path.join(temporaryDirectory, 'cache'),
      bundleName: 'com.example.propertyref.contract',
      mainModuleName: 'entry',
      projectRootPath: temporaryDirectory
    }
  };
}

function parseDeclaration(outputPath) {
  const declarationText = fs.readFileSync(outputPath, 'utf8');
  assert.ok(declarationText.trim().length > 0, `Empty declaration output: ${outputPath}`);
  const sourceFile = ts.createSourceFile(outputPath, declarationText, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  assert.deepStrictEqual((sourceFile.parseDiagnostics || []).map(diagnostic => diagnostic.code), []);
  return { declarationText, sourceFile };
}

function moduleRequest(fromFile, outputPath) {
  const relative = path.relative(path.dirname(fromFile), outputPath.replace(/\.d\.ets$/, '')).replace(/\\/g, '/');
  return relative.startsWith('.') ? relative : `./${relative}`;
}

function consumerSource(testCase, request) {
  return `
import { ${testCase.componentName} } from '${request}';

function consumeGenerated(card: ${testCase.componentName}): ${testCase.consumerType} {
  return card.${testCase.consumerProperty};
}
`;
}

function assertResolvedComponent(checker, consumer, declarationPath, testCase) {
  const importDeclaration = consumer.statements.find(ts.isImportDeclaration);
  const importSpecifier = importDeclaration.importClause.namedBindings.elements[0];
  const importedSymbol = checker.getSymbolAtLocation(importSpecifier.name);
  assert.ok(importedSymbol, `${testCase.id}: component import has no symbol`);
  const componentSymbol = checker.getAliasedSymbol(importedSymbol);
  assert.ok(componentSymbol.declarations.some(declaration =>
    declaration.getSourceFile().fileName === declarationPath && ts.isStructDeclaration(declaration)));
  return componentSymbol;
}

function assertConsumerPropertyType(program, declarationPath, testCase) {
  const declaration = program.getSourceFile(declarationPath);
  const checker = program.getTypeChecker();
  const struct = findStruct(declaration, testCase.componentName);
  const property = struct.members.find(member =>
    ts.isPropertyDeclaration(member) && member.name.getText() === testCase.consumerProperty);
  assert.ok(property, `${testCase.id}: generated consumer property is missing`);
  const propertySymbol = checker.getSymbolAtLocation(property.name);
  const propertyType = checker.getTypeOfSymbolAtLocation(propertySymbol, property);
  assert.strictEqual(checker.typeToString(propertyType), testCase.consumerType);
  return checker.typeToString(propertyType);
}

function assertConsumerResolution(program, consumerPath, declarationPath, testCase, request) {
  const resolved = ts.resolveModuleName(request, consumerPath, program.getCompilerOptions(), ts.sys).resolvedModule;
  assert.ok(resolved, `${testCase.id}: consumer module did not resolve`);
  assert.strictEqual(path.resolve(resolved.resolvedFileName), path.resolve(declarationPath));
  assert.strictEqual(resolved.extension, '.d.ets');
  const consumer = program.getSourceFile(consumerPath);
  assert.ok(consumer && program.getSourceFile(declarationPath));
  assert.deepStrictEqual(program.getSyntacticDiagnostics(consumer).map(diagnostic => diagnostic.code), []);
  assert.deepStrictEqual(program.getSemanticDiagnostics(consumer).map(diagnostic => ({
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')
  })), []);
  const componentSymbol = assertResolvedComponent(program.getTypeChecker(), consumer, declarationPath, testCase);
  return {
    componentDeclarationKind: ts.SyntaxKind[componentSymbol.declarations[0].kind],
    consumerFile: consumer.fileName,
    propertyType: assertConsumerPropertyType(program, declarationPath, testCase),
    resolvedFileName: resolved.resolvedFileName
  };
}

function runRealDeclgen(testCase, temporaryDirectory) {
  const modulePath = path.join(temporaryDirectory, 'har');
  const sourcePath = path.join(modulePath, 'src/main/ets', testCase.sourceName);
  const outputDirectory = path.join(temporaryDirectory, 'declgenV2');
  writeFileTree(modulePath, {
    [`src/main/ets/${testCase.sourceName}`]: testCase.source,
    ...(testCase.additionalFiles || {})
  });
  const materializedSdk = writeFileTree(temporaryDirectory, sdkFiles);
  const parameters = createDeclgenParameters(testCase, temporaryDirectory, modulePath, sourcePath, outputDirectory);
  FileManager.init(parameters.dependentModuleMap, parameters.projectConfig.sdkAliasMap);
  DeclfileProductor.init(parameters);
  DeclfileProductor.getInstance().runDeclgen(parameters);
  const declarationPath = declarationPathFor(testCase, outputDirectory);
  assert.ok(fs.existsSync(declarationPath), `DeclfileProductor did not emit ${declarationPath}`);
  return { declarationPath, materializedSdk, outputDirectory, sourcePath, ...parseDeclaration(declarationPath) };
}

function consumeDeclaration(testCase, temporaryDirectory, generated) {
  const consumerPath = path.join(temporaryDirectory, 'consumer/consumer.ets');
  const request = moduleRequest(consumerPath, generated.declarationPath);
  writeFileTree(temporaryDirectory, { 'consumer/consumer.ets': consumerSource(testCase, request) });
  const program = ts.createProgram({
    rootNames: [consumerPath, generated.declarationPath, ...Object.values(generated.materializedSdk)],
    options: compilerOptions(temporaryDirectory)
  });
  return { consumerPath, program, request };
}

function withDeclgenCase(testCase, callback) {
  const globalState = captureGlobalState();
  const temporary = createTemporaryDirectory(`property-ref-${testCase.id}`);
  let releaseConsumerProgram;
  let result;
  let failure;
  try {
    prepareGlobalState();
    const generated = runRealDeclgen(testCase, temporary.directory);
    const consumed = consumeDeclaration(testCase, temporary.directory, generated);
    releaseConsumerProgram = trackProgram(consumed.program);
    const consumerEvidence = assertConsumerResolution(
      consumed.program, consumed.consumerPath, generated.declarationPath, testCase, consumed.request);
    const generatedFiles = listFiles(generated.outputDirectory);
    assert.deepStrictEqual(generatedFiles, [generated.declarationPath].sort());
    const generatedCacheFiles = listFiles(path.join(temporary.directory, 'build/.declgen-cache'));
    assert.ok(generatedCacheFiles.length > 0, `${testCase.id}: declgen cache was not produced`);
    result = callback({
      consumerEvidence,
      consumerPath: consumed.consumerPath,
      declarationPath: generated.declarationPath,
      declarationSourceFile: generated.sourceFile,
      declarationText: generated.declarationText,
      generatedCacheFiles,
      generatedFiles,
      moduleRequest: consumed.request,
      sourcePath: generated.sourcePath,
      temporaryDirectory: temporary.directory
    });
  } catch (error) {
    failure = error;
  }
  try {
    if (releaseConsumerProgram) {
      releaseConsumerProgram();
    }
    restoreGlobalState(globalState);
    assertGlobalStateRestored(globalState);
  } catch (error) {
    error.stage = 'declgen.cleanup';
    error.code = error.code || 'GLOBAL_STATE_RESTORE';
    error.category = 'implementation';
    failure = error;
  }
  temporary.remove();
  if (failure) {
    throw failure;
  }
  return result;
}

module.exports = {
  assertGlobalStateRestored,
  captureGlobalState,
  restoreGlobalState,
  seedGlobalStateForIsolation,
  withDeclgenCase
};
