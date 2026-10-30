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
interface NestedData {
  inner_value: number
}

@Entry
@Component
struct ValidateRequireParamUndefinedTypeParent {
  @State numValue: number = 5;

  build() {
    Column() {
      ValidateRequireParamUndefinedTypeChild({
        require_value: undefined,
        union_value: undefined,
        any_value: undefined,
        no_require_value: undefined,
        variable_value: this.numValue,
        nested_value: { inner_value: undefined }
      })
    }
  }
}

@Component
struct ValidateRequireParamUndefinedTypeChild {
  @Require require_value: number = 1
  @Require union_value: number | undefined = 1
  @Require any_value: any = 1
  no_require_value: number = 1
  @Require variable_value: number = 1
  @Require nested_value: NestedData = { inner_value: 1 }

  build() {
    Row() {}
  }
}
