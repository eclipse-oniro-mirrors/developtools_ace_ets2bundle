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
  COMPILER_ROOT, DIRECTION, StageFailure, assert, assertFragments, executeCase, fail,
  normalizeText, readJsonFile, readNonemptyFile, requireDirectory, requireExecutable,
  requireFile, runProcess, versionText
} = require('../static_calls_dynamic_basic/harness');
const { diagnosticsFromLog, hvigorEnvironment, resolveToolchain } =
  require('../static_calls_dynamic_basic/compile.test');
const { DYNAMIC_PROJECT_FILES, PACKAGE_NAME } = require('./source_cases');
const {
  ARTIFACTS,
  DYNAMIC_IDENTITY_FRAGMENTS,
  FULL_DECLARATION_FRAGMENTS,
  FULL_PROJECT_ORIGINS,
  KNOWN_DECLARATION_DIAGNOSTICS,
  STATIC_IDENTITY_FRAGMENTS
} = require('./expected_cases');
const {
  DYNAMIC_SOURCE_KEYS,
  canonicalPath,
  materializeProject,
  ohmUrl,
  projectContract,
  sourcePath,
  validateProjectSources
} = require('./project_files');
const {
  assertOrigins, assertRelativeModulesResolve, buildDeclarationGraph, listExportedNames
} = require('./declaration_ast');
const { generateDeclarations } = require('./declaration.test');
const { assertDynamicIndirectExports, assertStaticCallerBindings } = require('./abc_assertions');

function validateToolchain(toolchain) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  const sdkPackage = path.join(toolchain.sdkRoot, 'default/openharmony/ets/oh-uni-package.json');
  requireFile(sdkPackage, 'INTEROP_UI_SDK ets package');
  requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
  requireExecutable(toolchain.dynamicDisassembler, 'INTEROP_UI_DYNAMIC_ARK_DISASM');
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  return { sdkPackage, driver };
}

function toolchainReport(toolchain) {
  const { sdkPackage: sdkPackagePath } = validateToolchain(toolchain);
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

function hvigorArguments() {
  const contract = projectContract();
  return [
    '--mode', 'module',
    '-p', `product=${contract.product}`,
    '-p', `module=${contract.module}@${contract.target}`,
    '-p', `buildMode=${contract.buildMode}`,
    ...contract.buildTasks,
    '--no-daemon'
  ];
}

function executeHvigor(workspace, toolchain, options = {}) {
  const environment = options.env || {};
  const args = [toolchain.hvigor, ...hvigorArguments()];
  const result = runProcess(toolchain.node, args, {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, environment),
    timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 300000)
  });
  workspace.write(ARTIFACTS.buildLog, result.output);
  workspace.write('evidence/hvigor-command.txt', [toolchain.node, ...args].join(' ') + '\n');
  return result;
}

function verifyHvigorExit(result) {
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : normalizeText(result.output).split('\n').slice(-12).join('\n');
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${detail}`, { status: result.status, signal: result.signal });
  }
  assert.ok(result.output.includes('BUILD SUCCESSFUL'), 'Hvigor success marker is missing');
}

function diagnosticProblem(diagnostics) {
  const known = KNOWN_DECLARATION_DIAGNOSTICS;
  const rules = [...known.sequence, ...known.cascade];
  for (let index = 0; index < diagnostics.length; index += 1) {
    const actual = diagnostics[index], expected = rules[index];
    if (!expected || actual.stage !== known.stage || actual.code !== expected.code ||
      !actual.message.includes(expected.text)) {
      return { actual, expected, index };
    }
  }
  if (diagnostics.length !== rules.length) {
    const index = Math.max(0, diagnostics.length - 1);
    return { actual: diagnostics[index], expected: rules[diagnostics.length], index };
  }
  return undefined;
}

function verifyDeclarationDiagnostics(result) {
  const diagnostics = diagnosticsFromLog(result.output);
  if (diagnostics.length === 0) return diagnostics;
  const known = KNOWN_DECLARATION_DIAGNOSTICS;
  const problem = diagnosticProblem(diagnostics);
  const first = problem ? problem.actual : diagnostics[0];
  throw new StageFailure(first.stage || known.stage, problem ? 'implementation' : known.category,
    first.code, first.message, {
      diagnostics,
      classification: problem ? `unclassified diagnostic at ordered whitelist index ${problem.index}` : known.classification,
      whitelistLength: known.sequence.length + known.cascade.length,
      whitelistIndex: problem?.index,
      unexpectedDiagnostic: problem?.actual,
      logPath: ARTIFACTS.buildLog
    });
}

function generateRepositoryDeclarations(workspace) {
  const generated = generateDeclarations(
    workspace,
    Object.keys(DYNAMIC_PROJECT_FILES).sort(),
    ARTIFACTS.repositoryDeclgenRoot
  );
  const graph = buildDeclarationGraph(generated.declarations);
  const relativeModules = assertRelativeModulesResolve(graph);
  const origins = assertOrigins(graph, FULL_PROJECT_ORIGINS);
  assert.deepStrictEqual(listExportedNames(graph, 'Index'), Object.keys(FULL_PROJECT_ORIGINS).sort());
  for (const [key, fragments] of Object.entries(FULL_DECLARATION_FRAGMENTS)) {
    assertFragments(generated.declarations[key].content, fragments, `repository declaration ${key}`);
  }
  workspace.write('evidence/repository-export-graph.json', JSON.stringify({
    origins,
    relativeModules,
    exports: listExportedNames(graph, 'Index')
  }, null, 2));
  return { ...generated, graphEvidence: { origins, relativeModules } };
}

function prepareRepositoryProjection(workspace, generated) {
  const originalMapPath = path.join(workspace.root, ARTIFACTS.declarationMap);
  const declarationMap = readJsonFile(originalMapPath, 'decl-fileInfo');
  assert.strictEqual(declarationMap.packageName, PACKAGE_NAME);
  assert.deepStrictEqual(Object.keys(declarationMap.files).sort(), DYNAMIC_SOURCE_KEYS,
    'Hvigor declaration map must contain every multifile source exactly once');
  for (const key of DYNAMIC_SOURCE_KEYS) {
    const entry = declarationMap.files[key];
    assert.strictEqual(canonicalPath(entry.filePath), canonicalPath(sourcePath(workspace, key)),
      `decl-fileInfo source identity differs for ${key}`);
    assert.strictEqual(entry.ohmUrl, ohmUrl(key), `decl-fileInfo OHM identity differs for ${key}`);
    entry.declPath = generated.declarations[key].path;
  }
  const declarationMapPath = path.join(workspace.root, ARTIFACTS.repositoryDeclarationMap);
  workspace.write(ARTIFACTS.repositoryDeclarationMap, JSON.stringify(declarationMap, null, 2));
  const projection = readJsonFile(path.join(workspace.root, ARTIFACTS.projectionConfig), 'projection');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== PACKAGE_NAME) {
        continue;
      }
      module.declgenV2OutPath = path.join(workspace.root, ARTIFACTS.repositoryDeclgenRoot);
      module.declFilesPath = declarationMapPath;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'both dependency lists must consume this run\'s declaration map');
  projection.cachePath = path.join(workspace.root, ARTIFACTS.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, ARTIFACTS.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, ARTIFACTS.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  const projectionPath = path.join(workspace.root, ARTIFACTS.repositoryProjection);
  workspace.write(ARTIFACTS.repositoryProjection, JSON.stringify(projection, null, 2));
  return { declarationMapPath, projectionPath, originalMapPath, declarationMap };
}

function executeRepositoryStaticCompile(workspace, toolchain, paths, options = {}) {
  const { driver } = validateToolchain(toolchain);
  const result = runProcess(toolchain.node, [driver, paths.projectionPath], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, options.env || {}),
    timeout: Number((options.env || {}).INTEROP_UI_BUILD_TIMEOUT_MS || 300000)
  });
  workspace.write(ARTIFACTS.repositoryBuildLog, result.output);
  const diagnostics = diagnosticsFromLog(result.output);
  if (result.error || result.status !== 0 || diagnostics.length > 0) {
    fail('repository-static-compile', 'implementation', diagnostics[0]?.code || 'STATIC_COMPILE_FAILED',
      `multifile static consumption failed: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`,
      { status: result.status, diagnostics });
  }
  return result;
}

function verifyCallerConfig(workspace, generated) {
  const configPath = path.join(workspace.root, ARTIFACTS.repositoryCache, 'entry/arktsconfig.json');
  const config = readJsonFile(configPath, 'arktsconfig');
  const options = config.compilerOptions;
  assert.ok(options, 'arktsconfig compilerOptions must exist');
  assert.strictEqual(options.package, 'entry');
  assert.ok(options.paths && typeof options.paths === 'object', 'arktsconfig paths mapping must exist');
  const dependencies = options.dependencies || {};
  const checked = {};
  for (const key of DYNAMIC_SOURCE_KEYS) {
    const dependencyName = `${PACKAGE_NAME}/${key}`;
    const dependency = dependencies[dependencyName];
    assert.ok(dependency, `arktsconfig lacks ${dependencyName}`);
    assert.strictEqual(dependency.language, 'js', `${dependencyName} must remain a dynamic dependency`);
    assert.strictEqual(canonicalPath(dependency.path), canonicalPath(generated.declarations[key].path),
      `${dependencyName} consumed a stale declaration`);
    assert.strictEqual(canonicalPath(dependency.sourceFilePath), canonicalPath(sourcePath(workspace, key)),
      `${dependencyName} consumed a stale source mapping`);
    assert.strictEqual(dependency.ohmUrl, ohmUrl(key, '1.0.0'));
    checked[dependencyName] = dependency;
  }
  const packageEntry = dependencies[PACKAGE_NAME];
  assert.ok(packageEntry, 'arktsconfig package entry must exist');
  assert.strictEqual(packageEntry.language, 'js');
  assert.strictEqual(canonicalPath(packageEntry.path), canonicalPath(generated.declarations.Index.path));
  assert.strictEqual(canonicalPath(packageEntry.sourceFilePath), canonicalPath(sourcePath(workspace, 'Index')));
  assert.strictEqual(packageEntry.ohmUrl, ohmUrl('Index', '1.0.0'));
  checked[PACKAGE_NAME] = packageEntry;
  return { configPath, dependencies: checked };
}

function verifyCallerDeclarationMap(workspace) {
  const mapPath = path.join(workspace.root, ARTIFACTS.callerDeclarationMap);
  const declarationMap = readJsonFile(mapPath, 'decl_file_map');
  const sourcePaths = [
    path.join(workspace.root, 'entry/src/main/ets/pages/Index.ets'),
    path.join(workspace.root, 'entry/src/main/ets/entryability/EntryAbility.ets')
  ];
  const verified = {};
  for (const expectedSource of sourcePaths) {
    const key = Object.keys(declarationMap).find(candidate =>
      canonicalPath(candidate) === canonicalPath(expectedSource));
    assert.ok(key, `decl_file_map lacks caller source ${expectedSource}`);
    const entry = declarationMap[key];
    assert.strictEqual(canonicalPath(entry.sourceFilePath), canonicalPath(expectedSource));
    assert.strictEqual(entry.sourceFileLastModified, fs.statSync(expectedSource).mtimeMs);
    const declaration = readNonemptyFile(entry.delFilePath, 'decl_file_map');
    const bridge = readNonemptyFile(entry.glueCodeFilePath, 'decl_file_map');
    assert.ok(declaration.length > 0 && bridge.length > 0);
    assert.strictEqual(entry.declLastModified, fs.statSync(entry.delFilePath).mtimeMs);
    assert.strictEqual(entry.glueCodeLastModified, fs.statSync(entry.glueCodeFilePath).mtimeMs);
    verified[path.basename(expectedSource)] = entry;
  }
  const callerEntry = verified['Index.ets'];
  assert.strictEqual(canonicalPath(callerEntry.glueCodeFilePath),
    canonicalPath(path.join(workspace.root, ARTIFACTS.bridgeSource)));
  return { mapPath, entries: verified };
}

function verifyBridgeSource(workspace) {
  const bridgePath = path.join(workspace.root, ARTIFACTS.bridgeSource);
  const bridge = readNonemptyFile(bridgePath, 'bridge');
  assertFragments(bridge, [
    'ProfileCard as DynamicProfileCard',
    'AliasedProfileCard as SecondaryDynamicCard',
    'AlphaSharedCard',
    'BetaSharedCard',
    'UserProfile as StaticUserProfile',
    'makeProfile',
    'AlphaToken',
    'BetaToken',
    `Panda.getClass('Lentry/src/main/ets/pages/Index/ETSGLOBAL;')`
  ], 'multifile static caller bridge');
  return bridgePath;
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size < 16) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or small ${filePath}`, { filePath });
  }
  const content = fs.readFileSync(filePath);
  assert.strictEqual(content.subarray(0, 5).toString('ascii'), 'PANDA', `${filePath} has no ABC magic`);
  return content;
}

function disassemble(workspace, toolchain, kind) {
  const isStatic = kind === 'static';
  const abcPath = path.join(workspace.root, isStatic ? ARTIFACTS.repositoryStaticAbc : ARTIFACTS.dynamicAbc);
  const outputPath = path.join(workspace.root,
    isStatic ? ARTIFACTS.staticDisassembly : ARTIFACTS.dynamicDisassembly);
  assertBinaryArtifact(abcPath, 'ABC');
  const executable = isStatic ? toolchain.staticDisassembler : toolchain.dynamicDisassembler;
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.status !== 0) {
    fail('disassembly', 'environment', 'ARK_DISASM_FAILED',
      `${kind} ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  const text = readNonemptyFile(outputPath, 'disassembly');
  assertFragments(text, isStatic ? STATIC_IDENTITY_FRAGMENTS : DYNAMIC_IDENTITY_FRAGMENTS,
    `${kind} multifile ABC identity`);
  const bindings = isStatic ? assertStaticCallerBindings(text) : assertDynamicIndirectExports(text);
  return { abcPath, outputPath, bytes: fs.statSync(abcPath).size, bindings };
}

async function runFullChain(options = {}) {
  const definition = {
    name: 'multifile-static-consumer-uses-current-declarations-and-abc',
    group: 'compile',
    direction: DIRECTION,
    kind: 'full-chain',
    coverage: 'multifile declgen, export aliases, declaration maps, static consumption and both ABC backends'
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const tools = toolchainReport(toolchain);
    context.passStage('toolchain', { tools });
    const project = materializeProject(workspace, toolchain.sdkRoot);
    validateProjectSources(require('./project_files').createProjectFiles(toolchain.sdkRoot));
    context.passStage('materialize', project);
    const result = executeHvigor(workspace, toolchain, options);
    const failures = [];
    const generatedEvidence = {};
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
    attempt('GenerateDeclaration', () => verifyDeclarationDiagnostics(result));
    attempt('Hvigor', () => verifyHvigorExit(result));
    const generated = attempt('DeclfileProductor.runDeclgen', () => generateRepositoryDeclarations(workspace));
    let projection;
    if (generated) {
      tools.push({
        name: 'declgen',
        path: path.join(COMPILER_ROOT, 'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
        version: 'DeclfileProductor.runDeclgen'
      });
      generatedEvidence.declarations = generated.keys;
      generatedEvidence.origins = generated.graphEvidence.origins;
      projection = attempt('repository-projection', () => prepareRepositoryProjection(workspace, generated));
    }
    if (projection) {
      attempt('repository-static-compile', () =>
        executeRepositoryStaticCompile(workspace, toolchain, projection, options));
      generatedEvidence.arktsconfig = attempt('arktsconfig', () => verifyCallerConfig(workspace, generated));
    }
    generatedEvidence.declFileMap = attempt('decl_file_map', () => verifyCallerDeclarationMap(workspace));
    generatedEvidence.bridgePath = attempt('bridge', () => verifyBridgeSource(workspace));
    generatedEvidence.static = attempt('static-abc', () => disassemble(workspace, toolchain, 'static'));
    generatedEvidence.dynamic = attempt('dynamic-abc', () => disassemble(workspace, toolchain, 'dynamic'));
    const details = {
      tools,
      generated: generatedEvidence,
      diagnostics: diagnosticsFromLog(result.output),
      command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()],
      projectRoot: workspace.root
    };
    workspace.write(ARTIFACTS.consumptionEvidence, JSON.stringify(details, null, 2));
    if (failures.length > 0) {
      const first = failures[0];
      const failure = first instanceof StageFailure ? first : new StageFailure(
        first.stage || 'full-chain', first.category || 'implementation', first.code || 'ASSERTION', first.message);
      failure.details = { ...failure.details, ...details };
      failure.diagnostics = details.diagnostics;
      throw failure;
    }
    return { toolchain: tools, generated: generatedEvidence, diagnostics: details.diagnostics, command: details.command };
  }, options);
}

module.exports = {
  assertBinaryArtifact,
  disassemble,
  executeHvigor,
  executeRepositoryStaticCompile,
  generateRepositoryDeclarations,
  hvigorArguments,
  prepareRepositoryProjection,
  runFullChain,
  toolchainReport,
  validateToolchain,
  verifyCallerConfig,
  verifyCallerDeclarationMap,
  verifyDeclarationDiagnostics,
  verifyHvigorExit
};
