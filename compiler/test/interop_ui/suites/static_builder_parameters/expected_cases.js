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

const declarationExpectations = {
  'global-no-parameter': {
    required: [
      `import { Builder } from '@ohos.arkui.component';`,
      `@Builder`,
      `export declare function GlobalEmpty(): void;`
    ],
    forbidden: [`GlobalEmpty(parent`, `GlobalEmpty(): any`],
    functions: {
      GlobalEmpty: { decorators: ['Builder'], parameters: [], returnType: 'void' }
    }
  },
  'global-object-parameter': {
    required: [
      `export declare interface HeadingOptions`,
      `title: string;`,
      `export declare function GlobalHeading(options: HeadingOptions): void;`
    ],
    forbidden: [`options: any`, `GlobalHeading();`],
    functions: {
      GlobalHeading: {
        decorators: ['Builder'],
        parameters: [{ name: 'options', type: 'HeadingOptions' }],
        returnType: 'void'
      }
    }
  },
  'global-two-parameters': {
    required: [
      `export declare function GlobalPair(options: PairOptions, count: number): void;`
    ],
    forbidden: [`count: string`, `options?: PairOptions`],
    functions: {
      GlobalPair: {
        decorators: ['Builder'],
        parameters: [
          { name: 'options', type: 'PairOptions' },
          { name: 'count', type: 'number' }
        ],
        returnType: 'void'
      }
    }
  },
  'global-optional-parameter': {
    required: [
      `title?: string;`,
      `export declare function GlobalOptional(options?: OptionalHeading): void;`
    ],
    forbidden: [`options: OptionalHeading | undefined`],
    functions: {
      GlobalOptional: {
        decorators: ['Builder'],
        parameters: [{ name: 'options', type: 'OptionalHeading', optional: true }],
        returnType: 'void'
      }
    }
  },
  'local-no-parameter': {
    required: [
      `@ohos.arkui.component`,
      `@Builder`,
      `emptyContent(): void;`,
      `build(): void;`
    ],
    forbidden: [`emptyContent(parent`, `constructor(`],
    structs: {
      LocalEmptyCard: {
        decorators: ['Component'],
        methods: {
          emptyContent: { decorators: ['Builder'], parameters: [], returnType: 'void' },
          build: { decorators: [], parameters: [], returnType: 'void' }
        }
      }
    }
  },
  'slot-no-parameter': {
    required: [
      `@ohos.arkui.component`,
      `@BuilderParam`,
      `content: () => void;`
    ],
    forbidden: [`content: Function`, `content?:`],
    structs: {
      EmptySlotCard: {
        decorators: ['Component'],
        properties: {
          content: { decorators: ['BuilderParam'], type: '() => void' }
        }
      }
    }
  },
  'slot-object-parameter': {
    required: [
      `export declare interface SlotModel`,
      `detail: (model: SlotModel) => void;`
    ],
    forbidden: [`model: any`, `detail: Function`],
    structs: {
      ModelSlotCard: {
        decorators: ['Component'],
        properties: {
          detail: { decorators: ['BuilderParam'], type: '(model: SlotModel) => void' }
        }
      }
    }
  },
  'slot-union-model': {
    required: [
      `export type UnionInput = UnionHeading | string | undefined;`,
      `content: (input: UnionInput) => void;`
    ],
    forbidden: [`input: any`, `UnionInput = string`],
    structs: {
      UnionSlotCard: {
        decorators: ['Component'],
        properties: {
          content: { decorators: ['BuilderParam'], type: '(input: UnionInput) => void' }
        }
      }
    }
  },
  'component-and-exported-builder': {
    required: [
      `export declare function SharedHeading(model: SharedModel): void;`,
      `content: (model: SharedModel) => void;`
    ],
    forbidden: [`SharedHeading(): void`, `content: () => void`],
    functions: {
      SharedHeading: {
        decorators: ['Builder'],
        parameters: [{ name: 'model', type: 'SharedModel' }],
        returnType: 'void'
      }
    },
    structs: {
      SharedSlotCard: {
        decorators: ['Component'],
        properties: {
          content: { decorators: ['BuilderParam'], type: '(model: SharedModel) => void' }
        }
      }
    }
  }
};

const transformExpectations = {
  'builder-import-dedup': {
    required: [
      `import { Builder, BuilderParam, Component } from '@ohos.arkui.component';`,
      `export declare function ExistingHeading(): void;`,
      `@BuilderParam\ncontent: () => void;`
    ],
    forbidden: [
      `import { Builder, Builder,`,
      `import { BuilderParam, BuilderParam`,
      `constructor(`
    ],
    imports: {
      '@ohos.arkui.component': ['Builder', 'BuilderParam', 'Component']
    }
  },
  'builder-and-slot-imports': {
    required: [
      `@ohos.arkui.component`,
      `@ohos.arkui.stateManagement`,
      `export declare function GeneratedHeading(): void;`
    ],
    forbidden: [`BuilderParam } from '@ohos.arkui.stateManagement'`],
    imports: {
      '@ohos.arkui.component': ['Builder', 'BuilderParam', 'Component'],
      '@ohos.arkui.stateManagement': ['LocalStorage']
    }
  },
  'builder-signature-preservation': {
    required: [
      `export interface TransformModel`,
      `SignatureHeading(model: TransformModel, count?: number): void;`
    ],
    forbidden: [`model: any`, `count: number`],
    functions: {
      SignatureHeading: {
        decorators: ['Builder'],
        parameters: [
          { name: 'model', type: 'TransformModel' },
          { name: 'count', type: 'number', optional: true }
        ],
        returnType: 'void'
      }
    }
  },
  'builder-method-return-inference': {
    required: [`content(): void;`, `build(): void;`],
    forbidden: [`content();`, `build();`],
    structs: {
      InferredBuilderCard: {
        decorators: ['Component'],
        methods: {
          content: { decorators: ['Builder'], parameters: [], returnType: 'void' },
          build: { decorators: [], parameters: [], returnType: 'void' }
        }
      }
    }
  },
  'ordinary-callback-control': {
    required: [`onContent: () => void;`],
    forbidden: [`BuilderParam`, `onContent: Function`],
    structs: {
      CallbackControlCard: {
        decorators: ['Component'],
        properties: {
          onContent: { decorators: [], type: '() => void' }
        }
      }
    }
  },
  'builder-directive-position': {
    required: [
      `'use static'`,
      `import { Builder } from '@ohos.arkui.component';`,
      `DirectiveHeading(): void;`
    ],
    forbidden: [`DirectiveHeading(parent`],
    directive: 'use static'
  }
};

const compileExpectations = {
  'global-builder-calls': {
    declarationRequired: [
      `export declare function ExportedBanner(): void;`,
      `export declare function ExportedOptions(options: BannerOptions): void;`,
      `export declare function ExportedPair(options: BannerOptions, count: number): void;`,
      `export declare struct GlobalBuilderHost`
    ],
    staticRequired: [
      'createCompatibleNodeWithFuncVoid',
      'createCompatibleNodeWithFunc',
      'createCompatibleNodeWithFunc2',
      'compatibleComponent',
      'GlobalBuilderHost',
      'global-host'
    ],
    dynamicRequired: [
      'ExportedBanner',
      'ExportedOptions',
      'ExportedPair',
      'GlobalBuilderHost'
    ],
    staticForbidden: []
  },
  'named-local-builder-references': {
    declarationRequired: [
      `@BuilderParam`,
      `body: () => void;`,
      `detail: (model: NamedSlotModel) => void;`
    ],
    staticRequired: [
      'std.interop.ESValue.setProperty',
      'std.core.NamedFunctionObject',
      'viewPUCreate',
      'localBody',
      'localDetail',
      'NamedSlotCard'
    ],
    dynamicRequired: ['NamedSlotCard', 'initialRender'],
    staticForbidden: [],
    functions: [
      {
        id: 'named-options-initializer',
        headerContains: [
          '.function arkui.component.interop.CompatibleComponentInfo',
          'entry.src.main.ets.pages.Index.Index.lambda_invoke-'
        ],
        bodyContains: ['any.ldbyname', '"NamedSlotCard"'],
        sequence: [
          'lda.str "title"',
          'call std.interop.ESValue.setProperty',
          'lda.str "body"',
          'call std.interop.ESValue.setProperty',
          'lda.str "detail"',
          'call std.interop.ESValue.setProperty',
          'lda.str "viewPUCreate"'
        ]
      },
      {
        id: 'named-local-body-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.localBody(']
      },
      {
        id: 'named-local-detail-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.localDetail(']
      }
    ],
    emptyUpdaters: [{
      stage: 'builder-updater',
      code: 'PR08-NAMED-UPDATER-EMPTY',
      issue: 'named updater remains an explicit existing contract',
      message: 'NamedSlotCard updater lambda_invoke-8 has no updateStateVars or parameter update call',
      headerContains: [
        '.function void entry.src.main.ets.pages.Index.Index.lambda_invoke-8(std.interop.ESValue a0)'
      ]
    }]
  },
  'local-builder-call-position': {
    declarationRequired: [
      `@BuilderParam`,
      `content: () => void;`,
      `@PropRef`
    ],
    staticRequired: [
      'std.interop.ESValue.setProperty',
      'std.core.NamedFunctionObject',
      'viewPUCreate',
      'content',
      'explicit-slot-content',
      'pageContent',
      'slotContent',
      'ExplicitSlotCard',
      'compatibleComponent'
    ],
    dynamicRequired: ['ExplicitSlotCard', 'initialRender', 'updateStateVars'],
    staticForbidden: [],
    functions: [
      {
        id: 'explicit-options-initializer',
        headerContains: [
          '.function arkui.component.interop.CompatibleComponentInfo',
          'entry.src.main.ets.pages.Index.Index.lambda_invoke-'
        ],
        bodyContains: ['any.ldbyname', '"ExplicitSlotCard"'],
        sequence: [
          'lda.str "title"',
          'call std.interop.ESValue.setProperty',
          'lda.str "content"',
          'call std.interop.ESValue.setProperty',
          'lda.str "viewPUCreate"'
        ]
      },
      {
        id: 'explicit-page-builder-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.pageContent(']
      },
      {
        id: 'explicit-slot-builder-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.slotContent(']
      }
    ]
  },
  'global-static-builder-reference': {
    declarationRequired: [
      `@BuilderParam`,
      `content: () => void;`
    ],
    staticRequired: [
      'StaticReferenceContent',
      'std.core.NamedFunctionObject',
      'std.interop.ESValue.setProperty',
      'ReferenceSlotCard',
      'compatibleComponent'
    ],
    dynamicRequired: ['ReferenceSlotCard', 'initialRender'],
    staticForbidden: ['transferCompatibleUpdatableBuilder'],
    functions: [
      {
        id: 'global-reference-options-initializer',
        headerContains: [
          '.function arkui.component.interop.CompatibleComponentInfo',
          'entry.src.main.ets.pages.Index.Index.lambda_invoke-'
        ],
        bodyContains: ['any.ldbyname', '"ReferenceSlotCard"'],
        sequence: [
          'lda.str "content"',
          'call std.interop.ESValue.setProperty',
          'lda.str "viewPUCreate"'
        ]
      },
      {
        id: 'global-reference-builder-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.ETSGLOBAL.StaticReferenceContent(']
      }
    ]
  },
  'nested-builder-call-position': {
    declarationRequired: [
      `@BuilderParam`,
      `content: () => void;`,
      `@PropRef`
    ],
    staticRequired: [
      'std.core.NamedFunctionObject',
      'std.interop.ESValue.setProperty',
      'nested-builder-content',
      'nestedContent',
      'InlineSlotCard'
    ],
    dynamicRequired: ['InlineSlotCard', 'initialRender', 'updateStateVars'],
    staticForbidden: ['transferCompatibleUpdatableBuilder'],
    functions: [
      {
        id: 'nested-options-initializer',
        headerContains: [
          '.function arkui.component.interop.CompatibleComponentInfo',
          'entry.src.main.ets.pages.Index.Index.lambda_invoke-'
        ],
        bodyContains: ['any.ldbyname', '"InlineSlotCard"'],
        sequence: [
          'lda.str "label"',
          'call std.interop.ESValue.setProperty',
          'lda.str "content"',
          'call std.interop.ESValue.setProperty',
          'lda.str "viewPUCreate"'
        ]
      },
      {
        id: 'nested-row-show-content-branch',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.lambda_invoke-'],
        bodyContains: [
          'entry.src.main.ets.pages.Index.Index.%%get-showContent',
          'arkui.component.row.ETSGLOBAL.Row'
        ],
        sequence: [
          'entry.src.main.ets.pages.Index.Index.%%get-showContent',
          'arkui.component.row.ETSGLOBAL.Row'
        ]
      },
      {
        id: 'nested-content-builder-definition',
        headerContains: ['.function void entry.src.main.ets.pages.Index.Index.nestedContent(']
      }
    ]
  }
};

const artifactContracts = {
  declgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  declarationMap: 'dynamic_component/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  repositoryDisassembly: 'evidence/repository-modules_static.pa',
  repositoryBuildLog: 'evidence/repository-static.log',
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  dynamicDisassembly: 'evidence/modules_dynamic.pa',
  callerConfig: 'repository-consume/cache/entry/arktsconfig.json',
  buildLog: 'evidence/hvigor.log',
  commandLog: 'evidence/hvigor-command.txt'
};

function declarationBaseline(f0016Location) {
  return [
    {
      stage: 'GenerateDeclaration',
      code: 'F0014',
      message: `Unresolved module name for path: ''`,
      issue: 'PR01-SDK-UNRESOLVED-MODULE'
    },
    {
      stage: 'GenerateDeclaration',
      code: 'ESE0360',
      message: 'Cannot find import: *ERROR_LITERAL*',
      location: 'entry/src/main/ets/pages/Index.ets/:3:1',
      issue: 'PR01-SDK-UNRESOLVED-IMPORT'
    },
    {
      stage: 'GenerateDeclaration',
      code: 'F0016',
      message: `Can't find prefix for 'dynamic_component'`,
      location: `entry/src/main/ets/pages/Index.ets/:${f0016Location}`,
      issue: 'PR01-SDK-MISSING-PACKAGE-PREFIX'
    }
  ];
}

const diagnosticContracts = {
  'global-builder-calls': declarationBaseline('8:8'),
  'named-local-builder-references': [
    ...declarationBaseline('3:47'),
    {
      stage: 'GenerateDeclaration',
      code: 'ESE0371',
      message: `Cannot find type 'NamedSlotModel'.`,
      location: 'entry/src/main/ets/pages/Index.ets/:14:22',
      issue: 'PR08-NAMED-MODEL-DECLARATION'
    }
  ],
  'local-builder-call-position': [
    ...declarationBaseline('3:34'),
    {
      stage: 'GenerateDeclaration',
      code: 'ESE0143',
      message: 'Unresolved reference ExplicitSlotCard',
      location: 'entry/src/main/ets/pages/Index.ets/:15:5',
      issue: 'PR08-LOCAL-BUILDER-DECLARATION'
    }
  ],
  'global-static-builder-reference': declarationBaseline('3:35'),
  'nested-builder-call-position': declarationBaseline('3:32')
};

module.exports = {
  artifactContracts,
  compileExpectations,
  declarationExpectations,
  diagnosticContracts,
  transformExpectations
};
