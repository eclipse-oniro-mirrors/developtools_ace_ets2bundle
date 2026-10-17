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
 * Test case: Lifecycle member decorators with input parameters
 * Purpose: Verify lifecycle decorators (except @ComponentReuse) cannot
 *          decorate methods with input parameters
 * Error code: 10905371
 *
 * Background:
 * - Lifecycle member decorators are defined in constant_define.ts:
 *   @ComponentInit, @ComponentAppear, @ComponentBuilt, @ComponentAttach,
 *   @ComponentDetach, @ComponentReuse, @ComponentRecycle,
 *   @ComponentDisappear, @ComponentActive, @ComponentInactive
 * - Except @ComponentReuse (checked separately), handleLifecycleDecorator
 *   in validate_ui_syntax.ts reports 10905371 when the decorated method
 *   has input parameters
 * - A single parameter typed Record/Object/ESObject/object is allowed
 */

// ============================================
// Test Case 1: @ComponentAppear with one parameter
// Expected Error: 10905371
// ============================================

@Component
struct AppearWithParamError {
  // Error: lifecycle method with string parameter - 10905371
  @ComponentAppear
  onAppearWithParam(reason: string) {
    console.log('appear with reason: ' + reason)
  }

  build() {
    Column() {
      Text('Appear Param Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 2: @ComponentInit with one parameter
// Expected Error: 10905371
// ============================================

@Component
struct InitWithParamError {
  // Error: lifecycle method with number parameter - 10905371
  @ComponentInit
  initWithParam(initValue: number) {
    console.log('init with value')
  }

  build() {
    Column() {
      Text('Init Param Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 3: @ComponentBuilt with two parameters
// Expected Error: 10905371
// ============================================

@Component
struct BuiltWithParamsError {
  // Error: lifecycle method with two parameters - 10905371
  @ComponentBuilt
  builtWithParams(first: string, second: string) {
    console.log('built with params')
  }

  build() {
    Column() {
      Text('Built Params Test')
        .fontSize(16)
    }
  }
}

// ============================================
// Test Case 4: Correct lifecycle methods without parameters
// ============================================

@Component
struct CorrectLifecycleUsage {
  // Correct: no input parameters
  @ComponentAppear
  onAppearWithoutParam() {
    console.log('appear')
  }

  // Correct: no input parameters
  @ComponentDetach
  onDetachWithoutParam() {
    console.log('detach')
  }

  build() {
    Column() {
      Text('Correct Lifecycle')
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
struct TestLifecycleDecoratorParamsError {
  @State testTitle: string = 'Lifecycle Decorator Params Test'

  build() {
    Column() {
      Text(this.testTitle)
        .fontSize(24)
        .fontWeight(FontWeight.Bold)
        .margin(20)

      Column() {
        Text('Testing: 10905371')
          .fontSize(18)
          .fontColor(Color.Red)

        Text('Lifecycle decorated methods cannot have input parameters')
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

        Text('@ComponentAppear onAppearWithoutParam() { ... }')
          .fontSize(12)
          .fontColor(Color.Green)

        Text('@ComponentReuse in V2 has its own rule (10905370)')
          .fontSize(12)
          .fontColor(Color.Gray)
      }
      .width('90%')
      .padding(10)
      .backgroundColor('#E8F5E9')
      .margin(5)

      Column() {
        Text('Rule source: validate_ui_syntax.ts')
          .fontSize(12)
          .fontColor(Color.Gray)

        Text('handleLifecycleDecorator -> checkMethodArgsNum')
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
