let __generate__Id = 0;
function generateId() {
    return "importEts_" + ++__generate__Id;
}
import LinkComponentDefault, { LinkComponent as LinkComponent1Ref, LinkComponent2 as LinkComponent2Ref, LinkComponent3 } from '../../../test/LinkComponent';
import DefaultComponent from "../../../test/DefaultComponent";
import AMDComponentDefault from '../../../test/AMDComponent';
import TsModule from '../../../test/TsModule';
class ImportTest extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.__myState1 = new ObservedPropertyObject(new TsModule(1).method(), this, "myState1");
        this.__myState2 = new ObservedPropertySimple(0, this, "myState2");
        this.__myState3 = new ObservedPropertySimple(false, this, "myState3");
        this.__myState4 = new ObservedPropertySimple('ImportTest', this, "myState4");
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params) {
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
    aboutToBeDeleted() {
        this.__myState1.aboutToBeDeleted();
        this.__myState2.aboutToBeDeleted();
        this.__myState3.aboutToBeDeleted();
        this.__myState4.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id());
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
    render() {
        Column.create();
        let earlierCreatedChild_2 = (this && this.findChildById) ? this.findChildById("2") : undefined;
        if (earlierCreatedChild_2 == undefined) {
            View.create(new LinkComponent2Ref("2", this, {
                LinkComponent2Link1: this.__myState1,
                LinkComponent2Link2: this.__myState2,
                LinkComponent2Link3: this.__myState3,
                LinkComponent2Link4: this.__myState4,
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent2'
            }));
        }
        else {
            earlierCreatedChild_2.updateWithValueParams({
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent2'
            });
            View.create(earlierCreatedChild_2);
        }
        Text.create('space');
        Text.fontSize(20);
        Text.fontColor(Color.Red);
        Text.pop();
        let earlierCreatedChild_3 = (this && this.findChildById) ? this.findChildById("3") : undefined;
        if (earlierCreatedChild_3 == undefined) {
            View.create(new LinkComponent1Ref("3", this, {
                LinkComponent1Link1: this.__myState1,
                LinkComponent1Link2: this.__myState2,
                LinkComponent1Link3: this.__myState3,
                LinkComponent1Link4: this.__myState4,
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent1'
            }));
        }
        else {
            earlierCreatedChild_3.updateWithValueParams({
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent1'
            });
            View.create(earlierCreatedChild_3);
        }
        let earlierCreatedChild_4 = (this && this.findChildById) ? this.findChildById("4") : undefined;
        if (earlierCreatedChild_4 == undefined) {
            View.create(new DefaultComponent("4", this, {
                DefaultComponentLink1: this.__myState1,
                DefaultComponentLink2: this.__myState2,
                DefaultComponentLink3: this.__myState3,
                DefaultComponentLink4: this.__myState4,
                myVar: 100,
                myVar2: 100
            }));
        }
        else {
            earlierCreatedChild_4.updateWithValueParams({
                myVar: 100,
                myVar2: 100
            });
            View.create(earlierCreatedChild_4);
        }
        let earlierCreatedChild_5 = (this && this.findChildById) ? this.findChildById("5") : undefined;
        if (earlierCreatedChild_5 == undefined) {
            View.create(new LinkComponentDefault("5", this, {
                LinkComponent3Link1: this.__myState1,
                LinkComponent3Link2: this.__myState2,
                LinkComponent3Link3: this.__myState3,
                LinkComponent3Link4: this.__myState4,
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent3'
            }));
        }
        else {
            earlierCreatedChild_5.updateWithValueParams({
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent3'
            });
            View.create(earlierCreatedChild_5);
        }
        let earlierCreatedChild_6 = (this && this.findChildById) ? this.findChildById("6") : undefined;
        if (earlierCreatedChild_6 == undefined) {
            View.create(new AMDComponentDefault("6", this, {
                AMDComponentLink1: this.__myState1,
                AMDComponentLink2: this.__myState2,
                AMDComponentLink3: this.__myState3,
                AMDComponentLink4: this.__myState4,
                myVar: 100,
                myVar2: 100
            }));
        }
        else {
            earlierCreatedChild_6.updateWithValueParams({
                myVar: 100,
                myVar2: 100
            });
            View.create(earlierCreatedChild_6);
        }
        let earlierCreatedChild_7 = (this && this.findChildById) ? this.findChildById("7") : undefined;
        if (earlierCreatedChild_7 == undefined) {
            View.create(new LinkComponent3("7", this, {
                LinkComponent3Link1: this.__myState1,
                LinkComponent3Link2: this.__myState2,
                LinkComponent3Link3: this.__myState3,
                LinkComponent3Link4: this.__myState4,
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent1'
            }));
        }
        else {
            earlierCreatedChild_7.updateWithValueParams({
                indexState1: { count: 1 },
                indexState2: 1,
                indexState3: true,
                indexState4: 'LinkComponent1'
            });
            View.create(earlierCreatedChild_7);
        }
        Column.pop();
    }
}
loadDocument(new ImportTest("1", undefined, {}));
//# sourceMappingURL=importEts.js.map