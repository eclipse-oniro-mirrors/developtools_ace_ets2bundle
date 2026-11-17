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
const vm = require('vm');
const { spawnSync } = require('child_process');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));
const { production } = require('../dynamic_calls_static_basic/unit.test');
const { StageFailure } = require('../static_calls_dynamic_basic/harness');

function write(root, relative, content) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}

function diagnostic(source, diagnostic) {
  const position = diagnostic.file && diagnostic.start !== undefined ?
    diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
  return {
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
    file: diagnostic.file && path.basename(diagnostic.file.fileName),
    line: position && position.line + 1,
    column: position && position.character + 1,
    input: source
  };
}

function configure(root, fixture, evolution) {
  const declarations = path.join(root, 'declgenV1');
  const declaration = write(declarations, 'src/main/ets/Models.d.ets', fixture.declaration);
  const caller = write(root, fixture.extension || 'Caller.ets', fixture.source);
  const options = {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    strict: true,
    skipLibCheck: true,
    experimentalDecorators: true,
    noEmit: false,
    types: []
  };
  const host = ts.createCompilerHost(options);
  host.isStaticSourceFile = file => fixture.staticRecord !== false && file === declaration;
  const resolve = ts.resolveModuleName;
  host.resolveModuleNames = (names, containingFile) => names.map(name => {
    if (name === 'models') {
      return { resolvedFileName: declaration, extension: ts.Extension.Dts, isExternalLibraryImport: true };
    }
    return resolve(name, containingFile, options, host).resolvedModule;
  });
  evolution.cleanUpProcessArkTSEvolutionObj();
  evolution.arkTSEvolutionModuleMap.set(fixture.package || 'cards', {
    language: '1.2',
    packageName: fixture.package || 'cards',
    moduleName: 'cards',
    modulePath: root,
    declgenV1OutPath: declarations
  });
  const program = ts.createProgram([caller, declaration], options, host);
  return { program, caller, declaration };
}

function inspect(output) {
  const source = ts.createSourceFile('Output.ets', output, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  const result = { lookups: [], assignments: [], constructors: [], classes: [], records: [], imports: [] };
  function visit(node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const name = node.expression.getText(source);
      if (name.startsWith('globalThis.Panda.')) {
        result.lookups.push({ method: node.expression.name.text, record: node.arguments[0].text });
      }
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      result.assignments.push({ left: node.left.getText(source), right: node.right.getText(source) });
    }
    if (ts.isNewExpression(node)) {
      result.constructors.push({ name: node.expression.getText(source), arguments: (node.arguments || []).map(n => n.getText(source)) });
    }
    if (ts.isImportDeclaration(node)) {
      result.imports.push(node.moduleSpecifier.text);
    }
    if (ts.isClassDeclaration(node)) {
      const ctor = node.members.find(ts.isConstructorDeclaration);
      const statements = ctor && ctor.body ? ctor.body.statements : [];
      result.classes.push({
        name: node.name.text,
        parameters: ctor ? ctor.parameters.map(p => p.getText(source)) : [],
        statements: statements.map(statement => statement.getText(source)),
        directives: statements.filter(s => ts.isExpressionStatement(s) && ts.isStringLiteral(s.expression))
          .map(s => s.expression.text),
        methods: node.members.filter(ts.isMethodDeclaration).map(m => m.name.getText(source)),
        heritage: (node.heritageClauses || []).map(c => c.getText(source))
      });
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  result.records = result.lookups.map(lookup => lookup.record);
  return result;
}

function runtime(output, fixture) {
  if (!fixture.evaluate) {
    return null;
  }
  const lookups = [];
  const created = [];
  const sandbox = {
    exports: {},
    require() {
      return {};
    },
    console: { info() {}, log() {} },
    Panda: {
      getClass(record) {
        lookups.push(record);
        return class {
          constructor() {
            created.push(record);
          }
        };
      },
      getInstance(record) {
        lookups.push(record);
        return {};
      }
    }
  };
  const javascript = ts.transpileModule(output, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021 }
  }).outputText;
  vm.runInNewContext(javascript, sandbox, { timeout: 2000 });
  const fn = sandbox.exports.probe;
  if (typeof fn !== 'function') {
    throw new Error('Runtime fixture must export probe()');
  }
  const values = [];
  for (let index = 0; index < (fixture.invocations || 1); index += 1) {
    values.push(JSON.parse(JSON.stringify(fn())));
  }
  return { values, lookups, created };
}

function worker(root, fixture) {
  const { evolution } = production();
  const configured = configure(root, fixture, evolution);
  const { program, caller } = configured;
  let transformation;
  try {
    const source = program.getSourceFile(caller);
    const syntax = program.getSyntacticDiagnostics(source).map(d => diagnostic(fixture.source, d));
    if (syntax.length) {
      throw new Error(JSON.stringify(syntax));
    }
    const checker = program.getTypeChecker();
    const contextual = [];
    const visit = node => {
      if (ts.isObjectLiteralExpression(node)) {
        const type = checker.getContextualType(node);
        contextual.push({ text: node.getText(source), type: type && checker.typeToString(type),
          staticRecord: Boolean(type && checker.isStaticRecord(type)) });
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
    evolution.resetInteropTransformLog();
    transformation = ts.transform(source, [evolution.interopTransform(program, caller, fixture.mixCompile !== false)]);
    const output = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(transformation.transformed[0]);
    write(root, 'transformed.ets', output);
    return {
      output,
      analysis: inspect(output),
      contextual,
      diagnostics: program.getSemanticDiagnostics(source).map(d => diagnostic(fixture.source, d)),
      errors: evolution.interopTransformLog.errors,
      runtime: runtime(output, fixture),
      declaration: configured.declaration,
      checker: 'real ohos-typescript Program'
    };
  } finally {
    if (transformation) {
      transformation.dispose();
    }
    program.releaseTypeChecker();
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
    evolution.cleanUpProcessArkTSEvolutionObj();
  }
}

function executeFixture(t, fixture) {
  const processResult = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }),
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024
  });
  if (fixture.knownFailure) {
    const known = fixture.knownFailure;
    if (processResult.status === 0) {
      throw new StageFailure(known.stage, 'implementation', 'STALE_KNOWN_FAILURE',
        `Remove the resolved failure contract for ${fixture.id}`);
    }
    t.equal(processResult.status, 1, 'Worker must exit normally with its compiler error');
    t.includes(processResult.stderr, known.fingerprint);
    t.ok(fs.statSync(path.join(t.workspace, 'Caller.ets')).size > 0);
    const logPath = write(t.workspace, 'evolution-error.log', processResult.stderr);
    t.record('existing-transform-failure', { ...known, logPath, source: fixture.source });
    throw new StageFailure(known.stage, 'existing', known.code, known.fingerprint, { logPath });
  }
  t.equal(processResult.status, 0, processResult.stderr || 'Evolution worker failed');
  const resultPath = path.join(t.workspace, 'evolution-result.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  t.record('evolution-transform', { resultPath, ...result });
  return result;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    const value = worker(input.root, input.fixture);
    write(input.root, 'evolution-result.json', JSON.stringify(value, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture };
