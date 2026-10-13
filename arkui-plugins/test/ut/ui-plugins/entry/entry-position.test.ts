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
import { PluginTester } from '../../../utils/plugin-tester';
import { mockBuildConfig } from '../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../utils/path-config';
import { BuildConfig, PluginTestContext } from '../../../utils/shared-types';
import { uiTransform } from '../../../../ui-plugins';
import { Plugins } from '../../../../common/plugin-context';

const ENTRY_DIR_PATH: string = 'entry';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, ENTRY_DIR_PATH, 'entry-only.ets'),
];

const pluginTester = new PluginTester('test @Entry startPosition setting', buildConfig);

const parsedTransform: Plugins = {
    name: 'entry-position',
    parsed: uiTransform().parsed
};

function testEntryPosition(this: PluginTestContext): void {
    const entryWrapperClasses = (this.positions ?? []).filter((p) => p.name === '__EntryWrapper');
    expect(entryWrapperClasses.length).toBeGreaterThan(0);
    expect(entryWrapperClasses[0].startLine).toBe(17);

    const registerCalls = (this.positions ?? []).filter((p) => p.dumpSrc.includes('RegisterNamedRouter'));
    expect(registerCalls.length).toBeGreaterThan(0);
    expect(registerCalls[0].startLine).toBe(17);
}

pluginTester.run(
    'test __EntryWrapper class and RegisterNamedRouter startPosition matches @Entry annotation',
    [parsedTransform],
    {
        'parsed': [testEntryPosition],
    },
    {
        stopAfter: 'parsed',
    }
);
