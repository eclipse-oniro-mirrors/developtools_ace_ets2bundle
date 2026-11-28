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
    id: 'falsy-text-and-count',
    boundary: 'Sibling options independently encode empty string, zero and false.',
    left: {
      name: 'TitleBadge',
      source: `class Host {
  options() {
    return { text: "", active: false };
  }
}
`,
      state: {},
      expected: {
        text: '',
        __options_has_text: true,
        active: false,
        __options_has_active: true
      }
    },
    right: {
      name: 'QuantityBadge',
      source: `class Host {
  options() {
    return { value: 0, active: true };
  }
}
`,
      state: {},
      expected: {
        value: 0,
        __options_has_value: true,
        active: true,
        __options_has_active: true
      }
    },
    onlyLeft: [
      'text'
    ],
    onlyRight: [
      'value'
    ]
  },
  {
    id: 'optional-absent-on-left',
    boundary: 'Absent options on the first child do not inherit a sibling default.',
    left: {
      name: 'Separator',
      source: `class Host {
  options() {
    return {  };
  }
}
`,
      state: {},
      expected: {}
    },
    right: {
      name: 'Description',
      source: `class Host {
  options() {
    return { label: "details" };
  }
}
`,
      state: {},
      expected: {
        label: 'details',
        __options_has_label: true
      }
    },
    onlyLeft: [],
    onlyRight: [
      'label'
    ]
  },
  {
    id: 'optional-absent-on-right',
    boundary: 'An empty second factory does not capture a sibling property.',
    left: {
      name: 'TagLabel',
      source: `class Host {
  options() {
    return { tag: "item" };
  }
}
`,
      state: {},
      expected: {
        tag: 'item',
        __options_has_tag: true
      }
    },
    right: {
      name: 'HorizontalLine',
      source: `class Host {
  options() {
    return {  };
  }
}
`,
      state: {},
      expected: {}
    },
    onlyLeft: [
      'tag'
    ],
    onlyRight: []
  },
  {
    id: 'siblings-same-names-different-values',
    boundary: 'Both children emit their own values for identically named options.',
    left: {
      name: 'TextStatus',
      source: `class Host {
  options() {
    return { value: "enabled" };
  }
}
`,
      state: {},
      expected: {
        value: 'enabled',
        __options_has_value: true
      }
    },
    right: {
      name: 'IndexStatus',
      source: `class Host {
  options() {
    return { value: 2 };
  }
}
`,
      state: {},
      expected: {
        value: 2,
        __options_has_value: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'array-model-and-header',
    boundary: 'An array payload and sibling heading retain distinct options.',
    left: {
      name: 'PreviewItems',
      source: `class Host {
  options() {
    return { items: [1,2,3] };
  }
}
`,
      state: {},
      expected: {
        items: [
          1,
          2,
          3
        ],
        __options_has_items: true
      }
    },
    right: {
      name: 'HostCaption',
      source: `class Host {
  options() {
    return { title: "Preview", visible: true };
  }
}
`,
      state: {},
      expected: {
        title: 'Preview',
        __options_has_title: true,
        visible: true,
        __options_has_visible: true
      }
    },
    onlyLeft: [
      'items'
    ],
    onlyRight: [
      'title',
      'visible'
    ]
  },
  {
    id: 'nested-record-and-list',
    boundary: 'Each option adapter retains the original nested shape.',
    left: {
      name: 'FormSummary',
      source: `class Host {
  options() {
    return { form: {"valid":true,"touched":false} };
  }
}
`,
      state: {},
      expected: {
        form: {
          valid: true,
          touched: false
        },
        __options_has_form: true
      }
    },
    right: {
      name: 'ListSummary',
      source: `class Host {
  options() {
    return { items: ["one","two"] };
  }
}
`,
      state: {},
      expected: {
        items: [
          'one',
          'two'
        ],
        __options_has_items: true
      }
    },
    onlyLeft: [
      'form'
    ],
    onlyRight: [
      'items'
    ]
  },
  {
    id: 'owned-selection-and-count',
    boundary: 'Separate selections update from different host state fields.',
    left: {
      name: 'ColorChooser',
      source: `class Host {
  public selectedColor: string = "";
  public selectedCount: number = 0;
  options() {
    return { selected: this.selectedColor };
  }
}
`,
      state: {
        selectedColor: 'blue',
        selectedCount: 5
      },
      expected: {
        selected: 'blue',
        __options_has_selected: true
      }
    },
    right: {
      name: 'CountChooser',
      source: `class Host {
  public selectedColor: string = "";
  public selectedCount: number = 0;
  options() {
    return { selected: this.selectedCount };
  }
}
`,
      state: {
        selectedColor: 'blue',
        selectedCount: 5
      },
      expected: {
        selected: 5,
        __options_has_selected: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'different-fallbacks-for-one-value',
    boundary: 'Two composition slots intentionally handle an empty title differently.',
    left: {
      name: 'PrimaryTitle',
      source: `class Host {
  public label: string = "";
  options() {
    return { title: this.label ?? "unlabeled" };
  }
}
`,
      state: {
        label: ''
      },
      expected: {
        title: '',
        __options_has_title: true
      }
    },
    right: {
      name: 'SecondaryTitle',
      source: `class Host {
  public label: string = "";
  options() {
    return { title: this.label || "unlabeled" };
  }
}
`,
      state: {
        label: ''
      },
      expected: {
        title: 'unlabeled',
        __options_has_title: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'derived-size-and-label',
    boundary: 'Sibling factories preserve their different uses of the same source object.',
    left: {
      name: 'Dimension',
      source: `class Host {
  public item = { width: 3, label: "" };
  options() {
    return { size: this.item.width + 2 };
  }
}
`,
      state: {
        item: {
          width: 9,
          label: 'card'
        }
      },
      expected: {
        size: 11,
        __options_has_size: true
      }
    },
    right: {
      name: 'NameTag',
      source: `class Host {
  public item = { width: 3, label: "" };
  options() {
    return { name: this.item.label.toUpperCase() };
  }
}
`,
      state: {
        item: {
          width: 9,
          label: 'card'
        }
      },
      expected: {
        name: 'CARD',
        __options_has_name: true
      }
    },
    onlyLeft: [
      'size'
    ],
    onlyRight: [
      'name'
    ]
  },
  {
    id: 'same-array-different-slices',
    boundary: 'Source arrays used by two child factories keep individual ranges.',
    left: {
      name: 'RecentRows',
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items.slice(0, 2) };
  }
}
`,
      state: {
        items: [
          1,
          5,
          7,
          9
        ]
      },
      expected: {
        items: [
          1,
          5
        ],
        __options_has_items: true
      }
    },
    right: {
      name: 'PinnedRows',
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items.slice(2) };
  }
}
`,
      state: {
        items: [
          1,
          5,
          7,
          9
        ]
      },
      expected: {
        items: [
          7,
          9
        ],
        __options_has_items: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'null-versus-absent',
    boundary: 'Explicit reset on one child does not imply reset on the sibling.',
    left: {
      name: 'Resettable',
      source: `class Host {
  options() {
    return { selection: null, count: 0 };
  }
}
`,
      state: {},
      expected: {
        selection: null,
        __options_has_selection: true,
        count: 0,
        __options_has_count: true
      }
    },
    right: {
      name: 'Unmodified',
      source: `class Host {
  options() {
    return { count: 2 };
  }
}
`,
      state: {},
      expected: {
        count: 2,
        __options_has_count: true
      }
    },
    onlyLeft: [
      'selection'
    ],
    onlyRight: []
  },
  {
    id: 'render-config-fields',
    boundary: 'Compound options in a host page retain independent settings.',
    left: {
      name: 'MatrixPanel',
      source: `class Host {
  options() {
    return { layout: {"columns":2,"gap":0} };
  }
}
`,
      state: {},
      expected: {
        layout: {
          columns: 2,
          gap: 0
        },
        __options_has_layout: true
      }
    },
    right: {
      name: 'LabelPanel',
      source: `class Host {
  options() {
    return { layout: {"alignment":"center","show":false} };
  }
}
`,
      state: {},
      expected: {
        layout: {
          alignment: 'center',
          show: false
        },
        __options_has_layout: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'count-and-boolean-projection',
    boundary: 'Two uses of an array infer a boolean and a numeric projection separately.',
    left: {
      name: 'GroupBadge',
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { hasItems: this.rows.length > 0 };
  }
}
`,
      state: {
        rows: [
          0,
          0
        ]
      },
      expected: {
        hasItems: true,
        __options_has_hasItems: true
      }
    },
    right: {
      name: 'ResultLabel',
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { total: this.rows.length };
  }
}
`,
      state: {
        rows: [
          0,
          0
        ]
      },
      expected: {
        total: 2,
        __options_has_total: true
      }
    },
    onlyLeft: [
      'hasItems'
    ],
    onlyRight: [
      'total'
    ]
  },
  {
    id: 'readonly-input-array-and-selection',
    boundary: 'A decorated caller does not merge a filtered list and sibling selection state.',
    left: {
      name: 'ListBody',
      source: `class Host {
  public rows: number[] = [];
  public selection: number = 1;
  options() {
    return { visible: this.rows.filter(value => value > 0) };
  }
}
`,
      state: {
        rows: [
          0,
          -1,
          3
        ],
        selection: 0
      },
      expected: {
        visible: [
          3
        ],
        __options_has_visible: true
      }
    },
    right: {
      name: 'SelectedRow',
      source: `class Host {
  public rows: number[] = [];
  public selection: number = 1;
  options() {
    return { selection: this.selection };
  }
}
`,
      state: {
        rows: [
          0,
          -1,
          3
        ],
        selection: 0
      },
      expected: {
        selection: 0,
        __options_has_selection: true
      }
    },
    onlyLeft: [
      'visible'
    ],
    onlyRight: [
      'selection'
    ]
  },
  {
    id: 'explicit-overrides-on-both-sides',
    boundary: 'A pair of numerical values stay associated with the intended ports.',
    left: {
      name: 'LeftMeter',
      source: `class Host {
  options() {
    return { reading: 0, calibrated: true };
  }
}
`,
      state: {},
      expected: {
        reading: 0,
        __options_has_reading: true,
        calibrated: true,
        __options_has_calibrated: true
      }
    },
    right: {
      name: 'RightMeter',
      source: `class Host {
  options() {
    return { reading: -1, calibrated: false };
  }
}
`,
      state: {},
      expected: {
        reading: -1,
        __options_has_reading: true,
        calibrated: false,
        __options_has_calibrated: true
      }
    },
    onlyLeft: [],
    onlyRight: []
  },
  {
    id: 'conditional-visibility-and-label',
    boundary: 'Using the same condition in two factories preserves local semantics.',
    left: {
      name: 'VisibilityToggle',
      source: `class Host {
  public enabled: boolean = false;
  options() {
    return { visible: this.enabled };
  }
}
`,
      state: {
        enabled: false
      },
      expected: {
        visible: false,
        __options_has_visible: true
      }
    },
    right: {
      name: 'TextHint',
      source: `class Host {
  public enabled: boolean = false;
  options() {
    return { hint: this.enabled ? "show" : "hide" };
  }
}
`,
      state: {
        enabled: false
      },
      expected: {
        hint: 'hide',
        __options_has_hint: true
      }
    },
    onlyLeft: [
      'visible'
    ],
    onlyRight: [
      'hint'
    ]
  },
  {
    id: 'mixed-local-shape',
    boundary: 'Each component handles dimensions of a compound parent record separately.',
    left: {
      name: 'HeaderSpacer',
      source: `class Host {
  public insets = { top: 5, bottom: 10 };
  options() {
    return { padding: { top: this.insets.top, bottom: 0 } };
  }
}
`,
      state: {
        insets: {
          top: 5,
          bottom: 10
        }
      },
      expected: {
        padding: {
          top: 5,
          bottom: 0
        },
        __options_has_padding: true
      }
    },
    right: {
      name: 'FooterLabel',
      source: `class Host {
  public insets = { top: 5, bottom: 10 };
  options() {
    return { height: this.insets.bottom };
  }
}
`,
      state: {
        insets: {
          top: 5,
          bottom: 10
        }
      },
      expected: {
        height: 10,
        __options_has_height: true
      }
    },
    onlyLeft: [
      'padding'
    ],
    onlyRight: [
      'height'
    ]
  },
  {
    id: 'different-fields-share-falsy-flag',
    boundary: 'A false flag remains explicit on both siblings while their values differ.',
    left: {
      name: 'ToggleRow',
      source: `class Host {
  options() {
    return { enabled: false, title: "toggle" };
  }
}
`,
      state: {},
      expected: {
        enabled: false,
        __options_has_enabled: true,
        title: 'toggle',
        __options_has_title: true
      }
    },
    right: {
      name: 'ApplyButton',
      source: `class Host {
  options() {
    return { enabled: false, label: "apply" };
  }
}
`,
      state: {},
      expected: {
        enabled: false,
        __options_has_enabled: true,
        label: 'apply',
        __options_has_label: true
      }
    },
    onlyLeft: [
      'title'
    ],
    onlyRight: [
      'label'
    ]
  },
  {
    id: 'icon-model-differs-from-text-model',
    boundary: 'Projection of a nested input into separate icons and labels remains independent.',
    left: {
      name: 'CardIcon',
      source: `class Host {
  public card = { icon: "check", label: "Text" };
  options() {
    return { icon: this.card.icon };
  }
}
`,
      state: {
        card: {
          icon: 'check',
          label: 'Text'
        }
      },
      expected: {
        icon: 'check',
        __options_has_icon: true
      }
    },
    right: {
      name: 'CardText',
      source: `class Host {
  public card = { icon: "check", label: "Text" };
  options() {
    return { text: this.card.label };
  }
}
`,
      state: {
        card: {
          icon: 'check',
          label: 'Text'
        }
      },
      expected: {
        text: 'Text',
        __options_has_text: true
      }
    },
    onlyLeft: [
      'icon'
    ],
    onlyRight: [
      'text'
    ]
  }
];

module.exports = { fixtures };
