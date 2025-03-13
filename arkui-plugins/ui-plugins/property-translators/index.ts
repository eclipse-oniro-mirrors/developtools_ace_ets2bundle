/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getArktsPath } from "../../path"
const arkts = require(getArktsPath());

import { PropertyTranslator } from "./base";
import { DecoratorNames, hasDecorator } from "./utils";
import { StateTranslator } from "./state";
import { StorageLinkTranslator } from "./storagelink";

export { PropertyTranslator };

export function classifyProperty(member: arkts.AstNode, structName: string): PropertyTranslator | undefined {
    if (!arkts.isClassProperty(member)) return undefined;

    if (hasDecorator(member, DecoratorNames.STATE)) {
        return new StateTranslator(member, structName);
    }
    if (hasDecorator(member, DecoratorNames.STORAGE_LINK)) {
        return new StorageLinkTranslator(member, structName);
    }
}
