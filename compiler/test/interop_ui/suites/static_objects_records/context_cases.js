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
    id: 'assignment-context',
    boundary: 'A later assignment obtains context from its typed destination.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  let model: Profile;
  model = { title: 'assigned' };
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
        title: 'assigned'
      }
    }
  },
  {
    id: 'typed-arrow-context',
    boundary: 'An arrow result is contextualized by its variable function type.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const make: () => Profile = () => ({ title: 'arrow' });
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
        title: 'arrow'
      }
    }
  },
  {
    id: 'generic-argument-context',
    boundary: 'An explicit generic argument supplies the target class.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  function identity<T>(value: T): T { return value; }
  return identity<Profile>({ title: 'generic' });
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
        title: 'generic'
      }
    }
  },
  {
    id: 'default-parameter-context',
    boundary: 'A default parameter object gets the parameter declared type.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  function create(model: Profile = { title: 'default' }): Profile { return model; }
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
        title: 'default'
      }
    }
  },
  {
    id: 'constructor-argument-context',
    boundary: 'A dynamic holder constructor accepts a static model literal.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  class Holder {
    constructor(public value: Profile) {}
  }
  return new Holder({ title: 'held' }).value;
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
        title: 'held'
      }
    }
  },
  {
    id: 'conditional-context',
    boundary: 'Both conditional branches are lowered with a shared class lookup.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const selected: boolean = false;
  const model: Profile = selected ? { title: 'a' } : { title: 'b' };
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
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'b'
      }
    }
  },
  {
    id: 'coalescing-context',
    boundary: 'A nullish fallback literal receives the non-null target type.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const absent: Profile | undefined = undefined;
  const model: Profile = absent ?? { title: 'fallback' };
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
        title: 'fallback'
      }
    }
  },
  {
    id: 'generic-class-number',
    boundary: 'A generic model preserves a numeric type argument at the caller checker.',
    declaration: `export declare class Profile<T> { value: T; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile<number> = { value: 9 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'value'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        value: 9
      }
    }
  },
  {
    id: 'generic-class-array',
    boundary: 'A generic array argument keeps its nested element values.',
    declaration: `export declare class Profile<T> { value: T; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile<string[]> = { value: ['a', 'b'] };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'value'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        value: [
          'a',
          'b'
        ]
      }
    }
  },
  {
    id: 'public-type-alias',
    boundary: 'A class alias still resolves the original exported class identity.',
    declaration: `export declare class Model { title: string; constructor(); }
export type Profile = Model;
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'alias' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Model;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'alias'
      }
    }
  },
  {
    id: 'import-alias',
    boundary: 'A local import alias preserves the exported class record name.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile as Card } from 'models';

export function probe() {
  const model: Card = { title: 'renamed' };
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
        title: 'renamed'
      }
    }
  },
  {
    id: 'namespace-class',
    boundary: 'A nested class retains its dollar-separated namespace path.',
    declaration: `export declare namespace Cards {
  export class Profile { title: string; constructor(); }
}
`,
    source: `import { Cards } from 'models';

export function probe() {
  const model: Cards.Profile = { title: 'namespaced' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Cards$Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'namespaced'
      }
    }
  },
  {
    id: 'deep-namespace-class',
    boundary: 'Two namespace layers are retained before the leaf class name.',
    declaration: `export declare namespace Cards {
  export namespace Detail {
    export class Profile { title: string; constructor(); }
  }
}
`,
    source: `import { Cards } from 'models';

export function probe() {
  const model: Cards.Detail.Profile = { title: 'deep' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Cards$Detail$Profile;'
      ],
      properties: [
        'title'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        title: 'deep'
      }
    }
  },
  {
    id: 'reserved-member-name',
    boundary: 'A keyword used as an object member stays a valid property assignment.',
    declaration: `export declare class Profile { default: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { default: 'value' };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'default'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        default: 'value'
      }
    }
  },
  {
    id: 'numeric-expression',
    boundary: 'A numeric expression stays at the property assignment site.',
    declaration: `export declare class Profile { count: number; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const input: number = 4;
  const model: Profile = { count: input * input };
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
        count: 16
      }
    }
  },
  {
    id: 'boolean-expression',
    boundary: 'A comparison is evaluated when the literal is constructed.',
    declaration: `export declare class Profile { active: boolean; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const input: number = 4;
  const model: Profile = { active: input > 0 };
  return model;
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lcards/src/main/ets/Models/Profile;'
      ],
      properties: [
        'active'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        active: true
      }
    }
  },
  {
    id: 'template-free-concatenation',
    boundary: 'String expressions preserve their data dependencies.',
    declaration: `export declare class Profile { title: string; constructor(); }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const prefix: string = 'card';
  const model: Profile = { title: prefix + '-detail' };
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
        title: 'card-detail'
      }
    }
  },
  {
    id: 'interface-inherited-field',
    boundary: 'An inherited interface member participates in object construction.',
    declaration: `export interface Base { title: string; }
export interface Profile extends Base { count: number; }
`,
    source: `import { Profile } from 'models';

export function probe() {
  const model: Profile = { title: 'base', count: 2 };
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
        title: 'base',
        count: 2
      }
    }
  },
  {
    id: 'record-function-parameter',
    boundary: 'A Record parameter supplies the mapped type to a literal argument.',
    declaration: `export type ScoreMap = Record<string, number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  function accept(value: ScoreMap): ScoreMap { return value; }
  return accept({ left: 3, right: 5 });
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
        left: 3,
        right: 5
      }
    }
  },
  {
    id: 'record-return-type',
    boundary: 'A Record return annotation contextualizes the returned literal.',
    declaration: `export type ScoreMap = Record<string, number>;
`,
    source: `import { ScoreMap } from 'models';

export function probe() {
  function make(): ScoreMap { return { total: 8 }; }
  return make();
}
`,
    evaluate: true,
    expected: {
      records: [
        'Lstd.core.Record;'
      ],
      properties: [
        'total'
      ],
      contains: [],
      diagnostics: [],
      runtime: {
        total: 8
      }
    }
  }
];

module.exports = { fixtures };
