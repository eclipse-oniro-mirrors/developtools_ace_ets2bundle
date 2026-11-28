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
    id: 'remove-null-color',
    boundary: 'An old nullable color is diagnosed when the field becomes required.',
    before: {
      sources: {
        'API.ets': `export type Payload = string | null;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(null);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = string;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call("blue");
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = string;'
    }
  },
  {
    id: 'visual-variant-union-narrowed',
    boundary: 'A removed visual variant no longer reaches the shared API.',
    before: {
      sources: {
        'API.ets': `export type Payload = string | number;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(3);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = string;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call("expanded");
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = string;'
    }
  },
  {
    id: 'selection-array-optional-slot',
    boundary: 'The newly non-null slot is enforced inside an array.',
    before: {
      sources: {
        'API.ets': `export type Payload = (string | null)[];
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call([null]);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = string[];
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(["selected"]);
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = es.Array<string>;'
    }
  },
  {
    id: 'nested-sizing-model',
    boundary: 'A refactor from flat to nested numeric sizes changes current calls.',
    before: {
      sources: {
        'API.ets': `export type Payload = number[];
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call([4]);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = number[][];
export function call(value: Payload): Payload { return value; }
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
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = es.Array<es.Array<number>>;'
    }
  },
  {
    id: 'label-return-nullable',
    boundary: 'A widened return requires handling null at the caller.',
    before: {
      sources: {
        'API.ets': `export type Payload = string;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call("A");
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = string | null;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call("A") ?? "fallback";
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = string | null;'
    }
  },
  {
    id: 'selection-return-union',
    boundary: 'A widened return requires narrowing before numeric formatting.',
    before: {
      sources: {
        'API.ets': `export type Payload = number;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(4).toFixed(1);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = number | string;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const value = call(4);
if (typeof value === "number") { value.toFixed(1); }
`
    },
    diagnostics: [
      [
        2339,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = number | string;'
    }
  },
  {
    id: 'index-text-to-array',
    boundary: 'A list result cannot be assigned to the former text contract.',
    before: {
      sources: {
        'API.ets': `export type Payload = string;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call("A");
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = string[];
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call(["A"])[0];
`
    },
    diagnostics: [
      [
        2322,
        2
      ],
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = es.Array<string>;'
    }
  },
  {
    id: 'remove-undefined-token',
    boundary: 'The stale undefined argument is rejected by the regenerated alias.',
    before: {
      sources: {
        'API.ets': `export type Payload = boolean | undefined;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(undefined);
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = boolean;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call(false);
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = boolean;'
    }
  },
  {
    id: 'array-to-scalar-results',
    boundary: 'Code indexing a former return array sees the changed result type.',
    before: {
      sources: {
        'API.ets': `export type Payload = number[];
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call([12])[0];
`
    },
    after: {
      sources: {
        'API.ets': `export type Payload = number;
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call(12);
`
    },
    diagnostics: [
      [
        7053,
        2
      ],
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'type Payload = number;'
    }
  },
  {
    id: 'interface-add-required-caption',
    boundary: 'Existing object literals lack the new required caption.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  width: number;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 12 });
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  width: number;
  caption: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 12, caption: "tile" });
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'caption: string;'
    }
  },
  {
    id: 'interface-remove-legacy-field',
    boundary: 'The old consumer reads a property removed from the generated model.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  width: number;
  caption: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const data = { width: 12, caption: "tile" };
call(data).caption;
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  width: number;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 12 }).width;
`
    },
    diagnostics: [
      [
        2339,
        3
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'width: number;'
    }
  },
  {
    id: 'interface-width-element',
    boundary: 'A property type update changes nested argument compatibility.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  width: number;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ width: 12 });
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  width: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ width: "100%" });
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'width: string;'
    }
  },
  {
    id: 'interface-optional-caption',
    boundary: 'Regenerated declarations enforce optional reads at the use site.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  caption: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call({ caption: "tile" }).caption;
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  caption?: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call({}).caption ?? "tile";
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'caption?: string;'
    }
  },
  {
    id: 'model-class-instance-read',
    boundary: 'Consumers observe a changed property type in a public class.',
    before: {
      sources: {
        'API.ets': `export class Payload {
  caption: string = "tile";
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call({ caption: "tile" }).caption;
`
    },
    after: {
      sources: {
        'API.ets': `export class Payload {
  caption: number = 0;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
const size: number = call({ caption: 0 }).caption;
`
    },
    diagnostics: [
      [
        2322,
        2
      ],
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'caption: number;'
    }
  },
  {
    id: 'interface-add-required-method',
    boundary: 'A newly required method invalidates previously conforming objects.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  label: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ label: "tile" });
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  label: string;
  activate(): boolean;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ label: "tile", activate: () => true });
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'activate(): boolean;'
    }
  },
  {
    id: 'interface-change-method-return',
    boundary: 'A changed method result is checked through its containing object.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  format(): number;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ format: () => 1 });
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  format(): string;
}
export function call(value: Payload): Payload { return value; }
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
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'format(): string;'
    }
  },
  {
    id: 'interface-change-optional-to-required',
    boundary: 'Previously omitted configuration becomes mandatory.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  label?: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({});
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  label: string;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ label: "item" });
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'label: string;'
    }
  },
  {
    id: 'interface-change-arrays',
    boundary: 'The checker reaches the changed property list element.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  items: number[];
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ items: [1] });
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  items: string[];
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ items: ["item"] });
`
    },
    diagnostics: [
      [
        2322,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'items: es.Array<string>;'
    }
  },
  {
    id: 'interface-indexed-method-parameter',
    boundary: 'The consumer must update its projection of a public method.',
    before: {
      sources: {
        'API.ets': `export interface Payload {
  select(value: number): boolean;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ select: () => true }).select(1);
`
    },
    after: {
      sources: {
        'API.ets': `export interface Payload {
  select(value: string): boolean;
}
export function call(value: Payload): Payload { return value; }
`
      },
      caller: `import { call } from 'generated';
call({ select: () => true }).select("first");
`
    },
    diagnostics: [
      [
        2345,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'select(value: string): boolean;'
    }
  }
];

module.exports = { fixtures };
