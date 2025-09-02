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
import { uiNoRecheck, recheck } from '../../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { uiTransform } from '../../../../../ui-plugins';
import { Plugins } from '../../../../../common/plugin-context';

const BUILDER_LAMBDA_DIR_PATH: string = 'decorators/computed';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, BUILDER_LAMBDA_DIR_PATH, 'computed-no-return-type.ets'),
];

const pluginTester = new PluginTester('test @Computed decorator with no return type', buildConfig);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

const expectedScript: string = `
import { memo as memo } from "arkui.stateManagement.runtime";

import { ILocalDecoratedVariable as ILocalDecoratedVariable } from "arkui.stateManagement.decorator";

import { IObservedObject as IObservedObject } from "arkui.stateManagement.decorator";

import { UIUtils as UIUtils } from "arkui.stateManagement.utils";

import { IMutableStateMeta as IMutableStateMeta } from "arkui.stateManagement.decorator";

import { RenderIdType as RenderIdType } from "arkui.stateManagement.decorator";

import { WatchIdType as WatchIdType } from "arkui.stateManagement.decorator";

import { ISubscribedWatches as ISubscribedWatches } from "arkui.stateManagement.decorator";

import { STATE_MGMT_FACTORY as STATE_MGMT_FACTORY } from "arkui.stateManagement.decorator";

import { CustomComponentV2 as CustomComponentV2 } from "arkui.component.customComponent";

import { Computed as Computed, ObservedV2 as ObservedV2, Trace as Trace } from "@ohos.arkui.stateManagement";

import { ComponentV2 as ComponentV2, Column as Column, Button as Button, Divider as Divider, Text as Text } from "@ohos.arkui.component";

import { Computed as Computed, Local as Local } from "@ohos.arkui.stateManagement";

function main() {}


@ObservedV2() class Name implements IObservedObject, ISubscribedWatches {
  @JSONStringifyIgnore() private subscribedWatches: ISubscribedWatches = STATE_MGMT_FACTORY.makeSubscribedWatches();
  
  public addWatchSubscriber(watchId: WatchIdType): void {
    this.subscribedWatches.addWatchSubscriber(watchId);
  }
  
  public removeWatchSubscriber(watchId: WatchIdType): boolean {
    return this.subscribedWatches.removeWatchSubscriber(watchId);
  }
  
  public executeOnSubscribingWatches(propertyName: string): void {
    this.subscribedWatches.executeOnSubscribingWatches(propertyName);
  }
  
  public setV1RenderId(renderId: RenderIdType): void {}
  
  protected conditionalAddRef(meta: IMutableStateMeta): void {
    meta.addRef();
  }
  
  @JSONRename({newName:"firstName"}) private __backing_firstName: string = "Hua";
  
  @JSONStringifyIgnore() private __meta_firstName: IMutableStateMeta = STATE_MGMT_FACTORY.makeMutableStateMeta();
  
  @JSONRename({newName:"lastName"}) private __backing_lastName: string = "Li";
  
  @JSONStringifyIgnore() private __meta_lastName: IMutableStateMeta = STATE_MGMT_FACTORY.makeMutableStateMeta();
  
  public age: number = 20;
  
  private __computed_fullName = STATE_MGMT_FACTORY.makeComputed<(Array<Double> | string)>((() => {
    if (((this.age) >= (20))) {
      return new Array<number>(0, 1, 2);
    }
    return ((((this.firstName) + (" "))) + (this.lastName));
  }), "fullName");
  
  @Computed() public get fullName(): (Array<Double> | string) {
    return this.__computed_fullName!.get();
  }
  
  public get firstName(): string {
    this.conditionalAddRef(this.__meta_firstName);
    return UIUtils.makeObserved(this.__backing_firstName);
  }
  
  public set firstName(newValue: string) {
    if (((this.__backing_firstName) !== (newValue))) {
      this.__backing_firstName = newValue;
      this.__meta_firstName.fireChange();
      this.executeOnSubscribingWatches("firstName");
    }
  }
  
  public get lastName(): string {
    this.conditionalAddRef(this.__meta_lastName);
    return UIUtils.makeObserved(this.__backing_lastName);
  }
  
  public set lastName(newValue: string) {
    if (((this.__backing_lastName) !== (newValue))) {
      this.__backing_lastName = newValue;
      this.__meta_lastName.fireChange();
      this.executeOnSubscribingWatches("lastName");
    }
  }
  
  public constructor() {}
  
}

@ComponentV2() final struct Index extends CustomComponentV2<Index, __Options_Index> {
  public __initializeStruct(initializers: (__Options_Index | undefined), @memo() content: ((()=> void) | undefined)): void {
    this.__backing_firstName = STATE_MGMT_FACTORY.makeLocal<string>(this, "firstName", "Li");
    this.__backing_lastName = STATE_MGMT_FACTORY.makeLocal<string>(this, "lastName", "Hua");
    this.__backing_age = ((({let gensym___216981064 = initializers;
    (((gensym___216981064) == (null)) ? undefined : gensym___216981064.age)})) ?? (20));
  }
  
  public __updateStruct(initializers: (__Options_Index | undefined)): void {}
  
  private __backing_firstName?: ILocalDecoratedVariable<string>;
  
  public get firstName(): string {
    return this.__backing_firstName!.get();
  }
  
  public set firstName(value: string) {
    this.__backing_firstName!.set(value);
  }
  
  private __backing_lastName?: ILocalDecoratedVariable<string>;
  
  public get lastName(): string {
    return this.__backing_lastName!.get();
  }
  
  public set lastName(value: string) {
    this.__backing_lastName!.set(value);
  }
  
  private __backing_age?: number;
  
  public get age(): number {
    return (this.__backing_age as number);
  }
  
  public set age(value: number) {
    this.__backing_age = value;
  }
  
  private __computed_fullName = STATE_MGMT_FACTORY.makeComputed<(Int | string)>((() => {
    if (((this.age) >= (20))) {
      return 500;
    }
    return ((((((this.firstName) + (" "))) + (this.lastName))) + (this.age));
  }), "fullName");
  
  @Computed() public get fullName(): (Int | string) {
    return this.__computed_fullName!.get();
  }
  
  private __computed_num5 = STATE_MGMT_FACTORY.makeComputed<Int>((() => {
    return 5;
  }), "num5");
  
  @Computed() public get num5(): Int {
    return this.__computed_num5!.get();
  }
  
  @memo() public build() {}
  
  public constructor() {}
  
}

@ComponentV2() export interface __Options_Index {
  set firstName(firstName: (string | undefined))
  
  get firstName(): (string | undefined)
  set __backing_firstName(__backing_firstName: (ILocalDecoratedVariable<string> | undefined))
  
  get __backing_firstName(): (ILocalDecoratedVariable<string> | undefined)
  set __options_has_firstName(__options_has_firstName: (boolean | undefined))
  
  get __options_has_firstName(): (boolean | undefined)
  set lastName(lastName: (string | undefined))
  
  get lastName(): (string | undefined)
  set __backing_lastName(__backing_lastName: (ILocalDecoratedVariable<string> | undefined))
  
  get __backing_lastName(): (ILocalDecoratedVariable<string> | undefined)
  set __options_has_lastName(__options_has_lastName: (boolean | undefined))
  
  get __options_has_lastName(): (boolean | undefined)
  set age(age: (number | undefined))
  
  get age(): (number | undefined)
  set __options_has_age(__options_has_age: (boolean | undefined))
  
  get __options_has_age(): (boolean | undefined)
  
}
`;

function testCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
}

pluginTester.run(
    'test @Computed decorator with no return type',
    [parsedTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
