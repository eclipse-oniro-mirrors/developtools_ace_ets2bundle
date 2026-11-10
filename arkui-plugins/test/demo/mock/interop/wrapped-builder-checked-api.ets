/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Builder, WrappedBuilder, CustomBuilderT, wrapBuilder } from '@ohos.arkui.component';
import { ImportedBuilderT } from './wrapped-builder-imported-alias';

type Nullable<T> = T | null;
type MyBuilder<A, B> = (first: A, second: B) => void;
type NestedBuilder<T> = MyBuilder<T, number>;
export interface RootNode { str: string; }
export interface DSLRegisterManager {
    registerComponent(): Nullable<WrappedBuilder<CustomBuilderT<RootNode>>>;
    registerImported(): WrappedBuilder<ImportedBuilderT<RootNode>>;
    registerMultiple(): WrappedBuilder<MyBuilder<string, number>>;
    registerNested(): WrappedBuilder<NestedBuilder<string>>;
    registerInline(): WrappedBuilder<(value: string, size: number) => void>;
    setBuilder(value: WrappedBuilder<MyBuilder<string, number>>): void;
}
export declare let builders: WrappedBuilder<(value: string, size: number) => void>[];
@Builder
export function renderRoot(value: RootNode): void {}
export let builderVar: WrappedBuilder<CustomBuilderT<RootNode>> = wrapBuilder(renderRoot);

export let inlineBuilderVar: WrappedBuilder<(value: RootNode) => void> = wrapBuilder(renderRoot);
export declare function acceptBuilder(builder: WrappedBuilder<MyBuilder<string, number>>): void;
export declare function getBuilder(): WrappedBuilder<CustomBuilderT<RootNode>>;
export declare class BuilderHolder {
    builder: WrappedBuilder<CustomBuilderT<RootNode>>;
}
export interface GenericBuilderHolder<T> {
    builder: WrappedBuilder<T>;
}
export declare let tupleBuilder: WrappedBuilder<[RootNode]>;
