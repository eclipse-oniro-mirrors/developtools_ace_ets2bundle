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
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const util = require('util');
const SUITE_NAME = 'dynamic_calls_static_basic';
const VALID_GROUPS = new Set(['unit', 'compile', 'project', 'all']);
const VALID_DIRECTION = '11-to-12';
class TestFailure extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'TestFailure';
    this.details = details;
  }
}
function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
  return filePath;
}
function sha256Buffer(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}
function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}
function fileMetadata(filePath) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile()) {
    throw new TestFailure(`Expected a regular file: ${filePath}`);
  }
  return {
    path: filePath,
    bytes: stat.size,
    mtimeMs: stat.mtimeMs,
    birthtimeMs: stat.birthtimeMs,
    sha256: sha256File(filePath)
  };
}
function assertFreshArtifact(filePath, options = {}) {
  const notBeforeMs = options.notBeforeMs ?? 0;
  const minimumBytes = options.minimumBytes ?? 1;
  const metadata = fileMetadata(filePath);
  if (metadata.bytes < minimumBytes) {
    throw new TestFailure(`Artifact is smaller than ${minimumBytes} bytes: ${filePath}`, metadata);
  }
  if (metadata.mtimeMs < notBeforeMs - 1000) {
    throw new TestFailure(`Artifact predates this run: ${filePath}`, {
      notBeforeMs,
      artifact: metadata
    });
  }
  if (metadata.mtimeMs > Date.now() + 5000) {
    throw new TestFailure(`Artifact mtime is unexpectedly in the future: ${filePath}`, metadata);
  }
  if (options.previousHash && options.previousHash === metadata.sha256) {
    throw new TestFailure(`Artifact hash did not change from the previous artifact: ${filePath}`, {
      previousHash: options.previousHash,
      artifact: metadata
    });
  }
  metadata.freshness = {
    notBeforeMs,
    checkedAtMs: Date.now(),
    previousHash: options.previousHash || null,
    accepted: true
  };
  return metadata;
}
function createOutputRoot(requestedRoot) {
  if (requestedRoot) {
    const parent = path.resolve(requestedRoot);
    fs.mkdirSync(parent, { recursive: true });
    return fs.mkdtempSync(path.join(parent, 'run-'));
  }
  return fs.mkdtempSync(path.join(os.tmpdir(), 'interop-ui-pr02-'));
}
function parseArgs(argv) {
  const options = { group: 'unit', direction: VALID_DIRECTION, caseId: '', output: '', help: false };
  const seen = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    const matched = argument.match(/^(--group|--direction|--case|--output)=(.*)$/);
    const flag = matched ? matched[1] : argument;
    if (!['--group', '--direction', '--case', '--output'].includes(flag)) {
      throw new TestFailure(`Unknown argument: ${argument}`);
    }
    if (seen.has(flag)) {
      throw new TestFailure(`Duplicate argument: ${flag}`);
    }
    seen.add(flag);
    const value = matched ? matched[2] : argv[++index];
    if (!value || value.startsWith('--')) {
      throw new TestFailure(`Missing value for ${flag}`);
    }
    if (flag === '--group') {
      options.group = value;
    } else if (flag === '--direction') {
      options.direction = value;
    } else if (flag === '--case') {
      options.caseId = value;
    } else {
      options.output = value;
    }
  }
  if (!VALID_GROUPS.has(options.group)) {
    throw new TestFailure(`Invalid group '${options.group}'; expected unit, compile, project or all`);
  }
  if (options.direction !== VALID_DIRECTION) {
    throw new TestFailure(
      `Invalid direction '${options.direction}'; this suite only supports ${VALID_DIRECTION}`);
  }
  return options;
}
function validateRegistry(cases) {
  if (!Array.isArray(cases)) {
    throw new TestFailure('Suite registry must be an array');
  }
  const identifiers = new Set();
  for (const testCase of cases) {
    if (!testCase || typeof testCase.run !== 'function') {
      throw new TestFailure('Every test case must provide a run function');
    }
    if (!testCase.id || !VALID_GROUPS.has(testCase.group) || testCase.group === 'all') {
      throw new TestFailure(`Invalid case identity: ${JSON.stringify(testCase.id)}`);
    }
    if (testCase.direction !== VALID_DIRECTION) {
      throw new TestFailure(`Unsupported direction in case ${testCase.id}`);
    }
    const fullId = `${testCase.group}/${testCase.id}`;
    if (identifiers.has(fullId)) {
      throw new TestFailure(`Duplicate case id: ${fullId}`);
    }
    identifiers.add(fullId);
  }
  return cases;
}
function selectCases(cases, options) {
  validateRegistry(cases);
  const selected = cases.filter(testCase => {
    const groupMatches = options.group === 'all' || testCase.group === options.group;
    const directionMatches = testCase.direction === options.direction;
    const caseMatches = !options.caseId || testCase.id === options.caseId;
    return groupMatches && directionMatches && caseMatches;
  });
  if (selected.length === 0) {
    throw new TestFailure(
      `Selection produced zero cases for group=${options.group}, ` +
      `direction=${options.direction}, case=${options.caseId || '*'}`);
  }
  return selected;
}
class AssertionContext {
  constructor(testCase, workspace, options) {
    this.testCase = testCase;
    this.workspace = workspace;
    this.options = options;
    this.toolchain = [];
    this.assertions = 0;
    this.evidence = {};
  }
  fail(message, details) {
    throw new TestFailure(message, details);
  }
  ok(value, message = 'Expected value to be truthy') {
    this.assertions += 1;
    if (!value) {
      this.fail(message, { actual: value });
    }
  }
  equal(actual, expected, message = 'Values differ') {
    this.assertions += 1;
    if (actual !== expected) {
      this.fail(message, { actual, expected });
    }
  }
  notEqual(actual, unexpected, message = 'Values must differ') {
    this.assertions += 1;
    if (actual === unexpected) {
      this.fail(message, { actual, unexpected });
    }
  }
  deepEqual(actual, expected, message = 'Structured values differ') {
    this.assertions += 1;
    if (!util.isDeepStrictEqual(actual, expected)) {
      this.fail(message, { actual, expected });
    }
  }
  includes(content, snippet, message = '') {
    this.assertions += 1;
    if (typeof content !== 'string' || !content.includes(snippet)) {
      this.fail(message || `Missing expected snippet: ${snippet}`, { snippet });
    }
  }
  notIncludes(content, snippet, message = '') {
    this.assertions += 1;
    if (typeof content !== 'string' || content.includes(snippet)) {
      this.fail(message || `Unexpected snippet: ${snippet}`, { snippet });
    }
  }
  match(content, expression, message = '') {
    this.assertions += 1;
    if (typeof content !== 'string' || !expression.test(content)) {
      this.fail(message || `Pattern did not match: ${expression}`, {
        pattern: String(expression)
      });
    }
  }
  greater(actual, minimum, message = '') {
    this.assertions += 1;
    if (!(actual > minimum)) {
      this.fail(message || `Expected ${actual} to be greater than ${minimum}`, { actual, minimum });
    }
  }
  throws(action, expected, message = 'Expected action to throw') {
    this.assertions += 1;
    let thrown;
    try {
      action();
    } catch (error) {
      thrown = error;
    }
    if (!thrown) {
      this.fail(message);
    }
    if (expected instanceof RegExp && !expected.test(thrown.message)) {
      this.fail(`Exception did not match ${expected}: ${thrown.message}`);
    }
    if (typeof expected === 'string' && !thrown.message.includes(expected)) {
      this.fail(`Exception did not contain '${expected}': ${thrown.message}`);
    }
    return thrown;
  }
  record(name, value) {
    if (this.evidence[name] !== undefined) {
      this.fail(`Duplicate evidence key: ${name}`);
    }
    this.evidence[name] = value;
    writeJson(path.join(this.workspace, 'evidence', `${name}.json`), value);
    return value;
  }
  freshArtifact(name, filePath, options = {}) {
    this.assertions += 1;
    const metadata = assertFreshArtifact(filePath, options);
    this.record(name, metadata);
    return metadata;
  }
}
function errorDetails(error) {
  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || '',
    details: error.details === undefined ? null : error.details
  };
}
function publicFailure(error) {
  return {
    stage: error.stage || 'assertion',
    category: error.category || 'implementation',
    code: error.code || error.name || 'Error',
    message: error.message || String(error),
    details: error.details || {}
  };
}
async function runCases(selectedCases, options, outputRoot) {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const groups = {};
  const allResults = [];
  for (const testCase of selectedCases) {
    const workspace = path.join(outputRoot, 'work', testCase.group, testCase.id);
    fs.mkdirSync(workspace, { recursive: true });
    const context = new AssertionContext(testCase, workspace, options);
    const caseStart = Date.now();
    let result;
    try {
      const returned = await testCase.run(context);
      result = {
        id: testCase.id,
        name: testCase.id,
        group: testCase.group,
        direction: testCase.direction,
        kind: testCase.group === 'unit' ? 'specialized' : 'full-chain',
        description: testCase.description,
        status: 'passed',
        toolchain: context.toolchain,
        assertions: context.assertions,
        durationMs: Date.now() - caseStart,
        workspace,
        evidence: context.evidence,
        returned: returned === undefined ? null : returned
      };
      if (!options.quiet) {
        console.log(`[PASS] ${testCase.group}/${testCase.id} ` +
          `assertions=${context.assertions} durationMs=${result.durationMs}`);
      }
    } catch (error) {
      result = {
        id: testCase.id,
        name: testCase.id,
        group: testCase.group,
        direction: testCase.direction,
        kind: testCase.group === 'unit' ? 'specialized' : 'full-chain',
        description: testCase.description,
        status: 'failed',
        failure: publicFailure(error),
        toolchain: context.toolchain,
        assertions: context.assertions,
        durationMs: Date.now() - caseStart,
        workspace,
        evidence: context.evidence,
        error: errorDetails(error)
      };
      if (!options.quiet) {
        console.error(`[FAIL] ${testCase.group}/${testCase.id}: ${error.message}`);
      }
    }
    if (result.status === 'passed' && result.assertions === 0) {
      result.status = 'failed';
      result.failure = {
        stage: 'runner',
        category: 'implementation',
        code: 'ZERO_ASSERTIONS',
        message: 'A selected case completed without assertions',
        details: {}
      };
      result.error = {
        name: 'ZeroAssertionFailure',
        message: 'A selected case completed without assertions',
        stack: '',
        details: null
      };
    }
    allResults.push(result);
    if (!groups[testCase.group]) {
      groups[testCase.group] = { total: 0, passed: 0, failed: 0, assertions: 0, cases: [] };
    }
    const group = groups[testCase.group];
    group.total += 1;
    group.assertions += result.assertions;
    group[result.status === 'passed' ? 'passed' : 'failed'] += 1;
    group.cases.push(result);
    writeJson(path.join(outputRoot, `${testCase.group}-report.json`), {
      suite: SUITE_NAME,
      direction: options.direction,
      group: testCase.group,
      ...group
    });
  }
  const summary = {
    suite: SUITE_NAME,
    direction: options.direction,
    selection: { group: options.group, caseId: options.caseId || null },
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
    total: allResults.length,
    passed: allResults.filter(result => result.status === 'passed').length,
    failed: allResults.filter(result => result.status === 'failed').length,
    assertions: allResults.reduce((sum, result) => sum + result.assertions, 0),
    groups,
    cases: allResults,
    outputRoot,
    node: process.version
  };
  if (summary.total === 0) {
    throw new TestFailure('Refusing to report success for zero cases');
  }
  writeJson(path.join(outputRoot, 'summary.json'), summary);
  if (!options.quiet) {
    console.log(`[REPORT] ${path.join(outputRoot, 'summary.json')}`);
    console.log(`[SUMMARY] ${JSON.stringify({
      total: summary.total,
      passed: summary.passed,
      failed: summary.failed,
      assertions: summary.assertions,
      groups: Object.fromEntries(Object.entries(groups).map(([name, group]) => [name, {
        total: group.total,
        passed: group.passed,
        failed: group.failed,
        assertions: group.assertions
      }]))
    })}`);
  }
  return summary;
}
function usage() {
  return [
    'Usage: node run.js [--group unit|compile|project|all]',
    '                  [--direction 11-to-12] [--case <id>] [--output <directory>]',
    '',
    'Environment for compile/project:',
    '  INTEROP_UI_SDK        SDK root (INTEROP_UI_SDK_HOME also accepted)',
    '  INTEROP_UI_NODE       Node executable used for Hvigor',
    '  INTEROP_UI_JAVA_HOME  Java home used by Hvigor',
    '  INTEROP_UI_HVIGOR     hvigorw.js path',
    '  INTEROP_UI_OHPM       ohpm executable path',
    '  INTEROP_UI_UNZIP      optional unzip executable (default: unzip)',
    '  INTEROP_UI_ZIPINFO    optional zipinfo executable (default: zipinfo)',
    '',
    'The output directory is preserved and contains independent group reports.'
  ].join('\n');
}
module.exports = {
  AssertionContext,
  TestFailure,
  VALID_DIRECTION,
  VALID_GROUPS,
  assertFreshArtifact,
  createOutputRoot,
  errorDetails,
  fileMetadata,
  parseArgs,
  runCases,
  selectCases,
  sha256Buffer,
  sha256File,
  usage,
  validateRegistry,
  writeJson
};
