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
@Styles function globalFancy1() {
    .width(150)
    .height(100)
    .backgroundColor(Color.Pink)
  }
  
  @Entry
  @Component
  struct TextInputExample {
    @State text: string = ''
  
    @Styles globalFancy() {
      .width(150)
      .height(100)
      .backgroundColor(Color.Pink)
    }
  
    build() {
      Column({ space: 20 }) {
        Text(this.text)
        TextInput({ text: $$this.text })
        .placeholderColor(Color.Grey)
        .placeholderFont({ size: 14, weight: 400 })
        .globalFancy1()
        .globalFancy()
        .caretColor(Color.Blue)
        .width(300)
      }.width('100%').height('100%').justifyContent(FlexAlign.Center)
    }
  }
`

exports.expectResult =
`"use strict";
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class TextInputExample extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__text = new ObservedPropertySimplePU('', this, "text");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.text !== undefined) {
            this.text = params.text;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__text.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__text.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get text() {
        return this.__text.get();
    }
    set text(newValue) {
        this.__text.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 20 });
            Column.width('100%');
            Column.height('100%');
            Column.justifyContent(FlexAlign.Center);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create(this.text);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: { value: this.text, changeEvent: newValue => { this.text = newValue; } } });
            TextInput.placeholderColor(Color.Grey);
            TextInput.placeholderFont({ size: 14, weight: 400 });
            TextInput.width(150);
            TextInput.height(100);
            TextInput.backgroundColor(Color.Pink);
            TextInput.width(150);
            TextInput.height(100);
            TextInput.backgroundColor(Color.Pink);
            TextInput.caretColor(Color.Blue);
            TextInput.width(300);
        }, TextInput);
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new TextInputExample(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
