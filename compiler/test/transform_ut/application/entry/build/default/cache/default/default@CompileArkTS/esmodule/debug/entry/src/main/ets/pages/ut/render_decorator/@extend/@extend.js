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
"use strict";
let __generate__Id = 0;
function generateId() {
    return "@extend_" + ++__generate__Id;
}
function __Text__fancy(color) {
    Text.backgroundColor(color);
}
function __Text__superFancy(size) {
    Text.fontSize(size);
    __Text__fancy(Color.Red);
}
function __Button__fancybut(color) {
    Button.backgroundColor(color);
    Button.width(200);
    Button.height(100);
}
class FancyUse extends View {
    constructor(compilerAssignedUniqueChildId, parent, params, localStorage) {
        super(compilerAssignedUniqueChildId, parent, localStorage);
        this.updateWithValueParams(params);
    }
    updateWithValueParams(params) {
    }
    aboutToBeDeleted() {
        SubscriberManager.Get().delete(this.id());
    }
    render() {
        Column.create();
        Row.create();
        Text.create("Just Fancy");
        __Text__fancy(Color.Yellow);
        Text.pop();
        Text.create("Super Fancy Text");
        __Text__superFancy(24);
        Text.pop();
        Button.createWithLabel("Fancy Button");
        __Button__fancybut(Color.Green);
        Button.pop();
        Row.pop();
        Row.create({ space: 10 });
        Text.create("Fancy");
        __Text__fancytext(24);
        Text.pop();
        Row.pop();
        Column.pop();
    }
}
function __Text__fancytext(fontSize) {
    Text.fontColor(Color.Red);
    Text.fontSize(fontSize);
    Text.fontStyle(FontStyle.Italic);
}
loadDocument(new FancyUse("1", undefined, {}));
//# sourceMappingURL=@extend.js.map