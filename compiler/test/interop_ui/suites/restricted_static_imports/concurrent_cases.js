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
    id: 'dynamic-import-concurrent',
    boundary: 'A concurrent body containing only import() does not create a static self bridge.',
    source: `function task() { 'use concurrent'; return import('./Static'); }
`,
    concurrent: true,
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
    id: 'concurrent-constructor',
    boundary: 'Construction in a marked concurrent body exports and self-imports its generated class binding.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-value-return',
    boundary: 'Returning an imported constructor is a concurrent value use.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return Card; }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-static-access',
    boundary: 'A static property access uses its imported receiver as a value.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return Card.count; }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-shorthand-object',
    boundary: 'A shorthand object field reads the imported value.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return { Card }; }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-array-element',
    boundary: 'An array element reads the imported value.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return [Card]; }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-nested-arrow',
    boundary: 'A nested arrow inside a marked body retains its enclosing concurrent context.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return () => new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-nested-function',
    boundary: 'A nested ordinary function remains within the marked body traversal.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; function nested() { return new Card(); } return nested(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-function-expression',
    boundary: 'A block-bodied function expression can carry the concurrent directive.',
    source: `import { Card } from './Static';
const task = function() { 'use concurrent'; return new Card(); };
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-arrow-block',
    boundary: 'A block-bodied arrow recognizes the leading concurrent directive.',
    source: `import { Card } from './Static';
const task = () => { 'use concurrent'; return new Card(); };
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-method-body',
    boundary: 'A method body recognizes the same leading concurrent directive.',
    source: `import { Card } from './Static';
class Host { task() { 'use concurrent'; return new Card(); } }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getClass'
      ],
      absent: []
    }
  },
  {
    id: 'ordinary-function-control',
    boundary: 'An ordinary function does not require the concurrent self bridge.',
    source: `import { Card } from './Static';
function task() { return new Card(); }
`,
    concurrent: true,
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
  },
  {
    id: 'late-directive-control',
    boundary: 'A non-leading concurrent string does not activate directive handling.',
    source: `import { Card } from './Static';
function task() { const ready = true; 'use concurrent'; return new Card(); }
`,
    concurrent: true,
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
  },
  {
    id: 'other-directive-control',
    boundary: 'An unrelated directive does not activate concurrent traversal.',
    source: `import { Card } from './Static';
function task() { 'use strict'; return new Card(); }
`,
    concurrent: true,
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
  },
  {
    id: 'expression-arrow-control',
    boundary: 'An expression-bodied arrow has no directive prologue.',
    source: `import { Card } from './Static';
const task = () => new Card();
`,
    concurrent: true,
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
  },
  {
    id: 'type-reference-control',
    boundary: 'A type reference inside a concurrent body is excluded from value uses.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; let value: Card | undefined; return value; }
`,
    concurrent: true,
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
  },
  {
    id: 'property-name-control',
    boundary: 'A property-access name is excluded from imported value uses.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; const model = { Card: 1 }; return model.Card; }
`,
    concurrent: true,
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
    },
    knownFailure: {
      code: 'CONCURRENT_PROPERTY_KEY_FALSE_BRIDGE',
      observed: [
        '__staticInteropConcurrent_Card'
      ],
      message: 'A non-shorthand object property key is treated as an imported concurrent value and creates an unnecessary self bridge.'
    }
  },
  {
    id: 'parameter-name-control',
    boundary: 'A parameter declaration name does not create an imported value bridge.',
    source: `import { Card } from './Static';
function task(Card: number) { 'use concurrent'; return 1; }
`,
    concurrent: true,
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
  },
  {
    id: 'variable-name-control',
    boundary: 'A variable declaration name is excluded when no value use follows.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; const Card = 1; return 2; }
`,
    concurrent: true,
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
  },
  {
    id: 'function-name-control',
    boundary: 'A nested function declaration name alone is excluded from imported value use.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; function Card() {} return 1; }
`,
    concurrent: true,
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
  },
  {
    id: 'class-name-control',
    boundary: 'A nested class declaration name alone is excluded from imported value use.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; class Card {} return 1; }
`,
    concurrent: true,
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
  },
  {
    id: 'concurrent-aliased-binding',
    boundary: 'A concurrent self bridge exports the local alias while retaining the original static record.',
    source: `import { Card as LocalCard } from './Static';
function task() { 'use concurrent'; return new LocalCard(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_LocalCard'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Lcards/Card;'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-one-collision',
    boundary: 'A preexisting bridge identifier requires a unique suffix.',
    source: `import { Card } from './Static';
const __staticInteropConcurrent_Card = 1;
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card_1'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        '__staticInteropConcurrent_Card_1'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-two-collisions',
    boundary: 'The next available suffix is selected after two name collisions.',
    source: `import { Card } from './Static';
const __staticInteropConcurrent_Card = 1;
const __staticInteropConcurrent_Card_1 = 2;
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card_2'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        '__staticInteropConcurrent_Card_2'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-type-name-collision',
    boundary: 'A type identifier also occupies the generated bridge name.',
    source: `import { Card } from './Static';
type __staticInteropConcurrent_Card = number;
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card_1'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        '__staticInteropConcurrent_Card_1'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-parameter-name-collision',
    boundary: 'An existing parameter identifier also reserves the bridge name.',
    source: `import { Card } from './Static';
function other(__staticInteropConcurrent_Card: number) {}
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card_1'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        '__staticInteropConcurrent_Card_1'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-function-binding',
    boundary: 'A function metadata binding receives its own self bridge in a concurrent body.',
    source: `import { format } from './Static';
function task() { 'use concurrent'; return format('card'); }
`,
    concurrent: true,
    metadata: {
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_format'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [
        'Panda.getFunction'
      ],
      absent: []
    }
  },
  {
    id: 'concurrent-multiple-bindings',
    boundary: 'Two concurrently used imports share one self import and preserve separate exported bridge names.',
    source: `import { Card, format } from './Static';
function task() { 'use concurrent'; return format(new Card().toString()); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card',
        '__staticInteropConcurrent_format'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-used-subset',
    boundary: 'Only a value actually read in the concurrent body receives a self bridge.',
    source: `import { Card, format } from './Static';
function ordinary() { return format('card'); }
function task() { 'use concurrent'; return new Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-computed-property-key',
    boundary: 'A computed object key reads the imported class value and therefore needs its self bridge.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return { [Card.name]: 1 }; }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-quoted-property-key',
    boundary: 'A quoted literal property key cannot read an imported value.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return { 'Card': 1 }; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-binding-property-name',
    boundary: 'A destructuring property selector remains a binding name rather than a static value read.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; const model = { value: 1 }; const { Card: selected } = model; return selected; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-object-method-name',
    boundary: 'An object method declaration name does not activate an imported static binding.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; return { Card() { return 1; } }; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-type-only-import',
    boundary: 'A type-only static import cannot produce a concurrent runtime declaration.',
    source: `import type { Card } from './Static';
function task() { 'use concurrent'; let value: Card | undefined; return value; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-specifier-type-only-import',
    boundary: 'Specifier-level type-only bindings are removed before concurrent bridge selection.',
    source: `import { type Card } from './Static';
function task() { 'use concurrent'; let value: Card | undefined; return value; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-dynamic-import-with-value',
    boundary: 'A static class value and an import() expression preserve their separate AST contracts.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; const value = new Card(); return import('./Static'); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 1,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-namespace-binding',
    boundary: 'A namespace value read in a concurrent body receives an exported namespace self bridge.',
    source: `import * as cards from './Static';
function task() { 'use concurrent'; return new cards.Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_cards'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-namespace-function',
    boundary: 'A namespace function receiver is a concurrent value even when its property name is excluded.',
    source: `import * as cards from './Static';
function task() { 'use concurrent'; return cards.format('ready'); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_cards'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-property-binding',
    boundary: 'A generated property binding keeps its own record and receives a self bridge when read.',
    source: `import { enabled } from './Static';
function task() { 'use concurrent'; return enabled; }
`,
    concurrent: true,
    metadata: {
      enabled: {
        kind: 'property',
        name: 'enabled',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_enabled'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-parameter-shadows-static-binding',
    boundary: 'Lexically shadowed local values must not export the unrelated imported binding.',
    source: `import { Card } from './Static';
function task(Card: number) { 'use concurrent'; return Card; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    },
    knownFailure: {
      code: 'CONCURRENT_SHADOWED_BINDING_FALSE_BRIDGE',
      observed: [
        '__staticInteropConcurrent_Card'
      ],
      message: 'A parameter-scoped value is incorrectly attributed to the imported static binding.'
    }
  },
  {
    id: 'concurrent-local-variable-shadows-static-binding',
    boundary: 'Lexically shadowed local values must not export the unrelated imported binding.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; const Card = 1; return Card; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    },
    knownFailure: {
      code: 'CONCURRENT_SHADOWED_BINDING_FALSE_BRIDGE',
      observed: [
        '__staticInteropConcurrent_Card'
      ],
      message: 'A local variable value is incorrectly attributed to the imported static binding.'
    }
  },
  {
    id: 'concurrent-default-import',
    boundary: 'A static default class import uses its local name for the concurrent bridge.',
    source: `import DefaultCard from './Static';
function task() { 'use concurrent'; return new DefaultCard(); }
`,
    concurrent: true,
    metadata: {
      default: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_DefaultCard'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-default-and-named-import',
    boundary: 'Default and named bindings preserve separate self-import aliases in the same concurrent body.',
    source: `import DefaultCard, { Card } from './Static';
function task() { 'use concurrent'; return [new DefaultCard(), new Card()]; }
`,
    concurrent: true,
    metadata: {
      default: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_DefaultCard',
        '__staticInteropConcurrent_Card'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-namespace-name-collision',
    boundary: 'A namespace bridge avoids an existing identifier with its preferred export name.',
    source: `import * as cards from './Static';
const __staticInteropConcurrent_cards = 1;
function task() { 'use concurrent'; return new cards.Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_cards_1'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-namespace-double-collision',
    boundary: 'A namespace bridge advances through both occupied suffixes.',
    source: `import * as cards from './Static';
const __staticInteropConcurrent_cards = 1;
const __staticInteropConcurrent_cards_1 = 2;
function task() { 'use concurrent'; return new cards.Card(); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_cards_2'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-type-query-value-control',
    boundary: 'A type query must not export the unrelated runtime binding from a concurrent body.',
    source: `import { Card } from './Static';
function task() { 'use concurrent'; type Kind = typeof Card; return 1; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    },
    knownFailure: {
      code: 'CONCURRENT_TYPE_QUERY_FALSE_BRIDGE',
      observed: [
        '__staticInteropConcurrent_Card'
      ],
      message: 'A type-query identifier is treated as a concurrent runtime value and creates an unnecessary self bridge.'
    }
  },
  {
    id: 'concurrent-import-type-query-control',
    boundary: 'An import type node remains outside runtime dynamic import and static bridge generation.',
    source: `type Kind = import('./Static').Card;
function task() { 'use concurrent'; return 1; }
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-empty-body-control',
    boundary: 'An empty function body does not activate concurrent traversal for a separate top-level static use.',
    source: `import { Card } from './Static';
const card = new Card();
function task() {}
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-empty-arrow-block-control',
    boundary: 'An empty arrow block leaves the top-level imported constructor unchanged.',
    source: `import { Card } from './Static';
const card = new Card();
const task = () => {};
`,
    concurrent: true,
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
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-mixed-type-and-value',
    boundary: 'Specifier-level type imports stay erased while the actual function value receives its own bridge.',
    source: `import { type Card, format } from './Static';
function task() { 'use concurrent'; let value: Card | undefined; return format('ready'); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_format'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-separate-import-statements',
    boundary: 'Two independent static import statements contribute to one concurrent self import.',
    source: `import { Card } from './Static';
import { format } from './Static';
function task() { 'use concurrent'; return format(new Card().toString()); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card',
        '__staticInteropConcurrent_format'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  },
  {
    id: 'concurrent-separate-function-bodies',
    boundary: 'Value uses in separate marked functions contribute their own bridges without duplicate self imports.',
    source: `import { Card, format } from './Static';
function make() { 'use concurrent'; return new Card(); }
function label() { 'use concurrent'; return format('ready'); }
`,
    concurrent: true,
    metadata: {
      Card: {
        kind: 'class',
        name: 'Card',
        runtimeName: 'Lcards/Card;'
      },
      format: {
        kind: 'function',
        name: 'format',
        runtimeName: 'Lcards/Global;'
      }
    },
    expected: {
      bridges: [
        '__staticInteropConcurrent_Card',
        '__staticInteropConcurrent_format'
      ],
      imports: [
        './Caller'
      ],
      dynamicImports: 0,
      reexports: 0,
      errors: [],
      contains: [],
      absent: []
    }
  }
];

module.exports = { fixtures };
