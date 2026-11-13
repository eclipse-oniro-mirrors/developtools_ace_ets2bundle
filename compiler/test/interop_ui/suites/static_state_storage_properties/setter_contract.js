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
  DIRECTION,
  executeCase
} = require('../static_calls_dynamic_basic/harness');
const {
  PropMapManager,
  processMemberVariableDecorators,
  resetProcessComponentMember
} = require('../../../../lib/process_component_member');

const source = `class SetterContract {
  @State localCount: number = 1;
  @Prop title: string = 'initial';
  @StorageProp('pr09.setter.score') storedScore: number = 2;
  @LocalStorageProp('pr09.setter.draft') draft: string = 'draft';
  constructor() {
  }
}
`;

function printNode(node, sourceFile) {
  return node ? ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, node, sourceFile) : undefined;
}

function captureActualAccessors() {
  const sourceFile = ts.createSourceFile(
    'setter_contract.ets',
    source,
    ts.ScriptTarget.ES2021,
    true,
    ts.ScriptKind.ETS
  );
  const struct = sourceFile.statements[0];
  const constructor = struct.members.find(ts.isConstructorDeclaration);
  const parameters = ts.factory.createInterfaceDeclaration(
    undefined,
    ts.factory.createIdentifier('SetterContract_Params'),
    undefined,
    undefined,
    []
  );
  const actual = {};
  const transformation = ts.transform(sourceFile, [context => {
    for (const property of struct.members.filter(ts.isPropertyDeclaration)) {
      const result = processMemberVariableDecorators(
        struct.name,
        property,
        constructor,
        new Map(),
        { hasController: false, unassignedControllerSet: new Set() },
        [],
        undefined,
        context,
        false,
        parameters
      );
      actual[property.name.text] = {
        constructor: printNode(result.getCtor(), sourceFile),
        setter: printNode(result.getVariableSet(), sourceFile),
        updateParams: printNode(result.getUpdateParams(), sourceFile)
      };
    }
    return node => node;
  }]);
  transformation.dispose();
  return actual;
}

function withCleanSetterState(callback) {
  PropMapManager.reset();
  resetProcessComponentMember();
  try {
    return callback();
  } finally {
    resetProcessComponentMember();
    PropMapManager.reset();
  }
}

function assertActualAccessors(actual) {
  assert.deepStrictEqual(Object.keys(actual), ['localCount', 'title', 'storedScore', 'draft']);
  for (const [property, accessor] of Object.entries(actual)) {
    assert.ok(accessor.setter, `${property}: dynamic compiler must emit a local setter`);
    assert.ok(accessor.setter.includes(`set ${property}(newValue:`),
      `${property}: setter name or parameter type changed`);
    assert.ok(accessor.setter.includes(`this.__${property}.set(newValue);`),
      `${property}: local setter must update its backing value`);
  }
  assert.ok(actual.title.constructor.includes('SynchedPropertySimpleOneWay(params.title'));
  assert.ok(actual.storedScore.constructor.includes("AppStorage.SetAndProp('pr09.setter.score'"));
  assert.ok(actual.title.updateParams.includes('this.title = params.title;'),
    'Prop parent updates flow into the child, not back to the parent');
  assert.ok(!actual.title.updateParams.includes('params.title ='),
    'Prop updateParams must not write back into the parent params object');
  assert.strictEqual(actual.storedScore.updateParams, undefined,
    'StorageProp has no automatic parent write-back updateParams');
  assert.strictEqual(actual.draft.updateParams, undefined,
    'LocalStorageProp has no automatic parent write-back updateParams');
  assert.ok(actual.localCount.updateParams.includes('if (params.localCount !== undefined)'),
    'State accepts a defined parent initializer');
  assert.ok(actual.localCount.updateParams.includes('this.localCount = params.localCount;'),
    'State parent initialization updates the child value');
  return actual;
}

async function runSetterContractCase(options = {}) {
  return executeCase({
    name: 'pr09-one-way-setters-and-state-parent-initialization',
    group: 'unit',
    direction: DIRECTION,
    kind: 'specialized',
    coverage: 'actual processMemberVariableDecorators setters for Prop, StorageProp, LocalStorageProp and State'
  }, async context => {
    const actual = withCleanSetterState(() => assertActualAccessors(captureActualAccessors()));
    context.passStage('processMemberVariableDecorators.setters', {
      properties: Object.keys(actual),
      storageUpdateParams: actual.storedScore.updateParams,
      localStorageUpdateParams: actual.draft.updateParams
    });
    context.passStage('state.parent-initialization', {
      updateParams: actual.localCount.updateParams
    });
    return {
      actual,
      toolchain: [
        {
          name: 'ohos-typescript',
          path: require.resolve('typescript'),
          version: require('typescript/package.json').version
        },
        {
          name: 'compiler-interop-member-transform',
          path: require.resolve('../../../../lib/process_component_member'),
          version: 'interopBuild'
        }
      ]
    };
  }, options);
}

module.exports = {
  assertActualAccessors,
  captureActualAccessors,
  runSetterContractCase,
  withCleanSetterState
};
