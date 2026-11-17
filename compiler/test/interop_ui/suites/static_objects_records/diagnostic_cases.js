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
    id: 'missing-required-field',
    boundary: 'A missing required field is diagnosed before runtime evaluation.',
    declaration: `export declare class Profile {
  title: string; count: number;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'missing' };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [
        2741
      ]
    }
  },
  {
    id: 'extra-class-field',
    boundary: 'An excess field is rejected against the imported static class.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'ok', extra: 1 };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title',
        'extra'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  },
  {
    id: 'nullable-required-string',
    boundary: 'A null value cannot satisfy a required string under strict null checking.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: null };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  },
  {
    id: 'wrong-array-element',
    boundary: 'The checker locates an incompatible array element inside a static model.',
    declaration: `export declare class Profile {
  values: number[];
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { values: [1, 'bad'] };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'values'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  },
  {
    id: 'wrong-nested-member',
    boundary: 'A nested structural mismatch retains its source location.',
    declaration: `export declare class Profile {
  point: { x: number; y: number };
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { point: { x: 'bad', y: 2 } };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'point'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  },
  {
    id: 'required-callback-parameter',
    boundary: 'A callback with an incompatible payload is rejected by the real checker.',
    declaration: `export declare class Profile {
  handler: (value: number) => void;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { handler: (value: string): void => {} };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'handler'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  }
];

module.exports = { fixtures };
