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

const FUNCTION_DIR_PATH: string = 'decorators/builder';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, FUNCTION_DIR_PATH, 'global-builder.ets')];

const pluginTester = new PluginTester('test global builder', buildConfig);

const parsedTransform: Plugins = {
    name: 'global-builder',
    parsed: uiTransform().parsed,
};

const expectedScript: string = `
import { MemoIntrinsic as MemoIntrinsic } from "arkui.incremental.annotation";

import { makeBuilderParameterProxy as makeBuilderParameterProxy } from "arkui.component.builder";

import { MemoSkip as MemoSkip } from "arkui.incremental.annotation";

import { RowAttribute as RowAttribute } from "arkui.component.row";

import { RowImpl as RowImpl } from "arkui.component.row";

import { memo as memo } from "arkui.stateManagement.runtime";

import { TextAttribute as TextAttribute } from "arkui.component.text";

import { TextImpl as TextImpl } from "arkui.component.text";

import { CustomComponent as CustomComponent } from "arkui.component.customComponent";

import { Builder as Builder } from "arkui.component.builder";

import { LocalStorage as LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { ComponentBuilder as ComponentBuilder } from "arkui.stateManagement.runtime";

import { Component as Component, Row as Row, Builder as Builder, Text as Text } from "@ohos.arkui.component";

function main() {}


@memo() function showTextBuilder() {
  TextImpl(@memo() ((instance: TextAttribute): void => {
    instance.setTextOptions("Hello World", undefined).applyAttributesFinish();
    return;
  }), undefined);
}

@memo() function overBuilder(@MemoSkip() params: Tmp) {
  RowImpl(@memo() ((instance: RowAttribute): void => {
    instance.setRowOptions(undefined).applyAttributesFinish();
    return;
  }), @memo() (() => {
    TextImpl(@memo() ((instance: TextAttribute): void => {
      instance.setTextOptions((("UseStateVarByReference: ") + (params.paramA1)), undefined).applyAttributesFinish();
      return;
    }), undefined);
  }));
}


class Tmp {
  public paramA1: string = "";

  public constructor() {}

}

@Component() final struct BuilderDemo extends CustomComponent<BuilderDemo, __Options_BuilderDemo> {
  public __initializeStruct(initializers: (__Options_BuilderDemo | undefined), @memo() content: ((()=> void) | undefined)): void {}
  
  public __updateStruct(initializers: (__Options_BuilderDemo | undefined)): void {}
  
  @MemoIntrinsic() public static _invoke(style: @memo() ((instance: BuilderDemo)=> void), initializers: ((()=> __Options_BuilderDemo) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @memo() content: ((()=> void) | undefined)): void {
    CustomComponent._invokeImpl<BuilderDemo, __Options_BuilderDemo>(style, ((): BuilderDemo => {
      return new BuilderDemo(false, ({let gensym___149025070 = storage;
      (((gensym___149025070) == (null)) ? undefined : gensym___149025070())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() public static $_invoke(initializers?: __Options_BuilderDemo, storage?: LocalStorage, @Builder() @memo() content?: (()=> void)): BuilderDemo {
    throw new Error("Declare interface");
  }
  
  @memo() public build() {
    RowImpl(@memo() ((instance: RowAttribute): void => {
      instance.setRowOptions(undefined).applyAttributesFinish();
      return;
    }), @memo() (() => {
      showTextBuilder();
      overBuilder(makeBuilderParameterProxy<Tmp>({}, new Map<string, (()=> Any)>([["paramA1", ((): Any => {
        return "Hello";
      })]]), ((gensym___203542966: Tmp) => {
        gensym___203542966.paramA1 = "Hello";
      })));
    }));
  }
  
  constructor(useSharedStorage: (boolean | undefined)) {
    this(useSharedStorage, undefined);
  }
  
  constructor() {
    this(undefined, undefined);
  }
  
  public constructor(useSharedStorage: (boolean | undefined), storage: (LocalStorage | undefined)) {
    super(useSharedStorage, storage);
  }
  
}

@Component() export interface __Options_BuilderDemo {
  
}
`;

function testCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
}

pluginTester.run(
    'global builder',
    [parsedTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
