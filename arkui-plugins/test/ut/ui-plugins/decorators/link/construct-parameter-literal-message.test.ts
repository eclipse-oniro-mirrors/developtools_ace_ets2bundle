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
import { PluginTester } from '../../../../utils/plugin-tester';
import { runCheckedLinterCapture } from '../../../../utils/checked-linter-capture';
import { mockBuildConfig, mockProjectConfig } from '../../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../../utils/path-config';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { ProjectConfig, PluginContext, Plugins } from '../../../../../common/plugin-context';
import { LogInfo } from '../../../../../common/log-collector';
import { LogType } from '../../../../../common/predefines';
import { uiTransform } from '../../../../../ui-plugins';

const LINK_DIR_PATH: string = 'decorators/link';
const LITERAL_MESSAGE_ETS_NAME: string = 'construct-parameter-literal-message';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, LINK_DIR_PATH, `${LITERAL_MESSAGE_ETS_NAME}.ets`),
];

const projectConfig: ProjectConfig = mockProjectConfig();

const pluginTester = new PluginTester(
    'test @Link/@ObjectLink construct parameter regular property message validation (Collector + validators)',
    buildConfig,
    projectConfig
);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

const REGULAR_PROPERTY_MESSAGE = (decoratorName: string, propertyName: string): string =>
    `The 'regular' property value cannot be assigned to the '@${decoratorName}' property '${propertyName}'.`;

const REGULAR_PROPERTY_MESSAGE_PREFIX: string = "The 'regular' property value cannot be assigned to the '@";

interface CapturedReport {
    level: LogType;
    message: string;
    nodeDump: string;
}

let capturedReports: CapturedReport[] = [];

function captureRegularPropertyReport(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedReports.push({
        level: logItem.level,
        message: logItem.message,
        nodeDump: logItem.node.dumpSrc(),
    });
}

// Runs the ui-syntax linter flow at the checked state while capturing 'regular'
// property reports instead of emitting them as es2panda diagnostics.
const regularPropertyMessageTransform: Plugins = {
    name: 'regular-property-message',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedReports = [];
        return runCheckedLinterCapture(
            regularPropertyMessageTransform.name,
            this,
            (logItem: LogInfo): boolean => logItem.message.startsWith(REGULAR_PROPERTY_MESSAGE_PREFIX),
            captureRegularPropertyReport
        );
    },
};

function reportedRegularPropertyMessages(): string[] {
    return capturedReports.map((report: CapturedReport) => report.message);
}

function testRegularPropertyMessage(this: PluginTestContext): void {
    // The 'regular' property message states the violated target property without
    // dumping the assigned value source.
    const reported: string[] = reportedRegularPropertyMessages();
    expect(reported).toHaveLength(3);
    expect(reported).toContain(REGULAR_PROPERTY_MESSAGE('Link', 'linkLiteral'));
    expect(reported).toContain(REGULAR_PROPERTY_MESSAGE('Link', 'linkString'));
    expect(reported).toContain(REGULAR_PROPERTY_MESSAGE('ObjectLink', 'objectLinkInstance'));
    // Every reported 'regular' property message carries WARN level.
    expect(capturedReports.every((report: CapturedReport) => report.level === LogType.WARN)).toBe(true);
}

pluginTester.run(
    'test @Link/@ObjectLink construct parameter regular property message validation (Collector + validators)',
    [parsedTransform, regularPropertyMessageTransform],
    {
        checked: [testRegularPropertyMessage],
    },
    {
        stopAfter: 'checked',
    }
);
