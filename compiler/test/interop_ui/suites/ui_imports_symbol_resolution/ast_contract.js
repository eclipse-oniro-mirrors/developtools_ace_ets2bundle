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

function importsOf(context, generated) {
  const { sourceFile, ts } = context;
  return sourceFile.statements
    .filter(statement => ts.isImportDeclaration(statement))
    .filter(statement => generated === undefined || (statement.pos < 0) === generated)
    .map(statement => describeImport(context, statement));
}

function describeImport(context, statement) {
  const { ts } = context;
  const clause = statement.importClause;
  const bindings = clause && clause.namedBindings;
  return {
    module: statement.moduleSpecifier.text,
    default: clause && clause.name ? clause.name.text : null,
    namespace: bindings && ts.isNamespaceImport(bindings) ? bindings.name.text : null,
    named: bindings && ts.isNamedImports(bindings)
      ? bindings.elements.map(element => ({
        imported: element.propertyName ? element.propertyName.text : element.name.text,
        local: element.name.text,
        typeOnly: element.isTypeOnly
      }))
      : [],
    typeOnly: clause ? clause.isTypeOnly : false
  };
}

function normalizeNamed(named) {
  return (named || []).map(element => {
    if (typeof element === 'string') {
      return {
        imported: element,
        local: element,
        typeOnly: false
      };
    }
    return {
      imported: element.imported || element.local,
      local: element.local || element.imported,
      typeOnly: element.typeOnly || false
    };
  });
}

function normalizeImport(expected) {
  return {
    module: expected.module,
    default: expected.default || null,
    namespace: expected.namespace || null,
    named: normalizeNamed(expected.named),
    typeOnly: expected.typeOnly || false
  };
}

function comparableImports(imports) {
  return imports.map(item => ({
    module: item.module,
    default: item.default,
    namespace: item.namespace,
    named: item.named.map(element => ({
      imported: element.imported,
      local: element.local,
      typeOnly: element.typeOnly
    })),
    typeOnly: item.typeOnly
  }));
}

function assertGeneratedImports(context, expected) {
  const actual = comparableImports(importsOf(context, true));
  const wanted = expected.map(normalizeImport);
  context.assert.deepStrictEqual(
    actual,
    wanted,
    `${context.caseDefinition.id}: generated import structure or order differs`
  );
}

function assertOriginalImports(context, expected) {
  const actual = comparableImports(importsOf(context, false));
  const wanted = expected.map(normalizeImport);
  context.assert.deepStrictEqual(
    actual,
    wanted,
    `${context.caseDefinition.id}: original import structure was not preserved`
  );
}

function verifyCommonExpectations(context, expectation) {
  if (Object.prototype.hasOwnProperty.call(expectation, 'generatedImports')) {
    assertGeneratedImports(context, expectation.generatedImports);
  }
  if (Object.prototype.hasOwnProperty.call(expectation, 'originalImports')) {
    assertOriginalImports(context, expectation.originalImports);
  }
  (expectation.absentGeneratedNames || []).forEach(name => {
    assertGeneratedNameAbsent(context, name);
  });
}

function allGeneratedNames(context) {
  const names = [];
  importsOf(context, true).forEach(item => {
    if (item.default) {
      names.push(item.default);
    }
    if (item.namespace) {
      names.push(item.namespace);
    }
    item.named.forEach(element => {
      names.push(element.imported, element.local);
    });
  });
  return names;
}

function assertGeneratedNameAbsent(context, name) {
  context.assert.strictEqual(
    allGeneratedNames(context).includes(name),
    false,
    `${context.caseDefinition.id}: ${name} must not be auto-imported`
  );
}

function countGeneratedName(context, name) {
  let count = 0;
  importsOf(context, true).forEach(item => {
    if (item.default === name || item.namespace === name) {
      count += 1;
    }
    item.named.forEach(element => {
      if (element.imported === name || element.local === name) {
        count += 1;
      }
    });
  });
  return count;
}

function assertGeneratedNameCount(context, name, expectedCount) {
  context.assert.strictEqual(
    countGeneratedName(context, name),
    expectedCount,
    `${context.caseDefinition.id}: generated occurrence count for ${name}`
  );
}

function statementLabel(context, statement) {
  const { sourceFile, ts } = context;
  if (ts.isImportDeclaration(statement)) {
    return `import:${statement.moduleSpecifier.text}`;
  }
  if (ts.isExpressionStatement(statement) && ts.isStringLiteral(statement.expression)) {
    return `directive:${statement.expression.text}`;
  }
  if (ts.isStructDeclaration(statement)) {
    return `struct:${statement.name ? statement.name.text : '<anonymous>'}`;
  }
  if (ts.isClassDeclaration(statement)) {
    return `class:${statement.name ? statement.name.text : '<anonymous>'}`;
  }
  if (ts.isFunctionDeclaration(statement)) {
    return `function:${statement.name ? statement.name.text : '<anonymous>'}`;
  }
  if (ts.isInterfaceDeclaration(statement)) {
    return `interface:${statement.name.text}`;
  }
  return `other:${ts.SyntaxKind[statement.kind]}@${statement.pos}:${statement.end}:${sourceFile.fileName}`;
}

function assertStatementOrder(context, expectedLabels) {
  const actualLabels = context.sourceFile.statements
    .map(statement => statementLabel(context, statement));
  context.assert.deepStrictEqual(
    actualLabels,
    expectedLabels,
    `${context.caseDefinition.id}: statement order differs`
  );
}

function declarationsOf(context, predicate) {
  const declarations = [];
  function visit(node) {
    if (predicate(node)) {
      declarations.push(node);
    }
    context.ts.forEachChild(node, visit);
  }
  visit(context.sourceFile);
  return declarations;
}

function findClass(context, name) {
  const match = declarationsOf(
    context,
    node => context.ts.isClassDeclaration(node) && node.name && node.name.text === name
  );
  context.assert.strictEqual(match.length, 1, `${context.caseDefinition.id}: class ${name}`);
  return match[0];
}

function findStruct(context, name) {
  const match = declarationsOf(
    context,
    node => context.ts.isStructDeclaration(node) && node.name && node.name.text === name
  );
  context.assert.strictEqual(match.length, 1, `${context.caseDefinition.id}: struct ${name}`);
  return match[0];
}

function findInterface(context, name) {
  const match = declarationsOf(
    context,
    node => context.ts.isInterfaceDeclaration(node) && node.name.text === name
  );
  context.assert.strictEqual(match.length, 1, `${context.caseDefinition.id}: interface ${name}`);
  return match[0];
}

function findFunction(context, name) {
  const match = declarationsOf(
    context,
    node => context.ts.isFunctionDeclaration(node) && node.name && node.name.text === name
  );
  context.assert.strictEqual(match.length, 1, `${context.caseDefinition.id}: function ${name}`);
  return match[0];
}

function findMember(context, declaration, name, predicate) {
  const matches = declaration.members.filter(member => {
    if (!member.name) {
      return false;
    }
    const memberName = context.ts.isIdentifier(member.name) ||
      context.ts.isStringLiteral(member.name)
      ? member.name.text
      : null;
    return memberName === name && (!predicate || predicate(member));
  });
  context.assert.strictEqual(
    matches.length,
    1,
    `${context.caseDefinition.id}: member ${name} was not found exactly once`
  );
  return matches[0];
}

function findProperty(context, declaration, name) {
  return findMember(context, declaration, name, context.ts.isPropertyDeclaration);
}

function findMethod(context, declaration, name) {
  return findMember(context, declaration, name, context.ts.isMethodDeclaration);
}

function printNode(context, node) {
  return context.printer.printNode(
    context.ts.EmitHint.Unspecified,
    node,
    context.sourceFile
  );
}

function decoratorName(context, decorator) {
  const expression = decorator.expression;
  if (context.ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (context.ts.isCallExpression(expression) && context.ts.isIdentifier(expression.expression)) {
    return expression.expression.text;
  }
  return printNode(context, expression);
}

function decoratorsOf(context, node) {
  return context.ts.getAllDecorators(node) || [];
}

function decoratorNames(context, node) {
  return decoratorsOf(context, node).map(decorator => decoratorName(context, decorator));
}

function assertDecoratorNames(context, node, expected) {
  context.assert.deepStrictEqual(
    decoratorNames(context, node),
    expected,
    `${context.caseDefinition.id}: decorator sequence differs`
  );
}

function findDecorator(context, node, name) {
  const matches = decoratorsOf(context, node)
    .filter(decorator => decoratorName(context, decorator) === name);
  context.assert.strictEqual(
    matches.length,
    1,
    `${context.caseDefinition.id}: expected one @${name}`
  );
  return matches[0];
}

function assertDecoratorArguments(context, node, name, expected) {
  const decorator = findDecorator(context, node, name);
  context.assert.strictEqual(
    context.ts.isCallExpression(decorator.expression),
    true,
    `${context.caseDefinition.id}: @${name} must remain a call`
  );
  const actual = decorator.expression.arguments.map(argument => {
    if (context.ts.isStringLiteral(argument) || context.ts.isNumericLiteral(argument)) {
      return argument.text;
    }
    return printNode(context, argument);
  });
  context.assert.deepStrictEqual(actual, expected, `${context.caseDefinition.id}: @${name} arguments`);
}

function constructorCount(declaration, ts) {
  return declaration.members.filter(member => ts.isConstructorDeclaration(member) &&
    member.pos !== member.end).length;
}

function assertConstructorCount(context, declaration, expected) {
  context.assert.strictEqual(
    constructorCount(declaration, context.ts),
    expected,
    `${context.caseDefinition.id}: constructor count differs`
  );
}

function assertMethodReturnKind(context, declaration, name, kind) {
  const method = findMethod(context, declaration, name);
  context.assert.ok(method.type, `${context.caseDefinition.id}: ${name} must have a return type`);
  context.assert.strictEqual(
    method.type.kind,
    kind,
    `${context.caseDefinition.id}: ${name} return type kind differs`
  );
}

function assertFunctionHasNoReturnType(context, name) {
  const declaration = findFunction(context, name);
  context.assert.strictEqual(
    declaration.type,
    undefined,
    `${context.caseDefinition.id}: free function ${name} should not gain a return type`
  );
}

function assertDirectives(context, expected) {
  const actual = context.sourceFile.statements
    .filter(statement => context.ts.isExpressionStatement(statement) &&
      context.ts.isStringLiteral(statement.expression))
    .map(statement => statement.expression.text);
  context.assert.deepStrictEqual(actual, expected, `${context.caseDefinition.id}: directive order`);
}

function importStatementIndices(context) {
  const indices = {};
  context.sourceFile.statements.forEach((statement, index) => {
    if (context.ts.isImportDeclaration(statement)) {
      const moduleName = statement.moduleSpecifier.text;
      if (!indices[moduleName]) {
        indices[moduleName] = [];
      }
      indices[moduleName].push(index);
    }
  });
  return indices;
}

function assertOnlyVoidMethodsChanged(context, declaration, methodNames) {
  methodNames.forEach(name => {
    assertMethodReturnKind(context, declaration, name, context.ts.SyntaxKind.VoidKeyword);
  });
}

module.exports = {
  allGeneratedNames,
  assertConstructorCount,
  assertDecoratorArguments,
  assertDecoratorNames,
  assertDirectives,
  assertFunctionHasNoReturnType,
  assertGeneratedImports,
  assertGeneratedNameAbsent,
  assertGeneratedNameCount,
  assertMethodReturnKind,
  assertOnlyVoidMethodsChanged,
  assertOriginalImports,
  assertStatementOrder,
  comparableImports,
  constructorCount,
  decoratorNames,
  decoratorsOf,
  declarationsOf,
  findClass,
  findDecorator,
  findFunction,
  findInterface,
  findMethod,
  findProperty,
  findStruct,
  importStatementIndices,
  importsOf,
  normalizeImport,
  printNode,
  statementLabel,
  verifyCommonExpectations
};
