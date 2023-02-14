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

import cluster from 'cluster';
import fs from 'fs';
import path from 'path';
import os from 'os';

import {
  DEBUG,
  ESMODULE,
  EXTNAME_ETS,
  EXTNAME_JS,
  EXTNAME_TS,
  EXTNAME_JSON,
  EXTNAME_CJS,
  EXTNAME_MJS,
  TEMPORARY
} from './common/ark_define';
import {
  nodeLargeOrEqualTargetVersion,
  genTemporaryPath,
  mkdirsSync,
  validateFilePathLength
} from '../../utils';
import {
  writeMinimizedSourceCode
} from '../../ark_utils';

export function isAotMode(projectConfig: any): boolean {
  return projectConfig.compileMode === ESMODULE && (
    projectConfig.anBuildMode === 'full' || projectConfig.anBuildMode === 'pgo'
  );
}

export function isDebug(projectConfig: any): boolean {
  return projectConfig.buildMode.toLowerCase() === DEBUG;
}

export function isMasterOrPrimary() {
  return ((nodeLargeOrEqualTargetVersion(16) && cluster.isPrimary) ||
    (!nodeLargeOrEqualTargetVersion(16) && cluster.isMaster));
}

export function changeFileExtension(file: string, targetExt: string, originExt = ''): string {
  let currentExt = originExt.length === 0 ? path.extname(file) : originExt;
  let fileWithoutExt = file.substring(0, file.lastIndexOf(currentExt));
  return fileWithoutExt + targetExt;
}

export function writeFileContentToTempDir(id: string, content: string, projectConfig: any, logger: any) {
  if (isCommonJsPluginVirtualFile(id)) {
    return;
  }

  if (!isCurrentProjectFiles(id, projectConfig)) {
    return;
  }

  let filePath: string;
  if (projectConfig.compileHar) {
    filePath = genTemporaryPath(id,
      projectConfig.compileShared ? projectConfig.projectRootPath : projectConfig.moduleRootPath,
      path.resolve(projectConfig.buildPath, projectConfig.compileShared ? '../etsFortgz' : ''), projectConfig, true);
  } else {
    filePath = genTemporaryPath(id, projectConfig.projectPath, projectConfig.cachePath, projectConfig);
  }

  switch (path.extname(id)) {
    case EXTNAME_ETS:
    case EXTNAME_TS:
    case EXTNAME_JS:
    case EXTNAME_MJS:
    case EXTNAME_CJS:
      writeFileContent(id, filePath, content, projectConfig, logger);
      break;
    case EXTNAME_JSON:
      fs.writeFileSync(filePath, content, 'utf-8');
      break;
    default:
      break;
  }
}

function writeFileContent(sourceFilePath: string, filePath: string, content: string, projectConfig: any, logger: any) {
  if (!isSpecifiedExt(sourceFilePath, EXTNAME_JS)) {
    filePath = changeFileExtension(filePath, EXTNAME_JS);
  }

  mkdirsSync(path.dirname(filePath));

  if ((projectConfig.compileHar && projectConfig.obfuscateHarType === 'uglify') || !isDebug(projectConfig)) {
    writeMinimizedSourceCode(content, filePath, logger);
    return;
  }

  fs.writeFileSync(filePath, content, 'utf-8');
}

export function getEs2abcFileThreadNumber(): number {
  const fileThreads : number = os.cpus().length < 16 ? os.cpus().length : 16;
  return fileThreads;
}

export function isCommonJsPluginVirtualFile(filePath: string): boolean {
  // rollup uses commonjs plugin to handle commonjs files,
  // which will automatic generate files like 'jsfile.js?commonjs-exports'
  return filePath.includes('\x00');
}

export function isCurrentProjectFiles(filePath: string, projectConfig: any): boolean {
  const packageDir: string = projectConfig.packageDir;
  let modulePath: string = projectConfig.modulePathMap[projectConfig.moduleName];
  return filePath.indexOf(projectConfig.projectPath) >= 0 ||
    filePath.indexOf(path.join(projectConfig.projectRootPath, packageDir)) >= 0 ||
    filePath.indexOf(path.join(modulePath, packageDir)) >= 0;
}

export function genTemporaryModuleCacheDirectoryForBundle(projectConfig: any) {
  const buildDirArr: string[] = projectConfig.aceModuleBuild.split(path.sep);
  const abilityDir: string = buildDirArr[buildDirArr.length - 1];
  const temporaryModuleCacheDirPath: string = path.join(projectConfig.cachePath, TEMPORARY, abilityDir);
  mkdirsSync(temporaryModuleCacheDirPath);

  return temporaryModuleCacheDirPath;
}

export function isSpecifiedExt(filePath: string, fileExtendName: string) {
  return path.extname(filePath) === fileExtendName;
}

export function genCachePath(tailName: string, projectConfig: any, logger: any): string {
  const pathName: string = projectConfig.cachePath !== undefined ?
    path.join(projectConfig.cachePath, TEMPORARY, tailName) : path.join(projectConfig.aceModuleBuild, tailName);
  mkdirsSync(path.dirname(pathName));

  validateFilePathLength(pathName, logger);
  return pathName;
}

export function isTsOrEtsSourceFile(file: string): boolean {
  return /(?<!\.d)\.[e]?ts$/.test(file);
}

export function isJsSourceFile(file: string): boolean {
  return /\.[cm]?js$/.test(file);
}

export function isJsonSourceFile(file: string): boolean {
  return /\.json$/.test(file);
}
