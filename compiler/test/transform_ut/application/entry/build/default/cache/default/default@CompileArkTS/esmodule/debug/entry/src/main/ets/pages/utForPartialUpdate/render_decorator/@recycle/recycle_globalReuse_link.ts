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
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
   else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
if (!("finalizeConstruction" in ViewPU.prototype)) {
Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
let ObvservedClass = class ObvservedClass {
      };
      ObvservedClass = __decorate([
      Observed
      ], ObvservedClass);
      let NestedObservedObject = class NestedObservedObject {
      constructor() {
      this.oc = new ObvservedClass();
}
};
      __decorate([
      Track
      ], NestedObservedObject.prototype, "oc", void 0);
      NestedObservedObject = __decorate([
      Observed
      ], NestedObservedObject);
class Child extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__a = new SynchedPropertySimpleTwoWayPU(params.a, this, "a");
        this.noState = "";
        this.__stateb = new ObservedPropertySimplePU("", this, "stateb");
        this.__propc = new SynchedPropertySimpleOneWayPU(params.propc, this, "propc");
        this.__provd = new ObservedPropertySimplePU("", this, "provd");
        this.addProvidedVar("provd", this.__provd, false);
        this.__consf = this.initializeConsume("consf", "consf", "");
        this.__oblg = new SynchedPropertyNesedObjectPU(params.oblg, this, "oblg");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.noState !== undefined) {
            this.noState = params.noState;
        }
        if (params.stateb !== undefined) {
            this.stateb = params.stateb;
        }
        if (params.propc === undefined) {
            this.__propc.set("");
        }
        if (params.provd !== undefined) {
            this.provd = params.provd;
        }
        this.__oblg.set(params.oblg);
    }
    updateStateVars(params) {
        this.__propc.reset(params.propc);
        this.__oblg.set(params.oblg);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__a.purgeDependencyOnElmtId(rmElmtId);
        this.__stateb.purgeDependencyOnElmtId(rmElmtId);
        this.__propc.purgeDependencyOnElmtId(rmElmtId);
        this.__provd.purgeDependencyOnElmtId(rmElmtId);
        this.__consf.purgeDependencyOnElmtId(rmElmtId);
        this.__oblg.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__a.aboutToBeDeleted();
        this.__stateb.aboutToBeDeleted();
        this.__propc.aboutToBeDeleted();
        this.__provd.aboutToBeDeleted();
        this.__consf.aboutToBeDeleted();
        this.__oblg.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
        this.__a.updateElmtId(oldElmtId, newElmtId);
        this.__stateb.updateElmtId(oldElmtId, newElmtId);
        this.__propc.updateElmtId(oldElmtId, newElmtId);
        this.__provd.updateElmtId(oldElmtId, newElmtId);
        this.__consf.updateElmtId(oldElmtId, newElmtId);
        this.__oblg.updateElmtId(oldElmtId, newElmtId);
    }
    get a() {
        return this.__a.get();
    }
    set a(newValue) {
        this.__a.set(newValue);
    }
    get stateb() {
        return this.__stateb.get();
    }
    set stateb(newValue) {
        this.__stateb.set(newValue);
    }
    get propc() {
        return this.__propc.get();
    }
    set propc(newValue) {
        this.__propc.set(newValue);
    }
    get provd() {
        return this.__provd.get();
    }
    set provd(newValue) {
        this.__provd.set(newValue);
    }
    get consf() {
        return this.__consf.get();
    }
    set consf(newValue) {
        this.__consf.set(newValue);
    }
    get oblg() {
        return this.__oblg.get();
    }
    aboutToReuse(params) {
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('123');
        }, Text);
        Text.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    __resetStateVarsOnReuse__Internal(params) {
        this.__reInitializeConsume__Internal("consf", "consf", "");
        this.__a.resetSource(params.__a__Link__Internal);
    }
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__message = new ObservedPropertySimplePU("Hello World", this, "message");
        this.__noj = new ObservedPropertyObjectPU(new NestedObservedObject(), this, "noj");
        this.__consf = new ObservedPropertySimplePU("123", this, "consf");
        this.addProvidedVar("consf", this.__consf, false);
        this.__switchA = new ObservedPropertySimplePU(true, this, "switchA");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.message !== undefined) {
            this.message = params.message;
        }
        if (params.noj !== undefined) {
            this.noj = params.noj;
        }
        if (params.consf !== undefined) {
            this.consf = params.consf;
        }
        if (params.switchA !== undefined) {
            this.switchA = params.switchA;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__message.purgeDependencyOnElmtId(rmElmtId);
        this.__noj.purgeDependencyOnElmtId(rmElmtId);
        this.__consf.purgeDependencyOnElmtId(rmElmtId);
        this.__switchA.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__message.aboutToBeDeleted();
        this.__noj.aboutToBeDeleted();
        this.__consf.aboutToBeDeleted();
        this.__switchA.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
        this.__message.updateElmtId(oldElmtId, newElmtId);
        this.__noj.updateElmtId(oldElmtId, newElmtId);
        this.__consf.updateElmtId(oldElmtId, newElmtId);
        this.__switchA.updateElmtId(oldElmtId, newElmtId);
    }
    get message() {
        return this.__message.get();
    }
    set message(newValue) {
        this.__message.set(newValue);
    }
    get noj() {
        return this.__noj.get();
    }
    set noj(newValue) {
        this.__noj.set(newValue);
    }
    get consf() {
        return this.__consf.get();
    }
    set consf(newValue) {
        this.__consf.set(newValue);
    }
    get switchA() {
        return this.__switchA.get();
    }
    set switchA(newValue) {
        this.__switchA.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            if (isInitialRender) {
                Column.height("100%");
                Column.width("100%");
            }
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.switchA) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        __Recycle__.create();
                    }, __Recycle__);
                    {
                        if (this.__isGlobalPoolActive__Internal) {
                            Reusable(Child);
                        }
                        this.observeRecycleComponentCreation("Child", (elmtId, isInitialRender, recycleNode = null, isPreRender = false) => {
                            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                            if (isInitialRender) {
                                let componentCall = recycleNode ? recycleNode : new Child(this, {
                                    a: this.__message,
                                    noState: this.message,
                                    stateb: this.message,
                                    propc: this.message,
                                    provd: this.message,
                                    oblg: this.noj.oc
                                }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_link.ets", line: 58, col: 17 });
                                if (this.__isGlobalPoolActive__Internal) {
                                    let paramsLambda = () => {
                                        return {
                                            __a__Link__Internal: this.__message,
                                            a: this.message,
                                            noState: this.message,
                                            stateb: this.message,
                                            propc: this.message,
                                            provd: this.message,
                                            oblg: this.noj.oc
                                        };
                                    };
                                    componentCall.paramsGenerator_ = paramsLambda;
                                }
                                ViewPU.createRecycle(componentCall, isPreRender ? recycleNode == null : recycleNode !== null, "Child", () => {
                                    if (this.__isGlobalPoolActive__Internal && this.__pushRecycleElmtIdToRenderStack__Internal && typeof this.__pushRecycleElmtIdToRenderStack__Internal === "function") {
                                        this.__pushRecycleElmtIdToRenderStack__Internal(recycleNode?.id__());
                                    }
                                    if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                                        recycleNode.aboutToReuseInternal();
                                    }
                                    else {
                                        if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                            recycleNode.aboutToReuse({ a: this.message,
                                                noState: this.message,
                                                stateb: this.message,
                                                propc: this.message,
                                                provd: this.message,
                                                oblg: this.noj.oc });
                                        }
                                        recycleNode.rerender();
                                    }
                                    if (this.__isGlobalPoolActive__Internal && this.__popRecycleElmtIdFromRenderStack__Internal && typeof this.__popRecycleElmtIdFromRenderStack__Internal === "function") {
                                        this.__popRecycleElmtIdFromRenderStack__Internal();
                                    }
                                });
                                if (!this.__isGlobalPoolActive__Internal) {
                                    let paramsLambda = () => {
                                        return {
                                            a: this.message,
                                            noState: this.message,
                                            stateb: this.message,
                                            propc: this.message,
                                            provd: this.message,
                                            oblg: this.noj.oc
                                        };
                                    };
                                    componentCall.paramsGenerator_ = paramsLambda;
                                }
                            }
                            else {
                                this.updateStateVarsOfChildByElmtId(elmtId, {
                                    propc: this.message,
                                    oblg: this.noj.oc
                                });
                            }
                            ViewStackProcessor.StopGetAccessRecording();
                        }, Child);
                    }
                    __Recycle__.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("Switch");
            if (isInitialRender) {
                Button.onClick(() => {
                    this.switchA = !this.switchA;
                });
            }
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    __resetStateVarsOnReuse__Internal(params) {
    }
    static getEntryName() {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_link", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_link", integratedHsp: "false", moduleType: "followWithHap" });
//# sourceMappingURL=recycle_globalReuse_link.js.map