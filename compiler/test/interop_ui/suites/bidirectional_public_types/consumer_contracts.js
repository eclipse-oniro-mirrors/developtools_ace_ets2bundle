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
    id: 'generic-interface-factory',
    boundary: 'A generic factory result shares its type argument with a separate exported box interface.',
    mode: 'emit',
    source: `export interface Box<T> { value: T; }
export interface Factory<T> { create(value: T): Box<T>; }
`,
    consumer: `import { Factory } from 'generated';
const valid: Factory<number> = { create: (value: number) => ({ value }) };
const invalid: Factory<number> = { create: (value: number) => ({ value: 'bad' }) };
`,
    expected: {
      symbols: [
        'Box',
        'Factory'
      ],
      types: [
        {
          name: 'Box',
          kind: 'InterfaceDeclaration',
          generics: [
            'T'
          ]
        },
        {
          name: 'Factory',
          generics: [
            'T'
          ]
        }
      ],
      members: [
        {
          owner: 'Box',
          name: 'value',
          type: 'T',
          kind: 'PropertySignature'
        },
        {
          owner: 'Factory',
          name: 'create',
          type: 'Box<T>',
          parameters: [
            {
              name: 'value',
              type: 'T',
              optional: false,
              rest: false
            }
          ],
          kind: 'MethodSignature',
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
    id: 'nullable-generic-alias',
    boundary: 'A generic nullable alias remains exported and substitutes a numeric parameter at the public function.',
    mode: 'emit',
    source: `export type Nullable<T> = T | null;
export function read(value: Nullable<number>): number { return value ?? 0; }
`,
    consumer: `import { read } from 'generated';
read(null);
read(false);
`,
    expected: {
      symbols: [
        'Nullable',
        'read'
      ],
      types: [
        {
          name: 'Nullable',
          kind: 'TypeAliasDeclaration',
          generics: [
            'T'
          ],
          type: 'T | null'
        },
        {
          name: 'read',
          type: 'number',
          parameters: [
            {
              name: 'value',
              type: 'Nullable<number>',
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
    id: 'readonly-class-consumer',
    boundary: 'A generated readonly property can be read after construction and rejects later consumer mutation.',
    mode: 'emit',
    source: `export class Result {
 readonly value: number;
 constructor(value: number) { this.value = value; }
 isReady(): boolean { return this.value > 0; }
}
`,
    consumer: `import { Result } from 'generated';
new Result(1).isReady();
new Result(1).value = 2;
`,
    expected: {
      symbols: [
        'Result'
      ],
      types: [
        {
          name: 'Result',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Result',
          name: 'value',
          type: 'number',
          modifiers: [
            'readonly'
          ],
          kind: 'PropertyDeclaration'
        },
        {
          owner: 'Result',
          name: 'constructor',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'Result',
          name: 'isReady',
          type: 'boolean',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [],
      absent: [],
      consumerCodes: [
        2540
      ],
      consumerDiagnostics: [
        {
          code: 2540,
          line: 3
        }
      ]
    }
  }
];

module.exports = { fixtures };
