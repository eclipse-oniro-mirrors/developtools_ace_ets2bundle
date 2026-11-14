/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import * as path from 'path';
import { interopTransform } from '../../../interop-plugins';
import { mockBuildConfig } from '../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../utils/path-config';
import { PluginTester } from '../../utils/plugin-tester';
import { PluginTestContext } from '../../utils/shared-types';

const buildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, 'interop', 'wrapped-builder-alias-only.ets'),
];

function testAliasImports(this: PluginTestContext): void {
    const script = this.scriptSnapshot ?? '';
    // No Builder import or annotation in the input: selection must follow the aliases.
    expect(script).toContain('typed: WrappedBuilder<[RootNode]>');
    expect(script).toContain('register(): WrappedBuilder<[RootNode]>');
}

new PluginTester('recognize builder type aliases without a Builder import', buildConfig).run(
    'visit files importing annotated builder aliases',
    [interopTransform()],
    { 'checked:interop-plugin': [testAliasImports] },
    { stopAfter: 'checked' }
);
