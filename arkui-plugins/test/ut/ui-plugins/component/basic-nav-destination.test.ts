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
import { PluginTester } from '../../../utils/plugin-tester';
import { mockBuildConfig } from '../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../utils/path-config';
import { parseDumpSrc } from '../../../utils/parse-string';
import { recheck, uiNoRecheck } from '../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../utils/shared-types';
import { uiTransform } from '../../../../ui-plugins';
import { Plugins } from '../../../../common/plugin-context';

const COMPONENT_DIR_PATH: string = 'component';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, COMPONENT_DIR_PATH, 'basic-nav-destination.ets'),
];

const pluginTester = new PluginTester('test basic navDestination transformation', buildConfig);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

const expectedCheckedScript: string = `
import { NavDestinationAttribute as NavDestinationAttribute } from "arkui.component.navDestination";

import { ColumnAttribute as ColumnAttribute } from "arkui.component.column";

import { memo as memo } from "arkui.stateManagement.runtime";

import { ButtonAttribute as ButtonAttribute } from "arkui.component.button";

import { ButtonImpl as ButtonImpl } from "arkui.component.button";

import { ColumnImpl as ColumnImpl } from "arkui.component.column";

import { NavDestinationImpl as NavDestinationImpl } from "arkui.component.navDestination";

import { CustomComponent as CustomComponent } from "arkui.component.customComponent";

import { Component as Component, Column as Column, Button as Button, NavDestination as NavDestination } from "@ohos.arkui.component";

function main() {}

@Component() final struct NavDestinationStruct extends CustomComponent<NavDestinationStruct, __Options_NavDestinationStruct> {
  public __initializeStruct(initializers: (__Options_NavDestinationStruct | undefined), @memo() content: ((()=> void) | undefined)): void {}
  
  public __updateStruct(initializers: (__Options_NavDestinationStruct | undefined)): void {}
  
  @memo() public build() {
    NavDestinationImpl(@memo() ((instance: NavDestinationAttribute): void => {
      instance.setNavDestinationOptions({
        moduleName: "entry",
        pagePath: "mock/component/basic-nav-destination",
      }).width(80).applyAttributesFinish();
      return;
    }), @memo() (() => {
      ColumnImpl(@memo() ((instance: ColumnAttribute): void => {
        instance.setColumnOptions(undefined).applyAttributesFinish();
        return;
      }), @memo() (() => {
        ButtonImpl(@memo() ((instance: ButtonAttribute): void => {
          instance.setButtonOptions("abc", undefined).applyAttributesFinish();
          return;
        }), undefined);
      }));
    }));
  }
  
  public constructor() {}
  
}

@Component() export interface __Options_NavDestinationStruct {
  
}
`;

function testCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedCheckedScript));
}

pluginTester.run(
    'test basic navDestination transformation',
    [parsedTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);