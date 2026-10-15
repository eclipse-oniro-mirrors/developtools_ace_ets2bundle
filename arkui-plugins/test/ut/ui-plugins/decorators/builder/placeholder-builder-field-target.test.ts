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
import { mockBuildConfig } from '../../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../../utils/path-config';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { PluginContext, Plugins } from '../../../../../common/plugin-context';
import { LogInfo } from '../../../../../common/log-collector';
import { uiTransform } from '../../../../../ui-plugins';

const BUILDER_DIR_PATH: string = 'decorators/builder';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, BUILDER_DIR_PATH, 'placeholder-builder-field-target.ets'),
];

const pluginTester = new PluginTester(
    'test @Builder decorator arguments on a class field validation (D-1, Collector + validators)',
    buildConfig
);

const parsedTransform: Plugins = {
    name: 'parsed transform',
    parsed: uiTransform().parsed
};

const D1_MESSAGE = `The '@Builder' decorator can only pass arguments when decorating a global function`;

/** Reports of checkBuilderFieldDecoratorArguments (D-1 on class fields). */
let capturedReports: string[] = [];

function isBuilderFieldReport(logItem: LogInfo): boolean {
    return logItem.message === D1_MESSAGE;
}

function captureBuilderFieldReport(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedReports.push(`${logItem.message} @ ${logItem.node.dumpSrc()}`);
}

// Runs the ui-syntax linter flow at the checked state while capturing the class-field
// decorator-argument validation report instead of emitting it as an es2panda diagnostic.
const builderFieldValidationTransform: Plugins = {
    name: 'builder-field-validation',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedReports = [];
        return runCheckedLinterCapture(
            builderFieldValidationTransform.name,
            this,
            isBuilderFieldReport,
            captureBuilderFieldReport
        );
    },
};

function testBuilderFieldValidation(this: PluginTestContext): void {
    // D-1: exactly one — the class field carrying @Builder decorator arguments.
    expect(capturedReports.length).toBe(1);
    // The reported node is the Builder annotation usage carrying arguments.
    expect(capturedReports[0]).toContain('isPlaceholder');
    // Negative in the same file: the bare @Builder field stays legal (implicit via count).
}

pluginTester.run(
    'test @Builder decorator arguments on a class field validation (D-1, Collector + validators)',
    [parsedTransform, builderFieldValidationTransform],
    {
        checked: [testBuilderFieldValidation],
    },
    {
        stopAfter: 'checked',
    }
);
