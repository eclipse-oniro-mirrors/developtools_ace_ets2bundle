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
let VehicleData = class VehicleData {
    constructor(name, price) {
        this.name = name;
        this.price = price;
    }
};
__decorate([
    Trace
], VehicleData.prototype, "name", void 0);
__decorate([
    Trace
], VehicleData.prototype, "price", void 0);
VehicleData = __decorate([
    ObservedV2
], VehicleData);
let VehicleDB = class VehicleDB {
    constructor() {
        this.vehicleItems = [];
    }
};
VehicleDB = __decorate([
    ObservedV2
], VehicleDB);
class entryCompSucc extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.vehicleItems = new VehicleDB().vehicleItems;
        this.finalizeConstruction();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create();
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Repeat(this.vehicleItems, this).template('default', (ri) => {
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create('11111111111');
                }, Text);
                Text.pop();
            }, { cachedCount: 5 })
                .each((ri) => {
                {
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(() => { }, false);
                        ListItem.border({ width: 1 });
                    };
                    const observedDeepRender = () => {
                        this.observeComponentCreation2(itemCreation2, ListItem);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create("Wrong");
                        }, Text);
                        Text.pop();
                        ListItem.pop();
                    };
                    observedDeepRender();
                }
            })
                .key((item, index) => 'index').render(isInitialRender);
        }, Repeat);
        List.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "entryCompSucc";
    }
}
__decorate([
    Local
], entryCompSucc.prototype, "vehicleItems", void 0);
registerNamedRoute(() => new entryCompSucc(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/inner_component_transform/render_component/repeat/repeatAttr", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/inner_component_transform/render_component/repeat/repeatAttr", integratedHsp: "false" });
//# sourceMappingURL=repeatAttr.js.map