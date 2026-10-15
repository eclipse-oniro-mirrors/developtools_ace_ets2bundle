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
import { recheck, collectNoRecheck, uiNoRecheck } from '../../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { uiTransform } from '../../../../../ui-plugins';
import { Plugins } from '../../../../../common/plugin-context';

const LIFECYCLE_DIR_PATH: string = 'decorators/lifecycle';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, LIFECYCLE_DIR_PATH, 'component-lifecycle.ets'),
];

const pluginTester = new PluginTester('test @ComponentInit/@ComponentActive/@ComponentInactive transformation', buildConfig);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

const expectedCheckedScript: string = `

import { TextImpl } from "arkui.component.text";

import { TextAttribute } from "arkui.component.text";

import { Memo } from "arkui.incremental.annotation";

import { ColumnImpl } from "arkui.component.column";

import { ColumnAttribute } from "arkui.component.column";

import { UIUtils } from "arkui.stateManagement.utils";

import { MemoIntrinsic } from "arkui.incremental.annotation";

import { Memo } from "arkui.incremental.annotation";

import { ComponentBuilder } from "arkui.component.builder";

import { LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { Builder } from "arkui.component.builder";

import { CustomComponent } from "arkui.component.customComponent";

import { ReusePoolOwnership } from "arkui.component.customComponent";

import { PageLifeCycle } from "arkui.component.customComponent";

import { EntryPoint } from "arkui.component.customComponent";

import { NavInterface } from "arkui.component.customComponent";

import { Entry, Component, Column, Text } from "@ohos.arkui.component";

import { ComponentInit, ComponentActive, ComponentInactive } from "@kit.ArkUI";

function main() {}

__EntryWrapper.RegisterNamedRouter("", new __EntryWrapper(), ({
  bundleName: "com.example.mock",
  moduleName: "entry",
  pagePath: "../../../decorators/lifecycle/component-lifecycle",
  pageFullPath: "test/demo/mock/decorators/lifecycle/component-lifecycle",
  integratedHsp: "false",
} as NavInterface));
@Entry() @Component() final struct LifecycleSample extends CustomComponent<LifecycleSample, __Options_LifecycleSample> implements PageLifeCycle {
  public __initializeStruct(initializers: (__Options_LifecycleSample | undefined), @Memo() content: ((()=> void) | undefined)): void {
    this.onInit();
    const __onActive__Internal = this.onActive;
    const __onInactive__Internal = this.onInactive;
    UIUtils.getCustomComponentContext(this).registerActiveAndInactiveCallback((() => {
      __onActive__Internal.unsafeCall();
    }), (() => {
      __onInactive__Internal.unsafeCall();
    }));
  }
  
  public __updateStruct(initializers: (__Options_LifecycleSample | undefined)): void {}
  
  public resetStateVarsOnReuse(initializers: (__Options_LifecycleSample | undefined)): void {}
  
  @MemoIntrinsic() 
  public static _invoke(style: (@Memo() ((instance: LifecycleSample)=> void) | undefined), initializers: ((()=> __Options_LifecycleSample) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @Memo() content: ((()=> void) | undefined)): void {
    CustomComponent._invokeImpl<LifecycleSample, __Options_LifecycleSample>(style, ((): LifecycleSample => {
      return new LifecycleSample(false, ({let gensym___203542966 = storage;
      (((gensym___203542966) == (null)) ? undefined : gensym___203542966())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() 
  public static $_invoke(initializers?: __Options_LifecycleSample, storage?: LocalStorage, @Builder() @Memo() content?: (()=> void)): LifecycleSample {
    throw new Error("Declare interface");
  }
  
  @ComponentInit() 
  public onInit() {}
  
  @ComponentActive() 
  public onActive() {}
  
  @ComponentInactive() 
  public onInactive() {}
  
  @Memo() 
  public build() {
    ColumnImpl(@Memo() ((instance: ColumnAttribute): void => {
      instance.setColumnOptions(undefined);
      instance.applyAttributesFinish();
      return;
    }), @Memo() (() => {
      TextImpl(@Memo() ((instance: TextAttribute): void => {
        instance.setTextOptions("lifecycle", undefined);
        instance.applyAttributesFinish();
        return;
      }), undefined);
    }));
  }
  
  protected constructor(useSharedStorage?: boolean, storage?: LocalStorage) {
    super(useSharedStorage, storage);
  }
  
  static {
    
  }
}

class __EntryWrapper extends EntryPoint {
  @Memo() 
  public entry(): void {
    LifecycleSample._invoke(undefined, undefined, undefined, undefined, undefined);
  }
  
  public static RegisterNamedRouter(routerName: string, instance: EntryPoint, param: NavInterface): void {
    EntryPoint.RegisterNamedRouter(routerName, instance, param);
  }
  
  public constructor() {}
  
}

@Entry() @Component() class __Options_LifecycleSample {
  public constructor() {}
  
}

`;
function testCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedCheckedScript));
}

pluginTester.run(
    'test @ComponentInit/@ComponentActive/@ComponentInactive transformation',
    [parsedTransform, collectNoRecheck, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
