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
const zlib = require('zlib');
const {
  DIRECTION,
  COMPILER_ROOT,
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
} = require('./harness');
const { moduleIdentity } = require('./source_cases');
const {
  artifactContracts,
  hapContracts,
  knownGenerateDeclarationFailure,
  realDeclaration
} = require('./expected_cases');
const { materializeProject, projectContract } = require('./project_files');
const { generateRepositoryDeclarations } = require('./declaration.test');

function resolveToolchain(env = process.env) {
  const sdkRoot = env.INTEROP_UI_SDK || '';
  const openHarmonyRoot = path.join(sdkRoot, 'default/openharmony');
  return {
    node: env.INTEROP_UI_NODE || process.execPath,
    hvigor: env.INTEROP_UI_HVIGOR || '',
    sdkRoot,
    javaHome: env.INTEROP_UI_JAVA_HOME || env.JAVA_HOME || '',
    staticDisassembler: env.INTEROP_UI_STATIC_ARK_DISASM || path.join(
      openHarmonyRoot, 'ets/static/build-tools/ets2panda/bin/ark_disasm'),
    dynamicDisassembler: env.INTEROP_UI_DYNAMIC_ARK_DISASM || path.join(
      openHarmonyRoot, 'toolchains/ark_disasm')
  };
}

function validateToolchain(toolchain, needsDisassemblers = true) {
  requireExecutable(toolchain.node, 'INTEROP_UI_NODE');
  requireFile(toolchain.hvigor, 'INTEROP_UI_HVIGOR');
  requireDirectory(toolchain.sdkRoot, 'INTEROP_UI_SDK');
  const sdkPackage = path.join(toolchain.sdkRoot, 'default/openharmony/ets/oh-uni-package.json');
  requireFile(sdkPackage, 'INTEROP_UI_SDK ets package');
  if (needsDisassemblers) {
    requireExecutable(toolchain.staticDisassembler, 'INTEROP_UI_STATIC_ARK_DISASM');
    requireExecutable(toolchain.dynamicDisassembler, 'INTEROP_UI_DYNAMIC_ARK_DISASM');
  }
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

function hvigorEnvironment(toolchain, workspace, environment = {}) {
  const env = { ...environment };
  const isolated = {
    HOME: path.join(workspace.root, 'home'),
    USERPROFILE: path.join(workspace.root, 'home'),
    HVIGOR_USER_HOME: path.join(workspace.root, 'hvigor-user'),
    XDG_CACHE_HOME: path.join(workspace.root, 'cache'),
    WORKSPACE_DIR: path.join(workspace.root, 'hvigor-workspace')
  };
  for (const directory of Object.values(isolated)) {
    fs.mkdirSync(directory, { recursive: true });
  }
  Object.assign(env, isolated);
  const pathEntries = [path.dirname(toolchain.node)];
  if (toolchain.javaHome) {
    env.JAVA_HOME = toolchain.javaHome;
    pathEntries.push(path.join(toolchain.javaHome, 'bin'));
  }
  pathEntries.push(env.PATH || '');
  env.PATH = pathEntries.join(path.delimiter);
  env.DEVECO_SDK_HOME = toolchain.sdkRoot;
  env.OHOS_SDK_HOME = toolchain.sdkRoot;
  return env;
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

function stripAnsi(text) {
  return text.replace(/\u001b\[[0-9;]*m/g, '');
}

function diagnosticsFromLog(log) {
  const diagnostics = [];
  let stage = 'Hvigor';
  const lines = stripAnsi(log).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('generate Declaration')) {
      stage = 'GenerateDeclaration';
    } else if (line.includes('just build')) {
      stage = 'CompileStaticArkTS';
    }
    const match = line.match(/\b(F\d{4}|ESE\d{4})\b/);
    if (match && /Fatal error|Semantic error/.test(line)) {
      diagnostics.push({
        stage,
        code: match[1],
        message: line.trim(),
        line: index + 1
      });
    } else if (/\[ERROR\].*ERROR Code:/.test(line)) {
      diagnostics.push({ stage, code: 'DRIVER_ERROR', message: line.trim(), line: index + 1 });
    }
    const task = line.match(/Finished\s+:[^@]+@([A-Za-z0-9_-]+)/);
    if (task) {
      stage = task[1];
    }
  }
  return diagnostics;
}

function classifyFirstDiagnostic(diagnostics) {
  const first = diagnostics[0];
  if (!first) {
    return undefined;
  }
  const codes = diagnostics.map(item => item.code);
  const known = knownGenerateDeclarationFailure;
  const hasKnownSequence = known.sequence.every(code => codes.includes(code));
  const hasKnownText = known.requiredText.every(fragment =>
    diagnostics.some(item => item.message.includes(fragment)));
  const isKnown = first.stage === known.stage && first.code === known.code && hasKnownSequence && hasKnownText;
  return {
    ...first,
    category: isKnown ? 'existing' : 'implementation',
    classification: isKnown ? known.classification : 'unclassified compiler or project regression'
  };
}

function verifyDeclarationDiagnostics(result) {
  const diagnostics = diagnosticsFromLog(result.output);
  const first = classifyFirstDiagnostic(diagnostics);
  if (first) {
    throw new StageFailure(first.stage, first.category, first.code, first.message, {
      diagnostics,
      classification: first.classification,
      logPath: artifactContracts.buildLog
    });
  }
  return diagnostics;
}

function verifyHvigorExit(result) {
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : normalizeText(result.output).split('\n').slice(-12).join('\n');
    fail('Hvigor', 'implementation', 'HVIGOR_BUILD_FAILED',
      `Hvigor exited ${result.status}: ${detail}`, { status: result.status, signal: result.signal });
  }
}

function assertBinaryArtifact(filePath, stage) {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile() || fs.statSync(filePath).size === 0) {
    fail(stage, 'implementation', 'MISSING_BINARY_ARTIFACT', `missing or empty ${filePath}`, { filePath });
  }
  return fs.readFileSync(filePath);
}

function canonicalPath(filePath) {
  return fs.existsSync(filePath) ? fs.realpathSync(filePath) : path.resolve(filePath);
}

function declarationPaths(workspace, repository = false) {
  const root = workspace.root;
  const declRoot = path.join(root, artifactContracts.repositoryDeclgenRoot);
  const paths = {
    componentDeclaration: repository ? path.join(declRoot, 'src/main/ets/DynamicCounter.d.ets') :
      path.join(root, artifactContracts.componentDeclaration),
    indexDeclaration: repository ? path.join(declRoot, 'Index.d.ets') : path.join(root, artifactContracts.indexDeclaration),
    declarationMap: path.join(root, repository ? artifactContracts.repositoryDeclarationMap : artifactContracts.declarationMap),
    configPath: repository ? path.join(root, artifactContracts.repositoryCache, 'entry/arktsconfig.json') :
      path.join(root, artifactContracts.callerConfig),
    staticAbc: path.join(root, repository ? artifactContracts.repositoryStaticAbc : artifactContracts.staticAbc),
    staticDisassembly: path.join(root,
      repository ? artifactContracts.repositoryStaticDisassembly : artifactContracts.staticDisassembly)
  };
  if (repository) {
    paths.projectionPath = path.join(root, artifactContracts.repositoryProjection);
  }
  return paths;
}

function prepareRepositoryProjection(workspace) {
  const paths = declarationPaths(workspace, true);
  const declarationMap = readJsonFile(path.join(workspace.root, artifactContracts.declarationMap), 'declgenV2');
  declarationMap.files['src/main/ets/DynamicCounter'].declPath = paths.componentDeclaration;
  declarationMap.files.Index.declPath = paths.indexDeclaration;
  workspace.write(artifactContracts.repositoryDeclarationMap, JSON.stringify(declarationMap, null, 2));
  const projection = readJsonFile(path.join(workspace.root, artifactContracts.projectionConfig), 'arktsconfig');
  let updated = 0;
  for (const key of ['dependentModuleList', 'dependencyModuleList']) {
    for (const module of projection[key] || []) {
      if (module.packageName !== moduleIdentity.packageName) {
        continue;
      }
      module.declgenV2OutPath = path.join(workspace.root, artifactContracts.repositoryDeclgenRoot);
      module.declFilesPath = paths.declarationMap;
      updated += 1;
    }
  }
  assert.strictEqual(updated, 2, 'projection must map both dependency lists to repository declarations');
  projection.cachePath = path.join(workspace.root, artifactContracts.repositoryCache);
  projection.loaderOutPath = path.join(workspace.root, artifactContracts.repositoryLoaderOut);
  projection.aceModuleBuild = path.join(workspace.root, artifactContracts.repositoryDynamicLoaderOut);
  projection.es2pandaMode = 'simultaneous';
  workspace.write(artifactContracts.repositoryProjection, JSON.stringify(projection, null, 2));
  return paths;
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
  const diagnostics = diagnosticsFromLog(result.output);
  if (result.error || result.status !== 0 || diagnostics.length > 0) {
    fail('repository-static-compile', 'implementation', diagnostics[0]?.code || 'STATIC_COMPILE_FAILED',
      `repository declaration consumption failed: ${normalizeText(result.output).split('\n').slice(-16).join('\n')}`,
      { status: result.status, diagnostics });
  }
  return result;
}

function verifyDeclarationArtifacts(workspace, repository = false) {
  const paths = declarationPaths(workspace, repository);
  const componentPath = paths.componentDeclaration;
  const indexPath = paths.indexDeclaration;
  const component = readNonemptyFile(componentPath, 'declgenV2');
  const index = readNonemptyFile(indexPath, 'declgenV2');
  assertFragments(component, realDeclaration.component.required, 'repository declgenV2 component');
  assertForbidden(component, realDeclaration.component.forbidden, 'repository declgenV2 component');
  assertFragments(index, realDeclaration.index.required, 'repository declgenV2 index');
  assertForbidden(index, realDeclaration.index.forbidden, 'repository declgenV2 index');
  const declarationMapPath = paths.declarationMap;
  const declarationMap = readJsonFile(declarationMapPath, 'declgenV2');
  assert.strictEqual(declarationMap.packageName, moduleIdentity.packageName);
  const componentEntry = declarationMap.files['src/main/ets/DynamicCounter'];
  const indexEntry = declarationMap.files.Index;
  assert.ok(componentEntry, 'decl-fileInfo.json must contain the component source identity');
  assert.ok(indexEntry, 'decl-fileInfo.json must contain the barrel source identity');
  assert.strictEqual(canonicalPath(componentEntry.declPath), canonicalPath(componentPath));
  assert.strictEqual(canonicalPath(indexEntry.declPath), canonicalPath(indexPath));
  assert.strictEqual(componentEntry.ohmUrl, '@normalized:N&&&dynamic_component/src/main/ets/DynamicCounter&');
  assert.strictEqual(indexEntry.ohmUrl, '@normalized:N&&&dynamic_component/Index&');
  return { componentPath, indexPath, declarationMapPath };
}

function verifyCallerConfig(workspace, repository = false) {
  const paths = declarationPaths(workspace, repository);
  const configPath = paths.configPath;
  const config = readJsonFile(configPath, 'arktsconfig');
  const options = config.compilerOptions;
  assert.ok(options, 'arktsconfig compilerOptions must exist');
  assert.strictEqual(options.package, 'entry');
  const dependencies = options.dependencies || {};
  const component = dependencies[moduleIdentity.componentModule];
  const index = dependencies[moduleIdentity.indexModule];
  const packageEntry = dependencies[moduleIdentity.packageName];
  for (const [name, entry] of Object.entries({ component, index, packageEntry })) {
    assert.ok(entry, `arktsconfig dependency ${name} must exist`);
    assert.strictEqual(entry.language, 'js', `${name} must retain dynamic language identity`);
  }
  const expectedComponentPath = paths.componentDeclaration;
  const expectedIndexPath = paths.indexDeclaration;
  assert.strictEqual(canonicalPath(component.path), canonicalPath(expectedComponentPath));
  assert.strictEqual(canonicalPath(index.path), canonicalPath(expectedIndexPath));
  assert.strictEqual(canonicalPath(packageEntry.path), canonicalPath(expectedIndexPath));
  assert.strictEqual(canonicalPath(component.sourceFilePath),
    canonicalPath(path.join(workspace.root, 'dynamic_component/src/main/ets/DynamicCounter.ets')));
  assert.strictEqual(canonicalPath(index.sourceFilePath),
    canonicalPath(path.join(workspace.root, 'dynamic_component/Index.ets')));
  assert.strictEqual(component.ohmUrl, moduleIdentity.componentOhmUrl);
  assert.strictEqual(index.ohmUrl, moduleIdentity.indexOhmUrl);
  assert.strictEqual(packageEntry.ohmUrl, moduleIdentity.indexOhmUrl);
  return { configPath, dependencies: [component, index, packageEntry] };
}

function verifyBridgeSource(workspace) {
  const bridgePath = path.join(workspace.root, artifactContracts.bridgeSource);
  const bridge = readNonemptyFile(bridgePath, 'bridge');
  assertFragments(bridge, [
    moduleIdentity.bridgeImport,
    `globalThis as any`,
    `Panda.getClass('Lentry/src/main/ets/pages/Index/ETSGLOBAL;')`
  ], 'static caller bridge');
  return bridgePath;
}

function disassemble(workspace, toolchain, kind, paths = declarationPaths(workspace, kind === 'static')) {
  const isStatic = kind === 'static';
  const abcPath = isStatic ? paths.staticAbc : path.join(workspace.root, artifactContracts.dynamicAbc);
  const outputPath = isStatic ? paths.staticDisassembly : path.join(workspace.root, artifactContracts.dynamicDisassembly);
  assertBinaryArtifact(abcPath, 'ABC');
  const executable = isStatic ? toolchain.staticDisassembler : toolchain.dynamicDisassembler;
  const result = runProcess(executable, [abcPath, outputPath], { cwd: workspace.root });
  if (result.status !== 0) {
    fail('disassembly', 'environment', 'ARK_DISASM_FAILED',
      `${kind} ark_disasm exited ${result.status}: ${result.output}`, { abcPath, executable });
  }
  const text = readNonemptyFile(outputPath, 'disassembly');
  if (isStatic) {
    assertFragments(text, [
      moduleIdentity.componentModule,
      moduleIdentity.componentOhmUrl,
      moduleIdentity.callerRecord,
      'CompatibleComponentInfo'
    ], 'static ABC identity');
  } else {
    assertFragments(text, [
      moduleIdentity.dynamicRecord,
      moduleIdentity.dynamicExport,
      moduleIdentity.componentOhmUrl,
      'initialRender'
    ], 'dynamic ABC identity');
  }
  return { abcPath, outputPath };
}

function findEndOfCentralDirectory(buffer) {
  const minimum = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }
  throw new Error('ZIP end of central directory not found');
}

const crcTable = Array.from({ length: 256 }, (unused, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function readZipEntries(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let index = 0; index < count; index += 1) {
    assert.strictEqual(buffer.readUInt32LE(offset), 0x02014b50, 'invalid ZIP central header');
    const method = buffer.readUInt16LE(offset + 10);
    const expectedCrc = buffer.readUInt32LE(offset + 16);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + nameLength).toString('utf8');
    assert.strictEqual(buffer.readUInt32LE(localOffset), 0x04034b50, `invalid local header: ${name}`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let content;
    if (method === 0) {
      content = compressed;
    } else if (method === 8) {
      content = zlib.inflateRawSync(compressed);
    } else {
      throw new Error(`unsupported ZIP compression ${method}: ${name}`);
    }
    assert.strictEqual(content.length, uncompressedSize, `ZIP size mismatch: ${name}`);
    assert.strictEqual(crc32(content), expectedCrc, `ZIP CRC mismatch: ${name}`);
    entries.set(name, content);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

function verifyMixedHap(workspace) {
  const hapPath = path.join(workspace.root, artifactContracts.unsignedHap);
  const entries = readZipEntries(assertBinaryArtifact(hapPath, 'mixed-hap'));
  const packagedStatic = assertBinaryArtifact(
    path.join(workspace.root, artifactContracts.packagedStaticAbc), 'mixed-hap');
  const packagedDynamic = assertBinaryArtifact(
    path.join(workspace.root, artifactContracts.packagedDynamicAbc), 'mixed-hap');
  assert.deepStrictEqual(entries.get('ets/modules_static.abc'), packagedStatic);
  assert.deepStrictEqual(entries.get('ets/modules.abc'), packagedDynamic);
  for (const name of hapContracts.entries) {
    const content = entries.get(name);
    assert.ok(content && content.length > hapContracts.commonHeaderMinimumBytes, `HAP entry missing: ${name}`);
    assert.strictEqual(content.subarray(0, hapContracts.abcMagic.length).toString('ascii'), hapContracts.abcMagic);
  }
  const moduleJson = entries.get('module.json');
  assert.ok(moduleJson, 'HAP must contain module.json');
  const moduleProfile = JSON.parse(moduleJson.toString('utf8'));
  assert.strictEqual(moduleProfile.module.name, hapContracts.moduleName);
  assert.strictEqual(moduleProfile.module.type, hapContracts.packageType);
  return { hapPath, entries: Array.from(entries.keys()).sort() };
}

async function runFullChain(group, options = {}) {
  const isProject = group === 'project';
  const definition = {
    name: isProject ? 'mixed-project-packages-static-and-dynamic-abc' :
      'static-compiler-consumes-current-declgen-v2',
    group,
    direction: DIRECTION,
    kind: 'full-chain',
    coverage: isProject ? 'fresh Hvigor generation, static consumption, bridge, ABC and mixed HAP' :
      'fresh Hvigor generation through static compilation and module identity'
  };
  return executeCase(definition, async context => {
    const workspace = context.workspace;
    const toolchain = resolveToolchain(options.env || process.env);
    const tools = toolchainReport(toolchain);
    context.passStage('toolchain', { tools });
    const project = materializeProject(workspace, toolchain.sdkRoot);
    context.passStage('materialize', project);
    const result = executeHvigor(workspace, toolchain, options);
    const failures = [];
    const generated = {};
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
    const declarations = attempt('DeclfileProductor.runDeclgen', () =>
      generateRepositoryDeclarations(workspace, artifactContracts.repositoryDeclgenRoot));
    let repositoryPaths;
    if (declarations) {
      tools.push({
        name: 'declgen',
        path: path.join(COMPILER_ROOT, 'lib/fast_build/ark_compiler/interop/run_declgen_standalone.js'),
        version: 'DeclfileProductor.runDeclgen'
      });
      generated.repositoryDeclarations = declarations;
      repositoryPaths = attempt('repository-projection', () => prepareRepositoryProjection(workspace));
    }
    if (repositoryPaths) {
      Object.assign(generated, attempt('declgenV2', () => verifyDeclarationArtifacts(workspace, true)) || {});
      attempt('repository-static-compile', () =>
        executeRepositoryStaticCompile(workspace, toolchain, repositoryPaths, options));
      Object.assign(generated, attempt('arktsconfig', () => verifyCallerConfig(workspace, true)) || {});
    }
    generated.bridgePath = attempt('bridge', () => verifyBridgeSource(workspace));
    generated.static = attempt('static-abc', () => disassemble(workspace, toolchain, 'static'));
    generated.dynamic = attempt('dynamic-abc', () => disassemble(workspace, toolchain, 'dynamic'));
    if (isProject) {
      generated.hap = attempt('mixed-hap', () => verifyMixedHap(workspace));
    }
    const details = {
      tools,
      generated,
      diagnostics: diagnosticsFromLog(result.output),
      command: [toolchain.node, toolchain.hvigor, ...hvigorArguments()],
      projectRoot: workspace.root
    };
    if (failures.length > 0) {
      const first = failures[0];
      const failure = first instanceof StageFailure ? first : new StageFailure(
        first.stage || 'full-chain', first.category || 'implementation', first.code || 'ASSERTION', first.message);
      failure.details = { ...failure.details, ...details };
      failure.diagnostics = details.diagnostics;
      throw failure;
    }
    return { toolchain: tools, generated, diagnostics: details.diagnostics, command: details.command };
  }, options);
}

module.exports = {
  classifyFirstDiagnostic,
  crc32,
  diagnosticsFromLog,
  hvigorArguments,
  hvigorEnvironment,
  readZipEntries,
  resolveToolchain,
  runFullChain,
  verifyCallerConfig,
  verifyDeclarationDiagnostics
};
