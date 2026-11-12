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

const artifactContracts = {
  componentDeclaration: 'dynamic_component/build/default/intermediates/declgen/default/declgenV2/src/main/ets/PropertyCard.d.ets',
  indexDeclaration: 'dynamic_component/build/default/intermediates/declgen/default/declgenV2/Index.d.ets',
  declarationMap: 'dynamic_component/build/default/intermediates/declgen/default/decl-fileInfo.json',
  callerConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/entry/arktsconfig.json',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  bridgeSource: 'entry/build/default/intermediates/declgen/default/declgenBridgeCode/entry/src/main/ets/pages/Index.ts',
  staticAbc: 'entry/build/default/intermediates/loader_out_static/default/ets/modules_static.abc',
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  unsignedHap: 'entry/build/default/outputs/default/entry-default-unsigned.hap',
  buildLog: 'evidence/hvigor.log',
  repositoryDeclgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  repositoryDeclarationMap: 'dynamic_component/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  repositoryBuildLog: 'evidence/repository-static.log',
  staticDisassembly: 'evidence/hvigor-modules_static.pa',
  repositoryStaticDisassembly: 'evidence/repository-modules_static.pa',
  dynamicDisassembly: 'evidence/hvigor-modules_dynamic.pa'
};

const projectContract = {
  product: 'default', module: 'entry', target: 'default', buildMode: 'debug',
  callerLanguage: '1.2', calleeLanguage: '1.1',
  callerModuleType: 'entry', calleeModuleType: 'har',
  dependency: 'dynamic_component', bundleName: 'com.example.interopuipr06',
  buildTasks: ['clean', 'assembleHap']
};

const consumerCodes = { assignability: 'TS2322', privateProperty: 'TS2339' };

const diagnosticRules = { permittedCodePrefixes: ['ESE', 'F'] };

module.exports = {
  artifactContracts,
  consumerCodes,
  diagnosticRules,
  projectContract
};
