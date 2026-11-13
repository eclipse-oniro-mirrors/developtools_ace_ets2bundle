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
const ts = require('typescript');
const {
  findStruct,
  normalizeInline,
  readImports
} = require('../property_ref_contract/ast_assertions');
const { modules } = require('./expected_cases');

const V2_DECORATORS = new Set([
  'ComponentV2',
  'ReusableV2',
  'Local',
  'Param',
  'Once',
  'Event',
  'ObservedV2',
  'Trace',
  'Provider',
  'Consumer',
  'Monitor',
  'Computed'
]);

const STATE_DECORATORS = new Set([
  'State',
  'Link',
  'PropRef',
  'StoragePropRef',
  'LocalStoragePropRef',
  'StorageLink',
  'LocalStorageLink'
]);

const ASSIGNMENT_OPERATORS = new Set([
  ts.SyntaxKind.EqualsToken,
  ts.SyntaxKind.PlusEqualsToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken
]);

function decoratorName(decorator) {
  const expression = ts.isCallExpression(decorator.expression) ?
    decorator.expression.expression : decorator.expression;
  return ts.isIdentifier(expression) ? expression.text : expression.getText();
}

function visitDecorators(sourceFile, callback) {
  function visit(node) {
    if (typeof ts.canHaveDecorators !== 'function' || ts.canHaveDecorators(node)) {
      for (const decorator of ts.getAllDecorators(node) || []) {
        callback(decorator, node);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

function assertV1Only(sourceFile, label) {
  const found = [];
  visitDecorators(sourceFile, decorator => {
    const name = decoratorName(decorator);
    assert.ok(!V2_DECORATORS.has(name), `${label} mixes V2 decorator @${name} with the V1 state contract`);
    if (STATE_DECORATORS.has(name)) {
      found.push(name);
    }
  });
  return found;
}

function assertStateImportOrigins(sourceFile) {
  const imports = readImports(sourceFile);
  const stateImport = imports.find(item => item.source === modules.stateModule);
  assert.ok(stateImport, `${sourceFile.fileName} has no stateManagement import`);
  const importedNames = new Set(stateImport.named.map(item => item.local));
  const origins = {};
  visitDecorators(sourceFile, decorator => {
    const name = decoratorName(decorator);
    if (STATE_DECORATORS.has(name)) {
      assert.ok(importedNames.has(name),
        `${sourceFile.fileName} @${name} must originate from ${modules.stateModule}`);
      origins[name] = modules.stateModule;
    }
  });
  assert.ok(!imports.some(item => item.source === 'dynamic/@ohos.arkui.GlobalAnnotation'),
    `${sourceFile.fileName} unexpectedly depends on dynamic GlobalAnnotation`);
  return origins;
}

function structNames(sourceFile) {
  return sourceFile.statements.filter(ts.isStructDeclaration).map(struct => struct.name.text);
}

function findMethod(struct, methodName) {
  const method = struct.members.find(member =>
    ts.isMethodDeclaration(member) && member.name.getText() === methodName);
  assert.ok(method, `Missing method ${struct.name.text}.${methodName}`);
  return method;
}

function thisPropertyName(expression) {
  if (!ts.isPropertyAccessExpression(expression)) {
    return undefined;
  }
  if (expression.expression.kind === ts.SyntaxKind.ThisKeyword) {
    return expression.name.text;
  }
  return thisPropertyName(expression.expression);
}

function assignedProperties(method) {
  const assigned = [];
  function visit(node) {
    if (ts.isBinaryExpression(node) && ASSIGNMENT_OPERATORS.has(node.operatorToken.kind)) {
      const name = thisPropertyName(node.left);
      if (name) {
        assigned.push(name);
      }
    }
    if ((ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      [ts.SyntaxKind.PlusPlusToken, ts.SyntaxKind.MinusMinusToken].includes(node.operator)) {
      const name = thisPropertyName(node.operand);
      if (name) {
        assigned.push(name);
      }
    }
    ts.forEachChild(node, visit);
  }
  if (method.body) {
    visit(method.body);
  }
  return assigned;
}

function readProperties(method) {
  const read = new Set();
  function visit(node) {
    if (ts.isPropertyAccessExpression(node)) {
      const name = thisPropertyName(node);
      if (name) {
        read.add(name);
      }
    }
    ts.forEachChild(node, visit);
  }
  if (method.body) {
    visit(method.body);
  }
  return read;
}

function assertUpdates(sourceFile, testCase) {
  const struct = findStruct(sourceFile, testCase.componentName);
  const evidence = {};
  for (const [methodName, updates] of Object.entries(testCase.updates || {})) {
    const method = findMethod(struct, methodName);
    assert.ok(method.body, `${testCase.id}: ${methodName} lost its implementation body`);
    const body = normalizeInline(method.body.getText(sourceFile));
    for (const update of updates) {
      assert.ok(body.includes(normalizeInline(update)),
        `${testCase.id}: ${methodName} lost update ${update}\nactual: ${body}`);
    }
    evidence[methodName] = updates;
  }
  return evidence;
}

function assertReads(sourceFile, testCase) {
  const structName = testCase.componentName || testCase.components?.[0];
  if (!structName) {
    return {};
  }
  const struct = findStruct(sourceFile, structName);
  const evidence = {};
  for (const [methodName, properties] of Object.entries(testCase.reads || {})) {
    const actual = readProperties(findMethod(struct, methodName));
    for (const property of properties) {
      assert.ok(actual.has(property), `${testCase.id}: ${methodName} no longer reads this.${property}`);
    }
    evidence[methodName] = properties;
  }
  return evidence;
}

function assertOneWayProperties(sourceFile, testCase) {
  const expected = new Set(testCase.oneWay || []);
  if (expected.size === 0) {
    return [];
  }
  const updated = new Set();
  for (const structName of structNames(sourceFile)) {
    const struct = findStruct(sourceFile, structName);
    for (const method of struct.members.filter(ts.isMethodDeclaration)) {
      for (const property of assignedProperties(method)) {
        if (expected.has(property)) {
          updated.add(property);
        }
      }
    }
  }
  const missing = Array.from(expected).filter(property => !updated.has(property));
  assert.deepStrictEqual(missing, [],
    `${testCase.id}: one-way properties must allow local updates without implying parent write-back`);
  return Array.from(updated).sort();
}

function resolveStructName(testCase, expected) {
  return testCase.componentName || expected.structName;
}

function assertSourceBehavior(sourceFile, testCase, expected) {
  const actualComponents = structNames(sourceFile);
  const expectedComponents = testCase.components || [resolveStructName(testCase, expected)];
  assert.deepStrictEqual(actualComponents, expectedComponents,
    `${testCase.id}: component identities or declaration order changed`);
  const behaviorCase = {
    ...testCase,
    componentName: resolveStructName(testCase, expected)
  };
  const updates = assertUpdates(sourceFile, behaviorCase);
  const reads = assertReads(sourceFile, behaviorCase);
  const oneWay = assertOneWayProperties(sourceFile, behaviorCase);
  const v1Decorators = assertV1Only(sourceFile, testCase.id);
  const origins = assertStateImportOrigins(sourceFile);
  return {
    components: actualComponents,
    importOrigins: origins,
    oneWay,
    reads,
    updates,
    v1Decorators
  };
}

function assertGeneratedMethods(sourceFile, testCase, componentName) {
  const struct = findStruct(sourceFile, componentName);
  const methods = struct.members.filter(ts.isMethodDeclaration);
  const names = methods.map(method => method.name.getText(sourceFile));
  assert.ok(names.includes('build'), `${testCase.id}: generated component has no build signature`);
  for (const method of methods) {
    assert.strictEqual(method.body, undefined,
      `${testCase.id}: declaration method ${method.name.getText(sourceFile)} retained a body`);
    assert.strictEqual(normalizeInline(method.type?.getText(sourceFile) || ''), 'void',
      `${testCase.id}: declaration method ${method.name.getText(sourceFile)} must return void`);
  }
  for (const methodName of Object.keys(testCase.updates || {})) {
    assert.ok(names.includes(methodName), `${testCase.id}: generated declaration lost ${methodName}`);
  }
  return names;
}

function assertIndexDeclaration(sourceFile, componentName, request) {
  assertV1Only(sourceFile, 'generated Index.d.ets');
  const exports = sourceFile.statements.filter(ts.isExportDeclaration);
  assert.strictEqual(exports.length, 1, 'Index declaration must contain one component re-export');
  const exportDeclaration = exports[0];
  assert.strictEqual(exportDeclaration.moduleSpecifier.text, request);
  const names = exportDeclaration.exportClause.elements.map(element => element.name.text);
  assert.deepStrictEqual(names, [componentName]);
  assert.strictEqual(exportDeclaration.isTypeOnly, false);
  return { componentName, request, names };
}

function assertAnyFragment(actual, fragments, label) {
  const normalized = normalizeInline(actual);
  assert.ok(fragments.some(fragment => normalized.includes(normalizeInline(fragment))),
    `${label}: none of the expected fragments were found:\n${fragments.join('\n')}\nactual:\n${normalized}`);
}

function disassemblyFunction(disassembly, functionName) {
  const namePosition = disassembly.indexOf(` ${functionName}(`);
  assert.ok(namePosition >= 0, `static ABC does not contain ${functionName}`);
  const start = disassembly.lastIndexOf('.function', namePosition);
  assert.ok(start >= 0, `${functionName} has no disassembly function header`);
  const next = disassembly.indexOf('\n.function ', namePosition + functionName.length);
  return disassembly.slice(start, next < 0 ? disassembly.length : next);
}

function assertStaticBridge(disassembly, contract) {
  const block = disassemblyFunction(disassembly, contract.functionName);
  for (const fragment of contract.required) {
    if (fragment.includes('compatibleComponent')) {
      assertAnyFragment(disassembly, [fragment], 'compatible component creation');
    } else {
      assertAnyFragment(block, [fragment], 'static parameter bridge');
    }
  }
  for (const fragment of contract.callerState) {
    assertAnyFragment(disassembly, [fragment], 'caller State initialization and reset');
  }
  const normalizedBlock = normalizeInline(block);
  for (const forbidden of contract.forbiddenParameters) {
    assert.ok(!normalizedBlock.includes(normalizeInline(forbidden)),
      `dynamic component options incorrectly contain an explicit storage parameter: ${forbidden}`);
  }
  const normalizedAll = normalizeInline(disassembly);
  for (const forbidden of contract.forbiddenDecorators) {
    assert.ok(!normalizedAll.includes(normalizeInline(forbidden)),
      `static ABC contains forbidden V2 decorator: ${forbidden}`);
  }
  let previous = -1;
  for (const fragment of contract.parameterOrder) {
    const position = normalizedBlock.indexOf(normalizeInline(fragment));
    assert.ok(position > previous, `parameter bridge order is incorrect at ${fragment}`);
    previous = position;
  }
  return {
    functionName: contract.functionName,
    parameters: ['localCount', 'sharedCount', 'title'],
    callerState: contract.callerState,
    forbiddenParameters: contract.forbiddenParameters,
    disassemblyBytes: Buffer.byteLength(block, 'utf8')
  };
}

module.exports = {
  assertAnyFragment,
  assertStaticBridge,
  assertGeneratedMethods,
  assertIndexDeclaration,
  assertOneWayProperties,
  assertSourceBehavior,
  assertStateImportOrigins,
  assertV1Only,
  assignedProperties,
  decoratorName,
  structNames
};
