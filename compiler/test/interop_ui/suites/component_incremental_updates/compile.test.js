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
const { AssertionContext, fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const { STATIC_COUNTER_SOURCE, PROJECT_TEXT_FILES } = require('../dynamic_calls_static_basic/source_cases');
const { assertAbcHeader, findFatalDiagnostics, readAbcHeader } =
  require('../dynamic_calls_static_basic/expected_cases');
const { assertBridgeIdentity, validateDeclarationAndBridge } =
  require('../dynamic_calls_static_basic/compile.test');
const { getScenarioPaths, materializeProject, validateDeclarationMap } =
  require('../dynamic_calls_static_basic/project_files');
const {
  executeDisassembler, executeHvigor, executeOhpmInstall, executeZipTest, listZipEntries,
  publicToolchain, readToolchainVersions, resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');

function prepareRevision(paths, revision) {
  const component = STATIC_COUNTER_SOURCE.replace('@State public count: number = 0;',
    `@State public count: number = 0;\n  ${revision.field || ''}`)
    .replace("'ArkTS 1.2 静态组件'", revision.label);
  const caller = PROJECT_TEXT_FILES['entry/src/main/ets/pages/Index.ets']
    .replace('count: this.counterSeed', revision.options);
  fs.writeFileSync(paths.staticSource, component);
  fs.writeFileSync(paths.dynamicSource, caller);
}

function build(t, project, tools, label) {
  const files = project.manifest.files.map(file => ({ ...file, ...fileMetadata(file.path) }));
  const manifest = path.join(t.workspace, 'evidence', `${label}-inputs.json`);
  writeJson(manifest, { files });
  const buildResult = executeHvigor(project.projectRoot, t.workspace, tools);
  const log = path.join(t.workspace, 'evidence', `${label}-build.log`);
  fs.copyFileSync(buildResult.record.logPath, log);
  t.record(label, { manifest, process: { ...buildResult.record, logPath: log } });
  t.equal(buildResult.record.exitCode, 0, log);
  t.deepEqual(findFatalDiagnostics(`${buildResult.stdout}\n${buildResult.stderr}`), []);
}

function evidence(t, paths, tools, label, revision, started) {
  const observed = new AssertionContext(t.testCase, path.join(t.workspace, 'snapshots', label), t.options);
  const generated = validateDeclarationAndBridge(observed, paths, started);
  const declaration = fs.readFileSync(paths.staticDeclaration, 'utf8');
  const caller = fs.readFileSync(paths.callerTransformedPage, 'utf8');
  const declarationMap = validateDeclarationMap(observed, paths);
  assertBridgeIdentity(observed, paths.staticBridge, paths.callerCachedBridge, false);
  t.assertions += observed.assertions;
  t.includes(caller, '__Interop_CreateStaticComponent_Internal');
  for (const item of revision.present || []) {
    t.includes(declaration, item);
    t.includes(caller, `__options_has_${item}`);
  }
  for (const item of revision.absent || []) {
    t.notIncludes(declaration, item);
    t.notIncludes(caller, `__options_has_${item}`);
  }
  const bytecode = {};
  for (const [kind, file] of [['dynamic', paths.dynamicAbc], ['static', paths.staticAbc]]) {
    t.ok(assertAbcHeader(readAbcHeader(fs.readFileSync(file)), kind));
    const disassembly = executeDisassembler(tools, kind, file, t.workspace, `${label}-`);
    t.includes(disassembly.content, 'StaticCounter');
    bytecode[kind] = { ...fileMetadata(file), disassembly: disassembly.outputPath };
  }
  const staticText = fs.readFileSync(bytecode.static.disassembly, 'utf8');
  t.includes(staticText, revision.marker);
  t.equal(executeZipTest(tools, paths.unsignedHap, t.workspace).exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, t.workspace);
  t.ok(entries.includes('ets/modules.abc'));
  t.ok(entries.includes('ets/modules_static.abc'));
  const result = { generated, declarationMap, bytecode, entries,
    caller: fileMetadata(paths.callerTransformedPage), hap: fileMetadata(paths.unsignedHap) };
  t.record(`${label}-artifacts`, result);
  return result;
}

function verify(t, fixture) {
  const tools = resolveToolchain(t.options.env || process.env);
  t.toolchain = publicToolchain(readToolchainVersions(tools));
  const project = materializeProject(t.workspace, tools.sdkHome);
  const paths = getScenarioPaths(project.projectRoot);
  prepareRevision(paths, fixture.before);
  const install = executeOhpmInstall(project.projectRoot, t.workspace, tools);
  t.equal(install.record.exitCode, 0);
  t.record('ohpm', install.record);
  const started = Date.now();
  build(t, project, tools, 'original');
  const original = evidence(t, paths, tools, 'original', fixture.before, started);
  const originalSources = [paths.staticSource, paths.dynamicSource].map(fileMetadata);
  prepareRevision(paths, fixture.after);
  const updatedSources = [paths.staticSource, paths.dynamicSource].map(fileMetadata);
  t.notEqual(originalSources[0].sha256, updatedSources[0].sha256);
  t.equal(originalSources[1].sha256 === updatedSources[1].sha256, !fixture.callerChanged);
  build(t, project, tools, 'updated');
  const updated = evidence(t, paths, tools, 'updated', fixture.after, started);
  t.notEqual(original.bytecode.static.sha256, updated.bytecode.static.sha256);
  t.notEqual(original.hap.sha256, updated.hap.sha256);
  t.equal(original.generated.declarationArtifact.sha256 === updated.generated.declarationArtifact.sha256,
    !fixture.interfaceChanged);
  t.equal(original.caller.sha256 === updated.caller.sha256, !fixture.callerChanged);
  const changedText = fs.readFileSync(updated.bytecode.static.disassembly, 'utf8');
  t.notIncludes(changedText, fixture.before.marker);
  t.record('incremental-input-change', { before: originalSources, after: updatedSources });
}

const fixtures = [
  {
    id: 'component-body-only',
    interfaceChanged: false,
    callerChanged: false,
    before: {
      label: "'old_counter_header'",
      marker: 'old_counter_header',
      options: 'count: this.counterSeed'
    },
    after: {
      label: "'new_counter_header'",
      marker: 'new_counter_header',
      options: 'count: this.counterSeed'
    }
  },
  {
    id: 'replace-component-option',
    interfaceChanged: true,
    callerChanged: true,
    before: {
      field: "@State public title: string = 'initial_header';",
      label: "'visible_title_' + this.title",
      marker: 'visible_title_',
      options: 'count: this.counterSeed, title: "title"',
      present: ['title'],
      absent: ['caption']
    },
    after: {
      field: "@State public caption: string = 'initial_caption';",
      label: "'visible_caption_' + this.caption",
      marker: 'visible_caption_',
      options: 'count: this.counterSeed, caption: "headline"',
      present: ['caption'],
      absent: ['title']
    }
  }
];

const cases = fixtures.map(fixture => ({
  id: fixture.id,
  direction: '11-to-12',
  group: 'compile',
  run: t => verify(t, fixture)
}));

module.exports = { cases };
