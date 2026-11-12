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

const fs = require('fs');
const os = require('os');
const path = require('path');
const { registerTests } = require('./declaration.test');
const { toolchainDescription } = require('./test_support');
const { modifierLossFingerprint } = require('./signature_assertions');

const name = 'monitor_declaration_signatures';
const direction = '12-to-11';
const ENVIRONMENT_CODES = new Set([
  'EACCES', 'ENOMEM', 'ENOENT', 'ENOSPC', 'ETIMEDOUT', 'MODULE_NOT_FOUND'
]);

function parseArguments(argv) {
  const options = { group: 'all', keepArtifacts: false, list: false };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--keep-artifacts') {
      options.keepArtifacts = true;
    } else if (argument === '--list') {
      options.list = true;
    } else if (argument === '--declgen-smoke') {
      options.group = 'compile';
      options.only = 'declgen-monitor-basic';
      options.keepArtifacts = true;
    } else if (['--group', '--direction', '--only'].includes(argument)) {
      index += 1;
      if (index >= argv.length) {
        throw new Error(`${argument} requires a value`);
      }
      const value = argv[index];
      if (argument === '--group') {
        if (!['all', 'unit', 'compile', 'project'].includes(value)) {
          throw new Error(`invalid group ${value}`);
        }
        options.group = value;
      } else if (argument === '--direction') {
        if (!['12-to-11', '11-to-12'].includes(value)) {
          throw new Error(`invalid direction ${value}`);
        }
        options.direction = value;
      } else {
        options.only = value;
      }
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function protocolGroup(mode) {
  return mode === 'declgen' ? 'compile' : 'unit';
}

function matches(test, options) {
  if (options.direction && options.direction !== direction) {
    return false;
  }
  if (options.group !== 'all' && protocolGroup(test.group) !== options.group) {
    return false;
  }
  if (!options.only) {
    return true;
  }
  if (options.only === 'integration') {
    return test.group === 'declgen';
  }
  return test.id === options.only || test.id.includes(options.only) ||
    test.group === options.only || protocolGroup(test.group) === options.only;
}

function initialStats() {
  return {
    tempDirectoriesCreated: 0,
    tempDirectoriesRemoved: 0,
    programsCreated: 0,
    programReferencesReleased: 0,
    programsDisposed: 0,
    typeCheckersCreated: 0,
    typeCheckersReleased: 0,
    handleUIImportsTransforms: 0,
    transformationResultsDisposed: 0,
    afterDeclarationsCaptures: 0,
    declgenRuns: 0,
    declgenRepeatChecks: 0,
    declgenStateSnapshots: 0,
    declgenStateRestores: 0
  };
}

function collectTests(context) {
  const tests = [];
  const registered = registerTests(test => tests.push(test), context);
  if (registered !== tests.length) {
    throw new Error(`Registered ${registered} cases but collected ${tests.length}.`);
  }
  return tests;
}

function outputRecord(test, result, error) {
  const source = result || error || {};
  const outputPath = source.outputPath;
  return {
    id: test.id,
    mode: test.group,
    inputPath: source.inputPath,
    outputPath,
    repeatOutputPath: source.repeatOutputPath,
    bytes: outputPath && fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0,
    toolOutputPath: result && result.toolOutputPath,
    evidencePath: error && error.evidencePath
  };
}

function normalizeFailure(test, error) {
  const fingerprint = modifierLossFingerprint(error.actual, test.expected, error);
  if (fingerprint) {
    return {
      stage: error.failureStage || error.actual.stage,
      category: 'existing',
      code: test.knownFailure.issue,
      message: error.message,
      details: {
        classification: 'known-failure',
        fingerprint,
        sourceEvidence: test.knownFailure.sourceEvidence,
        evidencePath: error.evidencePath
      }
    };
  }
  const category = error.category === 'environment' || ENVIRONMENT_CODES.has(error.code) ?
    'environment' : 'implementation';
  return {
    stage: error.failureStage || error.stage || 'assertion',
    category,
    code: String(error.code || error.name || 'Error'),
    message: error.message || String(error),
    details: {
      classification: category === 'environment' ? 'environment' : 'regression',
      evidencePath: error.evidencePath
    }
  };
}

function executeTest(test) {
  try {
    const result = test.run();
    if (test.knownFailure) {
      const error = new Error(
        `${test.knownFailure.issue} is stale; the known-failure case now passes.`
      );
      return {
        test,
        status: 'failed',
        result,
        failure: {
          stage: 'assertion',
          category: 'implementation',
          code: 'STALE_KNOWN_FAILURE',
          message: error.message,
          details: { classification: 'unexpected-pass' }
        }
      };
    }
    return { test, status: 'passed', result };
  } catch (error) {
    return { test, status: 'failed', error, failure: normalizeFailure(test, error) };
  }
}

function toolchainList() {
  const tools = toolchainDescription();
  return [
    { name: 'node', path: process.execPath, version: tools.node },
    { name: 'ohos-typescript', path: tools.typescriptPath, version: tools.typescript },
    { name: 'declgen', path: tools.declgenPath, version: tools.declgen }
  ];
}

function protocolCase(outcome) {
  const { test, status, result, error, failure } = outcome;
  const output = outputRecord(test, result, error);
  const artifacts = [output.inputPath, output.outputPath, output.repeatOutputPath]
    .filter(item => item && fs.existsSync(item));
  return {
    name: `${name}/${test.id}`,
    group: protocolGroup(test.group),
    direction,
    kind: test.group,
    status,
    failure: failure || null,
    coverage: test.boundary,
    stages: [{ stage: failure?.stage || result?.stage || 'assertion', status }],
    artifacts,
    output,
    toolchain: toolchainList()
  };
}

function checkIsolation(stats, tests) {
  const errors = [];
  const comparisons = [
    ['temporary directories', stats.tempDirectoriesCreated, stats.tempDirectoriesRemoved],
    ['Program releases', stats.programsCreated, stats.programReferencesReleased],
    ['TypeChecker releases', stats.typeCheckersCreated, stats.typeCheckersReleased],
    ['TransformationResult.dispose', stats.handleUIImportsTransforms,
      stats.transformationResultsDisposed],
    ['Declgen state restores', stats.declgenStateSnapshots, stats.declgenStateRestores]
  ];
  for (const [label, created, released] of comparisons) {
    if (created !== released) {
      errors.push(`${label}: ${created} != ${released}`);
    }
  }
  const emit = tests.filter(test => test.group === 'emit').length;
  const declgen = tests.filter(test => test.group === 'declgen').length;
  if (stats.afterDeclarationsCaptures !== emit) {
    errors.push('afterDeclarations capture count mismatch');
  }
  if (stats.declgenRuns !== declgen * 2 || stats.declgenRepeatChecks !== declgen ||
      stats.declgenStateSnapshots !== declgen * 2) {
    errors.push('Declgen repeat or snapshot count mismatch');
  }
  return errors;
}

function infrastructureCase(error, group, index) {
  return {
    name: `${name}/__infrastructure__${index}`,
    group: group === 'all' ? 'unit' : group,
    direction,
    kind: 'infrastructure',
    status: 'failed',
    failure: {
      stage: 'isolation',
      category: 'implementation',
      code: 'ISOLATION_FAILURE',
      message: error,
      details: { classification: 'regression' }
    }
  };
}

function summarize(cases, stats, artifactRoot) {
  return {
    suite: name,
    total: cases.length,
    passed: cases.filter(item => item.status === 'passed').length,
    failed: cases.filter(item => item.status === 'failed').length,
    knownFailureCount: cases.filter(item => item.failure?.category === 'existing').length,
    unexpectedPassCount: cases.filter(item =>
      item.failure?.details?.classification === 'unexpected-pass').length,
    byGroup: cases.reduce((groups, item) => {
      groups[item.group] = (groups[item.group] || 0) + 1;
      return groups;
    }, {}),
    byKind: cases.reduce((kinds, item) => {
      kinds[item.kind] = (kinds[item.kind] || 0) + 1;
      return kinds;
    }, {}),
    stats,
    generatedDeclarations: cases.map(item => item.output).filter(Boolean),
    knownFailures: cases.filter(item => item.failure?.category === 'existing')
      .map(item => ({ name: item.name, failure: item.failure })),
    artifactRoot
  };
}

function runDetailed(options = {}) {
  const group = options.group || 'unit';
  if (options.direction && options.direction !== direction) {
    return { cases: [], summary: undefined, artifactRoot: undefined };
  }
  if (!['all', 'unit', 'compile'].includes(group)) {
    throw new Error(`${name} does not support group ${group}`);
  }
  const parent = options.parent || options.env?.INTEROP_UI_WORK_ROOT || os.tmpdir();
  fs.mkdirSync(parent, { recursive: true });
  const artifactRoot = fs.mkdtempSync(path.join(parent, 'interop-pr05-monitor-'));
  const context = { artifactRoot, stats: initialStats() };
  const normalized = { ...options, group };
  const cases = [];
  let selectedTests = [];
  try {
    selectedTests = collectTests(context).filter(test => matches(test, normalized));
    for (const test of selectedTests) {
      cases.push(protocolCase(executeTest(test)));
    }
  } catch (error) {
    cases.push(infrastructureCase(error.stack || error.message, group, cases.length));
  }
  for (const error of checkIsolation(context.stats, selectedTests)) {
    cases.push(infrastructureCase(error, group, cases.length));
  }
  const summary = summarize(cases, context.stats, artifactRoot);
  const summaryPath = path.join(artifactRoot, 'summary.json');
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  const preserve = options.keepArtifacts || options.keep ||
    options.env?.INTEROP_UI_KEEP_TEMP === '1' || summary.failed > 0;
  if (!preserve) {
    fs.rmSync(artifactRoot, { recursive: true, force: true });
  }
  return { cases, summary, artifactRoot, summaryPath, preserve };
}

function run(options = {}) {
  return runDetailed(options).cases;
}

function printResult(testCase) {
  if (testCase.status === 'passed') {
    console.log(`PASS ${testCase.name} [${testCase.kind}] ${testCase.output.outputPath}`);
    return;
  }
  const failure = testCase.failure;
  const prefix = failure.category === 'existing' ? 'EXISTING' : 'FAIL';
  console.error(`${prefix} ${testCase.name} stage=${failure.stage} ` +
    `category=${failure.category} code=${failure.code}: ${failure.message}`);
  if (failure.details?.evidencePath) {
    console.error(`EVIDENCE ${failure.details.evidencePath}`);
  }
}

function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  if (options.list) {
    const context = { artifactRoot: '', stats: initialStats() };
    for (const test of collectTests(context).filter(test => matches(test, options))) {
      console.log(`${name}/${test.id}\t${protocolGroup(test.group)}\t${test.boundary}`);
    }
    return 0;
  }
  const detailed = runDetailed({ ...options, env: process.env });
  for (const testCase of detailed.cases) {
    printResult(testCase);
  }
  if (detailed.cases.length === 0) {
    console.error('NO_CASES: selection did not match this suite');
    return 1;
  }
  const summary = detailed.summary;
  console.log(`PR05_SUMMARY ${JSON.stringify({
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    existing: summary.knownFailureCount,
    unexpectedPass: summary.unexpectedPassCount,
    byGroup: summary.byGroup,
    byKind: summary.byKind,
    stats: summary.stats,
    artifactRoot: detailed.preserve ? detailed.artifactRoot : '(removed)',
    summaryPath: detailed.preserve ? detailed.summaryPath : '(removed)'
  })}`);
  return summary.failed > 0 ? 1 : 0;
}

if (require.main === module) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 2;
  }
}

module.exports = { name, direction, run, main, parseArguments };
