/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { InsightIntentLink,
  LinkIntentDecoratorInfo,
  LinkIntentParamMapping } from "@ohos.app.ability.InsightIntentDecorator";

const linkParamMapping : LinkIntentParamMapping = {
  paramName : "aaa",
  paramMappingName : "ccc",
}
const validDataLink2: LinkIntentDecoratorInfo = {
  intentName: "Hello202a5",
  domain: "qqq",
  intentVersion: "1.0.1",
  displayName: "Home",
  icon: $r('app.media.startIcon'),
  displayDescription: 'music',
  uri: "/data/app/base",
  schema: "ControlPlayback",
  paramMappings : [linkParamMapping],
};

@InsightIntentLink(validDataLink2)
class aaa {
}