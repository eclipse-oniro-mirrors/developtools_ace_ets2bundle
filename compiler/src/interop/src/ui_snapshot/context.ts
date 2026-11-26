/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import type ts from 'typescript';
import path from 'path';
import { projectConfig } from '../../main';

let activeProgram: ts.Program | undefined;
let checkerForbidden: number = 0;

export function getUIProgram(): ts.Program | undefined {
  return activeProgram;
}

export function withUIProgram<T>(program: ts.Program, action: () => T): T {
  const previous = activeProgram;
  activeProgram = program;
  try {
    return action();
  } finally {
    activeProgram = previous;
  }
}

export function withoutUIChecker<T>(action: () => T): T {
  checkerForbidden++;
  try {
    return action();
  } finally {
    checkerForbidden--;
  }
}

export function assertUICheckerAllowed(): void {
  if (checkerForbidden) {
    throw new Error('UI snapshot consumer attempted to acquire a TypeChecker');
  }
}

export function useUISemanticSnapshots(): boolean {
  return projectConfig.earlyReleaseChecker === true && projectConfig.compileMode === 'esmodule' &&
    process.env.compileTool === 'rollup' && process.env.watchMode !== 'true' &&
    projectConfig.executionMode !== 'performance' && !projectConfig.isPreview && !projectConfig.hotReload &&
    !projectConfig.coldReload && !projectConfig.useArkoala;
}

export function isUIResourceFile(fileName: string): boolean {
  return /\.ts$/.test(fileName) || process.env.compileMode !== 'moduleJson' &&
    path.resolve(fileName) === path.resolve(projectConfig.projectPath || '', 'app.ets');
}
