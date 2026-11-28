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
    id: 'binding-same-export-different-packages',
    boundary: 'Both imported Card classes resolve to the metadata of the selected package.',
    providers: [
      {
        packageName: 'cards',
        path: 'cards/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcards/Card;'
      },
      {
        packageName: 'dialogs',
        path: 'dialogs/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ldialogs/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./cards/Card";
import { Card as RightCard } from "./dialogs/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'cards/Card.ets',
      'dialogs/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lcards/Card;'
      ],
      [
        'getClass',
        'Ldialogs/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lcards/Card;',
      'Ldialogs/Card;'
    ]
  },
  {
    id: 'binding-common-package-prefix',
    boundary: 'A longer package prefix cannot reuse the shorter package runtime class.',
    providers: [
      {
        packageName: 'card',
        path: 'card/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcard/Card;'
      },
      {
        packageName: 'card_more',
        path: 'card_more/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcard_more/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./card/Card";
import { Card as RightCard } from "./card_more/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'card/Card.ets',
      'card_more/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lcard/Card;'
      ],
      [
        'getClass',
        'Lcard_more/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lcard/Card;',
      'Lcard_more/Card;'
    ]
  },
  {
    id: 'binding-nested-same-basename',
    boundary: 'Nested source paths preserve their module owner while binding local aliases.',
    providers: [
      {
        packageName: 'forms',
        path: 'forms/profile/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lforms/Card;'
      },
      {
        packageName: 'lists',
        path: 'lists/summary/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Llists/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./forms/profile/Card";
import { Card as RightCard } from "./lists/summary/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'forms/profile/Card.ets',
      'lists/summary/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lforms/Card;'
      ],
      [
        'getClass',
        'Llists/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lforms/Card;',
      'Llists/Card;'
    ]
  },
  {
    id: 'binding-unicode-paths',
    boundary: 'Unicode source directories must address the matching absolute metadata key.',
    providers: [
      {
        packageName: 'text',
        path: 'text/内容/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ltext/Card;'
      },
      {
        packageName: 'labels',
        path: 'labels/摘要/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Llabels/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./text/内容/Card";
import { Card as RightCard } from "./labels/摘要/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'text/内容/Card.ets',
      'labels/摘要/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Ltext/Card;'
      ],
      [
        'getClass',
        'Llabels/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Ltext/Card;',
      'Llabels/Card;'
    ]
  },
  {
    id: 'binding-space-paths',
    boundary: 'Whitespace in source directories must survive both resolution and metadata lookup.',
    providers: [
      {
        packageName: 'detail',
        path: 'detail/Main View/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ldetail/Card;'
      },
      {
        packageName: 'summary',
        path: 'summary/Side View/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lsummary/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./detail/Main View/Card";
import { Card as RightCard } from "./summary/Side View/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'detail/Main View/Card.ets',
      'summary/Side View/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Ldetail/Card;'
      ],
      [
        'getClass',
        'Lsummary/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Ldetail/Card;',
      'Lsummary/Card;'
    ]
  },
  {
    id: 'binding-dotted-filenames',
    boundary: 'Multiple dots in a basename must retain the selected runtime record.',
    providers: [
      {
        packageName: 'main',
        path: 'main/View.Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lmain/Card;'
      },
      {
        packageName: 'aside',
        path: 'aside/Part.Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Laside/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./main/View.Card";
import { Card as RightCard } from "./aside/Part.Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'main/View.Card.ets',
      'aside/Part.Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lmain/Card;'
      ],
      [
        'getClass',
        'Laside/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lmain/Card;',
      'Laside/Card;'
    ]
  },
  {
    id: 'binding-namespace-roots',
    boundary: 'Namespaces keep same-named exports attached to independent runtime classes.',
    providers: [
      {
        packageName: 'catalog',
        path: 'catalog/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcatalog/Card;'
      },
      {
        packageName: 'inventory',
        path: 'inventory/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Linventory/Card;'
      }
    ],
    source: `import * as Left from "./catalog/Card";
import * as Right from "./inventory/Card";
globalThis.probe = [Left.Card.identity, Right.Card.identity];
`,
    resolved: [
      'catalog/Card.ets',
      'inventory/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lcatalog/Card;'
      ],
      [
        'getClass',
        'Linventory/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lcatalog/Card;',
      'Linventory/Card;'
    ]
  },
  {
    id: 'binding-namespace-and-alias',
    boundary: 'A namespace binding and a named alias can consume two distinct Card exports.',
    providers: [
      {
        packageName: 'catalog',
        path: 'catalog/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcatalog/Card;'
      },
      {
        packageName: 'inventory',
        path: 'inventory/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Linventory/Card;'
      }
    ],
    source: `import * as Left from "./catalog/Card";
import { Card as Right } from "./inventory/Card";
globalThis.probe = [Left.Card.identity, Right.identity];
`,
    resolved: [
      'catalog/Card.ets',
      'inventory/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lcatalog/Card;'
      ],
      [
        'getClass',
        'Linventory/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lcatalog/Card;',
      'Linventory/Card;'
    ]
  },
  {
    id: 'binding-same-function-export',
    boundary: 'Same-named functions retain their owning record and method after aliasing.',
    providers: [
      {
        packageName: 'left',
        path: 'left/API.ets',
        symbol: 'read',
        kind: 'function',
        record: 'Lleft/ETSGLOBAL;'
      },
      {
        packageName: 'right',
        path: 'right/API.ets',
        symbol: 'read',
        kind: 'function',
        record: 'Lright/ETSGLOBAL;'
      }
    ],
    source: `import { read as leftRead } from "./left/API";
import { read as rightRead } from "./right/API";
globalThis.probe = [leftRead("a"), rightRead("b")];
`,
    resolved: [
      'left/API.ets',
      'right/API.ets'
    ],
    lookups: [
      [
        'getFunction',
        'Lleft/ETSGLOBAL;',
        'read'
      ],
      [
        'getFunction',
        'Lright/ETSGLOBAL;',
        'read'
      ]
    ],
    evaluate: true,
    probe: [
      'Lleft/ETSGLOBAL;/read/a',
      'Lright/ETSGLOBAL;/read/b'
    ]
  },
  {
    id: 'binding-missing-provider-metadata',
    boundary: 'Missing metadata for one provider preserves only that import and reports its full path.',
    providers: [
      {
        packageName: 'provided',
        path: 'provided/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lprovided/Card;'
      },
      {
        packageName: 'missing',
        path: 'missing/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lmissing/Card;',
        missingMetadata: true
      }
    ],
    source: `import { Card as LeftCard } from "./provided/Card";
import { Card as RightCard } from "./missing/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'provided/Card.ets',
      'missing/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lprovided/Card;'
      ]
    ],
    evaluate: false,
    probe: [
      'Lprovided/Card;'
    ],
    retainedImports: [
      './missing/Card'
    ],
    errorCount: 1,
    errorTarget: '/missing/Card.ets'
  },
  {
    id: 'binding-missing-export-entry',
    boundary: 'An absent export entry cannot bind a same-named export from another module.',
    providers: [
      {
        packageName: 'primary',
        path: 'primary/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lprimary/Card;'
      },
      {
        packageName: 'secondary',
        path: 'secondary/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lsecondary/Card;',
        metadataSymbol: 'Other'
      }
    ],
    source: `import { Card as LeftCard } from "./primary/Card";
import { Card as RightCard } from "./secondary/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'primary/Card.ets',
      'secondary/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lprimary/Card;'
      ]
    ],
    evaluate: false,
    probe: [
      'Lprimary/Card;'
    ],
    retainedImports: [
      './secondary/Card'
    ],
    errorCount: 1,
    errorTarget: '/secondary/Card.ets'
  },
  {
    id: 'binding-dynamic-provider-control',
    boundary: 'Language classification leaves the dynamic provider import intact beside a static replacement.',
    providers: [
      {
        packageName: 'static_card',
        path: 'static_card/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lstatic_card/Card;'
      },
      {
        packageName: 'dynamic_card',
        path: 'dynamic_card/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ldynamic_card/Card;',
        dynamic: true
      }
    ],
    source: `import { Card as LeftCard } from "./static_card/Card";
import { Card as RightCard } from "./dynamic_card/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'static_card/Card.ets',
      'dynamic_card/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lstatic_card/Card;'
      ]
    ],
    evaluate: false,
    probe: [
      'Lstatic_card/Card;'
    ],
    retainedImports: [
      './dynamic_card/Card'
    ]
  },
  {
    id: 'binding-importer-query',
    boundary: 'A Rollup importer query is removed before relative source resolution.',
    providers: [
      {
        packageName: 'one',
        path: 'one/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lone/Card;'
      },
      {
        packageName: 'two',
        path: 'two/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ltwo/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./one/Card";
import { Card as RightCard } from "./two/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'one/Card.ets',
      'two/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lone/Card;'
      ],
      [
        'getClass',
        'Ltwo/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lone/Card;',
      'Ltwo/Card;'
    ],
    importerQuery: '?entry'
  },
  {
    id: 'binding-type-only-control',
    boundary: 'A type-only import emits no runtime lookup while its source still resolves to the selected package.',
    providers: [
      {
        packageName: 'typed',
        path: 'typed/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ltyped/Card;'
      },
      {
        packageName: 'types',
        path: 'types/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Ltypes/Card;'
      }
    ],
    source: `import { Card as ValueCard } from "./typed/Card";
import type { Card as TypeCard } from "./types/Card";
globalThis.probe = [ValueCard.identity];
`,
    resolved: [
      'typed/Card.ets',
      'types/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Ltyped/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Ltyped/Card;'
    ]
  },
  {
    id: 'binding-configured-source-aliases',
    boundary: 'Explicit paths aliases select separate source files before static metadata binding.',
    providers: [
      {
        packageName: 'alias_left',
        path: 'alias_left/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lalias_left/Card;'
      },
      {
        packageName: 'alias_right',
        path: 'alias_right/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lalias_right/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "@left";
import { Card as RightCard } from "@right";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'alias_left/Card.ets',
      'alias_right/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lalias_left/Card;'
      ],
      [
        'getClass',
        'Lalias_right/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lalias_left/Card;',
      'Lalias_right/Card;'
    ],
    aliases: {
      '@left': [
        'alias_left/Card.ets'
      ],
      '@right': [
        'alias_right/Card.ets'
      ]
    }
  },
  {
    id: 'binding-normalized-dot-segments',
    boundary: 'Equivalent relative path spellings match the canonical metadata keys of both providers.',
    providers: [
      {
        packageName: 'canonical',
        path: 'canonical/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lcanonical/Card;'
      },
      {
        packageName: 'normalized',
        path: 'normalized/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lnormalized/Card;'
      }
    ],
    source: `import { Card as LeftCard } from "./canonical/./Card";
import { Card as RightCard } from "./normalized/../normalized/Card";
globalThis.probe = [LeftCard.identity, RightCard.identity];
`,
    resolved: [
      'canonical/Card.ets',
      'normalized/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lcanonical/Card;'
      ],
      [
        'getClass',
        'Lnormalized/Card;'
      ]
    ],
    evaluate: true,
    probe: [
      'Lcanonical/Card;',
      'Lnormalized/Card;'
    ]
  },
  {
    id: 'binding-distinct-export-kinds',
    boundary: 'The same exported spelling selects a class lookup in one module and a function lookup in the other.',
    providers: [
      {
        packageName: 'class_provider',
        path: 'class_provider/Card.ets',
        symbol: 'Card',
        kind: 'class',
        record: 'Lclass_provider/Card;'
      },
      {
        packageName: 'function_provider',
        path: 'function_provider/Card.ets',
        symbol: 'Card',
        kind: 'function',
        record: 'Lfunction_provider/ETSGLOBAL;'
      }
    ],
    source: `import { Card as LeftCard } from "./class_provider/Card";
import { Card as RightCard } from "./function_provider/Card";
globalThis.probe = [LeftCard.identity, RightCard("mixed")];
`,
    resolved: [
      'class_provider/Card.ets',
      'function_provider/Card.ets'
    ],
    lookups: [
      [
        'getClass',
        'Lclass_provider/Card;'
      ],
      [
        'getFunction',
        'Lfunction_provider/ETSGLOBAL;',
        'Card'
      ]
    ],
    evaluate: true,
    probe: [
      'Lclass_provider/Card;',
      'Lfunction_provider/ETSGLOBAL;/Card/mixed'
    ]
  }
];

module.exports = { fixtures };
