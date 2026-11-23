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
import { Observed, ObservedV2, ObjectLink } from "@ohos.arkui.stateManagement"

@Observed
class Data {}

@ObservedV2
class V2Data {}

@Component
struct MessageProbeSamples {
  // Basic types: expect checkPropertyType message (no 'makeV1Observed' tail)
  @ObjectLink numValue: number;

  @ObjectLink strValue: string;

  // '@ObservedV2' class: expect checkPropertyType message (no 'makeV1Observed' tail)
  @ObjectLink v2Value: V2Data;

  // 'Function' type: expect checkObjectLinkFunctionType message (with 'makeV1Observed' tail)
  @ObjectLink fn: Function;

  // Union with a 'Function' member: expect BOTH messages
  @ObjectLink fnUnion: Function | null;

  // Control: '@Observed' class must produce no message
  @ObjectLink data: Data;

  build() {}
}
