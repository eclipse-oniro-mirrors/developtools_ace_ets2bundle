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
const ts = require(path.resolve(__dirname, '../../../../node_modules/typescript'));
const {
  assertNoPreexistingArtifacts,
  getScenarioPaths,
  materializeProject,
  validateDeclarationMap,
  validateDependencyMap,
  validateProjectionEvidence
} = require('../dynamic_calls_static_basic/project_files');
const {
  validateDeclarationAndBridge
} = require('../dynamic_calls_static_basic/compile.test');
const {
  assertAbcHeader,
  findFatalDiagnostics,
  readAbcHeader
} = require('../dynamic_calls_static_basic/expected_cases');
const {
  executeDisassembler,
  executeHvigor,
  executeOhpmInstall,
  executeZipTest,
  listZipEntries,
  publicToolchain,
  readToolchainVersions,
  resolveToolchain
} = require('../dynamic_calls_static_basic/toolchain');
const { fixtures, assertScenario } = require('./project_cases');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');

function bridgeSyntax(filePath, rewriteExports) {
  const source = ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf8'),
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.TS);
  const statements = source.statements.filter(statement => {
    if (ts.isImportDeclaration(statement)) {
      return !['@ohos.arkui.component', '@ohos.arkui.stateManagement']
        .includes(statement.moduleSpecifier.text);
    }
    return !(ts.isExportDeclaration(statement) && statement.exportClause &&
      ts.isNamedExports(statement.exportClause) && statement.exportClause.elements.length === 0);
  }).map(statement => {
    if (rewriteExports && ts.isExportDeclaration(statement) && statement.moduleSpecifier &&
        statement.moduleSpecifier.text === './src/main/ets/StaticCounter') {
      return ts.factory.updateExportDeclaration(statement, statement.modifiers, statement.isTypeOnly,
        statement.exportClause,
        ts.factory.createStringLiteral('@normalized:N&&&static_component/src/main/ets/StaticCounter&1.0.0'),
        statement.assertClause);
    }
    return statement;
  });
  const normalized = ts.factory.updateSourceFile(source, statements);
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(normalized);
}

function bridgeTokens(source) {
  const scanner = ts.createScanner(ts.ScriptTarget.ES2021, true, ts.LanguageVariant.Standard, source);
  const tokens = [];
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    tokens.push([token, scanner.getTokenValue() || scanner.getTokenText()]);
    token = scanner.scan();
  }
  return tokens;
}

function assertBridgeConsumption(t, paths) {
  const bridges = [
    ['component', paths.staticBridge, paths.callerCachedBridge, false],
    ['index', paths.staticIndexBridge, paths.callerCachedIndexBridge, true]
  ];
  for (const [name, generated, consumed, rewrite] of bridges) {
    const generatedSyntax = bridgeSyntax(generated, rewrite);
    const consumedSyntax = bridgeSyntax(consumed, false);
    t.deepEqual(bridgeTokens(consumedSyntax), bridgeTokens(generatedSyntax),
      `${name} bridge differs after SDK-only imports and exact OHM export rewriting`);
    t.record(`bridge-consumption-${name}`, {
      generated,
      consumed,
      generatedSyntax,
      consumedSyntax,
      allowedImports: ['@ohos.arkui.component', '@ohos.arkui.stateManagement'],
      rewritesExports: rewrite
    });
  }
}

function checkProcess(t, result, stage) {
  t.record(stage, result.record);
  t.equal(result.record.exitCode, 0, `${stage} failed; see ${result.record.logPath}`);
  const diagnostics = findFatalDiagnostics(`${result.stdout || ''}\n${result.stderr || ''}`);
  t.deepEqual(diagnostics, [], `${stage} reported fatal compiler diagnostics`);
}

function prepare(t, fixture, tools) {
  const materialized = materializeProject(t.workspace, tools.sdkHome);
  const paths = getScenarioPaths(materialized.projectRoot);
  assertNoPreexistingArtifacts(paths);
  fs.writeFileSync(paths.dynamicSource, fixture.caller);
  if (fixture.staticSource) {
    fs.writeFileSync(paths.staticSource, fixture.staticSource);
  }
  if (fixture.staticIndex) {
    fs.writeFileSync(paths.staticIndexSource, fixture.staticIndex);
  }
  const manifest = {
    ...materialized.manifest,
    files: materialized.manifest.files.map(file => ({ ...file, ...fileMetadata(file.path) }))
  };
  writeJson(path.join(t.workspace, 'evidence', 'input-manifest.json'), manifest);
  for (const file of manifest.files) {
    t.equal(file.sha256, fileMetadata(file.path).sha256, 'Input manifest differs from materialized source');
  }
  t.record('scenario-input', {
    id: fixture.id,
    caller: paths.dynamicSource,
    staticSource: paths.staticSource,
    source: fixture.caller,
    expected: fixture.expected,
    inputManifest: manifest
  });
  return { paths, projectRoot: materialized.projectRoot };
}

function assertGeneratedConsumption(t, paths, startedAt) {
  validateDeclarationAndBridge(t, paths, startedAt);
  for (const [name, filePath] of Object.entries({
    caller: paths.callerTransformedPage,
    componentBridge: paths.callerCachedBridge,
    indexBridge: paths.callerCachedIndexBridge
  })) {
    t.freshArtifact(`fresh-${name}`, filePath, { notBeforeMs: startedAt, minimumBytes: 32 });
  }
  assertBridgeConsumption(t, paths);
  validateProjectionEvidence(t, paths);
  validateDeclarationMap(t, paths);
  validateDependencyMap(t, paths);
}

function assertBytecode(t, paths, tools, startedAt, fixture) {
  const artifacts = {};
  for (const kind of ['dynamic', 'static']) {
    const abcPath = kind === 'dynamic' ? paths.dynamicAbc : paths.staticAbc;
    const metadata = t.freshArtifact(`fresh-${kind}-abc`, abcPath, {
      notBeforeMs: startedAt,
      minimumBytes: 16
    });
    const header = readAbcHeader(fs.readFileSync(abcPath));
    t.ok(assertAbcHeader(header, kind));
    const disassembly = executeDisassembler(tools, kind, abcPath, t.workspace);
    t.greater(disassembly.content.length, 32);
    artifacts[kind] = { metadata, header, disassembly: disassembly.outputPath };
    if (kind === 'static') {
      t.includes(disassembly.content, 'StaticCounter');
    } else {
      for (const snippet of fixture.expected.bytecode || []) {
        t.includes(disassembly.content, snippet, `Dynamic ABC misses ${snippet}`);
      }
    }
  }
  t.notEqual(artifacts.dynamic.header.versionHex, artifacts.static.header.versionHex);
  t.record('mixed-abc', artifacts);
}

function assertHap(t, paths, tools, startedAt) {
  t.freshArtifact('fresh-hap', paths.unsignedHap, { notBeforeMs: startedAt, minimumBytes: 128 });
  const zip = executeZipTest(tools, paths.unsignedHap, t.workspace);
  t.equal(zip.exitCode, 0);
  const entries = listZipEntries(tools, paths.unsignedHap, t.workspace);
  t.ok(entries.includes('ets/modules.abc'));
  t.ok(entries.includes('ets/modules_static.abc'));
  t.record('hap-layout', { path: paths.unsignedHap, entries, deviceExecution: false });
}

async function compileScenario(t, fixture) {
  const startedAt = Date.now();
  const tools = resolveToolchain(t.options.env || process.env);
  const versions = readToolchainVersions(tools);
  t.toolchain = publicToolchain(versions);
  t.record('toolchain', versions);
  const { paths, projectRoot } = prepare(t, fixture, tools);
  checkProcess(t, executeOhpmInstall(projectRoot, t.workspace, tools), 'ohpm-install');
  checkProcess(t, executeHvigor(projectRoot, t.workspace, tools), 'assemble-hap');
  assertGeneratedConsumption(t, paths, startedAt);
  const callerOutput = fs.readFileSync(paths.callerTransformedPage, 'utf8');
  assertScenario(t, callerOutput, fixture, paths);
  assertBytecode(t, paths, tools, startedAt, fixture);
  assertHap(t, paths, tools, startedAt);
  return {
    projectRoot,
    paths,
    stages: ['static-declgenV1', 'old-TS-bridge', 'dynamic-consumption', 'mixed-abc', 'hap'],
    deviceExecution: false
  };
}

const cases = fixtures.map(fixture => ({
  id: `compile-${fixture.id}`,
  group: 'compile',
  run: t => compileScenario(t, fixture)
}));

module.exports = { cases, compileScenario };
