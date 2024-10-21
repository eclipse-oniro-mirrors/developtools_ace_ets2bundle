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
let NextID = 0;
let ClassA = class ClassA {
    constructor(c) {
        this.id = NextID++;
        this.c = c;
    }
};
ClassA = __decorate([
    Observed
], ClassA);
let ClassB = class ClassB {
    constructor(a) {
        this.a = a;
    }
};
ClassB = __decorate([
    Observed
], ClassB);
class ViewA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__varA = new SynchedPropertyNesedObjectPU(params.varA, this, "varA");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        this.__varA.set(params.varA);
    }
    updateStateVars(params) {
        this.__varA.set(params.varA);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__varA.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__varA.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get varA() {
        return this.__varA.get();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('ViewA-' + this.varA.id);
        }, Text);
        Text.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class ViewB extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__varB = new ObservedPropertyObjectPU(new ClassB(new ClassA(0)), this, "varB");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.varB !== undefined) {
            this.varB = params.varB;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__varB.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__varB.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get varB() {
        return this.__varB.get();
    }
    set varB(newValue) {
        this.__varB.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new ViewA(this, { varA: this.varB.a }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/ui_state_management/others/@observed_@objectLink/@observed_@objectLink.ets", line: 36, col: 9 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            varA: this.varB.a
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        varA: this.varB.a
                    });
                }
            }, { name: "ViewA" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('ViewB');
        }, Text);
        Text.pop();
        Row.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "ViewB";
    }
}
registerNamedRoute(() => new ViewB(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/ui_state_management/others/@observed_@objectLink/@observed_@objectLink", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/ui_state_management/others/@observed_@objectLink/@observed_@objectLink", integratedHsp: "false" });
//# sourceMappingURL=@observed_@objectLink.js.map