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
    id: 'v2-parent-v1-static-child',
    boundary: 'The SDK rejects incompatible parent and child component generations, then accepts a matching repaired pair.',
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
    validStaticSource: `'use static'
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
    invalidCaller: `import { StaticCounter } from 'static_component';
@Entry
@ComponentV2
struct Index {
  @Local counterSeed: number = 7;
  @Local title: string = "parent";
  @Local cardEnabled: boolean = true;
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
`,
    validCaller: `import { StaticCounter } from 'static_component';
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
`,
    diagnostic: {
      code: '10905501',
      line: 11,
      anchor: 'StaticCounter',
      fragments: [
        'cannot be used',
        'when interop'
      ]
    },
    recovery: {
      declaration: [
        'StaticCounter',
        'count',
        'title',
        'cardEnabled'
      ],
      caller: [
        '__Interop_CreateStaticComponent_Internal',
        '__options_has_count'
      ]
    }
  },
  {
    id: 'v1-parent-v2-static-child',
    boundary: 'The SDK rejects incompatible parent and child component generations, then accepts a matching repaired pair.',
    staticSource: `'use static'
import { Component, Column, Text, Button } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@ComponentV2
export struct StaticCounter {
  @Local public count: number = 0;
  @Local public title: string = 'default';
  @Local public cardEnabled: boolean = true;

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
    validStaticSource: `'use static'
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
    invalidCaller: `import { StaticCounter } from 'static_component';
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
`,
    validCaller: `import { StaticCounter } from 'static_component';
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
`,
    diagnostic: {
      code: '10905501',
      line: 11,
      anchor: 'StaticCounter',
      fragments: [
        'cannot be used',
        'when interop'
      ]
    },
    recovery: {
      declaration: [
        'StaticCounter',
        'count',
        'title',
        'cardEnabled'
      ],
      caller: [
        '__Interop_CreateStaticComponent_Internal',
        '__options_has_count'
      ]
    }
  }
];

module.exports = { fixtures };
