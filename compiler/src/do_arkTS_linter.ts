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

import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';
import { projectConfig } from '../main';
import { toUnixPath } from './utils';

const arkTSDir: string = 'ArkTS';
const arkTSLinterOutputFileName: string = 'ArkTSLinter_output.json';
const spaceNumBeforeJsonLine = 2;

interface OutputInfo {
  categoryInfo: string | undefined;
  fileName: string | undefined;
  line: number | undefined;
  character: number | undefined;
  messageText: string | ts.DiagnosticMessageChain;
}

export enum ArkTSLinterMode {
  NOT_USE = 0,
  COMPATIBLE_MODE = 1,
  STANDARD_MODE = 2
}

export type ProcessDiagnosticsFunc = (diagnostics: ts.Diagnostic) => void;

export function doArkTSLinter(program: ts.Program, arkTSMode: ArkTSLinterMode, printDiagnostic: ProcessDiagnosticsFunc,
  shouldWriteFile: boolean = true): ts.Diagnostic[] {
  if (arkTSMode === ArkTSLinterMode.NOT_USE) {
    return [];
  }

  let diagnostics: ts.Diagnostic[] = ts.runArkTSLinter(program);

  removeOutputFile();
  if (diagnostics.length === 0) {
    return [];
  }

  if (arkTSMode === ArkTSLinterMode.COMPATIBLE_MODE) {
    processArkTSLinterReportAsWarning(diagnostics, printDiagnostic, shouldWriteFile);
  } else {
    processArkTSLinterReportAsError(diagnostics, printDiagnostic);
  }

  return diagnostics;
}

function processArkTSLinterReportAsError(diagnostics: ts.Diagnostic[], printDiagnostic: ProcessDiagnosticsFunc): void {
  diagnostics.forEach((diagnostic: ts.Diagnostic) => {
    printDiagnostic(diagnostic);
  });
}

function processArkTSLinterReportAsWarning(diagnostics: ts.Diagnostic[], printDiagnostic: ProcessDiagnosticsFunc,
  shouldWriteFile: boolean): void {
  const filePath = shouldWriteFile ? writeOutputFile(diagnostics) : undefined;
  if (filePath === undefined) {
    diagnostics.forEach((diagnostic: ts.Diagnostic) => {
      diagnostic.category = ts.DiagnosticCategory.Warning;
      printDiagnostic(diagnostic);
      diagnostic.category = ts.DiagnosticCategory.Error;
    });
    return;
  }
  const logMessage = `Has ${diagnostics.length} ArkTS Linter Error. You can get the output in ${filePath}`;
  const arkTSDiagnostic: ts.Diagnostic = {
    file: undefined,
    start: undefined,
    length: undefined,
    messageText: logMessage,
    category: ts.DiagnosticCategory.Warning,
    code: -1,
    reportsUnnecessary: undefined,
    reportsDeprecated: undefined
  };
  printDiagnostic(arkTSDiagnostic);
}

function writeOutputFile(diagnostics: ts.Diagnostic[]): string | undefined {
  let filePath: string = toUnixPath(projectConfig.cachePath);
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  filePath = toUnixPath(path.join(filePath, arkTSDir));
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  filePath = toUnixPath((path.join(filePath, arkTSLinterOutputFileName)));
  const outputInfo: OutputInfo[] = [];
  diagnostics.forEach((diagnostic: ts.Diagnostic) => {
    const { line, character }: ts.LineAndCharacter =
      diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
    outputInfo.push({
      categoryInfo: diagnostic.category === ts.DiagnosticCategory.Error ? 'Error' : 'Warning',
      fileName: diagnostic.file?.fileName,
      line: line + 1,
      character: character + 1,
      messageText: diagnostic.messageText
    });
  });
  let output: string | undefined = filePath;
  try {
    fs.writeFileSync(filePath, JSON.stringify(outputInfo, undefined, spaceNumBeforeJsonLine));
  } catch {
    output = undefined;
  }
  return output;
}

function removeOutputFile(): void {
  let filePath: string = toUnixPath(projectConfig.cachePath);
  if (!fs.existsSync(filePath)) {
    return;
  }
  filePath = toUnixPath(path.join(filePath, arkTSDir));
  if (!fs.existsSync(filePath)) {
    return;
  }
  filePath = toUnixPath((path.join(filePath, arkTSLinterOutputFileName)));
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
}
