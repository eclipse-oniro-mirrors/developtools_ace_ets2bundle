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
    id: 'state-rejects-arrow',
    boundary: 'The State state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@State',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'states'
    }
  },
  {
    id: 'state-rejects-function-reference',
    boundary: 'The State state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@State',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'states'
    }
  },
  {
    id: 'state-rejects-parenthesized',
    boundary: 'The State state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@State',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'states'
    }
  },
  {
    id: 'state-accepts-numeric-state',
    boundary: 'A numeric State property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'states'
    }
  },
  {
    id: 'state-function-without-ui-check',
    boundary: 'Disabling UI validation preserves State collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'states'
    }
  },
  {
    id: 'prop-rejects-arrow',
    boundary: 'The Prop state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Prop',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'props'
    }
  },
  {
    id: 'prop-rejects-function-reference',
    boundary: 'The Prop state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Prop',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'props'
    }
  },
  {
    id: 'prop-rejects-parenthesized',
    boundary: 'The Prop state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Prop',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'props'
    }
  },
  {
    id: 'prop-accepts-numeric-state',
    boundary: 'A numeric Prop property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'props'
    }
  },
  {
    id: 'prop-function-without-ui-check',
    boundary: 'Disabling UI validation preserves Prop collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'props'
    }
  },
  {
    id: 'link-rejects-arrow',
    boundary: 'The Link state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Link',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'links'
    }
  },
  {
    id: 'link-rejects-function-reference',
    boundary: 'The Link state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Link',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'links'
    }
  },
  {
    id: 'link-rejects-parenthesized',
    boundary: 'The Link state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Link',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'links'
    }
  },
  {
    id: 'link-accepts-numeric-state',
    boundary: 'A numeric Link property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'links'
    }
  },
  {
    id: 'link-function-without-ui-check',
    boundary: 'Disabling UI validation preserves Link collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'links'
    }
  },
  {
    id: 'provide-rejects-arrow',
    boundary: 'The Provide state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Provide',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'provides'
    }
  },
  {
    id: 'provide-rejects-function-reference',
    boundary: 'The Provide state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Provide',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'provides'
    }
  },
  {
    id: 'provide-rejects-parenthesized',
    boundary: 'The Provide state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Provide',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'provides'
    }
  },
  {
    id: 'provide-accepts-numeric-state',
    boundary: 'A numeric Provide property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'provides'
    }
  },
  {
    id: 'provide-function-without-ui-check',
    boundary: 'Disabling UI validation preserves Provide collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'provides'
    }
  },
  {
    id: 'consume-rejects-arrow',
    boundary: 'The Consume state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Consume',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'consumes'
    }
  },
  {
    id: 'consume-rejects-function-reference',
    boundary: 'The Consume state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Consume',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'consumes'
    }
  },
  {
    id: 'consume-rejects-parenthesized',
    boundary: 'The Consume state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@Consume',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'consumes'
    }
  },
  {
    id: 'consume-accepts-numeric-state',
    boundary: 'A numeric Consume property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'consumes'
    }
  },
  {
    id: 'consume-function-without-ui-check',
    boundary: 'Disabling UI validation preserves Consume collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'consumes'
    }
  },
  {
    id: 'storageprop-rejects-arrow',
    boundary: 'The StorageProp state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageProps'
    }
  },
  {
    id: 'storageprop-rejects-function-reference',
    boundary: 'The StorageProp state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageProps'
    }
  },
  {
    id: 'storageprop-rejects-parenthesized',
    boundary: 'The StorageProp state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageProps'
    }
  },
  {
    id: 'storageprop-accepts-numeric-state',
    boundary: 'A numeric StorageProp property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'storageProps'
    }
  },
  {
    id: 'storageprop-function-without-ui-check',
    boundary: 'Disabling UI validation preserves StorageProp collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'storageProps'
    }
  },
  {
    id: 'storagelink-rejects-arrow',
    boundary: 'The StorageLink state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageLinks'
    }
  },
  {
    id: 'storagelink-rejects-function-reference',
    boundary: 'The StorageLink state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageLinks'
    }
  },
  {
    id: 'storagelink-rejects-parenthesized',
    boundary: 'The StorageLink state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@StorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'storageLinks'
    }
  },
  {
    id: 'storagelink-accepts-numeric-state',
    boundary: 'A numeric StorageLink property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'storageLinks'
    }
  },
  {
    id: 'storagelink-function-without-ui-check',
    boundary: 'Disabling UI validation preserves StorageLink collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'storageLinks'
    }
  },
  {
    id: 'localstorageprop-rejects-arrow',
    boundary: 'The LocalStorageProp state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstorageprop-rejects-function-reference',
    boundary: 'The LocalStorageProp state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstorageprop-rejects-parenthesized',
    boundary: 'The LocalStorageProp state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageProp',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstorageprop-accepts-numeric-state',
    boundary: 'A numeric LocalStorageProp property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstorageprop-function-without-ui-check',
    boundary: 'Disabling UI validation preserves LocalStorageProp collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstoragelink-rejects-arrow',
    boundary: 'The LocalStorageLink state contract rejects a arrow function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'localstoragelink-rejects-function-reference',
    boundary: 'The LocalStorageLink state contract rejects a function-reference function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') value: Function;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'localstoragelink-rejects-parenthesized',
    boundary: 'The LocalStorageLink state contract rejects a parenthesized function type during interop member collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') value: ((value: number) => void);
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: '10905363',
          fragments: [
            '@LocalStorageLink',
            'Function-type variable',
            '\'value\''
          ],
          line: 3,
          column: 3,
          type: 'ERROR'
        }
      ],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'localstoragelink-accepts-numeric-state',
    boundary: 'A numeric LocalStorageLink property remains collectible under the same UI validation guard.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'localstoragelink-function-without-ui-check',
    boundary: 'Disabling UI validation preserves LocalStorageLink collection while omitting its function diagnostic.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: false,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'link-private-access-warning',
    boundary: 'A private Link remains visible in the diagnostic at the decorated field.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link private value: number;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@Link',
            'and private'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'links'
    }
  },
  {
    id: 'consume-public-access-warning',
    boundary: 'Public access on Consume is reported with the property source location.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Consume public value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@Consume',
            'and public'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'consumes'
    }
  },
  {
    id: 'storageprop-public-access-warning',
    boundary: 'Public access on StorageProp is reported with the property source location.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageProp('value') public value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@StorageProp',
            'and public'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'storageProps'
    }
  },
  {
    id: 'storagelink-public-access-warning',
    boundary: 'Public access on StorageLink is reported with the property source location.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @StorageLink('value') public value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@StorageLink',
            'and public'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'storageLinks'
    }
  },
  {
    id: 'localstorageprop-public-access-warning',
    boundary: 'Public access on LocalStorageProp is reported with the property source location.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageProp('value') public value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@LocalStorageProp',
            'and public'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'localStorageProp'
    }
  },
  {
    id: 'localstoragelink-public-access-warning',
    boundary: 'Public access on LocalStorageLink is reported with the property source location.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @LocalStorageLink('value') public value: number = 1;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [
        {
          code: null,
          fragments: [
            '@LocalStorageLink',
            'and public'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'localStorageLink'
    }
  },
  {
    id: 'state-private-owned-property',
    boundary: 'The State private property is retained in both its semantic collection and private ownership.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State private value: number;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'states'
    }
  },
  {
    id: 'prop-private-owned-property',
    boundary: 'The Prop private property is retained in both its semantic collection and private ownership.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop private value: number;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'props'
    }
  },
  {
    id: 'provide-private-owned-property',
    boundary: 'The Provide private property is retained in both its semantic collection and private ownership.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide private value: number;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'provides'
    }
  },
  {
    id: 'builderparam-private-owned-property',
    boundary: 'The BuilderParam private property is retained in both its semantic collection and private ownership.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @BuilderParam private value: () => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'builderParams'
    }
  },
  {
    id: 'plain-function-property',
    boundary: 'An undecorated callback remains a regular property.',
    operation: 'collect',
    source: `@Component
export struct Card {
  value: (count: number) => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'regulars'
    }
  },
  {
    id: 'builder-function-property',
    boundary: 'A BuilderParam function is classified as a builder slot.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @BuilderParam value: (count: number) => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: 'builderParams'
    }
  },
  {
    id: 'event-function-property',
    boundary: 'A ComponentV2 event is collected without the V1 state-function restriction.',
    operation: 'collect',
    source: `@ComponentV2
export struct Card {
  @Event value: (count: number) => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: null
    }
  },
  {
    id: 'local-function-property',
    boundary: 'A ComponentV2 Local field stays outside the V1 forbidden decorator set.',
    operation: 'collect',
    source: `@ComponentV2
export struct Card {
  @Local value: (count: number) => void;
  build() {
    Text('card')
  }
}
`,
    uiCheck: true,
    property: 'value',
    expected: {
      properties: [
        'value'
      ],
      diagnostics: [],
      collection: null
    }
  }
];

module.exports = { fixtures };
