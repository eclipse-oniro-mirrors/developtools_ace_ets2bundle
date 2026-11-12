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
const { DIRECTION } = require('./source_cases');
const {
  DYNAMIC_DISASSEMBLY_SNIPPETS,
  PAGE_SNIPPETS,
  REQUIRED_TASKS,
  STATIC_BRIDGE_SNIPPETS,
  STATIC_DECLARATION_SNIPPETS,
  STATIC_DISASSEMBLY_SNIPPETS,
  assertAbcHeader,
  findFatalDiagnostics,
  orderedIndices,
  readAbcHeader
} = require('./expected_cases');
const {
  assertNoPreexistingArtifacts,
  getScenarioPaths,
  materializeProject,
  validateDeclarationMap,
  validateDependencyMap,
  validateProjectionEvidence
} = require('./project_files');
const { sha256Buffer } = require('./harness');
const {
  executeDisassembler,
  executeHvigor,
  executeOhpmInstall,
  publicToolchain,
  readToolchainVersions,
  resolveToolchain
} = require('./toolchain');
function validateMaterializedLanguages(t, paths) {
  const staticSource = fs.readFileSync(paths.staticSource, 'utf8');
  const staticIndex = fs.readFileSync(paths.staticIndexSource, 'utf8');
  const dynamicPage = fs.readFileSync(paths.dynamicSource, 'utf8');
  t.match(staticSource, /^'use static'\r?\n/, 'Static component marker must be first');
  t.match(staticIndex, /^'use static'\r?\n/, 'Static HAR entry marker must be first');
  t.includes(staticSource, 'build(): void', 'Static build needs an explicit return type');
  t.notIncludes(dynamicPage, "'use static'", 'Dynamic page must not become static');
  t.includes(dynamicPage, 'StaticCounter({ count: this.counterSeed })');
  t.includes(dynamicPage, 'this.counterSeed += 1', 'Dynamic update source is required');
}
function validateDeclarationAndBridge(t, paths, notBeforeMs) {
  const declarationArtifact = t.freshArtifact(
    'fresh-static-declaration',
    paths.staticDeclaration,
    { notBeforeMs, minimumBytes: 32 });
  t.freshArtifact(
    'fresh-static-index-declaration',
    paths.staticIndexDeclaration,
    { notBeforeMs, minimumBytes: 16 });
  const bridgeArtifact = t.freshArtifact(
    'fresh-static-ts-bridge',
    paths.staticBridge,
    { notBeforeMs, minimumBytes: 64 });
  t.freshArtifact(
    'fresh-static-index-ts-bridge',
    paths.staticIndexBridge,
    { notBeforeMs, minimumBytes: 64 });
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  for (const snippet of STATIC_DECLARATION_SNIPPETS) {
    t.includes(declaration, snippet, `Generated declaration misses ${snippet}`);
  }
  t.match(
    declaration,
    /@State[\s\S]*?count\s*:\s*number/,
    'Public count parameter must survive declgenV1');
  t.notIncludes(declaration, 'private count', 'Bridge parameter must be publicly consumable');
  const bridge = fs.readFileSync(paths.staticBridge, 'utf8');
  for (const snippet of STATIC_BRIDGE_SNIPPETS) {
    t.includes(bridge, snippet, `Generated old TS bridge misses ${snippet}`);
  }
  t.notIncludes(
    bridge,
    'declgenBridgeConfigPath',
    'Old bridge content must not refer to the newer config protocol');
  return { declarationArtifact, bridgeArtifact };
}
function normalizeBridgeForCaller(content, isIndex) {
  let normalized = content
    .replace(/^import \{ Component, Column, Text, Button \} from "@ohos\.arkui\.component";[\r\n]*/m, '')
    .replace(/^import \{ State \} from "@ohos\.arkui\.stateManagement";[\r\n]*/m, '')
    .replace(/^export \{\};[\r\n]*/gm, '');
  if (isIndex) {
    normalized = normalized.replace(
      '"./src/main/ets/StaticCounter"',
      '"@normalized:N&&&static_component/src/main/ets/StaticCounter&1.0.0"');
  }
  return normalized.replace(/\{\s+\}/g, '{}').replace(/\s+/g, ' ')
    .replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}
function assertBridgeIdentity(t, generatedPath, cachedPath, isIndex) {
  const generated = normalizeBridgeForCaller(fs.readFileSync(generatedPath, 'utf8'), isIndex);
  const cached = normalizeBridgeForCaller(fs.readFileSync(cachedPath, 'utf8'), isIndex);
  const evidence = {
    generatedPath,
    cachedPath,
    generatedSha256: sha256Buffer(generated),
    cachedSha256: sha256Buffer(cached),
    generatedNormalized: generated,
    cachedNormalized: cached,
    allowedTransforms: isIndex ?
      ['remove empty export', 'normalize whitespace', 'rewrite relative export to normalized OHM URL'] :
      ['remove SDK-only imports', 'remove empty export', 'normalize whitespace']
  };
  try {
    t.equal(
      evidence.cachedSha256,
      evidence.generatedSha256,
      'Caller cache must equal the generated bridge after only the allowed resolver transforms');
  } catch (error) {
    error.details = { ...(error.details || {}), ...evidence };
    throw error;
  }
  t.record(`bridge-identity-${isIndex ? 'index' : 'component'}`, evidence);
}
function validateCallerConsumption(t, paths, notBeforeMs) {
  t.freshArtifact(
    'fresh-caller-cached-bridge',
    paths.callerCachedBridge,
    { notBeforeMs, minimumBytes: 64 });
  t.freshArtifact(
    'fresh-caller-cached-index-bridge',
    paths.callerCachedIndexBridge,
    { notBeforeMs, minimumBytes: 64 });
  const transformedArtifact = t.freshArtifact(
    'fresh-caller-transformed-page',
    paths.callerTransformedPage,
    { notBeforeMs, minimumBytes: 128 });
  assertBridgeIdentity(t, paths.staticBridge, paths.callerCachedBridge, false);
  assertBridgeIdentity(t, paths.staticIndexBridge, paths.callerCachedIndexBridge, true);
  const page = fs.readFileSync(paths.callerTransformedPage, 'utf8');
  for (const snippet of PAGE_SNIPPETS) {
    if (snippet === 'result["count"] = this.counterSeed' ||
        snippet === 'result["__options_has_count"] = true') {
      continue;
    }
    t.includes(page, snippet, `Caller UI transform misses ${snippet}`);
  }
  t.match(
    page,
    /result\[["']count["']\]\s*=\s*this\.counterSeed/,
    'Dynamic parameter expression must be assigned to static options');
  t.match(
    page,
    /result\[["']__options_has_count["']\]\s*=\s*true/,
    'Static options presence flag must be generated');
  t.includes(
    page,
    'Lstatic_component/src/main/ets/StaticCounter/__Options_StaticCounter;',
    'Options class module identity differs');
  t.includes(
    page,
    'static_component$src$main$ets$StaticCounter$__Options_StaticCounter$ObjectLiteral;',
    'Options interface module identity differs');
  t.includes(
    page,
    '@normalized:N&&&static_component/Index&1.0.0',
    'Caller import must use normalized static HAR identity');
  const order = orderedIndices(page, [
    '__Interop_CreateStaticComponent_Internal',
    'ViewStackProcessor.push(static_StaticCounter[1])',
    'ViewStackProcessor.pop()',
    'static_StaticCounter[0]()'
  ]);
  t.ok(order.every(index => index >= 0), 'Creation/update sequence is incomplete');
  t.ok(
    order.every((value, index) => index === 0 || value > order[index - 1]),
    `Static create/push/pop/update order is wrong: ${order.join(',')}`);
  const countAssignment = page.search(/result\[["']count["']/);
  const optionsCreation = page.indexOf('new __Options_StaticCounter()');
  const optionsReturn = page.indexOf('return result', optionsCreation);
  t.greater(countAssignment, optionsCreation, 'Options must be created before parameter assignment');
  t.greater(optionsReturn, countAssignment, 'Assigned options must be returned to creation bridge');
  t.record('caller-transform-evidence', {
    path: paths.callerTransformedPage,
    sha256: transformedArtifact.sha256,
    creation: '__Interop_CreateStaticComponent_Internal',
    update: 'static_StaticCounter[0]()',
    parameter: 'result["count"] = this.counterSeed',
    presence: 'result["__options_has_count"] = true',
    importIdentity: '@normalized:N&&&static_component/Index&1.0.0'
  });
  return transformedArtifact;
}
function validateAbcAndModules(t, paths, tools, workspace, notBeforeMs) {
  const dynamicArtifact = t.freshArtifact(
    'fresh-dynamic-abc',
    paths.dynamicAbc,
    { notBeforeMs, minimumBytes: 16 });
  const staticArtifact = t.freshArtifact(
    'fresh-static-abc',
    paths.staticAbc,
    { notBeforeMs, minimumBytes: 16 });
  const dynamicHeader = readAbcHeader(fs.readFileSync(paths.dynamicAbc));
  const staticHeader = readAbcHeader(fs.readFileSync(paths.staticAbc));
  t.ok(assertAbcHeader(dynamicHeader, 'dynamic'), 'Dynamic ABC header must be valid');
  t.ok(assertAbcHeader(staticHeader, 'static'), 'Static ABC header must be valid');
  t.notEqual(
    dynamicHeader.versionHex,
    staticHeader.versionHex,
    'Mixed compilation must not emit duplicate bytecode layouts');
  const dynamic = executeDisassembler(
    tools,
    'dynamic',
    paths.dynamicAbc,
    workspace);
  const staticResult = executeDisassembler(
    tools,
    'static',
    paths.staticAbc,
    workspace);
  for (const snippet of DYNAMIC_DISASSEMBLY_SNIPPETS) {
    t.includes(dynamic.content, snippet, `Dynamic ABC misses ${snippet}`);
  }
  for (const snippet of STATIC_DISASSEMBLY_SNIPPETS) {
    t.includes(staticResult.content, snippet, `Static ABC misses ${snippet}`);
  }
  t.record('abc-module-evidence', {
    dynamic: {
      ...dynamicArtifact,
      header: dynamicHeader,
      disassembly: dynamic.outputPath,
      record: 'entry.src.main.ets.pages.Index'
    },
    static: {
      ...staticArtifact,
      header: staticHeader,
      disassembly: staticResult.outputPath,
      record: 'static_component.src.main.ets.StaticCounter.StaticCounter'
    }
  });
  return { dynamicArtifact, staticArtifact, dynamicHeader, staticHeader };
}
function executeFullChain(t) {
  const notBeforeMs = Date.now();
  const tools = resolveToolchain(t.options.env || process.env);
  const versions = readToolchainVersions(tools);
  t.toolchain = publicToolchain(versions);
  t.record('toolchain', versions);
  const materialized = materializeProject(t.workspace, tools.sdkHome);
  const projectRoot = materialized.projectRoot;
  const paths = getScenarioPaths(projectRoot);
  const watched = assertNoPreexistingArtifacts(paths);
  t.record('freshness-baseline', {
    notBeforeMs,
    watched,
    preexisting: [],
    policy: 'fresh temporary project + mtime gate + SHA-256 for every artifact'
  });
  t.record('materialized-input', materialized.manifest);
  validateMaterializedLanguages(t, paths);
  const install = executeOhpmInstall(projectRoot, t.workspace, tools);
  t.record('ohpm-install', install.record);
  t.equal(install.record.exitCode, 0, `ohpm install failed: ${install.record.logPath}`);
  const build = executeHvigor(projectRoot, t.workspace, tools, 'assembleHap');
  t.record('assemble-hap', build.record);
  const buildLog = `${build.stdout || ''}\n${build.stderr || ''}`;
  t.equal(build.record.exitCode, 0, `assembleHap failed: ${build.record.logPath}`);
  t.includes(buildLog, 'BUILD SUCCESSFUL', 'Hvigor success summary is missing');
  const fatalDiagnostics = findFatalDiagnostics(buildLog);
  t.deepEqual(
    fatalDiagnostics,
    [],
    'Hvigor exit zero must not hide compiler or linker errors');
  for (const task of REQUIRED_TASKS) {
    t.includes(buildLog, task, `Required Hvigor task did not run: ${task}`);
  }
  const generated = validateDeclarationAndBridge(t, paths, notBeforeMs);
  const transformed = validateCallerConsumption(t, paths, notBeforeMs);
  const projection = validateProjectionEvidence(t, paths);
  const declarationMap = validateDeclarationMap(t, paths);
  validateDependencyMap(t, paths);
  const abc = validateAbcAndModules(t, paths, tools, t.workspace, notBeforeMs);
  const summary = {
    projectRoot,
    generatedDeclaration: generated.declarationArtifact,
    generatedBridge: generated.bridgeArtifact,
    callerTransformedPage: transformed,
    declarationMap: {
      source: declarationMap.sourceFilePath,
      declaration: declarationMap.delFilePath,
      bridge: declarationMap.glueCodeFilePath
    },
    moduleIdentity: {
      callerLanguage: projection.entry.language,
      calleeLanguage: projection.staticModule.language,
      caller: 'entry/src/main/ets/pages/Index',
      callee: 'static_component/src/main/ets/StaticCounter/StaticCounter'
    },
    dynamicAbc: abc.dynamicArtifact,
    staticAbc: abc.staticArtifact,
    deviceExecution: false
  };
  t.record('compile-chain-summary', summary);
  return { projectRoot, paths, tools, build: build.record, summary };
}
const cases = [{
  id: 'cold-generate-consume-and-abc',
  group: 'compile',
  direction: DIRECTION,
  description:
    'Generate declgenV1 and old TS bridge, consume them in the 1.1 UI chain, and verify fresh mixed ABC',
  async run(t) {
    const result = executeFullChain(t);
    return {
      projectRoot: result.projectRoot,
      dynamicAbc: result.summary.dynamicAbc.path,
      staticAbc: result.summary.staticAbc.path
    };
  }
}];
module.exports = {
  assertBridgeIdentity,
  cases,
  executeFullChain,
  validateAbcAndModules,
  validateCallerConsumption,
  validateDeclarationAndBridge,
  validateMaterializedLanguages
};
