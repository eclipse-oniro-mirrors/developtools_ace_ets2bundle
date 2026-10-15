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

import * as path from 'path';
import { PluginTester } from '../../../../utils/plugin-tester';
import { mockBuildConfig } from '../../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../../utils/path-config';
import { parseDumpSrc } from '../../../../utils/parse-string';
import { collectNoRecheck, uiNoRecheck, memoNoRecheck } from '../../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { Plugins } from '../../../../../common/plugin-context';
import { uiTransform } from '../../../../../ui-plugins';
import { dumpConstructor } from '../../../../utils/simplify-dump';

const BUILDER_DIR_PATH: string = 'decorators/builder';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, BUILDER_DIR_PATH, 'placeholder-builder.ets'),
];

const pluginTester = new PluginTester(
    'test @Builder({ isPlaceholder: true }) placeholder builder instrumentation',
    buildConfig
);

const parsedTransform: Plugins = {
    name: 'parsed transform',
    parsed: uiTransform().parsed
};

// Golden for @Builder({ isPlaceholder: true }) level-2 instrumentation. Hooks snapshot after
// the checked-phase transforms: 'checked:ui-no-recheck' → after CheckedTransformer,
// 'checked:memo-no-recheck' → after the memo lowering. No recheck: the helper declarations
// are not in the static SDK yet.
const expectedUIScript: string = `import { TextImpl } from "arkui.component.text";

import { TextAttribute } from "arkui.component.text";

import { Memo } from "arkui.incremental.annotation";

import { __aceBeginScrollPlaceholder__ } from "arkui.component.builder";

import { __aceEndScrollPlaceholder__ } from "arkui.component.builder";

import { MemoSkip } from "arkui.incremental.annotation";

import { RowImpl } from "arkui.component.row";

import { RowAttribute } from "arkui.component.row";

import { MemoIntrinsic } from "arkui.incremental.annotation";

import { Memo } from "arkui.incremental.annotation";

import { ComponentBuilder } from "arkui.component.builder";

import { LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { Builder } from "arkui.component.builder";

import { CustomComponent } from "arkui.component.customComponent";

import { ReusePoolOwnership } from "arkui.component.customComponent";

import { Component, Row, Builder, Text } from "@ohos.arkui.component";

function main() {}

@Builder({isPlaceholder:true}) 
@Memo() 
function placeholderBuilder() {
  __aceBeginScrollPlaceholder__();
  TextImpl(@Memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello Placeholder", undefined);
    instance.applyAttributesFinish();
    return;
  }), undefined);
  __aceEndScrollPlaceholder__();
}

@Builder({isPlaceholder:false}) 
@Memo() 
function normalBuilderFalse() {
  TextImpl(@Memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello False", undefined);
    instance.applyAttributesFinish();
    return;
  }), undefined);
}

@Builder() 
@Memo() 
function normalBuilderEmptyCall() {
  TextImpl(@Memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello EmptyCall", undefined);
    instance.applyAttributesFinish();
    return;
  }), undefined);
}

@Builder() 
@Memo() 
function normalBuilderBare() {
  TextImpl(@Memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello Bare", undefined);
    instance.applyAttributesFinish();
    return;
  }), undefined);
}

@Builder({isPlaceholder:true}) 
@Memo() 
function placeholderWithParam(@MemoSkip() param: string) {
  TextImpl(@Memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello Param", undefined);
    instance.applyAttributesFinish();
    return;
  }), undefined);
}


@Component() final struct PlaceholderDemo extends CustomComponent<PlaceholderDemo, __Options_PlaceholderDemo> {
  public __initializeStruct(initializers: (__Options_PlaceholderDemo | undefined), @Memo() content: ((()=> void) | undefined)): void {}
  
  public __updateStruct(initializers: (__Options_PlaceholderDemo | undefined)): void {}
  
  public resetStateVarsOnReuse(initializers: (__Options_PlaceholderDemo | undefined)): void {}
  
  @MemoIntrinsic() 
  public static _invoke(style: (@Memo() ((instance: PlaceholderDemo)=> void) | undefined), initializers: ((()=> __Options_PlaceholderDemo) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @Memo() content: ((()=> void) | undefined)): void {
    CustomComponent._invokeImpl<PlaceholderDemo, __Options_PlaceholderDemo>(style, ((): PlaceholderDemo => {
      return new PlaceholderDemo(false, ({let gensym___<some_random_number> = storage;
      (((gensym___<some_random_number>) == (null)) ? undefined : gensym___<some_random_number>())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() 
  public static $_invoke(initializers?: __Options_PlaceholderDemo, storage?: LocalStorage, @Builder() @Memo() content?: (()=> void)): PlaceholderDemo {
    throw new Error("Declare interface");
  }
  
  @Memo() 
  public build() {
    RowImpl(@Memo() ((instance: RowAttribute): void => {
      instance.setRowOptions(undefined);
      instance.applyAttributesFinish();
      return;
    }), @Memo() (() => {
      placeholderBuilder();
      normalBuilderFalse();
      normalBuilderEmptyCall();
      normalBuilderBare();
      placeholderWithParam("x");
    }));
  }
  
${dumpConstructor()}
  
  static {
    
  }
}

@Component() class __Options_PlaceholderDemo {
  public constructor() {}
  
}
`;

// Memo phase: instrumentation statements are preserved by the memo lowering and bracket
// all rendering statements; the unchanged short-circuit happens BEFORE __aceBeginScrollPlaceholder__().
const expectedMemoScript: string = `import { __memo_context_type, __memo_id_type } from "arkui.incremental.runtime.state";

import { TextImpl } from "arkui.component.text";

import { TextAttribute } from "arkui.component.text";

import { Memo } from "arkui.incremental.annotation";

import { __aceBeginScrollPlaceholder__ } from "arkui.component.builder";

import { __aceEndScrollPlaceholder__ } from "arkui.component.builder";

import { MemoSkip } from "arkui.incremental.annotation";

import { RowImpl } from "arkui.component.row";

import { RowAttribute } from "arkui.component.row";

import { MemoIntrinsic } from "arkui.incremental.annotation";

import { Memo } from "arkui.incremental.annotation";

import { ComponentBuilder } from "arkui.component.builder";

import { LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { Builder } from "arkui.component.builder";

import { CustomComponent } from "arkui.component.customComponent";

import { ReusePoolOwnership } from "arkui.component.customComponent";

import { Component, Row, Builder, Text } from "@ohos.arkui.component";

function main() {}

@Builder({isPlaceholder:true}) 
@Memo() 
function placeholderBuilder(__memo_context: __memo_context_type, __memo_id: __memo_id_type) {
  const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (156290871)), 0);
  if (__memo_scope.unchanged) {
    __memo_scope.cached;
    return;
  }
  __aceBeginScrollPlaceholder__();
  TextImpl(__memo_context, ((__memo_id) + (105686315)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: TextAttribute): void => {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (24091041)), 1);
    const __memo_parameter_instance = __memo_scope.param(0, instance);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    __memo_parameter_instance.value.setTextOptions("Hello Placeholder", undefined);
    __memo_parameter_instance.value.applyAttributesFinish();
    {
      __memo_scope.recache();
      return;
    }
  }), undefined);
  __aceEndScrollPlaceholder__();
  {
    __memo_scope.recache();
    return;
  }
}

@Builder({isPlaceholder:false}) 
@Memo() 
function normalBuilderFalse(__memo_context: __memo_context_type, __memo_id: __memo_id_type) {
  const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (81051207)), 0);
  if (__memo_scope.unchanged) {
    __memo_scope.cached;
    return;
  }
  TextImpl(__memo_context, ((__memo_id) + (100857943)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: TextAttribute): void => {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (233161670)), 1);
    const __memo_parameter_instance = __memo_scope.param(0, instance);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    __memo_parameter_instance.value.setTextOptions("Hello False", undefined);
    __memo_parameter_instance.value.applyAttributesFinish();
    {
      __memo_scope.recache();
      return;
    }
  }), undefined);
  {
    __memo_scope.recache();
    return;
  }
}

@Builder() 
@Memo() 
function normalBuilderEmptyCall(__memo_context: __memo_context_type, __memo_id: __memo_id_type) {
  const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (164726169)), 0);
  if (__memo_scope.unchanged) {
    __memo_scope.cached;
    return;
  }
  TextImpl(__memo_context, ((__memo_id) + (139880722)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: TextAttribute): void => {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (214646653)), 1);
    const __memo_parameter_instance = __memo_scope.param(0, instance);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    __memo_parameter_instance.value.setTextOptions("Hello EmptyCall", undefined);
    __memo_parameter_instance.value.applyAttributesFinish();
    {
      __memo_scope.recache();
      return;
    }
  }), undefined);
  {
    __memo_scope.recache();
    return;
  }
}

@Builder() 
@Memo() 
function normalBuilderBare(__memo_context: __memo_context_type, __memo_id: __memo_id_type) {
  const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (99147146)), 0);
  if (__memo_scope.unchanged) {
    __memo_scope.cached;
    return;
  }
  TextImpl(__memo_context, ((__memo_id) + (142916272)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: TextAttribute): void => {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (233246969)), 1);
    const __memo_parameter_instance = __memo_scope.param(0, instance);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    __memo_parameter_instance.value.setTextOptions("Hello Bare", undefined);
    __memo_parameter_instance.value.applyAttributesFinish();
    {
      __memo_scope.recache();
      return;
    }
  }), undefined);
  {
    __memo_scope.recache();
    return;
  }
}

@Builder({isPlaceholder:true}) 
@Memo() 
function placeholderWithParam(__memo_context: __memo_context_type, __memo_id: __memo_id_type, @MemoSkip() param: string) {
  const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (255796366)), 0);
  if (__memo_scope.unchanged) {
    __memo_scope.cached;
    return;
  }
  TextImpl(__memo_context, ((__memo_id) + (145699379)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: TextAttribute): void => {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (205063966)), 1);
    const __memo_parameter_instance = __memo_scope.param(0, instance);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    __memo_parameter_instance.value.setTextOptions("Hello Param", undefined);
    __memo_parameter_instance.value.applyAttributesFinish();
    {
      __memo_scope.recache();
      return;
    }
  }), undefined);
  {
    __memo_scope.recache();
    return;
  }
}


@Component() final struct PlaceholderDemo extends CustomComponent<PlaceholderDemo, __Options_PlaceholderDemo> {
  public __initializeStruct(initializers: (__Options_PlaceholderDemo | undefined), @Memo() content: (((__memo_context: __memo_context_type, __memo_id: __memo_id_type)=> void) | undefined)): void {}
  
  public __updateStruct(initializers: (__Options_PlaceholderDemo | undefined)): void {}
  
  public resetStateVarsOnReuse(initializers: (__Options_PlaceholderDemo | undefined)): void {}
  
  @MemoIntrinsic() 
  public static _invoke(__memo_context: __memo_context_type, __memo_id: __memo_id_type, style: (@Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: PlaceholderDemo)=> void) | undefined), initializers: ((()=> __Options_PlaceholderDemo) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @Memo() content: (((__memo_context: __memo_context_type, __memo_id: __memo_id_type)=> void) | undefined)): void {
    CustomComponent._invokeImpl<PlaceholderDemo, __Options_PlaceholderDemo>(__memo_context, ((__memo_id) + (17009055)), style, ((): PlaceholderDemo => {
      return new PlaceholderDemo(false, ({let gensym___<some_random_number> = storage;
      (((gensym___<some_random_number>) == (null)) ? undefined : gensym___<some_random_number>())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() 
  public static $_invoke(initializers?: __Options_PlaceholderDemo, storage?: LocalStorage, @Builder() @Memo() content?: ((__memo_context: __memo_context_type, __memo_id: __memo_id_type)=> void)): PlaceholderDemo {
    throw new Error("Declare interface");
  }
  
  @Memo() 
  public build(__memo_context: __memo_context_type, __memo_id: __memo_id_type) {
    const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (42858987)), 0);
    if (__memo_scope.unchanged) {
      __memo_scope.cached;
      return;
    }
    RowImpl(__memo_context, ((__memo_id) + (3377761)), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type, instance: RowAttribute): void => {
      const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (8387892)), 1);
      const __memo_parameter_instance = __memo_scope.param(0, instance);
      if (__memo_scope.unchanged) {
        __memo_scope.cached;
        return;
      }
      __memo_parameter_instance.value.setRowOptions(undefined);
      __memo_parameter_instance.value.applyAttributesFinish();
      {
        __memo_scope.recache();
        return;
      }
    }), @Memo() ((__memo_context: __memo_context_type, __memo_id: __memo_id_type) => {
      const __memo_scope = __memo_context.scope<undefined>(((__memo_id) + (62971518)), 0);
      if (__memo_scope.unchanged) {
        __memo_scope.cached;
        return;
      }
      placeholderBuilder(__memo_context, ((__memo_id) + (542835)));
      normalBuilderFalse(__memo_context, ((__memo_id) + (112363822)));
      normalBuilderEmptyCall(__memo_context, ((__memo_id) + (10445039)));
      normalBuilderBare(__memo_context, ((__memo_id) + (60297026)));
      placeholderWithParam(__memo_context, ((__memo_id) + (198362064)), "x");
      {
        __memo_scope.recache();
        return;
      }
    }));
    {
      __memo_scope.recache();
      return;
    }
  }
  
${dumpConstructor()}
  
  static {
    
  }
}

@Component() class __Options_PlaceholderDemo {
  public constructor() {}
  
}
`;

function testUITransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedUIScript));
}

function testMemoTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedMemoScript));
}

pluginTester.run(
    'test @Builder({ isPlaceholder: true }) placeholder builder instrumentation',
    [parsedTransform, collectNoRecheck, uiNoRecheck, memoNoRecheck],
    {
        'checked:ui-no-recheck': [testUITransformer],
        'checked:memo-no-recheck': [testMemoTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
