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
const starter = require('../dynamic_calls_static_basic/project_files');
const reverse = require('../static_calls_dynamic_basic/project_files');
const { readAbcHeader, assertAbcHeader } =
  require('../dynamic_calls_static_basic/expected_cases');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const { diagnosticsFromLog, classifyFirstDiagnostic } = require('../static_calls_dynamic_basic/compile.test');
const { StageFailure } = require('../static_calls_dynamic_basic/harness');
const {
  executeHvigor, executeOhpmInstall, executeZipTest, extractZipEntry, executeDisassembler,
  publicToolchain, readToolchainVersions, resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');

const entryFile = 'entry/src/main/ets/pages/Index.ets';

function staticSide() {
  const source = `'use static'
import { Component, Text, Column } from '@ohos.arkui.component';
@Component
export struct LeftCard {
  build(): void {
    Column(undefined) { Text('left_static_card').id('leftCard') }
  }
}
@Component
export struct RightCard {
  build(): void {
    Column(undefined) { Text('right_static_card').id('rightCard') }
  }
}
`;
  return {
    providerModule: 'static_component',
    declarationIncludes: ['LeftCard', 'RightCard'],
    changes: {
      'static_component/src/main/ets/StaticCounter.ets': source,
      'static_component/Index.ets': `'use static'
export { LeftCard, RightCard } from './src/main/ets/StaticCounter';
`,
      [entryFile]: `import { LeftCard, RightCard } from 'static_component';
@Component
struct NativeRow {
  build() { Text('native_row').id('nativeRow') }
}
@Entry
@Component
struct Index {
  build() {
    Column() {
      LeftCard()
      NativeRow()
      RightCard()
    }
  }
}
`
    },
    dynamicTokens: ['LeftCard', 'RightCard', 'native_row'],
    staticTokens: ['LeftCard', 'RightCard', 'left_static_card', 'right_static_card']
  };
}

function dynamicSide() {
  return {
    providerModule: 'dynamic_component',
    declarationIncludes: ['LeftCard', 'RightCard'],
    changes: {
      'dynamic_component/src/main/ets/DynamicCounter.ets': `@Component
export struct LeftCard {
  build() { Text('left_dynamic_card').id('leftCard') }
}
@Component
export struct RightCard {
  build() { Text('right_dynamic_card').id('rightCard') }
}
`,
      'dynamic_component/Index.ets': `export { LeftCard, RightCard } from './src/main/ets/DynamicCounter';
`,
      [entryFile]: `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { LeftCard, RightCard } from 'dynamic_component';
@Component
struct NativeRow {
  build(): void { Text('native_row').id('nativeRow') }
}
@Entry
@Component
struct Index {
  build(): void {
    Column(undefined) {
      LeftCard()
      NativeRow()
      RightCard()
    }
  }
}
`
    },
    dynamicTokens: ['LeftCard', 'RightCard', 'left_dynamic_card', 'right_dynamic_card'],
    staticTokens: ['LeftCard', 'RightCard', 'native_row']
  };
}

function reverseProject(t, tools, fixture) {
  const root = path.join(t.workspace, 'project');
  const provisional = reverse.projectFiles(tools.sdkHome);
  const files = { ...provisional, ...fixture.changes };
  const list = Object.entries(files).map(([relative, text]) => starter.writeProjectFile(root, relative, text));
  return { root, list };
}

function prepare(t, tools, fixture) {
  if (fixture.providerModule === 'dynamic_component') {
    return reverseProject(t, tools, fixture);
  }
  const baseline = starter.materializeProject(t.workspace, tools.sdkHome);
  for (const [relative, text] of Object.entries(fixture.changes)) {
    starter.writeProjectFile(baseline.projectRoot, relative, text);
  }
  return { root: baseline.projectRoot, list: baseline.files };
}

function declarations(root, provider, symbol) {
  const found = [];
  function visit(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        visit(file);
      } else if (entry.name.endsWith('.d.ets') && fs.readFileSync(file, 'utf8').includes(symbol)) {
        found.push(fileMetadata(file));
      }
    }
  }
  visit(path.join(root, provider, 'build'));
  return found;
}

function checkPackage(t, tools, root, fixture) {
  const hap = path.join(root, 'entry/build/default/outputs/default/entry-default-unsigned.hap');
  t.equal(executeZipTest(tools, hap, t.workspace).exitCode, 0);
  const outputs = [];
  const tokens = { dynamic: fixture.dynamicTokens, static: fixture.staticTokens };
  for (const [kind, suffix] of [['dynamic', ''], ['static', '_static']]) {
    const entry = `ets/modules${suffix}.abc`;
    const artifact = path.join(t.workspace, 'evidence', `composed-${kind}.abc`);
    extractZipEntry(tools, hap, entry, artifact, t.workspace);
    t.ok(assertAbcHeader(readAbcHeader(fs.readFileSync(artifact)), kind));
    const disassembly = executeDisassembler(tools, kind, artifact, t.workspace);
    for (const token of tokens[kind]) {
      t.includes(disassembly.content, token);
    }
    outputs.push({ kind, entry, artifact: fileMetadata(artifact), symbols: tokens[kind] });
  }
  t.record('page-package', { hap: fileMetadata(hap), outputs });
}

function verify(t, fixture) {
  const tools = resolveToolchain(t.options.env || process.env);
  t.toolchain = publicToolchain(readToolchainVersions(tools));
  const project = prepare(t, tools, fixture);
  const manifest = project.list.map(fileMetadata);
  writeJson(path.join(t.workspace, 'evidence/input-manifest.json'), { files: manifest });
  const installed = executeOhpmInstall(project.root, t.workspace, tools);
  t.equal(installed.record.exitCode, 0, installed.record.logPath);
  const build = executeHvigor(project.root, t.workspace, tools);
  t.record('assemble-hap', build.record);
  t.equal(build.record.exitCode, 0, build.record.logPath);
  for (const symbol of fixture.declarationIncludes) {
    const generated = declarations(project.root, fixture.providerModule, symbol);
    t.greater(generated.length, 0);
    t.record(`declaration-${symbol}`, generated);
  }
  checkPackage(t, tools, project.root, fixture);
  const diagnostics = diagnosticsFromLog(`${build.stdout}\n${build.stderr}`);
  t.record('compiler-diagnostics', diagnostics);
  if (fixture.providerModule === 'dynamic_component' && diagnostics.length) {
    t.deepEqual(diagnostics.map(item => item.code), ['F0014', 'ESE0360', 'F0016']);
    const first = classifyFirstDiagnostic(diagnostics);
    t.equal(first.stage, 'GenerateDeclaration');
    t.equal(first.category, 'existing');
    t.includes(diagnostics[1].message, 'entry/src/main/ets/pages/Index.ets/:3:1');
    t.includes(diagnostics[2].message, "Can't find prefix for 'dynamic_component'");
    throw new StageFailure(first.stage, first.category, first.code, first.message,
      { diagnostics, projectRoot: project.root, classification: first.classification });
  } else {
    t.deepEqual(diagnostics, []);
  }
}

const cases = [
  { id: 'static-siblings-in-dynamic-page', direction: '11-to-12', group: 'compile',
    run: t => verify(t, staticSide()) },
  { id: 'dynamic-siblings-in-static-page', direction: '12-to-11', group: 'compile',
    run: t => verify(t, dynamicSide()) }
];

module.exports = { cases };
