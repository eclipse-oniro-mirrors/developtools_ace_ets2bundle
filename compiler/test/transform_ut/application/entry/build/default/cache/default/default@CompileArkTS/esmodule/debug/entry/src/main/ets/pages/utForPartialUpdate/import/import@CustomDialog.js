if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
import { CustomDialogExample1 as CustomDialogExample } from '../../../test/import@CustomDialog';
class CustomDialogUser extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__textValue = new ObservedPropertySimplePU('', this, "textValue");
        this.__inputValue = new ObservedPropertySimplePU('click me', this, "inputValue");
        this.dialogController = new CustomDialogController({
            builder: () => {
                let jsDialog = new CustomDialogExample(this, {
                    cancel: this.onCancel,
                    confirm: this.onAccept,
                    textValue: this.__textValue,
                    inputValue: this.__inputValue
                }, undefined, -1, () => { }, { page: "test/transform_ut/application/entry/src/main/ets/pages/utForPartialUpdate/import/import@CustomDialog.ets", line: 9, col: 14 });
                jsDialog.setController(this.dialogController);
                ViewPU.create(jsDialog);
                let paramsLambda = () => {
                    return {
                        cancel: this.onCancel,
                        confirm: this.onAccept,
                        textValue: this.__textValue,
                        inputValue: this.__inputValue
                    };
                };
                jsDialog.paramsGenerator_ = paramsLambda;
            },
            cancel: this.existApp,
            autoCancel: true,
            alignment: DialogAlignment.Default,
            offset: { dx: 0, dy: -20 },
            gridCount: 4,
            customStyle: false
        }, this);
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.textValue !== undefined) {
            this.textValue = params.textValue;
        }
        if (params.inputValue !== undefined) {
            this.inputValue = params.inputValue;
        }
        if (params.dialogController !== undefined) {
            this.dialogController = params.dialogController;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__textValue.purgeDependencyOnElmtId(rmElmtId);
        this.__inputValue.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__textValue.aboutToBeDeleted();
        this.__inputValue.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get textValue() {
        return this.__textValue.get();
    }
    set textValue(newValue) {
        this.__textValue.set(newValue);
    }
    get inputValue() {
        return this.__inputValue.get();
    }
    set inputValue(newValue) {
        this.__inputValue.set(newValue);
    }
    onCancel() {
        console.info('Callback when the first button is clicked');
    }
    onAccept() {
        console.info('Callback when the second button is clicked');
    }
    existApp() {
        console.info('Click the callback in the blank area');
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
            Column.margin({ top: 5 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel(this.inputValue);
            Button.onClick(() => {
                this.dialogController.open();
            });
            Button.backgroundColor(0x317aff);
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "CustomDialogUser";
    }
}
registerNamedRoute(() => new CustomDialogUser(undefined, {}), "", { bundleName: "com.example.application", moduleName: "application", pagePath: "pages/utForPartialUpdate/import/import@CustomDialog", pageFullPath: "application/entry/src/main/ets/pages/utForPartialUpdate/import/import@CustomDialog", integratedHsp: "false" });
//# sourceMappingURL=import@CustomDialog.js.map