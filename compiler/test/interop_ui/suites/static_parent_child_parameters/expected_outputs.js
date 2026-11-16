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
  'empty-options': `() => {
    const result = new __Options_StaticCard();
    return result;
}`,
  'count-zero': `() => {
    const result = new __Options_StaticCard();
    result["count"] = 0;
    result["__options_has_count"] = true;
    return result;
}`,
  'count-positive': `() => {
    const result = new __Options_StaticCard();
    result["count"] = 7;
    result["__options_has_count"] = true;
    return result;
}`,
  'count-negative': `() => {
    const result = new __Options_StaticCard();
    result["count"] = -3;
    result["__options_has_count"] = true;
    return result;
}`,
  'count-decimal': `() => {
    const result = new __Options_StaticCard();
    result["count"] = 0.25;
    result["__options_has_count"] = true;
    return result;
}`,
  'empty-title': `() => {
    const result = new __Options_StaticCard();
    result["title"] = "";
    result["__options_has_title"] = true;
    return result;
}`,
  'quoted-title': `() => {
    const result = new __Options_StaticCard();
    result["title"] = "a\\"b";
    result["__options_has_title"] = true;
    return result;
}`,
  'unicode-title': `() => {
    const result = new __Options_StaticCard();
    result["title"] = "\\u9759\\u6001\\u5361\\u7247";
    result["__options_has_title"] = true;
    return result;
}`,
  'false-enabled': `() => {
    const result = new __Options_StaticCard();
    result["enabled"] = false;
    result["__options_has_enabled"] = true;
    return result;
}`,
  'true-enabled': `() => {
    const result = new __Options_StaticCard();
    result["enabled"] = true;
    result["__options_has_enabled"] = true;
    return result;
}`,
  'nullable-model': `() => {
    const result = new __Options_StaticCard();
    result["model"] = null;
    result["__options_has_model"] = true;
    return result;
}`,
  'undefined-model': `() => {
    const result = new __Options_StaticCard();
    result["model"] = undefined;
    result["__options_has_model"] = true;
    return result;
}`,
  'array-model': `() => {
    const result = new __Options_StaticCard();
    result["values"] = [1, 2];
    result["__options_has_values"] = true;
    return result;
}`,
  'nested-model': `() => {
    const result = new __Options_StaticCard();
    result["model"] = { name: "card", count: 2 };
    result["__options_has_model"] = true;
    return result;
}`,
  'empty-array': `() => {
    const result = new __Options_StaticCard();
    result["values"] = [];
    result["__options_has_values"] = true;
    return result;
}`,
  'empty-model': `() => {
    const result = new __Options_StaticCard();
    result["model"] = {};
    result["__options_has_model"] = true;
    return result;
}`,
  'mixed-parameters': `() => {
    const result = new __Options_StaticCard();
    result["count"] = 0;
    result["__options_has_count"] = true;
    result["title"] = "";
    result["__options_has_title"] = true;
    result["enabled"] = false;
    result["__options_has_enabled"] = true;
    return result;
}`,
  'reordered-parameters': `() => {
    const result = new __Options_StaticCard();
    result["enabled"] = true;
    result["__options_has_enabled"] = true;
    result["count"] = 2;
    result["__options_has_count"] = true;
    result["title"] = "last";
    result["__options_has_title"] = true;
    return result;
}`,
  'undefined-and-zero': `() => {
    const result = new __Options_StaticCard();
    result["model"] = undefined;
    result["__options_has_model"] = true;
    result["count"] = 0;
    result["__options_has_count"] = true;
    return result;
}`,
  'conditional-count': `() => {
    const result = new __Options_StaticCard();
    result["count"] = false ? 1 : 2;
    result["__options_has_count"] = true;
    return result;
}`,
  'binary-count': `() => {
    const result = new __Options_StaticCard();
    result["count"] = 6 * 7;
    result["__options_has_count"] = true;
    return result;
}`,
  'nullish-title': `() => {
    const result = new __Options_StaticCard();
    result["title"] = undefined ?? "fallback";
    result["__options_has_title"] = true;
    return result;
}`,
  'parent-count-expression': `() => {
    const result = new __Options_StaticCard();
    result["count"] = this.count;
    result["__options_has_count"] = true;
    return result;
}`,
  'parent-title-expression': `() => {
    const result = new __Options_StaticCard();
    result["title"] = this.title;
    result["__options_has_title"] = true;
    return result;
}`,
  'link-backing-state': `() => {
    const result = new __Options_StaticCard();
    result["__backing_count"] = __Interop_createCompatibleStaticState_Internal(this.__count);
    result["__options_has_count"] = true;
    return result;
}`,
  'link-non-this-reference': `() => {
    const result = new __Options_StaticCard();
    result["__backing_count"] = __Interop_createCompatibleStaticState_Internal(stateReference);
    result["__options_has_count"] = true;
    return result;
}`,
  'link-and-value-parameters': `() => {
    const result = new __Options_StaticCard();
    result["__backing_count"] = __Interop_createCompatibleStaticState_Internal(this.__count);
    result["__options_has_count"] = true;
    result["title"] = this.title;
    result["__options_has_title"] = true;
    return result;
}`,
  'two-backing-properties': `() => {
    const result = new __Options_StaticCard();
    result["__backing_count"] = __Interop_createCompatibleStaticState_Internal(this.__count);
    result["__options_has_count"] = true;
    result["__backing_other"] = __Interop_createCompatibleStaticState_Internal(this.__other);
    result["__options_has_other"] = true;
    return result;
}`
};

module.exports = { outputs };
