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
    'id': 'runtime-builder-receiver-arity-0',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(): void {
    this.value += 1;
    this.received = [];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-1',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number): void {
    this.value += 1;
    this.received = [p0];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-2',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number): void {
    this.value += 1;
    this.received = [p0, p1];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-3',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder3_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder3_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number): void {
    this.value += 1;
    this.received = [p0, p1, p2];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-4',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder4_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder4_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-5',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder5_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder5_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-6',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4,
      5
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder6_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder6_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4, p5];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-7',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4,
      5,
      6
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder7_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder7_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4, p5, p6];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-8',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder8_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder8_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4, p5, p6, p7];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-9',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder9_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder9_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4, p5, p6, p7, p8];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-builder-receiver-arity-10',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9
    ],
    'expected': {
      'receiverValue': 2,
      'helper': '__Interop_transferCompatibleDynamicBuilder10_Internal',
      'helperCalls': [
        {
          'helper': '__Interop_transferCompatibleDynamicBuilder10_Internal'
        }
      ]
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number): void {
    this.value += 1;
    this.received = [p0, p1, p2, p3, p4, p5, p6, p7, p8, p9];
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'runtime-callback-bound-method',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      19
    ],
    'expected': {
      'receiverValue': 19,
      'helper': null,
      'helperCalls': []
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  onAction(value: number): void {
    this.value = value;
    this.received = [value];
  }
  options() {
    return { onAction: this.onAction.bind(this) };
  }
}
`
  },
  {
    'id': 'runtime-callback-lexical-arrow',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'runtimeBuilder': true,
    'arguments': [
      19
    ],
    'expected': {
      'receiverValue': 19,
      'helper': null,
      'helperCalls': []
    },
    source: `class Host {
  public value: number = 1;
  public received: number[] = [];
  onAction(value: number): void {
    this.value = value;
    this.received = [value];
  }
  options() {
    return { onAction: (value: number): void => { this.value = value; this.received = [value]; } };
  }
}
`
  }
];

module.exports = { fixtures };
