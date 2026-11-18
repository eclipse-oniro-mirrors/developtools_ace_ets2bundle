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

const { SOURCE_CASES } = require('./source_cases');
const { EXPECTED_CASES } = require('./expected_cases');
const { runCase } = require('./test_support');
const { assertExpectation } = require('./signature_assertions');

function validateCaseTable() {
  const identifiers = new Set();
  const expectations = new Set();
  for (const testCase of SOURCE_CASES) {
    if (identifiers.has(testCase.id)) {
      throw new Error(`Duplicate PR05 case id: ${testCase.id}`);
    }
    identifiers.add(testCase.id);
    if (expectations.has(testCase.expectation)) {
      throw new Error(`Duplicate PR05 expectation key: ${testCase.expectation}`);
    }
    expectations.add(testCase.expectation);
    if (!EXPECTED_CASES[testCase.expectation]) {
      throw new Error(`Missing expectation for ${testCase.id}`);
    }
    if (!testCase.source || !testCase.boundary) {
      throw new Error(`Incomplete source case ${testCase.id}`);
    }
  }
  for (const expectation of Object.keys(EXPECTED_CASES)) {
    if (!expectations.has(expectation)) {
      throw new Error(`Orphaned PR05 expectation: ${expectation}`);
    }
  }
}

function registerTests(register, context) {
  validateCaseTable();
  for (const testCase of SOURCE_CASES) {
    const expected = EXPECTED_CASES[testCase.expectation];
    register({
      id: testCase.id,
      title: testCase.title,
      boundary: testCase.boundary,
      group: testCase.mode,
      integration: testCase.mode === 'declgen',
      knownFailure: expected.knownFailure,
      expected,
      run() {
        return runCase(testCase, context, actual => {
          assertExpectation(actual, expected);
        });
      }
    });
  }
  return SOURCE_CASES.length;
}

module.exports = {
  registerTests,
  validateCaseTable
};
