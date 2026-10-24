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
// 测试模块：为 wrapBuilder 参数来源扩展的负向（无告警）校验用例提供具名导出的 @Builder 函数
@Builder
export function namespaceBuilder(value: string): void {
  Text(value)
    .fontSize(20)
}

@Builder
export function dynamicBuilder(value: string): void {
  Text(value)
    .fontColor(Color.Blue)
}

@Builder
export function mutableSourceBuilder(value: string): void {
  Text(value)
    .fontWeight(FontWeight.Bold)
}

// 非 @Builder 导出函数：经 namespace 引用传入 wrapBuilder 时须保持 ERROR 10905109
export function commonFunction(): void {
  let a: string = 'aaa';
  if (true) {
    a = 'bbb';
  }
}
