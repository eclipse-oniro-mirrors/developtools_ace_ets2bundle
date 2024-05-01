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

import path from 'path';
import fs from 'fs';
import type sourceMap from 'source-map';

import { minify, MinifyOutput } from 'terser';
import { getMapFromJson, deleteLineInfoForNameString, MemoryUtils } from 'arkguard';

import { OH_MODULES } from './fast_build/ark_compiler/common/ark_define';
import {
  ARKTS_MODULE_NAME,
  PACKAGES,
  TEMPORARY,
  ZERO,
  ONE,
  EXTNAME_JS,
  EXTNAME_TS,
  EXTNAME_MJS,
  EXTNAME_CJS,
  EXTNAME_ABC,
  EXTNAME_ETS,
  EXTNAME_TS_MAP,
  EXTNAME_JS_MAP,
  ESMODULE,
  FAIL,
  TS2ABC,
  ES2ABC,
  EXTNAME_PROTO_BIN,
  NATIVE_MODULE
} from './pre_define';
import {
  isMac,
  isWindows,
  isPackageModulesFile,
  genTemporaryPath,
  getExtensionIfUnfullySpecifiedFilepath,
  mkdirsSync,
  toUnixPath,
  validateFilePathLength,
  harFilesRecord,
} from './utils';
import type { GeneratedFileInHar } from './utils';
import {
  extendSdkConfigs,
  projectConfig,
  sdkConfigPrefix
} from '../main';
import { mangleFilePath } from './fast_build/ark_compiler/common/ob_config_resolver';
import { moduleRequestCallback } from './fast_build/system_api/api_check_utils';
import { performancePrinter } from 'arkguard/lib/ArkObfuscator';
import { SourceMapGenerator } from './fast_build/ark_compiler/generate_sourcemap';

const red: string = '\u001b[31m';
const reset: string = '\u001b[39m';
const IDENTIFIER_CACHE: string = 'IdentifierCache';

export const SRC_MAIN: string = 'src/main';

export var newSourceMaps: Object = {};
export var nameCacheObj: Object = {};
export const packageCollection: Map<string, Array<string>> = new Map();
// Splicing ohmurl or record name based on filePath and context information table. 
export function getNormalizedOhmUrlByFilepath(filePath: string, projectConfig: Object, logger: Object,
  pkgParams: Object, importerFile: string): string {
  const { pkgName, pkgPath, isRecordName } = pkgParams;
  // rollup uses commonjs plugin to handle commonjs files,
  // the commonjs files are prefixed with '\x00' and need to be removed.
  if (filePath.startsWith('\x00')) {
    filePath = filePath.replace('\x00', '');
  }
  let unixFilePath: string = toUnixPath(filePath);
  unixFilePath = unixFilePath.substring(0, filePath.lastIndexOf('.')); // remove extension
  let projectFilePath: string = unixFilePath.replace(toUnixPath(pkgPath), '');
  // case1: /entry/src/main/ets/xxx/yyy
  // case2: /entry/src/ohosTest/ets/xxx/yyy
  // case3: /node_modules/xxx/yyy
  // case4: /entry/node_modules/xxx/yyy
  // case5: /library/node_modules/xxx/yyy
  // case6: /library/index.ts
  // ---> @normalized:N&<moduleName>&<bunldName>&<packageName>/entry/ets/xxx/yyy&<version>
  let pkgInfo = projectConfig.pkgContextInfo[pkgName];
  if (pkgInfo === undefined) {
    logger.error(red,
      `ArkTS:ERROR Failed to get a resolved OhmUrl for "${filePath}" imported by "${importerFile}". ` +
      `Please check whether the module which ${filePath} belongs to is correctly configured ` +
      `and the corresponding file name is correct(including case-sensitivity)`, reset);
  }
  let recordName = `${pkgInfo.bundleName}&${pkgName}${projectFilePath}&${pkgInfo.version}`;
  if (isRecordName) {
    // record name style: <bunldName>&<packageName>/entry/ets/xxx/yyy&<version>
    return recordName;
  }
  return `${pkgInfo.isSO ? 'Y' : 'N'}&${pkgInfo.moduleName}&${recordName}`;
}

export function getOhmUrlByFilepath(filePath: string, projectConfig: Object, logger: Object, namespace?: string,
  importerFile?: string): string {
  // remove '\x00' from the rollup virtual commonjs file's filePath
  if (filePath.startsWith('\x00')) {
    filePath = filePath.replace('\x00', '');
  }
  let unixFilePath: string = toUnixPath(filePath);
  unixFilePath = unixFilePath.substring(0, filePath.lastIndexOf('.')); // remove extension
  const REG_PROJECT_SRC: RegExp = /(\S+)\/src\/(?:main|ohosTest)\/(ets|js|mock)\/(\S+)/;

  const packageInfo: string[] = getPackageInfo(projectConfig.aceModuleJsonPath);
  const bundleName: string = packageInfo[0];
  const moduleName: string = packageInfo[1];
  const moduleRootPath: string = toUnixPath(projectConfig.modulePathMap[moduleName]);
  const projectRootPath: string = toUnixPath(projectConfig.projectRootPath);
  // case1: /entry/src/main/ets/xxx/yyy     ---> @bundle:<bundleName>/entry/ets/xxx/yyy
  // case2: /entry/src/ohosTest/ets/xxx/yyy ---> @bundle:<bundleName>/entry_test@entry/ets/xxx/yyy
  // case3: /node_modules/xxx/yyy           ---> @package:pkg_modules/xxx/yyy
  // case4: /entry/node_modules/xxx/yyy     ---> @package:pkg_modules@entry/xxx/yyy
  // case5: /library/node_modules/xxx/yyy   ---> @package:pkg_modules@library/xxx/yyy
  // case6: /library/index.ts               ---> @bundle:<bundleName>/library/index
  const projectFilePath: string = unixFilePath.replace(projectRootPath, '');
  const packageDir: string = projectConfig.packageDir;
  const result: RegExpMatchArray | null = projectFilePath.match(REG_PROJECT_SRC);
  if (result && result[1].indexOf(packageDir) === -1) {
    const relativePath = processSrcMain(result, projectFilePath);
    if (namespace && moduleName !== namespace) {
      return `${bundleName}/${moduleName}@${namespace}/${relativePath}`;
    }
    return `${bundleName}/${moduleName}/${relativePath}`;
  }

  const processParams: Object = {
    projectFilePath,
    unixFilePath,
    packageDir,
    projectRootPath,
    moduleRootPath,
    projectConfig,
    namespace,
    logger,
    importerFile,
    originalFilePath: filePath
  };
  return processPackageDir(processParams);
}

function processSrcMain(result: RegExpMatchArray | null, projectFilePath: string): string {
  let langType: string = result[2];
  let relativePath: string = result[3];
  // case7: /entry/src/main/ets/xxx/src/main/js/yyy ---> @bundle:<bundleName>/entry/ets/xxx/src/main/js/yyy
  const REG_SRC_MAIN: RegExp = /src\/(?:main|ohosTest)\/(ets|js)\//;
  const srcMainIndex: number = result[1].search(REG_SRC_MAIN);
  if (srcMainIndex !== -1) {
    relativePath = projectFilePath.substring(srcMainIndex).replace(REG_SRC_MAIN, '');
    langType = projectFilePath.replace(relativePath, '').match(REG_SRC_MAIN)[1];
  }
  return `${langType}/${relativePath}`;
}

function processPackageDir(params: Object): string {
  const { projectFilePath, unixFilePath, packageDir, projectRootPath, moduleRootPath,
    projectConfig, namespace, logger, importerFile, originalFilePath } = params;
  if (projectFilePath.indexOf(packageDir) !== -1) {
    if (compileToolIsRollUp()) {
      const tryProjectPkg: string = toUnixPath(path.join(projectRootPath, packageDir));
      if (unixFilePath.indexOf(tryProjectPkg) !== -1) {
        return unixFilePath.replace(tryProjectPkg, `${packageDir}`).replace(new RegExp(packageDir, 'g'), PACKAGES);
      }

      // iterate the modulePathMap to find the module which contains the pkg_module's file
      for (const moduleName in projectConfig.modulePathMap) {
        const modulePath: string = projectConfig.modulePathMap[moduleName];
        const tryModulePkg: string = toUnixPath(path.resolve(modulePath, packageDir));
        if (unixFilePath.indexOf(tryModulePkg) !== -1) {
          return unixFilePath.replace(tryModulePkg, `${packageDir}@${moduleName}`).replace(new RegExp(packageDir, 'g'), PACKAGES);
        }
      }

      logger.error(red,
        `ArkTS:ERROR Failed to get a resolved OhmUrl for "${originalFilePath}" imported by "${importerFile}". ` +
        `Please check whether the module which ${originalFilePath} belongs to is correctly configured ` +
        `and the corresponding file name is correct(including case-sensitivity)`, reset);
      return originalFilePath;
    }

    // webpack with old implematation
    const tryProjectPkg: string = toUnixPath(path.join(projectRootPath, packageDir));
    if (unixFilePath.indexOf(tryProjectPkg) !== -1) {
      return unixFilePath.replace(tryProjectPkg, `${packageDir}/${ONE}`).replace(new RegExp(packageDir, 'g'), PACKAGES);
    }

    const tryModulePkg: string = toUnixPath(path.join(moduleRootPath, packageDir));
    if (unixFilePath.indexOf(tryModulePkg) !== -1) {
      return unixFilePath.replace(tryModulePkg, `${packageDir}/${ZERO}`).replace(new RegExp(packageDir, 'g'), PACKAGES);
    }
  }

  const packageInfo: string[] = getPackageInfo(projectConfig.aceModuleJsonPath);
  const bundleName: string = packageInfo[0];
  const moduleName: string = packageInfo[1];
  for (const key in projectConfig.modulePathMap) {
    const moduleRootPath: string = toUnixPath(projectConfig.modulePathMap[key]);
    if (unixFilePath.indexOf(moduleRootPath + '/') !== -1) {
      const relativeModulePath: string = unixFilePath.replace(moduleRootPath + '/', '');
      if (namespace && moduleName !== namespace) {
        return `${bundleName}/${moduleName}@${namespace}/${relativeModulePath}`;
      }
      return `${bundleName}/${moduleName}/${relativeModulePath}`;
    }
  }

  logger.error(red,
    `ArkTS:ERROR Failed to get a resolved OhmUrl for "${originalFilePath}" imported by "${importerFile}". ` +
    `Please check whether the module which ${originalFilePath} belongs to is correctly configured ` +
    `and the corresponding file name is correct(including case-sensitivity)`, reset);
  return originalFilePath;
}


export function getOhmUrlBySystemApiOrLibRequest(moduleRequest: string, config?: Object,
  useNormalizedOHMUrl: boolean = false): string {
  // 'arkui-x' represents cross platform related APIs, processed as 'ohos'
  const REG_SYSTEM_MODULE: RegExp = new RegExp(`@(${sdkConfigPrefix})\\.(\\S+)`);
  const REG_LIB_SO: RegExp = /lib(\S+)\.so/;

  if (REG_SYSTEM_MODULE.test(moduleRequest.trim())) {
    return moduleRequest.replace(REG_SYSTEM_MODULE, (_, moduleType, systemKey) => {
      let moduleRequestStr = '';
      if (extendSdkConfigs) {
        moduleRequestStr = moduleRequestCallback(moduleRequest, _, moduleType, systemKey);
      }
      if (moduleRequestStr !== '') {
        return moduleRequestStr;
      }
      const systemModule: string = `${moduleType}.${systemKey}`;
      if (NATIVE_MODULE.has(systemModule)) {
        return `@native:${systemModule}`;
      } else if (moduleType === ARKTS_MODULE_NAME) {
        // @arkts.xxx -> @ohos:arkts.xxx
        return `@ohos:${systemModule}`;
      } else {
        return `@ohos:${systemKey}`;
      };
    });
  }
  if (REG_LIB_SO.test(moduleRequest.trim())) {
    if (useNormalizedOHMUrl) {
      const pkgInfo = config.pkgContextInfo[moduleRequest];
      const isSo = pkgInfo.isSO ? 'Y' : 'N';
      return `@normalized:${isSo}&${pkgInfo.moduleName}&${pkgInfo.bundleName}&${moduleRequest}&${pkgInfo.version}`;
    }
    return moduleRequest.replace(REG_LIB_SO, (_, libsoKey) => {
      return `@app:${projectConfig.bundleName}/${projectConfig.moduleName}/${libsoKey}`;
    });
  }
  return undefined;
}

export function genSourceMapFileName(temporaryFile: string): string {
  let abcFile: string = temporaryFile;
  if (temporaryFile.endsWith(EXTNAME_TS)) {
    abcFile = temporaryFile.replace(/\.ts$/, EXTNAME_TS_MAP);
  } else {
    abcFile = temporaryFile.replace(/\.js$/, EXTNAME_JS_MAP);
  }
  return abcFile;
}

export function getBuildModeInLowerCase(projectConfig: Object): string {
  return (compileToolIsRollUp() ? projectConfig.buildMode : projectConfig.buildArkMode).toLowerCase();
}

export function writeFileSyncByString(sourcePath: string, sourceCode: string, projectConfig: Object, logger: Object): void {
  const filePath: string = genTemporaryPath(sourcePath, projectConfig.projectPath, process.env.cachePath, projectConfig);
  if (filePath.length === 0) {
    return;
  }
  mkdirsSync(path.dirname(filePath));
  if (/\.js$/.test(sourcePath)) {
    sourceCode = transformModuleSpecifier(sourcePath, sourceCode, projectConfig);
    if (projectConfig.buildArkMode === 'debug') {
      fs.writeFileSync(filePath, sourceCode);
      return;
    }
    writeObfuscatedSourceCode(sourceCode, filePath, logger, projectConfig);
  }
  if (/\.json$/.test(sourcePath)) {
    fs.writeFileSync(filePath, sourceCode);
  }
}

export function transformModuleSpecifier(sourcePath: string, sourceCode: string, projectConfig: Object): string {
  // replace relative moduleSpecifier with ohmURl
  const REG_RELATIVE_DEPENDENCY: RegExp = /(?:import|from)(?:\s*)['"]((?:\.\/|\.\.\/)[^'"]+|(?:\.\/?|\.\.\/?))['"]/g;
  const REG_HAR_DEPENDENCY: RegExp = /(?:import|from)(?:\s*)['"]([^\.\/][^'"]+)['"]/g;
  // replace requireNapi and requireNativeModule with import
  const REG_REQUIRE_NATIVE_MODULE: RegExp = /var (\S+) = globalThis.requireNativeModule\(['"](\S+)['"]\);/g;
  const REG_REQUIRE_NAPI_APP: RegExp = /var (\S+) = globalThis.requireNapi\(['"](\S+)['"], true, ['"](\S+)['"]\);/g;
  const REG_REQUIRE_NAPI_OHOS: RegExp = /var (\S+) = globalThis.requireNapi\(['"](\S+)['"]\);/g;

  return sourceCode.replace(REG_HAR_DEPENDENCY, (item, moduleRequest) => {
    return replaceHarDependency(item, moduleRequest, projectConfig);
  }).replace(REG_RELATIVE_DEPENDENCY, (item, moduleRequest) => {
    return replaceRelativeDependency(item, moduleRequest, toUnixPath(sourcePath), projectConfig);
  }).replace(REG_REQUIRE_NATIVE_MODULE, (_, moduleRequest, moduleName) => {
    return `import ${moduleRequest} from '@native:${moduleName}';`;
  }).replace(REG_REQUIRE_NAPI_APP, (_, moduleRequest, soName, moudlePath) => {
    return `import ${moduleRequest} from '@app:${moudlePath}/${soName}';`;
  }).replace(REG_REQUIRE_NAPI_OHOS, (_, moduleRequest, moduleName) => {
    return `import ${moduleRequest} from '@ohos:${moduleName}';`;
  });
}

function removeSuffix(filePath: string) {
  const SUFFIX_REG = /\.(?:d\.)?e?ts$/;
  return filePath.split(path.sep).join('/').replace(SUFFIX_REG, '');
}

export function getNormalizedOhmUrlByHspName(aliasName: string, projectConfig: Object,
  logger?: Object, filePath?: string) {
  let pkgName: string = aliasName;
  const aliasPkgNameMap: Map<string, string> = projectConfig.dependencyAliasMap;
  if (aliasPkgNameMap.has(aliasName)) {
    pkgName = aliasPkgNameMap.get(aliasName);
  }
  const pkgInfo: Object = projectConfig.pkgContextInfo[pkgName];
  if (pkgInfo === undefined) {
    logger.error(red, `ArkTS:INTERNAL ERROR: package ${pkgName} not found`, reset);
  }
  let normalizedPath: string = '';
  if (filePath === undefined) {
    normalizedPath = `${pkgName}/${toUnixPath(pkgInfo.entryPath)}`;
    normalizedPath = removeSuffix(normalizedPath);
  } else {
    const relativePath = toUnixPath(filePath).replace(aliasName, '');
    normalizedPath = `${pkgName}${relativePath}`;
  }
  const isSo = pkgInfo.isSO ? 'Y' : 'N';
  return `@normalized:${isSo}&${pkgInfo.moduleName}&${pkgInfo.bundleName}&${normalizedPath}&${pkgInfo.version}`;
}

export function getOhmUrlByHspName(moduleRequest: string, projectConfig: Object, logger?: Object,
  useNormalizedOHMUrl: boolean = false): string | undefined {
  // The harNameOhmMap store the ohmurl with the alias of hsp package .
  if (projectConfig.harNameOhmMap) {
    // case1: "@ohos/lib" ---> "@bundle:bundleName/lib/ets/index"
    if (projectConfig.harNameOhmMap.hasOwnProperty(moduleRequest)) {
      if (useNormalizedOHMUrl) {
        return getNormalizedOhmUrlByHspName(moduleRequest, projectConfig);
      }
      return projectConfig.harNameOhmMap[moduleRequest];
    }
    // case2: "@ohos/lib/src/main/ets/pages/page1" ---> "@bundle:bundleName/lib/ets/pages/page1"
    for (const hspName in projectConfig.harNameOhmMap) {
      if (moduleRequest.startsWith(hspName + '/')) {
        if (useNormalizedOHMUrl) {
          return getNormalizedOhmUrlByHspName(hspName, projectConfig, logger, moduleRequest);
        }
        const idx: number = projectConfig.harNameOhmMap[hspName].split('/', 2).join('/').length;
        const hspOhmName: string = projectConfig.harNameOhmMap[hspName].substring(0, idx);
        if (moduleRequest.indexOf(hspName + '/' + SRC_MAIN) === 0) {
          return moduleRequest.replace(hspName + '/' + SRC_MAIN, hspOhmName);
        } else {
          return moduleRequest.replace(hspName, hspOhmName);
        }
      }
    }
  }
  return undefined;
}

function replaceHarDependency(item: string, moduleRequest: string, projectConfig: Object): string {
  const hspOhmUrl: string | undefined = getOhmUrlByHspName(moduleRequest, projectConfig);
  if (hspOhmUrl !== undefined) {
    return item.replace(/(['"])(?:\S+)['"]/, (_, quotation) => {
      return quotation + hspOhmUrl + quotation;
    });
  }
  return item;
}

function locateActualFilePathWithModuleRequest(absolutePath: string): string {
  if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
    return absolutePath
  }

  const filePath: string = absolutePath + getExtensionIfUnfullySpecifiedFilepath(absolutePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return absolutePath;
  }

  return path.join(absolutePath, 'index');
}

function replaceRelativeDependency(item: string, moduleRequest: string, sourcePath: string, projectConfig: Object): string {
  if (sourcePath && projectConfig.compileMode === ESMODULE) {
    // remove file extension from moduleRequest
    const SUFFIX_REG: RegExp = /\.(?:[cm]?js|[e]?ts|json)$/;
    moduleRequest = moduleRequest.replace(SUFFIX_REG, '');

    // normalize the moduleRequest
    item = item.replace(/(['"])(?:\S+)['"]/, (_, quotation) => {
      let normalizedModuleRequest: string = toUnixPath(path.normalize(moduleRequest));
      if (moduleRequest.startsWith("./")) {
        normalizedModuleRequest = "./" + normalizedModuleRequest;
      }
      return quotation + normalizedModuleRequest + quotation;
    });

    const filePath: string =
      locateActualFilePathWithModuleRequest(path.resolve(path.dirname(sourcePath), moduleRequest));
    const result: RegExpMatchArray | null =
      filePath.match(/(\S+)(\/|\\)src(\/|\\)(?:main|ohosTest)(\/|\\)(ets|js)(\/|\\)(\S+)/);
    if (result && projectConfig.aceModuleJsonPath) {
      const npmModuleIdx: number = result[1].search(/(\/|\\)node_modules(\/|\\)/);
      const projectRootPath: string = projectConfig.projectRootPath;
      if (npmModuleIdx === -1 || npmModuleIdx === projectRootPath.search(/(\/|\\)node_modules(\/|\\)/)) {
        const packageInfo: string[] = getPackageInfo(projectConfig.aceModuleJsonPath);
        const bundleName: string = packageInfo[0];
        const moduleName: string = packageInfo[1];
        moduleRequest = `@bundle:${bundleName}/${moduleName}/${result[5]}/${toUnixPath(result[7])}`;
        item = item.replace(/(['"])(?:\S+)['"]/, (_, quotation) => {
          return quotation + moduleRequest + quotation;
        });
      }
    }
  }
  return item;
}

export async function writeObfuscatedSourceCode(content: string, filePath: string, logger: Object, projectConfig: Object,
  relativeSourceFilePath: string = '', rollupNewSourceMaps: Object = {}, sourcePath?: string): Promise<void> {
  if (compileToolIsRollUp() && projectConfig.arkObfuscator) {
    MemoryUtils.tryGC();
    performancePrinter?.filesPrinter?.startEvent(filePath);
    await writeArkguardObfuscatedSourceCode(content, filePath, logger, projectConfig, relativeSourceFilePath, rollupNewSourceMaps, sourcePath);
    performancePrinter?.filesPrinter?.endEvent(filePath, undefined, true);
    MemoryUtils.tryGC();
    return;
  }
  mkdirsSync(path.dirname(filePath));
  if (!compileToolIsRollUp()) {
    await writeMinimizedSourceCode(content, filePath, logger, projectConfig.compileHar);
    return;
  }

  sourcePath = toUnixPath(sourcePath);
  let genFileInHar: GeneratedFileInHar = harFilesRecord.get(sourcePath);

  if (!genFileInHar) {
    genFileInHar = { sourcePath: sourcePath };
  }
  if (!genFileInHar.sourceCachePath) {
    genFileInHar.sourceCachePath = toUnixPath(filePath);
  }
  harFilesRecord.set(sourcePath, genFileInHar);

  fs.writeFileSync(filePath, content);
}


export async function writeArkguardObfuscatedSourceCode(content: string, filePath: string, logger: Object, projectConfig: Object,
  relativeSourceFilePath: string = '', rollupNewSourceMaps: Object = {}, originalFilePath: string): Promise<void> {
  const arkObfuscator = projectConfig.arkObfuscator;
  const isDeclaration = (/\.d\.e?ts$/).test(filePath);
  const packageDir = projectConfig.packageDir;
  const projectRootPath = projectConfig.projectRootPath;
  const useNormalized = projectConfig.useNormalizedOHMUrl;
  const localPackageSet = projectConfig.localPackageSet;
  const sourceMapGeneratorInstance = SourceMapGenerator.getInstance();

  let previousStageSourceMap: sourceMap.RawSourceMap | undefined = undefined;
  const selectedFilePath = sourceMapGeneratorInstance.isNewSourceMaps() ? originalFilePath : relativeSourceFilePath;
  if (relativeSourceFilePath.length > 0) {
    previousStageSourceMap = sourceMapGeneratorInstance.getSpecifySourceMap(rollupNewSourceMaps, selectedFilePath) as sourceMap.RawSourceMap;
  }

  let historyNameCache = new Map<string, string>();
  if (nameCacheObj) {
    let namecachePath = relativeSourceFilePath;
    if (isDeclaration) {
      namecachePath = harFilesRecord.get(originalFilePath).sourceCachePath;
    }
    let identifierCache = nameCacheObj[namecachePath]?.[IDENTIFIER_CACHE];
    deleteLineInfoForNameString(historyNameCache, identifierCache);
  }

  let mixedInfo: { content: string, sourceMap?: Object, nameCache?: Object };
  let projectInfo: {
    packageDir: string,
    projectRootPath: string,
    localPackageSet: Set<string>,
    useNormalized: boolean,
    useTsHar: boolean
  } = { packageDir, projectRootPath, localPackageSet, useNormalized, useTsHar: !!projectConfig.useTsHar };
  try {
    mixedInfo = await arkObfuscator.obfuscate(content, filePath, previousStageSourceMap,
      historyNameCache, originalFilePath, projectInfo);
  } catch (err) {
    logger.error(red, `ArkTS:INTERNAL ERROR: Failed to obfuscate file '${relativeSourceFilePath}' with arkguard. ${err}`);
  }

  if (mixedInfo.sourceMap && !isDeclaration) {
    mixedInfo.sourceMap.sources = [relativeSourceFilePath];
    sourceMapGeneratorInstance.fillSourceMapPackageInfo(originalFilePath, mixedInfo.sourceMap);
    sourceMapGeneratorInstance.updateSpecifySourceMap(rollupNewSourceMaps, selectedFilePath, mixedInfo.sourceMap);
  }

  if (mixedInfo.nameCache && !isDeclaration) {
    let obfName: string = relativeSourceFilePath;
    let isOhModule = isPackageModulesFile(originalFilePath, projectConfig);
    if (projectConfig.obfuscationMergedObConfig?.options.enableFileNameObfuscation && !isOhModule) {
      obfName = mangleFilePath(relativeSourceFilePath);
    }
    mixedInfo.nameCache["obfName"] = obfName;
    nameCacheObj[relativeSourceFilePath] = mixedInfo.nameCache;
  }

  const newFilePath: string = tryMangleFileName(filePath, projectConfig, originalFilePath);
  if (newFilePath !== filePath) {
    sourceMapGeneratorInstance.saveKeyMappingForObfFileName(originalFilePath);
  }
  mkdirsSync(path.dirname(newFilePath));
  fs.writeFileSync(newFilePath, mixedInfo.content ?? '');
}

export function tryMangleFileName(filePath: string, projectConfig: Object, originalFilePath: string): string {
  originalFilePath = toUnixPath(originalFilePath);
  let isOhModule = isPackageModulesFile(originalFilePath, projectConfig);
  let genFileInHar: GeneratedFileInHar = harFilesRecord.get(originalFilePath);
  if (!genFileInHar) {
    genFileInHar = { sourcePath: originalFilePath };
    harFilesRecord.set(originalFilePath, genFileInHar);
  }

  if (projectConfig.obfuscationMergedObConfig?.options?.enableFileNameObfuscation && !isOhModule) {
    const mangledFilePath: string = mangleFilePath(filePath);
    if ((/\.d\.e?ts$/).test(filePath)) {
      genFileInHar.obfuscatedDeclarationCachePath = mangledFilePath;
    } else {
      genFileInHar.obfuscatedSourceCachePath = mangledFilePath;
    }
    filePath = mangledFilePath;
  } else if (!(/\.d\.e?ts$/).test(filePath)) {
    genFileInHar.sourceCachePath = filePath;
  }
  return filePath;
}

export async function mangleDeclarationFileName(logger: Object, projectConfig: Object): Promise<void> {
  for (const [sourcePath, genFilesInHar] of harFilesRecord) {
    if (genFilesInHar.originalDeclarationCachePath && genFilesInHar.originalDeclarationContent) {
      let relativeSourceFilePath = toUnixPath(genFilesInHar.originalDeclarationCachePath).replace(toUnixPath(projectConfig.projectRootPath) + '/', '');
      await writeObfuscatedSourceCode(genFilesInHar.originalDeclarationContent, genFilesInHar.originalDeclarationCachePath, logger, projectConfig,
        relativeSourceFilePath, {}, sourcePath);
    }
  }
}

export async function writeMinimizedSourceCode(content: string, filePath: string, logger: Object,
  isHar: boolean = false): Promise<void> {
  let result: MinifyOutput;
  try {
    const minifyOptions = {
      compress: {
        join_vars: false,
        sequences: 0,
        directives: false
      }
    };
    if (!isHar) {
      minifyOptions['format'] = {
        semicolons: false,
        beautify: true,
        indent_level: 2
      };
    }
    result = await minify(content, minifyOptions);
  } catch {
    logger.error(red, `ArkTS:INTERNAL ERROR: Failed to obfuscate source code for ${filePath}`, reset);
  }

  fs.writeFileSync(filePath, result.code);
}

export function genBuildPath(filePath: string, projectPath: string, buildPath: string, projectConfig: Object): string {
  filePath = toUnixPath(filePath);
  if (filePath.endsWith(EXTNAME_MJS)) {
    filePath = filePath.replace(/\.mjs$/, EXTNAME_JS);
  }
  if (filePath.endsWith(EXTNAME_CJS)) {
    filePath = filePath.replace(/\.cjs$/, EXTNAME_JS);
  }
  projectPath = toUnixPath(projectPath);

  if (isPackageModulesFile(filePath, projectConfig)) {
    const packageDir: string = projectConfig.packageDir;
    const fakePkgModulesPath: string = toUnixPath(path.join(projectConfig.projectRootPath, packageDir));
    let output: string = '';
    if (filePath.indexOf(fakePkgModulesPath) === -1) {
      const hapPath: string = toUnixPath(projectConfig.projectRootPath);
      const tempFilePath: string = filePath.replace(hapPath, '');
      const sufStr: string = tempFilePath.substring(tempFilePath.indexOf(packageDir) + packageDir.length + 1);
      output = path.join(projectConfig.nodeModulesPath, ZERO, sufStr);
    } else {
      output = filePath.replace(fakePkgModulesPath, path.join(projectConfig.nodeModulesPath, ONE));
    }
    return output;
  }

  if (filePath.indexOf(projectPath) !== -1) {
    const sufStr: string = filePath.replace(projectPath, '');
    const output: string = path.join(buildPath, sufStr);
    return output;
  }

  return '';
}

export function getPackageInfo(configFile: string): Array<string> {
  if (packageCollection.has(configFile)) {
    return packageCollection.get(configFile);
  }
  const data: Object = JSON.parse(fs.readFileSync(configFile).toString());
  const bundleName: string = data.app.bundleName;
  const moduleName: string = data.module.name;
  packageCollection.set(configFile, [bundleName, moduleName]);
  return [bundleName, moduleName];
}

export function generateSourceFilesToTemporary(sourcePath: string, sourceContent: string, sourceMap: Object,
  projectConfig: Object, logger: Object): void {
  let jsFilePath: string = genTemporaryPath(sourcePath, projectConfig.projectPath, process.env.cachePath, projectConfig);
  if (jsFilePath.length === 0) {
    return;
  }
  if (jsFilePath.endsWith(EXTNAME_ETS)) {
    jsFilePath = jsFilePath.replace(/\.ets$/, EXTNAME_JS);
  } else {
    jsFilePath = jsFilePath.replace(/\.ts$/, EXTNAME_JS);
  }
  let sourceMapFile: string = genSourceMapFileName(jsFilePath);
  if (sourceMapFile.length > 0 && projectConfig.buildArkMode === 'debug') {
    let source = toUnixPath(sourcePath).replace(toUnixPath(projectConfig.projectRootPath) + '/', '');
    // adjust sourceMap info
    sourceMap.sources = [source];
    sourceMap.file = path.basename(sourceMap.file);
    delete sourceMap.sourcesContent;
    newSourceMaps[source] = sourceMap;
  }
  sourceContent = transformModuleSpecifier(sourcePath, sourceContent, projectConfig);

  mkdirsSync(path.dirname(jsFilePath));
  if (projectConfig.buildArkMode === 'debug') {
    fs.writeFileSync(jsFilePath, sourceContent);
    return;
  }

  writeObfuscatedSourceCode(sourceContent, jsFilePath, logger, projectConfig);
}

export function genAbcFileName(temporaryFile: string): string {
  let abcFile: string = temporaryFile;
  if (temporaryFile.endsWith(EXTNAME_TS)) {
    abcFile = temporaryFile.replace(/\.ts$/, EXTNAME_ABC);
  } else {
    abcFile = temporaryFile.replace(/\.js$/, EXTNAME_ABC);
  }
  return abcFile;
}

export function isOhModules(projectConfig: Object): boolean {
  return projectConfig.packageDir === OH_MODULES;
}

export function isEs2Abc(projectConfig: Object): boolean {
  return projectConfig.pandaMode === ES2ABC || projectConfig.pandaMode === "undefined" ||
    projectConfig.pandaMode === undefined;
}

export function isTs2Abc(projectConfig: Object): boolean {
  return projectConfig.pandaMode === TS2ABC;
}

export function genProtoFileName(temporaryFile: string): string {
  return temporaryFile.replace(/\.(?:[tj]s|json)$/, EXTNAME_PROTO_BIN);
}

export function genMergeProtoFileName(temporaryFile: string): string {
  let protoTempPathArr: string[] = temporaryFile.split(TEMPORARY);
  const sufStr: string = protoTempPathArr[protoTempPathArr.length - 1];
  let protoBuildPath: string = path.join(process.env.cachePath, "protos", sufStr);

  return protoBuildPath;
}

export function removeDuplicateInfo(moduleInfos: Array<any>): Array<any> {
  const tempModuleInfos: any[] = Array<any>();
  moduleInfos.forEach((item) => {
    let check: boolean = tempModuleInfos.every((newItem) => {
      return item.tempFilePath !== newItem.tempFilePath;
    });
    if (check) {
      tempModuleInfos.push(item);
    }
  });
  moduleInfos = tempModuleInfos;

  return moduleInfos;
}

export function buildCachePath(tailName: string, projectConfig: Object, logger: Object): string {
  let pathName: string = process.env.cachePath !== undefined ?
    path.join(projectConfig.cachePath, tailName) : path.join(projectConfig.aceModuleBuild, tailName);
  validateFilePathLength(pathName, logger);
  return pathName;
}

export function getArkBuildDir(arkDir: string): string {
  if (isWindows()) {
    return path.join(arkDir, 'build-win');
  } else if (isMac()) {
    return path.join(arkDir, 'build-mac');
  } else {
    return path.join(arkDir, 'build');
  }
}

export function getBuildBinDir(arkDir: string): string {
  return path.join(getArkBuildDir(arkDir), 'bin');
}

export function cleanUpUtilsObjects(): void {
  newSourceMaps = {};
  nameCacheObj = {};
  packageCollection.clear();
}

export function getHookEventFactory(share: Object, pluginName: string, hookName: string): Object {
  if (typeof share.getHookEventFactory === 'function') {
    return share.getHookEventFactory(pluginName, hookName);
  } else {
    return undefined;
  }
}

export function createAndStartEvent(eventOrEventFactory: Object, eventName: string, syncFlag = false): Object {
  if (eventOrEventFactory === undefined) {
    return undefined;
  }
  let event: Object;
  if (typeof eventOrEventFactory.createSubEvent === 'function') {
    event = eventOrEventFactory.createSubEvent(eventName);
  } else {
    event = eventOrEventFactory.createEvent(eventName);
  }
  if (typeof event.startAsyncEvent === 'function' && syncFlag) {
    event.startAsyncEvent();
  } else {
    event.start();
  }
  return event;
}

export function stopEvent(event: Object, syncFlag = false): void {
  if (event !== undefined) {
    if (typeof event.stopAsyncEvent === 'function' && syncFlag) {
      event.stopAsyncEvent();
    } else {
      event.stop();
    }
  }
}

export function compileToolIsRollUp(): boolean {
  return process.env.compileTool === 'rollup';
}
