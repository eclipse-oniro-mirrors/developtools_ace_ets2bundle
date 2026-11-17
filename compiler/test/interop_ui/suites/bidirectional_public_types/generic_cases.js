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
    id: 'generic-callback-owner',
    boundary: 'A type argument is shared between a readonly value and its callback property.',
    mode: 'emit',
    source: `export interface Result<T> {
 readonly value: T;
 onChange: (value: T) => T;
}
`,
    consumer: `import { Result } from 'generated';
const valid: Result<number> = { value: 1, onChange: (value: number): number => value };
const invalid: Result<number> = { value: 'bad', onChange: (value: number): number => value };
`,
    expected: {
      symbols: [
        'Result'
      ],
      types: [
        {
          name: 'Result',
          kind: 'InterfaceDeclaration',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Result',
          name: 'value',
          kind: 'PropertySignature',
          type: 'T',
          modifiers: [
            'readonly'
          ]
        },
        {
          owner: 'Result',
          name: 'onChange',
          kind: 'PropertySignature',
          type: '(value: T) => T'
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
    id: 'nullable-generic-list',
    boundary: 'A generic list carries a nullable item independently of its array member.',
    mode: 'emit',
    source: `export interface Page<T> {
 items: T[];
 next: T | null;
}
`,
    consumer: `import { Page } from 'generated';
const valid: Page<number> = { items: [1], next: null };
const invalid: Page<number> = { items: [1], next: 'bad' };
`,
    expected: {
      symbols: [
        'Page'
      ],
      types: [
        {
          name: 'Page',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Page',
          name: 'items',
          type: 'T[]',
          kind: 'PropertySignature'
        },
        {
          owner: 'Page',
          name: 'next',
          type: 'T | null',
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
    id: 'generic-callback-alias',
    boundary: 'A generic callback alias retains its type parameter in both input and array result.',
    mode: 'emit',
    source: `export type Reader<T> = (value: T) => T[];
`,
    consumer: `import { Reader } from 'generated';
const valid: Reader<number> = (value: number): number[] => [value];
const invalid: Reader<number> = (value: number): string[] => ['bad'];
`,
    expected: {
      symbols: [
        'Reader'
      ],
      types: [
        {
          name: 'Reader',
          kind: 'TypeAliasDeclaration',
          generics: [
            'T'
          ],
          type: '(value: T) => T[]'
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
    id: 'generic-constructor-argument',
    boundary: 'The constructor parameter and readonly instance property keep one generic identity.',
    mode: 'emit',
    source: `export class Store<T> {
 constructor(public readonly value: T) {}
 read(): T { return this.value; }
}
`,
    consumer: `import { Store } from 'generated';
new Store<number>(1);
new Store<number>('bad');
`,
    expected: {
      symbols: [
        'Store'
      ],
      types: [
        {
          name: 'Store',
          kind: 'ClassDeclaration',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Store',
          name: 'value',
          type: 'T',
          modifiers: [
            'readonly'
          ]
        },
        {
          owner: 'Store',
          name: 'constructor',
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'Store',
          name: 'read',
          type: 'T',
          parameters: [],
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
    id: 'multiple-public-base-interfaces',
    boundary: 'Multiple public base interfaces remain visible through the generated derived contract.',
    mode: 'emit',
    source: `export interface Named { label: string; }
export interface Counted { count: number; }
export interface View extends Named, Counted { enabled: boolean; }
`,
    consumer: `import { View } from 'generated';
const valid: View = { label: 'ok', count: 1, enabled: true };
const invalid: View = { label: 'ok', count: 'bad', enabled: true };
`,
    expected: {
      symbols: [
        'Named',
        'Counted',
        'View'
      ],
      types: [
        {
          name: 'View',
          kind: 'InterfaceDeclaration'
        }
      ],
      members: [
        {
          owner: 'Named',
          name: 'label',
          type: 'string'
        },
        {
          owner: 'Counted',
          name: 'count',
          type: 'number'
        },
        {
          owner: 'View',
          name: 'enabled',
          type: 'boolean'
        }
      ],
      contains: [
        'extends Named, Counted'
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
    id: 'public-overload-set',
    boundary: 'The implementation body is removed while both overload signatures remain callable.',
    mode: 'emit',
    source: `export function convert(value: number): string;
export function convert(value: string): number;
export function convert(value: number | string): string | number { return value; }
`,
    consumer: `import { convert } from 'generated';
const valid: string = convert(1);
convert(true);
`,
    expected: {
      symbols: [
        'convert',
        'convert'
      ],
      types: [
        {
          name: 'convert',
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
        'convert(value: string): number'
      ],
      absent: [],
      consumerCodes: [
        2769
      ],
      consumerDiagnostics: [
        {
          code: 2769,
          line: 3
        }
      ]
    }
  },
  {
    id: 'two-generic-arguments',
    boundary: 'Independent generic key and value parameters retain their declaration order and modifiers.',
    mode: 'emit',
    source: `export interface Pair<K, V> {
 readonly key: K;
 value: V;
 update(value: V): void;
}
`,
    consumer: `import { Pair } from 'generated';
const valid: Pair<string, number> = { key: 'ok', value: 1, update: (value: number): void => {} };
const invalid: Pair<string, number> = { key: 'ok', value: 'bad', update: (value: number): void => {} };
`,
    expected: {
      symbols: [
        'Pair'
      ],
      types: [
        {
          name: 'Pair',
          kind: 'InterfaceDeclaration',
          generics: [
            'K',
            'V'
          ]
        }
      ],
      members: [
        {
          owner: 'Pair',
          name: 'key',
          type: 'K',
          modifiers: [
            'readonly'
          ]
        },
        {
          owner: 'Pair',
          name: 'value',
          type: 'V'
        },
        {
          owner: 'Pair',
          name: 'update',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'V',
              optional: false,
              rest: false
            }
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
  }
];

module.exports = { fixtures };
