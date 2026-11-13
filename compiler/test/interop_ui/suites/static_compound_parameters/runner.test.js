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
  validateFailure
} = require('../static_calls_dynamic_basic/harness');
const publicRunner = require('../../test');
const {
  compoundDiagnostics,
  identifyBaseline,
  prepareRepositoryProjection,
  verifyExpectedDiagnostic,
  verifyNoUnexpectedDiagnostics,
  verifyRepositoryCallerConfig
} = require('./compile.test');
const {
  generateFreshDeclarations
} = require('./declaration.test');
const {
  compoundProjectFiles,
  materializeCompoundProject
} = require('./project_files');
const {
  artifactContracts,
  knownGenerateDeclarationFailure
} = require('./expected_cases');
const {
  compoundModels,
  declarationProbes,
  moduleIdentity,
  scenarios,
  staticCaller
} = require('./source_cases');
const {
  parseDirectArguments
} = require('./cli');

const baselineFixture = `[INFO] generate Declaration
Fatal error F0014: Unresolved module name for path: ''
[entry/src/main/ets/pages/Index.ets/:3:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*
[entry/src/main/ets/pages/Index.ets/:3:32] Fatal error F0016: Can't find prefix for 'dynamic_component' in /tmp/arktsconfig.json
> hvigor Finished :entry:default@GenerateDeclaration... after 3 s
> hvigor BUILD SUCCESSFUL in 8 s
`;

const optionalFixture = `${baselineFixture}
1 ERROR: Semantic error ESE0046
Error Message: Type 'null' is not compatible with type 'OptionalModel|undefined' at index 1 At File: /tmp/entry/src/main/ets/pages/Index.ets:10:33
`;

const unionFixture = `${baselineFixture}
1 ERROR: Semantic error ESE0061
Error Message: Ambiguous reference to 'ProfileModel|AlternateProfile' At File: /tmp/entry/src/main/ets/pages/Index.ets:10:26
`;

const constructorFixture = `${baselineFixture}
1 ERROR: Semantic error ESE0291
Error Message: Type RequiredCtorModel has no parameterless constructor. Initialization with literals is not supported At File: /tmp/entry/src/main/ets/pages/Index.ets:10:36
`;

function writeProjectionFixture(workspace, project) {
  const files = {};
  for (const key of ['Index', 'src/main/ets/CompoundCard', 'src/main/ets/CompoundModels']) {
    files[key] = {
      declPath: path.join(workspace.root, 'stale-declgen', `${key}.d.ets`),
      ohmUrl: `@normalized:N&&&dynamic_component/${key}&1.0.0`
    };
  }
  workspace.write(artifactContracts.declarationMap, JSON.stringify({
    packageName: moduleIdentity.packageName,
    files
  }));
  const dynamicEntry = {
    packageName: moduleIdentity.packageName,
    declgenV2OutPath: path.join(workspace.root, 'stale-declgen'),
    declFilesPath: path.join(workspace.root, 'stale-map.json')
  };
  workspace.write(artifactContracts.projectionConfig, JSON.stringify({
    dependentModuleList: [dynamicEntry],
    dependencyModuleList: [{ ...dynamicEntry }]
  }));
  const outputRoot = path.join(workspace.root, artifactContracts.repositoryDeclgenRoot);
  const generated = {
    outputRoot,
    files: Object.keys(files).map(key => path.join(outputRoot, `${key}.d.ets`))
  };
  for (const filePath of generated.files) {
    workspace.write(path.relative(workspace.root, filePath), `'use static'\n`);
  }
  return { generated, project };
}

function writeCallerConfigFixture(workspace, project, generated) {
  const componentModule = 'dynamic_component/src/main/ets/CompoundCard';
  const dependencies = {
    [componentModule]: {
      language: 'js',
      path: path.join(generated.outputRoot, 'src/main/ets/CompoundCard.d.ets'),
      sourceFilePath: project.componentSource,
      ohmUrl: moduleIdentity.componentOhmUrl
    },
    [moduleIdentity.modelModule]: {
      language: 'js',
      path: path.join(generated.outputRoot, 'src/main/ets/CompoundModels.d.ets'),
      sourceFilePath: project.modelSource,
      ohmUrl: moduleIdentity.modelOhmUrl
    },
    [moduleIdentity.indexModule]: {
      language: 'js',
      path: path.join(generated.outputRoot, 'Index.d.ets'),
      sourceFilePath: path.join(workspace.root, 'dynamic_component/Index.ets'),
      ohmUrl: moduleIdentity.indexOhmUrl
    },
    [moduleIdentity.packageName]: {
      language: 'js',
      path: path.join(generated.outputRoot, 'Index.d.ets'),
      sourceFilePath: path.join(workspace.root, 'dynamic_component/Index.ets'),
      ohmUrl: moduleIdentity.indexOhmUrl
    }
  };
  const configPath = path.join(workspace.root, artifactContracts.repositoryCache, 'entry/arktsconfig.json');
  workspace.write(path.relative(workspace.root, configPath), JSON.stringify({
    compilerOptions: {
      package: 'entry',
      dependencies
    }
  }));
  return { configPath, dependencies };
}

const cases = [
  {
    name: 'compound-direct-cli-validates-selection-and-zero-match',
    body: async () => {
      assert.deepStrictEqual(parseDirectArguments([]), {
        group: 'unit', direction: undefined, keepArtifacts: false
      });
      assert.deepStrictEqual(parseDirectArguments([
        '--group', 'compile', '--direction', '12-to-11', '--keep-artifacts'
      ]), {
        group: 'compile', direction: '12-to-11', keepArtifacts: true
      });
      for (const args of [
        ['--group'], ['--direction'], ['--group', 'unknown'],
        ['--direction', 'static'], ['--unknown']
      ]) {
        assert.throws(() => parseDirectArguments(args), /unknown|invalid|requires/);
      }
      for (const selection of [
        ['--group', 'unit', '--direction', '11-to-12'],
        ['--group', 'project', '--direction', DIRECTION]
      ]) {
        const result = spawnSync(process.execPath, [path.join(__dirname, 'run.js'), ...selection], {
          encoding: 'utf8'
        });
        assert.strictEqual(result.status, 1, result.stdout + result.stderr);
        assert.ok((result.stdout + result.stderr).includes('NO_CASES'));
      }
    }
  },
  {
    name: 'compound-public-protocol-requires-complete-results',
    body: () => {
      const valid = {
        name: 'compound-protocol-sample',
        group: 'unit',
        direction: DIRECTION,
        kind: 'specialized',
        status: 'passed'
      };
      assert.strictEqual(publicRunner.validateCaseResult(valid, 'static_compound_parameters', {
        group: 'unit', direction: DIRECTION
      }), valid);
      assert.throws(() => publicRunner.validateCaseResult({
        ...valid,
        status: 'failed'
      }, 'static_compound_parameters', { group: 'unit' }), /incomplete failure/);
      assert.throws(() => validateFailure({
        stage: 'checker', category: 'unknown', code: 'X'
      }), /category/);
    }
  },
  {
    name: 'compound-project-has-real-static-caller-and-dynamic-models',
    body: context => {
      const project = materializeCompoundProject(context.workspace, '/selected/sdk', 'compound');
      const caller = fs.readFileSync(project.callerSource, 'utf8');
      const models = fs.readFileSync(project.modelSource, 'utf8');
      assert.ok(caller.startsWith(`'use static'`));
      assert.ok(caller.includes(`CompoundCard({`));
      assert.ok(caller.includes(`optionalProfile: createOptionalProfile()`));
      assert.ok(caller.includes(`profile: ({`));
      assert.ok(caller.includes(`aliases: ['compound', 'array']`));
      assert.ok(caller.includes(`matrix: [`));
      assert.ok(caller.includes(`CompoundCard({ optionalProfile: createOptionalProfile() })`));
      assert.ok(models.includes(`@Observed\nexport class ProfileModel`));
      assert.ok(models.includes(`export interface PreferenceModel`));
      assert.ok(project.dynamicFiles.every(filePath => fs.existsSync(filePath)));
      assert.ok(fs.existsSync(path.join(context.workspace.root, 'entry/oh_modules/dynamic_component')));
    }
  },
  {
    name: 'compound-positive-input-uses-named-static-safe-types',
    body: () => {
      assert.ok(!staticCaller.includes(': any'));
      assert.ok(!staticCaller.includes(': unknown'));
      assert.ok(!staticCaller.includes('as any'));
      assert.ok(!staticCaller.includes('1, 2, 3'));
      assert.ok(staticCaller.includes(`matrix: [`));
      assert.ok(staticCaller.includes(`profile: ({`));
      assert.ok(staticCaller.includes(`aliases: ['compound', 'array']`));
      assert.ok(staticCaller.includes(`contact: {`));
      assert.ok(staticCaller.includes(`point: {`));
      assert.ok(staticCaller.includes('[1.0, 2.0]'));
      assert.ok(staticCaller.includes('nullable') === false);
      assert.ok(compoundModels.includes('ProfileModel | undefined'));
      assert.ok(!compoundModels.includes('ProfileModel | AlternateProfile | undefined'));
      assert.ok(!compoundModels.includes('point: {'));
      assert.ok(!compoundModels.includes('contact: {'));
    }
  },
  {
    name: 'compound-scenarios-separate-positive-and-unsupported-contracts',
    body: () => {
      assert.strictEqual(scenarios.compound.verifySuccessfulConsumer, true);
      assert.strictEqual(scenarios.compound.expectedDiagnostic, undefined);
      for (const id of ['optionalModel', 'ambiguousUnion', 'requiredConstructor']) {
        assert.strictEqual(scenarios[id].verifySuccessfulConsumer, false);
        assert.strictEqual(scenarios[id].expectedDiagnostic.stage, 'repository-static-compile');
        assert.ok(scenarios[id].expectedDiagnostic.code.startsWith('ESE'));
        assert.ok(scenarios[id].callerSource.includes(scenarios[id].componentName));
        assert.ok(scenarios[id].expectedDiagnostic.fileFragment.includes('Index.ets'));
      }
      assert.deepStrictEqual([
        scenarios.optionalModel.expectedDiagnostic.code,
        scenarios.ambiguousUnion.expectedDiagnostic.code,
        scenarios.requiredConstructor.expectedDiagnostic.code
      ], ['ESE0046', 'ESE0061', 'ESE0291']);
      assert.notStrictEqual(scenarios.ambiguousUnion.componentName, scenarios.compound.componentName);
      assert.notStrictEqual(scenarios.requiredConstructor.componentName, scenarios.compound.componentName);
    }
  },
  {
    name: 'compound-declaration-probes-cover-distinct-type-branches',
    body: () => {
      const ids = declarationProbes.map(probe => probe.id);
      assert.strictEqual(new Set(ids).size, ids.length);
      for (const probe of declarationProbes) {
        assert.ok(probe.source.startsWith(`'use static'`));
        assert.ok(probe.required.length > 0);
        assert.ok(probe.forbidden.length > 0);
      }
      assert.ok(ids.includes('array-spelling-preservation'));
      assert.ok(ids.includes('nested-named-model-preservation'));
      assert.ok(ids.includes('nullable-union-preservation'));
    }
  },
  {
    name: 'compound-diagnostic-parser-preserves-code-file-and-position',
    body: () => {
      const diagnostics = compoundDiagnostics(unionFixture);
      assert.deepStrictEqual(diagnostics.map(item => item.code),
        ['F0014', 'ESE0360', 'F0016', 'ESE0061']);
      const union = diagnostics[3];
      assert.strictEqual(union.stage, 'GenerateDeclaration');
      assert.strictEqual(union.sourceLine, 10);
      assert.strictEqual(union.column, 26);
      assert.strictEqual(union.detail, true);
      assert.ok(union.file.includes('entry/src/main/ets/pages/Index.ets'));
      const baseline = identifyBaseline(diagnostics);
      assert.strictEqual(baseline.category, 'existing');
      assert.strictEqual(baseline.code, knownGenerateDeclarationFailure.code);
    }
  },
  {
    name: 'compound-baseline-is-reportable-but-does-not-hide-unknown-errors',
    body: () => {
      verifyNoUnexpectedDiagnostics(compoundDiagnostics(unionFixture), scenarios.ambiguousUnion);
      assert.throws(() => verifyNoUnexpectedDiagnostics(compoundDiagnostics(
        `${unionFixture}\nFatal error F0999: unrelated regression\n`
      ), scenarios.ambiguousUnion), error => {
        assert.strictEqual(error.code, 'F0999');
        assert.strictEqual(error.category, 'implementation');
        return true;
      });
      assert.strictEqual(identifyBaseline(compoundDiagnostics(
        'Fatal error F0014: different unresolved module\n'
      )), undefined);
      assert.throws(() => verifyNoUnexpectedDiagnostics(compoundDiagnostics(
        'Fatal error F0014: different unresolved module\n'
      ), scenarios.compound), /F0014|different unresolved module/);
    }
  },
  {
    name: 'compound-ambiguous-union-requires-explicit-ese0061',
    body: () => {
      const result = { output: unionFixture, status: 1 };
      const diagnostic = verifyExpectedDiagnostic(result, scenarios.ambiguousUnion);
      assert.strictEqual(diagnostic.code, 'ESE0061');
      assert.strictEqual(diagnostic.acceptedAsPositive, false);
      assert.throws(() => verifyExpectedDiagnostic({ output: baselineFixture, status: 1 }, scenarios.ambiguousUnion),
        /ESE0061|Ambiguous reference/);
      assert.throws(() => verifyExpectedDiagnostic({ output: unionFixture, status: 0 }, scenarios.ambiguousUnion),
        /must fail in the real static consumer/);
    }
  },
  {
    name: 'compound-optional-and-constructor-require-distinct-diagnostics',
    body: () => {
      for (const [scenarioId, fixture] of [
        ['optionalModel', optionalFixture],
        ['requiredConstructor', constructorFixture]
      ]) {
        const diagnostic = verifyExpectedDiagnostic({ output: fixture, status: 1 }, scenarios[scenarioId]);
        assert.strictEqual(diagnostic.code, scenarios[scenarioId].expectedDiagnostic.code);
        assert.strictEqual(diagnostic.stage, 'repository-static-compile');
        assert.strictEqual(diagnostic.acceptedAsPositive, false);
        assert.ok(diagnostic.fileFragment.endsWith('Index.ets'));
      }
      assert.throws(() => verifyExpectedDiagnostic({ output: optionalFixture, status: 1 },
        scenarios.requiredConstructor), /ESE0291/);
      assert.throws(() => verifyExpectedDiagnostic({ output: constructorFixture, status: 1 },
        scenarios.optionalModel), /ESE0046/);
    }
  },
  {
    name: 'compound-projection-rewrites-every-public-model-to-current-output',
    body: context => {
      const project = materializeCompoundProject(context.workspace, '/selected/sdk', 'compound');
      const { generated } = writeProjectionFixture(context.workspace, project);
      const projection = prepareRepositoryProjection(context.workspace, project, generated);
      assert.strictEqual(Object.keys(projection.declarationMap.files).length, 3);
      for (const entry of Object.values(projection.declarationMap.files)) {
        assert.ok(entry.declPath.startsWith(generated.outputRoot));
        assert.ok(!entry.declPath.includes('stale-declgen'));
        assert.ok(generated.files.includes(entry.declPath));
      }
      for (const key of ['dependentModuleList', 'dependencyModuleList']) {
        assert.strictEqual(projection.projection[key][0].declgenV2OutPath, generated.outputRoot);
        assert.strictEqual(projection.projection[key][0].declFilesPath, projection.declarationMapPath);
      }
    }
  },
  {
    name: 'compound-caller-config-resolves-fresh-paths-and-dynamic-language',
    body: context => {
      const project = materializeCompoundProject(context.workspace, '/selected/sdk', 'compound');
      const { generated } = writeProjectionFixture(context.workspace, project);
      writeCallerConfigFixture(context.workspace, project, generated);
      const verified = verifyRepositoryCallerConfig(context.workspace, project, generated);
      assert.strictEqual(verified.dependencies.length, 4);
      for (const dependency of verified.dependencies) {
        assert.ok(dependency.declaration.startsWith(generated.outputRoot));
        assert.ok(dependency.ohmUrl.includes('dynamic_component'));
      }
    }
  },
  {
    name: 'compound-caller-config-rejects-stale-declaration-mapping',
    body: context => {
      const project = materializeCompoundProject(context.workspace, '/selected/sdk', 'compound');
      const { generated } = writeProjectionFixture(context.workspace, project);
      const fixture = writeCallerConfigFixture(context.workspace, project, generated);
      fixture.dependencies[moduleIdentity.packageName].path = '/stale/Index.d.ets';
      const configPath = path.join(context.workspace.root,
        artifactContracts.repositoryCache, 'entry/arktsconfig.json');
      context.workspace.write(path.relative(context.workspace.root, configPath), JSON.stringify({
        compilerOptions: {
          package: 'entry',
          dependencies: fixture.dependencies
        }
      }));
      assert.throws(() => verifyRepositoryCallerConfig(context.workspace, project, generated),
        /must consume the declaration generated in this case/);
    }
  },
  {
    name: 'compound-fresh-generation-refuses-preexisting-output-root',
    body: context => {
      const project = materializeCompoundProject(context.workspace, '/selected/sdk', 'compound');
      context.workspace.write(`${artifactContracts.repositoryDeclgenRoot}/stale.txt`, 'stale');
      assert.throws(() => generateFreshDeclarations(context.workspace, project),
        /fresh output root must not pre-exist/);
    }
  },
  {
    name: 'compound-artifact-contracts-are-relative-and-scenario-specific',
    body: () => {
      for (const value of Object.values(artifactContracts)) {
        assert.strictEqual(typeof value, 'string');
        assert.ok(!path.isAbsolute(value));
        assert.ok(!value.includes('/Users/'));
        assert.ok(!value.includes('PR01'));
      }
      assert.ok(artifactContracts.repositoryDeclgenRoot.includes('repositoryDeclgenV2'));
      assert.ok(artifactContracts.repositoryProjection.includes('repository-consume'));
      assert.ok(artifactContracts.generationEvidence.includes('fresh-generation'));
    }
  },
  {
    name: 'compound-workspaces-isolate-generated-files-and-cleanup',
    body: () => {
      const first = createWorkspace('compound-isolation-a');
      const second = createWorkspace('compound-isolation-b');
      try {
        assert.notStrictEqual(first.root, second.root);
        first.write('declgen/CompoundModels.d.ets', 'first');
        assert.strictEqual(fs.existsSync(path.join(second.root, 'declgen/CompoundModels.d.ets')), false);
        second.write('declgen/CompoundModels.d.ets', 'second');
        assert.notStrictEqual(
          fs.readFileSync(path.join(first.root, 'declgen/CompoundModels.d.ets'), 'utf8'),
          fs.readFileSync(path.join(second.root, 'declgen/CompoundModels.d.ets'), 'utf8'));
      } finally {
        first.cleanup();
        second.cleanup();
      }
      assert.ok(!fs.existsSync(first.root));
      assert.ok(!fs.existsSync(second.root));
    }
  },
  {
    name: 'compound-project-files-use-selected-sdk-and-pr07-identity',
    body: () => {
      const files = compoundProjectFiles('/another/sdk root', 'compound');
      assert.strictEqual(files['local.properties'], 'sdk.dir=/another/sdk root\n');
      assert.ok(files['build-profile.json5'].includes('"arkTSVersion": "1.2"'));
      assert.ok(files['AppScope/app.json5'].includes(moduleIdentity.bundleName));
      assert.ok(!JSON.stringify(files).includes('com.example.interopuipr01'));
      assert.ok(!JSON.stringify(files).includes('/Users/lxc/'));
      assert.ok(files['entry/oh-package.json5'].includes('file:../dynamic_component'));
      assert.strictEqual(files['dynamic_component/src/main/ets/DynamicCounter.ets'], undefined);
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
      coverage: 'PR07 runner, source matrix, diagnostics, fresh projection and protocol contract'
    }, testCase.body, options));
  }
  return results;
}

module.exports = {
  baselineFixture,
  cases,
  constructorFixture,
  runRunnerUnits,
  unionFixture,
  writeCallerConfigFixture,
  writeProjectionFixture
};
