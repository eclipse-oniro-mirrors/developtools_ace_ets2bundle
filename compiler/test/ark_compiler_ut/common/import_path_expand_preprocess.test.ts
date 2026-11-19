/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import mocha from 'mocha';
import { expect } from 'chai';
import path from 'path';
import * as ts from 'typescript';

import { expandAllImportPaths } from '../../../lib/import_path_expand';
import {
  EARLY_RELEASE_CHECKER,
  getCheckerlessImportPathExpandDataSource,
  initCheckerlessImportPreprocess,
  preprocessSourceFileForCheckerlessImport,
  resetCheckerlessImportTransform
} from '../../../lib/checkerless_import_transform';
import '../../../lib/fast_build/ets_ui/rollup-plugin-ets-typescript';

const compilerOptions = ts.readConfigFile(
  path.resolve(__dirname, '../../../tsconfig.json'), ts.sys.readFile).config.compilerOptions;
compilerOptions['moduleResolution'] = 'nodenext';
compilerOptions['module'] = 'es2020';

// Harness mirrors import_path_expand.test.ts.
function createMultiSymbolProgram(testContent: string, testPkgSymbolToFileMap: Record<string, string>,
  testPkgIndexContent: string, twoPkgSymbolToFileMap?: Record<string, string>, twoPkgIndexContent?: string
  ): { program: ts.Program; testSourceFile: ts.SourceFile } {
  const rootDir: string = '/TestProject';
  const moduleRootPath: string = `${rootDir}/testPkg`;
  const twoModuleRootPath: string = `${rootDir}/twoPkg`;
  const fileMap = new Map<string, ts.SourceFile>();

  populateFileMap(fileMap, testPkgSymbolToFileMap, moduleRootPath);
  if (twoPkgSymbolToFileMap) {
    populateFileMap(fileMap, twoPkgSymbolToFileMap, twoModuleRootPath);
  }

  const testFileName = `${rootDir}/test/testFile.ets`;
  const testSourceFile = ts.createSourceFile(testFileName, testContent, ts.ScriptTarget.ES2020, true);
  Object.defineProperty(testSourceFile, 'fileName', { value: testFileName });

  const compilerHost = ts.createCompilerHost({ target: ts.ScriptTarget.ES2020 });
  const allSourceFiles = new Map<string, ts.SourceFile>([...fileMap.entries(), [testFileName, testSourceFile]]);
  compilerHost.getSourceFile = (fileName) => allSourceFiles.get(fileName);
  compilerHost.resolveModuleNames = (moduleNames, containingFile) => resolveModuleNames(moduleNames, containingFile,
    fileMap, {
    testPkg: moduleRootPath,
    twoPkg: twoModuleRootPath
  });

  populateSingleFile(allSourceFiles, testPkgIndexContent, moduleRootPath);
  if (twoPkgIndexContent) {
    populateSingleFile(allSourceFiles, twoPkgIndexContent, twoModuleRootPath);
  }

  return {
    program: ts.createProgram({
      rootNames: [...allSourceFiles.keys()],
      options: compilerOptions,
      host: compilerHost,
    }),
    testSourceFile
  };
}

function resolveModuleNames(moduleNames: string[], containingFile: string, fileMap: Map<string, ts.SourceFile>,
  moduleRootPaths: Record<string, string>): (ts.ResolvedModule | undefined)[] {
  return moduleNames.map(name => {
    if (moduleRootPaths[name]) {
      return {
        resolvedFileName: `${moduleRootPaths[name]}/Index.ts`,
        isExternalLibraryImport: false
      };
    }
    const candidate = path.resolve(path.dirname(containingFile), name);
    const resolved = [...fileMap.keys()].find(filePath =>
      filePath === candidate || filePath === candidate + '.ts');
    if (resolved) {
      return {
        resolvedFileName: resolved,
        isExternalLibraryImport: false
      };
    }
    return undefined;
  });
}

function populateFileMap(fileMap: Map<string, ts.SourceFile>, symbolToFileMap: Record<string, string>, moduleRootPath: string): void {
  for (const [relativePath, code] of Object.entries(symbolToFileMap)) {
    const fullFilePath = `${moduleRootPath}/${relativePath}`;
    const sourceFile = ts.createSourceFile(fullFilePath, code, ts.ScriptTarget.ES2020, true);
    Object.defineProperty(sourceFile, 'fileName', { value: fullFilePath });
    fileMap.set(fullFilePath, sourceFile);
  }
}

function populateSingleFile(fileMap: Map<string, ts.SourceFile>, content: string, moduleRootPath: string): void {
  const indexFilePath = `${moduleRootPath}/Index.ts`;
  const sourceFile = ts.createSourceFile(indexFilePath, content, ts.ScriptTarget.ES2020, true);
  Object.defineProperty(sourceFile, 'fileName', { value: indexFilePath });
  fileMap.set(indexFilePath, sourceFile);
}

const baseConfig = { enable: true, exclude: [] };

function makeRollupObject(): Object {
  const rollupObejct = {
    share: {
      projectConfig: {
        expandImportPath: baseConfig,
        depName2DepInfo: new Map(),
        packageDir: 'oh_modules',
      },
      arkProjectConfig: {
        hspNameOhmMap: {},
        harNameOhmMap: {}
      }
    }
  };
  rollupObejct.share.projectConfig.depName2DepInfo.set('testPkg', {
    pkgRootPath: '/TestProject/testPkg'
  });
  rollupObejct.share.projectConfig.depName2DepInfo.set('twoPkg', {
    pkgRootPath: '/TestProject/twoPkg'
  });
  return rollupObejct;
}

function expand(program: ts.Program, testSourceFile: ts.SourceFile, rollupObejct: Object): string {
  const transformed = ts.transform(testSourceFile, [expandAllImportPaths(program.getTypeChecker(), rollupObejct)],
    program.getCompilerOptions()).transformed[0];
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(transformed);
}

function expandWithoutChecker(program: ts.Program, testSourceFile: ts.SourceFile, rollupObejct: Object): string {
  const transformed = ts.transform(testSourceFile,
    [expandAllImportPaths(undefined, rollupObejct, undefined, getCheckerlessImportPathExpandDataSource())],
    program.getCompilerOptions()).transformed[0];
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return printer.printFile(transformed);
}

// Runs the live path (switch off) and the preprocessed path (switch on) and asserts identical output.
function assertParity(testContent: string, testPkgFiles: Record<string, string>, testPkgIndex: string,
  twoPkgFiles?: Record<string, string>, twoPkgIndex?: string): void {
  const rollupObejct = makeRollupObject();

  const liveCtx = createMultiSymbolProgram(testContent, testPkgFiles, testPkgIndex, twoPkgFiles, twoPkgIndex);
  resetCheckerlessImportTransform();
  const liveResult = expand(liveCtx.program, liveCtx.testSourceFile, rollupObejct);

  const preCtx = createMultiSymbolProgram(testContent, testPkgFiles, testPkgIndex, twoPkgFiles, twoPkgIndex);
  rollupObejct.share.projectConfig[EARLY_RELEASE_CHECKER] = true;
  initCheckerlessImportPreprocess(rollupObejct);
  preprocessSourceFileForCheckerlessImport(preCtx.program, preCtx.testSourceFile);
  const preResult = expandWithoutChecker(preCtx.program, preCtx.testSourceFile, rollupObejct);

  resetCheckerlessImportTransform();
  delete rollupObejct.share.projectConfig[EARLY_RELEASE_CHECKER];

  expect(preResult === liveResult, `\n--- live ---\n${liveResult}\n--- preprocessed ---\n${preResult}\n`).to.be.true;
}

mocha.describe('test import_path_expand preprocessed (early-release) parity', () => {
  mocha.it('parity 1-1: split default + named + type imports', () => {
    assertParity(
      `import def, { A as AA, B, type C } from 'testPkg';\ndef();\nlet a: AA = new AA();\nB();\nconst c: C = 'c';`,
      { 'testDir/test.ts': `
        function def() {}
        export class A {}
        export function B() {}
        export type C = string;
        export default def;
      ` },
      `import def from './testDir/test';\nexport { A, B, type C } from './testDir/test';\nexport default def;`
    );
  });

  mocha.it('parity 1-2: resolve multi-symbol to different files', () => {
    assertParity(
      `import { A, B, C } from 'testPkg';\nA();\nB();\nC();`,
      {
        'a.ts': `export function A() {}`,
        'b.ts': `export function B() {}`,
        'c.ts': `export function C() {}`
      },
      `export { A } from './a';\nexport { B } from './b';\nexport { C } from './c';`
    );
  });

  mocha.it('parity 1-3: resolve re-export chain to final file', () => {
    assertParity(
      `import { x, y as y1 } from 'testPkg';\nconsole.log(x, y1);`,
      { 'final.ts': `const x = 1; export const y = 2; export default x;` },
      `import x, { y } from './final';\nexport { x, y };`
    );
  });

  mocha.it('parity 1-5: fallback default import to named', () => {
    assertParity(
      `import fallback from 'testPkg';\nconsole.log(fallback);`,
      { 'test.ts': `export const fallback = 1;` },
      `export { fallback as default } from './test';`
    );
  });

  mocha.it('parity 1-6: transform type-only named import', () => {
    assertParity(
      `import type { T1 } from 'testPkg';\nconst a: T1 = 'a';`,
      { 'test.ts': `export type T1 = string;` },
      `export type { T1 } from './test';`
    );
  });

  mocha.it('parity 2-2: transform the variable name is default', () => {
    assertParity(
      `import { def } from 'testPkg';\ndef();`,
      { 'test.ts': `export default function def() {};` },
      ` import def from './test';\nexport { def };`
    );
  });

  mocha.it('parity 3-4: preserve import when symbol is from js | .d.ts | .d.ets file', () => {
    assertParity(
      `import { A, B, C, D } from 'testPkg';\nA();\nB();\nC();\nD();`,
      {
        'a.js': `export function A() {}`,
        'b.d.ts': `export function B() {}`,
        'c.d.ets': `export function C() {}`,
        'd.ts': `export function D() {}`
      },
      `export { A } from './a';\nexport { B } from './b';\nexport { C } from './c';\nexport { D } from './d';`
    );
  });

  mocha.it('parity 3-5: preserve import when symbol is exported across modules', () => {
    assertParity(
      `import { A } from 'testPkg';\nA();`,
      { 'a.ts': `export { A } from 'twoPkg';` },
      `export { A } from './a';`,
      { 'b.ts': `export function A() {}` },
      `export { A } from './b';`
    );
  });
});
