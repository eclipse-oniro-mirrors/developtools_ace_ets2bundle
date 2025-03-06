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

import { ArktsObject } from "./ArktsObject"
import { global } from "../static/global"
import { KNativePointer } from "@koalaui/interop"
import { passString, unpackString } from "../utilities/private";
import { SourcePosition } from "./SourcePosition";

export class ImportPathManager extends ArktsObject {
    constructor(peer: KNativePointer) {
        super(peer)
    }

    static create(): ImportPathManager {
        return new ImportPathManager(
            global.es2panda._ETSParserGetImportPathManager(global.context)
        );
    }

    resolvePath(currentModulePath: string, importPath: string): string {
        const sourcePosition: SourcePosition = SourcePosition.create(0, 0);
        return unpackString(
            global.es2panda._ImportPathManagerResolvePathConst(
                global.context,
                this.peer,
                passString(currentModulePath),
                passString(importPath),
                sourcePosition.peer
            )
        );
    }
}