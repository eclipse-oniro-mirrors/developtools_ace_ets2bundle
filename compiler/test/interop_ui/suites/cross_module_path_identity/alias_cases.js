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
    id: 'cross-namespace-alias',
    boundary: 'A scoped alias resolves its configured source before static redirection.',
    providers: [
      {
        name: 'catalog',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/catalog',
        marker: 'left_cross-namespace-alias'
      },
      {
        name: 'inventory',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/inventory',
        marker: 'right_cross-namespace-alias'
      }
    ],
    aliases: {
      '@left/Card': [
        'catalog/src/main/ets/Card.ets'
      ],
      '@right/Card': [
        'inventory/src/main/ets/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'catalog/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/catalog/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'catalog',
        marker: 'left_cross-namespace-alias'
      },
      {
        request: '@right/Card',
        source: 'inventory/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/inventory/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'inventory',
        marker: 'right_cross-namespace-alias'
      }
    ]
  },
  {
    id: 'aliased-unicode-subpaths',
    boundary: 'Alias target lookup preserves Unicode path normalization.',
    providers: [
      {
        name: 'left',
        source: 'src/main/ets/组件/Card.ets',
        declarations: 'generated/left',
        marker: 'left_aliased-unicode-subpaths'
      },
      {
        name: 'right',
        source: 'src/main/ets/视图/Card.ets',
        declarations: 'generated/right',
        marker: 'right_aliased-unicode-subpaths'
      }
    ],
    aliases: {
      '@left/Card': [
        'left/src/main/ets/组件/Card.ets'
      ],
      '@right/Card': [
        'right/src/main/ets/视图/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'left/src/main/ets/组件/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/left/src/main/ets/组件/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'left',
        marker: 'left_aliased-unicode-subpaths'
      },
      {
        request: '@right/Card',
        source: 'right/src/main/ets/视图/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/right/src/main/ets/视图/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'right',
        marker: 'right_aliased-unicode-subpaths'
      }
    ]
  },
  {
    id: 'aliased-deep-subpaths',
    boundary: 'Alias resolution retains every level in the requested package.',
    providers: [
      {
        name: 'stage',
        source: 'src/main/ets/widget/common/Card.ets',
        declarations: 'generated/stage',
        marker: 'left_aliased-deep-subpaths'
      },
      {
        name: 'desktop',
        source: 'src/main/ets/layout/common/Card.ets',
        declarations: 'generated/desktop',
        marker: 'right_aliased-deep-subpaths'
      }
    ],
    aliases: {
      '@left/Card': [
        'stage/src/main/ets/widget/common/Card.ets'
      ],
      '@right/Card': [
        'desktop/src/main/ets/layout/common/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'stage/src/main/ets/widget/common/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/stage/src/main/ets/widget/common/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'stage',
        marker: 'left_aliased-deep-subpaths'
      },
      {
        request: '@right/Card',
        source: 'desktop/src/main/ets/layout/common/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/desktop/src/main/ets/layout/common/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'desktop',
        marker: 'right_aliased-deep-subpaths'
      }
    ]
  },
  {
    id: 'alias-space-subpaths',
    boundary: 'Configured aliases preserve spaces in static source directories.',
    providers: [
      {
        name: 'detail',
        source: 'src/main/ets/View Detail/Card.ets',
        declarations: 'generated/detail',
        marker: 'left_alias-space-subpaths'
      },
      {
        name: 'summary',
        source: 'src/main/ets/View Summary/Card.ets',
        declarations: 'generated/summary',
        marker: 'right_alias-space-subpaths'
      }
    ],
    aliases: {
      '@left/Card': [
        'detail/src/main/ets/View Detail/Card.ets'
      ],
      '@right/Card': [
        'summary/src/main/ets/View Summary/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'detail/src/main/ets/View Detail/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/detail/src/main/ets/View Detail/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'detail',
        marker: 'left_alias-space-subpaths'
      },
      {
        request: '@right/Card',
        source: 'summary/src/main/ets/View Summary/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/summary/src/main/ets/View Summary/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'summary',
        marker: 'right_alias-space-subpaths'
      }
    ]
  },
  {
    id: 'alias-different-source-name',
    boundary: 'A logical card alias can resolve a differently named provider file.',
    providers: [
      {
        name: 'items',
        source: 'src/main/ets/Item.ets',
        declarations: 'generated/items',
        marker: 'left_alias-different-source-name'
      },
      {
        name: 'models',
        source: 'src/main/ets/Model.ets',
        declarations: 'generated/models',
        marker: 'right_alias-different-source-name'
      }
    ],
    aliases: {
      '@left/Card': [
        'items/src/main/ets/Item.ets'
      ],
      '@right/Card': [
        'models/src/main/ets/Model.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'items/src/main/ets/Item.ets',
        operation: 'alias',
        expectedPath: 'generated/items/src/main/ets/Item.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'items',
        marker: 'left_alias-different-source-name'
      },
      {
        request: '@right/Card',
        source: 'models/src/main/ets/Model.ets',
        operation: 'alias',
        expectedPath: 'generated/models/src/main/ets/Model.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'models',
        marker: 'right_alias-different-source-name'
      }
    ]
  },
  {
    id: 'aliased-package-short-prefix',
    boundary: 'Package-prefix sharing does not override explicit path alias targets.',
    providers: [
      {
        name: 'ui',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/ui',
        marker: 'left_aliased-package-short-prefix'
      },
      {
        name: 'ui_extra',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/ui_extra',
        marker: 'right_aliased-package-short-prefix'
      }
    ],
    aliases: {
      '@left/Card': [
        'ui/src/main/ets/Card.ets'
      ],
      '@right/Card': [
        'ui_extra/src/main/ets/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'ui/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/ui/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'ui',
        marker: 'left_aliased-package-short-prefix'
      },
      {
        request: '@right/Card',
        source: 'ui_extra/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/ui_extra/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'ui_extra',
        marker: 'right_aliased-package-short-prefix'
      }
    ]
  },
  {
    id: 'alias-missing-declaration',
    boundary: 'A source alias can resolve successfully without its required generated declaration.',
    providers: [
      {
        name: 'views',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/views',
        marker: 'left_alias-missing-declaration'
      },
      {
        name: 'styles',
        source: 'src/main/ets/Card.ets',
        declarations: 'generated/styles',
        marker: 'right_alias-missing-declaration',
        missing: true
      }
    ],
    aliases: {
      '@left/Card': [
        'views/src/main/ets/Card.ets'
      ],
      '@right/Card': [
        'styles/src/main/ets/Card.ets'
      ]
    },
    requests: [
      {
        request: '@left/Card',
        source: 'views/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: 'generated/views/src/main/ets/Card.d.ets',
        expectedLanguage: '1.2',
        expectedPackage: 'views',
        marker: 'left_alias-missing-declaration'
      },
      {
        request: '@right/Card',
        source: 'styles/src/main/ets/Card.ets',
        operation: 'alias',
        expectedPath: null,
        expectedLanguage: '1.2',
        expectedPackage: 'styles',
        missing: [
          '@right/Card'
        ]
      }
    ]
  }
];

module.exports = { fixtures };
