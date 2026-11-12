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
const os = require('os');
const path = require('path');

const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const TYPESCRIPT_ROOT = path.join(COMPILER_ROOT, 'node_modules', 'typescript');
const ts = require(TYPESCRIPT_ROOT);
const typescriptPackage = require(path.join(TYPESCRIPT_ROOT, 'package.json'));
const {
  createCustomTransformer
} = require(path.join(COMPILER_ROOT, 'lib', 'process_interop_ui'));

const EXPECTED_TYPESCRIPT_VERSION = '4.9.5-r4';
const ENTRY_FILE = 'index.d.ets';

function compilerOptions() {
  return {
    allowJs: true,
    checkJs: false,
    declaration: true,
    emitDeclarationOnly: true,
    experimentalDecorators: true,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    noEmit: true,
    noImplicitAny: false,
    skipLibCheck: true,
    target: ts.ScriptTarget.ES2021,
    types: [],
    typeRoots: []
  };
}

function validateToolchain() {
  assert.strictEqual(
    typescriptPackage.name,
    'ohos-typescript',
    'The suite must use the repository ohos-typescript package'
  );
  assert.strictEqual(
    typescriptPackage.version,
    EXPECTED_TYPESCRIPT_VERSION,
    'The suite is pinned to the public AST contract of ohos-typescript4.9.5-r4'
  );
  assert.strictEqual(
    typeof ts.isStructDeclaration,
    'function',
    'The repository TypeScript must expose isStructDeclaration'
  );
  assert.strictEqual(
    typeof ts.getAllDecorators,
    'function',
    'The repository TypeScript must expose getAllDecorators'
  );
  assert.strictEqual(
    typeof createCustomTransformer,
    'function',
    'interopBuild must provide createCustomTransformer(program)'
  );
}

function materializeFiles(caseDefinition, temporaryDirectory) {
  const files = caseDefinition.files || {
    [ENTRY_FILE]: caseDefinition.source
  };
  const writtenFiles = new Map();

  Object.entries(files).forEach(([relativePath, content]) => {
    assert.strictEqual(
      path.isAbsolute(relativePath),
      false,
      `${caseDefinition.id}: fixture paths must be relative`
    );
    const absolutePath = path.resolve(temporaryDirectory, relativePath);
    assert.ok(
      absolutePath.startsWith(temporaryDirectory + path.sep),
      `${caseDefinition.id}: fixture path escapes its temporary directory`
    );
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
    writtenFiles.set(relativePath, absolutePath);
  });

  return writtenFiles;
}

function createProgramForCase(caseDefinition, writtenFiles) {
  const entryRelativePath = caseDefinition.entry || ENTRY_FILE;
  const entryPath = writtenFiles.get(entryRelativePath);
  assert.ok(entryPath, `${caseDefinition.id}: missing entry ${entryRelativePath}`);

  const rootNames = [entryPath];
  Array.from(writtenFiles.entries())
    .filter(([relativePath]) => relativePath !== entryRelativePath)
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([, absolutePath]) => rootNames.push(absolutePath));

  const program = ts.createProgram(rootNames, compilerOptions());
  try {
    const sourceFile = program.getSourceFile(entryPath);
    assert.ok(sourceFile, `${caseDefinition.id}: Program did not load its entry`);
    assert.strictEqual(typeof program.releaseTypeChecker, 'function');
    assert.ok(program.getTypeChecker(), `${caseDefinition.id}: a real TypeChecker is required`);
    const syntacticDiagnostics = program.getSyntacticDiagnostics(sourceFile);
    assert.deepStrictEqual(
      syntacticDiagnostics.map(diagnostic => diagnostic.messageText),
      [],
      `${caseDefinition.id}: fixture has syntactic diagnostics`
    );
    return { program, sourceFile, entryPath };
  } catch (error) {
    program.releaseTypeChecker();
    throw error;
  }
}

function importFacts(sourceFile) {
  return sourceFile.statements
    .filter(statement => ts.isImportDeclaration(statement))
    .map(statement => {
      const clause = statement.importClause;
      const bindings = clause && clause.namedBindings;
      const named = bindings && ts.isNamedImports(bindings)
        ? bindings.elements.map(element => ({
          imported: element.propertyName ? element.propertyName.text : element.name.text,
          local: element.name.text,
          typeOnly: element.isTypeOnly
        }))
        : [];
      return {
        module: statement.moduleSpecifier.text,
        default: clause && clause.name ? clause.name.text : null,
        namespace: bindings && ts.isNamespaceImport(bindings) ? bindings.name.text : null,
        named,
        typeOnly: clause ? clause.isTypeOnly : false,
        generated: statement.pos < 0,
        statementIndex: sourceFile.statements.indexOf(statement)
      };
    });
}

function constructorFacts(sourceFile) {
  const facts = {
    classes: {},
    structs: {}
  };
  sourceFile.statements.forEach(statement => {
    const isClass = ts.isClassDeclaration(statement);
    const isStruct = ts.isStructDeclaration(statement);
    if ((!isClass && !isStruct) || !statement.name) {
      return;
    }
    const target = isClass ? facts.classes : facts.structs;
    target[statement.name.text] = statement.members
      .filter(member => ts.isConstructorDeclaration(member)).length;
  });
  return facts;
}

function directiveFacts(sourceFile) {
  return sourceFile.statements
    .filter(statement => ts.isExpressionStatement(statement) &&
      ts.isStringLiteral(statement.expression))
    .map(statement => statement.expression.text);
}

function makeEvidence(sourceFile, printedOutput) {
  return {
    imports: importFacts(sourceFile).map(item => ({
      module: item.module,
      default: item.default,
      namespace: item.namespace,
      named: item.named.map(element => element.imported === element.local
        ? element.local
        : `${element.imported} as ${element.local}`),
      generated: item.generated,
      statementIndex: item.statementIndex
    })),
    constructors: constructorFacts(sourceFile),
    directives: directiveFacts(sourceFile),
    printedOutput
  };
}

function runTransformCase(caseDefinition, verify) {
  validateToolchain();
  assert.ok(caseDefinition.id, 'Every transform case needs a stable id');
  assert.ok(caseDefinition.branch, `${caseDefinition.id}: branch documentation is required`);
  assert.strictEqual(typeof verify, 'function', `${caseDefinition.id}: assertions are required`);

  const safeId = caseDefinition.id.replace(/[^a-zA-Z0-9_-]/g, '-');
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), `interop-ui-imports-${safeId}-`)
  );
  let transformation;
  let program;
  let printedOutput = '';
  let evidence;
  let transformDisposed = false;
  let typeCheckerReleased = false;

  try {
    const writtenFiles = materializeFiles(caseDefinition, temporaryDirectory);
    const programContext = createProgramForCase(caseDefinition, writtenFiles);
    program = programContext.program;
    const sourceFile = programContext.sourceFile;
    transformation = ts.transform(sourceFile, [createCustomTransformer(program)]);
    assert.strictEqual(
      transformation.transformed.length,
      1,
      `${caseDefinition.id}: transformer must return one SourceFile`
    );
    const transformed = transformation.transformed[0];
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    printedOutput = printer.printFile(transformed);

    const context = {
      assert,
      caseDefinition,
      original: sourceFile,
      printer,
      program,
      sourceFile: transformed,
      transformedText: printedOutput,
      ts,
      typeChecker: program.getTypeChecker()
    };
    const caseEvidence = verify(context) || {};
    evidence = {
      branch: caseDefinition.branch,
      ...makeEvidence(transformed, printedOutput),
      ...caseEvidence
    };
  } catch (error) {
    if (printedOutput && !error.transformedOutput) {
      error.transformedOutput = printedOutput;
    }
    throw error;
  } finally {
    try {
      if (transformation) {
        transformation.dispose();
        transformDisposed = true;
      }
      if (program) {
        program.releaseTypeChecker();
        typeCheckerReleased = true;
      }
    } finally {
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  }

  assert.strictEqual(transformDisposed, true, `${caseDefinition.id}: transform was not disposed`);
  assert.strictEqual(typeCheckerReleased, true, `${caseDefinition.id}: TypeChecker was not released`);
  assert.strictEqual(
    fs.existsSync(temporaryDirectory),
    false,
    `${caseDefinition.id}: temporary directory was not removed`
  );
  return {
    ...evidence,
    temporaryDirectoryDisposed: true,
    transformationDisposed: true,
    typeCheckerReleased: true
  };
}

function toolchainFacts() {
  validateToolchain();
  return {
    node: process.version,
    typescript: `${typescriptPackage.name}@${typescriptPackage.version}`,
    typescriptPath: TYPESCRIPT_ROOT,
    transformer: path.join(COMPILER_ROOT, 'lib', 'process_interop_ui.js'),
    compilerRoot: COMPILER_ROOT
  };
}

module.exports = {
  COMPILER_ROOT,
  ENTRY_FILE,
  EXPECTED_TYPESCRIPT_VERSION,
  runTransformCase,
  toolchainFacts,
  ts,
  validateToolchain
};
