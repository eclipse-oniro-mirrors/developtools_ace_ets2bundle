/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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

import * as fs from 'fs';
import * as path from 'path';
import cluster from 'cluster';
import process from 'process';
import os from 'os';
import events from 'events';
import Compiler from 'webpack/lib/Compiler';
import { logger } from './compile_info';
import {
  toUnixPath,
  toHashData,
  genTemporaryPath,
  genBuildPath,
  genAbcFileName,
  mkdirsSync,
  genSourceMapFileName,
  checkNodeModulesFile,
  compareNodeVersion,
  removeDir,
  newSourceMaps
} from './utils';
import { projectConfig } from '../main';
import {
  ESMODULE,
  JSBUNDLE,
  NODE_MODULES,
  ENTRY_TXT,
  ES2ABC,
  EXTNAME_ETS,
  EXTNAME_JS,
  EXTNAME_TS,
  EXTNAME_MJS,
  EXTNAME_CJS,
  EXTNAME_D_TS,
  EXTNAME_JS_MAP,
  FAIL,
  MODULELIST_JSON,
  MODULES_ABC,
  SUCCESS,
  SOURCEMAPS_JSON,
  SOURCEMAPS,
  TEMPORARY,
  TS2ABC
} from './pre_define';
import { getOhmUrlByFilepath } from './resolve_ohm_url';
import { generateMergedAbc } from './gen_merged_abc';

const genAbcScript: string = 'gen_abc.js';
const genModuleAbcScript: string = 'gen_module_abc.js';
let output: string;
let isWin: boolean = false;
let isMac: boolean = false;
let isDebug: boolean = false;
let arkDir: string;
let nodeJs: string;

let previewCount: number = 0;
let compileCount: number = 0;
interface File {
  path: string,
  size: number,
  cacheOutputPath: string
}
let intermediateJsBundle: Array<File> = [];
let fileterIntermediateJsBundle: Array<File> = [];
let moduleInfos: Array<ModuleInfo> = [];
let filterModuleInfos: Array<ModuleInfo> = [];
let commonJsModuleInfos: Array<ModuleInfo> = [];
let ESMModuleInfos: Array<ModuleInfo> = [];
let entryInfos: Map<string, EntryInfo> = new Map<string, EntryInfo>();
let hashJsonObject = {};
let moduleHashJsonObject = {};
let buildPathInfo: string = '';
let buildMapFileList: Set<string> = new Set<string>();
let isHotReloadFirstBuild: boolean = true;

const red: string = '\u001b[31m';
const reset: string = '\u001b[39m';
const blue = '\u001b[34m';
const hashFile: string = 'gen_hash.json';
const ARK: string = '/ark/';

export class ModuleInfo {
  filePath: string;
  tempFilePath: string;
  buildFilePath: string;
  abcFilePath: string;
  isCommonJs: boolean;
  recordName: string;

  constructor(filePath: string, tempFilePath: string, buildFilePath: string, abcFilePath: string, isCommonJs: boolean) {
    this.filePath = filePath;
    this.tempFilePath = tempFilePath;
    this.buildFilePath = buildFilePath;
    this.abcFilePath = abcFilePath;
    this.isCommonJs = isCommonJs;
    this.recordName = getOhmUrlByFilepath(filePath);
  }
}

export class EntryInfo {
  npmInfo: string;
  abcFileName: string;
  buildPath: string;
  entry: string;

  constructor(npmInfo: string, abcFileName: string, buildPath: string, entry: string) {
    this.npmInfo = npmInfo;
    this.abcFileName = abcFileName;
    this.buildPath = buildPath;
    this.entry = entry;
  }
}

export class GenAbcPlugin {
  constructor(output_, arkDir_, nodeJs_, isDebug_) {
    output = output_;
    arkDir = arkDir_;
    nodeJs = nodeJs_;
    isDebug = isDebug_;
  }
  apply(compiler: Compiler) {
    if (fs.existsSync(path.resolve(arkDir, 'build-win'))) {
      isWin = true;
    } else {
      if (fs.existsSync(path.resolve(arkDir, 'build-mac'))) {
        isMac = true;
      } else {
        if (!fs.existsSync(path.resolve(arkDir, 'build'))) {
          logger.error(red, 'ETS:ERROR find build fail', reset);
          process.exitCode = FAIL;
          return;
        }
      }
    }

    if (!checkNodeModules()) {
      process.exitCode = FAIL;
      return;
    }

    // case ESMODULE
    //        | --- es2abc -- debug -- not removeDir
    //        | --- es2abc -- release -- removeDir
    //        | --- ts2abc -- removeDir
    if (projectConfig.compileMode === ESMODULE) {
      if ((projectConfig.buildArkMode !== 'debug' && process.env.panda !== TS2ABC) || process.env.panda === TS2ABC) {
        removeDir(output);
        removeDir(projectConfig.nodeModulesPath);
      }
    }

    // for preview mode max listeners
    events.EventEmitter.defaultMaxListeners = 100;

    compiler.hooks.compilation.tap('GenAbcPlugin', (compilation) => {
      if (projectConfig.compileMode === JSBUNDLE || projectConfig.compileMode === undefined) {
        return;
      }
      buildPathInfo = output;
      previewCount++;
      compilation.hooks.finishModules.tap('finishModules', handleFinishModules.bind(this));
    });

    compiler.hooks.compilation.tap('GenAbcPlugin', (compilation) => {
      compilation.hooks.processAssets.tap('processAssets', (assets) => {
        if (projectConfig.compileMode === JSBUNDLE || projectConfig.compileMode === undefined) {
          return;
        }
        Object.keys(compilation.assets).forEach(key => {
          if (path.extname(key) === EXTNAME_JS || path.extname(key) === EXTNAME_JS_MAP) {
            delete assets[key];
          }
        });
      });
    });

    compiler.hooks.emit.tap('GenAbcPlugin', (compilation) => {
      if (projectConfig.compileMode === ESMODULE) {
        return;
      }
      Object.keys(compilation.assets).forEach(key => {
        // choose *.js
        if (output && path.extname(key) === EXTNAME_JS) {
          const newContent: string = compilation.assets[key].source();
          const keyPath: string = key.replace(/\.js$/, ".temp.js");
          writeFileSync(newContent, output, keyPath, key);
        }
      });
    });

    compiler.hooks.afterEmit.tap('GenAbcPluginMultiThread', () => {
      if (projectConfig.compileMode === ESMODULE) {
        return;
      }
      if (intermediateJsBundle.length === 0) {
        return;
      }
      buildPathInfo = output;
      previewCount++;
      invokeWorkersToGenAbc();
    });
  }
}

function clearGlobalInfo() {
  // fix bug of multi trigger
  if (process.env.watchMode !== 'true') {
    intermediateJsBundle = [];
    moduleInfos = [];
    entryInfos = new Map<string, EntryInfo>();
  }
  fileterIntermediateJsBundle = [];
  filterModuleInfos = [];
  commonJsModuleInfos = [];
  ESMModuleInfos = [];
  hashJsonObject = {};
  moduleHashJsonObject = {};
  buildMapFileList = new Set<string>();
}

function getEntryInfo(tempFilePath: string, resourceResolveData: any): void {
  if (!resourceResolveData.descriptionFilePath) {
    return;
  }
  const packageName: string = resourceResolveData.descriptionFileData['name'];
  const packageJsonPath: string = resourceResolveData.descriptionFilePath;
  let npmInfoPath: string = path.resolve(packageJsonPath, '..');
  const fakeEntryPath: string = path.resolve(npmInfoPath, 'fake.js');
  const tempFakeEntryPath: string = genTemporaryPath(fakeEntryPath, projectConfig.projectPath, process.env.cachePath);
  const buildFakeEntryPath: string = genBuildPath(fakeEntryPath, projectConfig.projectPath, projectConfig.buildPath);
  npmInfoPath = toUnixPath(path.resolve(tempFakeEntryPath, '..'));
  const buildNpmInfoPath: string = toUnixPath(path.resolve(buildFakeEntryPath, '..'));
  if (entryInfos.has(npmInfoPath)) {
    return;
  }

  let abcFileName: string = genAbcFileName(tempFilePath);
  const abcFilePaths: string[] = abcFileName.split(NODE_MODULES);
  abcFileName = [NODE_MODULES, abcFilePaths[abcFilePaths.length - 1]].join(path.sep);
  abcFileName = toUnixPath(abcFileName);

  const packagePaths: string[] = tempFilePath.split(NODE_MODULES);
  const entryPaths: string[] = packagePaths[packagePaths.length - 1].split(packageName);
  let entry: string = toUnixPath(entryPaths[entryPaths.length - 1]);
  if (entry.startsWith('/')) {
    entry = entry.slice(1, entry.length);
  }
  const entryInfo: EntryInfo = new EntryInfo(npmInfoPath, abcFileName, buildNpmInfoPath, entry);
  entryInfos.set(npmInfoPath, entryInfo);
}

function processNodeModulesFile(filePath: string, tempFilePath: string, buildFilePath: string, abcFilePath: string, nodeModulesFile: Array<string>, module: any): void {
  getEntryInfo(tempFilePath, module.resourceResolveData);
  const descriptionFileData: any = module.resourceResolveData.descriptionFileData;
  if (descriptionFileData && descriptionFileData['type'] && descriptionFileData['type'] === 'module') {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, false);
    moduleInfos.push(tempModuleInfo);
    nodeModulesFile.push(tempFilePath);
  } else if (filePath.endsWith(EXTNAME_MJS)) {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, false);
    moduleInfos.push(tempModuleInfo);
    nodeModulesFile.push(tempFilePath);
  } else {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, true);
    moduleInfos.push(tempModuleInfo);
    nodeModulesFile.push(tempFilePath);
  }
  buildMapFileList.add(toUnixPath(filePath.replace(projectConfig.projectRootPath, '')));
}

function processEtsModule(filePath: string, tempFilePath: string, buildFilePath: string, nodeModulesFile: Array<string>, module: any): void {
  if (projectConfig.processTs === true) {
    tempFilePath = tempFilePath.replace(/\.ets$/, EXTNAME_TS);
    buildFilePath = buildFilePath.replace(/\.ets$/, EXTNAME_TS);
  } else {
    tempFilePath = tempFilePath.replace(/\.ets$/, EXTNAME_JS);
    buildFilePath = buildFilePath.replace(/\.ets$/, EXTNAME_JS);
  }
  const abcFilePath: string = genAbcFileName(tempFilePath);
  if (checkNodeModulesFile(filePath, projectConfig.projectPath)) {
    processNodeModulesFile(filePath, tempFilePath, buildFilePath, abcFilePath, nodeModulesFile, module);
  } else {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, false);
    moduleInfos.push(tempModuleInfo);
  }
  buildMapFileList.add(toUnixPath(filePath.replace(projectConfig.projectRootPath, '')));
}

function processDtsModule(filePath: string, tempFilePath: string, buildFilePath: string, nodeModulesFile: Array<string>, module: any): void {
  return;
}

function processTsModule(filePath: string, tempFilePath: string, buildFilePath: string, nodeModulesFile: Array<string>, module: any): void {
  if (projectConfig.processTs === false) {
    tempFilePath = tempFilePath.replace(/\.ts$/, EXTNAME_JS);
    buildFilePath = buildFilePath.replace(/\.ts$/, EXTNAME_JS);
  }
  const abcFilePath: string = genAbcFileName(tempFilePath);
  if (checkNodeModulesFile(filePath, projectConfig.projectPath)) {
    processNodeModulesFile(filePath, tempFilePath, buildFilePath, abcFilePath, nodeModulesFile, module);
  } else {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, false);
    moduleInfos.push(tempModuleInfo);
  }
  buildMapFileList.add(toUnixPath(filePath.replace(projectConfig.projectRootPath, '')));
}

function processJsModule(filePath: string, tempFilePath: string, buildFilePath: string, nodeModulesFile: Array<string>, module: any): void {
  const parent: string = path.join(tempFilePath, '..');
  if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
    mkDir(parent);
  }
  if (filePath.endsWith(EXTNAME_MJS) || filePath.endsWith(EXTNAME_CJS)) {
    fs.copyFileSync(filePath, tempFilePath);
  }
  const abcFilePath: string = genAbcFileName(tempFilePath);
  if (checkNodeModulesFile(filePath, projectConfig.projectPath)) {
    processNodeModulesFile(filePath, tempFilePath, buildFilePath, abcFilePath, nodeModulesFile, module);
  } else {
    const tempModuleInfo: ModuleInfo = new ModuleInfo(filePath, tempFilePath, buildFilePath, abcFilePath, false);
    moduleInfos.push(tempModuleInfo);
  }
  buildMapFileList.add(toUnixPath(filePath.replace(projectConfig.projectRootPath, '')));
}

var cachedSourceMaps: Object;

function updateCachedSourceMaps(): void {
  const CACHED_SOURCEMAPS: string = path.join(process.env.cachePath, SOURCEMAPS_JSON);
  if (!fs.existsSync(CACHED_SOURCEMAPS)) {
    cachedSourceMaps = {};
  } else {
    cachedSourceMaps = JSON.parse(fs.readFileSync(CACHED_SOURCEMAPS).toString());
  }
  Object.keys(newSourceMaps).forEach(key => {
    cachedSourceMaps[key] = newSourceMaps[key];
  });
}

function getCachedModuleList(): Array<string> {
  const CACHED_MODULELIST_FILE: string = path.join(process.env.cachePath, MODULELIST_JSON);
  if (!fs.existsSync(CACHED_MODULELIST_FILE)) {
    return [];
  }
  const data: any = JSON.parse(fs.readFileSync(CACHED_MODULELIST_FILE).toString());
  const moduleList: Array<string> = data.list;
  return moduleList;
}

function updateCachedModuleList(moduleList: Array<string>): void {
  const CACHED_MODULELIST_FILE: string = path.join(process.env.cachePath, MODULELIST_JSON);
  const CACHED_SOURCEMAPS: string = path.join(process.env.cachePath, SOURCEMAPS_JSON);
  let cachedJson: Object = {};
  cachedJson["list"] = moduleList;
  fs.writeFile(CACHED_MODULELIST_FILE, JSON.stringify(cachedJson, null, 2), 'utf-8',
    (err)=>{
      if (err) {
        logger.error(red, `ETS:ERROR Failed to write module list.`, reset);
      }
    }
  );
  fs.writeFile(CACHED_SOURCEMAPS, JSON.stringify(cachedSourceMaps, null, 2), 'utf-8',
    (err)=>{
      if (err) {
        logger.error(red, `ETS:ERROR Failed to write cache sourceMaps json.`, reset);
      }
    }
  );
}

function writeSourceMaps(): void {
  mkdirsSync(projectConfig.buildPath);
  fs.writeFile(path.join(projectConfig.buildPath, SOURCEMAPS), JSON.stringify(cachedSourceMaps, null, 2), 'utf-8',
    (err)=>{
      if (err) {
        logger.error(red, `ETS:ERROR Failed to write sourceMaps.`, reset);
      }
    }
  );
}

function eliminateUnusedFiles(moduleList: Array<string>): void{
  let cachedModuleList: Array<string> = getCachedModuleList();
  if (cachedModuleList.length !== 0) {
    const eliminateFiles: Array<string> = cachedModuleList.filter(m => !moduleList.includes(m));
    eliminateFiles.forEach((file) => {
      delete cachedSourceMaps[file];
    });
  }
}

function handleFullModuleFiles(modules, callback): any {
  const nodeModulesFile: Array<string> = [];
  modules.forEach(module => {
    if (module !== undefined && module.resourceResolveData !== undefined) {
      const filePath: string = module.resourceResolveData.path;
      let tempFilePath = genTemporaryPath(filePath, projectConfig.projectPath, process.env.cachePath);
      if (tempFilePath.length === 0) {
        return;
      }
      let buildFilePath: string = genBuildPath(filePath, projectConfig.projectPath, projectConfig.buildPath);
      tempFilePath = toUnixPath(tempFilePath);
      buildFilePath = toUnixPath(buildFilePath);
      if (filePath.endsWith(EXTNAME_ETS)) {
        processEtsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
      } else if (filePath.endsWith(EXTNAME_D_TS)) {
        processDtsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
      } else if (filePath.endsWith(EXTNAME_TS)) {
        processTsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
      } else if (filePath.endsWith(EXTNAME_JS) || filePath.endsWith(EXTNAME_MJS) || filePath.endsWith(EXTNAME_CJS)) {
        processJsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
      } else {
        logger.error(red, `ETS:ERROR Cannot find resolve this file path: ${filePath}`, reset);
        process.exitCode = FAIL;
      }
    }
  });

  if (projectConfig.compileMode === ESMODULE && process.env.panda !== TS2ABC) {
    if (projectConfig.buildArkMode === 'debug') {
      const moduleList: Array<string> = Array.from(buildMapFileList);
      updateCachedSourceMaps();
      eliminateUnusedFiles(moduleList);
      updateCachedModuleList(moduleList);
      writeSourceMaps();
    }

    const outputABCPath: string = path.join(projectConfig.buildPath, MODULES_ABC);
    generateMergedAbc(moduleInfos, entryInfos, outputABCPath);
    clearGlobalInfo();
  } else {
    invokeWorkersModuleToGenAbc(moduleInfos);
    processEntryToGenAbc(entryInfos);
  }
}

function processEntryToGenAbc(entryInfos: Map<string, EntryInfo>): void {
  for (const value of entryInfos.values()) {
    const tempAbcFilePath: string = toUnixPath(path.resolve(value.npmInfo, ENTRY_TXT));
    const buildAbcFilePath: string = toUnixPath(path.resolve(value.buildPath, ENTRY_TXT));
    fs.writeFileSync(tempAbcFilePath, value.entry, 'utf-8');
    if (!fs.existsSync(buildAbcFilePath)) {
      const parent: string = path.join(buildAbcFilePath, '..');
      if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
        mkDir(parent);
      }
    }
    fs.copyFileSync(tempAbcFilePath, buildAbcFilePath);
  }
}

function writeFileSync(inputString: string, buildPath: string, keyPath: string, jsBundleFile: string): void {
  let output = path.resolve(buildPath, keyPath);
  let parent: string = path.join(output, '..');
  if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
    mkDir(parent);
  }
  let cacheOutputPath: string = "";
  if (process.env.cachePath) {
    let buildDirArr: string[] = projectConfig.buildPath.split(path.sep);
    let abilityDir: string = buildDirArr[buildDirArr.length - 1];
    cacheOutputPath = path.join(process.env.cachePath, TEMPORARY, abilityDir, keyPath);
  } else {
    cacheOutputPath = output;
  }
  parent = path.join(cacheOutputPath, '..');
  if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
    mkDir(parent);
  }
  fs.writeFileSync(cacheOutputPath, inputString);
  if (fs.existsSync(cacheOutputPath)) {
    const fileSize: any = fs.statSync(cacheOutputPath).size;
    output = toUnixPath(output);
    cacheOutputPath = toUnixPath(cacheOutputPath);
    intermediateJsBundle.push({path: output, size: fileSize, cacheOutputPath: cacheOutputPath});
  } else {
    logger.debug(red, `ETS:ERROR Failed to convert file ${jsBundleFile} to bin. ${output} is lost`, reset);
    process.exitCode = FAIL;
  }
}

function mkDir(path_: string): void {
  const parent: string = path.join(path_, '..');
  if (!(fs.existsSync(parent) && !fs.statSync(parent).isFile())) {
    mkDir(parent);
  }
  fs.mkdirSync(path_);
}

function getSmallestSizeGroup(groupSize: Map<number, number>): any {
  const groupSizeArray: any = Array.from(groupSize);
  groupSizeArray.sort(function(g1, g2) {
    return g1[1] - g2[1]; // sort by size
  });
  return groupSizeArray[0][0];
}

function splitJsBundlesBySize(bundleArray: Array<File>, groupNumber: number): any {
  const result: any = [];
  if (bundleArray.length < groupNumber) {
    for (const value of bundleArray) {
      result.push([value]);
    }
    return result;
  }

  bundleArray.sort(function(f1: File, f2: File) {
    return f2.size - f1.size;
  });
  const groupFileSize: any = new Map();
  for (let i = 0; i < groupNumber; ++i) {
    result.push([]);
    groupFileSize.set(i, 0);
  }

  let index = 0;
  while (index < bundleArray.length) {
    const smallestGroup: any = getSmallestSizeGroup(groupFileSize);
    result[smallestGroup].push(bundleArray[index]);
    const sizeUpdate: any = groupFileSize.get(smallestGroup) + bundleArray[index].size;
    groupFileSize.set(smallestGroup, sizeUpdate);
    index++;
  }
  return result;
}

function invokeWorkersModuleToGenAbc(moduleInfos: Array<ModuleInfo>): void {
  invokeCluterModuleToAbc();
}

export function initAbcEnv() : string[] {
  let args: string[] = [];
  if (process.env.panda === TS2ABC) {
    let js2abc: string = path.join(arkDir, 'build', 'src', 'index.js');
    if (isWin) {
      js2abc = path.join(arkDir, 'build-win', 'src', 'index.js');
    } else if (isMac) {
      js2abc = path.join(arkDir, 'build-mac', 'src', 'index.js');
    }

    js2abc = '"' + js2abc + '"';
    args = [
      '--expose-gc',
      js2abc
    ];
    if (isDebug) {
      args.push('--debug');
    }
  } else if (process.env.panda === ES2ABC  || process.env.panda === 'undefined' || process.env.panda === undefined) {
    let es2abc: string = path.join(arkDir, 'build', 'bin', 'es2abc');
    if (isWin) {
      es2abc = path.join(arkDir, 'build-win', 'bin', 'es2abc.exe');
    } else if (isMac) {
      es2abc = path.join(arkDir, 'build-mac', 'bin', 'es2abc');
    }

    args = [
      '"' + es2abc + '"'
    ];
    if (isDebug) {
      args.push('--debug-info');
    }
    if (projectConfig.compileMode === ESMODULE) {
      args.push('--merge-abc');
    }
  }  else {
    logger.error(red, `ETS:ERROR please set panda module`, reset);
  }

  return args;
}

function invokeCluterModuleToAbc(): void {
  if (process.env.watchMode === 'true') {
    process.exitCode = SUCCESS;
  }
  filterIntermediateModuleByHashJson(buildPathInfo, moduleInfos);
  filterModuleInfos.forEach(moduleInfo => {
    if (moduleInfo.isCommonJs) {
      commonJsModuleInfos.push(moduleInfo);
    } else {
      ESMModuleInfos.push(moduleInfo);
    }
  });
  const abcArgs: string[] = initAbcEnv();

  const clusterNewApiVersion: number = 16;
  const useNewApi: boolean = compareNodeVersion(clusterNewApiVersion);

  if (useNewApi && cluster.isPrimary || !useNewApi && cluster.isMaster) {
    if (useNewApi) {
      cluster.setupPrimary({
        exec: path.resolve(__dirname, genModuleAbcScript)
      });
    } else {
      cluster.setupMaster({
        exec: path.resolve(__dirname, genModuleAbcScript)
      });
    }

    let totalWorkerNumber = 0;
    let commonJsWorkerNumber: number = invokeClusterByModule(abcArgs, commonJsModuleInfos);
    totalWorkerNumber += commonJsWorkerNumber;

    let esmWorkerNumber: number = invokeClusterByModule(abcArgs, ESMModuleInfos, true);
    totalWorkerNumber += esmWorkerNumber;

    let count_ = 0;
    if (process.env.watchMode === 'true') {
      cluster.removeAllListeners("exit");
    }
    cluster.on('exit', (worker, code, signal) => {
      if (code === FAIL || process.exitCode === FAIL) {
        process.exitCode = FAIL;
        return;
      }
      count_++;
      if (count_ === totalWorkerNumber) {
        writeModuleHashJson();
        clearGlobalInfo();
        if (process.env.watchMode === 'true' && compileCount < previewCount) {
          compileCount++;
          console.info(blue, 'COMPILE RESULT:SUCCESS ', reset);
          if (compileCount >= previewCount) {
            return;
          }
          invokeWorkersModuleToGenAbc(moduleInfos);
          processEntryToGenAbc(entryInfos);
        }
      }
      logger.debug(`worker ${worker.process.pid} finished`);
    });
  }
}

function invokeClusterByModule(abcArgs:string[], moduleInfos: Array<ModuleInfo>, isModule: Boolean = false) {
  moduleInfos = Array.from(new Set(moduleInfos));
  let workerNumber: number = 0;
  if (moduleInfos.length > 0) {
    let cmdPrefix: any = "";
    const tempAbcArgs: string[] = abcArgs.slice(0);
    if (process.env.panda === TS2ABC) {
      workerNumber = 3;
      isModule ? tempAbcArgs.push('-m') : tempAbcArgs.push('-c');
      cmdPrefix = `${nodeJs} ${tempAbcArgs.join(' ')}`;
    } else if (process.env.panda === ES2ABC  || process.env.panda === 'undefined' || process.env.panda === undefined) {
      workerNumber = os.cpus().length;
      isModule ? tempAbcArgs.push('--module') : tempAbcArgs.push('--commonjs');
      cmdPrefix = `${tempAbcArgs.join(' ')}`;
    } else {
      logger.error(red, `ETS:ERROR please set panda module`, reset);
    }
    const splitedModules: any[] = splitModulesByNumber(moduleInfos, workerNumber);
    workerNumber = splitedModules.length;
    for (let i = 0; i < workerNumber; i++) {
      const workerData: any = {
        'inputs': JSON.stringify(splitedModules[i]),
        'cmd': cmdPrefix
      };
      cluster.fork(workerData);
    }
  }

  return workerNumber;
}

function splitModulesByNumber(moduleInfos: Array<ModuleInfo>, workerNumber: number): any[] {
  const result: any = [];
  if (moduleInfos.length < workerNumber) {
    for (const value of moduleInfos) {
      result.push([value]);
    }
    return result;
  }

  for (let i = 0; i < workerNumber; ++i) {
    result.push([]);
  }

  for (let i = 0; i < moduleInfos.length; i++) {
    const chunk = i % workerNumber;
    result[chunk].push(moduleInfos[i]);
  }

  return result;
}

function invokeWorkersToGenAbc(): void {
  if (process.env.watchMode === 'true') {
    process.exitCode = SUCCESS;
  }
  let cmdPrefix: string = '';
  let maxWorkerNumber: number = 3;

  const abcArgs: string[] = initAbcEnv();
  if (process.env.panda === TS2ABC) {
    cmdPrefix = `${nodeJs} ${abcArgs.join(' ')}`;
  } else if (process.env.panda === ES2ABC  || process.env.panda === 'undefined' || process.env.panda === undefined) {
    maxWorkerNumber = os.cpus().length;
    cmdPrefix = `${abcArgs.join(' ')}`;
  } else {
    logger.error(red, `ETS:ERROR please set panda module`, reset);
  }

  filterIntermediateJsBundleByHashJson(buildPathInfo, intermediateJsBundle);
  const splitedBundles: any[] = splitJsBundlesBySize(fileterIntermediateJsBundle, maxWorkerNumber);
  const workerNumber: number = maxWorkerNumber < splitedBundles.length ? maxWorkerNumber : splitedBundles.length;

  const clusterNewApiVersion: number = 16;
  const currentNodeVersion: number = parseInt(process.version.split('.')[0]);
  const useNewApi: boolean = currentNodeVersion >= clusterNewApiVersion;

  if (useNewApi && cluster.isPrimary || !useNewApi && cluster.isMaster) {
    if (useNewApi) {
      cluster.setupPrimary({
        exec: path.resolve(__dirname, genAbcScript)
      });
    } else {
      cluster.setupMaster({
        exec: path.resolve(__dirname, genAbcScript)
      });
    }

    for (let i = 0; i < workerNumber; ++i) {
      const workerData: any = {
        'inputs': JSON.stringify(splitedBundles[i]),
        'cmd': cmdPrefix
      };
      cluster.fork(workerData);
    }

    let count_ = 0;
    if (process.env.watchMode === 'true') {
      process.removeAllListeners("exit");
      cluster.removeAllListeners("exit");
    }
    cluster.on('exit', (worker, code, signal) => {
      if (code === FAIL || process.exitCode === FAIL) {
        process.exitCode = FAIL;
        return;
      }
      count_++;
      if (count_ === workerNumber) {
        // for preview of with incre compile
        if (process.env.watchMode === 'true' && compileCount < previewCount) {
          compileCount++;
          processExtraAssetForBundle();
          console.info(red, 'COMPILE RESULT:SUCCESS ', reset);
          if (compileCount >= previewCount) {
            return;
          }
          invokeWorkersToGenAbc();
        }
      }
      logger.debug(`worker ${worker.process.pid} finished`);
    });

    process.on('exit', (code) => {
      // for build options
      processExtraAssetForBundle();
    });

    // for preview of without incre compile
    if (workerNumber === 0 && process.env.watchMode === 'true') {
      processExtraAssetForBundle();
    }
  }
}

function filterIntermediateModuleByHashJson(buildPath: string, moduleInfos: Array<ModuleInfo>): void {
  const tempModuleInfos = Array<ModuleInfo>();
  moduleInfos.forEach((item) => {
    const check = tempModuleInfos.every((newItem) => {
      return item.tempFilePath !== newItem.tempFilePath;
    });
    if (check) {
      tempModuleInfos.push(item);
    }
  });
  moduleInfos = tempModuleInfos;

  for (let i = 0; i < moduleInfos.length; ++i) {
    filterModuleInfos.push(moduleInfos[i]);
  }
  const hashFilePath: string = genHashJsonPath(buildPath);
  if (hashFilePath.length === 0) {
    return;
  }
  const updateJsonObject: any = {};
  let jsonObject: any = {};
  let jsonFile: string = '';
  if (fs.existsSync(hashFilePath)) {
    jsonFile = fs.readFileSync(hashFilePath).toString();
    jsonObject = JSON.parse(jsonFile);
    filterModuleInfos = [];
    for (let i = 0; i < moduleInfos.length; ++i) {
      const input: string = moduleInfos[i].tempFilePath;
      let outputPath: string = moduleInfos[i].abcFilePath;
      if (!fs.existsSync(input)) {
        logger.debug(red, `ETS:ERROR ${input} is lost`, reset);
        process.exitCode = FAIL;
        break;
      }
      if (fs.existsSync(outputPath)) {
        const hashInputContentData: any = toHashData(input);
        const hashAbcContentData: any = toHashData(outputPath);
        if (jsonObject[input] === hashInputContentData && jsonObject[outputPath] === hashAbcContentData) {
          updateJsonObject[input] = hashInputContentData;
          updateJsonObject[outputPath] = hashAbcContentData;
          mkdirsSync(path.dirname(moduleInfos[i].buildFilePath));
          if (projectConfig.buildArkMode === 'debug' && fs.existsSync(moduleInfos[i].tempFilePath)) {
            fs.copyFileSync(moduleInfos[i].tempFilePath, moduleInfos[i].buildFilePath);
          }
          fs.copyFileSync(genAbcFileName(moduleInfos[i].tempFilePath), genAbcFileName(moduleInfos[i].buildFilePath));
          if (projectConfig.buildArkMode === 'debug' && fs.existsSync(genSourceMapFileName(moduleInfos[i].tempFilePath))) {
            fs.copyFileSync(genSourceMapFileName(moduleInfos[i].tempFilePath), genSourceMapFileName(moduleInfos[i].buildFilePath));
          }
        } else {
          filterModuleInfos.push(moduleInfos[i]);
        }
      } else {
        filterModuleInfos.push(moduleInfos[i]);
      }
    }
  }

  moduleHashJsonObject = updateJsonObject;
}

function writeModuleHashJson(): void {
  for (let i = 0; i < filterModuleInfos.length; ++i) {
    const input: string = filterModuleInfos[i].tempFilePath;
    let outputPath: string = filterModuleInfos[i].abcFilePath;
    if (!fs.existsSync(input) || !fs.existsSync(outputPath)) {
      logger.error(red, `ETS:ERROR ${input} is lost`, reset);
      process.exitCode = FAIL;
      break;
    }
    const hashInputContentData: any = toHashData(input);
    const hashAbcContentData: any = toHashData(outputPath);
    moduleHashJsonObject[input] = hashInputContentData;
    moduleHashJsonObject[outputPath] = hashAbcContentData;
    mkdirsSync(path.dirname(filterModuleInfos[i].buildFilePath));
    if (projectConfig.buildArkMode === 'debug' && fs.existsSync(filterModuleInfos[i].tempFilePath)) {
      fs.copyFileSync(filterModuleInfos[i].tempFilePath, filterModuleInfos[i].buildFilePath);
    }
    fs.copyFileSync(genAbcFileName(filterModuleInfos[i].tempFilePath), genAbcFileName(filterModuleInfos[i].buildFilePath));
    if (projectConfig.buildArkMode === 'debug' && fs.existsSync(genSourceMapFileName(filterModuleInfos[i].tempFilePath))) {
      fs.copyFileSync(genSourceMapFileName(filterModuleInfos[i].tempFilePath), genSourceMapFileName(filterModuleInfos[i].buildFilePath));
    }
  }
  const hashFilePath: string = genHashJsonPath(buildPathInfo);
  if (hashFilePath.length === 0) {
    return;
  }
  // fix bug of multi trigger
  if (process.env.watchMode !== 'true' || previewCount < 1) {
    fs.writeFileSync(hashFilePath, JSON.stringify(moduleHashJsonObject));
  }
}

function filterIntermediateJsBundleByHashJson(buildPath: string, inputPaths: File[]): void {
  const tempInputPaths = Array<File>();
  inputPaths.forEach((item) => {
    const check = tempInputPaths.every((newItem) => {
      return item.path !== newItem.path;
    });
    if (check) {
      tempInputPaths.push(item);
    }
  });
  inputPaths = tempInputPaths;

  for (let i = 0; i < inputPaths.length; ++i) {
    fileterIntermediateJsBundle.push(inputPaths[i]);
  }
  const hashFilePath: string = genHashJsonPath(buildPath);
  if (hashFilePath.length === 0) {
    return;
  }
  const updateJsonObject: any = {};
  let jsonObject: any = {};
  let jsonFile: string = '';
  if (fs.existsSync(hashFilePath)) {
    jsonFile = fs.readFileSync(hashFilePath).toString();
    jsonObject = JSON.parse(jsonFile);
    fileterIntermediateJsBundle = [];
    for (let i = 0; i < inputPaths.length; ++i) {
      const cacheOutputPath: string = inputPaths[i].cacheOutputPath;
      const cacheAbcFilePath: string = cacheOutputPath.replace(/\.temp\.js$/, '.abc');
      if (!fs.existsSync(cacheOutputPath)) {
        logger.error(red, `ETS:ERROR ${cacheOutputPath} is lost`, reset);
        process.exitCode = FAIL;
        break;
      }
      if (fs.existsSync(cacheAbcFilePath)) {
        const hashInputContentData: any = toHashData(cacheOutputPath);
        const hashAbcContentData: any = toHashData(cacheAbcFilePath);
        if (jsonObject[cacheOutputPath] === hashInputContentData && jsonObject[cacheAbcFilePath] === hashAbcContentData) {
          updateJsonObject[cacheOutputPath] = hashInputContentData;
          updateJsonObject[cacheAbcFilePath] = hashAbcContentData;
        } else {
          fileterIntermediateJsBundle.push(inputPaths[i]);
        }
      } else {
        fileterIntermediateJsBundle.push(inputPaths[i]);
      }
    }
  }

  hashJsonObject = updateJsonObject;
}

function writeHashJson(): void {
  for (let i = 0; i < fileterIntermediateJsBundle.length; ++i) {
    const cacheOutputPath: string = fileterIntermediateJsBundle[i].cacheOutputPath;
    const cacheAbcFilePath: string = cacheOutputPath.replace(/\.temp\.js$/, '.abc');
    if (!fs.existsSync(cacheOutputPath) || !fs.existsSync(cacheAbcFilePath)) {
      logger.error(red, `ETS:ERROR ${cacheOutputPath} is lost`, reset);
      process.exitCode = FAIL;
      break;
    }
    const hashInputContentData: any = toHashData(cacheOutputPath);
    const hashAbcContentData: any = toHashData(cacheAbcFilePath);
    hashJsonObject[cacheOutputPath] = hashInputContentData;
    hashJsonObject[cacheAbcFilePath] = hashAbcContentData;
  }
  const hashFilePath: string = genHashJsonPath(buildPathInfo);
  if (hashFilePath.length === 0) {
    return;
  }
  // fix bug of multi trigger
  if (process.env.watchMode !== 'true' || previewCount < 1) {
    fs.writeFileSync(hashFilePath, JSON.stringify(hashJsonObject));
  }
}

function genHashJsonPath(buildPath: string): string {
  buildPath = toUnixPath(buildPath);
  if (process.env.cachePath) {
    if (!fs.existsSync(process.env.cachePath) || !fs.statSync(process.env.cachePath).isDirectory()) {
      logger.debug(red, `ETS:ERROR hash path does not exist`, reset);
      return '';
    }
    let buildDirArr: string[] = projectConfig.buildPath.split(path.sep);
    let abilityDir: string = buildDirArr[buildDirArr.length - 1];
    let hashJsonPath: string = path.join(process.env.cachePath, TEMPORARY, abilityDir, hashFile);
    mkdirsSync(path.dirname(hashJsonPath));
    return hashJsonPath;
  } else if (buildPath.indexOf(ARK) >= 0) {
    const dataTmps: string[] = buildPath.split(ARK);
    const hashPath: string = path.join(dataTmps[0], ARK);
    if (!fs.existsSync(hashPath) || !fs.statSync(hashPath).isDirectory()) {
      logger.debug(red, `ETS:ERROR hash path does not exist`, reset);
      return '';
    }
    return path.join(hashPath, hashFile);
  } else {
    logger.debug(red, `ETS:ERROR not cache exist`, reset);
    return '';
  }
}

function checkNodeModules() {
  if (process.env.panda === TS2ABC) {
    let arkEntryPath: string = path.join(arkDir, 'build');
    if (isWin) {
      arkEntryPath = path.join(arkDir, 'build-win');
    } else if (isMac) {
      arkEntryPath = path.join(arkDir, 'build-mac');
    }
    let nodeModulesPath: string = path.join(arkEntryPath, NODE_MODULES);
    if (!(fs.existsSync(nodeModulesPath) && fs.statSync(nodeModulesPath).isDirectory())) {
      logger.error(red, `ERROR: node_modules for ark compiler not found.
        Please make sure switch to non-root user before runing "npm install" for safity requirements and try re-run "npm install" under ${arkEntryPath}`, reset);
      return false;
    }
  }

  return true;
}

function copyFileCachePathToBuildPath() {
  for (let i = 0; i < intermediateJsBundle.length; ++i) {
    const abcFile: string = intermediateJsBundle[i].path.replace(/\.temp\.js$/, ".abc");
    const cacheOutputPath: string = intermediateJsBundle[i].cacheOutputPath;
    const cacheAbcFilePath: string = intermediateJsBundle[i].cacheOutputPath.replace(/\.temp\.js$/, ".abc");
    if (!fs.existsSync(cacheAbcFilePath)) {
      logger.debug(red, `ETS:ERROR ${cacheAbcFilePath} is lost`, reset);
      process.exitCode = FAIL;
      break;
    }
    let parent: string = path.join(abcFile, '..');
    if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
      mkDir(parent);
    }
    // for preview mode, cache path and old abc file both exist, should copy abc file for updating
    if (process.env.cachePath !== undefined) {
      fs.copyFileSync(cacheAbcFilePath, abcFile);
    }
    if (process.env.cachePath === undefined && fs.existsSync(cacheOutputPath)) {
      fs.unlinkSync(cacheOutputPath);
    }
  }
}

function processExtraAssetForBundle() {
  writeHashJson();
  copyFileCachePathToBuildPath();
  clearGlobalInfo();
}

function handleHotReloadChangedFiles() {
  let changedFileListJson: string = fs.readFileSync(projectConfig.changedFileList).toString();
  let changedFileList: Array<string> = JSON.parse(changedFileListJson).modifiedFiles;

  const nodeModulesFile: Array<string> = [];
  for (let file of changedFileList) {
    let filePath: string = path.join(projectConfig.projectPath, file);
    let tempFilePath: string = genTemporaryPath(filePath, projectConfig.projectPath, process.env.cachePath);
    if (tempFilePath.length === 0) {
      return;
    }
    let buildFilePath: string = "";
    tempFilePath = toUnixPath(tempFilePath);

    if (file.endsWith(EXTNAME_ETS)) {
      processEtsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
    } else if (file.endsWith(EXTNAME_D_TS)) {
      processDtsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
    } else if (file.endsWith(EXTNAME_TS)) {
      processTsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
    } else if (file.endsWith(EXTNAME_JS) || file.endsWith(EXTNAME_MJS) || file.endsWith(EXTNAME_CJS)) {
      processJsModule(filePath, tempFilePath, buildFilePath, nodeModulesFile, module);
    } else {
      logger.error(red, `ETS:ERROR Cannot find resolve this file path: ${filePath}`, reset);
      process.exitCode = FAIL;
    }
  }

  if (!fs.existsSync(projectConfig.patchAbcPath)) {
    mkdirsSync(projectConfig.patchAbcPath);
  }

  const outputABCPath: string = path.join(projectConfig.patchAbcPath, MODULES_ABC);
  generateMergedAbc(moduleInfos, entryInfos, outputABCPath);
}

function handleFinishModules(modules, callback) {
  if (projectConfig.hotReload && !isHotReloadFirstBuild) {
    handleHotReloadChangedFiles();
    return;
  }

  handleFullModuleFiles(modules, callback);

  if (projectConfig.hotReload) {
    isHotReloadFirstBuild = false;
  }
}
