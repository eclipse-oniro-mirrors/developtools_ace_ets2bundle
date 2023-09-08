/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
exports.source = `
const value5: boolean[] = [true, false]
let value6: {item1: boolean} = {item1: true}
let isCountDown: boolean = false

@Reusable
@Component
struct $$Component {
  private value1: string = "hello world 1"
  private value2: string = "hello world 2"
  private value3: string = "hello world 3"
  private value4: boolean = false
  private count: number = 1000;
  myTimeController: TextTimerController  = new TextTimerController();
  @State format: string = "hh:mm:ss:ms"
  @State width_value: string = "100%"

  build() {
    Column() {
      Row() {
        Radio({value: "Radio", group: "1"})
          .checked($$this.value4)
          .width(this.width_value)
          .height(100)
      }
      Row() {
        Button() {
          Text(this.value1)
            .bindPopup($$value5[0], {message: "This is $$ for Array"})
            .width(this.width_value)
            .height(100)
        }
        .bindPopup($$this.value4, {message: "This is $$ for regular"})
        .width(this.width_value)
        .height(20)
        Text(this.value2)
          .width(this.width_value)
          .fontSize(100)
          .bindPopup($$value6.item1, {message: "This is $$ for Obj"})
        Text(this.value3)
        Radio({value: "Radio", group: "1"})
          .checked($$value5[0])
          .width(this.width_value)
          .height(100)
      }
      .width(this.width_value)
      .height(100)
      Row(){
        TextTimer({controller: this.myTimeController, isCountDown: $$isCountDown, count: $$this.count})
          .format($$this.format)
          .width(this.width_value)
          .height(100)
        Button("start")
          .onClick(()=>{
            this.myTimeController.start();
          })
          .width(this.width_value)
          .height(100)
        Button("pause")
          .onClick(()=>{
            this.myTimeController.pause();
          })
          .width(this.width_value)
          .height(100)
        Button("reset")
          .onClick(()=>{
            this.myTimeController.reset();
          })
          .width(this.width_value)
          .height(100)
      }
    }
    .width(this.width_value)
    .height(500)
  }
}`

exports.expectResult =
`"use strict";
const value5 = [true, false];
let value6 = { item1: true };
let isCountDown = false;
class $$Component extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.value1 = "hello world 1";
        this.value2 = "hello world 2";
        this.value3 = "hello world 3";
        this.value4 = false;
        this.count = 1000;
        this.myTimeController = new TextTimerController();
        this.__format = new ObservedPropertySimplePU("hh:mm:ss:ms", this, "format");
        this.__width_value = new ObservedPropertySimplePU("100%", this, "width_value");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.value1 !== undefined) {
            this.value1 = params.value1;
        }
        if (params.value2 !== undefined) {
            this.value2 = params.value2;
        }
        if (params.value3 !== undefined) {
            this.value3 = params.value3;
        }
        if (params.value4 !== undefined) {
            this.value4 = params.value4;
        }
        if (params.count !== undefined) {
            this.count = params.count;
        }
        if (params.myTimeController !== undefined) {
            this.myTimeController = params.myTimeController;
        }
        if (params.format !== undefined) {
            this.format = params.format;
        }
        if (params.width_value !== undefined) {
            this.width_value = params.width_value;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__format.purgeDependencyOnElmtId(rmElmtId);
        this.__width_value.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__format.aboutToBeDeleted();
        this.__width_value.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
        this.__format.updateElmtId(oldElmtId, newElmtId);
        this.__width_value.updateElmtId(oldElmtId, newElmtId);
    }
    get format() {
        return this.__format.get();
    }
    set format(newValue) {
        this.__format.set(newValue);
    }
    get width_value() {
        return this.__width_value.get();
    }
    set width_value(newValue) {
        this.__width_value.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(this.width_value);
            if (isInitialRender) {
                Column.height(500);
            }
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: "Radio", group: "1" });
            Radio.checked(this.value4, newValue => { this.value4 = newValue; });
            Radio.width(this.width_value);
            if (isInitialRender) {
                Radio.height(100);
            }
        }, Radio);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.width(this.width_value);
            if (isInitialRender) {
                Row.height(100);
            }
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithChild();
            Button.bindPopup({ value: this.value4, changeEvent: newValue => { this.value4 = newValue; } }, { message: "This is $$ for regular" });
            Button.width(this.width_value);
            if (isInitialRender) {
                Button.height(20);
            }
        }, Button);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.value1);
            Text.bindPopup({ value: value5[0], changeEvent: newValue => { value5[0] = newValue; } }, { message: "This is $$ for Array" });
            Text.width(this.width_value);
            if (isInitialRender) {
                Text.height(100);
            }
        }, Text);
        Text.pop();
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.value2);
            Text.width(this.width_value);
            Text.bindPopup({ value: value6.item1, changeEvent: newValue => { value6.item1 = newValue; } }, { message: "This is $$ for Obj" });
            if (isInitialRender) {
                Text.fontSize(100);
            }
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.value3);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Radio.create({ value: "Radio", group: "1" });
            Radio.checked(value5[0], newValue => { value5[0] = newValue; });
            Radio.width(this.width_value);
            if (isInitialRender) {
                Radio.height(100);
            }
        }, Radio);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextTimer.create({ controller: this.myTimeController, isCountDown: { value: isCountDown, changeEvent: newValue => { isCountDown = newValue; } }, count: { value: this.count, changeEvent: newValue => { this.count = newValue; } } });
            TextTimer.format(this.format, newValue => { this.format = newValue; });
            TextTimer.width(this.width_value);
            if (isInitialRender) {
                TextTimer.height(100);
            }
        }, TextTimer);
        TextTimer.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("start");
            Button.width(this.width_value);
            if (isInitialRender) {
                Button.onClick(() => {
                    this.myTimeController.start();
                });
                Button.height(100);
            }
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("pause");
            Button.width(this.width_value);
            if (isInitialRender) {
                Button.onClick(() => {
                    this.myTimeController.pause();
                });
                Button.height(100);
            }
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("reset");
            Button.width(this.width_value);
            if (isInitialRender) {
                Button.onClick(() => {
                    this.myTimeController.reset();
                });
                Button.height(100);
            }
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
`
