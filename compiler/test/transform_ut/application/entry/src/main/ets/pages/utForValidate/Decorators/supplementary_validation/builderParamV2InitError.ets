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
 * Test case: @BuilderParam initialized by non-builder value in @ComponentV2
 * Purpose: Verify @BuilderParam in @ComponentV2 can only be initialized
 *          by @Builder function
 * Error code: 10905107
 *
 * Background:
 * - In @ComponentV2, @BuilderParam property is processed by
 *   processBuilderParamProperty in process_struct_componentV2.ts
 * - judgeBuilderParamAssignedByBuilder returns true when the initializer
 *   is neither a @Builder method reference nor a wrapped builder,
 *   then error 10905107 is reported
 */

// ============================================
// Shared builder function for correct cases
// ============================================

@Builder
function sharedBuilder() {
  Text('Shared Builder')
}

// ============================================
// Test Case 1: @BuilderParam initialized with number literal
// Expected Error: 10905107
// ============================================

@ComponentV2
struct V2BuilderParamNumberInit {
  // Error: initialized by number, not a @Builder function - 10905107
  @BuilderParam builderWithNumberInit: number = 42

  build() {
    Column() {
      Text('Number Init Test')
    }
  }
}

// ============================================
// Test Case 2: @BuilderParam initialized with string literal
// Expected Error: 10905107
// ============================================

@ComponentV2
struct V2BuilderParamStringInit {
  // Error: initialized by string, not a @Builder function - 10905107
  @BuilderParam builderWithStringInit: string = 'not a builder'

  build() {
    Column() {
      Text('String Init Test')
    }
  }
}

// ============================================
// Test Case 3: Correct @BuilderParam initialized with @Builder function
// ============================================

@ComponentV2
struct V2BuilderParamCorrect {
  // Correct: initialized by a global @Builder function
  @BuilderParam correctBuilderParam: () => void = sharedBuilder

  build() {
    Column() {
      this.correctBuilderParam()
    }
  }
}

// ============================================
// Entry point
// ============================================

@Entry
@Component
struct TestBuilderParamV2InitError {
  @State testTitle: string = '@BuilderParam V2 Init Error Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905107')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('@BuilderParam can only initialized by @Builder function')
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

        Text('@BuilderParam correctBuilderParam: () => void = sharedBuilder')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: process_struct_componentV2.ts')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('Applies to @ComponentV2 structs only')
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
