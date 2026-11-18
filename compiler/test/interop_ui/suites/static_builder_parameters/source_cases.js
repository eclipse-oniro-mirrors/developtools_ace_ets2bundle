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

function declarationCase(id, boundary, source) {
  return {
    id,
    fileName: `${id}.ets`,
    title: boundary,
    boundary,
    mode: 'declgen',
    source
  };
}

const declarationCases = [
  declarationCase(
    'global-no-parameter',
    'an exported global Builder keeps its decorator and empty signature',
    `@Builder
export function GlobalEmpty(): void {
  Text('global-empty')
}
`
  ),
  declarationCase(
    'global-object-parameter',
    'an exported global Builder preserves one named object parameter',
    `export interface HeadingOptions {
  title: string;
}

@Builder
export function GlobalHeading(options: HeadingOptions): void {
  Text(options.title)
}
`
  ),
  declarationCase(
    'global-two-parameters',
    'a global Builder declaration retains parameter order and primitive types',
    `export interface PairOptions {
  title: string;
}

@Builder
export function GlobalPair(options: PairOptions, count: number): void {
  Text(options.title + count)
}
`
  ),
  declarationCase(
    'global-optional-parameter',
    'an optional global Builder parameter remains optional in the declaration',
    `export interface OptionalHeading {
  title?: string;
}

@Builder
export function GlobalOptional(options?: OptionalHeading): void {
  Text(options?.title ?? 'fallback')
}
`
  ),
  declarationCase(
    'local-no-parameter',
    'a component-local Builder method keeps its empty signature',
    `@Component
export struct LocalEmptyCard {
  @Builder
  emptyContent(): void {
    Text('local-empty')
  }

  build() {
    Column() {
      this.emptyContent()
    }
  }
}
`
  ),
  declarationCase(
    'slot-no-parameter',
    'a no-argument BuilderParam property retains its function type',
    `@Component
export struct EmptySlotCard {
  @BuilderParam
  content: () => void;

  build() {
    Column() {
      this.content()
    }
  }
}
`
  ),
  declarationCase(
    'slot-object-parameter',
    'a BuilderParam keeps its named model parameter and return type',
    `export interface SlotModel {
  text: string;
}

@Component
export struct ModelSlotCard {
  @BuilderParam
  detail: (model: SlotModel) => void;

  build() {
    this.detail({ text: 'detail' })
  }
}
`
  ),
  declarationCase(
    'slot-union-model',
    'a BuilderParam model union retains each member and nullability',
    `export interface UnionHeading {
  title: string;
}

export type UnionInput = UnionHeading | string | undefined;

@Component
export struct UnionSlotCard {
  @BuilderParam
  content: (input: UnionInput) => void;

  build() {
    this.content({ title: 'union' })
  }
}
`
  ),
  declarationCase(
    'component-and-exported-builder',
    'one module exposes both a component and a global Builder without signature loss',
    `export interface SharedModel {
  text: string;
}

@Builder
export function SharedHeading(model: SharedModel): void {
  Text(model.text)
}

@Component
export struct SharedSlotCard {
  @BuilderParam
  content: (model: SharedModel) => void;

  build() {
    this.content({ text: 'shared' })
  }
}
`
  )
];

const transformCases = [
  {
    id: 'builder-import-dedup',
    fileName: 'builder-import-dedup.ets',
    title: 'existing Builder and BuilderParam imports are not duplicated',
    boundary: 'existing component annotation imports remain deduplicated',
    mode: 'direct',
    source: `'use static'
import { Builder, BuilderParam, Component } from '@ohos.arkui.component';
@Builder
export declare function ExistingHeading(): void;
@Component
export declare struct ExistingImportCard {
  @BuilderParam content: () => void;
}
`
  },
  {
    id: 'builder-and-slot-imports',
    fileName: 'builder-and-slot-imports.ets',
    title: 'Builder and BuilderParam use the component annotation module',
    boundary: 'generated imports preserve both decorator families',
    mode: 'direct',
    source: `'use static'
@Builder
export declare function GeneratedHeading(): void;
@Component
export declare struct GeneratedImportCard {
  @BuilderParam content: () => void;
}
`
  },
  {
    id: 'builder-signature-preservation',
    fileName: 'builder-signature-preservation.ets',
    title: 'Builder transformation does not rewrite parameters',
    boundary: 'names, optionality and return types remain unchanged',
    mode: 'direct',
    source: `'use static'
import { Builder } from '@ohos.arkui.component';
export interface TransformModel {
  title: string;
}
@Builder
export declare function SignatureHeading(model: TransformModel, count?: number): void;
`
  },
  {
    id: 'builder-method-return-inference',
    fileName: 'builder-method-return-inference.ets',
    title: 'declaration methods receive a void return without changing Builder methods',
    boundary: 'only missing method return types are completed',
    mode: 'direct',
    source: `'use static'
import { Builder, Component } from '@ohos.arkui.component';
@Component
export declare struct InferredBuilderCard {
  @Builder content();
  build();
}
`
  },
  {
    id: 'ordinary-callback-control',
    fileName: 'ordinary-callback-control.ets',
    title: 'ordinary callbacks are not treated as BuilderParam properties',
    boundary: 'an undecorated function property is a negative control',
    mode: 'direct',
    source: `'use static'
import { Component } from '@ohos.arkui.component';
@Component
export declare struct CallbackControlCard {
  onContent: () => void;
}
`
  },
  {
    id: 'builder-directive-position',
    fileName: 'builder-directive-position.ets',
    title: 'generated Builder imports follow the static directive',
    boundary: 'the language directive remains the first statement',
    mode: 'direct',
    source: `'use static'
@Builder
export declare function DirectiveHeading(): void;
`
  }
];

const globalBuilderCallee = `export interface BannerOptions {
  text: string;
}

@Builder
export function ExportedBanner(): void {
  Text('exported-banner')
}

@Builder
export function ExportedOptions(options: BannerOptions): void {
  Text(options.text)
}

@Builder
export function ExportedPair(options: BannerOptions, count: number): void {
  Text(options.text + count)
}

@Component
export struct GlobalBuilderHost {
  @Prop label: string = '';

  build() {
    Column() {
      Text(this.label)
    }
  }
}
`;

const globalBuilderCaller = `'use static'
import { Entry, Component, Column } from '@ohos.arkui.component';
import {
  ExportedBanner,
  ExportedOptions,
  ExportedPair,
  GlobalBuilderHost
} from 'dynamic_component';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      ExportedBanner()
      ExportedOptions({ text: 'one-option' })
      ExportedPair({ text: 'pair-option' }, 2)
      GlobalBuilderHost({ label: 'global-host' })
    }
  }
}
`;

const namedSlotCallee = `export interface NamedSlotModel {
  text: string;
}

@Component
export struct NamedSlotCard {
  @Prop title: string = '';
  @BuilderParam body: () => void;
  @BuilderParam detail: (model: NamedSlotModel) => void;

  build() {
    Column() {
      Text(this.title)
      this.body()
      this.detail({ text: this.title })
    }
  }
}
`;

const namedSlotCaller = `'use static'
import { Entry, Component, Column, Text, Builder } from '@ohos.arkui.component';
import { NamedSlotCard, NamedSlotModel } from 'dynamic_component';

@Entry
@Component
struct Index {
  @Builder
  localBody(): void {
    Text('named-local-body')
  }

  @Builder
  localDetail(model: NamedSlotModel): void {
    Text(model.text)
  }

  build() {
    Column(undefined) {
      NamedSlotCard({
        title: 'named-slot',
        body: this.localBody,
        detail: this.localDetail
      })
    }
  }
}
`;

const explicitSlotCallee = `@Component
export struct ExplicitSlotCard {
  @Prop title: string = '';
  @BuilderParam content: () => void;

  build() {
    Column() {
      Text(this.title)
      this.content()
    }
  }
}
`;

const explicitSlotCaller = `'use static'
import { Entry, Component, Column, Text, Builder } from '@ohos.arkui.component';
import { ExplicitSlotCard } from 'dynamic_component';

@Entry
@Component
struct Index {
  @Builder
  slotContent(): void {
    Text('explicit-slot-content')
  }

  @Builder
  pageContent(): void {
    ExplicitSlotCard({ title: 'explicit-slot', content: this.slotContent })
  }

  build() {
    Column(undefined) {
      this.pageContent()
    }
  }
}
`;

const dynamicReferenceCallee = `@Component
export struct ReferenceSlotCard {
  @BuilderParam content: () => void;

  build() {
    this.content()
  }
}
`;

const dynamicReferenceCaller = `'use static'
import { Entry, Component, Column, Text, Builder } from '@ohos.arkui.component';
import { ReferenceSlotCard } from 'dynamic_component';

@Builder
function StaticReferenceContent(): void {
  Text('static-global-reference-content')
}

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      ReferenceSlotCard({ content: StaticReferenceContent })
    }
  }
}
`;

const inlineLambdaCallee = `@Component
export struct InlineSlotCard {
  @Prop label: string = '';
  @BuilderParam content: () => void;

  build() {
    Column() {
      Text(this.label)
      this.content()
    }
  }
}
`;

const inlineLambdaCaller = `'use static'
import { Entry, Component, Column, Row, Text, Builder } from '@ohos.arkui.component';
import { InlineSlotCard } from 'dynamic_component';

@Entry
@Component
struct Index {
  private showContent: boolean = true;

  @Builder
  nestedContent(): void {
    Text('nested-builder-content')
  }

  build() {
    Column(undefined) {
      if (this.showContent) {
        Row(undefined) {
          InlineSlotCard({ label: 'nested-call', content: this.nestedContent })
        }
      }
    }
  }
}
`;

function barrelFor(componentName, extraNames = [], sourceFile) {
  const names = [componentName, ...extraNames].join(', ');
  const fileName = sourceFile || componentName.replace(/Card$|Host$/, '');
  return `export { ${names} } from './src/main/ets/${fileName}';\n`;
}

const compileCases = [
  {
    id: 'global-builder-calls',
    title: 'exported global Builders compile at zero, one and two argument call sites',
    boundary: 'global export, argument count and direct UI call position',
    calleeFile: 'GlobalBuilder.ets',
    callee: globalBuilderCallee,
    index: barrelFor('GlobalBuilderHost', [
      'ExportedBanner',
      'ExportedOptions',
      'ExportedPair',
      'BannerOptions'
    ]),
    caller: globalBuilderCaller,
    declaration: 'GlobalBuilder.d.ets',
    componentName: 'GlobalBuilderHost'
  },
  {
    id: 'named-local-builder-references',
    title: 'named options pass local Builder references with and without models',
    boundary: 'local Builder reference, custom model signature and component options',
    calleeFile: 'NamedSlot.ets',
    callee: namedSlotCallee,
    index: barrelFor('NamedSlotCard', ['NamedSlotModel']),
    caller: namedSlotCaller,
    declaration: 'NamedSlot.d.ets',
    componentName: 'NamedSlotCard'
  },
  {
    id: 'local-builder-call-position',
    title: 'a local Builder invokes a dynamic component with an explicit slot reference',
    boundary: 'local Builder invocation position and explicit BuilderParam content reference',
    calleeFile: 'ExplicitSlot.ets',
    callee: explicitSlotCallee,
    index: barrelFor('ExplicitSlotCard'),
    caller: explicitSlotCaller,
    declaration: 'ExplicitSlot.d.ets',
    componentName: 'ExplicitSlotCard'
  },
  {
    id: 'global-static-builder-reference',
    title: 'a static global Builder reference uses the named transfer path',
    boundary: 'global static function reference is distinct from local and dynamic Builders',
    calleeFile: 'DynamicReference.ets',
    callee: dynamicReferenceCallee,
    index: barrelFor('ReferenceSlotCard', [], 'DynamicReference'),
    caller: dynamicReferenceCaller,
    declaration: 'DynamicReference.d.ets',
    componentName: 'ReferenceSlotCard'
  },
  {
    id: 'nested-builder-call-position',
    title: 'a named local Builder reference compiles at a nested conditional call position',
    boundary: 'conditional Row position, named reference and component creation contract',
    calleeFile: 'InlineSlot.ets',
    callee: inlineLambdaCallee,
    index: barrelFor('InlineSlotCard'),
    caller: inlineLambdaCaller,
    declaration: 'InlineSlot.d.ets',
    componentName: 'InlineSlotCard'
  }
];

const moduleIdentity = {
  packageName: 'dynamic_component',
  packageVersion: '1.0.0',
  callerPackage: 'entry',
  callerRecord: 'entry.src.main.ets.pages.Index',
  bundleName: 'com.example.interopuipr01'
};

module.exports = {
  compileCases,
  declarationCases,
  moduleIdentity,
  transformCases
};
