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
import { ClassB as ClassA } from './test/pages/import@Observed'
@Component
struct ViewA {
  label: string = 'ViewA1'
  @ObjectLink a: ClassA

  build() {
    Row() {
      Button('ViewA'+ JSON.stringify(this.label) + 'this.a.c='+JSON.stringify(this.a.c))
        .onClick(() => {
          this.a.c += 1
        })
    }.margin({ top: 10 })
  }
}

@Entry
@Component
struct ViewB {
  @State arrA: ClassA[] = [new ClassA(0), new ClassA(0)]

  build() {
    Column() {
      ForEach(this.arrA, (item) => {
        ViewA({ label: JSON.stringify(item.id), a: item })
      }, (item) => item.id.toString())
      ViewA({ label: JSON.stringify(this.arrA[0]), a: this.arrA[0] })
      ViewA({ label: JSON.stringify(this.arrA[this.arrA.length - 1]), a: this.arrA[this.arrA.length - 1] })

      Button('ViewB: reset array')
        .margin({ top: 10 })
        .onClick(() => {
          this.arrA = [new ClassA(0), new ClassA(0)]
        })
      Button('ViewB: push')
        .margin({ top: 10 })
        .onClick(() => {
          this.arrA.push(new ClassA(0))
        })
      Button('ViewB: shift')
        .margin({ top: 10 })
        .onClick(() => {
          this.arrA.shift()
        })
    }.width('100%')
  }
}
`

exports.expectResult =
`"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const import_Observed_1 = require("./test/pages/import@Observed");
class ViewA extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.label = 'ViewA1';
        this.__a = new SynchedPropertyNesedObjectPU(params.a, this, "a");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.label !== undefined) {
            this.label = params.label;
        }
        this.__a.set(params.a);
    }
    updateStateVars(params) {
        this.__a.set(params.a);
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__a.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__a.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get a() {
        return this.__a.get();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
            Row.margin({ top: 10 });
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('ViewA' + JSON.stringify(this.label) + 'this.a.c=' + JSON.stringify(this.a.c));
            Button.onClick(() => {
                this.a.c += 1;
            });
        }, Button);
        Button.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class ViewB extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__arrA = new ObservedPropertyObjectPU([new import_Observed_1.ClassB(0), new import_Observed_1.ClassB(0)], this, "arrA");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.arrA !== undefined) {
            this.arrA = params.arrA;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__arrA.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__arrA.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get arrA() {
        return this.__arrA.get();
    }
    set arrA(newValue) {
        this.__arrA.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width('100%');
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = _item => {
                const item = _item;
                {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        if (isInitialRender) {
                            let paramsLambda = () => {
                                return {
                                    label: JSON.stringify(item.id),
                                    a: item
                                };
                            };
                            ViewPU.create(new ViewA(this, { label: JSON.stringify(item.id), a: item }, undefined, elmtId, paramsLambda));
                        }
                        else {
                            this.updateStateVarsOfChildByElmtId(elmtId, {
                                a: item
                            });
                        }
                    }, null);
                }
            };
            this.forEachUpdateFunction(elmtId, this.arrA, forEachItemGenFunction, (item) => item.id.toString(), false, false);
        }, ForEach);
        ForEach.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            label: JSON.stringify(this.arrA[0]),
                            a: this.arrA[0]
                        };
                    };
                    ViewPU.create(new ViewA(this, { label: JSON.stringify(this.arrA[0]), a: this.arrA[0] }, undefined, elmtId, paramsLambda));
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        a: this.arrA[0]
                    });
                }
            }, null);
        }
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let paramsLambda = () => {
                        return {
                            label: JSON.stringify(this.arrA[this.arrA.length - 1]),
                            a: this.arrA[this.arrA.length - 1]
                        };
                    };
                    ViewPU.create(new ViewA(this, { label: JSON.stringify(this.arrA[this.arrA.length - 1]), a: this.arrA[this.arrA.length - 1] }, undefined, elmtId, paramsLambda));
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {
                        a: this.arrA[this.arrA.length - 1]
                    });
                }
            }, null);
        }
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('ViewB: reset array');
            Button.margin({ top: 10 });
            Button.onClick(() => {
                this.arrA = [new import_Observed_1.ClassB(0), new import_Observed_1.ClassB(0)];
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('ViewB: push');
            Button.margin({ top: 10 });
            Button.onClick(() => {
                this.arrA.push(new import_Observed_1.ClassB(0));
            });
        }, Button);
        Button.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Button.createWithLabel('ViewB: shift');
            Button.margin({ top: 10 });
            Button.onClick(() => {
                this.arrA.shift();
            });
        }, Button);
        Button.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new ViewB(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
