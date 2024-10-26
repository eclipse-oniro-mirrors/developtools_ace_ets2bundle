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
function animatablePoints(points, elmtId, isInitialRender, parent) {
    if (isInitialRender) {
        Polyline.createAnimatableProperty("animatablePoints", points, (points) => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            ViewStackProcessor.GetAndPushFrameNode("Polyline", elmtId);
            Polyline.strokeOpacity(points);
            Polyline.backgroundColor(Color.Red);
            ViewStackProcessor.StopGetAccessRecording();
            parent.finishUpdateFunc(elmtId);
        });
        Polyline.strokeOpacity(points);
        Polyline.backgroundColor(Color.Red);
    }
    else {
        Polyline.updateAnimatableProperty("animatablePoints", points);
    }
}
function attributeExtend(elmtId, isInitialRender, parent) {
    if (isInitialRender) {
        Text.createAnimatableProperty("attributeExtend", () => {
            ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
            ViewStackProcessor.GetAndPushFrameNode("Text", elmtId);
            Text.fontSize(50);
            ViewStackProcessor.StopGetAccessRecording();
            parent.finishUpdateFunc(elmtId);
        });
        Text.fontSize(50);
    }
    else {
        Text.updateAnimatableProperty("attributeExtend");
    }
}
class HomeComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.points = 1;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.points !== undefined) {
            this.points = params.points;
        }
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
            Polyline.create();
            animatablePoints(this.points, elmtId, isInitialRender, this);
            Polyline.strokeWidth(3);
            Polyline.height(100);
            Polyline.width(100);
        }, Polyline);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
            attributeExtend(elmtId, isInitialRender, this);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "HomeComponent";
    }
}
registerNamedRoute(() => new HomeComponent(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@AnimatableExtend/animatableExtend", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@AnimatableExtend/animatableExtend", integratedHsp: "false" });
//# sourceMappingURL=animatableExtend.js.map