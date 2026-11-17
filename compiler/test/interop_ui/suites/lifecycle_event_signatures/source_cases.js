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
    id: 'emitted-aboutToAppear',
    boundary: 'The aboutToAppear lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 aboutToAppear(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().aboutToAppear();
new PageModel().aboutToAppear(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-aboutToDisappear',
    boundary: 'The aboutToDisappear lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 aboutToDisappear(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().aboutToDisappear();
new PageModel().aboutToDisappear(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-onPageShow',
    boundary: 'The onPageShow lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 onPageShow(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onPageShow();
new PageModel().onPageShow(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onPageShow',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-onPageHide',
    boundary: 'The onPageHide lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 onPageHide(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onPageHide();
new PageModel().onPageHide(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onPageHide',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-onBackPress',
    boundary: 'The onBackPress lifecycle declaration retains its no-argument boolean contract.',
    mode: 'emit',
    source: `export class PageModel {
 onBackPress(): boolean { return true; }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onBackPress();
new PageModel().onBackPress(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onBackPress',
          kind: 'MethodDeclaration',
          type: 'boolean',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-onDidBuild',
    boundary: 'The onDidBuild lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 onDidBuild(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onDidBuild();
new PageModel().onDidBuild(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onDidBuild',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'emitted-aboutToRecycle',
    boundary: 'The aboutToRecycle lifecycle declaration retains its no-argument void contract.',
    mode: 'emit',
    source: `export class PageModel {
 aboutToRecycle(): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().aboutToRecycle();
new PageModel().aboutToRecycle(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToRecycle',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [],
          hasBody: false,
          decorators: []
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2554
      ],
      consumerDiagnostics: [
        {
          code: 2554,
          line: 3
        }
      ]
    }
  },
  {
    id: 'reuse-parameter',
    boundary: 'Reuse lifecycle parameters retain their imported-data-compatible Record annotation.',
    mode: 'emit',
    source: `export class PageModel {
 aboutToReuse(params: Record<string, Object>): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().aboutToReuse({ value: 1 });
new PageModel().aboutToReuse(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToReuse',
          type: 'void',
          parameters: [
            {
              name: 'params',
              type: 'Record<string, Object>',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'number-event',
    boundary: 'The generated event property retains its number event signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onValue: (value: number) => void = (value: number): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue = (value: number): void => {};
new PageModel().onValue = (value: string): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'PropertyDeclaration',
          type: '(value: number) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'text-event',
    boundary: 'The generated event property retains its text event signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onLabel: (label: string) => void = (label: string): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onLabel = (label: string): void => {};
new PageModel().onLabel = (label: number): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onLabel',
          kind: 'PropertyDeclaration',
          type: '(label: string) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'boolean-event',
    boundary: 'The generated event property retains its boolean event signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onEnabled: (enabled: boolean) => void = (enabled: boolean): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onEnabled = (enabled: boolean): void => {};
new PageModel().onEnabled = (enabled: number): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onEnabled',
          kind: 'PropertyDeclaration',
          type: '(enabled: boolean) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'array-event',
    boundary: 'The generated event property retains its array event signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onValues: (values: number[]) => void = (values: number[]): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValues = (values: number[]): void => {};
new PageModel().onValues = (values: string[]): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onValues',
          kind: 'PropertyDeclaration',
          type: '(values: number[]) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'nullable-event',
    boundary: 'The generated event property retains its nullable event signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onSelection: (value: string | null) => void = (value: string | null): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onSelection = (value: string | null): void => {};
new PageModel().onSelection = (value: number): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onSelection',
          kind: 'PropertyDeclaration',
          type: '(value: string | null) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'optional-event-argument',
    boundary: 'The generated event property retains its optional argument signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onMaybe: (value?: number) => void = (value?: number): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onMaybe = (value?: number): void => {};
new PageModel().onMaybe = (value: string): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onMaybe',
          kind: 'PropertyDeclaration',
          type: '(value?: number) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'rest-event-arguments',
    boundary: 'The generated event property retains its rest arguments signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onMany: (...values: number[]) => void = (...values: number[]): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onMany = (...values: number[]): void => {};
new PageModel().onMany = (...values: string[]): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onMany',
          kind: 'PropertyDeclaration',
          type: '(...values: number[]) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'ordered-event-arguments',
    boundary: 'The generated event property retains its ordered arguments signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onChange: (label: string, count: number) => void = (label: string, count: number): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onChange = (label: string, count: number): void => {};
new PageModel().onChange = (count: number, label: string): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onChange',
          kind: 'PropertyDeclaration',
          type: '(label: string, count: number) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-number-result',
    boundary: 'The generated event property retains its number result signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 readValue: () => number = (): number => 1;
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().readValue = (): number => 2;
new PageModel().readValue = (): string => 'bad';
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'readValue',
          kind: 'PropertyDeclaration',
          type: '() => number',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-boolean-result',
    boundary: 'The generated event property retains its boolean result signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 mayClose: () => boolean = (): boolean => true;
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().mayClose = (): boolean => false;
new PageModel().mayClose = (): number => 1;
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'mayClose',
          kind: 'PropertyDeclaration',
          type: '() => boolean',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-nullable-result',
    boundary: 'The generated event property retains its nullable result signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 readSelection: () => string | null = (): string | null => null;
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().readSelection = (): string | null => null;
new PageModel().readSelection = (): number => 1;
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'readSelection',
          kind: 'PropertyDeclaration',
          type: '() => string | null',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-promise-result',
    boundary: 'The generated event property retains its promise result signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 loadValue: () => Promise<number> = (): Promise<number> => Promise.resolve(1);
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().loadValue = (): Promise<number> => Promise.resolve(2);
new PageModel().loadValue = (): Promise<string> => Promise.resolve('bad');
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'loadValue',
          kind: 'PropertyDeclaration',
          type: '() => Promise<number>',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-callback-payload',
    boundary: 'The generated event property retains its callback payload signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 register: (handler: (value: number) => string) => void = (handler: (value: number) => string): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().register = (handler: (value: number) => string): void => {};
new PageModel().register = (handler: (value: string) => number): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'register',
          kind: 'PropertyDeclaration',
          type: '(handler: (value: number) => string) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'event-matrix-payload',
    boundary: 'The generated event property retains its matrix payload signature for assignment checking.',
    mode: 'emit',
    source: `export class PageModel {
 onGrid: (values: number[][]) => void = (values: number[][]): void => {};
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onGrid = (values: number[][]): void => {};
new PageModel().onGrid = (values: number[]): void => {};
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onGrid',
          kind: 'PropertyDeclaration',
          type: '(values: number[][]) => void',
          hasBody: false,
          parameters: []
        }
      ],
      contains: [],
      absent: [],
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
    id: 'optional-method-argument',
    boundary: 'The emitted method retains its optional method argument contract and rejects the wrong caller argument.',
    mode: 'emit',
    source: `export class PageModel {
 accept(value?: number): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().accept();
new PageModel().accept('bad');
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'accept',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'default-method-argument',
    boundary: 'The emitted method retains its default method argument contract and rejects the wrong caller argument.',
    mode: 'emit',
    source: `export class PageModel {
 accept(value: number = 7): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().accept();
new PageModel().accept('bad');
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'accept',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'rest-method-arguments',
    boundary: 'The emitted method retains its rest method arguments contract and rejects the wrong caller argument.',
    mode: 'emit',
    source: `export class PageModel {
 accept(...values: number[]): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().accept(1, 2);
new PageModel().accept('bad');
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'accept',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: true
            }
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'ordered-method-arguments',
    boundary: 'The emitted method retains its ordered method arguments contract and rejects the wrong caller argument.',
    mode: 'emit',
    source: `export class PageModel {
 accept(label: string, count: number): void {  }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().accept('ok', 1);
new PageModel().accept(1, 'bad');
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'accept',
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
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'method-nullable-result',
    boundary: 'The emitted method retains its method nullable result contract and rejects the wrong caller argument.',
    mode: 'emit',
    source: `export class PageModel {
 read(value: boolean): string | null { return value ? 'ok' : null; }
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().read(true);
new PageModel().read(1);
`,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'read',
          type: 'string | null',
          parameters: [
            {
              name: 'value',
              type: 'boolean',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
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
    id: 'struct-appearance-pair',
    boundary: 'Paired lifecycle methods retain their own positions and signatures through UI declaration transformation.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 aboutToAppear(): void;
 aboutToDisappear(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        }
      ],
      contains: [
        '@Component',
        'build(): void'
      ],
      absent: []
    }
  },
  {
    id: 'struct-page-visibility',
    boundary: 'Paired lifecycle methods retain their own positions and signatures through UI declaration transformation.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 onPageShow(): void;
 onPageHide(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onPageShow',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onPageHide',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        }
      ],
      contains: [
        '@Component',
        'build(): void'
      ],
      absent: []
    }
  },
  {
    id: 'struct-back-and-build',
    boundary: 'Paired lifecycle methods retain their own positions and signatures through UI declaration transformation.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 onBackPress(): boolean;
 onDidBuild(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onBackPress',
          type: 'boolean',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onDidBuild',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        }
      ],
      contains: [
        '@Component',
        'build(): void'
      ],
      absent: []
    }
  },
  {
    id: 'struct-recycle-reuse',
    boundary: 'Paired lifecycle methods retain their own positions and signatures through UI declaration transformation.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 aboutToRecycle(): void;
 aboutToReuse(params: Record<string, Object>): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToRecycle',
          type: 'void',
          parameters: [],
          kind: 'MethodDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToReuse',
          type: 'void',
          parameters: [
            {
              name: 'params',
              type: 'Record<string, Object>',
              optional: false,
              rest: false
            }
          ],
          kind: 'MethodDeclaration',
          hasBody: false
        }
      ],
      contains: [
        '@Component',
        'build(): void'
      ],
      absent: []
    }
  },
  {
    id: 'ui-number-event',
    boundary: 'A UI struct retains a typed event property beside its lifecycle methods.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 onValue: (value: number) => void;
 aboutToAppear(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onValue',
          type: '(value: number) => void',
          kind: 'PropertyDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        '@Component'
      ],
      absent: []
    }
  },
  {
    id: 'ui-nullable-event',
    boundary: 'A UI struct retains a typed event property beside its lifecycle methods.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 onValue: (value: string | null) => void;
 aboutToAppear(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onValue',
          type: '(value: string | null) => void',
          kind: 'PropertyDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        '@Component'
      ],
      absent: []
    }
  },
  {
    id: 'ui-result-event',
    boundary: 'A UI struct retains a typed event property beside its lifecycle methods.',
    mode: 'transform',
    source: `@Component
export declare struct PageModel {
 onValue: (value: number) => string;
 aboutToAppear(): void;
 build(): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onValue',
          type: '(value: number) => string',
          kind: 'PropertyDeclaration',
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        '@Component'
      ],
      absent: []
    }
  },
  {
    id: 'declgen-lifecycle-methods',
    boundary: 'The registered declaration generator repeats lifecycle signatures without runtime bodies.',
    mode: 'declgen',
    source: `export class PageModel {
 aboutToAppear(): void {}
 onBackPress(): boolean { return false; }
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onBackPress',
          type: 'boolean',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        '\'use static\''
      ],
      absent: []
    }
  },
  {
    id: 'declgen-event-interface',
    boundary: 'The real generator retains a named event callback interface.',
    mode: 'declgen',
    source: `export interface PageModel {
 onChange(value: number, label: string): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'PageModel'
      ],
      members: [
        {
          owner: 'PageModel',
          name: 'onChange',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            },
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      contains: [
        '\'use static\''
      ],
      absent: []
    }
  }
];

module.exports = { fixtures: [...fixtures, ...require('./listener_cases').fixtures] };
