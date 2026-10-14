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
import { PluginTester } from '../../../../utils/plugin-tester';
import { mockBuildConfig } from '../../../../utils/artkts-config';
import { getRootPath, MOCK_ENTRY_DIR_PATH } from '../../../../utils/path-config';
import { beforeUINoRecheck, uiNoRecheck, recheck } from '../../../../utils/plugins';
import { BuildConfig, PluginTestContext } from '../../../../utils/shared-types';
import { uiTransform } from '../../../../../ui-plugins';
import { Plugins } from '../../../../../common/plugin-context';

const OBSERVED_TRACK_DIR_PATH: string = 'decorators/observed-track';

const buildConfig: BuildConfig = mockBuildConfig();
buildConfig.compileFiles = [
    path.resolve(getRootPath(), MOCK_ENTRY_DIR_PATH, OBSERVED_TRACK_DIR_PATH, 'observed-track.ets'),
];

const pluginTester = new PluginTester('test @Track backingField startPosition setting', buildConfig);

const parsedTransform: Plugins = {
    name: 'observed-track-position',
    parsed: uiTransform().parsed
};

function testTrackBackingFieldPosition(this: PluginTestContext): void {
    const trackB = (this.positions ?? []).filter((p) => p.name === '__backing_trackB');
    expect(trackB.length).toBeGreaterThan(0);
    expect(trackB[0].startLine).toBe(20);

    const newProp = (this.positions ?? []).filter((p) => p.name === '__backing_newProp');
    expect(newProp.length).toBeGreaterThan(0);
    expect(newProp[0].startLine).toBe(21);
}

pluginTester.run(
    'test @Track backingField startPosition matches original tracked property',
    [parsedTransform, beforeUINoRecheck, uiNoRecheck, recheck],
    {
        'checked:ui-no-recheck': [testTrackBackingFieldPosition],
    },
    {
        stopAfter: 'checked',
    }
);
