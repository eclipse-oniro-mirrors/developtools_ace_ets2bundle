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

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const ts = require('typescript');

const { HandleUIImports } = require('../../../../lib/process_interop_ui');
const { assertInputResolution } = require('./ast_assertions');

const componentSdk = `
export declare function Component(target: Object): void;
`;

const interopSdk = `
declare const es: any;
export default es;
`;

const stateManagementSdk = `
export declare class LocalStorage {
}
export declare function Prop(target: Object, propertyKey: string): void;
export declare function PropRef(target: Object, propertyKey: string): void;
export declare function StorageProp(key: string): (target: Object, propertyKey: string) => void;
export declare function StoragePropRef(key: string): (target: Object, propertyKey: string) => void;
export declare function LocalStorageProp(key: string): (target: Object, propertyKey: string) => void;
export declare function LocalStoragePropRef(key: string): (target: Object, propertyKey: string) => void;
export declare function State(target: Object, propertyKey: string): void;
export declare function Link(target: Object, propertyKey: string): void;
export declare function Watch(key: string): (target: Object, propertyKey: string) => void;
`;

const globalAnnotationSdk = `
export declare function Prop(target: Object, propertyKey: string): void;
export declare function StorageProp(key: string): (target: Object, propertyKey: string) => void;
export declare function LocalStorageProp(key: string): (target: Object, propertyKey: string) => void;
export default Prop;
`;

const sdkFiles = {
  'sdk/component.d.ets': componentSdk,
  'sdk/globalAnnotation.d.ets': globalAnnotationSdk,
  'sdk/interop.d.ets': interopSdk,
  'sdk/stateManagement.d.ets': stateManagementSdk
};

const resourceStats = {
  programsCreated: 0,
  programsReleased: 0,
  transformationsCreated: 0,
  transformationsDisposed: 0,
  temporaryDirectoriesCreated: 0,
  temporaryDirectoriesRemoved: 0,
  activePrograms: 0,
  activeTransformations: 0,
  activeTemporaryDirectories: 0
};

function compilerOptions(baseUrl) {
  return {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    allowJs: false,
    noEmit: true,
    skipLibCheck: true,
    strict: false,
    types: [],
    lib: ['lib.es2021.d.ts'],
    baseUrl,
    paths: {
      '@ohos.arkui.component': ['sdk/component.d.ets'],
      '@ohos.arkui.stateManagement': ['sdk/stateManagement.d.ets'],
      '@ohos.lang.interop': ['sdk/interop.d.ets'],
      'dynamic/@ohos.arkui.GlobalAnnotation': ['sdk/globalAnnotation.d.ets']
    }
  };
}

function safeRelativePath(relativePath) {
  assert.ok(relativePath && !path.isAbsolute(relativePath), `Invalid fixture path ${relativePath}`);
  const normalized = path.normalize(relativePath);
  assert.ok(normalized !== '..' && !normalized.startsWith(`..${path.sep}`),
    `Fixture path escapes its temporary directory: ${relativePath}`);
  return normalized;
}

function writeFileTree(rootDirectory, files) {
  const written = {};
  Object.entries(files).forEach(([relativePath, content]) => {
    const normalized = safeRelativePath(relativePath);
    const filePath = path.join(rootDirectory, normalized);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    written[relativePath] = filePath;
  });
  return written;
}

function createTemporaryDirectory(prefix) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
  resourceStats.temporaryDirectoriesCreated += 1;
  resourceStats.activeTemporaryDirectories += 1;
  let removed = false;
  return {
    directory,
    remove() {
      if (removed) {
        return;
      }
      removed = true;
      fs.rmSync(directory, { recursive: true, force: true });
      assert.ok(!fs.existsSync(directory), `Temporary directory was not removed: ${directory}`);
      resourceStats.temporaryDirectoriesRemoved += 1;
      resourceStats.activeTemporaryDirectories -= 1;
    }
  };
}

function trackProgram(program) {
  resourceStats.programsCreated += 1;
  resourceStats.activePrograms += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    if (typeof program.releaseTypeChecker === 'function') {
      program.releaseTypeChecker();
    }
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
    resourceStats.programsReleased += 1;
    resourceStats.activePrograms -= 1;
  };
}

function trackTransformation(transformation) {
  resourceStats.transformationsCreated += 1;
  resourceStats.activeTransformations += 1;
  let disposed = false;
  return () => {
    if (disposed) {
      return;
    }
    disposed = true;
    transformation.dispose();
    resourceStats.transformationsDisposed += 1;
    resourceStats.activeTransformations -= 1;
  };
}

function createCaseProgram(testCase, temporary) {
  const inputFiles = testCase.files || { 'main.d.ets': testCase.source };
  const materialized = writeFileTree(temporary.directory, { ...inputFiles, ...sdkFiles });
  const rootNames = Object.values(materialized);
  const options = compilerOptions(temporary.directory);
  const program = ts.createProgram({
    rootNames,
    options
  });
  const releaseProgram = trackProgram(program);
  const sourceFile = program.getSourceFile(materialized['main.d.ets']);
  if (!sourceFile) {
    releaseProgram();
    throw new Error(`${testCase.id}: main.d.ets was not included in the Program`);
  }
  const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
  if (syntacticDiagnostics.length > 0) {
    const messages = syntacticDiagnostics.map(diagnostic =>
      `${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`);
    releaseProgram();
    throw new Error(`${testCase.id}: invalid input syntax:\n${messages.join('\n')}`);
  }
  return {
    materialized,
    options,
    program,
    releaseProgram,
    sourceFile
  };
}

function withTransformedCase(testCase, callback) {
  const temporary = createTemporaryDirectory(`property-ref-${testCase.id}`);
  let releaseProgram;
  let disposeTransformation;
  try {
    const resources = createCaseProgram(testCase, temporary);
    releaseProgram = resources.releaseProgram;
    const inputResolution = assertInputResolution(resources.program, resources.sourceFile, testCase);
    const transformer = context => sourceFile => {
      const handler = new HandleUIImports(resources.program.getTypeChecker(), context);
      return handler.createCustomTransformer(sourceFile);
    };
    const transformation = ts.transform(resources.sourceFile, [transformer]);
    disposeTransformation = trackTransformation(transformation);
    const printedText = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
      .printFile(transformation.transformed[0]);
    const transformedSourceFile = ts.createSourceFile(
      path.join(temporary.directory, 'transformed.d.ets'),
      printedText,
      ts.ScriptTarget.ES2021,
      true,
      ts.ScriptKind.ETS
    );
    const parseDiagnostics = transformedSourceFile.parseDiagnostics || [];
    assert.deepStrictEqual(parseDiagnostics.map(diagnostic => diagnostic.code), [],
      `${testCase.id}: transformed declaration is not parseable`);
    return callback({
      inputResolution,
      materialized: resources.materialized,
      printedText,
      program: resources.program,
      sourceFile: transformedSourceFile,
      temporaryDirectory: temporary.directory
    });
  } finally {
    if (disposeTransformation) {
      disposeTransformation();
    }
    if (releaseProgram) {
      releaseProgram();
    }
    temporary.remove();
  }
}

function assertNoActiveResources() {
  assert.strictEqual(resourceStats.activeTransformations, 0, 'A transformation was not disposed');
  assert.strictEqual(resourceStats.activePrograms, 0, 'A Program type checker was not released');
  assert.strictEqual(resourceStats.activeTemporaryDirectories, 0, 'A temporary directory is still active');
  assert.strictEqual(resourceStats.programsCreated, resourceStats.programsReleased,
    'Program creation and release counts differ');
  assert.strictEqual(resourceStats.transformationsCreated, resourceStats.transformationsDisposed,
    'Transformation creation and disposal counts differ');
  assert.strictEqual(resourceStats.temporaryDirectoriesCreated, resourceStats.temporaryDirectoriesRemoved,
    'Temporary directory creation and removal counts differ');
}

module.exports = {
  assertNoActiveResources,
  compilerOptions,
  createTemporaryDirectory,
  resourceStats,
  sdkFiles,
  trackProgram,
  withTransformedCase,
  writeFileTree
};
