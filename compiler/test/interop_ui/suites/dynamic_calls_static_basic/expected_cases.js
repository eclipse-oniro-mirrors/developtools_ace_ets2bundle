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
const STATIC_DECLGEN_ROOT = 'static_component/build/default/intermediates/declgen/default';
const ENTRY_DECLGEN_ROOT = 'entry/build/default/intermediates/declgen/default';
const ENTRY_STATIC_CACHE = 'entry/build/default/cache/default/default@CompileStaticArkTS/debug';
const PATHS = Object.freeze({
  staticSource: 'static_component/src/main/ets/StaticCounter.ets',
  staticIndexSource: 'static_component/Index.ets',
  dynamicSource: 'entry/src/main/ets/pages/Index.ets',
  staticDeclaration:
    `${STATIC_DECLGEN_ROOT}/declgenV1/static_component/src/main/ets/StaticCounter.d.ets`,
  staticIndexDeclaration: `${STATIC_DECLGEN_ROOT}/declgenV1/static_component/Index.d.ets`,
  staticBridge:
    `${STATIC_DECLGEN_ROOT}/declgenBridgeCode/static_component/src/main/ets/StaticCounter.ts`,
  staticIndexBridge: `${STATIC_DECLGEN_ROOT}/declgenBridgeCode/static_component/Index.ts`,
  declarationMap: `${ENTRY_DECLGEN_ROOT}/cache/entry/decl_file_map.json`,
  generationProjection: `${ENTRY_DECLGEN_ROOT}/cache/entry/projectionConfig.json`,
  consumerProjection: `${ENTRY_STATIC_CACHE}/projectionConfig.json`,
  callerCachedBridge:
    `${ENTRY_DECLGEN_ROOT}/cache/static_component/src/main/ets/StaticCounter.ts`,
  callerCachedIndexBridge: `${ENTRY_DECLGEN_ROOT}/cache/static_component/Index.ts`,
  callerTransformedPage: `${ENTRY_DECLGEN_ROOT}/cache/entry/src/main/ets/pages/Index.ts`,
  dependencyOhmUrlMap: `${ENTRY_STATIC_CACHE}/_dependency_ohmurl_map.ets`,
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  staticAbc: 'entry/build/default/intermediates/loader_out_static/default/ets/modules_static.abc',
  packagedDynamicAbc: 'entry/build/default/intermediates/ets_assets/default/ets/modules.abc',
  packagedStaticAbc: 'entry/build/default/intermediates/ets_assets/default/ets/modules_static.abc',
  moduleJson: 'entry/build/default/intermediates/package/default/module.json',
  unsignedHap: 'entry/build/default/outputs/default/entry-default-unsigned.hap'
});
const REQUIRED_TASKS = Object.freeze([
  ':entry:default@GenerateDeclaration',
  ':entry:default@GenerateInteropContext',
  ':entry:default@CompileDynamicArkTS',
  ':entry:default@CompileStaticArkTS',
  ':entry:default@PackageHap',
  ':entry:assembleHap'
]);
const FATAL_PATTERNS = Object.freeze([
  /\[ERROR\]/i,
  /ERROR Code\s*:/i,
  /\bSemantic error\b/i,
  /\bFatal error\b/i,
  /Cannot find import/i,
  /Compile abc files failed/i,
  /Link abc files failed/i,
  /Failed to proceed to ES2PANDA_STATE_CHECKED/i,
  /\bESE\d{5,}\b/
]);
const PAGE_SNIPPETS = Object.freeze([
  '__Options_StaticCounter',
  'new StaticCounter(undefined, undefined)',
  '__Interop_CreateStaticComponent_Internal',
  'result["count"] = this.counterSeed',
  'result["__options_has_count"] = true',
  'static_StaticCounter[0]()',
  'ViewStackProcessor.push(static_StaticCounter[1])',
  'ViewStackProcessor.pop()',
  'this.counterSeed += 1',
  'dynamicParameterUpdate'
]);
const STATIC_DECLARATION_SNIPPETS = Object.freeze([
  'import st from "@ohos.lang.interop"',
  '@Component',
  'export declare struct StaticCounter',
  'public build(): void'
]);
const STATIC_BRIDGE_SNIPPETS = Object.freeze([
  'export const StaticCounter',
  'createLazy',
  'Panda.getClass',
  'Lstatic_component/src/main/ets/StaticCounter/StaticCounter;'
]);
const DYNAMIC_DISASSEMBLY_SNIPPETS = Object.freeze([
  '.record &entry.src.main.ets.pages.Index&',
  'REGULAR_IMPORT, local_name: StaticCounter',
  '@normalized:N&&&static_component/Index&1.0.0',
  '__Interop_CreateStaticComponent_Internal',
  'Lstatic_component/src/main/ets/StaticCounter/__Options_StaticCounter;',
  'counterSeed',
  '__options_has_count',
  'dynamicParameterUpdate'
]);
const STATIC_DISASSEMBLY_SNIPPETS = Object.freeze([
  '.record static_component.src.main.ets.StaticCounter.StaticCounter',
  'StaticCounter.build',
  'StaticCounter.__updateStruct',
  '__options_has_count',
  'staticComponentTitle',
  'staticCount',
  'staticIncrement'
]);
function stripAnsi(value) {
  return value.replace(/\u001b\[[0-9;]*m/g, '');
}
function findFatalDiagnostics(logContent) {
  const lines = stripAnsi(logContent).split(/\r?\n/);
  const diagnostics = [];
  lines.forEach((line, index) => {
    if (FATAL_PATTERNS.some(pattern => pattern.test(line))) {
      diagnostics.push({ line: index + 1, text: line.trim() });
    }
  });
  return diagnostics;
}
function orderedIndices(content, snippets) {
  return snippets.map(snippet => content.indexOf(snippet));
}
function readAbcHeader(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError('ABC input must be a Buffer');
  }
  if (buffer.length < 16) {
    throw new Error(`ABC is too short: ${buffer.length} bytes`);
  }
  return {
    bytes: buffer.length,
    magic: buffer.subarray(0, 5).toString('ascii'),
    versionHex: buffer.subarray(12, 16).toString('hex'),
    shaInputBytes: buffer.length
  };
}
function assertAbcHeader(header, kind) {
  if (header.magic !== 'PANDA') {
    throw new Error(`Invalid ${kind} ABC magic: ${header.magic}`);
  }
  if (header.versionHex === '00000000') {
    throw new Error(`Invalid ${kind} ABC version: ${header.versionHex}`);
  }
  if (kind === 'static' && header.versionHex !== '00010007') {
    throw new Error(`Unexpected static ABC layout: ${header.versionHex}`);
  }
  if (kind === 'dynamic' && header.versionHex === '00010007') {
    throw new Error('Dynamic ABC unexpectedly uses the static bytecode layout');
  }
  return true;
}
function makeProjectionModule(overrides = {}) {
  return {
    language: '1.2',
    packageName: 'static_component',
    moduleType: 'har',
    moduleName: 'static_component',
    modulePath: '/tmp/static_component',
    packageVersion: '1.0.0',
    entryFile: '/tmp/static_component/Index.ets',
    declgenV1OutPath: '/tmp/static_component/build/declgenV1',
    declgenV2OutPath: '/tmp/static_component/build/declgenV2',
    declgenBridgeCodePath: '/tmp/static_component/build/declgenBridgeCode',
    sourceRoots: ['./'],
    dependencies: [],
    ...overrides
  };
}
module.exports = {
  DYNAMIC_DISASSEMBLY_SNIPPETS,
  FATAL_PATTERNS,
  PAGE_SNIPPETS,
  PATHS,
  REQUIRED_TASKS,
  STATIC_BRIDGE_SNIPPETS,
  STATIC_DECLARATION_SNIPPETS,
  STATIC_DISASSEMBLY_SNIPPETS,
  assertAbcHeader,
  findFatalDiagnostics,
  makeProjectionModule,
  orderedIndices,
  readAbcHeader,
  stripAnsi
};
