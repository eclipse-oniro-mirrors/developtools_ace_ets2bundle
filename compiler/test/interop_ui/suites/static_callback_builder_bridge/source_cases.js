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
    'id': 'method-arity-0',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-1',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-2',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-3',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder3_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-4',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder4_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-5',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder5_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-6',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder6_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-7',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder7_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-8',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder8_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-9',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder9_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-10',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder10_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'method-arity-11',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(p0: number, p1: number, p2: number, p3: number, p4: number, p5: number, p6: number, p7: number, p8: number, p9: number, p10: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'optional-parameter',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(value?: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'default-parameter',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(value: number = 0): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'two-optional-parameters',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(first: number, second?: string): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'rest-parameter',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(...values: number[]): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'checker-unavailable',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    'withoutChecker': true,
    source: `class Host {
  public value: number = 1;
  buildContent(value: number): void {
    this.value += 1;
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'unresolved-method-reference',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'this.missingBuilder.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  public value: number = 1;
  buildContent(): void {
    this.value += 1;
  }
  options() {
    return { content: this.missingBuilder };
  }
}
`
  },
  {
    'id': 'arrow-property-reference',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'this.buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `class Host {
  buildContent = (value: number): void => {};
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'global-function-arity-0',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        'buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `function buildContent(): void {
  console.info("content");
}
class Host {
  options() {
    return { content: buildContent };
  }
}
`
  },
  {
    'id': 'global-function-arity-1',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        'buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `function buildContent(p0: number): void {
  console.info("content");
}
class Host {
  options() {
    return { content: buildContent };
  }
}
`
  },
  {
    'id': 'global-function-arity-2',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        'buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `function buildContent(p0: number, p1: number): void {
  console.info("content");
}
class Host {
  options() {
    return { content: buildContent };
  }
}
`
  },
  {
    'id': 'global-function-arity-3',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder3_Internal',
      'contains': [
        'buildContent.bind(this)'
      ],
      'forbidden': []
    },
    source: `function buildContent(p0: number, p1: number, p2: number): void {
  console.info("content");
}
class Host {
  options() {
    return { content: buildContent };
  }
}
`
  },
  {
    'id': 'static-builder-arity-0',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [
      'staticContent'
    ],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        '...args',
        'staticContent(...args)'
      ],
      'forbidden': [
        'staticContent.bind(this)'
      ]
    },
    source: `function staticContent(): void {
  console.info("static");
}
class Host {
  options() {
    return { content: staticContent };
  }
}
`
  },
  {
    'id': 'static-builder-arity-1',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [
      'staticContent'
    ],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        '...args',
        'staticContent(...args)'
      ],
      'forbidden': [
        'staticContent.bind(this)'
      ]
    },
    source: `function staticContent(p0: number): void {
  console.info("static");
}
class Host {
  options() {
    return { content: staticContent };
  }
}
`
  },
  {
    'id': 'static-builder-arity-2',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [
      'staticContent'
    ],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        '...args',
        'staticContent(...args)'
      ],
      'forbidden': [
        'staticContent.bind(this)'
      ]
    },
    source: `function staticContent(p0: number, p1: number): void {
  console.info("static");
}
class Host {
  options() {
    return { content: staticContent };
  }
}
`
  },
  {
    'id': 'regular-arrow-callback',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        'this.value = value'
      ],
      'forbidden': [
        '__Interop_transferCompatibleDynamicBuilder'
      ]
    },
    source: `class Host {
  public value: number = 1;
  onAction(value: number): void {
    this.value = value;
  }
  options() {
    return { onAction: (value: number): void => { this.value = value; } };
  }
}
`
  },
  {
    'id': 'regular-method-callback',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        'this.onAction'
      ],
      'forbidden': [
        '__Interop_transferCompatibleDynamicBuilder'
      ]
    },
    source: `class Host {
  public value: number = 1;
  onAction(value: number): void {
    this.value = value;
  }
  options() {
    return { onAction: this.onAction };
  }
}
`
  },
  {
    'id': 'regular-bound-callback',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        'this.onAction.bind(this)'
      ],
      'forbidden': [
        '__Interop_transferCompatibleDynamicBuilder'
      ]
    },
    source: `class Host {
  public value: number = 1;
  onAction(value: number): void {
    this.value = value;
  }
  options() {
    return { onAction: this.onAction.bind(this) };
  }
}
`
  },
  {
    'id': 'regular-function-expression',
    'purpose': 'Resolve actual checker symbols before selecting the dynamic Builder transfer helper',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'onAction',
    'builders': [],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': null,
      'contains': [
        'console.info(value.toString())'
      ],
      'forbidden': [
        '__Interop_transferCompatibleDynamicBuilder'
      ]
    },
    source: `class Host {
  public value: number = 1;
  onAction(value: number): void {
    this.value = value;
  }
  options() {
    return { onAction: function(value: number): void { console.info(value.toString()); } };
  }
}
`
  },
  {
    'id': 'inherited-builder-method',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    source: `class Parent {
  buildContent(first: number, second: string): void {
    console.info(first.toString() + second);
  }
}
class Host extends Parent {
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'overloaded-builder-declaration',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    source: `class Host {
  buildContent(value: number): void;
  buildContent(value: number, label: string): void;
  buildContent(value: number, label?: string): void {
    console.info(value.toString());
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'generic-builder-method',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder1_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    source: `class Host {
  buildContent<T>(value: T): void {
    console.info('generic builder');
  }
  options() {
    return { content: this.buildContent };
  }
}
`
  },
  {
    'id': 'imported-builder-alias-arity-0',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    'files': {
      'builders.ts': "export function actualBuilder(): void {\n  console.info('imported builder');\n}\n"
    },
    source: `import { actualBuilder as localBuilder } from './builders';
class Host {
  options() {
    return { content: localBuilder };
  }
}
`
  },
  {
    'id': 'imported-builder-alias-arity-2',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    'files': {
      'builders.ts': "export function actualBuilder(first: number, second: string): void {\n  console.info('imported builder');\n}\n"
    },
    source: `import { actualBuilder as localBuilder } from './builders';
class Host {
  options() {
    return { content: localBuilder };
  }
}
`
  },
  {
    'id': 'namespace-qualified-builder-function',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder2_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    'files': {
      'builders.ts': 'export function actualBuilder(first: number, second: string): void {\n  console.info(first.toString() + second);\n}\n'
    },
    source: `import * as Builders from './builders';
class Host {
  options() {
    return { content: Builders.actualBuilder };
  }
}
`
  },
  {
    'id': 'trailing-lambda-overrides-reference',
    'purpose': 'Resolve builder signature through actual declaration identity and AST reference shape',
    'operation': 'builder',
    'component': 'StaticCard',
    'parameter': 'content',
    'builders': [
      'content'
    ],
    'staticBuilders': [],
    'evaluate': false,
    'expected': {
      'helper': '__Interop_transferCompatibleDynamicBuilder_Internal',
      'contains': [
        '__options_has_content'
      ],
      'forbidden': []
    },
    'trailingLambda': 'trailing',
    source: `const trailing = (): void => {
  console.info('actual trailing body');
};
class Host {
  buildContent(first: number, second: string): void {}
  options() {
    return { content: this.buildContent };
  }
}
`
  }
];

module.exports = { fixtures };
