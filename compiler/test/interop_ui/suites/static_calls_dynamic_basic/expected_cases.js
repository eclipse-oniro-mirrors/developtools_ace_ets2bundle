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

const expectations = {
  componentImports: {
    required: [
      `import { LocalStorage } from '@ohos.arkui.stateManagement';`,
      `import { Component, State } from 'dynamic/@ohos.arkui.GlobalAnnotation';`,
      `@Component`,
      `export declare struct CounterCard`,
      `@State`,
      `count: number;`,
      `build(): void;`
    ],
    forbidden: [
      `constructor(`
    ]
  },
  propRef: {
    required: [
      `import { LocalStorage, PropRef } from '@ohos.arkui.stateManagement';`,
      `@PropRef`,
      `title: string;`
    ],
    forbidden: [
      `@Prop title: string;`
    ]
  },
  dynamicPropPreserved: {
    required: [
      `import { Component, Prop } from 'dynamic/@ohos.arkui.GlobalAnnotation';`,
      `@Prop`,
      `title: string;`
    ],
    forbidden: [
      `PropRef`
    ]
  },
  storagePropRefs: {
    required: [
      `@StoragePropRef('selectedTitle')`,
      `title: string;`,
      `@LocalStoragePropRef('selectedCount')`,
      `count: number;`,
      `StoragePropRef`,
      `LocalStoragePropRef`
    ],
    forbidden: [
      `@StorageProp('selectedTitle')`,
      `@LocalStorageProp('selectedCount')`
    ]
  },
  monitorArray: {
    required: [
      `@Monitor(['count', 'title'])`,
      `import { LocalStorage, Monitor } from '@ohos.arkui.stateManagement';`,
      `onContentChanged(): void;`
    ],
    forbidden: [
      `@Monitor('count', 'title')`
    ]
  },
  monitorArrayIdempotent: {
    required: [
      `@Monitor(['count'])`,
      `onCountChanged(): void;`
    ],
    forbidden: [
      `@Monitor([['count']])`
    ]
  },
  methodReturnType: {
    required: [
      `aboutToAppear(): void;`,
      `aboutToDisappear(): void;`
    ],
    forbidden: [
      `aboutToAppear();`
    ]
  },
  structConstructor: {
    required: [
      `export declare struct ConstructedCard`,
      `build(): void;`
    ],
    forbidden: [
      `constructor(`
    ]
  },
  builderImport: {
    required: [
      `import { Builder } from '@ohos.arkui.component';`,
      `@Builder`,
      `export declare function CardFooter(): void;`
    ],
    forbidden: [
      `function CardFooter();`
    ]
  },
  existingImportsDeduplicated: {
    required: [
      `import { LocalStorage } from '@ohos.arkui.stateManagement';`,
      `import { Component, Builder } from '@ohos.arkui.component';`,
      `@Builder`,
      `@State count: number;`
    ],
    forbidden: [
      `import { LocalStorage, LocalStorage }`,
      `import { Builder, Component } from '@ohos.arkui.component';\nimport { Builder`
    ]
  }
};

const realDeclaration = {
  component: {
    required: [
      `'use static'`,
      `import { Component } from '@ohos.arkui.component';`,
      `import { LocalStorage, State } from '@ohos.arkui.stateManagement';`,
      `@Component`,
      `export declare struct DynamicCounter`,
      `aboutToAppear(): void;`,
      `build(): void;`
    ],
    forbidden: [
      `console.info`,
      `constructor(`,
      `Button('increment')`
    ]
  },
  index: {
    required: [
      `'use static'`,
      `export { DynamicCounter } from './src/main/ets/DynamicCounter';`
    ],
    forbidden: [
      `export default`
    ]
  }
};

const knownGenerateDeclarationFailure = {
  stage: 'GenerateDeclaration',
  category: 'existing',
  code: 'F0014',
  sequence: ['F0014', 'ESE0360', 'F0016'],
  requiredText: [
    `Unresolved module name for path: ''`,
    `Cannot find import: *ERROR_LITERAL*`,
    `Can't find prefix for 'dynamic_component'`
  ],
  classification: 'SDK 26.0.0.35 clean rebuild already reports declaration diagnostics while continuing to mixed HAP packaging.'
};

const artifactContracts = {
  componentDeclaration: 'dynamic_component/build/default/intermediates/declgen/default/declgenV2/src/main/ets/DynamicCounter.d.ets',
  indexDeclaration: 'dynamic_component/build/default/intermediates/declgen/default/declgenV2/Index.d.ets',
  declarationMap: 'dynamic_component/build/default/intermediates/declgen/default/decl-fileInfo.json',
  callerConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/entry/arktsconfig.json',
  bridgeSource: 'entry/build/default/intermediates/declgen/default/declgenBridgeCode/entry/src/main/ets/pages/Index.ts',
  staticAbc: 'entry/build/default/intermediates/loader_out_static/default/ets/modules_static.abc',
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  packagedStaticAbc: 'entry/build/default/intermediates/ets_assets/default/ets/modules_static.abc',
  packagedDynamicAbc: 'entry/build/default/intermediates/ets_assets/default/ets/modules.abc',
  unsignedHap: 'entry/build/default/outputs/default/entry-default-unsigned.hap',
  buildLog: 'evidence/hvigor.log',
  staticDisassembly: 'evidence/modules_static.pa',
  dynamicDisassembly: 'evidence/modules_dynamic.pa',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  repositoryDeclgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  repositoryDeclarationMap: 'dynamic_component/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  repositoryStaticDisassembly: 'evidence/repository-modules_static.pa',
  repositoryBuildLog: 'evidence/repository-static.log'
};

const hapContracts = {
  entries: ['ets/modules_static.abc', 'ets/modules.abc'],
  bundleName: 'com.example.interopuipr01',
  moduleName: 'entry',
  commonHeaderMinimumBytes: 16,
  abcMagic: 'PANDA',
  packageType: 'entry'
};

module.exports = {
  artifactContracts,
  expectations,
  hapContracts,
  knownGenerateDeclarationFailure,
  realDeclaration
};
