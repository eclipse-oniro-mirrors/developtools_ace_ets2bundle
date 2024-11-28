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
 * This is a test case about the use of "!!" two-way sync binding in the component 'Rating', 'Search' and 'Swiper'.
 */
exports.source = `
class MyDataSource implements IDataSource {
  private list: string[] = []

  constructor(list: string[]) {
    this.list = list
  }

  totalCount(): number {
    return this.list.length
  }

  getData(index: number): string {
    return this.list[index]
  }

  registerDataChangeListener(listener: DataChangeListener): void {
  }

  unregisterDataChangeListener() {
  }
}

@Entry
@Component
struct RatingExample {
  @State rating: number = 3.5

  build() {
    Column() {
      Column() {
        Rating({ rating: this.rating!!, indicator: false })
        Text('current score is ' + this.rating)
        SearchExample()
      }.width(360)
    }
  }
}

@ComponentV2
struct SearchExample {
  @Local changeValue: string = ''
  @Local submitValue: string = ''
  @Local swiperIndex: number = 2
  controller: SearchController = new SearchController()
  private swiperController: SwiperController = new SwiperController()
  private data: MyDataSource = new MyDataSource([])
  textAreaController: TextAreaController = new TextAreaController()

  aboutToAppear(): void {
    let list: string[] = []
    for (let i = 1; i <= 10; i++) {
      list.push(i+'');
    }
    this.data = new MyDataSource(list)
  }

  @Builder showSwiper() {
    Swiper(this.swiperController) {
      LazyForEach(this.data, (item: string) => {
        Text(item)
        TextArea({
          text: item!!,
          placeholder: 'The text area can hold an unlimited amount of text. input your word...',
          controller: this.textAreaController
        })
      }, (item: string) => item)
    }
    .index(this.swiperIndex!!)
  }

  build() {
    Column({space: 10}) {
      Text('onSubmit:' + this.submitValue).fontSize(18).margin(15)
      Text('onChange:' + this.changeValue).fontSize(18).margin(15)
      Search({ value: this.changeValue!!, placeholder: 'Type to search...', controller: this.controller })
        .searchButton('SEARCH')
        .onSubmit((value: string) => {
          this.submitValue = value
        })
      this.showSwiper()
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
class MyDataSource {
    constructor(list) {
        this.list = [];
        this.list = list;
    }
    totalCount() {
        return this.list.length;
    }
    getData(index) {
        return this.list[index];
    }
    registerDataChangeListener(listener) {
    }
    unregisterDataChangeListener() {
    }
}
class RatingExample extends ViewPU {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda = undefined, extraInfo) {
        super(parent, __localStorage, elmtId, extraInfo);
        if (typeof paramsLambda === "function") {
            this.paramsGenerator_ = paramsLambda;
        }
        this.__rating = new ObservedPropertySimplePU(3.5, this, "rating");
        this.setInitiallyProvidedValue(params);
        this.finalizeConstruction();
    }
    setInitiallyProvidedValue(params) {
        if (params.rating !== undefined) {
            this.rating = params.rating;
        }
    }
    updateStateVars(params) {
    }
    purgeVariableDependenciesOnElmtId(rmElmtId) {
        this.__rating.purgeDependencyOnElmtId(rmElmtId);
    }
    aboutToBeDeleted() {
        this.__rating.aboutToBeDeleted();
        SubscriberManager.Get().delete(this.id__());
        this.aboutToBeDeletedInternal();
    }
    get rating() {
        return this.__rating.get();
    }
    set rating(newValue) {
        this.__rating.set(newValue);
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create();
            Column.width(360);
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Rating.create({ rating: this.rating, $rating: newValue => { this.rating = newValue; }, indicator: false });
        }, Rating);
        Rating.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('current score is ' + this.rating);
        }, Text);
        Text.pop();
        {
            this.observeComponentCreation2((elmtId, isInitialRender) => {
                if (isInitialRender) {
                    let componentCall = new SearchExample(this, {}, undefined, elmtId, () => { }, { page: "!!_componentCheck8.ets", line: 34, col: 9 });
                    ViewV2.create(componentCall);
                    let paramsLambda = () => {
                        return {};
                    };
                    componentCall.paramsGenerator_ = paramsLambda;
                }
                else {
                    this.updateStateVarsOfChildByElmtId(elmtId, {});
                }
            }, { name: "SearchExample" });
        }
        Column.pop();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
class SearchExample extends ViewV2 {
    constructor(parent, params, __localStorage, elmtId = -1, paramsLambda, extraInfo) {
        super(parent, elmtId, extraInfo);
        this.changeValue = '';
        this.submitValue = '';
        this.swiperIndex = 2;
        this.controller = new SearchController();
        this.swiperController = new SwiperController();
        this.data = new MyDataSource([]);
        this.textAreaController = new TextAreaController();
        this.finalizeConstruction();
    }
    aboutToAppear() {
        let list = [];
        for (let i = 1; i <= 10; i++) {
            list.push(i + '');
        }
        this.data = new MyDataSource(list);
    }
    showSwiper(parent = null) {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Swiper.create(this.swiperController);
            Swiper.index({ value: this.swiperIndex, $value: newValue => { this.swiperIndex = newValue; } });
        }, Swiper);
        {
            const __lazyForEachItemGenFunction = _item => {
                const item = _item;
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    Text.create(item);
                }, Text);
                Text.pop();
                this.observeComponentCreation2((elmtId, isInitialRender) => {
                    TextArea.create({
                        text: item,
                        $text: newValue => { item = newValue; },
                        placeholder: 'The text area can hold an unlimited amount of text. input your word...',
                        controller: this.textAreaController
                    });
                }, TextArea);
            };
            const __lazyForEachItemIdFunc = (item) => item;
            LazyForEach.create("1", this, this.data, __lazyForEachItemGenFunction, __lazyForEachItemIdFunc);
            LazyForEach.pop();
        }
        Swiper.pop();
    }
    initialRender() {
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Column.create({ space: 10 });
        }, Column);
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('onSubmit:' + this.submitValue);
            Text.fontSize(18);
            Text.margin(15);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Text.create('onChange:' + this.changeValue);
            Text.fontSize(18);
            Text.margin(15);
        }, Text);
        Text.pop();
        this.observeComponentCreation2((elmtId, isInitialRender) => {
            Search.create({ value: this.changeValue, $value: newValue => { this.changeValue = newValue; }, placeholder: 'Type to search...', controller: this.controller });
            Search.searchButton('SEARCH');
            Search.onSubmit((value) => {
                this.submitValue = value;
            });
        }, Search);
        Search.pop();
        this.showSwiper.bind(this)();
        Column.pop();
    }
    rerender() {
        this.updateDirtyElements();
    }
}
__decorate([
    Local
], SearchExample.prototype, "changeValue", void 0);
__decorate([
    Local
], SearchExample.prototype, "submitValue", void 0);
__decorate([
    Local
], SearchExample.prototype, "swiperIndex", void 0);
ViewStackProcessor.StartGetAccessRecordingFor(ViewStackProcessor.AllocateNewElmetIdForNextComponent());
loadDocument(new RatingExample(undefined, {}));
ViewStackProcessor.StopGetAccessRecording();
`
