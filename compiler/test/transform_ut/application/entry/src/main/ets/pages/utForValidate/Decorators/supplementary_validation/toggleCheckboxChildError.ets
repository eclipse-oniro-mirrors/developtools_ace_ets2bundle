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
 * Test case: Toggle Checkbox/Switch type with child component
 * Purpose: Verify Toggle component with Checkbox or Switch type
 *          cannot have any child
 * Error code: 10905223
 *
 * Background:
 * - Toggle has three types: Checkbox, Switch, Button
 * - Checkbox and Switch are atomic components which render themselves,
 *   so any child component is forbidden
 * - With children present, validate_ui_syntax.ts reports 10905223 via
 *   checkNoChildComponent with judgeToggleComponentParamType
 */

// ============================================
// Test Case 1: Toggle Checkbox type with child
// Expected Error: 10905223
// ============================================

@Component
struct ToggleCheckboxWithChild {
  build() {
    Column() {
      // Error: Checkbox type Toggle with child - 10905223
      Toggle({ type: ToggleType.Checkbox, isOn: false }) {
        Text('Illegal Child')
          .fontSize(16)
      }
      .margin(10)
    }
  }
}

// ============================================
// Test Case 2: Toggle Switch type with child
// Expected Error: 10905223
// ============================================

@Component
struct ToggleSwitchWithChild {
  build() {
    Column() {
      // Error: Switch type Toggle with child - 10905223
      Toggle({ type: ToggleType.Switch, isOn: true }) {
        Column() {
          Text('Illegal Switch Child')
            .fontSize(14)
        }
      }
      .margin(10)
    }
  }
}

// ============================================
// Test Case 3: Correct Toggle Checkbox without child
// ============================================

@Component
struct ToggleCheckboxNoChild {
  build() {
    Column() {
      // Correct: Checkbox type Toggle without any child
      Toggle({ type: ToggleType.Checkbox, isOn: false })
        .margin(10)
    }
  }
}

// ============================================
// Test Case 4: Correct Toggle Switch without child
// ============================================

@Component
struct ToggleSwitchNoChild {
  build() {
    Column() {
      // Correct: Switch type Toggle without any child
      Toggle({ type: ToggleType.Switch, isOn: true })
        .margin(10)
    }
  }
}

// ============================================
// Entry point
// ============================================

@Entry
@Component
struct TestToggleCheckboxChildError {
  @State testTitle: string = 'Toggle Checkbox Child Error Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905223')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('Toggle Checkbox/Switch type cannot have any child')
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

        Text('Toggle({ type: ToggleType.Checkbox, isOn: false })')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: validate_ui_syntax.ts checkNoChildComponent')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('Button type allows a single child (10905221)')
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
