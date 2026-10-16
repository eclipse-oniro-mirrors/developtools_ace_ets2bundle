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
 * Test case: @Computed property used with two-way binding syntax
 * Purpose: Verify a property decorated by @Computed cannot be used with
 *          the two-bind syntax (postfix !!)
 * Error code: 10905129
 *
 * Background:
 * - @Computed declares a computed getter in @ComponentV2
 * - Computed properties are read-only derived values, so using them as
 *   the left-hand side of a two-way binding is forbidden
 * - validateTwoWayComputed in process_custom_component.ts resolves the
 *   symbol of `this.xxx!!`; when the declaration is a getter decorated
 *   with @Computed, checkTwoWayComputed in log_message_collection.ts
 *   reports 10905129
 */

// ============================================
// Child component with @Param property
// ============================================

@ComponentV2
struct ComputedBindChild {
  @Param textValue: string = ''
  @Event $textValue: (newText: string) => void = (newText: string) => {}

  build() {
    Column() {
      Text('Child Text: ' + this.textValue)
        .fontSize(16)
    }
  }
}

// ============================================
// Entry point: V2 parent binding @Computed getter with !!
// Expected Error: 10905129
// ============================================

@Entry
@ComponentV2
struct TestComputedTwoWayBindError {
  @Local source: string = 'computed source'

  @Computed
  get computedText(): string {
    return this.source
  }

  build() {
    Column() {
      Text('@Computed Two-way Binding Test')
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      // Error: @Computed getter used with !! two-bind syntax - 10905129
      ComputedBindChild({ textValue: this.computedText!! })

      Column() {
        Text('Testing: 10905129')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('@Computed property cannot be used with two-bind syntax')
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

        Text('ComputedBindChild({ textValue: this.computedText })')
          .fontSize(12)
          .fontColor(Color.Green)

        Text('Use @Local property for two-way binding')
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
