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
    id: 'same-basename-packages',
    boundary: 'Two package roots each supply Card.ets without cross-resolution.',
    providers: [
      {
        name: 'cards',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/cards',
        marker: 'left_same-basename-packages'
      },
      {
        name: 'dialogs',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/dialogs',
        marker: 'right_same-basename-packages'
      }
    ],
    requests: [
      {
        request: 'cards/Card',
        source: 'cards/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/cards/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'cards',
        marker: 'left_same-basename-packages'
      },
      {
        request: 'dialogs/Card',
        source: 'dialogs/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/dialogs/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'dialogs',
        marker: 'right_same-basename-packages'
      }
    ]
  },
  {
    id: 'near-matching-package-prefix',
    boundary: 'Card and card_extra must keep distinct declarations even with shared prefixes.',
    providers: [
      {
        name: 'card',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/card',
        marker: 'left_near-matching-package-prefix'
      },
      {
        name: 'card_extra',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/card_extra',
        marker: 'right_near-matching-package-prefix'
      }
    ],
    requests: [
      {
        request: 'card/Card',
        source: 'card/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/card/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'card',
        marker: 'left_near-matching-package-prefix'
      },
      {
        request: 'card_extra/Card',
        source: 'card_extra/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/card_extra/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'card_extra',
        marker: 'right_near-matching-package-prefix'
      }
    ]
  },
  {
    id: 'nested-directory-same-basename',
    boundary: 'A shared file basename must preserve subpath and provider.',
    providers: [
      {
        name: 'forms',
        source: 'src/main/ets/profile/Card.ets',
        declarations: 'generated/forms',
        marker: 'left_nested-directory-same-basename'
      },
      {
        name: 'lists',
        source: 'src/main/ets/summary/Card.ets',
        declarations: 'generated/lists',
        marker: 'right_nested-directory-same-basename'
      }
    ],
    requests: [
      {
        request: 'forms/profile/Card',
        source: 'forms/src/main/ets/profile/Card.ets',
        operation: 'query',
        expectedPath: 'generated/forms/src/main/ets/profile/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'forms',
        marker: 'left_nested-directory-same-basename'
      },
      {
        request: 'lists/summary/Card',
        source: 'lists/src/main/ets/summary/Card.ets',
        operation: 'query',
        expectedPath: 'generated/lists/src/main/ets/summary/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'lists',
        marker: 'right_nested-directory-same-basename'
      }
    ]
  },
  {
    id: 'two-same-directory-labels',
    boundary: 'Two independently owned nested cards resolve to their respective build outputs.',
    providers: [
      {
        name: 'layout',
        source: 'src/main/ets/view/Card.ets',
        declarations: 'generated/layout',
        marker: 'left_two-same-directory-labels'
      },
      {
        name: 'tiles',
        source: 'src/main/ets/view/Card.ets',
        declarations: 'generated/tiles',
        marker: 'right_two-same-directory-labels'
      }
    ],
    requests: [
      {
        request: 'layout/view/Card',
        source: 'layout/src/main/ets/view/Card.ets',
        operation: 'query',
        expectedPath: 'generated/layout/src/main/ets/view/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'layout',
        marker: 'left_two-same-directory-labels'
      },
      {
        request: 'tiles/view/Card',
        source: 'tiles/src/main/ets/view/Card.ets',
        operation: 'query',
        expectedPath: 'generated/tiles/src/main/ets/view/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'tiles',
        marker: 'right_two-same-directory-labels'
      }
    ]
  },
  {
    id: 'similar-suffix-packages',
    boundary: 'Shared suffixes keep different package ownership and module roots.',
    providers: [
      {
        name: 'text_card',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/text_card',
        marker: 'left_similar-suffix-packages'
      },
      {
        name: 'image_card',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/image_card',
        marker: 'right_similar-suffix-packages'
      }
    ],
    requests: [
      {
        request: 'text_card/Card',
        source: 'text_card/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/text_card/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'text_card',
        marker: 'left_similar-suffix-packages'
      },
      {
        request: 'image_card/Card',
        source: 'image_card/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/image_card/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'image_card',
        marker: 'right_similar-suffix-packages'
      }
    ]
  },
  {
    id: 'unicode-component-subpath',
    boundary: 'A Unicode directory is retained through the producer and adapter path.',
    providers: [
      {
        name: 'forms',
        source: 'src/main/ets/表单/Card.ets',
        declarations: 'generated/forms',
        marker: 'left_unicode-component-subpath'
      },
      {
        name: 'profiles',
        source: 'src/main/ets/卡片/Card.ets',
        declarations: 'generated/profiles',
        marker: 'right_unicode-component-subpath'
      }
    ],
    requests: [
      {
        request: 'forms/表单/Card',
        source: 'forms/src/main/ets/表单/Card.ets',
        operation: 'query',
        expectedPath: 'generated/forms/src/main/ets/表单/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'forms',
        marker: 'left_unicode-component-subpath'
      },
      {
        request: 'profiles/卡片/Card',
        source: 'profiles/src/main/ets/卡片/Card.ets',
        operation: 'query',
        expectedPath: 'generated/profiles/src/main/ets/卡片/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'profiles',
        marker: 'right_unicode-component-subpath'
      }
    ]
  },
  {
    id: 'space-in-parent-directory',
    boundary: 'Static declaration redirection retains spaces in nested names.',
    providers: [
      {
        name: 'layout',
        source: 'src/main/ets/Row Detail/Card.ets',
        declarations: 'generated/layout',
        marker: 'left_space-in-parent-directory'
      },
      {
        name: 'panels',
        source: 'src/main/ets/Grid Detail/Card.ets',
        declarations: 'generated/panels',
        marker: 'right_space-in-parent-directory'
      }
    ],
    requests: [
      {
        request: 'layout/Row Detail/Card',
        source: 'layout/src/main/ets/Row Detail/Card.ets',
        operation: 'query',
        expectedPath: 'generated/layout/src/main/ets/Row Detail/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'layout',
        marker: 'left_space-in-parent-directory'
      },
      {
        request: 'panels/Grid Detail/Card',
        source: 'panels/src/main/ets/Grid Detail/Card.ets',
        operation: 'query',
        expectedPath: 'generated/panels/src/main/ets/Grid Detail/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_space-in-parent-directory'
      }
    ]
  },
  {
    id: 'multi-dot-basename',
    boundary: 'Dotted filenames cannot be confused on the declaration suffix conversion.',
    providers: [
      {
        name: 'forms',
        source: 'src/main/ets/Form.Card.ets',
        declarations: 'generated/forms',
        marker: 'left_multi-dot-basename'
      },
      {
        name: 'controls',
        source: 'src/main/ets/View.Card.ets',
        declarations: 'generated/controls',
        marker: 'right_multi-dot-basename'
      }
    ],
    requests: [
      {
        request: 'forms/Form.Card',
        source: 'forms/src/main/ets/Form.Card.ets',
        operation: 'query',
        expectedPath: 'generated/forms/src/main/ets/Form.Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'forms',
        marker: 'left_multi-dot-basename'
      },
      {
        request: 'controls/View.Card',
        source: 'controls/src/main/ets/View.Card.ets',
        operation: 'query',
        expectedPath: 'generated/controls/src/main/ets/View.Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'controls',
        marker: 'right_multi-dot-basename'
      }
    ]
  },
  {
    id: 'unicode-file-basename',
    boundary: 'Non-English source basenames yield corresponding declaration path names.',
    providers: [
      {
        name: 'text',
        source: 'src/main/ets/摘要.ets',
        declarations: 'generated/text',
        marker: 'left_unicode-file-basename'
      },
      {
        name: 'status',
        source: 'src/main/ets/状态.ets',
        declarations: 'generated/status',
        marker: 'right_unicode-file-basename'
      }
    ],
    requests: [
      {
        request: 'text/摘要',
        source: 'text/src/main/ets/摘要.ets',
        operation: 'query',
        expectedPath: 'generated/text/src/main/ets/摘要.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'text',
        marker: 'left_unicode-file-basename'
      },
      {
        request: 'status/状态',
        source: 'status/src/main/ets/状态.ets',
        operation: 'query',
        expectedPath: 'generated/status/src/main/ets/状态.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'status',
        marker: 'right_unicode-file-basename'
      }
    ]
  },
  {
    id: 'extension-ats-and-ets',
    boundary: 'Both static source extensions map to the expected declaration counterpart.',
    providers: [
      {
        name: 'sta',
        source: 'src/main/ets/Card.ats',
        declarations: 'generated/sta',
        marker: 'left_extension-ats-and-ets'
      },
      {
        name: 'other',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/other',
        marker: 'right_extension-ats-and-ets'
      }
    ],
    requests: [
      {
        request: 'sta/Card',
        source: 'sta/src/main/ets/Card.ats',
        operation: 'query',
        expectedPath: 'generated/sta/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'sta',
        marker: 'left_extension-ats-and-ets'
      },
      {
        request: 'other/Card',
        source: 'other/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/other/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'other',
        marker: 'right_extension-ats-and-ets'
      }
    ]
  },
  {
    id: 'filename-with-spaces',
    boundary: 'The file basename is preserved alongside its package identity.',
    providers: [
      {
        name: 'sheet',
        source: 'src/main/ets/Main Card.ets',
        declarations: 'generated/sheet',
        marker: 'left_filename-with-spaces'
      },
      {
        name: 'popup',
        source: 'src/main/ets/Side Card.ets',
        declarations: 'generated/popup',
        marker: 'right_filename-with-spaces'
      }
    ],
    requests: [
      {
        request: 'sheet/Main Card',
        source: 'sheet/src/main/ets/Main Card.ets',
        operation: 'query',
        expectedPath: 'generated/sheet/src/main/ets/Main Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'sheet',
        marker: 'left_filename-with-spaces'
      },
      {
        request: 'popup/Side Card',
        source: 'popup/src/main/ets/Side Card.ets',
        operation: 'query',
        expectedPath: 'generated/popup/src/main/ets/Side Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'popup',
        marker: 'right_filename-with-spaces'
      }
    ]
  },
  {
    id: 'missing-same-basename',
    boundary: 'A missing declaration cannot fall back to another package with the same basename.',
    providers: [
      {
        name: 'provided',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/provided',
        marker: 'left_missing-same-basename'
      },
      {
        name: 'missing',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/missing',
        marker: 'right_missing-same-basename',
        missing: true
      }
    ],
    requests: [
      {
        request: 'provided/Card',
        source: 'provided/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/provided/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'provided',
        marker: 'left_missing-same-basename'
      },
      {
        request: 'missing/Card',
        source: 'missing/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: null,
        expectedLanguage: '1.2',
        expectedPackage: 'missing',
        missing: [
          'missing/Card'
        ]
      }
    ]
  },
  {
    id: 'missing-shared-prefix-package',
    boundary: 'A missing adapter in a prefix-sharing package remains isolated.',
    providers: [
      {
        name: 'cards',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/cards',
        marker: 'left_missing-shared-prefix-package'
      },
      {
        name: 'cards_more',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/cards_more',
        marker: 'right_missing-shared-prefix-package',
        missing: true
      }
    ],
    requests: [
      {
        request: 'cards/Card',
        source: 'cards/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: 'generated/cards/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'cards',
        marker: 'left_missing-shared-prefix-package'
      },
      {
        request: 'cards_more/Card',
        source: 'cards_more/src/main/ets/Card.ets',
        operation: 'query',
        expectedPath: null,
        expectedLanguage: '1.2',
        expectedPackage: 'cards_more',
        missing: [
          'cards_more/Card'
        ]
      }
    ]
  }
];

module.exports = { fixtures };
