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
class SwipeGestureExample extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__rotateAngle = new ObservedPropertySimplePU(0, this, "rotateAngle");
        this.__speed = new ObservedPropertySimplePU(1, this, "speed");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.rotateAngle !== undefined) {
            this.rotateAngle = params.rotateAngle;
        }
        if (params.speed !== undefined) {
            this.speed = params.speed;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__rotateAngle.purgeDependencyOnElmtId(rmElmtId);
        this.__speed.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__rotateAngle.aboutToBeDeleted();
        this.__speed.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get rotateAngle() {
        return this.__rotateAngle.get();
    }
    set rotateAngle(newValue) {
        this.__rotateAngle.set(newValue);
    }
    get speed() {
        return this.__speed.get();
    }
    set speed(newValue) {
        this.__speed.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.border({ width: 2 });
            Column.width(260);
            Column.height(260);
            Column.rotate({ x: 0, y: 0, z: 1, angle: this.rotateAngle });
            Gesture.create(GesturePriority.Low);
            SwipeGesture.create({ fingers: 1, direction: SwipeDirection.Vertical });
            SwipeGesture.onAction((event) => {
                this.speed = event.speed;
                this.rotateAngle = event.angle;
            });
            SwipeGesture.pop();
            Gesture.pop();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("SwipGesture speed : " + this.speed);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("SwipGesture angle : " + this.rotateAngle);
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "SwipeGestureExample";
    }
}
registerNamedRoute(() => new SwipeGestureExample(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/gesture_component/swipeGesture", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/gesture_component/swipeGesture", integratedHsp: "false" });
//# sourceMappingURL=swipeGesture.js.map