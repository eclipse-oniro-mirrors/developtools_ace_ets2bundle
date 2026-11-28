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
    id: 'insert-optional-title',
    boundary: 'Add an explicitly empty title to a call that supplied only count.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { count: 4 };
  }
}
`,
      state: {},
      expected: {
        count: 4,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { count: 4, title: "" };
  }
}
`,
      state: {},
      expected: {
        count: 4,
        __options_has_count: true,
        title: '',
        __options_has_title: true
      }
    },
    removed: [],
    added: [
      'title'
    ]
  },
  {
    id: 'remove-explicit-title',
    boundary: 'Remove only the title presence bit so the new component supplies its default.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { count: 4, title: "sorted" };
  }
}
`,
      state: {},
      expected: {
        count: 4,
        __options_has_count: true,
        title: 'sorted',
        __options_has_title: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { count: 4 };
  }
}
`,
      state: {},
      expected: {
        count: 4,
        __options_has_count: true
      }
    },
    removed: [
      'title'
    ],
    added: []
  },
  {
    id: 'rename-selection-flag',
    boundary: 'Recompile the options object after a public property rename.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { selected: false, count: 3 };
  }
}
`,
      state: {},
      expected: {
        selected: false,
        __options_has_selected: true,
        count: 3,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { active: false, count: 3 };
  }
}
`,
      state: {},
      expected: {
        active: false,
        __options_has_active: true,
        count: 3,
        __options_has_count: true
      }
    },
    removed: [
      'selected'
    ],
    added: [
      'active'
    ]
  },
  {
    id: 'remove-all-optional-props',
    boundary: 'An empty call stops providing all previously explicit options.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { title: "tiles", selected: false };
  }
}
`,
      state: {},
      expected: {
        title: 'tiles',
        __options_has_title: true,
        selected: false,
        __options_has_selected: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return {  };
  }
}
`,
      state: {},
      expected: {}
    },
    removed: [
      'selected',
      'title'
    ],
    added: []
  },
  {
    id: 'introduce-empty-object-and-count',
    boundary: 'A revised call distinguishes an empty collections option from absence.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return {  };
  }
}
`,
      state: {},
      expected: {}
    },
    after: {
      source: `class Host {
  options() {
    return { values: [], count: 0 };
  }
}
`,
      state: {},
      expected: {
        values: [],
        __options_has_values: true,
        count: 0,
        __options_has_count: true
      }
    },
    removed: [],
    added: [
      'count',
      'values'
    ]
  },
  {
    id: 'replace-false-flag-with-empty-label',
    boundary: 'Presence flags distinguish false and empty string across revisions.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { enabled: false };
  }
}
`,
      state: {},
      expected: {
        enabled: false,
        __options_has_enabled: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { title: "" };
  }
}
`,
      state: {},
      expected: {
        title: '',
        __options_has_title: true
      }
    },
    removed: [
      'enabled'
    ],
    added: [
      'title'
    ]
  },
  {
    id: 'remove-first-of-three-fields',
    boundary: 'Delete first option while keeping later fields in the emitted shape.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { leading: "icon", title: "hello", count: 5 };
  }
}
`,
      state: {},
      expected: {
        leading: 'icon',
        __options_has_leading: true,
        title: 'hello',
        __options_has_title: true,
        count: 5,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { title: "hello", count: 5 };
  }
}
`,
      state: {},
      expected: {
        title: 'hello',
        __options_has_title: true,
        count: 5,
        __options_has_count: true
      }
    },
    removed: [
      'leading'
    ],
    added: []
  },
  {
    id: 'remove-middle-field',
    boundary: 'Delete middle option without retaining its marker between sibling assignments.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { first: 1, middle: 2, last: 3 };
  }
}
`,
      state: {},
      expected: {
        first: 1,
        __options_has_first: true,
        middle: 2,
        __options_has_middle: true,
        last: 3,
        __options_has_last: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { first: 1, last: 3 };
  }
}
`,
      state: {},
      expected: {
        first: 1,
        __options_has_first: true,
        last: 3,
        __options_has_last: true
      }
    },
    removed: [
      'middle'
    ],
    added: []
  },
  {
    id: 'remove-trailing-field',
    boundary: 'Delete trailing option and leave earlier options intact.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { first: 1, last: 0 };
  }
}
`,
      state: {},
      expected: {
        first: 1,
        __options_has_first: true,
        last: 0,
        __options_has_last: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { first: 1 };
  }
}
`,
      state: {},
      expected: {
        first: 1,
        __options_has_first: true
      }
    },
    removed: [
      'last'
    ],
    added: []
  },
  {
    id: 'change-layout-modes',
    boundary: 'Swap the explicit layout option and preserve an unrelated tag.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { orientation: "row", tag: "tiles" };
  }
}
`,
      state: {},
      expected: {
        orientation: 'row',
        __options_has_orientation: true,
        tag: 'tiles',
        __options_has_tag: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { columns: 2, tag: "tiles" };
  }
}
`,
      state: {},
      expected: {
        columns: 2,
        __options_has_columns: true,
        tag: 'tiles',
        __options_has_tag: true
      }
    },
    removed: [
      'orientation'
    ],
    added: [
      'columns'
    ]
  },
  {
    id: 'reorder-first-and-last',
    boundary: 'Source ordering changes while the explicit option set and values stay stable.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { label: "summary", count: 8 };
  }
}
`,
      state: {},
      expected: {
        label: 'summary',
        __options_has_label: true,
        count: 8,
        __options_has_count: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { count: 8, label: "summary" };
  }
}
`,
      state: {},
      expected: {
        count: 8,
        __options_has_count: true,
        label: 'summary',
        __options_has_label: true
      }
    },
    removed: [],
    added: []
  },
  {
    id: 'add-null-reset-control',
    boundary: 'Add a null reset while preserving an explicit inactive flag.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { active: false };
  }
}
`,
      state: {},
      expected: {
        active: false,
        __options_has_active: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { active: false, selection: null };
  }
}
`,
      state: {},
      expected: {
        active: false,
        __options_has_active: true,
        selection: null,
        __options_has_selection: true
      }
    },
    removed: [],
    added: [
      'selection'
    ]
  },
  {
    id: 'remove-null-reset-control',
    boundary: 'An absent reset differs from explicitly passing null.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { active: false, selection: null };
  }
}
`,
      state: {},
      expected: {
        active: false,
        __options_has_active: true,
        selection: null,
        __options_has_selection: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { active: false };
  }
}
`,
      state: {},
      expected: {
        active: false,
        __options_has_active: true
      }
    },
    removed: [
      'selection'
    ],
    added: []
  },
  {
    id: 'two-field-replacement',
    boundary: 'Replace geometry bounds with a model-bearing scale and leave a key stable.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { left: 3, right: 17, key: "item" };
  }
}
`,
      state: {},
      expected: {
        left: 3,
        __options_has_left: true,
        right: 17,
        __options_has_right: true,
        key: 'item',
        __options_has_key: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { scale: 2, padding: 4, key: "item" };
  }
}
`,
      state: {},
      expected: {
        scale: 2,
        __options_has_scale: true,
        padding: 4,
        __options_has_padding: true,
        key: 'item',
        __options_has_key: true
      }
    },
    removed: [
      'left',
      'right'
    ],
    added: [
      'padding',
      'scale'
    ]
  },
  {
    id: 'truncate-explicit-empty-array',
    boundary: 'Omit an empty list that previously disabled all visible items.',
    component: 'StaticCard',
    before: {
      source: `class Host {
  options() {
    return { visibleItems: [], limit: 2 };
  }
}
`,
      state: {},
      expected: {
        visibleItems: [],
        __options_has_visibleItems: true,
        limit: 2,
        __options_has_limit: true
      }
    },
    after: {
      source: `class Host {
  options() {
    return { limit: 2 };
  }
}
`,
      state: {},
      expected: {
        limit: 2,
        __options_has_limit: true
      }
    },
    removed: [
      'visibleItems'
    ],
    added: []
  }
];

module.exports = { fixtures };
