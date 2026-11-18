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

const { parameterSource, caller } = require('../static_parent_child_parameters/project_cases');
const { STATIC_INDEX_SOURCE } = require('../dynamic_calls_static_basic/source_cases');

const observerSource = `export interface Observer {
  onValue(value: number): void;
}
export class DefaultObserver implements Observer {
  public onValue(value: number): void {
    console.info(value.toString());
  }
}
`;
const staticSource = parameterSource.replace('@Component', observerSource + '@Component').replace(
  "@State public title: string = 'default';",
  "@State public title: string = 'default';\n  public observer: Observer = new DefaultObserver();").replace(
  'this.count += 1;', 'this.count += 1;\n        this.observer.onValue(this.count);');
const staticIndex = STATIC_INDEX_SOURCE.replace('StaticCounter }', 'StaticCounter, Observer }');
const viewModel = `class UIObserver implements Observer {
  onValue(value: number): void {
    console.info('observer=' + value.toString());
  }
}
`;
function page(model, name) {
  return caller('count: this.counterSeed, observer: new ' + name + '()',
    '@State counterSeed: number = 7;').replace('@Entry', model + '\n@Entry')
    .replace('import { StaticCounter }', 'import { StaticCounter, Observer }')
    .replace('PR14 parent/child parameters', 'Interop interface model');
}
const fixtures = [
  {
    id: 'static-interface-view-model',
    staticSource,
    staticIndex,
    caller: page(viewModel, 'UIObserver'),
    expected: {
      properties: ['count', 'observer'],
      assignments: [],
      bytecode: ['UIObserver', '__options_has_observer']
    },
    contract: {
      declaration: ['interface Observer', 'observer\\s*:\\s*Observer'],
      caller: ['UIObserver', 'implements static:', '__options_has_observer']
    }
  },
  {
    id: 'inherited-dynamic-view-model',
    staticSource,
    staticIndex,
    caller: page(viewModel + 'class ChildObserver extends UIObserver {}\n', 'ChildObserver'),
    expected: {
      properties: ['count', 'observer'],
      assignments: [],
      bytecode: ['ChildObserver', '__options_has_observer']
    },
    contract: {
      declaration: ['onValue\\(value\\s*:\\s*number\\)'],
      caller: ['class ChildObserver', 'implements static:', '__options_has_observer']
    }
  },
  {
    id: 'constructor-parameter-preserved',
    staticSource,
    staticIndex,
    caller: page(viewModel.replace('  onValue',
      '  constructor(seed: number = 1) { console.info(seed.toString()); }\n  onValue'), 'UIObserver'),
    expected: {
      properties: ['count', 'observer'],
      assignments: [],
      bytecode: ['UIObserver', '__options_has_observer']
    },
    contract: {
      declaration: ['Observer'],
      caller: ['constructor(seed', 'implements static:', '__options_has_observer']
    }
  }
];

module.exports = { fixtures };
