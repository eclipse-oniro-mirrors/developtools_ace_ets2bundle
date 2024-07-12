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
@Component
struct CustomX{
  @Prop fruit:string='香蕉'
  build(){

  }
}
@Entry
@Component
struct CustomY {
  @State parentFruit: string = '苹果'
  build() {
    Row() {
      CustomX({fruit:this.parentFruit})
      CustomX({})
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
class CustomX extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__fruit = new SynchedPropertySimpleOneWayPU(params.fruit, this, "fruit");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.fruit === undefined) {
            this.__fruit.set('香蕉');
        }
    }
    updateStateVars(params) {
        this.__fruit.reset(params.fruit);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__fruit.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__fruit.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get fruit() {
        return this.__fruit.get();
    }
    set fruit(newValue) {
        this.__fruit.set(newValue);
    }
    initialRender() {
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
class CustomY extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__parentFruit = new ObservedPropertySimplePU('苹果', this, "parentFruit");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.parentFruit !== undefined) {
            this.parentFruit = params.parentFruit;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__parentFruit.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__parentFruit.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get parentFruit() {
        return this.__parentFruit.get();
    }
    set parentFruit(newValue) {
        this.__parentFruit.set(newValue);
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new CustomX(this, { fruit: this.parentFruit }, undefined, elmtId, () => { }, { page: "@prop.ets", line: 15, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            fruit: this.parentFruit
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        fruit: this.parentFruit
                    });
                }
            }, { name: "CustomX" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new CustomX(this, {}, undefined, elmtId, () => { }, { page: "@prop.ets", line: 16, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "CustomX" });
        }
        Row.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new CustomY(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`