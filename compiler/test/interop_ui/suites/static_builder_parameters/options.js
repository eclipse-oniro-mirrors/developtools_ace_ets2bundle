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

const { compileCases, declarationCases, transformCases } = require('./source_cases');

const SUITE_NAME = 'static_builder_parameters';

function normalizeOptions(options = {}) {
  return {
    ...options,
    keep: Boolean(options.keep || options.keepArtifacts)
  };
}

function caseLines() {
  const lines = [
    `${SUITE_NAME}/source-registry-independence\tunit\tregistry\t` +
      'independent sources, boundaries and expectations',
    `${SUITE_NAME}/runner-keep-artifacts-mapping\tunit\trunner\tkeep option normalization`,
    `${SUITE_NAME}/runner-list-includes-registry\tunit\trunner\tcomplete deterministic discovery`,
    `${SUITE_NAME}/diagnostic-named-model-whitelist\tunit\tdiagnostic\tNamedSlotModel location`,
    `${SUITE_NAME}/diagnostic-local-reference-whitelist\tunit\tdiagnostic\tExplicitSlotCard location`,
    `${SUITE_NAME}/diagnostic-backend-is-implementation-failure\tunit\tdiagnostic\tbackend rejection`
  ];
  for (const testCase of declarationCases) {
    lines.push(`${SUITE_NAME}/${testCase.id}\tunit\tdeclgen\t${testCase.boundary}`);
  }
  for (const testCase of transformCases) {
    lines.push(`${SUITE_NAME}/${testCase.id}\tunit\tdirect\t${testCase.boundary}`);
  }
  for (const testCase of compileCases) {
    lines.push(`${SUITE_NAME}/${testCase.id}\tcompile\tfull-chain\t${testCase.boundary}`);
  }
  return lines;
}

module.exports = {
  caseLines,
  normalizeOptions
};
