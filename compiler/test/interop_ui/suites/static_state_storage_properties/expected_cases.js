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

const componentModule = '@ohos.arkui.component';
const stateModule = '@ohos.arkui.stateManagement';
const interopModule = '@ohos.lang.interop';

function property(decoratorName, type, initializer, options = {}) {
  const args = [];
  if (options.key !== undefined) {
    args.push({ kind: 'StringLiteral', value: options.key });
  }
  return {
    decorators: [{ name: decoratorName, arguments: args, typeArguments: [] }],
    type,
    modifiers: options.modifiers || [],
    token: options.token || '',
    initializer
  };
}

function expectation(structName, stateImports, properties, declaration = false) {
  const imports = [
    { source: componentModule, named: ['Component'] },
    { source: stateModule, named: ['LocalStorage', ...stateImports] }
  ];
  if (declaration) {
    imports.push({ source: interopModule, named: [], defaultImport: 'es' });
  }
  return { structName, imports, properties };
}

const expectedCases = {
  'state-primitive-update': expectation('PrimitiveStateCard', ['State'], {
    count: property('State', 'number', '1'),
    label: property('State', 'string', "'ready'"),
    enabled: property('State', 'boolean', 'true')
  }),
  'state-model-collection-update': expectation('ModelStateCard', ['State'], {
    model: property('State', 'CounterModel', 'new CounterModel(2)'),
    history: property('State', 'Array<number>', '[0]')
  }),
  'mixed-v1-state-storage': expectation('MixedV1Card', [
    'State',
    'Link',
    'PropRef',
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    localCount: property('State', 'number', '1'),
    sharedCount: property('Link', 'number', undefined),
    title: property('PropRef', 'string', "'mixed'"),
    storedScore: property('StoragePropRef', 'number', '5', { key: 'pr09.mixed.score' }),
    draft: property('LocalStoragePropRef', 'string', "'draft'", { key: 'pr09.mixed.draft' }),
    muted: property('StorageLink', 'boolean', 'false', { key: 'pr09.mixed.muted' })
  }),
  'storage-key-namespaces': expectation('NamespacedStorageCard', [
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    userName: property('StoragePropRef', 'string', "'anonymous'", { key: 'pr09:session/user-name' }),
    revisionCount: property('LocalStoragePropRef', 'number', '0', { key: 'pr09:draft/revision-count' }),
    editorEnabled: property('StorageLink', 'boolean', 'true', { key: 'pr09:session/editor-enabled' })
  }),
  'link-enum-transition': expectation('EnumLinkCard', ['Link'], {
    selectionMode: property('Link', 'SelectionMode', undefined)
  }),
  'prop-model-one-way': expectation('ModelPropCard', ['PropRef'], {
    model: property('PropRef', 'PropModel', 'new PropModel()'),
    aliases: property('PropRef', 'Array<string>', "['primary']")
  }),
  'storage-model-types': expectation('ModelStorageCard', [
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    profile: property('StoragePropRef', 'StoredProfile', 'new StoredProfile()', {
      key: 'pr09.model.profile'
    }),
    history: property('LocalStoragePropRef', 'Array<string>', "['created']", {
      key: 'pr09.model.history'
    }),
    selectedIndex: property('StorageLink', 'number', '0', { key: 'pr09.model.selected' })
  })
};

const declgenExpectations = {
  'declgen-state-link-prop': expectation('GeneratedStateLinkProp', ['State', 'Link', 'PropRef'], {
    localCount: property('State', 'number', undefined),
    sharedCount: property('Link', 'number', undefined),
    title: property('PropRef', 'string', undefined)
  }, true),
  'declgen-storage-refs': expectation('GeneratedStorageRefs', [
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    storedCount: property('StoragePropRef', 'number', undefined, { key: 'pr09.generated.count' }),
    draft: property('LocalStoragePropRef', 'string', undefined, { key: 'pr09.generated.draft' }),
    enabled: property('StorageLink', 'boolean', undefined, { key: 'pr09.generated.enabled' })
  }, true),
  'declgen-mixed-v1': expectation('GeneratedMixedV1', [
    'State',
    'Link',
    'PropRef',
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    localCount: property('State', 'number', undefined),
    sharedCount: property('Link', 'number', undefined),
    title: property('PropRef', 'string', undefined),
    score: property('StoragePropRef', 'number', undefined, { key: 'pr09.generated.score' }),
    note: property('LocalStoragePropRef', 'string', undefined, { key: 'pr09.generated.note' }),
    selected: property('StorageLink', 'boolean', undefined, { key: 'pr09.generated.selected' })
  }, true),
  'declgen-key-type-fidelity': expectation('GeneratedKeyTypeFidelity', [
    'PropRef',
    'StoragePropRef',
    'LocalStoragePropRef',
    'StorageLink'
  ], {
    subtitle: property('PropRef', 'string', undefined, { token: '?' }),
    profile: property('StoragePropRef', 'GeneratedProfile', undefined, { key: 'pr09:generated/profile' }),
    history: property('LocalStoragePropRef', 'es.Array<string>', undefined, {
      key: 'pr09:generated/history'
    }),
    selectedIndex: property('StorageLink', 'number', undefined, { key: 'pr09:generated/index' })
  }, true)
};

const integratedDeclaration = expectation('DynamicStateStorage', [
  'State',
  'Link',
  'PropRef',
  'StoragePropRef',
  'LocalStoragePropRef',
  'StorageLink'
], {
  localCount: property('State', 'number', undefined),
  sharedCount: property('Link', 'number', undefined),
  title: property('PropRef', 'string', undefined),
  storedScore: property('StoragePropRef', 'number', undefined, { key: 'pr09.runtime.score' }),
  draft: property('LocalStoragePropRef', 'string', undefined, { key: 'pr09.runtime.draft' }),
  muted: property('StorageLink', 'boolean', undefined, { key: 'pr09.runtime.muted' })
}, true);

const knownStateStorageDeclarationFailure = {
  stage: 'GenerateDeclaration',
  code: 'F0014',
  sequence: ['F0014', 'ESE0360', 'F0016'],
  requiredText: [
    `Unresolved module name for path: ''`,
    'Cannot find import: *ERROR_LITERAL*',
    `Can't find prefix for 'dynamic_state_storage`
  ],
  classification: 'SDK 26.0.0.35 declaration preparation reports the established dynamic_state_storage diagnostic sequence.'
};

const bridgeContract = {
  functionName: 'entry.src.main.ets.pages.Index.Index.lambda_invoke-4',
  required: [
    'std.interop.ESValue.instantiateEmptyObject:()',
    'lda.str "localCount"',
    'lda.str "sharedCount"',
    'entry.src.main.ets.pages.Index.Index.%%get-sharedCount',
    'lda.str "title"',
    'lda.str "title-from-static-caller"',
    'std.interop.ESValue.setProperty',
    'any.ldbyname v15, "DynamicStateStorage", 0x0',
    'arkui.component.interop.ETSGLOBAL.compatibleComponent'
  ],
  parameterOrder: [
    'lda.str "localCount"',
    'lda.str "sharedCount"',
    'lda.str "title"',
    'any.ldbyname v15, "DynamicStateStorage", 0x0'
  ],
  forbiddenParameters: [
    'lda.str "storedScore"',
    'lda.str "draft"',
    'lda.str "muted"',
    'pr09.runtime.score',
    'pr09.runtime.draft',
    'pr09.runtime.muted'
  ],
  callerState: [
    'arkui.stateManagement.decorator.IStateDecoratedVariable __backing_sharedCount',
    'resetStateVarsOnReuse',
    'fldai.64 0x4020000000000000'
  ],
  forbiddenDecorators: [
    '@ComponentV2',
    '@Local ',
    '@Param ',
    '@Once ',
    '@Event '
  ]
};

const artifactContracts = {
  componentDeclaration: 'dynamic_state_storage/build/default/intermediates/declgen/default/declgenV2/src/main/ets/DynamicStateStorage.d.ets',
  indexDeclaration: 'dynamic_state_storage/build/default/intermediates/declgen/default/declgenV2/Index.d.ets',
  declarationMap: 'dynamic_state_storage/build/default/intermediates/declgen/default/decl-fileInfo.json',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  repositoryDeclgenRoot: 'dynamic_state_storage/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  repositoryDeclarationMap: 'dynamic_state_storage/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  repositoryBuildLog: 'evidence/repository-static.log',
  buildLog: 'evidence/hvigor.log',
  hvigorCommand: 'evidence/hvigor-command.txt',
  staticDisassembly: 'evidence/repository-modules_static.pa'
};

module.exports = {
  artifactContracts,
  bridgeContract,
  declgenExpectations,
  expectedCases,
  integratedDeclaration,
  knownStateStorageDeclarationFailure,
  modules: {
    componentModule,
    interopModule,
    stateModule
  }
};
