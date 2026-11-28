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
    id: 'relative-source-siblings',
    boundary: 'Relative ATS lookup follows each caller directory rather than another module with the same filename.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/Card.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-siblings'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Card.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-siblings'
      }
    ],
    requests: [
      {
        request: './Card',
        source: 'widgets/src/main/ets/left/Card.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/left/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-siblings'
      },
      {
        request: './Card',
        source: 'panels/src/main/ets/right/Card.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/right/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-siblings'
      }
    ]
  },
  {
    id: 'relative-source-unicode',
    boundary: 'Relative socket lookup preserves directory characters.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/内容/卡片.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-unicode'
      },
      {
        name: 'panels',
        source: 'src/main/ets/摘要/卡片.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-unicode'
      }
    ],
    requests: [
      {
        request: './卡片',
        source: 'widgets/src/main/ets/内容/卡片.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/内容/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/内容/卡片.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-unicode'
      },
      {
        request: './卡片',
        source: 'panels/src/main/ets/摘要/卡片.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/摘要/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/摘要/卡片.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-unicode'
      }
    ]
  },
  {
    id: 'relative-source-space',
    boundary: 'A path with spaces remains inside its owning source directory.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/Visual Set/Main Card.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-space'
      },
      {
        name: 'panels',
        source: 'src/main/ets/Menu Set/Main Card.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-space'
      }
    ],
    requests: [
      {
        request: './Main Card',
        source: 'widgets/src/main/ets/Visual Set/Main Card.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/Visual Set/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/Visual Set/Main Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-space'
      },
      {
        request: './Main Card',
        source: 'panels/src/main/ets/Menu Set/Main Card.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/Menu Set/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/Menu Set/Main Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-space'
      }
    ]
  },
  {
    id: 'relative-source-dot-segments',
    boundary: 'Canonical path handling removes current-directory segments in each caller.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/tab/Card.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-dot-segments'
      },
      {
        name: 'panels',
        source: 'src/main/ets/list/Card.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-dot-segments'
      }
    ],
    requests: [
      {
        request: '././Card',
        source: 'widgets/src/main/ets/tab/Card.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/tab/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/tab/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-dot-segments'
      },
      {
        request: '././Card',
        source: 'panels/src/main/ets/list/Card.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/list/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/list/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-dot-segments'
      }
    ]
  },
  {
    id: 'relative-source-explicit-extension',
    boundary: 'An explicit ATS suffix is resolved without duplication.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/alpha/Item.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-explicit-extension'
      },
      {
        name: 'panels',
        source: 'src/main/ets/beta/Item.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-explicit-extension'
      }
    ],
    requests: [
      {
        request: './Item.ats',
        source: 'widgets/src/main/ets/alpha/Item.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/alpha/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/alpha/Item.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-explicit-extension'
      },
      {
        request: './Item.ats',
        source: 'panels/src/main/ets/beta/Item.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/beta/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/beta/Item.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-explicit-extension'
      }
    ]
  },
  {
    id: 'relative-source-alternate-names',
    boundary: 'Two local relative imports can select differently named files and still respect module ownership.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/shelf/Tile.ats',
        declarations: 'generated/widgets',
        marker: 'left_relative-source-alternate-names'
      },
      {
        name: 'panels',
        source: 'src/main/ets/menu/Deck.ats',
        declarations: 'generated/panels',
        marker: 'right_relative-source-alternate-names'
      }
    ],
    requests: [
      {
        request: './Tile',
        source: 'widgets/src/main/ets/shelf/Tile.ats',
        operation: 'relative',
        containing: 'widgets/src/main/ets/shelf/Caller.ets',
        expectedPath: 'generated/widgets/src/main/ets/shelf/Tile.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_relative-source-alternate-names'
      },
      {
        request: './Deck',
        source: 'panels/src/main/ets/menu/Deck.ats',
        operation: 'relative',
        containing: 'panels/src/main/ets/menu/Caller.ets',
        expectedPath: 'generated/panels/src/main/ets/menu/Deck.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_relative-source-alternate-names'
      }
    ]
  },
  {
    id: 'declaration-relative-siblings',
    boundary: 'A relative import in one generated declaration returns to its original source module.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/Card.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-relative-siblings'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Card.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-relative-siblings'
      }
    ],
    requests: [
      {
        request: './Card',
        source: 'widgets/src/main/ets/left/Card.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-relative-siblings'
      },
      {
        request: './Card',
        source: 'panels/src/main/ets/right/Card.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-relative-siblings'
      }
    ]
  },
  {
    id: 'declaration-relative-unicode',
    boundary: 'Reverse file mapping preserves a Unicode source directory.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/内容/块.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-relative-unicode'
      },
      {
        name: 'panels',
        source: 'src/main/ets/条目/块.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-relative-unicode'
      }
    ],
    requests: [
      {
        request: './块',
        source: 'widgets/src/main/ets/内容/块.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/内容/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/内容/块.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-relative-unicode'
      },
      {
        request: './块',
        source: 'panels/src/main/ets/条目/块.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/条目/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/条目/块.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-relative-unicode'
      }
    ]
  },
  {
    id: 'declaration-relative-space',
    boundary: 'Reverse file mapping preserves spaces and the correct source owner.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/Leaf View/View Cell.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-relative-space'
      },
      {
        name: 'panels',
        source: 'src/main/ets/Label View/View Cell.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-relative-space'
      }
    ],
    requests: [
      {
        request: './View Cell',
        source: 'widgets/src/main/ets/Leaf View/View Cell.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/Leaf View/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/Leaf View/View Cell.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-relative-space'
      },
      {
        request: './View Cell',
        source: 'panels/src/main/ets/Label View/View Cell.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/Label View/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/Label View/View Cell.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-relative-space'
      }
    ]
  },
  {
    id: 'declaration-relative-dots',
    boundary: 'The declaration-side relative import collapses dot segments safely.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/Item.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-relative-dots'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Item.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-relative-dots'
      }
    ],
    requests: [
      {
        request: '././Item',
        source: 'widgets/src/main/ets/left/Item.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/Item.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-relative-dots'
      },
      {
        request: '././Item',
        source: 'panels/src/main/ets/right/Item.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Item.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-relative-dots'
      }
    ]
  },
  {
    id: 'declaration-explicit-ets',
    boundary: 'Declaration side resolution uses an explicit .ets extension if present.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/Cell.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-explicit-ets'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Cell.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-explicit-ets'
      }
    ],
    requests: [
      {
        request: './Cell.ets',
        source: 'widgets/src/main/ets/left/Cell.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/Cell.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-explicit-ets'
      },
      {
        request: './Cell.ets',
        source: 'panels/src/main/ets/right/Cell.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Cell.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-explicit-ets'
      }
    ]
  },
  {
    id: 'declaration-dotted-file',
    boundary: 'Reverse mapping keeps internal dots in basenames.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/View.Card.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-dotted-file'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Form.Card.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-dotted-file'
      }
    ],
    requests: [
      {
        request: './View.Card',
        source: 'widgets/src/main/ets/left/View.Card.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/View.Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-dotted-file'
      },
      {
        request: './Form.Card',
        source: 'panels/src/main/ets/right/Form.Card.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Form.Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-dotted-file'
      }
    ]
  },
  {
    id: 'declaration-file-with-spaces',
    boundary: 'Two callers resolve separate basenames with spaces from their respective declarations.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/First Card.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-file-with-spaces'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/Second Card.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-file-with-spaces'
      }
    ],
    requests: [
      {
        request: './First Card',
        source: 'widgets/src/main/ets/left/First Card.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/First Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-file-with-spaces'
      },
      {
        request: './Second Card',
        source: 'panels/src/main/ets/right/Second Card.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/Second Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-file-with-spaces'
      }
    ]
  },
  {
    id: 'declaration-deep-sibling',
    boundary: 'Deep source files preserve their package and intermediate directories.',
    providers: [
      {
        name: 'widgets',
        source: 'src/main/ets/left/levels/views/Model.ets',
        declarations: 'generated/widgets',
        marker: 'left_declaration-deep-sibling'
      },
      {
        name: 'panels',
        source: 'src/main/ets/right/levels/views/Model.ets',
        declarations: 'generated/panels',
        marker: 'right_declaration-deep-sibling'
      }
    ],
    requests: [
      {
        request: './Model',
        source: 'widgets/src/main/ets/left/levels/views/Model.ets',
        operation: 'decl',
        containing: 'generated/widgets/src/main/ets/left/levels/views/Caller.d.ets',
        expectedPath: 'generated/widgets/src/main/ets/left/levels/views/Model.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'widgets',
        marker: 'left_declaration-deep-sibling'
      },
      {
        request: './Model',
        source: 'panels/src/main/ets/right/levels/views/Model.ets',
        operation: 'decl',
        containing: 'generated/panels/src/main/ets/right/levels/views/Caller.d.ets',
        expectedPath: 'generated/panels/src/main/ets/right/levels/views/Model.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'panels',
        marker: 'right_declaration-deep-sibling'
      }
    ]
  }
];

module.exports = { fixtures };
