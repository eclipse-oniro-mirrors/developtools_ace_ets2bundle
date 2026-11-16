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
    'id': 'empty-options',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {}
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return {  };
  }
}
`
  },
  {
    'id': 'numeric-literal',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 7,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 7 };
  }
}
`
  },
  {
    'id': 'zero-is-present',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 0,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 0 };
  }
}
`
  },
  {
    'id': 'negative-literal',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': -4,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: -4 };
  }
}
`
  },
  {
    'id': 'fractional-literal',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 1.5,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 1.5 };
  }
}
`
  },
  {
    'id': 'string-literal',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'title': 'hello',
          '__options_has_title': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { title: "hello" };
  }
}
`
  },
  {
    'id': 'empty-string-is-present',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'title': '',
          '__options_has_title': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { title: "" };
  }
}
`
  },
  {
    'id': 'false-is-present',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'enabled': false,
          '__options_has_enabled': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { enabled: false };
  }
}
`
  },
  {
    'id': 'true-literal',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'enabled': true,
          '__options_has_enabled': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { enabled: true };
  }
}
`
  },
  {
    'id': 'null-model',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'model': null,
          '__options_has_model': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { model: null };
  }
}
`
  },
  {
    'id': 'undefined-presence',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          '__options_has_model': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { model: undefined };
  }
}
`
  },
  {
    'id': 'array-argument',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'values': [
            1,
            2,
            3
          ],
          '__options_has_values': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { values: [1, 2, 3] };
  }
}
`
  },
  {
    'id': 'object-argument',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'model': {
            'title': 'card',
            'count': 2
          },
          '__options_has_model': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { model: { title: "card", count: 2 } };
  }
}
`
  },
  {
    'id': 'multiple-properties',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 3,
          '__options_has_count': true,
          'title': 'card',
          '__options_has_title': true,
          'enabled': false,
          '__options_has_enabled': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 3, title: "card", enabled: false };
  }
}
`
  },
  {
    'id': 'property-order',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'enabled': false,
          '__options_has_enabled': true,
          'title': 'card',
          '__options_has_title': true,
          'count': 3,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { enabled: false, title: "card", count: 3 };
  }
}
`
  },
  {
    'id': 'conditional-expression',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 4,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: true ? 4 : 0 };
  }
}
`
  },
  {
    'id': 'arithmetic-expression',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 14,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 2 + 3 * 4 };
  }
}
`
  },
  {
    'id': 'nullish-expression',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'title': 'fallback',
          '__options_has_title': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { title: null ?? "fallback" };
  }
}
`
  },
  {
    'id': 'initial-then-update',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true,
        'state': {
          'count': 7
        }
      },
      {
        'initial': false,
        'state': {
          'count': 8
        }
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 7,
          '__options_has_count': true
        },
        {
          'count': 8,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'two-update-rounds',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true,
        'state': {
          'count': 0
        }
      },
      {
        'initial': false,
        'state': {
          'count': 1
        }
      },
      {
        'initial': false,
        'state': {
          'count': 2
        }
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 0,
          '__options_has_count': true
        },
        {
          'count': 1,
          '__options_has_count': true
        },
        {
          'count': 2,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'repeated-initial-render',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true,
        'state': {
          'count': 1
        }
      },
      {
        'initial': true,
        'state': {
          'count': 2
        }
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ]
      ],
      'options': [
        {
          'count': 1,
          '__options_has_count': true
        },
        {
          'count': 2,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'recreate-after-update',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true,
        'state': {
          'count': 1
        }
      },
      {
        'initial': false,
        'state': {
          'count': 2
        }
      },
      {
        'initial': true,
        'state': {
          'count': 3
        }
      },
      {
        'initial': false,
        'state': {
          'count': 4
        }
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ],
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 1,
          '__options_has_count': true
        },
        {
          'count': 2,
          '__options_has_count': true
        },
        {
          'count': 3,
          '__options_has_count': true
        },
        {
          'count': 4,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'unchanged-update-expression',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'StaticCard',
    'state': {},
    'renders': [
      {
        'initial': true,
        'state': {
          'count': 7
        }
      },
      {
        'initial': false,
        'state': {
          'count': 7
        }
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 7,
          '__options_has_count': true
        },
        {
          'count': 7,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'component-name-CardAlias',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': 'CardAlias',
    'state': {},
    'renders': [
      {
        'initial': true
      },
      {
        'initial': false
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 3,
          '__options_has_count': true
        },
        {
          'count': 3,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 3 };
  }
}
`
  },
  {
    'id': 'component-name-_InternalCard',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': '_InternalCard',
    'state': {},
    'renders': [
      {
        'initial': true
      },
      {
        'initial': false
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 3,
          '__options_has_count': true
        },
        {
          'count': 3,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 3 };
  }
}
`
  },
  {
    'id': 'component-name-静态卡片',
    'purpose': 'Generated creation and update branches preserve parameter expressions and stack ordering',
    'operation': 'render',
    'component': '静态卡片',
    'state': {},
    'renders': [
      {
        'initial': true
      },
      {
        'initial': false
      }
    ],
    'expected': {
      'trace': [
        [
          'extend',
          true
        ],
        [
          'create'
        ],
        [
          'construct',
          true,
          true
        ],
        [
          'reset'
        ],
        [
          'push',
          41
        ],
        [
          'pop'
        ],
        [
          'update'
        ]
      ],
      'options': [
        {
          'count': 3,
          '__options_has_count': true
        },
        {
          'count': 3,
          '__options_has_count': true
        }
      ]
    },
    source: `class Host {
  public count: number = 7;
  public title: string = "card";
  public enabled: boolean = true;
  public model: Object | null = null;
  public values: number[] = [1, 2];
  options() {
    return { count: 3 };
  }
}
`
  }
];

module.exports = { fixtures };
