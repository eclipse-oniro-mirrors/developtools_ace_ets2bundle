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
function global(parent = null) {
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender) => {
        Text.create('Global Builder');
    }, Text);
    Text.pop();
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.judge = true;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.judge !== undefined) {
            this.judge = params.judge;
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
    inner(param, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Inner Builder Text');
            Text.bindPopup(false, {
                onStateChange: (e) => { },
                builder: { builder: () => {
                        global.call(this);
                    } }
            });
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Inner Builder Text2');
            Text.bindPopup(false, {
                onStateChange: (e) => { },
                builder: this.judge ? { builder: global.bind(this) } : undefined
            });
        }, Text);
        Text.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.bindMenu({ builder: () => {
                    this.inner.call(this, "111");
                } });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.bindMenu(this.judge ? { builder: () => {
                    this.inner.call(this, "111");
                } } : { builder: global.bind(this) });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.onDragStart((event, extraParams) => {
                console.log('Text onDragStarts, ' + extraParams);
                return this.judge ? { builder: this.inner.bind(this) } : { builder: () => {
                        global.call(this);
                    } };
            });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.onDragStart((event, extraParams) => {
                console.log('Text onDragStarts, ' + extraParams);
                return { builder: this.judge ? { builder: () => {
                            this.inner.call(this);
                        } } : undefined };
            });
        }, Row);
        Row.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('Text');
            Text.bindPopup(false, {
                onStateChange: (e) => { },
                builder: undefined
            });
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "Index";
    }
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@builder/handleCustomBuilder", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@builder/handleCustomBuilder", integratedHsp: "false" });
//# sourceMappingURL=handleCustomBuilder.js.map