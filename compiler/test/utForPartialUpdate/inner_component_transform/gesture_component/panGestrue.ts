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
struct PanGestureExample {
  @State offsetX: number = 0
  @State offsetY: number = 0

  build() {
    Flex({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.SpaceBetween }) {
      Text('PanGesture offset X: ' + this.offsetX)
      Text('PanGesture offset Y: ' + this.offsetY)
    }
    .height(100).width(200).padding(20).border({ width: 1 }).margin(80)
    .translate({ x: this.offsetX, y: this.offsetY, z: 5 })
    .gesture(
    PanGesture({})
      .onActionStart((event: GestureEvent) => {
        console.info('Pan start')
      })
      .onActionUpdate((event: GestureEvent) => {
        this.offsetX = event.offsetX
        this.offsetY = event.offsetY
      })
      .onActionEnd(() => {
        console.info('Pan end')
      })
    )
  }
}
`

exports.expectResult =
`"use strict";
class PanGestureExample extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined) {
        super(parent, __localStorage, elmtId);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__offsetX = new ObservedPropertySimplePU(0, this, "offsetX");
        this.__offsetY = new ObservedPropertySimplePU(0, this, "offsetY");
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
        if (params.offsetX !== undefined) {
            this.offsetX = params.offsetX;
        }
        if (params.offsetY !== undefined) {
            this.offsetY = params.offsetY;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__offsetX.purgeDependencyOnElmtId(rmElmtId);
        this.__offsetY.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__offsetX.aboutToBeDeleted();
        this.__offsetY.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get offsetX() {
        return this.__offsetX.get();
    }
    set offsetX(newValue) {
        this.__offsetX.set(newValue);
    }
    get offsetY() {
        return this.__offsetY.get();
    }
    set offsetY(newValue) {
        this.__offsetY.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Flex.create({ direction: FlexDirection.Column, alignItems: ItemAlign.Center, justifyContent: FlexAlign.SpaceBetween });
            Flex.height(100);
            Flex.width(200);
            Flex.padding(20);
            Flex.border({ width: 1 });
            Flex.margin(80);
            Flex.translate({ x: this.offsetX, y: this.offsetY, z: 5 });
            Gesture.create(GesturePriority.Low);
            PanGesture.create({});
            PanGesture.onActionStart((event) => {
                console.info('Pan start');
            });
            PanGesture.onActionUpdate((event) => {
                this.offsetX = event.offsetX;
                this.offsetY = event.offsetY;
            });
            PanGesture.onActionEnd(() => {
                console.info('Pan end');
            });
            PanGesture.pop();
            Gesture.pop();
        }, Flex);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('PanGesture offset X: ' + this.offsetX);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('PanGesture offset Y: ' + this.offsetY);
        }, Text);
        Text.pop();
        Flex.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new PanGestureExample(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
