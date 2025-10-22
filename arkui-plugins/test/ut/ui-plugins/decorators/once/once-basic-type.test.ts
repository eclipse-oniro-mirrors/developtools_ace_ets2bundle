/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import { recheck, uiNoRecheck } from '../../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { uiTransform } from '../../../../../ui-plugins';
import { Plugins } from '../../../../../common/plugin-context';

const OBSERVED_DIR_PATH: string = 'decorators/once';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, OBSERVED_DIR_PATH, 'once-basic-type.ets'),
];

const observedTrackTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed,
}

const pluginTester = new PluginTester('test basic type @Once decorated variables transformation', buildConfig);

const expectedScript: string = `
import { MemoIntrinsic as MemoIntrinsic } from "arkui.incremental.annotation";

import { STATE_MGMT_FACTORY as STATE_MGMT_FACTORY } from "arkui.stateManagement.decorator";

import { IParamOnceDecoratedVariable as IParamOnceDecoratedVariable } from "arkui.stateManagement.decorator";

import { memo as memo } from "arkui.stateManagement.runtime";

import { CustomComponentV2 as CustomComponentV2 } from "arkui.component.customComponent";

import { Builder as Builder } from "arkui.component.builder";

import { LocalStorage as LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { ComponentBuilder as ComponentBuilder } from "arkui.stateManagement.runtime";

import { ComponentV2 as ComponentV2 } from "@ohos.arkui.component";

import { Param as Param, Once as Once } from "@ohos.arkui.stateManagement";

function main() {}

@ComponentV2() final struct Parent extends CustomComponentV2<Parent, __Options_Parent> {
  public __initializeStruct(initializers: (__Options_Parent | undefined), @memo() content: ((()=> void) | undefined)): void {
    this.__backing_onceVar1 = STATE_MGMT_FACTORY.makeParamOnce<string>(this, "onceVar1", ((({let gensym___35048285 = initializers;
    (((gensym___35048285) == (null)) ? undefined : gensym___35048285.onceVar1)})) ?? ("stateVar1")));
    this.__backing_onceVar2 = STATE_MGMT_FACTORY.makeParamOnce<number>(this, "onceVar2", ((({let gensym___241100287 = initializers;
    (((gensym___241100287) == (null)) ? undefined : gensym___241100287.onceVar2)})) ?? (50)));
    this.__backing_onceVar3 = STATE_MGMT_FACTORY.makeParamOnce<boolean>(this, "onceVar3", ((({let gensym___114153851 = initializers;
    (((gensym___114153851) == (null)) ? undefined : gensym___114153851.onceVar3)})) ?? (true)));
    this.__backing_onceVar4 = STATE_MGMT_FACTORY.makeParamOnce<undefined>(this, "onceVar4", ((({let gensym___18636164 = initializers;
    (((gensym___18636164) == (null)) ? undefined : gensym___18636164.onceVar4)})) ?? (undefined)));
    this.__backing_onceVar5 = STATE_MGMT_FACTORY.makeParamOnce<null>(this, "onceVar5", ((({let gensym___60128231 = initializers;
    (((gensym___60128231) == (null)) ? undefined : gensym___60128231.onceVar5)})) ?? (null)));
  }

  public __updateStruct(initializers: (__Options_Parent | undefined)): void {}

  private __backing_onceVar1?: IParamOnceDecoratedVariable<string>;

  public get onceVar1(): string {
    return this.__backing_onceVar1!.get();
  }

  public set onceVar1(value: string) {
    this.__backing_onceVar1!.set(value);
  }

  private __backing_onceVar2?: IParamOnceDecoratedVariable<number>;

  public get onceVar2(): number {
    return this.__backing_onceVar2!.get();
  }

  public set onceVar2(value: number) {
    this.__backing_onceVar2!.set(value);
  }

  private __backing_onceVar3?: IParamOnceDecoratedVariable<boolean>;

  public get onceVar3(): boolean {
    return this.__backing_onceVar3!.get();
  }

  public set onceVar3(value: boolean) {
    this.__backing_onceVar3!.set(value);
  }

  private __backing_onceVar4?: IParamOnceDecoratedVariable<undefined>;

  public get onceVar4(): undefined {
    return this.__backing_onceVar4!.get();
  }

  public set onceVar4(value: undefined) {
    this.__backing_onceVar4!.set(value);
  }

  private __backing_onceVar5?: IParamOnceDecoratedVariable<null>;

  public get onceVar5(): null {
    return this.__backing_onceVar5!.get();
  }

  public set onceVar5(value: null) {
    this.__backing_onceVar5!.set(value);
  }

  @MemoIntrinsic() public static _invoke(style: @memo() ((instance: Parent)=> void), initializers: ((()=> __Options_Parent) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @memo() content: ((()=> void) | undefined)): void {
    CustomComponentV2._invokeImpl<Parent, __Options_Parent>(style, ((): Parent => {
      return new Parent();
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() public static $_invoke(initializers?: __Options_Parent, storage?: LocalStorage, @Builder() @memo() content?: (()=> void)): Parent {
    throw new Error("Declare interface");
  }

  @memo() public build() {}

  public constructor() {}
}

@ComponentV2() export interface __Options_Parent {
  set onceVar1(onceVar1: (string | undefined))

  get onceVar1(): (string | undefined)
  @Param() set __backing_onceVar1(__backing_onceVar1: (IParamOnceDecoratedVariable<string> | undefined))

  @Param() get __backing_onceVar1(): (IParamOnceDecoratedVariable<string> | undefined)
  set __options_has_onceVar1(__options_has_onceVar1: (boolean | undefined))
  
  get __options_has_onceVar1(): (boolean | undefined)
  set onceVar2(onceVar2: (number | undefined))

  get onceVar2(): (number | undefined)
  @Param() set __backing_onceVar2(__backing_onceVar2: (IParamOnceDecoratedVariable<number> | undefined))

  @Param() get __backing_onceVar2(): (IParamOnceDecoratedVariable<number> | undefined)
  set __options_has_onceVar2(__options_has_onceVar2: (boolean | undefined))
  
  get __options_has_onceVar2(): (boolean | undefined)
  set onceVar3(onceVar3: (boolean | undefined))

  get onceVar3(): (boolean | undefined)
  @Param() set __backing_onceVar3(__backing_onceVar3: (IParamOnceDecoratedVariable<boolean> | undefined))

  @Param() get __backing_onceVar3(): (IParamOnceDecoratedVariable<boolean> | undefined)
  set __options_has_onceVar3(__options_has_onceVar3: (boolean | undefined))
  
  get __options_has_onceVar3(): (boolean | undefined)
  set onceVar4(onceVar4: (undefined | undefined))

  get onceVar4(): (undefined | undefined)
  @Param() set __backing_onceVar4(__backing_onceVar4: (IParamOnceDecoratedVariable<undefined> | undefined))

  @Param() get __backing_onceVar4(): (IParamOnceDecoratedVariable<undefined> | undefined)
  set __options_has_onceVar4(__options_has_onceVar4: (boolean | undefined))
  
  get __options_has_onceVar4(): (boolean | undefined)
  set onceVar5(onceVar5: (null | undefined))

  get onceVar5(): (null | undefined)
  @Param() set __backing_onceVar5(__backing_onceVar5: (IParamOnceDecoratedVariable<null> | undefined))

  @Param() get __backing_onceVar5(): (IParamOnceDecoratedVariable<null> | undefined)
  set __options_has_onceVar5(__options_has_onceVar5: (boolean | undefined))
  
  get __options_has_onceVar5(): (boolean | undefined)
  
}
`;

function testParsedAndCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
}

pluginTester.run(
    'test basic type @Once decorated variables transformation',
    [observedTrackTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testParsedAndCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
