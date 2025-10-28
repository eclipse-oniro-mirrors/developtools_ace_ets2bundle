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
import { dumpGetterSetter, GetSetDumper, dumpConstructor } from '../../../../utils/simplify-dump';
import { uiTransform } from '../../../../../ui-plugins';
import { Plugins } from '../../../../../common/plugin-context';

const LOCAL_STORAGELINK_DIR_PATH: string = 'decorators/localstoragelink';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, LOCAL_STORAGELINK_DIR_PATH, 'localstoragelink-complex-type.ets'),
];

const localStorageLinkTransform: Plugins = {
    name: 'localStorageLink',
    parsed: uiTransform().parsed,
}

const pluginTester = new PluginTester('test LocalStorageLink complex type transform', buildConfig);

const expectedScript: string = `
import { MemoIntrinsic as MemoIntrinsic } from "arkui.incremental.annotation";

import { STATE_MGMT_FACTORY as STATE_MGMT_FACTORY } from "arkui.stateManagement.decorator";

import { ILocalStorageLinkDecoratedVariable as ILocalStorageLinkDecoratedVariable } from "arkui.stateManagement.decorator";

import { memo as memo } from "arkui.stateManagement.runtime";

import { NavInterface as NavInterface } from "arkui.component.customComponent";

import { PageLifeCycle as PageLifeCycle } from "arkui.component.customComponent";

import { EntryPoint as EntryPoint } from "arkui.component.customComponent";

import { CustomComponent as CustomComponent } from "arkui.component.customComponent";

import { Builder as Builder } from "arkui.component.builder";

import { LocalStorage as LocalStorage } from "arkui.stateManagement.storage.localStorage";

import { ComponentBuilder as ComponentBuilder } from "arkui.stateManagement.runtime";

import { Component as Component, Entry as Entry } from "@ohos.arkui.component";

import { LocalStorageLink as LocalStorageLink } from "@ohos.arkui.stateManagement";

function main() {}

__EntryWrapper.RegisterNamedRouter("", new __EntryWrapper(), ({
  bundleName: "com.example.mock",
  moduleName: "entry",
  pagePath: "../../../decorators/localstoragelink/localstoragelink-complex-type",
  pageFullPath: "test/demo/mock/decorators/localstoragelink/localstoragelink-complex-type",
  integratedHsp: "false",
} as NavInterface));

class Person {
  public name: string = "";

  public constructor(name: string) {}

}

final class Status extends BaseEnum<int> {
  private readonly #ordinal: int;

  private static <cctor>() {}

  public constructor(ordinal: int, value: int) {
    super(value);
    this.#ordinal = ordinal;
  }

  public static readonly Success: Status = new Status(0, 200);

  public static readonly NotFound: Status = new Status(1, 404);

  public static readonly ServerError: Status = new Status(2, 500);

  private static readonly #NamesArray: String[] = ["Success", "NotFound", "ServerError"];

  private static readonly #ValuesArray: int[] = [200, 404, 500];

  private static readonly #StringValuesArray: String[] = ["200", "404", "500"];

  private static readonly #ItemsArray: Status[] = [Status.Success, Status.NotFound, Status.ServerError];

  public getName(): String {
    return Status.#NamesArray[this.#ordinal];
  }

  public static getValueOf(name: String): Status {
    for (let i = 0;((i) < (Status.#NamesArray.length));(++i)) {
      if (((name) == (Status.#NamesArray[i]))) {
        return Status.#ItemsArray[i];
      }
    }
    throw new Error((("No enum constant Status.") + (name)));
  }

  public static fromValue(value: int): Status {
    for (let i = 0;((i) < (Status.#ValuesArray.length));(++i)) {
      if (((value) == (Status.#ValuesArray[i]))) {
        return Status.#ItemsArray[i];
      }
    }
    throw new Error((("No enum Status with value ") + (value)));
  }

  public valueOf(): int {
    return Status.#ValuesArray[this.#ordinal];
  }

  public toString(): String {
    return Status.#StringValuesArray[this.#ordinal];
  }

  public static values(): Status[] {
    return Status.#ItemsArray;
  }

  public getOrdinal(): int {
    return this.#ordinal;
  }

  public static $_get(e: Status): String {
    return e.getName();
  }

}

@Entry({useSharedStorage:false,storage:"",routeName:""}) @Component() final struct MyStateSample extends CustomComponent<MyStateSample, __Options_MyStateSample> implements PageLifeCycle {
  public __initializeStruct(initializers: (__Options_MyStateSample | undefined), @memo() content: ((()=> void) | undefined)): void {
    this.__backing_arrayA = STATE_MGMT_FACTORY.makeLocalStorageLink<Array<number>>(this, "Prop1", "arrayA", [1, 2, 3])
    this.__backing_objectA = STATE_MGMT_FACTORY.makeLocalStorageLink<Object>(this, "Prop2", "objectA", {})
    this.__backing_dateA = STATE_MGMT_FACTORY.makeLocalStorageLink<Date>(this, "Prop3", "dateA", new Date("2021-08-08"))
    this.__backing_setA = STATE_MGMT_FACTORY.makeLocalStorageLink<Set<number>>(this, "Prop4", "setA", new Set<number>())
    this.__backing_mapA = STATE_MGMT_FACTORY.makeLocalStorageLink<Map<number, string>>(this, "Prop5", "mapA", new Map<number, string>())
    this.__backing_unionA = STATE_MGMT_FACTORY.makeLocalStorageLink<(string | undefined)>(this, "Prop6", "unionA", "")
    this.__backing_classA = STATE_MGMT_FACTORY.makeLocalStorageLink<Person>(this, "Prop7", "classA", new Person("John"))
    this.__backing_enumA = STATE_MGMT_FACTORY.makeLocalStorageLink<Status>(this, "Prop8", "enumA", Status.NotFound)
  }

  public __updateStruct(initializers: (__Options_MyStateSample | undefined)): void {}

  private __backing_arrayA?: ILocalStorageLinkDecoratedVariable<Array<number>>;

  public get arrayA(): Array<number> {
    return this.__backing_arrayA!.get();
  }

  public set arrayA(value: Array<number>) {
    this.__backing_arrayA!.set(value);
  }

  private __backing_objectA?: ILocalStorageLinkDecoratedVariable<Object>;

  public get objectA(): Object {
    return this.__backing_objectA!.get();
  }

  public set objectA(value: Object) {
    this.__backing_objectA!.set(value);
  }

  private __backing_dateA?: ILocalStorageLinkDecoratedVariable<Date>;

  public get dateA(): Date {
    return this.__backing_dateA!.get();
  }

  public set dateA(value: Date) {
    this.__backing_dateA!.set(value);
  }

  private __backing_setA?: ILocalStorageLinkDecoratedVariable<Set<number>>;

  public get setA(): Set<number> {
    return this.__backing_setA!.get();
  }

  public set setA(value: Set<number>) {
    this.__backing_setA!.set(value);
  }

  private __backing_mapA?: ILocalStorageLinkDecoratedVariable<Map<number, string>>;

  public get mapA(): Map<number, string> {
    return this.__backing_mapA!.get();
  }

  public set mapA(value: Map<number, string>) {
    this.__backing_mapA!.set(value);
  }
  
  private __backing_unionA?: ILocalStorageLinkDecoratedVariable<(string | undefined)>;
  
  public get unionA(): (string | undefined) {
    return this.__backing_unionA!.get();
  }
  
  public set unionA(value: (string | undefined)) {
    this.__backing_unionA!.set(value);
  }
  
  private __backing_classA?: ILocalStorageLinkDecoratedVariable<Person>;

  public get classA(): Person {
    return this.__backing_classA!.get();
  }

  public set classA(value: Person) {
    this.__backing_classA!.set(value);
  }

  private __backing_enumA?: ILocalStorageLinkDecoratedVariable<Status>;

  public get enumA(): Status {
    return this.__backing_enumA!.get();
  }

  public set enumA(value: Status) {
    this.__backing_enumA!.set(value);
  }

  @MemoIntrinsic() public static _invoke(style: @memo() ((instance: MyStateSample)=> void), initializers: ((()=> __Options_MyStateSample) | undefined), storage: ((()=> LocalStorage) | undefined), reuseId: (string | undefined), @memo() content: ((()=> void) | undefined)): void {
    CustomComponent._invokeImpl<MyStateSample, __Options_MyStateSample>(style, ((): MyStateSample => {
      return new MyStateSample(false, ({let gensym___203542966 = storage;
      (((gensym___203542966) == (null)) ? undefined : gensym___203542966())}));
    }), initializers, reuseId, content);
  }
  
  @ComponentBuilder() public static $_invoke(initializers?: __Options_MyStateSample, storage?: LocalStorage, @Builder() @memo() content?: (()=> void)): MyStateSample {
    throw new Error("Declare interface");
  }

  @memo() public build() {}

  ${dumpConstructor()}
}

class __EntryWrapper extends EntryPoint {
  @memo() public entry(): void {
    MyStateSample._instantiateImpl(undefined, (() => {
      return new MyStateSample();
    }), undefined, undefined, undefined);
  }
  
  public constructor() {}
  
}

@Entry({useSharedStorage:false,storage:"",routeName:""}) @Component() export interface __Options_MyStateSample {
  ${dumpGetterSetter(GetSetDumper.BOTH, 'arrayA', '(Array<number> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_arrayA', '(ILocalStorageLinkDecoratedVariable<Array<number>> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_arrayA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'objectA', '(Object | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_objectA', '(ILocalStorageLinkDecoratedVariable<Object> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_objectA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'dateA', '(Date | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_dateA', '(ILocalStorageLinkDecoratedVariable<Date> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_dateA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'setA', '(Set<number> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_setA', '(ILocalStorageLinkDecoratedVariable<Set<number>> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_setA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'mapA', '(Map<number, string> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_mapA', '(ILocalStorageLinkDecoratedVariable<Map<number, string>> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_mapA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'unionA', '((string | undefined) | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_unionA', '(ILocalStorageLinkDecoratedVariable<(string | undefined)> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_unionA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'classA', '(Person | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_classA', '(ILocalStorageLinkDecoratedVariable<Person> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_classA', '(boolean | undefined)')}

  ${dumpGetterSetter(GetSetDumper.BOTH, 'enumA', '(Status | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__backing_enumA', '(ILocalStorageLinkDecoratedVariable<Status> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_enumA', '(boolean | undefined)')}
  
}
`;

function testLocalStorageLinkTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
}

pluginTester.run(
    'test LocalStorageLink complex type transform',
    [localStorageLinkTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testLocalStorageLinkTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
