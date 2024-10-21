"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
function aa() {
    return 'red';
}
function dd() {
    return {
        ee: 30
    };
}
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__applyToAll = new ObservedPropertySimplePU(false, this, "applyToAll");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.applyToAll !== undefined) {
            this.applyToAll = params.applyToAll;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__applyToAll.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__applyToAll.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get applyToAll() {
        return this.__applyToAll.get();
    }
    set applyToAll(newValue) {
        this.__applyToAll.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (1) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Row.create();
                    }, Row);
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Checkbox.create();
                        Checkbox.select(this.applyToAll, newValue => { this.applyToAll = newValue; });
                        Checkbox.shape(CheckBoxShape.ROUNDED_SQUARE);
                        Checkbox.selectedColor(xx());
                        Checkbox.unselectedColor(bb().cc);
                        Checkbox.mark({
                            strokeColor: aa()
                        });
                        Checkbox.width(150);
                        Checkbox.height(100);
                        Checkbox.backgroundColor(Color.Pink);
                        Checkbox.width(150);
                        Checkbox.height(100);
                        Checkbox.backgroundColor(Color.Pink);
                        Checkbox.mark({
                            strokeColor: 'red'
                        });
                        Checkbox.width(dd().ee);
                        Checkbox.height(30);
                    }, Checkbox);
                    Checkbox.pop();
                    Row.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(1, () => {
                });
            }
        }, If);
        If.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "Index";
    }
}
function xx() {
    return 'red';
}
function bb() {
    return {
        cc: 'red'
    };
}
registerNamedRoute(() => new Index(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/$$_component/$$_componentCheck8", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/$$_component/$$_componentCheck8", integratedHsp: "false" });
//# sourceMappingURL=$$_componentCheck8.js.map