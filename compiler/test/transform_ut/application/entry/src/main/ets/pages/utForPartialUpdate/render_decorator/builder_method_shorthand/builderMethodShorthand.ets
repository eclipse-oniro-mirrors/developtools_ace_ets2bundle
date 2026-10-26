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
// 测试场景：@Builder 函数参数对象方法简写转换（issue-4720 第3部分）
// 方法简写 onClick() {...} 编译期转换为函数表达式，并经既有 thunk/代理机制包装；
// 混合属性、async 修饰、生成器、计算属性名、get/set 访问器、嵌套对象、展开运算符
// 均需正确处理（get/set 与嵌套对象、展开按现状透传）。
class ActionConfig {
  onClick: () => void = () => {};
  label: string = '';
}

@Builder
function ActionButton(config: ActionConfig) {
  Button(config.label)
    .onClick(config.onClick)
}

@Builder
function MixedParamBuilder(config: ActionConfig) {
  Column() {
    Text(config.label)
  }
}

@Builder
function AccessorParamBuilder(config: ActionConfig) {
  Text(config.label)
}

@Component
struct BuilderMethodShorthandTest {
  @State message: string = 'Hello World';

  @Builder
  innerBuilder(config: ActionConfig) {
    ActionButton({
      onClick() {
        console.log('inner button clicked');
      },
      label: 'InnerButton'
    })
  }

  build() {
    Row() {
      Column() {
        Text('method shorthand:')
          .fontSize(20)
        ActionButton({
          onClick() {
            console.log('Button clicked');
          },
          label: 'Click me'
        })
        Divider()
        Text('mixed properties:')
          .fontSize(20)
        MixedParamBuilder({
          label: 'Mixed',
          onClick() {
            console.log('Mixed clicked');
          }
        })
        Divider()
        Text('accessor and special names:')
          .fontSize(20)
        AccessorParamBuilder({
          label: 'Accessor',
          async onClickAsync() {
            console.log('async clicked');
          },
          *genMethod() {
            console.log('generator clicked');
          },
          ['computedKey']() {
            console.log('computed clicked');
          }
        })
        Divider()
        Text('accessor passthrough:')
          .fontSize(20)
        AccessorParamBuilder({
          label: 'AccessorPass',
          get accValue() {
            return 1;
          },
          set accValue(newValue: number) {
            console.log('set ' + newValue);
          }
        })
        Divider()
        Text('nested object and spread:')
          .fontSize(20)
        MixedParamBuilder({
          label: 'Nested',
          nested: {
            onTap() {
              console.log('nested tapped');
            }
          }
        })
        Divider()
        this.innerBuilder({
          onClick() {
            console.log('inner clicked');
          },
          label: 'Inner'
        })
      }
      .width('100%')
    }
    .height('100%')
  }
}
