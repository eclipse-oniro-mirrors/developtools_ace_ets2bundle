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
struct PageTransitionExample1 {
  @State scale2: number = 1
  @State opacity2: number = 1
  @State active: boolean = false
  build() {
    Column() {
      Navigator({ target: 'pages/page1', type: NavigationType.Push }) {
        Text('page transition').width("100%").height("100%")
      }
      .onClick(() => {
        this.active = true
      })
    }.scale({ x: this.scale2 }).opacity(this.opacity2)
  }
  pageTransition() {
    PageTransitionEnter({ duration: 1200, curve: Curve.Linear })
      .onEnter((type: RouteType, progress: number) => {
        this.scale2 = 1
        this.opacity2 = progress
      })
    PageTransitionExit({ duration: 1500, curve: Curve.Ease })
      .onExit((type: RouteType, progress: number) => {
        this.scale2 = 1 - progress
        this.opacity2 = 1
      })
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
class PageTransitionExample1 extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__scale2 = new ObservedPropertySimplePU(1, this, "scale2");
        this.__opacity2 = new ObservedPropertySimplePU(1, this, "opacity2");
        this.__active = new ObservedPropertySimplePU(false, this, "active");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.scale2 !== undefined) {
            this.scale2 = params.scale2;
        }
        if (params.opacity2 !== undefined) {
            this.opacity2 = params.opacity2;
        }
        if (params.active !== undefined) {
            this.active = params.active;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__scale2.purgeDependencyOnElmtId(rmElmtId);
        this.__opacity2.purgeDependencyOnElmtId(rmElmtId);
        this.__active.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__scale2.aboutToBeDeleted();
        this.__opacity2.aboutToBeDeleted();
        this.__active.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get scale2() {
        return this.__scale2.get();
    }
    set scale2(newValue) {
        this.__scale2.set(newValue);
    }
    get opacity2() {
        return this.__opacity2.get();
    }
    set opacity2(newValue) {
        this.__opacity2.set(newValue);
    }
    get active() {
        return this.__active.get();
    }
    set active(newValue) {
        this.__active.set(newValue);
    }
    initialRender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.scale({ x: this.scale2 });
            Column.opacity(this.opacity2);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Navigator.create({ target: 'pages/page1', type: NavigationType.Push });
            Navigator.onClick(() => {
                this.active = true;
            });
        }, Navigator);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('page transition');
            Text.width("100%");
            Text.height("100%");
        }, Text);
        Text.pop();
        Navigator.pop();
        Column.pop();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
    pageTransition() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransition.create();
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionEnter.create({ duration: 1200, curve: Curve.Linear });
            PageTransitionEnter.onEnter((type, progress) => {
                this.scale2 = 1;
                this.opacity2 = progress;
            });
        }, null);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            PageTransitionExit.create({ duration: 1500, curve: Curve.Ease });
            PageTransitionExit.onExit((type, progress) => {
                this.scale2 = 1 - progress;
                this.opacity2 = 1;
            });
        }, null);
        PageTransition.pop();
    }
    rerender() {
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.push(this);
        this.updateDirtyElements();
        PUV2ViewBase.contextStack && PUV2ViewBase.contextStack.pop();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new PageTransitionExample1(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
