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
struct TestBuilder1 {
  build() {
    Column() {
      Text("hello")
    }
  }
  @Builder
  innerBuidler(value: string) {
    Column() {
      Text("hello")
    }
  }
}

@Component
struct TestBuilderChild {
  build() {
    Column() {
      Text("hello")
    }
  }
  @Builder
  innerBuidler(value: object) {
    Column() {
      Text("hello")
    }
  }
}

@Builder
function testIfIdComponent(value: number) {
  Column() {
    if (value) {
      TestBuilderChild()
        .id('id14')
      Text('111')
    }
  }
}
`
exports.expectResult =
`"use strict";
class TestBuilder1 extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    innerBuidler(value, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class TestBuilderChild extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.setInitiallyProvidedValue(params);
    }
    setInitiallyProvidedValue(params) {
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    innerBuidler(value, parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create("hello");
        }, Text);
        Text.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
function testIfIdComponent(value, parent = null) {
    const __value__ = value;
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
        Column.create();
    }, Column);
    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
        If.create();
        if (value) {
            (parent ? parent : this).ifElseBranchUpdateFunction(0, () => {
                if (!If.canRetake('id14')) {
                    (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
                        __Common__.create();
                        __Common__.id('id14');
                    }, __Common__);
                    {
                        (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
                            if (isInitialRender) {
                                let paramsLambda = () => {
                                    return {};
                                };
                                ViewPU.create(new TestBuilderChild(parent ? parent : this, {}, undefined, elmtId, paramsLambda, { page: "@builderTransFormFirst.ets", line: 37 }));
                            }
                            else {
                                (parent ? parent : this).updateStateVarsOfChildByElmtId(elmtId, {});
                            }
                        }, { name: "TestBuilderChild" });
                    }
                    __Common__.pop();
                }
                (parent ? parent : this).observeComponentCreation2((elmtId, isInitialRender, value = __value__) => {
                    Text.create('111');
                }, Text);
                Text.pop();
            });
        }
        else {
            this.ifElseBranchUpdateFunction(1, () => {
            });
        }
    }, If);
    If.pop();
    Column.pop();
}
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new TestBuilder1(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`