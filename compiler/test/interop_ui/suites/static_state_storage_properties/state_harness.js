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
const ts = require('typescript');
const {
  DIRECTION,
  executeCase
} = require('../static_calls_dynamic_basic/harness');
const {
  assertDeclarationContract
} = require('../property_ref_contract/ast_assertions');
const {
  withDeclgenCase
} = require('../property_ref_contract/declgen_smoke');
const {
  assertNoActiveResources,
  resourceStats,
  withTransformedCase
} = require('../property_ref_contract/program_harness');
const {
  assertGeneratedMethods,
  assertOneWayProperties,
  assertSourceBehavior,
  assertStateImportOrigins,
  assertV1Only
} = require('./state_assertions');
const {
  runDiagnosticContractCase
} = require('./diagnostic_contract');
const {
  runSetterContractCase
} = require('./setter_contract');
const {
  declgenExpectations,
  expectedCases,
  integratedDeclaration
} = require('./expected_cases');
const {
  declgenCases,
  integratedCase,
  unitCases
} = require('./source_cases');

const TOOLCHAIN = [
  {
    name: 'ohos-typescript',
    path: require.resolve('typescript'),
    version: require('typescript/package.json').version
  },
  {
    name: '@panda/declgen',
    path: require.resolve('declgen'),
    version: require('declgen/package.json').version
  }
];

function atStage(stage, body) {
  try {
    return body();
  } catch (error) {
    error.stage = error.stage || stage;
    throw error;
  }
}

function assertNoPr04Duplication(testCase) {
  assert.strictEqual(testCase.knownFailureId, undefined,
    `${testCase.id}: PR09 must not adopt a PR04 known-failure marker`);
  assert.ok(!testCase.source.includes('declare function Prop'),
    `${testCase.id}: duplicates the PR04 local Prop collision`);
  assert.ok(!testCase.source.includes("from './ordinary'"),
    `${testCase.id}: duplicates the PR04 ordinary-module Prop collision`);
  assert.ok(!testCase.source.includes('dynamic/@ohos.arkui.GlobalAnnotation'),
    `${testCase.id}: unexpectedly enters the dynamic GlobalAnnotation declgen boundary`);
}

function verifySupportedDecoratorMatrix() {
  const supported = new Set([
    'State',
    'Link',
    'PropRef',
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ]);
  let checkedProperties = 0;
  const expectations = [
    ...Object.values(expectedCases),
    ...Object.values(declgenExpectations),
    integratedDeclaration
  ];
  for (const expected of expectations) {
    for (const expectedProperty of Object.values(expected.properties)) {
      const name = expectedProperty.decorators[0].name;
      assert.ok(supported.has(name), `${expected.structName} uses unsupported decorator ${name}`);
      assert.ok(!name.endsWith('LinkRef'), `${expected.structName} invents a StorageLinkRef contract`);
      checkedProperties += 1;
    }
    const stateImport = expected.imports.find(item => item.source === '@ohos.arkui.stateManagement');
    assert.ok(stateImport, `${expected.structName} has no static stateManagement source`);
    for (const name of Object.values(expected.properties).map(item => item.decorators[0].name)) {
      assert.ok(stateImport.named.includes(name), `${expected.structName} imports ${name} from the wrong module`);
    }
  }
  return { checkedProperties, supportedDecorators: Array.from(supported) };
}

function verifyMatrix() {
  const unitIds = unitCases.map(testCase => testCase.id);
  const declgenIds = declgenCases.map(testCase => testCase.id);
  assert.strictEqual(new Set(unitIds).size, unitIds.length);
  assert.strictEqual(new Set(declgenIds).size, declgenIds.length);
  assert.strictEqual(new Set([...unitIds, ...declgenIds]).size, unitIds.length + declgenIds.length);
  assert.deepStrictEqual(Object.keys(expectedCases).sort(), [...unitIds].sort());
  assert.deepStrictEqual(Object.keys(declgenExpectations).sort(), [...declgenIds].sort());
  const branches = new Set();
  for (const testCase of [...unitCases, ...declgenCases, integratedCase]) {
    assert.ok(testCase.purpose.length > 40, `${testCase.id}: purpose must identify a real boundary`);
    assertNoPr04Duplication(testCase);
  }
  for (const testCase of unitCases) {
    assert.ok(!branches.has(testCase.branch), `duplicate branch ${testCase.branch}`);
    branches.add(testCase.branch);
    const expected = expectedCases[testCase.id];
    assert.ok(Object.keys(expected.properties).length >= 1);
    assert.ok(testCase.updates || testCase.reads || testCase.components || testCase.oneWay,
      `${testCase.id}: scenario needs behavior in addition to declaration shape`);
  }
  const decorators = Object.values(integratedDeclaration.properties).map(item => item.decorators[0].name);
  assert.deepStrictEqual(decorators, [
    'State',
    'Link',
    'PropRef',
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ]);
  assert.ok(!decorators.includes('StorageLinkRef'), 'StorageLink remains the supported two-way V1 decorator');
  assert.ok(!decorators.includes('Local') && !decorators.includes('Param'), 'V2 decorators are forbidden');
  const support = verifySupportedDecoratorMatrix();
  return {
    unitCases: unitIds.length,
    declgenCases: declgenIds.length,
    integratedCases: 1,
    branches: branches.size,
    ...support
  };
}

function runTransformCase(testCase, options) {
  const definition = {
    name: `pr09-${testCase.id}`,
    group: 'unit',
    direction: DIRECTION,
    kind: 'specialized',
    coverage: `${testCase.branch}: ${testCase.purpose}`
  };
  return executeCase(definition, async context => {
    let behavior;
    let printedText;
    atStage('HandleUIImports.transform', () => {
      withTransformedCase(testCase, result => {
        printedText = result.printedText;
        atStage('declaration.contract', () => {
          assertDeclarationContract(result.sourceFile, expectedCases[testCase.id]);
        });
        behavior = atStage('state.behavior', () =>
          assertSourceBehavior(result.sourceFile, testCase, expectedCases[testCase.id]));
        context.passStage('HandleUIImports.transform', {
          outputBytes: Buffer.byteLength(printedText, 'utf8')
        });
        context.passStage('declaration.contract');
        context.passStage('state.behavior');
      });
    });
    atStage('resource.isolation', () => assertNoActiveResources());
    context.passStage('resource.isolation', {
      activePrograms: resourceStats.activePrograms,
      activeTransformations: resourceStats.activeTransformations,
      activeTemporaryDirectories: resourceStats.activeTemporaryDirectories
    });
    return {
      behavior,
      output: { bytes: Buffer.byteLength(printedText, 'utf8'), persistence: 'temporary-removed' },
      toolchain: TOOLCHAIN
    };
  }, options);
}

function runDeclgenCase(testCase, options) {
  const definition = {
    name: `pr09-${testCase.id}`,
    group: 'compile',
    direction: DIRECTION,
    kind: 'declaration-consumer',
    coverage: `real DeclfileProductor plus declaration consumer: ${testCase.purpose}`
  };
  return executeCase(definition, async context => {
    let output;
    atStage('DeclfileProductor.runDeclgen', () => {
      withDeclgenCase(testCase, evidence => {
        context.passStage('DeclfileProductor.runDeclgen', {
          generatedFiles: evidence.generatedFiles.length,
          cacheFiles: evidence.generatedCacheFiles.length
        });
        atStage('declaration.contract', () => {
          assertDeclarationContract(
            evidence.declarationSourceFile,
            declgenExpectations[testCase.id],
            { declaration: true }
          );
        });
        const methods = atStage('declaration.methods', () =>
          assertGeneratedMethods(evidence.declarationSourceFile, testCase, testCase.componentName));
        const v1Decorators = assertV1Only(evidence.declarationSourceFile, testCase.id);
        const importOrigins = assertStateImportOrigins(evidence.declarationSourceFile);
        const inputSourceFile = ts.createSourceFile(
          `${testCase.id}.ets`, testCase.source, ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
        const oneWay = assertOneWayProperties(inputSourceFile, testCase);
        assert.strictEqual(evidence.consumerEvidence.propertyType, testCase.consumerType);
        const consumerText = fs.readFileSync(evidence.consumerPath, 'utf8');
        assert.ok(consumerText.includes(`return card.${testCase.consumerProperty};`),
          `${testCase.id}: consumer did not read ${testCase.consumerProperty}`);
        assert.ok(consumerText.includes(`import { ${testCase.componentName} }`),
          `${testCase.id}: consumer did not import ${testCase.componentName}`);
        assert.strictEqual(evidence.consumerEvidence.componentDeclarationKind, 'StructDeclaration');
        assert.strictEqual(evidence.generatedFiles.length, 1);
        assert.ok(evidence.generatedCacheFiles.length > 0);
        context.passStage('declaration.contract', { methods, importOrigins, v1Decorators, oneWay });
        context.passStage('consumer.resolution', evidence.consumerEvidence);
        output = {
          bytes: Buffer.byteLength(evidence.declarationText, 'utf8'),
          cacheFiles: evidence.generatedCacheFiles.length,
          componentDeclarationKind: evidence.consumerEvidence.componentDeclarationKind,
          consumerProperty: testCase.consumerProperty,
          consumerType: evidence.consumerEvidence.propertyType,
          moduleRequest: evidence.moduleRequest,
          persistence: 'temporary-removed'
        };
      });
    });
    atStage('resource.isolation', () => assertNoActiveResources());
    context.passStage('resource.isolation');
    return { output, toolchain: TOOLCHAIN };
  }, options);
}

async function runUnitCases(options = {}) {
  const results = [await executeCase({
    name: 'pr09-contract-matrix',
    group: 'unit',
    direction: DIRECTION,
    kind: 'specialized',
    coverage: 'unique real V1 scenarios, complete expectations and no PR04 known-defect duplication'
  }, async context => {
    const matrix = verifyMatrix();
    context.passStage('contract.matrix', matrix);
    return { matrix, toolchain: TOOLCHAIN };
  }, options)];
  for (const testCase of unitCases) {
    results.push(await runTransformCase(testCase, options));
  }
  results.push(await runSetterContractCase(options));
  results.push(await runDiagnosticContractCase(options));
  return results;
}

async function runDeclgenCases(options = {}) {
  const results = [];
  for (const testCase of declgenCases) {
    results.push(await runDeclgenCase(testCase, options));
  }
  return results;
}

module.exports = {
  TOOLCHAIN,
  atStage,
  runDeclgenCase,
  runDeclgenCases,
  runTransformCase,
  runUnitCases,
  verifyMatrix
};
