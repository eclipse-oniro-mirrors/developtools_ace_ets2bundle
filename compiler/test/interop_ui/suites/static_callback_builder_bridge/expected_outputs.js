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
  'method-arity-0': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-1': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-2': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-3': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder3_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-4': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder4_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-5': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder5_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-6': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder6_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-7': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder7_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-8': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder8_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-9': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder9_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-10': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder10_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'method-arity-11': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'optional-parameter': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'default-parameter': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'two-optional-parameters': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'rest-parameter': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'checker-unavailable': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'unresolved-method-reference': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(this.missingBuilder.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'arrow-property-reference': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'global-function-arity-0': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'global-function-arity-1': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'global-function-arity-2': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'global-function-arity-3': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder3_Internal(buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'static-builder-arity-0': `() => {
    const result = new __Options_StaticCard();
    result["content"] = (...args) => staticContent(...args);
    result["__options_has_content"] = true;
    return result;
}`,
  'static-builder-arity-1': `() => {
    const result = new __Options_StaticCard();
    result["content"] = (...args) => staticContent(...args);
    result["__options_has_content"] = true;
    return result;
}`,
  'static-builder-arity-2': `() => {
    const result = new __Options_StaticCard();
    result["content"] = (...args) => staticContent(...args);
    result["__options_has_content"] = true;
    return result;
}`,
  'regular-arrow-callback': `() => {
    const result = new __Options_StaticCard();
    result["onAction"] = (value: number): void => { this.value = value; };
    result["__options_has_onAction"] = true;
    return result;
}`,
  'regular-method-callback': `() => {
    const result = new __Options_StaticCard();
    result["onAction"] = this.onAction;
    result["__options_has_onAction"] = true;
    return result;
}`,
  'regular-bound-callback': `() => {
    const result = new __Options_StaticCard();
    result["onAction"] = this.onAction.bind(this);
    result["__options_has_onAction"] = true;
    return result;
}`,
  'regular-function-expression': `() => {
    const result = new __Options_StaticCard();
    result["onAction"] = function (value: number): void { console.info(value.toString()); };
    result["__options_has_onAction"] = true;
    return result;
}`,
  'inherited-builder-method': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'overloaded-builder-declaration': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'generic-builder-method': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder1_Internal(this.buildContent.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'imported-builder-alias-arity-0': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(localBuilder.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'imported-builder-alias-arity-2': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(localBuilder.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'namespace-qualified-builder-function': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder2_Internal(Builders.actualBuilder.bind(this));
    result["__options_has_content"] = true;
    return result;
}`,
  'trailing-lambda-overrides-reference': `() => {
    const result = new __Options_StaticCard();
    result["content"] = __Interop_transferCompatibleDynamicBuilder_Internal(((): void => {
        console.info('actual trailing body');
    }).bind(this));
    result["__options_has_content"] = true;
    return result;
}`
};

module.exports = { outputs };
