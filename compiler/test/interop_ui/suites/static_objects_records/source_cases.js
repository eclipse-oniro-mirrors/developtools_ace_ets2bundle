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
    id: 'string-field',
    boundary: 'A named static class requires a constructor before assigning its text field.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'ready' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'ready'
      }
    }
  },
  {
    id: 'empty-string',
    boundary: 'An empty string survives construction and property assignment.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: '' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: ''
      }
    }
  },
  {
    id: 'falsy-fields',
    boundary: 'Zero and false are transferred as explicit values.',
    declaration: `export declare class Profile {
  count: number;
  enabled: boolean;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { count: 0, enabled: false };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'count',
        'enabled'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        count: 0,
        enabled: false
      }
    }
  },
  {
    id: 'negative-number',
    boundary: 'Unary negative numbers remain expressions rather than a missing value.',
    declaration: `export declare class Profile {
  count: number;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { count: -17 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'count'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        count: -17
      }
    }
  },
  {
    id: 'fractional-number',
    boundary: 'Fractional numeric initializers retain precision in emitted assignments.',
    declaration: `export declare class Profile {
  ratio: number;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { ratio: 0.125 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'ratio'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        ratio: 0.125
      }
    }
  },
  {
    id: 'quoted-key',
    boundary: 'A quoted property that is not an identifier requires element access.',
    declaration: `export declare class Profile {
  'display-name': string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { 'display-name': 'card' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'display-name'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        'display-name': 'card'
      }
    }
  },
  {
    id: 'numeric-key',
    boundary: 'A numeric property name is an element-access key.',
    declaration: `export declare class Profile {
  1: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { 1: 'first' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        '1'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        '1': 'first'
      }
    }
  },
  {
    id: 'computed-key',
    boundary: 'A constant computed key must be evaluated at the assignment.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';
const key = 'title';

export function probe() {
  const model: Profile = { [key]: 'computed' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'key'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'computed'
      }
    },
    knownFailure: {
      stage: 'evolution-printer',
      code: 'EVOLUTION_COMPUTED_NAME',
      fingerprint: 'Debug Failure. Unhandled SyntaxKind: ComputedPropertyName.'
    }
  },
  {
    id: 'array-member',
    boundary: 'A typed numeric array remains a single member value.',
    declaration: `export declare class Profile {
  values: number[];
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { values: [1, 0, -2] };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'values'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        values: [
          1,
          0,
          -2
        ]
      }
    }
  },
  {
    id: 'matrix-member',
    boundary: 'Two-dimensional arrays preserve row structure.',
    declaration: `export declare class Profile {
  values: number[][];
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { values: [[1, 2], [3, 4]] };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'values'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        values: [
          [
            1,
            2
          ],
          [
            3,
            4
          ]
        ]
      }
    }
  },
  {
    id: 'string-array',
    boundary: 'String arrays retain empty and nonempty elements in order.',
    declaration: `export declare class Profile {
  labels: string[];
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { labels: ['a', '', 'c'] };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'labels'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        labels: [
          'a',
          '',
          'c'
        ]
      }
    }
  },
  {
    id: 'nullable-member',
    boundary: 'A nullable field keeps explicit null through the bridge.',
    declaration: `export declare class Profile {
  title: string | null;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: null };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: null
      }
    }
  },
  {
    id: 'optional-omitted',
    boundary: 'Omitting an optional field does not synthesize a write.',
    declaration: `export declare class Profile {
  title: string;
  note?: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'only' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'only'
      }
    }
  },
  {
    id: 'nested-object',
    boundary: 'A nested member initializer remains attached to its owning assignment.',
    declaration: `export declare class Profile {
  point: { x: number; y: number };
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { point: { x: 3, y: 4 } };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'point'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        point: {
          x: 3,
          y: 4
        }
      }
    }
  },
  {
    id: 'readonly-initialization',
    boundary: 'Readonly fields accept an object-literal initializer at the source checker.',
    declaration: `export declare class Profile {
  readonly title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'fixed' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'fixed'
      }
    }
  },
  {
    id: 'unicode-property',
    boundary: 'Unicode identifier keys are emitted as member access.',
    declaration: `export declare class Profile {
  名称: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { 名称: '静态' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        '名称'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        名称: '静态'
      }
    }
  },
  {
    id: 'escaped-string',
    boundary: 'Escaped source strings retain their runtime content.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'line\\nvalue' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: `line
value`
      }
    }
  },
  {
    id: 'expression-order',
    boundary: 'Property initializer calls preserve their source order.',
    declaration: `export declare class Profile {
  first: number;
  second: number;
  constructor();
}
`,
    source: `import { Profile } from 'models';
let counter = 0;
function next(): number { return ++counter; }

export function probe() {
  const model: Profile = { first: next(), second: next() };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'first',
        'second'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        first: 1,
        second: 2
      }
    }
  },
  {
    id: 'parent-state-value',
    boundary: 'A value captured from module state is read when the options are evaluated.',
    declaration: `export declare class Profile {
  count: number;
  constructor();
}
`,
    source: `import { Profile } from 'models';
const seed: number = 7;

export function probe() {
  const model: Profile = { count: seed + 2 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'count'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        count: 9
      }
    }
  },
  {
    id: 'conditional-member',
    boundary: 'Conditional initializers retain the chosen branch.',
    declaration: `export declare class Profile {
  title: string;
  constructor();
}
`,
    source: `import { Profile } from 'models';
const selected: boolean = false;

export function probe() {
  const model: Profile = { title: selected ? 'on' : 'off' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'off'
      }
    }
  },
  {
    id: 'return-context',
    boundary: 'A return type supplies the static contextual type.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  function make(): Profile {
    return { title: 'return' };
  }
  return make();
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'return'
      }
    }
  },
  {
    id: 'call-argument-context',
    boundary: 'A function parameter supplies static object contextual typing.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  function accept(model: Profile): Profile { return model; }
  return accept({ title: 'argument' });
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'argument'
      }
    }
  },
  {
    id: 'array-element-context',
    boundary: 'Every typed array element is independently constructed.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const models: Profile[] = [{ title: 'one' }, { title: 'two' }];
  return models;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title',
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: [
        {
          title: 'one'
        },
        {
          title: 'two'
        }
      ]
    }
  },
  {
    id: 'same-class-cache',
    boundary: 'Two literals share one class lookup while creating two instances.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const first: Profile = { title: 'first' };
  const second: Profile = { title: 'second' };
  return [first, second];
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title',
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: [
        {
          title: 'first'
        },
        {
          title: 'second'
        }
      ]
    }
  },
  {
    id: 'nested-function-context',
    boundary: 'A nested closure still receives its own typed literal conversion.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const create = (): Profile => { return { title: 'closure' }; };
  return create();
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'closure'
      }
    }
  },
  {
    id: 'optional-constructor',
    boundary: 'The current zero-parameter-constructor gate reports its exact diagnostic for an optional parameter.',
    declaration: `export declare class Profile { title: string; constructor(seed?: number); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'optional' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'optional'
      },
      errorCodes: [
        '10311012'
      ]
    }
  },
  {
    id: 'inherited-members',
    boundary: 'Inherited fields retain the concrete derived class record.',
    declaration: `declare class Parent { title: string; }
export declare class Profile extends Parent { count: number; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'inherited', count: 3 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title',
        'count'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'inherited',
        count: 3
      }
    }
  },
  {
    id: 'interface-object-literal',
    boundary: 'An interface uses its ObjectLiteral implementation record.',
    declaration: `export interface Profile { title: string; count: number; }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'interface', count: 8 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/cards$src$main$ets$Models$Profile$ObjectLiteral;'
      ],
      properties: [
        'title',
        'count'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'interface',
        count: 8
      }
    }
  },
  {
    id: 'scoped-package',
    boundary: 'Scoped package identity is kept in the constructor record.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'scoped' };
  return model;
}
`,
    evaluate: true,
    package: '@demo/cards',
    expected: {
      records: [
        'L@demo/cards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'scoped'
      }
    }
  },
  {
    id: 'class-name-collision',
    boundary: 'Existing temporary names force fresh generated identifiers.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';
const tmpObj = 'reserved';
const tmpClass = 'reserved';

export function probe() {
  const model: Profile = { title: 'collision' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'collision'
      }
    },
    knownFailure: {
      stage: 'generated-javascript',
      code: 'EVOLUTION_TEMP_COLLISION',
      fingerprint: 'SyntaxError: Identifier \'tmpObj\' has already been declared'
    }
  },
  {
    id: 'dynamic-ts-control',
    boundary: 'A .ts caller follows the explicit non-ETS early return.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'plain-ts' };
  return model;
}
`,
    evaluate: true,
    extension: 'Caller.ts',
    expected: {
      records: [],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'plain-ts'
      }
    }
  },
  {
    id: 'non-mixed-control',
    boundary: 'Disabling mixed compilation preserves the original object literal.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'nonmixed' };
  return model;
}
`,
    evaluate: true,
    mixCompile: false,
    expected: {
      records: [],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'nonmixed'
      }
    }
  },
  {
    id: 'local-interface-control',
    boundary: 'A local interface stays a normal dynamic object.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';
interface Local { title: string; }

export function probe() {
  const model: Local = { title: 'local' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'local'
      }
    }
  },
  {
    id: 'untyped-object-control',
    boundary: 'An uncontextualized literal is not assigned a static constructor.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model = { title: 'untyped' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'untyped'
      }
    }
  },
  {
    id: 'wrong-field-type',
    boundary: 'The caller checker identifies the exact wrong primitive type.',
    declaration: `export declare class Profile { count: number; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { count: 'wrong' };
  return model;
}
`,
    evaluate: false,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'count'
      ],
      contains: [],
      diagnostics: [
        2322
      ]
    }
  },
  {
    id: 'record-numeric-values',
    boundary: 'Numeric values include zero and a negative value.',
    declaration: `export type ScoreMap = Record<string, number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { alpha: 0, beta: -2 };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'alpha',
        'beta'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        alpha: 0,
        beta: -2
      }
    }
  },
  {
    id: 'record-empty',
    boundary: 'An empty record still resolves its static Record instance.',
    declaration: `export type ScoreMap = Record<string, number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = {};
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [],
      contains: [],
      diagnostics: [],
      runtime: {}
    }
  },
  {
    id: 'record-string-values',
    boundary: 'String-valued records preserve an empty string.',
    declaration: `export type ScoreMap = Record<string, string>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { alpha: '', beta: 'value' };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'alpha',
        'beta'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        alpha: '',
        beta: 'value'
      }
    }
  },
  {
    id: 'record-boolean-values',
    boundary: 'Boolean record values preserve false.',
    declaration: `export type ScoreMap = Record<string, boolean>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { active: false, ready: true };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'active',
        'ready'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        active: false,
        ready: true
      }
    }
  },
  {
    id: 'record-numeric-keys',
    boundary: 'Numeric keys use indexed writes.',
    declaration: `export type ScoreMap = Record<number, string>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { 0: 'zero', 2: 'two' };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        '0',
        '2'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        '0': 'zero',
        '2': 'two'
      }
    }
  },
  {
    id: 'record-literal-key-union',
    boundary: 'A finite key union requires the full declared key set.',
    declaration: `export type ScoreMap = Record<'left' | 'right', number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { left: 1, right: 2 };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'left',
        'right'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        left: 1,
        right: 2
      }
    }
  },
  {
    id: 'record-array-values',
    boundary: 'Array values keep their rank inside the Record.',
    declaration: `export type ScoreMap = Record<string, number[]>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { row: [1, 2, 3] };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'row'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        row: [
          1,
          2,
          3
        ]
      }
    }
  },
  {
    id: 'record-quoted-key',
    boundary: 'Keys with punctuation use element access.',
    declaration: `export type ScoreMap = Record<string, number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { 'display-size': 3 };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'display-size'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        'display-size': 3
      }
    }
  },
  {
    id: 'record-nullable-values',
    boundary: 'A union value can retain null.',
    declaration: `export type ScoreMap = Record<string, string | null>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { value: null };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'value'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        value: null
      }
    }
  },
  {
    id: 'record-matrix-values',
    boundary: 'Nested arrays are preserved as Record values.',
    declaration: `export type ScoreMap = Record<string, number[][]>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  const scores: ScoreMap = { grid: [[1], [2]] };
  return scores;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'grid'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        grid: [
          [
            1
          ],
          [
            2
          ]
        ]
      }
    }
  }
];

module.exports = { fixtures: [...fixtures, ...require('./context_cases').fixtures,
  ...require('./diagnostic_cases').fixtures] };
