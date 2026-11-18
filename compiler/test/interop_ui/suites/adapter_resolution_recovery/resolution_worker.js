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

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { production } = require('../dynamic_calls_static_basic/unit.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const { FileManager } = require(path.join(COMPILER_ROOT,
  'lib/fast_build/ark_compiler/interop/interop_manager'));

function write(root, relative, text) {
  const file = path.join(root, relative);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}

function moduleInfo(root, fixture) {
  return {
    language: fixture.language,
    packageName: fixture.packageName,
    moduleName: fixture.packageName,
    modulePath: path.join(root, 'module'),
    cachePath: path.join(root, 'cache'),
    declgenV1OutPath: path.join(root, 'module/decl'),
    declgenV2OutPath: path.join(root, 'module/static-decl'),
    declFilesPath: path.join(root, 'declaration-files.json'),
    sourceRoots: ['src/main/ets'],
    staticFiles: [path.join(root, 'module', fixture.source)],
    dynamicFiles: [path.join(root, 'module/Dynamic.ets')],
    byteCodeHarInfo: {}
  };
}

function normalized(root, resolved) {
  if (!resolved) {
    return null;
  }
  const file = typeof resolved === 'string' ? resolved : resolved.resolvedFileName;
  return path.relative(path.join(root, 'module'), file).replace(/\\/g, '/');
}

function resolve(root, fixture, evolution) {
  const moduleRoot = path.join(root, 'module');
  const source = path.join(moduleRoot, fixture.source);
  const caller = path.join(moduleRoot, fixture.caller);
  const missing = new Set();
  let value;
  if (fixture.operation === 'query') {
    value = evolution.queryDeclFileForInterop(source, fixture.request, '1.1',
      { resolvedFileName: source, extension: '.ets', isExternalLibraryImport: false }, missing);
  } else if (fixture.operation === 'redirect') {
    value = evolution.redirectToDeclFileForInterop(source);
  } else if (fixture.operation === 'map') {
    value = evolution.mapDeclFileToSourcePath(path.join(moduleRoot, fixture.containingDeclaration));
  } else if (fixture.operation === 'from-decl') {
    value = evolution.resolveRelativeModuleFromDecl(fixture.request, caller);
  } else if (fixture.operation === 'from-source') {
    value = evolution.resolveRelativeModuleFromSource(fixture.request, caller);
  } else {
    throw new Error(`Unknown resolution operation ${fixture.operation}`);
  }
  return { path: normalized(root, value), missing: Array.from(missing),
    extension: value && typeof value === 'object' ? value.extension : null };
}

function worker(root, fixture) {
  const { evolution } = production();
  const module = moduleInfo(root, fixture);
  const moduleRoot = module.modulePath;
  write(moduleRoot, fixture.source, fixture.sourceText);
  write(moduleRoot, 'Dynamic.ets', 'export class DynamicCard {}\n');
  for (const [relative, text] of Object.entries(fixture.initialFiles)) {
    write(moduleRoot, relative, text);
  }
  const dependencies = new Map([[fixture.packageName, module]]);
  FileManager.initForTest(dependencies, new Map(), undefined, undefined, undefined, root);
  evolution.collectArkTSEvolutionModuleInfo({ share: {
    projectConfig: { dependentModuleMap: dependencies, useNormalizedOHMUrl: true },
    throwArkTsCompilerError(...args) {
      throw new Error(args.join(' '));
    }
  } });
  const observations = [];
  try {
    for (const step of fixture.steps) {
      if (step.action === 'write') {
        write(moduleRoot, step.file, step.text);
      } else if (step.action === 'remove') {
        fs.unlinkSync(path.join(moduleRoot, step.file));
      } else if (step.action === 'resolve') {
        observations.push(resolve(root, fixture, evolution));
      } else {
        throw new Error(`Unknown action ${step.action}`);
      }
    }
    return { observations, dependencyCount: FileManager.arkTSModuleMap.size,
      registeredSource: module.staticFiles[0], isolation: 'child-process' };
  } finally {
    evolution.cleanUpProcessArkTSEvolutionObj();
    FileManager.cleanFileManagerObject();
    assert.strictEqual(FileManager.arkTSModuleMap.size, 0);
    assert.strictEqual(evolution.arkTSEvolutionModuleMap.size, 0);
  }
}

function executeFixture(t, fixture) {
  const processResult = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }), encoding: 'utf8',
    timeout: 30000, maxBuffer: 8 * 1024 * 1024
  });
  t.equal(processResult.status, 0, processResult.stderr || 'Resolution worker failed');
  const file = path.join(t.workspace, 'resolution-result.json');
  const result = JSON.parse(fs.readFileSync(file, 'utf8'));
  t.record('repository-resolution', { file, fixture: fixture.id, ...result });
  return result;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    const result = worker(request.root, request.fixture);
    fs.writeFileSync(path.join(request.root, 'resolution-result.json'), JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture };
