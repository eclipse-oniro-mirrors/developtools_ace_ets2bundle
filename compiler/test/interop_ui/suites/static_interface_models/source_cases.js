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
    id: 'synthesized-constructor',
    boundary: 'A class without a constructor receives one static interface directive.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;

  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'explicit-empty-constructor',
    boundary: 'An explicit empty constructor receives its directive before user statements.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor() {
    this.count = 3;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'required-number-parameter',
    boundary: 'A required parameter is preserved when adding the interface directive.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(seed: number) {
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'seed: number'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'optional-number-parameter',
    boundary: 'An optional parameter retains its question token.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(seed?: number) {
    this.count = seed || 0;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'seed?: number'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'default-number-parameter',
    boundary: 'A default value remains part of the constructor contract.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(seed: number = 5) {
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'seed: number = 5'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'rest-parameter',
    boundary: 'A user rest parameter is retained instead of a synthetic replacement.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(...values: number[]) {
    this.count = values.length;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            '...values: number[]'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'public-parameter-property',
    boundary: 'A public parameter property retains its modifier and initializer.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(public seed: number = 1) {
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'public seed: number = 1'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'private-parameter-property',
    boundary: 'A private parameter property stays private after directive injection.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(private seed: number) {
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'private seed: number'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'readonly-parameter-property',
    boundary: 'Readonly parameter-property metadata is preserved.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  constructor(readonly seed: number) {
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'readonly seed: number'
          ],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'exported-view-model',
    boundary: 'Export visibility survives the class heritage update.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

export class ViewModel implements IObserver {
  count: number = 0;

  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'derived-synthetic-constructor',
    boundary: 'A derived view model synthesizes a forwarding rest constructor.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class Parent { constructor(public seed: number) {} }
class ViewModel extends Parent implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'Parent',
          records: [],
          parameters: [
            'public seed: number'
          ],
          methods: [],
          superCall: null
        },
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: null,
          methods: [
            'onValue'
          ],
          superCall: 'super(...args)'
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'derived-explicit-constructor',
    boundary: 'An explicit super call is preserved after the injected directive.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class Parent { constructor(public seed: number) {} }
class ViewModel extends Parent implements IObserver {
  count: number = 0;
  constructor(seed: number) {
    super(seed);
    this.count = seed;
  }
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'Parent',
          records: [],
          parameters: [
            'public seed: number'
          ],
          methods: [],
          superCall: null
        },
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [
            'seed: number'
          ],
          methods: [
            'onValue'
          ],
          superCall: 'super(seed)'
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'remote-interface-inheritance',
    boundary: 'The direct static interface precedes its inherited interface.',
    declaration: `export interface IObserver { onValue(value: number): void; }
export interface IAdvanced extends IObserver { active(): boolean; }
`,
    source: `import { IAdvanced } from 'models';

class ViewModel implements IAdvanced {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
  active(): boolean { return true; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IAdvanced;',
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue',
            'active'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'multiple-static-interfaces',
    boundary: 'Multiple implemented interfaces preserve declaration order and both method contracts.',
    declaration: `export interface IObserver { onValue(value: number): void; }
export interface ILabel { label(): string; }
`,
    source: `import { IObserver, ILabel } from 'models';

class ViewModel implements IObserver, ILabel {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
  label(): string { return 'value'; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;',
            'Lcards/src/main/ets/Models/ILabel;'
          ],
          parameters: [],
          methods: [
            'onValue',
            'label'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'ordered-static-interfaces',
    boundary: 'Multiple implemented interfaces preserve declaration order and both method contracts.',
    declaration: `export interface IObserver { onValue(value: number): void; }
export interface ILabel { label(): string; }
`,
    source: `import { IObserver, ILabel } from 'models';

class ViewModel implements ILabel, IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
  label(): string { return 'value'; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/ILabel;',
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue',
            'label'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'diamond-interface-graph',
    boundary: 'A shared ancestor in a diamond appears exactly once.',
    declaration: `export interface IObserver { onValue(value: number): void; }
export interface ILeft extends IObserver {}
export interface IRight extends IObserver {}
export interface ITop extends ILeft, IRight {}
`,
    source: `import { ITop } from 'models';

class ViewModel implements ITop {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/ITop;',
            'Lcards/src/main/ets/Models/ILeft;',
            'Lcards/src/main/ets/Models/IObserver;',
            'Lcards/src/main/ets/Models/IRight;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'local-interface-extension',
    boundary: 'A local intermediate interface contributes its static ancestor only.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

interface LocalObserver extends IObserver {}
class ViewModel implements LocalObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'dynamic-inheritance-chain',
    boundary: 'Static interface support propagates through two dynamic base classes.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class Base implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
class Middle extends Base {}
class Leaf extends Middle {}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'Base',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        },
        {
          name: 'Middle',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: null,
          methods: [],
          superCall: 'super(...args)'
        },
        {
          name: 'Leaf',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: null,
          methods: [],
          superCall: 'super(...args)'
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'generic-number-interface',
    boundary: 'Generic method types remain on the class while the interface record is erased.',
    declaration: `export interface IValue<T> { receive(value: T): T; }
`,
    source: `import { IValue } from 'models';

class ViewModel implements IValue<number> {
  receive(value: number): number { return value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IValue;'
          ],
          parameters: [],
          methods: [
            'receive'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'generic-string-interface',
    boundary: 'Generic method types remain on the class while the interface record is erased.',
    declaration: `export interface IValue<T> { receive(value: T): T; }
`,
    source: `import { IValue } from 'models';

class ViewModel implements IValue<string> {
  receive(value: string): string { return value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IValue;'
          ],
          parameters: [],
          methods: [
            'receive'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'generic-array-interface',
    boundary: 'Generic method types remain on the class while the interface record is erased.',
    declaration: `export interface IValue<T> { receive(value: T): T; }
`,
    source: `import { IValue } from 'models';

class ViewModel implements IValue<number[]> {
  receive(value: number[]): number[] { return value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IValue;'
          ],
          parameters: [],
          methods: [
            'receive'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'optional-interface-method',
    boundary: 'Optional methods do not force a new implementation member.',
    declaration: `export interface IObserver { onValue(value: number): void; optional?(): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'readonly-interface-property',
    boundary: 'Readonly interface properties remain ordinary view-model fields.',
    declaration: `export interface IObserver { onValue(value: number): void; readonly name: string; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  readonly name: string = 'view';
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'callback-property-interface',
    boundary: 'Callback properties retain their complete argument and return contract.',
    declaration: `export interface IObserver { onValue(value: number): void; handler: (value: number) => void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  handler: (value: number) => void = (value: number): void => {};
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'callback-return-interface',
    boundary: 'Callback properties retain their complete argument and return contract.',
    declaration: `export interface IObserver { onValue(value: number): void; handler: (value: string) => number; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  handler: (value: string) => number = (value: string): number => value.length;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'nullable-callback-result',
    boundary: 'Callback properties retain their complete argument and return contract.',
    declaration: `export interface IObserver { onValue(value: number): void; handler: () => string | null; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  handler: () => string | null = (): string | null => null;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'promise-return-method',
    boundary: 'An asynchronous interface method retains its Promise return type.',
    declaration: `export interface IAsync { load(): Promise<number>; }
`,
    source: `import { IAsync } from 'models';

class ViewModel implements IAsync {
  async load(): Promise<number> { return 7; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IAsync;'
          ],
          parameters: [],
          methods: [
            'load'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'alias-import-interface',
    boundary: 'An imported alias maps back to the original static interface name.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver as Watcher } from 'models';

class ViewModel implements Watcher {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'static-interface-type-alias',
    boundary: 'A public alias retains its underlying interface identity.',
    declaration: `export interface IObserver { onValue(value: number): void; }
export type Watcher = IObserver;
`,
    source: `import { Watcher } from 'models';

class ViewModel implements Watcher {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'non-mixed-interface-control',
    boundary: 'A non-mixed build leaves the original class without an injected constructor.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    mixCompile: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'typescript-interface-control',
    boundary: 'A .ts source follows the non-ETS early return.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    extension: 'Caller.ts',
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'local-interface-control',
    boundary: 'A local interface is excluded from static interface metadata.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

interface LocalObserver { onValue(value: number): void; }
class ViewModel implements LocalObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'unused-static-import-control',
    boundary: 'Importing a static interface without implementing it adds no constructor.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'two-independent-classes',
    boundary: 'Each independent class receives exactly one directive.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class First implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
class Second implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'First',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        },
        {
          name: 'Second',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'scoped-interface-package',
    boundary: 'Scoped package names remain part of the interface descriptor.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
  onValue(value: number): void { this.count = value; }
}
`,
    evaluate: false,
    package: '@scope/cards',
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'L@scope/cards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [
            'onValue'
          ],
          superCall: null
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'missing-interface-method',
    boundary: 'A missing implementation produces a checker diagnostic without dropping metadata.',
    declaration: `export interface IObserver { onValue(value: number): void; }
`,
    source: `import { IObserver } from 'models';

class ViewModel implements IObserver {
  count: number = 0;
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IObserver;'
          ],
          parameters: [],
          methods: [],
          superCall: null
        }
      ],
      diagnostics: [
        2420
      ],
      imports: [
        'models'
      ]
    }
  }
];

module.exports = { fixtures: [...fixtures, ...require('./signature_cases').fixtures] };
