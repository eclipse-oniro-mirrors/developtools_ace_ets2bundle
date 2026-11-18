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
    id: 'numeric-alias',
    boundary: 'A numeric alias is retained in the generated callable contract.',
    mode: 'emit',
    source: `export type Payload = number;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept(7);
accept('wrong');
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'number'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'text-array-alias',
    boundary: 'An array alias keeps its element type through generation and import.',
    mode: 'emit',
    source: `export type Payload = string[];
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept(['ready']);
accept([1]);
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'string[]'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'matrix-alias',
    boundary: 'A nested array alias retains its second rank.',
    mode: 'emit',
    source: `export type Payload = number[][];
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept([[1], [2]]);
accept([1]);
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'number[][]'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'nullable-alias',
    boundary: 'A null-capable alias accepts null and rejects another primitive.',
    mode: 'emit',
    source: `export type Payload = string | null;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept(null);
accept(false);
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'string | null'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'undefined-alias',
    boundary: 'An explicit undefined union survives public type generation.',
    mode: 'emit',
    source: `export type Payload = number | undefined;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept(undefined);
accept('wrong');
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'number | undefined'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'callback-alias',
    boundary: 'A function alias retains the callback result and input types.',
    mode: 'emit',
    source: `export type Payload = (value: number) => string;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept((value: number): string => value.toString());
accept((value: string): string => value);
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: '(value: number) => string'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'record-alias',
    boundary: 'A Record alias retains the type of indexed values.',
    mode: 'emit',
    source: `export type Payload = Record<string, number>;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept({ count: 1 });
accept({ count: 'wrong' });
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'Record<string, number>'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'record-array-alias',
    boundary: 'A Record with array values preserves the nested generic argument.',
    mode: 'emit',
    source: `export type Payload = Record<string, number[]>;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept({ count: [1] });
accept({ count: 1 });
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: 'Record<string, number[]>'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'nullable-callback-alias',
    boundary: 'A callback may return null without weakening its numeric argument.',
    mode: 'emit',
    source: `export type Payload = (value: number) => string | null;
export function accept(value: Payload): Payload { return value; }
`,
    consumer: `import { accept } from 'generated';
accept((value: number): string | null => null);
accept((value: string): string => value);
`,
    expected: {
      symbols: [
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          kind: 'TypeAliasDeclaration',
          type: '(value: number) => string | null'
        },
        {
          name: 'accept',
          type: 'Payload',
          parameters: [
            {
              name: 'value',
              type: 'Payload',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'chained-alias',
    boundary: 'An alias chain stays exported and resolves through the generated file.',
    mode: 'emit',
    source: `export type Scalar = number;
export type Payload = Scalar[];
export function accept(value: Payload): Scalar { return value[0]; }
`,
    consumer: `import { accept } from 'generated';
const value: number = accept([1]);
const wrong: string = accept([1]);
`,
    expected: {
      symbols: [
        'Scalar',
        'Payload',
        'accept'
      ],
      types: [
        {
          name: 'Payload',
          type: 'Scalar[]'
        },
        {
          name: 'accept',
          type: 'Scalar'
        }
      ],
      members: [],
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
    id: 'generic-identity',
    boundary: 'The generic identity contract remains available to a real declaration consumer.',
    mode: 'emit',
    source: `export function accept<T>(value: T): T { return value; }
`,
    consumer: `import { accept } from 'generated';
accept<number>(1);
accept<number>('wrong');
`,
    expected: {
      symbols: [
        'accept'
      ],
      types: [
        {
          name: 'accept',
          type: 'T',
          generics: [
            'T'
          ],
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'generic-constraint',
    boundary: 'The generic constraint contract remains available to a real declaration consumer.',
    mode: 'emit',
    source: `export function accept<T extends number>(value: T): T { return value; }
`,
    consumer: `import { accept } from 'generated';
accept(1);
accept('wrong');
`,
    expected: {
      symbols: [
        'accept'
      ],
      types: [
        {
          name: 'accept',
          type: 'T',
          generics: [
            'T extends number'
          ],
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'generic-array',
    boundary: 'The generic array contract remains available to a real declaration consumer.',
    mode: 'emit',
    source: `export function accept<T>(value: T[]): T[] { return value; }
`,
    consumer: `import { accept } from 'generated';
accept<number>([1]);
accept<number>(['wrong']);
`,
    expected: {
      symbols: [
        'accept'
      ],
      types: [
        {
          name: 'accept',
          type: 'T[]',
          generics: [
            'T'
          ],
          parameters: [
            {
              name: 'value',
              type: 'T[]',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'generic-default',
    boundary: 'The generic default contract remains available to a real declaration consumer.',
    mode: 'emit',
    source: `export function accept<T = string>(value: T): T { return value; }
`,
    consumer: `import { accept } from 'generated';
accept<string>('ok');
accept<string>(1);
`,
    expected: {
      symbols: [
        'accept'
      ],
      types: [
        {
          name: 'accept',
          type: 'T',
          generics: [
            'T = string'
          ],
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'generic-record',
    boundary: 'The generic record contract remains available to a real declaration consumer.',
    mode: 'emit',
    source: `export function accept<T>(value: Record<string, T>): Record<string, T> { return value; }
`,
    consumer: `import { accept } from 'generated';
accept<number>({ a: 1 });
accept<number>({ a: 'wrong' });
`,
    expected: {
      symbols: [
        'accept'
      ],
      types: [
        {
          name: 'accept',
          type: 'Record<string, T>',
          generics: [
            'T'
          ],
          parameters: [
            {
              name: 'value',
              type: 'Record<string, T>',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      members: [],
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
    id: 'generic-interface',
    boundary: 'A generic interface and callback agree on the substituted result type.',
    mode: 'emit',
    source: `export interface Result<T> { value: T; }
export function box(value: number): Result<number> { return { value }; }
`,
    consumer: `import { box } from 'generated';
const value: number = box(1).value;
const wrong: string = box(1).value;
`,
    expected: {
      symbols: [
        'Result',
        'box'
      ],
      types: [
        {
          name: 'Result',
          generics: [
            'T'
          ]
        },
        {
          name: 'box',
          type: 'Result<number>'
        }
      ],
      members: [
        {
          owner: 'Result',
          name: 'value',
          type: 'T',
          kind: 'PropertySignature'
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
    id: 'interface-inheritance',
    boundary: 'An inherited public field is visible to the declaration consumer.',
    mode: 'emit',
    source: `export interface Base { title: string; }
export interface Result extends Base { count: number; }
export function read(value: Result): string { return value.title; }
`,
    consumer: `import { read } from 'generated';
read({ title: 'ok', count: 1 });
read({ title: 'missing count' });
`,
    expected: {
      symbols: [
        'Base',
        'Result',
        'read'
      ],
      types: [],
      members: [
        {
          owner: 'Base',
          name: 'title',
          type: 'string'
        },
        {
          owner: 'Result',
          name: 'count',
          type: 'number'
        }
      ],
      contains: [
        'extends Base'
      ],
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
    id: 'readonly-field',
    boundary: 'The readonly field boundary is checked from the generated interface.',
    mode: 'emit',
    source: `export interface Options {
  readonly value: number;
}
export function accept(value: Options): void {}
`,
    consumer: `import { accept } from 'generated';
accept({ value: 1 });
accept({ value: 'bad' });
`,
    expected: {
      symbols: [
        'Options',
        'accept'
      ],
      types: [],
      members: [
        {
          owner: 'Options',
          name: 'value',
          type: 'number',
          kind: 'PropertySignature',
          modifiers: [
            'readonly'
          ]
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
    id: 'optional-field',
    boundary: 'The optional field boundary is checked from the generated interface.',
    mode: 'emit',
    source: `export interface Options {
  value?: number;
}
export function accept(value: Options): void {}
`,
    consumer: `import { accept } from 'generated';
accept({});
accept({ value: 'bad' });
`,
    expected: {
      symbols: [
        'Options',
        'accept'
      ],
      types: [],
      members: [
        {
          owner: 'Options',
          name: 'value',
          type: 'number',
          kind: 'PropertySignature',
          modifiers: []
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
    id: 'nullable-field',
    boundary: 'The nullable field boundary is checked from the generated interface.',
    mode: 'emit',
    source: `export interface Options {
  value: string | null;
}
export function accept(value: Options): void {}
`,
    consumer: `import { accept } from 'generated';
accept({ value: null });
accept({ value: 2 });
`,
    expected: {
      symbols: [
        'Options',
        'accept'
      ],
      types: [],
      members: [
        {
          owner: 'Options',
          name: 'value',
          type: 'string | null',
          kind: 'PropertySignature',
          modifiers: []
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
    id: 'callback-field',
    boundary: 'The callback field boundary is checked from the generated interface.',
    mode: 'emit',
    source: `export interface Options {
  onValue: (value: number) => void;
}
export function accept(value: Options): void {}
`,
    consumer: `import { accept } from 'generated';
accept({ onValue: (value: number): void => {} });
accept({ onValue: (value: string): void => {} });
`,
    expected: {
      symbols: [
        'Options',
        'accept'
      ],
      types: [],
      members: [
        {
          owner: 'Options',
          name: 'onValue',
          type: '(value: number) => void',
          kind: 'PropertySignature',
          modifiers: []
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
    id: 'optional-parameter',
    boundary: 'The optional parameter survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(value?: number): number { return value || 0; }
`,
    consumer: `import { read } from 'generated';
read();
read('bad');
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          type: 'number'
        }
      ],
      members: [],
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
    id: 'default-parameter',
    boundary: 'The default parameter survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(value: number = 1): number { return value; }
`,
    consumer: `import { read } from 'generated';
read();
read('bad');
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          type: 'number'
        }
      ],
      members: [],
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
    id: 'rest-parameter',
    boundary: 'The rest parameter survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(...values: number[]): number { return values.length; }
`,
    consumer: `import { read } from 'generated';
read(1, 2);
read(1, 'bad');
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: true
            }
          ],
          type: 'number'
        }
      ],
      members: [],
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
    id: 'ordered-parameters',
    boundary: 'The ordered parameters survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(label: string, count: number): string { return label + count;  }
`,
    consumer: `import { read } from 'generated';
read('ok', 1);
read(1, 'bad');
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
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
          type: 'string'
        }
      ],
      members: [],
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
    id: 'callback-result',
    boundary: 'The callback result survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(callback: (value: number) => string): string { return callback(1); }
`,
    consumer: `import { read } from 'generated';
read((value: number): string => value.toString());
read((value: number): number => value);
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'callback',
              type: '(value: number) => string',
              optional: false,
              rest: false
            }
          ],
          type: 'string'
        }
      ],
      members: [],
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
    id: 'nullable-result',
    boundary: 'The nullable result survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(value: boolean): string | null { return value ? 'ok' : null; }
`,
    consumer: `import { read } from 'generated';
read(true);
read(1);
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'value',
              type: 'boolean',
              optional: false,
              rest: false
            }
          ],
          type: 'string | null'
        }
      ],
      members: [],
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
    id: 'promise-result',
    boundary: 'The promise result survives afterDeclarations emission and actual caller checking.',
    mode: 'emit',
    source: `export function read(value: number): Promise<number> { return Promise.resolve(value); }
`,
    consumer: `import { read } from 'generated';
read(1);
read('bad');
`,
    expected: {
      symbols: [
        'read'
      ],
      types: [
        {
          name: 'read',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          type: 'Promise<number>'
        }
      ],
      members: [],
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
    id: 'generic-class',
    boundary: 'A public generic class retains constructor and instance type parameters.',
    mode: 'emit',
    source: `export class Box<T> {
 constructor(public value: T) {}
 read(): T { return this.value; }
}
`,
    consumer: `import { Box } from 'generated';
const value: number = new Box<number>(1).read();
const wrong: string = new Box<number>(1).read();
`,
    expected: {
      symbols: [
        'Box'
      ],
      types: [
        {
          name: 'Box',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Box',
          name: 'value',
          type: 'T'
        },
        {
          owner: 'Box',
          name: 'read',
          type: 'T',
          hasBody: false
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
    id: 'typed-accessors',
    boundary: 'Accessor declarations keep separate getter and setter contracts.',
    mode: 'emit',
    source: `export class Model {
 get value(): number { return 1; }
 set value(next: number) {}
}
`,
    consumer: `import { Model } from 'generated';
new Model().value = 2;
new Model().value = 'bad';
`,
    expected: {
      symbols: [
        'Model'
      ],
      types: [],
      members: [
        {
          owner: 'Model',
          name: 'value',
          kind: 'GetAccessor',
          type: 'number',
          hasBody: false
        }
      ],
      contains: [
        'set value(next: number)'
      ],
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
    id: 'generic-method-interface',
    boundary: 'A method-local generic remains scoped to its public interface method.',
    mode: 'emit',
    source: `export interface Mapper {
 map<T>(value: T): T;
}
`,
    consumer: `import { Mapper } from 'generated';
declare const mapper: Mapper;
const wrong: string = mapper.map<number>(1);
`,
    expected: {
      symbols: [
        'Mapper'
      ],
      types: [],
      members: [
        {
          owner: 'Mapper',
          name: 'map',
          type: 'T',
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ],
          kind: 'MethodSignature'
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
    id: 'declgen-generic-function',
    boundary: 'The registered generator emits generic function and interface contracts consistently.',
    mode: 'declgen',
    source: `export interface Result<T> { value: T; }
export function identity<T>(value: T): T { return value; }
`,
    consumer: null,
    expected: {
      symbols: [
        'identity',
        'Result'
      ],
      types: [
        {
          name: 'identity',
          generics: [
            'T'
          ],
          type: 'T'
        },
        {
          name: 'Result',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Result',
          name: 'value',
          type: 'T'
        }
      ],
      contains: [
        '\'use static\'',
        '@ohos.lang.interop'
      ],
      absent: []
    }
  },
  {
    id: 'declgen-callback-interface',
    boundary: 'The registered generator keeps a nested callback signature in an exported interface.',
    mode: 'declgen',
    source: `export interface Receiver {
 accept(value: number, callback: (result: string) => void): void;
}
`,
    consumer: null,
    expected: {
      symbols: [
        'Receiver'
      ],
      types: [],
      members: [
        {
          owner: 'Receiver',
          name: 'accept',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            },
            {
              name: 'callback',
              type: '(result: string) => void',
              optional: false,
              rest: false
            }
          ]
        }
      ],
      contains: [
        '@ohos.lang.interop'
      ],
      absent: []
    }
  }
];

module.exports = { fixtures: [...fixtures, ...require('./generic_cases').fixtures,
  ...require('./consumer_contracts').fixtures] };
