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
  assertForbidden,
  assertFragments,
  executeCase,
  fail,
  normalizeText,
  readJsonFile,
  readNonemptyFile,
  requireDirectory,
  requireExecutable,
  requireFile,
  runProcess,
  versionText
} = require('../static_calls_dynamic_basic/harness');
const {
  classifyFirstDiagnostic,
  diagnosticsFromLog,
  hvigorArguments,
  hvigorEnvironment,
  resolveToolchain
} = require('../static_calls_dynamic_basic/compile.test');
const {
  generateFreshDeclarations,
  verifyDeclaration
} = require('./declaration.test');
const {
  materializeCompoundProject
} = require('./project_files');
const {
  artifactContracts,
  generatedDeclarations,
  knownGenerateDeclarationFailure
} = require('./expected_cases');
const {
  moduleIdentity,
  scenarios
} = require('./source_cases');

function validateToolchain(toolchain) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  const sdkPackage = path.join(toolchain.sdkRoot, 'default/openharmony/ets/oh-uni-package.json');
  requireFile(sdkPackage, 'INTEROP_UI_SDK ets package');
  requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
  requireExecutable(toolchain.dynamicDisassembler, 'INTEROP_UI_DYNAMIC_ARK_DISASM');
  return sdkPackage;
}

function toolchainReport(toolchain) {
  const sdkPackagePath = validateToolchain(toolchain);
  const nodeResult = runProcess(toolchain.node, ['--version']);
  assert.strictEqual(nodeResult.status, 0, `node --version failed: ${nodeResult.output}`);
  const hvigorPackagePath = path.resolve(path.dirname(toolchain.hvigor), '../hvigor/package.json');
  const hvigorPackage = readJsonFile(hvigorPackagePath, 'toolchain');
  const sdkPackage = readJsonFile(sdkPackagePath, 'toolchain');
  return [
    { name: 'node', path: toolchain.node, version: versionText(nodeResult) },
    { name: 'hvigor', path: toolchain.hvigor, version: hvigorPackage.version },
    { name: 'sdk', path: toolchain.sdkRoot, version: sdkPackage.version },
    { name: 'static-ark-disasm', path: toolchain.staticDisassembler, version: 'SDK-matched' },
    { name: 'dynamic-ark-disasm', path: toolchain.dynamicDisassembler, version: 'SDK-matched' }
  ];
}

function executeHvigor(workspace, toolchain, options = {}) {
  const environment = options.env || {};
  const args = hvigorArguments();
  const result = runProcess(toolchain.node, [toolchain.hvigor, ...args], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, environment),
    timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.buildLog, result.output);
  workspace.write(artifactContracts.buildCommand,
    [toolchain.node, toolchain.hvigor, ...args].join(' ') + '\n');
  return result;
}

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

function compoundDiagnostics(log) {
  const diagnostics = [...diagnosticsFromLog(log)];
  const lines = stripAnsi(log).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const detail = lines[index].match(/^Error Message: (.*) At File: (.*):(\d+):(\d+)$/);
    if (!detail) {
      continue;
    }
    const diagnostic = diagnostics[diagnostics.length - 1];
    if (!diagnostic || !diagnostic.code.startsWith('ESE')) {
      continue;
    }
    diagnostic.message = detail[1];
    diagnostic.file = detail[2];
    diagnostic.sourceLine = Number(detail[3]);
    diagnostic.column = Number(detail[4]);
    diagnostic.detail = true;
  }
  return diagnostics;
}

function verifyHvigorExit(result, allowExpectedFailure = false) {
  if (allowExpectedFailure) {
    return;
  }
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : normalizeText(result.output).split('\n').slice(-12).join('\n');
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${detail}`, { status: result.status, signal: result.signal });
  }
}

function identifyBaseline(diagnostics) {
  const first = classifyFirstDiagnostic(diagnostics.filter(item =>
    ['F0014', 'ESE0360', 'F0016'].includes(item.code)));
  if (!first || first.category !== 'existing') {
    return undefined;
  }
  const known = knownGenerateDeclarationFailure;
  const codes = diagnostics.map(item => item.code);
  if (!known.sequence.every(code => codes.includes(code))) {
    return undefined;
  }
  return first;
}

function verifyNoUnexpectedDiagnostics(diagnostics, scenario) {
  const expectedCode = scenario.expectedDiagnostic?.code;
  const expectedCodes = new Set([expectedCode, ...(scenario.expectedDiagnostic?.relatedCodes || [])]);
  const baselineCodes = identifyBaseline(diagnostics) ?
    new Set(knownGenerateDeclarationFailure.sequence) : new Set();
  const unexpected = diagnostics.filter(item => {
    if (baselineCodes.has(item.code)) {
      return false;
    }
    if (expectedCode && item.code === 'DRIVER_ERROR') {
      return false;
    }
    return !expectedCodes.has(item.code);
  });
  if (unexpected.length > 0) {
    const first = unexpected[0];
    fail(first.stage || 'CompileStaticArkTS', 'implementation', first.code || 'UNEXPECTED_DIAGNOSTIC',
      first.message, { diagnostics: unexpected });
  }
}

function verifyExpectedDiagnostic(result, scenario) {
  if (!scenario.expectedDiagnostic) {
    return undefined;
  }
  const expected = scenario.expectedDiagnostic;
  const output = stripAnsi(result.output);
  if (typeof result.status === 'number') {
    assert.notStrictEqual(result.status, 0,
      `${scenario.id} must fail in the real static consumer instead of producing a positive result`);
  }
  assert.ok(output.includes(expected.code),
    `${scenario.id} must emit ${expected.code}; output:\n${output}`);
  for (const fragment of expected.fragments) {
    assert.ok(output.includes(fragment),
      `${scenario.id} diagnostic must include ${fragment}; output:\n${output}`);
  }
  assert.ok(output.includes(expected.fileFragment),
    `${scenario.id} diagnostic must identify ${expected.fileFragment}`);
  const evidence = {
    code: expected.code,
    stage: scenario.expectedDiagnostic.stage,
    fileFragment: expected.fileFragment,
    acceptedAsPositive: false,
    message: expected.fragments
  };
  return evidence;
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function declarationKeys(project) {
  return [
    'Index',
    `src/main/ets/${project.scenario.componentFile.replace(/\.ets$/, '')}`,
    'src/main/ets/CompoundModels'
  ];
}

function prepareRepositoryProjection(workspace, project, generated) {
  const originalMapPath = path.join(workspace.root, artifactContracts.declarationMap);
  const originalMap = readJsonFile(originalMapPath, 'declgenV2');
  assert.strictEqual(originalMap.packageName, moduleIdentity.packageName);
  const declarationMap = {
    ...originalMap,
    files: {}
  };
  for (const key of declarationKeys(project)) {
    const originalEntry = originalMap.files[key];
    assert.ok(originalEntry, `decl-fileInfo.json must contain current source identity ${key}`);
    declarationMap.files[key] = {
      ...originalEntry,
      declPath: path.join(generated.outputRoot, `${key}.d.ets`)
    };
  }
  const declarationMapPath = path.join(workspace.root, artifactContracts.repositoryDeclarationMap);
  workspace.write(artifactContracts.repositoryDeclarationMap, JSON.stringify(declarationMap, null, 2));
  const projectionPath = path.join(workspace.root, artifactContracts.repositoryProjection);
  const projection = readJsonFile(path.join(workspace.root, artifactContracts.projectionConfig), 'arktsconfig');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== moduleIdentity.packageName) {
        continue;
      }
      module.declgenV2OutPath = generated.outputRoot;
      module.declFilesPath = declarationMapPath;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'both projection dependency lists must consume this run declarations');
  projection.cachePath = path.join(workspace.root, artifactContracts.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, artifactContracts.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, artifactContracts.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  workspace.write(artifactContracts.repositoryProjection, JSON.stringify(projection, null, 2));
  return {
    declarationMap,
    declarationMapPath,
    projection,
    projectionPath,
    consumedPaths: Object.values(declarationMap.files).map(entry => entry.declPath)
  };
}

function executeRepositoryStaticCompile(workspace, toolchain, projection, options = {}) {
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const result = runProcess(toolchain.node, [driver, projection.projectionPath], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, options.env || {}),
    timeout: Number((options.env || {}).INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.repositoryBuildLog, result.output);
  const diagnostics = diagnosticsFromLog(result.output);
  if (!options.allowExpectedFailure &&
    (result.error || result.status !== 0 || diagnostics.length > 0)) {
    fail('repository-static-compile', 'implementation', diagnostics[0]?.code || 'STATIC_COMPILE_FAILED',
      `repository declaration consumption failed: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`,
      { status: result.status, diagnostics });
  }
  return result;
}

function verifyRepositoryCallerConfig(workspace, project, generated) {
  const configPath = path.join(workspace.root, artifactContracts.repositoryCache, 'entry/arktsconfig.json');
  const config = readJsonFile(configPath, 'arktsconfig');
  const options = config.compilerOptions;
  assert.ok(options, 'repository arktsconfig compilerOptions must exist');
  assert.strictEqual(options.package, moduleIdentity.callerPackage);
  const dependencies = options.dependencies || {};
  const componentModule = `dynamic_component/src/main/ets/${project.scenario.componentFile.replace(/\.ets$/, '')}`;
  const expected = [
    {
      name: componentModule,
      declaration: path.join(generated.outputRoot,
        `src/main/ets/${project.scenario.componentFile.replace(/\.ets$/, '.d.ets')}`),
      source: project.componentSource,
      ohmUrl: `@normalized:N&&&${componentModule}&1.0.0`
    },
    {
      name: moduleIdentity.modelModule,
      declaration: path.join(generated.outputRoot, 'src/main/ets/CompoundModels.d.ets'),
      source: project.modelSource,
      ohmUrl: moduleIdentity.modelOhmUrl
    },
    {
      name: moduleIdentity.indexModule,
      declaration: path.join(generated.outputRoot, 'Index.d.ets'),
      source: path.join(workspace.root, 'dynamic_component/Index.ets'),
      ohmUrl: moduleIdentity.indexOhmUrl
    },
    {
      name: moduleIdentity.packageName,
      declaration: path.join(generated.outputRoot, 'Index.d.ets'),
      source: path.join(workspace.root, 'dynamic_component/Index.ets'),
      ohmUrl: moduleIdentity.indexOhmUrl
    }
  ];
  for (const item of expected) {
    const dependency = dependencies[item.name];
    assert.ok(dependency, `arktsconfig dependency ${item.name} must exist`);
    assert.strictEqual(dependency.language, 'js', `${item.name} retains ArkTS 1.1 identity`);
    assert.strictEqual(canonicalPath(dependency.path), canonicalPath(item.declaration),
      `${item.name} must consume the declaration generated in this case`);
    assert.strictEqual(canonicalPath(dependency.sourceFilePath), canonicalPath(item.source));
    assert.strictEqual(dependency.ohmUrl, item.ohmUrl);
    assert.ok(generated.files.includes(item.declaration),
      `${item.name} points outside this run's generated file set`);
  }
  return { configPath, dependencies: expected };
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or empty ${filePath}`, { filePath });
  }
  return fs.readFileSync(filePath);
}

function disassemble(workspace, toolchain, kind) {
  const isStatic = kind === 'static';
  const abcPath = path.join(workspace.root,
    isStatic ? artifactContracts.repositoryStaticAbc : artifactContracts.dynamicAbc);
  const outputPath = path.join(workspace.root,
    isStatic ? artifactContracts.repositoryStaticDisassembly : artifactContracts.dynamicDisassembly);
  assertBinaryArtifact(abcPath, 'ABC');
  const executable = isStatic ? toolchain.staticDisassembler : toolchain.dynamicDisassembler;
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.status !== 0) {
    fail('disassembly', 'environment', 'ARK_DISASM_FAILED',
      `${kind} ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  const text = readNonemptyFile(outputPath, 'disassembly');
  return { abcPath, outputPath, text };
}

function verifyPositiveDeclarations(generated) {
  const component = verifyDeclaration(generated, 'CompoundCard', generatedDeclarations.CompoundCard);
  const models = verifyDeclaration(generated, 'CompoundModels', generatedDeclarations.CompoundModels);
  const index = verifyDeclaration(generated, 'Index', generatedDeclarations.Index);
  return { component, models, index };
}

function verifyPositiveBridge(workspace) {
  const bridgePath = path.join(workspace.root, artifactContracts.bridgeSource);
  const bridge = readNonemptyFile(bridgePath, 'bridge');
  const { callerContracts } = require('./expected_cases');
  assertFragments(bridge, callerContracts.bridgeRequired, 'compound caller bridge');
  assertForbidden(bridge, callerContracts.bridgeForbidden, 'compound caller bridge');
  return { bridgePath, bridge };
}

function assertOrderedFragments(actual, fragments, label) {
  let cursor = 0;
  for (const fragment of fragments) {
    const index = actual.indexOf(fragment, cursor);
    assert.ok(index >= cursor,
      `${label} missing or out-of-order fragment ${fragment} after offset ${cursor}`);
    cursor = index + fragment.length;
  }
}

function verifyPositiveArtifacts(workspace, toolchain) {
  const staticResult = disassemble(workspace, toolchain, 'static');
  const dynamicResult = disassemble(workspace, toolchain, 'dynamic');
  const { callerContracts } = require('./expected_cases');
  assertFragments(staticResult.text, callerContracts.staticDisassemblyRequired, 'static UI and module identity');
  assertOrderedFragments(staticResult.text, callerContracts.staticParameterOrder,
    'compound parameter construction and assignment order');
  assertFragments(dynamicResult.text, callerContracts.dynamicDisassemblyRequired, 'dynamic ABC and module identity');
  return { staticResult, dynamicResult };
}

function verifyNegativeDeclaration(generated, scenario) {
  const componentPath = generated.files.find(filePath =>
    filePath.endsWith(`${scenario.componentName}.d.ets`));
  assert.ok(componentPath, `${scenario.id} declaration must be generated before diagnosis`);
  const content = readNonemptyFile(componentPath, 'declgenV2');
  assertFragments(content, [
    `'use static'`,
    `export declare struct ${scenario.componentName}`
  ], `${scenario.id} declaration`);
  const modelsPath = generated.files.find(filePath => filePath.endsWith('CompoundModels.d.ets'));
  const modelsContent = readNonemptyFile(modelsPath, 'declgenV2');
  const signatures = {
    OptionalCard: 'consumeOptionalModel(value: OptionalModel | undefined): string;',
    UnionCard: 'selectProfile(value: AmbiguousProfile): string;',
    ConstructorCard: 'requireConstructedModel(value: RequiredCtorModel): string;'
  };
  assertFragments(modelsContent, [signatures[scenario.componentName]],
    `${scenario.id} parameter declaration`);
  assertForbidden(content, ['@PropRef'], `${scenario.id} must not use an optional Prop parameter`);
  assert.ok(!fs.existsSync(path.join(generated.outputRoot, 'Consumer.ets')),
    'unsupported scenario must not install a fake positive consumer');
  return { componentPath, content };
}

async function runScenario(scenarioId, options, shared) {
  const scenario = scenarios[scenarioId];
  const definition = {
    name: `compound-compile-${scenario.id}`,
    group: 'compile',
    direction: DIRECTION,
    kind: scenario.verifySuccessfulConsumer ? 'full-chain' : 'negative-diagnostic',
    coverage: scenario.title
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const tools = toolchainReport(toolchain);
    context.passStage('toolchain', { tools });
    const project = materializeCompoundProject(workspace, toolchain.sdkRoot, scenarioId);
    context.passStage('materialize', { fileCount: project.fileCount });
    const result = executeHvigor(workspace, toolchain, options);
    const diagnostics = compoundDiagnostics(result.output);
    if (!shared.baseline) {
      shared.baseline = identifyBaseline(diagnostics);
      shared.baselineDiagnostics = diagnostics;
      shared.baselineLog = path.join(workspace.root, artifactContracts.buildLog);
      shared.tools = tools;
    }
    const generated = {};
    const failures = [];
    const attempt = (stage, body) => {
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
    attempt('unexpected-diagnostics', () => verifyNoUnexpectedDiagnostics(diagnostics, scenario));
    attempt('Hvigor', () => verifyHvigorExit(result, !scenario.verifySuccessfulConsumer));
    const fresh = attempt('DeclfileProductor.runDeclgen', () =>
      generateFreshDeclarations(workspace, project));
    let projection;
    if (fresh) {
      generated.fresh = fresh;
      if (scenario.verifySuccessfulConsumer) {
        generated.declarations = attempt('public-declarations', () => verifyPositiveDeclarations(fresh));
      } else {
        generated.declarations = attempt('negative-declaration', () => verifyNegativeDeclaration(fresh, scenario));
      }
      projection = attempt('repository-projection', () => prepareRepositoryProjection(workspace, project, fresh));
    }
    let repositoryResult;
    if (projection) {
      repositoryResult = attempt('repository-static-compile', () =>
        executeRepositoryStaticCompile(workspace, toolchain, projection, {
          ...options,
          allowExpectedFailure: !scenario.verifySuccessfulConsumer
        }));
    }
    if (scenario.verifySuccessfulConsumer && repositoryResult) {
      generated.callerConfig = attempt('caller-checker-resolution', () =>
        verifyRepositoryCallerConfig(workspace, project, fresh));
      generated.bridge = attempt('caller-interop-transform', () => verifyPositiveBridge(workspace));
      generated.artifacts = attempt('checker-ui-transform-abc', () => verifyPositiveArtifacts(workspace, toolchain));
    }
    if (!scenario.verifySuccessfulConsumer && repositoryResult) {
      generated.unsupportedDiagnostic = attempt('explicit-unsupported-diagnostic', () =>
        verifyExpectedDiagnostic({
          output: readNonemptyFile(path.join(workspace.root, artifactContracts.repositoryBuildLog),
            'repository-static-compile'),
          status: repositoryResult.status
        }, scenario));
      generated.noPositiveConsumer = true;
    }
    const details = {
      tools,
      generated,
      diagnostics,
      command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()],
      projectRoot: workspace.root,
      baseline: shared.baseline
    };
    if (failures.length > 0) {
      const first = failures[0];
      const failure = first instanceof StageFailure ? first : new StageFailure(
        first.stage || 'compound-compile', first.category || 'implementation',
        first.code || 'ASSERTION', first.message);
      failure.details = { ...failure.details, ...details };
      failure.diagnostics = diagnostics;
      throw failure;
    }
    return {
      toolchain: tools,
      generated,
      diagnostics,
      command: details.command,
      baseline: shared.baseline
    };
  }, options);
}

async function runBaselineFailure(shared, options) {
  if (!shared.baseline) {
    return undefined;
  }
  const first = shared.baseline;
  return executeCase({
    name: 'compound-existing-sdk-generate-declaration-diagnostic',
    group: 'compile',
    direction: DIRECTION,
    kind: 'existing-baseline',
    coverage: knownGenerateDeclarationFailure.classification
  }, async context => {
    context.passStage('baseline-reproduced', { logPath: shared.baselineLog });
    fail(first.stage, 'existing', first.code, first.message, {
      diagnostics: shared.baselineDiagnostics,
      classification: first.classification,
      logPath: shared.baselineLog,
      tools: shared.tools,
      independentlyReproducedBy: 'static_calls_dynamic_basic and PR07 compound project'
    });
  }, options);
}

async function runCompoundCompilations(options = {}) {
  const shared = {};
  const results = [];
  for (const scenarioId of ['compound', 'optionalModel', 'ambiguousUnion', 'requiredConstructor']) {
    results.push(await runScenario(scenarioId, options, shared));
  }
  const baseline = await runBaselineFailure(shared, options);
  if (baseline) {
    results.push(baseline);
  }
  return results;
}

module.exports = {
  compoundDiagnostics,
  executeHvigor,
  executeRepositoryStaticCompile,
  identifyBaseline,
  prepareRepositoryProjection,
  runCompoundCompilations,
  toolchainReport,
  validateToolchain,
  verifyExpectedDiagnostic,
  verifyHvigorExit,
  verifyNoUnexpectedDiagnostics,
  verifyRepositoryCallerConfig
};
