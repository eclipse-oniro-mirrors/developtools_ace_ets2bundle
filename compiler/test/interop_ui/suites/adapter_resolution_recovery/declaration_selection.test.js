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
const { fixtures } = require('./selection_cases');
const { assertInteropLibFresh } = require('../dynamic_calls_static_basic/unit.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');

const cases = fixtures.map(fixture => ({
  id: `declaration-selection-${fixture.id}`,
  group: 'unit',
  direction: '12-to-11',
  run(t) {
    assertInteropLibFresh();
    const { getDeclgenV2DeclPath } = require(path.join(COMPILER_ROOT,
      'lib/fast_build/ark_compiler/interop/interop_manager'));
    const base = path.join(t.workspace, 'Card');
    t.equal(getDeclgenV2DeclPath(base), base + '.d.ets');
    for (const suffix of fixture.files) {
      fs.writeFileSync(base + suffix, 'export declare class Card {}\n');
    }
    const selected = getDeclgenV2DeclPath(base);
    t.equal(selected, base + fixture.selected);
    t.equal(getDeclgenV2DeclPath(base), selected);
    if (fs.existsSync(selected)) {
      fs.unlinkSync(selected);
    }
    t.equal(getDeclgenV2DeclPath(base), base + fixture.afterRemoval);
    if (fixture.files.length) {
      fs.writeFileSync(base + fixture.selected, 'export declare class Card {}\n');
      t.equal(getDeclgenV2DeclPath(base), selected);
    }
    t.record('dynamic-to-static-declaration-selection', { boundary: fixture.boundary,
      candidates: fixture.files.map(suffix => base + suffix), selected,
      afterRemoval: base + fixture.afterRemoval });
  }
}));

module.exports = { cases };
