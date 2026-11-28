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
    id: 'immutable-view-model',
    boundary: 'A revised object option leaves the original model stable and introduces an independent header.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public card = { label: "tile", amount: 5 };
  options() {
    return { card: this.card };
  }
}
`,
      state: {
        card: {
          label: 'tile',
          amount: 5
        }
      },
      expected: {
        card: {
          label: 'tile',
          amount: 5
        },
        __options_has_card: true
      }
    },
    after: {
      source: `class Host {
  public card = { label: "tile", amount: 5 };
  options() {
    return { card: this.card, header: this.card.label.toUpperCase() };
  }
}
`,
      state: {
        card: {
          label: 'tile',
          amount: 5
        }
      },
      expected: {
        card: {
          label: 'tile',
          amount: 5
        },
        __options_has_card: true,
        header: 'TILE',
        __options_has_header: true
      }
    },
    removed: [],
    added: [
      'header'
    ]
  },
  {
    id: 'boundary-nested-array',
    boundary: 'Replace a flat row model with an explicit nested structure for sections.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items };
  }
}
`,
      state: {
        items: [
          1,
          2
        ]
      },
      expected: {
        items: [
          1,
          2
        ],
        __options_has_items: true
      }
    },
    after: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { sections: [this.items] };
  }
}
`,
      state: {
        items: [
          1,
          2
        ]
      },
      expected: {
        sections: [
          [
            1,
            2
          ]
        ],
        __options_has_sections: true
      }
    },
    removed: [
      'items'
    ],
    added: [
      'sections'
    ]
  },
  {
    id: 'separate-boolean-and-model',
    boundary: 'The new view model consumes an explicit boolean instead of the entire options record.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public props = { enabled: false, margin: 0 };
  options() {
    return { props: this.props };
  }
}
`,
      state: {
        props: {
          enabled: false,
          margin: 0
        }
      },
      expected: {
        props: {
          enabled: false,
          margin: 0
        },
        __options_has_props: true
      }
    },
    after: {
      source: `class Host {
  public props = { enabled: false, margin: 0 };
  options() {
    return { enabled: this.props.enabled, margin: this.props.margin };
  }
}
`,
      state: {
        props: {
          enabled: false,
          margin: 0
        }
      },
      expected: {
        enabled: false,
        __options_has_enabled: true,
        margin: 0,
        __options_has_margin: true
      }
    },
    removed: [
      'props'
    ],
    added: [
      'enabled',
      'margin'
    ]
  },
  {
    id: 'position-pair-to-layout',
    boundary: 'The revised options merge fields into a layout object and drop old presence markers.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public x: number = 0;
  public y: number = 0;
  options() {
    return { x: this.x, y: this.y };
  }
}
`,
      state: {
        x: 1,
        y: 9
      },
      expected: {
        x: 1,
        __options_has_x: true,
        y: 9,
        __options_has_y: true
      }
    },
    after: {
      source: `class Host {
  public x: number = 0;
  public y: number = 0;
  options() {
    return { layout: { x: this.x, y: this.y } };
  }
}
`,
      state: {
        x: 1,
        y: 9
      },
      expected: {
        layout: {
          x: 1,
          y: 9
        },
        __options_has_layout: true
      }
    },
    removed: [
      'x',
      'y'
    ],
    added: [
      'layout'
    ]
  },
  {
    id: 'computed-content-shape',
    boundary: 'Use a new computed count alongside a separately preserved title.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public items: number[] = [];
  public title: string = "list";
  options() {
    return { title: this.title, items: this.items };
  }
}
`,
      state: {
        items: [
          2,
          4,
          6
        ],
        title: 'list'
      },
      expected: {
        title: 'list',
        __options_has_title: true,
        items: [
          2,
          4,
          6
        ],
        __options_has_items: true
      }
    },
    after: {
      source: `class Host {
  public items: number[] = [];
  public title: string = "list";
  options() {
    return { title: this.title, count: this.items.length };
  }
}
`,
      state: {
        items: [
          2,
          4,
          6
        ],
        title: 'list'
      },
      expected: {
        title: 'list',
        __options_has_title: true,
        count: 3,
        __options_has_count: true
      }
    },
    removed: [
      'items'
    ],
    added: [
      'count'
    ]
  },
  {
    id: 'derive-grid-keys',
    boundary: 'Change numeric data into textual grid keys during the bridge call.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items };
  }
}
`,
      state: {
        items: [
          1,
          3
        ]
      },
      expected: {
        items: [
          1,
          3
        ],
        __options_has_items: true
      }
    },
    after: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { keys: this.items.map(value => "row-" + value) };
  }
}
`,
      state: {
        items: [
          1,
          3
        ]
      },
      expected: {
        keys: [
          'row-1',
          'row-3'
        ],
        __options_has_keys: true
      }
    },
    removed: [
      'items'
    ],
    added: [
      'keys'
    ]
  },
  {
    id: 'conditional-model-clear',
    boundary: 'A new conditional expression clears a hidden card explicitly.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public visible: boolean = true;
  public card = { id: 2 };
  options() {
    return { card: this.card };
  }
}
`,
      state: {
        visible: false,
        card: {
          id: 2
        }
      },
      expected: {
        card: {
          id: 2
        },
        __options_has_card: true
      }
    },
    after: {
      source: `class Host {
  public visible: boolean = true;
  public card = { id: 2 };
  options() {
    return { card: this.visible ? this.card : null };
  }
}
`,
      state: {
        visible: false,
        card: {
          id: 2
        }
      },
      expected: {
        card: null,
        __options_has_card: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'filter-offscreen-rows',
    boundary: 'The new options keep only visible entries and preserve an explicit false selection.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public rows: number[] = [];
  public selection: boolean = false;
  options() {
    return { rows: this.rows, selected: this.selection };
  }
}
`,
      state: {
        rows: [
          0,
          4,
          -4,
          8
        ],
        selection: false
      },
      expected: {
        rows: [
          0,
          4,
          -4,
          8
        ],
        __options_has_rows: true,
        selected: false,
        __options_has_selected: true
      }
    },
    after: {
      source: `class Host {
  public rows: number[] = [];
  public selection: boolean = false;
  options() {
    return { rows: this.rows.filter(value => value > 0), selected: this.selection };
  }
}
`,
      state: {
        rows: [
          0,
          4,
          -4,
          8
        ],
        selection: false
      },
      expected: {
        rows: [
          4,
          8
        ],
        __options_has_rows: true,
        selected: false,
        __options_has_selected: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'narrow-explicit-null-record',
    boundary: 'The revised caller replaces a nullable record with an optional caption.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public card: { caption: string } | null = null;
  options() {
    return { card: this.card };
  }
}
`,
      state: {
        card: null
      },
      expected: {
        card: null,
        __options_has_card: true
      }
    },
    after: {
      source: `class Host {
  public card: { caption: string } | null = null;
  options() {
    return { caption: this.card?.caption ?? "" };
  }
}
`,
      state: {
        card: null
      },
      expected: {
        caption: '',
        __options_has_caption: true
      }
    },
    removed: [
      'card'
    ],
    added: [
      'caption'
    ]
  },
  {
    id: 'sorted-child-values',
    boundary: 'The new projection sorts a copy of values before handing the option to the child.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items };
  }
}
`,
      state: {
        items: [
          11,
          2,
          9
        ]
      },
      expected: {
        items: [
          11,
          2,
          9
        ],
        __options_has_items: true
      }
    },
    after: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { items: this.items.slice().sort((a, b) => a - b) };
  }
}
`,
      state: {
        items: [
          11,
          2,
          9
        ]
      },
      expected: {
        items: [
          2,
          9,
          11
        ],
        __options_has_items: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'replace-grid-spacing',
    boundary: 'Build the next options from two separate layout inputs after dropping a spacing object.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public spacing = { row: 5, column: 3 };
  options() {
    return { spacing: this.spacing };
  }
}
`,
      state: {
        spacing: {
          row: 5,
          column: 3
        }
      },
      expected: {
        spacing: {
          row: 5,
          column: 3
        },
        __options_has_spacing: true
      }
    },
    after: {
      source: `class Host {
  public spacing = { row: 5, column: 3 };
  options() {
    return { rowGap: this.spacing.row, columnGap: this.spacing.column };
  }
}
`,
      state: {
        spacing: {
          row: 5,
          column: 3
        }
      },
      expected: {
        rowGap: 5,
        __options_has_rowGap: true,
        columnGap: 3,
        __options_has_columnGap: true
      }
    },
    removed: [
      'spacing'
    ],
    added: [
      'columnGap',
      'rowGap'
    ]
  },
  {
    id: 'rotation-and-origin',
    boundary: 'Regenerate a geometry argument after changing just the coordinate calculation.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public corner = { x: 3, y: 5 };
  options() {
    return { position: this.corner };
  }
}
`,
      state: {
        corner: {
          x: 3,
          y: 5
        }
      },
      expected: {
        position: {
          x: 3,
          y: 5
        },
        __options_has_position: true
      }
    },
    after: {
      source: `class Host {
  public corner = { x: 3, y: 5 };
  options() {
    return { position: { x: -this.corner.y, y: this.corner.x } };
  }
}
`,
      state: {
        corner: {
          x: 3,
          y: 5
        }
      },
      expected: {
        position: {
          x: -5,
          y: 3
        },
        __options_has_position: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'separate-fixed-and-flexible',
    boundary: 'Preserve array order as an interleaved view reassigns alternating values to separate options.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public weights: number[] = [];
  options() {
    return { weights: this.weights };
  }
}
`,
      state: {
        weights: [
          12,
          3,
          20,
          5
        ]
      },
      expected: {
        weights: [
          12,
          3,
          20,
          5
        ],
        __options_has_weights: true
      }
    },
    after: {
      source: `class Host {
  public weights: number[] = [];
  options() {
    return { fixed: this.weights.filter((_, i) => i % 2 === 0), flex: this.weights.filter((_, i) => i % 2 !== 0) };
  }
}
`,
      state: {
        weights: [
          12,
          3,
          20,
          5
        ]
      },
      expected: {
        fixed: [
          12,
          20
        ],
        __options_has_fixed: true,
        flex: [
          3,
          5
        ],
        __options_has_flex: true
      }
    },
    removed: [
      'weights'
    ],
    added: [
      'fixed',
      'flex'
    ]
  },
  {
    id: 'rename-nested-visibility',
    boundary: 'The revised view exposes opposite boolean semantics and retains the label.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public entry = { label: "label", hidden: true };
  options() {
    return { entry: this.entry };
  }
}
`,
      state: {
        entry: {
          label: 'label',
          hidden: true
        }
      },
      expected: {
        entry: {
          label: 'label',
          hidden: true
        },
        __options_has_entry: true
      }
    },
    after: {
      source: `class Host {
  public entry = { label: "label", hidden: true };
  options() {
    return { label: this.entry.label, visible: !this.entry.hidden };
  }
}
`,
      state: {
        entry: {
          label: 'label',
          hidden: true
        }
      },
      expected: {
        label: 'label',
        __options_has_label: true,
        visible: false,
        __options_has_visible: true
      }
    },
    removed: [
      'entry'
    ],
    added: [
      'label',
      'visible'
    ]
  },
  {
    id: 'collapsed-row-summary',
    boundary: 'An updated options factory provides a compact model computed from the full list.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { rows: this.rows };
  }
}
`,
      state: {
        rows: [
          3,
          5,
          7
        ]
      },
      expected: {
        rows: [
          3,
          5,
          7
        ],
        __options_has_rows: true
      }
    },
    after: {
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { summary: { count: this.rows.length, first: this.rows[0] ?? 0 } };
  }
}
`,
      state: {
        rows: [
          3,
          5,
          7
        ]
      },
      expected: {
        summary: {
          count: 3,
          first: 3
        },
        __options_has_summary: true
      }
    },
    removed: [
      'rows'
    ],
    added: [
      'summary'
    ]
  },
  {
    id: 'preserve-empty-label-in-record',
    boundary: 'A nested label defaults only across null, keeping a meaningful empty string.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public data: { label: string | null, active: boolean } = { label: null, active: false };
  options() {
    return { label: this.data.label || "item", active: this.data.active };
  }
}
`,
      state: {
        data: {
          label: '',
          active: true
        }
      },
      expected: {
        label: 'item',
        __options_has_label: true,
        active: true,
        __options_has_active: true
      }
    },
    after: {
      source: `class Host {
  public data: { label: string | null, active: boolean } = { label: null, active: false };
  options() {
    return { label: this.data.label ?? "item", active: this.data.active };
  }
}
`,
      state: {
        data: {
          label: '',
          active: true
        }
      },
      expected: {
        label: '',
        __options_has_label: true,
        active: true,
        __options_has_active: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'flatten-section-items',
    boundary: 'A changed child consumes a flat list rather than the prior section model.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public sections: number[][] = [];
  options() {
    return { sections: this.sections };
  }
}
`,
      state: {
        sections: [
          [
            1,
            2
          ],
          [],
          [
            3
          ]
        ]
      },
      expected: {
        sections: [
          [
            1,
            2
          ],
          [],
          [
            3
          ]
        ],
        __options_has_sections: true
      }
    },
    after: {
      source: `class Host {
  public sections: number[][] = [];
  options() {
    return { items: this.sections.flat() };
  }
}
`,
      state: {
        sections: [
          [
            1,
            2
          ],
          [],
          [
            3
          ]
        ]
      },
      expected: {
        items: [
          1,
          2,
          3
        ],
        __options_has_items: true
      }
    },
    removed: [
      'sections'
    ],
    added: [
      'items'
    ]
  },
  {
    id: 'badge-revision-clears-priority',
    boundary: 'Switch the badge payload to a null marker and preserve a zero original score.',
    component: 'ListTile',
    before: {
      source: `class Host {
  public data = { score: 0, highPriority: true };
  options() {
    return { data: this.data };
  }
}
`,
      state: {
        data: {
          score: 0,
          highPriority: true
        }
      },
      expected: {
        data: {
          score: 0,
          highPriority: true
        },
        __options_has_data: true
      }
    },
    after: {
      source: `class Host {
  public data = { score: 0, highPriority: true };
  options() {
    return { priority: this.data.highPriority ? null : "regular", score: this.data.score };
  }
}
`,
      state: {
        data: {
          score: 0,
          highPriority: true
        }
      },
      expected: {
        priority: null,
        __options_has_priority: true,
        score: 0,
        __options_has_score: true
      }
    },
    removed: [
      'data'
    ],
    added: [
      'priority',
      'score'
    ]
  }
];

module.exports = { fixtures };
