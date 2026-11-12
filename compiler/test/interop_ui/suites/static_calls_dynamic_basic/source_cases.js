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

const dynamicCounter = `@Component
export struct DynamicCounter {
  @State private count: number = 0;

  aboutToAppear(): void {
    console.info('[InteropUiPr01] dynamic component appeared');
  }

  build() {
    Column() {
      Text('ArkTS 1.1 dynamic component')
        .fontSize(22)
        .id('dynamicComponentTitle')
      Text('count=' + this.count)
        .fontSize(24)
        .margin({ top: 16 })
        .id('dynamicCount')
      Button('increment')
        .margin({ top: 16 })
        .id('dynamicIncrement')
        .onClick(() => {
          this.count += 1;
        })
    }
    .width('100%')
    .padding(16)
  }
}
`;

const dynamicIndex = `export { DynamicCounter } from './src/main/ets/DynamicCounter';
`;

const staticCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { DynamicCounter } from 'dynamic_component';

@Entry
@Component
struct Index {
  aboutToAppear(): void {
    console.info('[InteropUiPr01] static caller appeared');
  }

  build() {
    Column(undefined) {
      Text('ArkTS 1.2 static caller')
        .fontSize(26)
        .id('staticCallerTitle')
      Text('consumes generated ArkTS 1.1 declarations')
        .fontSize(18)
        .margin({ top: 16 })
        .id('staticCalleeDescription')
      DynamicCounter()
    }
    .width('100%')
    .height('100%')
    .padding(24)
  }
}
`;

const entryAbility = `'use static'
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(stage: window.WindowStage): void {
    console.info('[InteropUiPr01] static EntryAbility load');
    stage.loadContent('pages/Index');
  }
}
`;

const specializedCases = [
  {
    id: 'component-imports',
    name: 'component declaration receives storage and dynamic annotation imports',
    source: `'use static'
import { Component, State } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct CounterCard {
  @State count: number;
  build(): void;
}
`,
    expectation: 'componentImports'
  },
  {
    id: 'prop-ref',
    name: 'dynamic Prop property becomes a static PropRef property',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct TitleCard {
  @Prop title: string;
}
`,
    expectation: 'propRef'
  },
  {
    id: 'dynamic-prop-preserved',
    name: 'Prop imported from dynamic annotations is not rewritten',
    source: `'use static'
import { Component, Prop } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct LegacyTitleCard {
  @Prop title: string;
}
`,
    expectation: 'dynamicPropPreserved'
  },
  {
    id: 'storage-prop-refs',
    name: 'storage decorators retain keys while changing to reference decorators',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct StorageCard {
  @StorageProp('selectedTitle') title: string;
  @LocalStorageProp('selectedCount') count: number;
}
`,
    expectation: 'storagePropRefs'
  },
  {
    id: 'monitor-array',
    name: 'Monitor arguments are wrapped in one parameter array',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct WatchedCard {
  @Monitor('count', 'title')
  onContentChanged(): void;
}
`,
    expectation: 'monitorArray'
  },
  {
    id: 'monitor-array-idempotent',
    name: 'an existing Monitor parameter array is not nested again',
    source: `'use static'
import { Component, Monitor } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct WatchedOnceCard {
  @Monitor(['count'])
  onCountChanged(): void;
}
`,
    expectation: 'monitorArrayIdempotent'
  },
  {
    id: 'method-return-type',
    name: 'declaration methods without a return type receive void',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct LifecycleCard {
  aboutToAppear();
  aboutToDisappear(): void;
}
`,
    expectation: 'methodReturnType'
  },
  {
    id: 'struct-constructor',
    name: 'struct declaration constructors are removed for static consumers',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Component
export declare struct ConstructedCard {
  constructor();
  build(): void;
}
`,
    expectation: 'structConstructor'
  },
  {
    id: 'builder-import',
    name: 'Builder declaration adds its component annotation import',
    source: `'use static'
import { Component } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Builder
export declare function CardFooter(): void;
@Component
export declare struct BuilderCard {
  build(): void;
}
`,
    expectation: 'builderImport'
  },
  {
    id: 'existing-imports-deduplicated',
    name: 'existing storage and annotation imports are not duplicated',
    source: `'use static'
import { LocalStorage } from '@ohos.arkui.stateManagement';
import { Component, Builder } from '@ohos.arkui.component';
import { State } from 'dynamic/@ohos.arkui.GlobalAnnotation';
@Builder
export declare function CardContent(): void;
@Component
export declare struct DeduplicatedCard {
  @State count: number;
}
`,
    expectation: 'existingImportsDeduplicated'
  }
];

const moduleIdentity = {
  packageName: 'dynamic_component',
  componentName: 'DynamicCounter',
  componentModule: 'dynamic_component/src/main/ets/DynamicCounter',
  componentOhmUrl: '@normalized:N&&&dynamic_component/src/main/ets/DynamicCounter&1.0.0',
  indexModule: 'dynamic_component/Index',
  indexOhmUrl: '@normalized:N&&&dynamic_component/Index&1.0.0',
  callerRecord: 'entry.src.main.ets.pages.Index',
  dynamicRecord: '&dynamic_component.src.main.ets.DynamicCounter&1.0.0',
  dynamicExport: 'ModuleTag: LOCAL_EXPORT, local_name: DynamicCounter, export_name: DynamicCounter;',
  bridgeImport: 'import { DynamicCounter } from "dynamic_component";'
};

module.exports = {
  dynamicCounter,
  dynamicIndex,
  entryAbility,
  moduleIdentity,
  specializedCases,
  staticCaller
};
