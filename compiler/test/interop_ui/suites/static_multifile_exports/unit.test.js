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
const { DIRECTION, assert, executeCase } = require('../static_calls_dynamic_basic/harness');
const { DECLARATION_CASES, DYNAMIC_PROJECT_FILES, PACKAGE_NAME } = require('./source_cases');
const {
  ARTIFACTS, ABC_CALLER_BINDINGS, DECLARATION_EXPECTATIONS, FULL_PROJECT_ORIGINS, KNOWN_DECLARATION_DIAGNOSTICS
} = require('./expected_cases');
const {
  DYNAMIC_SOURCE_KEYS, canonicalPath, createProjectFiles, materializeProject, ohmUrl, sourcePath, validateProjectSources
} = require('./project_files');
const {
  assertOrigins, assertRelativeModulesResolve, buildDeclarationGraph, declarationKey, listExportedNames, resolveRelativeModule
} = require('./declaration_ast');
const { validateDeclarationCases } = require('./declaration.test');
const { assertDynamicIndirectExports, assertStaticCallerBindings, dynamicIndirectExports, indirectExportLine } =
  require('./abc_assertions');
const {
  assertBinaryArtifact, hvigorArguments, verifyCallerConfig, verifyCallerDeclarationMap,
  verifyDeclarationDiagnostics, verifyHvigorExit
} = require('./compile.test');
const publicRunner = require('../../test');

const DIAGNOSTIC_FIXTURE = `[INFO] generate Declaration
Fatal error F0014: Unresolved module name for path: ''
[entry/src/main/ets/pages/Index.ets/:17:1] Semantic error ESE0360: Cannot find import: *ERROR_LITERAL*
[entry/src/main/ets/pages/Index.ets/:17:32] Fatal error F0016: Can't find prefix for 'dynamic_component' in /tmp/arktsconfig.json
[entry/src/main/ets/pages/Index.ets/:18:30] Semantic error ESE0371: Cannot find type 'StaticUserProfile'.
[entry/src/main/ets/pages/Index.ets/:19:10] Semantic error ESE0143: Unresolved reference makeProfile
[entry/src/main/ets/pages/Index.ets/:23:16] Semantic error ESE0371: Cannot find type 'AlphaToken'.
[entry/src/main/ets/pages/Index.ets/:23:33] Semantic error ESE0371: Cannot find type 'AlphaToken'.
[entry/src/main/ets/pages/Index.ets/:28:16] Semantic error ESE0371: Cannot find type 'BetaToken'.
[entry/src/main/ets/pages/Index.ets/:28:32] Semantic error ESE0371: Cannot find type 'BetaToken'.
> hvigor Finished :entry:default@GenerateDeclaration... after 3 s
> hvigor BUILD SUCCESSFUL in 8 s
`;

function runStandalone(args) {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'run.js'), ...args], {
    cwd: path.resolve(__dirname, '../../../..'),
    env: { ...process.env, INTEROP_UI_KEEP_TEMP: '1' },
    encoding: 'utf8',
    timeout: 120000
  });
  return {
    status: result.status,
    output: `${result.stdout || ''}${result.stderr || ''}`,
    error: result.error
  };
}

function configFixture(workspace, stale = false) {
  const declarations = {};
  const dependencies = {};
  for (const key of DYNAMIC_SOURCE_KEYS) {
    const source = sourcePath(workspace, key);
    workspace.write(path.relative(workspace.root, source), `'use static'\n// ${key}\n`);
    const declarationPath = path.join(workspace.root, 'current-declarations', `${key}.d.ets`);
    workspace.write(path.relative(workspace.root, declarationPath), `'use static'\n`);
    declarations[key] = { path: declarationPath };
    dependencies[`${PACKAGE_NAME}/${key}`] = {
      language: 'js',
      path: declarationPath,
      sourceFilePath: source,
      ohmUrl: ohmUrl(key, '1.0.0')
    };
  }
  dependencies[PACKAGE_NAME] = {
    language: 'js',
    path: declarations.Index.path,
    sourceFilePath: sourcePath(workspace, 'Index'),
    ohmUrl: ohmUrl('Index', '1.0.0')
  };
  if (stale) {
    dependencies[`${PACKAGE_NAME}/Index`].path = '/stale/previous-run/Index.d.ets';
  }
  const config = {
    compilerOptions: {
      package: 'entry',
      paths: { '@internal.full.global': ['/selected/sdk/global'] },
      dependencies
    }
  };
  workspace.write(path.join(ARTIFACTS.repositoryCache, 'entry/arktsconfig.json'), JSON.stringify(config));
  return { declarations };
}

function callerMapFixture(workspace, staleTimestamp = false) {
  const sources = [
    'entry/src/main/ets/pages/Index.ets',
    'entry/src/main/ets/entryability/EntryAbility.ets'
  ];
  const declarationMap = {};
  for (const [index, relativeSource] of sources.entries()) {
    const absoluteSource = workspace.write(relativeSource, `'use static'\n`);
    const declaration = workspace.write(`current/declgenV1/${index}.d.ets`, `'use static'\n`);
    const bridge = index === 0 ? workspace.write(ARTIFACTS.bridgeSource, '// current caller bridge\n') :
      workspace.write('current/bridge/EntryAbility.ts', '// current ability bridge\n');
    declarationMap[absoluteSource] = {
      delFilePath: declaration,
      declLastModified: fs.statSync(declaration).mtimeMs,
      glueCodeFilePath: bridge,
      glueCodeLastModified: fs.statSync(bridge).mtimeMs + (staleTimestamp && index === 0 ? 1000 : 0),
      sourceFilePath: absoluteSource,
      sourceFileLastModified: fs.statSync(absoluteSource).mtimeMs
    };
  }
  workspace.write(ARTIFACTS.callerDeclarationMap, JSON.stringify(declarationMap));
  return declarationMap;
}

function staticBindingFixture() {
  return ABC_CALLER_BINDINGS.map(expected => `
.function std.core.String entry.src.main.ets.pages.Index.ETSGLOBAL.${expected.labelFunction}() <static> {
  any.ldbyname v2, "${expected.token}", 0x0
  lda.str "${expected.argument}"
  any.call.new.short v1, v2, 0x1
}
.function arkui.component.interop.CompatibleComponentInfo entry.src.main.ets.pages.Index.Index.lambda_${expected.labelFunction}() <static> {
  call.short <static> entry.src.main.ets.pages.Index.ETSGLOBAL.${expected.labelFunction}:()
  lda.str "page"
  lda.str "${expected.page}"
  call std.interop.ESValue.setProperty:()
  any.ldbyname v14, "${expected.component}", 0x0
  lda.str "${expected.component}"
  stobj.obj v13, entry.src.main.ets.pages.Index.arkui$component$interop$CompatibleComponentInfo$ObjectLiteral.name
}`).join('\n');
}

const cases = [
  {
    name: 'multifile-registry-has-unique-real-expectations',
    body: () => {
      assert.strictEqual(validateDeclarationCases(), DECLARATION_CASES.length);
      assert.ok(DECLARATION_CASES.length >= 12);
      for (const sourceCase of DECLARATION_CASES) {
        const expectation = DECLARATION_EXPECTATIONS[sourceCase.id];
        for (const origin of Object.values(expectation.origins)) {
          assert.ok(sourceCase.files[`${origin.file}.ets`],
            `${sourceCase.id} origin ${origin.file} is not a real input`);
        }
      }
    }
  },
  {
    name: 'multifile-dynamic-reexport-does-not-apply-reverse-static-rule',
    body: () => {
      const sourceCase = DECLARATION_CASES.find(item => item.id === 'nested-dynamic-barrel');
      assert.ok(sourceCase.files['Index.ets'].includes('export { PublicModel }'));
      assert.ok(sourceCase.files['src/main/ets/internal/barrel.ets'].includes('export { Model as PublicModel }'));
      for (const content of Object.values(sourceCase.files)) {
        assert.ok(!content.includes(`'use static'`));
        assert.ok(!content.includes('static@'));
        assert.ok(!content.includes('re-export static'));
      }
      assert.strictEqual(DIRECTION, '12-to-11');
    }
  },
  {
    name: 'multifile-source-and-ohm-identities-are-unique',
    body: () => {
      assert.strictEqual(DYNAMIC_SOURCE_KEYS.length, Object.keys(DYNAMIC_PROJECT_FILES).length);
      const identities = DYNAMIC_SOURCE_KEYS.map(key => ohmUrl(key));
      assert.strictEqual(new Set(identities).size, identities.length);
      assert.ok(DYNAMIC_SOURCE_KEYS.includes('src/main/ets/modules/alpha/SharedCard'));
      assert.ok(DYNAMIC_SOURCE_KEYS.includes('src/main/ets/modules/beta/SharedCard'));
      assert.notStrictEqual(ohmUrl('src/main/ets/modules/alpha/SharedCard'),
        ohmUrl('src/main/ets/modules/beta/SharedCard'));
      const graph = buildDeclarationGraph({
        Index: 'export { ProfileCard } from "./Card";',
        Card: 'export declare struct ProfileCard {}'
      });
      assert.deepStrictEqual(listExportedNames(graph, 'Index'), ['ProfileCard']);
      assert.strictEqual(Object.keys(FULL_PROJECT_ORIGINS).length, 10);
    }
  },
  {
    name: 'multifile-project-uses-selected-sdk-and-two-language-inputs',
    body: () => {
      const files = createProjectFiles('/selected/sdk root');
      assert.ok(validateProjectSources(files));
      assert.strictEqual(files['local.properties'], 'sdk.dir=/selected/sdk root\n');
      assert.ok(files['build-profile.json5'].includes('"arkTSVersion": "1.2"'));
      assert.ok(files['entry/oh-package.json5'].includes('file:../dynamic_component'));
      assert.ok(!JSON.stringify(files).includes('/Users/lxc/'));
      assert.ok(!JSON.stringify(files).includes('DynamicCounter'));
    }
  },
  {
    name: 'multifile-materialization-writes-every-source-and-dependency',
    body: context => {
      const project = materializeProject(context.workspace, '/selected/sdk');
      assert.ok(project.fileCount > 30);
      assert.strictEqual(project.dynamicSources.length, DYNAMIC_SOURCE_KEYS.length);
      for (const source of project.dynamicSources) {
        assert.ok(fs.statSync(source).size > 0);
      }
      assert.ok(fs.existsSync(project.dependency));
      assert.ok(fs.readFileSync(project.callerSource, 'utf8').includes('struct ProfileCard'));
      assert.ok(fs.readFileSync(project.callerSource, 'utf8').includes('DynamicProfileCard('));
    }
  },
  {
    name: 'multifile-relative-module-keys-cover-index-parent-and-extensionless-paths',
    body: () => {
      assert.strictEqual(declarationKey('Index.ets'), 'Index');
      assert.strictEqual(declarationKey('Index.d.ets'), 'Index');
      assert.strictEqual(declarationKey('src/main/ets/model/Profile'), 'src/main/ets/model/Profile');
      assert.strictEqual(resolveRelativeModule('src/main/ets/model/Profile', '../shared/Location'),
        'src/main/ets/shared/Location');
      assert.strictEqual(resolveRelativeModule('src/main/ets/model/Profile', './index'),
        'src/main/ets/model/index');
      assert.strictEqual(resolveRelativeModule('Index', '@ohos.arkui.component'), undefined);
    }
  },
  {
    name: 'multifile-ast-resolves-same-local-name-to-distinct-origins',
    body: () => {
      const graph = buildDeclarationGraph({
        Index: `export { SharedCard as AlphaCard } from './alpha/SharedCard';
export { SharedCard as BetaCard } from './beta/SharedCard';`,
        'alpha/SharedCard': 'export declare struct SharedCard {}',
        'beta/SharedCard': 'export declare struct SharedCard {}'
      });
      const origins = assertOrigins(graph, {
        AlphaCard: { file: 'alpha/SharedCard', local: 'SharedCard', kind: 'struct' },
        BetaCard: { file: 'beta/SharedCard', local: 'SharedCard', kind: 'struct' }
      });
      assert.notStrictEqual(origins.AlphaCard.file, origins.BetaCard.file);
    }
  },
  {
    name: 'multifile-ast-rejects-missing-relative-declaration-targets',
    body: () => {
      const graph = buildDeclarationGraph({
        Index: `export { Missing } from './model/Missing';`
      });
      assert.throws(() => assertRelativeModulesResolve(graph), /missing generated module/);
      assert.throws(() => assertOrigins(graph, {
        Missing: { file: 'model/Missing', local: 'Missing' }
      }), /missing file|missing generated/);
    }
  },
  {
    name: 'multifile-hvigor-command-is-fresh-esmodule-application-build',
    body: () => {
      const args = hvigorArguments();
      assert.ok(args.includes('product=default'));
      assert.ok(args.includes('module=entry@default'));
      assert.ok(args.includes('buildMode=debug'));
      assert.deepStrictEqual(args.slice(-3), ['clean', 'assembleHap', '--no-daemon']);
      assert.ok(!args.includes('JSBUNDLE'));
    }
  },
  {
    name: 'multifile-known-declaration-diagnostic-retains-existing-classification',
    body: () => {
      assert.throws(() => verifyDeclarationDiagnostics({ output: DIAGNOSTIC_FIXTURE }), error => {
        assert.strictEqual(error.stage, 'GenerateDeclaration');
        assert.strictEqual(error.category, KNOWN_DECLARATION_DIAGNOSTICS.category);
        assert.strictEqual(error.code, 'F0014');
        assert.strictEqual(error.details.diagnostics.length, 9);
        return true;
      });
    }
  },
  {
    name: 'multifile-mixed-unknown-cascade-is-implementation-not-existing',
    body: () => {
      const outputs = [
        DIAGNOSTIC_FIXTURE.replace('[entry/src/main/ets/pages/Index.ets/:18:30]',
          'Fatal error F0999: unexpected middle regression\n[entry/src/main/ets/pages/Index.ets/:18:30]'),
        DIAGNOSTIC_FIXTURE.replace('> hvigor Finished',
          'Fatal error F0999: unexpected additional regression\n> hvigor Finished')
      ];
      for (const output of outputs) {
        assert.throws(() => verifyDeclarationDiagnostics({ output }), error => {
          assert.strictEqual(error.category, 'implementation'); assert.strictEqual(error.code, 'F0999');
          assert.strictEqual(error.details.whitelistLength, 9); assert.strictEqual(error.details.unexpectedDiagnostic.code, 'F0999');
          return true;
        });
      }
    }
  },
  {
    name: 'multifile-known-sequence-order-is-enforced',
    body: () => {
      const lines = DIAGNOSTIC_FIXTURE.split('\n');
      [lines[2], lines[3]] = [lines[3], lines[2]];
      assert.throws(() => verifyDeclarationDiagnostics({ output: lines.join('\n') }), error => {
        assert.strictEqual(error.category, 'implementation');
        assert.strictEqual(error.code, 'F0016');
        assert.strictEqual(error.details.whitelistIndex, 1);
        assert.strictEqual(error.details.unexpectedDiagnostic.code, 'F0016');
        return true;
      });
    }
  },
  {
    name: 'multifile-unknown-diagnostic-is-an-implementation-failure',
    body: () => {
      assert.throws(() => verifyDeclarationDiagnostics({
        output: '[INFO] just build\nFatal error F0999: unexpected multifile regression\n'
      }), error => {
        assert.strictEqual(error.category, 'implementation');
        assert.strictEqual(error.code, 'F0999');
        return true;
      });
      verifyHvigorExit({ status: 0, output: '> hvigor BUILD SUCCESSFUL in 1 s' });
      assert.throws(() => verifyHvigorExit({ status: 1, output: 'failed' }), /HVIGOR|Hvigor exited/);
    }
  },
  {
    name: 'multifile-abc-check-requires-panda-header-and-nontrivial-size',
    body: context => {
      const valid = context.workspace.write('artifacts/modules_static.abc',
        Buffer.concat([Buffer.from('PANDA\0\0\0'), Buffer.alloc(16, 7)]));
      assert.ok(assertBinaryArtifact(valid, 'ABC').length >= 16);
      const invalid = context.workspace.write('artifacts/invalid.abc', Buffer.from('not-an-abc-buffer'));
      assert.throws(() => assertBinaryArtifact(invalid, 'ABC'), /ABC magic/);
    }
  },
  {
    name: 'multifile-abc-wrong-binding-mutations-are-rejected',
    body: () => {
      const staticText = staticBindingFixture();
      assert.strictEqual(assertStaticCallerBindings(staticText).length, 2);
      const wrongStatic = staticText.replace('any.ldbyname v14, "AlphaSharedCard", 0x0',
        'any.ldbyname v14, "BetaSharedCard", 0x0');
      assert.throws(() => assertStaticCallerBindings(wrongStatic), /AlphaSharedCard|cross-bound/);
      const expectedExports = dynamicIndirectExports();
      const dynamicText = expectedExports.map(indirectExportLine).join('\n');
      assert.strictEqual(assertDynamicIndirectExports(dynamicText).length, 20);
      const alphaToken = expectedExports.find(binding => binding.exportName === 'AlphaToken' &&
        binding.importName === 'Token');
      const correctLine = indirectExportLine(alphaToken);
      const wrongLine = correctLine.replace('modules/alpha/Token', 'modules/beta/Token');
      assert.throws(() => assertDynamicIndirectExports(dynamicText.replace(correctLine, wrongLine)),
        /wrong internal-barrel indirect-export binding.*AlphaToken/);
    }
  },
  {
    name: 'multifile-arktsconfig-consumes-every-current-declaration-path',
    body: context => {
      const generated = configFixture(context.workspace);
      const verified = verifyCallerConfig(context.workspace, generated);
      assert.strictEqual(Object.keys(verified.dependencies).length, DYNAMIC_SOURCE_KEYS.length + 1);
      assert.strictEqual(verified.dependencies[PACKAGE_NAME].path, generated.declarations.Index.path);
      assert.strictEqual(verified.dependencies[`${PACKAGE_NAME}/src/main/ets/modules/alpha/SharedCard`].language, 'js');
      assert.strictEqual(verified.dependencies[`${PACKAGE_NAME}/src/main/ets/modules/beta/SharedCard`].language, 'js');
    }
  },
  {
    name: 'multifile-arktsconfig-rejects-a-stale-barrel-declaration',
    body: context => {
      const generated = configFixture(context.workspace, true);
      assert.throws(() => verifyCallerConfig(context.workspace, generated), /stale declaration|path|expected/i);
    }
  },
  {
    name: 'multifile-decl-file-map-links-caller-declaration-and-bridge',
    body: context => {
      callerMapFixture(context.workspace);
      const verified = verifyCallerDeclarationMap(context.workspace);
      assert.deepStrictEqual(Object.keys(verified.entries).sort(), ['EntryAbility.ets', 'Index.ets']);
      assert.strictEqual(canonicalPath(verified.entries['Index.ets'].glueCodeFilePath),
        canonicalPath(path.join(context.workspace.root, ARTIFACTS.bridgeSource)));
    }
  },
  {
    name: 'multifile-decl-file-map-rejects-stale-artifact-timestamps',
    body: context => {
      callerMapFixture(context.workspace, true);
      assert.throws(() => verifyCallerDeclarationMap(context.workspace), /glueCodeLastModified|mtime|expected/i);
    }
  },
  {
    name: 'multifile-full-project-origins-have-real-source-definitions',
    body: () => {
      const exportedNames = Object.keys(FULL_PROJECT_ORIGINS).sort();
      assert.strictEqual(exportedNames.length, 10);
      for (const [exportedName, origin] of Object.entries(FULL_PROJECT_ORIGINS)) {
        const source = DYNAMIC_PROJECT_FILES[`${origin.file}.ets`];
        assert.ok(source, `${exportedName} has no source definition`);
        assert.ok(source.includes(origin.local), `${origin.file} does not declare ${origin.local}`);
        assert.ok(DYNAMIC_PROJECT_FILES['Index.ets'].includes(exportedName),
          `package Index does not expose ${exportedName}`);
      }
      assert.ok(exportedNames.includes('AliasedProfileCard'));
      assert.ok(exportedNames.includes('makeProfile'));
    }
  },
  {
    name: 'multifile-export-star-does-not-promote-default-export',
    body: () => {
      const graph = buildDeclarationGraph({
        Index: `export * from './models';`,
        models: `export * from './Named';
export * from './Default';`,
        Named: 'export declare class NamedModel {}',
        Default: 'export default declare class DefaultModel {}'
      });
      assert.deepStrictEqual(listExportedNames(graph, 'Index'), ['NamedModel']);
      const origins = assertOrigins(graph, {
        NamedModel: { file: 'Named', local: 'NamedModel', kind: 'class' }
      });
      assert.strictEqual(origins.NamedModel.file, 'Named');
    }
  },
  {
    name: 'multifile-standalone-cli-runs-exactly-one-selected-real-case',
    body: () => {
      const result = runStandalone([
        '--group', 'unit',
        '--direction', '12-to-11',
        '--case', 'multifile-declaration-nested-dynamic-barrel'
      ]);
      assert.strictEqual(result.status, 0, result.output);
      assert.ok(result.output.includes('PASS multifile-declaration-nested-dynamic-barrel'));
      assert.ok(result.output.includes('effective=1 passed=1 failed=0'));
      assert.ok(!result.output.includes('multifile-declaration-relative-cross-file-model'));
    }
  },
  {
    name: 'multifile-public-discovers-suite-without-changing-entrypoint',
    body: () => {
      const suite = publicRunner.discoverSuites().find(item => item.name === 'static_multifile_exports');
      assert.ok(suite, 'public discovery did not find PR10');
      assert.strictEqual(typeof suite.run, 'function');
      const exported = require('./run');
      assert.strictEqual(exported.name, 'static_multifile_exports');
      assert.strictEqual(exported.direction, DIRECTION);
    }
  },
  {
    name: 'multifile-standalone-cli-fails-for-zero-direction-selection',
    body: () => {
      const result = runStandalone(['--group', 'unit', '--direction', '11-to-12']);
      assert.strictEqual(result.status, 1, result.output);
      assert.ok(result.output.includes('NO_CASES'));
      assert.ok(result.output.includes('effective=0'));
    }
  },
  {
    name: 'multifile-standalone-cli-fails-for-zero-case-and-invalid-input',
    body: () => {
      const missing = runStandalone(['--group', 'unit', '--case', 'not-a-case']);
      assert.strictEqual(missing.status, 1, missing.output);
      assert.ok(missing.output.includes('NO_CASES'));
      const invalid = runStandalone(['--unknown']);
      assert.strictEqual(invalid.status, 1, invalid.output);
      assert.ok(invalid.output.includes('unknown argument'));
      const help = runStandalone(['--help']);
      assert.strictEqual(help.status, 0, help.output);
      assert.ok(help.output.includes('--direction 12-to-11'));
    }
  }
];

async function runAdapterUnits(options = {}) {
  const results = [];
  for (const testCase of cases) {
    if (options.caseId && options.caseId !== testCase.name) {
      continue;
    }
    results.push(await executeCase({
      name: testCase.name,
      group: 'unit',
      direction: DIRECTION,
      kind: 'specialized',
      coverage: 'PR10 registry, source graph, path mapping, diagnostics, artifacts and CLI protocol'
    }, testCase.body, options));
  }
  return results;
}

module.exports = {
  DIAGNOSTIC_FIXTURE,
  callerMapFixture,
  cases,
  configFixture,
  runAdapterUnits,
  runStandalone
};
