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
    id: 'component-export-alias',
    boundary: 'A component alias should keep the original class-like declaration in both output trees.',
    sources: {
      'Index.ets': `export { Tile as ListTile } from "./src/main/ets/Visible";
`,
      'src/main/ets/Tile.ets': `@Component
export struct Tile {
  @State count: number = 0;
  build() { Text(this.count.toString()) }
}
`,
      'src/main/ets/Visible.ets': `export { Tile } from "./Tile";
`
    },
    origins: {
      ListTile: {
        file: 'src/main/ets/Tile',
        local: 'Tile'
      }
    },
    signatures: {
      'src/main/ets/Tile': [
        'count: number'
      ],
      'src/main/ets/Visible': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'value-through-barrel',
    boundary: 'A second re-export hop preserves a numeric layout constant.',
    sources: {
      'Index.ets': `export { GAP as DefaultGap } from "./src/main/ets/layout/MetricsPublic";
`,
      'src/main/ets/layout/Metrics.ets': `export const GAP: number = 8;
`,
      'src/main/ets/layout/MetricsPublic.ets': `export { GAP } from "./Metrics";
`
    },
    origins: {
      DefaultGap: {
        file: 'src/main/ets/layout/Metrics',
        local: 'GAP'
      }
    },
    signatures: {
      'src/main/ets/layout/Metrics': [
        'GAP: number'
      ],
      'src/main/ets/layout/MetricsPublic': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'alias-through-parent-path',
    boundary: 'Relative parent traversal resolves the same declaration key after cache reuse.',
    sources: {
      'Index.ets': `export { RowShape as VisibleRow } from "./src/main/ets/view/Public";
`,
      'src/main/ets/model/Row.ets': `export interface RowShape { title: string; }
`,
      'src/main/ets/view/Public.ets': `export { RowShape } from "../model/Row";
`
    },
    origins: {
      VisibleRow: {
        file: 'src/main/ets/model/Row',
        local: 'RowShape'
      }
    },
    signatures: {
      'src/main/ets/model/Row': [
        'interface RowShape'
      ],
      'src/main/ets/view/Public': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'reexport-with-renamed-binding',
    boundary: 'A renamed bridge symbol still resolves to the provider local name.',
    sources: {
      'Index.ets': `export { Renamed as RowKey } from "./src/main/ets/Public";
`,
      'src/main/ets/model/Display.ets': `export type DisplayKey = number;
`,
      'src/main/ets/Public.ets': `export { DisplayKey as Renamed } from "./model/Display";
`
    },
    origins: {
      RowKey: {
        file: 'src/main/ets/model/Display',
        local: 'DisplayKey'
      }
    },
    signatures: {
      'src/main/ets/model/Display': [
        'type DisplayKey = number;'
      ],
      'src/main/ets/Public': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'export-star-alias',
    boundary: 'A named re-export through a wildcard reaches the owner rather than the barrel.',
    sources: {
      'Index.ets': `export { Bounds as PanelBounds } from "./src/main/ets/Barrel";
`,
      'src/main/ets/layout/Bounds.ets': `export interface Bounds { left: number; right: number; }
`,
      'src/main/ets/Barrel.ets': `export * from "./layout/Bounds";
`
    },
    origins: {
      PanelBounds: {
        file: 'src/main/ets/layout/Bounds',
        local: 'Bounds'
      }
    },
    signatures: {
      'src/main/ets/layout/Bounds': [
        'interface Bounds'
      ],
      'src/main/ets/Barrel': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'runtime-function-forward',
    boundary: 'A function re-export shared with static caller preserves callable origin.',
    sources: {
      'Index.ets': `export { measure as measureWidth } from "./src/main/ets/Geometry";
`,
      'src/main/ets/Measure.ets': `export function measure(width: number): number { return width * 2; }
`,
      'src/main/ets/Geometry.ets': `export { measure } from "./Measure";
`
    },
    origins: {
      measureWidth: {
        file: 'src/main/ets/Measure',
        local: 'measure'
      }
    },
    signatures: {
      'src/main/ets/Measure': [
        'measure(width: number): number;'
      ],
      'src/main/ets/Geometry': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'builder-forward',
    boundary: 'Forwarding a UI builder retains the original emitted declaration.',
    sources: {
      'Index.ets': `export { sectionLabel as rowLabel } from "./src/main/ets/View";
`,
      'src/main/ets/Label.ets': `@Builder
export function sectionLabel(label: string) { Text(label) }
`,
      'src/main/ets/View.ets': `export { sectionLabel } from "./Label";
`
    },
    origins: {
      rowLabel: {
        file: 'src/main/ets/Label',
        local: 'sectionLabel'
      }
    },
    signatures: {
      'src/main/ets/Label': [
        'sectionLabel(label: string)'
      ],
      'src/main/ets/View': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'enum-forward',
    boundary: 'A public enum referenced by an alias preserves its exact local name.',
    sources: {
      'Index.ets': `export { TextMode as LabelMode } from "./src/main/ets/Layout";
`,
      'src/main/ets/Mode.ets': `export enum TextMode { Compact = 1, Expanded = 4 }
`,
      'src/main/ets/Layout.ets': `export { TextMode } from "./Mode";
`
    },
    origins: {
      LabelMode: {
        file: 'src/main/ets/Mode',
        local: 'TextMode'
      }
    },
    signatures: {
      'src/main/ets/Mode': [
        'Expanded = 4'
      ],
      'src/main/ets/Layout': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'default-class-forward',
    boundary: 'A forwarded named class preserves the type anchor and constructor fields.',
    sources: {
      'Index.ets': `export { Border as CardBorder } from "./src/main/ets/Style";
`,
      'src/main/ets/Border.ets': `export class Border { constructor(public width: number) {} }
`,
      'src/main/ets/Style.ets': `export { Border } from "./Border";
`
    },
    origins: {
      CardBorder: {
        file: 'src/main/ets/Border',
        local: 'Border'
      }
    },
    signatures: {
      'src/main/ets/Border': [
        'width: number'
      ],
      'src/main/ets/Style': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'non-ascii-path-edge',
    boundary: 'A space and non-ASCII path segment retain the same declaration graph key.',
    sources: {
      'Index.ets': `export { PanelData as ViewData } from "./src/main/ets/Panels";
`,
      'src/main/ets/布局 面板/Panel.ets': `export interface PanelData { checked: boolean; }
`,
      'src/main/ets/Panels.ets': `export { PanelData } from "./布局 面板/Panel";
`
    },
    origins: {
      ViewData: {
        file: 'src/main/ets/布局 面板/Panel',
        local: 'PanelData'
      }
    },
    signatures: {
      'src/main/ets/布局 面板/Panel': [
        'checked: boolean;'
      ],
      'src/main/ets/Panels': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  },
  {
    id: 'second-package-level',
    boundary: 'Package root alias and nested re-export resolve an exported button handler.',
    sources: {
      'Index.ets': `export { Action as ButtonAction } from "./src/main/Public";
`,
      'src/main/ets/model/Events.ets': `export type Action = (pressed: boolean) => void;
`,
      'src/main/Public.ets': `export { Action } from "./ets/model/Events";
`
    },
    origins: {
      ButtonAction: {
        file: 'src/main/ets/model/Events',
        local: 'Action'
      }
    },
    signatures: {
      'src/main/ets/model/Events': [
        '(pressed: boolean) => void'
      ],
      'src/main/Public': [
        'export'
      ],
      Index: [
        'export'
      ]
    }
  }
];

module.exports = { fixtures };
