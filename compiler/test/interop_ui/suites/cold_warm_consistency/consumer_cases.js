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
    id: 'missing-required-margin',
    boundary: 'A missing required option produces the same diagnostic after cache reuse.',
    sources: {
      'Index.ets': `export { Margin } from "./src/main/ets/model/Margin";
export { outer } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Margin.ets': `export interface Margin { left: number; right: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { Margin } from "../model/Margin";
export function outer(value: Margin): number {
  return value.left + value.right;
}
`
    },
    origins: {
      Margin: {
        file: 'src/main/ets/model/Margin',
        local: 'Margin'
      },
      outer: {
        file: 'src/main/ets/view/Inspect',
        local: 'outer'
      }
    },
    signatures: {
      'src/main/ets/model/Margin': [
        'right: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function outer(value: Margin): number;'
      ],
      Index: [
        '{ Margin }',
        '{ outer }'
      ]
    },
    caller: `import { outer } from "current";
outer({left: 2, right: 4});
outer({left: 2});
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'readonly-width-stays-protected',
    boundary: 'Assignments to readonly data keep exact caller coordinates.',
    sources: {
      'Index.ets': `export { Size } from "./src/main/ets/model/Size";
export { size } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Size.ets': `export interface Size { readonly width: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { Size } from "../model/Size";
export function size(value: Size): Size {
  return value;
}
`
    },
    origins: {
      Size: {
        file: 'src/main/ets/model/Size',
        local: 'Size'
      },
      size: {
        file: 'src/main/ets/view/Inspect',
        local: 'size'
      }
    },
    signatures: {
      'src/main/ets/model/Size': [
        'readonly width: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function size(value: Size): Size;'
      ],
      Index: [
        '{ Size }',
        '{ size }'
      ]
    },
    caller: `import { size } from "current";
size({width: 2}).width;
size({width: 2}).width = 1;
`,
    diagnostics: [
      [
        2540,
        3
      ]
    ]
  },
  {
    id: 'nullable-label-needs-default',
    boundary: 'An unchanged nullable member requires narrowing in both compilations.',
    sources: {
      'Index.ets': `export { Label } from "./src/main/ets/model/Label";
export { label } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Label.ets': `export type Label = string | null;
`,
      'src/main/ets/view/Inspect.ets': `import { Label } from "../model/Label";
export function label(value: Label): Label {
  return value;
}
`
    },
    origins: {
      Label: {
        file: 'src/main/ets/model/Label',
        local: 'Label'
      },
      label: {
        file: 'src/main/ets/view/Inspect',
        local: 'label'
      }
    },
    signatures: {
      'src/main/ets/model/Label': [
        'type Label = string | null;'
      ],
      'src/main/ets/view/Inspect': [
        'function label(value: Label): Label;'
      ],
      Index: [
        '{ Label }',
        '{ label }'
      ]
    },
    caller: `import { label } from "current";
const a: string = label(null) ?? "none";
const b: string = label(null);
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'keyboard-event-code-rejected',
    boundary: 'A string event key is incompatible with the projected numeric parameter.',
    sources: {
      'Index.ets': `export { KeyEvent } from "./src/main/ets/model/KeyEvent";
export { key } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/KeyEvent.ets': `export interface KeyEvent { code: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { KeyEvent } from "../model/KeyEvent";
export function key(value: KeyEvent): number {
  return value.code;
}
`
    },
    origins: {
      KeyEvent: {
        file: 'src/main/ets/model/KeyEvent',
        local: 'KeyEvent'
      },
      key: {
        file: 'src/main/ets/view/Inspect',
        local: 'key'
      }
    },
    signatures: {
      'src/main/ets/model/KeyEvent': [
        'code: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function key(value: KeyEvent): number;'
      ],
      Index: [
        '{ KeyEvent }',
        '{ key }'
      ]
    },
    caller: `import { key } from "current";
key({ code: 13 });
key({ code: "Enter" });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'fixed-switch-token',
    boundary: 'The declaration cache cannot widen the literal UI toggle contract.',
    sources: {
      'Index.ets': `export { Toggle } from "./src/main/ets/model/Toggle";
export { label } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Toggle.ets': `export type Toggle = "on" | "off";
`,
      'src/main/ets/view/Inspect.ets': `import { Toggle } from "../model/Toggle";
export function label(value: Toggle): string {
  return value;
}
`
    },
    origins: {
      Toggle: {
        file: 'src/main/ets/model/Toggle',
        local: 'Toggle'
      },
      label: {
        file: 'src/main/ets/view/Inspect',
        local: 'label'
      }
    },
    signatures: {
      'src/main/ets/model/Toggle': [
        '"on" | "off"'
      ],
      'src/main/ets/view/Inspect': [
        'function label(value: Toggle): string;'
      ],
      Index: [
        '{ Toggle }',
        '{ label }'
      ]
    },
    caller: `import { label } from "current";
label("on");
label("auto");
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'label-default-does-not-mask-type',
    boundary: 'The accepted omitted option and rejected incorrect type remain consistent.',
    sources: {
      'Index.ets': `export { Caption } from "./src/main/ets/model/Caption";
export { label } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Caption.ets': `export interface Caption { title?: string; }
`,
      'src/main/ets/view/Inspect.ets': `import { Caption } from "../model/Caption";
export function label(value: Caption): string {
  return value.title ?? "";
}
`
    },
    origins: {
      Caption: {
        file: 'src/main/ets/model/Caption',
        local: 'Caption'
      },
      label: {
        file: 'src/main/ets/view/Inspect',
        local: 'label'
      }
    },
    signatures: {
      'src/main/ets/model/Caption': [
        'title?: string;'
      ],
      'src/main/ets/view/Inspect': [
        'function label(value: Caption): string;'
      ],
      Index: [
        '{ Caption }',
        '{ label }'
      ]
    },
    caller: `import { label } from "current";
label({});
label({ title: 1 });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'function-property-return-type',
    boundary: 'A callback returning the wrong type fails consistently after warm reuse.',
    sources: {
      'Index.ets': `export { Format } from "./src/main/ets/model/Format";
export { text } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Format.ets': `export type Format = () => string;
`,
      'src/main/ets/view/Inspect.ets': `import { Format } from "../model/Format";
export function text(value: Format): string {
  return value();
}
`
    },
    origins: {
      Format: {
        file: 'src/main/ets/model/Format',
        local: 'Format'
      },
      text: {
        file: 'src/main/ets/view/Inspect',
        local: 'text'
      }
    },
    signatures: {
      'src/main/ets/model/Format': [
        '() => string'
      ],
      'src/main/ets/view/Inspect': [
        'function text(value: Format): string;'
      ],
      Index: [
        '{ Format }',
        '{ text }'
      ]
    },
    caller: `import { text } from "current";
text(() => "caption");
text(() => 4);
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'callback-argument-contravariance',
    boundary: 'An explicit callback annotation cannot contradict the emitted signature.',
    sources: {
      'Index.ets': `export { Activate } from "./src/main/ets/model/Activate";
export { active } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Activate.ets': `export type Activate = (code: number) => boolean;
`,
      'src/main/ets/view/Inspect.ets': `import { Activate } from "../model/Activate";
export function active(value: Activate): boolean {
  return value(1);
}
`
    },
    origins: {
      Activate: {
        file: 'src/main/ets/model/Activate',
        local: 'Activate'
      },
      active: {
        file: 'src/main/ets/view/Inspect',
        local: 'active'
      }
    },
    signatures: {
      'src/main/ets/model/Activate': [
        '(code: number) => boolean'
      ],
      'src/main/ets/view/Inspect': [
        'function active(value: Activate): boolean;'
      ],
      Index: [
        '{ Activate }',
        '{ active }'
      ]
    },
    caller: `import { active } from "current";
active((code: number) => code > 0);
active((code: string) => code.length > 0);
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'result-type-stays-numeric',
    boundary: 'The caller sees the same numeric result through the root facade.',
    sources: {
      'Index.ets': `export { Count } from "./src/main/ets/model/Count";
export { total } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Count.ets': `export interface Count { selected: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { Count } from "../model/Count";
export function total(value: Count): number {
  return value.selected;
}
`
    },
    origins: {
      Count: {
        file: 'src/main/ets/model/Count',
        local: 'Count'
      },
      total: {
        file: 'src/main/ets/view/Inspect',
        local: 'total'
      }
    },
    signatures: {
      'src/main/ets/model/Count': [
        'selected: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function total(value: Count): number;'
      ],
      Index: [
        '{ Count }',
        '{ total }'
      ]
    },
    caller: `import { total } from "current";
const a: number = total({ selected: 0 });
const b: string = total({ selected: 0 });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'model-getter-result',
    boundary: 'Method returns infer string context after both declarations.',
    sources: {
      'Index.ets': `export { Display } from "./src/main/ets/model/Display";
export { show } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Display.ets': `export interface Display { title(): string; }
`,
      'src/main/ets/view/Inspect.ets': `import { Display } from "../model/Display";
export function show(value: Display): string {
  return value.title();
}
`
    },
    origins: {
      Display: {
        file: 'src/main/ets/model/Display',
        local: 'Display'
      },
      show: {
        file: 'src/main/ets/view/Inspect',
        local: 'show'
      }
    },
    signatures: {
      'src/main/ets/model/Display': [
        'title(): string;'
      ],
      'src/main/ets/view/Inspect': [
        'function show(value: Display): string;'
      ],
      Index: [
        '{ Display }',
        '{ show }'
      ]
    },
    caller: `import { show } from "current";
show({ title: () => "x" });
show({ title: () => false });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'checkbox-selected-is-boolean',
    boundary: 'Omitting unrelated values still checks the known boolean property.',
    sources: {
      'Index.ets': `export { ToggleOptions } from "./src/main/ets/model/ToggleOptions";
export { select } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/ToggleOptions.ets': `export interface ToggleOptions { selected: boolean; }
`,
      'src/main/ets/view/Inspect.ets': `import { ToggleOptions } from "../model/ToggleOptions";
export function select(value: ToggleOptions): boolean {
  return value.selected;
}
`
    },
    origins: {
      ToggleOptions: {
        file: 'src/main/ets/model/ToggleOptions',
        local: 'ToggleOptions'
      },
      select: {
        file: 'src/main/ets/view/Inspect',
        local: 'select'
      }
    },
    signatures: {
      'src/main/ets/model/ToggleOptions': [
        'selected: boolean;'
      ],
      'src/main/ets/view/Inspect': [
        'function select(value: ToggleOptions): boolean;'
      ],
      Index: [
        '{ ToggleOptions }',
        '{ select }'
      ]
    },
    caller: `import { select } from "current";
select({ selected: true });
select({ selected: 1 });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'class-field-through-structural-read',
    boundary: 'Changes in declaration cache must not erase a class field type.',
    sources: {
      'Index.ets': `export { Header } from "./src/main/ets/model/Header";
export { headingSize } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Header.ets': `export class Header { size: number = 0; }
`,
      'src/main/ets/view/Inspect.ets': `import { Header } from "../model/Header";
export function headingSize(value: Header): number {
  return value.size;
}
`
    },
    origins: {
      Header: {
        file: 'src/main/ets/model/Header',
        local: 'Header'
      },
      headingSize: {
        file: 'src/main/ets/view/Inspect',
        local: 'headingSize'
      }
    },
    signatures: {
      'src/main/ets/model/Header': [
        'size: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function headingSize(value: Header): number;'
      ],
      Index: [
        '{ Header }',
        '{ headingSize }'
      ]
    },
    caller: `import { headingSize } from "current";
headingSize({ size: 12 });
headingSize({ size: false });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'invalid-outside-object-key',
    boundary: 'A fresh declaration and a warm declaration both reject an unrelated supplied property.',
    sources: {
      'Index.ets': `export { ViewOptions } from "./src/main/ets/model/ViewOptions";
export { size } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/ViewOptions.ets': `export interface ViewOptions { width: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { ViewOptions } from "../model/ViewOptions";
export function size(value: ViewOptions): number {
  return value.width;
}
`
    },
    origins: {
      ViewOptions: {
        file: 'src/main/ets/model/ViewOptions',
        local: 'ViewOptions'
      },
      size: {
        file: 'src/main/ets/view/Inspect',
        local: 'size'
      }
    },
    signatures: {
      'src/main/ets/model/ViewOptions': [
        'width: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function size(value: ViewOptions): number;'
      ],
      Index: [
        '{ ViewOptions }',
        '{ size }'
      ]
    },
    caller: `import { size } from "current";
size({ width: 12 });
size({ width: 12, height: 20 });
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'enum-contract-members',
    boundary: 'A missing member read remains a diagnostic while modeled numeric state is valid.',
    sources: {
      'Index.ets': `export { Visibility } from "./src/main/ets/model/Visibility";
export { asNumber } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Visibility.ets': `export enum Visibility { Visible = 1, Hidden = 0 }
`,
      'src/main/ets/view/Inspect.ets': `import { Visibility } from "../model/Visibility";
export function asNumber(value: Visibility): number {
  return value;
}
`
    },
    origins: {
      Visibility: {
        file: 'src/main/ets/model/Visibility',
        local: 'Visibility'
      },
      asNumber: {
        file: 'src/main/ets/view/Inspect',
        local: 'asNumber'
      }
    },
    signatures: {
      'src/main/ets/model/Visibility': [
        'Visible = 1'
      ],
      'src/main/ets/view/Inspect': [
        'function asNumber(value: Visibility): number;'
      ],
      Index: [
        '{ Visibility }',
        '{ asNumber }'
      ]
    },
    caller: `import { asNumber } from "current";
asNumber(1);
asNumber("visible");
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'required-nested-model',
    boundary: 'Updated cache still preserves a nested interface requirement.',
    sources: {
      'Index.ets': `export { Cell } from "./src/main/ets/model/Cell";
export { title } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Cell.ets': `export interface CellLabel { text: string; }
export interface Cell { label: CellLabel; }
`,
      'src/main/ets/view/Inspect.ets': `import { Cell } from "../model/Cell";
export function title(value: Cell): string {
  return value.label.text;
}
`
    },
    origins: {
      Cell: {
        file: 'src/main/ets/model/Cell',
        local: 'Cell'
      },
      title: {
        file: 'src/main/ets/view/Inspect',
        local: 'title'
      }
    },
    signatures: {
      'src/main/ets/model/Cell': [
        'label: CellLabel;'
      ],
      'src/main/ets/view/Inspect': [
        'function title(value: Cell): string;'
      ],
      Index: [
        '{ Cell }',
        '{ title }'
      ]
    },
    caller: `import { title } from "current";
title({ label: { text: "row" } });
title({ label: { text: 5 } });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'method-shape-lacks-argument-type',
    boundary: 'An implementation method with an incompatible argument cannot fill the interface slot.',
    sources: {
      'Index.ets': `export { Run } from "./src/main/ets/model/Run";
export { choose } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Run.ets': `export interface Run { choose(id: number): boolean; }
`,
      'src/main/ets/view/Inspect.ets': `import { Run } from "../model/Run";
export function choose(value: Run): boolean {
  return value.choose(1);
}
`
    },
    origins: {
      Run: {
        file: 'src/main/ets/model/Run',
        local: 'Run'
      },
      choose: {
        file: 'src/main/ets/view/Inspect',
        local: 'choose'
      }
    },
    signatures: {
      'src/main/ets/model/Run': [
        'choose(id: number): boolean;'
      ],
      'src/main/ets/view/Inspect': [
        'function choose(value: Run): boolean;'
      ],
      Index: [
        '{ Run }',
        '{ choose }'
      ]
    },
    caller: `import { choose } from "current";
choose({ choose: (id: number) => id > 0 });
choose({ choose: (id: string) => id.length > 0 });
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'union-vs-boolean-argument',
    boundary: 'Warm cache retains a union’s wrong-primitive diagnostic.',
    sources: {
      'Index.ets': `export { Selected } from "./src/main/ets/model/Selected";
export { render } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Selected.ets': `export type Selected = string | number;
`,
      'src/main/ets/view/Inspect.ets': `import { Selected } from "../model/Selected";
export function render(value: Selected): string {
  return value.toString();
}
`
    },
    origins: {
      Selected: {
        file: 'src/main/ets/model/Selected',
        local: 'Selected'
      },
      render: {
        file: 'src/main/ets/view/Inspect',
        local: 'render'
      }
    },
    signatures: {
      'src/main/ets/model/Selected': [
        'string | number'
      ],
      'src/main/ets/view/Inspect': [
        'function render(value: Selected): string;'
      ],
      Index: [
        '{ Selected }',
        '{ render }'
      ]
    },
    caller: `import { render } from "current";
render("title");
render(false);
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'foreign-result-does-not-widen',
    boundary: 'Typing remains tied to the original number model after the second invocation.',
    sources: {
      'Index.ets': `export { RowModel } from "./src/main/ets/model/RowModel";
export { read } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/RowModel.ets': `export interface RowModel { count: number; }
`,
      'src/main/ets/view/Inspect.ets': `import { RowModel } from "../model/RowModel";
export function read(value: RowModel): RowModel {
  return value;
}
`
    },
    origins: {
      RowModel: {
        file: 'src/main/ets/model/RowModel',
        local: 'RowModel'
      },
      read: {
        file: 'src/main/ets/view/Inspect',
        local: 'read'
      }
    },
    signatures: {
      'src/main/ets/model/RowModel': [
        'count: number;'
      ],
      'src/main/ets/view/Inspect': [
        'function read(value: RowModel): RowModel;'
      ],
      Index: [
        '{ RowModel }',
        '{ read }'
      ]
    },
    caller: `import { read } from "current";
const count: number = read({ count: 0 }).count;
const text: string = read({ count: 0 }).count;
`,
    diagnostics: [
      [
        2322,
        3
      ]
    ]
  },
  {
    id: 'callable-rejects-missing-context',
    boundary: 'An event callback cannot introduce an extra required context parameter.',
    sources: {
      'Index.ets': `export { ToggleAction } from "./src/main/ets/model/ToggleAction";
export { press } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/ToggleAction.ets': `export type ToggleAction = (enabled: boolean) => boolean;
`,
      'src/main/ets/view/Inspect.ets': `import { ToggleAction } from "../model/ToggleAction";
export function press(value: ToggleAction): boolean {
  return value(true);
}
`
    },
    origins: {
      ToggleAction: {
        file: 'src/main/ets/model/ToggleAction',
        local: 'ToggleAction'
      },
      press: {
        file: 'src/main/ets/view/Inspect',
        local: 'press'
      }
    },
    signatures: {
      'src/main/ets/model/ToggleAction': [
        '(enabled: boolean) => boolean'
      ],
      'src/main/ets/view/Inspect': [
        'function press(value: ToggleAction): boolean;'
      ],
      Index: [
        '{ ToggleAction }',
        '{ press }'
      ]
    },
    caller: `import { press } from "current";
press((enabled: boolean) => enabled);
press((enabled: boolean, index: number) => enabled && index > 0);
`,
    diagnostics: [
      [
        2345,
        3
      ]
    ]
  },
  {
    id: 'read-removed-member-of-union',
    boundary: 'A union-valued rendering value requires narrowing before string-only operations.',
    sources: {
      'Index.ets': `export { Position } from "./src/main/ets/model/Position";
export { position } from "./src/main/ets/view/Inspect";
`,
      'src/main/ets/model/Position.ets': `export type Position = string | number;
`,
      'src/main/ets/view/Inspect.ets': `import { Position } from "../model/Position";
export function position(value: Position): Position {
  return value;
}
`
    },
    origins: {
      Position: {
        file: 'src/main/ets/model/Position',
        local: 'Position'
      },
      position: {
        file: 'src/main/ets/view/Inspect',
        local: 'position'
      }
    },
    signatures: {
      'src/main/ets/model/Position': [
        'type Position = string | number;'
      ],
      'src/main/ets/view/Inspect': [
        'function position(value: Position): Position;'
      ],
      Index: [
        '{ Position }',
        '{ position }'
      ]
    },
    caller: `import { position } from "current";
const value = position("first"); if (typeof value === "string") { value.toUpperCase(); }
position(1).toUpperCase();
`,
    diagnostics: [
      [
        2339,
        3
      ]
    ]
  }
];

module.exports = { fixtures };
