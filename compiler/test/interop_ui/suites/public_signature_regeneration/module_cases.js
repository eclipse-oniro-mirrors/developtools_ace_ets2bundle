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
    id: 'source-list-element',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = number[];
`
      },
      caller: `import { call } from 'generated';
call([4]);
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string[];
`
      },
      caller: `import { call } from 'generated';
call(["active"]);
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = es.Array<string>;'
    }
  },
  {
    id: 'source-alias-under-referral',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = number;
`
      },
      caller: `import { call } from 'generated';
call(4);
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string;
`
      },
      caller: `import { call } from 'generated';
call("active");
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = string;'
    }
  },
  {
    id: 'source-removes-null',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string | null;
`
      },
      caller: `import { call } from 'generated';
call(null);
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string;
`
      },
      caller: `import { call } from 'generated';
call("active");
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = string;'
    }
  },
  {
    id: 'source-adds-list-rank',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = number[];
`
      },
      caller: `import { call } from 'generated';
call([4]);
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = number[][];
`
      },
      caller: `import { call } from 'generated';
call([[4]]);
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = es.Array<es.Array<number>>;'
    }
  },
  {
    id: 'source-toggles-boolean',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string;
`
      },
      caller: `import { call } from 'generated';
call("active");
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = boolean;
`
      },
      caller: `import { call } from 'generated';
call(true);
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = boolean;'
    }
  },
  {
    id: 'source-uses-text-list',
    boundary: 'Changing only the imported model must invalidate the generated consumer while the entry signature text remains stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string;
`
      },
      caller: `import { call } from 'generated';
call("active");
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./Value";
export function call(value: Value): Value { return value; }
`,
        'Value.ets': `export type Value = string[];
`
      },
      caller: `import { call } from 'generated';
call(["active"]);
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/Value.d.ets': 'type Value = es.Array<string>;'
    }
  },
  {
    id: 'dependency-required-label',
    boundary: 'A nested declaration is regenerated when the public model gains a required property.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { height: number; }
`
      },
      caller: `import { call } from 'generated';
call({ height: 12 });
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { height: number; label: string; }
`
      },
      caller: `import { call } from 'generated';
call({ height: 12, label: "tile" });
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'label: string;'
    }
  },
  {
    id: 'dependency-method-result',
    boundary: 'The consumer follows the generated relative import to a changed method return.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { format(): number; }
`
      },
      caller: `import { call } from 'generated';
call({ format: () => 1 });
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { format(): string; }
`
      },
      caller: `import { call } from 'generated';
call({ format: () => "tile" });
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'format(): string;'
    }
  },
  {
    id: 'dependency-class-instance-field',
    boundary: 'A changed public field invalidates structural view data in the caller.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export class Value { active: boolean = true; }
`
      },
      caller: `import { call } from 'generated';
call({ active: true });
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export class Value { active: string = "on"; }
`
      },
      caller: `import { call } from 'generated';
call({ active: "on" });
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'active: string;'
    }
  },
  {
    id: 'dependency-optional-label',
    boundary: 'A newly optional model member is diagnosed at its use site.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { label: string; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call({ label: "tile" }).label;
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { label?: string; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call({}).label ?? "tile";
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'label?: string;'
    }
  },
  {
    id: 'dependency-interface-readonly',
    boundary: 'A newly readonly property invalidates assignment to the returned model.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { width: number; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 1 }).width = 2;
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { readonly width: number; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call({ width: 2 }).width;
`
    },
    diagnostics: [
      [
        2540,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'readonly width: number;'
    }
  },
  {
    id: 'dependency-method-removed',
    boundary: 'A generated nested declaration must drop a deleted method even if the API text is stable.',
    before: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { width: number; measure(): number; }
`
      },
      caller: `import { call } from 'generated';
const model = { width: 2, measure: () => 2 };
call(model).measure();
`
    },
    after: {
      sources: {
        'API.ets': `import { Value } from "./model/Value";
export function call(value: Value): Value { return value; }
`,
        'model/Value.ets': `export interface Value { width: number; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 2 }).width;
`
    },
    diagnostics: [
      [
        2339,
        3
      ]
    ],
    changedDeclarations: [
      'src/main/ets/model/Value.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(value: Value): Value;',
      'src/main/ets/model/Value.d.ets': 'width: number;'
    }
  }
];

module.exports = { fixtures };
