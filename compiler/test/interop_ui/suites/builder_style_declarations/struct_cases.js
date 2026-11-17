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
    id: 'struct-slot-empty',
    boundary: 'A UI struct slot follows UI import insertion while retaining its empty signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: () => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '() => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-number',
    boundary: 'A UI struct slot follows UI import insertion while retaining its number signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (value: number) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(value: number) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-text',
    boundary: 'A UI struct slot follows UI import insertion while retaining its text signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (label: string) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(label: string) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-boolean',
    boundary: 'A UI struct slot follows UI import insertion while retaining its boolean signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (enabled: boolean) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(enabled: boolean) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-array',
    boundary: 'A UI struct slot follows UI import insertion while retaining its array signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (values: number[]) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(values: number[]) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-nullable',
    boundary: 'A UI struct slot follows UI import insertion while retaining its nullable signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (label: string | null) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(label: string | null) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-optional',
    boundary: 'A UI struct slot follows UI import insertion while retaining its optional signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (value?: number) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(value?: number) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-rest',
    boundary: 'A UI struct slot follows UI import insertion while retaining its rest signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (...values: number[]) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(...values: number[]) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-callback',
    boundary: 'A UI struct slot follows UI import insertion while retaining its callback signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (handler: (value: number) => string) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(handler: (value: number) => string) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-two-arguments',
    boundary: 'A UI struct slot follows UI import insertion while retaining its two-arguments signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (label: string, count: number) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(label: string, count: number) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-slot-matrix',
    boundary: 'A UI struct slot follows UI import insertion while retaining its matrix signature.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam content: (values: number[][]) => void;
  @Styles focused(): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      types: [
        {
          name: 'Card',
          kind: 'StructDeclaration'
        }
      ],
      members: [
        {
          owner: 'Card',
          name: 'content',
          type: '(values: number[][]) => void',
          decorators: [
            'BuilderParam'
          ],
          hasBody: false
        },
        {
          owner: 'Card',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [
        '@Styles',
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-local-builder',
    boundary: 'Independent UI builder declarations retain ownership and deduplicated imports.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @Builder local(value: number): void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      members: [
        {
          owner: 'Card',
          name: 'local',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          decorators: [
            'Builder'
          ]
        }
      ],
      contains: [
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'Builder'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  },
  {
    id: 'struct-two-slots',
    boundary: 'Independent UI builder declarations retain ownership and deduplicated imports.',
    mode: 'transform',
    source: `@Component
export declare struct Card {
  @BuilderParam header: () => void;
  @BuilderParam footer: (value: number) => void;
  build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Card'
      ],
      members: [
        {
          owner: 'Card',
          name: 'header',
          type: '() => void',
          decorators: [
            'BuilderParam'
          ]
        },
        {
          owner: 'Card',
          name: 'footer',
          type: '(value: number) => void',
          decorators: [
            'BuilderParam'
          ]
        }
      ],
      contains: [
        'build(): void'
      ],
      absent: [],
      imports: [
        {
          module: '@ohos.arkui.component',
          names: [
            'Component',
            'BuilderParam'
          ]
        },
        {
          module: '@ohos.arkui.stateManagement',
          names: [
            'LocalStorage'
          ]
        }
      ]
    }
  }
];

module.exports = { fixtures };
