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

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));
const {
  HandleUIImports
} = require(path.join(COMPILER_ROOT, 'lib/process_interop_ui'));
const {
  DeclfileProductor
} = require(path.join(COMPILER_ROOT,
  'lib/fast_build/ark_compiler/interop/run_declgen_standalone'));
const {
  FileManager
} = require(path.join(COMPILER_ROOT,
  'lib/fast_build/ark_compiler/interop/interop_manager'));
const DeclgenLogger = require(path.join(
  COMPILER_ROOT,
  'node_modules/declgen'
)).logger.Logger;

const STATE_DECLARATION = `
export declare function Monitor(...paths: any[]): any;
export declare function Watch(...paths: any[]): any;
export declare function SyncMonitor(...paths: any[]): any;
`;

const COMPONENT_DECLARATION = `
export declare function ComponentV2(...args: any[]): any;
export declare class LocalStorage {}
`;

const GLOBAL_ANNOTATION_DECLARATION = `
export declare function Monitor(...paths: any[]): any;
`;

function assertOhosTypeScript() {
  if (typeof ts.isStructDeclaration !== 'function' ||
      typeof ts.getAllDecorators !== 'function') {
    throw new Error(
      'PR05 requires ohos-typescript with StructDeclaration and getAllDecorators support.'
    );
  }
}

assertOhosTypeScript();

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function materializeBaseDeclarations(workspace) {
  writeFile(path.join(workspace, 'state_management.d.ts'), STATE_DECLARATION);
  writeFile(path.join(workspace, 'component.d.ts'), COMPONENT_DECLARATION);
  writeFile(path.join(workspace, 'global_annotation.d.ts'), GLOBAL_ANNOTATION_DECLARATION);
}

function compilerOptions(workspace) {
  return {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    declaration: true,
    emitDeclarationOnly: true,
    noEmit: false,
    noEmitOnError: false,
    skipLibCheck: true,
    baseUrl: workspace,
    paths: {
      '@ohos.arkui.stateManagement': ['state_management.d.ts'],
      '@ohos.arkui.component': ['component.d.ts'],
      'dynamic/@ohos.arkui.GlobalAnnotation': ['global_annotation.d.ts']
    },
    types: [],
    typeRoots: []
  };
}

function createProgram(inputPath, workspace, stats) {
  const program = ts.createProgram({
    rootNames: [inputPath],
    options: compilerOptions(workspace)
  });
  stats.programsCreated += 1;
  return program;
}

function getTypeChecker(program, stats) {
  stats.typeCheckersCreated += 1;
  return program.getTypeChecker();
}

function sourceFileFromProgram(program, inputPath) {
  const sourceFile = program.getSourceFile(inputPath) ||
    program.getSourceFiles().find(candidate =>
      path.resolve(candidate.fileName) === path.resolve(inputPath));
  if (!sourceFile) {
    throw new Error(`Program did not contain ${inputPath}`);
  }
  return sourceFile;
}

function diagnosticsOf(program) {
  return program.getSyntacticDiagnostics().map(diagnostic => ({
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
    fileName: diagnostic.file ? diagnostic.file.fileName : undefined,
    start: diagnostic.start
  }));
}

function handleUIImportsTransformer(sourceChecker) {
  return context => sourceFile => {
    const handler = new HandleUIImports(sourceChecker, context);
    return handler.createCustomTransformer(sourceFile);
  };
}

function printTransformed(transformedSourceFile) {
  return ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
  }).printFile(transformedSourceFile);
}

function runDirectTransform(sourceProgram, sourceChecker, inputPath, stats, adoptResult) {
  const originalSourceFile = sourceFileFromProgram(sourceProgram, inputPath);
  const result = ts.transform(originalSourceFile, [
    handleUIImportsTransformer(sourceChecker)
  ]);
  adoptResult(result);
  stats.handleUIImportsTransforms += 1;
  const transformedSourceFile = result.transformed[0];
  return {
    result,
    originalSourceFile,
    transformedSourceFile,
    text: printTransformed(transformedSourceFile)
  };
}

function runAfterDeclarationsTransform(sourceProgram, sourceChecker, inputPath, stats, adoptResult) {
  const originalSourceFile = sourceFileFromProgram(sourceProgram, inputPath);
  let capturedSourceFile;
  let emittedFileName;
  const afterDeclarations = context => ({
    transformSourceFile(sourceFile) {
      capturedSourceFile = sourceFile;
      return sourceFile;
    },
    transformBundle(bundle) {
      return bundle;
    }
  });
  const emitResult = sourceProgram.emit(
    originalSourceFile,
    fileName => {
      emittedFileName = fileName;
    },
    undefined,
    true,
    { afterDeclarations: [afterDeclarations] }
  );
  if (emitResult.emitSkipped || !capturedSourceFile) {
    throw new Error('ohos-typescript declaration emit did not capture afterDeclarations AST.');
  }
  if (!capturedSourceFile.isDeclarationFile) {
    throw new Error('Captured afterDeclarations AST is not a declaration file.');
  }
  stats.afterDeclarationsCaptures += 1;
  const result = ts.transform(capturedSourceFile, [
    handleUIImportsTransformer(sourceChecker)
  ]);
  adoptResult(result);
  stats.handleUIImportsTransforms += 1;
  const transformedSourceFile = result.transformed[0];
  return {
    result,
    originalSourceFile: capturedSourceFile,
    transformedSourceFile,
    text: printTransformed(transformedSourceFile),
    emittedFileName
  };
}

function declarationBaseName(fileName) {
  if (fileName.endsWith('.d.ets')) {
    return fileName.slice(0, -'.d.ets'.length);
  }
  return fileName.slice(0, -path.extname(fileName).length);
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
  assert.deepStrictEqual(snapshotStaticFields(owner), snapshot,
    'static fields were not restored completely');
}

function withDeclgenState(stats, callback) {
  const owners = [DeclfileProductor, FileManager, DeclgenLogger];
  const snapshots = owners.map(snapshotStaticFields);
  stats.declgenStateSnapshots += 1;
  try {
    return callback();
  } finally {
    for (let index = owners.length - 1; index >= 0; index -= 1) {
      restoreStaticFields(owners[index], snapshots[index]);
    }
    stats.declgenStateRestores += 1;
  }
}

function declgenParameters(testCase, workspace, inputPath, repeated = false) {
  const modulePath = path.join(workspace, 'dynamic');
  const outputRoot = path.join(
    modulePath,
    'build',
    repeated ? 'declgenV2-repeat' : 'declgenV2'
  );
  const outputPath = path.join(
    outputRoot,
    'src/main/ets',
    `${declarationBaseName(testCase.fileName)}.d.ets`
  );
  const moduleInfo = {
    language: '1.1',
    interopConfigPath: '',
    packageName: 'dynamic',
    moduleName: 'dynamic',
    modulePath,
    declgenV2OutPath: outputRoot,
    dynamicFiles: [inputPath],
    staticFiles: [],
    cachePath: path.join(modulePath, 'build/cache'),
    packageVersion: '1.0.0',
    moduleType: 'har'
  };
  const parameters = {
    dependentModuleMap: new Map([['dynamic', moduleInfo]]),
    projectConfig: {
      cachePath: path.join(workspace, 'cache'),
      bundleName: 'com.test.monitor.signatures',
      mainModuleName: 'entry',
      projectRootPath: workspace,
      sdkAliasMap: new Map()
    }
  };
  return { parameters, outputPath };
}

function runDeclgenOnce(testCase, workspace, inputPath, repeated, stats) {
  return withDeclgenState(stats, () => {
    const { parameters, outputPath } = declgenParameters(
      testCase,
      workspace,
      inputPath,
      repeated
    );
    FileManager.cleanFileManagerObject();
    try {
      FileManager.init(
        parameters.dependentModuleMap,
        parameters.projectConfig.sdkAliasMap
      );
      DeclfileProductor.init(parameters);
      DeclfileProductor.getInstance().runDeclgen(parameters);
      stats.declgenRuns += 1;
    } finally {
      FileManager.cleanFileManagerObject();
    }
    if (!fs.existsSync(outputPath)) {
      throw new Error(`DeclfileProductor did not emit ${outputPath}`);
    }
    const text = fs.readFileSync(outputPath, 'utf8');
    if (text.trim().length === 0) {
      throw new Error(`DeclfileProductor emitted an empty file ${outputPath}`);
    }
    return { outputPath, text };
  });
}

function runRealDeclgen(testCase, workspace, inputPath, stats) {
  const first = runDeclgenOnce(testCase, workspace, inputPath, false, stats);
  fs.rmSync(path.join(workspace, 'build', '.declgen-cache'), {
    recursive: true,
    force: true
  });
  const repeated = runDeclgenOnce(testCase, workspace, inputPath, true, stats);
  assert.strictEqual(repeated.text, first.text,
    'repeated DeclfileProductor execution produced different declarations');
  stats.declgenRepeatChecks += 1;
  return {
    outputPath: first.outputPath,
    text: first.text,
    repeatOutputPath: repeated.outputPath
  };
}

function saveFailureEvidence(context, testCase, error, details) {
  const evidencePath = path.join(
    context.artifactRoot,
    'failures',
    `${testCase.id}.json`
  );
  const evidence = {
    id: testCase.id,
    title: testCase.title,
    boundary: testCase.boundary,
    mode: testCase.mode,
    message: error.message,
    stack: error.stack,
    inputPath: details.inputPath,
    outputPath: details.outputPath,
    toolOutputPath: details.toolOutputPath,
    repeatOutputPath: details.repeatOutputPath,
    stage: details.stage,
    diagnostics: details.diagnostics
  };
  writeFile(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  error.evidencePath = evidencePath;
}

function releaseProgram(program, stats) {
  if (!program) {
    return null;
  }
  assert.strictEqual(typeof program.releaseTypeChecker, 'function',
    'ohos-typescript Program must expose releaseTypeChecker');
  program.releaseTypeChecker();
  stats.typeCheckersReleased += 1;
  if (typeof program.dispose === 'function') {
    program.dispose();
    stats.programsDisposed += 1;
  }
  stats.programReferencesReleased += 1;
  return null;
}

function runCase(testCase, context, assertActual) {
  const workspace = fs.mkdtempSync(path.join(
    context.artifactRoot,
    `work-${testCase.id}-`
  ));
  context.stats.tempDirectoriesCreated += 1;
  const inputPath = path.join(
    workspace,
    'dynamic/src/main/ets',
    testCase.fileName
  );
  const persistedInputPath = path.join(
    context.artifactRoot,
    'inputs',
    testCase.fileName
  );
  const persistedOutputPath = path.join(
    context.artifactRoot,
    'outputs',
    `${testCase.id}.d.ets`
  );
  let sourceProgram;
  let analysisProgram;
  let transformationResult;
  let outputText = '';
  let toolOutputPath;
  let diagnostics = [];
  let stage;
  let actualResult;
  let repeatOutputPath;
  try {
    materializeBaseDeclarations(workspace);
    writeFile(inputPath, testCase.source);
    writeFile(persistedInputPath, testCase.source);
    for (const [relativePath, content] of Object.entries(
      testCase.auxiliaryFiles || {}
    )) {
      writeFile(path.join(workspace, 'dynamic/src/main/ets', relativePath), content);
    }

    sourceProgram = createProgram(inputPath, workspace, context.stats);
    const sourceChecker = getTypeChecker(sourceProgram, context.stats);
    diagnostics = diagnosticsOf(sourceProgram);
    let originalSourceFile;
    let transformedSourceFile;

    if (testCase.mode === 'declgen') {
      const generated = runRealDeclgen(
        testCase,
        workspace,
        inputPath,
        context.stats
      );
      toolOutputPath = generated.outputPath;
      repeatOutputPath = generated.repeatOutputPath;
      outputText = generated.text;
      stage = 'after-declaration';
    } else {
      toolOutputPath = path.join(
        workspace,
        'out',
        `${testCase.id}.d.ets`
      );
      const adoptResult = result => {
        transformationResult = result;
      };
      const transformed = testCase.mode === 'emit' ?
        runAfterDeclarationsTransform(
          sourceProgram,
          sourceChecker,
          inputPath,
          context.stats,
          adoptResult
        ) :
        runDirectTransform(
          sourceProgram,
          sourceChecker,
          inputPath,
          context.stats,
          adoptResult
        );
      originalSourceFile = transformed.originalSourceFile;
      transformedSourceFile = transformed.transformedSourceFile;
      outputText = transformed.text;
      writeFile(toolOutputPath, outputText);
      stage = testCase.mode === 'emit' ? 'afterDeclarations' : 'direct-program';
    }

    if (outputText.trim().length === 0) {
      throw new Error(`${testCase.id} produced empty declaration output.`);
    }
    writeFile(persistedOutputPath, outputText);
    analysisProgram = createProgram(persistedOutputPath, workspace, context.stats);
    const analysisChecker = getTypeChecker(analysisProgram, context.stats);
    const outputSourceFile = sourceFileFromProgram(
      analysisProgram,
      persistedOutputPath
    );
    actualResult = {
      id: testCase.id,
      mode: testCase.mode,
      stage,
      inputPath: persistedInputPath,
      outputPath: persistedOutputPath,
      toolOutputPath,
      repeatOutputPath,
      text: outputText,
      sourceFile: outputSourceFile,
      originalSourceFile,
      transformedSourceFile,
      sourceChecker,
      analysisChecker,
      diagnostics
    };
    assertActual(actualResult);
    return {
      id: testCase.id,
      mode: testCase.mode,
      stage,
      inputPath: persistedInputPath,
      outputPath: persistedOutputPath,
      toolOutputPath,
      repeatOutputPath,
      bytes: Buffer.byteLength(outputText, 'utf8'),
      diagnostics
    };
  } catch (error) {
    error.outputPath = persistedOutputPath;
    error.inputPath = persistedInputPath;
    error.repeatOutputPath = repeatOutputPath;
    error.actual = actualResult;
    error.failureStage = stage;
    saveFailureEvidence(context, testCase, error, {
      inputPath: persistedInputPath,
      outputPath: persistedOutputPath,
      toolOutputPath,
      repeatOutputPath,
      stage,
      diagnostics
    });
    throw error;
  } finally {
    if (transformationResult) {
      transformationResult.dispose();
      context.stats.transformationResultsDisposed += 1;
    }
    try {
      sourceProgram = releaseProgram(sourceProgram, context.stats);
    } finally {
      try {
        analysisProgram = releaseProgram(analysisProgram, context.stats);
      } finally {
        fs.rmSync(workspace, { recursive: true, force: true });
        context.stats.tempDirectoriesRemoved += 1;
      }
    }
  }
}

function toolchainDescription() {
  const typescriptPackage = require(path.join(
    COMPILER_ROOT,
    'node_modules/typescript/package.json'
  ));
  const declgenPackage = require(path.join(
    COMPILER_ROOT,
    'node_modules/declgen/package.json'
  ));
  return {
    node: process.version,
    typescript: typescriptPackage.version,
    typescriptPath: require.resolve(path.join(
      COMPILER_ROOT,
      'node_modules/typescript'
    )),
    declgen: declgenPackage.version,
    declgenPath: require.resolve(path.join(COMPILER_ROOT, 'node_modules/declgen')),
    ohosStructSupport: typeof ts.isStructDeclaration === 'function',
    ohosDecoratorSupport: typeof ts.getAllDecorators === 'function'
  };
}

module.exports = {
  COMPILER_ROOT,
  runCase,
  toolchainDescription,
  ts
};
