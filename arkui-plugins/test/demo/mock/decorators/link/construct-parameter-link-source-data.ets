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

import { Column, Component, CustomDialog, CustomDialogController, Entry } from "@ohos.arkui.component"
import { State, Link, ObjectLink } from "@ohos.arkui.stateManagement"

class Payload {
  value: number = 0;
}

class Holder {
  payload: Payload = new Payload();
}

const globalValue: number = 3;

// Reported: everything that does not unwrap to a direct this.xxx member access —
// deep chains from this (optional chaining and plain member chains), literals and
// regular identifiers, each also in its type-asserted form.
// Not reported: direct this.xxx source data, with any stacking of a top-level
// non-null assertion and type assertion, and every @ObjectLink target.
@Entry
@Component
struct Parent {
  @State holder: Holder = new Holder();
  @State direct: number = 1;
  regular: number = 2;

  build() {
    Column() {
      Child({
        linkOptionalChain: this.holder?.payload?.value,
        linkPlainChain: this.holder.payload.value,
        linkLiteral: 5,
        linkIdentifier: globalValue,
        linkAsIdentifier: globalValue as number,
        linkAsLiteral: 5 as number,
        linkAsPlainChain: this.holder.payload.value as number,
        linkAsOptionalChain: this.holder?.payload?.value as number,
        linkDirect: this.direct,
        linkNonNull: this.direct!,
        linkAs: this.direct as number,
        linkNonNullAs: this.direct! as number,
        linkRegularSource: this.regular
      });
      GrandChild({
        objectLinkLiteral: new Payload()
      });
      SlotConsumer({
        content: AsChild({ linkAsSlotValue: 5 }) as Object
      });
    }
  }

  makeChild(): Object {
    return AsChild({ linkAsSlotReturn: 5 }) as Object;
  }
}

@Component
struct Child {
  @Link linkOptionalChain: number;
  @Link linkPlainChain: number;
  @Link linkLiteral: number;
  @Link linkIdentifier: number;
  @Link linkAsIdentifier: number;
  @Link linkAsLiteral: number;
  @Link linkAsPlainChain: number;
  @Link linkAsOptionalChain: number;
  @Link linkDirect: number;
  @Link linkNonNull: number;
  @Link linkAs: number;
  @Link linkNonNullAs: number;
  @Link linkRegularSource: number;

  build() {
    Column() {
    }
  }
}

@Component
struct GrandChild {
  @ObjectLink objectLinkLiteral: Payload;

  build() {
    Column() {
    }
  }
}

@Component
struct AsChild {
  @Link linkAsSlotValue: number;
  @Link linkAsSlotReturn: number;

  build() {
    Column() {
    }
  }
}

@Component
struct SlotConsumer {
  content: Object = new Object();

  build() {
    Column() {
    }
  }
}

// Not reported: a struct call in property-value position instantiates a slot with
// placeholder options (the official @CustomDialog self-referencing controller builder),
// so its @Link targets are exempt — even though the values are literals.
@CustomDialog
struct SlotDialog {
  @Link linkInDialog: number;
  controller: CustomDialogController = new CustomDialogController({
    builder: SlotDialog({ linkInDialog: 5 })
  });

  build() {
    Column() {
    }
  }
}
