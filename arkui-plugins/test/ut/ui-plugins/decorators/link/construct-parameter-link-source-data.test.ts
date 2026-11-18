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
const LINK_SOURCE_DATA_ETS_NAME: string = 'construct-parameter-link-source-data';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, LINK_DIR_PATH, `${LINK_SOURCE_DATA_ETS_NAME}.ets`),
];

const projectConfig: ProjectConfig = mockProjectConfig();

const pluginTester = new PluginTester(
    'test @Link construct parameter source data validation (Collector + validators)',
    buildConfig,
    projectConfig
);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

const LINK_SOURCE_DATA_MISMATCH = (propertyName: string): string =>
    `The type of the parent component's state variable initializing the '@Link' variable '${propertyName}' must match the '@Link' variable's declared type.`;

const LINK_SOURCE_DATA_MISMATCH_PATTERN: string = "must match the '@Link' variable's declared type";

interface CapturedReport {
    level: LogType;
    message: string;
    nodeDump: string;
}

let capturedReports: CapturedReport[] = [];

function captureLinkSourceDataReport(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedReports.push({
        level: logItem.level,
        message: logItem.message,
        nodeDump: logItem.node.dumpSrc(),
    });
}

// Runs the ui-syntax linter flow at the checked state while capturing @Link
// source data reports instead of emitting them as es2panda diagnostics.
const linkSourceDataValidationTransform: Plugins = {
    name: 'link-source-data-validation',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedReports = [];
        return runCheckedLinterCapture(
            linkSourceDataValidationTransform.name,
            this,
            (logItem: LogInfo): boolean => logItem.message.includes(LINK_SOURCE_DATA_MISMATCH_PATTERN),
            captureLinkSourceDataReport
        );
    },
};

function reportedLinkSourceDataMessages(): string[] {
    return capturedReports.map((report: CapturedReport) => report.message);
}

function testLinkSourceDataValidation(this: PluginTestContext): void {
    // Deep chains from this (optional chaining and plain member chains) initialize a
    // @Link variable from a nested state variable value: both must be reported.
    const reported: string[] = reportedLinkSourceDataMessages();
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkOptionalChain'));
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkPlainChain'));
    // Literals and regular identifiers are not this.xxx source data either.
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkLiteral'));
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkIdentifier'));
    // A type assertion does not promote other expressions to valid source data:
    // identifiers, literals and deep chains from this stay reported under `as`.
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkAsIdentifier'));
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkAsLiteral'));
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkAsPlainChain'));
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkAsOptionalChain'));
    // Direct this.xxx source data remains valid, also with a top-level non-null
    // assertion, a type assertion, both stacked, and when the member itself is a
    // regular (undecorated) property.
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkDirect'));
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkNonNull'));
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkAs'));
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkNonNullAs'));
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkRegularSource'));
    // A struct call in property-value position instantiates a slot with placeholder
    // options (the official @CustomDialog self-referencing controller builder): its
    // @Link targets are exempt, also when the value is wrapped in a type assertion.
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkInDialog'));
    expect(reported).not.toContain(LINK_SOURCE_DATA_MISMATCH('linkAsSlotValue'));
    // The exemption is anchored to the property-value position: a type-asserted struct
    // call outside a property value (a plain return value here) stays reported.
    expect(reported).toContain(LINK_SOURCE_DATA_MISMATCH('linkAsSlotReturn'));
    // The reported set is exactly the eight invalid forms above plus the non-property
    // type-asserted struct call.
    expect(reported.length).toBe(9);
    // @ObjectLink targets are out of scope for this rule.
    expect(reported.every((message: string) => !message.includes('objectLinkLiteral'))).toBe(true);
    // Every reported link source data mismatch carries ERROR level.
    expect(capturedReports.every((report: CapturedReport) => report.level === LogType.ERROR)).toBe(true);
}

pluginTester.run(
    'test @Link construct parameter source data validation (Collector + validators)',
    [parsedTransform, linkSourceDataValidationTransform],
    {
        checked: [testLinkSourceDataValidation],
    },
    {
        stopAfter: 'checked',
    }
);
