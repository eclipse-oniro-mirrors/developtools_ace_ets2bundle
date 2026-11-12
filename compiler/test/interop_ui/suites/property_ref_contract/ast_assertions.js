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

const assert = require('assert');
const path = require('path');
const ts = require('typescript');

function normalizeInline(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function decoratorExpressionName(expression, sourceFile) {
  const callee = ts.isCallExpression(expression) ? expression.expression : expression;
  if (ts.isIdentifier(callee)) {
    return callee.text;
  }
  if (ts.isPropertyAccessExpression(callee)) {
    return normalizeInline(callee.getText(sourceFile));
  }
  return normalizeInline(callee.getText(sourceFile));
}

function serializeArgument(argument, sourceFile) {
  const kind = ts.SyntaxKind[argument.kind];
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return { kind, value: argument.text };
  }
  if (ts.isIdentifier(argument) || ts.isNumericLiteral(argument)) {
    return { kind, value: argument.text };
  }
  return {
    kind,
    text: normalizeInline(argument.getText(sourceFile))
  };
}

function readDecorator(decorator, sourceFile) {
  const expression = decorator.expression;
  const call = ts.isCallExpression(expression) ? expression : undefined;
  return {
    name: decoratorExpressionName(expression, sourceFile),
    arguments: call ? call.arguments.map(argument => serializeArgument(argument, sourceFile)) : [],
    typeArguments: call && call.typeArguments ?
      call.typeArguments.map(type => normalizeInline(type.getText(sourceFile))) : []
  };
}

function isNamedDeclaration(node, name) {
  return !!node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) && node.name.text === name;
}

function findStruct(sourceFile, structName) {
  const struct = sourceFile.statements.find(statement =>
    ts.isStructDeclaration(statement) && isNamedDeclaration(statement, structName));
  assert.ok(struct, `Missing struct ${structName} in ${sourceFile.fileName}`);
  return struct;
}

function findProperty(struct, propertyName) {
  const property = struct.members.find(member =>
    ts.isPropertyDeclaration(member) && isNamedDeclaration(member, propertyName));
  assert.ok(property, `Missing property ${propertyName} in struct ${struct.name ? struct.name.text : '<anonymous>'}`);
  return property;
}

function readModifiers(node) {
  return (ts.getModifiers(node) || []).map(modifier => modifier.getText());
}

function readProperty(property, sourceFile) {
  const decorators = ts.getAllDecorators(property) || [];
  return {
    decorators: decorators.map(decorator => readDecorator(decorator, sourceFile)),
    type: property.type ? normalizeInline(property.type.getText(sourceFile)) : undefined,
    modifiers: readModifiers(property),
    token: property.questionToken ? '?' : property.exclamationToken ? '!' : '',
    initializer: property.initializer ? normalizeInline(property.initializer.getText(sourceFile)) : undefined
  };
}

function readImport(importDeclaration) {
  const clause = importDeclaration.importClause;
  const result = {
    source: importDeclaration.moduleSpecifier.text,
    named: [],
    defaultImport: undefined,
    namespaceImport: undefined
  };
  if (!clause) {
    return result;
  }
  result.defaultImport = clause.name ? clause.name.text : undefined;
  if (!clause.namedBindings) {
    return result;
  }
  if (ts.isNamespaceImport(clause.namedBindings)) {
    result.namespaceImport = clause.namedBindings.name.text;
    return result;
  }
  if (ts.isNamedImports(clause.namedBindings)) {
    result.named = clause.namedBindings.elements.map(specifier => ({
      imported: specifier.propertyName ? specifier.propertyName.text : specifier.name.text,
      local: specifier.name.text
    }));
  }
  return result;
}

function readImports(sourceFile) {
  return sourceFile.statements.filter(ts.isImportDeclaration).map(readImport);
}

function normalizeExpectedImport(expected) {
  return {
    source: expected.source,
    named: (expected.named || []).map(specifier => {
      if (typeof specifier === 'string') {
        return { imported: specifier, local: specifier };
      }
      return { imported: specifier.imported, local: specifier.local };
    }),
    defaultImport: expected.defaultImport,
    namespaceImport: expected.namespaceImport
  };
}

function assertImportUniqueness(imports) {
  const localNames = new Set();
  imports.forEach(importDeclaration => {
    importDeclaration.named.forEach(specifier => {
      assert.ok(!localNames.has(specifier.local),
        `Duplicate local import ${specifier.local} from ${importDeclaration.source}`);
      localNames.add(specifier.local);
    });
    if (importDeclaration.defaultImport) {
      assert.ok(!localNames.has(importDeclaration.defaultImport),
        `Duplicate default import ${importDeclaration.defaultImport}`);
      localNames.add(importDeclaration.defaultImport);
    }
    if (importDeclaration.namespaceImport) {
      assert.ok(!localNames.has(importDeclaration.namespaceImport),
        `Duplicate namespace import ${importDeclaration.namespaceImport}`);
      localNames.add(importDeclaration.namespaceImport);
    }
  });
}

function assertDirective(sourceFile, directive, expectedImportCount) {
  const first = sourceFile.statements[0];
  assert.ok(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression),
    `Expected directive prologue ${directive}`);
  assert.strictEqual(first.expression.text, directive);
  const imports = sourceFile.statements.slice(1, 1 + expectedImportCount);
  assert.strictEqual(imports.length, expectedImportCount);
  imports.forEach(statement => assert.ok(ts.isImportDeclaration(statement),
    'Generated imports must immediately follow the directive prologue'));
}

function assertDeclarationContract(sourceFile, expected, options = {}) {
  const struct = findStruct(sourceFile, expected.structName);
  const expectedStructModifiers = options.declaration ? ['export', 'declare'] : ['export'];
  assert.deepStrictEqual(readModifiers(struct), expectedStructModifiers,
    `Struct modifiers differ for ${expected.structName}`);

  const actualImports = readImports(sourceFile);
  const normalizedExpectedImports = expected.imports.map(normalizeExpectedImport);
  assert.deepStrictEqual(actualImports, normalizedExpectedImports,
    `Import source, order or bindings differ for ${expected.structName}`);
  assertImportUniqueness(actualImports);

  const actualProperties = struct.members.filter(ts.isPropertyDeclaration).map(member => member.name.getText(sourceFile));
  assert.deepStrictEqual(actualProperties, Object.keys(expected.properties),
    `Property set or order differs for ${expected.structName}`);
  Object.entries(expected.properties).forEach(([propertyName, expectedProperty]) => {
    const property = findProperty(struct, propertyName);
    const actualProperty = readProperty(property, sourceFile);
    assert.deepStrictEqual(actualProperty, expectedProperty,
      `Decorator, modifier, token, type or initializer differs for ${expected.structName}.${propertyName}`);
  });

  const directive = expected.directive || (options.declaration ? 'use static' : undefined);
  if (directive) {
    assertDirective(sourceFile, directive, expected.imports.length);
  }
  return {
    imports: actualImports,
    properties: Object.fromEntries(Object.keys(expected.properties).map(propertyName => [
      propertyName,
      readProperty(findProperty(struct, propertyName), sourceFile)
    ])),
    structModifiers: readModifiers(struct)
  };
}

function findInitializerIdentifier(property, identifierName) {
  let match;
  function visit(node) {
    if (match) {
      return;
    }
    if (ts.isIdentifier(node) && node.text === identifierName) {
      match = node;
      return;
    }
    ts.forEachChild(node, visit);
  }
  if (property.initializer) {
    visit(property.initializer);
  }
  return match;
}

function findDecoratorIdentifier(property, decoratorName) {
  const decorators = ts.getAllDecorators(property) || [];
  for (const decorator of decorators) {
    const expression = decorator.expression;
    const callee = ts.isCallExpression(expression) ? expression.expression : expression;
    if (ts.isIdentifier(callee) && callee.text === decoratorName) {
      return callee;
    }
  }
  return undefined;
}

function assertInputResolution(program, sourceFile, testCase) {
  const expectation = testCase.inputResolution;
  if (!expectation) {
    return undefined;
  }
  const struct = sourceFile.statements.find(ts.isStructDeclaration);
  assert.ok(struct, `${testCase.id}: input struct is required for symbol resolution`);
  const property = findProperty(struct, expectation.property);
  const identifier = expectation.initializer ?
    findInitializerIdentifier(property, expectation.decorator) :
    findDecoratorIdentifier(property, expectation.decorator);
  assert.ok(identifier, `${testCase.id}: missing input identifier ${expectation.decorator}`);

  const checker = program.getTypeChecker();
  const inputSymbol = checker.getSymbolAtLocation(identifier);
  assert.ok(inputSymbol, `${testCase.id}: TypeChecker did not resolve ${expectation.decorator}`);
  const resolvedSymbol = (inputSymbol.flags & ts.SymbolFlags.Alias) ?
    checker.getAliasedSymbol(inputSymbol) : inputSymbol;
  assert.ok(resolvedSymbol.declarations && resolvedSymbol.declarations.length > 0,
    `${testCase.id}: resolved symbol has no declaration`);
  const declaration = resolvedSymbol.declarations[0];
  const actual = {
    sourceFile: path.basename(declaration.getSourceFile().fileName),
    declarationKind: ts.SyntaxKind[declaration.kind]
  };
  assert.deepStrictEqual(actual, {
    sourceFile: expectation.sourceFile,
    declarationKind: expectation.declarationKind
  }, `${testCase.id}: decorator resolved to the wrong declaration`);
  return {
    aliasResolved: resolvedSymbol !== inputSymbol,
    declarationPath: declaration.getSourceFile().fileName,
    ...actual
  };
}

function hasImportedName(sourceFile, source, importedName) {
  return readImports(sourceFile).some(importDeclaration =>
    importDeclaration.source === source && importDeclaration.named.some(specifier =>
      specifier.imported === importedName || specifier.local === importedName));
}

function readObservedProperty(sourceFile, structName, propertyName) {
  const struct = findStruct(sourceFile, structName);
  return readProperty(findProperty(struct, propertyName), sourceFile);
}

module.exports = {
  assertDeclarationContract,
  assertInputResolution,
  findStruct,
  hasImportedName,
  normalizeInline,
  readImports,
  readObservedProperty,
  readProperty
};
