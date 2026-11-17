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

const {
  parameterSource,
  caller
} = require('../static_parent_child_parameters/project_cases');
const { STATIC_INDEX_SOURCE } = require('../dynamic_calls_static_basic/source_cases');

const modelDeclaration = `export class DisplayModel {
  public title: string = 'default';
  public score: number = 0;
}
`;

const objectSource = parameterSource.replace('@Component', modelDeclaration + '@Component').replace(
  "@State public title: string = 'default';",
  "@State public title: string = 'default';\n  public model: DisplayModel = new DisplayModel();").replace(
  'Text(this.title + this.cardEnabled.toString())',
  'Text(this.model.title + this.model.score.toString())');

const recordSource = parameterSource.replace('@Component', 'export type ScoreMap = Record<string, number>;\n@Component').replace(
  "@State public title: string = 'default';",
  `@State public title: string = 'default';
  public scores: ScoreMap = { 'seed': 1 };`).replace(
  'Text(this.title + this.cardEnabled.toString())',
  "Text((this.scores['left'] ?? 0).toString())");

function page(parameters, fields) {
  return caller(parameters, fields).replace('PR14 parent/child parameters', 'Interop object parameter');
}

const fixtures = [
  {
    id: 'static-class-literal',
    staticSource: objectSource,
    staticIndex: STATIC_INDEX_SOURCE.replace('StaticCounter }', 'StaticCounter, DisplayModel }'),
    caller: page("count: this.counterSeed, model: { title: 'literal', score: 9 }",
      '@State counterSeed: number = 7;'),
    expected: {
      properties: ['count', 'model'],
      assignments: [],
      bytecode: ['__options_has_model', 'title', 'score']
    },
    contract: {
      declaration: ['model\\s*:\\s*DisplayModel', 'class DisplayModel'],
      caller: ['__options_has_model', 'Panda.getClass', 'literal']
    }
  },
  {
    id: 'record-parameter-literal',
    staticSource: recordSource,
    staticIndex: STATIC_INDEX_SOURCE,
    caller: page('count: this.counterSeed, scores: { left: 0, right: 5 }',
      '@State counterSeed: number = 7;'),
    expected: {
      properties: ['count', 'scores'],
      assignments: [],
      bytecode: ['__options_has_scores', 'left', 'right']
    },
    contract: {
      declaration: ['scores\\s*:\\s*ScoreMap'],
      caller: ['__options_has_scores', 'left', 'right']
    }
  },
  {
    id: 'multiple-class-literals',
    staticSource: objectSource,
    staticIndex: STATIC_INDEX_SOURCE.replace('StaticCounter }', 'StaticCounter, DisplayModel }'),
    caller: page('count: this.counterSeed, model: { title: this.currentTitle, score: this.counterSeed }',
      '@State counterSeed: number = 7;\n  @State currentTitle: string = "from parent";'),
    expected: {
      properties: ['count', 'model'],
      assignments: [],
      bytecode: ['__options_has_model', 'currentTitle']
    },
    contract: {
      declaration: ['title\\s*:\\s*string', 'get score\\(\\)\\s*:\\s*number', 'set score\\(value\\s*:\\s*number\\)'],
      caller: ['this.currentTitle', 'this.counterSeed', '__options_has_model']
    }
  }
];

module.exports = { fixtures, objectSource, recordSource };
