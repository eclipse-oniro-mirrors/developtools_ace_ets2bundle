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
    'id': 'class-Card',
    'purpose': 'class export StaticCard binds Card while preserving runtime identity',
    'metadata': {
      'StaticCard': {
        'kind': 'class',
        'name': 'StaticCard',
        'runtimeName': 'Lcards/StaticCard;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'Card'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/StaticCard;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/StaticCard;'
      ],
      'forbidden': [
        'const StaticCard ='
      ],
      'sourceExports': [
        'StaticCard'
      ]
    },
    source: `import { StaticCard as Card } from "./Static";
globalThis.probe = [Card.identity];
`,
    staticSource: `'use static'
export class StaticCard {
  public static identity: string = "Lcards/StaticCard;";
}
`
  },
  {
    'id': 'class-StaticCard',
    'purpose': 'class export StaticCard binds StaticCard while preserving runtime identity',
    'metadata': {
      'StaticCard': {
        'kind': 'class',
        'name': 'StaticCard',
        'runtimeName': 'Lcards/StaticCard;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'StaticCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/StaticCard;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/StaticCard;'
      ],
      'forbidden': [],
      'sourceExports': [
        'StaticCard'
      ]
    },
    source: `import { StaticCard as StaticCard } from "./Static";
globalThis.probe = [StaticCard.identity];
`,
    staticSource: `'use static'
export class StaticCard {
  public static identity: string = "Lcards/StaticCard;";
}
`
  },
  {
    'id': 'function-createCard',
    'purpose': 'function export makeCard binds createCard while preserving runtime identity',
    'metadata': {
      'makeCard': {
        'kind': 'function',
        'name': 'makeCard',
        'runtimeName': 'Lcards/ETSGLOBAL;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'createCard'
      ],
      'lookups': [
        [
          'getFunction',
          'Lcards/ETSGLOBAL;',
          'makeCard'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/ETSGLOBAL;/makeCard/card'
      ],
      'forbidden': [
        'const makeCard ='
      ],
      'sourceExports': [
        'makeCard'
      ]
    },
    source: `import { makeCard as createCard } from "./Static";
globalThis.probe = [createCard('card')];
`,
    staticSource: `'use static'
export function makeCard(value: string): string {
  return "Lcards/ETSGLOBAL;/makeCard/" + value;
}
`
  },
  {
    'id': 'property-cardTheme',
    'purpose': 'property export theme binds cardTheme while preserving runtime identity',
    'metadata': {
      'theme': {
        'kind': 'property',
        'name': 'theme',
        'runtimeName': 'Lcards/ETSGLOBAL;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'theme': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'cardTheme'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/ETSGLOBAL;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'theme-blue'
      ],
      'forbidden': [
        'const theme ='
      ],
      'sourceExports': [
        'theme'
      ]
    },
    source: `import { theme as cardTheme } from "./Static";
globalThis.probe = [cardTheme];
`,
    staticSource: `'use static'
export const theme: string = 'theme-blue';
`
  },
  {
    'id': 'class-LocalCard',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/deep/module/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/deep/module/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/deep/module/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/deep/module/Card;";
}
`
  },
  {
    'id': 'class-CardAlias',
    'purpose': 'class export Card binds CardAlias while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/module with spaces/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'CardAlias'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/module with spaces/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/module with spaces/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as CardAlias } from "./Static";
globalThis.probe = [CardAlias.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/module with spaces/Card;";
}
`
  },
  {
    'id': 'class-卡片',
    'purpose': 'class export Card binds 卡片 while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/组件/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        '卡片'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/组件/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/组件/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as 卡片 } from "./Static";
globalThis.probe = [卡片.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/组件/Card;";
}
`
  },
  {
    'id': 'function-formatCard',
    'purpose': 'function export format binds formatCard while preserving runtime identity',
    'metadata': {
      'format': {
        'kind': 'function',
        'name': 'format',
        'runtimeName': 'Lcards/Format;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'formatCard'
      ],
      'lookups': [
        [
          'getFunction',
          'Lcards/Format;',
          'format'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Format;/format/card'
      ],
      'forbidden': [
        'const format ='
      ],
      'sourceExports': [
        'format'
      ]
    },
    source: `import { format as formatCard } from "./Static";
globalThis.probe = [formatCard('card')];
`,
    staticSource: `'use static'
export function format(value: string): string {
  return "Lcards/Format;/format/" + value;
}
`
  },
  {
    'id': 'property-cardLabel',
    'purpose': 'property export label binds cardLabel while preserving runtime identity',
    'metadata': {
      'label': {
        'kind': 'property',
        'name': 'label',
        'runtimeName': 'Lcards/Theme;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'label': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'cardLabel'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Theme;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'theme-blue'
      ],
      'forbidden': [
        'const label ='
      ],
      'sourceExports': [
        'label'
      ]
    },
    source: `import { label as cardLabel } from "./Static";
globalThis.probe = [cardLabel];
`,
    staticSource: `'use static'
export const label: string = 'theme-blue';
`
  },
  {
    'id': 'renamed-runtime-function',
    'purpose': 'function export format binds display while preserving runtime identity',
    'metadata': {
      'format': {
        'kind': 'function',
        'name': 'format',
        'localName': 'formatInternal',
        'runtimeName': 'Lcards/ETSGLOBAL;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'display'
      ],
      'lookups': [
        [
          'getFunction',
          'Lcards/ETSGLOBAL;',
          'formatInternal'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/ETSGLOBAL;/formatInternal/card'
      ],
      'forbidden': [
        'const format ='
      ],
      'sourceExports': [
        'format'
      ]
    },
    source: `import { format as display } from "./Static";
globalThis.probe = [display('card')];
`,
    staticSource: `'use static'
export function formatInternal(value: string): string {
  return "Lcards/ETSGLOBAL;/formatInternal/" + value;
}
export { formatInternal as format };
`
  },
  {
    'id': 'renamed-runtime-property',
    'purpose': 'property export label binds caption while preserving runtime identity',
    'metadata': {
      'label': {
        'kind': 'property',
        'name': 'label',
        'localName': 'actualLabel',
        'runtimeName': 'Lcards/Theme;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'actualLabel': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'caption'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Theme;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'theme-blue'
      ],
      'forbidden': [
        'const label ='
      ],
      'sourceExports': [
        'label'
      ]
    },
    source: `import { label as caption } from "./Static";
globalThis.probe = [caption];
`,
    staticSource: `'use static'
export const label: string = 'theme-blue';
`
  },
  {
    'id': 'explicit-ets-extension',
    'purpose': 'The real resolver retains an explicit .ets import when no matching suffixed candidate exists',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {},
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static.ets'
      ],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard } from "./Static.ets";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'trailing-comma',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard, } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'multiline-import',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import {
  Card as LocalCard
} from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'comment-between-bindings',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { /* imported name */ Card /* local alias */ as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'caller-query-independent',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard } from "./Static";
const marker = "Caller.ets?entry";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'body-local-shadow',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard } from "./Static";
function nested() { const LocalCard = "inner"; return LocalCard; }
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'runtime-name-escaped-quote',
    'purpose': 'class export Card binds LocalCard while preserving runtime identity',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/"quoted"/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/"quoted"/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/"quoted"/Card;'
      ],
      'forbidden': [
        'const Card ='
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/\\"quoted\\"/Card;";
}
`
  },
  {
    'id': '2-independent-exports',
    'purpose': 'Every import specifier keeps its own runtime record and local alias',
    'metadata': {
      'HeaderCard': {
        'kind': 'class',
        'name': 'HeaderCard',
        'runtimeName': 'Lcards/HeaderCard;'
      },
      'BodyCard': {
        'kind': 'class',
        'name': 'BodyCard',
        'runtimeName': 'Lcards/BodyCard;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalHeaderCard',
        'LocalBodyCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/HeaderCard;'
        ],
        [
          'getClass',
          'Lcards/BodyCard;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/HeaderCard;',
        'Lcards/BodyCard;'
      ],
      'sourceExports': [
        'HeaderCard',
        'BodyCard'
      ]
    },
    source: `import { HeaderCard as LocalHeaderCard, BodyCard as LocalBodyCard } from "./Static";
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity];
`,
    staticSource: `'use static'
export class HeaderCard {
  public static identity: string = "Lcards/HeaderCard;";
}
export class BodyCard {
  public static identity: string = "Lcards/BodyCard;";
}
`
  },
  {
    'id': '3-independent-exports',
    'purpose': 'Every import specifier keeps its own runtime record and local alias',
    'metadata': {
      'HeaderCard': {
        'kind': 'class',
        'name': 'HeaderCard',
        'runtimeName': 'Lcards/HeaderCard;'
      },
      'BodyCard': {
        'kind': 'class',
        'name': 'BodyCard',
        'runtimeName': 'Lcards/BodyCard;'
      },
      'FooterCard': {
        'kind': 'class',
        'name': 'FooterCard',
        'runtimeName': 'Lcards/FooterCard;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalHeaderCard',
        'LocalBodyCard',
        'LocalFooterCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/HeaderCard;'
        ],
        [
          'getClass',
          'Lcards/BodyCard;'
        ],
        [
          'getClass',
          'Lcards/FooterCard;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/HeaderCard;',
        'Lcards/BodyCard;',
        'Lcards/FooterCard;'
      ],
      'sourceExports': [
        'HeaderCard',
        'BodyCard',
        'FooterCard'
      ]
    },
    source: `import { HeaderCard as LocalHeaderCard, BodyCard as LocalBodyCard, FooterCard as LocalFooterCard } from "./Static";
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity, LocalFooterCard.identity];
`,
    staticSource: `'use static'
export class HeaderCard {
  public static identity: string = "Lcards/HeaderCard;";
}
export class BodyCard {
  public static identity: string = "Lcards/BodyCard;";
}
export class FooterCard {
  public static identity: string = "Lcards/FooterCard;";
}
`
  },
  {
    'id': '4-independent-exports',
    'purpose': 'Every import specifier keeps its own runtime record and local alias',
    'metadata': {
      'HeaderCard': {
        'kind': 'class',
        'name': 'HeaderCard',
        'runtimeName': 'Lcards/HeaderCard;'
      },
      'BodyCard': {
        'kind': 'class',
        'name': 'BodyCard',
        'runtimeName': 'Lcards/BodyCard;'
      },
      'FooterCard': {
        'kind': 'class',
        'name': 'FooterCard',
        'runtimeName': 'Lcards/FooterCard;'
      },
      'ActionCard': {
        'kind': 'class',
        'name': 'ActionCard',
        'runtimeName': 'Lcards/ActionCard;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'LocalHeaderCard',
        'LocalBodyCard',
        'LocalFooterCard',
        'LocalActionCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/HeaderCard;'
        ],
        [
          'getClass',
          'Lcards/BodyCard;'
        ],
        [
          'getClass',
          'Lcards/FooterCard;'
        ],
        [
          'getClass',
          'Lcards/ActionCard;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/HeaderCard;',
        'Lcards/BodyCard;',
        'Lcards/FooterCard;',
        'Lcards/ActionCard;'
      ],
      'sourceExports': [
        'HeaderCard',
        'BodyCard',
        'FooterCard',
        'ActionCard'
      ]
    },
    source: `import { HeaderCard as LocalHeaderCard, BodyCard as LocalBodyCard, FooterCard as LocalFooterCard, ActionCard as LocalActionCard } from "./Static";
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity, LocalFooterCard.identity, LocalActionCard.identity];
`,
    staticSource: `'use static'
export class HeaderCard {
  public static identity: string = "Lcards/HeaderCard;";
}
export class BodyCard {
  public static identity: string = "Lcards/BodyCard;";
}
export class FooterCard {
  public static identity: string = "Lcards/FooterCard;";
}
export class ActionCard {
  public static identity: string = "Lcards/ActionCard;";
}
`
  },
  {
    'id': 'one-export-2-aliases',
    'purpose': 'One exported class supports multiple independent local bindings',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'FirstCard',
        'SecondCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;',
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as FirstCard, Card as SecondCard } from "./Static";
globalThis.probe = [FirstCard.identity, SecondCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'one-export-3-aliases',
    'purpose': 'One exported class supports multiple independent local bindings',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'Card',
        'SecondCard',
        'ThirdCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;',
        'Lcards/Card;',
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as Card, Card as SecondCard, Card as ThirdCard } from "./Static";
globalThis.probe = [Card.identity, SecondCard.identity, ThirdCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'default-class',
    'purpose': 'class export default binds DefaultCard while preserving runtime identity',
    'metadata': {
      'default': {
        'kind': 'class',
        'name': 'default',
        'runtimeName': 'Lcards/Default;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'DefaultCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Default;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Default;'
      ],
      'forbidden': [
        'const default ='
      ],
      'sourceExports': [
        'default'
      ]
    },
    source: `import DefaultCard from "./Static";
globalThis.probe = [DefaultCard.identity];
`,
    staticSource: `'use static'
export class DefaultExport {
  public static identity: string = "Lcards/Default;";
}
export default DefaultExport;
`
  },
  {
    'id': 'default-function',
    'purpose': 'function export default binds DefaultCard while preserving runtime identity',
    'metadata': {
      'default': {
        'kind': 'function',
        'name': 'default',
        'localName': 'buildDefault',
        'runtimeName': 'Lcards/Default;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'DefaultCard'
      ],
      'lookups': [
        [
          'getFunction',
          'Lcards/Default;',
          'buildDefault'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Default;/buildDefault/card'
      ],
      'forbidden': [
        'const default ='
      ],
      'sourceExports': [
        'default'
      ]
    },
    source: `import DefaultCard from "./Static";
globalThis.probe = [DefaultCard('card')];
`,
    staticSource: `'use static'
export function buildDefault(value: string): string {
  return "Lcards/Default;/buildDefault/" + value;
}
export { buildDefault as DefaultExport };
export default DefaultExport;
`
  },
  {
    'id': 'default-property',
    'purpose': 'property export default binds DefaultCard while preserving runtime identity',
    'metadata': {
      'default': {
        'kind': 'property',
        'name': 'default',
        'localName': 'defaultTheme',
        'runtimeName': 'Lcards/Default;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'defaultTheme': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'DefaultCard'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Default;'
        ]
      ],
      'helpers': 1,
      'probe': [
        'theme-blue'
      ],
      'forbidden': [
        'const default ='
      ],
      'sourceExports': [
        'default'
      ]
    },
    source: `import DefaultCard from "./Static";
globalThis.probe = [DefaultCard];
`,
    staticSource: `'use static'
export const DefaultExport: string = 'theme-blue';
export default DefaultExport;
`
  },
  {
    'id': 'separate-import-helper-dedup',
    'purpose': 'Separate imports from the same file share exactly one helper pair',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      },
      'build': {
        'kind': 'function',
        'name': 'build',
        'runtimeName': 'Lcards/Global;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {},
    'expected': {
      'declarations': [
        'First',
        'make'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'build'
        ]
      ],
      'helpers': 1,
      'probe': [
        'Lcards/Card;',
        'Lcards/Global;/build/card'
      ],
      'sourceExports': [
        'Card',
        'build'
      ]
    },
    source: `import { Card as First } from "./Static";
import { build as make } from "././Static";
globalThis.probe = [First.identity, make("card")];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
export function build(value: string): string {
  return "Lcards/Global;/build/" + value;
}
`
  },
  {
    'id': 'unresolved-target',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {},
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Missing'
      ],
      'errors': [],
      'sourceExports': []
    },
    source: `import { Card } from "./Missing";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'dynamic-target-retained',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {},
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Dynamic'
      ],
      'errors': [],
      'sourceExports': []
    },
    source: `import { DynamicCard } from "./Dynamic";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'side-effect-static-import',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {},
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [],
      'sourceExports': []
    },
    source: `import "./Static";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'missing-metadata',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': null,
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [
        '10310026'
      ],
      'sourceExports': []
    },
    source: `import { Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'missing-export',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [
        '10310026'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Missing } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'atomic-missing-second-binding',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [
        '10310026'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card, Missing } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'unsupported-interface-kind',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {
      'Card': {
        'kind': 'interface',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export interface Card {
  value: number;
}
`
  },
  {
    'id': 'missing-runtime-record',
    'purpose': 'Preserve source import and emit only the exact supported diagnostic when replacement is unavailable',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card'
      }
    },
    'evaluate': false,
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "";
}
`
  }
];

module.exports = { fixtures };
