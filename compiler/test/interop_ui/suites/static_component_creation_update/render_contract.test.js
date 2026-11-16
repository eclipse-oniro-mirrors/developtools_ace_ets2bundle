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
const ts = require(path.resolve(__dirname, '../../../../node_modules/typescript'));
const {
  makeComponentReturn,
  makeNewNode,
  makeOptions,
  printNode,
  production,
  propertyAssignment
} = require('../dynamic_calls_static_basic/unit.test');

function renderInputs() {
  const options = makeOptions([
    propertyAssignment('count', ts.factory.createNumericLiteral(7))
  ]);
  return { options, newNode: makeNewNode(options), componentNode: makeComponentReturn() };
}

function creationBranch(t) {
  const { component } = production();
  const { options, newNode, componentNode } = renderInputs();
  const branch = component.createIfStaticComponent(newNode, options, 'StaticCounter', componentNode);
  t.ok(ts.isIfStatement(branch));
  t.equal(branch.expression.text, 'isInitialRender');
  t.equal(branch.thenStatement.statements.length, 5);
  t.equal(branch.elseStatement.statements.length, 1);
  const initial = branch.thenStatement.statements.map(node => printNode(node));
  t.includes(initial[0], '__Interop_UpdateInteropExtendableComponent_Internal(this)');
  t.includes(initial[1], '__Interop_CreateStaticComponent_Internal');
  t.includes(initial[2], '__Interop_ResetInteropExtendableComponent_Internal()');
  t.includes(initial[3], 'ViewStackProcessor.push(static_StaticCounter[1])');
  t.includes(initial[4], 'ViewStackProcessor.pop()');
  const update = printNode(branch.elseStatement.statements[0]);
  t.includes(update, 'static_StaticCounter[0]()');
  t.notIncludes(update, 'new StaticCounter');
  t.notIncludes(update, 'ViewStackProcessor');
}

function arrowBlock(t) {
  const { component } = production();
  const { options, newNode, componentNode } = renderInputs();
  const statements = component.createStaticArrowBlock(newNode, options, 'StaticCounter', componentNode);
  t.equal(statements.length, 3);
  t.ok(ts.isExpressionStatement(statements[0]));
  t.ok(ts.isIfStatement(statements[1]));
  t.ok(ts.isExpressionStatement(statements[2]));
  t.equal(statements[0].expression.left.name.text, '__interopInStaticRendering_internal_');
  t.equal(statements[2].expression.left.name.text, '__interopInStaticRendering_internal_');
  t.equal(statements[0].expression.right.kind, ts.SyntaxKind.TrueKeyword);
  t.equal(statements[2].expression.right.kind, ts.SyntaxKind.FalseKeyword);
  t.record('render-arrow-block', statements.map(node => printNode(node)));
}

function constructorFactory(t) {
  const { component } = production();
  const { newNode, componentNode } = renderInputs();
  const creation = component.createStaticComponent('StaticCounter', newNode, componentNode);
  const bridge = creation.expression.right;
  t.equal(bridge.expression.text, '__Interop_CreateStaticComponent_Internal');
  t.equal(bridge.arguments.length, 2);
  const factory = bridge.arguments[0];
  const optionsFactory = bridge.arguments[1];
  t.ok(ts.isArrowFunction(factory));
  t.ok(ts.isArrowFunction(optionsFactory));
  t.equal(factory.parameters.length, 0);
  t.equal(optionsFactory.parameters.length, 0);
  const constructor = factory.body.statements[0].expression;
  t.ok(ts.isNewExpression(constructor));
  t.equal(constructor.expression.text, 'StaticCounter');
  t.equal(constructor.arguments.length, 2);
  t.deepEqual(constructor.arguments.map(argument => argument.text), ['undefined', 'undefined']);
}

function tupleShape(t) {
  const { component } = production();
  const tuple = component.createStaticTuple('StaticCounter');
  t.equal(tuple.declarationList.flags & ts.NodeFlags.Let, ts.NodeFlags.Let);
  const declaration = tuple.declarationList.declarations[0];
  t.equal(declaration.name.text, 'static_StaticCounter');
  t.ok(ts.isTupleTypeNode(declaration.type));
  t.equal(declaration.type.elements.length, 2);
  t.equal(declaration.type.elements[0].typeName.text, 'StaticCounter');
  t.equal(declaration.type.elements[1].kind, ts.SyntaxKind.NumberKeyword);
  t.equal(declaration.initializer, undefined);
}

function knownRenderingFlag(t, enabled) {
  const { component } = production();
  const node = enabled ? component.setInteropRenderingFlag() : component.resetInteropRenderingFlag();
  const expression = node.expression;
  const output = printNode(node);
  t.record('rendering-flag-contract', {
    output,
    expectedOperator: '=',
    actualOperator: ts.tokenToString(expression.operatorToken.kind),
    source: 'compiler/src/interop/src/process_interop_component.ts'
  });
  const known = expression.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken &&
    expression.left.name.text === '__interopInStaticRendering_internal_' &&
    expression.right.kind === (enabled ? ts.SyntaxKind.TrueKeyword : ts.SyntaxKind.FalseKeyword);
  const error = new Error(known ?
    'Rendering flag uses an equality comparison and does not assign the rendering state' :
    'Rendering flag behavior changed. Review and retire the known-failure contract.');
  Object.assign(error, {
    stage: 'rendering-state',
    category: known ? 'existing' : 'implementation',
    code: known ? 'STATIC_RENDER_FLAG_COMPARE' : 'STALE_KNOWN_FAILURE',
    details: { output, expected: enabled }
  });
  throw error;
}

const cases = [
  { id: 'creation-branch-ast', group: 'unit', run: creationBranch },
  { id: 'render-arrow-block-ast', group: 'unit', run: arrowBlock },
  { id: 'constructor-factory-ast', group: 'unit', run: constructorFactory },
  { id: 'static-tuple-shape', group: 'unit', run: tupleShape },
  { id: 'known-rendering-flag-set', group: 'unit', run: t => knownRenderingFlag(t, true) },
  { id: 'known-rendering-flag-reset', group: 'unit', run: t => knownRenderingFlag(t, false) }
];

module.exports = { cases, renderInputs };
