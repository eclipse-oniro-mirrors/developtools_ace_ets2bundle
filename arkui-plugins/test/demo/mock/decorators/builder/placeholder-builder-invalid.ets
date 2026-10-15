/*
 * Copyright (C) 2026 Huawei Device Co., Ltd.
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

import { Builder, Column, Component, Text } from "@ohos.arkui.component"

// D-4: global placeholder builder declaring parameters
@Builder({ isPlaceholder: true })
function placeholderWithParam(param: string) {
  Text('D4')
}

@Component
struct PlaceholderInvalidDemo {
  // D-1: struct member @Builder carrying decorator arguments
  @Builder({ isPlaceholder: true })
  memberBuilderWithArgs() {
    Text('D1 struct')
  }

  // negative: bare member @Builder stays legal
  @Builder
  memberBuilderBare() {
    Text('ok')
  }

  build() {
    Column() {
    }
  }
}

// D-1: normal-class member @Builder carrying decorator arguments
class NormalHolder {
  @Builder({ isPlaceholder: true })
  memberBuilderWithArgs() {
    Text('D1 class')
  }

  // negative: empty-call member @Builder() stays legal
  @Builder()
  memberBuilderEmptyCall() {
    Text('ok')
  }
}
