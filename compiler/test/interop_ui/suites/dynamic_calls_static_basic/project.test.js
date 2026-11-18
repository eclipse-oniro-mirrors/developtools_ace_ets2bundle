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
const { executeFullChain } = require('./compile.test');
const {
  DYNAMIC_DISASSEMBLY_SNIPPETS,
  STATIC_DISASSEMBLY_SNIPPETS,
  assertAbcHeader,
  readAbcHeader
} = require('./expected_cases');
const { sha256File } = require('./harness');
const { readJson } = require('./project_files');
const { BUNDLE_NAME, DIRECTION } = require('./source_cases');
const {
  executeDisassembler,
  executeZipTest,
  extractZipEntry,
  listZipEntries
} = require('./toolchain');
function validatePackagedModule(t, moduleJsonPath) {
  const value = readJson(moduleJsonPath);
  t.equal(value.app.bundleName, BUNDLE_NAME, 'HAP bundle identity differs');
  t.equal(value.module.name, 'entry', 'HAP module must be entry');
  t.equal(value.module.type, 'entry', 'HAP module type differs');
  t.equal(value.module.moduleArkTSMode, 'hybrid', 'HAP must declare hybrid ArkTS mode');
  t.equal(value.module.compileMode, 'esmodule', 'HAP must use ESMODULE output');
  t.match(
    value.module.virtualMachine,
    /^ark\d+\./,
    'HAP virtual machine must identify the dynamic Ark runtime');
  t.record('hap-module-identity', {
    path: moduleJsonPath,
    bundleName: value.app.bundleName,
    moduleName: value.module.name,
    moduleArkTSMode: value.module.moduleArkTSMode,
    compileMode: value.module.compileMode,
    virtualMachine: value.module.virtualMachine
  });
}
function validatePackagedBytecode(t, options) {
  const {
    dynamicPath,
    staticPath,
    dynamicReference,
    staticReference,
    kind
  } = options;
  const dynamicBytes = fs.readFileSync(dynamicPath);
  const staticBytes = fs.readFileSync(staticPath);
  const dynamicHeader = readAbcHeader(dynamicBytes);
  const staticHeader = readAbcHeader(staticBytes);
  t.ok(assertAbcHeader(dynamicHeader, 'dynamic'), 'Packaged dynamic ABC header is invalid');
  t.ok(assertAbcHeader(staticHeader, 'static'), 'Packaged static ABC header is invalid');
  t.notEqual(dynamicHeader.versionHex, staticHeader.versionHex);
  t.equal(
    sha256File(dynamicPath),
    dynamicReference.sha256,
    `HAP dynamic ABC must equal the new ${kind} backend output`);
  t.equal(
    sha256File(staticPath),
    staticReference.sha256,
    `HAP static ABC must equal the new ${kind} backend output`);
  t.record(`hap-${kind}-abc-hash-match`, {
    dynamic: {
      path: dynamicPath,
      sha256: dynamicReference.sha256,
      header: dynamicHeader
    },
    static: {
      path: staticPath,
      sha256: staticReference.sha256,
      header: staticHeader
    }
  });
}
function validatePackagedDisassembly(t, tools, dynamicPath, staticPath, workspace) {
  const dynamic = executeDisassembler(
    tools,
    'dynamic',
    dynamicPath,
    workspace,
    'hap-');
  const staticResult = executeDisassembler(
    tools,
    'static',
    staticPath,
    workspace,
    'hap-');
  for (const snippet of DYNAMIC_DISASSEMBLY_SNIPPETS) {
    t.includes(dynamic.content, snippet, `Packaged dynamic ABC misses ${snippet}`);
  }
  for (const snippet of STATIC_DISASSEMBLY_SNIPPETS) {
    t.includes(staticResult.content, snippet, `Packaged static ABC misses ${snippet}`);
  }
  t.record('hap-disassembly-evidence', {
    dynamic: dynamic.outputPath,
    static: staticResult.outputPath,
    dynamicRecord: 'entry.src.main.ets.pages.Index',
    staticRecord: 'static_component.src.main.ets.StaticCounter.StaticCounter'
  });
}
const cases = [{
  id: 'assemble-and-inspect-mixed-hap',
  group: 'project',
  direction: DIRECTION,
  description:
    'Independently assemble a mixed HAP and prove its two ABC files are fresh valid backend outputs',
  async run(t) {
    const notBeforeMs = Date.now();
    const chain = executeFullChain(t);
    const { paths, tools } = chain;
    const hap = t.freshArtifact(
      'fresh-unsigned-mixed-hap',
      paths.unsignedHap,
      { notBeforeMs, minimumBytes: 1024 });
    const zipTest = executeZipTest(tools, paths.unsignedHap, t.workspace);
    t.record('hap-zip-crc', zipTest);
    const entries = listZipEntries(tools, paths.unsignedHap, t.workspace);
    for (const required of ['module.json', 'ets/modules.abc', 'ets/modules_static.abc']) {
      t.ok(entries.includes(required), `HAP entry is missing: ${required}`);
    }
    t.deepEqual(
      entries.filter(entry => entry.endsWith('.abc')),
      ['ets/modules.abc', 'ets/modules_static.abc'],
      'HAP must contain exactly one dynamic and one static ABC');
    const extractionRoot = path.join(t.workspace, 'evidence', 'hap');
    const moduleJsonPath = extractZipEntry(
      tools,
      paths.unsignedHap,
      'module.json',
      path.join(extractionRoot, 'module.json'),
      t.workspace);
    const dynamicPath = extractZipEntry(
      tools,
      paths.unsignedHap,
      'ets/modules.abc',
      path.join(extractionRoot, 'ets', 'modules.abc'),
      t.workspace);
    const staticPath = extractZipEntry(
      tools,
      paths.unsignedHap,
      'ets/modules_static.abc',
      path.join(extractionRoot, 'ets', 'modules_static.abc'),
      t.workspace);
    validatePackagedModule(t, moduleJsonPath);
    validatePackagedBytecode(t, {
      dynamicPath,
      staticPath,
      dynamicReference: chain.summary.dynamicAbc,
      staticReference: chain.summary.staticAbc,
      kind: 'loader-output'
    });
    validatePackagedBytecode(t, {
      dynamicPath,
      staticPath,
      dynamicReference: {
        sha256: sha256File(paths.packagedDynamicAbc)
      },
      staticReference: {
        sha256: sha256File(paths.packagedStaticAbc)
      },
      kind: 'packaging-input'
    });
    t.freshArtifact(
      'fresh-packaging-input-dynamic-abc',
      paths.packagedDynamicAbc,
      { notBeforeMs, minimumBytes: 16 });
    t.freshArtifact(
      'fresh-packaging-input-static-abc',
      paths.packagedStaticAbc,
      { notBeforeMs, minimumBytes: 16 });
    validatePackagedDisassembly(t, tools, dynamicPath, staticPath, t.workspace);
    const result = {
      hap,
      entries,
      dynamicAbc: dynamicPath,
      staticAbc: staticPath,
      runtimeVerification: 'not executed; compile and artifact validation only'
    };
    t.record('project-verification-summary', result);
    return {
      hap: hap.path,
      sha256: hap.sha256,
      dynamicAbc: dynamicPath,
      staticAbc: staticPath
    };
  }
}];
module.exports = {
  cases,
  validatePackagedBytecode,
  validatePackagedDisassembly,
  validatePackagedModule
};
