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

import { expect } from 'chai';
import mocha from 'mocha';
import fs from 'fs';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import ts from 'typescript';
import MagicString from 'magic-string';
import sourceMap from 'source-map';

import { genAbc } from '../../../lib/fast_build/ark_compiler/rollup-plugin-gen-abc';
import { ModuleSourceFile, sourceFileBelongProject } from '../../../lib/fast_build/ark_compiler/module/module_source_file';
import { PreloadFileModules } from '../../../lib/fast_build/ark_compiler/module/module_preload_file_utils';
import { SourceMapGenerator } from '../../../lib/fast_build/ark_compiler/generate_sourcemap';
import { compilerOptions } from '../../../lib/ets_checker';
import { harFilesRecord } from '../../../lib/utils';
import { DEBUG, ESMODULE, RELEASE, SOURCEMAPS } from '../../../lib/fast_build/ark_compiler/common/ark_define';
import * as arkCompilerUtils from '../../../lib/fast_build/ark_compiler/utils';
import * as obfuscationConfig from '../../../lib/fast_build/ark_compiler/common/ob_config_resolver';

interface DeferredResult<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

function createDeferred<T>(): DeferredResult<T> {
  let resolve: (value: T) => void;
  let reject: (error: Error) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createProjectConfig(root: string, cacheName: string = 'cache'): Object {
  const modulePath = path.join(root, 'entry');
  const config = {
    compileMode: ESMODULE,
    buildMode: DEBUG,
    singleFileEmit: true,
    processTs: true,
    compileHar: false,
    needCoverageInsert: false,
    projectRootPath: root,
    projectPath: path.join(modulePath, 'src/main/ets'),
    modulePath,
    modulePathMap: { entry: modulePath },
    cachePath: path.join(root, cacheName),
    aceModuleBuild: path.join(root, 'build'),
    aceModuleJsonPath: path.join(modulePath, 'module.json'),
    entryModuleName: 'entry',
    entryPackageName: 'entry',
    entryModuleVersion: '1.0.0',
    packageDir: 'oh_modules',
    harNameOhmMap: {},
    hspNameOhmMap: {},
    dependentModuleMap: new Map()
  };
  fs.mkdirSync(config.projectPath, { recursive: true });
  fs.mkdirSync(config.cachePath, { recursive: true });
  fs.mkdirSync(config.aceModuleBuild, { recursive: true });
  fs.writeFileSync(config.aceModuleJsonPath, JSON.stringify({
    app: { bundleName: 'SingleFileEmitTest' },
    module: { name: 'entry' }
  }));
  return config;
}

function createRollupContext(projectConfig: Object): Object {
  const moduleInfos = new Map();
  const logger = { debug: sinon.spy(), info: sinon.spy(), warn: sinon.spy(), error: sinon.spy() };
  return {
    moduleInfos,
    share: {
      projectConfig,
      arkProjectConfig: {},
      getLogger: () => logger,
      throwArkTsCompilerError: (message: string) => {
        throw new Error(message);
      }
    },
    getModuleInfo: (id: string) => moduleInfos.get(id),
    getModuleIds: () => moduleInfos.keys()
  };
}

function addModule(rollupObject: Object, name: string, source: string | ts.SourceFile,
  importedIdMaps: Object = {}, nodeMap: Map<string, Object[]> = new Map()): string {
  const config = rollupObject.share.projectConfig;
  const id = path.join(config.projectPath, name);
  fs.writeFileSync(id, typeof source === 'string' ? source : source.text);
  const meta = {
    belongModulePath: config.modulePath,
    belongProjectPath: config.projectRootPath,
    moduleName: 'entry',
    pkgName: 'entry',
    pkgPath: config.modulePath,
    isLocalDependency: true
  };
  rollupObject.moduleInfos.set(id, { id, meta, importedIdMaps, getNodeByType: () => nodeMap });
  ModuleSourceFile.newSourceFile(id, source, meta, config.singleFileEmit);
  return id;
}

function getOutputPath(rollupObject: Object, name: string): string {
  return path.join(rollupObject.share.projectConfig.cachePath, 'entry/src/main/ets', name);
}

function initialize(rollupObject: Object): void {
  process.env.cachePath = rollupObject.share.projectConfig.cachePath;
  SourceMapGenerator.init(rollupObject);
  PreloadFileModules.initialize(rollupObject);
}

function restoreEnvironment(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

let root: string;
let rollupObject: Object;
let plugin: Object;
let previousCompileTool: string | undefined;
let previousCachePath: string | undefined;
let previousLinter: boolean;

function prepareFixture(): void {
  previousCompileTool = process.env.compileTool;
  previousCachePath = process.env.cachePath;
  previousLinter = compilerOptions.needDoArkTsLinter;
  compilerOptions.needDoArkTsLinter = false;
  process.env.compileTool = 'rollup';
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'single-file-emit-'));
  plugin = genAbc();
  plugin.cleanUp();
  rollupObject = createRollupContext(createProjectConfig(root));
  initialize(rollupObject);
}

function cleanFixture(): void {
  sinon.restore();
  plugin.cleanUp();
  for (const id of harFilesRecord.keys()) {
    if (id.startsWith(root + path.sep)) {
      harFilesRecord.delete(id);
    }
  }
  for (const id of sourceFileBelongProject.keys()) {
    if (id.startsWith(root + path.sep)) {
      sourceFileBelongProject.delete(id);
    }
  }
  compilerOptions.needDoArkTsLinter = previousLinter;
  restoreEnvironment('compileTool', previousCompileTool);
  restoreEnvironment('cachePath', previousCachePath);
  fs.rmSync(root, { recursive: true, force: true });
}

function registerHookTests(): void {
  mocha.it('calls the single-file handler synchronously from afterTransform', function() {
    const id = path.join(rollupObject.share.projectConfig.projectPath, 'entry.ts');
    const processSingleFile = sinon.stub(ModuleSourceFile, 'processSingleModuleSourceFile');

    const result = plugin.afterTransform.call(rollupObject, { id });

    expect(result).to.equal(true);
    expect(processSingleFile.calledOnce).to.equal(true);
    expect(processSingleFile.firstCall.args.slice(0, 2)).to.deep.equal([rollupObject, id]);
  });

  mocha.it('leaves batch emission for buildEnd when singleFileEmit is disabled', function() {
    rollupObject.share.projectConfig.singleFileEmit = false;
    const id = addModule(rollupObject, 'batch.json', '{"value":1}');
    const processSingleFile = sinon.stub(ModuleSourceFile, 'processSingleModuleSourceFile');

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(false);
    expect(processSingleFile.called).to.equal(false);
    expect(fs.existsSync(getOutputPath(rollupObject, 'batch.json'))).to.equal(false);
    expect(ModuleSourceFile.getSourceFiles().map(source => source.getModuleId())).to.deep.equal([id]);
  });
}

function registerTsTests(): void {
  mocha.it('writes a TS SourceFile and collects its source map before returning', function() {
    const fileName = path.join(rollupObject.share.projectConfig.projectPath, 'entry.ts');
    const source = ts.createSourceFile(fileName, 'export const value: number = 1;', ts.ScriptTarget.Latest, true);
    const id = addModule(rollupObject, 'entry.ts', source);

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'entry.ts'), 'utf8')).to.contain('value: number = 1');
    expect(ModuleSourceFile.getSourceFileById(id)).to.equal(undefined);
    const generator = SourceMapGenerator.getInstance();
    expect(generator.getSourceMaps()).to.deep.equal({});
    generator.checkAndWriteEnd();
    const maps = JSON.parse(fs.readFileSync(path.join(root, 'build', SOURCEMAPS), 'utf8'));
    expect(Object.keys(maps)).to.have.lengthOf(1);
    const map = Object.values(maps)[0];
    expect(map.sources).to.deep.equal(['entry/src/main/ets/entry.ts']);
    expect(map.mappings).to.be.a('string').and.not.equal('');
  });

  mocha.it('rewrites TS AST imports using the resolved dependency map', function() {
    const dependencyId = addModule(rollupObject, 'dep.ts', 'export const value = 1;');
    const fileName = path.join(rollupObject.share.projectConfig.projectPath, 'entry.ts');
    const source = ts.createSourceFile(fileName, "import { value } from './dep';\nexport { value };",
      ts.ScriptTarget.Latest, true);
    const id = addModule(rollupObject, 'entry.ts', source, { './dep': dependencyId });

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    const emittedCode = fs.readFileSync(getOutputPath(rollupObject, 'entry.ts'), 'utf8');
    expect(emittedCode).to.contain('@bundle:SingleFileEmitTest/entry/ets/dep');
    expect(emittedCode).not.to.contain("'./dep'");
  });
}

function registerStringTests(): void {
  mocha.it('writes JavaScript with resolved module requests before returning', function() {
    const dependencyId = addModule(rollupObject, 'dep.ts', 'export const value = 1;');
    const id = addModule(rollupObject, 'entry.js', "import { value } from './dep';\nexport { value };",
      { './dep': dependencyId });

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    const emittedCode = fs.readFileSync(getOutputPath(rollupObject, 'entry.js'), 'utf8');
    expect(emittedCode).to.contain("from '@bundle:SingleFileEmitTest/entry/ets/dep'");
    expect(emittedCode).to.contain('export { value };');
    expect(ModuleSourceFile.getSourceFileById(id)).to.equal(undefined);
  });

  mocha.it('writes JSON exactly before returning', function() {
    const content = '{"value":1,"message":"single file"}\n';
    const id = addModule(rollupObject, 'data.json', content);

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'data.json'), 'utf8')).to.equal(content);
    expect(ModuleSourceFile.getSourceFileById(id)).to.equal(undefined);
  });
}

function registerDynamicImportTest(): void {
  mocha.it('merges the source map for a transformed dynamic import synchronously', function() {
    rollupObject.share.projectConfig.processTs = false;
    const dependencyId = addModule(rollupObject, 'dep.ts', 'export const value = 1;');
    const code = "export const load = () => import('./dep');";
    const start = code.indexOf("'./dep'");
    const nodeMap = new Map([['ImportExpression', [{
      type: 'ImportExpression',
      source: { type: 'Literal', value: './dep', start, end: start + "'./dep'".length }
    }]]]);
    const id = addModule(rollupObject, 'dynamic.ts', code, { './dep': dependencyId }, nodeMap);
    const generator = SourceMapGenerator.getInstance();
    generator.updateSourceMap(id, new MagicString(code).generateMap({
      source: 'entry/src/main/ets/dynamic.ts', hires: true
    }));

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'dynamic.js'), 'utf8'))
      .to.contain("import('@bundle:SingleFileEmitTest/entry/ets/dep')");
    expect(generator.getSourceMaps()).to.deep.equal({});
    generator.checkAndWriteEnd();
    const maps = JSON.parse(fs.readFileSync(path.join(root, 'build', SOURCEMAPS), 'utf8'));
    expect(Object.keys(maps)).to.have.lengthOf(1);
    expect(Object.values(maps)[0].mappings).to.be.a('string').and.not.equal('');
  });
}

const STATIC_MODULE_CASES = [
  {
    name: 'static import',
    nodeType: 'ImportDeclaration',
    statement: "import { value } from './dep'; const afterImport = value;",
    trailingToken: 'afterImport'
  },
  {
    name: 'export-from',
    nodeType: 'ExportNamedDeclaration',
    statement: "export { value } from './dep'; const afterExport = 1;",
    trailingToken: 'afterExport'
  },
  {
    name: 'export-all',
    nodeType: 'ExportAllDeclaration',
    statement: "export * from './dep'; const afterAll = 2;",
    trailingToken: 'afterAll'
  }
];

const STATIC_MODULE_OHM_URL = '@bundle:SingleFileEmitTest/entry/ets/dep';
const ORIGINAL_LINE_OFFSET = 4;
const ORIGINAL_COLUMN_OFFSET = 7;

function createOriginSourceMap(code: string): sourceMap.RawSourceMap {
  const generator = new sourceMap.SourceMapGenerator({ file: 'static.js' });
  let line = 1;
  let column = 0;
  for (const character of code) {
    if (character === '\n') {
      line++;
      column = 0;
      continue;
    }
    generator.addMapping({
      generated: { line, column },
      original: { line: line + ORIGINAL_LINE_OFFSET, column: column + ORIGINAL_COLUMN_OFFSET },
      source: 'entry/src/main/ets/static.ts'
    });
    column++;
  }
  return generator.toJSON();
}

function createStaticModule(nodeType: string, statement: string,
  options: { singleFileEmit?: boolean, request?: string, resolveRequest?: boolean } = {}): Object {
  rollupObject.share.projectConfig.processTs = false;
  rollupObject.share.projectConfig.singleFileEmit = options.singleFileEmit ?? true;
  const dependencyId = addModule(rollupObject, 'dep.ts', 'export const value = 1;');
  const request = options.request || './dep';
  const code = '// retain original source positions\n' + statement;
  const literal = `'${request}'`;
  const start = code.indexOf(literal);
  const nodeMap = new Map([[nodeType, [{
    type: nodeType,
    source: { type: 'Literal', value: request, start, end: start + literal.length }
  }]]]);
  const importedIds = options.resolveRequest === false ? {} : { [request]: dependencyId };
  const id = addModule(rollupObject, 'static.ts', code, importedIds, nodeMap);
  ModuleSourceFile.initPluginEnv(rollupObject);
  const files = ModuleSourceFile.getSourceFiles();
  const moduleSource = options.singleFileEmit === false ? files[files.length - 1] : ModuleSourceFile.getSourceFileById(id);
  const generator = SourceMapGenerator.getInstance();
  const map = createOriginSourceMap(code);
  generator.updateSourceMap(id, map);
  return { id, code, moduleSource, generator, map };
}

function readSingleEmittedSourceMap(generator: SourceMapGenerator): sourceMap.RawSourceMap {
  generator.checkAndWriteEnd();
  const maps = JSON.parse(fs.readFileSync(path.join(root, 'build', SOURCEMAPS), 'utf8'));
  expect(Object.keys(maps)).to.have.lengthOf(1);
  return Object.values(maps)[0] as sourceMap.RawSourceMap;
}

function getTextPosition(code: string, token: string): sourceMap.Position {
  const index = code.indexOf(token);
  expect(index).to.be.at.least(0);
  const precedingLines = code.slice(0, index).split('\n');
  return { line: precedingLines.length, column: precedingLines[precedingLines.length - 1].length };
}

function expectOriginalTokenPosition(consumer: sourceMap.SourceMapConsumer, emittedCode: string, originalCode: string,
  generatedToken: string, originalToken: string = generatedToken): void {
  const original = getTextPosition(originalCode, originalToken);
  const mapped = consumer.originalPositionFor(getTextPosition(emittedCode, generatedToken));
  expect(mapped.line).to.equal(original.line + ORIGINAL_LINE_OFFSET);
  expect(mapped.column).to.equal(original.column + ORIGINAL_COLUMN_OFFSET);
}

function registerStaticSourceMapTests(): void {
  for (const testCase of STATIC_MODULE_CASES) {
    mocha.it(`maps a rewritten ${testCase.name} and following same-line code to original positions`, async function() {
      const fixture = createStaticModule(testCase.nodeType, testCase.statement);
      expect(plugin.afterTransform.call(rollupObject, { id: fixture.id })).to.equal(true);
      const emittedCode = fs.readFileSync(getOutputPath(rollupObject, 'static.js'), 'utf8');
      expect(emittedCode).to.contain(`'${STATIC_MODULE_OHM_URL}'`);
      expect(getTextPosition(emittedCode, testCase.trailingToken).column)
        .to.be.greaterThan(getTextPosition(fixture.code, testCase.trailingToken).column);
      const consumer = await new sourceMap.SourceMapConsumer(readSingleEmittedSourceMap(fixture.generator));
      try {
        expectOriginalTokenPosition(consumer, emittedCode, fixture.code, `'${STATIC_MODULE_OHM_URL}'`, "'./dep'");
        expectOriginalTokenPosition(consumer, emittedCode, fixture.code, testCase.trailingToken);
      } finally {
        consumer.destroy();
      }
    });
  }
}

function registerUnchangedStaticSourceMapTests(): void {
  mocha.it('keeps the source map when a static module request cannot be rewritten', function() {
    const fixture = createStaticModule('ImportDeclaration', "import { value } from './dep'; const afterImport = value;",
      { resolveRequest: false });
    const updateMap = sinon.spy(fixture.generator, 'updateSourceMap');

    expect(plugin.afterTransform.call(rollupObject, { id: fixture.id })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'static.js'), 'utf8')).to.equal(fixture.code);
    expect(updateMap.called).to.equal(false);
    expect(readSingleEmittedSourceMap(fixture.generator)).to.deep.equal(fixture.map);
  });

  mocha.it('keeps the source map when the single-quoted static request already equals its OHM URL', function() {
    const fixture = createStaticModule('ExportAllDeclaration',
      `export * from '${STATIC_MODULE_OHM_URL}'; const afterAll = 2;`, { request: STATIC_MODULE_OHM_URL });
    const updateMap = sinon.spy(fixture.generator, 'updateSourceMap');

    expect(plugin.afterTransform.call(rollupObject, { id: fixture.id })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'static.js'), 'utf8')).to.equal(fixture.code);
    expect(updateMap.called).to.equal(false);
    expect(readSingleEmittedSourceMap(fixture.generator)).to.deep.equal(fixture.map);
  });
}

function registerBatchStaticSourceMapTests(): void {
  for (const testCase of STATIC_MODULE_CASES) {
    mocha.it(`retains the batch source-map behavior for a rewritten ${testCase.name}`, async function() {
      const fixture = createStaticModule(testCase.nodeType, testCase.statement, { singleFileEmit: false });
      const updateMap = sinon.spy(fixture.generator, 'updateSourceMap');
      const mergeMap = sinon.spy(arkCompilerUtils, 'updateSourceMap');

      const result = fixture.moduleSource.processModuleRequest(rollupObject);
      expect(result).to.be.instanceOf(Promise);
      await result;
      expect(fixture.moduleSource.source).to.contain(`'${STATIC_MODULE_OHM_URL}'`);
      expect(updateMap.called).to.equal(false);
      expect(mergeMap.called).to.equal(false);
      expect(fixture.generator.getSourceMap(fixture.id)).to.equal(fixture.map);
    });
  }
}

function registerReleaseHarTests(): void {
  mocha.it('writes a release HAR TS SourceFile and records its cache path synchronously', function() {
    const config = rollupObject.share.projectConfig;
    config.buildMode = RELEASE;
    config.compileHar = true;
    config.moduleRootPath = config.modulePath;
    const fileName = path.join(config.projectPath, 'entry.ts');
    const source = ts.createSourceFile(fileName, 'export const value: number = 1;', ts.ScriptTarget.Latest, true);
    const id = addModule(rollupObject, 'entry.ts', source);
    const declarationPath = path.join(root, 'entry.d.ts');
    harFilesRecord.set(id, { sourcePath: id, originalDeclarationCachePath: declarationPath });

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    const outputPath = getOutputPath(rollupObject, 'entry.ts');
    expect(fs.readFileSync(outputPath, 'utf8')).to.contain('value: number = 1');
    expect(harFilesRecord.get(id).sourceCachePath).to.equal(outputPath);
    expect(harFilesRecord.get(id).originalDeclarationCachePath).to.equal(declarationPath);
    expect(ModuleSourceFile.getSourceFileById(id)).to.equal(undefined);
  });

  mocha.it('writes release HAR JavaScript and records its cache path synchronously', function() {
    const config = rollupObject.share.projectConfig;
    config.buildMode = RELEASE;
    config.compileHar = true;
    config.moduleRootPath = config.modulePath;
    const content = 'export const value = 1;\n';
    const id = addModule(rollupObject, 'entry.js', content);

    expect(plugin.afterTransform.call(rollupObject, { id })).to.equal(true);
    const outputPath = getOutputPath(rollupObject, 'entry.js');
    expect(fs.readFileSync(outputPath, 'utf8')).to.equal(content);
    expect(harFilesRecord.get(id)).to.deep.equal({ sourcePath: id, sourceCachePath: outputPath });
    expect(ModuleSourceFile.getSourceFileById(id)).to.equal(undefined);
  });
}

function registerLifecycleTests(): void {
  mocha.it('propagates a write failure synchronously to Rollup', function() {
    const id = addModule(rollupObject, 'data.json', '{"value":1}');
    const blockedCachePath = path.join(root, 'blocked-cache');
    fs.writeFileSync(blockedCachePath, 'a file cannot be used as a cache directory');
    rollupObject.share.projectConfig.cachePath = blockedCachePath;
    initialize(rollupObject);

    expect(() => plugin.afterTransform.call(rollupObject, { id })).to.throw();
  });

  mocha.it('cleans pending modules and initializes the next build with its new cache directory', function() {
    const firstId = addModule(rollupObject, 'first.json', '{"build":1}');
    const pendingId = addModule(rollupObject, 'pending.json', '{"pending":true}');
    plugin.afterTransform.call(rollupObject, { id: firstId });
    plugin.cleanUp();
    expect(ModuleSourceFile.getSourceFileById(pendingId)).to.equal(undefined);

    const secondRollupObject = createRollupContext(createProjectConfig(root, 'second-cache'));
    initialize(secondRollupObject);
    const secondId = addModule(secondRollupObject, 'second.json', '{"build":2}');
    expect(plugin.afterTransform.call(secondRollupObject, { id: secondId })).to.equal(true);
    expect(fs.readFileSync(getOutputPath(secondRollupObject, 'second.json'), 'utf8')).to.equal('{"build":2}');
    expect(fs.existsSync(getOutputPath(rollupObject, 'second.json'))).to.equal(false);
    expect(fs.existsSync(getOutputPath(secondRollupObject, 'pending.json'))).to.equal(false);
  });
}

function createDynamicBatchModule(): Object {
  rollupObject.share.projectConfig.singleFileEmit = false;
  rollupObject.share.projectConfig.processTs = false;
  const dependencyId = addModule(rollupObject, 'dep.ts', 'export const value = 1;');
  const code = "export const load = () => import('./dep');";
  const start = code.indexOf("'./dep'");
  const nodeMap = new Map([['ImportExpression', [{
    type: 'ImportExpression',
    source: { type: 'Literal', value: './dep', start, end: start + "'./dep'".length }
  }]]]);
  const id = addModule(rollupObject, 'dynamic.ts', code, { './dep': dependencyId }, nodeMap);
  const moduleSource = ModuleSourceFile.getSourceFiles().find(source => source.getModuleId() === id);
  ModuleSourceFile.initPluginEnv(rollupObject);
  const generator = SourceMapGenerator.getInstance();
  const map = new MagicString(code).generateMap({ source: 'entry/src/main/ets/dynamic.ts', hires: true });
  generator.updateSourceMap(id, map);
  return { id, moduleSource, code, generator, map };
}

function registerBatchRequestTests(): void {
  mocha.it('returns a Promise for batch JSON, JavaScript and TS AST module requests', async function() {
    rollupObject.share.projectConfig.singleFileEmit = false;
    addModule(rollupObject, 'data.json', '{"value":1}');
    addModule(rollupObject, 'entry.js', 'export const value = 1;');
    const fileName = path.join(rollupObject.share.projectConfig.projectPath, 'entry.ts');
    addModule(rollupObject, 'entry.ts', ts.createSourceFile(fileName, 'export const value: number = 1;',
      ts.ScriptTarget.Latest, true));
    ModuleSourceFile.initPluginEnv(rollupObject);

    for (const source of ModuleSourceFile.getSourceFiles()) {
      const result = source.processModuleRequest(rollupObject);
      expect(result).to.be.instanceOf(Promise);
      await result;
    }
  });

  mocha.it('commits batch dynamic-import source and map after asynchronous merging finishes', async function() {
    const fixture = createDynamicBatchModule();
    const deferred = createDeferred<Object>();
    const mergeSourceMap = sinon.stub(arkCompilerUtils, 'updateSourceMap').returns(deferred.promise);

    const result = fixture.moduleSource.processModuleRequest(rollupObject);
    expect(result).to.be.instanceOf(Promise);
    expect(mergeSourceMap.calledOnce).to.equal(true);
    await Promise.resolve();
    expect(fixture.moduleSource.source).to.equal(fixture.code);
    expect(fixture.generator.getSourceMap(fixture.id)).to.equal(fixture.map);

    const mergedMap = JSON.parse(JSON.stringify(fixture.map));
    mergedMap.file = 'merged-dynamic.js';
    deferred.resolve(mergedMap);
    await result;
    expect(fixture.moduleSource.source).to.contain("import('@bundle:SingleFileEmitTest/entry/ets/dep')");
    expect(fixture.generator.getSourceMap(fixture.id)).to.equal(mergedMap);
  });
}

function registerBatchWriteTest(): void {
  mocha.it('waits for batch module-request processing before writing the source file', async function() {
    rollupObject.share.projectConfig.singleFileEmit = false;
    addModule(rollupObject, 'data.json', '{"value":1}');
    const source = ModuleSourceFile.getSourceFiles()[0];
    const deferred = createDeferred<void>();
    const processRequest = sinon.stub(source, 'processModuleRequest').returns(deferred.promise);
    const writeSource = sinon.spy(source, 'writeSourceFile');
    // Keep whole-project obfuscation bookkeeping outside this ordering regression.
    sinon.stub(obfuscationConfig, 'collectSourcesWhiteList');
    sinon.stub(obfuscationConfig, 'handlePostObfuscationTasks').resolves();
    sinon.stub(obfuscationConfig, 'writeObfuscationCaches');

    const result = ModuleSourceFile.processModuleSourceFiles(rollupObject);
    expect(result).to.be.instanceOf(Promise);
    expect(processRequest.calledOnce).to.equal(true);
    await Promise.resolve();
    expect(writeSource.called).to.equal(false);
    expect(fs.existsSync(getOutputPath(rollupObject, 'data.json'))).to.equal(false);

    deferred.resolve();
    await result;
    expect(writeSource.calledOnce).to.equal(true);
    expect(fs.readFileSync(getOutputPath(rollupObject, 'data.json'), 'utf8')).to.equal('{"value":1}');
    expect(ModuleSourceFile.getSourceFiles()).to.deep.equal([]);
  });
}

async function expectRejection(result: Promise<void>, error: Error): Promise<void> {
  let rejected = false;
  try {
    await result;
  } catch (actualError) {
    rejected = true;
    expect(actualError).to.equal(error);
  }
  expect(rejected).to.equal(true);
}

function registerBatchErrorTests(): void {
  mocha.it('rejects batch module-request Promises when downstream processing throws', async function() {
    const fixture = createDynamicBatchModule();
    const failure = new Error('failed to read the transformed import nodes');
    sinon.stub(rollupObject.getModuleInfo(fixture.id), 'getNodeByType').throws(failure);
    let result: Promise<void>;

    expect(() => {
      result = fixture.moduleSource.processModuleRequest(rollupObject);
    }).not.to.throw();
    expect(result).to.be.instanceOf(Promise);
    await expectRejection(result, failure);
    expect(fixture.moduleSource.source).to.equal(fixture.code);
  });

  mocha.it('rejects batch dynamic-import merging without committing partial source or map', async function() {
    const fixture = createDynamicBatchModule();
    const failure = new Error('asynchronous source-map merge failed');
    const deferred = createDeferred<Object>();
    sinon.stub(arkCompilerUtils, 'updateSourceMap').returns(deferred.promise);
    const result = fixture.moduleSource.processModuleRequest(rollupObject);
    expect(result).to.be.instanceOf(Promise);

    deferred.reject(failure);
    await expectRejection(result, failure);
    expect(fixture.moduleSource.source).to.equal(fixture.code);
    expect(fixture.generator.getSourceMap(fixture.id)).to.equal(fixture.map);
  });
}

mocha.describe('singleFileEmit afterTransform', function() {
  mocha.beforeEach(prepareFixture);
  mocha.afterEach(cleanFixture);
  registerHookTests();
  registerTsTests();
  registerStringTests();
  registerDynamicImportTest();
  registerStaticSourceMapTests();
  registerUnchangedStaticSourceMapTests();
  registerBatchStaticSourceMapTests();
  registerReleaseHarTests();
  registerLifecycleTests();
  registerBatchRequestTests();
  registerBatchWriteTest();
  registerBatchErrorTests();
});
