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
const { assert } = require('../static_calls_dynamic_basic/harness');
const { ABC_CALLER_BINDINGS, FULL_PROJECT_BARRELS, FULL_PROJECT_ORIGINS } = require('./expected_cases');

function moduleRequest(file) {
  return `@normalized:N&&&dynamic_component/${file}&1.0.0`;
}
function indirectExportLine(binding) {
  return `ModuleTag: INDIRECT_EXPORT, export_name: ${binding.exportName}, ` +
    `import_name: ${binding.importName}, module_request: ${binding.moduleRequest};`;
}
function dynamicIndirectExports() {
  const bindings = [];
  for (const [exportName, origin] of Object.entries(FULL_PROJECT_ORIGINS)) {
    bindings.push(
      { exportName, importName: origin.local, moduleRequest: moduleRequest(origin.file), scope: 'internal-barrel' },
      { exportName, importName: exportName, moduleRequest: moduleRequest(FULL_PROJECT_BARRELS[exportName]), scope: 'package-index' }
    );
  }
  return bindings;
}
function functionBlocks(text) {
  return text.split(/\r?\n(?=\.function )/).filter(block => block.startsWith('.function '));
}

function assertStaticCallerBindings(text) {
  const blocks = functionBlocks(text);
  const evidence = [];
  for (const expected of ABC_CALLER_BINDINGS) {
    const other = ABC_CALLER_BINDINGS.find(item => item !== expected);
    const label = blocks.find(block => block.includes(`entry.src.main.ets.pages.Index.ETSGLOBAL.${expected.labelFunction}(`));
    assert.ok(label, `${expected.labelFunction} is not bound in the caller page ETSGLOBAL`);
    assert.ok(label.includes(`any.ldbyname v2, "${expected.token}", 0x0`), `${expected.labelFunction} misses ${expected.token}`);
    assert.ok(label.includes(`lda.str "${expected.argument}"`) && label.includes('any.call.new'),
      `${expected.labelFunction} does not construct its own token argument`);
    assert.ok(!label.includes(`any.ldbyname v2, "${other.token}", 0x0`), `${expected.labelFunction} uses ${other.token}`);
    const page = blocks.find(block => block.includes('entry.src.main.ets.pages.Index.Index.') &&
      block.includes(`lda.str "${expected.page}"`));
    assert.ok(page, `${expected.component} page path is outside the caller page functions`);
    assert.ok(page.includes(`call.short <static> entry.src.main.ets.pages.Index.ETSGLOBAL.${expected.labelFunction}:()`),
      `${expected.component} does not call ${expected.labelFunction}`);
    assert.ok(new RegExp(`any\\.ldbyname v\\d+, "${expected.component}", 0x0`).test(page),
      `${expected.component} page does not read its own component symbol`);
    assert.ok(new RegExp(`lda\\.str "${expected.component}"\\s*\\n\\s*stobj\\.obj [^\\n]*ObjectLiteral\\.name`).test(page),
      `${expected.component} read symbol and component name are not associated`);
    assert.ok(!page.includes(`lda.str "${other.page}"`) &&
      !new RegExp(`any\\.ldbyname v\\d+, "${other.component}", 0x0`).test(page),
    `${expected.component} page is cross-bound to ${other.component}`);
    const pageKey = page.indexOf('lda.str "page"');
    const pathKey = page.indexOf(`lda.str "${expected.page}"`);
    assert.ok(pageKey >= 0 && pathKey > pageKey && page.includes('ESValue.setProperty'),
      `${expected.component} page path is not assigned as the page property`);
    evidence.push({ labelFunction: expected.labelFunction, token: expected.token, component: expected.component, page: expected.page });
  }
  return evidence;
}

function assertDynamicIndirectExports(text) {
  const counts = new Map();
  const pattern = /ModuleTag: INDIRECT_EXPORT, export_name: ([^,]+), import_name: ([^,]+), module_request: ([^;]+);/g;
  for (const match of text.matchAll(pattern)) {
    const key = indirectExportLine({ exportName: match[1], importName: match[2], moduleRequest: match[3] });
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const expected = dynamicIndirectExports();
  for (const binding of expected) {
    const key = indirectExportLine(binding);
    assert.strictEqual(counts.get(key) || 0, 1, `wrong ${binding.scope} indirect-export binding; expected exactly: ${key}`);
  }
  return expected;
}

module.exports = {
  assertDynamicIndirectExports, assertStaticCallerBindings, dynamicIndirectExports, indirectExportLine
};
