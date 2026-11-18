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
const fs = require('fs');
const { ts } = require('./test_support');

function kindOf(node) {
  return ts.SyntaxKind[node.kind];
}

function nameOf(node, sourceFile) {
  return node.name ? node.name.getText(sourceFile) : undefined;
}

function modifiersOf(node) {
  return (ts.getModifiers(node) || []).map(modifier => modifier.getText());
}

function decoratorsOf(node, sourceFile) {
  return (ts.getAllDecorators(node) || []).map(decorator => {
    const expression = decorator.expression;
    if (!ts.isCallExpression(expression)) {
      return {
        name: expression.getText(sourceFile),
        arguments: null
      };
    }
    return {
      name: expression.expression.getText(sourceFile),
      arguments: expression.arguments.map(argument => argument)
    };
  });
}

function findDeclaration(sourceFile, specification) {
  const matches = sourceFile.statements.filter(statement => {
    if (kindOf(statement) !== specification.kind) {
      return false;
    }
    return !specification.name || nameOf(statement, sourceFile) === specification.name;
  });
  return matches[specification.occurrence || 0];
}

function findMember(declaration, specification, sourceFile) {
  if (!declaration || !declaration.members) {
    return undefined;
  }
  const matches = declaration.members.filter(member => {
    if (member.pos === member.end) {
      return false;
    }
    if (kindOf(member) !== specification.kind) {
      return false;
    }
    if (specification.kind === 'Constructor') {
      return true;
    }
    return nameOf(member, sourceFile) === specification.name;
  });
  return matches[specification.occurrence || 0];
}

function assertExpression(actualNode, expected, sourceFile, label) {
  assert.ok(actualNode, `${label}: expression is missing`);
  assert.strictEqual(kindOf(actualNode), expected.kind, `${label}: expression kind`);
  if (Object.prototype.hasOwnProperty.call(expected, 'text')) {
    assert.strictEqual(
      actualNode.getText(sourceFile),
      expected.text,
      `${label}: expression text`
    );
  }
  if (expected.elements) {
    assert.ok(
      ts.isArrayLiteralExpression(actualNode),
      `${label}: expected an ArrayLiteralExpression`
    );
    assert.strictEqual(
      actualNode.elements.length,
      expected.elements.length,
      `${label}: array element count`
    );
    expected.elements.forEach((element, index) => {
      assertExpression(
        actualNode.elements[index],
        element,
        sourceFile,
        `${label}.elements[${index}]`
      );
    });
  }
  if (expected.expression) {
    assertExpression(
      actualNode.expression,
      expected.expression,
      sourceFile,
      `${label}.expression`
    );
  }
}

function assertDecorators(node, expected, sourceFile, label) {
  const actual = decoratorsOf(node, sourceFile);
  assert.strictEqual(actual.length, expected.length, `${label}: decorator count`);
  expected.forEach((decorator, index) => {
    const actualDecorator = actual[index];
    assert.strictEqual(
      actualDecorator.name,
      decorator.name,
      `${label}: decorator ${index} name`
    );
    if (decorator.arguments === null) {
      assert.strictEqual(
        actualDecorator.arguments,
        null,
        `${label}: bare decorator must not become a call`
      );
      return;
    }
    assert.ok(actualDecorator.arguments, `${label}: decorator call is missing`);
    assert.strictEqual(
      actualDecorator.arguments.length,
      decorator.arguments.length,
      `${label}: decorator argument count`
    );
    decorator.arguments.forEach((argument, argumentIndex) => {
      assertExpression(
        actualDecorator.arguments[argumentIndex],
        argument,
        sourceFile,
        `${label}.decorators[${index}].arguments[${argumentIndex}]`
      );
    });
  });
}

function assertParameters(node, expected, sourceFile, label) {
  assert.strictEqual(node.parameters.length, expected.length, `${label}: parameter count`);
  expected.forEach((parameter, index) => {
    const actual = node.parameters[index];
    const parameterLabel = `${label}.parameters[${index}]`;
    assert.strictEqual(kindOf(actual), parameter.kind, `${parameterLabel}: kind`);
    assert.strictEqual(
      actual.name.getText(sourceFile),
      parameter.name,
      `${parameterLabel}: name`
    );
    assert.strictEqual(
      Boolean(actual.questionToken),
      parameter.optional,
      `${parameterLabel}: optional token`
    );
    assert.strictEqual(
      Boolean(actual.dotDotDotToken),
      parameter.rest,
      `${parameterLabel}: rest token`
    );
    assert.deepStrictEqual(
      modifiersOf(actual),
      parameter.modifiers,
      `${parameterLabel}: modifiers`
    );
    if (parameter.type !== undefined) {
      assert.ok(actual.type, `${parameterLabel}: type is missing`);
      assert.strictEqual(
        actual.type.getText(sourceFile),
        parameter.type,
        `${parameterLabel}: type`
      );
    }
    if (Object.prototype.hasOwnProperty.call(parameter, 'initializer')) {
      assert.ok(actual.initializer, `${parameterLabel}: initializer is missing`);
      assert.strictEqual(
        actual.initializer.getText(sourceFile),
        parameter.initializer,
        `${parameterLabel}: initializer`
      );
    }
  });
}

function assertIdentity(actual, declarationSpec, memberSpec, label) {
  assert.ok(actual.originalSourceFile, `${label}: original AST is unavailable`);
  assert.ok(actual.transformedSourceFile, `${label}: transformed AST is unavailable`);
  const originalDeclaration = findDeclaration(
    actual.originalSourceFile,
    declarationSpec
  );
  const transformedDeclaration = findDeclaration(
    actual.transformedSourceFile,
    declarationSpec
  );
  if (!memberSpec) {
    assert.strictEqual(
      transformedDeclaration,
      originalDeclaration,
      `${label}: declaration node identity changed`
    );
    return;
  }
  const originalMember = findMember(
    originalDeclaration,
    memberSpec,
    actual.originalSourceFile
  );
  const transformedMember = findMember(
    transformedDeclaration,
    memberSpec,
    actual.transformedSourceFile
  );
  assert.strictEqual(
    transformedMember,
    originalMember,
    `${label}: member node identity changed`
  );
}

function assertCheckerReturn(actual, declarationSpec, memberSpec, expected, label) {
  const declaration = findDeclaration(actual.originalSourceFile, declarationSpec);
  const member = memberSpec ?
    findMember(declaration, memberSpec, actual.originalSourceFile) :
    declaration;
  const signature = actual.sourceChecker.getSignatureFromDeclaration(member);
  assert.ok(signature, `${label}: TypeChecker signature is missing`);
  const returnType = actual.sourceChecker.getReturnTypeOfSignature(signature);
  assert.strictEqual(
    actual.sourceChecker.typeToString(returnType),
    expected,
    `${label}: TypeChecker return type`
  );
}

function assertSignature(node, specification, actual, declarationSpec, memberSpec, label) {
  const sourceFile = actual.sourceFile;
  assert.strictEqual(kindOf(node), specification.kind, `${label}: node kind`);
  assert.deepStrictEqual(
    modifiersOf(node),
    specification.modifiers || [],
    `${label}: modifiers`
  );
  if (specification.decorators) {
    assertDecorators(node, specification.decorators, sourceFile, label);
  }
  if (specification.parameters) {
    assertParameters(node, specification.parameters, sourceFile, label);
  }
  if (Object.prototype.hasOwnProperty.call(specification, 'returnType')) {
    if (specification.returnType === undefined) {
      assert.strictEqual(node.type, undefined, `${label}: unexpected return type`);
    } else {
      assert.ok(node.type, `${label}: return type is missing`);
      assert.strictEqual(
        node.type.getText(sourceFile),
        specification.returnType,
        `${label}: return type`
      );
    }
  }
  if (specification.typeParameters) {
    const actualTypeParameters = (node.typeParameters || []).map(parameter =>
      parameter.getText(sourceFile));
    assert.deepStrictEqual(
      actualTypeParameters,
      specification.typeParameters,
      `${label}: type parameters`
    );
  }
  if (Object.prototype.hasOwnProperty.call(specification, 'optional')) {
    assert.strictEqual(
      Boolean(node.questionToken),
      specification.optional,
      `${label}: optional token`
    );
  }
  if (specification.propertyType !== undefined) {
    assert.ok(node.type, `${label}: property type is missing`);
    assert.strictEqual(
      node.type.getText(sourceFile),
      specification.propertyType,
      `${label}: property type`
    );
  }
  if (Object.prototype.hasOwnProperty.call(specification, 'initializer')) {
    assert.strictEqual(
      node.initializer && node.initializer.getText(sourceFile),
      specification.initializer,
      `${label}: initializer`
    );
  }
  if (Object.prototype.hasOwnProperty.call(specification, 'body')) {
    assert.strictEqual(Boolean(node.body), specification.body, `${label}: body presence`);
  }
  if (specification.identity) {
    assertIdentity(actual, declarationSpec, memberSpec, label);
  }
  if (specification.checkerReturnType) {
    assertCheckerReturn(
      actual,
      declarationSpec,
      memberSpec,
      specification.checkerReturnType,
      label
    );
  }
}

function assertDeclaration(actual, declarationSpec) {
  const label = declarationSpec.name || declarationSpec.kind;
  const declaration = findDeclaration(actual.sourceFile, declarationSpec);
  assert.ok(declaration, `${label}: declaration is missing`);
  assertSignature(
    declaration,
    declarationSpec,
    actual,
    declarationSpec,
    undefined,
    label
  );
  if (declarationSpec.memberCount !== undefined) {
    assert.strictEqual(
      declaration.members.filter(member => member.pos !== member.end).length,
      declarationSpec.memberCount,
      `${label}: member count`
    );
  }
  for (const memberSpec of declarationSpec.members || []) {
    const memberLabel = `${label}.${memberSpec.name || memberSpec.kind}` +
      `[${memberSpec.occurrence || 0}]`;
    const member = findMember(declaration, memberSpec, actual.sourceFile);
    assert.ok(member, `${memberLabel}: member is missing`);
    assertSignature(
      member,
      memberSpec,
      actual,
      declarationSpec,
      memberSpec,
      memberLabel
    );
  }
  for (const absent of declarationSpec.absentMembers || []) {
    const member = findMember(declaration, absent, actual.sourceFile);
    assert.strictEqual(member, undefined, `${label}: unexpected ${absent.kind}`);
  }
}

function assertImports(actual, expected) {
  const imports = actual.sourceFile.statements.filter(ts.isImportDeclaration).map(statement => {
    const clause = statement.importClause;
    const namedBindings = clause && clause.namedBindings;
    return {
      source: statement.moduleSpecifier.text,
      names: namedBindings && ts.isNamedImports(namedBindings) ?
        namedBindings.elements.map(element => element.name.text) : [],
      defaultName: clause && clause.name ? clause.name.text : undefined,
      typeOnly: clause ? clause.isTypeOnly : false
    };
  });
  assert.deepStrictEqual(imports, expected, 'import sources and specifiers');
}

function assertOutputContract(actual, expected) {
  assert.ok(actual.inputPath, 'input path must not be empty');
  assert.ok(actual.outputPath, 'final output path must not be empty');
  assert.ok(fs.existsSync(actual.inputPath), 'persisted input must exist');
  assert.ok(fs.existsSync(actual.outputPath), 'persisted output must exist');
  assert.ok(fs.statSync(actual.outputPath).size > 0, 'final output must not be empty');
  assert.ok(actual.text.trim().length > 0, 'declaration text must not be empty');
  assert.strictEqual(
    actual.stage,
    actual.mode === 'declgen' ? 'after-declaration' :
      actual.mode === 'emit' ? 'afterDeclarations' : 'direct-program',
    'execution stage'
  );
  assert.ok(actual.sourceFile.isDeclarationFile, 'output must be parsed as a declaration');
  assert.ok(actual.sourceChecker, 'source TypeChecker is required');
  assert.ok(actual.analysisChecker, 'output TypeChecker is required');
  if (expected.outputSuffix) {
    const normalized = actual.toolOutputPath.replace(/\\/g, '/');
    assert.ok(
      normalized.endsWith(expected.outputSuffix),
      `tool output ${normalized} must end with ${expected.outputSuffix}`
    );
  }
  for (const fragment of expected.requiredText || []) {
    assert.ok(actual.text.includes(fragment), `output must include ${fragment}`);
  }
  for (const fragment of expected.forbiddenText || []) {
    assert.ok(!actual.text.includes(fragment), `output must not include ${fragment}`);
  }
}

function assertExpectation(actual, expected) {
  assertOutputContract(actual, expected);
  assertImports(actual, expected.imports || []);
  if (expected.statementKinds) {
    assert.deepStrictEqual(
      actual.sourceFile.statements.map(kindOf),
      expected.statementKinds,
      'top-level statement order'
    );
  }
  for (const declaration of expected.declarations || []) {
    assertDeclaration(actual, declaration);
  }
}

function modifierLossFingerprint(actual, expected, error) {
  try {
    if (!actual || !error || error.name !== 'AssertionError' ||
        !error.message.includes(': modifiers') ||
        expected.knownFailure?.issue !== 'PR05-MONITOR-MODIFIER-LOSS') {
      return undefined;
    }
    const declarationSpec = expected.declarations?.[0];
    const memberSpec = declarationSpec?.members?.[0];
    if (!declarationSpec || !memberSpec ||
        (memberSpec.modifiers || []).join(' ') !== 'public static async') {
      return undefined;
    }
    assertOutputContract(actual, expected);
    assertImports(actual, expected.imports || []);
    const declaration = findDeclaration(actual.sourceFile, declarationSpec);
    const member = findMember(declaration, memberSpec, actual.sourceFile);
    assert.ok(member, 'fingerprint method is missing');
    assert.strictEqual(kindOf(member), memberSpec.kind);
    assert.deepStrictEqual(modifiersOf(member), [], 'all three modifiers must be absent');
    assertDecorators(member, memberSpec.decorators, actual.sourceFile, 'fingerprint');
    assertParameters(member, memberSpec.parameters, actual.sourceFile, 'fingerprint');
    assert.strictEqual(member.type?.getText(actual.sourceFile), memberSpec.returnType);
    const input = fs.readFileSync(actual.inputPath, 'utf8');
    assert.ok(input.includes('public static async'), 'input modifiers are absent');
    assert.ok(input.includes(`${memberSpec.name}(`), 'input method does not match');
    return {
      method: `${declarationSpec.name}.${memberSpec.name}`,
      inputModifiers: memberSpec.modifiers,
      outputModifiers: modifiersOf(member),
      returnType: memberSpec.returnType,
      inputPath: actual.inputPath,
      outputPath: actual.outputPath
    };
  } catch (ignored) {
    return undefined;
  }
}

module.exports = {
  assertExpectation,
  findDeclaration,
  findMember,
  kindOf,
  modifierLossFingerprint
};
