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
@Entry
@ComponentV2
struct ValidateRequireParamUndefinedTypeExtensionV2Parent {
  @Local unionParamVariable: string | undefined = "hello";

  build() {
    Column() {
      ValidateRequireParamUndefinedTypeExtensionV2Child({
        void_param_value: void 0,
        union_param_value: this.unionParamVariable
      })
    }
  }
}

@ComponentV2
struct ValidateRequireParamUndefinedTypeExtensionV2Child {
  @Require @Param void_param_value: string = "a"
  @Require @Param union_param_value: string = "b"

  build() {
    Row() {}
  }
}
