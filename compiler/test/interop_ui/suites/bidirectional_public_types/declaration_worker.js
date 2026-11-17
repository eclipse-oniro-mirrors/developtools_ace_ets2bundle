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
const { spawnSync } = require('child_process');
const { findFatalDiagnostics } = require('../dynamic_calls_static_basic/expected_cases');
const { runCase, ts } = require('../monitor_declaration_signatures/test_support');

function initialStats() {
  return {
    tempDirectoriesCreated: 0,
    tempDirectoriesRemoved: 0,
    programsCreated: 0,
    programReferencesReleased: 0,
    programsDisposed: 0,
    typeCheckersCreated: 0,
    typeCheckersReleased: 0,
    handleUIImportsTransforms: 0,
    transformationResultsDisposed: 0,
    afterDeclarationsCaptures: 0,
    declgenRuns: 0,
    declgenRepeatChecks: 0,
    declgenStateSnapshots: 0,
    declgenStateRestores: 0
  };
}

function modifierNames(node) {
  return (ts.getModifiers(node) || []).map(modifier => ts.tokenToString(modifier.kind));
}

function inspectDeclarations(source) {
  const symbols = [];
  const members = [];
  const imports = [];
  function text(node) {
    return node ? node.getText(source) : null;
  }
  function parameters(node) {
    return (node.parameters || []).map(parameter => ({ name: text(parameter.name),
      type: text(parameter.type), optional: Boolean(parameter.questionToken),
      rest: Boolean(parameter.dotDotDotToken) }));
  }
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const bindings = statement.importClause && statement.importClause.namedBindings;
      imports.push({ module: statement.moduleSpecifier.text,
        names: bindings && ts.isNamedImports(bindings) ? bindings.elements.map(n => n.name.text) : [] });
      continue;
    }
    if (!statement.name) {
      continue;
    }
    const location = source.getLineAndCharacterOfPosition(statement.getStart(source));
    symbols.push({ name: text(statement.name), kind: ts.SyntaxKind[statement.kind],
      type: text(statement.type), parameters: parameters(statement),
      generics: (statement.typeParameters || []).map(text), modifiers: modifierNames(statement),
      line: location.line + 1, column: location.character + 1 });
    for (const member of statement.members || []) {
      const point = source.getLineAndCharacterOfPosition(member.getStart(source));
      members.push({ owner: text(statement.name), name: member.name ? text(member.name) : 'constructor',
        kind: ts.SyntaxKind[member.kind], type: text(member.type), parameters: parameters(member),
        modifiers: modifierNames(member), decorators: (ts.getAllDecorators(member) || []).map(d => text(d.expression)),
        hasBody: Boolean(member.body), line: point.line + 1, column: point.character + 1 });
    }
  }
  return { symbols, members, imports };
}

function consumerHost(options, output, resolutions) {
  const host = ts.createCompilerHost(options);
  host.resolveModuleNames = (names, containing) => names.map(name => {
    const resolved = name === 'generated' ?
      { resolvedFileName: output, extension: ts.Extension.Dts, isExternalLibraryImport: false } :
      ts.resolveModuleName(name, containing, options, host).resolvedModule;
    resolutions.push({ name, containing, path: resolved && resolved.resolvedFileName });
    return resolved;
  });
  return host;
}

function consume(root, fixture, output) {
  if (!fixture.consumer) {
    return null;
  }
  const file = path.join(root, 'Consumer.ets');
  fs.writeFileSync(file, fixture.consumer);
  const options = { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs, allowNonTsExtensions: true,
    strict: true, skipLibCheck: true, experimentalDecorators: true, noEmit: true, types: [] };
  const resolutions = [];
  const host = consumerHost(options, output, resolutions);
  const program = ts.createProgram([file, output], options, host);
  try {
    const source = program.getSourceFile(file);
    const imports = source.statements.filter(ts.isImportDeclaration).map(statement => {
      const resolution = resolutions.find(item => item.name === statement.moduleSpecifier.text && item.containing === file);
      if (!resolution || resolution.path !== output) {
        throw new Error('Consumer did not resolve the generated declaration');
      }
      return { specifier: resolution.name, resolved: resolution.path, bytes: fs.statSync(resolution.path).size };
    });
    const diagnostics = [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)]
      .map(diagnostic => {
        const point = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        return { code: diagnostic.code, message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
          file: path.basename(diagnostic.file.fileName), line: point.line + 1, column: point.character + 1 };
      });
    return { diagnostics, imports, checker: 'real ohos-typescript Program', generatedPath: output };
  } finally {
    program.releaseTypeChecker();
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
  }
}

function worker(root, fixture) {
  const context = { artifactRoot: root, stats: initialStats() };
  let inspection;
  const result = runCase({ ...fixture, title: fixture.boundary,
    fileName: fixture.id + (fixture.mode === 'transform' ? '.d.ets' : '.ets') }, context, actual => {
    const parsed = ts.createSourceFile(actual.outputPath, actual.text,
      ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
    inspection = inspectDeclarations(parsed);
  });
  const consumed = consume(root, fixture, result.outputPath);
  return { ...result, inspection, consumer: consumed, stats: context.stats,
    text: fs.readFileSync(result.outputPath, 'utf8') };
}

function executeFixture(t, fixture) {
  const result = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(result.status, 0, result.stderr || 'Declaration worker failed');
  t.deepEqual(findFatalDiagnostics(`${result.stdout}\n${result.stderr}`), [],
    'Declaration generation reported fatal diagnostics');
  const file = path.join(t.workspace, 'declaration-result.json');
  const actual = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.record('generated-public-contract', { file, stdout: result.stdout, stderr: result.stderr,
    outputPath: actual.outputPath, mode: actual.mode, stats: actual.stats });
  return actual;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    const result = worker(input.root, input.fixture);
    fs.writeFileSync(path.join(input.root, 'declaration-result.json'), JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture };
