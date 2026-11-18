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
const { StageFailure } = require('../static_calls_dynamic_basic/harness');
const { runFullChainCase } = require('../static_basic_properties/full_chain_runner');

const fixtures = [
  {
    id: 'array-callback-result-static-consumer',
    componentName: 'PublicResultCard',
    purpose: 'The static caller consumes a newly generated dynamic callback returning an array of text.',
    branch: 'array-callback-result',
    knownConsumerFailure: {
      code: 'ESE0319',
      message: "Type '((p1: Double) => Array<String>)' is not compatible with type 'undefined|(((p1: Double) => Array<String>))' at property 'format'",
      line: 15,
      column: 17
    },
    sourceName: 'PropertyCard.ets',
    packageName: 'dynamic_component',
    fullChain: true,
    stateProperties: [],
    consumerProperty: 'format',
    consumerType: '(value: number) => string[]',
    properties: [
      {
        name: 'count', type: 'number', decorator: 'Prop', access: '', optional: false,
        caller: '9', hasCaller: true, event: false
      },
      {
        name: 'format', type: '(value: number) => string[]', decorator: '',
        access: '', optional: false, hasCaller: true, event: true,
        caller: '(value: number): string[] => { return [value.toString()]; }'
      }
    ]
  }
];

const cases = fixtures.map(fixture => ({
  id: `compile-${fixture.id}`,
  direction: '12-to-11',
  group: 'compile',
  async run(t) {
    const result = await runFullChainCase(fixture, { parent: t.workspace, keep: true });
    t.record('reverse-generated-consumer', result);
    t.ok(result.stages.some(stage => stage.status === 'passed'));
    if (result.status === 'passed') {
      throw new StageFailure('repository-static-compile', 'implementation', 'STALE_KNOWN_FAILURE',
        'Remove the resolved static callback consumer failure contract');
    }
    if (result.status !== 'passed') {
      const failure = result.failure;
      const expected = fixture.knownConsumerFailure;
      if (failure.code === expected.code && failure.stage === 'repository-static-compile') {
        const logPath = path.join(failure.details.projectRoot, 'evidence/repository-static.log');
        const text = fs.readFileSync(logPath, 'utf8');
        t.includes(text, expected.message);
        t.includes(text, `Index.ets:${expected.line}:${expected.column}`);
        throw new StageFailure(failure.stage, 'existing', expected.code,
          'Generated callback-result contract rejected by the matched static consumer', { logPath, result });
      }
      throw new StageFailure(failure.stage, failure.category, failure.code,
        failure.message, { ...failure.details, result });
    }
  }
}));

module.exports = { cases, fixtures };
