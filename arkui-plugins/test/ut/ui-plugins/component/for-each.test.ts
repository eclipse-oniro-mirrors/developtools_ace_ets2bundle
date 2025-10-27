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
import { dumpGetterSetter, GetSetDumper } from '../../../utils/simplify-dump';
import { uiTransform } from '../../../../ui-plugins';
import { Plugins } from '../../../../common/plugin-context';

const COMPONENT_DIR_PATH: string = 'component';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, COMPONENT_DIR_PATH, 'for-each.ets'),
];

const pluginTester = new PluginTester('test ForEach component transformation', buildConfig);

const parsedTransform: Plugins = {
    name: 'for-each',
    parsed: uiTransform().parsed
};

const expectedScript: string = `
import { ColumnAttribute as ColumnAttribute } from "arkui.component.column";

import { ForEachAttribute as ForEachAttribute } from "arkui.component.forEach";

import { Memo as Memo } from "arkui.incremental.annotation";

import { TextAttribute as TextAttribute } from "arkui.component.text";

import { TextImpl as TextImpl } from "arkui.component.text";

import { ForEachImpl as ForEachImpl } from "arkui.component.forEach";

import { ColumnImpl as ColumnImpl } from "arkui.component.column";

import { CustomComponent as CustomComponent } from "arkui.component.customComponent";

import { Component as Component, Text as Text, WrappedBuilder as WrappedBuilder, Column as Column, ForEach as ForEach } from "@kit.ArkUI";

function main() {}

interface Person {
  get name(): string
  set name(name: string)
  get age(): number
  set age(age: number)
}

class AB {
  public per: string = "hello";
  public bar: Array<string> = new Array<string>("xx", "yy", "zz");
  public constructor() {}
}

@Component() final struct ImportStruct extends CustomComponent<ImportStruct, __Options_ImportStruct> {
  public __initializeStruct(initializers: (__Options_ImportStruct | undefined), @Memo() content: ((()=> void) | undefined)): void {
    this.__backing_arr = ((({let gensym___244068973 = initializers;
    (((gensym___244068973) == (null)) ? undefined : gensym___244068973.arr)})) ?? (["a", "b", "c"]));
  }
  
  public __updateStruct(initializers: (__Options_ImportStruct | undefined)): void {}
  
  private __backing_arr?: Array<string>;
  public get arr(): Array<string> {
    return (this.__backing_arr as Array<string>);
  }
  
  public set arr(value: Array<string>) {
    this.__backing_arr = value;
  }
  
  public getArray() {
    return new Array<Person>(({
      name: "LiHua",
      age: 25,
    } as Person), ({
      name: "Amy",
      age: 18,
    } as Person));
  }
  
  @Memo() public build() {
    ColumnImpl(@Memo() ((instance: ColumnAttribute): void => {
      instance.setColumnOptions(undefined).applyAttributesFinish();
      return;
    }), @Memo() (() => {
      ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions((() => {
          return this.arr;
        }), @Memo() ((item: string) => {
          TextImpl(@Memo() ((instance: TextAttribute): void => {
            instance.setTextOptions(item, undefined).applyAttributesFinish();
            return;
          }), undefined);
        }), undefined);
        return;
      }));
      ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions((() => {
          return this.getArray();
        }), @Memo() ((item: Person) => {
          TextImpl(@Memo() ((instance: TextAttribute): void => {
            instance.setTextOptions(item.name, undefined).applyAttributesFinish();
            return;
          }), undefined);
        }), undefined);
        return;
      }));
      ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions((() => {
          return new AB().bar;
        }), @Memo() ((item: string) => {
          TextImpl(@Memo() ((instance: TextAttribute): void => {
            instance.setTextOptions(item, undefined).applyAttributesFinish();
            return;
          }), undefined);
        }), undefined);
        return;
      }));
      ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions((() => {
          return new AB().bar;
        }), @Memo() (() => {}), undefined);
        return;
      }));
      ForEachImpl<Person>(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions<Person>((() => {
          return this.getArray();
        }), @Memo() (() => {}), undefined);
        return;
      }));
      ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
        instance.setForEachOptions((() => {
          return new Array<string>("1", "2");
        }), @Memo() (() => {
          ForEachImpl(@Memo() ((instance: ForEachAttribute): void => {
            instance.setForEachOptions((() => {
              return new Array<string>("1", "2");
            }), @Memo() ((item: string) => {
              TextImpl(@Memo() ((instance: TextAttribute): void => {
                instance.setTextOptions(item, undefined).applyAttributesFinish();
                return;
              }), undefined);
            }), undefined);
            return;
          }));
        }), undefined);
        return;
      }));
    }));
  }
  
  public constructor() {}
  
}

@Component() export interface __Options_ImportStruct {
  ${dumpGetterSetter(GetSetDumper.BOTH, 'arr', '(Array<string> | undefined)')}
  ${dumpGetterSetter(GetSetDumper.BOTH, '__options_has_arr', '(boolean | undefined)')}
  
}
`;

const expectedForEachHeaderScript: string = `
setForEachOptions<T>(arr: (()=> Array<T>), itemGenerator: ItemGeneratorFunc<T>, keyGenerator?: KeyGeneratorFunc<T>): this
`

function testParsedAndCheckedTransformer(this: PluginTestContext): void {
    expect(parseDumpSrc(this.scriptSnapshot ?? '')).toBe(parseDumpSrc(expectedScript));
    const forEachScript = this.declContexts?.['arkui.component.forEach']?.scriptSnapshot ?? '';
    expect(parseDumpSrc(forEachScript)).toContain(parseDumpSrc(expectedForEachHeaderScript));

}

pluginTester.run(
    'test ForEach component transformation',
    [parsedTransform, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testParsedAndCheckedTransformer],
    },
    {
        stopAfter: 'checked',
        tracing: { externalSourceNames: ['arkui.component.forEach'] }
    }
);
