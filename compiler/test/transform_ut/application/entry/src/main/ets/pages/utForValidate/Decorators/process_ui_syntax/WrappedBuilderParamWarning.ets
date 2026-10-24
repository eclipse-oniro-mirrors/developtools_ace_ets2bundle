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
// 测试场景：@Builder 函数作为 API 参数时被表达式包裹的编译告警（issue-4720 第2部分）
// 期望：每个被括号/非空断言/类型断言包裹的 builder 参数各产生一条 WARN；
// 无包裹调用与裸三元（含函数调用分支）不产生告警。
@Entry
@Component
struct WrappedBuilderParamWarning {
  @State isShowSheet: boolean = false;
  isUseA: boolean = true;

  @Builder
  myBuilder() {
    Text('Sheet Content')
  }

  @Builder
  builderA() {
    Text('Builder A')
  }

  @Builder
  builderB() {
    Text('Builder B')
  }

  build() {
    Column() {
      Text('case1')
        .bindSheet($$this.isShowSheet, (this.myBuilder())!, { height: 200 })
      Text('case2')
        .bindSheet($$this.isShowSheet, this.myBuilder()!, { height: 200 })
      Text('case3')
        .bindSheet($$this.isShowSheet, (this.myBuilder()), { height: 200 })
      Text('case4')
        .bindSheet($$this.isShowSheet, this.myBuilder() as Object, { height: 200 })
      Text('case5')
        .bindSheet($$this.isShowSheet, (this.isUseA ? this.builderA() : this.builderB()), { height: 200 })
      Text('case6')
        .bindSheet($$this.isShowSheet, { builder: (this.myBuilder()) }, { height: 200 })
      Text('negative1: bare conditional with calls, no warning')
        .bindSheet($$this.isShowSheet, this.isUseA ? this.builderA() : this.builderB(), { height: 200 })
      Text('negative2: plain builder call, no warning')
        .bindSheet($$this.isShowSheet, this.myBuilder(), { height: 200 })
      Text('negative3: double non-null first arg, no warning')
        .bindSheet(!!this.isShowSheet, this.myBuilder(), { height: 200 })
      Text('negative4: bare conditional without calls, no warning')
        .bindSheet($$this.isShowSheet, this.isUseA ? this.builderA : this.builderB, { height: 200 })
    }
  }
}
