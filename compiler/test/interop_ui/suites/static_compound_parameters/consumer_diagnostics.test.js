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

const path = require('path');
const {
  DIRECTION,
  assert,
  executeCase,
  readNonemptyFile
} = require('../static_calls_dynamic_basic/harness');
const {
  compilerOptions,
  writeFileTree
} = require('../property_ref_contract/program_harness');
const {
  declarationPath,
  generateFreshDeclarations,
  toolchain
} = require('./declaration.test');
const {
  materializeCompoundProject
} = require('./project_files');
const {
  consumerSource,
  mockSdkFiles
} = require('./expected_cases');
const { COMPILER_ROOT } = require('../static_calls_dynamic_basic/harness');

const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

const invalidConsumers = [
  {
    id: 'array-dimension-mismatch',
    title: 'string[] cannot satisfy the nested numeric matrix alias',
    declaration: `function invalidCompoundConsumer(card: CompoundCard): ScoreMatrix {
  return card.aliases;
}
`,
    code: 2322,
    fragments: ['readonly string[]', 'ScoreRow']
  },
  {
    id: 'nested-model-field-mismatch',
    title: 'contact label cannot satisfy the nested GeoPoint model',
    declaration: `function invalidCompoundConsumer(contact: ContactModel): GeoPoint {
  return contact.label;
}
`,
    code: 2322,
    fragments: ['string', 'GeoPoint']
  },
  {
    id: 'nullable-union-requires-undefined',
    title: 'nullable ProfileModel cannot be returned as a definitely present model',
    declaration: `function invalidCompoundConsumer(card: CompoundCard): ProfileModel {
  return card.optionalProfile;
}
`,
    code: 2322,
    fragments: ['undefined', 'ProfileModel']
  },
  {
    id: 'public-interface-mismatch',
    title: 'ProfileModel does not satisfy the unrelated PreferenceModel interface',
    declaration: `function invalidCompoundConsumer(card: CompoundCard): PreferenceModel {
  return card.profile;
}
`,
    code: 2739,
    fragments: ['ProfileModel', 'PreferenceModel']
  },
  {
    id: 'interface-property-primitive-mismatch',
    title: 'boolean preference state cannot satisfy a numeric array consumer',
    declaration: `function invalidCompoundConsumer(preference: PreferenceModel): number[] {
  return preference.enabled;
}
`,
    code: 2322,
    fragments: ['boolean', 'number[]']
  }
];

function diagnosticRecord(program, consumerPath, diagnostic) {
  const position = diagnostic.file && diagnostic.start !== undefined ?
    diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start) : undefined;
  return {
    stage: 'consumer-checker',
    code: diagnostic.code,
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, ' '),
    file: diagnostic.file ? path.relative(path.dirname(consumerPath), diagnostic.file.fileName) : undefined,
    line: position ? position.line + 1 : undefined,
    column: position ? position.character + 1 : undefined
  };
}

function checkInvalidConsumer(workspace, generated, testCase) {
  const cardPath = declarationPath(generated, 'CompoundCard');
  const modelPath = declarationPath(generated, 'CompoundModels');
  const indexPath = declarationPath(generated, 'Index');
  const consumerPath = path.join(generated.outputRoot, 'InvalidConsumer.ets');
  workspace.write(path.relative(workspace.root, consumerPath), consumerSource + testCase.declaration);
  const sdk = writeFileTree(workspace.root, mockSdkFiles);
  const options = {
    ...compilerOptions(workspace.root),
    strictNullChecks: true
  };
  const program = ts.createProgram({
    rootNames: [consumerPath, cardPath, modelPath, indexPath, ...Object.values(sdk)],
    options
  });
  let evidence;
  try {
    const consumer = program.getSourceFile(consumerPath);
    assert.ok(consumer, 'invalid consumer must be part of the Program');
    const syntactic = program.getSyntacticDiagnostics(consumer)
      .map(item => diagnosticRecord(program, consumerPath, item));
    assert.deepStrictEqual(syntactic, [], 'negative consumer input must be syntactically valid');
    const diagnostics = program.getSemanticDiagnostics(consumer)
      .map(item => diagnosticRecord(program, consumerPath, item));
    assert.ok(diagnostics.length > 0,
      `${testCase.id} must not be accepted by the generated declaration checker`);
    for (const diagnostic of diagnostics) {
      assert.strictEqual(diagnostic.code, testCase.code,
        `${testCase.id} emitted an unrelated diagnostic: ${diagnostic.message}`);
      assert.strictEqual(diagnostic.stage, 'consumer-checker');
      assert.strictEqual(diagnostic.file, 'InvalidConsumer.ets');
      assert.ok(diagnostic.line > 0 && diagnostic.column > 0);
    }
    const combined = diagnostics.map(item => item.message).join('\n');
    for (const fragment of testCase.fragments) {
      assert.ok(combined.includes(fragment),
        `${testCase.id} diagnostic must include ${fragment}: ${combined}`);
    }
    const resolved = ts.resolveModuleName('./src/main/ets/CompoundCard', consumerPath, options, ts.sys).resolvedModule;
    assert.ok(resolved, 'negative consumer must still resolve CompoundCard');
    assert.strictEqual(path.resolve(resolved.resolvedFileName), path.resolve(cardPath));
    evidence = {
      consumerPath,
      consumedDeclaration: cardPath,
      expectedCode: testCase.code,
      diagnostics,
      acceptedAsPositive: false
    };
  } finally {
    if (typeof program.releaseTypeChecker === 'function') {
      program.releaseTypeChecker();
    }
    if (typeof program.dispose === 'function') {
      program.dispose();
    }
  }
  workspace.write('evidence/invalid-consumer.json', JSON.stringify(evidence, null, 2));
  return evidence;
}

function findStruct(sourceFile, name) {
  const declaration = sourceFile.statements.find(statement =>
    ts.isStructDeclaration(statement) && statement.name.text === name);
  assert.ok(declaration, `missing struct ${name}`);
  return declaration;
}

function decoratorNames(node) {
  return (ts.getAllDecorators(node) || []).map(decorator => {
    const expression = decorator.expression;
    return ts.isCallExpression(expression) ? expression.expression.getText() : expression.getText();
  });
}

function assertComponentAst(generated) {
  const cardPath = declarationPath(generated, 'CompoundCard');
  const sourceFile = ts.createSourceFile(cardPath, readNonemptyFile(cardPath),
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  const struct = findStruct(sourceFile, 'CompoundCard');
  const properties = new Map(struct.members.filter(ts.isPropertyDeclaration)
    .map(member => [member.name.getText(sourceFile), member]));
  const expected = {
    profile: 'ProfileModel',
    aliases: 'ReadonlyArray<string>',
    matrix: 'ScoreMatrix',
    profileHistory: 'ProfileList',
    optionalProfile: 'NullableProfile',
    preferences: 'PreferenceModel'
  };
  assert.deepStrictEqual(Array.from(properties.keys()).sort(), Object.keys(expected).sort());
  for (const [name, type] of Object.entries(expected)) {
    const property = properties.get(name);
    assert.ok(property.type, `${name} must retain a public type annotation`);
    assert.strictEqual(property.type.getText(sourceFile), type);
    assert.deepStrictEqual(decoratorNames(property), []);
    assert.strictEqual(property.initializer, undefined, `${name} default must not leak into declaration`);
  }
  const aliasesType = properties.get('aliases').type;
  assert.strictEqual(ts.isTypeReferenceNode(aliasesType), true);
  assert.strictEqual(aliasesType.typeName.getText(sourceFile), 'ReadonlyArray');
  assert.deepStrictEqual(aliasesType.typeArguments.map(type => type.getText(sourceFile)), ['string']);
  assert.strictEqual(ts.isTypeReferenceNode(properties.get('matrix').type), true);
  return { cardPath, parameterCount: properties.size, expected };
}

function findStatement(sourceFile, predicate, label) {
  const statement = sourceFile.statements.find(predicate);
  assert.ok(statement, `missing declaration ${label}`);
  return statement;
}

function assertModelAst(generated) {
  const modelPath = declarationPath(generated, 'CompoundModels');
  const sourceFile = ts.createSourceFile(modelPath, readNonemptyFile(modelPath),
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  const profile = findStatement(sourceFile, statement =>
    ts.isClassDeclaration(statement) && statement.name.text === 'ProfileModel', 'ProfileModel');
  const contact = findStatement(sourceFile, statement =>
    ts.isClassDeclaration(statement) && statement.name.text === 'ContactModel', 'ContactModel');
  const preference = findStatement(sourceFile, statement =>
    ts.isInterfaceDeclaration(statement) && statement.name.text === 'PreferenceModel', 'PreferenceModel');
  const nullable = findStatement(sourceFile, statement =>
    ts.isTypeAliasDeclaration(statement) && statement.name.text === 'NullableProfile', 'NullableProfile');
  const matrix = findStatement(sourceFile, statement =>
    ts.isTypeAliasDeclaration(statement) && statement.name.text === 'ScoreMatrix', 'ScoreMatrix');
  const required = findStatement(sourceFile, statement =>
    ts.isClassDeclaration(statement) && statement.name.text === 'RequiredCtorModel', 'RequiredCtorModel');
  const contactProperty = profile.members.find(member =>
    ts.isPropertyDeclaration(member) && member.name.getText(sourceFile) === 'contact');
  assert.strictEqual(contactProperty.type.getText(sourceFile), 'ContactModel');
  assert.ok(decoratorNames(profile).includes('Observed'));
  assert.ok(decoratorNames(contact).includes('Observed'));
  assert.strictEqual(preference.members.length, 2);
  assert.strictEqual(ts.isUnionTypeNode(nullable.type), true);
  assert.deepStrictEqual(nullable.type.types.map(type => type.getText(sourceFile)),
    ['ProfileModel', 'undefined']);
  assert.strictEqual(matrix.type.getText(sourceFile), 'ReadonlyArray<ScoreRow>');
  const constructors = required.members.filter(ts.isConstructorDeclaration);
  assert.strictEqual(constructors.length, 1);
  assert.strictEqual(constructors[0].parameters.length, 1);
  assert.strictEqual(constructors[0].parameters[0].type.getText(sourceFile), 'string');
  return { modelPath, nullableMembers: nullable.type.types.length, constructorParameters: 1 };
}

function assertIndexAst(generated) {
  const indexPath = declarationPath(generated, 'Index');
  const sourceFile = ts.createSourceFile(indexPath, readNonemptyFile(indexPath),
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  const exports = sourceFile.statements.filter(ts.isExportDeclaration);
  assert.strictEqual(exports.length, 2);
  const cardExport = exports.find(statement =>
    statement.moduleSpecifier.text === './src/main/ets/CompoundCard');
  const modelExport = exports.find(statement =>
    statement.moduleSpecifier.text === './src/main/ets/CompoundModels');
  assert.ok(cardExport && modelExport, 'Index must retain source-relative export identities');
  assert.ok(cardExport.exportClause && ts.isNamedExports(cardExport.exportClause));
  assert.ok(modelExport.exportClause && ts.isNamedExports(modelExport.exportClause));
  const cardNames = cardExport.exportClause.elements.map(element => element.name.text);
  const modelNames = modelExport.exportClause.elements.map(element => element.name.text);
  assert.deepStrictEqual(cardNames, ['CompoundCard']);
  for (const name of [
    'AlternateProfile', 'ContactModel', 'GeoPoint', 'NullableProfile',
    'PreferenceModel', 'ProfileList', 'ProfileModel', 'ScoreMatrix',
    'createOptionalProfile', 'selectProfile', 'requireConstructedModel'
  ]) {
    assert.ok(modelNames.includes(name), `Index export is missing ${name}`);
  }
  assert.ok(!sourceFile.statements.some(ts.isExportAssignment));
  return { indexPath, cardNames, modelNames };
}

async function runConsumerDiagnosticUnits(options = {}) {
  const results = [];
  const astCases = [
    {
      name: 'compound-ast-component-parameter-shapes',
      coverage: 'Struct property decorators, array/type-reference nodes and removed defaults',
      assertion: assertComponentAst
    },
    {
      name: 'compound-ast-model-union-and-constructor-shapes',
      coverage: 'Nested classes, interface members, union alternatives and required constructor signature',
      assertion: assertModelAst
    },
    {
      name: 'compound-ast-index-export-source-identities',
      coverage: 'Barrel exports preserve named models and exact relative source modules',
      assertion: assertIndexAst
    }
  ];
  for (const testCase of astCases) {
    results.push(await executeCase({
      name: testCase.name,
      group: 'unit',
      direction: DIRECTION,
      kind: 'declaration-ast',
      coverage: testCase.coverage
    }, async context => {
      const project = materializeCompoundProject(context.workspace, '/unit-sdk', 'compound');
      const generated = generateFreshDeclarations(context.workspace, project);
      const evidence = testCase.assertion(generated);
      context.passStage('declaration-ast');
      return { toolchain: toolchain(), generated, evidence };
    }, options));
  }
  for (const testCase of invalidConsumers) {
    results.push(await executeCase({
      name: `compound-checker-rejects-${testCase.id}`,
      group: 'unit',
      direction: DIRECTION,
      kind: 'negative-checker',
      coverage: testCase.title
    }, async context => {
      const project = materializeCompoundProject(context.workspace, '/unit-sdk', 'compound');
      const generated = generateFreshDeclarations(context.workspace, project);
      const evidence = checkInvalidConsumer(context.workspace, generated, testCase);
      context.passStage('expected-consumer-diagnostic', { code: testCase.code });
      return { toolchain: toolchain(), generated, diagnostics: evidence.diagnostics, evidence };
    }, options));
  }
  return results;
}

module.exports = {
  assertComponentAst,
  assertIndexAst,
  assertModelAst,
  checkInvalidConsumer,
  invalidConsumers,
  runConsumerDiagnosticUnits
};
