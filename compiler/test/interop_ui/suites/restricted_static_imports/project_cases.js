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

const fixtures = [
  {
    id: 'sdk-named-reexport',
    boundary: 'SDK 26.0.0.35 accepts this re-export through its old bridge pipeline and preserves the normalized public export.',
    staticSource: `'use static'
import { Component, Column, Text, Button } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@Component
export struct StaticCounter {
  @State public count: number = 0;
  @State public title: string = 'default';
  @State public cardEnabled: boolean = true;

  aboutToAppear(): void {
    console.info('[DynamicCallsStaticProbe] static component appeared');
  }

  build(): void {
    Column(undefined) {
      Text(this.title + this.cardEnabled.toString()).fontSize(22).id('staticComponentTitle')
      Text('静态计数 ' + this.count.toString()).fontSize(24).margin({ top: 16 }).id('staticCount')
      Button('静态计数 +1').margin({ top: 16 }).id('staticIncrement').onClick(() => {
        this.count += 1;
        console.info('[DynamicCallsStaticProbe] static count=' + this.count.toString());
      })
    }
    .width('100%').padding(16)
  }
}
`,
    staticIndex: `'use static'
export { StaticCounter } from './src/main/ets/StaticCounter';
`,
    caller: `import { StaticCounter } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  @State title: string = "parent";
  @State cardEnabled: boolean = true;
  build() {
    Column() {
      Text('PR14 parent/child parameters')
      StaticCounter({ count: this.counterSeed, title: this.title, cardEnabled: this.cardEnabled })
      Button('update').id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
    }
    .width('100%').height('100%')
  }
}

export { StaticCounter as PublicCounter } from 'static_component';
`,
    expected: {
      properties: [
        'count',
        'title',
        'cardEnabled'
      ],
      assignments: [
        'count["\']\\]\\s*=\\s*this.counterSeed',
        'title["\']\\]\\s*=\\s*this.title'
      ],
      bytecode: [
        '__options_has_count',
        '__options_has_title',
        '__options_has_cardEnabled'
      ]
    },
    exportContract: {
      kind: 'named',
      names: [
        'PublicCounter'
      ],
      module: '@normalized:N&&&static_component/Index&1.0.0'
    }
  },
  {
    id: 'sdk-namespace-reexport',
    boundary: 'SDK 26.0.0.35 accepts this re-export through its old bridge pipeline and preserves the normalized public export.',
    staticSource: `'use static'
import { Component, Column, Text, Button } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@Component
export struct StaticCounter {
  @State public count: number = 0;
  @State public title: string = 'default';
  @State public cardEnabled: boolean = true;

  aboutToAppear(): void {
    console.info('[DynamicCallsStaticProbe] static component appeared');
  }

  build(): void {
    Column(undefined) {
      Text(this.title + this.cardEnabled.toString()).fontSize(22).id('staticComponentTitle')
      Text('静态计数 ' + this.count.toString()).fontSize(24).margin({ top: 16 }).id('staticCount')
      Button('静态计数 +1').margin({ top: 16 }).id('staticIncrement').onClick(() => {
        this.count += 1;
        console.info('[DynamicCallsStaticProbe] static count=' + this.count.toString());
      })
    }
    .width('100%').padding(16)
  }
}
`,
    staticIndex: `'use static'
export { StaticCounter } from './src/main/ets/StaticCounter';
`,
    caller: `import { StaticCounter } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  @State title: string = "parent";
  @State cardEnabled: boolean = true;
  build() {
    Column() {
      Text('PR14 parent/child parameters')
      StaticCounter({ count: this.counterSeed, title: this.title, cardEnabled: this.cardEnabled })
      Button('update').id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
    }
    .width('100%').height('100%')
  }
}

export * as staticCards from 'static_component';
`,
    expected: {
      properties: [
        'count',
        'title',
        'cardEnabled'
      ],
      assignments: [
        'count["\']\\]\\s*=\\s*this.counterSeed',
        'title["\']\\]\\s*=\\s*this.title'
      ],
      bytecode: [
        '__options_has_count',
        '__options_has_title',
        '__options_has_cardEnabled'
      ]
    },
    exportContract: {
      kind: 'namespace',
      names: [
        'staticCards'
      ],
      module: '@normalized:N&&&static_component/Index&1.0.0'
    }
  },
  {
    id: 'sdk-type-reexport',
    boundary: 'SDK 26.0.0.35 accepts this re-export through its old bridge pipeline and preserves the normalized public export.',
    staticSource: `'use static'
import { Component, Column, Text, Button } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@Component
export struct StaticCounter {
  @State public count: number = 0;
  @State public title: string = 'default';
  @State public cardEnabled: boolean = true;

  aboutToAppear(): void {
    console.info('[DynamicCallsStaticProbe] static component appeared');
  }

  build(): void {
    Column(undefined) {
      Text(this.title + this.cardEnabled.toString()).fontSize(22).id('staticComponentTitle')
      Text('静态计数 ' + this.count.toString()).fontSize(24).margin({ top: 16 }).id('staticCount')
      Button('静态计数 +1').margin({ top: 16 }).id('staticIncrement').onClick(() => {
        this.count += 1;
        console.info('[DynamicCallsStaticProbe] static count=' + this.count.toString());
      })
    }
    .width('100%').padding(16)
  }
}
`,
    staticIndex: `'use static'
export { StaticCounter } from './src/main/ets/StaticCounter';
`,
    caller: `import { StaticCounter } from 'static_component';
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  @State title: string = "parent";
  @State cardEnabled: boolean = true;
  build() {
    Column() {
      Text('PR14 parent/child parameters')
      StaticCounter({ count: this.counterSeed, title: this.title, cardEnabled: this.cardEnabled })
      Button('update').id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
    }
    .width('100%').height('100%')
  }
}

export type { StaticCounter as CounterType } from 'static_component';
`,
    expected: {
      properties: [
        'count',
        'title',
        'cardEnabled'
      ],
      assignments: [
        'count["\']\\]\\s*=\\s*this.counterSeed',
        'title["\']\\]\\s*=\\s*this.title'
      ],
      bytecode: [
        '__options_has_count',
        '__options_has_title',
        '__options_has_cardEnabled'
      ]
    },
    exportContract: {
      kind: 'type',
      names: [
        'CounterType'
      ],
      module: '@normalized:N&&&static_component/Index&1.0.0'
    }
  }
];

module.exports = { fixtures };
