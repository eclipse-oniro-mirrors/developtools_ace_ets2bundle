/*
 * Copyright (c) 2022-2024 Huawei Device Co., Ltd.
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
 // To validate the rule that variables decorated by specified decorators can not have default value
 @Observed
 class Info {
    public info: number =0;

    constructor(info: number) {
        this.info = info;
    }
 }

 @Component
 struct child {
    @Consume('trial') bulubulu: string = 'bulubulu';
    @Link linkProperty : number = 4;
    @ObjectLink objectProperty: Info = new Info(32);

    build(){
        Row(){
            Text(this.bulubulu)
        }
    }
 }

 @Entry
 @Component
 struct parent {
    @State stateProperty: number = 6;
    @Provide provideProperty: Info = new Info(33);

    build(){
        Row(){
            child({
                linkProperty:this.stateProperty,
                objectProperty:this.provideProperty
            })
            Blank()
            Text(this.stateProperty)
        }
    }
 }