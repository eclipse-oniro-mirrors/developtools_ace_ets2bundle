/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use rollupObject file except in compliance with the License.
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
import fs from 'fs';
import mocha from 'mocha';
import os from 'os';
import path from 'path';
import sinon from 'sinon';
import { SourceMapConsumer } from 'source-map';
import ts from 'typescript';

import {
  DEBUG,
  ESMODULE,
  RELEASE,
  SOURCEMAPS,
  SOURCEMAPS_JSON
} from '../../../lib/fast_build/ark_compiler/common/ark_define';
import RollUpPluginMock from '../mock/rollup_mock/rollup_plugin_mock';
import { SourceMapGenerator } from '../../../lib/fast_build/ark_compiler/generate_sourcemap';
import {
  ENTRYABILITY_JS_PATH_DEFAULT,
  ENTRYABILITY_TS_PATH_DEFAULT,
  ENTRY_PACKAGE_NAME_DEFAULT,
  ENTRY_MODULE_VERSION_DEFAULT,
  INDEX_ETS_PATH_DEFAULT,
  INDEX_JS_CACHE_PATH
} from '../mock/rollup_mock/common';
import {
  compilingEtsOrTsFiles,
  hasTsNoCheckOrTsIgnoreFiles,
  cleanUpFilesList
} from '../../../lib/fast_build/ark_compiler/utils';
import {
  ArkTSInternalErrorDescription,
  ErrorCode,
} from '../../../lib/fast_build/ark_compiler/error_code';
import {
  CommonLogger,
  LogData,
  LogDataFactory
} from '../../../lib/fast_build/ark_compiler/logger';

import { checkArkCompilerCacheInfo, shouldInvalidCache } from '../../../lib/fast_build/ark_compiler/cache';
import { BytecodeObfuscator } from '../../../lib/fast_build/ark_compiler/bytecode_obfuscator';
import * as arkUtils from '../../../lib/fast_build/ark_compiler/utils';

const prefix = `${ENTRY_PACKAGE_NAME_DEFAULT}|${ENTRY_PACKAGE_NAME_DEFAULT}|${ENTRY_MODULE_VERSION_DEFAULT}|`;
let entryPkgInfo = `${ENTRY_PACKAGE_NAME_DEFAULT}|${ENTRY_MODULE_VERSION_DEFAULT}`;

let sandbox: sinon.SinonSandbox;
let temporaryPath: string;
let projectConfig: Object;
let rollup: Object;
let modules: { id: string; meta: Object }[];

const ORIGINAL_SOURCE = 'export function message(): string {\n  return "old-entry";\n}\n';
const UPDATED_SOURCE = 'const label: string = "new-entry";\n\nexport function message(): string {\n' +
  '  const currentValue: string = label;\n  return currentValue;\n}\n';

function setUp(): void {
  sandbox = sinon.createSandbox();
  SourceMapGenerator.cleanSourceMapObject();
  CommonLogger.destroyInstance();
  // Hold intermediate extensions stable while exercising real package keys, payloads and file merging.
  sandbox.stub(arkUtils, 'shouldETSOrTSFileTransformToJS').returns(false);
  sandbox.stub(BytecodeObfuscator, 'enable').value(false);
  temporaryPath = fs.mkdtempSync(path.join(os.tmpdir(), 'entry-package-cache-'));
  projectConfig = {
    compileMode: ESMODULE, buildMode: DEBUG, projectRootPath: temporaryPath, packageDir: 'oh_modules',
    cachePath: path.join(temporaryPath, 'cache'), aceModuleBuild: path.join(temporaryPath, 'build'),
    entryPackageName: 'entry', entryModuleVersion: '1.0.0', bundleName: 'com.example.app',
    allModuleNameHash: 'unchanged-module-hash', singleFileEmit: true
  };
  fs.mkdirSync(projectConfig.cachePath);
  fs.mkdirSync(projectConfig.aceModuleBuild);
  modules = ['entry', 'har1', 'har2'].map(name => {
    const pkgPath = path.join(temporaryPath, name);
    const id = path.join(pkgPath, 'src', 'main', 'ets', 'Index.ets');
    fs.mkdirSync(path.dirname(id), { recursive: true });
    fs.writeFileSync(id, 'export const value = 1;');
    const dependencyPkgInfo = name === 'entry' ? undefined : { pkgName: name, pkgVersion: '2.0.0' };
    return { id, meta: { pkgPath, dependencyPkgInfo } };
  });
  const cache = new Map();
  rollup = {
    share: {
      projectConfig, arkProjectConfig: {}, getLogger: () => ({ error: sandbox.stub(), warn: sandbox.stub() }),
      throwArkTsCompilerError: (message: string) => {
        throw new Error(message);
      }
    },
    cache: { get: key => cache.get(key), set: (key, value) => cache.set(key, value) },
    getModuleIds: () => modules.map(module => module.id).values(),
    getModuleInfo: id => modules.find(module => module.id === id), async: callback => callback(), signal: sandbox.stub()
  };
  resetSingleFileCollection();
}

function resetSingleFileCollection(): void {
  // Prior reload suites may leave this module's single-file collection gate disabled.
  SourceMapGenerator.init({ ...rollup, share: {
    ...rollup.share, arkProjectConfig: {}, projectConfig: { ...projectConfig, coldReload: true, isFirstBuild: true }
  } });
  SourceMapGenerator.cleanSourceMapObject();
}

function tearDown(): void {
  SourceMapGenerator.cleanSourceMapObject();
  CommonLogger.destroyInstance();
  sandbox.restore();
  fs.rmSync(temporaryPath, { recursive: true, force: true });
}

function buildSourceMaps(changedModuleIds: string[] = [], marker: string = 'modified', payloads: Object = {}):
  { invalid: boolean; maps: Object } {
  checkArkCompilerCacheInfo(rollup);
  const invalid = shouldInvalidCache();
  SourceMapGenerator.init(rollup);
  const generator = SourceMapGenerator.getInstance();
  modules.filter(module => changedModuleIds.includes(module.id)).forEach(module => {
    const map = { version: 3, sources: [module.id], names: [marker], mappings: 'AAAA', ...payloads[module.id] };
    generator.fillSourceMapPackageInfo(module.id, map);
    generator.updateSourceMap(module.id, map);
    generator.buildModuleSourceMapInfoSingle(undefined);
    if (projectConfig.singleFileEmit && !projectConfig.widgetCompile) {
      expect(generator.getSourceMaps()).to.deep.equal({});
    }
  });
  generator.buildModuleSourceMapInfo(undefined);
  const maps = JSON.parse(fs.readFileSync(sourceMapFile(), 'utf-8'));
  expect(JSON.parse(fs.readFileSync(path.join(projectConfig.cachePath, SOURCEMAPS_JSON), 'utf-8'))).to.deep.equal(maps);
  SourceMapGenerator.cleanSourceMapObject();
  return { invalid, maps };
}

function sourceMapFile(): string {
  return path.join(projectConfig.buildMode === DEBUG ? projectConfig.aceModuleBuild : projectConfig.cachePath, SOURCEMAPS);
}

function cacheFile(): string {
  return path.join(projectConfig.cachePath, SOURCEMAPS_JSON);
}

function seedSourceMaps(): Object {
  return buildSourceMaps(modules.map(module => module.id), 'cached').maps;
}

function seedDetailedSourceMaps(): Object {
  const entryId = modules[0].id;
  return buildSourceMaps(modules.map(module => module.id), 'cached', {
    [entryId]: {
      file: 'Index.ts', sourceRoot: '../sources', sources: [entryId],
      sourcesContent: ['export const value = 1;\nexport const label = "cached";\n'],
      names: ['value', 'label'], mappings: 'AAAA;AACA', 'custom-map-field': { retained: true }
    }
  }).maps;
}

function transpileSourceMap(source: string, fileName: string): { code: string; map: Object } {
  const emitted = ts.transpileModule(source, {
    fileName,
    compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.ESNext, sourceMap: true, inlineSources: true, allowJs: true }
  });
  return { code: emitted.outputText, map: JSON.parse(emitted.sourceMapText) };
}

async function expectOriginalPosition(map: Object, code: string, source: string): Promise<void> {
  const marker = 'return currentValue;';
  const generatedLines = code.split('\n');
  const sourceLines = source.split('\n');
  const generatedIndex = generatedLines.findIndex(line => line.includes(marker));
  const sourceIndex = sourceLines.findIndex(line => line.includes(marker));
  expect(generatedIndex).to.be.at.least(0);
  expect(sourceIndex).to.be.at.least(0);
  const consumer = await new SourceMapConsumer(map);
  try {
    const position = consumer.originalPositionFor({ line: generatedIndex + 1, column: generatedLines[generatedIndex].indexOf(marker) });
    expect(position.line).to.equal(sourceIndex + 1);
    expect(position.column).to.equal(sourceLines[sourceIndex].indexOf(marker));
    expect(position.source).to.match(/Index\.(ets|ts|js)$/);
  } finally {
    consumer.destroy();
  }
}

function entryKey(): string {
  return `${projectConfig.entryPackageName}|${projectConfig.entryPackageName}|${projectConfig.entryModuleVersion}|src/main/ets/Index.ts`;
}

mocha.describe('test generate_sourcemap api', function () {
  mocha.before(function () {
    this.rollup = new RollUpPluginMock();
  });

  mocha.after(() => {
    delete this.rollup;
  });

  mocha.it('1-1: test getPkgInfoByModuleId under build debug', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let pkgInfo = sourceMapGenerator.getPkgInfoByModuleId(moduleId);

    expect(pkgInfo && pkgInfo.entry && pkgInfo.modulePath && pkgInfo.entry.name && pkgInfo.entry.version !== '' && pkgInfo.entry.version != undefined).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('1-2: test getPkgInfoByModuleId under build release', function () {
    this.rollup.build(RELEASE);
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let pkgInfo = sourceMapGenerator.getPkgInfoByModuleId(moduleId);

    expect(pkgInfo && pkgInfo.entry && pkgInfo.modulePath && pkgInfo.entry.name && pkgInfo.entry.version !== '' && pkgInfo.entry.version != undefined).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('1-3: test getPkgInfoByModuleId under preview', function () {
    this.rollup.preview();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let pkgInfo = sourceMapGenerator.getPkgInfoByModuleId(moduleId);

    expect(pkgInfo && pkgInfo.entry && pkgInfo.modulePath && pkgInfo.entry.name && pkgInfo.entry.version !== '' && pkgInfo.entry.version != undefined).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('1-4: test getPkgInfoByModuleId under hotReload', function () {
    this.rollup.hotReload();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let pkgInfo = sourceMapGenerator.getPkgInfoByModuleId(moduleId);

    expect(pkgInfo && pkgInfo.entry && pkgInfo.modulePath && pkgInfo.entry.name && pkgInfo.entry.version !== '' && pkgInfo.entry.version != undefined).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('1-5: test getPkgInfoByModuleId with file name obfuscate', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    let pkgInfo = sourceMapGenerator.getPkgInfoByModuleId(moduleId, true);
    expect(pkgInfo && pkgInfo.entry && pkgInfo.modulePath && pkgInfo.entry.name && pkgInfo.entry.version !== '' && pkgInfo.entry.version != undefined).to.be.true;
    expect(pkgInfo.modulePath == 'src/main/a/b.ts').to.be.true;
    cleanUpFilesList();
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('1-6: test GetModuleInfoFaild error of getPkgInfoByModuleId', function () {
    this.rollup.build();
    const errInfo: LogData = LogDataFactory.newInstance(
      ErrorCode.ETS2BUNDLE_INTERNAL_GET_MODULE_INFO_FAILED,
      ArkTSInternalErrorDescription,
      'Failed to get ModuleInfo, moduleId: moduleId',
      '',
      ['Please check if the imported file moduleId includes the .js suffix.']
    );
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = "moduleId";
    const getModuleInfoStub = sinon.stub(SourceMapGenerator.rollupObject, 'getModuleInfo').returns(undefined);
    const stub = sinon.stub(sourceMapGenerator.logger.getLoggerFromErrorCode(errInfo.code), 'printErrorAndExit');

    try {
      sourceMapGenerator.getPkgInfoByModuleId(moduleId);
    } catch (e) {
    }
    expect(stub.calledWith(errInfo)).to.be.true;
    getModuleInfoStub.restore();
    stub.restore();
    SourceMapGenerator.cleanSourceMapObject();
  })

  mocha.it('1-6-1: test GetModuleInfoFaild error of getPkgInfoByModuleId ' +
    'without getHvigorConsoleLogger', function () {
    this.rollup.build();
    const errInfo: LogData = LogDataFactory.newInstance(
      ErrorCode.ETS2BUNDLE_INTERNAL_GET_MODULE_INFO_FAILED,
      ArkTSInternalErrorDescription,
      'Failed to get ModuleInfo, moduleId: moduleId',
      '',
      ['Please check if the imported file moduleId includes the .js suffix.']
    );
    CommonLogger.destroyInstance();
    const getHvigorConsoleLogger = this.rollup.share.getHvigorConsoleLogger;
    this.rollup.share.getHvigorConsoleLogger = undefined;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = "moduleId";
    const getModuleInfoStub = sinon.stub(SourceMapGenerator.rollupObject, 'getModuleInfo').returns(undefined);
    const stub = sinon.stub(sourceMapGenerator.logger, 'throwArkTsCompilerError');

    try {
      sourceMapGenerator.getPkgInfoByModuleId(moduleId);
    } catch (e) {
    }
    expect(stub.calledWith(errInfo.toString())).to.be.true;
    CommonLogger.destroyInstance();
    this.rollup.share.getHvigorConsoleLogger = getHvigorConsoleLogger;
    getModuleInfoStub.restore();
    stub.restore();
    SourceMapGenerator.cleanSourceMapObject();
  })

  mocha.it('1-7: test UnableToGetModuleInfoMeta error of getPkgInfoByModuleId', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = "moduleId";
    const getModuleInfoStub = sinon.stub(SourceMapGenerator.rollupObject, 'getModuleInfo').returns({'meta': undefined});
    const stub = sinon.stub(sourceMapGenerator.logger, 'printErrorAndExit');

    try {
      sourceMapGenerator.getPkgInfoByModuleId(moduleId);
    } catch (e) {
    }
    const errInfo: LogData = LogDataFactory.newInstance(
      ErrorCode.ETS2BUNDLE_INTERNAL_UNABLE_TO_GET_MODULE_INFO_META,
      ArkTSInternalErrorDescription,
      "Failed to get ModuleInfo properties 'meta', moduleId: moduleId"
    );
    expect(stub.calledWith(errInfo)).to.be.true;
    getModuleInfoStub.restore();
    stub.restore();
    SourceMapGenerator.cleanSourceMapObject();
  })

  mocha.it('1-8: test UnableToGetModuleInfoMetaPkgPath error of getPkgInfoByModuleId', function () {
    this.rollup.build();
    const errInfo: LogData = LogDataFactory.newInstance(
      ErrorCode.ETS2BUNDLE_INTERNAL_UNABLE_TO_GET_MODULE_INFO_META_PKG_PATH,
      ArkTSInternalErrorDescription,
      "Failed to get ModuleInfo properties 'meta.pkgPath', moduleId: moduleId"
    );
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = "moduleId";
    const getModuleInfoStub = sinon.stub(SourceMapGenerator.rollupObject, 'getModuleInfo').returns({'meta': {'pkgPath': undefined}});
    const stub = sinon.stub(sourceMapGenerator.logger.getLoggerFromErrorCode(errInfo.code), 'printErrorAndExit');

    try {
      sourceMapGenerator.getPkgInfoByModuleId(moduleId);
    } catch (e) {
    }
    expect(stub.calledWith(errInfo)).to.be.true;
    getModuleInfoStub.restore();
    stub.restore();
    SourceMapGenerator.cleanSourceMapObject();
  })

  mocha.it('1-9: test UnableToGetModuleInfoMetaPkgPath error of getPkgInfoByModuleId ' +
    'without getHvigorConsoleLogger', function () {
    this.rollup.build();
    const errInfo: LogData = LogDataFactory.newInstance(
      ErrorCode.ETS2BUNDLE_INTERNAL_UNABLE_TO_GET_MODULE_INFO_META_PKG_PATH,
      ArkTSInternalErrorDescription,
      "Failed to get ModuleInfo properties 'meta.pkgPath', moduleId: moduleId"
    );
    CommonLogger.destroyInstance();
    const getHvigorConsoleLogger = this.rollup.share.getHvigorConsoleLogger;
    this.rollup.share.getHvigorConsoleLogger = undefined;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = "moduleId";
    const getModuleInfoStub = sinon.stub(SourceMapGenerator.rollupObject, 'getModuleInfo').returns({'meta': {'pkgPath': undefined}});
    const stub = sinon.stub(sourceMapGenerator.logger, 'throwArkTsCompilerError');

    try {
      sourceMapGenerator.getPkgInfoByModuleId(moduleId);
    } catch (e) {
    }
    expect(stub.calledWith(errInfo.toString())).to.be.true;
    CommonLogger.destroyInstance();
    this.rollup.share.getHvigorConsoleLogger = getHvigorConsoleLogger;
    getModuleInfoStub.restore();
    stub.restore();
    SourceMapGenerator.cleanSourceMapObject();
  })

  mocha.it('2-1: test genKey under build debug', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let genKey = sourceMapGenerator.genKey(moduleId);
    let expectKey = prefix + ENTRYABILITY_TS_PATH_DEFAULT.substring(1);

    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('2-2: test genKey under build release', function () {
    this.rollup.build(RELEASE);
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let genKey = sourceMapGenerator.genKey(moduleId);
    let expectKey = prefix + ENTRYABILITY_TS_PATH_DEFAULT.substring(1);

    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('2-3: test genKey under preview', function () {
    this.rollup.preview();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let genKey = sourceMapGenerator.genKey(moduleId);
    let expectKey = prefix + ENTRYABILITY_TS_PATH_DEFAULT.substring(1);

    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('2-4: test genKey under hotReload', function () {
    this.rollup.hotReload();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let genKey = sourceMapGenerator.genKey(moduleId);
    let expectKey = prefix + ENTRYABILITY_TS_PATH_DEFAULT.substring(1);

    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('2-5: test genKey with file name obfuscate', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let genKey = sourceMapGenerator.genKey(moduleId, true);
    let expectKey = 'entry|entry|1.0.0|src/main/a/b.ts';
    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('3-1: test updateSourceMap under build debug', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = { version: '1.0.0' };
    sourceMapGenerator.updateSourceMap(moduleId, sourceMapData);
    let sourceMapDataGet = sourceMapGenerator.getSourceMap(moduleId);
    expect(sourceMapData === sourceMapDataGet).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('3-2: test updateSourceMap under build release', function () {
    this.rollup.build(RELEASE);
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = { version: '1.0.0' };
    sourceMapGenerator.updateSourceMap(moduleId, sourceMapData);
    let sourceMapDataGet = sourceMapGenerator.getSourceMap(moduleId);
    expect(sourceMapData === sourceMapDataGet).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('3-3: test updateSourceMap under preview', function () {
    this.rollup.preview();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = { version: '1.0.0' };
    sourceMapGenerator.updateSourceMap(moduleId, sourceMapData);
    let sourceMapDataGet = sourceMapGenerator.getSourceMap(moduleId);
    expect(sourceMapData === sourceMapDataGet).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('3-4: test updateSourceMap under hotReload', function () {
    this.rollup.hotReload();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = { version: '1.0.0' };
    sourceMapGenerator.updateSourceMap(moduleId, sourceMapData);
    let sourceMapDataGet = sourceMapGenerator.getSourceMap(moduleId);
    expect(sourceMapData === sourceMapDataGet).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('4-1: test fillSourceMapPackageInfo under build debug', function () {
    this.rollup.build();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);

    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = {};
    sourceMapGenerator.fillSourceMapPackageInfo(moduleId, sourceMapData);
    expect(sourceMapData['entry-package-info'] && sourceMapData['entry-package-info'] === entryPkgInfo).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('4-2: test fillSourceMapPackageInfo under build release', function () {
    this.rollup.build(RELEASE);
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);

    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = {};
    sourceMapGenerator.fillSourceMapPackageInfo(moduleId, sourceMapData);
    expect(sourceMapData['entry-package-info'] && sourceMapData['entry-package-info'] === entryPkgInfo).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('4-3: test fillSourceMapPackageInfo under preview', function () {
    this.rollup.preview();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);

    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = {};
    sourceMapGenerator.fillSourceMapPackageInfo(moduleId, sourceMapData);
    expect(sourceMapData['entry-package-info'] && sourceMapData['entry-package-info'] === entryPkgInfo).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('4-4: test fillSourceMapPackageInfo under hotReload', function () {
    this.rollup.hotReload();
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);

    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    let sourceMapData = {};
    sourceMapGenerator.fillSourceMapPackageInfo(moduleId, sourceMapData);
    expect(sourceMapData['entry-package-info'] && sourceMapData['entry-package-info'] === entryPkgInfo).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('5-1: test genKey under build debug: arkProjectConfig.processTs is true', function () {
    this.rollup.build();
    this.rollup.share.arkProjectConfig.processTs = true;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    let genKey = sourceMapGenerator.genKey(moduleId);
    cleanUpFilesList();
    let expectKey = prefix + ENTRYABILITY_JS_PATH_DEFAULT.substring(1);
    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('5-2: test genKey under build release: arkProjectConfig.processTs is true', function () {
    this.rollup.build(RELEASE);
    this.rollup.share.arkProjectConfig.processTs = true;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    let genKey = sourceMapGenerator.genKey(moduleId);
    cleanUpFilesList();
    let expectKey = prefix + ENTRYABILITY_JS_PATH_DEFAULT.substring(1);
    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('5-3: test genKey under preview: arkProjectConfig.processTs is true', function () {
    this.rollup.preview();
    this.rollup.share.arkProjectConfig.processTs = true;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    let genKey = sourceMapGenerator.genKey(moduleId);
    cleanUpFilesList();
    let expectKey = prefix + ENTRYABILITY_JS_PATH_DEFAULT.substring(1);
    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('5-4: test genKey under hotReload: arkProjectConfig.processTs is true', function () {
    this.rollup.hotReload();
    this.rollup.share.arkProjectConfig.processTs = true;
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, ENTRYABILITY_TS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    let genKey = sourceMapGenerator.genKey(moduleId);
    cleanUpFilesList();
    let expectKey = prefix + ENTRYABILITY_JS_PATH_DEFAULT.substring(1);
    expect(genKey === expectKey).to.be.true;
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('6-1: test updateCachedSourceMaps under build debug: arkProjectConfig.processTs is true', function () {
    this.rollup.build();
    this.rollup.share.arkProjectConfig.processTs = true;
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, INDEX_ETS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    const indexCachePath = this.rollup.share.projectConfig.projectRootPath + '/' + INDEX_JS_CACHE_PATH;
    if (fs.existsSync(indexCachePath)) {
      fs.rmSync(indexCachePath);
    }
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    sourceMapGenerator.isNewSourceMap = false;
    const rootPath = this.rollup.share.projectConfig.projectRootPath + '/cache/';
    const sourceMapEdit = JSON.parse(fs.readFileSync(rootPath + 'source_map_edit.json').toString());
    const sourceMapExpect = JSON.parse(fs.readFileSync(rootPath + 'source_map_expect.json').toString());
    sourceMapGenerator.cacheSourceMapPath = rootPath + 'source_map_cache.json';
    sourceMapGenerator.sourceMaps = sourceMapEdit;
    const sourceMapResult = sourceMapGenerator.updateCachedSourceMaps();
    expect(Object.keys(sourceMapResult).length == Object.keys(sourceMapExpect).length).to.be.true;
    Object.keys(sourceMapResult).forEach(key => {
      expect(sourceMapExpect).to.include.keys(key);
    });
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('6-2: test updateCachedSourceMaps under build release: arkProjectConfig.processTs is true', function () {
    this.rollup.build(RELEASE);
    this.rollup.share.arkProjectConfig.processTs = true;
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, INDEX_ETS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    const indexCachePath = this.rollup.share.projectConfig.projectRootPath + '/' + INDEX_JS_CACHE_PATH;
    if (fs.existsSync(indexCachePath)) {
      fs.rmSync(indexCachePath);
    }
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    sourceMapGenerator.isNewSourceMap = false;
    const rootPath = this.rollup.share.projectConfig.projectRootPath + '/cache/';
    const sourceMapEdit = JSON.parse(fs.readFileSync(rootPath + 'source_map_edit.json').toString());
    const sourceMapExpect = JSON.parse(fs.readFileSync(rootPath + 'source_map_expect.json').toString());
    sourceMapGenerator.cacheSourceMapPath = rootPath + 'source_map_cache.json';
    sourceMapGenerator.sourceMaps = sourceMapEdit;
    const sourceMapResult = sourceMapGenerator.updateCachedSourceMaps();
    expect(Object.keys(sourceMapResult).length == Object.keys(sourceMapExpect).length).to.be.true;
    Object.keys(sourceMapResult).forEach(key => {
      expect(sourceMapExpect).to.include.keys(key);
    });
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('6-3: test updateCachedSourceMaps under preview: arkProjectConfig.processTs is true', function () {
    this.rollup.preview();
    this.rollup.share.arkProjectConfig.processTs = true;
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, INDEX_ETS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    const indexCachePath = this.rollup.share.projectConfig.projectRootPath + '/' + INDEX_JS_CACHE_PATH;
    if (fs.existsSync(indexCachePath)) {
      fs.rmSync(indexCachePath);
    }
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    sourceMapGenerator.isNewSourceMap = false;
    const rootPath = this.rollup.share.projectConfig.projectRootPath + '/cache/';
    const sourceMapEdit = JSON.parse(fs.readFileSync(rootPath + 'source_map_edit.json').toString());
    const sourceMapExpect = JSON.parse(fs.readFileSync(rootPath + 'source_map_expect_preview.json').toString());
    sourceMapGenerator.cacheSourceMapPath = rootPath + 'source_map_cache_preview.json';
    sourceMapGenerator.sourceMaps = sourceMapEdit;
    const sourceMapResult = sourceMapGenerator.updateCachedSourceMaps();
    expect(Object.keys(sourceMapResult).length == Object.keys(sourceMapExpect).length).to.be.true;
    Object.keys(sourceMapResult).forEach(key => {
      expect(sourceMapExpect).to.include.keys(key);
    });
    SourceMapGenerator.cleanSourceMapObject();
  });

  mocha.it('6-4: test updateCachedSourceMaps under hotReload: arkProjectConfig.processTs is true', function () {
    this.rollup.hotReload();
    this.rollup.share.arkProjectConfig.processTs = true;
    let moduleId = path.join(this.rollup.share.projectConfig.modulePath, INDEX_ETS_PATH_DEFAULT);
    compilingEtsOrTsFiles.push(moduleId);
    hasTsNoCheckOrTsIgnoreFiles.push(moduleId);
    const indexCachePath = this.rollup.share.projectConfig.projectRootPath + '/' + INDEX_JS_CACHE_PATH;
    if (fs.existsSync(indexCachePath)) {
      fs.rmSync(indexCachePath);
    }
    const sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.initInstance(this.rollup);
    sourceMapGenerator.isNewSourceMap = false;
    const rootPath = this.rollup.share.projectConfig.projectRootPath + '/cache/';
    const sourceMapEdit = JSON.parse(fs.readFileSync(rootPath + 'source_map_edit.json').toString());
    const sourceMapExpect = JSON.parse(fs.readFileSync(rootPath + 'source_map_expect.json').toString());
    sourceMapGenerator.cacheSourceMapPath = rootPath + 'source_map_cache.json';
    sourceMapGenerator.sourceMaps = sourceMapEdit;
    const sourceMapResult = sourceMapGenerator.updateCachedSourceMaps();
    expect(Object.keys(sourceMapResult).length == Object.keys(sourceMapExpect).length).to.be.true;
    Object.keys(sourceMapResult).forEach(key => {
      expect(sourceMapExpect).to.include.keys(key);
    });
    SourceMapGenerator.cleanSourceMapObject();
  });

  const legacyApiTests = new Set(this.tests);
  mocha.beforeEach(function() {
    const currentTest = this.currentTest.retriedTest() || this.currentTest;
    if (!legacyApiTests.has(currentTest)) {
      setUp();
    }
  });
  mocha.afterEach(function() {
    const currentTest = this.currentTest.retriedTest() || this.currentTest;
    if (!legacyApiTests.has(currentTest)) {
      tearDown();
    }
  });

  mocha.it('7-1: test cached maps after an entry version change in batch mode', () => {
    projectConfig.singleFileEmit = false;
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    const changed = buildSourceMaps();
    expect(changed.invalid).to.be.false;
    expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(changed.maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    Object.values(changed.maps).forEach(map => expect(map.names).to.deep.equal(['cached']));
    const unchanged = buildSourceMaps();
    expect(unchanged.invalid).to.be.false;
    expect(unchanged.maps).to.deep.equal(changed.maps);
  });

  mocha.it('7-2: test cached maps after an entry version change in single-file mode', () => {
    projectConfig.singleFileEmit = true;
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    const changed = buildSourceMaps();
    expect(changed.invalid).to.be.false;
    expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(changed.maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    Object.values(changed.maps).forEach(map => expect(map.names).to.deep.equal(['cached']));
    const unchanged = buildSourceMaps();
    expect(unchanged.invalid).to.be.false;
    expect(unchanged.maps).to.deep.equal(changed.maps);
  });

  mocha.it('7-3: test entry version and source changes use fresh mappings and keys', async() => {
    const entryId = modules[0].id;
    fs.writeFileSync(entryId, ORIGINAL_SOURCE);
    const original = transpileSourceMap(ORIGINAL_SOURCE, entryId);
    const oldKey = entryKey();
    const cached = buildSourceMaps(modules.map(module => module.id), 'cached', {
      [entryId]: original.map
    }).maps;
    projectConfig.entryModuleVersion = '1.0.1';
    fs.writeFileSync(entryId, UPDATED_SOURCE);
    const emitted = transpileSourceMap(UPDATED_SOURCE, entryId);
    const changed = buildSourceMaps([entryId], 'modified', {
      [entryId]: emitted.map
    });
    expect(changed.invalid).to.be.false;
    expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(changed.maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    expect(changed.maps).not.to.have.property(oldKey);
    expect(changed.maps[entryKey()]).to.deep.equal({
      ...emitted.map,
      'entry-package-info': 'entry|1.0.1'
    });
    expect(changed.maps[entryKey()].mappings).not.to.equal(original.map.mappings);
    expect(changed.maps[entryKey()].sourcesContent).to.deep.equal([UPDATED_SOURCE]);
    Object.entries(cached).filter(([key]) => key !== oldKey).forEach(([key, map]) => {
      expect(changed.maps[key]).to.deep.equal({
        ...map,
        'entry-package-info': 'entry|1.0.1'
      });
    });
    const unchanged = buildSourceMaps();
    expect(unchanged.invalid).to.be.false;
    expect(unchanged.maps).to.deep.equal(changed.maps);
    await expectOriginalPosition(changed.maps[entryKey()], emitted.code, UPDATED_SOURCE);
  });

  mocha.it('7-4: test release JSONL cache with entry and HAR source changes', () => {
    projectConfig.buildMode = RELEASE;
    projectConfig.singleFileEmit = false;
    const changedModules = modules.slice(0, 2);
    const originalPayloads = Object.fromEntries(changedModules.map(module => {
      fs.writeFileSync(module.id, ORIGINAL_SOURCE);
      return [module.id, transpileSourceMap(ORIGINAL_SOURCE, module.id).map];
    }));
    const oldKey = entryKey();
    const cached = buildSourceMaps(modules.map(module => module.id), 'cached', originalPayloads).maps;
    const lines = Object.entries(cached).map(([key, val]) => JSON.stringify({ key, val }));
    fs.writeFileSync(cacheFile(), lines.join('\n'));
    projectConfig.entryModuleVersion = '1.0.1';
    const payloads = Object.fromEntries(changedModules.map(module => {
      fs.writeFileSync(module.id, UPDATED_SOURCE);
      return [module.id, transpileSourceMap(UPDATED_SOURCE, module.id).map];
    }));
    const changed = buildSourceMaps(changedModules.map(module => module.id), 'modified', payloads);
    expect(changed.invalid).to.be.false;
    expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(changed.maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    expect(changed.maps).not.to.have.property(oldKey);
    [entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts'].forEach((key, index) => {
      const id = changedModules[index].id;
      expect(changed.maps[key]).to.deep.equal({
        ...payloads[id],
        'entry-package-info': 'entry|1.0.1',
        ...(index === 1 ? {
          'package-info': 'har1|2.0.0'
        } : {})
      });
      expect(changed.maps[key].mappings).not.to.equal(originalPayloads[id].mappings);
      expect(changed.maps[key].sourcesContent).to.deep.equal([UPDATED_SOURCE]);
    });
    const untouchedHar = 'entry|har2|2.0.0|src/main/ets/Index.ts';
    expect(changed.maps[untouchedHar]).to.deep.equal({
      ...cached[untouchedHar],
      'entry-package-info': 'entry|1.0.1'
    });
    expect(fs.existsSync(path.join(projectConfig.aceModuleBuild, SOURCEMAPS))).to.be.false;
  });

  mocha.it('7-5: test fresh HAR maps preserve the complete cached entry payload', () => {
    const cached = seedDetailedSourceMaps();
    const cachedEntry = cached[entryKey()];
    projectConfig.entryModuleVersion = '1.0.1';
    const changed = buildSourceMaps(modules.slice(1).map(module => module.id), 'fresh-har');
    expect(changed.invalid).to.be.false;
    expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(changed.maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    expect(changed.maps[entryKey()]).to.deep.equal({
      ...cachedEntry,
      'entry-package-info': 'entry|1.0.1'
    });
    const harMaps = Object.values(changed.maps).filter(map => map['package-info']);
    expect(harMaps).to.have.lengthOf(2);
    harMaps.forEach(map => expect(map.names).to.deep.equal(['fresh-har']));
  });

  mocha.it('7-6: test cached payloads across upgrades, rollback and unchanged versions', () => {
    const cached = seedDetailedSourceMaps();
    const cachedEntry = cached[entryKey()];
    const cachedHars = Object.entries(cached).filter(([key]) => key !== entryKey());
    ['1.0.1', '2.0.0', '1.0.0', '1.0.0', '0.9.0'].forEach(version => {
      projectConfig.entryModuleVersion = version;
      const changed = buildSourceMaps();
      expect(changed.invalid).to.be.false;
      expect(Object.keys(changed.maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
      Object.values(changed.maps).forEach(map => {
        expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
      });
      expect(changed.maps[entryKey()]).to.deep.equal({
        ...cachedEntry,
        'entry-package-info': `entry|${version}`
      });
      cachedHars.forEach(([key, map]) => {
        expect(changed.maps[key]).to.deep.equal({
          ...map,
          'entry-package-info': `entry|${version}`
        });
      });
    });
  });

  mocha.it('7-7: test changed HAR versions reject stale cached maps', () => {
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    modules[1].meta.dependencyPkgInfo.pkgVersion = '3.0.0';
    const maps = buildSourceMaps().maps;
    expect(Object.keys(maps)).to.have.members([entryKey(), 'entry|har2|2.0.0|src/main/ets/Index.ts']);
    Object.values(maps).forEach(map => expect(map['entry-package-info']).to.equal('entry|1.0.1'));
  });

  mocha.it('7-8: test changed HAR versions accept fresh maps', () => {
    seedSourceMaps();
    modules[1].meta.dependencyPkgInfo.pkgVersion = '3.0.0';
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps([modules[1].id]).maps;
    const key = 'entry|har1|3.0.0|src/main/ets/Index.ts';
    expect(Object.keys(maps)).to.have.members([entryKey(), key, 'entry|har2|2.0.0|src/main/ets/Index.ts']);
    expect(maps[key]['package-info']).to.equal('har1|3.0.0');
    expect(maps[key].names).to.deep.equal(['modified']);
  });

  mocha.it('7-9: test same-named HAR retains its own package version', () => {
    modules[1].meta.dependencyPkgInfo.pkgName = 'entry';
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps().maps;
    const dependencyKey = 'entry|entry|2.0.0|src/main/ets/Index.ts';
    expect(Object.keys(maps)).to.have.members([entryKey(), dependencyKey, 'entry|har2|2.0.0|src/main/ets/Index.ts']);
    expect(maps[dependencyKey]['package-info']).to.equal('entry|2.0.0');
    expect(maps[dependencyKey].sources).to.deep.equal([modules[1].id]);
    Object.values(maps).forEach(map => expect(map['entry-package-info']).to.equal('entry|1.0.1'));
  });

  mocha.it('7-10: test fresh maps win and deleted graph files stay excluded', () => {
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    const removed = modules.pop();
    const maps = buildSourceMaps([modules[0].id]).maps;
    expect(maps[entryKey()].names).to.deep.equal(['modified']);
    expect(maps[entryKey()]['entry-package-info']).to.equal('entry|1.0.1');
    expect(Object.keys(maps)).to.have.lengthOf(2);
    Object.values(maps).forEach(map => expect(map.sources).not.to.include(removed.id));
  });

  mocha.it('7-11: test ambiguous cached versions are excluded and fresh maps take precedence', () => {
    const cached = seedSourceMaps();
    const originalEntry = cached[entryKey()];
    for (const version of ['2.0.0', '3.0.0']) {
      cached[`entry|entry|${version}|src/main/ets/Index.ts`] = {
        ...originalEntry, 'entry-package-info': `entry|${version}`
      };
    }
    fs.writeFileSync(cacheFile(), JSON.stringify(cached));
    projectConfig.entryModuleVersion = '4.0.0';
    const maps = buildSourceMaps().maps;
    expect(Object.keys(maps)).to.have.members([
      'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts'
    ]);
    fs.writeFileSync(cacheFile(), JSON.stringify(cached));
    const fresh = buildSourceMaps([modules[0].id]).maps;
    expect(Object.keys(fresh)).to.have.members([
      entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts'
    ]);
    expect(fresh[entryKey()].names).to.deep.equal(['modified']);
    expect(fresh[entryKey()]['entry-package-info']).to.equal('entry|4.0.0');
  });

  mocha.it('7-12: test legacy metadata and noncanonical keys retain existing filtering', () => {
    const cached = seedSourceMaps();
    cached[entryKey()] = {
      version: 3, sources: [modules[0].id], names: ['cached'], mappings: 'AAAA'
    };
    cached['entry/src/main/ets/Legacy.ts'] = {
      ...cached[entryKey()],
      'entry-package-info': 'entry|1.0.0'
    };
    fs.writeFileSync(path.join(projectConfig.cachePath, SOURCEMAPS_JSON), JSON.stringify(cached));
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps().maps;
    expect(Object.keys(maps)).to.have.members(['entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts']);
  });

  mocha.it('7-13: test invalid package metadata is not migrated', () => {
    const cached = seedSourceMaps();
    const oldKey = entryKey();
    projectConfig.entryModuleVersion = '1.0.1';
    for (const entryInfo of [123, 'entry|1.0.0|unexpected', 'entry|9.0.0']) {
      const invalid = { ...cached, [oldKey]: { ...cached[oldKey], 'entry-package-info': entryInfo } };
      fs.writeFileSync(cacheFile(), JSON.stringify(invalid));
      const maps = buildSourceMaps().maps;
      expect(Object.keys(maps), String(entryInfo)).to.have.members([
        'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts'
      ]);
    }
    const harKey = 'entry|har1|2.0.0|src/main/ets/Index.ts';
    const invalidHar = { ...cached[harKey], 'package-info': 'foreign|5.0.0' };
    fs.writeFileSync(cacheFile(), JSON.stringify({ ...cached, [harKey]: invalidHar }));
    expect(buildSourceMaps().maps[harKey]).to.deep.equal(invalidHar);
  });

  mocha.it('7-14: test entry package renames do not migrate another namespace', () => {
    seedSourceMaps();
    projectConfig.entryPackageName = 'renamed-entry';
    projectConfig.entryModuleVersion = '1.0.1';
    expect(buildSourceMaps().maps).to.deep.equal({});
  });

  mocha.it('7-15: test JSONL blank lines and duplicate raw keys preserve the first map', () => {
    const cached = seedDetailedSourceMaps();
    const cachedEntry = cached[entryKey()];
    const duplicateKey = 'entry|har1|2.0.0|src/main/ets/Index.ts';
    const lines = Object.entries(cached).map(([key, val]) => JSON.stringify({
      key,
      val
    }));
    lines.push(JSON.stringify({
      key: duplicateKey,
      val: {
        ...cached[duplicateKey],
        'entry-package-info': 'entry|0.5.0',
        names: ['duplicate'],
        mappings: 'AAAA;AACA',
        sources: ['duplicate-source.ets'],
        sourcesContent: ['export const duplicate = 2;']
      }
    }));
    fs.writeFileSync(path.join(projectConfig.cachePath, SOURCEMAPS_JSON), ` \r\n${lines.join('\r\n\r\n')}\r\n\r\n`);
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps().maps;
    expect(Object.keys(maps)).to.have.members([entryKey(), `entry|har1|2.0.0|src/main/ets/Index.ts`, `entry|har2|2.0.0|src/main/ets/Index.ts`]);
    Object.values(maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    expect(maps[entryKey()]).to.deep.equal({
      ...cachedEntry,
      'entry-package-info': 'entry|1.0.1'
    });
    expect(maps[duplicateKey]).to.deep.equal({
      ...cached[duplicateKey],
      'entry-package-info': 'entry|1.0.1'
    });
  });

  mocha.it('7-16: test one JSONL record without a final newline is restored', () => {
    const cached = seedDetailedSourceMaps();
    const map = cached[entryKey()];
    modules = modules.slice(0, 1);
    fs.writeFileSync(cacheFile(), JSON.stringify({ key: entryKey(), val: map }));
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps().maps;
    expect(Object.keys(maps)).to.deep.equal([entryKey()]);
    expect(maps[entryKey()]).to.deep.equal({
      ...map,
      'entry-package-info': 'entry|1.0.1'
    });
  });

  mocha.it('7-17: test missing cache writes only newly generated maps', () => {
    seedSourceMaps();
    fs.unlinkSync(cacheFile());
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps([modules[0].id]).maps;
    expect(Object.keys(maps)).to.deep.equal([entryKey()]);
    expect(maps[entryKey()].names).to.deep.equal(['modified']);
    expect(maps[entryKey()]['entry-package-info']).to.equal('entry|1.0.1');
  });

  mocha.it('7-18: test empty cache and empty JSON collection accept newly generated maps', () => {
    seedSourceMaps();
    projectConfig.entryModuleVersion = '1.0.1';
    for (const content of ['', '{}']) {
      fs.writeFileSync(cacheFile(), content);
      const maps = buildSourceMaps([modules[0].id]).maps;
      expect(Object.keys(maps), JSON.stringify(content)).to.deep.equal([entryKey()]);
      expect(maps[entryKey()].names).to.deep.equal(['modified']);
    }
  });

  mocha.it('7-19: test malformed JSONL preserves the existing output and cache files', () => {
    const cached = seedSourceMaps();
    const content = JSON.stringify({
      key: entryKey(),
      val: cached[entryKey()]
    }) + '\n{"key":';
    fs.writeFileSync(cacheFile(), content);
    const originalMap = fs.readFileSync(sourceMapFile(), 'utf-8');
    projectConfig.entryModuleVersion = '1.0.1';
    expect(() => buildSourceMaps()).to.throw();
    expect(fs.readFileSync(sourceMapFile(), 'utf-8')).to.equal(originalMap);
    expect(fs.readFileSync(cacheFile(), 'utf-8')).to.equal(content);
  });

  mocha.it('7-20: test externally supplied bytecode HAR maps retain their original identity', () => {
    const key = 'entry|entry|4.0.0|src/main/ets/Index.ts';
    const externalMap = {
      version: 3,
      sources: ['External.ets'],
      names: [],
      mappings: '',
      'entry-package-info': 'entry|4.0.0'
    };
    const sourceMapsPath = path.join(temporaryPath, 'bytecode-har-map.json');
    fs.writeFileSync(sourceMapsPath, JSON.stringify({
      [key]: externalMap
    }));
    projectConfig.byteCodeHarInfo = {
      external: {
        sourceMapsPath
      }
    };
    expect(seedSourceMaps()[key]).to.deep.equal(externalMap);
    projectConfig.entryModuleVersion = '1.0.1';
    const maps = buildSourceMaps().maps;
    expect(maps[key]).to.deep.equal(externalMap);
    const ownMaps = Object.fromEntries(Object.entries(maps).filter(([mapKey]) => mapKey !== key));
    expect(Object.keys(ownMaps)).to.have.members([entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts']);
    Object.values(ownMaps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
  });

  mocha.it('7-21: test cache migration does not mutate frozen payloads', () => {
    const cached = seedDetailedSourceMaps();
    const snapshot = JSON.parse(JSON.stringify(cached));
    Object.values(cached).forEach(map => {
      Object.values(map).filter(value => value !== null && typeof value === 'object').forEach(value => Object.freeze(value));
      Object.freeze(map);
    });
    Object.freeze(cached);
    projectConfig.entryModuleVersion = '1.0.1';
    SourceMapGenerator.init(rollup);
    const generator = SourceMapGenerator.getInstance();
    // Supply frozen records at the parser/merge boundary and verify the real final file writer.
    generator.mergeCachedSourceMaps(Object.entries(cached));
    generator.checkAndWriteEnd();
    const maps = JSON.parse(fs.readFileSync(sourceMapFile(), 'utf-8'));
    expect(Object.keys(maps)).to.have.members([entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts']);
    Object.values(maps).forEach(map => {
      expect(map['entry-package-info']).to.equal(`entry|${projectConfig.entryModuleVersion}`);
    });
    expect(JSON.parse(fs.readFileSync(cacheFile(), 'utf-8'))).to.deep.equal(JSON.parse(fs.readFileSync(sourceMapFile(), 'utf-8')));
    expect(cached).to.deep.equal(snapshot);
  });

  mocha.it('7-22: test bytecode backup takes priority and empty backup falls back to cache', () => {
    const cached = seedSourceMaps();
    const backupPath = path.join(temporaryPath, 'backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(cached));
    const ordinary = JSON.parse(JSON.stringify(cached));
    Object.values(ordinary).forEach(map => {
      map.names = ['ordinary-cache'];
    });
    fs.writeFileSync(cacheFile(), JSON.stringify(ordinary));
    BytecodeObfuscator.enable = true;
    sandbox.stub(BytecodeObfuscator, 'getInstance').returns({ getBackupSourceMapPath: () => backupPath });
    projectConfig.entryModuleVersion = '1.0.1';
    const preferred = buildSourceMaps().maps;
    expect(Object.keys(preferred)).to.have.members([
      entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts'
    ]);
    Object.values(preferred).forEach(map => expect(map.names).to.deep.equal(['cached']));
    fs.writeFileSync(backupPath, '');
    fs.writeFileSync(cacheFile(), JSON.stringify(ordinary));
    projectConfig.entryModuleVersion = '1.0.2';
    const fallback = buildSourceMaps().maps;
    expect(Object.keys(fallback)).to.have.members([
      entryKey(), 'entry|har1|2.0.0|src/main/ets/Index.ts', 'entry|har2|2.0.0|src/main/ets/Index.ts'
    ]);
    Object.values(fallback).forEach(map => expect(map.names).to.deep.equal(['ordinary-cache']));
    Object.values(fallback).forEach(map => expect(map['entry-package-info']).to.equal('entry|1.0.2'));
  });
});
