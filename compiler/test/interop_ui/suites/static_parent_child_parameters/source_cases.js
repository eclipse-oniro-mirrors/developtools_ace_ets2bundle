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
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {},
      'present': [],
      'assignmentCount': 0,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return {  };
  }
}
`
  },
  {
    'id': 'count-zero',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 0,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: 0 };
  }
}
`
  },
  {
    'id': 'count-positive',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 7,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: 7 };
  }
}
`
  },
  {
    'id': 'count-negative',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': -3,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: -3 };
  }
}
`
  },
  {
    'id': 'count-decimal',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 0.25,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: 0.25 };
  }
}
`
  },
  {
    'id': 'empty-title',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'title': '',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { title: "" };
  }
}
`
  },
  {
    'id': 'quoted-title',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'a"b',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  options() {
    return { title: 'a"b' };
  }
}
`
  },
  {
    'id': 'unicode-title',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'title': '静态卡片',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { title: "静态卡片" };
  }
}
`
  },
  {
    'id': 'false-enabled',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'enabled': false,
        '__options_has_enabled': true
      },
      'present': [
        'enabled'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { enabled: false };
  }
}
`
  },
  {
    'id': 'true-enabled',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'enabled': true,
        '__options_has_enabled': true
      },
      'present': [
        'enabled'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { enabled: true };
  }
}
`
  },
  {
    'id': 'nullable-model',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'model': null,
        '__options_has_model': true
      },
      'present': [
        'model'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { model: null };
  }
}
`
  },
  {
    'id': 'undefined-model',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        '__options_has_model': true
      },
      'present': [
        'model'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { model: undefined };
  }
}
`
  },
  {
    'id': 'array-model',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'values': [
          1,
          2
        ],
        '__options_has_values': true
      },
      'present': [
        'values'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { values: [1, 2] };
  }
}
`
  },
  {
    'id': 'nested-model',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'model': {
          'name': 'card',
          'count': 2
        },
        '__options_has_model': true
      },
      'present': [
        'model'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { model: { name: "card", count: 2 } };
  }
}
`
  },
  {
    'id': 'empty-array',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'values': [],
        '__options_has_values': true
      },
      'present': [
        'values'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { values: [] };
  }
}
`
  },
  {
    'id': 'empty-model',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'model': {},
        '__options_has_model': true
      },
      'present': [
        'model'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { model: {} };
  }
}
`
  },
  {
    'id': 'mixed-parameters',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 0,
        '__options_has_count': true,
        'title': '',
        '__options_has_title': true,
        'enabled': false,
        '__options_has_enabled': true
      },
      'present': [
        'count',
        'title',
        'enabled'
      ],
      'assignmentCount': 3,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: 0, title: "", enabled: false };
  }
}
`
  },
  {
    'id': 'reordered-parameters',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'enabled': true,
        '__options_has_enabled': true,
        'count': 2,
        '__options_has_count': true,
        'title': 'last',
        '__options_has_title': true
      },
      'present': [
        'enabled',
        'count',
        'title'
      ],
      'assignmentCount': 3,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { enabled: true, count: 2, title: "last" };
  }
}
`
  },
  {
    'id': 'undefined-and-zero',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        '__options_has_model': true,
        'count': 0,
        '__options_has_count': true
      },
      'present': [
        'model',
        'count'
      ],
      'assignmentCount': 2,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { model: undefined, count: 0 };
  }
}
`
  },
  {
    'id': 'conditional-count',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 2,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: false ? 1 : 2 };
  }
}
`
  },
  {
    'id': 'binary-count',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'count': 42,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: 6 * 7 };
  }
}
`
  },
  {
    'id': 'nullish-title',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'fallback',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { title: undefined ?? "fallback" };
  }
}
`
  },
  {
    'id': 'parent-count-expression',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'count': 9
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 9,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.count'
      ],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'parent-title-expression',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'title': 'updated'
    },
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'updated',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.title'
      ],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { title: this.title };
  }
}
`
  },
  {
    'id': 'link-backing-state',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [
      'count'
    ],
    'builders': [],
    'state': {
      'count': 7,
      '__count': {
        'value': 7
      }
    },
    'evaluate': true,
    'expected': {
      'values': {
        '__backing_count': {
          'backing': {
            'value': 7
          }
        },
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.__count'
      ],
      'forbidden': [
        'result["count"]'
      ]
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: this.count };
  }
}
`
  },
  {
    'id': 'link-non-this-reference',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [
      'count'
    ],
    'builders': [],
    'state': {},
    'evaluate': true,
    'expected': {
      'values': {
        '__backing_count': {
          'backing': {
            'value': 3
          }
        },
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [],
      'forbidden': []
    },
    'globals': {
      'stateReference': {
        'value': 3
      }
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: stateReference };
  }
}
`
  },
  {
    'id': 'link-and-value-parameters',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [
      'count'
    ],
    'builders': [],
    'state': {
      'count': 7,
      '__count': {
        'value': 7
      },
      'title': 'label'
    },
    'evaluate': true,
    'expected': {
      'values': {
        '__backing_count': {
          'backing': {
            'value': 7
          }
        },
        '__options_has_count': true,
        'title': 'label',
        '__options_has_title': true
      },
      'present': [
        'count',
        'title'
      ],
      'assignmentCount': 2,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: this.count, title: this.title };
  }
}
`
  },
  {
    'id': 'two-backing-properties',
    'purpose': 'Options lowering preserves value and explicit parameter presence',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [
      'count',
      'other'
    ],
    'builders': [],
    'state': {
      'count': 1,
      'other': 2,
      '__count': {
        'value': 1
      },
      '__other': {
        'value': 2
      }
    },
    'evaluate': true,
    'expected': {
      'values': {
        '__backing_count': {
          'backing': {
            'value': 1
          }
        },
        '__options_has_count': true,
        '__backing_other': {
          'backing': {
            'value': 2
          }
        },
        '__options_has_other': true
      },
      'present': [
        'count',
        'other'
      ],
      'assignmentCount': 2,
      'contains': [],
      'forbidden': []
    },
    source: `class Host {
  public count: number = 1;
  public title: string = "card";
  options() {
    return { count: this.count, other: this.other };
  }
}
`
  },
  {
    'id': 'v1-parent-v1-child-static',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': '@Component'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v2-parent-v2-child-static',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@ComponentV2',
      'childDecorator': '@ComponentV2'
    },
    source: `@ComponentV2
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v1-parent-v2-child-static',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      }
    },
    'expected': {
      'rejected': true,
      'parentDecorator': '@Component',
      'childDecorator': '@ComponentV2'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v2-parent-v1-child-static',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      },
      'childStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': true,
      'parentDecorator': '@ComponentV2',
      'childDecorator': '@Component'
    },
    source: `@ComponentV2
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v1-parent-v1-child-dynamic',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': false,
    'info': {
      'parentStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': '@Component'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v2-parent-v2-child-dynamic',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': false,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@ComponentV2',
      'childDecorator': '@ComponentV2'
    },
    source: `@ComponentV2
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v1-parent-v2-child-dynamic',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': false,
    'info': {
      'parentStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': '@ComponentV2'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v2-parent-v1-child-dynamic',
    'purpose': 'Cross-version parent/child validation reports 10905501 at the component call only in static interop',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': false,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      },
      'childStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@ComponentV2',
      'childDecorator': '@Component'
    },
    source: `@ComponentV2
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v1-parent-unknown-child-guard',
    'purpose': 'Missing component-version flags leave the interop validation guard inactive',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': 'unknown'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'v2-parent-unknown-child-guard',
    'purpose': 'Missing component-version flags leave the interop validation guard inactive',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@ComponentV2',
      'childDecorator': 'unknown'
    },
    source: `@ComponentV2
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'unknown-parent-v1-child-guard',
    'purpose': 'Missing component-version flags leave the interop validation guard inactive',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': true,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': 'unknown'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'unknown-parent-v2-child-guard',
    'purpose': 'Missing component-version flags leave the interop validation guard inactive',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': true
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': 'unknown'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'unknown-parent-unknown-child-guard',
    'purpose': 'Missing component-version flags leave the interop validation guard inactive',
    'operation': 'validation',
    'component': 'ChildCard',
    'arkoala': true,
    'info': {
      'parentStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      },
      'childStructInfo': {
        'isComponentV1': false,
        'isComponentV2': false
      }
    },
    'expected': {
      'rejected': false,
      'parentDecorator': '@Component',
      'childDecorator': 'unknown'
    },
    source: `@Component
struct ParentCard {
  build() {
    ChildCard({ count: 1 })
  }
}
`
  },
  {
    'id': 'array-index-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'values': [
        12
      ]
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 12,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.values[0]'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: this.values[0] };
  }
}
`
  },
  {
    'id': 'nested-model-property',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'model': {
        'count': 5
      }
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 5,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.model.count'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: this.model.count };
  }
}
`
  },
  {
    'id': 'optional-model-fallback',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'model': null
    },
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'missing',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.model?.title ?? "missing"'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { title: this.model?.title ?? "missing" };
  }
}
`
  },
  {
    'id': 'optional-model-present',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'model': {
        'title': 'card'
      }
    },
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'card',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.model?.title ?? "missing"'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { title: this.model?.title ?? "missing" };
  }
}
`
  },
  {
    'id': 'function-call-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'count': -2
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 0,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'Math.max(this.count, 0)'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: Math.max(this.count, 0) };
  }
}
`
  },
  {
    'id': 'type-asserted-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'count': 5
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 5,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.count as number'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: this.count as number };
  }
}
`
  },
  {
    'id': 'non-null-model-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'model': {
        'count': 8
      }
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 8,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.model!.count'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: this.model!.count };
  }
}
`
  },
  {
    'id': 'state-conditional-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'count': -2
    },
    'evaluate': true,
    'expected': {
      'values': {
        'count': 1,
        '__options_has_count': true
      },
      'present': [
        'count'
      ],
      'assignmentCount': 1,
      'contains': [
        'this.count > 0 ? this.count : 1'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { count: this.count > 0 ? this.count : 1 };
  }
}
`
  },
  {
    'id': 'template-literal-value',
    'purpose': 'Preserve dynamic caller expression semantics inside the static options factory',
    'operation': 'options',
    'component': 'StaticCard',
    'links': [],
    'builders': [],
    'state': {
      'count': 7
    },
    'evaluate': true,
    'expected': {
      'values': {
        'title': 'value=7',
        '__options_has_title': true
      },
      'present': [
        'title'
      ],
      'assignmentCount': 1,
      'contains': [
        '`value=${this.count}`'
      ],
      'forbidden': []
    },
    source: `class Model {
  public count: number = 5;
  public title: string = 'card';
}
class Host {
  public count: number = 7;
  public values: number[] = [12];
  public model: Model | null = new Model();
  options() {
    return { title: \`value=\${this.count}\` };
  }
}
`
  }
];

module.exports = { fixtures };
