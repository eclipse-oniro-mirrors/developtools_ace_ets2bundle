if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
import { tExtend, tStyles, DivideTest, Base } from '../../../test/ImportNestAll';
class ImportTest extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__testText1 = new ObservedPropertySimplePU('Hello', this, "testText1");
        this.__testText2 = new ObservedPropertySimplePU('World', this, "testText2");
        this.__testText3 = new ObservedPropertySimplePU('Test', this, "testText3");
        this.__testText4 = new ObservedPropertySimplePU('Component', this, "testText4");
        this.__testState1 = new ObservedPropertySimplePU('Base', this, "testState1");
        this.__testState2 = new ObservedPropertySimplePU(0, this, "testState2");
        this.__testState3 = new ObservedPropertyObjectPU({ name: 'Base' }, this, "testState3");
        this.__testState4 = new ObservedPropertySimplePU(3, this, "testState4");
        this.__testState5 = new ObservedPropertySimplePU(10, this, "testState5");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.testText1 !== undefined) {
            this.testText1 = params.testText1;
        }
        if (params.testText2 !== undefined) {
            this.testText2 = params.testText2;
        }
        if (params.testText3 !== undefined) {
            this.testText3 = params.testText3;
        }
        if (params.testText4 !== undefined) {
            this.testText4 = params.testText4;
        }
        if (params.testState1 !== undefined) {
            this.testState1 = params.testState1;
        }
        if (params.testState2 !== undefined) {
            this.testState2 = params.testState2;
        }
        if (params.testState3 !== undefined) {
            this.testState3 = params.testState3;
        }
        if (params.testState4 !== undefined) {
            this.testState4 = params.testState4;
        }
        if (params.testState5 !== undefined) {
            this.testState5 = params.testState5;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__testText1.purgeDependencyOnElmtId(rmElmtId);
        this.__testText2.purgeDependencyOnElmtId(rmElmtId);
        this.__testText3.purgeDependencyOnElmtId(rmElmtId);
        this.__testText4.purgeDependencyOnElmtId(rmElmtId);
        this.__testState1.purgeDependencyOnElmtId(rmElmtId);
        this.__testState2.purgeDependencyOnElmtId(rmElmtId);
        this.__testState3.purgeDependencyOnElmtId(rmElmtId);
        this.__testState4.purgeDependencyOnElmtId(rmElmtId);
        this.__testState5.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__testText1.aboutToBeDeleted();
        this.__testText2.aboutToBeDeleted();
        this.__testText3.aboutToBeDeleted();
        this.__testText4.aboutToBeDeleted();
        this.__testState1.aboutToBeDeleted();
        this.__testState2.aboutToBeDeleted();
        this.__testState3.aboutToBeDeleted();
        this.__testState4.aboutToBeDeleted();
        this.__testState5.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get testText1() {
        return this.__testText1.get();
    }
    set testText1(newValue) {
        this.__testText1.set(newValue);
    }
    get testText2() {
        return this.__testText2.get();
    }
    set testText2(newValue) {
        this.__testText2.set(newValue);
    }
    get testText3() {
        return this.__testText3.get();
    }
    set testText3(newValue) {
        this.__testText3.set(newValue);
    }
    get testText4() {
        return this.__testText4.get();
    }
    set testText4(newValue) {
        this.__testText4.set(newValue);
    }
    get testState1() {
        return this.__testState1.get();
    }
    set testState1(newValue) {
        this.__testState1.set(newValue);
    }
    get testState2() {
        return this.__testState2.get();
    }
    set testState2(newValue) {
        this.__testState2.set(newValue);
    }
    get testState3() {
        return this.__testState3.get();
    }
    set testState3(newValue) {
        this.__testState3.set(newValue);
    }
    get testState4() {
        return this.__testState4.get();
    }
    set testState4(newValue) {
        this.__testState4.set(newValue);
    }
    get testState5() {
        return this.__testState5.get();
    }
    set testState5(newValue) {
        this.__testState5.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.testText1);
            Text.fontSize(50);
        }, Text);
        Text.pop();
        tExtend.bind(this)(20);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.testText2);
        }, Text);
        Text.pop();
        tStyles.bind(this)();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.testText3);
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.testText4);
            Text.fontSize(50);
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new Base(this, {
                        testStr: this.__testState1,
                        testNum: this.__testState2,
                        testObj: this.__testState3
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importExportNest.ets", line: 28, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            testStr: this.testState1,
                            testNum: this.testState2,
                            testObj: this.testState3
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "Base" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new DivideTest(this, {
                        testNum1: this.__testState4,
                        testNum2: this.__testState5
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importExportNest.ets", line: 33, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            testNum1: this.testState4,
                            testNum2: this.testState5
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "DivideTest" });
        }
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "ImportTest";
    }
}
registerNamedRoute(() => new ImportTest(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/import/importExportNest", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/import/importExportNest", integratedHsp: "false" });
//# sourceMappingURL=importExportNest.js.map