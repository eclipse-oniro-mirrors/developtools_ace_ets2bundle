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

/**
 * Message-parity test: every '@ObjectLink cannot be used with this type' report emitted
 * by the static validators must use the canonical text aligned with Dynamic ArkTS
 * (validateNonObservedClassType, code 10905307).
 *
 * The fixture exercises every checkPropertyType reporting site (basic types, '@ObservedV2'
 * class, invalid union) plus the checkObjectLinkFunctionType 'Function' case, so a text
 * drift between the two rules (or vs Dynamic ArkTS) fails here.
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
import { uiTransform } from '../../../../../ui-plugins';

const OBJECTLINK_DIR_PATH: string = 'decorators/objectlink';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, OBJECTLINK_DIR_PATH, 'objectlink-message-probe.ets'),
];

const projectConfig: ProjectConfig = mockProjectConfig();

const pluginTester = new PluginTester(
    'test @ObjectLink type message parity across static validators',
    buildConfig,
    projectConfig
);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

// Canonical text: identical in checkObjectLinkFunctionType and checkPropertyType,
// aligned with Dynamic ArkTS '10905307'.
const OBJECTLINK_TYPE_MESSAGE = '\'@ObjectLink\' cannot be used with this type. ' +
    'Apply it only to classes decorated by \'@Observed\' or initialized using the return value of \'makeV1Observed\'.';

let capturedMessages: Array<{ name: string; message: string }> = [];

// Deliberately broader than an exact match: any other '@ObjectLink' type-message variant
// (e.g. one rule drifting back to the short text) must be caught here.
function isObjectLinkTypeMessage(logItem: LogInfo): boolean {
    return logItem.message.includes('cannot be used with this type');
}

function captureMessage(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedMessages.push({ name: logItem.node.dumpSrc(), message: logItem.message });
}

const probeTransform: Plugins = {
    name: 'objectlink-message-probe',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedMessages = [];
        return runCheckedLinterCapture(probeTransform.name, this, isObjectLinkTypeMessage, captureMessage);
    },
};

/** Property names reported for @ObjectLink type violations by any rule. */
function reportedProperties(): string[] {
    return capturedMessages.map((item) => item.name);
}

pluginTester.run(
    'test @ObjectLink type message parity across static validators',
    [parsedTransform, probeTransform],
    {
        checked: [function (this: PluginTestContext): void {
            const reported: string[] = reportedProperties();
            // Invalid: basic types and '@ObservedV2' class (checkPropertyType sites)
            expect(reported).toContain('numValue');
            expect(reported).toContain('strValue');
            expect(reported).toContain('v2Value');
            // Invalid: 'Function' type reference (checkObjectLinkFunctionType)
            expect(reported).toContain('fn');
            // Invalid: union containing a 'Function' member (reported by both rules)
            expect(reported).toContain('fnUnion');
            // Valid: '@Observed' class (control case) must not be reported
            expect(reported).not.toContain('data');
            // No rule may report the same property twice: 'fnUnion' is owned by
            // checkObjectLinkFunctionType and must not be duplicated by checkPropertyType
            expect(reported.length).toBe(new Set(reported).size);
            expect(reported.filter((name) => name === 'fnUnion').length).toBe(1);
            // Parity: every captured message must be the canonical Dynamic ArkTS-aligned text
            capturedMessages.forEach((item) => {
                expect(item.message).toBe(OBJECTLINK_TYPE_MESSAGE);
            });
        }],
    },
    {
        stopAfter: 'checked',
    }
);
