/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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
let storage = LocalStorage.GetShared();

class ClassA {
    public id: number = 1;
    public type: number = 2;
    public a: string = "aaa";
    constructor(a: string){
        this.a = a;
    }
}

@Entry({
  storage: storage
})
@Component
struct LocalStorageComponent {
    @LocalStorageLink("storageSimpleProp") simpleVarName: number = 0;
    @LocalStorageProp("storageObjectProp") objectName: ClassA = new ClassA("x");
    build() {
        Column() {
            Text(this.objectName.a)
                .onClick(()=>{
                    this.simpleVarName +=1;
                    this.objectName.a = this.objectName.a === 'x' ? 'yex' : 'no';
                })
        }
        .height(500)
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
let storage = LocalStorage.GetShared();
class ClassA {
    constructor(a) {
        this.id = 1;
        this.type = 2;
        this.a = "aaa";
        this.a = a;
    }
}
class LocalStorageComponent extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        this.__simpleVarName = this.createLocalStorageLink("storageSimpleProp", 0, "simpleVarName");
        this.__objectName = this.createLocalStorageProp("storageObjectProp", new ClassA("x"), "objectName");
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__simpleVarName.purgeDependencyOnElmtId(rmElmtId);
        this.__objectName.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__simpleVarName.aboutToBeDeleted();
        this.__objectName.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get simpleVarName() {
        return this.__simpleVarName.get();
    }
    set simpleVarName(newValue) {
        this.__simpleVarName.set(newValue);
    }
    get objectName() {
        return this.__objectName.get();
    }
    set objectName(newValue) {
        this.__objectName.set(newValue);
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.height(500);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.objectName.a);
            Text.onClick(() => {
                this.simpleVarName += 1;
                this.objectName.a = this.objectName.a === 'x' ? 'yex' : 'no';
            });
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
{
    ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
    loadDocument(new LocalStorageComponent(undefined, {}, storage));
    ViewStackProcessor.StopGetAccessRecording();
}
`
