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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
var nextID = 0;
let Model = class Model {
    constructor(t, c) {
        this.text = '';
        this.color = '#00ff00';
        this.text = t;
        this.color = c;
    }
};
Model = __decorate([
    Observed
], Model);
class CustomText extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__model = new SynchedPropertyNesedObjectPU(params.model, this, "model");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        this.__model.set(params.model);
    }
    updateStateVars(params) {
        this.__model.set(params.model);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__model.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__model.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get model() {
        return this.__model.get();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.model.text);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class Parent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.nextId = 1;
        this.__models = new ObservedPropertyObjectPU([new Model('0', '#ffffff'), new Model('1', '#fff456')], this, "models");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.nextId !== undefined) {
            this.nextId = params.nextId;
        }
        if (params.models !== undefined) {
            this.models = params.models;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__models.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__models.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get models() {
        return this.__models.get();
    }
    set models(newValue) {
        this.__models.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let componentCall = new CustomText(this, { model: item }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/ui_state_management/inner_struct_state_management/@objectLink/@objectLink.ets", line: 44, col: 11 });
                            ViewPU.create(componentCall);
                            let paramsLambda = () => {
                                return {
                                    model: item
                                };
                            };
                            componentCall.paramsGenerator_ = paramsLambda;
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                model: item
                            });
                        }
                    }, { name: "CustomText" });
                }
            };
            this.forEachUpdateFunction(elmtId, this.models, forEachItemGenFunction, (item) => item.text, false, false);
        }, ForEach);
        ForEach.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "Parent";
    }
}
registerNamedRoute(() => new Parent(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/ui_state_management/inner_struct_state_management/@objectLink/@objectLink", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/ui_state_management/inner_struct_state_management/@objectLink/@objectLink", integratedHsp: "false" });
//# sourceMappingURL=@objectLink.js.map