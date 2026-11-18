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
const { fixtures } = require('./builder_reference_cases');
const { executeFixture } = require('../static_parent_child_parameters/component_worker');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

function expressionTokens(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.ES2021, true,
    ts.LanguageVariant.Standard, text);
  const tokens = [];
  let kind = scanner.scan();
  while (kind !== ts.SyntaxKind.EndOfFileToken) {
    tokens.push([kind, kind === ts.SyntaxKind.StringLiteral ?
      scanner.getTokenValue() : scanner.getTokenText()]);
    kind = scanner.scan();
  }
  return tokens;
}

function referenceTokens(node, source) {
  while (ts.isParenthesizedExpression(node)) {
    node = node.expression;
  }
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  return expressionTokens(printer.printNode(ts.EmitHint.Unspecified, node, source));
}

const cases = fixtures.map(fixture => ({
  id: `builder-reference-${fixture.id}`,
  group: 'unit',
  direction: '11-to-12',
  run(t) {
    const actual = executeFixture(t, fixture);
    t.equal(actual.returnsResult, true);
    t.includes(actual.output, fixture.expected.helper + '(');
    t.includes(actual.output, '__options_has_content');
    const parsed = ts.createSourceFile('Options.ts', actual.output,
      ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
    t.equal(parsed.parseDiagnostics.length, 0);
    const expectedSource = ts.createSourceFile('Expected.ts',
      `const callback = ${fixture.expected.initializer};`, ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
    const expectedInitializer = expectedSource.statements[0].declarationList.declarations[0].initializer;
    const calls = [];
    function visit(node) {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
          node.expression.text.startsWith('__Interop_transferCompatibleDynamicBuilder')) {
        const bound = node.arguments[0];
        t.ok(ts.isCallExpression(bound) && ts.isPropertyAccessExpression(bound.expression));
        t.equal(bound.expression.name.text, 'bind');
        t.equal(bound.arguments.length, 1);
        t.equal(bound.arguments[0].kind, ts.SyntaxKind.ThisKeyword);
        calls.push({ helper: node.expression.text,
          initializer: referenceTokens(bound.expression.expression, parsed) });
      }
      ts.forEachChild(node, visit);
    }
    visit(parsed);
    t.deepEqual(calls, [{ helper: fixture.expected.helper,
      initializer: referenceTokens(expectedInitializer, expectedSource) }]);
    t.ok(fs.existsSync(path.join(t.workspace, 'options.ts')));
    t.record('builder-reference-boundary', { boundary: fixture.boundary,
      source: fixture.source, expected: fixture.expected, actual: actual.output,
      scope: 'repository TypeChecker and component options lowering' });
  }
}));

module.exports = { cases };
