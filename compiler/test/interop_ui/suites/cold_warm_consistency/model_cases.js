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
    id: 'view-caption-interface',
    boundary: 'A package edge through a pure interface retains its property and public callable.',
    sources: {
      'Index.ets': `export { CaptionModel } from "./src/main/ets/CaptionModel";
export { caption } from "./src/main/ets/CaptionModelView";
`,
      'src/main/ets/CaptionModel.ets': `export interface CaptionModel { text: string; }
`,
      'src/main/ets/CaptionModelView.ets': `import { CaptionModel } from "./CaptionModel";
export function caption(model: CaptionModel): string {
  return model.text;
}
`
    },
    origins: {
      CaptionModel: {
        file: 'src/main/ets/CaptionModel',
        local: 'CaptionModel'
      },
      caption: {
        file: 'src/main/ets/CaptionModelView',
        local: 'caption'
      }
    },
    signatures: {
      'src/main/ets/CaptionModel': [
        'text: string;'
      ],
      'src/main/ets/CaptionModelView': [
        'function caption(model: CaptionModel): string;'
      ],
      Index: [
        '{ CaptionModel }',
        '{ caption }'
      ]
    }
  },
  {
    id: 'optional-view-caption',
    boundary: 'Optional property survives the warm declaration pass.',
    sources: {
      'Index.ets': `export { OptionalCaption } from "./src/main/ets/OptionalCaption";
export { captionOrEmpty } from "./src/main/ets/OptionalCaptionView";
`,
      'src/main/ets/OptionalCaption.ets': `export interface OptionalCaption { text?: string; }
`,
      'src/main/ets/OptionalCaptionView.ets': `import { OptionalCaption } from "./OptionalCaption";
export function captionOrEmpty(model: OptionalCaption): string {
  return model.text ?? "";
}
`
    },
    origins: {
      OptionalCaption: {
        file: 'src/main/ets/OptionalCaption',
        local: 'OptionalCaption'
      },
      captionOrEmpty: {
        file: 'src/main/ets/OptionalCaptionView',
        local: 'captionOrEmpty'
      }
    },
    signatures: {
      'src/main/ets/OptionalCaption': [
        'text?: string;'
      ],
      'src/main/ets/OptionalCaptionView': [
        'function captionOrEmpty(model: OptionalCaption): string;'
      ],
      Index: [
        '{ OptionalCaption }',
        '{ captionOrEmpty }'
      ]
    }
  },
  {
    id: 'readonly-metric',
    boundary: 'The warm layout model retains readonly field syntax.',
    sources: {
      'Index.ets': `export { Metrics } from "./src/main/ets/Metrics";
export { width } from "./src/main/ets/MetricsView";
`,
      'src/main/ets/Metrics.ets': `export interface Metrics { readonly width: number; }
`,
      'src/main/ets/MetricsView.ets': `import { Metrics } from "./Metrics";
export function width(model: Metrics): number {
  return model.width;
}
`
    },
    origins: {
      Metrics: {
        file: 'src/main/ets/Metrics',
        local: 'Metrics'
      },
      width: {
        file: 'src/main/ets/MetricsView',
        local: 'width'
      }
    },
    signatures: {
      'src/main/ets/Metrics': [
        'readonly width: number;'
      ],
      'src/main/ets/MetricsView': [
        'function width(model: Metrics): number;'
      ],
      Index: [
        '{ Metrics }',
        '{ width }'
      ]
    }
  },
  {
    id: 'flex-size-nullable',
    boundary: 'Nullable plain values survive package projection and an unchanged declaration cache.',
    sources: {
      'Index.ets': `export { FlexValue } from "./src/main/ets/FlexValue";
export { flex } from "./src/main/ets/FlexValueView";
`,
      'src/main/ets/FlexValue.ets': `export type FlexValue = number | null;
`,
      'src/main/ets/FlexValueView.ets': `import { FlexValue } from "./FlexValue";
export function flex(model: FlexValue): number {
  return model ?? 0;
}
`
    },
    origins: {
      FlexValue: {
        file: 'src/main/ets/FlexValue',
        local: 'FlexValue'
      },
      flex: {
        file: 'src/main/ets/FlexValueView',
        local: 'flex'
      }
    },
    signatures: {
      'src/main/ets/FlexValue': [
        'type FlexValue = number | null;'
      ],
      'src/main/ets/FlexValueView': [
        'function flex(model: FlexValue): number;'
      ],
      Index: [
        '{ FlexValue }',
        '{ flex }'
      ]
    }
  },
  {
    id: 'layout-orientation-union',
    boundary: 'The declaration cache preserves two permitted string literals.',
    sources: {
      'Index.ets': `export { Direction } from "./src/main/ets/Direction";
export { asLabel } from "./src/main/ets/DirectionView";
`,
      'src/main/ets/Direction.ets': `export type Direction = "row" | "column";
`,
      'src/main/ets/DirectionView.ets': `import { Direction } from "./Direction";
export function asLabel(model: Direction): string {
  return model;
}
`
    },
    origins: {
      Direction: {
        file: 'src/main/ets/Direction',
        local: 'Direction'
      },
      asLabel: {
        file: 'src/main/ets/DirectionView',
        local: 'asLabel'
      }
    },
    signatures: {
      'src/main/ets/Direction': [
        'type Direction = "row" | "column";'
      ],
      'src/main/ets/DirectionView': [
        'function asLabel(model: Direction): string;'
      ],
      Index: [
        '{ Direction }',
        '{ asLabel }'
      ]
    }
  },
  {
    id: 'static-layout-enum',
    boundary: 'Enum declaration and function imports retain the same identity across passes.',
    sources: {
      'Index.ets': `export { Axis } from "./src/main/ets/Axis";
export { asNumber } from "./src/main/ets/AxisView";
`,
      'src/main/ets/Axis.ets': `export enum Axis { Horizontal = 1, Vertical = 2 }
`,
      'src/main/ets/AxisView.ets': `import { Axis } from "./Axis";
export function asNumber(model: Axis): number {
  return model;
}
`
    },
    origins: {
      Axis: {
        file: 'src/main/ets/Axis',
        local: 'Axis'
      },
      asNumber: {
        file: 'src/main/ets/AxisView',
        local: 'asNumber'
      }
    },
    signatures: {
      'src/main/ets/Axis': [
        'Vertical = 2'
      ],
      'src/main/ets/AxisView': [
        'function asNumber(model: Axis): number;'
      ],
      Index: [
        '{ Axis }',
        '{ asNumber }'
      ]
    }
  },
  {
    id: 'lifecycle-model-call',
    boundary: 'The interface callback signature remains visible with the actual result type.',
    sources: {
      'Index.ets': `export { Lifecycle } from "./src/main/ets/Lifecycle";
export { start } from "./src/main/ets/LifecycleView";
`,
      'src/main/ets/Lifecycle.ets': `export interface Lifecycle { mount(): boolean; }
`,
      'src/main/ets/LifecycleView.ets': `import { Lifecycle } from "./Lifecycle";
export function start(model: Lifecycle): boolean {
  return model.mount();
}
`
    },
    origins: {
      Lifecycle: {
        file: 'src/main/ets/Lifecycle',
        local: 'Lifecycle'
      },
      start: {
        file: 'src/main/ets/LifecycleView',
        local: 'start'
      }
    },
    signatures: {
      'src/main/ets/Lifecycle': [
        'mount(): boolean;'
      ],
      'src/main/ets/LifecycleView': [
        'function start(model: Lifecycle): boolean;'
      ],
      Index: [
        '{ Lifecycle }',
        '{ start }'
      ]
    }
  },
  {
    id: 'render-rule-call',
    boundary: 'A named exported call signature remains separate from the UI wrapper.',
    sources: {
      'Index.ets': `export { RenderRule } from "./src/main/ets/RenderRule";
export { isVisible } from "./src/main/ets/RenderRuleView";
`,
      'src/main/ets/RenderRule.ets': `export type RenderRule = (value: number) => boolean;
`,
      'src/main/ets/RenderRuleView.ets': `import { RenderRule } from "./RenderRule";
export function isVisible(model: RenderRule): boolean {
  return model(2);
}
`
    },
    origins: {
      RenderRule: {
        file: 'src/main/ets/RenderRule',
        local: 'RenderRule'
      },
      isVisible: {
        file: 'src/main/ets/RenderRuleView',
        local: 'isVisible'
      }
    },
    signatures: {
      'src/main/ets/RenderRule': [
        '(value: number) => boolean'
      ],
      'src/main/ets/RenderRuleView': [
        'function isVisible(model: RenderRule): boolean;'
      ],
      Index: [
        '{ RenderRule }',
        '{ isVisible }'
      ]
    }
  },
  {
    id: 'nullable-members',
    boundary: 'A union-valued member remains in the generated class projection.',
    sources: {
      'Index.ets': `export { Badge } from "./src/main/ets/Badge";
export { badgeText } from "./src/main/ets/BadgeView";
`,
      'src/main/ets/Badge.ets': `export class Badge { label: string | null = null; }
`,
      'src/main/ets/BadgeView.ets': `import { Badge } from "./Badge";
export function badgeText(model: Badge): string {
  return model.label ?? "";
}
`
    },
    origins: {
      Badge: {
        file: 'src/main/ets/Badge',
        local: 'Badge'
      },
      badgeText: {
        file: 'src/main/ets/BadgeView',
        local: 'badgeText'
      }
    },
    signatures: {
      'src/main/ets/Badge': [
        'label: string | null;'
      ],
      'src/main/ets/BadgeView': [
        'function badgeText(model: Badge): string;'
      ],
      Index: [
        '{ Badge }',
        '{ badgeText }'
      ]
    }
  },
  {
    id: 'private-layout-state',
    boundary: 'A class exports a public accessor while keeping implementation out of the facade.',
    sources: {
      'Index.ets': `export { Panel } from "./src/main/ets/Panel";
export { currentHeight } from "./src/main/ets/PanelView";
`,
      'src/main/ets/Panel.ets': `export class Panel { private value: number = 1; get height(): number { return this.value; } }
`,
      'src/main/ets/PanelView.ets': `import { Panel } from "./Panel";
export function currentHeight(model: Panel): number {
  return model.height;
}
`
    },
    origins: {
      Panel: {
        file: 'src/main/ets/Panel',
        local: 'Panel'
      },
      currentHeight: {
        file: 'src/main/ets/PanelView',
        local: 'currentHeight'
      }
    },
    signatures: {
      'src/main/ets/Panel': [
        'get height(): number;'
      ],
      'src/main/ets/PanelView': [
        'function currentHeight(model: Panel): number;'
      ],
      Index: [
        '{ Panel }',
        '{ currentHeight }'
      ]
    }
  },
  {
    id: 'constructor-public-fields',
    boundary: 'Default field and constructor declarations retain the same identity.',
    sources: {
      'Index.ets': `export { RowKey } from "./src/main/ets/RowKey";
export { toText } from "./src/main/ets/RowKeyView";
`,
      'src/main/ets/RowKey.ets': `export class RowKey { constructor(public name: string) {} }
`,
      'src/main/ets/RowKeyView.ets': `import { RowKey } from "./RowKey";
export function toText(model: RowKey): string {
  return model.name;
}
`
    },
    origins: {
      RowKey: {
        file: 'src/main/ets/RowKey',
        local: 'RowKey'
      },
      toText: {
        file: 'src/main/ets/RowKeyView',
        local: 'toText'
      }
    },
    signatures: {
      'src/main/ets/RowKey': [
        'name: string'
      ],
      'src/main/ets/RowKeyView': [
        'function toText(model: RowKey): string;'
      ],
      Index: [
        '{ RowKey }',
        '{ toText }'
      ]
    }
  },
  {
    id: 'default-value-view',
    boundary: 'A producer optional default is still a callable in every generation.',
    sources: {
      'Index.ets': `export { Overlay } from "./src/main/ets/Overlay";
export { alpha } from "./src/main/ets/OverlayView";
`,
      'src/main/ets/Overlay.ets': `export class Overlay { opacity: number = 1; }
`,
      'src/main/ets/OverlayView.ets': `import { Overlay } from "./Overlay";
export function alpha(model: Overlay): number {
  return model.opacity;
}
`
    },
    origins: {
      Overlay: {
        file: 'src/main/ets/Overlay',
        local: 'Overlay'
      },
      alpha: {
        file: 'src/main/ets/OverlayView',
        local: 'alpha'
      }
    },
    signatures: {
      'src/main/ets/Overlay': [
        'opacity: number;'
      ],
      'src/main/ets/OverlayView': [
        'function alpha(model: Overlay): number;'
      ],
      Index: [
        '{ Overlay }',
        '{ alpha }'
      ]
    }
  },
  {
    id: 'keyboard-event-method',
    boundary: 'UI event parameter remains numeric in the public declaration.',
    sources: {
      'Index.ets': `export { KeyHandler } from "./src/main/ets/KeyHandler";
export { activate } from "./src/main/ets/KeyHandlerView";
`,
      'src/main/ets/KeyHandler.ets': `export interface KeyHandler { onKey(key: number): boolean; }
`,
      'src/main/ets/KeyHandlerView.ets': `import { KeyHandler } from "./KeyHandler";
export function activate(model: KeyHandler): boolean {
  return model.onKey(13);
}
`
    },
    origins: {
      KeyHandler: {
        file: 'src/main/ets/KeyHandler',
        local: 'KeyHandler'
      },
      activate: {
        file: 'src/main/ets/KeyHandlerView',
        local: 'activate'
      }
    },
    signatures: {
      'src/main/ets/KeyHandler': [
        'onKey(key: number): boolean;'
      ],
      'src/main/ets/KeyHandlerView': [
        'function activate(model: KeyHandler): boolean;'
      ],
      Index: [
        '{ KeyHandler }',
        '{ activate }'
      ]
    }
  },
  {
    id: 'boolean-with-string-payload',
    boundary: 'A method signature keeps the position of boolean and label properties.',
    sources: {
      'Index.ets': `export { RowAction } from "./src/main/ets/RowAction";
export { select } from "./src/main/ets/RowActionView";
`,
      'src/main/ets/RowAction.ets': `export interface RowAction { run(selected: boolean, label: string): boolean; }
`,
      'src/main/ets/RowActionView.ets': `import { RowAction } from "./RowAction";
export function select(model: RowAction): boolean {
  return model.run(true, "row");
}
`
    },
    origins: {
      RowAction: {
        file: 'src/main/ets/RowAction',
        local: 'RowAction'
      },
      select: {
        file: 'src/main/ets/RowActionView',
        local: 'select'
      }
    },
    signatures: {
      'src/main/ets/RowAction': [
        'run(selected: boolean, label: string): boolean;'
      ],
      'src/main/ets/RowActionView': [
        'function select(model: RowAction): boolean;'
      ],
      Index: [
        '{ RowAction }',
        '{ select }'
      ]
    }
  },
  {
    id: 'callback-options-field',
    boundary: 'Nested function-valued property survives source, declaration and re-export maps.',
    sources: {
      'Index.ets': `export { ButtonOptions } from "./src/main/ets/ButtonOptions";
export { press } from "./src/main/ets/ButtonOptionsView";
`,
      'src/main/ets/ButtonOptions.ets': `export interface ButtonOptions { action: () => boolean; }
`,
      'src/main/ets/ButtonOptionsView.ets': `import { ButtonOptions } from "./ButtonOptions";
export function press(model: ButtonOptions): boolean {
  return model.action();
}
`
    },
    origins: {
      ButtonOptions: {
        file: 'src/main/ets/ButtonOptions',
        local: 'ButtonOptions'
      },
      press: {
        file: 'src/main/ets/ButtonOptionsView',
        local: 'press'
      }
    },
    signatures: {
      'src/main/ets/ButtonOptions': [
        'action: () => boolean;'
      ],
      'src/main/ets/ButtonOptionsView': [
        'function press(model: ButtonOptions): boolean;'
      ],
      Index: [
        '{ ButtonOptions }',
        '{ press }'
      ]
    }
  },
  {
    id: 'readonly-array-projection',
    boundary: 'A list type stays parameterized in declaration-cache runs.',
    sources: {
      'Index.ets': `export { MenuItems } from "./src/main/ets/MenuItems";
export { count } from "./src/main/ets/MenuItemsView";
`,
      'src/main/ets/MenuItems.ets': `export type MenuItems = string[];
`,
      'src/main/ets/MenuItemsView.ets': `import { MenuItems } from "./MenuItems";
export function count(model: MenuItems): number {
  return model.length;
}
`
    },
    origins: {
      MenuItems: {
        file: 'src/main/ets/MenuItems',
        local: 'MenuItems'
      },
      count: {
        file: 'src/main/ets/MenuItemsView',
        local: 'count'
      }
    },
    signatures: {
      'src/main/ets/MenuItems': [
        'type MenuItems = es.Array<string>;'
      ],
      'src/main/ets/MenuItemsView': [
        'function count(model: MenuItems): number;'
      ],
      Index: [
        '{ MenuItems }',
        '{ count }'
      ]
    }
  },
  {
    id: 'nested-sizes-projection',
    boundary: 'Both projected array dimensions remain in the warm declaration.',
    sources: {
      'Index.ets': `export { GridTracks } from "./src/main/ets/GridTracks";
export { trackCount } from "./src/main/ets/GridTracksView";
`,
      'src/main/ets/GridTracks.ets': `export type GridTracks = number[][];
`,
      'src/main/ets/GridTracksView.ets': `import { GridTracks } from "./GridTracks";
export function trackCount(model: GridTracks): number {
  return model.length;
}
`
    },
    origins: {
      GridTracks: {
        file: 'src/main/ets/GridTracks',
        local: 'GridTracks'
      },
      trackCount: {
        file: 'src/main/ets/GridTracksView',
        local: 'trackCount'
      }
    },
    signatures: {
      'src/main/ets/GridTracks': [
        'type GridTracks = es.Array<es.Array<number>>;'
      ],
      'src/main/ets/GridTracksView': [
        'function trackCount(model: GridTracks): number;'
      ],
      Index: [
        '{ GridTracks }',
        '{ trackCount }'
      ]
    }
  },
  {
    id: 'observable-inherited-interface',
    boundary: 'Inherited layout data retains its declared extension.',
    sources: {
      'Index.ets': `export { VisibleRow } from "./src/main/ets/VisibleRow";
export { text } from "./src/main/ets/VisibleRowView";
`,
      'src/main/ets/VisibleRow.ets': `export interface BaseData { title: string; }
export interface VisibleRow extends BaseData { visible: boolean; }
`,
      'src/main/ets/VisibleRowView.ets': `import { VisibleRow } from "./VisibleRow";
export function text(model: VisibleRow): string {
  return model.title;
}
`
    },
    origins: {
      VisibleRow: {
        file: 'src/main/ets/VisibleRow',
        local: 'VisibleRow'
      },
      text: {
        file: 'src/main/ets/VisibleRowView',
        local: 'text'
      }
    },
    signatures: {
      'src/main/ets/VisibleRow': [
        'interface VisibleRow extends BaseData'
      ],
      'src/main/ets/VisibleRowView': [
        'function text(model: VisibleRow): string;'
      ],
      Index: [
        '{ VisibleRow }',
        '{ text }'
      ]
    }
  },
  {
    id: 'callback-return-scaling',
    boundary: 'A returned number from a user-defined policy remains consumable.',
    sources: {
      'Index.ets': `export { ScalePolicy } from "./src/main/ets/ScalePolicy";
export { scaled } from "./src/main/ets/ScalePolicyView";
`,
      'src/main/ets/ScalePolicy.ets': `export type ScalePolicy = (width: number, height: number) => number;
`,
      'src/main/ets/ScalePolicyView.ets': `import { ScalePolicy } from "./ScalePolicy";
export function scaled(model: ScalePolicy): number {
  return model(2, 3);
}
`
    },
    origins: {
      ScalePolicy: {
        file: 'src/main/ets/ScalePolicy',
        local: 'ScalePolicy'
      },
      scaled: {
        file: 'src/main/ets/ScalePolicyView',
        local: 'scaled'
      }
    },
    signatures: {
      'src/main/ets/ScalePolicy': [
        '(width: number, height: number) => number'
      ],
      'src/main/ets/ScalePolicyView': [
        'function scaled(model: ScalePolicy): number;'
      ],
      Index: [
        '{ ScalePolicy }',
        '{ scaled }'
      ]
    }
  },
  {
    id: 'union-with-undefined',
    boundary: 'A model alias under a separate consumer retains optional values.',
    sources: {
      'Index.ets': `export { Selection } from "./src/main/ets/Selection";
export { pick } from "./src/main/ets/SelectionView";
`,
      'src/main/ets/Selection.ets': `export type Selection = string | undefined;
`,
      'src/main/ets/SelectionView.ets': `import { Selection } from "./Selection";
export function pick(model: Selection): string {
  return model ?? "none";
}
`
    },
    origins: {
      Selection: {
        file: 'src/main/ets/Selection',
        local: 'Selection'
      },
      pick: {
        file: 'src/main/ets/SelectionView',
        local: 'pick'
      }
    },
    signatures: {
      'src/main/ets/Selection': [
        'type Selection = string | undefined;'
      ],
      'src/main/ets/SelectionView': [
        'function pick(model: Selection): string;'
      ],
      Index: [
        '{ Selection }',
        '{ pick }'
      ]
    }
  }
];

module.exports = { fixtures };
