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
const { PATHS } = require('./expected_cases');
const { TestFailure, sha256File, writeJson } = require('./harness');
const { createProjectFiles } = require('./source_cases');
function canonicalPath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return path.resolve(filePath);
  }
}
function normalizeRelativePath(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.length === 0) {
    throw new TestFailure('Project file path must be a non-empty string');
  }
  if (relativePath.includes('\0') || relativePath.includes('\\')) {
    throw new TestFailure(`Unsafe project file path: ${relativePath}`);
  }
  if (path.isAbsolute(relativePath)) {
    throw new TestFailure(`Absolute project input path is forbidden: ${relativePath}`);
  }
  const normalized = path.posix.normalize(relativePath);
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../')) {
    throw new TestFailure(`Project input escapes its temporary root: ${relativePath}`);
  }
  if (normalized !== relativePath) {
    throw new TestFailure(`Non-canonical project input path: ${relativePath}`);
  }
  return normalized;
}
function writeProjectFile(projectRoot, relativePath, content) {
  const normalized = normalizeRelativePath(relativePath);
  const destination = path.join(projectRoot, normalized);
  const relativeDestination = path.relative(projectRoot, destination);
  if (relativeDestination.startsWith('..') || path.isAbsolute(relativeDestination)) {
    throw new TestFailure(`Refusing to write outside project: ${relativePath}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content, 'utf8');
  return destination;
}
function materializeProject(workspace, sdkHome) {
  if (typeof sdkHome !== 'string' || !sdkHome || /[\r\n]/.test(sdkHome)) {
    throw new TestFailure('A valid SDK home is required for local.properties');
  }
  const projectRoot = path.join(workspace, 'project');
  if (fs.existsSync(projectRoot)) {
    throw new TestFailure(`Project directory already exists: ${projectRoot}`);
  }
  fs.mkdirSync(projectRoot, { recursive: true });
  const files = createProjectFiles();
  const written = [];
  for (const [relativePath, content] of Object.entries(files)) {
    written.push(writeProjectFile(projectRoot, relativePath, content));
  }
  written.push(writeProjectFile(projectRoot, 'local.properties', `sdk.dir=${sdkHome}\n`));
  const manifest = {
    projectRoot,
    canonicalProjectRoot: canonicalPath(projectRoot),
    fileCount: written.length,
    files: written.map(filePath => ({
      path: filePath,
      relativePath: path.relative(projectRoot, filePath).split(path.sep).join('/'),
      bytes: fs.statSync(filePath).size,
      mtimeMs: fs.statSync(filePath).mtimeMs,
      sha256: sha256File(filePath)
    })),
    externalFixture: null
  };
  writeJson(path.join(workspace, 'evidence', 'input-manifest.json'), manifest);
  return { projectRoot, files: written, manifest };
}
function getScenarioPaths(projectRoot) {
  const result = {};
  for (const [name, relativePath] of Object.entries(PATHS)) {
    result[name] = path.join(projectRoot, relativePath);
  }
  const staticDeclgenRoot = path.join(
    projectRoot, 'static_component/build/default/intermediates/declgen/default');
  result.staticDeclgenRoot = staticDeclgenRoot;
  result.staticDeclgenV1Root = path.join(staticDeclgenRoot, 'declgenV1');
  result.staticDeclgenV2Root = path.join(staticDeclgenRoot, 'declgenV2');
  result.staticBridgeRoot = path.join(staticDeclgenRoot, 'declgenBridgeCode');
  result.entryDeclgenRoot = path.join(
    projectRoot, 'entry/build/default/intermediates/declgen/default');
  return result;
}
function readJson(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new TestFailure(`Required JSON is missing: ${filePath}`, { cause: error.message });
  }
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new TestFailure(`Invalid JSON ${filePath}: ${error.message}`);
  }
}
function assertNoPreexistingArtifacts(paths) {
  const watched = [
    paths.staticDeclaration,
    paths.staticBridge,
    paths.callerTransformedPage,
    paths.dynamicAbc,
    paths.staticAbc,
    paths.unsignedHap
  ];
  const existing = watched.filter(filePath => fs.existsSync(filePath));
  if (existing.length > 0) {
    throw new TestFailure('Fresh project unexpectedly contains old artifacts', { existing });
  }
  return watched;
}
function moduleList(projection) {
  if (Array.isArray(projection.dependentModuleList)) {
    return projection.dependentModuleList;
  }
  if (Array.isArray(projection.dependencyModuleList)) {
    return projection.dependencyModuleList;
  }
  throw new TestFailure('Projection has no dependent module list');
}
function assertOldProtocolModule(moduleInfo, expected = {}) {
  if (!moduleInfo || typeof moduleInfo !== 'object') {
    throw new TestFailure('Missing static module projection');
  }
  if (Object.prototype.hasOwnProperty.call(moduleInfo, 'declgenBridgeConfigPath')) {
    throw new TestFailure(
      'declgenBridgeConfigPath is not the old TS bridge protocol; declgenBridgeCodePath is required');
  }
  for (const key of ['declgenV1OutPath', 'declgenBridgeCodePath']) {
    if (typeof moduleInfo[key] !== 'string' || moduleInfo[key].length === 0) {
      throw new TestFailure(`Projection is missing ${key}`);
    }
  }
  if (expected.declgenV1OutPath &&
      canonicalPath(moduleInfo.declgenV1OutPath) !== canonicalPath(expected.declgenV1OutPath)) {
    throw new TestFailure('Static declgenV1OutPath does not identify this run', {
      actual: moduleInfo.declgenV1OutPath,
      expected: expected.declgenV1OutPath
    });
  }
  if (expected.declgenBridgeCodePath &&
      canonicalPath(moduleInfo.declgenBridgeCodePath) !== canonicalPath(expected.declgenBridgeCodePath)) {
    throw new TestFailure('Static declgenBridgeCodePath does not identify this run', {
      actual: moduleInfo.declgenBridgeCodePath,
      expected: expected.declgenBridgeCodePath
    });
  }
  return true;
}
function validateProjectionEvidence(t, paths) {
  const generation = readJson(paths.generationProjection);
  t.equal(generation.enableDeclgenEts2Ts, true,
    'The selected SDK must use the old declgen ETS-to-TS bridge flow');
  t.equal(Object.prototype.hasOwnProperty.call(generation, 'declgenBridgeConfigPath'), false,
    'Generation projection must not substitute declgenBridgeConfigPath');
  t.ok(typeof generation.declgenBridgeCodePath === 'string',
    'Generation projection must contain declgenBridgeCodePath');
  const generationStatic = moduleList(generation).find(
    item => item.packageName === 'static_component');
  t.ok(generationStatic, 'Generation projection must include static_component');
  t.ok(assertOldProtocolModule(generationStatic, {
    declgenV1OutPath: paths.staticDeclgenV1Root,
    declgenBridgeCodePath: paths.staticBridgeRoot
  }), 'Generation module must retain the old protocol');
  const consumer = readJson(paths.consumerProjection);
  t.equal(Object.prototype.hasOwnProperty.call(consumer, 'declgenBridgeConfigPath'), false,
    'Consumer projection must not use the unrelated bridge config protocol');
  const modules = moduleList(consumer);
  const entry = modules.find(item => item.packageName === 'entry');
  const staticModule = modules.find(item => item.packageName === 'static_component');
  t.ok(entry, 'Consumer projection must include the dynamic entry module');
  t.ok(staticModule, 'Consumer projection must include the static HAR');
  t.equal(entry.language, '1.1', 'Entry source must be projected as ArkTS 1.1');
  t.equal(staticModule.language, '1.2', 'Static HAR must be projected as ArkTS 1.2');
  t.equal(staticModule.moduleType, 'har', 'Static component must remain a HAR');
  t.ok(assertOldProtocolModule(staticModule, {
    declgenV1OutPath: paths.staticDeclgenV1Root,
    declgenBridgeCodePath: paths.staticBridgeRoot
  }), 'Consumer must receive the generated old-protocol locations');
  t.record('projection-evidence', {
    generationPath: paths.generationProjection,
    consumerPath: paths.consumerProjection,
    entry: { language: entry.language, packageName: entry.packageName, modulePath: entry.modulePath },
    staticModule: {
      language: staticModule.language,
      packageName: staticModule.packageName,
      moduleType: staticModule.moduleType,
      declgenV1OutPath: staticModule.declgenV1OutPath,
      declgenV2OutPath: staticModule.declgenV2OutPath,
      declgenBridgeCodePath: staticModule.declgenBridgeCodePath
    },
    protocol: 'declgenV1OutPath + declgenBridgeCodePath'
  });
  return { generation, consumer, entry, staticModule };
}
function validateDeclarationMap(t, paths) {
  const map = readJson(paths.declarationMap);
  const verify = (source, declaration, bridge) => {
    const sourceKey = Object.keys(map).find(key => canonicalPath(key) === canonicalPath(source));
    t.ok(sourceKey, `Declaration map must contain ${source}`);
    const entry = map[sourceKey];
    for (const [field, filePath] of Object.entries({
      sourceFilePath: source,
      delFilePath: declaration,
      glueCodeFilePath: bridge
    })) {
      t.equal(canonicalPath(entry[field]), canonicalPath(filePath), `Stale declaration map ${field}`);
    }
    for (const [field, filePath] of Object.entries({
      sourceFileLastModified: source,
      declLastModified: declaration,
      glueCodeLastModified: bridge
    })) {
      t.equal(entry[field], fs.statSync(filePath).mtimeMs,
        `Declaration map ${field} differs from this artifact`);
    }
    return { sourceKey, entry };
  };
  const component = verify(paths.staticSource, paths.staticDeclaration, paths.staticBridge);
  const index = verify(paths.staticIndexSource, paths.staticIndexDeclaration, paths.staticIndexBridge);
  t.record('declaration-consumption-map', { mapPath: paths.declarationMap, component, index });
  return component.entry;
}
function validateDependencyMap(t, paths) {
  const content = fs.readFileSync(paths.dependencyOhmUrlMap, 'utf8');
  t.includes(content, '/data/storage/el1/bundle/entry/ets/modules_static.abc',
    'Dependency map must identify static ABC');
  t.includes(content, '/data/storage/el1/bundle/entry/ets/modules.abc',
    'Dependency map must identify dynamic ABC');
  t.match(content, /^'use static'/, 'Dependency mapping input must itself be static');
  t.includes(content, 'entry/src/main/ets/pages/Index',
    'Dependency map must include the dynamic caller record');
  t.record('dependency-ohmurl-evidence', {
    path: paths.dependencyOhmUrlMap,
    sha256: sha256File(paths.dependencyOhmUrlMap)
  });
}
module.exports = {
  assertNoPreexistingArtifacts,
  assertOldProtocolModule,
  canonicalPath,
  getScenarioPaths,
  materializeProject,
  moduleList,
  normalizeRelativePath,
  readJson,
  validateDeclarationMap,
  validateDependencyMap,
  validateProjectionEvidence,
  writeProjectFile
};
