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
// 期望无告警的形态：同文件 @Builder 标识符、namespace 导入、动态导入（内联与
// 标识符绑定）的 wrapBuilder/mutableBuilder 参数；
// 期望保持 ERROR 10905109 的形态：namespace 内非 @Builder 导出
// （wrapBuilder(wrapBuilderModule.commonFunction)）。
import * as wrapBuilderModule from './WrapBuilderSourceModule';

@Builder
function localBuilder(value: string): void {
  Text(value)
    .fontSize(16)
}

let localWrapped: WrappedBuilder<[string]> = wrapBuilder(localBuilder);
let namespaceWrapped: WrappedBuilder<[string]> = wrapBuilder(wrapBuilderModule.namespaceBuilder);
let mutableWrapped: MutableBuilder<[string]> = mutableBuilder(wrapBuilderModule.mutableSourceBuilder);

async function loadDynamicWrapped(): Promise<WrappedBuilder<[string]>> {
  return wrapBuilder((await import('./WrapBuilderSourceModule')).dynamicBuilder);
}

async function loadIdentifierBoundWrapped(): Promise<WrappedBuilder<[string]>> {
  const sourceModule = await import('./WrapBuilderSourceModule');
  return wrapBuilder(sourceModule.namespaceBuilder);
}

async function loadDynamicMutable(): Promise<MutableBuilder<[string]>> {
  return mutableBuilder((await import('./WrapBuilderSourceModule')).mutableSourceBuilder);
}

async function loadIdentifierBoundMutable(): Promise<MutableBuilder<[string]>> {
  const sourceModule2 = await import('./WrapBuilderSourceModule');
  return mutableBuilder(sourceModule2.mutableSourceBuilder);
}

// namespace 内非 @Builder 导出保持 ERROR 10905109（符号解析慢路径的拒绝分支）
let invalidWrapped: WrappedBuilder<[]> = wrapBuilder(wrapBuilderModule.commonFunction);

@Entry
@Component
struct WrapBuilderModuleParam {
  @State message: string = 'Hello World';

  aboutToAppear(): void {
    loadDynamicWrapped();
    loadIdentifierBoundWrapped();
    loadDynamicMutable();
    loadIdentifierBoundMutable();
  }

  build() {
    Column() {
      localWrapped.builder(this.message)
      namespaceWrapped.builder(this.message)
      mutableWrapped.builder(this.message)
    }
  }
}
