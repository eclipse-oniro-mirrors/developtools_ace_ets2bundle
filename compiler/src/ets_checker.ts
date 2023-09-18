/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
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

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
const fse = require('fs-extra');

import {
  projectConfig,
  systemModules,
  globalProgram,
  sdkConfigs,
  sdkConfigPrefix,
  ohosSystemModulePaths,
  partialUpdateConfig
} from '../main';
import {
  preprocessExtend,
  preprocessNewExtend
} from './validate_ui_syntax';
import {
  INNER_COMPONENT_MEMBER_DECORATORS,
  COMPONENT_DECORATORS_PARAMS,
  COMPONENT_BUILD_FUNCTION,
  STYLE_ADD_DOUBLE_DOLLAR,
  $$,
  PROPERTIES_ADD_DOUBLE_DOLLAR,
  $$_BLOCK_INTERFACE,
  COMPONENT_EXTEND_DECORATOR,
  COMPONENT_BUILDER_DECORATOR,
  ESMODULE,
  EXTNAME_D_ETS,
  EXTNAME_JS,
  FOREACH_LAZYFOREACH,
  COMPONENT_IF,
  TS_WATCH_END_MSG
} from './pre_define';
import { getName } from './process_component_build';
import {
  INNER_COMPONENT_NAMES,
  JS_BIND_COMPONENTS
} from './component_map';
import {
  props,
  logger
} from './compile_info';
import { hasDecorator } from './utils';
import { generateSourceFilesInHar } from './utils';
import { isExtendFunction, isOriginalExtend } from './process_ui_syntax';
import { visualTransform } from './process_visual';
import { tsWatchEmitter } from './fast_build/ets_ui/rollup-plugin-ets-checker';
import { doArkTSLinter, ArkTSLinterMode } from './do_arkTS_linter';

export const SOURCE_FILES: Map<string, ts.SourceFile> = new Map();

function collectSourceFilesMap(program: ts.Program): void {
  program.getSourceFiles().forEach((sourceFile: ts.SourceFile) => {
    SOURCE_FILES.set(path.normalize(sourceFile.fileName), sourceFile);
  });
}

export function readDeaclareFiles(): string[] {
  const declarationsFileNames: string[] = [];
  fs.readdirSync(path.resolve(__dirname, '../declarations'))
    .forEach((fileName: string) => {
      if (/\.d\.ts$/.test(fileName)) {
        declarationsFileNames.push(path.resolve(__dirname, '../declarations', fileName));
      }
    });
  return declarationsFileNames;
}

export const compilerOptions: ts.CompilerOptions = ts.readConfigFile(
  path.resolve(__dirname, '../tsconfig.json'), ts.sys.readFile).config.compilerOptions;
function setCompilerOptions(resolveModulePaths: string[]) {
  const allPath: Array<string> = [
    '*'
  ];
  const basePath: string = path.resolve(projectConfig.projectPath);
  if (process.env.compileTool === 'rollup' && resolveModulePaths && resolveModulePaths.length) {
    resolveModulePaths.forEach((item: string) => {
      if (!(/oh_modules$/.test(item) || /node_modules$/.test(item))) {
        allPath.push(path.join(path.relative(basePath, item), '*'));
      }
    });
  } else {
    if (!projectConfig.aceModuleJsonPath) {
      allPath.push('../../../../../*');
      allPath.push('../../*');
    } else {
      allPath.push('../../../../*');
      allPath.push('../*');
    }
  }
  Object.assign(compilerOptions, {
    'allowJs': false,
    'emitNodeModulesFiles': true,
    'importsNotUsedAsValues': ts.ImportsNotUsedAsValues.Preserve,
    'module': ts.ModuleKind.CommonJS,
    'moduleResolution': ts.ModuleResolutionKind.NodeJs,
    'noEmit': true,
    'target': ts.ScriptTarget.ES2017,
    'baseUrl': basePath,
    'paths': {
      '*': allPath
    },
    'lib': [
      'lib.es2020.d.ts'
    ],
    'types': projectConfig.compilerTypes,
    'etsLoaderPath': projectConfig.etsLoaderPath,
    'needDoArkTsLinter': getArkTSLinterMode() !== ArkTSLinterMode.NOT_USE,
    'isCompatibleVersion':  getArkTSLinterMode() === ArkTSLinterMode.COMPATIBLE_MODE
  });
  if (projectConfig.compileMode === ESMODULE) {
    Object.assign(compilerOptions, {
      'importsNotUsedAsValues': ts.ImportsNotUsedAsValues.Remove,
      'module': ts.ModuleKind.ES2020
    });
  }
  if (projectConfig.packageDir === 'oh_modules') {
    Object.assign(compilerOptions, {
      'packageManagerType': 'ohpm'
    });
  }
}

interface InitCheckConfig {
  tagName: string;
  message: string;
  needConditionCheck: boolean;
  type: ts.DiagnosticCategory;
  specifyCheckConditionFuncName: string;
  tagNameShouldExisted: boolean;
}

interface CheckJSDocTagNameConfig {
  needCheck: boolean;
  checkConfig: InitCheckConfig[];
}

function getInitCheckConfig(tagName: string, message: string): InitCheckConfig {
  return {
    tagName: tagName,
    message: message,
    needConditionCheck: false,
    type: ts.DiagnosticCategory.Error,
    specifyCheckConditionFuncName: '',
    tagNameShouldExisted: true
  };
}

function getCheckJSDocTagNameConfig(fileName: string, sourceFileName: string): CheckJSDocTagNameConfig {
  let needCheckResult: boolean = false;
  const checkConfigArray: InitCheckConfig[] = [];
  if (ohosSystemModulePaths.includes(path.normalize(sourceFileName)) || isArkuiDependence(sourceFileName)) {
    if (isCardFile(fileName)) {
      needCheckResult = true;
      checkConfigArray.push(getInitCheckConfig('form', "'{0}' can't support form application."));
    }
    if (projectConfig.isCrossplatform) {
      needCheckResult = true;
      checkConfigArray.push(getInitCheckConfig('crossplatform', "'{0}' can't support crossplatform application."));
    }
  }

  return {
    needCheck: needCheckResult,
    checkConfig: checkConfigArray
  };
}

interface extendInfo {
  start: number,
  end: number,
  compName: string
}

export const files: ts.MapLike<{ version: number }> = {};

export function createLanguageService(rootFileNames: string[], resolveModulePaths: string[]): ts.LanguageService {
  setCompilerOptions(resolveModulePaths);
  rootFileNames.forEach((fileName: string) => {
    files[fileName] = {version: 0};
  });
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => [...rootFileNames, ...readDeaclareFiles()],
    getScriptVersion: fileName => {
      if (!files[path.resolve(fileName)]) {
        files[path.resolve(fileName)] = {version: 0};
      }
      return files[path.resolve(fileName)].version.toString();
    },
    getScriptSnapshot: fileName => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }
      if (/(?<!\.d)\.(ets|ts)$/.test(fileName)) {
        appComponentCollection.set(path.join(fileName), new Set());
        let content: string = processContent(fs.readFileSync(fileName).toString(), fileName);
        const extendFunctionInfo: extendInfo[] = [];
        content = instanceInsteadThis(content, fileName, extendFunctionInfo);
        return ts.ScriptSnapshot.fromString(content);
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    resolveModuleNames: resolveModuleNames,
    resolveTypeReferenceDirectives: resolveTypeReferenceDirectives,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
    getTagNameNeededCheckByFile: (fileName: string, sourceFileName: string) => {
      return getCheckJSDocTagNameConfig(fileName, sourceFileName);
    }
  };
  return ts.createLanguageService(servicesHost, ts.createDocumentRegistry());
}

interface CacheFileName {
  mtimeMs: number,
  children: string[],
  parent: string[],
  error: boolean
}
interface NeedUpdateFlag {
  flag: boolean;
}
interface CheckerResult {
  count: number
}

interface WarnCheckerResult {
  count: number
}

interface WholeCache {
  runtimeOS: string,
  sdkInfo: string,
  fileList: Cache
}
type Cache = Record<string, CacheFileName>;
export let cache: Cache = {};
export const hotReloadSupportFiles: Set<string> = new Set();
export const shouldResolvedFiles: Set<string> = new Set();
export const appComponentCollection: Map<string, Set<string>> = new Map();
const allResolvedModules: Set<string> = new Set();

export let fastBuildLogger = null;

export const checkerResult: CheckerResult = {count: 0};
export const warnCheckerResult: WarnCheckerResult = {count: 0};
export let languageService: ts.LanguageService = null;
export function serviceChecker(rootFileNames: string[], newLogger: any = null, resolveModulePaths: string[] = null): void {
  fastBuildLogger = newLogger;
  let cacheFile: string = null;
  if (projectConfig.xtsMode || process.env.watchMode === 'true') {
    if (projectConfig.hotReload) {
      rootFileNames.forEach(fileName => {
        hotReloadSupportFiles.add(fileName);
      });
    }
    languageService = createLanguageService(rootFileNames, resolveModulePaths);
  } else {
    cacheFile = path.resolve(projectConfig.cachePath, '../.ts_checker_cache');
    const wholeCache: WholeCache = fs.existsSync(cacheFile) ?
      JSON.parse(fs.readFileSync(cacheFile).toString()) :
      {'runtimeOS': projectConfig.runtimeOS, 'sdkInfo': projectConfig.sdkInfo, 'fileList': {}};
    if (wholeCache.runtimeOS === projectConfig.runtimeOS && wholeCache.sdkInfo === projectConfig.sdkInfo) {
      cache = wholeCache.fileList;
    } else {
      cache = {};
    }
    const filterFiles: string[] = filterInput(rootFileNames);
    languageService = createLanguageService(filterFiles, resolveModulePaths);
  }
  globalProgram.program = languageService.getProgram();
  runArkTSLinter();
  collectSourceFilesMap(globalProgram.program);
  if (process.env.watchMode !== 'true') {
    processBuildHap(cacheFile, rootFileNames);
  }
}

function processBuildHap(cacheFile: string, rootFileNames: string[]): void {
  const allDiagnostics: ts.Diagnostic[] = globalProgram.program
    .getSyntacticDiagnostics()
    .concat(globalProgram.program.getSemanticDiagnostics())
    .concat(globalProgram.program.getDeclarationDiagnostics());
  allDiagnostics.forEach((diagnostic: ts.Diagnostic) => {
    printDiagnostic(diagnostic);
  });
  if (!projectConfig.xtsMode) {
    fse.ensureDirSync(projectConfig.cachePath);
    fs.writeFileSync(cacheFile, JSON.stringify({
      'runtimeOS': projectConfig.runtimeOS,
      'sdkInfo': projectConfig.sdkInfo,
      'fileList': cache
    }, null, 2));
  }
  if (projectConfig.compileHar || projectConfig.compileShared) {
    [...allResolvedModules, ...rootFileNames].forEach(moduleFile => {
      if (!(moduleFile.match(new RegExp(projectConfig.packageDir)) && projectConfig.compileHar)) {
        try {
          if ((/\.d\.e?ts$/).test(moduleFile)) {
            generateSourceFilesInHar(moduleFile, fs.readFileSync(moduleFile, 'utf-8'), path.extname(moduleFile),
              projectConfig);
          } else {
            const emit: any = languageService.getEmitOutput(moduleFile, true, true);
            if (emit.outputFiles[0]) {
              generateSourceFilesInHar(moduleFile, emit.outputFiles[0].text, '.d' + path.extname(moduleFile),
                projectConfig);
            } else {
              console.warn(this.yellow,
                "ArkTS:WARN doesn't generate .d" + path.extname(moduleFile) + ' for ' + moduleFile, this.reset);
            }
          }
        } catch (err) {}
      }
    });
  }
}

function isArkuiDependence(file: string): boolean {
  return /compiler\/declarations/.test(file) || /ets-loader\/declarations/.test(file);
}

function isCardFile(file: string): boolean {
  for (const key in projectConfig.cardEntryObj) {
    if (path.normalize(projectConfig.cardEntryObj[key]) === path.normalize(file)) {
      return true;
    }
  }
  return false;
}

function containFormError(message: string): boolean {
  if (/can't support form application./.test(message)) {
    return true;
  }
  return false;
}

export function printDiagnostic(diagnostic: ts.Diagnostic): void {
  const message: string = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (validateError(message)) {
    if (process.env.watchMode !== 'true' && !projectConfig.xtsMode) {
      updateErrorFileCache(diagnostic);
    }

    if (containFormError(message) && !isCardFile(diagnostic.file.fileName)) {
      return;
    }

    const logPrefix: string = diagnostic.category === ts.DiagnosticCategory.Error ? 'ERROR' : 'WARN';
    const etsCheckerLogger = fastBuildLogger ? fastBuildLogger : logger;
    let logMessage: string;
    if (logPrefix === 'ERROR') {
      checkerResult.count += 1;
    } else {
      warnCheckerResult.count += 1;
    }
    if (diagnostic.file) {
      const { line, character }: ts.LineAndCharacter =
        diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      logMessage = `ArkTS:${logPrefix} File: ${diagnostic.file.fileName}:${line + 1}:${character + 1}\n ${message}\n`;
    } else {
      logMessage = `ArkTS:${logPrefix}: ${message}`;
    }

    if (diagnostic.category === ts.DiagnosticCategory.Error) {
      etsCheckerLogger.error('\u001b[31m' + logMessage);
    } else {
      etsCheckerLogger.warn('\u001b[33m' + logMessage);
    }
  }
}

function validateError(message: string): boolean {
  const propInfoReg: RegExp = /Cannot find name\s*'(\$?\$?[_a-zA-Z0-9]+)'/;
  const stateInfoReg: RegExp = /Property\s*'(\$?[_a-zA-Z0-9]+)' does not exist on type/;
  if (matchMessage(message, props, propInfoReg) ||
    matchMessage(message, props, stateInfoReg)) {
    return false;
  }
  return true;
}
function matchMessage(message: string, nameArr: any, reg: RegExp): boolean {
  if (reg.test(message)) {
    const match: string[] = message.match(reg);
    if (match[1] && nameArr.includes(match[1])) {
      return true;
    }
  }
  return false;
}

function updateErrorFileCache(diagnostic: ts.Diagnostic): void {
  if (diagnostic.file && cache[path.resolve(diagnostic.file.fileName)]) {
    cache[path.resolve(diagnostic.file.fileName)].error = true;
  }
}

function filterInput(rootFileNames: string[]): string[] {
  return rootFileNames.filter((file: string) => {
    const needUpdate: NeedUpdateFlag = { flag: false };
    const alreadyCheckedFiles: Set<string> = new Set();
    checkNeedUpdateFiles(path.resolve(file), needUpdate, alreadyCheckedFiles);
    return needUpdate.flag;
  });
}

function checkNeedUpdateFiles(file: string, needUpdate: NeedUpdateFlag, alreadyCheckedFiles: Set<string>): void {
  if (alreadyCheckedFiles.has(file)) {
    return;
  } else {
    alreadyCheckedFiles.add(file);
  }

  if (needUpdate.flag) {
    return;
  }

  const value: CacheFileName = cache[file];
  const mtimeMs: number = fs.statSync(file).mtimeMs;
  if (value) {
    if (value.error || value.mtimeMs !== mtimeMs) {
      needUpdate.flag = true;
      return;
    }
    for (let i = 0; i < value.children.length; ++i) {
      if (fs.existsSync(value.children[i])) {
        checkNeedUpdateFiles(value.children[i], needUpdate, alreadyCheckedFiles);
      } else {
        needUpdate.flag = true;
      }
    }
  } else {
    cache[file] = { mtimeMs, children: [], parent: [], error: false };
    needUpdate.flag = true;
  }
}

const moduleResolutionHost: ts.ModuleResolutionHost = {
  fileExists(fileName: string): boolean {
    return ts.sys.fileExists(fileName);
  },
  readFile(fileName: string): string | undefined {
    return ts.sys.readFile(fileName);
  },
  realpath(path: string): string {
    return ts.sys.realpath(path);
  },
  trace(s: string): void {
    console.info(s);
  }
}

export function resolveTypeReferenceDirectives(typeDirectiveNames: string[]): ts.ResolvedTypeReferenceDirective[] {
  if (typeDirectiveNames.length === 0) {
    return [];
  }

  const resolvedTypeReferenceCache: ts.ResolvedTypeReferenceDirective[] = [];
  const cache: Map<string, ts.ResolvedTypeReferenceDirective> = new Map<string, ts.ResolvedTypeReferenceDirective>();
  const containingFile: string = path.join(projectConfig.modulePath, "build-profile.json5");

  for (const typeName of typeDirectiveNames) {
    if (!cache.has(typeName)) {
      const resolvedFile = ts.resolveTypeReferenceDirective(typeName, containingFile, compilerOptions, moduleResolutionHost);
      if (!resolvedFile || !resolvedFile.resolvedTypeReferenceDirective) {
        logger.error('\u001b[31m', `ArkTS:Cannot find type definition file for: ${typeName}\n`);
      }
      const result: ts.ResolvedTypeReferenceDirective = resolvedFile.resolvedTypeReferenceDirective;
      cache.set(typeName, result);
      resolvedTypeReferenceCache.push(result);
    }
  }
  return resolvedTypeReferenceCache;
}

const resolvedModulesCache: Map<string, ts.ResolvedModuleFull[]> = new Map();

export function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModuleFull[] {
  const resolvedModules: ts.ResolvedModuleFull[] = [];
  if (![...shouldResolvedFiles].length || shouldResolvedFiles.has(path.resolve(containingFile))
    || !(resolvedModulesCache[path.resolve(containingFile)] &&
      resolvedModulesCache[path.resolve(containingFile)].length === moduleNames.length)) {
    for (const moduleName of moduleNames) {
      const result = ts.resolveModuleName(moduleName, containingFile, compilerOptions, moduleResolutionHost);
      if (result.resolvedModule) {
        if (result.resolvedModule.resolvedFileName &&
          path.extname(result.resolvedModule.resolvedFileName) === EXTNAME_JS) {
          const resultDETSPath: string =
            result.resolvedModule.resolvedFileName.replace(EXTNAME_JS, EXTNAME_D_ETS);
          if (ts.sys.fileExists(resultDETSPath)) {
            resolvedModules.push(getResolveModule(resultDETSPath, EXTNAME_D_ETS));
          } else {
            resolvedModules.push(result.resolvedModule);
          }
        } else {
          resolvedModules.push(result.resolvedModule);
        }
      } else if (new RegExp(`^@(${sdkConfigPrefix})\\.`, 'i').test(moduleName.trim())) {
        let apiFileExist: boolean = false;
        for (let i = 0; i < sdkConfigs.length; i++) {
          const sdkConfig = sdkConfigs[i];
          let modulePath: string = path.resolve(sdkConfig.apiPath, moduleName + '.d.ts');
          let isDETS: boolean = false;
          if (!fs.existsSync(modulePath)) {
            modulePath = path.resolve(sdkConfig.apiPath, moduleName + '.d.ets');
            isDETS = true;
          }
          if (systemModules.includes(moduleName + (isDETS ? '.d.ets' : '.d.ts')) && ts.sys.fileExists(modulePath)) {
            resolvedModules.push(getResolveModule(modulePath, isDETS ? '.d.ets' : '.d.ts'));
            apiFileExist = true;
            break;
          }
        }
        if (!apiFileExist) {
          resolvedModules.push(null);
        }
      } else if (/\.ets$/.test(moduleName) && !/\.d\.ets$/.test(moduleName)) {
        const modulePath: string = path.resolve(path.dirname(containingFile), moduleName);
        if (ts.sys.fileExists(modulePath)) {
          resolvedModules.push(getResolveModule(modulePath, '.ets'));
        } else {
          resolvedModules.push(null);
        }
      } else if (/\.ts$/.test(moduleName)) {
        const modulePath: string = path.resolve(path.dirname(containingFile), moduleName);
        if (ts.sys.fileExists(modulePath)) {
          resolvedModules.push(getResolveModule(modulePath, '.ts'));
        } else {
          resolvedModules.push(null);
        }
      } else {
        const modulePath: string = path.resolve(__dirname, '../../../api', moduleName + '.d.ts');
        const systemDETSModulePath: string = path.resolve(__dirname, '../../../api', moduleName + '.d.ets');
        const suffix: string = /\.js$/.test(moduleName) ? '' : '.js';
        const jsModulePath: string = path.resolve(__dirname, '../node_modules', moduleName + suffix);
        const fileModulePath: string =
          path.resolve(__dirname, '../node_modules', moduleName + '/index.js');
        const DETSModulePath: string = path.resolve(path.dirname(containingFile),
          /\.d\.ets$/.test(moduleName) ? moduleName : moduleName + EXTNAME_D_ETS);
        if (ts.sys.fileExists(modulePath)) {
          resolvedModules.push(getResolveModule(modulePath, '.d.ts'));
        } else if (ts.sys.fileExists(systemDETSModulePath)) {
          resolvedModules.push(getResolveModule(systemDETSModulePath, '.d.ets'));
        } else if (ts.sys.fileExists(jsModulePath)) {
          resolvedModules.push(getResolveModule(jsModulePath, '.js'));
        } else if (ts.sys.fileExists(fileModulePath)) {
          resolvedModules.push(getResolveModule(fileModulePath, '.js'));
        } else if (ts.sys.fileExists(DETSModulePath)) {
          resolvedModules.push(getResolveModule(DETSModulePath, '.d.ets'));
        } else {
          const srcIndex: number = projectConfig.projectPath.indexOf('src' + path.sep + 'main');
          let DETSModulePathFromModule: string;
          if (srcIndex > 0) {
            DETSModulePathFromModule = path.resolve(
              projectConfig.projectPath.substring(0, srcIndex), moduleName + path.sep + 'index' + EXTNAME_D_ETS);
            if (DETSModulePathFromModule && ts.sys.fileExists(DETSModulePathFromModule)) {
              resolvedModules.push(getResolveModule(DETSModulePathFromModule, '.d.ets'));
            } else {
              resolvedModules.push(null);
            }
          } else {
            resolvedModules.push(null);
          }
        }
      }
      if (projectConfig.hotReload && resolvedModules.length &&
        resolvedModules[resolvedModules.length - 1]) {
        hotReloadSupportFiles.add(path.resolve(resolvedModules[resolvedModules.length - 1].resolvedFileName));
      }
      if (collectShouldPackedFiles(resolvedModules)) {
        allResolvedModules.add(resolvedModules[resolvedModules.length - 1].resolvedFileName);
      }
    }
    if (!projectConfig.xtsMode) {
      createOrUpdateCache(resolvedModules, path.resolve(containingFile));
    }
    resolvedModulesCache[path.resolve(containingFile)] = resolvedModules;
    return resolvedModules;
  }
  return resolvedModulesCache[path.resolve(containingFile)];
}

function collectShouldPackedFiles(resolvedModules: ts.ResolvedModuleFull[]): boolean | RegExpMatchArray {
  return (projectConfig.compileHar || projectConfig.compileShared) && resolvedModules[resolvedModules.length - 1] &&
    resolvedModules[resolvedModules.length - 1].resolvedFileName &&
    (path.resolve(resolvedModules[resolvedModules.length - 1].resolvedFileName).match(/(\.[^d]|[^\.]d|[^\.][^d])\.e?ts$/) ||
    path.resolve(resolvedModules[resolvedModules.length - 1].resolvedFileName).match(/\.d\.e?ts$/) &&
    path.resolve(resolvedModules[resolvedModules.length - 1].resolvedFileName).match(
      new RegExp('\\' + path.sep + 'src' + '\\' + path.sep + 'main' + '\\' + path.sep)));
}

function createOrUpdateCache(resolvedModules: ts.ResolvedModuleFull[], containingFile: string): void {
  const children: string[] = [];
  const error: boolean = false;
  resolvedModules.forEach(moduleObj => {
    if (moduleObj && moduleObj.resolvedFileName && /(?<!\.d)\.(ets|ts)$/.test(moduleObj.resolvedFileName)) {
      const file: string = path.resolve(moduleObj.resolvedFileName);
      const mtimeMs: number = fs.statSync(file).mtimeMs;
      children.push(file);
      const value: CacheFileName = cache[file];
      if (value) {
        value.mtimeMs = mtimeMs;
        value.error = error;
        value.parent = value.parent || [];
        value.parent.push(path.resolve(containingFile));
        value.parent = [...new Set(value.parent)];
      } else {
        cache[file] = { mtimeMs, children: [], parent: [containingFile], error };
      }
    }
  });
  cache[path.resolve(containingFile)] = { mtimeMs: fs.statSync(containingFile).mtimeMs, children,
    parent: cache[path.resolve(containingFile)] && cache[path.resolve(containingFile)].parent ?
      cache[path.resolve(containingFile)].parent : [], error };
}

export function createWatchCompilerHost(rootFileNames: string[],
  reportDiagnostic: ts.DiagnosticReporter, delayPrintLogCount: Function, resetErrorCount: Function,
  isPipe: boolean = false, resolveModulePaths: string[] = null): ts.WatchCompilerHostOfFilesAndCompilerOptions<ts.BuilderProgram> {
  if (projectConfig.hotReload) {
    rootFileNames.forEach(fileName => {
      hotReloadSupportFiles.add(fileName);
    });
  }
  setCompilerOptions(resolveModulePaths);
  const createProgram = ts.createSemanticDiagnosticsBuilderProgram;
  const host = ts.createWatchCompilerHost(
    [...rootFileNames, ...readDeaclareFiles()], compilerOptions,
    ts.sys, createProgram, reportDiagnostic,
    (diagnostic: ts.Diagnostic) => {
      if ([6031, 6032].includes(diagnostic.code)) {
        if (!isPipe) {
          process.env.watchTs = 'start';
          resetErrorCount();
        }
      }
      // End of compilation in watch mode flag.
      if ([6193, 6194].includes(diagnostic.code)) {
        if (!isPipe) {
          process.env.watchTs = 'end';
          if (fastBuildLogger) {
            fastBuildLogger.debug(TS_WATCH_END_MSG);
            tsWatchEmitter.emit(TS_WATCH_END_MSG);
          }
        }
        delayPrintLogCount();
      }
    });
  host.readFile = (fileName: string) => {
    if (!fs.existsSync(fileName)) {
      return undefined;
    }
    if (/(?<!\.d)\.(ets|ts)$/.test(fileName)) {
      let content: string = processContent(fs.readFileSync(fileName).toString(), fileName);
      const extendFunctionInfo: extendInfo[] = [];
      content = instanceInsteadThis(content, fileName, extendFunctionInfo);
      return content;
    }
    return fs.readFileSync(fileName).toString();
  };
  host.resolveModuleNames = resolveModuleNames;
  host.resolveTypeReferenceDirectives = resolveTypeReferenceDirectives;
  return host;
}

export function watchChecker(rootFileNames: string[], newLogger: any = null, resolveModulePaths: string[] = null): void {
  fastBuildLogger = newLogger;
  globalProgram.watchProgram = ts.createWatchProgram(
    createWatchCompilerHost(rootFileNames, printDiagnostic, () => {}, () => {}, false, resolveModulePaths));
}

export function instanceInsteadThis(content: string, fileName: string, extendFunctionInfo: extendInfo[]): string {
  checkUISyntax(content, fileName, extendFunctionInfo);
  extendFunctionInfo.reverse().forEach((item) => {
    const subStr: string = content.substring(item.start, item.end);
    const insert: string = subStr.replace(/(\s)\$(\.)/g, (origin, item1, item2) => {
      return item1 + item.compName + 'Instance' + item2;
    });
    content = content.slice(0, item.start) + insert + content.slice(item.end);
  });
  return content;
}

function getResolveModule(modulePath: string, type): ts.ResolvedModuleFull {
  return {
    resolvedFileName: modulePath,
    isExternalLibraryImport: false,
    extension: type
  };
}

export const dollarCollection: Set<string> = new Set();
export const decoratorParamsCollection: Set<string> = new Set();
export const extendCollection: Set<string> = new Set();
export const importModuleCollection: Set<string> = new Set();

function checkUISyntax(source: string, fileName: string, extendFunctionInfo: extendInfo[]): void {
  if (/\.ets$/.test(fileName)) {
    if (process.env.compileMode === 'moduleJson' ||
      path.resolve(fileName) !== path.resolve(projectConfig.projectPath, 'app.ets')) {
      const sourceFile: ts.SourceFile = ts.createSourceFile(fileName, source,
        ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS);
      collectComponents(sourceFile);
      parseAllNode(sourceFile, sourceFile, extendFunctionInfo);
      props.push(...dollarCollection, ...decoratorParamsCollection, ...extendCollection);
    }
  }
}

function collectComponents(node: ts.SourceFile): void {
  // @ts-ignore
  if (process.env.watchMode !== 'true' && node.identifiers && node.identifiers.size) {
    // @ts-ignore
    for (const key of node.identifiers.keys()) {
      if (JS_BIND_COMPONENTS.has(key)) {
        appComponentCollection.get(path.join(node.fileName)).add(key);
      }
    }
  }
}

function parseAllNode(node: ts.Node, sourceFileNode: ts.SourceFile, extendFunctionInfo: extendInfo[]): void {
  if (ts.isStructDeclaration(node)) {
    if (node.members) {
      node.members.forEach(item => {
        if (ts.isPropertyDeclaration(item) && ts.isIdentifier(item.name)) {
          const propertyName: string = item.name.getText();
          if (item.decorators && item.decorators.length) {
            for (let i = 0; i < item.decorators.length; i++) {
              const decoratorName: string = item.decorators[i].getText().replace(/\(.*\)$/, '').trim();
              if (INNER_COMPONENT_MEMBER_DECORATORS.has(decoratorName)) {
                dollarCollection.add('$' + propertyName);
              }
              if (isDecoratorCollection(item.decorators[i], decoratorName)) {
                decoratorParamsCollection.add(item.decorators[i].expression.arguments[0].getText());
              }
            }
          }
        }
      });
    }
  }
  if (process.env.watchMode !== 'true' && ts.isIfStatement(node)) {
    appComponentCollection.get(path.join(sourceFileNode.fileName)).add(COMPONENT_IF);
  }
  if (ts.isMethodDeclaration(node) && node.name.getText() === COMPONENT_BUILD_FUNCTION ||
    (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) &&
    hasDecorator(node, COMPONENT_BUILDER_DECORATOR)) {
    if (node.body && node.body.statements && node.body.statements.length) {
      const checkProp: ts.NodeArray<ts.Statement> = node.body.statements;
      checkProp.forEach((item, index) => {
        traverseBuild(item, index);
      });
    }
  }
  if (ts.isFunctionDeclaration(node) && hasDecorator(node, COMPONENT_EXTEND_DECORATOR)) {
    if (node.body && node.body.statements && node.body.statements.length &&
      !isOriginalExtend(node.body)) {
      extendFunctionInfo.push({
        start: node.pos,
        end: node.end,
        compName: isExtendFunction(node, { decoratorName: '', componentName: '' })});
    }
  }
  node.getChildren().forEach((item: ts.Node) => parseAllNode(item, sourceFileNode, extendFunctionInfo));
}

function isForeachAndLzayForEach(node: ts.Node): boolean {
  return ts.isCallExpression(node) && node.expression && ts.isIdentifier(node.expression) &&
    FOREACH_LAZYFOREACH.has(node.expression.escapedText.toString()) && node.arguments && node.arguments[1] &&
    ts.isArrowFunction(node.arguments[1]) && node.arguments[1].body && ts.isBlock(node.arguments[1].body);
}

function traverseBuild(node: ts.Node, index: number): void {
  if (ts.isExpressionStatement(node)) {
    let parentComponentName: string = getName(node);
    if (!INNER_COMPONENT_NAMES.has(parentComponentName) && node.parent && node.parent.statements && index >= 1 &&
      node.parent.statements[index - 1].expression && node.parent.statements[index - 1].expression.expression) {
      parentComponentName = node.parent.statements[index - 1].expression.expression.escapedText;
    }
    node = node.expression;
    if (ts.isEtsComponentExpression(node) && node.body && ts.isBlock(node.body) &&
      ts.isIdentifier(node.expression) && !$$_BLOCK_INTERFACE.has(node.expression.escapedText.toString())) {
      node.body.statements.forEach((item: ts.Statement, indexBlock: number) => {
        traverseBuild(item, indexBlock);
      });
    } else if (isForeachAndLzayForEach(node)) {
      node.arguments[1].body.statements.forEach((item: ts.Statement, indexBlock: number) => {
        traverseBuild(item, indexBlock);
      });
    } else {
      loopNodeFindDoubleDollar(node, parentComponentName);
    }
  } else if (ts.isIfStatement(node)) {
    if (node.thenStatement && ts.isBlock(node.thenStatement) && node.thenStatement.statements) {
      node.thenStatement.statements.forEach((item, indexIfBlock) => {
        traverseBuild(item, indexIfBlock);
      });
    }
    if (node.elseStatement && ts.isBlock(node.elseStatement) && node.elseStatement.statements) {
      node.elseStatement.statements.forEach((item, indexElseBlock) => {
        traverseBuild(item, indexElseBlock);
      });
    }
  }
}

function isPropertiesAddDoubleDollar(node: ts.Node): boolean {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.arguments && node.arguments.length) {
    return true;
  } else if (ts.isEtsComponentExpression(node) && node.body && ts.isBlock(node.body) &&
    ts.isIdentifier(node.expression) && $$_BLOCK_INTERFACE.has(node.expression.escapedText.toString())) {
    return true;
  } else {
    return false;
  }
}
function loopNodeFindDoubleDollar(node: ts.Node, parentComponentName: string): void {
  while (node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const argument: ts.NodeArray<ts.Node> = node.arguments;
      const propertyName: ts.Identifier | ts.PrivateIdentifier = node.expression.name;
      if (isCanAddDoubleDollar(propertyName.getText(), parentComponentName)) {
        argument.forEach((item: ts.Node) => {
          doubleDollarCollection(item);
        });
      }
    } else if (isPropertiesAddDoubleDollar(node)) {
      node.arguments.forEach((item: ts.Node) => {
        if (ts.isObjectLiteralExpression(item) && item.properties && item.properties.length) {
          item.properties.forEach((param: ts.Node) => {
            if (isObjectPram(param, parentComponentName)) {
              doubleDollarCollection(param.initializer);
            }
          });
        }
        if (STYLE_ADD_DOUBLE_DOLLAR.has(node.expression.getText()) && ts.isPropertyAccessExpression(item)) {
          doubleDollarCollection(item);
        }
      });
    }
    node = node.expression;
  }
}

function doubleDollarCollection(item: ts.Node): void {
  if (item.getText().startsWith($$)) {
    while (item.expression) {
      item = item.expression;
    }
    dollarCollection.add(item.getText());
  }
}

function isObjectPram(param: ts.Node, parentComponentName:string): boolean {
  return ts.isPropertyAssignment(param) && param.name && ts.isIdentifier(param.name) &&
    param.initializer && PROPERTIES_ADD_DOUBLE_DOLLAR.has(parentComponentName) &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.get(parentComponentName).has(param.name.getText());
}

function isCanAddDoubleDollar(propertyName: string, parentComponentName: string): boolean {
  return PROPERTIES_ADD_DOUBLE_DOLLAR.has(parentComponentName) &&
    PROPERTIES_ADD_DOUBLE_DOLLAR.get(parentComponentName).has(propertyName) ||
    STYLE_ADD_DOUBLE_DOLLAR.has(propertyName);
}

function isDecoratorCollection(item: ts.Decorator, decoratorName: string): boolean {
  return COMPONENT_DECORATORS_PARAMS.has(decoratorName) &&
    // @ts-ignore
    item.expression.arguments && item.expression.arguments.length &&
    // @ts-ignore
    ts.isIdentifier(item.expression.arguments[0]);
}

function processContent(source: string, id: string): string {
  if (fastBuildLogger) {
    source = visualTransform(source, id, fastBuildLogger);
  }
  source = preprocessExtend(source, extendCollection);
  source = preprocessNewExtend(source, extendCollection);
  return source;
}

function judgeFileShouldResolved(file: string, shouldResolvedFiles: Set<string>): void {
  if (shouldResolvedFiles.has(file)) {
    return;
  }
  shouldResolvedFiles.add(file);
  if (cache && cache[file] && cache[file].parent) {
    cache[file].parent.forEach((item) => {
      judgeFileShouldResolved(item, shouldResolvedFiles);
    });
    cache[file].parent = [];
  }
  if (cache && cache[file] && cache[file].children) {
    cache[file].children.forEach((item) => {
      judgeFileShouldResolved(item, shouldResolvedFiles);
    });
    cache[file].children = [];
  }
}

export function incrementWatchFile(watchModifiedFiles: string[],
  watchRemovedFiles: string[]): void {
  const changedFiles: string[] = [...watchModifiedFiles, ...watchRemovedFiles];
  if (changedFiles.length) {
    shouldResolvedFiles.clear();
  }
  changedFiles.forEach((file) => {
    judgeFileShouldResolved(file, shouldResolvedFiles);
  });
}

function runArkTSLinter(): void {
  const arkTSLinterDiagnostics =
    doArkTSLinter(globalProgram.program, getArkTSLinterMode(), printArkTSLinterDiagnostic, !projectConfig.xtsMode);
  if (process.env.watchMode !== 'true' && !projectConfig.xtsMode) {
    arkTSLinterDiagnostics.forEach((diagnostic: ts.Diagnostic) => {
      updateErrorFileCache(diagnostic);
    });
  }
}

function printArkTSLinterDiagnostic(diagnostic: ts.Diagnostic): void {
  if (diagnostic.category === ts.DiagnosticCategory.Error && (isInOhModuleFile(diagnostic) || isInSDK(diagnostic) || isInApplicationsStandard(diagnostic))) {
    const originalCategory = diagnostic.category;
    diagnostic.category = ts.DiagnosticCategory.Warning;
    printDiagnostic(diagnostic);
    diagnostic.category = originalCategory;
    return;
  }
  printDiagnostic(diagnostic);
}

function isInOhModuleFile(diagnostics: ts.Diagnostic): boolean {
  return (diagnostics.file !== undefined) &&
    ((diagnostics.file.fileName.indexOf('/oh_modules/') !== -1) || diagnostics.file.fileName.indexOf('\\oh_modules\\') !== -1);
}

function isInApplicationsStandard(diagnostics: ts.Diagnostic): boolean {
  return (diagnostics.file !== undefined) && (diagnostics.file.fileName.indexOf('/applications/standard/') !== -1);
}

function isInSDK(diagnostics: ts.Diagnostic): boolean {
  const fileName = diagnostics.file?.fileName;
  if (projectConfig.etsLoaderPath === undefined || fileName === undefined) {
    return false;
  }
  const sdkPath = path.resolve(projectConfig.etsLoaderPath, '../../../');
  return path.resolve(fileName).startsWith(sdkPath);
}

export function getArkTSLinterMode(): ArkTSLinterMode {
  if (!partialUpdateConfig.executeArkTSLinter) {
    return ArkTSLinterMode.NOT_USE;
  }

  if (isStandardMode()) {
    return ArkTSLinterMode.STANDARD_MODE;
  }
  return ArkTSLinterMode.COMPATIBLE_MODE;
}

export function isStandardMode(): boolean {
  const STANDARD_MODE_COMPATIBLE_SDK_VERSION = 10;
  if (projectConfig &&
    projectConfig.compatibleSdkVersion &&
    projectConfig.compatibleSdkVersion >= STANDARD_MODE_COMPATIBLE_SDK_VERSION) {
    return true;
  }
  return false;
}

function initEtsStandaloneCheckerConfig(logger, config): void {
  fastBuildLogger = logger;
  if (config.packageManagerType === 'ohpm') {
    config.packageDir = 'oh_modules';
    config.packageJson = 'oh-package.json5';
  } else {
    config.packageDir = 'node_modules';
    config.packageJson = 'package.json';
  }
  if (config.aceModuleJsonPath && fs.existsSync(config.aceModuleJsonPath)) {
    process.env.compileMode = 'moduleJson';
  }
  Object.assign(projectConfig, config);
}

export function etsStandaloneChecker(entryObj, logger, projectConfig): void {
  initEtsStandaloneCheckerConfig(logger, projectConfig);
  const rootFileNames: string[] = [];
  const resolveModulePaths: string[] = [];
  Object.values(entryObj).forEach((fileName: string) => {
    rootFileNames.push(path.resolve(fileName));
  });
  if (projectConfig.resolveModulePaths && Array.isArray(projectConfig.resolveModulePaths)) {
    resolveModulePaths.push(...projectConfig.resolveModulePaths);
  }
  const filterFiles: string[] = filterInput(rootFileNames);
  languageService = createLanguageService(filterFiles, resolveModulePaths);
  globalProgram.program = languageService.getProgram();
  runArkTSLinter();
  const allDiagnostics: ts.Diagnostic[] = globalProgram.program
    .getSyntacticDiagnostics()
    .concat(globalProgram.program.getSemanticDiagnostics())
    .concat(globalProgram.program.getDeclarationDiagnostics());
  allDiagnostics.forEach((diagnostic: ts.Diagnostic) => {
    printDiagnostic(diagnostic);
  });
}