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
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, BUILDER_DIR_PATH, 'placeholder-builder-invalid.ets'),
];

const pluginTester = new PluginTester(
    'test @Builder decorator-arguments validation (D-1/D-3/D-4, Collector + validators)',
    buildConfig
);

const parsedTransform: Plugins = {
    name: 'parsed transform',
    parsed: uiTransform().parsed
};

const D1_MESSAGE = `Only global functions decorated with @Builder support parameter passing.`;
const D4_MESSAGE = `An @Builder function with placeholder capabilities does not support parameter passing.`;
const D3_MESSAGE = `The 'isPlaceholder' option of the @Builder decorator only supports passing boolean literal.`;

/** Messages reported by checkBuilderMethodDecoratorArguments (D-1) and
 *  checkBuilderPlaceholderOptions (D-3 + D-4); the annotation dump distinguishes sites. */
let capturedReports: string[] = [];

function isPlaceholderBuilderReport(logItem: LogInfo): boolean {
    return logItem.message === D1_MESSAGE || logItem.message === D3_MESSAGE || logItem.message === D4_MESSAGE;
}

function capturePlaceholderBuilderReport(logItem: LogInfo): void {
    // Resolve eagerly: native nodes are freed after the compile job ends.
    capturedReports.push(`${logItem.message} @ ${logItem.node.dumpSrc()}`);
}

// Runs the ui-syntax linter flow at the checked state while capturing @Builder
// decorator-argument validation reports instead of emitting them as es2panda diagnostics.
const builderValidationTransform: Plugins = {
    name: 'builder-validation',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedReports = [];
        return runCheckedLinterCapture(
            builderValidationTransform.name,
            this,
            isPlaceholderBuilderReport,
            capturePlaceholderBuilderReport
        );
    },
};

function testPlaceholderBuilderValidation(this: PluginTestContext): void {
    const d4Reports = capturedReports.filter((report) => report.startsWith(D4_MESSAGE));
    const d1Reports = capturedReports.filter((report) => report.startsWith(D1_MESSAGE));
    const d3Reports = capturedReports.filter((report) => report.startsWith(D3_MESSAGE));

    // D-4: exactly one — the global placeholder builder declaring parameters.
    expect(d4Reports.length).toBe(1);
    // D-1: struct member AND normal-class member each reported independently.
    expect(d1Reports.length).toBe(2);
    // The reported node is the Builder annotation usage carrying arguments.
    d1Reports.forEach((report) => expect(report).toContain('isPlaceholder'));
    expect(d4Reports[0]).toContain('isPlaceholder');
    // D-3: no reports at the checked state — constant boolean expressions (e.g.
    // 'true && false') fold to literals before this phase and stay legal; checker-dirty
    // forms (missing/unknown keys, non-literal or non-constant values) are rejected by
    // the front-end before this phase. The checked-state D-3 rule stays as
    // defense-in-depth for any form the front-end neither folds nor rejects. Bare
    // '@Builder', '@Builder()' and '@Builder({})' stay lenient, same as the dynamic side.
    expect(d3Reports.length).toBe(0);
}

pluginTester.run(
    'test @Builder decorator-arguments validation (D-1/D-3/D-4, Collector + validators)',
    [parsedTransform, builderValidationTransform],
    {
        checked: [testPlaceholderBuilderValidation],
    },
    {
        stopAfter: 'checked',
    }
);
