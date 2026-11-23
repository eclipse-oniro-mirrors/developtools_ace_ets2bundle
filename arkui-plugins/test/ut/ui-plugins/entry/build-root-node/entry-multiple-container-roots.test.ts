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

// Two root nodes in an '@Entry' 'build' are reported with the entry message.
const BUILD_ROOT_NODE_DIR_PATH = 'entry/build-root-node';
const BUILD_ROOT_NODE_ETS_NAME = 'entry-multiple-container-roots';

const INVALID_ENTRY_BUILD_ROOT = `In an '@Entry' decorated component, the 'build' method can have only one root node, which must be a container component.`;
const INVALID_BUILD_ROOT = `The 'build' method can have only one root node.`;

const buildConfig: BuildConfig = mockBuildConfig();
const projectConfig: ProjectConfig = mockProjectConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, BUILD_ROOT_NODE_DIR_PATH, `${BUILD_ROOT_NODE_ETS_NAME}.ets`),
];

const pluginTester = new PluginTester('Entry build with multiple container roots is reported', buildConfig, projectConfig);

// Reports of the build-root-node rule, captured at the validator layer because the mock
// test driver cannot emit es2panda diagnostics.
let capturedMessages: string[] = [];

// Structs must be translated at the parsed phase before the checker runs (ESE0364),
// mirroring production where ui_plugin runs before the ui-syntax linter at checked.
const parsedTransform: Plugins = {
    name: 'parsed-trans',
    parsed: uiTransform().parsed,
};

const buildRootNodeLinter: Plugins = {
    name: 'build-root-node-linter',
    checked(this: PluginContext): arkts.ETSModule | undefined {
        capturedMessages = [];
        return runCheckedLinterCapture(
            buildRootNodeLinter.name,
            this,
            (logItem: LogInfo) => logItem.message === INVALID_ENTRY_BUILD_ROOT || logItem.message === INVALID_BUILD_ROOT,
            (logItem: LogInfo) => capturedMessages.push(logItem.message),
        );
    },
};

function testCheckedLinter(this: PluginTestContext): void {
    expect(capturedMessages).toEqual([INVALID_ENTRY_BUILD_ROOT]);
}

pluginTester.run(
    BUILD_ROOT_NODE_ETS_NAME,
    [parsedTransform, buildRootNodeLinter],
    { checked: [testCheckedLinter] },
    { stopAfter: 'checked' }
);
