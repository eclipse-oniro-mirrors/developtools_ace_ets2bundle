/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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
let a: string = "aaaaaaaaaa"
@Entry
@Component
struct HomeComponent {
  @State state_value: string = "100%"
  @State value: number = 1
  build() {
    Column() {
      child({propvalue: this.value, linkvalue: this.value})
        .border({width: 3, color: Color.Red})
        .width(this.state_value)
        .reuseId("reuse_key")
      child({propvalue: this.value, linkvalue: this.value})
        .border({width: 3, color: Color.Red})
        .reuseId(this.state_value)
      child({propvalue: this.value, linkvalue: this.value})
        .reuseId("reuse_key11111111111")
      child({propvalue: this.value, linkvalue: this.value})
        .border({width: 3, color: Color.Red})
        .width(this.state_value)
      child({propvalue: this.value, linkvalue: this.value})
      .reuseId(a)
    }
  }
}

@Reusable
@Component
struct child {
  @Prop propvalue: number;
  @Link linkvalue: number;

  build() {
    Column() {
      
    }
  }
}`

exports.expectResult = `"use strict";
let a = "aaaaaaaaaa";
class HomeComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__state_value = new ObservedPropertySimplePU("100%", this, "state_value");
        this.__value = new ObservedPropertySimplePU(1, this, "value");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.state_value !== undefined) {
            this.state_value = params.state_value;
        }
        if (params.value !== undefined) {
            this.value = params.value;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state_value.purgeDependencyOnElmtId(rmElmtId);
        this.__value.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state_value.aboutToBeDeleted();
        this.__value.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get state_value() {
        return this.__state_value.get();
    }
    set state_value(newValue) {
        this.__state_value.set(newValue);
    }
    get value() {
        return this.__value.get();
    }
    set value(newValue) {
        this.__value.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
            __Common__.border({ width: 3, color: Color.Red });
            __Common__.width(this.state_value);
        }, __Common__);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            this.observeRecycleComponentCreation("reuse_key", (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            propvalue: this.value,
                            linkvalue: this.value
                        };
                    };
                    if (recycleNode) {
                        recycleNode.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.__value }, undefined, elmtId, paramsLambda), recycleNode !== null, "reuse_key", () => {
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                            }
                            recycleNode.rerender();
                        }
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        propvalue: this.value
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Common__.pop();
        __Recycle__.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
            __Common__.border({ width: 3, color: Color.Red });
        }, __Common__);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            this.observeRecycleComponentCreation(this.state_value, (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            propvalue: this.value,
                            linkvalue: this.value
                        };
                    };
                    if (recycleNode) {
                        recycleNode.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.__value }, undefined, elmtId, paramsLambda), recycleNode !== null, this.state_value, () => {
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                            }
                            recycleNode.rerender();
                        }
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        propvalue: this.value
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Common__.pop();
        __Recycle__.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
        }, __Common__);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            this.observeRecycleComponentCreation("reuse_key11111111111", (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            propvalue: this.value,
                            linkvalue: this.value
                        };
                    };
                    if (recycleNode) {
                        recycleNode.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.__value }, undefined, elmtId, paramsLambda), recycleNode !== null, "reuse_key11111111111", () => {
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                            }
                            recycleNode.rerender();
                        }
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        propvalue: this.value
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Common__.pop();
        __Recycle__.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
            __Common__.border({ width: 3, color: Color.Red });
            __Common__.width(this.state_value);
        }, __Common__);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            this.observeRecycleComponentCreation("child", (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            propvalue: this.value,
                            linkvalue: this.value
                        };
                    };
                    if (recycleNode) {
                        recycleNode.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.__value }, undefined, elmtId, paramsLambda), recycleNode !== null, "child", () => {
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                            }
                            recycleNode.rerender();
                        }
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        propvalue: this.value
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Common__.pop();
        __Recycle__.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Common__.create();
        }, __Common__);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            this.observeRecycleComponentCreation(a, (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            propvalue: this.value,
                            linkvalue: this.value
                        };
                    };
                    if (recycleNode) {
                        recycleNode.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.__value }, undefined, elmtId, paramsLambda), recycleNode !== null, a, () => {
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                            }
                            recycleNode.rerender();
                        }
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        propvalue: this.value
                    });
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Common__.pop();
        __Recycle__.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class child extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__propvalue = new SynchedPropertySimpleOneWayPU(params.propvalue, this, "propvalue");
        this.__linkvalue = new SynchedPropertySimpleTwoWayPU(params.linkvalue, this, "linkvalue");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
        this.__propvalue.reset(params.propvalue);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__propvalue.purgeDependencyOnElmtId(rmElmtId);
        this.__linkvalue.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__propvalue.aboutToBeDeleted();
        this.__linkvalue.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
        this.__propvalue.updateElmtId(oldElmtId, newElmtId);
        this.__linkvalue.updateElmtId(oldElmtId, newElmtId);
    }
    get propvalue() {
        return this.__propvalue.get();
    }
    set propvalue(newValue) {
        this.__propvalue.set(newValue);
    }
    get linkvalue() {
        return this.__linkvalue.get();
    }
    set linkvalue(newValue) {
        this.__linkvalue.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new HomeComponent(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`