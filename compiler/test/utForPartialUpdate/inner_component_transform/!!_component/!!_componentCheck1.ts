/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

/*
 * This is a test case about the use of "!!" two-way sync binding in the 'bindMenu' attribute.
 */
exports.source = `
@Entry
@ComponentV2
struct BindMenuInterface {
  @Local isShow: boolean = false;

  build() {
    Column() {
      Row() {
        Text('click show Menu')
          .bindMenu(this.isShow!!, // 双向绑定
            [
              {
                value: 'Menu1',
                action: () => {
                  console.info('handle Menu1 click');
                }
              },
              {
                value: 'Menu2',
                action: () => {
                  console.info('handle Menu2 click');
                }
              },
            ])
          .fontSize(30)
          .width(180)
      }.height('50%')
      Text("当前isShow: " + this.isShow).fontSize(18).fontColor(Color.Red)
      Row() {
        Button("Click")
          .onClick(() => {
            this.isShow = true;
          })
      }
    }.width('100%')
  }
}
`

exports.expectResult =
`"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class BindMenuInterface extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.isShow = false;
        this.finalizeConstruction();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.height('50%');
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('click show Menu');
            Text.bindMenu({ value: this.isShow, $value: newValue => { this.isShow = newValue; } }, // 双向绑定
            [
                {
                    value: 'Menu1',
                    action: () => {
                        console.info('handle Menu1 click');
                    }
                },
                {
                    value: 'Menu2',
                    action: () => {
                        console.info('handle Menu2 click');
                    }
                },
            ]);
            Text.fontSize(30);
            Text.width(180);
        }, Text);
        Text.pop();
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("当前isShow: " + this.isShow);
            Text.fontSize(18);
            Text.fontColor(Color.Red);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("Click");
            Button.onClick(() => {
                this.isShow = true;
            });
        }, Button);
        Button.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "BindMenuInterface";
    }
}
__decorate([
    Local
], BindMenuInterface.prototype, "isShow", void 0);
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new BindMenuInterface(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
