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

'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { ts } = require('../static_multifile_exports/declaration_ast');

function consume(root, source, declarations) {
  const file = path.join(root, 'Caller.ets');
  fs.writeFileSync(file, source);
  const entry = declarations.Index.path;
  const options = { noEmit: true, strict: true, skipLibCheck: true, types: [], allowNonTsExtensions: true,
    target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.NodeJs };
  const host = ts.createCompilerHost(options);
  const available = new Set(Object.values(declarations).map(item => item.path));
  host.resolveModuleNames = (names, containing) => names.map(name => {
    const target = name === 'current' ? entry : path.resolve(path.dirname(containing), name + '.d.ets');
    if (available.has(target)) {
      return { resolvedFileName: target, extension: ts.Extension.Dts, isExternalLibraryImport: false };
    }
    return ts.resolveModuleName(name, containing, options, host).resolvedModule;
  });
  const program = ts.createProgram([file], options, host);
  try {
    for (const declaration of available) {
      assert.ok(program.getSourceFile(declaration), `Caller did not consume ${declaration}`);
    }
    const caller = program.getSourceFile(file);
    return [...program.getSyntacticDiagnostics(caller), ...program.getSemanticDiagnostics(caller)].map(item => {
      assert.strictEqual(item.file.fileName, file);
      const point = caller.getLineAndCharacterOfPosition(item.start);
      return { code: item.code, line: point.line + 1, column: point.character + 1,
        message: ts.flattenDiagnosticMessageText(item.messageText, ' ') };
    });
  } finally {
    program.releaseTypeChecker();
    program.dispose?.();
  }
}

module.exports = { consume };
