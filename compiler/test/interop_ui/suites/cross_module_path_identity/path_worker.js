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
const { production } = require('../dynamic_calls_static_basic/unit.test');
const { fileMetadata, writeJson } = require('../dynamic_calls_static_basic/harness');
const compiler = path.resolve(__dirname, '../../../..');
const ts = require(path.join(compiler, 'node_modules/typescript'));
const linker = path.join(compiler, 'lib/fast_build/ark_compiler/interop');
const { FileManager } = require(path.join(linker, 'interop_manager'));

function materialize(root, files) {
  for (const [relative, text] of Object.entries(files)) {
    const file = path.join(root, relative);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}

function provider(root, spec, hasArtifact) {
  const modulePath = path.join(root, spec.name);
  const source = path.join(modulePath, spec.source);
  const declgenV1OutPath = path.join(root, spec.declarations);
  const declaration = path.join(declgenV1OutPath, spec.source.replace(/\.(?:ets|ats)$/, '.d.ets'));
  const contents = { [source]: `'use static'\nexport class Card { public label: string = '${spec.marker}'; }\n` };
  if (hasArtifact) {
    contents[declaration] = `export declare class Card { label: '${spec.marker}'; }\n`;
  }
  materialize(root, Object.fromEntries(Object.entries(contents).map(([file, text]) => [path.relative(root, file), text])));
  return {
    language: '1.2', packageName: spec.name, moduleName: spec.name, modulePath, declgenV1OutPath,
    sourceRoots: ['src/main/ets'], staticFiles: [source], dynamicFiles: [],
    cachePath: path.join(root, 'build-cache', spec.name), byteCodeHarInfo: {}
  };
}

function resolve(root, item, evolution, aliases) {
  const missing = new Set();
  const source = path.join(root, item.source);
  const state = FileManager.getInstance().getLanguageVersionByFilePath(source);
  let value;
  if (item.operation === 'relative') {
    value = evolution.resolveRelativeModuleFromSource(item.request, path.join(root, item.containing));
  } else if (item.operation === 'decl') {
    value = evolution.resolveRelativeModuleFromDecl(item.request, path.join(root, item.containing));
  } else {
    const options = { baseUrl: root, paths: aliases, moduleResolution: ts.ModuleResolutionKind.NodeJs };
    const containing = path.join(root, item.containing || 'entry/Caller.ets');
    const requested = ts.resolveModuleName(item.request, containing, options, ts.sys).resolvedModule;
    const absolute = requested ? requested.resolvedFileName : source;
    if (item.operation === 'alias') {
      assert.strictEqual(absolute, source, 'Alias selected the wrong source before interop redirection');
    }
    value = evolution.queryDeclFileForInterop(absolute, item.request, '1.1',
      { resolvedFileName: absolute, extension: ts.Extension.Ets, isExternalLibraryImport: false }, missing)?.resolvedFileName;
  }
  const result = { request: item.request, path: value ? path.relative(root, value).split(path.sep).join('/') : null,
    language: state?.languageVersion, packageName: state?.pkgName, missing: [...missing] };
  return value ? { ...result, bytes: fileMetadata(value).bytes, content: fs.readFileSync(value, 'utf8') } : result;
}

function run(root, fixture) {
  const { evolution } = production();
  const modules = new Map(fixture.providers.map(spec => [spec.name, provider(root, spec, !spec.missing)]));
  FileManager.initForTest(modules, new Map(), undefined, undefined, undefined, root);
  evolution.collectArkTSEvolutionModuleInfo({ share: {
    projectConfig: { dependentModuleMap: modules, useNormalizedOHMUrl: true },
    throwArkTsCompilerError(...args) {
      throw new Error(args.join(' '));
    }
  } });
  try {
    if (fixture.extraFiles) {
      materialize(root, fixture.extraFiles);
    }
    return { providers: FileManager.arkTSModuleMap.size,
      resolutions: fixture.requests.map(item => resolve(root, item, evolution, fixture.aliases || {})) };
  } finally {
    evolution.cleanUpProcessArkTSEvolutionObj();
    FileManager.cleanFileManagerObject();
    assert.strictEqual(FileManager.arkTSModuleMap.size, 0);
  }
}

const { root, fixture } = JSON.parse(fs.readFileSync(0, 'utf8'));
writeJson(path.join(root, 'observations.json'), run(root, fixture));
