/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
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

exports.source = `
@Entry
@Component
struct IFView {
  @State toggle1: boolean = false;
  @State toggle2: boolean = false;
  @State toggle3: boolean = false;

  build() {
    Column() {
      if (this.toggle1) {
        Text('toggle1')
      } else if(this.toggle2) {
        Text('toggle2')
      } else if (this.toggle3) {
        Text('toggle3')
      } else {
        Text('toggle no thing')
      }
      if (this.toggle1) {
        Text('toggle1 Single')
      }
    }
  }
}
`
exports.expectResult =
`"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
if (PUV2ViewBase.contextStack === undefined) {
    Reflect.set(PUV2ViewBase, "contextStack", []);
}
class IFView extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__toggle1 = new ObservedPropertySimplePU(false, this, "toggle1");
        this.__toggle2 = new ObservedPropertySimplePU(false, this, "toggle2");
        this.__toggle3 = new ObservedPropertySimplePU(false, this, "toggle3");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.toggle1 !== undefined) {
            this.toggle1 = params.toggle1;
        }
        if (params.toggle2 !== undefined) {
            this.toggle2 = params.toggle2;
        }
        if (params.toggle3 !== undefined) {
            this.toggle3 = params.toggle3;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__toggle1.purgeDependencyOnElmtId(rmElmtId);
        this.__toggle2.purgeDependencyOnElmtId(rmElmtId);
        this.__toggle3.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__toggle1.aboutToBeDeleted();
        this.__toggle2.aboutToBeDeleted();
        this.__toggle3.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get toggle1() {
        return this.__toggle1.get();
    }
    set toggle1(newValue) {
        this.__toggle1.set(newValue);
    }
    get toggle2() {
        return this.__toggle2.get();
    }
    set toggle2(newValue) {
        this.__toggle2.set(newValue);
    }
    get toggle3() {
        return this.__toggle3.get();
    }
    set toggle3(newValue) {
        this.__toggle3.set(newValue);
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.toggle1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('toggle1');
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.toggle2) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('toggle2');
                    }, Text);
                    Text.pop();
                });
            }
            else if (this.toggle3) {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('toggle3');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('toggle no thing');
                    }, Text);
                    Text.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.toggle1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Text.create('toggle1 Single');
                    }, Text);
                    Text.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new IFView(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`