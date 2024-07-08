/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.source = `
@Entry
@Component
struct CompA {
  @State @Watch("onBasketUpdated") shopBasket: Array<number> = [ 7, 12, 47, 3 ];
  @State totalPurchase: number = 0;
  @State @Watch('onPutItem') defArray: Array<string> = ['c', 'g', 't', 'z'];
  @State resultTip: string = '';

  updateTotal() : number {
    let sum = 0;
    this.shopBasket.forEach((i) => { sum += i; });
    this.totalPurchase = (sum < 100) ? sum : 0.9 * sum;
    return this.totalPurchase;
  }

  onBasketUpdated(propName: string) : void {
    animateTo({duration: 1000}, () => {
      this.updateTotal();
    })
  }

  updateTip() : string {
    let tempArray = this.defArray.slice(0, -1);
    let addItem = this.defArray[this.defArray.length -1];
    this.resultTip = tempArray.includes(addItem) ?
      'add item invalid' :
      'congratulations! add item success';
    return this.resultTip;
  }

  onPutItem(propName: string) : void {
    this.updateTip();
  }

  build() {
    Column(){
      Button("add to basket").onClick(() => {
        this.shopBasket.push(Math.round(100 * Math.random()))
      })
      Text('totalPurchase: ' + this.totalPurchase).fontSize(20)
      Button("put item").onClick(() => {
        let alList = 'abcdefghijklmnopqrstuvwxyz';
        let ranItem = alList[Math.floor(Math.random() * 26)];
        this.defArray.push(ranItem)
      })
      Text('tips: ' + this.resultTip).fontSize(20)
    }
  }
}
`
exports.expectResult =
`"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
if (PUV2ViewBase.contextStack === undefined) {
    Reflect.set(PUV2ViewBase, "contextStack", []);
}
class CompA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__shopBasket = new ObservedPropertyObjectPU([7, 12, 47, 3], this, "shopBasket");
        this.__totalPurchase = new ObservedPropertySimplePU(0, this, "totalPurchase");
        this.__defArray = new ObservedPropertyObjectPU(['c', 'g', 't', 'z'], this, "defArray");
        this.__resultTip = new ObservedPropertySimplePU('', this, "resultTip");
        this.setInitiallyProvidedValue(params);
        this.declareWatch("shopBasket", this.onBasketUpdated);
        this.declareWatch("defArray", this.onPutItem);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.shopBasket !== undefined) {
            this.shopBasket = params.shopBasket;
        }
        if (params.totalPurchase !== undefined) {
            this.totalPurchase = params.totalPurchase;
        }
        if (params.defArray !== undefined) {
            this.defArray = params.defArray;
        }
        if (params.resultTip !== undefined) {
            this.resultTip = params.resultTip;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__shopBasket.purgeDependencyOnElmtId(rmElmtId);
        this.__totalPurchase.purgeDependencyOnElmtId(rmElmtId);
        this.__defArray.purgeDependencyOnElmtId(rmElmtId);
        this.__resultTip.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__shopBasket.aboutToBeDeleted();
        this.__totalPurchase.aboutToBeDeleted();
        this.__defArray.aboutToBeDeleted();
        this.__resultTip.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get shopBasket() {
        return this.__shopBasket.get();
    }
    set shopBasket(newValue) {
        this.__shopBasket.set(newValue);
    }
    get totalPurchase() {
        return this.__totalPurchase.get();
    }
    set totalPurchase(newValue) {
        this.__totalPurchase.set(newValue);
    }
    get defArray() {
        return this.__defArray.get();
    }
    set defArray(newValue) {
        this.__defArray.set(newValue);
    }
    get resultTip() {
        return this.__resultTip.get();
    }
    set resultTip(newValue) {
        this.__resultTip.set(newValue);
    }
    updateTotal() {
        let sum = 0;
        this.shopBasket.forEach((i) => { sum += i; });
        this.totalPurchase = (sum < 100) ? sum : 0.9 * sum;
        return this.totalPurchase;
    }
    onBasketUpdated(propName) {
        Context.animateTo({ duration: 1000 }, () => {
            this.updateTotal();
        });
    }
    updateTip() {
        let tempArray = this.defArray.slice(0, -1);
        let addItem = this.defArray[this.defArray.length - 1];
        this.resultTip = tempArray.includes(addItem) ?
            'add item invalid' :
            'congratulations! add item success';
        return this.resultTip;
    }
    onPutItem(propName) {
        this.updateTip();
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("add to basket");
            Button.onClick(() => {
                this.shopBasket.push(Math.round(100 * Math.random()));
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('totalPurchase: ' + this.totalPurchase);
            Text.fontSize(20);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel("put item");
            Button.onClick(() => {
                let alList = 'abcdefghijklmnopqrstuvwxyz';
                let ranItem = alList[Math.floor(Math.random() * 26)];
                this.defArray.push(ranItem);
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('tips: ' + this.resultTip);
            Text.fontSize(20);
        }, Text);
        Text.pop();
        Column.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new CompA(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
