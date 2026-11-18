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

import { Column, Component, Entry } from "@ohos.arkui.component"
import { Link, ObjectLink } from "@ohos.arkui.stateManagement"

class Payload {
  value: number = 0;
}

// The 'regular' property warning states the violated target property without
// dumping the assigned value source.
@Entry
@Component
struct Parent {
  build() {
    Column() {
      Child({
        linkLiteral: 5,
        linkString: 'init'
      });
      GrandChild({
        objectLinkInstance: new Payload()
      });
    }
  }
}

@Component
struct Child {
  @Link linkLiteral: number;
  @Link linkString: string;

  build() {
    Column() {
    }
  }
}

@Component
struct GrandChild {
  @ObjectLink objectLinkInstance: Payload;

  build() {
    Column() {
    }
  }
}
