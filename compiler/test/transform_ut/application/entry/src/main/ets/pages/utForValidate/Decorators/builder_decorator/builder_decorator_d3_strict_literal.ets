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
@Component
struct BuilderDecoratorD3StrictLiteral {
  build() {
    Column() {
      Text('d3')
    }
  }
}

// D-3 (10905133): non-empty literal without an explicit boolean isPlaceholder
@Builder({ isPlaceholder: 'yes' })
function stringValueBuilder() {
  Text('string value')
}

@Builder({ isPlaceholder: 1 })
function numericValueBuilder() {
  Text('numeric value')
}

@Builder({ isPlaceholder: someVar })
function identifierValueBuilder() {
  Text('identifier value')
}

@Builder({ isplaceholder: true })
function misspelledKeyBuilder() {
  Text('misspelled key')
}

@Builder({ isPlaceholder })
function shorthandBuilder() {
  Text('shorthand')
}

@Builder({ foo: 1 })
function missingKeyBuilder() {
  Text('missing key')
}

@Builder({ unknownOption: 1 })
function unknownKeyOnlyBuilder() {
  Text('unknown only')
}

// D-3 (10905133): resolved variable values (const/let/enum) are not explicit boolean literals
const constFlag: boolean = true;
let letFlag: boolean = false;

enum PlaceholderFlag {
  ON = 1,
  OFF = 2
}

@Builder({ isPlaceholder: constFlag })
function constValueBuilder() {
  Text('const value')
}

@Builder({ isPlaceholder: letFlag })
function letValueBuilder() {
  Text('let value')
}

@Builder({ isPlaceholder: PlaceholderFlag.ON })
function enumValueBuilder() {
  Text('enum value')
}

// D-3 (10905133): undefined / null are not explicit boolean literals either
@Builder({ isPlaceholder: undefined })
function undefinedValueBuilder() {
  Text('undefined value')
}

@Builder({ isPlaceholder: null })
function nullValueBuilder() {
  Text('null value')
}
