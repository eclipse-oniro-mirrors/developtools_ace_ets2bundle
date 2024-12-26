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

// @Monitor base case
exports.source = `
@Entry
@ComponentV2
struct Index {
  @Local message: string = "Hello World";
  @Local name: string = "Tom";
  @Local age: number = 24;
  @Monitor("message", "name")
  onStrChange(monitor: IMonitor) {
    monitor.dirty.forEach((path: string) => {
      console.log(path +  " changed from " + monitor.value(path)?.before + " to " + monitor.value(path)?.now)
    })
  }
  build() {
    Column() {
      Button("change string")
        .onClick(() => {
          this.message += "!";
          this.name = "Jack";
        })
    }
  }
}
`;
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
if (PUV2ViewBase.contextStack === undefined) {
    Reflect.set(PUV2ViewBase, "contextStack", []);
}
class Index extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.message = "Hello World";
        this.name = "Tom";
        this.age = 24;
        this.finalizeConstruction();
    }
    onStrChange(monitor) {
        monitor.dirty.forEach((path) => {
            console.log(path + " changed from " + monitor.value(path)?.before + " to " + monitor.value(path)?.now);
        });
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("change string");
            Button.onClick(() => {
                this.message += "!";
                this.name = "Jack";
            });
        }, Button);
        Button.pop();
        Column.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    static getEntryName() {
        return "Index";
    }
}
__decorate([
    Local
], Index.prototype, "message", void 0);
__decorate([
    Local
], Index.prototype, "name", void 0);
__decorate([
    Local
], Index.prototype, "age", void 0);
__decorate([
    Monitor("message", "name")
], Index.prototype, "onStrChange", null);
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new Index(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`;
