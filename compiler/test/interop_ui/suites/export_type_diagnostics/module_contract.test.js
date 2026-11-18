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

const fs = require('fs');
const path = require('path');
const { fixtures } = require('./module_cases');
const { compilerOptions, sdkFiles, writeFileTree } = require('../property_ref_contract/program_harness');
const { assertInteropLibFresh } = require('../dynamic_calls_static_basic/unit.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

function diagnostics(program, root) {
  return [...program.getSyntacticDiagnostics(), ...program.getSemanticDiagnostics()]
    .filter(item => item.file && item.file.fileName.startsWith(root))
    .map(item => {
      const point = item.file.getLineAndCharacterOfPosition(item.start);
      return { code: item.code, message: ts.flattenDiagnosticMessageText(item.messageText, ' '),
        file: path.relative(root, item.file.fileName), line: point.line + 1, column: point.character + 1 };
    });
}

function emit(t, fixture) {
  assertInteropLibFresh();
  const input = path.join(t.workspace, 'input');
  const output = path.join(t.workspace, 'generated');
  const files = writeFileTree(input, fixture.files);
  writeFileTree(t.workspace, { ...sdkFiles,
    'sdk/component.d.ets': sdkFiles['sdk/component.d.ets'] +
      'export declare class Counter {}\n' });
  const options = { ...compilerOptions(t.workspace), noEmit: false, declaration: true,
    emitDeclarationOnly: true, strict: true, skipLibCheck: false, rootDir: input, outDir: output };
  const program = ts.createProgram(Object.values(files), options);
  const { HandleUIImports } = require(path.join(COMPILER_ROOT, 'lib/process_interop_ui'));
  const sourceDiagnostics = diagnostics(program, input);
  const emitted = [];
  try {
    const result = program.emit(undefined, (file, text) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
      emitted.push(file);
    }, undefined, true, { afterDeclarations: [context => source =>
      new HandleUIImports(program.getTypeChecker(), context).createCustomTransformer(source)] });
    t.equal(result.emitSkipped, false);
    t.equal(emitted.length, Object.keys(fixture.files).length);
    for (const file of emitted) {
      t.greater(fs.statSync(file).size, 0);
      t.ok(file.startsWith(output + path.sep));
    }
    return { sourceDiagnostics, output, emitted };
  } finally {
    program.releaseTypeChecker();
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
  }
}

function consume(t, fixture, generated) {
  const file = path.join(t.workspace, 'Consumer.ts');
  fs.writeFileSync(file, fixture.consumer);
  const options = { ...compilerOptions(t.workspace), strict: true,
    skipLibCheck: false, noEmit: true };
  const program = ts.createProgram([file, ...generated.emitted], options);
  try {
    const source = program.getSourceFile(file);
    const imports = source.statements.filter(ts.isImportDeclaration);
    t.equal(imports.length, 1);
    const resolved = ts.resolveModuleName(imports[0].moduleSpecifier.text, file, options, ts.sys).resolvedModule;
    t.ok(resolved);
    t.equal(resolved.resolvedFileName, path.join(generated.output, 'Index.d.ts'));
    const actual = diagnostics(program, t.workspace)
      .filter(item => !item.file.startsWith('sdk' + path.sep));
    return { diagnostics: actual, consumed: resolved.resolvedFileName };
  } finally {
    program.releaseTypeChecker();
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
  }
}

const cases = fixtures.map(fixture => ({
  id: `module-${fixture.id}`,
  group: 'unit',
  direction: '12-to-11',
  run(t) {
    const generated = emit(t, fixture);
    const actual = consume(t, fixture, generated);
    t.deepEqual(generated.sourceDiagnostics.map(item => item.code), fixture.expected.sourceCodes);
    t.deepEqual(actual.diagnostics.map(item => item.code), fixture.expected.consumerCodes,
      JSON.stringify(actual.diagnostics));
    for (const diagnostic of [...generated.sourceDiagnostics, ...actual.diagnostics]) {
      t.greater(diagnostic.line, 0);
      t.greater(diagnostic.column, 0);
    }
    const messages = actual.diagnostics.map(item => item.message).join('\n');
    for (const fragment of fixture.expected.fragments) {
      t.includes(messages, fragment);
    }
    t.record('generated-multi-module-contract', { boundary: fixture.boundary,
      inputs: fixture.files, consumer: fixture.consumer, ...generated, ...actual });
  }
}));

module.exports = { cases };
