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
import path from 'path';
import fs from 'fs';
import json5 from 'json5';
import type { LogInfo } from '../utils';
import { projectConfig } from '../../main';
import type { ValidationStateChange } from './validation_state';

export interface UISyntaxSnapshot {
  changes: ValidationStateChange[];
  whiteList: string[];
  diagnostics: LogInfo[];
  transformDiagnostics: LogInfo[];
  entry?: { entryCount: number; previewCount: number; diagnosticIndex: number };
}

export function getUIValidationModuleInfo(fileName: string): { pkgName?: string; pkgPath?: string } {
  const filePath = path.resolve(fileName);
  const isDependency = filePath.split(path.sep).some(part => part === 'oh_modules' || part === 'node_modules');
  if (!isDependency) {
    for (const [modulePath, info] of Object.entries(projectConfig.projectModel || {})) {
      const relative = path.relative(modulePath, filePath);
      if (relative && relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative)) {
        const moduleInfo = info as { modulePkgPath: string; isBuildCacheDir?: boolean };
        const pkg = readUIValidationPackage(moduleInfo.modulePkgPath);
        return { pkgName: pkg.pkgName, pkgPath: moduleInfo.isBuildCacheDir ? modulePath : moduleInfo.modulePkgPath };
      }
    }
    return { pkgPath: projectConfig.projectTopDir };
  }
  return readUIValidationPackage(path.dirname(filePath));
}

function readUIValidationPackage(directory: string): { pkgName?: string; pkgPath?: string } {
  const boundary = projectConfig.projectTopDir && path.dirname(projectConfig.projectTopDir);
  while (directory && directory !== boundary && directory !== path.dirname(directory)) {
    const manifest = path.join(directory, 'oh-package.json5');
    if (fs.existsSync(manifest)) {
      const pkg = json5.parse(fs.readFileSync(manifest, 'utf8'));
      return { pkgName: pkg.name, pkgPath: directory };
    }
    directory = path.dirname(directory);
  }
  return {};
}
