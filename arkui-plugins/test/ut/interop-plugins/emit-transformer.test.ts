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
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, 'interop', 'wrapped-builder-checked-api.ets'),
];

function testParsedTransformer(this: PluginTestContext): void {
    const script = this.scriptSnapshot ?? '';
    expect(script).toContain('WrappedBuilder<CustomBuilderT<RootNode>>');
    expect(script).toContain('inlineBuilderVar: WrappedBuilder<((value: RootNode)=> void)>');
}

function testCheckedTransformer(this: PluginTestContext): void {
    const script = this.scriptSnapshot ?? '';
    expect(script).toContain('registerComponent(): Nullable<WrappedBuilder<[RootNode]>>');
    expect(script).toContain('registerImported(): WrappedBuilder<[RootNode]>');
    expect(script).toContain('registerMultiple(): WrappedBuilder<[string, number]>');
    expect(script).toContain('registerNested(): WrappedBuilder<[string, number]>');
    expect(script).toContain('registerInline(): WrappedBuilder<[string, number]>');
    expect(script).toContain('setBuilder(value: WrappedBuilder<[string, number]>)');
    expect(script).toContain('builders: Array<WrappedBuilder<[string, number]>>');
    expect(script).toContain('builderVar: WrappedBuilder<[RootNode]>');
    expect(script).toContain('inlineBuilderVar: WrappedBuilder<[RootNode]>');
    expect(script).toContain('acceptBuilder(builder: WrappedBuilder<[string, number]>)');
    expect(script).toContain('getBuilder(): WrappedBuilder<[RootNode]>');
    expect(script).toContain('builder: WrappedBuilder<[RootNode]>');
    expect(script).toContain('builder: WrappedBuilder<T>');
    expect(script).toContain('tupleBuilder: WrappedBuilder<[RootNode]>');
    expect(script).not.toContain('WrappedBuilder<[[RootNode]]>');
}

new PluginTester('transform WrappedBuilder after checking', buildConfig).run(
    'convert static builder signatures to dynamic parameter tuples',
    [interopTransform()],
    {
        'parsed:interop-plugin': [testParsedTransformer],
        'checked:interop-plugin': [testCheckedTransformer],
    },
    { stopAfter: 'checked' }
);
