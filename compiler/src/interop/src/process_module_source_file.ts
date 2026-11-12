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

import * as ts from 'typescript';

import { projectConfig } from '../main';
import { ModuleSourceFile } from './fast_build/ark_compiler/module/module_source_file';
import { MemoryMonitor } from './fast_build/meomry_monitor/rollup-plugin-memory-monitor';
import { MemoryDefine } from './fast_build/meomry_monitor/memory_define';
import {
  CompileEvent,
  createAndStartEvent,
  stopEvent
} from './performance';
import { shouldSkipTsImportTransform } from './utils';

export function createSourceFileReturnTransformers(): [ts.TransformerFactory<ts.SourceFile>,
    ts.TransformerFactory<ts.SourceFile>] {
  let sourceFileToReturn: ts.SourceFile | undefined;
  const captureSourceFile: ts.TransformerFactory<ts.SourceFile> = () => (node: ts.SourceFile) => {
    sourceFileToReturn = node;
    return node;
  };
  const restoreSourceFile: ts.TransformerFactory<ts.SourceFile> = () => (node: ts.SourceFile) => {
    return shouldSkipTsImportTransform(node, projectConfig.processTs, projectConfig.complieHar) ?
      node : sourceFileToReturn ?? node;
  };
  return [captureSourceFile, restoreSourceFile];
}

export function collectModuleSourceFile(id: string, metaInfo: Object,
  parentEvent: CompileEvent): ts.TransformerFactory<ts.SourceFile> {
  return () => (node: ts.SourceFile) => {
    if (shouldSkipTsImportTransform(node, projectConfig.processTs, projectConfig.complieHar)) {
      return node;
    }
    const eventCollectModuleSourceFile: CompileEvent = createAndStartEvent(parentEvent, 'collectModuleSourceFile');
    const newSourceFileRecordInfo = MemoryMonitor.recordStage(MemoryDefine.NEW_SOURCE_FILE);
    ModuleSourceFile.newSourceFile(id, node, metaInfo, projectConfig.singleFileEmit);
    MemoryMonitor.stopRecordStage(newSourceFileRecordInfo);
    stopEvent(eventCollectModuleSourceFile);
    return node;
  };
}
