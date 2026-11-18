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
    id: 'protected-plain-property',
    boundary: 'Protected access is diagnosed while the plain field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  protected value: number;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'regulars',
      requiredCollections: []
    }
  },
  {
    id: 'protected-state-property',
    boundary: 'Protected access is diagnosed while the state field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State protected value: number;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'states',
      requiredCollections: []
    }
  },
  {
    id: 'protected-prop-property',
    boundary: 'Protected access is diagnosed while the prop field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop protected value: number;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'props',
      requiredCollections: []
    }
  },
  {
    id: 'protected-link-property',
    boundary: 'Protected access is diagnosed while the link field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Link protected value: number;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'links',
      requiredCollections: []
    }
  },
  {
    id: 'protected-provide-property',
    boundary: 'Protected access is diagnosed while the provide field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Provide protected value: number;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'provides',
      requiredCollections: []
    }
  },
  {
    id: 'protected-builder-property',
    boundary: 'Protected access is diagnosed while the builder field retains its own collection.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @BuilderParam protected value: () => void;
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
            'member attributes',
            'protected'
          ],
          line: 3,
          column: 3,
          type: 'WARN'
        }
      ],
      collection: 'builderParams',
      requiredCollections: []
    }
  },
  {
    id: 'required-regular',
    boundary: 'Require registration preserves the regularInit contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Require value: number;
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
      collection: 'regulars',
      requiredCollections: [
        'regularInit'
      ]
    }
  },
  {
    id: 'required-state',
    boundary: 'Require registration preserves the stateInit contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Require @State value: number;
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
      collection: 'states',
      requiredCollections: [
        'stateInit'
      ]
    }
  },
  {
    id: 'required-prop',
    boundary: 'Require registration preserves the propData contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Require @Prop value: number;
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
      collection: 'props',
      requiredCollections: [
        'propData'
      ]
    }
  },
  {
    id: 'required-provide',
    boundary: 'Require registration preserves the provideInit contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Require @Provide value: number;
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
      collection: 'provides',
      requiredCollections: [
        'provideInit'
      ]
    }
  },
  {
    id: 'required-builder',
    boundary: 'Require registration preserves the builderParamData contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Require @BuilderParam value: () => void;
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
      collection: 'builderParams',
      requiredCollections: [
        'builderParamData'
      ]
    }
  },
  {
    id: 'state-require-order',
    boundary: 'Require registration preserves the stateInit contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @State @Require value: number;
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
      collection: 'states',
      requiredCollections: [
        'stateInit'
      ]
    }
  },
  {
    id: 'prop-require-order',
    boundary: 'Require registration preserves the propData contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @Prop @Require value: number;
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
      collection: 'props',
      requiredCollections: [
        'propData'
      ]
    }
  },
  {
    id: 'builder-require-order',
    boundary: 'Require registration preserves the builderParamData contract independently of decorator order.',
    operation: 'collect',
    source: `@Component
export struct Card {
  @BuilderParam @Require value: () => void;
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
      collection: 'builderParams',
      requiredCollections: [
        'builderParamData'
      ]
    }
  }
];

module.exports = { fixtures };
