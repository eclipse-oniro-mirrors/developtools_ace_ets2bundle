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
const ts = require(path.resolve(__dirname, '../../../../node_modules/typescript'));
const {
  STATIC_COUNTER_SOURCE,
  STATIC_INDEX_SOURCE
} = require('../dynamic_calls_static_basic/source_cases');

function page(imports, component, beforeBuild = '', extraUi = '') {
  return `${imports}
@Entry
@Component
struct Index {
  @State counterSeed: number = 7;
  ${beforeBuild}
  build() {
    Column() {
      Text('PR12 namespace and type imports')
      ${component}({ count: this.counterSeed })
      ${extraUi}
      Button('update').onClick(() => { this.counterSeed += 1; })
    }
    .width('100%').height('100%')
  }
}
`;
}

const modelSource = STATIC_COUNTER_SOURCE + `
export class CounterModel {
  public value: number = 3;
  public label: string = 'model';
}
`;
const modelIndex = STATIC_INDEX_SOURCE +
  "export { CounterModel } from './src/main/ets/StaticCounter';\n";

const valueSource = modelSource + `
export function formatCount(value: number): string {
  return 'namespace=' + value.toString();
}
`;
const valueIndex = modelIndex +
  "export { formatCount } from './src/main/ets/StaticCounter';\n";

const fixtures = [
  {
    id: 'namespace-runtime-value-with-component',
    caller: page(
      "import * as staticModels from 'static_component';\n" +
      "import { StaticCounter } from 'static_component';",
      'StaticCounter',
      '',
      'Text(staticModels.formatCount(this.counterSeed))'),
    staticSource: valueSource,
    staticIndex: valueIndex,
    expected: {
      contains: ['staticModels.formatCount(this.counterSeed)', '__Options_StaticCounter'],
      bytecode: ['formatCount', 'StaticCounter']
    }
  },
  {
    id: 'namespace-static-component',
    knownFailure: { code: '10905204', message: 'does not meet UI component syntax', stage: 'caller-ui' },
    caller: page("import * as staticCards from 'static_component';", 'staticCards.StaticCounter'),
    expected: {
      contains: ['staticCards.StaticCounter', '__Interop_CreateStaticComponent_Internal'],
      bytecode: ['StaticCounter']
    }
  },
  {
    id: 'type-only-model-with-value-component',
    caller: page(
      "import type { CounterModel } from 'static_component';\n" +
      "import { StaticCounter } from 'static_component';",
      'StaticCounter',
      'model: CounterModel | undefined = undefined;'),
    staticSource: modelSource,
    staticIndex: modelIndex,
    expected: {
      contains: ['new StaticCounter(undefined, undefined)', '__Options_StaticCounter'],
      forbidden: ['Panda.getClass(\'LCounterModel;\')'],
      bytecode: ['StaticCounter']
    }
  },
  {
    id: 'mixed-type-and-value-specifiers',
    caller: page(
      "import { type CounterModel, StaticCounter } from 'static_component';",
      'StaticCounter',
      'model: CounterModel | undefined = undefined;'),
    staticSource: modelSource,
    staticIndex: modelIndex,
    expected: {
      contains: ['new StaticCounter(undefined, undefined)', '__Options_StaticCounter'],
      bytecode: ['StaticCounter']
    }
  }
];

function assertScenario(t, output, fixture, paths) {
  for (const snippet of fixture.expected.contains) {
    t.includes(output, snippet);
  }
  for (const snippet of fixture.expected.forbidden || []) {
    t.notIncludes(output, snippet);
  }
  const javascript = ts.transpileModule(output, {
    compilerOptions: { target: ts.ScriptTarget.ES2021, module: ts.ModuleKind.ESNext }
  }).outputText;
  t.notIncludes(javascript, 'import type');
  t.notIncludes(javascript, 'CounterModel');
  const indexDeclaration = fs.readFileSync(paths.staticIndexDeclaration, 'utf8');
  t.includes(indexDeclaration, 'StaticCounter');
  if (fixture.staticSource) {
    const model = fs.readFileSync(paths.staticDeclaration, 'utf8');
    t.includes(model, 'CounterModel');
    t.match(model, /get\s+value\s*\(\)\s*:\s*number/);
    t.match(model, /set\s+value\s*\(value\s*:\s*number\)/);
    t.match(model, /get\s+label\s*\(\)\s*:\s*string/);
    t.match(model, /set\s+label\s*\(value\s*:\s*string\)/);
  }
}

module.exports = { fixtures, assertScenario };
