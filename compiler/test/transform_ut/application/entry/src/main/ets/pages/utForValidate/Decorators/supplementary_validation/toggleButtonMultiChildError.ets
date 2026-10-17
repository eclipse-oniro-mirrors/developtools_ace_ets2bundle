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
 * Test case: Toggle Button type with multiple children
 * Purpose: Verify Toggle component with type Button can only have
 *          a single child component
 * Error code: 10905221
 *
 * Background:
 * - Toggle has three types: Checkbox, Switch, Button
 * - When toggle type is Button, Toggle is allowed to contain one child
 *   component as its content
 * - With more than one child, validate_ui_syntax.ts reports 10905221:
 *   hasNonSingleChild detects the Button case via judgeToggleComponentParamType
 */

// ============================================
// Test Case 1: Toggle Button type with two children
// Expected Error: 10905221
// ============================================

@Component
struct ToggleButtonTwoChildren {
  build() {
    Column() {
      // Error: Button type Toggle with two children - 10905221
      Toggle({ type: ToggleType.Button, isOn: true }) {
        Text('First Child')
          .fontSize(16)
        Text('Second Child')
          .fontSize(16)
      }
      .margin(10)
    }
  }
}

// ============================================
// Test Case 2: Toggle Button type with three children
// Expected Error: 10905221
// ============================================

@Component
struct ToggleButtonThreeChildren {
  build() {
    Column() {
      // Error: Button type Toggle with three children - 10905221
      Toggle({ type: ToggleType.Button, isOn: false }) {
        Text('Child One')
          .fontSize(14)
        Text('Child Two')
          .fontSize(14)
        Text('Child Three')
          .fontSize(14)
      }
      .margin(10)
    }
  }
}

// ============================================
// Test Case 3: Correct Toggle Button type with single child
// ============================================

@Component
struct ToggleButtonSingleChild {
  build() {
    Column() {
      // Correct: Button type Toggle with only one child
      Toggle({ type: ToggleType.Button, isOn: true }) {
        Text('Only Child')
          .fontSize(16)
      }
      .margin(10)
    }
  }
}

// ============================================
// Entry point
// ============================================

@Entry
@Component
struct TestToggleButtonMultiChildError {
  @State testTitle: string = 'Toggle Button Multi Child Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905221')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('Toggle Button type can only have a single child')
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

        Text('Toggle({ type: ToggleType.Button }) { Text(...) }')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: validate_ui_syntax.ts checkOneChildComponent')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('Checkbox/Switch types reject any child (10905223)')
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
