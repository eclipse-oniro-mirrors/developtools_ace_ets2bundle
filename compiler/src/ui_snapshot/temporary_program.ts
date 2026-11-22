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
import ts from 'typescript';
import path from 'path';

export function createUITemporaryProgram(id: string, code: string, project: ts.Program,
  baseHost: ts.CompilerHost): ts.Program {
  const options = { ...project.getCompilerOptions() };
  const canonical = (file: string): string => baseHost.getCanonicalFileName(path.resolve(file));
  const target = canonical(id);
  const host: ts.CompilerHost = { ...baseHost };
  const sourceText = (file: string): string | undefined => canonical(file) === target ? code :
    project.getSourceFile(file)?.text ?? baseHost.readFile(file);
  host.readFile = sourceText;
  host.fileExists = file => canonical(file) === target || baseHost.fileExists(file);
  host.getSourceFile = (file, languageVersion, onError) => {
    const text = sourceText(file);
    if (text === undefined) {
      onError?.('Unable to read temporary UI program source: ' + file);
      return undefined;
    }
    return ts.createSourceFile(file, text, languageVersion, true, undefined, options);
  };
  host.getSourceFileByPath = undefined;
  const ambient = project.getSourceFiles().filter(source => canonical(source.fileName) !== target &&
    (!ts.isExternalModule(source) || source.statements.some(statement => ts.isModuleDeclaration(statement) &&
      (ts.isStringLiteral(statement.name) || !!(statement.flags & ts.NodeFlags.GlobalAugmentation)))))
    .map(source => source.fileName);
  return ts.createProgram([id, ...ambient], options, host);
}
