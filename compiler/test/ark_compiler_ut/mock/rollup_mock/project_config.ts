/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use rollupObject file except in compliance with the License.
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

import { PROJECT_ROOT } from "./path_config";
import {
  SDK_VERSION,
  BUNDLE_NAME_DEFAULT,
  ETS_LOADER_VERSION,
  ENTRY_MODULE_NAME_DEFAULT,
  RUNTIME_OS_OPENHARMONY,
  MODULE_NAME_HASH_DEFAULT,
  RESOURCE_TABLE_HASH_DEFAULT,
  DEVICE_TYPE,
  NODE_JS_PATH,
  PORT_DEFAULT
} from "./common";
import { ESMODULE, OHPM, RELEASE } from "../../../../lib/fast_build/ark_compiler/common/ark_define";

interface IArkProjectConfig {
  projectRootPath: string,
  modulePathMap: any,
  isOhosTest: any,
  oldMapFilePath?: any,
  processTs: boolean,
  pandaMode: string,
  anBuildOutPut?: any,
  anBuildMode?: any,
  apPath?: any,
  nodeModulesPath?: any,
  harNameOhmMap: any,
  minPlatformVersion: number,
  moduleName: string,
  bundleName: string,
  hotReload: any,
  patchAbcPath: any,
  changedFileList: any,
  compileMode: string
}

class ProjectConfig {
  compileMode: string = ESMODULE;
  packageManagerType: string = OHPM;
  compileSdkVersion: number = SDK_VERSION;
  compatibleSdkVersion: number = SDK_VERSION;
  bundleName: string = BUNDLE_NAME_DEFAULT;
  etsLoaderVersion: string = ETS_LOADER_VERSION;
  etsLoaderReleaseType: string = RELEASE;
  entryModuleName: string = ENTRY_MODULE_NAME_DEFAULT;
  allModuleNameHash: string = MODULE_NAME_HASH_DEFAULT;
  resourceTableHash: string = RESOURCE_TABLE_HASH_DEFAULT;
  runtimeOS: string = RUNTIME_OS_OPENHARMONY;
  sdkInfo: string = `true:${SDK_VERSION}:${ETS_LOADER_VERSION}:${RELEASE}`;

  watchMode: string;
  isPreview: boolean;
  buildMode: string;
  localPropertiesPath: string;
  aceProfilePath: string;
  etsLoaderPath: string;
  modulePath: string;
  needCoverageInsert: boolean;
  projectTopDir: string;
  apPath: string;
  aceModuleJsonPath: string;
  appResource: string;
  aceModuleRoot: string;
  aceSuperVisualPath: string;
  aceBuildJson: string;
  cachePath: string;
  aceModuleBuild: string;
  patchAbcPath: string;
  supportChunks: boolean;
  projectPath: string;
  resolveModulePaths: Array<string>;
  compileHar: boolean;
  compileShared: boolean;
  moduleRootPath: any;
  buildPath: string;

  deviceType?: string;
  checkEntry?: string;
  Path?: string;
  note?: string;
  hapMode?: string;
  img2bin?: string;
  projectProfilePath?: string;
  logLevel?: string;
  stageRouterConfig?: Array<any>;
  port?: string;
  aceSoPath?: string;
  mockParams?: object;

  constructor(buildMode: string) {
    this.watchMode = 'false';
    this.isPreview = false;
    this.buildMode = buildMode;
    this.needCoverageInsert = false;
    this.supportChunks = true;
    this.compileHar = false;
    this.compileShared = false;
  }

  public scan(testcase: string) {
    this.initPath(`${PROJECT_ROOT}/${testcase}`);
  }

  public setPreview(isPreview: boolean) {
    this.isPreview = isPreview;
    this.watchMode = String(isPreview);
  }

  public setCompilerVersion(version: number) {
    this.compileSdkVersion = version;
    this.compatibleSdkVersion = version;
  }

  public setMockParams(params: object) {
    this.mockParams = params;
  }

  private initPath(proPath: string) {
    // build and preview
    let mode = this.isPreview ? '.preview' : 'build';
    this.localPropertiesPath = `${proPath}/local.properties`;
    this.aceProfilePath = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/res/default/resources/base/profile`;
    this.etsLoaderPath = `/${this.runtimeOS}/Sdk/${this.compileSdkVersion}/ets/build-tools/app`;
    this.modulePath = `${proPath}/${this.entryModuleName}`;
    this.projectTopDir = `${proPath}`;
    this.apPath = '';
    this.aceModuleJsonPath = `${proPath}/${this.entryModuleName}/${mode}/module.json`;
    this.appResource = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/res/default/ResourceTable.txt`;
    this.aceModuleRoot = `${proPath}/${this.entryModuleName}/src/main/ets`;
    this.aceSuperVisualPath = `${proPath}/${this.entryModuleName}/src/main/supervisual`;
    this.aceBuildJson = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/loader/default/loader.json`;
    this.cachePath = `${proPath}/${this.entryModuleName}/${mode}/default/cache/default/default@CompileArkTS/esmodule/${this.buildMode}`;
    this.aceModuleBuild = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/loader_out/default/ets`;
    this.projectPath = `${proPath}/${this.entryModuleName}/src/main/ets`;
    this.moduleRootPath = undefined;
    this.buildPath = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/loader_out/default/ets`;
    this.patchAbcPath = `${proPath}/${this.entryModuleName}/${mode}/default/intermediates/hotReload/patchAbcPath/ets`;

    if (this.isPreview) {
      this.previewUniqueConfig();
    }
  }

  private previewUniqueConfig() {
    this.deviceType = DEVICE_TYPE;
    this.checkEntry = 'true';
    this.Path = NODE_JS_PATH;
    this.note = 'false';
    this.hapMode = 'false';
    this.img2bin = 'true';
    this.projectProfilePath = `${this.projectTopDir}/build-profile.json5`;
    this.logLevel = '3';
    this.stageRouterConfig = [];
    this.port = PORT_DEFAULT;
    this.aceSoPath = `${this.projectTopDir}/entry/.preview/cache/nativeDependencies.txt`;
  }
}

export { ProjectConfig, IArkProjectConfig }
