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
// 测试场景：wrapBuilder/mutableBuilder 参数来源扩展（issue-4720 第1部分）
// 场景1：namespace 导入的 @Builder 函数（具名导出）—— 编译通过、无告警
// 场景2：动态导入（await import）内联形式的 @Builder 函数 —— 编译通过、无告警
// 场景3：动态导入（const m = await import(...)）标识符绑定形式 —— 编译通过、无告警
// 场景4：mutableBuilder 的 namespace 来源 —— 编译通过、无告警
import * as builderModule from './wrapBuilderModule';

let namespaceWrapped: WrappedBuilder<[string]> = wrapBuilder(builderModule.namespaceBuilder);

let mutableWrapped: MutableBuilder<[string]> = mutableBuilder(builderModule.mutableSourceBuilder);

async function loadDynamicWrapped(): Promise<WrappedBuilder<[string]>> {
  return wrapBuilder((await import('./wrapBuilderModule')).dynamicBuilder);
}

async function loadIdentifierBoundWrapped(): Promise<WrappedBuilder<[string]>> {
  const builderModule2 = await import('./wrapBuilderModule');
  return wrapBuilder(builderModule2.namespaceBuilder);
}

async function loadDynamicMutable(): Promise<MutableBuilder<[string]>> {
  return mutableBuilder((await import('./wrapBuilderModule')).mutableSourceBuilder);
}

async function loadIdentifierBoundMutable(): Promise<MutableBuilder<[string]>> {
  const builderModule3 = await import('./wrapBuilderModule');
  return mutableBuilder(builderModule3.mutableSourceBuilder);
}

@Entry
@Component
struct WrapBuilderParamTest {
  @State message: string = 'Hello World';
  @State dynamicWrapped: WrappedBuilder<[string]> | undefined = undefined;

  aboutToAppear(): void {
    loadDynamicWrapped().then((wrapped: WrappedBuilder<[string]>) => {
      this.dynamicWrapped = wrapped;
    });
    loadIdentifierBoundWrapped();
    loadDynamicMutable();
    loadIdentifierBoundMutable();
  }

  build() {
    Row() {
      Column() {
        Text('namespace builder:')
          .fontSize(20)
        namespaceWrapped.builder(this.message)
        Divider()
        Text('mutable builder:')
          .fontSize(20)
        mutableWrapped.builder(this.message)
        if (this.dynamicWrapped) {
          Text('dynamic builder:')
            .fontSize(20)
          this.dynamicWrapped.builder(this.message)
        }
      }
      .width('100%')
    }
    .height('100%')
  }
}
