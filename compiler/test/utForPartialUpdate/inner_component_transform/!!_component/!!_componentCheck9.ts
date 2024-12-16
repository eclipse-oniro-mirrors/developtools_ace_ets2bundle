/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

/*
 * This is a test case that demonstrates the use of the built-in components 'Refresh' and 'ListItem' with two-way sync binding functionality within if, else if, and else statements.
 */
exports.source = `
@Entry
@ComponentV2
struct Index {
  @Local isRefreshing: boolean = true
  @Local num: 0 | 1 | 2 = 0
  @Local text: string = ''
  @Local arr: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  @Local arrSelect: boolean[] = [true, false, true, false, true, false, true, false, true, false]
  controller: TextInputController = new TextInputController()

  build() {
    Row() {
      Column() {
        TextInput({ text: this.text!!, placeholder: 'input your word...', controller: this.controller })
        if (this.num === 0) {
          Refresh({refreshing: this.isRefreshing!!})
        } else if (this.num === 1) {
          Refresh({refreshing: this.isRefreshing!!})
        } else if (this.num === 2) {
          Refresh({refreshing: this.isRefreshing!!})
        } else if (this.num === 3) {
          Refresh({refreshing: this.isRefreshing!!})
        } else {
          Refresh({refreshing: this.isRefreshing!!})
        }
        List({ space: 20, initialIndex: 0 }) {
          ForEach(this.arr, (item: number, index: number) => {
            ListItem() {
              Text('' + item)
            }
            .selectable(true)
            .selected(this.arrSelect[index]!!)
          }, (item: string) => item)
        }
      }
    }
  }
}
`

exports.expectResult =
`"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
if (!("finalizeConstruction" in ViewPU.prototype)) {
    Reflect.set(ViewPU.prototype, "finalizeConstruction", () => { });
}
class Index extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.isRefreshing = true;
        this.num = 0;
        this.text = '';
        this.arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        this.arrSelect = [true, false, true, false, true, false, true, false, true, false];
        this.controller = new TextInputController();
        this.finalizeConstruction();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Row.create();
        }, Row);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            TextInput.create({ text: this.text, $text: newValue => { this.text = newValue; }, placeholder: 'input your word...', controller: this.controller });
        }, TextInput);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            If.create();
            if (this.num === 0) {
                this.ifElseBranchUpdateFunction(0, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Refresh.create({ refreshing: this.isRefreshing, $refreshing: newValue => { this.isRefreshing = newValue; } });
                    }, Refresh);
                    Refresh.pop();
                });
            }
            else if (this.num === 1) {
                this.ifElseBranchUpdateFunction(1, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Refresh.create({ refreshing: this.isRefreshing, $refreshing: newValue => { this.isRefreshing = newValue; } });
                    }, Refresh);
                    Refresh.pop();
                });
            }
            else if (this.num === 2) {
                this.ifElseBranchUpdateFunction(2, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Refresh.create({ refreshing: this.isRefreshing, $refreshing: newValue => { this.isRefreshing = newValue; } });
                    }, Refresh);
                    Refresh.pop();
                });
            }
            else if (this.num === 3) {
                this.ifElseBranchUpdateFunction(3, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Refresh.create({ refreshing: this.isRefreshing, $refreshing: newValue => { this.isRefreshing = newValue; } });
                    }, Refresh);
                    Refresh.pop();
                });
            }
            else {
                this.ifElseBranchUpdateFunction(4, () => {
                    this.observeComponentCreation2((elmtId, isInitialRender) => {
                        Refresh.create({ refreshing: this.isRefreshing, $refreshing: newValue => { this.isRefreshing = newValue; } });
                    }, Refresh);
                    Refresh.pop();
                });
            }
        }, If);
        If.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            List.create({ space: 20, initialIndex: 0 });
        }, List);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            ForEach.create();
            const forEachItemGenFunction = (_item, index) => {
                const item = _item;
                {
                    const itemCreation = (elmtId, isInitialRender) => {
                        ViewStackProcessor.StartGetAccessRecordingFor(elmtId);
                        itemCreation2(elmtId, isInitialRender);
                        if (!isInitialRender) {
                            ListItem.pop();
                        }
                        ViewStackProcessor.StopGetAccessRecording();
                    };
                    const itemCreation2 = (elmtId, isInitialRender) => {
                        ListItem.create(deepRenderFunction, true);
                        ListItem.selectable(true);
                        ListItem.selected({ value: this.arrSelect[index], $value: newValue => { this.arrSelect[index] = newValue; } });
                    };
                    const deepRenderFunction = (elmtId, isInitialRender) => {
                        itemCreation(elmtId, isInitialRender);
                        this.observeComponentCreation2((elmtId, isInitialRender) => {
                            Text.create('' + item);
                        }, Text);
                        Text.pop();
                        ListItem.pop();
                    };
                    this.observeComponentCreation2(itemCreation2, ListItem);
                    ListItem.pop();
                }
            };
            this.forEachUpdateFunction(elmtId, this.arr, forEachItemGenFunction, (item) => item, true, false);
        }, ForEach);
        ForEach.pop();
        List.pop();
        Column.pop();
        Row.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
    static getEntryName() {
        return "Index";
    }
}
__decorate([
    Local
], Index.prototype, "isRefreshing", void 0);
__decorate([
    Local
], Index.prototype, "num", void 0);
__decorate([
    Local
], Index.prototype, "text", void 0);
__decorate([
    Local
], Index.prototype, "arr", void 0);
__decorate([
    Local
], Index.prototype, "arrSelect", void 0);
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new Index(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
