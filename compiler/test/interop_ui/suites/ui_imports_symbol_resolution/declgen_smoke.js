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
const childProcess = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ast = require('./ast_contract');
const {
  COMPILER_ROOT,
  ts
} = require('./transform_adapter');
const COMPONENT_MODULE = '@ohos.arkui.component';
const STATE_MODULE = '@ohos.arkui.stateManagement';
const INTEROP_MODULE = '@ohos.lang.interop';
const WORKER_PREFIX = 'DECLGEN_SMOKE_WORKER_RESULT=';

const smokeCases = [
  {
    id: 'declgen-after-declaration-v1',
    branch: 'Run the real after-declaration UI stage for V1 decorators, public types, constructors, and import sources.',
    source: `
@Component
@Reusable
export struct DeclgenV1Card {
  @Prop size: Length = 1;
  @State title: string = 'declgen';

  constructor() {
  }

  build() {
    Text.create();
  }
}

export class DeclgenV1Model {
  constructor() {
  }
}
`,
    verify(context) {
      const card = ast.findStruct(context, 'DeclgenV1Card');
      const model = ast.findClass(context, 'DeclgenV1Model');
      ast.assertConstructorCount(context, card, 0);
      ast.assertConstructorCount(context, model, 1);
      ast.assertDecoratorNames(context, card, ['Component', 'Reusable']);
      const size = ast.findProperty(context, card, 'size');
      ast.assertDecoratorNames(context, size, ['PropRef']);
      ast.assertDecoratorNames(
        context,
        ast.findProperty(context, card, 'title'),
        ['State']
      );
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      assertModuleOrder(context);
      assertModuleNames(context, COMPONENT_MODULE, ['Component', 'Reusable', 'Length']);
      assertModuleNames(context, STATE_MODULE, ['LocalStorage', 'PropRef', 'State']);
      assertInteropImport(context);
      ast.assertDirectives(context, ['use static']);
      assertNoBuildBody(context, card);
      return {
        componentGeneration: 'V1',
        reuseDecorator: 'Reusable',
        propRewriteObserved: true,
        publicTypeImport: 'Length'
      };
    }
  },
  {
    id: 'declgen-after-declaration-v2',
    branch: 'Run a fresh real declgen project for V2 component/reuse decorators and state import partitioning.',
    source: `
@ComponentV2
@ReusableV2
export struct DeclgenV2Card {
  @Local title: string = 'v2';
  @Param count: number = 0;
  @Once @Param initialCount: number = 0;

  constructor() {
  }

  build() {
    Text.create();
  }
}

export class DeclgenV2Model {
  constructor() {
  }
}
`,
    verify(context) {
      const card = ast.findStruct(context, 'DeclgenV2Card');
      const model = ast.findClass(context, 'DeclgenV2Model');
      ast.assertConstructorCount(context, card, 0);
      ast.assertConstructorCount(context, model, 1);
      ast.assertDecoratorNames(context, card, ['ComponentV2', 'ReusableV2']);
      ast.assertDecoratorNames(
        context,
        ast.findProperty(context, card, 'title'),
        ['Local']
      );
      ast.assertDecoratorNames(
        context,
        ast.findProperty(context, card, 'count'),
        ['Param']
      );
      ast.assertDecoratorNames(
        context,
        ast.findProperty(context, card, 'initialCount'),
        ['Once', 'Param']
      );
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      assertModuleOrder(context);
      assertModuleNames(context, COMPONENT_MODULE, ['ComponentV2', 'ReusableV2']);
      assertModuleNames(context, STATE_MODULE, ['LocalStorage', 'Local', 'Param', 'Once']);
      assertInteropImport(context);
      ast.assertDirectives(context, ['use static']);
      assertNoBuildBody(context, card);
      return {
        componentGeneration: 'V2',
        repeatedParamImportCount: 1,
        reuseDecorator: 'ReusableV2'
      };
    }
  }
];

function importForModule(context, moduleName) {
  const matches = ast.importsOf(context, undefined)
    .filter(item => item.module === moduleName);
  assert.strictEqual(
    matches.length,
    1,
    `${context.caseDefinition.id}: expected one import from ${moduleName}`
  );
  return matches[0];
}

function assertModuleNames(context, moduleName, expectedNames) {
  const imported = importForModule(context, moduleName);
  const actualNames = imported.named.map(item => item.local);
  assert.deepStrictEqual(
    actualNames,
    expectedNames,
    `${context.caseDefinition.id}: complete ordered import list differs for ${moduleName}`
  );
}

function assertModuleOrder(context) {
  assert.deepStrictEqual(
    ast.importsOf(context, undefined).map(item => item.module),
    [COMPONENT_MODULE, STATE_MODULE, INTEROP_MODULE],
    `${context.caseDefinition.id}: unexpected module or module order`
  );
}

function assertInteropImport(context) {
  const interop = importForModule(context, INTEROP_MODULE);
  assert.strictEqual(interop.default, 'es');
  assert.strictEqual(interop.named.length, 0);
  assert.strictEqual(interop.namespace, null);
}

function assertNoBuildBody(context, card) {
  const build = ast.findMethod(context, card, 'build');
  assert.strictEqual(
    build.body,
    undefined,
    `${context.caseDefinition.id}: declaration output must not contain a build body`
  );
}

function declgenApi() {
  const interopRoot = path.join(COMPILER_ROOT, 'lib', 'fast_build', 'ark_compiler', 'interop');
  return {
    DeclfileProductor: require(path.join(interopRoot, 'run_declgen_standalone')).DeclfileProductor,
    FileManager: require(path.join(interopRoot, 'interop_manager')).FileManager
  };
}

function createModuleInfo(modulePath, sourcePath, outputPath) {
  return {
    language: '1.1',
    packageName: 'entry',
    moduleName: 'entry',
    modulePath,
    declgenV1OutPath: path.join(modulePath, 'build', 'declgenV1'),
    declgenV2OutPath: outputPath,
    dynamicFiles: [sourcePath],
    staticFiles: [],
    cachePath: path.join(modulePath, 'build', 'cache'),
    byteCodeHarInfo: {},
    packageVersion: '1.0.0',
    moduleType: 'entry'
  };
}

function createDeclgenParams(projectRootPath, dependentModuleMap) {
  return {
    projectConfig: {
      projectRootPath,
      bundleName: 'com.example.interop.ui.imports',
      mainModuleName: 'entry',
      cachePath: path.join(projectRootPath, 'cache'),
      sdkAliasMap: new Map()
    },
    dependentModuleMap
  };
}

function parseGeneratedDeclaration(caseDefinition, outputPath) {
  const outputText = fs.readFileSync(outputPath, 'utf8');
  assert.ok(outputText.trim().length > 0, `${caseDefinition.id}: empty declaration output`);
  const sourceFile = ts.createSourceFile(
    outputPath,
    outputText,
    ts.ScriptTarget.ES2021,
    true,
    ts.ScriptKind.ETS
  );
  const parseDiagnostics = sourceFile.parseDiagnostics || [];
  assert.deepStrictEqual(
    parseDiagnostics.map(diagnostic => diagnostic.messageText),
    [],
    `${caseDefinition.id}: generated declaration has parse diagnostics`
  );
  return {
    context: {
      assert,
      caseDefinition,
      original: sourceFile,
      printer: ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }),
      sourceFile,
      transformedText: outputText,
      ts
    },
    outputText
  };
}

function runDeclgenSmoke(caseDefinition) {
  assert.ok(caseDefinition.id && caseDefinition.branch);
  assert.strictEqual(typeof caseDefinition.verify, 'function');
  const { DeclfileProductor, FileManager } = declgenApi();
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), `interop-ui-real-declgen-${caseDefinition.id}-`)
  );
  let fileManagerDisposed = false;
  let evidence;

  try {
    const modulePath = path.join(temporaryDirectory, 'entry');
    const sourcePath = path.join(modulePath, 'src', 'main', 'ets', 'index.ets');
    const declgenV2OutPath = path.join(modulePath, 'build', 'declgenV2');
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    fs.writeFileSync(sourcePath, caseDefinition.source, 'utf8');
    const moduleInfo = createModuleInfo(modulePath, sourcePath, declgenV2OutPath);
    const dependentModuleMap = new Map([['entry', moduleInfo]]);
    const params = createDeclgenParams(temporaryDirectory, dependentModuleMap);
    const outputPath = path.join(declgenV2OutPath, 'src', 'main', 'ets', 'index.d.ets');

    FileManager.init(dependentModuleMap, params.projectConfig.sdkAliasMap);
    DeclfileProductor.init(params);
    DeclfileProductor.getInstance().runDeclgen(params);
    FileManager.cleanFileManagerObject();
    fileManagerDisposed = true;
    assert.strictEqual(fs.existsSync(outputPath), true, `${caseDefinition.id}: no declaration emitted`);

    const { context, outputText } = parseGeneratedDeclaration(caseDefinition, outputPath);
    let caseEvidence;
    try {
      caseEvidence = caseDefinition.verify(context) || {};
    } catch (error) {
      error.transformedOutput = outputText;
      throw error;
    }
    evidence = {
      branch: caseDefinition.branch,
      stage: 'DeclfileProductor.runDeclgen/ui-imports@after-declaration',
      inputRelativePath: 'entry/src/main/ets/index.ets',
      outputRelativePath: 'entry/build/declgenV2/src/main/ets/index.d.ets',
      outputSha256: crypto.createHash('sha256').update(outputText).digest('hex'),
      imports: ast.importsOf(context, undefined).map(item => ({
        module: item.module,
        default: item.default,
        named: item.named.map(element => element.local),
        namespace: item.namespace
      })),
      generatedDeclaration: outputText,
      ...caseEvidence
    };
  } finally {
    try {
      if (!fileManagerDisposed) {
        FileManager.cleanFileManagerObject();
        fileManagerDisposed = true;
      }
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }
  assert.strictEqual(fs.existsSync(temporaryDirectory), false);
  return {
    ...evidence,
    temporaryDirectoryDisposed: true,
    fileManagerDisposed,
    workerPid: process.pid
  };
}

function serializeError(error) {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    transformedOutput: error.transformedOutput || null
  };
}

function runIsolatedDeclgenSmoke(caseDefinition) {
  // A fresh process isolates DeclfileProductor, FileManager, and declgen Logger statics.
  const child = childProcess.spawnSync(process.execPath, [__filename, caseDefinition.id], {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    timeout: 120000
  });
  if (child.error) {
    throw child.error;
  }
  const resultLine = (child.stdout || '').split(/\r?\n/)
    .find(line => line.startsWith(WORKER_PREFIX));
  if (!resultLine) {
    throw new Error(
      `Declgen worker returned no result; status=${child.status}; stderr=${child.stderr || '<empty>'}`
    );
  }
  const packet = JSON.parse(resultLine.slice(WORKER_PREFIX.length));
  if (child.status !== 0 || packet.error) {
    const remote = packet.error || {
      name: 'DeclgenWorkerError',
      message: `Declgen worker exited with ${child.status}: ${child.stderr || '<empty>'}`
    };
    const error = new Error(remote.message);
    error.name = remote.name;
    error.stack = remote.stack;
    error.transformedOutput = remote.transformedOutput;
    throw error;
  }
  return {
    ...packet.evidence,
    processIsolation: true,
    workerExitCode: child.status
  };
}

function smokeCaseById(id) {
  const match = smokeCases.find(item => item.id === id);
  assert.ok(match, `Unknown declgen smoke case ${id}`);
  return match;
}

function workerMain(id) {
  try {
    const evidence = runDeclgenSmoke(smokeCaseById(id));
    console.log(WORKER_PREFIX + JSON.stringify({ evidence }));
  } catch (error) {
    console.log(WORKER_PREFIX + JSON.stringify({ error: serializeError(error) }));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  workerMain(process.argv[2]);
}

module.exports = {
  COMPONENT_MODULE,
  INTEROP_MODULE,
  STATE_MODULE,
  runIsolatedDeclgenSmoke,
  smokeCaseById,
  smokeCases
};
