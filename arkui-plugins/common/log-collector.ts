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

import * as arkts from '@koalaui/libarkts';
import { LogType } from './predefines';

interface LogInfo {
    type: LogType;
    message: string;
    node: arkts.AstNode;
    code: string;
}

export function generateDiagnosticKind(logItem: LogInfo): arkts.DiagnosticKind {
    return arkts.DiagnosticKind.create(
        `${logItem.code}: ${logItem.message}`,
        logItem.type === LogType.ERROR
            ? arkts.PluginDiagnosticType.ES2PANDA_PLUGIN_ERROR
            : arkts.PluginDiagnosticType.ES2PANDA_PLUGIN_WARNING
    );
}

export class LogCollector {
    public logInfos: LogInfo[];
    private static instance: LogCollector;

    private constructor() {
        this.logInfos = [];
    }

    static getInstance(): LogCollector {
        if (!this.instance) {
            this.instance = new LogCollector();
        }
        return this.instance;
    }

    reset(): void {
        this.logInfos = [];
    }

    collectLogInfo(logItem: LogInfo): void {
        this.logInfos.push(logItem);
    }

    emitLogInfo(): void {
        this.logInfos.forEach((logItem: LogInfo) => {
            arkts.Diagnostic.logDiagnostic(generateDiagnosticKind(logItem), arkts.getStartPosition(logItem.node));
        });
    }
}
