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
    'id': 'namespace-1-value-kinds',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Card.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'namespace-2-value-kinds',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      },
      'format': {
        'kind': 'function',
        'name': 'format',
        'runtimeName': 'Lcards/Global;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card',
        'format'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Card.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
export function format(value: string): string {
  return "Lcards/Global;/format/" + value;
}
`
  },
  {
    'id': 'namespace-3-value-kinds',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      },
      'format': {
        'kind': 'function',
        'name': 'format',
        'runtimeName': 'Lcards/Global;'
      },
      'title': {
        'kind': 'property',
        'name': 'title',
        'runtimeName': 'Lcards/Global;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format',
        'title'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ],
        [
          'getClass',
          'Lcards/Global;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card',
        'format',
        'title'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Card.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
export function format(value: string): string {
  return "Lcards/Global;/format/" + value;
}
export const title: string = 'theme-blue';
`
  },
  {
    'id': 'nested-namespace-depth-1',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lcards/Card;'
          },
          'format': {
            'kind': 'function',
            'name': 'format',
            'runtimeName': 'Lcards/Global;'
          },
          'title': {
            'kind': 'property',
            'name': 'title',
            'runtimeName': 'Lcards/Global;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format',
        'title'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ],
        [
          'getClass',
          'Lcards/Global;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Controls.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export class Card {
    public static identity: string = "Lcards/Card;";
  }
  export function format(value: string): string {
    return "Lcards/Global;/format/" + value;
  }
  export const title: string = 'theme-blue';
}
`
  },
  {
    'id': 'nested-namespace-depth-2',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Panels': {
            'kind': 'namespace',
            'name': 'Panels',
            'children': {
              'Card': {
                'kind': 'class',
                'name': 'Card',
                'runtimeName': 'Lcards/Card;'
              },
              'format': {
                'kind': 'function',
                'name': 'format',
                'runtimeName': 'Lcards/Global;'
              },
              'title': {
                'kind': 'property',
                'name': 'title',
                'runtimeName': 'Lcards/Global;'
              }
            }
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format',
        'title'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ],
        [
          'getClass',
          'Lcards/Global;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Controls.Panels.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export namespace Panels {
    export class Card {
      public static identity: string = "Lcards/Card;";
    }
    export function format(value: string): string {
      return "Lcards/Global;/format/" + value;
    }
    export const title: string = 'theme-blue';
  }
}
`
  },
  {
    'id': 'nested-namespace-depth-3',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Panels': {
            'kind': 'namespace',
            'name': 'Panels',
            'children': {
              'Widgets': {
                'kind': 'namespace',
                'name': 'Widgets',
                'children': {
                  'Card': {
                    'kind': 'class',
                    'name': 'Card',
                    'runtimeName': 'Lcards/Card;'
                  },
                  'format': {
                    'kind': 'function',
                    'name': 'format',
                    'runtimeName': 'Lcards/Global;'
                  },
                  'title': {
                    'kind': 'property',
                    'name': 'title',
                    'runtimeName': 'Lcards/Global;'
                  }
                }
              }
            }
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format',
        'title'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ],
        [
          'getClass',
          'Lcards/Global;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Controls.Panels.Widgets.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export namespace Panels {
    export namespace Widgets {
      export class Card {
        public static identity: string = "Lcards/Card;";
      }
      export function format(value: string): string {
        return "Lcards/Global;/format/" + value;
      }
      export const title: string = 'theme-blue';
    }
  }
}
`
  },
  {
    'id': 'named-namespace-UI',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lcards/Card;'
          },
          'format': {
            'kind': 'function',
            'name': 'format',
            'runtimeName': 'Lcards/Global;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
globalThis.probe = [UI.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export class Card {
    public static identity: string = "Lcards/Card;";
  }
  export function format(value: string): string {
    return "Lcards/Global;/format/" + value;
  }
}
`
  },
  {
    'id': 'named-namespace-CardsAlias',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lcards/Card;'
          },
          'format': {
            'kind': 'function',
            'name': 'format',
            'runtimeName': 'Lcards/Global;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as CardsAlias } from "./Static";
globalThis.probe = [CardsAlias.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export class Card {
    public static identity: string = "Lcards/Card;";
  }
  export function format(value: string): string {
    return "Lcards/Global;/format/" + value;
  }
}
`
  },
  {
    'id': 'named-namespace-控件',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lcards/Card;'
          },
          'format': {
            'kind': 'function',
            'name': 'format',
            'runtimeName': 'Lcards/Global;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'format'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ],
        [
          'getFunction',
          'Lcards/Global;',
          'format'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as 控件 } from "./Static";
globalThis.probe = [控件.Card.identity];
`,
    staticSource: `'use static'
export namespace Controls {
  export class Card {
    public static identity: string = "Lcards/Card;";
  }
  export function format(value: string): string {
    return "Lcards/Global;/format/" + value;
  }
}
`
  },
  {
    'id': 'default-namespace',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'default': {
        'kind': 'namespace',
        'name': 'default',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lcards/Card;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'default'
      ]
    },
    source: `import UI from "./Static";
globalThis.probe = [UI.Card.identity];
`,
    staticSource: `'use static'
export namespace DefaultExport {
  export class Card {
    public static identity: string = "Lcards/Card;";
  }
}
export default DefaultExport;
`
  },
  {
    'id': 'same-leaf-name-two-namespaces',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Header': {
        'kind': 'namespace',
        'name': 'Header',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lheader/Card;'
          }
        }
      },
      'Footer': {
        'kind': 'namespace',
        'name': 'Footer',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card',
            'runtimeName': 'Lfooter/Card;'
          }
        }
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card',
        'Card'
      ],
      'lookups': [
        [
          'getClass',
          'Lheader/Card;'
        ],
        [
          'getClass',
          'Lfooter/Card;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lheader/Card;',
        'Lfooter/Card;'
      ],
      'sourceExports': [
        'Header',
        'Footer'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Header.Card.identity, cards.Footer.Card.identity];
`,
    staticSource: `'use static'
export namespace Header {
  export class Card {
    public static identity: string = "Lheader/Card;";
  }
}
export namespace Footer {
  export class Card {
    public static identity: string = "Lfooter/Card;";
  }
}
`
  },
  {
    'id': 'namespace-runtime-renamed-function',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'format': {
        'kind': 'function',
        'name': 'format',
        'localName': 'actualFormat',
        'runtimeName': 'Lcards/Global;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'format'
      ],
      'lookups': [
        [
          'getFunction',
          'Lcards/Global;',
          'actualFormat'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Global;/actualFormat/title'
      ],
      'sourceExports': [
        'format'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.format("title")];
`,
    staticSource: `'use static'
export function actualFormat(value: string): string {
  return "Lcards/Global;/actualFormat/" + value;
}
export { actualFormat as format };
`
  },
  {
    'id': 'namespace-runtime-renamed-property',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'title': {
        'kind': 'property',
        'name': 'title',
        'localName': 'actualTitle',
        'runtimeName': 'Lcards/Global;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'actualTitle': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'title'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Global;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'theme-blue'
      ],
      'sourceExports': [
        'title'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.title];
`,
    staticSource: `'use static'
export const title: string = 'theme-blue';
`
  },
  {
    'id': 'type-only-class',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import type { Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'type-only-alias',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import type { Card as Model } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'type-only-default',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import type Model from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'type-only-namespace',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import type * as Models from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'named-type-specifier',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { type Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'named-type-alias',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { type Card as Model } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'multiple-type-specifiers',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { type Card, type Model } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'type-only-metadata-absent',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': null,
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': []
    },
    source: `import type { Card } from "./Static";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'type-only-export-absent',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': null,
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': []
    },
    source: `import { type Missing } from "./Static";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'type-namespace-metadata-absent',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': null,
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [],
      'errors': [],
      'sourceExports': []
    },
    source: `import type * as Models from "./Static";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'mixed-type-first',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { type Model, Card as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'mixed-type-last',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { Card as LocalCard, type Model } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'mixed-type-alias',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import { type Missing as Model, Card as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'separate-type-value',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card'
      ]
    },
    source: `import type { Model } from "./Static";
import { Card as LocalCard } from "./Static";
globalThis.probe = [LocalCard.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
`
  },
  {
    'id': 'empty-namespace',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {}
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export namespace Controls {
}
`
  },
  {
    'id': 'namespace-skips-interface',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Model': {
            'kind': 'interface',
            'name': 'Model',
            'runtimeName': 'Lcards/Model;'
          }
        }
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export namespace Controls {
  export interface Model {
    value: number;
  }
}
`
  },
  {
    'id': 'namespace-skips-recordless-class',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': {
          'Card': {
            'kind': 'class',
            'name': 'Card'
          }
        }
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export namespace Controls {
  export class Card {
    public static identity: string = "";
  }
}
`
  },
  {
    'id': 'namespace-invalid-array',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': []
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export namespace Controls {
}
`
  },
  {
    'id': 'namespace-invalid-null',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Controls': {
        'kind': 'namespace',
        'name': 'Controls',
        'children': null
      }
    },
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [],
      'lookups': [],
      'helpers': 0,
      'imports': [
        './Static'
      ],
      'errors': [],
      'sourceExports': [
        'Controls'
      ]
    },
    source: `import { Controls as UI } from "./Static";
const value = 1;
`,
    staticSource: `'use static'
export namespace Controls {
}
`
  },
  {
    'id': 'namespace-filters-unsupported-child',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {
      'Card': {
        'kind': 'class',
        'name': 'Card',
        'runtimeName': 'Lcards/Card;'
      },
      'Model': {
        'kind': 'interface',
        'name': 'Model',
        'runtimeName': 'Lcards/Model;'
      }
    },
    'evaluate': true,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
    'expected': {
      'declarations': [
        'Card'
      ],
      'lookups': [
        [
          'getClass',
          'Lcards/Card;'
        ]
      ],
      'helpers': 1,
      'imports': [],
      'errors': [],
      'probe': [
        'Lcards/Card;'
      ],
      'sourceExports': [
        'Card',
        'Model'
      ]
    },
    source: `import * as cards from "./Static";
globalThis.probe = [cards.Card.identity];
`,
    staticSource: `'use static'
export class Card {
  public static identity: string = "Lcards/Card;";
}
export interface Model {
  value: number;
}
`
  },
  {
    'id': 'dynamic-type-import-retained',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {},
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
    source: `import type { DynamicCard } from "./Dynamic";
const value = 1;
`,
    staticSource: `'use static'

`
  },
  {
    'id': 'unresolved-type-import-retained',
    'purpose': 'Namespace scope and type-only bindings retain the correct value lookup boundary',
    'metadata': {},
    'evaluate': false,
    'runtimeProperties': {
      'title': 'theme-blue'
    },
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
    source: `import type { Card } from "./Missing";
const value = 1;
`,
    staticSource: `'use static'

`
  }
];

module.exports = { fixtures };
