/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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

import { ModuleMode } from './module_mode';
import { isEs2Abc, isTs2Abc } from '../../../ark_utils';
import { SourceMapGenerator } from '../generate_sourcemap';

export class ModuleBuildMode extends ModuleMode {
  constructor(rollupObject: Object) {
    super(rollupObject);
  }

  generateAbc(rollupObject: Object, parentEvent: Object): void {
    this.prepareForCompilation(rollupObject, parentEvent);
    SourceMapGenerator.getInstance().buildModuleSourceMapInfo(parentEvent);
    this.executeArkCompiler(parentEvent);
  }

  executeArkCompiler(parentEvent: Object): void {
    if (isEs2Abc(this.projectConfig)) {
      this.generateEs2AbcCmd();
      this.addCacheFileArgs();
      this.generateMergedAbcOfEs2Abc(parentEvent);
    } else if (isTs2Abc(this.projectConfig)) {
      this.filterModulesByHashJson();
      const splittedModules: any[] = this.getSplittedModulesByNumber();
      this.invokeTs2AbcWorkersToGenProto(splittedModules);
      this.processTs2abcWorkersToGenAbc();
    } else {
      this.throwArkTsCompilerError('ArkTS:INTERNAL ERROR: Invalid compilation mode.');
    }
  }
}
