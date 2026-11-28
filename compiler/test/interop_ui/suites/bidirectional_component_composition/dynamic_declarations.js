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
    id: 'decl-separate-item-index',
    boundary: 'Sibling exports distinguish an indexed item from a label.',
    source: `@Component
export struct ItemIndex {
  @State index: number = 0;
  @State active: boolean = true;
  build() {
    Text("decl-separate-item-index-left").id("ItemIndexText")
  }
}

@Component
export struct SectionHeading {
  @State title: string = "Section";
  build() {
    Text("decl-separate-item-index-right").id("SectionHeadingText")
  }
}
`,
    components: [
      {
        name: 'ItemIndex',
        properties: {
          index: 'number',
          active: 'boolean'
        },
        absent: [
          'title'
        ]
      },
      {
        name: 'SectionHeading',
        properties: {
          title: 'string'
        },
        absent: [
          'active',
          'index'
        ]
      }
    ]
  },
  {
    id: 'decl-two-labels-different-names',
    boundary: 'Distinct names keep disclosure properties independent.',
    source: `@Component
export struct Disclosure {
  @State title: string = "Summary";
  @State expanded: boolean = false;
  build() {
    Text("decl-two-labels-different-names-left").id("DisclosureText")
  }
}

@Component
export struct FavoriteTile {
  @State label: string = "Item";
  @State favorite: boolean = false;
  build() {
    Text("decl-two-labels-different-names-right").id("FavoriteTileText")
  }
}
`,
    components: [
      {
        name: 'Disclosure',
        properties: {
          title: 'string',
          expanded: 'boolean'
        },
        absent: [
          'favorite',
          'label'
        ]
      },
      {
        name: 'FavoriteTile',
        properties: {
          label: 'string',
          favorite: 'boolean'
        },
        absent: [
          'expanded',
          'title'
        ]
      }
    ]
  },
  {
    id: 'decl-colliding-field-name',
    boundary: 'The same member name retains each owner’s own type.',
    source: `@Component
export struct ActiveIndex {
  @State selected: number = 0;
  build() {
    Text("decl-colliding-field-name-left").id("ActiveIndexText")
  }
}

@Component
export struct SelectionSwitch {
  @State selected: boolean = false;
  build() {
    Text("decl-colliding-field-name-right").id("SelectionSwitchText")
  }
}
`,
    components: [
      {
        name: 'ActiveIndex',
        properties: {
          selected: 'number'
        },
        absent: []
      },
      {
        name: 'SelectionSwitch',
        properties: {
          selected: 'boolean'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-heading-and-spacer',
    boundary: 'A component without state owns no sibling option.',
    source: `@Component
export struct PageHeading {
  @State title: string = "Header";
  build() {
    Text("decl-heading-and-spacer-left").id("PageHeadingText")
  }
}

@Component
export struct PageSpacer {
  build() {
    Text("decl-heading-and-spacer-right").id("PageSpacerText")
  }
}
`,
    components: [
      {
        name: 'PageHeading',
        properties: {
          title: 'string'
        },
        absent: []
      },
      {
        name: 'PageSpacer',
        properties: {},
        absent: [
          'title'
        ]
      }
    ]
  },
  {
    id: 'decl-two-stateless-components',
    boundary: 'Stateless siblings still expose their individual structural identities.',
    source: `@Component
export struct IntroLabel {
  build() {
    Text("decl-two-stateless-components-left").id("IntroLabelText")
  }
}

@Component
export struct ExitLabel {
  build() {
    Text("decl-two-stateless-components-right").id("ExitLabelText")
  }
}
`,
    components: [
      {
        name: 'IntroLabel',
        properties: {},
        absent: []
      },
      {
        name: 'ExitLabel',
        properties: {},
        absent: []
      }
    ]
  },
  {
    id: 'decl-three-number-kind-members',
    boundary: 'Multiple numeric members survive independently on the correct projection.',
    source: `@Component
export struct Insets {
  @State left: number = 1;
  @State right: number = 2;
  @State gap: number = 8;
  build() {
    Text("decl-three-number-kind-members-left").id("InsetsText")
  }
}

@Component
export struct ContentSize {
  @State width: number = 12;
  @State height: number = 14;
  build() {
    Text("decl-three-number-kind-members-right").id("ContentSizeText")
  }
}
`,
    components: [
      {
        name: 'Insets',
        properties: {
          left: 'number',
          right: 'number',
          gap: 'number'
        },
        absent: [
          'height',
          'width'
        ]
      },
      {
        name: 'ContentSize',
        properties: {
          width: 'number',
          height: 'number'
        },
        absent: [
          'gap',
          'left',
          'right'
        ]
      }
    ]
  },
  {
    id: 'decl-sharing-field-plus-distinct',
    boundary: 'Only shared fields appear on both projected owners.',
    source: `@Component
export struct PrimaryLine {
  @State active: boolean = true;
  @State primaryLabel: string = "A";
  build() {
    Text("decl-sharing-field-plus-distinct-left").id("PrimaryLineText")
  }
}

@Component
export struct SecondaryLine {
  @State active: boolean = false;
  @State secondaryLabel: string = "B";
  build() {
    Text("decl-sharing-field-plus-distinct-right").id("SecondaryLineText")
  }
}
`,
    components: [
      {
        name: 'PrimaryLine',
        properties: {
          active: 'boolean',
          primaryLabel: 'string'
        },
        absent: [
          'secondaryLabel'
        ]
      },
      {
        name: 'SecondaryLine',
        properties: {
          active: 'boolean',
          secondaryLabel: 'string'
        },
        absent: [
          'primaryLabel'
        ]
      }
    ]
  },
  {
    id: 'decl-label-type-collision',
    boundary: 'Different content kinds stay local to each slot even with the same field.',
    source: `@Component
export struct Pixels {
  @State value: number = 0;
  @State units: string = "px";
  build() {
    Text("decl-label-type-collision-left").id("PixelsText")
  }
}

@Component
export struct InputLabel {
  @State value: string = "content";
  @State editable: boolean = true;
  build() {
    Text("decl-label-type-collision-right").id("InputLabelText")
  }
}
`,
    components: [
      {
        name: 'Pixels',
        properties: {
          value: 'number',
          units: 'string'
        },
        absent: [
          'editable'
        ]
      },
      {
        name: 'InputLabel',
        properties: {
          value: 'string',
          editable: 'boolean'
        },
        absent: [
          'units'
        ]
      }
    ]
  },
  {
    id: 'decl-ambiguity-in-option-order',
    boundary: 'Opposing property order must not collapse the option contracts.',
    source: `@Component
export struct LabelFirst {
  @State label: string = "Label";
  @State count: number = 0;
  build() {
    Text("decl-ambiguity-in-option-order-left").id("LabelFirstText")
  }
}

@Component
export struct CountFirst {
  @State count: number = 0;
  @State label: string = "Badge";
  build() {
    Text("decl-ambiguity-in-option-order-right").id("CountFirstText")
  }
}
`,
    components: [
      {
        name: 'LabelFirst',
        properties: {
          label: 'string',
          count: 'number'
        },
        absent: []
      },
      {
        name: 'CountFirst',
        properties: {
          count: 'number',
          label: 'string'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-nullable-title-and-required-title',
    boundary: 'Nullable text retains its local declaration while a sibling requires text.',
    source: `@Component
export struct OptionalTitle {
  @State title: string | null = null;
  build() {
    Text("decl-nullable-title-and-required-title-left").id("OptionalTitleText")
  }
}

@Component
export struct RequiredTitle {
  @State title: string = "Header";
  build() {
    Text("decl-nullable-title-and-required-title-right").id("RequiredTitleText")
  }
}
`,
    components: [
      {
        name: 'OptionalTitle',
        properties: {
          title: 'string | null'
        },
        absent: []
      },
      {
        name: 'RequiredTitle',
        properties: {
          title: 'string'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-state-array-and-scalar',
    boundary: 'Projected indexed payload and a scalar model each keep their own type.',
    source: `@Component
export struct ListPane {
  @State values: number[] = [1,2];
  build() {
    Text("decl-state-array-and-scalar-left").id("ListPaneText")
  }
}

@Component
export struct ReducedPane {
  @State value: number = 1;
  build() {
    Text("decl-state-array-and-scalar-right").id("ReducedPaneText")
  }
}
`,
    components: [
      {
        name: 'ListPane',
        properties: {
          values: 'es.Array<number>'
        },
        absent: [
          'value'
        ]
      },
      {
        name: 'ReducedPane',
        properties: {
          value: 'number'
        },
        absent: [
          'values'
        ]
      }
    ]
  },
  {
    id: 'decl-chart-and-summary-number',
    boundary: 'Generated records retain both branches of a combined data display.',
    source: `@Component
export struct ChartInfo {
  @State caption: string = "Chart";
  @State min: number = 0;
  @State max: number = 10;
  build() {
    Text("decl-chart-and-summary-number-left").id("ChartInfoText")
  }
}

@Component
export struct SummaryInfo {
  @State title: string = "Summary";
  @State total: number = 10;
  build() {
    Text("decl-chart-and-summary-number-right").id("SummaryInfoText")
  }
}
`,
    components: [
      {
        name: 'ChartInfo',
        properties: {
          caption: 'string',
          min: 'number',
          max: 'number'
        },
        absent: [
          'title',
          'total'
        ]
      },
      {
        name: 'SummaryInfo',
        properties: {
          title: 'string',
          total: 'number'
        },
        absent: [
          'caption',
          'max',
          'min'
        ]
      }
    ]
  },
  {
    id: 'decl-layered-edit-in-progress',
    boundary: 'Two separate interactive modes preserve text, numeric and boolean fields.',
    source: `@Component
export struct EditorBar {
  @State current: string = "Editing";
  @State dirty: boolean = false;
  build() {
    Text("decl-layered-edit-in-progress-left").id("EditorBarText")
  }
}

@Component
export struct InputSettings {
  @State maxLength: number = 32;
  @State focused: boolean = true;
  build() {
    Text("decl-layered-edit-in-progress-right").id("InputSettingsText")
  }
}
`,
    components: [
      {
        name: 'EditorBar',
        properties: {
          current: 'string',
          dirty: 'boolean'
        },
        absent: [
          'focused',
          'maxLength'
        ]
      },
      {
        name: 'InputSettings',
        properties: {
          maxLength: 'number',
          focused: 'boolean'
        },
        absent: [
          'current',
          'dirty'
        ]
      }
    ]
  },
  {
    id: 'decl-empty-left-producer',
    boundary: 'The left producer does not inherit options from its right neighbor.',
    source: `@Component
export struct BackgroundLine {
  build() {
    Text("decl-empty-left-producer-left").id("BackgroundLineText")
  }
}

@Component
export struct TimerValue {
  @State time: number = 0;
  @State paused: boolean = false;
  build() {
    Text("decl-empty-left-producer-right").id("TimerValueText")
  }
}
`,
    components: [
      {
        name: 'BackgroundLine',
        properties: {},
        absent: [
          'paused',
          'time'
        ]
      },
      {
        name: 'TimerValue',
        properties: {
          time: 'number',
          paused: 'boolean'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-number-nullable',
    boundary: 'The number-or-null boundary is local to the first provider.',
    source: `@Component
export struct OptionalCount {
  @State count: number | null = null;
  build() {
    Text("decl-number-nullable-left").id("OptionalCountText")
  }
}

@Component
export struct FixedCount {
  @State count: number = 7;
  build() {
    Text("decl-number-nullable-right").id("FixedCountText")
  }
}
`,
    components: [
      {
        name: 'OptionalCount',
        properties: {
          count: 'number | null'
        },
        absent: []
      },
      {
        name: 'FixedCount',
        properties: {
          count: 'number'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-two-role-histories',
    boundary: 'Identically named fields on unrelated component records do not alias.',
    source: `@Component
export struct ToastStatus {
  @State enabled: boolean = true;
  @State hint: string = "Instant";
  @State rank: number = 0;
  build() {
    Text("decl-two-role-histories-left").id("ToastStatusText")
  }
}

@Component
export struct QueueStatus {
  @State enabled: boolean = true;
  @State priority: number = 2;
  build() {
    Text("decl-two-role-histories-right").id("QueueStatusText")
  }
}
`,
    components: [
      {
        name: 'ToastStatus',
        properties: {
          enabled: 'boolean',
          hint: 'string',
          rank: 'number'
        },
        absent: [
          'priority'
        ]
      },
      {
        name: 'QueueStatus',
        properties: {
          enabled: 'boolean',
          priority: 'number'
        },
        absent: [
          'hint',
          'rank'
        ]
      }
    ]
  },
  {
    id: 'decl-nested-array-rank',
    boundary: 'Different array rank remains local to each child.',
    source: `@Component
export struct RowList {
  @State items: number[] = [1];
  build() {
    Text("decl-nested-array-rank-left").id("RowListText")
  }
}

@Component
export struct MatrixList {
  @State items: number[][] = [[1]];
  build() {
    Text("decl-nested-array-rank-right").id("MatrixListText")
  }
}
`,
    components: [
      {
        name: 'RowList',
        properties: {
          items: 'es.Array<number>'
        },
        absent: []
      },
      {
        name: 'MatrixList',
        properties: {
          items: 'es.Array<es.Array<number>>'
        },
        absent: []
      }
    ]
  },
  {
    id: 'decl-build-field-names',
    boundary: 'Names shared with UI layout concepts remain ordinary state on the correct owner.',
    source: `@Component
export struct RelativeColumn {
  @State width: string = "100%";
  @State spacing: number = 8;
  build() {
    Text("decl-build-field-names-left").id("RelativeColumnText")
  }
}

@Component
export struct FixedRow {
  @State height: number = 14;
  @State margin: number = 1;
  build() {
    Text("decl-build-field-names-right").id("FixedRowText")
  }
}
`,
    components: [
      {
        name: 'RelativeColumn',
        properties: {
          width: 'string',
          spacing: 'number'
        },
        absent: [
          'height',
          'margin'
        ]
      },
      {
        name: 'FixedRow',
        properties: {
          height: 'number',
          margin: 'number'
        },
        absent: [
          'spacing',
          'width'
        ]
      }
    ]
  },
  {
    id: 'decl-multiple-visible-statuses',
    boundary: 'State options representing dependent visibility remain distinct across siblings.',
    source: `@Component
export struct LoadingStatus {
  @State ready: boolean = false;
  @State message: string = "";
  build() {
    Text("decl-multiple-visible-statuses-left").id("LoadingStatusText")
  }
}

@Component
export struct ErrorStatus {
  @State visible: boolean = false;
  @State errorCode: number = 0;
  build() {
    Text("decl-multiple-visible-statuses-right").id("ErrorStatusText")
  }
}
`,
    components: [
      {
        name: 'LoadingStatus',
        properties: {
          ready: 'boolean',
          message: 'string'
        },
        absent: [
          'errorCode',
          'visible'
        ]
      },
      {
        name: 'ErrorStatus',
        properties: {
          visible: 'boolean',
          errorCode: 'number'
        },
        absent: [
          'message',
          'ready'
        ]
      }
    ]
  },
  {
    id: 'decl-optional-bool-status',
    boundary: 'Absent status is distinct from a definite status in the sibling.',
    source: `@Component
export struct OptionalStatus {
  @State active: boolean | undefined = undefined;
  build() {
    Text("decl-optional-bool-status-left").id("OptionalStatusText")
  }
}

@Component
export struct FixedStatus {
  @State active: boolean = true;
  build() {
    Text("decl-optional-bool-status-right").id("FixedStatusText")
  }
}
`,
    components: [
      {
        name: 'OptionalStatus',
        properties: {
          active: 'boolean | undefined'
        },
        absent: []
      },
      {
        name: 'FixedStatus',
        properties: {
          active: 'boolean'
        },
        absent: []
      }
    ]
  }
];

module.exports = { fixtures };
