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

import * as ts from 'typescript';
import Stats from 'webpack/lib/Stats';
import Compiler from 'webpack/lib/Compiler';
import Compilation from 'webpack/lib/Compilation';
import JavascriptModulesPlugin from 'webpack/lib/javascript/JavascriptModulesPlugin';
import {
  configure,
  getLogger
} from 'log4js';
import path from 'path';
import fs from 'fs';
import CachedSource from 'webpack-sources/lib/CachedSource';
import ConcatSource from 'webpack-sources/lib/ConcatSource';

import { transformLog } from './process_ui_syntax';
import {
  useOSFiles,
  sourcemapNamesCollection
} from './validate_ui_syntax';
import {
  circularFile,
  mkDir,
  writeFileSync,
  parseErrorMessage,
  generateSourceFilesInHar,
  genTemporaryPath
} from './utils';
import {
  MODULE_ETS_PATH,
  MODULE_SHARE_PATH,
  BUILD_SHARE_PATH,
  ESMODULE,
  JSBUNDLE,
  EXTNAME_JS,
  EXTNAME_JS_MAP
} from './pre_define';
import {
  createLanguageService,
  createWatchCompilerHost,
  readDeaclareFiles
} from './ets_checker';
import {
  globalProgram,
  projectConfig
} from '../main';
import cluster from 'cluster';

configure({
  appenders: { 'ETS': {type: 'stderr', layout: {type: 'messagePassThrough'}}},
  categories: {'default': {appenders: ['ETS'], level: 'info'}}
});
export const logger = getLogger('ETS');

export const props: string[] = [];

interface Info {
  message?: string;
  issue?: {
    message: string,
    file: string,
    location: { start?: { line: number, column: number } }
  };
}

interface filesObj {
  modifiedFiles: string[],
  removedFiles: string[]
}

export interface CacheFileName {
  mtimeMs: number,
  children: string[],
  parent: string[],
  error: boolean
}

interface NeedUpdateFlag {
  flag: boolean;
}

export const allResolvedModules: Set<string> = new Set();
export let hotReloadSupportFiles: Set<string> = new Set();
export let cache: Cache = {};
export const shouldResolvedFiles: Set<string> = new Set();
type Cache = Record<string, CacheFileName>;
let allModifiedFiles: Set<string> = new Set();
let checkErrorMessage: Set<string | Info> = new Set([]);
interface wholeCache {
  runtimeOS: string,
  sdkInfo: string,
  fileList: Cache
}

export class ResultStates {
  private mStats: Stats;
  private mErrorCount: number = 0;
  private mPreErrorCount: number = 0;
  private tsErrorCount: number = 0;
  private mWarningCount: number = 0;
  private warningCount: number = 0;
  private noteCount: number = 0;
  private red: string = '\u001b[31m';
  private yellow: string = '\u001b[33m';
  private blue: string = '\u001b[34m';
  private reset: string = '\u001b[39m';
  private moduleSharePaths: Set<string> = new Set([]);
  private removedFiles: string[] = [];
  private incrementalFileInHar: Map<string, string> = new Map();

  public apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap('SourcemapFixer', compilation => {
      compilation.hooks.processAssets.tap('RemoveHar', (assets) => {
        if (!projectConfig.compileHar) {
          return;
        }
        Object.keys(compilation.assets).forEach(key => {
          if (path.extname(key) === EXTNAME_JS || path.extname(key) === EXTNAME_JS_MAP) {
            delete assets[key];
          }
        });
      });

      compilation.hooks.afterProcessAssets.tap('SourcemapFixer', assets => {
        Reflect.ownKeys(assets).forEach(key => {
          if (/\.map$/.test(key.toString()) && assets[key]._value) {
            assets[key]._value = assets[key]._value.toString().replace('.ets?entry', '.ets');
            assets[key]._value = assets[key]._value.toString().replace('.ts?entry', '.ts');

            let absPath: string = path.resolve(projectConfig.projectPath, key.toString().replace('.js.map','.js'));
            if (sourcemapNamesCollection && absPath) {
              let map: Map<string, string> = sourcemapNamesCollection.get(absPath);
              if (map && map.size != 0) {
                let names: Array<string> = Array.from(map).flat();
                let sourcemapObj: any = JSON.parse(assets[key]._value);
                sourcemapObj.nameMap = names;
                assets[key]._value = JSON.stringify(sourcemapObj);
              }
            }
          }
        });
      }
      );

      compilation.hooks.succeedModule.tap('findModule', (module) => {
        if (module && module.error) {
          const errorLog: string = module.error.toString();
          if (module.resourceResolveData && module.resourceResolveData.path &&
            /Module parse failed/.test(errorLog) && /Invalid regular expression:/.test(errorLog)) {
            this.mErrorCount++;
            const errorInfos: string[] = errorLog.split('\n>')[1].split(';');
            if (errorInfos && errorInfos.length > 0 && errorInfos[0]) {
              const errorInformation: string = `ERROR in ${module.resourceResolveData.path}\n The following syntax is incorrect.\n > ${errorInfos[0]}`;
              this.printErrorMessage(parseErrorMessage(errorInformation), false, module.error);
            }
          }
        }
      });

      compilation.hooks.buildModule.tap('findModule', (module) => {
        if (module.context) {
          if (module.context.indexOf(projectConfig.projectPath) >= 0) {
            return;
          }
          const modulePath: string = path.join(module.context);
          const srcIndex: number = modulePath.lastIndexOf(MODULE_ETS_PATH);
          if (srcIndex < 0) {
            return;
          }
          const moduleSharePath: string = path.resolve(modulePath.substring(0, srcIndex), MODULE_SHARE_PATH);
          if (fs.existsSync(moduleSharePath)) {
            this.moduleSharePaths.add(moduleSharePath);
          }
        }
      });

      compilation.hooks.finishModules.tap('finishModules', handleFinishModules.bind(this));
    });

    compiler.hooks.afterCompile.tap('copyFindModule', () => {
      this.moduleSharePaths.forEach(modulePath => {
        circularFile(modulePath, path.resolve(projectConfig.buildPath, BUILD_SHARE_PATH));
      });
    });

    compiler.hooks.compilation.tap('CommonAsset', compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: 'GLOBAL_COMMON_MODULE_CACHE',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
        },
        (assets) => {
          const GLOBAL_COMMON_MODULE_CACHE = `
          globalThis["__common_module_cache__${projectConfig.hashProjectPath}"] =` +
          ` globalThis["__common_module_cache__${projectConfig.hashProjectPath}"] || {};`;
          if (assets['commons.js']) {
            assets['commons.js'] = new CachedSource(
              new ConcatSource(assets['commons.js'], GLOBAL_COMMON_MODULE_CACHE));
          } else if (assets['vendors.js']) {
            assets['vendors.js'] = new CachedSource(
              new ConcatSource(assets['vendors.js'], GLOBAL_COMMON_MODULE_CACHE));
          }
        });
    });

    compiler.hooks.compilation.tap('Require', compilation => {
      JavascriptModulesPlugin.getCompilationHooks(compilation).renderRequire.tap('renderRequire',
        (source) => {
          return `var commonCachedModule = globalThis` +
          `["__common_module_cache__${projectConfig.hashProjectPath}"] ? ` +
            `globalThis["__common_module_cache__${projectConfig.hashProjectPath}"]` +
            `[moduleId]: null;\n` +
            `if (commonCachedModule) { return commonCachedModule.exports; }\n` +
            source.replace('// Execute the module function',
              `function isCommonModue(moduleId) {
                if (globalThis["webpackChunk${projectConfig.hashProjectPath}"]) {
                  const length = globalThis["webpackChunk${projectConfig.hashProjectPath}"].length;
                  switch (length) {
                    case 1:
                      return globalThis["webpackChunk${projectConfig.hashProjectPath}"][0][1][moduleId];
                    case 2:
                      return globalThis["webpackChunk${projectConfig.hashProjectPath}"][0][1][moduleId] ||
                      globalThis["webpackChunk${projectConfig.hashProjectPath}"][1][1][moduleId];
                  }
                }
                return undefined;
              }\n` +
              `if (globalThis["__common_module_cache__${projectConfig.hashProjectPath}"]` +
              ` && String(moduleId).indexOf("?name=") < 0 && isCommonModue(moduleId)) {\n` +
              `  globalThis["__common_module_cache__${projectConfig.hashProjectPath}"]` +
              `[moduleId] = module;\n}`);
        });
    });

    compiler.hooks.entryOption.tap('beforeRun', () => {
      const rootFileNames: string[] = [];
      Object.values(projectConfig.entryObj).forEach((fileName: string) => {
        rootFileNames.push(fileName.replace('?entry', ''));
      });
      if (process.env.watchMode === 'true') {
        if (projectConfig.hotReload) {
          [...rootFileNames, ...readDeaclareFiles()].forEach(fileName => {
            hotReloadSupportFiles.add(path.resolve(fileName));
          })
        }
        globalProgram.watchProgram = ts.createWatchProgram(
          createWatchCompilerHost(rootFileNames, this.printDiagnostic.bind(this),
            this.delayPrintLogCount.bind(this), this.resetTsErrorCount.bind(this)));
      } else {
        let languageService: ts.LanguageService = null;
        let cacheFile: string = null;
        if (projectConfig.xtsMode) {
          languageService = createLanguageService(rootFileNames);
        } else {
          cacheFile = path.resolve(projectConfig.cachePath, '../.ts_checker_cache');
          let wholeCache: wholeCache = fs.existsSync(cacheFile) ?
            JSON.parse(fs.readFileSync(cacheFile).toString()) :
              {"runtimeOS": projectConfig.runtimeOS, "sdkInfo": projectConfig.sdkInfo, "fileList": {}};
          if (wholeCache.runtimeOS === projectConfig.runtimeOS && wholeCache.sdkInfo === projectConfig.sdkInfo) {
            cache = wholeCache.fileList;
          } else {
            cache = {};
          }
          const filterFiles: string[] = filterInput(rootFileNames);
          languageService = createLanguageService(filterFiles);
        }
        globalProgram.program = languageService.getProgram();
        const allDiagnostics: ts.Diagnostic[] = globalProgram.program
          .getSyntacticDiagnostics()
          .concat(globalProgram.program.getSemanticDiagnostics())
          .concat(globalProgram.program.getDeclarationDiagnostics());
        allDiagnostics.forEach((diagnostic: ts.Diagnostic) => {
          this.printDiagnostic(diagnostic);
        });
        if (process.env.watchMode !== 'true' && !projectConfig.xtsMode) {
          fs.writeFileSync(cacheFile, JSON.stringify({
            "runtimeOS": projectConfig.runtimeOS,
            "sdkInfo": projectConfig.sdkInfo,
            "fileList": cache
          }, null, 2));
        }
        if (projectConfig.compileHar || projectConfig.compileShared) {
          [...allResolvedModules, ...rootFileNames].forEach(moduleFile => {
            if (!(moduleFile.match(/node_modules/) && projectConfig.compileHar)) {
              try {
                const emit: any = languageService.getEmitOutput(moduleFile, true, true);
                if (emit.outputFiles[0]) {
                  generateSourceFilesInHar(moduleFile, emit.outputFiles[0].text, '.d' + path.extname(moduleFile));
                } else {
                  logger.warn(this.yellow,
                    "ArkTS:WARN doesn't generate .d"+path.extname(moduleFile) + ' for ' + moduleFile, this.reset);
                }
              } catch (err) {
              }
            }
          })
        }
      }
    });

    compiler.hooks.watchRun.tap('WatchRun', (comp) => {
      process.env.watchEts = 'start';
      checkErrorMessage.clear();
      this.clearCount();
      comp.modifiedFiles = comp.modifiedFiles || [];
      comp.removedFiles = comp.removedFiles || [];
      const watchModifiedFiles: string[] = [...comp.modifiedFiles];
      let watchRemovedFiles: string[] = [...comp.removedFiles];
      if (watchRemovedFiles.length) {
        this.removedFiles = watchRemovedFiles;
      }
      if (watchModifiedFiles.length) {
        watchModifiedFiles.some((item: string) => {
          if (fs.statSync(item).isFile() && !/.(ts|ets)$/.test(item)) {
            process.env.watchTs = 'end';
            return true;
          }
        });
      }
      if (this.shouldWriteChangedList(watchModifiedFiles, watchRemovedFiles)) {
        watchRemovedFiles = watchRemovedFiles.map(file => path.relative(projectConfig.projectPath, file));
        allModifiedFiles = new Set([...allModifiedFiles, ...watchModifiedFiles
          .filter(file => fs.statSync(file).isFile() && hotReloadSupportFiles.has(file))
          .map(file => path.relative(projectConfig.projectPath, file))]
          .filter(file => !watchRemovedFiles.includes(file)));
        const filesObj: filesObj = {
          modifiedFiles: [...allModifiedFiles],
          removedFiles: [...watchRemovedFiles]
        };
        writeFileSync(projectConfig.changedFileList, JSON.stringify(filesObj));
      }
      const changedFiles: string[] = [...watchModifiedFiles, ...watchRemovedFiles];
      if (changedFiles.length) {
        shouldResolvedFiles.clear();
      }
      changedFiles.forEach((file) => {
        this.judgeFileShouldResolved(file, shouldResolvedFiles)
      })
    })

    compiler.hooks.done.tap('Result States', (stats: Stats) => {
      if (projectConfig.isPreview && projectConfig.aceSoPath &&
        useOSFiles && useOSFiles.size > 0) {
        this.writeUseOSFiles();
      }
      if (projectConfig.compileHar) {
        this.incrementalFileInHar.forEach((jsBuildFilePath, jsCacheFilePath) => {
          const sourceCode: string = fs.readFileSync(jsCacheFilePath, 'utf-8');
          writeFileSync(jsBuildFilePath, sourceCode);
        });
      }
      this.mStats = stats;
      this.warningCount = 0;
      this.noteCount = 0;
      if (this.mStats.compilation.warnings) {
        this.mWarningCount = this.mStats.compilation.warnings.length;
      }
      this.printResult();
    });
  }

  private shouldWriteChangedList(watchModifiedFiles: string[], watchRemovedFiles: string[]): boolean {
    return projectConfig.compileMode === ESMODULE && process.env.watchMode === 'true' && !projectConfig.isPreview &&
      projectConfig.changedFileList && (watchRemovedFiles.length + watchModifiedFiles.length) &&
      !(watchModifiedFiles.length === 1 && watchModifiedFiles[0] == projectConfig.projectPath && !watchRemovedFiles.length);
  }

  private judgeFileShouldResolved(file: string, shouldResolvedFiles: Set<string>): void {
    if (shouldResolvedFiles.has(file)) {
      return;
    }
    shouldResolvedFiles.add(file);
    if (cache && cache[file] && cache[file].parent) {
      cache[file].parent.forEach((item)=>{
        this.judgeFileShouldResolved(item, shouldResolvedFiles);
      })
      cache[file].parent = [];
    }
    if (cache && cache[file] && cache[file].children) {
      cache[file].children.forEach((item)=>{
        this.judgeFileShouldResolved(item, shouldResolvedFiles);
      })
      cache[file].children = [];
    }
  }

  private printDiagnostic(diagnostic: ts.Diagnostic): void {
    const message: string = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    if (this.validateError(message)) {
      if (process.env.watchMode !== 'true' && !projectConfig.xtsMode) {
        updateErrorFileCache(diagnostic);
      }
      this.tsErrorCount += 1;
      if (diagnostic.file) {
        const { line, character }: ts.LineAndCharacter =
          diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
        logger.error(this.red,
          `ArkTS:ERROR File: ${diagnostic.file.fileName}:${line + 1}:${character + 1}\n ${message}\n`, this.reset);
      } else {
        logger.error(this.red, `ArkTS:ERROR: ${message}`, this.reset);
      }
    }
  }

  private resetTsErrorCount(): void {
    this.tsErrorCount = 0;
  }

  private writeUseOSFiles(): void {
    let info: string = '';
    if (!fs.existsSync(projectConfig.aceSoPath)) {
      const parent: string = path.join(projectConfig.aceSoPath, '..');
      if (!(fs.existsSync(parent) && !fs.statSync(parent).isFile())) {
        mkDir(parent);
      }
    } else {
      info = fs.readFileSync(projectConfig.aceSoPath, 'utf-8') + '\n';
    }
    fs.writeFileSync(projectConfig.aceSoPath, info + Array.from(useOSFiles).join('\n'));
  }

  private printResult(): void {
    this.printWarning();
    this.printError();
    if (process.env.watchMode === 'true') {
      process.env.watchEts = 'end';
      this.delayPrintLogCount(true);
    } else {
      this.printLogCount();
    }
  }

  private delayPrintLogCount(isCompile: boolean = false) {
    if (process.env.watchEts === 'end' && process.env.watchTs === 'end') {
      this.printLogCount();
      process.env.watchTs = 'start';
      this.removedFiles = [];
    } else if (isCompile && this.removedFiles.length && this.mErrorCount === 0 && this.mPreErrorCount > 0) {
      this.printLogCount();
    }
    this.mPreErrorCount = this.mErrorCount;
  }

  private printLogCount(): void {
    let errorCount: number = this.mErrorCount + this.tsErrorCount;
    if (errorCount + this.warningCount + this.noteCount > 0) {
      let result: string;
      let resultInfo: string = '';
      if (errorCount > 0) {
        resultInfo += `ERROR:${errorCount}`;
        result = 'FAIL ';
        process.exitCode = 1;
      } else {
        result = 'SUCCESS ';
      }
      if (process.env.abcCompileSuccess === 'false') {
        result = 'FAIL ';
      }
      if (this.warningCount > 0) {
        resultInfo += ` WARN:${this.warningCount}`;
      }
      if (this.noteCount > 0) {
        resultInfo += ` NOTE:${this.noteCount}`;
      }
      if (result === 'SUCCESS ' && process.env.watchMode === 'true') {
        this.printPreviewResult(resultInfo);
      } else {
        logger.info(this.blue, 'COMPILE RESULT:' + result + `{${resultInfo}}`, this.reset);
      }
    } else {
      if (process.env.watchMode === 'true') {
        this.printPreviewResult();
      } else {
        console.info(this.blue, 'COMPILE RESULT:SUCCESS ', this.reset);
      }
    }
  }

  private clearCount(): void {
    this.mErrorCount = 0;
    this.warningCount = 0;
    this.noteCount = 0;
    process.env.abcCompileSuccess = 'true';
  }

  private printPreviewResult(resultInfo: string = ''): void {
    const workerNum: number = Object.keys(cluster.workers).length;
    const printSuccessInfo = this.printSuccessInfo;
    const blue: string = this.blue;
    const reset: string = this.reset;
    if (workerNum === 0) {
      printSuccessInfo(blue, reset, resultInfo);
    }
  }

  private printSuccessInfo(blue: string, reset: string, resultInfo: string): void {
    if (resultInfo.length === 0) {
      console.info(blue, 'COMPILE RESULT:SUCCESS ', reset);
    } else {
      console.info(blue, 'COMPILE RESULT:SUCCESS ' + `{${resultInfo}}`, reset);
    }
  }

  private printWarning(): void {
    if (this.mWarningCount > 0) {
      const warnings: Info[] = this.mStats.compilation.warnings;
      const length: number = warnings.length;
      for (let index = 0; index < length; index++) {
        const message: string = warnings[index].message.replace(/^Module Warning\s*.*:\n/, '')
          .replace(/\(Emitted value instead of an instance of Error\) BUILD/, '');
        if (/^NOTE/.test(message)) {
          this.noteCount++;
          logger.info(this.blue, message, this.reset, '\n');
        } else {
          if (!checkErrorMessage.has(message)) {
            this.warningCount++;
            logger.warn(this.yellow, message.replace(/^WARN/, 'ArkTS:WARN'), this.reset, '\n');
            checkErrorMessage.add(message);
          } 
        }
      }
      if (this.mWarningCount > length) {
        this.warningCount = this.warningCount + this.mWarningCount - length;
      }
    }
  }

  private printError(): void {
    if (this.mStats.compilation.errors.length > 0) {
      const errors: Info[] = [...this.mStats.compilation.errors];
      for (let index = 0; index < errors.length; index++) {
        if (errors[index].issue) {
          if (!checkErrorMessage.has(errors[index].issue)) {
          this.mErrorCount++;
          const position: string = errors[index].issue.location
            ? `:${errors[index].issue.location.start.line}:${errors[index].issue.location.start.column}`
            : '';
          const location: string = errors[index].issue.file.replace(/\\/g, '/') + position;
          const detail: string = errors[index].issue.message;
          logger.error(this.red, 'ArkTS:ERROR File: ' + location, this.reset);
          logger.error(this.red, detail, this.reset, '\n');
          checkErrorMessage.add(errors[index].issue);
          }
        } else if (/BUILDERROR/.test(errors[index].message)) {
          if (!checkErrorMessage.has(errors[index].message)) {
            this.mErrorCount++;
            const errorMessage: string = errors[index].message.replace(/^Module Error\s*.*:\n/, '')
              .replace(/\(Emitted value instead of an instance of Error\) BUILD/, '')
              .replace(/^ERROR/, 'ArkTS:ERROR');
            this.printErrorMessage(errorMessage, true, errors[index]);
            checkErrorMessage.add(errors[index].message);
          }  
        } else if (!/TS[0-9]+:/.test(errors[index].message.toString()) &&
          !/Module parse failed/.test(errors[index].message.toString())) {
          this.mErrorCount++;
          let errorMessage: string = `${errors[index].message.replace(/\[tsl\]\s*/, '')
            .replace(/\u001b\[.*?m/g, '').replace(/\.ets\.ts/g, '.ets').trim()}\n`;
          errorMessage = this.filterModuleError(errorMessage)
            .replace(/^ERROR in /, 'ArkTS:ERROR File: ').replace(/\s{6}TS/g, ' TS')
            .replace(/\(([0-9]+),([0-9]+)\)/, ':$1:$2');
          this.printErrorMessage(parseErrorMessage(errorMessage), false, errors[index]);
        }
      }
    }
  }
  private printErrorMessage(errorMessage: string, lineFeed: boolean, errorInfo: Info): void {
    if (this.validateError(errorMessage)) {
      const formatErrMsg = errorMessage.replace(/\\/g, '/');
      if (lineFeed) {
        logger.error(this.red, formatErrMsg + '\n', this.reset);
      } else {
        logger.error(this.red, formatErrMsg, this.reset);
      }
    } else {
      const errorsIndex = this.mStats.compilation.errors.indexOf(errorInfo);
      this.mStats.compilation.errors.splice(errorsIndex, 1);
      this.mErrorCount = this.mErrorCount - 1;
    }
  }
  private validateError(message: string): boolean {
    const propInfoReg: RegExp = /Cannot find name\s*'(\$?\$?[_a-zA-Z0-9]+)'/;
    const stateInfoReg: RegExp = /Property\s*'(\$?[_a-zA-Z0-9]+)' does not exist on type/;
    if (this.matchMessage(message, props, propInfoReg) ||
      this.matchMessage(message, props, stateInfoReg)) {
      return false;
    }
    return true;
  }
  private matchMessage(message: string, nameArr: any, reg: RegExp): boolean {
    if (reg.test(message)) {
      const match: string[] = message.match(reg);
      if (match[1] && nameArr.includes(match[1])) {
        return true;
      }
    }
    return false;
  }
  private filterModuleError(message: string): string {
    if (/You may need an additional loader/.test(message) && transformLog && transformLog.sourceFile) {
      const fileName: string = transformLog.sourceFile.fileName;
      const errorInfos: string[] = message.split('You may need an additional loader to handle the result of these loaders.');
      if (errorInfos && errorInfos.length > 1 && errorInfos[1]) {
        message = `ERROR in ${fileName}\n The following syntax is incorrect.${errorInfos[1]}`;
      }
    }
    return message;
  }
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
      checkNeedUpdateFiles(value.children[i], needUpdate, alreadyCheckedFiles);
    }
  } else {
    cache[file] = { mtimeMs, children: [], parent: [], error: false };
    needUpdate.flag = true;
  }
}

function handleFinishModules(modules, callback) {
  if (projectConfig.compileHar) {
    modules.forEach(module => {
      if (module !== undefined && module.resourceResolveData !== undefined) {
        const filePath: string = module.resourceResolveData.path;
        if (!filePath.match(/node_modules/)) {
          const jsCacheFilePath: string = genTemporaryPath(filePath, projectConfig.moduleRootPath, process.env.cachePath);
          const jsBuildFilePath: string = genTemporaryPath(filePath, projectConfig.moduleRootPath, projectConfig.buildPath, true);
          if (path.extname(filePath) === 'ets' || path.extname(filePath) === 'ts') {
            this.incrementalFileInHar.set(jsCacheFilePath.replace(/\.ets$/, '.d.ets').replace(/\.ts$/, '.d.ts'),
              jsBuildFilePath.replace(/\.ets$/, '.d.ets').replace(/\.ts$/, '.d.ts'));
            this.incrementalFileInHar.set(jsCacheFilePath.replace(/\.e?ts$/, '.js'), jsBuildFilePath.replace(/\.e?ts$/, '.js'));
          } else {
            this.incrementalFileInHar.set(jsCacheFilePath, jsBuildFilePath);
          }
        }
      }
    });
  }
}
