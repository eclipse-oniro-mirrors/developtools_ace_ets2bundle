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

import { LANGUAGE_VERSION } from './predefines';
import { BuildConfig, DependentModuleConfig } from './plugin-context';


export class FileManager {
    private static instance: FileManager | undefined = undefined;
    static arkTSModuleMap: Map<string, DependentModuleConfig> = new Map();
    static staticApiPath: Set<string> = new Set();
    static dynamicApiPath: Set<string> = new Set();
    static buildConfig: BuildConfig;
    private constructor() { }

    static setInstance(instance: FileManager | undefined): void {
        if (instance === undefined) {
            FileManager.instance = new FileManager();
        }
        FileManager.instance = instance;
    }

    static getInstance(): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    getLanguageVersionByFilePath(filePath: string): string {
        return LANGUAGE_VERSION.ARKTS_1_2;
    }
}