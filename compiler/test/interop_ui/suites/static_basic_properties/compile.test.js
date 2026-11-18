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
  COMPILER_ROOT,
  StageFailure,
  assert,
  assertFragments,
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
  hvigorEnvironment
} = require('../static_calls_dynamic_basic/compile.test');
const {
  artifactContracts,
  diagnosticRules,
  projectContract
} = require('./expected_cases');
const { callerLocations } = require('./project_files');
const { moduleIdentity } = require('./source_cases');
const { verifyDeclarationContract } = require('./unit.test');

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

function toolchainReport(toolchain) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
  requireExecutable(toolchain.dynamicDisassembler, 'INTEROP_UI_DYNAMIC_ARK_DISASM');
  const openHarmonyRoot = path.join(toolchain.sdkRoot, 'default/openharmony');
  const sdkPackagePath = path.join(openHarmonyRoot, 'ets/oh-uni-package.json');
  const driver = path.join(openHarmonyRoot, 'ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(sdkPackagePath, 'INTEROP_UI_SDK ets package');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const nodeResult = runProcess(toolchain.node, ['--version']);
  assert.strictEqual(nodeResult.status, 0, `node --version failed: ${nodeResult.output}`);
  const hvigorPackagePath = path.resolve(path.dirname(toolchain.hvigor), '../hvigor/package.json');
  const hvigorPackage = readJsonFile(hvigorPackagePath, 'toolchain');
  const sdkPackage = readJsonFile(sdkPackagePath, 'toolchain');
  return {
    driver,
    tools: [
      { name: 'node', path: toolchain.node, version: versionText(nodeResult) },
      { name: 'hvigor', path: toolchain.hvigor, version: hvigorPackage.version },
      { name: 'sdk', path: toolchain.sdkRoot, version: sdkPackage.version },
      { name: 'static-driver', path: driver, version: sdkPackage.version },
      { name: 'static-ark-disasm', path: toolchain.staticDisassembler, version: 'SDK-matched' },
      { name: 'dynamic-ark-disasm', path: toolchain.dynamicDisassembler, version: 'SDK-matched' },
      {
        name: 'declgen',
        path: path.join(COMPILER_ROOT, 'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
        version: 'DeclfileProductor.runDeclgen'
      }
    ]
  };
}

function hvigorArguments() {
  return [
    '--mode', 'module',
    '-p', `product=${projectContract.product}`,
    '-p', `module=${projectContract.module}@${projectContract.target}`,
    '-p', `buildMode=${projectContract.buildMode}`,
    ...projectContract.buildTasks,
    '--no-daemon'
  ];
}

function executeHvigor(workspace, toolchain, options = {}) {
  const environment = options.env || {};
  const result = runProcess(toolchain.node, [toolchain.hvigor, ...hvigorArguments()], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, environment),
    timeout: Number(environment.INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.buildLog, result.output);
  workspace.write('evidence/hvigor-command.txt',
    [toolchain.node, toolchain.hvigor, ...hvigorArguments()].join(' ') + '\n');
  return result;
}

function declarationPaths(workspace, repository = false) {
  const root = workspace.root;
  const declRoot = path.join(root, artifactContracts.repositoryDeclgenRoot);
  return {
    componentDeclaration: repository ? path.join(declRoot, 'src/main/ets/PropertyCard.d.ets') :
      path.join(root, artifactContracts.componentDeclaration),
    indexDeclaration: repository ? path.join(declRoot, 'Index.d.ets') : path.join(root, artifactContracts.indexDeclaration),
    declarationMap: path.join(root,
      repository ? artifactContracts.repositoryDeclarationMap : artifactContracts.declarationMap),
    configPath: path.join(root, repository ?
      `${artifactContracts.repositoryCache}/entry/arktsconfig.json` : artifactContracts.callerConfig),
    projectionPath: path.join(root, repository ? artifactContracts.repositoryProjection : artifactContracts.projectionConfig),
    staticAbc: path.join(root, repository ? artifactContracts.repositoryStaticAbc : artifactContracts.staticAbc),
    staticDisassembly: path.join(root,
      repository ? artifactContracts.repositoryStaticDisassembly : artifactContracts.staticDisassembly),
    outputRoot: declRoot
  };
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function prepareRepositoryProjection(workspace) {
  const paths = declarationPaths(workspace, true);
  const declarationMap = readJsonFile(path.join(workspace.root, artifactContracts.declarationMap), 'declgenV2');
  const componentEntry = declarationMap.files['src/main/ets/PropertyCard'];
  const indexEntry = declarationMap.files.Index;
  assert.ok(componentEntry, 'SDK declaration map has no PropertyCard source identity');
  assert.ok(indexEntry, 'SDK declaration map has no Index source identity');
  componentEntry.declPath = paths.componentDeclaration;
  indexEntry.declPath = paths.indexDeclaration;
  workspace.write(artifactContracts.repositoryDeclarationMap, JSON.stringify(declarationMap, null, 2));
  const projection = readJsonFile(path.join(workspace.root, artifactContracts.projectionConfig), 'arktsconfig');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== 'dynamic_component') {
        continue;
      }
      module.declgenV2OutPath = paths.outputRoot;
      module.declFilesPath = paths.declarationMap;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'both projection dependency lists must consume repository declarations');
  projection.cachePath = path.join(workspace.root, artifactContracts.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, artifactContracts.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, artifactContracts.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  workspace.write(artifactContracts.repositoryProjection, JSON.stringify(projection, null, 2));
  return paths;
}

function verifyDeclarationArtifacts(workspace, testCase) {
  const paths = declarationPaths(workspace, true);
  const generated = {
    componentDeclaration: paths.componentDeclaration,
    indexDeclaration: paths.indexDeclaration,
    outputRoot: paths.outputRoot
  };
  verifyDeclarationContract(generated, testCase);
  const declarationMap = readJsonFile(paths.declarationMap, 'declgenV2');
  const identity = moduleIdentity(testCase);
  assert.strictEqual(declarationMap.packageName, identity.packageName);
  const componentEntry = declarationMap.files['src/main/ets/PropertyCard'];
  const indexEntry = declarationMap.files.Index;
  assert.strictEqual(canonicalPath(componentEntry.declPath), canonicalPath(paths.componentDeclaration));
  assert.strictEqual(canonicalPath(indexEntry.declPath), canonicalPath(paths.indexDeclaration));
  assert.strictEqual(componentEntry.ohmUrl, '@normalized:N&&&dynamic_component/src/main/ets/PropertyCard&');
  assert.strictEqual(indexEntry.ohmUrl, '@normalized:N&&&dynamic_component/Index&');
  return paths;
}

function sourceDiagnostics(log) {
  const diagnostics = [];
  const lines = log.replace(ANSI_PATTERN, '').split(/\r?\n/);
  let stage = 'Hvigor';
  let pending;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('generate Declaration')) {
      stage = 'GenerateDeclaration';
    } else if (line.includes('just build')) {
      stage = 'CompileStaticArkTS';
    }
    const severity = line.match(/\b(Fatal error|Semantic error)\s+((?:F|ESE)\d{4}):\s*(.*)$/);
    if (severity) {
      const location = line.match(/\[([^\]]+\.ets)\/?:(\d+):(\d+)\]/);
      diagnostics.push({
        stage,
        code: severity[2],
        message: severity[3].trim(),
        file: location ? location[1] : undefined,
        line: location ? Number(location[2]) : undefined,
        column: location ? Number(location[3]) : undefined,
        logLine: index + 1
      });
      pending = undefined;
      continue;
    }
    const detailed = line.match(/^\s*\d+\s+ERROR:\s+(?:Fatal error|Semantic error)\s+((?:F|ESE)\d{4})\s*$/);
    if (detailed) {
      pending = { stage, code: detailed[1], logLine: index + 1 };
      continue;
    }
    if (pending && line.startsWith('Error Message:')) {
      const content = line.slice('Error Message:'.length).trim();
      const location = content.match(/\sAt File:\s+(.+\.ets):(\d+):(\d+)\s*$/);
      diagnostics.push({
        ...pending,
        message: location ? content.slice(0, location.index).trim() : content,
        file: location ? location[1] : undefined,
        line: location ? Number(location[2]) : undefined,
        column: location ? Number(location[3]) : undefined
      });
      pending = undefined;
    }
  }
  return diagnostics;
}

function verifyGenerateDeclaration(result) {
  const diagnostics = diagnosticsFromLog(result.output);
  if (diagnostics.length === 0) {
    return diagnostics;
  }
  const first = classifyFirstDiagnostic(diagnostics);
  throw new StageFailure(first.stage, first.category, first.code, first.message, {
    diagnostics,
    classification: first.classification,
    logPath: artifactContracts.buildLog
  });
}

function verifyHvigorExit(result) {
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : normalizeText(result.output).split('\n').slice(-12).join('\n');
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${detail}`, { status: result.status, signal: result.signal });
  }
}

function executeRepositoryStaticCompile(workspace, toolchain, paths, options = {}) {
  const driver = path.join(toolchain.sdkRoot,
    'default/openharmony/ets/static/build-tools/driver/build-system/dist/entry.js');
  requireFile(driver, 'INTEROP_UI_SDK static driver');
  const result = runProcess(toolchain.node, [driver, paths.projectionPath], {
    cwd: workspace.root,
    env: hvigorEnvironment(toolchain, workspace, options.env || {}),
    timeout: Number((options.env || {}).INTEROP_UI_BUILD_TIMEOUT_MS || 180000)
  });
  workspace.write(artifactContracts.repositoryBuildLog, result.output);
  return {
    ...result,
    diagnostics: sourceDiagnostics(result.output)
  };
}

function expectedDiagnosticLine(testCase) {
  const expectation = testCase.expectedStaticDiagnostic;
  const locations = callerLocations(testCase);
  return locations.argumentLines[expectation.sourceProperty];
}

function verifyExpectedStaticDiagnostic(testCase, result) {
  const expectation = testCase.expectedStaticDiagnostic;
  const candidates = result.diagnostics.filter(diagnostic => {
    const message = diagnostic.message.toLowerCase();
    return expectation.messageFragments.every(fragment => message.includes(fragment.toLowerCase()));
  });
  if (candidates.length === 0) {
    fail('repository-static-compile', 'implementation', 'EXPECTED_TYPE_DIAGNOSTIC_MISSING',
      `${testCase.id}: no diagnostic contains ${expectation.messageFragments.join(', ')}; ` +
      `actual=${JSON.stringify(result.diagnostics)}`, { diagnostics: result.diagnostics, status: result.status });
  }
  const expectedLine = expectedDiagnosticLine(testCase);
  const diagnostic = candidates.find(item => item.line === expectedLine);
  if (!diagnostic) {
    fail('repository-static-compile', 'implementation', 'DIAGNOSTIC_LINE_MISMATCH',
      `${testCase.id}: expected caller line ${expectedLine}, actual=${JSON.stringify(candidates)}`, {
        expectedLine,
        candidates
      });
  }
  assert.ok(diagnostic.file.endsWith('entry/src/main/ets/pages/Index.ets'),
    `${testCase.id}: diagnostic file ${diagnostic.file}`);
  assert.ok(diagnostic.column > 0, `${testCase.id}: diagnostic column must be present`);
  assert.ok(diagnosticRules.permittedCodePrefixes.some(prefix => diagnostic.code.startsWith(prefix)),
    `${testCase.id}: unexpected diagnostic code ${diagnostic.code}`);
  assert.notStrictEqual(result.status, 0, `${testCase.id}: invalid caller must make static compilation fail`);
  return diagnostic;
}

function verifyRepositoryCompile(testCase, result) {
  if (testCase.expectedStaticDiagnostic) {
    return verifyExpectedStaticDiagnostic(testCase, result);
  }
  if (result.error || result.status !== 0 || result.diagnostics.length > 0) {
    fail('repository-static-compile', 'implementation', result.diagnostics[0]?.code || 'STATIC_COMPILE_FAILED',
      `${testCase.id}: valid static consumer failed: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`, {
        status: result.status,
        diagnostics: result.diagnostics
      });
  }
  return undefined;
}

function verifyCallerConfig(workspace, testCase) {
  const paths = declarationPaths(workspace, true);
  const config = readJsonFile(paths.configPath, 'arktsconfig');
  const identity = moduleIdentity(testCase);
  const options = config.compilerOptions;
  assert.ok(options, 'arktsconfig compilerOptions must exist');
  assert.strictEqual(options.package, 'entry');
  const dependencies = options.dependencies || {};
  const component = dependencies[identity.componentModule];
  const index = dependencies[identity.indexModule];
  const packageEntry = dependencies[identity.packageName];
  for (const [name, entry] of Object.entries({ component, index, packageEntry })) {
    assert.ok(entry, `arktsconfig dependency ${name} must exist`);
    assert.strictEqual(entry.language, 'js', `${name} must retain dynamic language identity`);
  }
  assert.strictEqual(canonicalPath(component.path), canonicalPath(paths.componentDeclaration));
  assert.strictEqual(canonicalPath(index.path), canonicalPath(paths.indexDeclaration));
  assert.strictEqual(canonicalPath(packageEntry.path), canonicalPath(paths.indexDeclaration));
  assert.strictEqual(canonicalPath(component.sourceFilePath),
    canonicalPath(path.join(workspace.root, 'dynamic_component/src/main/ets/PropertyCard.ets')));
  assert.strictEqual(canonicalPath(index.sourceFilePath),
    canonicalPath(path.join(workspace.root, 'dynamic_component/Index.ets')));
  assert.strictEqual(component.ohmUrl, identity.componentOhmUrl);
  assert.strictEqual(index.ohmUrl, identity.indexOhmUrl);
  assert.strictEqual(packageEntry.ohmUrl, identity.indexOhmUrl);
  return { configPath: paths.configPath, dependencies: [component, index, packageEntry] };
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or empty ${filePath}`, { filePath });
  }
  const content = fs.readFileSync(filePath);
  assert.strictEqual(content.subarray(0, 5).toString('ascii'), 'PANDA', `${filePath}: wrong ABC header`);
  return content;
}

function disassemble(workspace, executable, abcPath, outputPath, required, stage) {
  assertBinaryArtifact(abcPath, stage);
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.status !== 0) {
    fail('disassembly', 'environment', 'ARK_DISASM_FAILED',
      `${stage} ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  const text = readNonemptyFile(outputPath, 'disassembly');
  assertFragments(text, required, `${stage} identity`);
  return { abcPath, outputPath };
}

function primaryFailure(failures) {
  return failures.find(error => !(error instanceof StageFailure) || error.category !== 'existing') || failures[0];
}

module.exports = {
  assertBinaryArtifact,
  declarationPaths,
  disassemble,
  executeHvigor,
  executeRepositoryStaticCompile,
  expectedDiagnosticLine,
  hvigorArguments,
  prepareRepositoryProjection,
  primaryFailure,
  sourceDiagnostics,
  toolchainReport,
  verifyCallerConfig,
  verifyDeclarationArtifacts,
  verifyExpectedStaticDiagnostic,
  verifyGenerateDeclaration,
  verifyHvigorExit,
  verifyRepositoryCompile
};
