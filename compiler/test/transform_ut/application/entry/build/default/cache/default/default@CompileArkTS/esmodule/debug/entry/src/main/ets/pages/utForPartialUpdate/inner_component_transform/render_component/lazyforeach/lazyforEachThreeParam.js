"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class BasicDataSource {
    constructor() {
        this.listeners = [];
        this.originDataArray = [];
    }
    totalCount() {
        return 0;
    }
    getData(index) {
        return this.originDataArray[index];
    }
    registerDataChangeListener(listener) {
        if (this.listeners.indexOf(listener) < 0) {
            console.info('add listener');
            this.listeners.push(listener);
        }
    }
    unregisterDataChangeListener(listener) {
        const pos = this.listeners.indexOf(listener);
        if (pos >= 0) {
            console.info('remove listener');
            this.listeners.splice(pos, 1);
        }
    }
    notifyDataReload() {
        this.listeners.forEach(listener => {
            listener.onDataReloaded();
        });
    }
    notifyDataAdd(index) {
        this.listeners.forEach(listener => {
            listener.onDataAdd(index);
        });
    }
    notifyDataChange(index) {
        this.listeners.forEach(listener => {
            listener.onDataChange(index);
        });
    }
    notifyDataDelete(index) {
        this.listeners.forEach(listener => {
            listener.onDataDelete(index);
        });
    }
    notifyDataMove(from, to) {
        this.listeners.forEach(listener => {
            listener.onDataMove(from, to);
        });
    }
}
class MyDataSource extends BasicDataSource {
    constructor() {
        super(...arguments);
        this.dataArray = [];
    }
    totalCount() {
        return this.dataArray.length;
    }
    getData(index) {
        return this.dataArray[index];
    }
    addData(index, data) {
        this.dataArray.splice(index, 0, data);
        this.notifyDataAdd(index);
    }
    pushData(data) {
        this.dataArray.push(data);
        this.notifyDataAdd(this.dataArray.length - 1);
    }
}
let mKeyGenerator2 = (item, index) => 'item' + index;
class lazyforEachThreeParam extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.data = new MyDataSource();
        this.mKeyGenerator = undefined;
        this.mKeyGenerator1 = (item, index) => 'item' + index;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.data !== undefined) {
            this.data = params.data;
        }
        if (params.mKeyGenerator !== undefined) {
            this.mKeyGenerator = params.mKeyGenerator;
        }
        if (params.mKeyGenerator1 !== undefined) {
            this.mKeyGenerator1 = params.mKeyGenerator1;
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
    aboutToAppear() {
        for (let i = 0; i <= 20; i++) {
            this.data.pushData('11');
        }
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create({ space: 3 });
            List.cachedCount(5);
        }, List);
        {
            const __lazyForEachItemGenFunction = _item => {
                const item = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(() => { }, false);
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, ListItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.margin({ left: 10, right: 10 });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item);
                            Text.fontSize(50);
                            Text.onAppear(() => {
                                console.info("appear:" + item);
                            });
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    observedDeepRender();
                }
            };
            const __lazyForEachItemIdFunc = this.mKeyGenerator;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.pop();
        }
        {
            const __lazyForEachItemGenFunction = _item => {
                const item = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(() => { }, false);
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, ListItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.margin({ left: 10, right: 10 });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item);
                            Text.fontSize(50);
                            Text.onAppear(() => {
                                console.info("appear:" + item);
                            });
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    observedDeepRender();
                }
            };
            const __lazyForEachItemIdFunc = this.mKeyGenerator1;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.pop();
        }
        {
            const __lazyForEachItemGenFunction = _item => {
                const item = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(() => { }, false);
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, ListItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Row.create();
                            Row.margin({ left: 10, right: 10 });
                        }, Row);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(item);
                            Text.fontSize(50);
                            Text.onAppear(() => {
                                console.info("appear:" + item);
                            });
                        }, Text);
                        Text.pop();
                        Row.pop();
                        ListItem.pop();
                    };
                    observedDeepRender();
                }
            };
            const __lazyForEachItemIdFunc = mKeyGenerator2;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.pop();
        }
        List.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "lazyforEachThreeParam";
    }
}
registerNamedRoute(() => new lazyforEachThreeParam(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/render_component/lazyforeach/lazyforEachThreeParam", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/render_component/lazyforeach/lazyforEachThreeParam", integratedHsp: "false" });
//# sourceMappingURL=lazyforEachThreeParam.js.map