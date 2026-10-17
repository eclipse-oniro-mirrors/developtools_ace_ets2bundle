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

/**
 * Test case: Global @Styles function with arguments
 * Purpose: Verify global @Styles decorated functions cannot have arguments
 * Error code: 10905110
 *
 * Background:
 * - @Styles can decorate global functions or member methods
 * - The global function path is handled in process_ui_syntax.ts:
 *   when parameters.length > 0, error 10905110 is reported
 * - Note: the member-method path reports a different code (10905105),
 *   which is already covered by stylesWithArgsError.ets
 */

// ============================================
// Test Case 1: Global @Styles function with one argument
// Expected Error: 10905110
// ============================================

@Styles
function globalStyleWithArg(size: number) {
  .backgroundColor(Color.Red)
}

// ============================================
// Test Case 2: Global @Styles function with multiple arguments
// Expected Error: 10905110
// ============================================

@Styles
function globalStyleWithMultiArgs(widthValue: string, heightValue: string) {
  .backgroundColor(Color.Blue)
}

// ============================================
// Test Case 3: Correct global @Styles function without arguments
// ============================================

@Styles
function validGlobalStyle() {
  .backgroundColor(Color.Green)
}

// ============================================
// Entry point
// ============================================

@Entry
@Component
struct TestGlobalStylesArgsError {
  @State testTitle: string = 'Global @Styles Args Error Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905110')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('Global @Styles function cannot have arguments')
          .fontSize(14)
          .margin(5)
      }
      .width('90%')
      .padding(15)
      .backgroundColor('#FFEBEE')
      .margin(10)

      Column() {
        Text('Correct Usage:')
          .fontSize(16)
          .fontWeight(FontWeight.Bold)

        Text('@Styles function validGlobalStyle() { ... }')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: process_ui_syntax.ts')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('Global @Styles function with parameters is rejected')
          .fontSize(12)
          .fontColor(Color.Gray)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E3F2FD')
      .margin(5)
    }
    .width('100%')
    .height('100%')
    .backgroundColor(Color.White)
  }
}
