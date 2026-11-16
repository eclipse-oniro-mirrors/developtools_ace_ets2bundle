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

const outputs = {
  'empty-options': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'negative-literal': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        result["count"] = -4;
        result["__options_has_count"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'array-argument': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        result["values"] = [1, 2, 3];
        result["__options_has_values"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'object-argument': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        result["model"] = { title: "card", count: 2 };
        result["__options_has_model"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'multiple-properties': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        result["count"] = 3;
        result["__options_has_count"] = true;
        result["title"] = "card";
        result["__options_has_title"] = true;
        result["enabled"] = false;
        result["__options_has_enabled"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'initial-then-update': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_StaticCard = __Interop_CreateStaticComponent_Internal(() => { return new StaticCard(undefined, undefined); }, () => {
        const result = new __Options_StaticCard();
        result["count"] = this.count;
        result["__options_has_count"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_StaticCard[1]);
    ViewStackProcessor.pop();
}
else {
    static_StaticCard[0]()
}`,
  'component-name-静态卡片': `if (isInitialRender) {
    __Interop_UpdateInteropExtendableComponent_Internal(this);
    static_静态卡片 = __Interop_CreateStaticComponent_Internal(() => { return new 静态卡片(undefined, undefined); }, () => {
        const result = new __Options_静态卡片();
        result["count"] = 3;
        result["__options_has_count"] = true;
        return result;
    });
    __Interop_ResetInteropExtendableComponent_Internal();
    ViewStackProcessor.push(static_静态卡片[1]);
    ViewStackProcessor.pop();
}
else {
    static_静态卡片[0]()
}`
};

module.exports = { outputs };
