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
    id: 'builder-empty',
    boundary: 'A public Builder without arguments keeps a void signature.',
    source: `@Builder
export declare function content(): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: []
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-number',
    boundary: 'A numeric Builder parameter retains its name and type.',
    source: `@Builder
export declare function content(value: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-text',
    boundary: 'A text Builder parameter remains a string.',
    source: `@Builder
export declare function content(label: string): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-boolean',
    boundary: 'A boolean Builder argument keeps its primitive annotation.',
    source: `@Builder
export declare function content(enabled: boolean): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'enabled',
              type: 'boolean',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-array',
    boundary: 'A Builder list argument retains its array element type.',
    source: `@Builder
export declare function content(values: number[]): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-optional',
    boundary: 'An optional Builder argument retains its question token.',
    source: `@Builder
export declare function content(value?: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-nullable',
    boundary: 'A nullable Builder argument keeps the null union.',
    source: `@Builder
export declare function content(label: string | null): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string | null',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-two-arguments',
    boundary: 'Builder argument order survives declaration handling.',
    source: `@Builder
export declare function content(label: string, count: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            },
            {
              name: 'count',
              type: 'number',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-callback',
    boundary: 'A Builder can expose a typed callback argument.',
    source: `@Builder
export declare function content(onValue: (value: number) => void): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'onValue',
              type: '(value: number) => void',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'builder-rest',
    boundary: 'A variadic Builder declaration keeps its rest marker.',
    source: `@Builder
export declare function content(...values: string[]): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          kind: 'FunctionDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'string[]',
              optional: false,
              rest: true
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'emitted-number-builder',
    boundary: 'Declaration emit exposes the Builder callable type to a real generated-file consumer.',
    source: `@Builder
export function content(value: number): void {}
`,
    mode: 'emit',
    consumer: `import { content } from 'generated';
content(1);
content('bad');
`,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [],
      absent: [
        '@Builder'
      ],
      consumerCodes: [
        2345
      ],
      consumerDiagnostics: [
        {
          code: 2345,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-label-builder',
    boundary: 'Declaration emit exposes the Builder callable type to a real generated-file consumer.',
    source: `@Builder
export function content(label: string): void {}
`,
    mode: 'emit',
    consumer: `import { content } from 'generated';
content('ok');
content(1);
`,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [],
      absent: [
        '@Builder'
      ],
      consumerCodes: [
        2345
      ],
      consumerDiagnostics: [
        {
          code: 2345,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-list-builder',
    boundary: 'Declaration emit exposes the Builder callable type to a real generated-file consumer.',
    source: `@Builder
export function content(values: number[]): void {}
`,
    mode: 'emit',
    consumer: `import { content } from 'generated';
content([1]);
content(['bad']);
`,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [],
      absent: [
        '@Builder'
      ],
      consumerCodes: [
        2322
      ],
      consumerDiagnostics: [
        {
          code: 2322,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-optional-builder',
    boundary: 'Declaration emit exposes the Builder callable type to a real generated-file consumer.',
    source: `@Builder
export function content(value?: number): void {}
`,
    mode: 'emit',
    consumer: `import { content } from 'generated';
content();
content('bad');
`,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [],
      absent: [
        '@Builder'
      ],
      consumerCodes: [
        2345
      ],
      consumerDiagnostics: [
        {
          code: 2345,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-callback-builder',
    boundary: 'Declaration emit exposes the Builder callable type to a real generated-file consumer.',
    source: `@Builder
export function content(handler: (value: number) => string): void {}
`,
    mode: 'emit',
    consumer: `import { content } from 'generated';
content((value: number): string => value.toString());
content((value: string): string => value);
`,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'handler',
              type: '(value: number) => string',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [],
      absent: [
        '@Builder'
      ],
      consumerCodes: [
        2345
      ],
      consumerDiagnostics: [
        {
          code: 2345,
          line: 3
        }
      ]
    }
  },
  {
    id: 'styles-public',
    boundary: 'The Styles declaration remains attributed to its original target and export.',
    source: `@Styles
export declare function focused(): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'focused'
      ],
      types: [
        {
          name: 'focused',
          type: 'void',
          parameters: [],
          modifiers: [
            'export',
            'declare'
          ]
        }
      ],
      members: [],
      contains: [
        '@Styles'
      ],
      absent: []
    }
  },
  {
    id: 'extend-text',
    boundary: 'The Extend(Text) declaration remains attributed to its original target and export.',
    source: `@Extend(Text)
export declare function tone(amount: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'tone'
      ],
      types: [
        {
          name: 'tone',
          type: 'void',
          parameters: [
            {
              name: 'amount',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          modifiers: [
            'export',
            'declare'
          ]
        }
      ],
      members: [],
      contains: [
        '@Extend(Text)'
      ],
      absent: []
    }
  },
  {
    id: 'extend-button',
    boundary: 'The Extend(Button) declaration remains attributed to its original target and export.',
    source: `@Extend(Button)
export declare function accent(amount: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'accent'
      ],
      types: [
        {
          name: 'accent',
          type: 'void',
          parameters: [
            {
              name: 'amount',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          modifiers: [
            'export',
            'declare'
          ]
        }
      ],
      members: [],
      contains: [
        '@Extend(Button)'
      ],
      absent: []
    }
  },
  {
    id: 'extend-column',
    boundary: 'The Extend(Column) declaration remains attributed to its original target and export.',
    source: `@Extend(Column)
export declare function paddingStyle(amount: number): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'paddingStyle'
      ],
      types: [
        {
          name: 'paddingStyle',
          type: 'void',
          parameters: [
            {
              name: 'amount',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          modifiers: [
            'export',
            'declare'
          ]
        }
      ],
      members: [],
      contains: [
        '@Extend(Column)'
      ],
      absent: []
    }
  },
  {
    id: 'styles-with-public-helper',
    boundary: 'A style declaration stays adjacent to an unrelated exported helper without absorbing it.',
    source: `@Styles
export declare function focused(): void;
export declare function label(value: number): string;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'focused',
        'label'
      ],
      types: [
        {
          name: 'focused',
          type: 'void'
        },
        {
          name: 'label',
          type: 'string',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
      contains: [
        '@Styles'
      ],
      absent: []
    }
  },
  {
    id: 'builder-and-styles-order',
    boundary: 'Builder and Styles declarations retain independent signatures and source order.',
    source: `@Builder
export declare function content(value: number): void;
@Styles
export declare function focused(): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'content',
        'focused'
      ],
      types: [
        {
          name: 'content',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ]
        },
        {
          name: 'focused',
          parameters: []
        }
      ],
      members: [],
      contains: [
        '@Builder',
        '@Styles'
      ],
      absent: []
    }
  },
  {
    id: 'extend-and-builder-order',
    boundary: 'An Extend decorator argument does not capture the following Builder declaration.',
    source: `@Extend(Text)
export declare function tone(value: string): void;
@Builder
export declare function content(): void;
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'tone',
        'content'
      ],
      types: [
        {
          name: 'tone',
          parameters: [
            {
              name: 'value',
              type: 'string',
              optional: false,
              rest: false
            }
          ]
        },
        {
          name: 'content',
          parameters: []
        }
      ],
      members: [],
      contains: [
        '@Extend(Text)',
        '@Builder'
      ],
      absent: []
    }
  },
  {
    id: 'member-builder',
    boundary: 'A decorated class method keeps its signature, decorator and declaration-only body boundary.',
    source: `export declare class View {
  @Builder
  content(value: number): void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
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
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'member-styles',
    boundary: 'A decorated class method keeps its signature, decorator and declaration-only body boundary.',
    source: `export declare class View {
  @Styles
  focused(): void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [
            'Styles'
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'member-extend',
    boundary: 'A decorated class method keeps its signature, decorator and declaration-only body boundary.',
    source: `export declare class View {
  @Extend(Text)
  tone(label: string): void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'tone',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ],
          decorators: [
            'Extend(Text)'
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'member-builder-callback',
    boundary: 'A decorated class method keeps its signature, decorator and declaration-only body boundary.',
    source: `export declare class View {
  @Builder
  content(handler: (value: number) => void): void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: 'void',
          parameters: [
            {
              name: 'handler',
              type: '(value: number) => void',
              optional: false,
              rest: false
            }
          ],
          decorators: [
            'Builder'
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'builder-param-noargs',
    boundary: 'A BuilderParam property retains its complete function type in the public class declaration.',
    source: `export declare class View {
  @BuilderParam
  content: () => void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: '() => void',
          decorators: [
            'BuilderParam'
          ],
          kind: 'PropertyDeclaration',
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'builder-param-number',
    boundary: 'A BuilderParam property retains its complete function type in the public class declaration.',
    source: `export declare class View {
  @BuilderParam
  content: (value: number) => void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: '(value: number) => void',
          decorators: [
            'BuilderParam'
          ],
          kind: 'PropertyDeclaration',
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'builder-param-callback',
    boundary: 'A BuilderParam property retains its complete function type in the public class declaration.',
    source: `export declare class View {
  @BuilderParam
  content: (handler: (value: number) => string) => void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: '(handler: (value: number) => string) => void',
          decorators: [
            'BuilderParam'
          ],
          kind: 'PropertyDeclaration',
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'builder-param-nullable',
    boundary: 'A BuilderParam property retains its complete function type in the public class declaration.',
    source: `export declare class View {
  @BuilderParam
  content: (label: string | null) => void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: '(label: string | null) => void',
          decorators: [
            'BuilderParam'
          ],
          kind: 'PropertyDeclaration',
          hasBody: false
        }
      ],
      contains: [],
      absent: []
    }
  },
  {
    id: 'imported-builder-alias',
    boundary: 'An aliased Builder import is retained alongside a style declaration.',
    source: `import { Builder as BuildContent } from '@ohos.arkui.component';
export declare class View {
 @BuildContent
 content(value: number): void;
}
`,
    mode: 'transform',
    consumer: null,
    expected: {
      symbols: [
        'View'
      ],
      types: [],
      members: [
        {
          owner: 'View',
          name: 'content',
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
            'BuildContent'
          ]
        }
      ],
      contains: [
        'Builder as BuildContent'
      ],
      absent: []
    }
  },
  {
    id: 'declgen-builder-function',
    boundary: 'The registered generator processes a Builder source and repeats its public declaration.',
    source: `@Builder
export function content(value: number): void {}
`,
    mode: 'declgen',
    consumer: null,
    expected: {
      symbols: [
        'content'
      ],
      types: [
        {
          name: 'content',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          type: 'void'
        }
      ],
      members: [],
      contains: [
        '\'use static\''
      ],
      absent: []
    }
  }
];

module.exports = { fixtures: [...fixtures, ...require('./struct_cases').fixtures,
  ...require('./consumer_cases').fixtures] };
