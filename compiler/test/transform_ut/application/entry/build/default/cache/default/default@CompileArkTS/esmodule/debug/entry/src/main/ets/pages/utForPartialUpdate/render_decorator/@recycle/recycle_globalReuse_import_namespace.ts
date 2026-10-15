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
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
import * as A from '../../../../test/CommonReusableComponent';
class reuseTestDemo extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__flag = new ObservedPropertySimplePU(true, this, "flag");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.flag !== undefined) {
            this.flag = params.flag;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__flag.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__flag.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get flag() {
        return this.__flag.get();
    }
    set flag(newValue) {
        this.__flag.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            __Recycle__.create();
        }, __Recycle__);
        {
            if (this.__isGlobalPoolActive__Internal) {
                Reusable(A.ReusableComponentV1);
            }
            this.observeRecycleComponentCreation("ReusableComponentV1", (elmtId, isInitialRender, recycleNode = null, isPreRender = false) => {
                ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                if (isInitialRender) {
                    let componentCall = recycleNode ? recycleNode : new A.ReusableComponentV1(this, {}, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_import_namespace.ets", line: 25, col: 13 });
                    if (this.__isGlobalPoolActive__Internal) {
                        let paramsLambda = () => {
                            return {};
                        };
                        componentCall.paramsGenerator_ = paramsLambda;
                    }
                    ViewPU.createRecycle(componentCall, isPreRender ? recycleNode == null : recycleNode !== null, "ReusableComponentV1", () => {
                        if (this.__isGlobalPoolActive__Internal && this.__pushRecycleElmtIdToRenderStack__Internal && typeof this.__pushRecycleElmtIdToRenderStack__Internal === "function") {
                            this.__pushRecycleElmtIdToRenderStack__Internal(recycleNode?.id__());
                        }
                        if (recycleNode && typeof recycleNode.aboutToReuseInternal === "function") {
                            recycleNode.aboutToReuseInternal();
                        }
                        else {
                            if (recycleNode.aboutToReuse && typeof recycleNode.aboutToReuse === "function") {
                                recycleNode.aboutToReuse({});
                            }
                            recycleNode.rerender();
                        }
                        if (this.__isGlobalPoolActive__Internal && this.__popRecycleElmtIdFromRenderStack__Internal && typeof this.__popRecycleElmtIdFromRenderStack__Internal === "function") {
                            this.__popRecycleElmtIdFromRenderStack__Internal();
                        }
                    });
                    if (!this.__isGlobalPoolActive__Internal) {
                        let paramsLambda = () => {
                            return {};
                        };
                        componentCall.paramsGenerator_ = paramsLambda;
                    }
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
                ViewStackProcessor.StopGetAccessRecording();
            }, A.ReusableComponentV1);
        }
        __Recycle__.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    __resetStateVarsOnReuse__Internal(params) {
    }
    static getEntryName() {
        return "reuseTestDemo";
    }
}
registerNamedRoute(() => new reuseTestDemo(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_import_namespace", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycle_globalReuse_import_namespace", integratedHsp: "false", moduleType: "followWithHap" });
//# sourceMappingURL=recycle_globalReuse_import_namespace.js.map