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

'use strict';

const DIRECTION = '11-to-12';
const BUNDLE_NAME = 'com.example.dynamiccallsstaticprobe';
const STATIC_CLASS_RECORD = 'Lstatic_component/src/main/ets/StaticCounter/StaticCounter;';
const STATIC_OPTIONS_RECORD = 'Lstatic_component/src/main/ets/StaticCounter/__Options_StaticCounter;';
const STATIC_OPTIONS_INTERFACE =
  'Lstatic_component/src/main/ets/StaticCounter/' +
  'static_component$src$main$ets$StaticCounter$__Options_StaticCounter$ObjectLiteral;';

const STATIC_INDEX_SOURCE = `'use static'
export { StaticCounter } from './src/main/ets/StaticCounter';
`;

const STATIC_COUNTER_SOURCE = `'use static'
import { Component, Column, Text, Button } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@Component
export struct StaticCounter {
  @State public count: number = 0;

  aboutToAppear(): void {
    console.info('[DynamicCallsStaticProbe] static component appeared');
  }

  build(): void {
    Column(undefined) {
      Text('ArkTS 1.2 静态组件').fontSize(22).id('staticComponentTitle')
      Text('静态计数 ' + this.count.toString()).fontSize(24).margin({ top: 16 }).id('staticCount')
      Button('静态计数 +1').margin({ top: 16 }).id('staticIncrement').onClick(() => {
        this.count += 1;
        console.info('[DynamicCallsStaticProbe] static count=' + this.count.toString());
      })
    }
    .width('100%').padding(16)
  }
}
`;

const DYNAMIC_PAGE_SOURCE = `import { StaticCounter } from 'static_component';

@Entry
@Component
struct Index {
  @State counterSeed: number = 7;

  aboutToAppear(): void {
    console.info('[DynamicCallsStaticProbe] dynamic host appeared');
  }

  build() {
    Column() {
      Text('ArkTS 1.1 动态宿主').fontSize(26).id('dynamicHostTitle')
      Text('直接调用 ArkTS 1.2 静态组件').fontSize(18).margin({ top: 16 }).id('dynamicHostSubtitle')
      StaticCounter({ count: this.counterSeed })
      Button('更新静态组件参数').margin({ top: 16 }).id('dynamicParameterUpdate').onClick(() => {
        this.counterSeed += 1;
      })
    }
    .width('100%').height('100%').padding(24)
  }
}
`;

const ENTRY_ABILITY_SOURCE = `import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(stage: window.WindowStage): void {
    console.info('[DynamicCallsStaticProbe] dynamic EntryAbility load');
    stage.loadContent('pages/Index');
  }
}
`;

const UNIT_DYNAMIC_SOURCE = `@Component
export struct DynamicStateCard {
  @State value: number = 1;

  build() {
    Column() {
      Text(this.value.toString()).id('dynamicValue')
      Button('increment').id('dynamicIncrement').onClick(() => {
        this.value += 1;
      })
    }
  }
}
`;

const ROOT_HVIGORFILE = `import { appTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: appTasks };
`;

const ENTRY_HVIGORFILE = `import { hapTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: hapTasks };
`;

const STATIC_HVIGORFILE = `import { harTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: harTasks, plugins: [] };
`;

const APP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">' +
  '<rect width="96" height="96" rx="20" fill="#1769e0"/>' +
  '<rect x="12" y="32" width="72" height="32" rx="16" fill="#fff"/>' +
  '<rect x="15" y="35" width="30" height="26" rx="13" fill="#75afff"/></svg>\n';

const PROJECT_TEXT_FILES = Object.freeze({
  'hvigorfile.ts': ROOT_HVIGORFILE,
  'entry/hvigorfile.ts': ENTRY_HVIGORFILE,
  'static_component/hvigorfile.ts': STATIC_HVIGORFILE,
  'static_component/Index.ets': STATIC_INDEX_SOURCE,
  'static_component/src/main/ets/StaticCounter.ets': STATIC_COUNTER_SOURCE,
  'entry/src/main/ets/pages/Index.ets': DYNAMIC_PAGE_SOURCE,
  'entry/src/main/ets/entryability/EntryAbility.ets': ENTRY_ABILITY_SOURCE,
  'AppScope/resources/base/media/app_icon.svg': APP_ICON
});

const PROJECT_JSON_FILES = Object.freeze({
  'build-profile.json5': {
    app: {
      products: [{
        name: 'default',
        targetSdkVersion: '26.0.0',
        compatibleSdkVersion: '26.0.0',
        arkTSVersion: '1.2',
        runtimeOS: 'HarmonyOS',
        buildOption: {
          strictMode: {
            caseSensitiveCheck: true,
            useNormalizedOHMUrl: true
          }
        }
      }],
      buildModeSet: [{ name: 'debug' }, { name: 'release' }]
    },
    modules: [
      { name: 'static_component', srcPath: './static_component' },
      {
        name: 'entry',
        srcPath: './entry',
        targets: [{ name: 'default', applyToProducts: ['default'] }]
      }
    ]
  },
  'oh-package.json5': {
    modelVersion: '26.0.0',
    dependencies: {},
    devDependencies: {}
  },
  'hvigor/hvigor-config.json5': {
    modelVersion: '26.0.0',
    dependencies: {},
    execution: { daemon: false }
  },
  'AppScope/app.json5': {
    app: {
      bundleName: BUNDLE_NAME,
      vendor: 'interop-test',
      versionCode: 1000000,
      versionName: '1.0.0',
      icon: '$media:app_icon',
      label: '$string:app_name'
    }
  },
  'AppScope/resources/base/element/string.json': {
    string: [{ name: 'app_name', value: 'Interop dynamic calls static' }]
  },
  'entry/build-profile.json5': {
    apiType: 'stageMode',
    buildOption: {},
    targets: [{ name: 'default' }]
  },
  'entry/oh-package.json5': {
    name: 'entry',
    version: '1.0.0',
    dependencies: { static_component: 'file:../static_component' }
  },
  'entry/src/main/module.json5': {
    module: {
      name: 'entry',
      type: 'entry',
      description: '$string:module_desc',
      mainElement: 'EntryAbility',
      deviceTypes: ['phone', 'tablet'],
      deliveryWithInstall: true,
      installationFree: false,
      pages: '$profile:main_pages',
      abilities: [{
        name: 'EntryAbility',
        srcEntry: './ets/entryability/EntryAbility.ets',
        description: '$string:module_desc',
        icon: '$media:app_icon',
        label: '$string:app_name',
        exported: true,
        skills: [{
          entities: ['entity.system.home'],
          actions: ['action.system.home']
        }],
        startWindowIcon: '$media:app_icon',
        startWindowBackground: '$color:start_window_background'
      }]
    }
  },
  'entry/src/main/resources/base/profile/main_pages.json': {
    src: ['pages/Index']
  },
  'entry/src/main/resources/base/element/string.json': {
    string: [{ name: 'module_desc', value: 'Dynamic caller and static HAR' }]
  },
  'entry/src/main/resources/base/element/color.json': {
    color: [{ name: 'start_window_background', value: '#FFFFFF' }]
  },
  'static_component/build-profile.json5': {
    apiType: 'stageMode',
    buildOption: {},
    targets: [{ name: 'default' }]
  },
  'static_component/oh-package.json5': {
    name: 'static_component',
    version: '1.0.0',
    main: 'Index.ets',
    license: 'Apache-2.0',
    dependencies: {}
  },
  'static_component/src/main/module.json5': {
    module: {
      name: 'static_component',
      type: 'har',
      deviceTypes: ['phone', 'tablet']
    }
  }
});

function createProjectFiles() {
  const files = {};
  for (const [relativePath, content] of Object.entries(PROJECT_TEXT_FILES)) {
    files[relativePath] = content;
  }
  for (const [relativePath, value] of Object.entries(PROJECT_JSON_FILES)) {
    files[relativePath] = JSON.stringify(value, null, 2) + '\n';
  }
  return files;
}

module.exports = {
  BUNDLE_NAME,
  DIRECTION,
  PROJECT_JSON_FILES,
  PROJECT_TEXT_FILES,
  STATIC_CLASS_RECORD,
  STATIC_COUNTER_SOURCE,
  STATIC_INDEX_SOURCE,
  STATIC_OPTIONS_INTERFACE,
  STATIC_OPTIONS_RECORD,
  UNIT_DYNAMIC_SOURCE,
  createProjectFiles
};
