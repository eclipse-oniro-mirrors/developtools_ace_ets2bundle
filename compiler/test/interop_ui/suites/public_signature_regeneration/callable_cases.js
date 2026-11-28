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
    id: 'required-density',
    boundary: 'Adding a required density input invalidates one-argument calls.',
    before: {
      sources: {
        'API.ets': `export function call(width: number): number { return width; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call(12);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(width: number, density: number): number { return width * density; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call(12, 2);
`
    },
    diagnostics: [
      [
        2554,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(width: number, density: number): number;'
    }
  },
  {
    id: 'removed-offset',
    boundary: 'Removing an obsolete offset invalidates surplus arguments.',
    before: {
      sources: {
        'API.ets': `export function call(width: number, offset: number): number { return width + offset; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call(12, 2);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(width: number): number { return width; }
`
      },
      caller: `import { call } from 'generated';
const width: number = call(12);
`
    },
    diagnostics: [
      [
        2554,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(width: number): number;'
    }
  },
  {
    id: 'optional-align-became-required',
    boundary: 'Removing the default requires callers to provide alignment.',
    before: {
      sources: {
        'API.ets': `export function call(align: string = "center"): string { return align; }
`
      },
      caller: `import { call } from 'generated';
const alignment: string = call();
`
    },
    after: {
      sources: {
        'API.ets': `export function call(align: string): string { return align; }
`
      },
      caller: `import { call } from 'generated';
const alignment: string = call("center");
`
    },
    diagnostics: [
      [
        2554,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(align: string): string;'
    }
  },
  {
    id: 'reordered-label-index',
    boundary: 'Reordering differently typed arguments invalidates the original call order.',
    before: {
      sources: {
        'API.ets': `export function call(label: string, index: number): string { return label + index; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call("row", 1);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(index: number, label: string): string { return label + index; }
`
      },
      caller: `import { call } from 'generated';
const text: string = call(1, "row");
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
      'src/main/ets/API.d.ets': 'function call(index: number, label: string): string;'
    }
  },
  {
    id: 'label-source-now-text',
    boundary: 'The old result assignment and argument are both incompatible after a type replacement.',
    before: {
      sources: {
        'API.ets': `export function call(id: number): number { return id; }
`
      },
      caller: `import { call } from 'generated';
const result: number = call(7);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(id: string): string { return id; }
`
      },
      caller: `import { call } from 'generated';
const result: string = call("selected");
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
      'src/main/ets/API.d.ets': 'function call(id: string): string;'
    }
  },
  {
    id: 'visibility-predicate-result',
    boundary: 'An old string assignment sees the regenerated boolean return.',
    before: {
      sources: {
        'API.ets': `export function call(visible: boolean): string { return visible ? "on" : "off"; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call(true);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(visible: boolean): boolean { return visible; }
`
      },
      caller: `import { call } from 'generated';
const visible: boolean = call(true);
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
      'src/main/ets/API.d.ets': 'function call(visible: boolean): boolean;'
    }
  },
  {
    id: 'layout-track-list',
    boundary: 'A scalar argument no longer satisfies the new track list contract.',
    before: {
      sources: {
        'API.ets': `export function call(track: number): number { return track; }
`
      },
      caller: `import { call } from 'generated';
call(12);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(tracks: number[]): number { return tracks[0]; }
`
      },
      caller: `import { call } from 'generated';
call([12, 24]);
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
      'src/main/ets/API.d.ets': 'function call(tracks: es.Array<number>): number;'
    }
  },
  {
    id: 'nested-row-coordinates',
    boundary: 'Cell coordinates require a second array dimension after regeneration.',
    before: {
      sources: {
        'API.ets': `export function call(cells: number[]): number { return cells[0]; }
`
      },
      caller: `import { call } from 'generated';
call([12]);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(rows: number[][]): number { return rows[0][0]; }
`
      },
      caller: `import { call } from 'generated';
call([[12]]);
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
      'src/main/ets/API.d.ets': 'function call(rows: es.Array<es.Array<number>>): number;'
    }
  },
  {
    id: 'display-color-element',
    boundary: 'Changing returned element type reaches an indexed read in the consumer.',
    before: {
      sources: {
        'API.ets': `export function call(id: number): number[] { return [id]; }
`
      },
      caller: `import { call } from 'generated';
const value: number = call(1)[0];
`
    },
    after: {
      sources: {
        'API.ets': `export function call(id: number): string[] { return ["active"]; }
`
      },
      caller: `import { call } from 'generated';
const color: string = call(1)[0];
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
      'src/main/ets/API.d.ets': 'function call(id: number): es.Array<string>;'
    }
  },
  {
    id: 'boolean-toggle-token',
    boundary: 'The consumer can no longer pass a text token to the toggle producer.',
    before: {
      sources: {
        'API.ets': `export function call(flag: string): boolean { return flag === "on"; }
`
      },
      caller: `import { call } from 'generated';
call("on");
`
    },
    after: {
      sources: {
        'API.ets': `export function call(flag: boolean): boolean { return flag; }
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
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(flag: boolean): boolean;'
    }
  },
  {
    id: 'rest-collapses-to-array',
    boundary: 'A former variadic call must be migrated to an array argument.',
    before: {
      sources: {
        'API.ets': `export function call(...sizes: number[]): number { return sizes.length; }
`
      },
      caller: `import { call } from 'generated';
call(4, 6);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(sizes: number[]): number { return sizes.length; }
`
      },
      caller: `import { call } from 'generated';
call([4, 6]);
`
    },
    diagnostics: [
      [
        2554,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'function call(sizes: es.Array<number>): number;'
    }
  },
  {
    id: 'fixed-slot-to-keyed-label',
    boundary: 'The new first argument distinguishes slot labels from numeric indices.',
    before: {
      sources: {
        'API.ets': `export function call(slot: number, selected: boolean): boolean { return selected; }
`
      },
      caller: `import { call } from 'generated';
call(1, false);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(slot: string, selected: boolean): boolean { return selected; }
`
      },
      caller: `import { call } from 'generated';
call("header", false);
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
      'src/main/ets/API.d.ets': 'function call(slot: string, selected: boolean): boolean;'
    }
  },
  {
    id: 'string-array-element-to-number',
    boundary: 'Array-literal diagnostics reflect the produced element type.',
    before: {
      sources: {
        'API.ets': `export function call(options: string[]): number { return options.length; }
`
      },
      caller: `import { call } from 'generated';
call(["primary"]);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(options: number[]): number { return options.length; }
`
      },
      caller: `import { call } from 'generated';
call([24]);
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
      'src/main/ets/API.d.ets': 'function call(options: es.Array<number>): number;'
    }
  },
  {
    id: 'matrix-return-rank',
    boundary: 'The consumer must complete another indexed access after the return rank changes.',
    before: {
      sources: {
        'API.ets': `export function call(row: number): number[] { return [row]; }
`
      },
      caller: `import { call } from 'generated';
const value: number = call(0)[0];
`
    },
    after: {
      sources: {
        'API.ets': `export function call(row: number): number[][] { return [[row]]; }
`
      },
      caller: `import { call } from 'generated';
const value: number = call(0)[0][0];
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
      'src/main/ets/API.d.ets': 'function call(row: number): es.Array<es.Array<number>>;'
    }
  },
  {
    id: 'replace-optional-text-annotation',
    boundary: 'The cached optional parameter retains optionality and gains the new type.',
    before: {
      sources: {
        'API.ets': `export function call(info?: string): number { return 1; }
`
      },
      caller: `import { call } from 'generated';
call("primary");
`
    },
    after: {
      sources: {
        'API.ets': `export function call(info?: number): number { return 1; }
`
      },
      caller: `import { call } from 'generated';
call(1);
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
      'src/main/ets/API.d.ets': 'info?: number'
    }
  },
  {
    id: 'defaulted-child-count-to-text',
    boundary: 'The defaulted argument stays optional after its type changes.',
    before: {
      sources: {
        'API.ets': `export function call(info: number = 1): number { return 1; }
`
      },
      caller: `import { call } from 'generated';
call(1);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(info: string = "one"): number { return 1; }
`
      },
      caller: `import { call } from 'generated';
call("one");
call();
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
      'src/main/ets/API.d.ets': 'info?: string'
    }
  },
  {
    id: 'required-array-in-place-of-rest',
    boundary: 'A single scalar no longer matches the replacement array input.',
    before: {
      sources: {
        'API.ets': `export function call(...ids: string[]): string { return ids[0]; }
`
      },
      caller: `import { call } from 'generated';
call("focused");
`
    },
    after: {
      sources: {
        'API.ets': `export function call(ids: string[]): string { return ids[0]; }
`
      },
      caller: `import { call } from 'generated';
call(["focused"]);
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
      'src/main/ets/API.d.ets': 'function call(ids: es.Array<string>): string;'
    }
  },
  {
    id: 'changed-secondary-argument',
    boundary: 'An unchanged first argument cannot conceal a changed secondary argument.',
    before: {
      sources: {
        'API.ets': `export function call(key: string, count: number): string { return key; }
`
      },
      caller: `import { call } from 'generated';
call("header", 2);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(key: string, count: boolean): string { return key; }
`
      },
      caller: `import { call } from 'generated';
call("header", true);
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
      'src/main/ets/API.d.ets': 'function call(key: string, count: boolean): string;'
    }
  },
  {
    id: 'arrow-callback-parameter',
    boundary: 'Callback contextual typing follows the regenerated input element.',
    before: {
      sources: {
        'API.ets': `export function call(notify: (value: number) => void): void { notify(3); }
`
      },
      caller: `import { call } from 'generated';
call(value => value.toFixed(1));
`
    },
    after: {
      sources: {
        'API.ets': `export function call(notify: (value: string) => void): void { notify("row"); }
`
      },
      caller: `import { call } from 'generated';
call(value => value.toUpperCase());
`
    },
    diagnostics: [
      [
        2551,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'notify: (value: string) => void'
    }
  },
  {
    id: 'callback-return-consumed',
    boundary: 'The child callback must now supply a numeric result.',
    before: {
      sources: {
        'API.ets': `export function call(format: () => string): void { format(); }
`
      },
      caller: `import { call } from 'generated';
call(() => "label");
`
    },
    after: {
      sources: {
        'API.ets': `export function call(format: () => number): void { format(); }
`
      },
      caller: `import { call } from 'generated';
call(() => 3);
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
      'src/main/ets/API.d.ets': 'format: () => number'
    }
  },
  {
    id: 'callback-arity-reduction',
    boundary: 'A callback requiring two parameters fails against the new one-argument surface.',
    before: {
      sources: {
        'API.ets': `export function call(update: (key: string, count: number) => void): void { update("key", 1); }
`
      },
      caller: `import { call } from 'generated';
call((key: string, count: number) => { key.repeat(count); });
`
    },
    after: {
      sources: {
        'API.ets': `export function call(update: (key: string) => void): void { update("key"); }
`
      },
      caller: `import { call } from 'generated';
call((key: string) => { key.toUpperCase(); });
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
      'src/main/ets/API.d.ets': 'update: (key: string) => void'
    }
  },
  {
    id: 'callback-payload-array',
    boundary: 'Typed callback arrays reflect the newly generated payload element.',
    before: {
      sources: {
        'API.ets': `export function call(report: (values: number[]) => void): void { report([4]); }
`
      },
      caller: `import { call } from 'generated';
call(values => values[0].toFixed(1));
`
    },
    after: {
      sources: {
        'API.ets': `export function call(report: (values: string[]) => void): void { report(["selected"]); }
`
      },
      caller: `import { call } from 'generated';
call(values => values[0].toUpperCase());
`
    },
    diagnostics: [
      [
        2551,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': 'values: es.Array<string>'
    }
  },
  {
    id: 'arity-in-curried-return',
    boundary: 'The regenerated returned callable changes its own arity.',
    before: {
      sources: {
        'API.ets': `export function call(padding: number): (offset: number) => number { return offset => padding + offset; }
`
      },
      caller: `import { call } from 'generated';
call(4)(1);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(padding: number): (offset: number, scale: number) => number { return (offset, scale) => (padding + offset) * scale; }
`
      },
      caller: `import { call } from 'generated';
call(4)(1, 2);
`
    },
    diagnostics: [
      [
        2554,
        2
      ]
    ],
    changedDeclarations: [
      'src/main/ets/API.d.ets'
    ],
    newSignature: {
      'src/main/ets/API.d.ets': '(offset: number, scale: number) => number'
    }
  },
  {
    id: 'returned-event-input',
    boundary: 'A returned event handler exposes its changed argument type.',
    before: {
      sources: {
        'API.ets': `export function call(label: string): (value: number) => string { return value => label + value; }
`
      },
      caller: `import { call } from 'generated';
call("prefix")(1);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(label: string): (value: string) => string { return value => label + value; }
`
      },
      caller: `import { call } from 'generated';
call("prefix")("end");
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
      'src/main/ets/API.d.ets': '(value: string) => string'
    }
  },
  {
    id: 'returned-render-predicate',
    boundary: 'A saved render predicate must match the revised return contract.',
    before: {
      sources: {
        'API.ets': `export function call(key: string): (value: number) => boolean { return value => value > 0; }
`
      },
      caller: `import { call } from 'generated';
const visible: boolean = call("tile")(2);
`
    },
    after: {
      sources: {
        'API.ets': `export function call(key: string): (value: number) => string { return value => key + value; }
`
      },
      caller: `import { call } from 'generated';
const label: string = call("tile")(2);
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
      'src/main/ets/API.d.ets': '(value: number) => string'
    }
  }
];

module.exports = { fixtures };
