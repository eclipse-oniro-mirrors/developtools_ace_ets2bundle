"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class BasicDataSource {
    constructor() {
        this.listeners = [];
    }
    totalCount() {
        return 0;
    }
    getData(index) {
        return undefined;
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
        this.dataArray = ['/path/image0', '/path/image1', '/path/image2', '/path/image3'];
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
class Test extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.data = new MyDataSource();
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.data !== undefined) {
            this.data = params.data;
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Grid.create();
        }, Grid);
        {
            const __lazyForEachItemGenFunction = _item => {
                const row = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        GridItem.create(() => { }, false);
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, GridItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(row);
                        }, Text);
                        Text.pop();
                        GridItem.pop();
                    };
                    observedDeepRender();
                }
            };
            const __lazyForEachItemIdFunc = row => row;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.pop();
        }
        Grid.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "Test";
    }
}
class ChildTest extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.data = new MyDataSource();
        this.count = 0;
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.data !== undefined) {
            this.data = params.data;
        }
        if (params.count !== undefined) {
            this.count = params.count;
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
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Grid.create();
        }, Grid);
        {
            const __lazyForEachItemGenFunction = _item => {
                const row = _item;
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        GridItem.create(() => { }, false);
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, GridItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create(row);
                        }, Text);
                        Text.pop();
                        GridItem.pop();
                    };
                    observedDeepRender();
                }
            };
            const __lazyForEachItemIdFunc = row => row;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.onMove((from, to) => {
                this.count += 1;
            });
            LazyForEach.pop();
        }
        Grid.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
registerNamedRoute(() => new Test(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/render_component/lazyforeach/lazyforeach", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/render_component/lazyforeach/lazyforeach", integratedHsp: "false" });
//# sourceMappingURL=lazyforeach.js.map