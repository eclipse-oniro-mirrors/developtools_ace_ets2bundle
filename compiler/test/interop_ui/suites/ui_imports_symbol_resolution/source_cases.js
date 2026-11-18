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

const ARKUI_AMBIENT = `
declare module '@ohos.arkui.component' {
  export interface Length {
    value: number;
    unit: number;
  }
  export class Text {
    static create(): Text;
  }
}
`;

const STATE_AMBIENT = `
declare module '@ohos.arkui.stateManagement' {
  export function State(...args: any[]): any;
  export class LocalStorage {
    constructor(value?: object);
  }
}
`;

const DYNAMIC_AMBIENT = `
declare module 'dynamic/@ohos.arkui.GlobalAnnotation' {
  export function Prop(...args: any[]): any;
  export function StorageProp(key: string): any;
  export function LocalStorageProp(key: string): any;
}
`;

const cases = [
  {
    id: 'white-list-type-value-dedup',
    branch: 'Collect repeated white-list type and value identifiers through one Set-backed import branch.',
    source: `
export declare function measure(width: Length, height: Length): Text;
export declare function measureAgain(width: Length): Text;

Text.create();
Text.create();

export declare const reusedType: Length;
export declare const reusedValue: Text;
`
  },
  {
    id: 'repeated-component-state-symbols',
    branch: 'De-duplicate component and state symbols collected from several decorated declarations.',
    source: `
@Component
export struct FirstCard {
  @State first: number = 1;
  build() {
    Text.create();
  }
}

@Component
export struct SecondCard {
  @State second: number = 2;
  @State third: string = 'three';
  build() {
    Text.create();
  }
}
`
  },
  {
    id: 'local-white-list-type-shadow',
    branch: 'Use TypeChecker declarations to suppress a white-list import when the type is declared locally.',
    source: `
export interface Length {
  value: number;
  unit: number;
}

export declare const exactLength: Length;
export declare function longest(first: Length, second: Length): Length;

export type LengthPair = {
  first: Length;
  second: Length;
};
`
  },
  {
    id: 'local-white-list-value-shadow',
    branch: 'Use TypeChecker declarations to suppress value and type imports for a local class with a white-list name.',
    source: `
export class Text {
  static create(): Text {
    return new Text();
  }

  static from(other: Text): Text {
    return other;
  }
}

Text.create();
export declare const localText: Text;
`
  },
  {
    id: 'named-import-alias',
    branch: 'Preserve named aliases and avoid inventing imports for local alias spellings.',
    files: {
      'index.d.ets': `
import { Length as LocalLength, Text as LocalText } from './aliased_symbols';

export declare const size: LocalLength;
export declare function copySize(input: LocalLength): LocalLength;
export declare const renderer: LocalText;

LocalText.create();
`,
      'aliased_symbols.d.ts': `
export interface Length {
  value: number;
}

export declare class Text {
  static create(): Text;
}
`
    }
  },
  {
    id: 'default-import-binding',
    branch: 'Record a default import binding in extractImportedNames and preserve its default-import form.',
    files: {
      'index.d.ets': `
import Text from './default_text';

export declare const renderer: Text;
export declare function wrap(renderer: Text): Text;

Text.create();
`,
      'default_text.d.ts': `
declare class Text {
  static create(): Text;
}

export default Text;
`
    }
  },
  {
    id: 'namespace-qualified-symbols',
    branch: 'Preserve custom namespace-qualified symbols without inventing direct ArkUI imports.',
    files: {
      'index.d.ets': `
import * as UI from './namespace_symbols';

export declare const size: UI.Length;
export declare function resize(input: UI.Length): UI.Length;
export declare const renderer: UI.Text;

UI.Text.create();
`,
      'namespace_symbols.d.ts': `
export interface Length {
  value: number;
}

export declare class Text {
  static create(): Text;
}
`
    }
  },
  {
    id: 'special-component-original-import',
    branch: 'Keep the special component-module import node unchanged while recording its named and aliased bindings.',
    files: {
      'index.d.ets': `
import { Text, Length as LocalLength } from '@ohos.arkui.component';

export declare const size: LocalLength;
export declare const renderer: Text;

Text.create();
`,
      'arkui.d.ts': ARKUI_AMBIENT
    }
  },
  {
    id: 'special-state-original-import',
    branch: 'Keep a state-management import unchanged when a white-list decorator is already provided by that module.',
    files: {
      'index.d.ets': `
import { State } from '@ohos.arkui.stateManagement';

export class StateModel {
  @State value: number = 0;
  @State title: string = 'ready';
}
`,
      'state.d.ts': STATE_AMBIENT
    }
  },
  {
    id: 'special-dynamic-property-decorators',
    branch: 'Preserve dynamic GlobalAnnotation property decorators instead of applying the static PropRef rewrite.',
    files: {
      'index.d.ets': `
import {
  Prop,
  StorageProp,
  LocalStorageProp
} from 'dynamic/@ohos.arkui.GlobalAnnotation';

export class DynamicStorageModel {
  @Prop value: number = 1;
  @StorageProp('stored') stored: string = 'state';
  @LocalStorageProp('local') local: boolean = false;
}
`,
      'dynamic.d.ts': DYNAMIC_AMBIENT
    }
  },
  {
    id: 'component-reusable-v1',
    branch: 'Group Component and Reusable as component imports and synthesize LocalStorage once for component initialization.',
    source: `
@Component
@Reusable
export struct ReusableCard {
  @State title: string = 'reuse';

  build() {
    Text.create();
  }
}
`
  },
  {
    id: 'component-reusable-v2',
    branch: 'Route ComponentV2, ReusableV2, Local, Param, and Once through their V1/V2 import groups.',
    source: `
@ComponentV2
@ReusableV2
export struct ReusableV2Card {
  @Local title: string = 'v2';
  @Param count: number = 0;
  @Once @Param initialCount: number = 0;

  build() {
    Text.create();
  }
}
`
  },
  {
    id: 'state-management-component-grouping',
    branch: 'Partition property decorators and UI symbols by the state-management and component white lists.',
    source: `
export struct GroupedCard {
  @State title: string = 'state';
  @Prop size: Length = 1;
  @StorageLink('count') count: number = 0;

  build() {
    Text.create();
  }
}
`
  },
  {
    id: 'extend-styles-builder',
    branch: 'Exercise the Extend/Styles skip set and the explicit Builder decorator collection branch.',
    files: {
      'index.d.ets': `
import { Text } from '@ohos.arkui.component';

@Extend(Text)
function extendedText() {
}

@Styles
function cardStyles() {
}

@Builder
function cardBuilder() {
  Text.create();
}
`,
      'arkui.d.ts': ARKUI_AMBIENT
    }
  },
  {
    id: 'directive-and-generated-import-order',
    branch: 'Insert generated state and component imports after all directives and before the first declaration.',
    source: `
'use static';
'use strict';

@Component
export struct DirectedCard {
  @State title: string = 'directed';

  build() {
  }
}
`
  },
  {
    id: 'struct-constructor-class-control',
    branch: 'Delete only constructors whose parent is a struct and retain ordinary class constructors as a control.',
    source: `
@Component
export struct ConstructedCard {
  constructor() {
  }

  build() {
  }
}

export class OrdinaryModel {
  constructor() {
  }

  reset(): void {
  }
}
`
  },
  {
    id: 'local-component-decorator-shadow',
    branch: 'Suppress automatic Component and LocalStorage imports when Component resolves to a local declaration.',
    source: `
export class Component {
  static marker: string = 'local';
}

@Component
export struct LocallyDecoratedCard {
  build() {
  }
}
`
  },
  {
    id: 'non-white-list-negative-control',
    branch: 'Leave unknown decorators, types, and values untouched while unrelated method normalization still runs.',
    source: `
@CustomDecorator
export class CustomModel {
  value: UnknownType;

  reset() {
    customReset();
  }
}

export declare const customValue: UnknownType;
customReset();
`
  },
  {
    id: 'ordinary-named-import-control',
    branch: 'Contrast an unaliased relative named import with the independent named-alias boundary.',
    files: {
      'index.d.ets': `
import { Length, Text } from './ordinary_symbols';

export declare const size: Length;
export declare function resize(input: Length): Length;
export declare const renderer: Text;

Text.create();
`,
      'ordinary_symbols.d.ts': `
export interface Length {
  value: number;
}

export declare class Text {
  static create(): Text;
}
`
    }
  },
  {
    id: 'local-namespace-shadow',
    branch: 'Resolve namespace-qualified white-list names to local namespace declarations rather than external UI symbols.',
    source: `
namespace UI {
  export interface Length {
    value: number;
  }

  export class Text {
    static create(): Text {
      return new Text();
    }
  }
}

export declare const size: UI.Length;
export declare function resize(input: UI.Length): UI.Length;
export declare const renderer: UI.Text;

UI.Text.create();
`
  },
  {
    id: 'existing-component-decorator-import',
    branch: 'Retain existing component decorator imports while still adding their required LocalStorage dependency.',
    files: {
      'index.d.ets': `
import { Component, Reusable } from '@ohos.arkui.component';

@Component
@Reusable
export struct ExistingImportCard {
  build() {
  }
}
`,
      'arkui.d.ts': `
declare module '@ohos.arkui.component' {
  export function Component(...args: any[]): any;
  export function Reusable(...args: any[]): any;
}
`
    }
  },
  {
    id: 'static-storage-property-ref-imports',
    branch: 'Resolve static storage decorators to their Ref variants while preserving call arguments and state grouping.',
    source: `
export class StaticStorageModel {
  @StorageProp('stored') stored: string = 'state';
  @LocalStorageProp('local') local: number = 1;

  reset() {
  }
}
`
  },
  {
    id: 'side-effect-import-directive-order',
    branch: 'Insert generated imports after directives but before an original side-effect import.',
    files: {
      'index.d.ets': `
'use static';
import './register';

@Component
export struct SideEffectCard {
  @State title: string = 'side-effect';

  build() {
  }
}
`,
      'register.d.ts': `
export declare const registrationMarker: string;
`
    }
  },
  {
    id: 'type-only-white-list-import',
    branch: 'Preserve a type-only white-list import without manufacturing a value import.',
    files: {
      'index.d.ets': `
import type { Length } from './type_only_symbols';

export declare const size: Length;
export declare function resize(input: Length): Length;
export type LengthPair = [Length, Length];
`,
      'type_only_symbols.d.ts': `
export interface Length {
  value: number;
}
`
    }
  },
  {
    id: 'inline-type-only-import',
    branch: 'Preserve the TypeScript 4.9 inline type modifier on a white-list named import specifier.',
    files: {
      'index.d.ets': `
import { type Length } from './inline_type_symbols';

export declare const size: Length;
export declare function resize(input: Length): Length;
export type LengthCallback = (value: Length) => Length;
`,
      'inline_type_symbols.d.ts': `
export interface Length {
  value: number;
  unit: number;
}
`
    }
  },
  {
    id: 'local-state-decorator-shadow',
    branch: 'Use symbol resolution to distinguish a local State decorator from the state-management decorator.',
    source: `
declare function State(...args: any[]): any;

@State
export class LocalStateModel {
  value: number = 0;

  reset() {
    this.value = 0;
  }
}
`
  }
];

module.exports = {
  ARKUI_AMBIENT,
  DYNAMIC_AMBIENT,
  STATE_AMBIENT,
  cases
};
