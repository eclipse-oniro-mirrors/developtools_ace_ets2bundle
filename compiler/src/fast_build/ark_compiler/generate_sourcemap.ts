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

import path from 'path';
import fs from 'fs';
import {
  EXTNAME_ETS,
  EXTNAME_JS,
  EXTNAME_TS,
  EXTNAME_MJS,
  EXTNAME_CJS,
  SOURCEMAPS,
  SOURCEMAPS_JSON,
  yellow,
  reset
} from "./common/ark_define";
import {
  changeFileExtension,
  isCommonJsPluginVirtualFile,
  isCurrentProjectFiles,
  isDebug,
  shouldETSOrTSFileTransformToJS
} from "./utils";
import {
  toUnixPath,
  isPackageModulesFile,
  getProjectRootPath
} from "../../utils";
import {
  handleObfuscatedFilePath,
  mangleFilePath,
  enableObfuscateFileName
} from './common/ob_config_resolver';
import { MemoryMonitor } from '../meomry_monitor/rollup-plugin-memory-monitor';
import { MemoryDefine } from '../meomry_monitor/memory_define';
import {
  ArkTSInternalErrorDescription,
  ErrorCode
} from './error_code';
import {
  CommonLogger,
  LogData,
  LogDataFactory
} from './logger';
import {
  createAndStartEvent,
  CompileEvent,
  stopEvent
} from '../../performance';
import { BytecodeObfuscator } from './bytecode_obfuscator';

let isShouldSourceMap: boolean = true;

export class SourceMapGenerator {
  private static instance: SourceMapGenerator | undefined = undefined;
  private static rollupObject: Object | undefined;

  private projectConfig: Object;
  private sourceMapPath: string;
  private cacheSourceMapPath: string;
  private sourceMapForMergePath: string;
  private sourceMapsResult: Object = {};
  private triggerAsync: Object;
  private triggerEndSignal: Object;
  private sourceMaps: Object = {};
  private isNewSourceMap: boolean = true;
  private keyCache: Map<string, string> = new Map();
  private logger: CommonLogger;
  private isCompileSingle: boolean = false;

  public sourceMapKeyMappingForObf: Map<string, string> = new Map();

  constructor(rollupObject: Object) {
    this.projectConfig = Object.assign(rollupObject.share.arkProjectConfig, rollupObject.share.projectConfig);
    this.sourceMapPath = this.getSourceMapSavePath();
    this.cacheSourceMapPath = path.join(this.projectConfig.cachePath, SOURCEMAPS_JSON);
    this.sourceMapForMergePath = this.cacheSourceMapPath.replace('.json', 'Merge.json');
    this.triggerAsync = rollupObject.async;
    this.triggerEndSignal = rollupObject.signal;
    this.logger = CommonLogger.getInstance(rollupObject);
  }

  static init(rollupObject: Object): void {
    SourceMapGenerator.rollupObject = rollupObject;
    SourceMapGenerator.instance = new SourceMapGenerator(SourceMapGenerator.rollupObject);

    // adapt compatibility with hvigor
    if (!SourceMapGenerator.instance.projectConfig.entryPackageName ||
      !SourceMapGenerator.instance.projectConfig.entryModuleVersion) {
      SourceMapGenerator.instance.isNewSourceMap = false;
    }

    if ((SourceMapGenerator.instance.projectConfig.hotReload &&
      SourceMapGenerator.instance.projectConfig.watchMode !== 'true') ||
      (SourceMapGenerator.instance.projectConfig.coldReload)) {
      isShouldSourceMap = SourceMapGenerator.instance.projectConfig.isFirstBuild;
    }

    SourceMapGenerator.instance.isCompileSingle = SourceMapGenerator.instance.isNewSourceMap &&
      SourceMapGenerator.instance.projectConfig.singleFileEmit && isShouldSourceMap;

    if (SourceMapGenerator.instance.projectConfig.hotReload) {
      isShouldSourceMap = false;
    }
  }

  static getInstance(): SourceMapGenerator {
    if (!SourceMapGenerator.instance) {
      SourceMapGenerator.instance = new SourceMapGenerator(SourceMapGenerator.rollupObject);
    }
    return SourceMapGenerator.instance;
  }

  //In window plateform, if receive path join by '/', should transform '/' to '\'
  private getAdaptedModuleId(moduleId: string): string {
    return moduleId.replace(/\//g, path.sep);
  }

  private getPkgInfoByModuleId(moduleId: string, shouldObfuscateFileName: boolean = false): Object {
    moduleId = this.getAdaptedModuleId(moduleId);

    const moduleInfo: Object = SourceMapGenerator.rollupObject.getModuleInfo(moduleId);
    if (!moduleInfo) {
      const errInfo: LogData = LogDataFactory.newInstance(
        ErrorCode.ETS2BUNDLE_INTERNAL_GET_MODULE_INFO_FAILED,
        ArkTSInternalErrorDescription,
        `Failed to get ModuleInfo, moduleId: ${moduleId}`,
        '',
        [`Please check if the imported file ${moduleId} includes the .js suffix.`]
      );
      this.logger.printErrorAndExit(errInfo);
    }
    const metaInfo: Object = moduleInfo['meta'];
    if (!metaInfo) {
      const errInfo: LogData = LogDataFactory.newInstance(
        ErrorCode.ETS2BUNDLE_INTERNAL_UNABLE_TO_GET_MODULE_INFO_META,
        ArkTSInternalErrorDescription,
        `Failed to get ModuleInfo properties 'meta', moduleId: ${moduleId}`
      );
      this.logger.printErrorAndExit(errInfo);
    }
    const pkgPath = metaInfo['pkgPath'];
    if (!pkgPath) {
      const errInfo: LogData = LogDataFactory.newInstance(
        ErrorCode.ETS2BUNDLE_INTERNAL_UNABLE_TO_GET_MODULE_INFO_META_PKG_PATH,
        ArkTSInternalErrorDescription,
        `Failed to get ModuleInfo properties 'meta.pkgPath', moduleId: ${moduleId}`
      );
      this.logger.printErrorAndExit(errInfo);
    }

    const dependencyPkgInfo = metaInfo['dependencyPkgInfo'];
    let middlePath = this.getIntermediateModuleId(moduleId, metaInfo).replace(pkgPath + path.sep, '');
    if (shouldObfuscateFileName) {
      middlePath = mangleFilePath(middlePath);
    }
    return {
      entry: {
        name: this.projectConfig.entryPackageName,
        version: this.projectConfig.entryModuleVersion
      },
      dependency: dependencyPkgInfo ? {
        name: dependencyPkgInfo['pkgName'],
        version: dependencyPkgInfo['pkgVersion']
      } : undefined,
      modulePath: toUnixPath(middlePath)
    };
  }

  public setNewSoureMaps(isNewSourceMap: boolean): void {
    this.isNewSourceMap = isNewSourceMap;
  }

  public isNewSourceMaps(): boolean {
    return this.isNewSourceMap;
  }

  //generate sourcemap key, notice: moduleId is absolute path
  public genKey(moduleId: string, shouldObfuscateFileName: boolean = false): string {
    moduleId = this.getAdaptedModuleId(moduleId);

    let key: string = this.keyCache.get(moduleId);
    if (key && !shouldObfuscateFileName) {
      return key;
    }
    const pkgInfo = this.getPkgInfoByModuleId(moduleId, shouldObfuscateFileName);
    if (pkgInfo.dependency) {
      key = `${pkgInfo.entry.name}|${pkgInfo.dependency.name}|${pkgInfo.dependency.version}|${pkgInfo.modulePath}`;
    } else {
      key = `${pkgInfo.entry.name}|${pkgInfo.entry.name}|${pkgInfo.entry.version}|${pkgInfo.modulePath}`;
    }
    if (key && !shouldObfuscateFileName) {
      this.keyCache.set(moduleId, key);
    }
    return key;
  }

  private getSourceMapSavePath(): string {
    if (this.projectConfig.compileHar && this.projectConfig.sourceMapDir && !this.projectConfig.byteCodeHar) {
      return path.join(this.projectConfig.sourceMapDir, SOURCEMAPS);
    }
    return isDebug(this.projectConfig) ? path.join(this.projectConfig.aceModuleBuild, SOURCEMAPS) :
      path.join(this.projectConfig.cachePath, SOURCEMAPS);
  }

  public writeModifiedSourceMapToFile(parentEvent: CompileEvent | undefined): void {
    const eventWriteCachedSourceMaps = createAndStartEvent(parentEvent, 'write source maps');
    Object.keys(this.sourceMaps).forEach(key => {
      let keyChanged: string = '';
      if (this.sourceMapKeyMappingForObf.has(key)) {
        keyChanged = this.sourceMapKeyMappingForObf.get(key);
      } else {
        keyChanged = key;
      }
      this.sourceMapsResult[keyChanged] = this.sourceMaps[key];
    });
    this.sourceMaps = {};
    this.sourceMapKeyMappingForObf.clear();
    stopEvent(eventWriteCachedSourceMaps);
  }

  public checkAndWriteEnd(): void {
    if (fs.existsSync(this.sourceMapPath)) {
      fs.unlinkSync(this.sourceMapPath);
    }
    fs.writeFileSync(this.sourceMapPath, JSON.stringify(this.sourceMapsResult, null, 2));
    if (fs.existsSync(this.cacheSourceMapPath)) {
      fs.unlinkSync(this.cacheSourceMapPath);
    }
    fs.copyFileSync(this.sourceMapPath, this.cacheSourceMapPath);
  }

  public writeUsedAndUnmodifiedSourceMapToFile(parentEvent: CompileEvent | undefined): void {
    const eventMergeCachedSourceMaps = createAndStartEvent(parentEvent, 'merge cached source maps');
    let cacheSourceMapInfo: Object = this.getCacheSourceMapInfo();
    if (!cacheSourceMapInfo.exist) {
      this.checkAndWriteEnd();
      stopEvent(eventMergeCachedSourceMaps);
      return;
    }

    const cacheFileContent: string = fs.readFileSync(toUnixPath(cacheSourceMapInfo.path)).toString();
    this.mergeCachedSourceMaps(this.readCachedSourceMaps(cacheFileContent));

    this.checkAndWriteEnd();
    stopEvent(eventMergeCachedSourceMaps);
  }

  private *readCachedSourceMaps(content: string): IterableIterator<[string, Object]> {
    let sourceMaps: Object;
    try {
      sourceMaps = JSON.parse(content);
    } catch (e) {
      const seenKeys: Set<string> = new Set();
      for (const line of content.split(/\r?\n/)) {
        if (line.trim() === '') {
          continue;
        }
        const sourceMap: Object = JSON.parse(line.trim());
        if (seenKeys.has(sourceMap.key)) {
          continue;
        }
        seenKeys.add(sourceMap.key);
        yield [sourceMap.key, sourceMap.val];
      }
      return;
    }
    // A single JSONL record is also valid JSON; distinguish it from the map collection.
    if (typeof sourceMaps?.key === 'string' && Object.prototype.hasOwnProperty.call(sourceMaps, 'val')) {
      yield [sourceMaps.key, sourceMaps.val];
      return;
    }
    for (const key of Object.keys(sourceMaps)) {
      yield [key, sourceMaps[key]];
    }
  }

  private mergeCachedSourceMaps(sourceMaps: Iterable<[string, Object]>): void {
    const compileFileList: Set<string> = this.getCompileFileList();
    const currentKeys: Set<string> = new Set(Object.keys(this.sourceMapsResult));
    const restoredKeys: Map<string, string> = new Map();
    const ambiguousKeys: Set<string> = new Set();
    for (const [key, sourceMap] of sourceMaps) {
      // Keep maps produced this round, including externally supplied bytecode HAR maps.
      if (currentKeys.has(key)) {
        continue;
      }
      const updated = this.updateCachedSourceMapEntry(key, sourceMap);
      if (!compileFileList.has(updated.key) || currentKeys.has(updated.key) || ambiguousKeys.has(updated.key)) {
        continue;
      }
      const restoredKey: string = restoredKeys.get(updated.key);
      if (restoredKey !== undefined) {
        if (restoredKey !== key) {
          ambiguousKeys.add(updated.key);
        }
        continue;
      }
      this.sourceMapsResult[updated.key] = updated.sourceMap;
      restoredKeys.set(updated.key, key);
    }
    if (ambiguousKeys.size > 0) {
      const filteredSourceMaps: Object = {};
      for (const key of Object.keys(this.sourceMapsResult)) {
        if (!ambiguousKeys.has(key)) {
          filteredSourceMaps[key] = this.sourceMapsResult[key];
        }
      }
      this.sourceMapsResult = filteredSourceMaps;
    }
  }

  // Version-only changes can leave all modules cached; refresh entry identities before filtering against this build.
  private updateCachedSourceMapEntry(key: string, sourceMap: Object): { key: string; sourceMap: Object } {
    const unchanged = { key, sourceMap };
    const entryPackageInfo: string = sourceMap?.['entry-package-info'];
    const updatedEntryInfo: string = `${this.projectConfig.entryPackageName}|${this.projectConfig.entryModuleVersion}`;
    if (typeof entryPackageInfo !== 'string' || entryPackageInfo === updatedEntryInfo) {
      return unchanged;
    }
    const entryInfo: string[] = entryPackageInfo.split('|');
    const keyParts: string[] = key.split('|');
    if (entryInfo.length !== 2 || keyParts.length !== 4 ||
      entryInfo[0] !== this.projectConfig.entryPackageName || keyParts[0] !== entryInfo[0]) {
      return unchanged;
    }
    const packageInfo: string = sourceMap['package-info'];
    if (packageInfo !== undefined) {
      // A dependency retains its own package version, even when its name matches the entry.
      if (packageInfo !== `${keyParts[1]}|${keyParts[2]}`) {
        return unchanged;
      }
    } else {
      if (keyParts[1] !== entryInfo[0] || keyParts[2] !== entryInfo[1]) {
        return unchanged;
      }
      keyParts[2] = this.projectConfig.entryModuleVersion;
    }
    return {
      key: keyParts.join('|'),
      sourceMap: { ...sourceMap, 'entry-package-info': updatedEntryInfo }
    };
  }

  public buildModuleSourceMapInfoSingle(parentEvent: CompileEvent | undefined): void {
    if (this.projectConfig.widgetCompile) {
      return;
    }
    if (!this.isCompileSingle) {
      return;
    }
    if (Object.keys(this.sourceMaps).length === 0) {
      return;
    }
    this.writeModifiedSourceMapToFile(parentEvent);
  }

  public buildModuleSourceMapInfo(parentEvent: CompileEvent | undefined): void {
    if (this.projectConfig.widgetCompile) {
      return;
    }

    const eventUpdateCachedSourceMaps = createAndStartEvent(parentEvent, 'update cached source maps');
    // If hap/hsp depends on bytecode har under debug mode, the source map of bytecode har need to be merged with
    // source map of hap/hsp.
    if (isDebug(this.projectConfig) && (!this.projectConfig.byteCodeHar ||
      this.projectConfig.projectArkOption?.bundle?.bundledAllDependencies) && !!this.projectConfig.byteCodeHarInfo) {
      Object.keys(this.projectConfig.byteCodeHarInfo).forEach((packageName) => {
        const sourceMapsPath = this.projectConfig.byteCodeHarInfo[packageName].sourceMapsPath;
        if (!sourceMapsPath && !!this.logger && !!this.logger.warn) {
          this.logger.warn(yellow, `ArkTS:WARN Property 'sourceMapsPath' not found in '${packageName}'.`, reset);
        }
        if (!!sourceMapsPath) {
          const bytecodeHarSourceMap = JSON.parse(fs.readFileSync(toUnixPath(sourceMapsPath)).toString());
          Object.assign(this.sourceMaps, bytecodeHarSourceMap);
        }
      });
    }

    if (this.isNewSourceMap) {
      this.writeModifiedSourceMapToFile(parentEvent);
      this.writeUsedAndUnmodifiedSourceMapToFile(parentEvent);
      return;
    }

    const updateSourceRecordInfo = MemoryMonitor.recordStage(MemoryDefine.UPDATE_SOURCE_MAPS);
    const cacheSourceMapObject: Object = this.updateCachedSourceMaps();
    MemoryMonitor.stopRecordStage(updateSourceRecordInfo);
    stopEvent(eventUpdateCachedSourceMaps);

    this.triggerAsync(() => {
      const eventWriteFile = createAndStartEvent(parentEvent, 'write source map (async)', true);
      fs.writeFile(this.sourceMapPath, JSON.stringify(cacheSourceMapObject, null, 2), 'utf-8', (err) => {
        if (err) {
          const errInfo: LogData = LogDataFactory.newInstance(
            ErrorCode.ETS2BUNDLE_INTERNAL_WRITE_SOURCE_MAP_FAILED,
            ArkTSInternalErrorDescription,
            `Failed to write sourceMaps. ${err.message}`,
            this.sourceMapPath
          );
          this.logger.printErrorAndExit(errInfo);
        }
        fs.copyFileSync(this.sourceMapPath, this.cacheSourceMapPath);
        stopEvent(eventWriteFile, true);
        this.triggerEndSignal();
      });
    });
  }

  public isEmptyFile(filePath: string): boolean {
    const stats = fs.statSync(filePath);
    return stats.size === 0;
  }

  public getCacheSourceMapInfo(): Object {
    let existCacheSourceMap: boolean = false;
    let cacheSourceMapPath: string = '';
    let cacheSourceMapPathTmp: string = '';
    /**
     * bytecode obfuscation requires that the input sourceMap must be unobfuscated,
     * the sourceMap will be saved in the cache directory before the first bytecode obfuscation,
     * and it will as the input for merging sourceMap during incremental compilation.
     */
    if (BytecodeObfuscator.enable) {
      cacheSourceMapPathTmp = BytecodeObfuscator.getInstance().getBackupSourceMapPath();
      if (fs.existsSync(cacheSourceMapPathTmp) && !this.isEmptyFile(cacheSourceMapPathTmp)) {
        existCacheSourceMap = true;
        cacheSourceMapPath = cacheSourceMapPathTmp;
      }
    }

    cacheSourceMapPathTmp = this.cacheSourceMapPath;
    if (!existCacheSourceMap && fs.existsSync(cacheSourceMapPathTmp) && !this.isEmptyFile(cacheSourceMapPathTmp)) {
      existCacheSourceMap = true;
      cacheSourceMapPath = cacheSourceMapPathTmp;
    }

    return { exist: existCacheSourceMap, path: cacheSourceMapPath };
  }

  //update cache sourcemap object
  public updateCachedSourceMaps(): Object {
    if (!this.isNewSourceMap) {
      this.modifySourceMapKeyToCachePath(this.sourceMaps);
    }

    let cacheSourceMapObject: Object = null;
    let cacheSourceMapInfo: Object = this.getCacheSourceMapInfo();
    if (!cacheSourceMapInfo.exist) {
      cacheSourceMapObject = this.sourceMaps;
    } else {
      cacheSourceMapObject = JSON.parse(fs.readFileSync(cacheSourceMapInfo.path).toString().trim());
      // remove unused source files's sourceMap
      let unusedFiles = [];
      let compileFileList: Set<string> = this.getCompileFileList();

      Object.keys(cacheSourceMapObject).forEach(key => {
        let newkeyOrOldCachePath = key;
        if (!this.isNewSourceMap) {
          newkeyOrOldCachePath = toUnixPath(path.join(this.projectConfig.projectRootPath, key));
        }
        if (!compileFileList.has(newkeyOrOldCachePath)) {
          unusedFiles.push(key);
        }
      });
      unusedFiles.forEach(file => {
        delete cacheSourceMapObject[file];
      })

      // update sourceMap
      Object.keys(this.sourceMaps).forEach(key => {
        cacheSourceMapObject[key] = this.sourceMaps[key];
      });
    }
    // update the key for filename obfuscation
    for (let [key, newKey] of this.sourceMapKeyMappingForObf) {
      this.updateSourceMapKeyWithObf(cacheSourceMapObject, key, newKey);
    }
    return cacheSourceMapObject;
  }

  public getCompileFileList(): Set<string> {
    let compileFileList: Set<string> = new Set();
    for (let moduleId of SourceMapGenerator.rollupObject.getModuleIds()) {
      // exclude .dts|.d.ets file
      if (isCommonJsPluginVirtualFile(moduleId) || !isCurrentProjectFiles(moduleId, this.projectConfig)) {
        continue;
      }

      if (this.isNewSourceMap) {
        const isPackageModules = isPackageModulesFile(moduleId, this.projectConfig);
        if (enableObfuscateFileName(isPackageModules, this.projectConfig)) {
          compileFileList.add(this.genKey(moduleId, true));
        } else {
          compileFileList.add(this.genKey(moduleId));
        }
        continue;
      }

      // adapt compatibilty with hvigor
      const projectRootPath = getProjectRootPath(moduleId, this.projectConfig, this.projectConfig?.rootPathSet);
      let cacheModuleId = this.getIntermediateModuleId(toUnixPath(moduleId))
        .replace(toUnixPath(projectRootPath), toUnixPath(this.projectConfig.cachePath));

      const isPackageModules = isPackageModulesFile(moduleId, this.projectConfig);
      if (enableObfuscateFileName(isPackageModules, this.projectConfig)) {
        compileFileList.add(mangleFilePath(cacheModuleId));
      } else {
        compileFileList.add(cacheModuleId);
      }
    }
    return compileFileList;
  }

  public getSourceMaps(): Object {
    return this.sourceMaps;
  }

  public getSourceMap(moduleId: string): Object {
    return this.getSpecifySourceMap(this.sourceMaps, moduleId);
  }

  //get specify sourcemap, allow receive param sourcemap
  public getSpecifySourceMap(specifySourceMap: Object, moduleId: string): Object {
    const key = this.isNewSourceMap ? this.genKey(moduleId) : moduleId;
    if (specifySourceMap && specifySourceMap[key]) {
      return specifySourceMap[key];
    }
    return undefined;
  }

  public updateSourceMap(moduleId: string, map: Object) {
    if (!this.sourceMaps) {
      this.sourceMaps = {};
    }
    this.updateSpecifySourceMap(this.sourceMaps, moduleId, map);
  }

  //update specify sourcemap, allow receive param sourcemap
  public updateSpecifySourceMap(specifySourceMap: Object, moduleId: string, sourceMap: Object) {
    const key = this.isNewSourceMap ? this.genKey(moduleId) : moduleId;
    specifySourceMap[key] = sourceMap;
  }

  public fillSourceMapPackageInfo(moduleId: string, sourcemap: Object) {
    if (!this.isNewSourceMap) {
      return;
    }

    const pkgInfo = this.getPkgInfoByModuleId(moduleId);
    sourcemap['entry-package-info'] = `${pkgInfo.entry.name}|${pkgInfo.entry.version}`;
    if (pkgInfo.dependency) {
      sourcemap['package-info'] = `${pkgInfo.dependency.name}|${pkgInfo.dependency.version}`;
    }
  }

  private getIntermediateModuleId(moduleId: string, metaInfo?: Object): string {
    let extName: string = "";
    switch (path.extname(moduleId)) {
      case EXTNAME_ETS: {
        extName = shouldETSOrTSFileTransformToJS(moduleId, this.projectConfig, metaInfo) ? EXTNAME_JS : EXTNAME_TS;
        break;
      }
      case EXTNAME_TS: {
        extName = shouldETSOrTSFileTransformToJS(moduleId, this.projectConfig, metaInfo) ? EXTNAME_JS : '';
        break;
      }
      case EXTNAME_JS:
      case EXTNAME_MJS:
      case EXTNAME_CJS: {
        extName = (moduleId.endsWith(EXTNAME_MJS) || moduleId.endsWith(EXTNAME_CJS)) ? EXTNAME_JS : '';
        break;
      }
      default:
        break;
    }
    if (extName.length !== 0) {
      return changeFileExtension(moduleId, extName);
    }
    return moduleId;
  }

  public setSourceMapPath(path: string): void {
    this.sourceMapPath = path;
  }

  public modifySourceMapKeyToCachePath(sourceMap: object): void {
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
      newKey = handleObfuscatedFilePath(newKey, isOhModules, this.projectConfig);
      sourceMap[newKey] = sourceMap[key];
      delete sourceMap[key];
    });
  }

  public static cleanSourceMapObject(): void {
    if (this.instance) {
      this.instance.keyCache.clear();
      this.instance.sourceMaps = undefined;
      this.instance = undefined;
    }
    if (this.rollupObject) {
      this.rollupObject = undefined;
    }
  }

  private updateSourceMapKeyWithObf(specifySourceMap: Object, key: string, newKey: string): void {
    if (!specifySourceMap.hasOwnProperty(key) || key === newKey) {
      return;
    }
    specifySourceMap[newKey] = specifySourceMap[key];
    delete specifySourceMap[key];
  }

  public saveKeyMappingForObfFileName(originalFilePath: string): void {
    this.sourceMapKeyMappingForObf.set(this.genKey(originalFilePath), this.genKey(originalFilePath, true));
  }

  //use by UT
  static initInstance(rollupObject: Object): SourceMapGenerator {
    if (!SourceMapGenerator.instance) {
      SourceMapGenerator.init(rollupObject);
    }
    return SourceMapGenerator.getInstance();
  }
}
