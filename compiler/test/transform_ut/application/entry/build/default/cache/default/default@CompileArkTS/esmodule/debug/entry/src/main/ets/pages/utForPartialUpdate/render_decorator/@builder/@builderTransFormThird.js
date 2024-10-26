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
"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class TestBuilder1 extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    innerBuidler(value, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "TestBuilder1";
    }
}
class TestBuilderReusable extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    updateRecycleElmtId(oldElmtId, newElmtId) {
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    innerBuidler(value, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function testInnerComponent(value, parent = null) {
    const __value__ = value;
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        __Recycle__.create();
    }, __Recycle__);
    {
        (parent ? parent : this).observeRecycleComponentCreation("TestBuilderReusable", (elmtId, isInitialRender, recycleNode = null) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            if (isInitialRender) {
                let componentCall = recycleNode ? recycleNode : new TestBuilderReusable(parent ? parent : this, {}, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@builder/@builderTransFormThird.ets", line: 51, col: 5 });
                ViewPU.createRecycle(componentCall, recycleNode !== null, "TestBuilderReusable", () => {
                    if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                        recycleNode.aboutToReuseInternal();
                    }
                    else {
                        if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                            recycleNode.aboutToReuse({});
                        }
                        recycleNode.rerender();
                    }
                });
                let paramsLambda = () => {
                    return {};
                };
                componentCall.paramsGenerator_ = paramsLambda;
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
    }
    __Recycle__.pop();
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        __Common__.create();
        __Common__.height(value);
    }, __Common__);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        __Recycle__.create();
    }, __Recycle__);
    {
        (parent ? parent : this).observeRecycleComponentCreation("TestBuilderReusable", (elmtId, isInitialRender, recycleNode = null) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            if (isInitialRender) {
                let componentCall = recycleNode ? recycleNode : new TestBuilderReusable(parent ? parent : this, {}, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@builder/@builderTransFormThird.ets", line: 52, col: 5 });
                ViewPU.createRecycle(componentCall, recycleNode !== null, "TestBuilderReusable", () => {
                    if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                        recycleNode.aboutToReuseInternal();
                    }
                    else {
                        if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                            recycleNode.aboutToReuse({});
                        }
                        recycleNode.rerender();
                    }
                });
                let paramsLambda = () => {
                    return {};
                };
                componentCall.paramsGenerator_ = paramsLambda;
            }
            else {
                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
            }
            ViewStackProcessor.StopGetAccessRecording();
        });
    }
    __Common__.pop();
    __Recycle__.pop();
    Column.pop();
}
registerNamedRoute(() => new TestBuilder1(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@builder/@builderTransFormThird", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@builder/@builderTransFormThird", integratedHsp: "false" });
//# sourceMappingURL=@builderTransFormThird.js.map