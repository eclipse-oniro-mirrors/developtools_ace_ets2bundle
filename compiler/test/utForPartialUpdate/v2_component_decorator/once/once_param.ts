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

// @Once case with @Param
exports.source = `
@ObservedV2
class Info {
  @Trace name: string;
  constructor(name: string) {
    this.name = name;
  }
}
@ComponentV2
struct Child {
  @Param @Once onceParamNum: number = 0;
  @Param @Once @Require onceParamInfo: Info;

  build() {
    Column() {
      Text("Child onceParamNum: " + this.onceParamNum)
      Text("Child onceParamInfo: " + this.onceParamInfo.name)
      Button("changeOnceParamNum")
        .onClick(() => {
          this.onceParamNum++;
        })
      Button("changeParamInfo")
        .onClick(() => {
          this.onceParamInfo = new Info("Cindy");
        })
    }
  }
}
@Entry
@ComponentV2
struct Index {
  @Local localNum: number = 10;
  @Local localInfo: Info = new Info("Tom");

  build() {
    Column() {
      Text("Parent localNum: " + this.localNum)
      Text("Parent localInfo: " + this.localInfo.name)
      Button("changeLocalNum")
        .onClick(() => {
          this.localNum++;
        })
      Button("changeLocalInfo")
        .onClick(() => {
          this.localInfo = new Info("Cindy");
        })
      Child({
        onceParamNum: this.localNum,
        onceParamInfo: this.localInfo
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
let Info = class Info {
    constructor(name) {
        this.name = name;
    }
};
__decorate([
    Trace
], Info.prototype, "name", void 0);
Info = __decorate([
    ObservedV2
], Info);
class Child extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.initParam("onceParamNum", (params && "onceParamNum" in params) ? params.onceParamNum : 0);
        this.initParam("onceParamInfo", (params && "onceParamInfo" in params) ? params.onceParamInfo : undefined);
        this.finalizeConstruction();
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("Child onceParamNum: " + this.onceParamNum);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("Child onceParamInfo: " + this.onceParamInfo.name);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("changeOnceParamNum");
            Button.onClick(() => {
                this.onceParamNum++;
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("changeParamInfo");
            Button.onClick(() => {
                this.onceParamInfo = new Info("Cindy");
            });
        }, Button);
        Button.pop();
        Column.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    updateStateVars(params) {
        if (params === undefined) {
            return;
        }
        if ("onceParamNum" in params) {
            this.updateParam("onceParamNum", params.onceParamNum);
        }
        if ("onceParamInfo" in params) {
            this.updateParam("onceParamInfo", params.onceParamInfo);
        }
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
__decorate([
    Param,
    Once
], Child.prototype, "onceParamNum", void 0);
__decorate([
    Param,
    Once
], Child.prototype, "onceParamInfo", void 0);
class Index extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.localNum = 10;
        this.localInfo = new Info("Tom");
        this.finalizeConstruction();
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("Parent localNum: " + this.localNum);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("Parent localInfo: " + this.localInfo.name);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("changeLocalNum");
            Button.onClick(() => {
                this.localNum++;
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("changeLocalInfo");
            Button.onClick(() => {
                this.localInfo = new Info("Cindy");
            });
        }, Button);
        Button.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new Child(this, {
                        onceParamNum: this.localNum,
                        onceParamInfo: this.localInfo
                    }, undefined, elmtId, () => { }, { page: "once_param.ets", line: 47, col: 7 });
                    ViewV2.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            onceParamNum: this.localNum,
                            onceParamInfo: this.localInfo
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        onceParamNum: this.localNum,
                        onceParamInfo: this.localInfo
                    });
                }
            }, { name: "Child" });
        }
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
], Index.prototype, "localNum", void 0);
__decorate([
    Local
], Index.prototype, "localInfo", void 0);
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new Index(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`;
