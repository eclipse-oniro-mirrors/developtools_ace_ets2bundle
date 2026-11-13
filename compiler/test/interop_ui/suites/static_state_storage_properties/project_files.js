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

const fs = require('fs');
const path = require('path');
const {
  appIcon,
  libraryBuildProfile,
  linkDependency
} = require('../static_calls_dynamic_basic/project_files');
const {
  dynamicIndex,
  dynamicStateStorage,
  entryAbility,
  moduleIdentity,
  staticCaller,
  staticPreparationCaller
} = require('./source_cases');

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
      "name": "dynamic_state_storage",
      "srcPath": "./dynamic_state_storage"
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

function appScopeManifest() {
  return `{
  "app": {
    "bundleName": "${moduleIdentity.bundleName}",
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
    "name": "dynamic_state_storage",
    "type": "har",
    "deviceTypes": [
      "phone",
      "tablet"
    ]
  }
}
`;
}

function projectFiles(sdkRoot, callerSource = staticPreparationCaller) {
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
      "value": "Interop UI PR09"
    }
  ]
}
`,
    'entry/build-profile.json5': libraryBuildProfile(),
    'entry/hvigorfile.ts': `import { hapTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: hapTasks };
`,
    'entry/oh-package.json5': `{
  "name": "entry",
  "version": "1.0.0",
  "dependencies": {
    "dynamic_state_storage": "file:../dynamic_state_storage"
  }
}
`,
    'entry/src/main/module.json5': entryModuleManifest(),
    'entry/src/main/ets/pages/Index.ets': callerSource,
    'entry/src/main/ets/entryability/EntryAbility.ets': entryAbility,
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
      "value": "Static caller consuming V1 state and storage properties"
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
    'entry/src/main/resources/base/media/app_icon.svg': appIcon,
    'dynamic_state_storage/build-profile.json5': libraryBuildProfile(),
    'dynamic_state_storage/hvigorfile.ts': `import { harTasks } from '@ohos/hvigor-ohos-plugin';
export default { system: harTasks, plugins: [] };
`,
    'dynamic_state_storage/oh-package.json5': `{
  "name": "dynamic_state_storage",
  "version": "1.0.0",
  "main": "Index.ets",
  "license": "Apache-2.0",
  "dependencies": {}
}
`,
    'dynamic_state_storage/Index.ets': dynamicIndex,
    'dynamic_state_storage/BuildProfile.ets': `export const HAR_VERSION = '1.0.0';
export const BUILD_MODE_NAME = 'debug';
export const DEBUG = true;
export const TARGET_NAME = 'default';

export default class BuildProfile {
  static readonly HAR_VERSION = HAR_VERSION;
  static readonly BUILD_MODE_NAME = BUILD_MODE_NAME;
  static readonly DEBUG = DEBUG;
  static readonly TARGET_NAME = TARGET_NAME;
}
`,
    'dynamic_state_storage/src/main/module.json5': dynamicModuleManifest(),
    'dynamic_state_storage/src/main/ets/DynamicStateStorage.ets': dynamicStateStorage,
    'dynamic_state_storage/src/main/resources/base/element/string.json': `{
  "string": [
    {
      "name": "dynamic_state_storage_description",
      "value": "ArkTS 1.1 V1 state and storage callee"
    }
  ]
}
`
  };
}

function materializeProject(workspace, sdkRoot) {
  const files = projectFiles(sdkRoot);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, moduleIdentity.packageName, moduleIdentity.packageName);
  return {
    projectRoot: workspace.root,
    dependency,
    fileCount: Object.keys(files).length,
    entrySource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    calleeSource: path.join(workspace.root,
      'dynamic_state_storage/src/main/ets/DynamicStateStorage.ets'),
    callerLanguage: '1.2',
    calleeLanguage: '1.1'
  };
}

function activateStaticCaller(workspace) {
  const callerPath = workspace.write('entry/src/main/ets/pages/Index.ets', staticCaller);
  const content = fs.readFileSync(callerPath, 'utf8');
  if (!content.includes(moduleIdentity.componentModule) ||
      !content.includes('localCount: 12') ||
      !content.includes('sharedCount: this.sharedCount') ||
      !content.includes("title: 'title-from-static-caller'")) {
    throw new Error('the real static consumer did not replace the preparation caller');
  }
  return {
    callerPath,
    componentModule: moduleIdentity.componentModule,
    stateParameter: 'localCount: 12',
    linkParameter: 'sharedCount: this.sharedCount',
    propParameter: "title: 'title-from-static-caller'"
  };
}

function projectContract() {
  return {
    product: 'default',
    module: 'entry',
    target: 'default',
    buildMode: 'debug',
    callerLanguage: '1.2',
    calleeLanguage: '1.1',
    callerModuleType: 'entry',
    calleeModuleType: 'har',
    dependency: moduleIdentity.packageName,
    buildTasks: ['clean', 'assembleHap']
  };
}

function hvigorArguments() {
  const contract = projectContract();
  return [
    '--mode', 'module',
    '-p', `product=${contract.product}`,
    '-p', `module=${contract.module}@${contract.target}`,
    '-p', `buildMode=${contract.buildMode}`,
    ...contract.buildTasks,
    '--no-daemon'
  ];
}

module.exports = {
  activateStaticCaller,
  appScopeManifest,
  dynamicModuleManifest,
  entryModuleManifest,
  hvigorArguments,
  materializeProject,
  projectContract,
  projectFiles,
  rootBuildProfile
};
