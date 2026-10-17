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
 * Test case: Explicit $event assignment combined with !! two-way binding
 * Purpose: Verify that when the two-way binding syntax (postfix !!) is
 *          used, the framework generates the default event assignment,
 *          so manual assignment to the $ prefixed event variable is
 *          forbidden
 * Error code: 10905358
 *
 * Background:
 * - In @ComponentV2, `this.prop!!` marks a two-way binding towards a
 *   child @Param property
 * - The compiler auto-generates the `$prop` event callback via
 *   createUpdateTwoWayNode in process_custom_component.ts
 * - checkIfNeedDollarEvent in log_message_collection.ts reports 10905358
 *   when both the !! binding and an explicit `$prop` assignment exist
 */

// ============================================
// Child component with @Param property
// ============================================

@ComponentV2
struct DollarEventChild {
  @Param value: number = 0
  @Event $value: (newValue: number) => void = (newValue: number) => {}

  build() {
    Column() {
      Text('Child Value: ' + this.value)
        .fontSize(16)
    }
  }
}

// ============================================
// Entry point: V2 parent with illegal $event assignment
// Expected Error: 10905358
// ============================================

@Entry
@ComponentV2
struct TestDollarEventBindingError {
  @Local count: number = 0

  build() {
    Column() {
      Text('Two-way Binding Test')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      // Error: !! binding already generates default $value assignment,
      // explicit $value assignment is forbidden - 10905358
      DollarEventChild({
        value: this.count!!,
        $value: (newValue: number) => {
          this.count = newValue
        }
      })

      Column() {
        Text('Testing: 10905358')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('Do not assign $value manually when using !!')
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

        Text('DollarEventChild({ value: this.count!! })')
          .fontSize(12)
          .fontColor(Color.Green)

        Text('Framework generates $value automatically')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: log_message_collection.ts')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('Only applies to @ComponentV2 parents')
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
