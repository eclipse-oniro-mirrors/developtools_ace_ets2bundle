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

const path = require('path');
const {
  appIcon,
  linkDependency
} = require('../static_calls_dynamic_basic/project_files');
const {
  callerArguments,
  dynamicIndex,
  dynamicSource
} = require('./source_cases');
const { projectContract } = require('./expected_cases');

function rootBuildProfile() {
  return `{
  "app": {
    "products": [
      {
        "name": "default",
        "targetSdkVersion": "26.0.0",
        "compatibleSdkVersion": "26.0.0",
        "arkTSVersion": "1.2",
        "runtimeOS": "HarmonyOS",
        "buildOption": {
          "strictMode": {
            "caseSensitiveCheck": true,
            "useNormalizedOHMUrl": true
          }
        }
      }
    ],
    "buildModeSet": [
      {
        "name": "debug"
      },
      {
        "name": "release"
      }
    ]
  },
  "modules": [
    {
      "name": "dynamic_component",
      "srcPath": "./dynamic_component"
    },
    {
      "name": "entry",
      "srcPath": "./entry",
      "targets": [
        {
          "name": "default",
          "applyToProducts": [
            "default"
          ]
        }
      ]
    }
  ]
}
`;
}

function libraryBuildProfile() {
  return `{
  "apiType": "stageMode",
  "buildOption": {},
  "targets": [
    {
      "name": "default"
    }
  ]
}
`;
}

function appScopeManifest() {
  return `{
  "app": {
    "bundleName": "${projectContract.bundleName}",
    "vendor": "OpenHarmony",
    "versionCode": 1000000,
    "versionName": "1.0.0",
    "icon": "$media:app_icon",
    "label": "$string:app_name"
  }
}
`;
}

function entryModuleManifest() {
  return `{
  "module": {
    "name": "entry",
    "type": "entry",
    "description": "$string:module_desc",
    "mainElement": "EntryAbility",
    "deviceTypes": [
      "phone",
      "tablet"
    ],
    "deliveryWithInstall": true,
    "installationFree": false,
    "pages": "$profile:main_pages",
    "abilities": [
      {
        "name": "EntryAbility",
        "srcEntry": "./ets/entryability/EntryAbility.ets",
        "description": "$string:module_desc",
        "icon": "$media:app_icon",
        "label": "$string:app_name",
        "exported": true,
        "skills": [
          {
            "entities": [
              "entity.system.home"
            ],
            "actions": [
              "action.system.home"
            ]
          }
        ],
        "startWindowIcon": "$media:app_icon",
        "startWindowBackground": "$color:start_window_background"
      }
    ]
  }
}
`;
}

function dynamicModuleManifest() {
  return `{
  "module": {
    "name": "dynamic_component",
    "type": "har",
    "deviceTypes": [
      "phone",
      "tablet"
    ]
  }
}
`;
}

function staticCaller(testCase) {
  const args = callerArguments(testCase);
  let invocation = `      ${testCase.componentName}()`;
  if (args.length > 0) {
    const properties = args.map(argument => `        ${argument.name}: ${argument.value}`).join(',\n');
    invocation = `      ${testCase.componentName}({\n${properties}\n      })`;
  }
  return `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { ${testCase.componentName} } from 'dynamic_component';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text('PR06 ${testCase.id}')
        .fontSize(20)
        .id('scenarioTitle')
${invocation}
    }
    .width('100%')
    .height('100%')
    .padding(24)
  }
}
`;
}

function entryAbility(testCase) {
  return `'use static'
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(stage: window.WindowStage): void {
    console.info('[InteropUiPr06] ${testCase.id}');
    stage.loadContent('pages/Index');
  }
}
`;
}

function buildProfileConstants() {
  return `export const HAR_VERSION = '1.0.0';
export const BUILD_MODE_NAME = 'debug';
export const DEBUG = true;
export const TARGET_NAME = 'default';

export default class BuildProfile {
  static readonly HAR_VERSION = HAR_VERSION;
  static readonly BUILD_MODE_NAME = BUILD_MODE_NAME;
  static readonly DEBUG = DEBUG;
  static readonly TARGET_NAME = TARGET_NAME;
}
`;
}

function entryProjectFiles(testCase) {
  return {
    'entry/build-profile.json5': libraryBuildProfile(),
    'entry/hvigorfile.ts': `import { hapTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: hapTasks };
`,
    'entry/oh-package.json5': `{
  "name": "entry",
  "version": "1.0.0",
  "dependencies": {
    "dynamic_component": "file:../dynamic_component"
  }
}
`,
    'entry/src/main/module.json5': entryModuleManifest(),
    'entry/src/main/ets/pages/Index.ets': staticCaller(testCase),
    'entry/src/main/ets/entryability/EntryAbility.ets': entryAbility(testCase),
    'entry/src/main/resources/base/profile/main_pages.json': `{
  "src": [
    "pages/Index"
  ]
}
`,
    'entry/src/main/resources/base/element/string.json': `{
  "string": [
    {
      "name": "module_desc",
      "value": "Static caller consuming primitive dynamic properties"
    }
  ]
}
`,
    'entry/src/main/resources/base/element/color.json': `{
  "color": [
    {
      "name": "start_window_background",
      "value": "#FFFFFF"
    }
  ]
}
`,
    'entry/src/main/resources/base/media/app_icon.svg': appIcon
  };
}

function dynamicProjectFiles(testCase) {
  return {
    'dynamic_component/build-profile.json5': libraryBuildProfile(),
    'dynamic_component/hvigorfile.ts': `import { harTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: harTasks, plugins: [] };
`,
    'dynamic_component/oh-package.json5': `{
  "name": "dynamic_component",
  "version": "1.0.0",
  "main": "Index.ets",
  "license": "Apache-2.0",
  "dependencies": {}
}
`,
    'dynamic_component/Index.ets': dynamicIndex(testCase),
    'dynamic_component/BuildProfile.ets': buildProfileConstants(),
    'dynamic_component/src/main/module.json5': dynamicModuleManifest(),
    [`dynamic_component/src/main/ets/${testCase.sourceName}`]: dynamicSource(testCase),
    'dynamic_component/src/main/resources/base/element/string.json': `{
  "string": [
    {
      "name": "dynamic_component_description",
      "value": "ArkTS 1.1 basic property callee"
    }
  ]
}
`
  };
}

function projectFiles(testCase, sdkRoot) {
  const portableSdkRoot = sdkRoot.replace(/\\/g, '/');
  return {
    'build-profile.json5': rootBuildProfile(),
    'hvigorfile.ts': `import { appTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: appTasks };
`,
    'hvigor/hvigor-config.json5': `{
  "modelVersion": "26.0.0",
  "dependencies": {},
  "execution": {
    "daemon": false
  }
}
`,
    'oh-package.json5': `{
  "modelVersion": "26.0.0",
  "dependencies": {},
  "devDependencies": {}
}
`,
    'local.properties': `sdk.dir=${portableSdkRoot}\n`,
    'AppScope/app.json5': appScopeManifest(),
    'AppScope/resources/base/media/app_icon.svg': appIcon,
    'AppScope/resources/base/element/string.json': `{
  "string": [
    {
      "name": "app_name",
      "value": "Interop UI PR06"
    }
  ]
}
`,
    ...entryProjectFiles(testCase),
    ...dynamicProjectFiles(testCase)
  };
}

function materializeProject(workspace, testCase, sdkRoot) {
  const files = projectFiles(testCase, sdkRoot);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, 'dynamic_component', 'dynamic_component');
  return {
    projectRoot: workspace.root,
    dependency,
    fileCount: Object.keys(files).length,
    entrySource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    calleeSource: path.join(workspace.root, `dynamic_component/src/main/ets/${testCase.sourceName}`)
  };
}

function callerLocations(testCase) {
  const lines = staticCaller(testCase).split('\n');
  const componentCallLine = lines.findIndex(line => line.includes(`${testCase.componentName}(`)) + 1;
  const argumentLines = {};
  for (const argument of callerArguments(testCase)) {
    const prefix = `${argument.name}:`;
    argumentLines[argument.name] = lines.findIndex(line => line.trim().startsWith(prefix)) + 1;
  }
  return { componentCallLine, argumentLines };
}

module.exports = {
  appScopeManifest,
  buildProfileConstants,
  callerLocations,
  dynamicModuleManifest,
  entryAbility,
  entryModuleManifest,
  libraryBuildProfile,
  materializeProject,
  projectFiles,
  rootBuildProfile,
  staticCaller
};
