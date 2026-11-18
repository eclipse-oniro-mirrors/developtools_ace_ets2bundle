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

import { Component } from "@ohos.arkui.component"
import { Observed, ObjectLink } from "@ohos.arkui.stateManagement"

@Observed
class Data {}

type FunctionAlias = Function;
type LambdaAlias = (a: number) => string;

@Component
struct FunctionTypeSamples {
  // Invalid: 'Function' type reference
  @ObjectLink fn: Function;

  // Invalid: type alias resolving to 'Function'
  @ObjectLink fnAlias: FunctionAlias;

  // Invalid: union containing a 'Function' member
  @ObjectLink fnUnion: Function | null;

  // Valid: direct lambda type (anonymous, no 'Function' symbol)
  @ObjectLink handler: () => void;

  // Valid: type alias resolving to a lambda type
  @ObjectLink cb: LambdaAlias;

  // Valid: union of only lambda types
  @ObjectLink pureLambdaUnion: (() => void) | (() => string);

  // Valid: '@Observed' class type (control case, must not be reported)
  @ObjectLink data: Data;

  build() {}
}
