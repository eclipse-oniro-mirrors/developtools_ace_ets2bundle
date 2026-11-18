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
  dynamicCounter,
  dynamicIndex,
  entryAbility,
  staticCaller
} = require('./source_cases');
const { hapContracts } = require('./expected_cases');

const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <rect width="96" height="96" rx="20" fill="#1769e0"/>
  <rect x="12" y="32" width="72" height="32" rx="16" fill="#ffffff"/>
  <rect x="15" y="35" width="30" height="26" rx="13" fill="#75afff"/>
</svg>
`;

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

function appScopeManifest() {
  return `{
  "app": {
    "bundleName": "${hapContracts.bundleName}",
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

function projectFiles(sdkRoot) {
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
      "value": "Interop UI PR01"
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
    "dynamic_component": "file:../dynamic_component"
  }
}
`,
    'entry/src/main/module.json5': entryModuleManifest(),
    'entry/src/main/ets/pages/Index.ets': staticCaller,
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
      "value": "Static caller consuming a dynamic component"
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
    'dynamic_component/Index.ets': dynamicIndex,
    'dynamic_component/BuildProfile.ets': `export const HAR_VERSION = '1.0.0';
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
    'dynamic_component/src/main/module.json5': dynamicModuleManifest(),
    'dynamic_component/src/main/ets/DynamicCounter.ets': dynamicCounter,
    'dynamic_component/src/main/resources/base/element/string.json': `{
  "string": [
    {
      "name": "dynamic_component_description",
      "value": "ArkTS 1.1 callee"
    }
  ]
}
`
  };
}

function linkDependency(projectRoot, linkName, targetName) {
  const modulesRoot = path.join(projectRoot, 'entry', 'oh_modules');
  fs.mkdirSync(modulesRoot, { recursive: true });
  const linkPath = path.join(modulesRoot, linkName);
  const targetPath = path.join(projectRoot, targetName);
  try {
    fs.symlinkSync(path.relative(modulesRoot, targetPath), linkPath, 'junction');
  } catch (error) {
    if (!['EPERM', 'EACCES', 'ENOSYS'].includes(error.code)) {
      throw error;
    }
    fs.cpSync(targetPath, linkPath, { recursive: true, dereference: true });
  }
  return linkPath;
}

function materializeProject(workspace, sdkRoot) {
  const files = projectFiles(sdkRoot);
  workspace.materialize(files);
  const dependency = linkDependency(workspace.root, 'dynamic_component', 'dynamic_component');
  return {
    projectRoot: workspace.root,
    dependency,
    fileCount: Object.keys(files).length,
    entrySource: path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    calleeSource: path.join(workspace.root, 'dynamic_component/src/main/ets/DynamicCounter.ets')
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
    dependency: 'dynamic_component',
    buildTasks: ['clean', 'assembleHap']
  };
}

module.exports = {
  appIcon,
  appScopeManifest,
  dynamicModuleManifest,
  entryModuleManifest,
  libraryBuildProfile,
  linkDependency,
  materializeProject,
  projectContract,
  projectFiles,
  rootBuildProfile
};
