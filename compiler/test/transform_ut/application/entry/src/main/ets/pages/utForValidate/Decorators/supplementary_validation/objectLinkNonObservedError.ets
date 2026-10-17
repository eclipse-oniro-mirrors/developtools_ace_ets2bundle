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
 * Test case: @ObjectLink with unsupported type
 * Purpose: Verify @ObjectLink property type must be a class decorated
 *          with @Observed (or initialized via makeV1Observed)
 * Error code: 10905307
 *
 * Background:
 * - @ObjectLink is used with @Observed classes for nested object
 *   observation in V1 state management
 * - In esmodule partial update mode, updateSynchedPropertyNesedObjectPU
 *   calls checkObjectLinkType; basic types and function types are
 *   rejected by validateNonObservedClassType in process_component_member.ts
 * - In esmodule mode the error message references '@ObservedV2'
 */

// ============================================
// Plain class and correct class definitions
// ============================================

class PlainUserInfo {
  userName: string = 'default'
  userAge: number = 0
}

@Observed
class ObservedUserInfo {
  userName: string = 'observed'
  userAge: number = 18
}

// ============================================
// Test Case 1: @ObjectLink with basic number type
// Expected Error: 10905307
// ============================================

@Component
struct ObjectLinkNumberTypeError {
  // Error: number is not an observable class type - 10905307
  @ObjectLink numValue: number

  build() {
    Column() {
      Text('Number Type Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 2: @ObjectLink with basic string type
// Expected Error: 10905307
// ============================================

@Component
struct ObjectLinkStringTypeError {
  // Error: string is not an observable class type - 10905307
  @ObjectLink strValue: string

  build() {
    Column() {
      Text('String Type Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 3: @ObjectLink with basic boolean type
// Expected Error: 10905307
// ============================================

@Component
struct ObjectLinkBooleanTypeError {
  // Error: boolean is not an observable class type - 10905307
  @ObjectLink flag: boolean

  build() {
    Column() {
      Text('Boolean Type Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 4: Correct @ObjectLink with @Observed class
// ============================================

@Component
struct ObjectLinkObservedCorrect {
  // Correct: ObservedUserInfo is decorated with @Observed
  @ObjectLink observedInfo: ObservedUserInfo

  build() {
    Column() {
      Text(this.observedInfo.userName)
        .fontSize(16)
        .fontColor(Color.Green)
    }
  }
}

// ============================================
// Test Case 5: Correct @ObjectLink with plain class
// (accepted for V1 observation scenarios)
// ============================================

@Component
struct ObjectLinkPlainClassCorrect {
  // Correct: plain class instance is accepted as nested object
  @ObjectLink plainInfo: PlainUserInfo

  build() {
    Column() {
      Text(this.plainInfo.userName)
        .fontSize(16)
        .fontColor(Color.Green)
    }
  }
}

// ============================================
// Entry point
// ============================================

@Entry
@Component
struct TestObjectLinkNonObservedError {
  @State testTitle: string = '@ObjectLink Non Observed Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905307')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('@ObjectLink can only be used with @Observed classes')
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

        Text('@Observed class ObservedUserInfo { ... }')
          .fontSize(12)
          .fontColor(Color.Green)

        Text('@ObjectLink observedInfo: ObservedUserInfo')
          .fontSize(12)
          .fontColor(Color.Green)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: process_component_member.ts')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('makeV1Observed return value is also accepted')
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
