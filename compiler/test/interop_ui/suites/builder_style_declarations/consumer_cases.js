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
    id: 'emitted-builder-style-class-consumer',
    boundary: 'A generated class exposes its callable Builder signature while declaration emission removes method decorators and bodies.',
    mode: 'emit',
    source: `export class View {
 @Builder content(label: string, count: number): void {}
 @Styles focused(): void {}
}
`,
    consumer: `import { View } from 'generated';
new View().content('ok', 1);
new View().content(1, 'wrong');
`,
    expected: {
      symbols: [
        'View'
      ],
      members: [
        {
          owner: 'View',
          name: 'content',
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
          decorators: [],
          hasBody: false
        },
        {
          owner: 'View',
          name: 'focused',
          type: 'void',
          parameters: [],
          decorators: [],
          hasBody: false
        }
      ],
      contains: [],
      absent: [
        '@Builder',
        '@Styles'
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
    id: 'emitted-slot-type-alias',
    boundary: 'An exported slot alias remains connected to a generated class property and rejects the wrong callback payload.',
    mode: 'emit',
    source: `export type Content = (value: number) => void;
export class View {
 @BuilderParam content: Content = (value: number): void => {};
 @Styles focused(): void {}
}
`,
    consumer: `import { View } from 'generated';
new View().content = (value: number): void => {};
new View().content = (value: string): void => {};
`,
    expected: {
      symbols: [
        'Content',
        'View'
      ],
      types: [
        {
          name: 'Content',
          type: '(value: number) => void',
          kind: 'TypeAliasDeclaration'
        }
      ],
      members: [
        {
          owner: 'View',
          name: 'content',
          type: 'Content',
          decorators: [],
          hasBody: false
        }
      ],
      contains: [],
      absent: [
        '@BuilderParam',
        '@Styles'
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
  }
];

module.exports = { fixtures };
