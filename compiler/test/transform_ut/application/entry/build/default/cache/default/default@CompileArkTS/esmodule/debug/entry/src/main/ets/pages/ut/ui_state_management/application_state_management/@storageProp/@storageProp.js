"use strict";
let __generate__Id = 0;
function generateId() {
    return "@storageProp_" + ++__generate__Id;
}
let varA = AppStorage.Link('varA');
let envLang = AppStorage.Prop('languageCode');
class MyComponent extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__varA = AppStorage.SetAndLink('varA', 2, this, "varA");
        this.__lang = AppStorage.SetAndProp('languageCode', 'en', this, "lang");
        this.label = 'count';
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params) {
        if (params.label !== undefined) {
            this.label = params.label;
        }
    }
    aboutToBeDeleted() {
        this.__varA.aboutToBeDeleted();
        this.__lang.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
    }
    get varA() {
        return this.__varA.get();
    }
    set varA(newValue) {
        this.__varA.set(newValue);
    }
    get lang() {
        return this.__lang.get();
    }
    set lang(newValue) {
        this.__lang.set(newValue);
    }
    aboutToAppear() {
        this.label = (this.lang === 'zh') ? '数' : 'Count';
    }
    render() {
        Row.create({ space: 20 });
        Button.createWithLabel(this.label + ': ' + this.varA);
        Button.onClick(() => {
            AppStorage.Set('varA', AppStorage.Get('varA') + 1);
        });
        Button.pop();
        Button.createWithLabel('lang: ' + this.lang);
        Button.onClick(() => {
            if (this.lang === 'zh') {
                AppStorage.Set('languageCode', 'en');
            }
            else {
                AppStorage.Set('languageCode', 'zh');
            }
            this.label = (this.lang === 'zh') ? '数' : 'Count';
        });
        Button.pop();
        Row.pop();
    }
}
loadDocument(new MyComponent("1", undefined, {}));
//# sourceMappingURL=@storageProp.js.map