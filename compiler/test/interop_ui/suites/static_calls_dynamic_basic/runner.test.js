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
const {
  DIRECTION,
  assert,
  createWorkspace,
  executeCase,
  safeRelativePath,
  validateFailure
} = require('./harness');
const {
  classifyFirstDiagnostic,
  crc32,
  diagnosticsFromLog,
  hvigorArguments,
  hvigorEnvironment,
  readZipEntries,
  resolveToolchain,
  verifyCallerConfig,
  verifyDeclarationDiagnostics
} = require('./compile.test');
const { materializeProject, projectContract, projectFiles } = require('./project_files');
const { artifactContracts, expectations } = require('./expected_cases');
const { moduleIdentity, specializedCases } = require('./source_cases');
const runner = require('../../test');

const diagnosticFixture = `[INFO] generate Declaration
Fatal error F0014: Unresolved module name for path: ''
[entry/src/main/ets/pages/Index.ets/:3:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*
[entry/src/main/ets/pages/Index.ets/:3:32] Fatal error F0016: Can't find prefix for 'dynamic_component' in /tmp/arktsconfig.json
> hvigor Finished :entry:default@GenerateDeclaration... after 3 s
[INFO] just build
> hvigor Finished :entry:default@CompileStaticArkTS... after 3 s
> hvigor BUILD SUCCESSFUL in 8 s
`;

function storedZip(entries) {
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;
  for (const [name, content] of Object.entries(entries)) {
    const nameBuffer = Buffer.from(name);
    const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
    const checksum = crc32(body);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 10);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(body.length, 22);
    local.writeUInt16LE(nameBuffer.length, 26);
    local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 12);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(body.length, 24);
    central.writeUInt16LE(nameBuffer.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(localOffset, 42);
    localParts.push(local, nameBuffer, body);
    centralParts.push(central, nameBuffer);
    localOffset += local.length + nameBuffer.length + body.length;
  }
  const centralOffset = localOffset;
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(centralParts.length / 2, 8);
  end.writeUInt16LE(centralParts.length / 2, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralOffset, 16);
  return Buffer.concat([...localParts, ...centralParts, end]);
}

function callerConfig(workspace, override = {}) {
  const componentDeclaration = path.join(workspace.root, artifactContracts.componentDeclaration);
  const indexDeclaration = path.join(workspace.root, artifactContracts.indexDeclaration);
  return {
    compilerOptions: {
      package: 'entry',
      dependencies: {
        [moduleIdentity.componentModule]: {
          language: 'js',
          path: componentDeclaration,
          sourceFilePath: path.join(workspace.root, 'dynamic_component/src/main/ets/DynamicCounter.ets'),
          ohmUrl: moduleIdentity.componentOhmUrl
        },
        [moduleIdentity.indexModule]: {
          language: 'js',
          path: indexDeclaration,
          sourceFilePath: path.join(workspace.root, 'dynamic_component/Index.ets'),
          ohmUrl: moduleIdentity.indexOhmUrl
        },
        [moduleIdentity.packageName]: {
          language: 'js',
          path: indexDeclaration,
          sourceFilePath: path.join(workspace.root, 'dynamic_component/Index.ets'),
          ohmUrl: moduleIdentity.indexOhmUrl
        },
        ...override
      }
    }
  };
}

const cases = [
  {
    name: 'runner-defaults-to-repeatable-unit-group',
    body: () => {
      const options = runner.parseArgs([]);
      assert.strictEqual(options.group, 'unit');
      assert.strictEqual(options.direction, undefined);
      assert.strictEqual(options.head, 'WORKTREE');
      assert.strictEqual(options.base, runner.DEFAULT_BASE);
    }
  },
  {
    name: 'runner-supports-all-documented-selectors',
    body: () => {
      for (const group of ['unit', 'compile', 'project']) {
        for (const direction of ['12-to-11', '11-to-12']) {
          const options = runner.parseArgs(['--group', group, '--direction', direction]);
          assert.strictEqual(options.group, group);
          assert.strictEqual(options.direction, direction);
        }
      }
      const diff = runner.parseArgs(['--check-diff', '--base', 'abc', '--head', 'def']);
      assert.strictEqual(diff.checkDiff, true);
      assert.strictEqual(diff.base, 'abc');
      assert.strictEqual(diff.head, 'def');
    }
  },
  {
    name: 'runner-rejects-invalid-and-missing-arguments',
    body: () => {
      for (const args of [
        ['--group', 'unknown'], ['--direction', 'static'], ['--group'],
        ['--base'], ['--head'], ['--unknown']
      ]) {
        assert.throws(() => runner.parseArgs(args), /invalid|requires|unknown/);
      }
    }
  },
  {
    name: 'runner-discovers-suite-entrypoints-in-deterministic-order',
    body: context => {
      const root = context.workspace.root;
      for (const name of ['z-last', 'a-first', 'm-middle']) {
        context.workspace.write(`suites/${name}/run.js`,
          `module.exports = { name: '${name}', run: async () => [] };\n`);
      }
      context.workspace.write('suites/not-a-suite.txt', 'ignored');
      const discovered = runner.discoverSuites(root).map(suite => suite.name);
      assert.deepStrictEqual(discovered, ['a-first', 'm-middle', 'z-last']);
      assert.deepStrictEqual(runner.discoverSuites(root).map(suite => suite.name), discovered);
    }
  },
  {
    name: 'runner-never-treats-zero-effective-cases-as-success',
    body: async context => {
      const messages = [];
      const originalLog = console.log;
      const originalError = console.error;
      console.log = message => messages.push(String(message));
      console.error = message => messages.push(String(message));
      try {
        const result = await runner.runSelectedSuites({ group: 'unit' }, context.workspace.root);
        assert.strictEqual(result.summary.effective, 0);
        assert.strictEqual(result.exitCode, 1);
        assert.ok(messages.some(message => message.includes('NO_CASES')));
      } finally {
        console.log = originalLog;
        console.error = originalError;
      }
    }
  },
  {
    name: 'runner-summarizes-specialized-and-full-chain-results-separately',
    body: () => {
      const cases = [
        { name: 'a', group: 'unit', direction: DIRECTION, kind: 'specialized', status: 'passed' },
        { name: 'b', group: 'unit', direction: DIRECTION, kind: 'full-chain', status: 'failed',
          failure: { stage: 's', category: 'existing', code: 'c', message: 'm' },
          toolchain: [{ name: 'sdk', path: '/sdk', version: '1' }] }
      ];
      const summary = runner.summarizeResults(cases, [{ name: 'suite', cases }]);
      assert.strictEqual(summary.effective, 2);
      assert.strictEqual(summary.passed, 1);
      assert.strictEqual(summary.failed, 1);
      assert.deepStrictEqual(summary.kinds.specialized, { effective: 1, passed: 1, failed: 0 });
      assert.deepStrictEqual(summary.kinds['full-chain'], { effective: 1, passed: 0, failed: 1 });
      assert.strictEqual(summary.toolchains.length, 1);
    }
  },
  {
    name: 'runner-requires-explicit-failure-stage-and-category',
    body: () => {
      assert.throws(() => runner.validateCaseResult({
        name: 'bad', group: 'unit', direction: DIRECTION, kind: 'specialized', status: 'failed'
      }, 'suite', { group: 'unit' }), /incomplete failure/);
      assert.throws(() => validateFailure({ stage: 'x', category: 'unknown', code: 'c' }), /category/);
    }
  },
  {
    name: 'diff-check-enforces-root-extensions-and-demo-preservation',
    body: () => {
      assert.strictEqual(runner.validateDiffPath('compiler/test/interop_ui/test.js'), undefined);
      assert.strictEqual(runner.validateDiffPath('compiler/test/interop_ui/suites/a/run.ts'), undefined);
      assert.match(runner.validateDiffPath('compiler/test/interop_ui/package.json'), /scope/);
      assert.match(runner.validateDiffPath('compiler/test/interop_ui/demo/index.d.ets'), /scope/);
      assert.match(runner.validateDiffPath('compiler/src/process_interop_ui.ts'), /root/);
    }
  },
  {
    name: 'diff-check-rejects-outside-untracked-and-symlinks',
    body: context => {
      const root = context.workspace.root;
      const initialized = spawnSync('git', ['init', '--quiet'], { cwd: root });
      assert.strictEqual(initialized.status, 0, initialized.stderr);
      context.workspace.write('compiler/test/interop_ui/new.js', 'const valid = true;\n');
      context.workspace.write('compiler/outside.js', 'const invalid = true;\n');
      fs.symlinkSync('outside.js', path.join(root, 'compiler/node_modules'));
      const report = runner.collectUntrackedChanges(root);
      const paths = report.changes.map(change => change.path);
      assert.ok(paths.includes('compiler/outside.js'));
      assert.ok(paths.includes('compiler/node_modules'));
      assert.ok(paths.includes('compiler/test/interop_ui/new.js'));
      assert.strictEqual(report.changes.find(change => change.path === 'compiler/outside.js').added, 0);
      assert.match(report.violations.join('\n'), /symbolic link.*compiler\/node_modules/);
      assert.strictEqual(report.effective, 1);
    }
  },
  {
    name: 'diff-check-retains-both-sides-of-renames',
    body: () => {
      assert.deepStrictEqual(runner.expandRenamePath('compiler/test/interop_ui/{old => new}/run.js'), [
        'compiler/test/interop_ui/old/run.js', 'compiler/test/interop_ui/new/run.js'
      ]);
      assert.deepStrictEqual(runner.expandRenamePath('old.js => new.js'), ['old.js', 'new.js']);
      const changes = runner.parseNumstat('10\t2\tcompiler/test/interop_ui/{a => b}/run.js\n');
      assert.deepStrictEqual(changes[0].paths, [
        'compiler/test/interop_ui/a/run.js', 'compiler/test/interop_ui/b/run.js'
      ]);
      assert.throws(() => runner.parseNumstat('-\t-\timage.png\n'), /binary/);
    }
  },
  {
    name: 'diff-check-counts-effective-lines-with-integer-arithmetic',
    body: () => {
      const patch = '@@ -0,0 +1,5 @@\n+const x = 1;\n+\n+// comment\n+ * license\n+const y = 2;\n';
      assert.strictEqual(runner.effectiveAddedLines(patch), 2);
      assert.strictEqual(runner.isEffectiveLine(' const value = 1; '), true);
      assert.strictEqual(runner.isEffectiveLine('   '), false);
      assert.strictEqual(runner.physicalLines('a\nb\n'), 2);
      assert.ok(2850 * 7 < 20000);
    }
  },
  {
    name: 'diagnostic-parser-preserves-first-generate-declaration-failure',
    body: () => {
      const diagnostics = diagnosticsFromLog(diagnosticFixture);
      assert.deepStrictEqual(diagnostics.map(item => item.code), ['F0014', 'ESE0360', 'F0016']);
      assert.strictEqual(diagnostics[0].stage, 'GenerateDeclaration');
      const first = classifyFirstDiagnostic(diagnostics);
      assert.strictEqual(first.category, 'existing');
      assert.strictEqual(first.code, 'F0014');
    }
  },
  {
    name: 'build-success-text-does-not-mask-declaration-errors',
    body: () => {
      assert.throws(() => verifyDeclarationDiagnostics({ output: diagnosticFixture }), error => {
        assert.strictEqual(error.stage, 'GenerateDeclaration');
        assert.strictEqual(error.category, 'existing');
        assert.strictEqual(error.code, 'F0014');
        return true;
      });
    }
  },
  {
    name: 'unknown-compiler-diagnostic-remains-an-implementation-failure',
    body: () => {
      const first = classifyFirstDiagnostic(diagnosticsFromLog(
        '[INFO] just build\nFatal error F0999: new compiler regression\n'));
      assert.strictEqual(first.stage, 'CompileStaticArkTS');
      assert.strictEqual(first.category, 'implementation');
      assert.strictEqual(first.code, 'F0999');
    }
  },
  {
    name: 'toolchain-adapter-uses-environment-paths-without-machine-defaults',
    body: context => {
      const toolchain = resolveToolchain({
        INTEROP_UI_NODE: '/custom/node',
        INTEROP_UI_HVIGOR: '/custom/hvigorw.js',
        INTEROP_UI_SDK: '/custom/sdk',
        INTEROP_UI_JAVA_HOME: '/custom/java'
      });
      assert.strictEqual(toolchain.node, '/custom/node');
      assert.strictEqual(toolchain.hvigor, '/custom/hvigorw.js');
      assert.strictEqual(toolchain.sdkRoot, '/custom/sdk');
      assert.strictEqual(toolchain.javaHome, '/custom/java');
      assert.ok(toolchain.staticDisassembler.startsWith('/custom/sdk/'));
      assert.ok(!JSON.stringify(toolchain).includes('/Users/'));
      const input = { PATH: '/bin', HOME: '/user/home', HVIGOR_USER_HOME: '/user/hvigor' };
      const env = hvigorEnvironment(toolchain, context.workspace, input);
      for (const key of ['HOME', 'USERPROFILE', 'HVIGOR_USER_HOME', 'XDG_CACHE_HOME', 'WORKSPACE_DIR']) {
        assert.ok(env[key].startsWith(context.workspace.root), `${key} must be workspace-local`);
      }
      assert.strictEqual(input.HOME, '/user/home');
      assert.strictEqual(input.HVIGOR_USER_HOME, '/user/hvigor');
      assert.deepStrictEqual(env.PATH.split(path.delimiter), ['/custom', '/custom/java/bin', '/bin']);
    }
  },
  {
    name: 'hvigor-command-selects-product-module-target-and-fresh-tasks',
    body: () => {
      const args = hvigorArguments();
      const contract = projectContract();
      assert.ok(args.includes(`product=${contract.product}`));
      assert.ok(args.includes(`module=${contract.module}@${contract.target}`));
      assert.ok(args.includes(`buildMode=${contract.buildMode}`));
      assert.deepStrictEqual(args.slice(-3), ['clean', 'assembleHap', '--no-daemon']);
    }
  },
  {
    name: 'project-materialization-contains-real-two-language-sources',
    body: context => {
      const project = materializeProject(context.workspace, '/selected/sdk');
      const caller = fs.readFileSync(project.entrySource, 'utf8');
      const callee = fs.readFileSync(project.calleeSource, 'utf8');
      assert.ok(caller.startsWith(`'use static'`));
      assert.ok(caller.includes(`import { DynamicCounter } from 'dynamic_component';`));
      assert.ok(caller.includes('DynamicCounter()'));
      assert.ok(callee.includes('@Component'));
      assert.ok(callee.includes('export struct DynamicCounter'));
      assert.ok(fs.existsSync(path.join(context.workspace.root, 'entry/oh_modules/dynamic_component')));
      assert.ok(project.fileCount > 15);
    }
  },
  {
    name: 'project-strings-use-selected-sdk-not-the-reference-machine',
    body: () => {
      const files = projectFiles('/another/sdk root');
      assert.strictEqual(files['local.properties'], 'sdk.dir=/another/sdk root\n');
      assert.ok(!JSON.stringify(files).includes('/Users/lxc/'));
      assert.ok(files['build-profile.json5'].includes('"arkTSVersion": "1.2"'));
      assert.ok(files['entry/oh-package.json5'].includes('file:../dynamic_component'));
    }
  },
  {
    name: 'workspace-paths-are-isolated-and-cannot-escape',
    body: () => {
      const first = createWorkspace('isolation-a');
      const second = createWorkspace('isolation-b');
      try {
        assert.notStrictEqual(first.root, second.root);
        first.write('input/value.txt', 'first');
        assert.strictEqual(fs.existsSync(path.join(second.root, 'input/value.txt')), false);
        assert.throws(() => safeRelativePath('../outside'), /escapes/);
        assert.throws(() => safeRelativePath('/absolute'), /absolute/);
      } finally {
        first.cleanup();
        second.cleanup();
      }
    }
  },
  {
    name: 'zip-reader-validates-stored-abc-entries-and-crc',
    body: () => {
      const staticAbc = Buffer.concat([Buffer.from('PANDA\0\0\0'), Buffer.from('static caller')]);
      const dynamicAbc = Buffer.concat([Buffer.from('PANDA\0\0\0'), Buffer.from('dynamic callee')]);
      const archive = storedZip({
        'ets/modules_static.abc': staticAbc,
        'ets/modules.abc': dynamicAbc
      });
      const entries = readZipEntries(archive);
      assert.deepStrictEqual(entries.get('ets/modules_static.abc'), staticAbc);
      assert.deepStrictEqual(entries.get('ets/modules.abc'), dynamicAbc);
      const corrupted = Buffer.from(archive);
      corrupted[30 + Buffer.byteLength('ets/modules_static.abc')] ^= 0xff;
      assert.throws(() => readZipEntries(corrupted), /CRC|size mismatch/);
    }
  },
  {
    name: 'arktsconfig-check-resolves-current-declgen-v2-and-module-identities',
    body: context => {
      context.workspace.write(artifactContracts.componentDeclaration, 'component');
      context.workspace.write(artifactContracts.indexDeclaration, 'index');
      context.workspace.write(artifactContracts.callerConfig, JSON.stringify(callerConfig(context.workspace)));
      const verified = verifyCallerConfig(context.workspace);
      assert.strictEqual(verified.dependencies.length, 3);
      assert.strictEqual(verified.dependencies[0].ohmUrl, moduleIdentity.componentOhmUrl);
      assert.strictEqual(verified.dependencies[2].language, 'js');
    }
  },
  {
    name: 'arktsconfig-check-rejects-stale-declaration-mappings',
    body: context => {
      context.workspace.write(artifactContracts.componentDeclaration, 'component');
      context.workspace.write(artifactContracts.indexDeclaration, 'index');
      const config = callerConfig(context.workspace);
      config.compilerOptions.dependencies[moduleIdentity.packageName].path = '/stale/Index.d.ets';
      context.workspace.write(artifactContracts.callerConfig, JSON.stringify(config));
      assert.throws(() => verifyCallerConfig(context.workspace), /path|expected|actual/i);
    }
  },
  {
    name: 'source-and-expectation-registries-cover-distinct-branches',
    body: () => {
      const ids = specializedCases.map(item => item.id);
      assert.strictEqual(new Set(ids).size, ids.length);
      for (const sourceCase of specializedCases) {
        const expectation = expectations[sourceCase.expectation];
        assert.ok(expectation, sourceCase.expectation);
        assert.ok(expectation.required.length > 0);
        assert.ok(sourceCase.source.includes(`'use static'`));
      }
      assert.ok(ids.includes('dynamic-prop-preserved'));
      assert.ok(ids.includes('monitor-array-idempotent'));
    }
  }
];

async function runRunnerUnits(options = {}) {
  const results = [];
  for (const testCase of cases) {
    results.push(await executeCase({
      name: testCase.name,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: 'entry, isolation, diagnostics, artifact and adapter contract'
    }, testCase.body, options));
  }
  return results;
}

module.exports = {
  callerConfig,
  diagnosticFixture,
  runRunnerUnits,
  storedZip
};
