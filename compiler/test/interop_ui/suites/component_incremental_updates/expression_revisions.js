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
    id: 'read-revised-parent-state',
    boundary: 'A new caller reads a different host field with the same public key.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public current: number = 1;
  public initial: number = 4;
  options() {
    return { count: this.initial };
  }
}
`,
      state: {
        current: 10,
        initial: 7
      },
      expected: {
        count: 7,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  public current: number = 1;
  public initial: number = 4;
  options() {
    return { count: this.current };
  }
}
`,
      state: {
        current: 10,
        initial: 7
      },
      expected: {
        count: 10,
        __options_has_count: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'use-computed-count',
    boundary: 'A revised expression applies the new divisor for visible cells.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public total: number = 0;
  options() {
    return { count: this.total };
  }
}
`,
      state: {
        total: 11
      },
      expected: {
        count: 11,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  public total: number = 0;
  options() {
    return { count: Math.floor(this.total / 2) };
  }
}
`,
      state: {
        total: 11
      },
      expected: {
        count: 5,
        __options_has_count: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'strict-label-fallback',
    boundary: 'A new null-coalescing fallback preserves an empty title.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public label: string = "";
  options() {
    return { title: this.label || "empty" };
  }
}
`,
      state: {
        label: ''
      },
      expected: {
        title: 'empty',
        __options_has_title: true
      }
    },
    after: {
      source: `class Host {
  public label: string = "";
  options() {
    return { title: this.label ?? "empty" };
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
    removed: [],
    added: []
  },
  {
    id: 'change-boolean-comparison',
    boundary: 'A new threshold is inclusive at the specified boundary.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public size: number = 0;
  options() {
    return { expanded: this.size > 12 };
  }
}
`,
      state: {
        size: 12
      },
      expected: {
        expanded: false,
        __options_has_expanded: true
      }
    },
    after: {
      source: `class Host {
  public size: number = 0;
  options() {
    return { expanded: this.size >= 12 };
  }
}
`,
      state: {
        size: 12
      },
      expected: {
        expanded: true,
        __options_has_expanded: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'change-list-index',
    boundary: 'A changed index reads the correct model value.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { count: this.items[0] };
  }
}
`,
      state: {
        items: [
          4,
          8
        ]
      },
      expected: {
        count: 4,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  public items: number[] = [];
  options() {
    return { count: this.items[1] };
  }
}
`,
      state: {
        items: [
          4,
          8
        ]
      },
      expected: {
        count: 8,
        __options_has_count: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'bounded-opacity',
    boundary: 'A revised expression clamps a computed opacity before it enters the option.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public opacity: number = 1;
  options() {
    return { opacity: this.opacity };
  }
}
`,
      state: {
        opacity: 1.5
      },
      expected: {
        opacity: 1.5,
        __options_has_opacity: true
      }
    },
    after: {
      source: `class Host {
  public opacity: number = 1;
  options() {
    return { opacity: Math.max(0, Math.min(1, this.opacity)) };
  }
}
`,
      state: {
        opacity: 1.5
      },
      expected: {
        opacity: 1,
        __options_has_opacity: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'changed-text-selection',
    boundary: 'Switch from fallback text to a new wrapped heading when the model is active.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public active: boolean = false;
  public title: string = "";
  options() {
    return { title: this.active ? this.title : "inactive" };
  }
}
`,
      state: {
        active: true,
        title: 'tile'
      },
      expected: {
        title: 'tile',
        __options_has_title: true
      }
    },
    after: {
      source: `class Host {
  public active: boolean = false;
  public title: string = "";
  options() {
    return { title: this.active ? "[" + this.title + "]" : "inactive" };
  }
}
`,
      state: {
        active: true,
        title: 'tile'
      },
      expected: {
        title: '[tile]',
        __options_has_title: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'optional-nested-length',
    boundary: 'A new optional read creates a fallback for an absent model.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public model: { title: string } | null = null;
  options() {
    return { hasTitle: this.model !== null };
  }
}
`,
      state: {
        model: {
          title: ''
        }
      },
      expected: {
        hasTitle: true,
        __options_has_hasTitle: true
      }
    },
    after: {
      source: `class Host {
  public model: { title: string } | null = null;
  options() {
    return { hasTitle: (this.model?.title ?? "").length > 0 };
  }
}
`,
      state: {
        model: {
          title: ''
        }
      },
      expected: {
        hasTitle: false,
        __options_has_hasTitle: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'array-expression-collect',
    boundary: 'A revised list option adds a computed footer while retaining the original values.',
    component: 'StaticCard',
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
          5
        ]
      },
      expected: {
        rows: [
          3,
          5
        ],
        __options_has_rows: true
      }
    },
    after: {
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { rows: this.rows.concat(99) };
  }
}
`,
      state: {
        rows: [
          3,
          5
        ]
      },
      expected: {
        rows: [
          3,
          5,
          99
        ],
        __options_has_rows: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'slice-call-range',
    boundary: 'A new visible range narrows the list slice.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { rows: this.rows.slice(0, 3) };
  }
}
`,
      state: {
        rows: [
          1,
          2,
          3,
          4
        ]
      },
      expected: {
        rows: [
          1,
          2,
          3
        ],
        __options_has_rows: true
      }
    },
    after: {
      source: `class Host {
  public rows: number[] = [];
  options() {
    return { rows: this.rows.slice(1, 3) };
  }
}
`,
      state: {
        rows: [
          1,
          2,
          3,
          4
        ]
      },
      expected: {
        rows: [
          2,
          3
        ],
        __options_has_rows: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'new-property-extraction',
    boundary: 'Drop a whole model argument and compute the new property from the same parent field.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public card: { label: string, weight: number } = { label: "", weight: 0 };
  options() {
    return { weight: this.card.weight };
  }
}
`,
      state: {
        card: {
          label: 'item',
          weight: 2
        }
      },
      expected: {
        weight: 2,
        __options_has_weight: true
      }
    },
    after: {
      source: `class Host {
  public card: { label: string, weight: number } = { label: "", weight: 0 };
  options() {
    return { weight: this.card.label.length };
  }
}
`,
      state: {
        card: {
          label: 'item',
          weight: 2
        }
      },
      expected: {
        weight: 4,
        __options_has_weight: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'boolean-short-circuit',
    boundary: 'A changed condition requires both active flags.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public active: boolean = false;
  public visible: boolean = true;
  options() {
    return { enabled: this.active || this.visible };
  }
}
`,
      state: {
        active: true,
        visible: false
      },
      expected: {
        enabled: true,
        __options_has_enabled: true
      }
    },
    after: {
      source: `class Host {
  public active: boolean = false;
  public visible: boolean = true;
  options() {
    return { enabled: this.active && this.visible };
  }
}
`,
      state: {
        active: true,
        visible: false
      },
      expected: {
        enabled: false,
        __options_has_enabled: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'negative-size-to-minimum',
    boundary: 'A new minimum guard is compiled into the caller expression.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public size: number = 0;
  options() {
    return { size: this.size };
  }
}
`,
      state: {
        size: -1
      },
      expected: {
        size: -1,
        __options_has_size: true
      }
    },
    after: {
      source: `class Host {
  public size: number = 0;
  options() {
    return { size: Math.max(0, this.size) };
  }
}
`,
      state: {
        size: -1
      },
      expected: {
        size: 0,
        __options_has_size: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'changed-remaining-capacity',
    boundary: 'A new occupancy limit drives the regenerated badge content.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public total: number = 1;
  public visible: number = 1;
  options() {
    return { remaining: this.total };
  }
}
`,
      state: {
        total: 8,
        visible: 3
      },
      expected: {
        remaining: 8,
        __options_has_remaining: true
      }
    },
    after: {
      source: `class Host {
  public total: number = 1;
  public visible: number = 1;
  options() {
    return { remaining: this.total - this.visible };
  }
}
`,
      state: {
        total: 8,
        visible: 3
      },
      expected: {
        remaining: 5,
        __options_has_remaining: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'string-normalized',
    boundary: 'A revised field strips whitespace from an explicit label.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public label: string = "";
  options() {
    return { label: this.label };
  }
}
`,
      state: {
        label: '  tile  '
      },
      expected: {
        label: '  tile  ',
        __options_has_label: true
      }
    },
    after: {
      source: `class Host {
  public label: string = "";
  options() {
    return { label: this.label.trim() };
  }
}
`,
      state: {
        label: '  tile  '
      },
      expected: {
        label: 'tile',
        __options_has_label: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'two-stage-number-format',
    boundary: 'A revised caller formats the badge with more precise decimal evidence.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  public value: number = 0;
  options() {
    return { badge: this.value.toFixed(0) };
  }
}
`,
      state: {
        value: 2.4
      },
      expected: {
        badge: '2',
        __options_has_badge: true
      }
    },
    after: {
      source: `class Host {
  public value: number = 0;
  options() {
    return { badge: this.value.toFixed(1) };
  }
}
`,
      state: {
        value: 2.4
      },
      expected: {
        badge: '2.4',
        __options_has_badge: true
      }
    },
    removed: [],
    added: []
  }
];

module.exports = { fixtures };
