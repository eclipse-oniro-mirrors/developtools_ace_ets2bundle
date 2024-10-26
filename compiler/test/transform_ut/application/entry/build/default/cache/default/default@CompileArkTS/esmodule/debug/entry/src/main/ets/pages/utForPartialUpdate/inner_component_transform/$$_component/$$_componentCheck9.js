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
class SheetSizeExample1 extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__detents = new ObservedPropertyObjectPU([SheetSize.MEDIUM, SheetSize.LARGE, SheetSize.FIT_CONTENT], this, "detents");
        this.__isShow = new ObservedPropertySimplePU(false, this, "isShow");
        this.__dismiss = new ObservedPropertySimplePU("Init", this, "dismiss");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.detents !== undefined) {
            this.detents = params.detents;
        }
        if (params.isShow !== undefined) {
            this.isShow = params.isShow;
        }
        if (params.dismiss !== undefined) {
            this.dismiss = params.dismiss;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__detents.purgeDependencyOnElmtId(rmElmtId);
        this.__isShow.purgeDependencyOnElmtId(rmElmtId);
        this.__dismiss.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__detents.aboutToBeDeleted();
        this.__isShow.aboutToBeDeleted();
        this.__dismiss.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get detents() {
        return this.__detents.get();
    }
    set detents(newValue) {
        this.__detents.set(newValue);
    }
    get isShow() {
        return this.__isShow.get();
    }
    set isShow(newValue) {
        this.__isShow.set(newValue);
    }
    get dismiss() {
        return this.__dismiss.get();
    }
    set dismiss(newValue) {
        this.__dismiss.set(newValue);
    }
    myBuilder(parent = null) {
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.justifyContent(FlexAlign.Start);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("transition modal 1");
            Button.bindSheet({ value: this.isShow, changeEvent: newValue => { this.isShow = newValue; } }, { builder: () => {
                    this.myBuilder.call(this);
                } }, {
                detents: this.detents,
                backgroundColor: Color.Gray,
                blurStyle: BlurStyle.Thick,
                showClose: true,
                title: { title: "title", subtitle: "subtitle" },
                preferType: SheetType.CENTER,
                shouldDismiss: ((sheetDismiss) => {
                    console.log("bind sheet shouldDismiss");
                    sheetDismiss.dismiss();
                    this.dismiss = "dismiss succ";
                })
            });
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "SheetSizeExample1";
    }
}
registerNamedRoute(() => new SheetSizeExample1(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/$$_component/$$_componentCheck9", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/$$_component/$$_componentCheck9", integratedHsp: "false" });
//# sourceMappingURL=$$_componentCheck9.js.map