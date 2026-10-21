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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
import * as A from '../../../../test/CommonReusableV2Component';
class reuseTestDemo extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.flag = true;
        this.finalizeConstruction();
    }
    resetStateVarsOnReuse(params) {
        this.flag = true;
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        {
            this.reuseOrCreateNewComponent({
                componentClass: A.ReusableComponentV2,
                getParams: () => ({}),
                getReuseId: getUINativeModule().common.getApiTargetVersion() >= 26 ? () => "ReusableComponentV2" : () => "ReusableComponentV2",
                extraInfo: { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycleV2_import_namespace.ets", line: 25, col: 13 }
            });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "reuseTestDemo";
    }
}
__decorate([
Local
], reuseTestDemo.prototype, "flag", void 0);
registerNamedRoute(() => new reuseTestDemo(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/render_decorator/@recycle/recycleV2_import_namespace", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/render_decorator/@recycle/recycleV2_import_namespace", integratedHsp: "false", moduleType: "followWithHap" });
//# sourceMappingURL=recycleV2_import_namespace.js.map