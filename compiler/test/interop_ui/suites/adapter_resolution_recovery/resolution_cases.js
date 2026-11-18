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
    id: 'missing-static-adapter-recovers',
    boundary: 'A missing static declaration is reported before a freshly written adapter can resolve.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'ats-adapter-recovers',
    boundary: 'An ATS source uses a d.ets adapter and responds immediately to adapter removal.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'ambient-ets-adapter-recovers',
    boundary: 'A static ambient declaration keeps exactly one d.ets suffix during redirection.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.d.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'ambient-ats-adapter-recovers',
    boundary: 'A d.ats public input is redirected to its dynamic d.ets counterpart.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.d.ats',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'hybrid-static-member-recovers',
    boundary: 'Only the registered static member of a hybrid module requires a generated adapter.',
    operation: 'query',
    packageName: 'cards',
    language: 'hybrid',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'nested-adapter-recovers',
    boundary: 'The generated path retains a nested source subtree during missing-file recovery.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/models/Card.ets',
    caller: 'src/Host.ets',
    request: './models/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './models/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/models/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/models/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './models/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/models/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'source-root-adapter-recovers',
    boundary: 'The full src/main/ets source root is retained in the generated subtree.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/main/ets/Card.ets',
    caller: 'src/main/ets/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/main/ets/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/main/ets/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/main/ets/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/main/ets/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/main/ets/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'unicode-adapter-recovers',
    boundary: 'Unicode path components survive both redirection and the missing-module set.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/卡片/Card.ets',
    caller: 'src/Host.ets',
    request: './卡片/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './卡片/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/卡片/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/卡片/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/卡片/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './卡片/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/卡片/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/卡片/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'space-adapter-recovers',
    boundary: 'Spaces in the source subtree do not redirect to an adjacent generated file.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/card models/Card.ets',
    caller: 'src/Host.ets',
    request: './card models/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './card models/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/card models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/card models/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/card models/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './card models/Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/card models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/card models/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'hyphen-adapter-recovers',
    boundary: 'A hyphenated source file retains the exact declaration basename.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Counter-Card.ets',
    caller: 'src/Host.ets',
    request: './Counter-Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Counter-Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Counter-Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Counter-Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Counter-Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Counter-Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Counter-Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Counter-Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'underscored-adapter-recovers',
    boundary: 'An underscore is part of the source identity throughout adapter recovery.',
    operation: 'redirect',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Counter_Card.ets',
    caller: 'src/Host.ets',
    request: './Counter_Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Counter_Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Counter_Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Counter_Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Counter_Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Counter_Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'dotted-basename-recovers',
    boundary: 'Only the final source suffix changes for a multi-dot module basename.',
    operation: 'redirect',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.model.ets',
    caller: 'src/Host.ets',
    request: './Card.model',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.model.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.model.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.model.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.model.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.model.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'direct-redirection-recovers',
    boundary: 'The direct adapter API observes creation, deletion and restoration without stale paths.',
    operation: 'redirect',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'sibling-prefix-is-not-a-declaration',
    boundary: 'A file beside the expected declaration cannot satisfy an exact mapped lookup.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {
      'decl/src/Card.d.ets.backup': `export declare class Card { count: number; constructor(); }
`,
      'decl/src/CardOther.d.ets': `export declare class Card { count: number; constructor(); }
`
    },
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'wrong-subtree-is-not-a-declaration',
    boundary: 'A correctly named declaration in a different subtree leaves the requested adapter missing.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {
      'decl/other/Card.d.ets': `export declare class Card { count: number; constructor(); }
`,
      'decl/Card.d.ets': `export declare class Card { count: number; constructor(); }
`
    },
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './Card'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'wrong-case-is-not-a-declaration',
    boundary: 'A differently cased filename is kept distinct by the path mapping contract.',
    operation: 'query',
    packageName: 'cards',
    language: '1.2',
    source: 'src/UpperCard.ets',
    caller: 'src/Host.ets',
    request: './UpperCard',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {
      'decl/src/LowerCard.d.ets': `export declare class Card { count: number; constructor(); }
`
    },
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: [
          './UpperCard'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/UpperCard.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/UpperCard.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/UpperCard.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: [
          './UpperCard'
        ]
      },
      {
        action: 'write',
        file: 'decl/src/UpperCard.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/UpperCard.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'roundtrip-normal-declaration',
    boundary: 'An adapter round-trip restores the original static source path.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      }
    ],
    containingDeclaration: 'decl/src/Card.d.ets'
  },
  {
    id: 'roundtrip-nested-declaration',
    boundary: 'A declaration round-trip retains nested directories.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/models/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/models/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'src/models/Card.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/models/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: 'src/models/Card.ets',
        missing: []
      }
    ],
    containingDeclaration: 'decl/src/models/Card.d.ets'
  },
  {
    id: 'roundtrip-spaced-declaration',
    boundary: 'A declaration round-trip retains spaces.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/model cards/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/model cards/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/model cards/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'src/model cards/Card.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/model cards/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: 'src/model cards/Card.ets',
        missing: []
      }
    ],
    containingDeclaration: 'decl/src/model cards/Card.d.ets'
  },
  {
    id: 'roundtrip-unicode-declaration',
    boundary: 'A declaration round-trip retains Unicode characters.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/模型/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/模型/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/模型/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'src/模型/Card.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/模型/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: 'src/模型/Card.ets',
        missing: []
      }
    ],
    containingDeclaration: 'decl/src/模型/Card.d.ets'
  },
  {
    id: 'roundtrip-dotted-declaration',
    boundary: 'A declaration round-trip strips only the final d.ets suffix.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.model.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/Card.model.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.model.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'src/Card.model.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.model.d.ets'
      },
      {
        action: 'resolve',
        expected: 'src/Card.model.ets',
        missing: []
      }
    ],
    containingDeclaration: 'decl/src/Card.model.d.ets'
  },
  {
    id: 'relative-adapter-fallback-and-repair',
    boundary: 'A declaration import falls back to its source until the sibling adapter exists.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'decl/src/Host.d.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'src/Card.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'src/Card.ets',
        text: `'use static';
export class Card { count: number = 1; }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'parent-relative-adapter-fallback',
    boundary: 'A parent-relative import uses the mapped source directory.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'decl/src/pages/Host.d.ets',
    request: '../Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'src/Card.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'src/Card.ets',
        text: `'use static';
export class Card { count: number = 1; }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'nested-relative-adapter-fallback',
    boundary: 'A nested declaration import resolves its own generated subtree.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/models/Card.ets',
    caller: 'decl/src/Host.d.ets',
    request: './models/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/models/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/models/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/models/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'src/models/Card.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'src/models/Card.ets',
        text: `'use static';
export class Card { count: number = 1; }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/models/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'explicit-ets-declaration-import',
    boundary: 'An explicit ets import does not append a second extension.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'decl/src/Host.d.ets',
    request: './Card.ets',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: 'src/Card.ets',
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'src/Card.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'src/Card.ets',
        text: `'use static';
export class Card { count: number = 1; }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'source-ats-adapter-required',
    boundary: 'A dynamic ETS caller resolves an ATS import only after its adapter exists.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'source-explicit-ats-adapter',
    boundary: 'An explicit ATS request shares the same generated declaration.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.ets',
    request: './Card.ats',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'source-ambient-ats-adapter',
    boundary: 'An ambient ATS source can produce a dynamic declaration import.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.d.ats',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'source-parent-ats-adapter',
    boundary: 'An ATS import above the caller keeps the original module root.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/pages/Host.ets',
    request: '../Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      },
      {
        action: 'remove',
        file: 'decl/src/Card.d.ets'
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: 'decl/src/Card.d.ets',
        missing: []
      }
    ]
  },
  {
    id: 'decl-nonrelative-module-guard',
    boundary: 'A package-name request does not enter the relative declaration resolver.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'decl/src/Host.d.ets',
    request: 'cards/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'decl-plain-caller-guard',
    boundary: 'An ordinary source caller does not enter the declaration-to-source relative resolver.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'decl-ts-caller-guard',
    boundary: 'A TS caller cannot be treated as a generated declaration container.',
    operation: 'from-decl',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ts',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'source-declaration-caller-guard',
    boundary: 'A declaration caller is excluded from dynamic-source ATS resolution.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.d.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'source-ts-caller-guard',
    boundary: 'A TS caller does not activate the ETS-to-ATS fallback.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.ts',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'source-package-name-guard',
    boundary: 'A package-name request does not activate the source-relative ATS resolver.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ats',
    caller: 'src/Host.ets',
    request: 'cards/Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'source-ets-target-guard',
    boundary: 'An ETS sibling does not masquerade as an ATS fallback target.',
    operation: 'from-source',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ]
  },
  {
    id: 'map-sibling-prefix-guard',
    boundary: 'A sibling declaration prefix does not match the registered output directory.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ],
    containingDeclaration: 'decl-other/src/Card.d.ets'
  },
  {
    id: 'map-outside-declaration-root',
    boundary: 'A declaration outside the registered output root has no reverse mapping.',
    operation: 'map',
    packageName: 'cards',
    language: '1.2',
    source: 'src/Card.ets',
    caller: 'src/Host.ets',
    request: './Card',
    sourceText: `'use static';
export class Card { count: number = 1; }
`,
    initialFiles: {},
    steps: [
      {
        action: 'resolve',
        expected: null,
        missing: []
      },
      {
        action: 'write',
        file: 'decl/src/Card.d.ets',
        text: `export declare class Card { count: number; constructor(); }
`
      },
      {
        action: 'resolve',
        expected: null,
        missing: []
      }
    ],
    containingDeclaration: 'outside/src/Card.d.ets'
  }
];

module.exports = { fixtures };
