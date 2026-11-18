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
    id: 'duplicate-star-export',
    boundary: 'Two independently exported Shared interfaces remain ambiguous at the generated barrel boundary.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export * from './Left';
export * from './Right';
`
    },
    consumer: `import { Shared } from './generated/Index';
declare const value: Shared;
`,
    expected: {
      sourceCodes: [
        2308
      ],
      consumerCodes: [
        2308
      ],
      fragments: [
        'Shared',
        'already exported'
      ]
    }
  },
  {
    id: 'duplicate-named-export',
    boundary: 'Two explicit exports with the same public name retain duplicate-identifier diagnostics.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Shared } from './Left';
export { Shared } from './Right';
`
    },
    consumer: `import { Shared } from './generated/Index';
declare const value: Shared;
`,
    expected: {
      sourceCodes: [
        2300,
        2300
      ],
      consumerCodes: [
        2300,
        2300
      ],
      fragments: [
        'Shared',
        'Duplicate identifier'
      ]
    }
  },
  {
    id: 'missing-barrel-export',
    boundary: 'A barrel cannot name a symbol absent from its producer module.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Absent } from './Left';
`
    },
    consumer: `import { Absent } from './generated/Index';
declare const value: Absent;
`,
    expected: {
      sourceCodes: [
        2305
      ],
      consumerCodes: [
        2305
      ],
      fragments: [
        'Absent',
        'no exported member'
      ]
    }
  },
  {
    id: 'aliased-barrel-missing-source',
    boundary: 'An aliased export still validates its original producer name.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Absent as PublicModel } from './Left';
`
    },
    consumer: `import { PublicModel } from './generated/Index';
declare const value: PublicModel;
`,
    expected: {
      sourceCodes: [
        2305
      ],
      consumerCodes: [
        2305
      ],
      fragments: [
        'Absent',
        'no exported member'
      ]
    }
  },
  {
    id: 'renamed-exports-disambiguate',
    boundary: 'Different public aliases retain the independent source models.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
export { Shared as Label } from './Right';
`
    },
    consumer: `import { Counter, Label } from './generated/Index';
const count: Counter = { count: 1 };
const label: Label = { title: 'ready' };
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [],
      fragments: []
    }
  },
  {
    id: 'renamed-counter-type-mismatch',
    boundary: 'A disambiguated counter alias keeps the Left source field domain.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
export { Shared as Label } from './Right';
`
    },
    consumer: `import { Counter } from './generated/Index';
const value: Counter = { count: 'bad' };
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'renamed-label-type-mismatch',
    boundary: 'A disambiguated label alias keeps the Right source field domain.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
export { Shared as Label } from './Right';
`
    },
    consumer: `import { Label } from './generated/Index';
const value: Label = { title: 1 };
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'nested-namespace-type-mismatch',
    boundary: 'A namespace re-export retains its original model member shape.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export * as counters from './Left';
export * as labels from './Right';
`
    },
    consumer: `import { counters } from './generated/Index';
const value: counters.Shared = { count: 'bad' };
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'nested-namespace-valid-control',
    boundary: 'Distinct namespace exports keep both identically named producer interfaces usable.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export * as counters from './Left';
export * as labels from './Right';
`
    },
    consumer: `import { counters, labels } from './generated/Index';
const count: counters.Shared = { count: 1 };
const label: labels.Shared = { title: 'ready' };
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [],
      fragments: []
    }
  },
  {
    id: 'default-export-public-alias',
    boundary: 'A default-exported class remains usable through an explicit public barrel alias.',
    files: {
      'Left.ts': `export default class Card { count: number = 1; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { default as PublicCard } from './Left';
`
    },
    consumer: `import { PublicCard } from './generated/Index';
const value: number = new PublicCard().count;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [],
      fragments: []
    }
  },
  {
    id: 'default-export-type-mismatch',
    boundary: 'An aliased default class retains its emitted instance field type.',
    files: {
      'Left.ts': `export default class Card { count: number = 1; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { default as PublicCard } from './Left';
`
    },
    consumer: `import { PublicCard } from './generated/Index';
const value: string = new PublicCard().count;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'missing-default-export',
    boundary: 'A named-only producer cannot satisfy an explicit default re-export.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { default as PublicCard } from './Left';
`
    },
    consumer: `import { PublicCard } from './generated/Index';
declare const value: PublicCard;
`,
    expected: {
      sourceCodes: [
        2305
      ],
      consumerCodes: [
        2305
      ],
      fragments: [
        'default',
        'no exported member'
      ]
    }
  },
  {
    id: 'private-name-not-public',
    boundary: 'An implementation-only class cannot be exported from another module.',
    files: {
      'Left.ts': `class Hidden { count: number = 1; }
export class Visible { count: number = 2; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Hidden } from './Left';
`
    },
    consumer: `import { Hidden } from './generated/Index';
declare const value: Hidden;
`,
    expected: {
      sourceCodes: [
        2459
      ],
      consumerCodes: [
        2305
      ],
      fragments: [
        'Hidden',
        'no exported member'
      ]
    }
  },
  {
    id: 'unrelated-type-aliases-remain-distinct',
    boundary: 'Two public aliases to identically named but distinct producer models keep their structure.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Shared { title: string; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
export { Shared as Label } from './Right';
`
    },
    consumer: `import { Counter, Label } from './generated/Index';
declare const count: Counter;
const label: Label = count;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2741
      ],
      fragments: [
        'title',
        'missing'
      ]
    }
  },
  {
    id: 'barrel-alias-hides-original',
    boundary: 'A named barrel alias does not also export the original producer name.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
`
    },
    consumer: `import { Shared } from './generated/Index';
declare const value: Shared;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2305
      ],
      fragments: [
        'Shared',
        'no exported member'
      ]
    }
  },
  {
    id: 'star-does-not-export-default',
    boundary: 'A star barrel does not create a default export for its producer.',
    files: {
      'Left.ts': `export default class Card { count: number = 1; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export * from './Left';
`
    },
    consumer: `import Card from './generated/Index';
declare const value: Card;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        1192
      ],
      fragments: [
        'no default export'
      ]
    }
  },
  {
    id: 'namespace-missing-public-model',
    boundary: 'A namespace barrel rejects a nonexistent nested public type.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export * as models from './Left';
`
    },
    consumer: `import { models } from './generated/Index';
declare const value: models.Absent;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2694
      ],
      fragments: [
        'Absent',
        'no exported member'
      ]
    }
  },
  {
    id: 'distinct-class-aliases',
    boundary: 'Aliased classes from different producer files preserve independent instance members.',
    files: {
      'Left.ts': `export class Shared { count: number = 1; }
`,
      'Right.ts': `export class Shared { title: string = 'ready'; }
`,
      'Index.ts': `export { Shared as Counter } from './Left';
export { Shared as Label } from './Right';
`
    },
    consumer: `import { Counter, Label } from './generated/Index';
const value: Label = new Counter();
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2741
      ],
      fragments: [
        'title',
        'missing'
      ]
    }
  },
  {
    id: 'barrel-private-constructor',
    boundary: 'A class re-export preserves the original private construction boundary.',
    files: {
      'Left.ts': `export class Card { private constructor() {} static make(): Card { return new Card(); } }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export { Card as PublicCard } from './Left';
`
    },
    consumer: `import { PublicCard } from './generated/Index';
const value = new PublicCard();
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2673
      ],
      fragments: [
        'private',
        'Constructor'
      ]
    }
  },
  {
    id: 'barrel-readonly-property',
    boundary: 'A readonly member remains readonly through a named public alias.',
    files: {
      'Left.ts': `export class Card { readonly count: number = 1; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export { Card as PublicCard } from './Left';
`
    },
    consumer: `import { PublicCard } from './generated/Index';
new PublicCard().count = 2;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2540
      ],
      fragments: [
        'read-only',
        'count'
      ]
    }
  },
  {
    id: 'barrel-distinct-enums',
    boundary: 'Different enum member values retain their incompatibility through public barrel aliases.',
    files: {
      'Left.ts': `export enum Choice { First = 1 }
`,
      'Right.ts': `export enum Choice { First = 2 }
`,
      'Index.ts': `export { Choice as LeftChoice } from './Left';
export { Choice as RightChoice } from './Right';
`
    },
    consumer: `import { LeftChoice, RightChoice } from './generated/Index';
const value: LeftChoice = RightChoice.First;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'generated/Right',
        'generated/Left',
        'not assignable'
      ]
    }
  },
  {
    id: 'empty-barrel-has-no-model',
    boundary: 'An explicitly empty public module cannot supply an implementation model.',
    files: {
      'Left.ts': `export interface Shared { count: number; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export {};
`
    },
    consumer: `import { Shared } from './generated/Index';
declare const value: Shared;
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2305
      ],
      fragments: [
        'Shared',
        'no exported member'
      ]
    }
  },
  {
    id: 'default-function-alias-argument',
    boundary: 'A default function retains its required argument domain through the public alias.',
    files: {
      'Left.ts': `export default function read(value: number): number { return value; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export { default as readCount } from './Left';
`
    },
    consumer: `import { readCount } from './generated/Index';
readCount('bad');
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2345
      ],
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'default-function-alias-result',
    boundary: 'A default function retains its result domain through the public alias.',
    files: {
      'Left.ts': `export default function read(value: number): number { return value; }
`,
      'Right.ts': `export interface Label { title: string; }
`,
      'Index.ts': `export { default as readCount } from './Left';
`
    },
    consumer: `import { readCount } from './generated/Index';
const value: string = readCount(1);
`,
    expected: {
      sourceCodes: [],
      consumerCodes: [
        2322
      ],
      fragments: [
        'number',
        'string'
      ]
    }
  }
];

module.exports = { fixtures };
