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

import path from 'path';
import ts from 'typescript';
import fs from 'fs';
import { projectConfig } from '../main';
import { createHash } from 'crypto';
import { processSystemApi } from './validate_ui_syntax';
import {
  NODE_MODULES,
  TEMPORARY,
  MAIN,
  AUXILIARY,
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
  ESMODULE
} from './pre_define';

export enum LogType {
  ERROR = 'ERROR',
  WARN = 'WARN',
  NOTE = 'NOTE'
}
export const TEMPORARYS: string = 'temporarys';
export const BUILD: string = 'build';
export const SRC_MAIN: string = 'src/main';
const TS_NOCHECK: string = '// @ts-nocheck';

export interface LogInfo {
  type: LogType,
  message: string,
  pos?: number,
  line?: number,
  column?: number,
  fileName?: string
}

export const repeatLog: Map<string, LogInfo> = new Map();

export class FileLog {
  private _sourceFile: ts.SourceFile;
  private _errors: LogInfo[] = [];

  public get sourceFile() {
    return this._sourceFile;
  }

  public set sourceFile(newValue: ts.SourceFile) {
    this._sourceFile = newValue;
  }

  public get errors() {
    return this._errors;
  }

  public set errors(newValue: LogInfo[]) {
    this._errors = newValue;
  }
}

export function emitLogInfo(loader: any, infos: LogInfo[]) {
  if (infos && infos.length) {
    infos.forEach((item) => {
      switch (item.type) {
        case LogType.ERROR:
          loader.emitError(getMessage(item.fileName || loader.resourcePath, item));
          break;
        case LogType.WARN:
          loader.emitWarning(getMessage(item.fileName || loader.resourcePath, item));
          break;
        case LogType.NOTE:
          loader.emitWarning(getMessage(loader.resourcePath, item));
          break;
      }
    });
  }
}

export function addLog(type: LogType, message: string, pos: number, log: LogInfo[],
  sourceFile: ts.SourceFile) {
  const posOfNode: ts.LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(pos);
  log.push({
    type: type,
    message: message,
    line: posOfNode.line + 1,
    column: posOfNode.character + 1,
    fileName: sourceFile.fileName
  });
}

export function getMessage(fileName: string, info: LogInfo): string {
  let message: string;
  if (info.line && info.column) {
    message = `BUILD${info.type} File: ${fileName}:${info.line}:${info.column}\n ${info.message}`;
  } else {
    message = `BUILD${info.type} File: ${fileName}\n ${info.message}`;
  }
  return message;
}

class ComponentInfo {
  private _id: number = 0;
  private _componentNames: Set<string> = new Set(['ForEach']);
  public set id(id: number) {
    this._id = id;
  }
  public get id() {
    return this._id;
  }
  public set componentNames(componentNames: Set<string>) {
    this._componentNames = componentNames;
  }
  public get componentNames() {
    return this._componentNames;
  }
}

export const componentInfo: ComponentInfo = new ComponentInfo();

export function hasDecorator(node: ts.MethodDeclaration | ts.FunctionDeclaration |
  ts.StructDeclaration | ts.ClassDeclaration, decortorName: string, customBuilder?: ts.Decorator[]): boolean {
  if (node.decorators && node.decorators.length) {
    for (let i = 0; i < node.decorators.length; i++) {
      if (node.decorators[i].getText().replace(/\(.*\)$/, '').trim() === decortorName) {
        if (customBuilder) {
          customBuilder.push(...node.decorators.slice(i + 1), ...node.decorators.slice(0, i));
        }
        return true;
      }
    }
  }
  return false;
}

const STATEMENT_EXPECT: number = 1128;
const SEMICOLON_EXPECT: number = 1005;
const STATESTYLES_EXPECT: number = 1003;
export const IGNORE_ERROR_CODE: number[] = [STATEMENT_EXPECT, SEMICOLON_EXPECT, STATESTYLES_EXPECT];

export function readFile(dir: string, utFiles: string[]) {
  try {
    const files: string[] = fs.readdirSync(dir);
    files.forEach((element) => {
      const filePath: string = path.join(dir, element);
      const status: fs.Stats = fs.statSync(filePath);
      if (status.isDirectory()) {
        readFile(filePath, utFiles);
      } else {
        utFiles.push(filePath);
      }
    });
  } catch (e) {
    console.error('ETS ERROR: ' + e);
  }
}

export function createFunction(node: ts.Identifier, attrNode: ts.Identifier,
  argumentsArr: ts.NodeArray<ts.Expression>): ts.CallExpression {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      node,
      attrNode
    ),
    undefined,
    argumentsArr && argumentsArr.length ? argumentsArr : []
  );
}

export function circularFile(inputPath: string, outputPath: string): void {
  if (!inputPath || !outputPath) {
    return;
  }
  fs.readdir(inputPath, function(err, files) {
    if (!files) {
      return;
    }
    files.forEach(file => {
      const inputFile: string = path.resolve(inputPath, file);
      const outputFile: string = path.resolve(outputPath, file);
      const fileStat: fs.Stats = fs.statSync(inputFile);
      if (fileStat.isFile()) {
        copyFile(inputFile, outputFile);
      } else {
        circularFile(inputFile, outputFile);
      }
    });
  });
}

function copyFile(inputFile: string, outputFile: string): void {
  try {
    const parent: string = path.join(outputFile, '..');
    if (!(fs.existsSync(parent) && fs.statSync(parent).isDirectory())) {
      mkDir(parent);
    }
    if (fs.existsSync(outputFile)) {
      return;
    }
    const readStream: fs.ReadStream = fs.createReadStream(inputFile);
    const writeStream: fs.WriteStream = fs.createWriteStream(outputFile);
    readStream.pipe(writeStream);
    readStream.on('close', function() {
      writeStream.end();
    });
  } catch (err) {
    throw err.message;
  }
}

export function mkDir(path_: string): void {
  const parent: string = path.join(path_, '..');
  if (!(fs.existsSync(parent) && !fs.statSync(parent).isFile())) {
    mkDir(parent);
  }
  fs.mkdirSync(path_);
}

export function toUnixPath(data: string): string {
  if (/^win/.test(require('os').platform())) {
    const fileTmps: string[] = data.split(path.sep);
    const newData: string = path.posix.join(...fileTmps);
    return newData;
  }
  return data;
}

export function toHashData(path: string): any {
  const content: string = fs.readFileSync(path).toString();
  const hash: any = createHash('sha256');
  hash.update(content);
  return hash.digest('hex');
}

export function writeFileSync(filePath: string, content: string): void {
  if (!fs.existsSync(filePath)) {
    const parent: string = path.join(filePath, '..');
    if (!(fs.existsSync(parent) && !fs.statSync(parent).isFile())) {
      mkDir(parent);
    }
  }
  fs.writeFileSync(filePath, content);
}

export function genTemporaryPath(filePath: string, projectPath: string, buildPath: string): string {
  filePath = toUnixPath(filePath);
  if (filePath.endsWith(EXTNAME_MJS)) {
    filePath = filePath.replace(/\.mjs$/, EXTNAME_JS);
  }
  if (filePath.endsWith(EXTNAME_CJS)) {
    filePath = filePath.replace(/\.cjs$/, EXTNAME_JS);
  }
  projectPath = toUnixPath(projectPath);

  if (checkNodeModulesFile(filePath, projectPath)) {
    const fakeNodeModulesPath: string = toUnixPath(path.join(projectConfig.projectRootPath, NODE_MODULES));
    let output: string = '';
    if (filePath.indexOf(fakeNodeModulesPath) === -1) {
      const hapPath: string = toUnixPath(projectConfig.projectRootPath);
      const tempFilePath: string = filePath.replace(hapPath, '');
      const sufStr: string = tempFilePath.substring(tempFilePath.indexOf(NODE_MODULES) + NODE_MODULES.length + 1);
      output = path.join(buildPath, TEMPORARY, NODE_MODULES, MAIN, sufStr);
    } else {
      output = filePath.replace(fakeNodeModulesPath, path.join(buildPath, TEMPORARY, NODE_MODULES, AUXILIARY));
    }
    return output;
  }

  if (filePath.indexOf(projectPath) !== -1) {
    const sufStr: string = filePath.replace(projectPath, '');
    const output: string = path.join(buildPath, TEMPORARY, sufStr);
    return output;
  }

  return '';
}

export function genBuildPath(filePath: string, projectPath: string, buildPath: string): string {
  filePath = toUnixPath(filePath);
  if (filePath.endsWith(EXTNAME_MJS)) {
    filePath = filePath.replace(/\.mjs$/, EXTNAME_JS);
  }
  if (filePath.endsWith(EXTNAME_CJS)) {
    filePath = filePath.replace(/\.cjs$/, EXTNAME_JS);
  }
  projectPath = toUnixPath(projectPath);

  if (checkNodeModulesFile(filePath, projectPath)) {
    filePath = toUnixPath(filePath);
    const fakeNodeModulesPath: string = toUnixPath(path.join(projectConfig.projectRootPath, NODE_MODULES));
    let output: string = '';
    if (filePath.indexOf(fakeNodeModulesPath) === -1) {
      const hapPath: string = toUnixPath(projectConfig.projectRootPath);
      const tempFilePath: string = filePath.replace(hapPath, '');
      const sufStr: string = tempFilePath.substring(tempFilePath.indexOf(NODE_MODULES) + NODE_MODULES.length + 1);
      output = path.join(projectConfig.nodeModulesPath, ZERO, sufStr);
    } else {
      output = filePath.replace(fakeNodeModulesPath, path.join(projectConfig.nodeModulesPath, ONE));
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

export function checkNodeModulesFile(filePath: string, projectPath: string): boolean {
  filePath = toUnixPath(filePath);
  projectPath = toUnixPath(projectPath);
  const hapPath: string = toUnixPath(projectConfig.projectRootPath);
  const tempFilePath: string = filePath.replace(hapPath, '');
  if (tempFilePath.indexOf(NODE_MODULES) !== -1) {
    const fakeNodeModulesPath: string = toUnixPath(path.resolve(projectConfig.projectRootPath, NODE_MODULES));
    if (filePath.indexOf(fakeNodeModulesPath) !== -1) {
      return true;
    }
    if (projectConfig.modulePathMap) {
      for (const key in projectConfig.modulePathMap) {
        const value: string = projectConfig.modulePathMap[key];
        const fakeModuleNodeModulesPath: string = toUnixPath(path.resolve(value, NODE_MODULES));
        if (filePath.indexOf(fakeModuleNodeModulesPath) !== -1) {
          return true;
        }
      }
    }
  }

  return false;
}

export function mkdirsSync(dirname: string): boolean {
  if (fs.existsSync(dirname)) {
    return true;
  } else if (mkdirsSync(path.dirname(dirname))) {
    fs.mkdirSync(dirname);
    return true;
  }

  return false;
}

export function writeFileSyncByString(sourcePath: string, sourceCode: string): void {
  const jsFilePath: string = genTemporaryPath(sourcePath, projectConfig.projectPath, process.env.cachePath);
  if (jsFilePath.length === 0) {
    return;
  }
  mkdirsSync(path.dirname(jsFilePath));
  fs.writeFileSync(jsFilePath, sourceCode);
  return;
}

export const packageCollection: Map<string, Array<string>> = new Map();

export function getPackageInfo(configFile: string): Array<string> {
  if (packageCollection.has(configFile)) {
    return packageCollection.get(configFile);
  }
  const data: any = JSON.parse(fs.readFileSync(configFile).toString());
  const bundleName: string = data.app.bundleName;
  const moduleName: string = data.module.name;
  packageCollection.set(configFile, [bundleName, moduleName]);
  return [bundleName, moduleName];
}

function replaceRelativeDependency(item:string, moduleRequest: string, sourcePath: string): string {
  if (sourcePath && projectConfig.compileMode === ESMODULE) {
    const filePath: string = path.resolve(path.dirname(sourcePath), moduleRequest);
    const result: RegExpMatchArray | null = filePath.match(/(\S+)(\/|\\)src(\/|\\)(?:main|ohosTest)(\/|\\)(ets|js)(\/|\\)(\S+)/);
    if (result && projectConfig.aceModuleJsonPath) {
      const npmModuleIdx: number = result[1].search(/(\/|\\)node_modules(\/|\\)/);
      const projectRootPath: string = projectConfig.projectRootPath;
      if (npmModuleIdx === -1 || npmModuleIdx === projectRootPath.search(/(\/|\\)node_modules(\/|\\)/)) {
        const packageInfo: string[] = getPackageInfo(projectConfig.aceModuleJsonPath);
        const bundleName: string = packageInfo[0];
        const moduleName: string = packageInfo[1];
        moduleRequest = `@bundle:${bundleName}/${moduleName}/${result[5]}/${toUnixPath(result[7])}`;
        item = item.replace(/['"](\S+)['"]/, '\"' + moduleRequest + '\"');
      }
    }
  }
  return item;
}

function generateSourceMap(jsFilePath: string, sourceMapContent: string): void {
  let buildFilePath: string = genBuildPath(jsFilePath, projectConfig.projectPath, projectConfig.buildPath);
  if (buildFilePath.length === 0) {
    return;
  }
  if (buildFilePath.endsWith(EXTNAME_ETS)) {
    buildFilePath = buildFilePath.replace(/\.ets$/, EXTNAME_JS);
  } else {
    buildFilePath = buildFilePath.replace(/\.ts$/, EXTNAME_JS);
  }
  let buildSourceMapFile: string = genSourceMapFileName(buildFilePath);
  mkdirsSync(path.dirname(buildSourceMapFile));
  fs.writeFileSync(buildSourceMapFile, sourceMapContent);
}

export function generateSourceFilesToTemporary(node: ts.SourceFile): void {
  const mixedInfo: {content: string, sourceMapContent: string} = genContentAndSourceMapInfo(node, false);
  let jsFilePath: string = genTemporaryPath(node.fileName, projectConfig.projectPath, process.env.cachePath);
  if (jsFilePath.length === 0) {
    return;
  }
  if (jsFilePath.endsWith(EXTNAME_ETS)) {
    jsFilePath = jsFilePath.replace(/\.ets$/, EXTNAME_JS);
  } else {
    jsFilePath = jsFilePath.replace(/\.ts$/, EXTNAME_JS);
  }
  let sourceMapFile: string = genSourceMapFileName(jsFilePath);
  mkdirsSync(path.dirname(jsFilePath));
  if (sourceMapFile.length > 0 && projectConfig.buildArkMode === 'debug') {
    mixedInfo.content += '\n' + "//# sourceMappingURL=" + path.basename(sourceMapFile);
    generateSourceMap(node.fileName, mixedInfo.sourceMapContent);
  }
  // replace relative moduleSpecifier with ohmURl
  const REG_RELATIVE_DEPENDENCY: RegExp = /(?:import|from)(?:\s*)['"]((?:\.\/|\.\.\/).*)['"]/g;
  mixedInfo.content = mixedInfo.content.replace(REG_RELATIVE_DEPENDENCY, (item, moduleRequest)=>{
    return replaceRelativeDependency(item, moduleRequest, node.fileName);
  });

  fs.writeFileSync(jsFilePath, mixedInfo.content);
}

export function writeFileSyncByNode(node: ts.SourceFile, toTsFile: boolean): void {
  if (toTsFile) {
    const newStatements: ts.Node[] = [];
    const tsIgnoreNode: ts.Node = ts.factory.createExpressionStatement(ts.factory.createIdentifier(TS_NOCHECK));
    newStatements.push(tsIgnoreNode);
    if (node.statements && node.statements.length) {
      newStatements.push(...node.statements);
    }

    node = ts.factory.updateSourceFile(node, newStatements);
  }
  const mixedInfo: {content: string, sourceMapContent: string} = genContentAndSourceMapInfo(node, toTsFile);
  let temporaryFile: string = genTemporaryPath(node.fileName, projectConfig.projectPath, process.env.cachePath, toTsFile);
  if (temporaryFile.length === 0) {
    return;
  }
  let temporarySourceMapFile: string = '';
  if (temporaryFile.endsWith(EXTNAME_ETS)) {
    if (toTsFile) {
      temporaryFile = temporaryFile.replace(/\.ets$/, EXTNAME_TS);
    } else {
      temporaryFile = temporaryFile.replace(/\.ets$/, EXTNAME_JS);
    }
    temporarySourceMapFile = genSourceMapFileName(temporaryFile);
  } else {
    if (!toTsFile) {
      temporaryFile = temporaryFile.replace(/\.ts$/, EXTNAME_JS);
      temporarySourceMapFile = genSourceMapFileName(temporaryFile);
    }
  }
  mkdirsSync(path.dirname(temporaryFile));
  if (temporarySourceMapFile.length > 0 && projectConfig.buildArkMode === 'debug') {
    mixedInfo.content += '\n' + "//# sourceMappingURL=" + path.basename(temporarySourceMapFile);
    fs.writeFileSync(temporarySourceMapFile, mixedInfo.sourceMapContent);
  }
  fs.writeFileSync(temporaryFile, mixedInfo.content);
}

function genContentAndSourceMapInfo(node: ts.SourceFile, toTsFile: boolean): any {
  const printer: ts.Printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const options: ts.CompilerOptions = {
    sourceMap: true
  };
  const mapOpions: any = {
    sourceMap: true,
    inlineSourceMap: false,
    inlineSources: false,
    sourceRoot: '',
    mapRoot: '',
    extendedDiagnostics: false
  };
  const host: ts.CompilerHost = ts.createCompilerHost(options);
  const fileName: string = node.fileName;
  // @ts-ignore
  const sourceMapGenerator: any = ts.createSourceMapGenerator(
    host,
    // @ts-ignore
    ts.getBaseFileName(fileName),
    '',
    '',
    mapOpions
  );
  // @ts-ignore
  const writer: any = ts.createTextWriter(
    // @ts-ignore
    ts.getNewLineCharacter({newLine: ts.NewLineKind.LineFeed, removeComments: false}));
  printer['writeFile'](node, writer, sourceMapGenerator);
  const sourceMapJson: any = sourceMapGenerator.toJSON();
  sourceMapJson['sources'] = [fileName];
  const result: string = writer.getText();
  let content: string = result;
  content = processSystemApi(content, true);
  if (toTsFile) {
    content = result.replace(`${TS_NOCHECK};`, TS_NOCHECK);
  }
  const sourceMapContent: string = JSON.stringify(sourceMapJson);

  return {
    content: content,
    sourceMapContent: sourceMapContent
  };
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

export function genSourceMapFileName(temporaryFile: string): string {
  let abcFile: string = temporaryFile;
  if (temporaryFile.endsWith(EXTNAME_TS)) {
    abcFile = temporaryFile.replace(/\.ts$/, EXTNAME_TS_MAP);
  } else {
    abcFile = temporaryFile.replace(/\.js$/, EXTNAME_JS_MAP);
  }
  return abcFile;
}

export function compareNodeVersion(nodeVersion: number = 16): boolean {
  const currentNodeVersion: number = parseInt(process.versions.node.split('.')[0]);
  if (currentNodeVersion >= nodeVersion) {
    return true;
  }

  return false;
}

export function removeDir(dirName: string): void {
  if (fs.existsSync(dirName)) {
    if (compareNodeVersion()) {
      fs.rmSync(dirName, { recursive: true});
    } else {
      fs.rmdirSync(dirName, { recursive: true});
    }
  }
}