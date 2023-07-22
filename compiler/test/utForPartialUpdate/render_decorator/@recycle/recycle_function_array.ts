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
@Entry
@Component
struct HomeComponent {
  @State value: number = 1
  build() {
    Column() {
      child({propvalue: this.value, linkvalue: this.value})
    }
  }
}

@Reusable
@Component
struct child {
  @State state_value: number = 1;
  reguar_value: string = "hello"
  build() {
    Column() {
      Circle()
        .onClick(() => {
          console.log("hello")
        })
        .strokeDashArray(["hello", this.reguar_value])
        .height(100)
      Circle()
        .strokeDashArray([this.state_value])
      Text("hello")
        .onClick(() => {
          console.log("hello")
        })
    }
  }
}`

exports.expectResult = `"use strict";
class HomeComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__value = new ObservedPropertySimplePU(1, this, "value");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.value !== undefined) {
            this.value = params.value;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__value.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__value.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get value() {
        return this.__value.get();
    }
    set value(newValue) {
        this.__value.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            __Recycle__.create();
            if (!isInitialRender) {
                __Recycle__.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        {
            this.observeRecycleComponentCreation("child", (elmtId, isInitialRender, recycleNode = null) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    ViewPU.createRecycle(recycleNode ? recycleNode : new child(this, { propvalue: this.value, linkvalue: this.value }, undefined, elmtId), recycleNode !== null, "child", () => {
                        if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                            recycleNode.aboutToReuse({ propvalue: this.value, linkvalue: this.value });
                        }
                        recycleNode.rerender();
                    });
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
                ViewStackProcessor.StopGetAccessRecording();
            });
        }
        __Recycle__.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class child extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1) {
        super(parent, __localStorage, elmtId);
        this.__state_value = new ObservedPropertySimplePU(1, this, "state_value");
        this.reguar_value = "hello";
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.state_value !== undefined) {
            this.state_value = params.state_value;
        }
        if (params.reguar_value !== undefined) {
            this.reguar_value = params.reguar_value;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__state_value.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__state_value.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
        this.__state_value.updateElmtId(oldElmtId, newElmtId);
    }
    get state_value() {
        return this.__state_value.get();
    }
    set state_value(newValue) {
        this.__state_value.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Column.create();
            if (!isInitialRender) {
                Column.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Circle.create();
            if (!isInitialRender) {
                Circle.pop();
            }
            else {
                Circle.onClick(() => {
                    console.log("hello");
                });
                Circle.strokeDashArray(["hello", this.reguar_value]);
                Circle.height(100);
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Circle.create();
            Circle.strokeDashArray([this.state_value]);
            if (!isInitialRender) {
                Circle.pop();
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        this.observeComponentCreation((elmtId, isInitialRender) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            Text.create("hello");
            if (!isInitialRender) {
                Text.pop();
            }
            else {
                Text.onClick(() => {
                    console.log("hello");
                });
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
        Text.pop();
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