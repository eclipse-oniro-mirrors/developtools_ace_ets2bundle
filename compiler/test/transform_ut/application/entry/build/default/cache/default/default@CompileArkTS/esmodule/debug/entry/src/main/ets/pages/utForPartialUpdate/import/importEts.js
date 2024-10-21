if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
import LinkComponentDefault, { LinkComponent as LinkComponent1Ref, LinkComponent2 as LinkComponent2Ref, LinkComponent3 } from '../../../test/LinkComponent';
import DefaultComponent from "../../../test/DefaultComponent";
import AMDComponentDefault from '../../../test/AMDComponent';
import TsModule from '../../../test/TsModule';
class ImportTest extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__myState1 = new ObservedPropertyObjectPU(new TsModule(1).method(), this, "myState1");
        this.__myState2 = new ObservedPropertySimplePU(0, this, "myState2");
        this.__myState3 = new ObservedPropertySimplePU(false, this, "myState3");
        this.__myState4 = new ObservedPropertySimplePU('ImportTest', this, "myState4");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.myState1 !== undefined) {
            this.myState1 = params.myState1;
        }
        if (params.myState2 !== undefined) {
            this.myState2 = params.myState2;
        }
        if (params.myState3 !== undefined) {
            this.myState3 = params.myState3;
        }
        if (params.myState4 !== undefined) {
            this.myState4 = params.myState4;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__myState1.purgeDependencyOnElmtId(rmElmtId);
        this.__myState2.purgeDependencyOnElmtId(rmElmtId);
        this.__myState3.purgeDependencyOnElmtId(rmElmtId);
        this.__myState4.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__myState1.aboutToBeDeleted();
        this.__myState2.aboutToBeDeleted();
        this.__myState3.aboutToBeDeleted();
        this.__myState4.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get myState1() {
        return this.__myState1.get();
    }
    set myState1(newValue) {
        this.__myState1.set(newValue);
    }
    get myState2() {
        return this.__myState2.get();
    }
    set myState2(newValue) {
        this.__myState2.set(newValue);
    }
    get myState3() {
        return this.__myState3.get();
    }
    set myState3(newValue) {
        this.__myState3.set(newValue);
    }
    get myState4() {
        return this.__myState4.get();
    }
    set myState4(newValue) {
        this.__myState4.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new LinkComponent2Ref(this, {
                        LinkComponent2Link1: this.__myState1,
                        LinkComponent2Link2: this.__myState2,
                        LinkComponent2Link3: this.__myState3,
                        LinkComponent2Link4: this.__myState4,
                        indexState1: { count: 1 },
                        indexState2: 1,
                        indexState3: true,
                        indexState4: 'LinkComponent2'
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 21, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            LinkComponent2Link1: this.myState1,
                            LinkComponent2Link2: this.myState2,
                            LinkComponent2Link3: this.myState3,
                            LinkComponent2Link4: this.myState4,
                            indexState1: { count: 1 },
                            indexState2: 1,
                            indexState3: true,
                            indexState4: 'LinkComponent2'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LinkComponent2Ref" });
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('space');
            Text.fontSize(20);
            Text.fontColor(Color.Red);
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new LinkComponent1Ref(this, {
                        LinkComponent1Link1: this.__myState1,
                        LinkComponent1Link2: this.__myState2,
                        LinkComponent1Link3: this.__myState3,
                        LinkComponent1Link4: this.__myState4,
                        indexState1: { count: 1 },
                        indexState2: 1,
                        indexState3: true,
                        indexState4: 'LinkComponent1'
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 34, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            LinkComponent1Link1: this.myState1,
                            LinkComponent1Link2: this.myState2,
                            LinkComponent1Link3: this.myState3,
                            LinkComponent1Link4: this.myState4,
                            indexState1: { count: 1 },
                            indexState2: 1,
                            indexState3: true,
                            indexState4: 'LinkComponent1'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LinkComponent1Ref" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new DefaultComponent(this, {
                        DefaultComponentLink1: this.__myState1,
                        DefaultComponentLink2: this.__myState2,
                        DefaultComponentLink3: this.__myState3,
                        DefaultComponentLink4: this.__myState4,
                        myVar: 100,
                        myVar2: 100
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 44, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            DefaultComponentLink1: this.myState1,
                            DefaultComponentLink2: this.myState2,
                            DefaultComponentLink3: this.myState3,
                            DefaultComponentLink4: this.myState4,
                            myVar: 100,
                            myVar2: 100
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "DefaultComponent" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new LinkComponentDefault(this, {
                        LinkComponent3Link1: this.__myState1,
                        LinkComponent3Link2: this.__myState2,
                        LinkComponent3Link3: this.__myState3,
                        LinkComponent3Link4: this.__myState4,
                        indexState1: { count: 1 },
                        indexState2: 1,
                        indexState3: true,
                        indexState4: 'LinkComponent3'
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 52, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            LinkComponent3Link1: this.myState1,
                            LinkComponent3Link2: this.myState2,
                            LinkComponent3Link3: this.myState3,
                            LinkComponent3Link4: this.myState4,
                            indexState1: { count: 1 },
                            indexState2: 1,
                            indexState3: true,
                            indexState4: 'LinkComponent3'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LinkComponentDefault" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new AMDComponentDefault(this, {
                        AMDComponentLink1: this.__myState1,
                        AMDComponentLink2: this.__myState2,
                        AMDComponentLink3: this.__myState3,
                        AMDComponentLink4: this.__myState4,
                        myVar: 100,
                        myVar2: 100
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 62, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            AMDComponentLink1: this.myState1,
                            AMDComponentLink2: this.myState2,
                            AMDComponentLink3: this.myState3,
                            AMDComponentLink4: this.myState4,
                            myVar: 100,
                            myVar2: 100
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "AMDComponentDefault" });
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new LinkComponent3(this, {
                        LinkComponent3Link1: this.__myState1,
                        LinkComponent3Link2: this.__myState2,
                        LinkComponent3Link3: this.__myState3,
                        LinkComponent3Link4: this.__myState4,
                        indexState1: { count: 1 },
                        indexState2: 1,
                        indexState3: true,
                        indexState4: 'LinkComponent1'
                    }, undefined, elmtId, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts.ets", line: 70, col: 7 });
                    ViewPU.create(componentCall);
                    let paramsLambda = () => {
                        return {
                            LinkComponent3Link1: this.myState1,
                            LinkComponent3Link2: this.myState2,
                            LinkComponent3Link3: this.myState3,
                            LinkComponent3Link4: this.myState4,
                            indexState1: { count: 1 },
                            indexState2: 1,
                            indexState3: true,
                            indexState4: 'LinkComponent1'
                        };
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "LinkComponent3" });
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
registerNamedRoute(() => new ImportTest(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/import/importEts", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/import/importEts", integratedHsp: "false" });
//# sourceMappingURL=importEts.js.map