/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

 @Observed
 class ObvservedClass {

 }

 @Observed
 class NestedObservedObject {
    @Track oc: ObvservedClass = new ObvservedClass();
 }

 @Reusable
 @Component
 struct Child {
    @Link a: string;
    noState: string = "";
    @State stateb: string = "";
    @Prop propc: string = "";
    @Provide provd: string = "";
    @Consume consf: string = "";
    @ObjectLink oblg: ObvservedClass;

    aboutToReuse(params: Record<string, Object | undefined | null>): void {
    
    }

    build() {
        Text('123')
    }
 }

 @Entry
 @Component
 @Reusable
 struct Index {
    @State message: string = "Hello World";
    @State noj: NestedObservedObject = new NestedObservedObject();
    @Provide consf: string = "123";
    @State switchA: boolean = true;

    build() {
        Column() {
            if (this.switchA) {
                Child({
                    a: this.message,
                    noState: this.message,
                    stateb: this.message,
                    propc: this.message,
                    provd: this.message,
                    oblg: this.noj.oc
                })
            }

            Button("Switch")
            .onClick(() => {
                this.switchA = !this.switchA;
            })
        }
        .height("100%")
        .width("100%")
    }
 }