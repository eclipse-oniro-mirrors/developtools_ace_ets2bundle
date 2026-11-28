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
    id: 'render-sibling-column',
    boundary: 'Plain column emission keeps both siblings and built-in contents in order.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Column() {
      StartTile()
      ContentTile()
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Column.create',
      'Column.pop',
      'Button.onClick',
      'this.count += 1'
    ]
  },
  {
    id: 'render-sibling-row',
    boundary: 'A row layout does not change component construction order.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Row() {
      StartTile()
      ContentTile()
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Row.create',
      'Row.pop',
      'Button.onClick',
      'this.count += 1'
    ]
  },
  {
    id: 'render-independent-branches',
    boundary: 'A conditional child remains between persistent siblings.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  @State shown: boolean = true;
  build() {
    Column() {
      StartTile()
      if (this.shown) { ContentTile() }
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'If.create',
      'If.pop',
      'this.shown'
    ]
  },
  {
    id: 'render-opposite-branch-order',
    boundary: 'Two branches remain distinct, with ordered component construction.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  @State enabled: boolean = true;
  build() {
    Row() {
      if (this.enabled) { ContentTile() } else { StartTile() }
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'ContentTile',
      'StartTile',
      'EndTile'
    ],
    required: [
      'If.create',
      'If.pop',
      'this.enabled'
    ]
  },
  {
    id: 'render-native-child-in-nested-container',
    boundary: 'Nested layout transforms keep the native child inside the column.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Row() {
      StartTile()
      Column() { ContentTile() }
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Column.create',
      'Column.pop',
      'Row.create',
      'Row.pop'
    ]
  },
  {
    id: 'render-scroll-around-middle-child',
    boundary: 'Scroll is generated alongside a wrapper stack.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Column() {
      StartTile()
      Scroll() { ContentTile() }
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Scroll.create',
      'Scroll.pop',
      'Column.create'
    ]
  },
  {
    id: 'render-layout-attributes',
    boundary: 'Container properties and local child wiring survive the same transform.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Row() {
      StartTile()
      ContentTile()
      EndTile()
    }.width("100%").padding(16)
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Row.width("100%")',
      'Row.padding(16)',
      'Row.pop'
    ]
  },
  {
    id: 'render-for-each-contents',
    boundary: 'ForEach keeps both surrounding components and lowered loop updates.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  @State rows: number[] = [1, 4];
  build() {
    Column() {
      StartTile()
      ForEach(this.rows, (value: number) => { ContentTile() })
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'ForEach.create',
      'forEachUpdateFunction',
      'ForEach.pop'
    ]
  },
  {
    id: 'render-three-factories-in-nested-rows',
    boundary: 'Item containers generate separate layout calls and preserve source order.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Column() {
      Row() { StartTile() }
      Row() { ContentTile() }
      Row() { EndTile() }
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Row.create',
      'Row.pop',
      'Column.pop'
    ]
  },
  {
    id: 'render-stack-with-local-label',
    boundary: 'An ordinary text node and custom siblings share a stack without changing identity.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  build() {
    Stack() {
      StartTile()
      Text("content")
      ContentTile()
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Stack.create',
      'Text.create("content")',
      'Stack.pop'
    ]
  },
  {
    id: 'render-model-caller-options',
    boundary: 'An explicit component initializer remains associated with the middle child.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  @State initialCount: number = 4;
  build() {
    Column() {
      StartTile()
      ContentTile({ count: this.initialCount })
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'count: this.initialCount',
      'Column.create'
    ]
  },
  {
    id: 'render-native-button-with-page-state',
    boundary: 'The outer click handler and inner component state update stay independently generated.',
    source: `@Component
struct StartTile {
  build() { Text('start tile').id('startTile') }
}
@Component
struct EndTile {
  build() { Text('end tile').id('endTile') }
}
@Component
struct ContentTile {
  @State private count: number = 0;
  build() {
    Button(this.count.toString()).id('contentTile').onClick(() => { this.count += 1; })
  }
}
@Entry
@Component
struct Index {
  @State open: boolean = false;
  build() {
    Column() {
      StartTile()
      Button("open").onClick(() => { this.open = true; })
      ContentTile()
      EndTile()
    }
  }
}
`,
    componentOrder: [
      'StartTile',
      'ContentTile',
      'EndTile'
    ],
    required: [
      'Button.createWithLabel("open")',
      'this.open = true',
      'this.count += 1'
    ]
  }
];

module.exports = { fixtures };
