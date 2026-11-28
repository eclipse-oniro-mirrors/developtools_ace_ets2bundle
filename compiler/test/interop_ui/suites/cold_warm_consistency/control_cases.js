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
    id: 'same-interface-distinct-shapes',
    boundary: 'Same-basename interfaces in separate directories keep independent contracts.',
    sources: {
      'Index.ets': `export { Values as LeftModel } from "./src/main/ets/header/Model";
export { Values as RightModel } from "./src/main/ets/footer/Model";
`,
      'src/main/ets/header/Model.ets': `export interface Values { label: string; }
`,
      'src/main/ets/footer/Model.ets': `export interface Values { footer: boolean; }
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/header/Model',
        local: 'Values'
      },
      RightModel: {
        file: 'src/main/ets/footer/Model',
        local: 'Values'
      }
    },
    signatures: {
      'src/main/ets/header/Model': [
        'label: string;'
      ],
      'src/main/ets/footer/Model': [
        'footer: boolean;'
      ],
      Index: [
        'Values as LeftModel',
        'Values as RightModel'
      ]
    }
  },
  {
    id: 'same-class-distinct-properties',
    boundary: 'Warm cache does not collapse two differently typed fields.',
    sources: {
      'Index.ets': `export { ViewModel as LeftModel } from "./src/main/ets/wide/Model";
export { ViewModel as RightModel } from "./src/main/ets/compact/Model";
`,
      'src/main/ets/wide/Model.ets': `export class ViewModel { width: number = 0; }
`,
      'src/main/ets/compact/Model.ets': `export class ViewModel { width: string = "auto"; }
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/wide/Model',
        local: 'ViewModel'
      },
      RightModel: {
        file: 'src/main/ets/compact/Model',
        local: 'ViewModel'
      }
    },
    signatures: {
      'src/main/ets/wide/Model': [
        'width: number;'
      ],
      'src/main/ets/compact/Model': [
        'width: string;'
      ],
      Index: [
        'ViewModel as LeftModel',
        'ViewModel as RightModel'
      ]
    }
  },
  {
    id: 'same-type-alias-distinct-primitive',
    boundary: 'Warm declaration maps preserve a status flag separably from a heading string.',
    sources: {
      'Index.ets': `export { StateValue as LeftModel } from "./src/main/ets/text/Model";
export { StateValue as RightModel } from "./src/main/ets/status/Model";
`,
      'src/main/ets/text/Model.ets': `export type StateValue = string;
`,
      'src/main/ets/status/Model.ets': `export type StateValue = boolean;
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/text/Model',
        local: 'StateValue'
      },
      RightModel: {
        file: 'src/main/ets/status/Model',
        local: 'StateValue'
      }
    },
    signatures: {
      'src/main/ets/text/Model': [
        'type StateValue = string;'
      ],
      'src/main/ets/status/Model': [
        'type StateValue = boolean;'
      ],
      Index: [
        'StateValue as LeftModel',
        'StateValue as RightModel'
      ]
    }
  },
  {
    id: 'literal-union-pairs',
    boundary: 'Alias identity remains distinct even when the package names both values similarly.',
    sources: {
      'Index.ets': `export { Mode as LeftModel } from "./src/main/ets/horizontal/Model";
export { Mode as RightModel } from "./src/main/ets/vertical/Model";
`,
      'src/main/ets/horizontal/Model.ets': `export type Mode = "left" | "right";
`,
      'src/main/ets/vertical/Model.ets': `export type Mode = "top" | "bottom";
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/horizontal/Model',
        local: 'Mode'
      },
      RightModel: {
        file: 'src/main/ets/vertical/Model',
        local: 'Mode'
      }
    },
    signatures: {
      'src/main/ets/horizontal/Model': [
        '"left" | "right"'
      ],
      'src/main/ets/vertical/Model': [
        '"top" | "bottom"'
      ],
      Index: [
        'Mode as LeftModel',
        'Mode as RightModel'
      ]
    }
  },
  {
    id: 'same-callable-distinct-callbacks',
    boundary: 'Both exported handlers keep their different callback arities.',
    sources: {
      'Index.ets': `export { Handler as LeftModel } from "./src/main/ets/select/Model";
export { Handler as RightModel } from "./src/main/ets/drag/Model";
`,
      'src/main/ets/select/Model.ets': `export type Handler = (selected: boolean) => void;
`,
      'src/main/ets/drag/Model.ets': `export type Handler = (from: number, to: number) => void;
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/select/Model',
        local: 'Handler'
      },
      RightModel: {
        file: 'src/main/ets/drag/Model',
        local: 'Handler'
      }
    },
    signatures: {
      'src/main/ets/select/Model': [
        '(selected: boolean) => void'
      ],
      'src/main/ets/drag/Model': [
        '(from: number, to: number) => void'
      ],
      Index: [
        'Handler as LeftModel',
        'Handler as RightModel'
      ]
    }
  },
  {
    id: 'same-enum-different-values',
    boundary: 'Enum members remain distinct after the second production declaration run.',
    sources: {
      'Index.ets': `export { Action as LeftModel } from "./src/main/ets/press/Model";
export { Action as RightModel } from "./src/main/ets/release/Model";
`,
      'src/main/ets/press/Model.ets': `export enum Action { Down = 1 }
`,
      'src/main/ets/release/Model.ets': `export enum Action { Up = 2 }
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/press/Model',
        local: 'Action'
      },
      RightModel: {
        file: 'src/main/ets/release/Model',
        local: 'Action'
      }
    },
    signatures: {
      'src/main/ets/press/Model': [
        'Down = 1'
      ],
      'src/main/ets/release/Model': [
        'Up = 2'
      ],
      Index: [
        'Action as LeftModel',
        'Action as RightModel'
      ]
    }
  },
  {
    id: 'same-name-interface-method',
    boundary: 'Two matching getter names return different types on each respective declaration.',
    sources: {
      'Index.ets': `export { Display as LeftModel } from "./src/main/ets/amount/Model";
export { Display as RightModel } from "./src/main/ets/caption/Model";
`,
      'src/main/ets/amount/Model.ets': `export interface Display { getLabel(): number; }
`,
      'src/main/ets/caption/Model.ets': `export interface Display { getLabel(): string; }
`
    },
    origins: {
      LeftModel: {
        file: 'src/main/ets/amount/Model',
        local: 'Display'
      },
      RightModel: {
        file: 'src/main/ets/caption/Model',
        local: 'Display'
      }
    },
    signatures: {
      'src/main/ets/amount/Model': [
        'getLabel(): number;'
      ],
      'src/main/ets/caption/Model': [
        'getLabel(): string;'
      ],
      Index: [
        'Display as LeftModel',
        'Display as RightModel'
      ]
    }
  }
];

module.exports = { fixtures };
