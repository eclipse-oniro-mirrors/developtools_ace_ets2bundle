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

import * as path from 'path';
import * as arkts from '@koalaui/libarkts';
import { PluginTester } from '../../../utils/plugin-tester';
import { runCheckedLinterCapture } from '../../../utils/checked-linter-capture';
import { mockBuildConfig } from '../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../utils/path-config';
import { BuildConfig, PluginTestContext } from '../../../utils/shared-types';
import { PluginContext, Plugins } from '../../../../common/plugin-context';
import { LogCollector, LogInfo } from '../../../../common/log-collector';
import { LogType } from '../../../../common/predefines';
import { uiTransform } from '../../../../ui-plugins';
import { beforeUINoRecheck, uiNoRecheck } from '../../../utils/plugins';

const COMPONENT_DIR_PATH: string = 'component';
const NO_TYPE_ETS_NAME: string = 'struct-property-no-type';
const NO_TYPE_PROPERTY_NAME: string = 'animationScaleListerner';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, COMPONENT_DIR_PATH, `${NO_TYPE_ETS_NAME}.ets`),
];

const pluginTester = new PluginTester(
    'test struct property no-type validation',
    buildConfig
);

const parsedTransform: Plugins = {
    name: 'parsed transform',
    parsed: uiTransform().parsed
};

const NO_TYPE_MESSAGE_PREFIX: string = 'Struct property ';
const NO_TYPE_MESSAGE_SUFFIX: string = ' has no type.';

function isStructPropertyNoTypeReport(logItem: LogInfo): boolean {
    return logItem.message.startsWith(NO_TYPE_MESSAGE_PREFIX) && logItem.message.endsWith(NO_TYPE_MESSAGE_SUFFIX);
}

interface CapturedNoTypeReport {
    level: LogType;
    message: string;
    nodeDump: string;
}

let capturedReports: CapturedNoTypeReport[] = [];

function captureStructPropertyNoTypeReport(logItem: LogInfo): void {
    capturedReports.push({
        level: logItem.level,
        message: logItem.message,
        nodeDump: logItem.node.dumpSrc(),
    });
}

type EmitLogInfo = (this: LogCollector) => void;

let originalEmitLogInfo: EmitLogInfo | undefined;

function capturingEmitLogInfo(this: LogCollector): void {
    this.logInfos.forEach((logItem: LogInfo) => {
        if (isStructPropertyNoTypeReport(logItem)) {
            captureStructPropertyNoTypeReport(logItem);
        }
    });
}

function stubLogCollectorEmit(): void {
    originalEmitLogInfo = LogCollector.prototype.emitLogInfo;
    LogCollector.prototype.emitLogInfo = capturingEmitLogInfo;
}

function restoreLogCollectorEmit(): void {
    if (!originalEmitLogInfo) {
        return;
    }
    LogCollector.prototype.emitLogInfo = originalEmitLogInfo;
    originalEmitLogInfo = undefined;
}

const structValidationCapture: Plugins = {
    name: 'struct-validation-capture',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedReports = [];
        return runCheckedLinterCapture(
            structValidationCapture.name,
            this,
            isStructPropertyNoTypeReport,
            captureStructPropertyNoTypeReport
        );
    },
};

const uiNoRecheckWithCapture: Plugins = {
    name: uiNoRecheck.name,
    checked(this: PluginContext): arkts.ETSModule | undefined {
        stubLogCollectorEmit();
        try {
            return uiNoRecheck.checked.call(this);
        } finally {
            restoreLogCollectorEmit();
        }
    },
};

function testStructPropertyNoTypeReports(this: PluginTestContext): void {
    expect(capturedReports.length).toBe(1);
    expect(capturedReports[0].level).toBe(LogType.ERROR);
    expect(capturedReports[0].message).toBe(`Struct property '${NO_TYPE_PROPERTY_NAME}' has no type.`);
    expect(capturedReports[0].nodeDump).toContain(NO_TYPE_PROPERTY_NAME);
}

pluginTester.run(
    'transform struct property no-type validation',
    [parsedTransform, structValidationCapture, beforeUINoRecheck, uiNoRecheckWithCapture],
    {
        checked: [testStructPropertyNoTypeReports],
    },
    {
        stopAfter: 'checked',
    }
);
