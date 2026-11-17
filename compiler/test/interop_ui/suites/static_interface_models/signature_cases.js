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
    id: 'string-payload',
    boundary: 'A text event keeps its parameter name and string annotation.',
    declaration: `export interface IContract {
  notify(value: string): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(value: string): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'value: string'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'boolean-payload',
    boundary: 'A boolean event keeps false distinct from a numeric payload.',
    declaration: `export interface IContract {
  notify(enabled: boolean): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(enabled: boolean): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'enabled: boolean'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'array-payload',
    boundary: 'A list event retains its numeric array type.',
    declaration: `export interface IContract {
  notify(values: number[]): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(values: number[]): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'values: number[]'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'string-array-result',
    boundary: 'A query retains a string-array return contract.',
    declaration: `export interface IContract {
  notify(): string[];
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(): string[] {
    return ['ready'];
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'string[]',
              parameters: [],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'nullable-result',
    boundary: 'A nullable query keeps its explicit null branch.',
    declaration: `export interface IContract {
  notify(): string | null;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(): string | null {
    return null;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'string | null',
              parameters: [],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'optional-payload',
    boundary: 'An optional event argument retains its question token.',
    declaration: `export interface IContract {
  notify(value?: number): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(value?: number): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'value?: number'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'rest-payload',
    boundary: 'A variadic event retains its rest marker and array annotation.',
    declaration: `export interface IContract {
  notify(...values: number[]): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(...values: number[]): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                '...values: number[]'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'two-argument-event',
    boundary: 'The ordering of label and numeric arguments remains stable.',
    declaration: `export interface IContract {
  notify(label: string, value: number): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(label: string, value: number): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'label: string',
                'value: number'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'callback-argument',
    boundary: 'A callback parameter keeps both nested input and return types.',
    declaration: `export interface IContract {
  notify(callback: (value: number) => string): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(callback: (value: number) => string): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'callback: (value: number) => string'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'callback-result',
    boundary: 'A method returning a callback retains the nested function type.',
    declaration: `export interface IContract {
  notify(): (value: number) => number;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(): (value: number) => number {
    return (value: number): number => value + 1;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: '(value: number) => number',
              parameters: [],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'generic-method',
    boundary: 'A generic method keeps its own type parameter after interface injection.',
    declaration: `export interface IContract {
  notify<T>(value: T): T;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify<T>(value: T): T {
    return value;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'T',
              parameters: [
                'value: T'
              ],
              modifiers: [],
              generics: [
                'T'
              ]
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'constrained-generic',
    boundary: 'A generic constraint remains attached to the method type parameter.',
    declaration: `export interface IContract {
  notify<T extends number>(value: T): T;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify<T extends number>(value: T): T {
    return value;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'T',
              parameters: [
                'value: T'
              ],
              modifiers: [],
              generics: [
                'T extends number'
              ]
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'public-method',
    boundary: 'An explicitly public method retains its access modifier.',
    declaration: `export interface IContract {
  notify(value: number): number;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  public notify(value: number): number {
    return value;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'number',
              parameters: [
                'value: number'
              ],
              modifiers: [
                'public'
              ],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'matrix-payload',
    boundary: 'A nested numeric array preserves both ranks in an event signature.',
    declaration: `export interface IContract {
  notify(values: number[][]): void;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(values: number[][]): void {

  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'void',
              parameters: [
                'values: number[][]'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'nullable-list-result',
    boundary: 'A nullable list result preserves the array and null union.',
    declaration: `export interface IContract {
  notify(): string[] | null;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(): string[] | null {
    return null;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'string[] | null',
              parameters: [],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'boolean-result',
    boundary: 'A predicate method preserves a boolean result alongside its numeric input.',
    declaration: `export interface IContract {
  notify(value: number): boolean;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  notify(value: number): boolean {
    return value > 0;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'boolean',
              parameters: [
                'value: number'
              ],
              modifiers: [],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  },
  {
    id: 'async-method',
    boundary: 'An asynchronous method retains async and Promise result metadata.',
    declaration: `export interface IContract {
  notify(value: number): Promise<number>;
}
`,
    source: `import { IContract } from 'models';

class ViewModel implements IContract {
  async notify(value: number): Promise<number> {
    return value;
  }
}
`,
    evaluate: false,
    expected: {
      classes: [
        {
          name: 'ViewModel',
          records: [
            'Lcards/src/main/ets/Models/IContract;'
          ],
          parameters: [],
          methods: [
            'notify'
          ],
          superCall: null,
          signatures: [
            {
              name: 'notify',
              type: 'Promise<number>',
              parameters: [
                'value: number'
              ],
              modifiers: [
                'async'
              ],
              generics: []
            }
          ]
        }
      ],
      diagnostics: [],
      imports: [
        'models'
      ]
    }
  }
];

module.exports = { fixtures };
