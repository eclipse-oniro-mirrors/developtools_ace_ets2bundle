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
const {
  DIRECTION,
  StageFailure,
  assert,
  createWorkspace,
  executeCase
} = require('../static_calls_dynamic_basic/harness');
const { resolveToolchain } = require('../static_calls_dynamic_basic/compile.test');
const { artifactContracts } = require('./expected_cases');
const { callerLocations, materializeProject, staticCaller } = require('./project_files');
const {
  associatedConsumersFor, callerArguments, moduleIdentity, precompileScenario, scenarios
} = require('./source_cases');
const {
  assertBinaryArtifact,
  declarationPaths,
  expectedDiagnosticLine,
  prepareRepositoryProjection,
  primaryFailure,
  sourceDiagnostics,
  toolchainReport,
  verifyCallerConfig,
  verifyExpectedStaticDiagnostic,
  verifyGenerateDeclaration,
  verifyHvigorExit,
  verifyRepositoryCompile
} = require('./compile.test');
const { verifyCallerValueContracts } = require('./full_chain_runner');

const declarationFailureLog = `[INFO] generate Declaration
Fatal error F0014: Unresolved module name for path: ''
[entry/src/main/ets/pages/Index.ets/:3:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*
[entry/src/main/ets/pages/Index.ets/:3:32] Fatal error F0016: Can't find prefix for 'dynamic_component' in /tmp/arktsconfig.json
> hvigor Finished :entry:default@GenerateDeclaration... after 3 s
> hvigor BUILD SUCCESSFUL in 8 s
`;

function scenario(id) {
  const testCase = scenarios.find(item => item.id === `pr06-${id}`);
  assert.ok(testCase, `missing scenario ${id}`);
  return testCase;
}

function typedDiagnostic(testCase, overrides = {}) {
  return {
    stage: 'CompileStaticArkTS', code: 'ESE2322',
    message: testCase.expectedStaticDiagnostic.messageFragments.join(' and ') + ' are incompatible',
    file: 'entry/src/main/ets/pages/Index.ets', line: expectedDiagnosticLine(testCase), column: 9,
    ...overrides
  };
}

function declarationMap(workspace) {
  const componentOhm = '@normalized:N&&&dynamic_component/src/main/ets/PropertyCard&';
  const indexOhm = '@normalized:N&&&dynamic_component/Index&';
  return {
    packageName: 'dynamic_component',
    files: {
      'src/main/ets/PropertyCard': { declPath: path.join(workspace.root, 'stale/PropertyCard.d.ets'), ohmUrl: componentOhm },
      Index: { declPath: path.join(workspace.root, 'stale/Index.d.ets'), ohmUrl: indexOhm }
    }
  };
}

function projectionModules() {
  return [
    { packageName: 'dynamic_component', declgenV2OutPath: '/stale/declgen' },
    { packageName: 'unrelated', declgenV2OutPath: '/keep/declgen' }
  ];
}

function projectionConfig() {
  return {
    cachePath: '/stale/cache', loaderOutPath: '/stale/static', aceModuleBuild: '/stale/dynamic',
    dependentModuleList: projectionModules(),
    dependencyModuleList: projectionModules()
  };
}

function seedProjection(workspace) {
  workspace.write(artifactContracts.declarationMap, JSON.stringify(declarationMap(workspace)));
  workspace.write(artifactContracts.projectionConfig, JSON.stringify(projectionConfig()));
}

function callerDependency(filePath, sourceFilePath, ohmUrl) {
  return { language: 'js', path: filePath, sourceFilePath, ohmUrl };
}

function callerConfig(workspace, testCase) {
  const paths = declarationPaths(workspace, true);
  const identity = moduleIdentity(testCase);
  const sourcePath = path.join(workspace.root, 'dynamic_component/src/main/ets/PropertyCard.ets');
  const indexSource = path.join(workspace.root, 'dynamic_component/Index.ets');
  return {
    compilerOptions: {
      package: 'entry',
      dependencies: {
        [identity.componentModule]: callerDependency(paths.componentDeclaration, sourcePath, identity.componentOhmUrl),
        [identity.indexModule]: callerDependency(paths.indexDeclaration, indexSource, identity.indexOhmUrl),
        [identity.packageName]: callerDependency(paths.indexDeclaration, indexSource, identity.indexOhmUrl)
      }
    }
  };
}

function seedCallerConfig(workspace, testCase) {
  const paths = declarationPaths(workspace, true);
  workspace.write(path.relative(workspace.root, paths.componentDeclaration), `'use static'\n`);
  workspace.write(path.relative(workspace.root, paths.indexDeclaration), `'use static'\n`);
  workspace.write('dynamic_component/src/main/ets/PropertyCard.ets', '@Component\n');
  workspace.write('dynamic_component/Index.ets', 'export {}\n');
  const config = callerConfig(workspace, testCase);
  workspace.write(path.relative(workspace.root, paths.configPath), JSON.stringify(config));
  return config;
}

const adapterCases = [
  {
    id: 'pr06-adapter-diagnostic-location-parser',
    coverage: 'compiler diagnostics retain stage, code, message, source file, line and column',
    body: () => {
      const log = `[INFO] just build\n` +
        `[entry/src/main/ets/pages/Index.ets/:17:9] Semantic error ESE2322: string is not number\n`;
      const diagnostics = sourceDiagnostics(log);
      assert.strictEqual(diagnostics.length, 1);
      assert.deepStrictEqual(diagnostics[0], {
        stage: 'CompileStaticArkTS', code: 'ESE2322', message: 'string is not number',
        file: 'entry/src/main/ets/pages/Index.ets', line: 17, column: 9, logLine: 2
      });
    }
  },
  {
    id: 'pr06-adapter-diagnostic-stage-and-ansi',
    coverage: 'ANSI decoration and task transitions do not change the first diagnostic source identity',
    body: () => {
      const log = `[INFO] generate Declaration\n` +
        `\u001b[31m[entry/src/main/ets/pages/Index.ets/:3:1] Fatal error F0014: unresolved\u001b[0m\n` +
        `[INFO] just build\n` +
        `[entry/src/main/ets/pages/Index.ets/:8:7] Semantic error ESE2000: wrong type\n`;
      const diagnostics = sourceDiagnostics(log);
      assert.deepStrictEqual(diagnostics.map(item => item.stage), ['GenerateDeclaration', 'CompileStaticArkTS']);
      assert.deepStrictEqual(diagnostics.map(item => item.code), ['F0014', 'ESE2000']);
      assert.strictEqual(diagnostics[0].file, 'entry/src/main/ets/pages/Index.ets');
      assert.strictEqual(diagnostics[1].line, 8);
    }
  },
  {
    id: 'pr06-adapter-detailed-diagnostic-parser',
    coverage: 'SDK two-line ESE0319 diagnostics preserve property type evidence and absolute caller source spans',
    body: () => {
      const log = `[INFO] just build\n` +
        `1 ERROR: Semantic error ESE0319\n` +
        `Error Message: Type '"wrong"' is not compatible with type 'undefined|Double' at property 'count' ` +
        `At File: /tmp/project/entry/src/main/ets/pages/Index.ets:14:16\n`;
      const diagnostics = sourceDiagnostics(log);
      assert.strictEqual(diagnostics.length, 1);
      assert.strictEqual(diagnostics[0].code, 'ESE0319');
      assert.strictEqual(diagnostics[0].file, '/tmp/project/entry/src/main/ets/pages/Index.ets');
      assert.strictEqual(diagnostics[0].line, 14);
      assert.strictEqual(diagnostics[0].column, 16);
      assert.ok(diagnostics[0].message.includes(`property 'count'`));
      assert.ok(diagnostics[0].message.includes('undefined|Double'));
      assert.ok(!diagnostics[0].message.includes('At File:'));
    }
  },
  {
    id: 'pr06-adapter-diagnostic-without-source-is-explicit',
    coverage: 'a compiler failure without a source span remains visible but cannot satisfy a source-located expectation',
    body: () => {
      const diagnostics = sourceDiagnostics('Fatal error F0999: backend failed\n');
      assert.strictEqual(diagnostics.length, 1);
      assert.strictEqual(diagnostics[0].file, undefined);
      assert.strictEqual(diagnostics[0].line, undefined);
      assert.strictEqual(diagnostics[0].message, 'backend failed');
    }
  },
  {
    id: 'pr06-adapter-expected-type-diagnostic',
    coverage: 'a wrong number argument matches its independent message and exact caller-line expectation',
    body: () => {
      const testCase = scenario('number-rejects-string');
      const diagnostic = typedDiagnostic(testCase);
      const verified = verifyExpectedStaticDiagnostic(testCase, {
        status: 1,
        diagnostics: [diagnostic]
      });
      assert.strictEqual(verified, diagnostic);
      assert.strictEqual(verified.line, callerLocations(testCase).argumentLines.count);
    }
  },
  {
    id: 'pr06-adapter-missing-type-diagnostic',
    coverage: 'successful task text or an unrelated error cannot satisfy a missing primitive mismatch',
    body: () => {
      const testCase = scenario('string-rejects-number');
      assert.throws(() => verifyExpectedStaticDiagnostic(testCase, {
        status: 0,
        diagnostics: [typedDiagnostic(testCase, { message: 'unrelated backend failure' })]
      }), error => error.code === 'EXPECTED_TYPE_DIAGNOSTIC_MISSING');
    }
  },
  {
    id: 'pr06-adapter-diagnostic-line-mismatch',
    coverage: 'the right diagnostic message on the wrong source line is still a failed location assertion',
    body: () => {
      const testCase = scenario('boolean-rejects-number');
      assert.throws(() => verifyExpectedStaticDiagnostic(testCase, {
        status: 1,
        diagnostics: [typedDiagnostic(testCase, { line: expectedDiagnosticLine(testCase) + 1 })]
      }), error => error.code === 'DIAGNOSTIC_LINE_MISMATCH');
    }
  },
  {
    id: 'pr06-adapter-diagnostic-column-required',
    coverage: 'source-located negative cases require a real column rather than only a file name',
    body: () => {
      const testCase = scenario('optional-number-rejects-string');
      assert.throws(() => verifyExpectedStaticDiagnostic(testCase, {
        status: 1,
        diagnostics: [typedDiagnostic(testCase, { column: undefined })]
      }), /column/);
    }
  },
  {
    id: 'pr06-adapter-nondefault-omission-support',
    coverage: 'SDK-supported omission of a nonoptional number has no argument span and produces a valid static consumer',
    body: () => {
      const testCase = scenario('required-number-omitted');
      const locations = callerLocations(testCase);
      assert.strictEqual(locations.argumentLines.count, undefined);
      assert.ok(locations.componentCallLine > 0);
      assert.deepStrictEqual(callerArguments(testCase), []);
      assert.strictEqual(testCase.expectedStaticDiagnostic, undefined);
      assert.strictEqual(verifyRepositoryCompile(testCase, {
        status: 0,
        output: 'compile succeeded',
        diagnostics: []
      }), undefined);
    }
  },
  {
    id: 'pr06-adapter-positive-compile-rejects-diagnostics',
    coverage: 'exit code zero cannot hide a semantic diagnostic for a valid property consumer',
    body: () => {
      const testCase = scenario('required-number');
      assert.strictEqual(verifyRepositoryCompile(testCase, {
        status: 0,
        output: 'compile succeeded',
        diagnostics: []
      }), undefined);
      assert.throws(() => verifyRepositoryCompile(testCase, {
        status: 0,
        output: 'BUILD SUCCESSFUL with diagnostic',
        diagnostics: [{
          code: 'ESE2999', message: 'semantic failure', file: 'Index.ets', line: 1, column: 1
        }]
      }), error => error.code === 'ESE2999');
    }
  },
  {
    id: 'pr06-adapter-hvigor-success-does-not-mask-f0014',
    coverage: 'known GenerateDeclaration F0014 stays an existing nonzero failure even with BUILD SUCCESSFUL text',
    body: () => {
      assert.throws(() => verifyGenerateDeclaration({ output: declarationFailureLog }), error => {
        assert.strictEqual(error.stage, 'GenerateDeclaration');
        assert.strictEqual(error.category, 'existing');
        assert.strictEqual(error.code, 'F0014');
        assert.ok(error.message.includes("Unresolved module name for path: ''"));
        return true;
      });
    }
  },
  {
    id: 'pr06-adapter-hvigor-exit-failure',
    coverage: 'a real nonzero Hvigor process failure is not converted into a successful package-only result',
    body: () => {
      assert.throws(() => verifyHvigorExit({
        status: 2,
        signal: null,
        output: 'driver failed'
      }), error => error.code === 'HVIGOR_BUILD_FAILED' && error.category === 'implementation');
      assert.strictEqual(verifyHvigorExit({ status: 0, output: 'ok' }), undefined);
    }
  },
  {
    id: 'pr06-adapter-primary-failure-priority',
    coverage: 'new assertion failures take priority over a baseline existing failure while existing-only runs stay nonzero',
    body: () => {
      const existing = new StageFailure('GenerateDeclaration', 'existing', 'F0014', 'baseline');
      const regression = new Error('new property assertion');
      assert.strictEqual(primaryFailure([existing, regression]), regression);
      assert.strictEqual(primaryFailure([existing]), existing);
    }
  },
  {
    id: 'pr06-adapter-declaration-paths',
    coverage: 'repository consumption paths point to current PropertyCard declarations, arktsconfig and static ABC',
    body: context => {
      const paths = declarationPaths(context.workspace, true);
      assert.ok(paths.componentDeclaration.endsWith('repositoryDeclgenV2/src/main/ets/PropertyCard.d.ets'));
      assert.ok(paths.indexDeclaration.endsWith('repositoryDeclgenV2/Index.d.ets'));
      assert.ok(paths.configPath.endsWith('repository-consume/cache/entry/arktsconfig.json'));
      assert.ok(paths.staticAbc.endsWith('repository-consume/ets/modules_static.abc'));
      assert.ok(paths.projectionPath.endsWith('repository-consume/projection.json'));
    }
  },
  {
    id: 'pr06-adapter-projection-current-declarations',
    coverage: 'both dependency lists and the declaration map switch from stale SDK outputs to repository DeclfileProductor outputs',
    body: context => {
      seedProjection(context.workspace);
      const paths = prepareRepositoryProjection(context.workspace);
      const projection = JSON.parse(fs.readFileSync(paths.projectionPath, 'utf8'));
      for (const key of ['dependentModuleList', 'dependencyModuleList']) {
        const dynamic = projection[key].find(module => module.packageName === 'dynamic_component');
        const unrelated = projection[key].find(module => module.packageName === 'unrelated');
        assert.strictEqual(dynamic.declgenV2OutPath, paths.outputRoot);
        assert.strictEqual(dynamic.declFilesPath, paths.declarationMap);
        assert.strictEqual(unrelated.declgenV2OutPath, '/keep/declgen');
      }
      const map = JSON.parse(fs.readFileSync(paths.declarationMap, 'utf8'));
      assert.strictEqual(map.files['src/main/ets/PropertyCard'].declPath, paths.componentDeclaration);
      assert.strictEqual(map.files.Index.declPath, paths.indexDeclaration);
      assert.strictEqual(projection.es2pandaMode, 'simultaneous');
    }
  },
  {
    id: 'pr06-adapter-projection-rejects-partial-map',
    coverage: 'a missing Index mapping fails before the static compiler can silently consume stale declarations',
    body: context => {
      const map = declarationMap(context.workspace);
      delete map.files.Index;
      context.workspace.write(artifactContracts.declarationMap, JSON.stringify(map));
      context.workspace.write(artifactContracts.projectionConfig, JSON.stringify(projectionConfig()));
      assert.throws(() => prepareRepositoryProjection(context.workspace), /Index source identity/);
    }
  },
  {
    id: 'pr06-adapter-arktsconfig-consumption',
    coverage: 'component, barrel and package dependencies consume current declarations with dynamic JS and OHM identities',
    body: context => {
      const testCase = scenario('required-number');
      seedCallerConfig(context.workspace, testCase);
      const verified = verifyCallerConfig(context.workspace, testCase);
      assert.strictEqual(verified.dependencies.length, 3);
      assert.strictEqual(verified.dependencies[0].language, 'js');
      assert.strictEqual(verified.dependencies[0].ohmUrl, moduleIdentity(testCase).componentOhmUrl);
      assert.strictEqual(verified.dependencies[2].path, declarationPaths(context.workspace, true).indexDeclaration);
    }
  },
  {
    id: 'pr06-adapter-arktsconfig-stale-rejection',
    coverage: 'a stale package declaration path is rejected even when component and direct Index mappings are correct',
    body: context => {
      const testCase = scenario('default-number-omitted');
      const config = seedCallerConfig(context.workspace, testCase);
      config.compilerOptions.dependencies.dynamic_component.path = '/stale/Index.d.ets';
      const paths = declarationPaths(context.workspace, true);
      context.workspace.write(path.relative(context.workspace.root, paths.configPath), JSON.stringify(config));
      assert.throws(() => verifyCallerConfig(context.workspace, testCase), /path|expected|actual/i);
    }
  },
  {
    id: 'pr06-adapter-abc-header-and-presence',
    coverage: 'ABC checks require a nonempty PANDA binary before invoking the matching disassembler',
    body: context => {
      const valid = context.workspace.write('valid.abc', Buffer.concat([
        Buffer.from('PANDA\0\0\0'), Buffer.from('property caller')
      ]));
      assert.ok(assertBinaryArtifact(valid, 'static-abc').length > 8);
      const invalid = context.workspace.write('invalid.abc', 'not an ABC');
      assert.throws(() => assertBinaryArtifact(invalid, 'static-abc'), /wrong ABC header/);
      assert.throws(() => assertBinaryArtifact(path.join(context.workspace.root, 'missing.abc'), 'static-abc'),
        error => error.code === 'MISSING_BINARY_ARTIFACT');
    }
  },
  {
    id: 'pr06-adapter-public-order-registry',
    coverage: 'public number, string and boolean properties have an explicit source order for declaration comparison',
    body: () => {
      const names = scenario('public-property-order').properties.map(property => property.name);
      assert.deepStrictEqual(names, ['firstCount', 'secondTitle', 'thirdEnabled']);
    }
  },
  {
    id: 'pr06-adapter-missing-toolchain-is-environment',
    coverage: 'missing compiler executables produce an explicit environment failure instead of a skipped full-chain case',
    body: () => {
      const toolchain = resolveToolchain({
        INTEROP_UI_NODE: '/definitely/missing/node',
        INTEROP_UI_HVIGOR: '/definitely/missing/hvigorw.js',
        INTEROP_UI_SDK: '/definitely/missing/sdk'
      });
      assert.throws(() => toolchainReport(toolchain), error => {
        assert.strictEqual(error.category, 'environment');
        assert.ok(['TOOL_NOT_FOUND', 'TOOL_NOT_EXECUTABLE'].includes(error.code));
        return true;
      });
    }
  },
  {
    id: 'pr06-adapter-associated-coverage',
    coverage: 'every non-primary scenario is assigned once to a real 1.2 consumer compilation',
    body: () => {
      const leaders = scenarios.filter(testCase => testCase.fullChain);
      const associated = leaders.flatMap(associatedConsumersFor);
      assert.strictEqual(associated.length, scenarios.length - leaders.length);
      assert.strictEqual(new Set(associated.map(testCase => testCase.id)).size, associated.length);
      assert.ok(associated.every(testCase => !testCase.fullChain));
    }
  },
  {
    id: 'pr06-adapter-precompile-negative-callers',
    coverage: 'every negative scenario has a distinct legal caller for the initial Hvigor compilation',
    body: () => {
      for (const testCase of scenarios.filter(item => item.expectedStaticDiagnostic)) {
        const baseline = precompileScenario(testCase);
        assert.ok(callerArguments(baseline).every(argument => argument.value !== undefined));
        assert.notStrictEqual(staticCaller(baseline), staticCaller(testCase));
      }
    }
  },
  {
    id: 'pr06-adapter-diagnostic-code-family',
    coverage: 'static consumer expectations accept SDK ESE or F diagnostics but not an unrelated TypeScript-only code',
    body: () => {
      const testCase = scenario('number-rejects-string');
      assert.throws(() => verifyExpectedStaticDiagnostic(testCase, {
        status: 1,
        diagnostics: [typedDiagnostic(testCase, { code: 'TS2322' })]
      }), /unexpected diagnostic code/);
      const fCode = typedDiagnostic(testCase, { code: 'F2322' });
      assert.strictEqual(verifyExpectedStaticDiagnostic(testCase, {
        status: 1,
        diagnostics: [fCode]
      }), fCode);
    }
  },
  {
    id: 'pr06-adapter-arktsconfig-language-rejection',
    coverage: 'changing a dynamic dependency from JS to static language identity is incompatible even with current paths',
    body: context => {
      const testCase = scenario('required-string');
      const config = seedCallerConfig(context.workspace, testCase);
      const identity = moduleIdentity(testCase);
      config.compilerOptions.dependencies[identity.componentModule].language = 'ets';
      const paths = declarationPaths(context.workspace, true);
      context.workspace.write(path.relative(context.workspace.root, paths.configPath), JSON.stringify(config));
      assert.throws(() => verifyCallerConfig(context.workspace, testCase), /dynamic language identity/);
    }
  },
  {
    id: 'pr06-adapter-projection-requires-both-lists',
    coverage: 'updating only one dependency list is insufficient evidence of generated-file consumption',
    body: context => {
      seedProjection(context.workspace);
      const projectionPath = path.join(context.workspace.root, artifactContracts.projectionConfig);
      const projection = JSON.parse(fs.readFileSync(projectionPath, 'utf8'));
      projection.dependencyModuleList = projection.dependencyModuleList.filter(module =>
        module.packageName !== 'dynamic_component');
      context.workspace.write(artifactContracts.projectionConfig, JSON.stringify(projection));
      assert.throws(() => prepareRepositoryProjection(context.workspace), /both projection dependency lists/);
    }
  },
  {
    id: 'pr06-adapter-explicit-falsy-literals',
    coverage: 'zero, empty string and false remain explicit arguments while optional event omission stays absent',
    body: () => {
      assert.deepStrictEqual(callerArguments(scenario('optional-default-number-zero')).map(item => item.value), ['0']);
      assert.deepStrictEqual(callerArguments(scenario('optional-default-string-value')).map(item => item.value), ["''"]);
      assert.deepStrictEqual(callerArguments(scenario('optional-default-boolean-false')).map(item => item.value), ['false']);
      assert.deepStrictEqual(callerArguments(scenario('optional-event-omitted')), []);
      assert.deepStrictEqual(callerArguments(scenario('mixed-optional-presence')).map(item => item.name), ['title']);
    }
  },
  {
    id: 'pr06-adapter-explicit-value-metadata',
    coverage: 'zero, empty string and false carry independent ABC expectations while omission carries none',
    body: () => {
      for (const id of ['optional-default-number-zero', 'optional-default-string-value', 'optional-default-boolean-false']) {
        const property = scenario(id).properties[0];
        assert.ok(property.hasCaller);
        assert.ok(property.abcValue.length > 0);
      }
      assert.strictEqual(scenario('optional-event-omitted').properties[0].abcValue, undefined);
    }
  },
  {
    id: 'pr06-adapter-negative-full-chain-matrix',
    coverage: 'real static compilation includes independent primitive, optional and callback failures',
    body: () => {
      const negativeIds = scenarios.filter(item => item.fullChain && item.expectedStaticDiagnostic).map(item => item.id);
      assert.deepStrictEqual(negativeIds, [
        'pr06-number-rejects-string', 'pr06-string-rejects-number', 'pr06-boolean-rejects-number',
        'pr06-optional-number-rejects-string', 'pr06-number-event-rejects-string-handler'
      ]);
      for (const id of negativeIds) {
        const testCase = scenarios.find(item => item.id === id);
        assert.ok(testCase.expectedStaticDiagnostic.sourceProperty);
        assert.ok(expectedDiagnosticLine(testCase) > 0);
      }
    }
  },
  {
    id: 'pr06-adapter-caller-argument-source-spans',
    coverage: 'every supplied argument maps to a real source line containing its public property name and value',
    body: () => {
      for (const testCase of scenarios.filter(item => callerArguments(item).length > 0)) {
        const locations = callerLocations(testCase);
        const { staticCaller } = require('./project_files');
        const lines = staticCaller(testCase).split('\n');
        for (const argument of callerArguments(testCase)) {
          const line = lines[locations.argumentLines[argument.name] - 1];
          assert.ok(line.includes(`${argument.name}:`), testCase.id);
          assert.ok(line.includes(argument.value), testCase.id);
          assert.ok(line.indexOf(argument.name) >= 0, testCase.id);
        }
      }
    }
  },
  {
    id: 'pr06-adapter-caller-value-contract',
    coverage: 'ABC assertions distinguish an explicit zero from an omitted optional property',
    body: context => {
      const present = scenario('optional-default-number-zero');
      const presentPath = context.workspace.write('present.pa', 'lda.str "count"\nldai 0x0\n');
      assert.doesNotThrow(() => verifyCallerValueContracts(present, presentPath));
      const omitted = scenario('optional-primitives-omitted');
      const omittedPath = context.workspace.write('omitted.pa', 'return.void\n');
      assert.doesNotThrow(() => verifyCallerValueContracts(omitted, omittedPath));
      const invalidPath = context.workspace.write('invalid.pa', 'lda.str "count"\n');
      assert.throws(() => verifyCallerValueContracts(omitted, invalidPath), /omitted count was written/);
    }
  },
  {
    id: 'pr06-adapter-project-workspace-isolation',
    coverage: 'two materialized property projects keep independent component sources, callers and dependency links',
    body: context => {
      const first = materializeProject(context.workspace, scenario('required-number'), '/selected/sdk');
      const secondWorkspace = createWorkspace('pr06-second-project');
      try {
        const second = materializeProject(secondWorkspace, scenario('required-string'), '/selected/sdk');
        assert.notStrictEqual(first.calleeSource, second.calleeSource);
        assert.ok(fs.readFileSync(first.calleeSource, 'utf8').includes('RequiredNumberCard'));
        assert.ok(fs.readFileSync(second.calleeSource, 'utf8').includes('RequiredStringCard'));
        assert.ok(!fs.readFileSync(first.entrySource, 'utf8').includes('RequiredStringCard'));
        assert.ok(fs.existsSync(first.dependency));
        assert.ok(fs.existsSync(second.dependency));
      } finally {
        secondWorkspace.cleanup();
      }
    }
  }
];

async function runAdapterCases(options = {}) {
  const results = [];
  for (const testCase of adapterCases) {
    results.push(await executeCase({
      name: testCase.id,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: testCase.coverage
    }, testCase.body, options));
  }
  return results;
}

module.exports = {
  adapterCases,
  callerConfig,
  declarationFailureLog,
  runAdapterCases,
  seedCallerConfig,
  seedProjection,
  typedDiagnostic
};
