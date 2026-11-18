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
    id: 'listener-label',
    boundary: 'A named label event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(label: string): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(label: string): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue('ok');
new PageModel().onValue(1);
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'label',
              type: 'string',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-nullable',
    boundary: 'A named nullable event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(value: string | null): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(value: string | null): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue(null);
new PageModel().onValue(false);
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'string | null',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'string | null',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-list',
    boundary: 'A named list event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(values: number[]): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(values: number[]): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue([1]);
new PageModel().onValue(['bad']);
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
  },
  {
    id: 'listener-optional',
    boundary: 'A named optional event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(value?: number): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(value?: number): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue();
new PageModel().onValue('bad');
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: true,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-rest',
    boundary: 'A named rest event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(...values: number[]): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(...values: number[]): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue(1, 2);
new PageModel().onValue('bad');
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: true
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'values',
              type: 'number[]',
              optional: false,
              rest: true
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-ordered',
    boundary: 'A named ordered event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(label: string, count: number): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(label: string, count: number): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue('ok', 1);
new PageModel().onValue(1, 'bad');
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
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
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
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
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-result',
    boundary: 'A named result event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(value: number): string;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(value: number): string { return value.toString(); }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue(1);
new PageModel().onValue('bad');
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'string',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'string',
          parameters: [
            {
              name: 'value',
              type: 'number',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
    id: 'listener-callback',
    boundary: 'A named callback event contract stays consistent between an interface, its lifecycle-owning model and the generated-file consumer.',
    mode: 'emit',
    source: `export interface Events {
 onValue(handler: (value: number) => string): void;
}
export class PageModel implements Events {
 aboutToAppear(): void {}
 onValue(handler: (value: number) => string): void {  }
 aboutToDisappear(): void {}
}
`,
    consumer: `import { PageModel } from 'generated';
new PageModel().onValue((value: number): string => value.toString());
new PageModel().onValue((value: string): string => value);
`,
    expected: {
      symbols: [
        'Events',
        'PageModel'
      ],
      types: [
        {
          name: 'Events',
          kind: 'InterfaceDeclaration'
        },
        {
          name: 'PageModel',
          kind: 'ClassDeclaration'
        }
      ],
      members: [
        {
          owner: 'Events',
          name: 'onValue',
          kind: 'MethodSignature',
          type: 'void',
          parameters: [
            {
              name: 'handler',
              type: '(value: number) => string',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'onValue',
          kind: 'MethodDeclaration',
          type: 'void',
          parameters: [
            {
              name: 'handler',
              type: '(value: number) => string',
              optional: false,
              rest: false
            }
          ],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToAppear',
          type: 'void',
          parameters: [],
          hasBody: false
        },
        {
          owner: 'PageModel',
          name: 'aboutToDisappear',
          type: 'void',
          parameters: [],
          hasBody: false
        }
      ],
      contains: [
        'implements Events'
      ],
      absent: [],
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
  }
];

module.exports = { fixtures };
