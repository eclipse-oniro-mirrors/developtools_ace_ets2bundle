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
import { stringVariable, stringObj, stringFunction } from './test/pages/decoratorKeyCheck'

let para:Record<string,number> = { 'PropA': 47 };
let storage: LocalStorage = new LocalStorage(para);
@Entry(storage)
@Component
struct Index {
  @LocalStorageLink(stringVariable) LocalStorageLink: string = 'LocalStorageLink';
  @LocalStorageLink(stringObj.stringKey) LocalStorageLink1: string = 'LocalStorageLink1';
  @LocalStorageLink(stringFunction()) LocalStorageLink2: string = 'LocalStorageLink2';
  @LocalStorageLink('LocalStorageLink3') LocalStorageLink3: string = 'LocalStorageLink3';
  
  @LocalStorageProp(stringVariable) LocalStorageProp: string = 'LocalStorageProp';
  @LocalStorageProp(stringObj.stringKey) LocalStorageProp1: string = 'LocalStorageProp1';
  @LocalStorageProp(stringFunction()) LocalStorageProp2: string = 'LocalStorageProp2';
  @LocalStorageProp('LocalStorageProp3') LocalStorageProp3: string = 'LocalStorageProp3';

  @StorageProp(stringVariable) StorageProp: string = 'StorageProp';
  @StorageProp(stringObj.stringKey) StorageProp1: string = 'StorageProp1';
  @StorageProp(stringFunction()) StorageProp2: string = 'StorageProp2';
  @StorageProp('StorageProp3') StorageProp3: string = 'StorageProp3';

  @StorageLink(stringVariable) StorageLink: string = 'StorageLink';
  @StorageLink(stringObj.stringKey) StorageLink1: string = 'StorageLink1';
  @StorageLink(stringFunction()) StorageLink2: string = 'StorageLink2';
  @StorageLink('StorageLink3') StorageLink3: string = 'StorageLink3';
 
  @Provide(stringVariable) Provide: string = 'Provide';
  @Provide(stringObj.stringKey) Provide1: string = 'Provide1';
  @Provide(stringFunction()) Provide2: string = 'Provide2';
  @Provide('Provide32') Provide3: string = 'Provide3';
  @Provide Provide4: string = 'Provide4';
  @Provide({allowOverride: stringVariable}) Provide5: string = 'Provide5';
  @Provide({allowOverride: stringObj}) Provide6: string = 'Provide6';
  @Provide({allowOverride: stringFunction}) Provide7: string = 'Provide7';

  @Consume(stringVariable) Consume: string;
  @Consume(stringObj.stringKey) Consume1: string;
  @Consume(stringFunction()) Consume2: string;
  @Consume('Consume3') Consume3: string;
  @Consume Consume4: string;

  build() {
    Row() {

    }
  }
}
`
exports.expectResult =
`"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
const decoratorKeyCheck_1 = require("./test/pages/decoratorKeyCheck");
let para = { 'PropA': 47 };
let storage = new LocalStorage(para);
class Index extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        this.__LocalStorageLink = this.createLocalStorageLink(decoratorKeyCheck_1.stringVariable, 'LocalStorageLink', "LocalStorageLink");
        this.__LocalStorageLink1 = this.createLocalStorageLink(decoratorKeyCheck_1.stringObj.stringKey, 'LocalStorageLink1', "LocalStorageLink1");
        this.__LocalStorageLink2 = this.createLocalStorageLink((0, decoratorKeyCheck_1.stringFunction)(), 'LocalStorageLink2', "LocalStorageLink2");
        this.__LocalStorageLink3 = this.createLocalStorageLink('LocalStorageLink3', 'LocalStorageLink3', "LocalStorageLink3");
        this.__LocalStorageProp = this.createLocalStorageProp(decoratorKeyCheck_1.stringVariable, 'LocalStorageProp', "LocalStorageProp");
        this.__LocalStorageProp1 = this.createLocalStorageProp(decoratorKeyCheck_1.stringObj.stringKey, 'LocalStorageProp1', "LocalStorageProp1");
        this.__LocalStorageProp2 = this.createLocalStorageProp((0, decoratorKeyCheck_1.stringFunction)(), 'LocalStorageProp2', "LocalStorageProp2");
        this.__LocalStorageProp3 = this.createLocalStorageProp('LocalStorageProp3', 'LocalStorageProp3', "LocalStorageProp3");
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__StorageProp = this.createStorageProp(decoratorKeyCheck_1.stringVariable, 'StorageProp', "StorageProp");
        this.__StorageProp1 = this.createStorageProp(decoratorKeyCheck_1.stringObj.stringKey, 'StorageProp1', "StorageProp1");
        this.__StorageProp2 = this.createStorageProp((0, decoratorKeyCheck_1.stringFunction)(), 'StorageProp2', "StorageProp2");
        this.__StorageProp3 = this.createStorageProp('StorageProp3', 'StorageProp3', "StorageProp3");
        this.__StorageLink = this.createStorageLink(decoratorKeyCheck_1.stringVariable, 'StorageLink', "StorageLink");
        this.__StorageLink1 = this.createStorageLink(decoratorKeyCheck_1.stringObj.stringKey, 'StorageLink1', "StorageLink1");
        this.__StorageLink2 = this.createStorageLink((0, decoratorKeyCheck_1.stringFunction)(), 'StorageLink2', "StorageLink2");
        this.__StorageLink3 = this.createStorageLink('StorageLink3', 'StorageLink3', "StorageLink3");
        this.__Provide = new ObservedPropertySimplePU('Provide', this, "Provide");
        this.addProvidedVar(decoratorKeyCheck_1.stringVariable, this.__Provide, false);
        this.addProvidedVar("Provide", this.__Provide, false);
        this.__Provide1 = new ObservedPropertySimplePU('Provide1', this, "Provide1");
        this.addProvidedVar(decoratorKeyCheck_1.stringObj.stringKey, this.__Provide1, false);
        this.addProvidedVar("Provide1", this.__Provide1, false);
        this.__Provide2 = new ObservedPropertySimplePU('Provide2', this, "Provide2");
        this.addProvidedVar((0, decoratorKeyCheck_1.stringFunction)(), this.__Provide2, false);
        this.addProvidedVar("Provide2", this.__Provide2, false);
        this.__Provide3 = new ObservedPropertySimplePU('Provide3', this, "Provide3");
        this.addProvidedVar("Provide32", this.__Provide3, false);
        this.addProvidedVar("Provide3", this.__Provide3, false);
        this.__Provide4 = new ObservedPropertySimplePU('Provide4', this, "Provide4");
        this.addProvidedVar("Provide4", this.__Provide4, false);
        this.__Provide5 = new ObservedPropertySimplePU('Provide5', this, "Provide5");
        this.addProvidedVar(decoratorKeyCheck_1.stringVariable, this.__Provide5, true);
        this.addProvidedVar("Provide5", this.__Provide5, true);
        this.__Provide6 = new ObservedPropertySimplePU('Provide6', this, "Provide6");
        this.addProvidedVar(decoratorKeyCheck_1.stringObj, this.__Provide6, true);
        this.addProvidedVar("Provide6", this.__Provide6, true);
        this.__Provide7 = new ObservedPropertySimplePU('Provide7', this, "Provide7");
        this.addProvidedVar(decoratorKeyCheck_1.stringFunction, this.__Provide7, true);
        this.addProvidedVar("Provide7", this.__Provide7, true);
        this.__Consume = this.initializeConsume(decoratorKeyCheck_1.stringVariable, "Consume");
        this.__Consume1 = this.initializeConsume(decoratorKeyCheck_1.stringObj.stringKey, "Consume1");
        this.__Consume2 = this.initializeConsume((0, decoratorKeyCheck_1.stringFunction)(), "Consume2");
        this.__Consume3 = this.initializeConsume('Consume3', "Consume3");
        this.__Consume4 = this.initializeConsume("Consume4", "Consume4");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.Provide !== undefined) {
            this.Provide = params.Provide;
        }
        if (params.Provide1 !== undefined) {
            this.Provide1 = params.Provide1;
        }
        if (params.Provide2 !== undefined) {
            this.Provide2 = params.Provide2;
        }
        if (params.Provide3 !== undefined) {
            this.Provide3 = params.Provide3;
        }
        if (params.Provide4 !== undefined) {
            this.Provide4 = params.Provide4;
        }
        if (params.Provide5 !== undefined) {
            this.Provide5 = params.Provide5;
        }
        if (params.Provide6 !== undefined) {
            this.Provide6 = params.Provide6;
        }
        if (params.Provide7 !== undefined) {
            this.Provide7 = params.Provide7;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__LocalStorageLink.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageLink1.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageLink2.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageLink3.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageProp.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageProp1.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageProp2.purgeDependencyOnElmtId(rmElmtId);
        this.__LocalStorageProp3.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageProp.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageProp1.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageProp2.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageProp3.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageLink.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageLink1.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageLink2.purgeDependencyOnElmtId(rmElmtId);
        this.__StorageLink3.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide1.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide2.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide3.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide4.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide5.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide6.purgeDependencyOnElmtId(rmElmtId);
        this.__Provide7.purgeDependencyOnElmtId(rmElmtId);
        this.__Consume.purgeDependencyOnElmtId(rmElmtId);
        this.__Consume1.purgeDependencyOnElmtId(rmElmtId);
        this.__Consume2.purgeDependencyOnElmtId(rmElmtId);
        this.__Consume3.purgeDependencyOnElmtId(rmElmtId);
        this.__Consume4.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__LocalStorageLink.aboutToBeDeleted();
        this.__LocalStorageLink1.aboutToBeDeleted();
        this.__LocalStorageLink2.aboutToBeDeleted();
        this.__LocalStorageLink3.aboutToBeDeleted();
        this.__LocalStorageProp.aboutToBeDeleted();
        this.__LocalStorageProp1.aboutToBeDeleted();
        this.__LocalStorageProp2.aboutToBeDeleted();
        this.__LocalStorageProp3.aboutToBeDeleted();
        this.__StorageProp.aboutToBeDeleted();
        this.__StorageProp1.aboutToBeDeleted();
        this.__StorageProp2.aboutToBeDeleted();
        this.__StorageProp3.aboutToBeDeleted();
        this.__StorageLink.aboutToBeDeleted();
        this.__StorageLink1.aboutToBeDeleted();
        this.__StorageLink2.aboutToBeDeleted();
        this.__StorageLink3.aboutToBeDeleted();
        this.__Provide.aboutToBeDeleted();
        this.__Provide1.aboutToBeDeleted();
        this.__Provide2.aboutToBeDeleted();
        this.__Provide3.aboutToBeDeleted();
        this.__Provide4.aboutToBeDeleted();
        this.__Provide5.aboutToBeDeleted();
        this.__Provide6.aboutToBeDeleted();
        this.__Provide7.aboutToBeDeleted();
        this.__Consume.aboutToBeDeleted();
        this.__Consume1.aboutToBeDeleted();
        this.__Consume2.aboutToBeDeleted();
        this.__Consume3.aboutToBeDeleted();
        this.__Consume4.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get LocalStorageLink() {
        return this.__LocalStorageLink.get();
    }
    set LocalStorageLink(newValue) {
        this.__LocalStorageLink.set(newValue);
    }
    get LocalStorageLink1() {
        return this.__LocalStorageLink1.get();
    }
    set LocalStorageLink1(newValue) {
        this.__LocalStorageLink1.set(newValue);
    }
    get LocalStorageLink2() {
        return this.__LocalStorageLink2.get();
    }
    set LocalStorageLink2(newValue) {
        this.__LocalStorageLink2.set(newValue);
    }
    get LocalStorageLink3() {
        return this.__LocalStorageLink3.get();
    }
    set LocalStorageLink3(newValue) {
        this.__LocalStorageLink3.set(newValue);
    }
    get LocalStorageProp() {
        return this.__LocalStorageProp.get();
    }
    set LocalStorageProp(newValue) {
        this.__LocalStorageProp.set(newValue);
    }
    get LocalStorageProp1() {
        return this.__LocalStorageProp1.get();
    }
    set LocalStorageProp1(newValue) {
        this.__LocalStorageProp1.set(newValue);
    }
    get LocalStorageProp2() {
        return this.__LocalStorageProp2.get();
    }
    set LocalStorageProp2(newValue) {
        this.__LocalStorageProp2.set(newValue);
    }
    get LocalStorageProp3() {
        return this.__LocalStorageProp3.get();
    }
    set LocalStorageProp3(newValue) {
        this.__LocalStorageProp3.set(newValue);
    }
    get StorageProp() {
        return this.__StorageProp.get();
    }
    set StorageProp(newValue) {
        this.__StorageProp.set(newValue);
    }
    get StorageProp1() {
        return this.__StorageProp1.get();
    }
    set StorageProp1(newValue) {
        this.__StorageProp1.set(newValue);
    }
    get StorageProp2() {
        return this.__StorageProp2.get();
    }
    set StorageProp2(newValue) {
        this.__StorageProp2.set(newValue);
    }
    get StorageProp3() {
        return this.__StorageProp3.get();
    }
    set StorageProp3(newValue) {
        this.__StorageProp3.set(newValue);
    }
    get StorageLink() {
        return this.__StorageLink.get();
    }
    set StorageLink(newValue) {
        this.__StorageLink.set(newValue);
    }
    get StorageLink1() {
        return this.__StorageLink1.get();
    }
    set StorageLink1(newValue) {
        this.__StorageLink1.set(newValue);
    }
    get StorageLink2() {
        return this.__StorageLink2.get();
    }
    set StorageLink2(newValue) {
        this.__StorageLink2.set(newValue);
    }
    get StorageLink3() {
        return this.__StorageLink3.get();
    }
    set StorageLink3(newValue) {
        this.__StorageLink3.set(newValue);
    }
    get Provide() {
        return this.__Provide.get();
    }
    set Provide(newValue) {
        this.__Provide.set(newValue);
    }
    get Provide1() {
        return this.__Provide1.get();
    }
    set Provide1(newValue) {
        this.__Provide1.set(newValue);
    }
    get Provide2() {
        return this.__Provide2.get();
    }
    set Provide2(newValue) {
        this.__Provide2.set(newValue);
    }
    get Provide3() {
        return this.__Provide3.get();
    }
    set Provide3(newValue) {
        this.__Provide3.set(newValue);
    }
    get Provide4() {
        return this.__Provide4.get();
    }
    set Provide4(newValue) {
        this.__Provide4.set(newValue);
    }
    get Provide5() {
        return this.__Provide5.get();
    }
    set Provide5(newValue) {
        this.__Provide5.set(newValue);
    }
    get Provide6() {
        return this.__Provide6.get();
    }
    set Provide6(newValue) {
        this.__Provide6.set(newValue);
    }
    get Provide7() {
        return this.__Provide7.get();
    }
    set Provide7(newValue) {
        this.__Provide7.set(newValue);
    }
    get Consume() {
        return this.__Consume.get();
    }
    set Consume(newValue) {
        this.__Consume.set(newValue);
    }
    get Consume1() {
        return this.__Consume1.get();
    }
    set Consume1(newValue) {
        this.__Consume1.set(newValue);
    }
    get Consume2() {
        return this.__Consume2.get();
    }
    set Consume2(newValue) {
        this.__Consume2.set(newValue);
    }
    get Consume3() {
        return this.__Consume3.get();
    }
    set Consume3(newValue) {
        this.__Consume3.set(newValue);
    }
    get Consume4() {
        return this.__Consume4.get();
    }
    set Consume4(newValue) {
        this.__Consume4.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
if (storage && storage.routeName != undefined && storage.storage != undefined) {
    registerNamedRoute(() => new Index(undefined, {}, storage.storage), storage.routeName, { bundleName: "", moduleName: "", pagePath: "decoratorKeyCheck" });
}
else if (storage && storage.routeName != undefined && storage.storage == undefined) {
    registerNamedRoute(() => new Index(undefined, {}), storage.routeName, { bundleName: "", moduleName: "", pagePath: "decoratorKeyCheck" });
}
else if (storage && storage.routeName == undefined && storage.storage != undefined) {
    ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
    loadDocument(new Index(undefined, {}, storage.storage));
    ViewStackProcessor.StopGetAccessRecording();
}
else {
    ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
    loadDocument(new Index(undefined, {}, storage));
    ViewStackProcessor.StopGetAccessRecording();
}
`
