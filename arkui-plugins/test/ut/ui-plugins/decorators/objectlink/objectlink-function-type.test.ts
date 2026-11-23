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
import { uiTransform } from '../../../../../ui-plugins';

const OBJECTLINK_DIR_PATH: string = 'decorators/objectlink';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, OBJECTLINK_DIR_PATH, 'objectlink-function-type.ets'),
];

const projectConfig: ProjectConfig = mockProjectConfig();

const pluginTester = new PluginTester(
    'test @ObjectLink Function-type property validation (Collector + validators)',
    buildConfig,
    projectConfig
);

const parsedTransform: Plugins = {
    name: 'parsedTrans',
    parsed: uiTransform().parsed
};

// Canonical @ObjectLink type-error text: both the Function-type rule
// (checkObjectLinkFunctionType) and the type/union validation (checkPropertyType)
// emit this message, aligned with Dynamic ArkTS (code 10905307).
const OBJECTLINK_TYPE_MESSAGE = '\'@ObjectLink\' cannot be used with this type. ' +
    'Apply it only to classes decorated by \'@Observed\' or initialized using the return value of \'makeV1Observed\'.';

// Property names reported as invalid by the validator layer
// (both rules report at the property name identifier).
let capturedPropertyNames: string[] = [];

function isObjectLinkTypeInvalid(logItem: LogInfo): boolean {
    return logItem.message === OBJECTLINK_TYPE_MESSAGE;
}

function captureInvalidObjectLinkPropertyName(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedPropertyNames.push(logItem.node.dumpSrc());
}

// Runs the Collector + validators flow at the checked state while capturing
// @ObjectLink type reports instead of emitting them as es2panda diagnostics.
const objectLinkFunctionTypeTransform: Plugins = {
    name: 'objectlink-function-type-validation',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedPropertyNames = [];
        return runCheckedLinterCapture(
            objectLinkFunctionTypeTransform.name,
            this,
            isObjectLinkTypeInvalid,
            captureInvalidObjectLinkPropertyName
        );
    },
};

/** Property names of @ObjectLink properties reported as invalid by either rule. */
function reportedInvalidObjectLinkProperties(): string[] {
    return capturedPropertyNames;
}

function testParsedAndCheckedTransformer(this: PluginTestContext): void {
    // Invalid: 'Function' type reference, type alias resolving to 'Function',
    // union containing a 'Function' member
    const reported: string[] = reportedInvalidObjectLinkProperties();
    expect(reported).toContain('fn');
    expect(reported).toContain('fnAlias');
    expect(reported).toContain('fnUnion');
    // Valid: lambda types are anonymous (no 'Function' symbol) and must not be reported by ANY rule
    // (checkObjectLinkFunctionType and checkPropertyType alike):
    // direct lambda type, alias to a lambda type, union of only lambda types
    expect(reported).not.toContain('handler');
    expect(reported).not.toContain('cb');
    expect(reported).not.toContain('pureLambdaUnion');
    // Valid: '@Observed' class type (control case, must not be reported)
    expect(reported).not.toContain('data');
}

pluginTester.run(
    'test @ObjectLink Function-type property validation (Collector + validators)',
    [parsedTransform, objectLinkFunctionTypeTransform],
    {
        checked: [testParsedAndCheckedTransformer],
    },
    {
        stopAfter: 'checked',
    }
);
