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
const {
  assertForbidden,
  assertFragments,
  normalizeText
} = require('../static_calls_dynamic_basic/harness');
const { ts } = require('../monitor_declaration_signatures/test_support');

function decoratorName(decorator) {
  const expression = decorator.expression;
  if (ts.isIdentifier(expression)) {
    return expression.text;
  }
  if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
    return expression.expression.text;
  }
  return expression.getText();
}

function decoratorsOf(node) {
  return Array.from(ts.getAllDecorators(node) || []).map(decoratorName);
}

function nodeName(node) {
  return node.name && ts.isIdentifier(node.name) ? node.name.text : undefined;
}

function findTopLevel(sourceFile, predicate, name, label) {
  const matches = sourceFile.statements.filter(statement =>
    predicate(statement) && nodeName(statement) === name);
  assert.strictEqual(matches.length, 1, `${label} must contain exactly one ${name}`);
  return matches[0];
}

function findStructMember(structNode, predicate, name) {
  const matches = structNode.members.filter(member =>
    predicate(member) && nodeName(member) === name);
  assert.strictEqual(matches.length, 1,
    `${nodeName(structNode)} must contain exactly one member ${name}`);
  return matches[0];
}

function normalizedType(node, sourceFile) {
  if (!node) {
    return undefined;
  }
  return node.getText(sourceFile).replace(/\s+/g, ' ').trim();
}

function assertDecorators(node, expected, label) {
  if (!expected) {
    return;
  }
  assert.deepStrictEqual(decoratorsOf(node), expected, `${label} decorators differ`);
}

function assertParameters(node, expected, sourceFile, label) {
  if (!expected) {
    return;
  }
  assert.strictEqual(node.parameters.length, expected.length, `${label} parameter count differs`);
  for (let index = 0; index < expected.length; index += 1) {
    const actual = node.parameters[index];
    const wanted = expected[index];
    assert.strictEqual(nodeName(actual), wanted.name, `${label} parameter ${index} name differs`);
    assert.strictEqual(normalizedType(actual.type, sourceFile), wanted.type,
      `${label} parameter ${wanted.name} type differs`);
    assert.strictEqual(Boolean(actual.questionToken), Boolean(wanted.optional),
      `${label} parameter ${wanted.name} optionality differs`);
    assert.strictEqual(Boolean(actual.dotDotDotToken), Boolean(wanted.rest),
      `${label} parameter ${wanted.name} rest marker differs`);
  }
}

function assertCallable(node, expected, sourceFile, label) {
  assertDecorators(node, expected.decorators, label);
  assertParameters(node, expected.parameters, sourceFile, label);
  if (expected.returnType !== undefined) {
    assert.strictEqual(normalizedType(node.type, sourceFile), expected.returnType,
      `${label} return type differs`);
  }
}

function assertProperty(node, expected, sourceFile, label) {
  assertDecorators(node, expected.decorators, label);
  if (expected.type !== undefined) {
    assert.strictEqual(normalizedType(node.type, sourceFile), expected.type,
      `${label} property type differs`);
  }
  assert.strictEqual(Boolean(node.questionToken), Boolean(expected.optional),
    `${label} property optionality differs`);
}

function assertFunctions(sourceFile, expectations) {
  for (const [name, expected] of Object.entries(expectations || {})) {
    const node = findTopLevel(sourceFile, ts.isFunctionDeclaration, name, 'declaration');
    assertCallable(node, expected, sourceFile, `function ${name}`);
    if (sourceFile.isDeclarationFile) {
      assert.strictEqual(node.body, undefined, `declaration function ${name} must not have a body`);
    }
  }
}

function assertStructs(sourceFile, expectations) {
  for (const [name, expected] of Object.entries(expectations || {})) {
    const node = findTopLevel(sourceFile, ts.isStructDeclaration, name, 'declaration');
    const label = `struct ${name}`;
    assertDecorators(node, expected.decorators, label);
    for (const [methodName, methodExpectation] of Object.entries(expected.methods || {})) {
      const method = findStructMember(node, ts.isMethodDeclaration, methodName);
      assertCallable(method, methodExpectation, sourceFile, `${label}.${methodName}`);
      if (sourceFile.isDeclarationFile) {
        assert.strictEqual(method.body, undefined, `${label}.${methodName} must not have a body`);
      }
    }
    for (const [propertyName, propertyExpectation] of Object.entries(expected.properties || {})) {
      const property = findStructMember(node, ts.isPropertyDeclaration, propertyName);
      assertProperty(property, propertyExpectation, sourceFile, `${label}.${propertyName}`);
    }
    if (expected.propertyOrder) {
      const actualOrder = node.members.filter(ts.isPropertyDeclaration).map(nodeName);
      assert.deepStrictEqual(actualOrder, expected.propertyOrder, `${label} property order differs`);
    }
  }
}

function importRecords(sourceFile) {
  const records = new Map();
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
      continue;
    }
    const moduleName = statement.moduleSpecifier.text;
    const clause = statement.importClause;
    if (!clause || !clause.namedBindings || !ts.isNamedImports(clause.namedBindings)) {
      continue;
    }
    if (!records.has(moduleName)) {
      records.set(moduleName, []);
    }
    for (const element of clause.namedBindings.elements) {
      records.get(moduleName).push(element.name.text);
    }
  }
  return records;
}

function assertImports(sourceFile, expectations) {
  if (!expectations) {
    return;
  }
  const actual = importRecords(sourceFile);
  for (const [moduleName, expectedNames] of Object.entries(expectations)) {
    assert.ok(actual.has(moduleName), `missing import from ${moduleName}`);
    assert.deepStrictEqual(actual.get(moduleName).slice().sort(), expectedNames.slice().sort(),
      `imports from ${moduleName} differ`);
    assert.strictEqual(new Set(actual.get(moduleName)).size, actual.get(moduleName).length,
      `duplicate imports from ${moduleName}`);
  }
}

function assertDirective(sourceFile, expected) {
  if (!expected) {
    return;
  }
  const first = sourceFile.statements[0];
  assert.ok(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression),
    'the static directive must remain the first statement');
  assert.strictEqual(first.expression.text, expected);
}

function assertDeclarationContract(actual, expectation, caseId) {
  assert.ok(expectation, `missing expectation for ${caseId}`);
  assert.ok(actual.text.trim().length > 0, `${caseId} emitted an empty declaration`);
  assertFragments(actual.text, expectation.required || [], caseId);
  assertForbidden(actual.text, expectation.forbidden || [], caseId);
  assert.ok(actual.sourceFile, `${caseId} did not provide a declaration AST`);
  assert.strictEqual(actual.sourceFile.isDeclarationFile, true,
    `${caseId} declaration-file identity differs`);
  assertFunctions(actual.sourceFile, expectation.functions);
  assertStructs(actual.sourceFile, expectation.structs);
  assertImports(actual.sourceFile, expectation.imports);
  assertDirective(actual.sourceFile, expectation.directive);
  if (actual.mode === 'direct') {
    const diagnostics = actual.diagnostics || [];
    assert.deepStrictEqual(diagnostics, [], `${caseId} has syntactic diagnostics`);
  }
  return {
    functions: Object.keys(expectation.functions || {}).length,
    structs: Object.keys(expectation.structs || {}).length,
    normalizedBytes: Buffer.byteLength(normalizeText(actual.text), 'utf8')
  };
}

function countOccurrences(content, fragment) {
  if (!fragment) {
    return 0;
  }
  return content.split(fragment).length - 1;
}

function assertExactOccurrences(content, expected, label) {
  for (const [fragment, count] of Object.entries(expected || {})) {
    assert.strictEqual(countOccurrences(content, fragment), count,
      `${label} occurrence count differs for ${fragment}`);
  }
}

function functionBlocks(disassembly) {
  const blocks = [];
  let current;
  for (const line of disassembly.split(/\r?\n/)) {
    if (line.startsWith('.function ')) {
      current = { header: line, lines: [line] };
      blocks.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return blocks.map(block => ({
    header: block.header,
    text: block.lines.join('\n')
  }));
}

function includesEvery(text, fragments) {
  return (fragments || []).every(fragment => text.includes(fragment));
}

function selectFunctionBlocks(blocks, contract) {
  return blocks.filter(block =>
    includesEvery(block.header, contract.headerContains) &&
    includesEvery(block.text, contract.bodyContains));
}

function assertSequence(block, fragments, label) {
  let cursor = 0;
  const positions = [];
  for (const fragment of fragments || []) {
    const position = block.text.indexOf(fragment, cursor);
    assert.ok(position >= 0, `${label} missing ${fragment} in ${block.header}`);
    assert.ok(position >= cursor, `${label} has out-of-order ${fragment}`);
    positions.push({ fragment, position });
    cursor = position + fragment.length;
  }
  return positions;
}

function assertFunctionContracts(disassembly, contracts = []) {
  const blocks = functionBlocks(disassembly);
  const evidence = [];
  for (const contract of contracts) {
    const matches = selectFunctionBlocks(blocks, contract);
    assert.strictEqual(matches.length, contract.count ?? 1,
      `${contract.id} function count differs; headers: ${matches.map(match => match.header).join(' | ')}`);
    for (const block of matches) {
      const positions = assertSequence(block, contract.sequence, contract.id);
      evidence.push({
        id: contract.id,
        header: block.header,
        positions
      });
    }
  }
  return evidence;
}

function assertEmptyUpdaters(disassembly, contracts = []) {
  const blocks = functionBlocks(disassembly);
  const issues = [];
  for (const contract of contracts) {
    const matches = selectFunctionBlocks(blocks, contract);
    assert.strictEqual(matches.length, 1,
      `${contract.issue} requires exactly one updater, found ${matches.length}`);
    const block = matches[0];
    const instructions = block.text.slice(block.text.indexOf('{') + 1, block.text.lastIndexOf('}'))
      .split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    assert.deepStrictEqual(instructions, ['return.void'],
      `${contract.issue} is stale: updater is no longer empty in ${block.header}`);
    issues.push({
      stage: contract.stage,
      category: 'existing',
      code: contract.code,
      message: contract.message,
      details: {
        classification: 'expected-updater-contract',
        functionHeader: block.header,
        instructions
      }
    });
  }
  return issues;
}

module.exports = {
  assertDeclarationContract,
  assertEmptyUpdaters,
  assertExactOccurrences,
  assertFunctionContracts,
  countOccurrences,
  decoratorName,
  decoratorsOf,
  importRecords,
  normalizedType
};
