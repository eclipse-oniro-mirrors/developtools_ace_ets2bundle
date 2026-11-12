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
const { spawnSync } = require('child_process');

const GROUPS = new Set(['unit', 'compile', 'project']);
const DIRECTIONS = new Set(['12-to-11', '11-to-12']);
const DEFAULT_BASE = '590efbcb19bc23c37cfbfab4ed7fc5fcef049179';
const DIFF_RULES = {
  root: 'compiler/test/interop_ui/',
  extensions: new Set(['.js', '.ts']),
  minimumAdded: 2685,
  maximumAdded: 2850,
  weightedMultiplier: 7,
  weightedLimit: 20000
};

function parseArgs(argv) {
  const options = {
    group: 'unit',
    direction: undefined,
    checkDiff: false,
    base: DEFAULT_BASE,
    head: 'WORKTREE',
    help: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--help') {
      options.help = true;
      continue;
    }
    if (argument === '--check-diff') {
      options.checkDiff = true;
      continue;
    }
    const needsValue = ['--group', '--direction', '--base', '--head'];
    if (!needsValue.includes(argument)) {
      throw new Error(`unknown argument: ${argument}`);
    }
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) {
      throw new Error(`${argument} requires a value`);
    }
    const value = argv[index + 1];
    index += 1;
    if (argument === '--group') {
      if (!GROUPS.has(value)) {
        throw new Error(`invalid --group ${value}; expected unit, compile or project`);
      }
      options.group = value;
    } else if (argument === '--direction') {
      if (!DIRECTIONS.has(value)) {
        throw new Error(`invalid --direction ${value}; expected 12-to-11 or 11-to-12`);
      }
      options.direction = value;
    } else if (argument === '--base') {
      options.base = value;
    } else if (argument === '--head') {
      options.head = value;
    }
  }
  if (!options.base || !options.head) {
    throw new Error('--base and --head must not be empty');
  }
  return options;
}

function discoverSuites(rootDirectory = __dirname) {
  const suitesRoot = path.join(rootDirectory, 'suites');
  if (!fs.existsSync(suitesRoot)) {
    return [];
  }
  return fs.readdirSync(suitesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right))
    .map(name => {
      const entryPath = path.join(suitesRoot, name, 'run.js');
      if (!fs.existsSync(entryPath)) {
        throw new Error(`suite ${name} has no run.js`);
      }
      const suite = require(entryPath);
      if (suite.name !== name || typeof suite.run !== 'function') {
        throw new Error(`suite ${name} must export its directory name and run()`);
      }
      return { name, entryPath, run: suite.run };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function validateCaseResult(result, suiteName, options) {
  if (!result || !['passed', 'failed'].includes(result.status)) {
    throw new Error(`${suiteName} returned a case without passed/failed status`);
  }
  for (const field of ['name', 'group', 'direction', 'kind']) {
    if (typeof result[field] !== 'string' || result[field].length === 0) {
      throw new Error(`${suiteName} case is missing ${field}`);
    }
  }
  if (result.group !== options.group) {
    throw new Error(`${suiteName} returned ${result.group} while ${options.group} was selected`);
  }
  if (options.direction && result.direction !== options.direction) {
    throw new Error(`${suiteName} returned an unselected direction ${result.direction}`);
  }
  if (result.status === 'failed') {
    const failure = result.failure;
    if (!failure || !failure.stage || !failure.category || !failure.code || !failure.message) {
      throw new Error(`${suiteName}/${result.name} has an incomplete failure report`);
    }
  }
  return result;
}

function mergeToolchains(cases) {
  const tools = new Map();
  for (const testCase of cases) {
    for (const tool of testCase.toolchain || []) {
      const key = `${tool.name}\0${tool.path}\0${tool.version}`;
      tools.set(key, tool);
    }
    for (const tool of testCase.failure?.details?.tools || []) {
      const key = `${tool.name}\0${tool.path}\0${tool.version}`;
      tools.set(key, tool);
    }
  }
  return Array.from(tools.values()).sort((left, right) =>
    left.name.localeCompare(right.name) || left.path.localeCompare(right.path));
}

function summarizeResults(cases, suiteResults) {
  const summary = {
    effective: cases.length,
    passed: cases.filter(testCase => testCase.status === 'passed').length,
    failed: cases.filter(testCase => testCase.status === 'failed').length,
    toolchains: mergeToolchains(cases),
    kinds: {}
  };
  for (const testCase of cases) {
    if (!summary.kinds[testCase.kind]) {
      summary.kinds[testCase.kind] = { effective: 0, passed: 0, failed: 0 };
    }
    const kind = summary.kinds[testCase.kind];
    kind.effective += 1;
    kind[testCase.status === 'passed' ? 'passed' : 'failed'] += 1;
  }
  summary.suites = suiteResults;
  return summary;
}

function printCase(testCase) {
  const prefix = `${testCase.status === 'passed' ? 'PASS' : 'FAIL'} ${testCase.group}/${testCase.direction}/${testCase.name}`;
  if (testCase.kind !== 'specialized') {
    for (const stage of testCase.stages || []) {
      console.log(`STAGE ${testCase.name} ${stage.stage} ${stage.status}`);
    }
  }
  if (testCase.status === 'passed') {
    console.log(prefix);
    return;
  }
  const failure = testCase.failure;
  console.error(`${prefix} stage=${failure.stage} category=${failure.category} code=${failure.code}`);
  console.error(`  ${failure.message}`);
  if (failure.details?.classification) {
    console.error(`  classification: ${failure.details.classification}`);
  }
  for (const diagnostic of testCase.diagnostics || []) {
    console.error(`  diagnostic ${diagnostic.stage} ${diagnostic.code}: ${diagnostic.message}`);
  }
}

function printSummary(summary, options) {
  for (const suite of summary.suites) {
    console.log(`SUITE ${suite.name} effective=${suite.cases.length} ` +
      `passed=${suite.cases.filter(item => item.status === 'passed').length} ` +
      `failed=${suite.cases.filter(item => item.status === 'failed').length}`);
  }
  for (const [kind, counts] of Object.entries(summary.kinds).sort()) {
    console.log(`KIND ${kind} effective=${counts.effective} passed=${counts.passed} failed=${counts.failed}`);
  }
  for (const tool of summary.toolchains) {
    console.log(`TOOLCHAIN ${tool.name} version=${tool.version} path=${tool.path}`);
  }
  console.log(`TOTAL group=${options.group} direction=${options.direction || 'all'} ` +
    `effective=${summary.effective} passed=${summary.passed} failed=${summary.failed}`);
}

async function runSelectedSuites(options, rootDirectory = __dirname) {
  const suites = discoverSuites(rootDirectory);
  const suiteResults = [];
  for (const suite of suites) {
    const selected = await suite.run({
      group: options.group,
      direction: options.direction,
      env: process.env
    });
    if (!Array.isArray(selected)) {
      throw new Error(`${suite.name} run() must return an array`);
    }
    const cases = selected.map(result => validateCaseResult(result, suite.name, options));
    suiteResults.push({ name: suite.name, cases });
  }
  const cases = suiteResults.flatMap(suite => suite.cases);
  const names = new Set();
  for (const testCase of cases) {
    if (names.has(testCase.name)) {
      throw new Error(`duplicate effective case name: ${testCase.name}`);
    }
    names.add(testCase.name);
    printCase(testCase);
  }
  const summary = summarizeResults(cases, suiteResults);
  printSummary(summary, options);
  if (summary.effective === 0) {
    console.error('NO_CASES: zero effective cases is a failure, not a successful empty run');
    return { summary, exitCode: 1 };
  }
  return { summary, exitCode: summary.failed > 0 ? 1 : 0 };
}

function git(repoRoot, args) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function physicalLines(content) {
  if (content.length === 0) {
    return 0;
  }
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines.length;
}

function isEffectiveLine(line) {
  const trimmed = line.trim();
  return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('/*') &&
    !trimmed.startsWith('*') && trimmed !== '*/';
}

function effectiveAddedLines(patch) {
  let count = 0;
  for (const line of patch.split(/\r?\n/)) {
    if (!line.startsWith('+') || line.startsWith('+++')) {
      continue;
    }
    if (isEffectiveLine(line.slice(1))) {
      count += 1;
    }
  }
  return count;
}

function expandRenamePath(filePath) {
  const brace = filePath.match(/^(.*)\{([^}]*) => ([^}]*)\}(.*)$/);
  if (brace) {
    return [`${brace[1]}${brace[2]}${brace[4]}`, `${brace[1]}${brace[3]}${brace[4]}`];
  }
  if (filePath.includes(' => ')) {
    const [oldPath, newPath] = filePath.split(' => ');
    return [oldPath, newPath];
  }
  return [filePath];
}

function validateDiffPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  if (!normalized.startsWith(DIFF_RULES.root)) {
    return `outside allowed root: ${normalized}`;
  }
  if (!DIFF_RULES.extensions.has(path.extname(normalized))) {
    return `outside .js/.ts scope: ${normalized}`;
  }
  return undefined;
}

function parseNumstat(output) {
  const changes = [];
  for (const line of output.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }
    const fields = line.split('\t');
    if (fields.length !== 3) {
      throw new Error(`invalid numstat line: ${line}`);
    }
    if (fields[0] === '-' || fields[1] === '-') {
      throw new Error(`binary diff is not allowed: ${line}`);
    }
    const paths = expandRenamePath(fields[2]);
    changes.push({
      added: Number(fields[0]),
      deleted: Number(fields[1]),
      paths,
      path: paths[paths.length - 1]
    });
  }
  return changes;
}

function resolveCommit(repoRoot, reference) {
  return git(repoRoot, ['rev-parse', '--verify', `${reference}^{commit}`]).trim();
}

function collectUntrackedChanges(repoRoot) {
  const changes = [];
  const violations = [];
  let effective = 0;
  const untracked = git(repoRoot, ['ls-files', '--others', '--exclude-standard', '-z', '--'])
    .split('\0').filter(Boolean).sort();
  for (const relativePath of untracked) {
    const change = { added: 0, deleted: 0, paths: [relativePath], path: relativePath };
    changes.push(change);
    const stat = fs.lstatSync(path.join(repoRoot, relativePath));
    if (stat.isSymbolicLink()) {
      change.violation = `symbolic link is not allowed: ${relativePath}`;
      violations.push(change.violation);
      continue;
    }
    if (!stat.isFile()) {
      change.violation = `untracked path is not a regular file: ${relativePath}`;
      violations.push(change.violation);
      continue;
    }
    if (validateDiffPath(relativePath)) {
      continue;
    }
    const content = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    const lines = content.split(/\r?\n/);
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    change.added = lines.length;
    effective += lines.filter(isEffectiveLine).length;
  }
  return { changes, effective, violations };
}

function collectDiff(options, repoRoot) {
  const base = resolveCommit(repoRoot, options.base);
  const head = options.head === 'WORKTREE' ? 'WORKTREE' : resolveCommit(repoRoot, options.head);
  const rangeArgs = head === 'WORKTREE' ? [base] : [base, head];
  const numstat = git(repoRoot, ['diff', '--numstat', '--find-renames', ...rangeArgs, '--']);
  const changes = parseNumstat(numstat);
  const patch = git(repoRoot, ['diff', '--unified=0', '--find-renames', ...rangeArgs, '--', DIFF_RULES.root]);
  let effective = effectiveAddedLines(patch);
  const violations = [];
  if (head === 'WORKTREE') {
    const untracked = collectUntrackedChanges(repoRoot);
    changes.push(...untracked.changes);
    effective += untracked.effective;
    violations.push(...untracked.violations);
  }
  return { base, head, changes, effective, violations };
}

function checkDiff(options, repoRoot = path.resolve(__dirname, '../../..')) {
  const report = collectDiff(options, repoRoot);
  const violations = [...(report.violations || [])];
  for (const change of report.changes) {
    if (change.violation) {
      continue;
    }
    for (const changedPath of change.paths) {
      const violation = validateDiffPath(changedPath);
      if (violation) {
        violations.push(violation);
      }
    }
  }
  const scopedChanges = report.changes.filter(change => !change.violation &&
    change.paths.every(changedPath => !validateDiffPath(changedPath)));
  report.added = scopedChanges.reduce((sum, change) => sum + change.added, 0);
  report.deleted = scopedChanges.reduce((sum, change) => sum + change.deleted, 0);
  report.net = report.added - report.deleted;
  report.total = report.added + report.deleted;
  report.weighted = report.effective * DIFF_RULES.weightedMultiplier / 10;
  report.weightedProduct = report.effective * DIFF_RULES.weightedMultiplier;
  if (report.added < DIFF_RULES.minimumAdded || report.added > DIFF_RULES.maximumAdded) {
    violations.push(`added physical lines ${report.added} outside ` +
      `${DIFF_RULES.minimumAdded}-${DIFF_RULES.maximumAdded}`);
  }
  if (report.weightedProduct >= DIFF_RULES.weightedLimit) {
    violations.push(`effective lines * 7 = ${report.weightedProduct}; must be < 20000`);
  }
  report.violations = violations;
  report.ok = violations.length === 0;
  return report;
}

function printDiffReport(report) {
  console.log(`DIFF base=${report.base} head=${report.head}`);
  for (const change of report.changes) {
    console.log(`NUMSTAT ${change.added}\t${change.deleted}\t${change.paths.join(' => ')}`);
  }
  console.log(`LINES added=${report.added} deleted=${report.deleted} net=${report.net} total=${report.total}`);
  console.log(`EFFECTIVE raw=${report.effective} weighted=${report.weighted.toFixed(1)} ` +
    `product=${report.weightedProduct}<20000=${report.weightedProduct < 20000}`);
  for (const violation of report.violations) {
    console.error(`DIFF_VIOLATION ${violation}`);
  }
  console.log(`DIFF_RESULT ${report.ok ? 'PASS' : 'FAIL'}`);
}

function printHelp() {
  console.log(`Usage:
  node test/interop_ui/test.js [--group unit|compile|project] [--direction 12-to-11|11-to-12]
  node test/interop_ui/test.js --check-diff [--base <commit>] [--head <commit>|WORKTREE]

Default group is unit. WORKTREE validates every untracked repository path and rejects symbolic links.
Complete compile/project groups require INTEROP_UI_NODE, INTEROP_UI_HVIGOR and INTEROP_UI_SDK.`);
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return 0;
  }
  if (options.checkDiff) {
    const report = checkDiff(options);
    printDiffReport(report);
    return report.ok ? 0 : 1;
  }
  const result = await runSelectedSuites(options);
  return result.exitCode;
}

if (require.main === module) {
  Promise.resolve().then(() => main()).then(exitCode => {
    process.exitCode = exitCode;
  }).catch(error => {
    console.error(`ENTRY_FAILURE ${error.stack || error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_BASE,
  DIFF_RULES,
  checkDiff,
  collectDiff,
  collectUntrackedChanges,
  discoverSuites,
  effectiveAddedLines,
  expandRenamePath,
  isEffectiveLine,
  main,
  mergeToolchains,
  parseArgs,
  parseNumstat,
  physicalLines,
  printDiffReport,
  runSelectedSuites,
  summarizeResults,
  validateCaseResult,
  validateDiffPath
};
