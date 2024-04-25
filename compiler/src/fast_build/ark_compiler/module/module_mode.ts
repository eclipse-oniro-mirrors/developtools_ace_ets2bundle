/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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

import childProcess from 'child_process';
import fs from 'fs';
import path from 'path';
import cluster from 'cluster';

import {
  COMMONJS,
  ESM,
  ESMODULE,
  EXTNAME_CJS,
  EXTNAME_ETS,
  EXTNAME_JS,
  EXTNAME_JSON,
  EXTNAME_MJS,
  EXTNAME_PROTO_BIN,
  EXTNAME_TS,
  EXTNAME_TXT,
  FAIL,
  FILESINFO,
  FILESINFO_TXT,
  MAX_WORKER_NUMBER,
  MODULES_ABC,
  MODULES_CACHE,
  NPM_ENTRIES_PROTO_BIN,
  NPMENTRIES_TXT,
  OH_MODULES,
  PACKAGES,
  PROTO_FILESINFO_TXT,
  PROTOS,
  red,
  reset,
  SOURCEMAPS,
  SOURCEMAPS_JSON,
  WIDGETS_ABC,
  TS2ABC,
  ES2ABC
} from '../common/ark_define';
import {
  needAotCompiler,
  isMasterOrPrimary,
  isAotMode,
  isDebug
} from '../utils';
import { CommonMode } from '../common/common_mode';
import { mangleFilePath } from '../common/ob_config_resolver';
import {
  changeFileExtension,
  getEs2abcFileThreadNumber,
  isCommonJsPluginVirtualFile,
  isCurrentProjectFiles,
  shouldETSOrTSFileTransformToJS
} from '../utils';
import {
  isPackageModulesFile,
  mkdirsSync,
  toUnixPath,
  toHashData,
  validateFilePathLength
} from '../../../utils';
import {
  getPackageInfo,
  getNormalizedOhmUrlByFilepath,
  getOhmUrlByFilepath,
  getOhmUrlByHspName,
  isTs2Abc,
  isEs2Abc,
  createAndStartEvent,
  stopEvent
} from '../../../ark_utils';
import {
  generateAot,
  FaultHandler
} from '../../../gen_aot';
import {
  NATIVE_MODULE
} from '../../../pre_define';
import {
  sharedModuleSet
} from '../check_shared_module';
import { SourceMapGenerator } from '../generate_sourcemap';

export class ModuleInfo {
  filePath: string;
  cacheFilePath: string;
  recordName: string;
  isCommonJs: boolean;
  sourceFile: string;
  packageName: string;

  constructor(filePath: string, cacheFilePath: string, isCommonJs: boolean, recordName: string, sourceFile: string,
    packageName: string
  ) {
    this.filePath = filePath;
    this.cacheFilePath = cacheFilePath;
    this.recordName = recordName;
    this.isCommonJs = isCommonJs;
    this.sourceFile = sourceFile;
    this.packageName = packageName;
  }
}

export class PackageEntryInfo {
  pkgEntryPath: string;
  pkgBuildPath: string;
  constructor(pkgEntryPath: string, pkgBuildPath: string) {
    this.pkgEntryPath = pkgEntryPath;
    this.pkgBuildPath = pkgBuildPath;
  }
}

export class ModuleMode extends CommonMode {
  moduleInfos: Map<String, ModuleInfo>;
  pkgEntryInfos: Map<String, PackageEntryInfo>;
  hashJsonObject: Object;
  cacheSourceMapObject: Object;
  filesInfoPath: string;
  npmEntriesInfoPath: string;
  moduleAbcPath: string;
  sourceMapPath: string;
  cacheFilePath: string;
  cacheSourceMapPath: string;
  workerNumber: number;
  npmEntriesProtoFilePath: string;
  protoFilePath: string;
  filterModuleInfos: Map<String, ModuleInfo>;
  symlinkMap: Object;
  useNormalizedOHMUrl: boolean;

  constructor(rollupObject: Object) {
    super(rollupObject);
    this.moduleInfos = new Map<String, ModuleInfo>();
    this.pkgEntryInfos = new Map<String, PackageEntryInfo>();
    this.hashJsonObject = {};
    this.cacheSourceMapObject = {};
    this.filesInfoPath = path.join(this.projectConfig.cachePath, FILESINFO_TXT);
    this.npmEntriesInfoPath = path.join(this.projectConfig.cachePath, NPMENTRIES_TXT);
    const outPutABC: string = this.projectConfig.widgetCompile ? WIDGETS_ABC : MODULES_ABC;
    this.moduleAbcPath = path.join(this.projectConfig.aceModuleBuild, outPutABC);
    this.sourceMapPath = this.arkConfig.isDebug ? path.join(this.projectConfig.aceModuleBuild, SOURCEMAPS) :
      path.join(this.projectConfig.cachePath, SOURCEMAPS);
    this.cacheFilePath = path.join(this.projectConfig.cachePath, MODULES_CACHE);
    this.cacheSourceMapPath = path.join(this.projectConfig.cachePath, SOURCEMAPS_JSON);
    this.workerNumber = MAX_WORKER_NUMBER;
    this.npmEntriesProtoFilePath = path.join(this.projectConfig.cachePath, PROTOS, NPM_ENTRIES_PROTO_BIN);
    this.protoFilePath = path.join(this.projectConfig.cachePath, PROTOS, PROTO_FILESINFO_TXT);
    this.hashJsonObject = {};
    this.filterModuleInfos = new Map<String, ModuleInfo>();
    this.symlinkMap = rollupObject.share.symlinkMap;
    this.useNormalizedOHMUrl = this.isUsingNormalizedOHMUrl();
  }

  prepareForCompilation(rollupObject: Object, parentEvent: Object): void {
    const eventPrepareForCompilation = createAndStartEvent(parentEvent, 'preparation for compilation');
    this.collectModuleFileList(rollupObject, rollupObject.getModuleIds());
    this.removeCacheInfo(rollupObject);
    stopEvent(eventPrepareForCompilation);
  }

  collectModuleFileList(module: Object, fileList: IterableIterator<string>): void {
    let moduleInfos: Map<String, ModuleInfo> = new Map<String, ModuleInfo>();
    let pkgEntryInfos: Map<String, PackageEntryInfo> = new Map<String, PackageEntryInfo>();
    for (const moduleId of fileList) {
      if (isCommonJsPluginVirtualFile(moduleId) || !isCurrentProjectFiles(moduleId, this.projectConfig)) {
        continue;
      }
      const moduleInfo: Object = module.getModuleInfo(moduleId);
      if (moduleInfo['meta']['isNodeEntryFile'] && !this.useNormalizedOHMUrl) {
        this.getPackageEntryInfo(moduleId, moduleInfo['meta'], pkgEntryInfos);
      }

      this.processModuleInfos(moduleId, moduleInfos, moduleInfo['meta']);
    }
    if (!this.useNormalizedOHMUrl) {
      this.getDynamicImportEntryInfo(pkgEntryInfos);
    }
    this.getNativeModuleEntryInfo(pkgEntryInfos);
    this.moduleInfos = moduleInfos;
    this.pkgEntryInfos = pkgEntryInfos;
  }

  private isUsingNormalizedOHMUrl() {
    return !!this.projectConfig.useNormalizedOHMUrl;
  }

  private updatePkgEntryInfos(pkgEntryInfos: Map<String, PackageEntryInfo>, key: String, value: PackageEntryInfo): void {
    if (!pkgEntryInfos.has(key)) {
      pkgEntryInfos.set(key, new PackageEntryInfo(key, value));
    }
  }

  private getDynamicImportEntryInfo(pkgEntryInfos: Map<String, PackageEntryInfo>): void {
    if (this.projectConfig.dynamicImportLibInfo) {
      const REG_LIB_SO: RegExp = /lib(.+)\.so/;
      for (const [pkgName, pkgInfo] of Object.entries(this.projectConfig.dynamicImportLibInfo)) {
        if (REG_LIB_SO.test(pkgName)) {
          let ohmurl: string = pkgName.replace(REG_LIB_SO, (_, libsoKey) => {
            return `@app.${this.projectConfig.bundleName}/${this.projectConfig.moduleName}/${libsoKey}`;
          });
          this.updatePkgEntryInfos(pkgEntryInfos, pkgName, ohmurl);
          continue;
        }
        let hspOhmurl: string | undefined = getOhmUrlByHspName(pkgName, this.projectConfig, this.logger,
          this.useNormalizedOHMUrl);
        if (hspOhmurl !== undefined) {
          hspOhmurl = hspOhmurl.replace(/^@(\w+):(.*)/, '@$1.$2');
          this.updatePkgEntryInfos(pkgEntryInfos, pkgName, hspOhmurl);
          continue;
        }
        const entryFile: string = pkgInfo.entryFilePath;
        this.getPackageEntryInfo(entryFile, pkgInfo, pkgEntryInfos);
      }
    }
  }

  private getNativeModuleEntryInfo(pkgEntryInfos: Map<String, PackageEntryInfo>): void {
    for (const item of NATIVE_MODULE) {
      let key = '@' + item;
      this.updatePkgEntryInfos(pkgEntryInfos, key, '@native.' + item);
    }
  }

  private getPackageEntryInfo(filePath: string, metaInfo: Object, pkgEntryInfos: Map<String, PackageEntryInfo>): void {
    if (metaInfo['isLocalDependency']) {
      const hostModulesInfo: Object = metaInfo.hostModulesInfo;
      const pkgBuildPath: string = getOhmUrlByFilepath(filePath, this.projectConfig, this.logger, metaInfo['moduleName']);
      hostModulesInfo.forEach(hostModuleInfo => {
        const hostDependencyName: string = hostModuleInfo['hostDependencyName'];
        const hostModuleName: string = hostModuleInfo['hostModuleName'];
        const pkgEntryPath: string = toUnixPath(path.join(`${PACKAGES}@${hostModuleName}`, hostDependencyName));
        if (!pkgEntryInfos.has(pkgEntryPath)) {
          pkgEntryInfos.set(pkgEntryPath, new PackageEntryInfo(pkgEntryPath, pkgBuildPath));
        }
        this.updatePkgEntryInfos(pkgEntryInfos, hostDependencyName, `@bundle.${pkgBuildPath}`);
      });
      return;
    }

    if (!metaInfo['pkgPath']) {
      this.logger.debug("ArkTS:INTERNAL ERROR: Failed to get 'pkgPath' from metaInfo. File: ", filePath);
      return;
    }
    const pkgPath: string = metaInfo['pkgPath'];
    let originPkgEntryPath: string = toUnixPath(filePath.replace(pkgPath, ''));
    if (originPkgEntryPath.startsWith('/')) {
      originPkgEntryPath = originPkgEntryPath.slice(1, originPkgEntryPath.length);
    }
    const pkgEntryPath: string = toUnixPath(this.getPkgModulesFilePkgName(pkgPath));
    let pkgBuildPath: string = path.join(pkgEntryPath, originPkgEntryPath);
    pkgBuildPath = toUnixPath(pkgBuildPath.substring(0, pkgBuildPath.lastIndexOf('.')));
    if (!pkgEntryInfos.has(pkgEntryPath)) {
      pkgEntryInfos.set(pkgEntryPath, new PackageEntryInfo(pkgEntryPath, pkgBuildPath));
    }
    // create symlink path to actual path mapping in ohpm
    if (this.projectConfig.packageDir == OH_MODULES && this.symlinkMap) {
      const symlinkEntries: Object = Object.entries(this.symlinkMap);
      for (const [actualPath, symlinkPaths] of symlinkEntries) {
        if (actualPath === pkgPath) {
          (<string[]>symlinkPaths).forEach((symlink: string) => {
            const symlinkPkgEntryPath: string = toUnixPath(this.getPkgModulesFilePkgName(symlink));
            if (!pkgEntryInfos.has(symlinkPkgEntryPath)) {
              pkgEntryInfos.set(symlinkPkgEntryPath, new PackageEntryInfo(symlinkPkgEntryPath, pkgEntryPath));
            }
          });
          break;
        }
      }
    }
  }

  private processModuleInfos(moduleId: string, moduleInfos: Map<String, ModuleInfo>, metaInfo?: Object): void {
    switch (path.extname(moduleId)) {
      case EXTNAME_ETS: {
        const extName: string = shouldETSOrTSFileTransformToJS(moduleId, this.projectConfig) ? EXTNAME_JS : EXTNAME_TS;
        this.addModuleInfoItem(moduleId, false, extName, metaInfo, moduleInfos);
        break;
      }
      case EXTNAME_TS: {
        const extName: string = shouldETSOrTSFileTransformToJS(moduleId, this.projectConfig) ? EXTNAME_JS : '';
        this.addModuleInfoItem(moduleId, false, extName, metaInfo, moduleInfos);
        break;
      }
      case EXTNAME_JS:
      case EXTNAME_MJS:
      case EXTNAME_CJS: {
        const extName: string = (moduleId.endsWith(EXTNAME_MJS) || moduleId.endsWith(EXTNAME_CJS)) ? EXTNAME_JS : '';
        const isCommonJS: boolean = metaInfo && metaInfo['commonjs'] && metaInfo['commonjs']['isCommonJS'];
        this.addModuleInfoItem(moduleId, isCommonJS, extName, metaInfo, moduleInfos);
        break;
      }
      case EXTNAME_JSON: {
        this.addModuleInfoItem(moduleId, false, '', metaInfo, moduleInfos);
        break;
      }
      default:
        break;
    }
  }

  private addModuleInfoItem(filePath: string, isCommonJs: boolean, extName: string,
    metaInfo: Object, moduleInfos: Map<String, ModuleInfo>): void {
    const isPackageModules = isPackageModulesFile(filePath, this.projectConfig);
    // if release mode, enable obfuscation, enable filename obfuscation -> call mangleFilePath()
    filePath = this.handleObfuscatedFilePath(filePath, isPackageModules);
    let moduleName: string = metaInfo['moduleName'];
    let recordName: string = '';
    let sourceFile: string = filePath.replace(this.projectConfig.projectRootPath + path.sep, '');
    let cacheFilePath: string =
      this.genFileCachePath(filePath, this.projectConfig.projectRootPath, this.projectConfig.cachePath);
    let packageName: string = '';
    let sourceMapGenerator: SourceMapGenerator = SourceMapGenerator.getInstance();

    if (this.useNormalizedOHMUrl) {
      packageName = metaInfo['pkgName'];
      const pkgParams = {
        pkgName: packageName,
        pkgPath: metaInfo['pkgPath'],
        isRecordName: true
      };
      recordName = getNormalizedOhmUrlByFilepath(filePath, this.projectConfig, this.logger, pkgParams, undefined);
    } else {
      recordName = getOhmUrlByFilepath(filePath, this.projectConfig, this.logger, moduleName);
      if (isPackageModules) {
        packageName = this.getPkgModulesFilePkgName(metaInfo['pkgPath']);
      } else {
        packageName =
          metaInfo['isLocalDependency'] ? moduleName : getPackageInfo(this.projectConfig.aceModuleJsonPath)[1];
      }
    }

    if (extName.length !== 0) {
      cacheFilePath = changeFileExtension(cacheFilePath, extName);
    }

    cacheFilePath = toUnixPath(cacheFilePath);
    recordName = toUnixPath(recordName);
    sourceFile = sourceMapGenerator.genKey(filePath);
    packageName = toUnixPath(packageName);

    moduleInfos.set(filePath, new ModuleInfo(filePath, cacheFilePath, isCommonJs, recordName, sourceFile, packageName));
  }

  generateEs2AbcCmd() {
    const fileThreads = getEs2abcFileThreadNumber();
    this.cmdArgs.push(`"@${this.filesInfoPath}"`);
    this.cmdArgs.push('--npm-module-entry-list');
    this.cmdArgs.push(`"${this.npmEntriesInfoPath}"`);
    this.cmdArgs.push('--output');
    this.cmdArgs.push(`"${this.moduleAbcPath}"`);
    this.cmdArgs.push('--file-threads');
    this.cmdArgs.push(`"${fileThreads}"`);
    this.cmdArgs.push('--merge-abc');
    this.cmdArgs.push(`"--target-api-version=${this.projectConfig.compatibleSdkVersion}"`);
  }

  addCacheFileArgs() {
    this.cmdArgs.push('--cache-file');
    this.cmdArgs.push(`"@${this.cacheFilePath}"`);
  }

  private handleObfuscatedFilePath(filePath: string, isPackageModules: boolean): string {
    const isDebugMode = isDebug(this.projectConfig);
    const hasObfuscationConfig = this.projectConfig.obfuscationMergedObConfig;
    if (isDebugMode || !hasObfuscationConfig) {
      return filePath;
    }
    const disableObfuscation = hasObfuscationConfig.options.disableObfuscation;
    const enableFileNameObfuscation = hasObfuscationConfig.options.enableFileNameObfuscation;
    if (disableObfuscation || !enableFileNameObfuscation) {
      return filePath;
    }
    // Do not obfuscate the file path in dir oh_modules.
    if (!isPackageModules) {
      return mangleFilePath(filePath);
    }
    // When open the config 'enableFileNameObfuscation', keeping all paths in unix format.
    return toUnixPath(filePath);
  }

  private generateCompileFilesInfo() {
    let filesInfo: string = '';
    this.moduleInfos.forEach((info) => {
      const moduleType: string = info.isCommonJs ? COMMONJS : ESM;
      const isSharedModule: boolean = sharedModuleSet.has(info.filePath);
      filesInfo += `${info.cacheFilePath};${info.recordName};${moduleType};${info.sourceFile};${info.packageName};` +
        `${isSharedModule}\n`;
    });
    fs.writeFileSync(this.filesInfoPath, filesInfo, 'utf-8');
  }

  private generateNpmEntriesInfo() {
    let entriesInfo: string = '';
    for (const value of this.pkgEntryInfos.values()) {
      entriesInfo += `${value.pkgEntryPath}:${value.pkgBuildPath}\n`;
    }
    fs.writeFileSync(this.npmEntriesInfoPath, entriesInfo, 'utf-8');
  }

  private generateAbcCacheFilesInfo(): void {
    let abcCacheFilesInfo: string = '';

    // generate source file cache
    this.moduleInfos.forEach((info) => {
      let abcCacheFilePath: string = changeFileExtension(info.cacheFilePath, EXTNAME_PROTO_BIN);
      abcCacheFilesInfo += `${info.cacheFilePath};${abcCacheFilePath}\n`;
    });

    // generate npm entries cache
    let npmEntriesCacheFilePath: string = changeFileExtension(this.npmEntriesInfoPath, EXTNAME_PROTO_BIN);
    abcCacheFilesInfo += `${this.npmEntriesInfoPath};${npmEntriesCacheFilePath}\n`;

    fs.writeFileSync(this.cacheFilePath, abcCacheFilesInfo, 'utf-8');
  }

  private genDescriptionsForMergedEs2abc() {
    this.generateCompileFilesInfo();
    this.generateNpmEntriesInfo();
    this.generateAbcCacheFilesInfo();
  }

  generateMergedAbcOfEs2Abc(parentEvent: Object): void {
    // collect data error from subprocess
    let errMsg: string = '';
    const eventGenDescriptionsForMergedEs2abc = createAndStartEvent(parentEvent, 'generate descriptions for merged es2abc');
    this.genDescriptionsForMergedEs2abc();
    stopEvent(eventGenDescriptionsForMergedEs2abc);
    const genAbcCmd: string = this.cmdArgs.join(' ');
    try {
      let eventGenAbc: Object;
      const child = this.triggerAsync(() => {
        eventGenAbc = createAndStartEvent(parentEvent, 'generate merged abc by es2abc (async)', true);
        return childProcess.exec(genAbcCmd, { windowsHide: true });
      });
      child.on('close', (code: any) => {
        if (code === FAIL) {
          this.throwArkTsCompilerError(`ArkTS:ERROR Failed to execute es2abc\n` +
            `genAbcCmd: ${genAbcCmd}`);
        }
        stopEvent(eventGenAbc, true);
        this.triggerEndSignal();
        this.processAotIfNeeded();
      });

      child.on('error', (err: any) => {
        stopEvent(eventGenAbc, true);
        this.throwArkTsCompilerError(err.toString());
      });

      child.stderr.on('data', (data: any) => {
        errMsg += data.toString();
      });

      child.stderr.on('end', (data: any) => {
        if (errMsg !== undefined && errMsg.length > 0) {
          this.logger.error(red, errMsg, reset);
        }
      });
    } catch (e) {
      this.throwArkTsCompilerError('ArkTS:ERROR Failed to execute es2abc. Error message: ' + e.toString());
    }
  }

  filterModulesByHashJson() {
    if (this.hashJsonFilePath.length === 0 || !fs.existsSync(this.hashJsonFilePath)) {
      for (const key of this.moduleInfos.keys()) {
        this.filterModuleInfos.set(key, this.moduleInfos.get(key));
      }
      return;
    }

    let updatedJsonObject: Object = {};
    let jsonObject: Object = {};
    let jsonFile: string = '';

    if (fs.existsSync(this.hashJsonFilePath)) {
      jsonFile = fs.readFileSync(this.hashJsonFilePath).toString();
      jsonObject = JSON.parse(jsonFile);
      this.filterModuleInfos = new Map<string, ModuleInfo>();
      for (const [key, value] of this.moduleInfos) {
        const cacheFilePath: string = value.cacheFilePath;
        const cacheProtoFilePath: string = changeFileExtension(cacheFilePath, EXTNAME_PROTO_BIN);
        if (!fs.existsSync(cacheFilePath)) {
          this.throwArkTsCompilerError(
            `ArkTS:INTERNAL ERROR: Failed to get module cache abc from ${cacheFilePath} in incremental build.` +
            `Please try to rebuild the project.`);
        }
        if (fs.existsSync(cacheProtoFilePath)) {
          const hashCacheFileContentData: string = toHashData(cacheFilePath);
          const hashProtoFileContentData: string = toHashData(cacheProtoFilePath);
          if (jsonObject[cacheFilePath] === hashCacheFileContentData &&
            jsonObject[cacheProtoFilePath] === hashProtoFileContentData) {
            updatedJsonObject[cacheFilePath] = cacheFilePath;
            updatedJsonObject[cacheProtoFilePath] = cacheProtoFilePath;
            continue;
          }
        }
        this.filterModuleInfos.set(key, value);
      }
    }

    this.hashJsonObject = updatedJsonObject;
  }

  getSplittedModulesByNumber() {
    const result: any = [];
    if (this.filterModuleInfos.size < this.workerNumber) {
      for (const value of this.filterModuleInfos.values()) {
        result.push([value]);
      }
      return result;
    }

    for (let i = 0; i < this.workerNumber; ++i) {
      result.push([]);
    }

    let pos: number = 0;
    for (const value of this.filterModuleInfos.values()) {
      const chunk = pos % this.workerNumber;
      result[chunk].push(value);
      pos++;
    }

    return result;
  }

  invokeTs2AbcWorkersToGenProto(splittedModules) {
    let ts2abcCmdArgs: string[] = this.cmdArgs.slice(0);
    ts2abcCmdArgs.push('--output-proto');
    ts2abcCmdArgs.push('--merge-abc');
    ts2abcCmdArgs.push('--input-file');
    if (isMasterOrPrimary()) {
      this.setupCluster(cluster);
      this.workerNumber = splittedModules.length;
      for (let i = 0; i < this.workerNumber; ++i) {
        const sn: number = i + 1;
        const workerFileName: string = `${FILESINFO}_${sn}${EXTNAME_TXT}`;
        const workerData: Object = {
          inputs: JSON.stringify(splittedModules[i]),
          cmd: ts2abcCmdArgs.join(' '),
          workerFileName: workerFileName,
          mode: ESMODULE,
          cachePath: this.projectConfig.cachePath
        };
        this.triggerAsync(() => {
          const worker: Object = cluster.fork(workerData);
          worker.on('message', (errorMsg) => {
            this.logger.error(red, errorMsg.data.toString(), reset);
            this.throwArkTsCompilerError(`ArkTS:ERROR Failed to execute ts2abc.`);
          });
        });
      }
    }
  }

  processTs2abcWorkersToGenAbc() {
    this.generateNpmEntriesInfo();
    let workerCount: number = 0;
    if (isMasterOrPrimary()) {
      cluster.on('exit', (worker, code, signal) => {
        if (code === FAIL) {
          this.throwArkTsCompilerError('ArkTS:ERROR Failed to execute ts2abc');
        }
        workerCount++;
        if (workerCount === this.workerNumber) {
          this.generateNpmEntryToGenProto();
          this.generateProtoFilesInfo();
          this.mergeProtoToAbc();
          this.processAotIfNeeded();
          this.afterCompilationProcess();
        }
        this.triggerEndSignal();
      });
      if (this.workerNumber == 0) {
        // process aot for no source file changed.
        this.processAotIfNeeded();
      }
    }
  }

  private processAotIfNeeded(): void {
    if (!needAotCompiler(this.projectConfig)) {
      return;
    }
    let faultHandler: FaultHandler = ((error: string) => { this.throwArkTsCompilerError(error); })
    generateAot(this.arkConfig.arkRootPath, this.moduleAbcPath, this.projectConfig, this.logger, faultHandler);
  }

  private genFileCachePath(filePath: string, projectRootPath: string, cachePath: string): string {
    const sufStr: string = toUnixPath(filePath).replace(toUnixPath(projectRootPath), '');
    const output: string = path.join(cachePath, sufStr);
    return output;
  }

  private getPkgModulesFilePkgName(pkgPath: string) {
    pkgPath = toUnixPath(pkgPath);
    const packageDir: string = this.projectConfig.packageDir;
    const projectRootPath = toUnixPath(this.projectConfig.projectRootPath);
    const projectPkgModulesPath: string = toUnixPath(path.join(projectRootPath, packageDir));
    let pkgName: string = '';
    if (pkgPath.includes(projectPkgModulesPath)) {
      pkgName = path.join(PACKAGES, pkgPath.replace(projectPkgModulesPath, ''));
    } else {
      for (const key in this.projectConfig.modulePathMap) {
        const value: string = this.projectConfig.modulePathMap[key];
        const fakeModulePkgModulesPath: string = toUnixPath(path.resolve(value, packageDir));
        if (pkgPath.indexOf(fakeModulePkgModulesPath) !== -1) {
          const tempFilePath: string = pkgPath.replace(projectRootPath, '');
          pkgName = path.join(`${PACKAGES}@${key}`,
            tempFilePath.substring(tempFilePath.indexOf(packageDir) + packageDir.length + 1));
          break;
        }
      }
    }

    return pkgName.replace(new RegExp(packageDir, 'g'), PACKAGES);
  }

  private generateProtoFilesInfo() {
    validateFilePathLength(this.protoFilePath, this.logger);
    mkdirsSync(path.dirname(this.protoFilePath));
    let protoFilesInfo: string = '';
    const sortModuleInfos: Object = new Map([...this.moduleInfos].sort());
    for (const value of sortModuleInfos.values()) {
      const cacheProtoPath: string = changeFileExtension(value.cacheFilePath, EXTNAME_PROTO_BIN);
      protoFilesInfo += `${toUnixPath(cacheProtoPath)}\n`;
    }
    if (this.pkgEntryInfos.size > 0) {
      protoFilesInfo += `${toUnixPath(this.npmEntriesProtoFilePath)}\n`;
    }
    fs.writeFileSync(this.protoFilePath, protoFilesInfo, 'utf-8');
  }

  private mergeProtoToAbc() {
    mkdirsSync(this.projectConfig.aceModuleBuild);
    const cmd: string = `"${this.arkConfig.mergeAbcPath}" --input "@${this.protoFilePath}" --outputFilePath "${this.projectConfig.aceModuleBuild}" --output ${MODULES_ABC} --suffix protoBin`;
    try {
      childProcess.execSync(cmd, { windowsHide: true });
    } catch (e) {
      this.throwArkTsCompilerError('ArkTS:INTERNAL ERROR: Failed to merge proto file to abc.\n' +
        'Error message:' + e.toString());
    }
  }

  private afterCompilationProcess() {
    this.writeHashJson();
  }

  private writeHashJson() {
    if (this.hashJsonFilePath.length === 0) {
      return;
    }

    for (const value of this.filterModuleInfos.values()) {
      const cacheFilePath: string = value.cacheFilePath;
      const cacheProtoFilePath: string = changeFileExtension(cacheFilePath, EXTNAME_PROTO_BIN);
      if (!fs.existsSync(cacheFilePath) || !fs.existsSync(cacheProtoFilePath)) {
        this.throwArkTsCompilerError(
          `ArkTS:ERROR ${cacheFilePath} or  ${cacheProtoFilePath} is lost`
        );
      }
      const hashCacheFileContentData: string = toHashData(cacheFilePath);
      const hashCacheProtoContentData: string = toHashData(cacheProtoFilePath);
      this.hashJsonObject[cacheFilePath] = hashCacheFileContentData;
      this.hashJsonObject[cacheProtoFilePath] = hashCacheProtoContentData;
    }

    fs.writeFileSync(this.hashJsonFilePath, JSON.stringify(this.hashJsonObject));
  }

  private generateNpmEntryToGenProto() {
    if (this.pkgEntryInfos.size <= 0) {
      return;
    }
    mkdirsSync(path.dirname(this.npmEntriesProtoFilePath));
    const cmd: string = `"${this.arkConfig.js2abcPath}" --compile-npm-entries "${this.npmEntriesInfoPath}" "${this.npmEntriesProtoFilePath}"`;
    try {
      childProcess.execSync(cmd, { windowsHide: true });
    } catch (e) {
      this.throwArkTsCompilerError(`ArkTS:ERROR failed to generate npm proto file to abc. Error message: ` + e.toString());
    }
  }

  private removeCompilationCache(): void {
    if (isEs2Abc(this.projectConfig)) {
      this.removeEs2abcCompilationCache();
    } else if (isTs2Abc(this.projectConfig)) {
      this.removeTs2abcCompilationCache();
    } else {
      this.throwArkTsCompilerError(`Invalid projectConfig.pandaMode for module build, should be either
      "${TS2ABC}" or "${ES2ABC}"`);
    }
  }

  private removeEs2abcCompilationCache(): void {
    if (fs.existsSync(this.cacheFilePath)) {
      const data: string = fs.readFileSync(this.cacheFilePath, 'utf-8');
      const lines: string[] = data.split(/\r?\n/);
      lines.forEach(line => {
        const [, abcCacheFilePath]: string[] = line.split(';');
        if (fs.existsSync(abcCacheFilePath)) {
          fs.unlinkSync(abcCacheFilePath);
        }
      });
      fs.unlinkSync(this.cacheFilePath);
    }
  }

  private removeTs2abcCompilationCache(): void {
    if (fs.existsSync(this.hashJsonFilePath)) {
      fs.unlinkSync(this.hashJsonFilePath);
    }
    if (fs.existsSync(this.protoFilePath)) {
      const data: string = fs.readFileSync(this.protoFilePath, 'utf-8');
      const lines: string[] = data.split(/\r?\n/);
      lines.forEach(line => {
        const protoFilePath: string = line;
        if (fs.existsSync(protoFilePath)) {
          fs.unlinkSync(protoFilePath);
        }
      });
      fs.unlinkSync(this.protoFilePath);
    }
  }

  private modifySourceMapKeyToCachePath(sourceMap: object): void {
    const projectConfig: object = this.projectConfig;

    // modify source map keys to keep IDE tools right
    const relativeCachePath: string = toUnixPath(projectConfig.cachePath.replace(
      projectConfig.projectRootPath + path.sep, ''));
    Object.keys(sourceMap).forEach(key => {
      let newKey: string = relativeCachePath + '/' + key;
      if (!newKey.endsWith(EXTNAME_JS)) {
        const moduleId: string = this.projectConfig.projectRootPath + path.sep + key;
        const extName: string = shouldETSOrTSFileTransformToJS(moduleId, this.projectConfig) ? EXTNAME_JS : EXTNAME_TS;
        newKey = changeFileExtension(newKey, extName);
      }
      const isOhModules = key.startsWith('oh_modules');
      newKey = this.handleObfuscatedFilePath(newKey, isOhModules);
      sourceMap[newKey] = sourceMap[key];
      delete sourceMap[key];
    });
  }
}
