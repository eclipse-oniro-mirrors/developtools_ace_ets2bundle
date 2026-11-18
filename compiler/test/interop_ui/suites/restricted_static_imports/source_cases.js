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
    id: 'named-reexport',
    boundary: 'A direct named re-export reports its unsupported static boundary.',
    source: `export { Card } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { Card } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'aliased-reexport',
    boundary: 'An aliased re-export keeps the same unsupported source-module boundary.',
    source: `export { Card as PublicCard } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { Card as PublicCard } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'star-reexport',
    boundary: 'A star re-export reports the static module before runtime emission.',
    source: `export * from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export * from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'namespace-reexport',
    boundary: 'A namespace re-export keeps its original statement and reports the restriction.',
    source: `export * as cards from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export * as cards from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'type-reexport',
    boundary: 'A type-only re-export follows the current static re-export diagnostic contract.',
    source: `export type { Card } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export type { Card } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'empty-reexport',
    boundary: 'An empty re-export still identifies a static module boundary.',
    source: `export {} from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export {} from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'mixed-type-reexport',
    boundary: 'A specifier-level type re-export retains the source restriction.',
    source: `export { type Card } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { type Card } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'relative-reexport',
    boundary: 'A normalized relative static path receives the re-export diagnostic.',
    source: `export { Card } from './nested/../Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { Card } from \'./nested/../Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'second-reexport-position',
    boundary: 'A re-export diagnostic records the second statement source position.',
    source: `const ready = true;
export { Card } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 19,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { Card } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'commented-reexport-position',
    boundary: 'Leading comments stay attached to the source while the diagnostic uses statement position.',
    source: `// source comment
export { Card } from './Static';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [
        {
          code: '10310026',
          pos: 0,
          fragments: [
            'Re-exporting from static interop file',
            'Current module is',
            'cards',
            'not supported'
          ]
        }
      ],
      contains: [
        'export { Card } from \'./Static\';'
      ],
      absent: []
    }
  },
  {
    id: 'dynamic-module-reexport-control',
    boundary: 'A re-export of a dynamic source is preserved without the static restriction.',
    source: `export { DynamicCard } from './Dynamic';
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 1,
      errors: [],
      contains: [
        'export { DynamicCard }'
      ],
      absent: []
    }
  },
  {
    id: 'local-export-control',
    boundary: 'A local export has no source-module static boundary to reject.',
    source: `class LocalCard {}
export { LocalCard };
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'export { LocalCard }'
      ],
      absent: []
    }
  },
  {
    id: 'dynamic-import-expression',
    boundary: 'A dynamic import expression remains outside static declaration replacement.',
    source: `const result = import('./Static');
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: [
        '__createLazy__',
        'Panda.getClass'
      ]
    }
  },
  {
    id: 'dynamic-import-await',
    boundary: 'Awaiting a dynamic import preserves the actual dynamic import node.',
    source: `async function load() { return await import('./Static'); }
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: [
        '__createLazy__',
        'Panda.getClass'
      ]
    }
  },
  {
    id: 'dynamic-import-then',
    boundary: 'A dynamic promise chain does not acquire a named static import helper.',
    source: `const result = import('./Static').then(module => module.Card);
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: [
        '__createLazy__',
        'Panda.getClass'
      ]
    }
  },
  {
    id: 'dynamic-import-computed',
    boundary: 'A computed dynamic module name is retained for its own runtime resolution.',
    source: `const name = './Static';
const result = import(name);
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: [
        '__createLazy__',
        'Panda.getClass'
      ]
    }
  },
  {
    id: 'dynamic-import-template',
    boundary: 'A template-literal dynamic import is not rewritten as a static declaration.',
    source: `const result = import(\`./Static\`);
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: [
        '__createLazy__',
        'Panda.getClass'
      ]
    }
  },
  {
    id: 'concurrent-flag-disabled',
    boundary: 'A source directive produces no bridge until FileManager marks the file for concurrent imports.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: false,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [],
      imports: [],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  }
];

module.exports = { fixtures };
