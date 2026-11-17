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
const { compileScenario } = require('../static_parent_child_parameters/compile.test');
const { fixtures } = require('./project_cases');

async function compile(t, fixture) {
  const result = await compileScenario(t, fixture);
  const declaration = fs.readFileSync(result.paths.staticDeclaration, 'utf8');
  const transformed = fs.readFileSync(result.paths.callerTransformedPage, 'utf8');
  for (const expression of fixture.contract.declaration) {
    t.match(declaration, new RegExp(expression), `Generated declaration misses ${expression}`);
  }
  for (const fragment of fixture.contract.caller) {
    t.includes(transformed, fragment, `Compiled caller misses ${fragment}`);
  }
  const config = JSON.parse(fs.readFileSync(path.join(t.workspace, 'evidence/input-manifest.json'), 'utf8'));
  t.ok(config.files.length > 0);
  t.ok(config.files.every(file => file.sha256 && file.bytes > 0));
  t.record('theme-consumption', { id: fixture.id, declaration: result.paths.staticDeclaration,
    caller: result.paths.callerTransformedPage, stages: result.stages, contract: fixture.contract });
  return result;
}

const cases = fixtures.map(fixture => ({
  id: `compile-${fixture.id}`,
  group: 'compile',
  direction: '11-to-12',
  run: t => compile(t, fixture)
}));

module.exports = { cases: [...cases, ...require('./reverse_cases').cases], compile };
