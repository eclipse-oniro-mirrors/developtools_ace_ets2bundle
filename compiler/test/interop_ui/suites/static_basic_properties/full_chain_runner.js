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
const {
  DIRECTION,
  StageFailure,
  assert,
  assertFragments,
  createWorkspace,
  executeCase,
  readNonemptyFile
} = require('../static_calls_dynamic_basic/harness');
const { diagnosticsFromLog, resolveToolchain } = require('../static_calls_dynamic_basic/compile.test');
const {
  declarationPaths,
  disassemble,
  executeHvigor,
  executeRepositoryStaticCompile,
  hvigorArguments,
  prepareRepositoryProjection,
  primaryFailure,
  toolchainReport,
  verifyCallerConfig,
  verifyDeclarationArtifacts,
  verifyGenerateDeclaration,
  verifyHvigorExit,
  verifyRepositoryCompile
} = require('./compile.test');
const { artifactContracts } = require('./expected_cases');
const { materializeProject, staticCaller } = require('./project_files');
const { associatedConsumersFor, moduleIdentity, precompileScenario, scenarios } = require('./source_cases');
const { generateDeclarations } = require('./unit.test');

function verifyBridgeSource(workspace, testCase) {
  const bridgePath = path.join(workspace.root, artifactContracts.bridgeSource);
  const bridge = readNonemptyFile(bridgePath, 'bridge');
  const identity = moduleIdentity(testCase);
  const required = [
    `import { ${testCase.componentName} } from "dynamic_component";`,
    `globalThis as any`,
    `Panda.getClass('Lentry/src/main/ets/pages/Index/ETSGLOBAL;')`
  ];
  assertFragments(bridge, required, `${testCase.id} static bridge`);
  assert.ok(identity.componentName.length > 0);
  return bridgePath;
}

function verifyCallerValueContracts(testCase, disassemblyPath) {
  const text = readNonemptyFile(disassemblyPath, 'disassembly');
  for (const property of testCase.properties) {
    const marker = `lda.str "${property.name}"`;
    const propertyIndex = text.indexOf(marker);
    if (!property.hasCaller) {
      assert.strictEqual(propertyIndex, -1, `${testCase.id}: omitted ${property.name} was written by the caller`);
      continue;
    }
    assert.ok(propertyIndex >= 0, `${testCase.id}: caller did not set ${property.name}`);
    if (property.abcValue) {
      assertFragments(text.slice(propertyIndex, propertyIndex + 800), property.abcValue,
        `${testCase.id}: value of ${property.name}`);
    }
  }
}

function verifyStaticAbc(workspace, toolchain, testCase, repository) {
  const paths = declarationPaths(workspace, repository);
  const identity = moduleIdentity(testCase);
  const result = disassemble(workspace, toolchain.staticDisassembler, paths.staticAbc, paths.staticDisassembly, [
    identity.componentModule,
    identity.componentOhmUrl,
    identity.callerRecord,
    testCase.componentName,
    'CompatibleComponentInfo'
  ], repository ? 'repository-static-abc' : 'static-abc');
  verifyCallerValueContracts(testCase, result.outputPath);
  return result;
}

function verifyDynamicAbc(workspace, toolchain, testCase) {
  const identity = moduleIdentity(testCase);
  return disassemble(workspace, toolchain.dynamicDisassembler,
    path.join(workspace.root, artifactContracts.dynamicAbc),
    path.join(workspace.root, artifactContracts.dynamicDisassembly), [
      identity.dynamicRecord,
      `local_name: ${testCase.componentName}, export_name: ${testCase.componentName}`,
      identity.componentOhmUrl,
      'initialRender',
      ...testCase.properties.map(property => property.name)
    ], 'dynamic-abc');
}

function createAttempt(context, failures) {
  return (stage, body) => {
    try {
      const value = body();
      context.passStage(stage);
      return value;
    } catch (error) {
      context.failStage(stage, error);
      failures.push(error);
      return undefined;
    }
  };
}

function generateMainDeclarations(workspace, testCase, attempt) {
  return attempt('DeclfileProductor.runDeclgen', () => {
    const outputRoot = path.join(workspace.root, artifactContracts.repositoryDeclgenRoot);
    return generateDeclarations(workspace, testCase, path.relative(workspace.root, outputRoot));
  });
}

function compileMainConsumer(workspace, toolchain, testCase, paths, options, attempt) {
  if (testCase.expectedStaticDiagnostic) {
    workspace.write('entry/src/main/ets/pages/Index.ets', staticCaller(testCase));
  }
  return attempt('repository-static-compile', () => {
    const result = executeRepositoryStaticCompile(workspace, toolchain, paths, options);
    return { result, expectedDiagnostic: verifyRepositoryCompile(testCase, result) };
  });
}

function copyDonorConfiguration(donor, associated) {
  const donorRoots = [...new Set([donor.root, fs.realpathSync(donor.root)])];
  const textFiles = [
    artifactContracts.declarationMap,
    artifactContracts.projectionConfig,
    'entry/build/default/intermediates/loader/default/loader.json'
  ];
  for (const relative of textFiles) {
    let content = readNonemptyFile(path.join(donor.root, relative), 'arktsconfig');
    for (const donorRoot of donorRoots) {
      content = content.split(donorRoot).join(associated.root);
    }
    associated.write(relative, content);
  }
  for (const relative of ['res', 'generated', 'declgen/default/declgenBridgeCode']) {
    const source = path.join(donor.root, 'entry/build/default/intermediates', relative);
    const destination = path.join(associated.root, 'entry/build/default/intermediates', relative);
    if (!fs.existsSync(source)) {
      continue;
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  }
}

function runAssociatedConsumer(donor, toolchain, testCase, options) {
  const associated = createWorkspace(testCase.id, { keep: options.keep });
  try {
    materializeProject(associated, testCase, toolchain.sdkRoot);
    copyDonorConfiguration(donor, associated);
    generateDeclarations(associated, testCase, artifactContracts.repositoryDeclgenRoot);
    const paths = prepareRepositoryProjection(associated);
    const compilation = executeRepositoryStaticCompile(associated, toolchain, paths, options);
    verifyRepositoryCompile(testCase, compilation);
    const config = verifyCallerConfig(associated, testCase);
    const abc = verifyStaticAbc(associated, toolchain, testCase, true);
    return {
      id: testCase.id,
      status: 'passed',
      projectRoot: associated.root,
      declaration: paths.componentDeclaration,
      config: config.configPath,
      abc: abc.abcPath,
      diagnostics: compilation.diagnostics
    };
  } finally {
    associated.cleanup();
  }
}

function runAssociatedConsumers(workspace, toolchain, testCase, options, attempt) {
  const results = [];
  for (const associated of associatedConsumersFor(testCase)) {
    results.push(attempt(`associated-consumer:${associated.id}`, () =>
      runAssociatedConsumer(workspace, toolchain, associated, options)));
  }
  return results.filter(Boolean);
}

function completeCase(context, state) {
  const diagnostics = [
    ...diagnosticsFromLog(state.hvigor.output),
    ...(state.compilation ? state.compilation.result.diagnostics : [])
  ];
  const details = {
    tools: state.tools,
    generated: state.generated,
    associatedConsumers: state.associatedConsumers,
    diagnostics,
    expectedDiagnostic: state.compilation?.expectedDiagnostic,
    command: [state.toolchain.node, state.toolchain.hvigor, ...hvigorArguments()],
    repositoryCommand: state.compilation ? [state.toolchain.node, state.driver, state.paths.projectionPath] : undefined,
    projectRoot: context.workspace.root
  };
  if (state.failures.length > 0) {
    const first = primaryFailure(state.failures);
    const failure = first instanceof StageFailure ? first : new StageFailure(
      first.stage || 'full-chain', first.category || 'implementation', first.code || first.name || 'ASSERTION', first.message);
    failure.details = { ...failure.details, ...details };
    failure.diagnostics = diagnostics;
    throw failure;
  }
  return {
    toolchain: state.tools,
    generated: state.generated,
    associatedConsumers: state.associatedConsumers,
    diagnostics,
    expectedDiagnostic: details.expectedDiagnostic,
    command: details.command,
    repositoryCommand: details.repositoryCommand
  };
}

async function runFullChainCase(testCase, options = {}) {
  const definition = {
    name: `${testCase.id}-full-chain`,
    group: 'compile',
    direction: DIRECTION,
    kind: 'full-chain',
    coverage: `${testCase.branch}: legal precompile, repository-only negative injection, all caller checks and ABC identity`
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const report = toolchainReport(toolchain);
    context.passStage('toolchain', { tools: report.tools });
    const precompile = precompileScenario(testCase);
    const project = materializeProject(workspace, precompile, toolchain.sdkRoot);
    context.passStage('materialize', { ...project, precompileCaller: staticCaller(precompile) });
    const hvigor = executeHvigor(workspace, toolchain, options);
    const failures = [];
    const generated = {};
    const attempt = createAttempt(context, failures);
    attempt('GenerateDeclaration', () => verifyGenerateDeclaration(hvigor));
    attempt('Hvigor', () => verifyHvigorExit(hvigor));
    const declarations = generateMainDeclarations(workspace, testCase, attempt);
    const paths = declarations ? attempt('repository-projection', () => prepareRepositoryProjection(workspace)) : undefined;
    if (declarations) {
      generated.declarations = declarations;
    }
    const compilation = paths ? compileMainConsumer(workspace, toolchain, testCase, paths, options, attempt) : undefined;
    if (paths) {
      attempt('declgenV2', () => verifyDeclarationArtifacts(workspace, testCase));
      generated.arktsconfig = attempt('arktsconfig', () => verifyCallerConfig(workspace, testCase));
    }
    generated.bridgePath = attempt('bridge', () => verifyBridgeSource(workspace, testCase));
    if (!testCase.expectedStaticDiagnostic) {
      generated.repositoryStatic = attempt('repository-static-abc', () => verifyStaticAbc(workspace, toolchain, testCase, true));
      generated.static = attempt('static-abc', () => verifyStaticAbc(workspace, toolchain, testCase, false));
      generated.dynamic = attempt('dynamic-abc', () => verifyDynamicAbc(workspace, toolchain, testCase));
    }
    const associatedConsumers = runAssociatedConsumers(workspace, toolchain, testCase, options, attempt);
    return completeCase(context, {
      toolchain, driver: report.driver, tools: report.tools, hvigor, failures, generated, paths, compilation,
      associatedConsumers
    });
  }, options);
}

async function runFullChainCases(options = {}) {
  const results = [];
  for (const testCase of scenarios.filter(item => item.fullChain)) {
    results.push(await runFullChainCase(testCase, options));
  }
  return results;
}

module.exports = {
  runAssociatedConsumer,
  runFullChainCase,
  runFullChainCases,
  verifyBridgeSource,
  verifyCallerValueContracts,
  verifyDynamicAbc,
  verifyStaticAbc
};
