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
  assertAbcHeader,
  findFatalDiagnostics,
  makeProjectionModule,
  readAbcHeader
} = require('./expected_cases');
const {
  assertFreshArtifact,
  parseArgs,
  runCases,
  selectCases
} = require('./harness');
const {
  assertOldProtocolModule,
  materializeProject,
  normalizeRelativePath
} = require('./project_files');
const {
  DIRECTION,
  PROJECT_JSON_FILES,
  STATIC_CLASS_RECORD,
  STATIC_COUNTER_SOURCE,
  STATIC_INDEX_SOURCE,
  STATIC_OPTIONS_INTERFACE,
  STATIC_OPTIONS_RECORD,
  UNIT_DYNAMIC_SOURCE,
  createProjectFiles
} = require('./source_cases');
const { resolveSdkHome, resolveToolchain } = require('./toolchain');
const { assertBridgeIdentity } = require('./compile.test');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const TSC_PATH = path.join(COMPILER_ROOT, 'node_modules', 'typescript');
const ts = require(TSC_PATH);
let productionCache;
const INTEROP_LIB_MODULES = [
  ['process_interop_component', 'createStaticComponentOptions'],
  ['process_ui_syntax', 'process_interop_component'],
  ['fast_build/ark_compiler/interop/process_arkts_evolution', 'interopTransform'],
  ['validate_ui_syntax', 'validatePropertyInStructInterop'],
  ['utils', 'toUnixPath']
];
function libPreflightFailure(code, root, detail) {
  const error = new Error(
    `${code}: ${detail}. Run "npm run interopBuild" from ${root}; ` +
    'a regular build or a stale existing lib is not accepted.');
  Object.assign(error, {
    stage: 'lib-preflight',
    category: 'environment',
    code,
    details: { action: 'npm run interopBuild', cwd: root }
  });
  return error;
}
function assertInteropLibFresh(root = COMPILER_ROOT) {
  const report = [];
  for (const [moduleName, marker] of INTEROP_LIB_MODULES) {
    const source = path.join(root, 'src/interop/src', `${moduleName}.ts`);
    const library = path.join(root, 'lib', `${moduleName}.js`);
    let sourceStat;
    let libraryStat;
    let content;
    try {
      sourceStat = fs.statSync(source);
      libraryStat = fs.statSync(library);
      content = fs.readFileSync(library, 'utf8');
    } catch {
      throw libPreflightFailure('MISSING_INTEROP_INPUT', root, `${source} or ${library} is missing`);
    }
    if (libraryStat.mtimeMs < sourceStat.mtimeMs) {
      throw libPreflightFailure(
        'STALE_INTEROP_LIB',
        root,
        `${library} is older than ${source}`);
    }
    if (!content.includes(marker)) {
      throw libPreflightFailure(
        'INTEROP_LIB_FLAVOR_MISMATCH',
        root,
        `${library} does not contain the interop marker ${marker}`);
    }
    report.push({
      source,
      library,
      sourceMtimeMs: sourceStat.mtimeMs,
      libraryMtimeMs: libraryStat.mtimeMs,
      marker
    });
  }
  return report;
}
function production() {
  if (productionCache) {
    return productionCache;
  }
  const lib = name => path.join(COMPILER_ROOT, 'lib', name);
  const preflight = assertInteropLibFresh();
  productionCache = {
    preflight,
    component: require(lib('process_interop_component')),
    evolution: require(lib('fast_build/ark_compiler/interop/process_arkts_evolution')),
    processUISyntax: require(lib('process_ui_syntax')).processUISyntax,
    validate: require(lib('validate_ui_syntax')),
    utils: require(lib('utils')),
    main: require(path.join(COMPILER_ROOT, 'main'))
  };
  return productionCache;
}
function printer() {
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
}
function printNode(node) {
  const source = ts.createSourceFile(
    'unit.ts',
    '',
    ts.ScriptTarget.ES2021,
    false,
    ts.ScriptKind.TS);
  return printer().printNode(ts.EmitHint.Unspecified, node, source);
}
function propertyAssignment(name, initializer) {
  return ts.factory.createPropertyAssignment(
    ts.factory.createIdentifier(name),
    initializer);
}
function makeOptions(properties) {
  return ts.factory.createObjectLiteralExpression(properties, false);
}
function makeNewNode(options) {
  return ts.factory.createNewExpression(
    ts.factory.createIdentifier('StaticCounter'),
    undefined,
    [
      ts.factory.createIdentifier('undefined'),
      options,
      ts.factory.createIdentifier('undefined')
    ]);
}
function makeComponentReturn() {
  return ts.factory.createReturnStatement(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier('StaticCounter'),
      undefined,
      []
    ));
}
function unitCase(id, description, run) {
  return { id, group: 'unit', direction: DIRECTION, description, run };
}
const cases = [
  unitCase('source-language-and-parameter-contract',
    'Static markers, explicit build return type, dynamic source identity and parameter update are embedded', t => {
      t.match(STATIC_INDEX_SOURCE, /^'use static'\n/);
      t.match(STATIC_COUNTER_SOURCE, /^'use static'\n/);
      t.includes(STATIC_COUNTER_SOURCE, '@State public count: number = 0');
      t.includes(STATIC_COUNTER_SOURCE, 'build(): void');
      const files = createProjectFiles();
      const dynamic = files['entry/src/main/ets/pages/Index.ets'];
      t.notIncludes(dynamic, "'use static'");
      t.includes(dynamic, "import { StaticCounter } from 'static_component'");
      t.includes(dynamic, 'StaticCounter({ count: this.counterSeed })');
      t.includes(dynamic, 'this.counterSeed += 1');
      t.equal(STATIC_CLASS_RECORD.endsWith('/StaticCounter;'), true);
      t.equal(STATIC_OPTIONS_RECORD.endsWith('/__Options_StaticCounter;'), true);
    }),
  unitCase('structured-project-configuration',
    'Structured JSON data describes a 1.1 caller, static HAR and normalized ESMODULE build', t => {
      const root = PROJECT_JSON_FILES['build-profile.json5'];
      t.equal(root.app.products[0].arkTSVersion, '1.2');
      t.equal(root.app.products[0].buildOption.strictMode.useNormalizedOHMUrl, true);
      t.equal(root.modules[0].name, 'static_component');
      t.equal(root.modules[1].name, 'entry');
      const entryPackage = PROJECT_JSON_FILES['entry/oh-package.json5'];
      t.equal(entryPackage.dependencies.static_component, 'file:../static_component');
      const staticPackage = PROJECT_JSON_FILES['static_component/oh-package.json5'];
      t.equal(staticPackage.main, 'Index.ets');
      const staticModule = PROJECT_JSON_FILES['static_component/src/main/module.json5'];
      t.equal(staticModule.module.type, 'har');
      const entryModule = PROJECT_JSON_FILES['entry/src/main/module.json5'];
      t.equal(entryModule.module.type, 'entry');
      t.equal(entryModule.module.pages, '$profile:main_pages');
    }),
  unitCase('embedded-inputs-have-no-external-fixture',
    'Every project input is embedded text or structured data and uses a safe relative path', t => {
      const files = createProjectFiles();
      t.greater(Object.keys(files).length, 15);
      for (const [relativePath, content] of Object.entries(files)) {
        t.equal(normalizeRelativePath(relativePath), relativePath);
        t.equal(typeof content, 'string');
        t.notIncludes(content, '/var/folders/');
        t.notIncludes(content, 'interop-dynamic-calls-static-20261112');
      }
      t.equal(files['static_component/Index.ets'], STATIC_INDEX_SOURCE);
    }),
  unitCase('materialization-isolates-independent-projects',
    'Two materializations have independent files and manifests without copied build outputs', t => {
      const first = materializeProject(path.join(t.workspace, 'first'), '/tmp/isolated-sdk');
      const second = materializeProject(path.join(t.workspace, 'second'), '/tmp/isolated-sdk');
      t.notEqual(first.projectRoot, second.projectRoot);
      t.equal(first.manifest.fileCount, second.manifest.fileCount);
      t.equal(first.manifest.externalFixture, null);
      t.equal(second.manifest.externalFixture, null);
      const relative = 'static_component/src/main/ets/StaticCounter.ets';
      const firstSource = path.join(first.projectRoot, relative);
      const secondSource = path.join(second.projectRoot, relative);
      t.equal(fs.readFileSync(firstSource, 'utf8'), fs.readFileSync(secondSource, 'utf8'));
      fs.appendFileSync(firstSource, '// isolated mutation\n');
      t.notEqual(fs.readFileSync(firstSource, 'utf8'), fs.readFileSync(secondSource, 'utf8'));
      t.equal(fs.existsSync(path.join(first.projectRoot, 'build')), false);
      t.equal(fs.existsSync(path.join(first.projectRoot, 'entry/build')), false);
      t.equal(fs.existsSync(path.join(first.projectRoot, 'static_component/build')), false);
      t.record('isolated-materialization', {
        first: first.projectRoot,
        second: second.projectRoot,
        fileCount: first.manifest.fileCount
      });
    }),
  unitCase('materialization-rejects-path-escape',
    'Absolute, parent-relative and non-canonical paths cannot escape the temporary project', t => {
      t.throws(() => normalizeRelativePath('../outside.ets'), /escapes/);
      t.throws(() => normalizeRelativePath('/tmp/outside.ets'), /Absolute/);
      t.throws(() => normalizeRelativePath('entry/../outside.ets'), /Non-canonical/);
      t.throws(() => normalizeRelativePath('entry\\outside.ets'), /Unsafe/);
      t.equal(normalizeRelativePath('entry/src/main/ets/Index.ets'), 'entry/src/main/ets/Index.ets');
    }),
  unitCase('cli-rejects-invalid-direction-and-zero-selection',
    'The standalone entry accepts only 11-to-12 and fails an empty case selection', t => {
      const parsed = parseArgs(['--group', 'compile', '--direction', DIRECTION]);
      t.equal(parsed.group, 'compile');
      t.equal(parsed.direction, DIRECTION);
      t.throws(
        () => parseArgs(['--group', 'compile', '--direction', '12-to-11']),
        /Invalid direction/);
      t.throws(() => parseArgs(['--group', 'unknown']), /Invalid group/);
      t.throws(
        () => selectCases(cases, {
          group: 'unit',
          direction: DIRECTION,
          caseId: 'not-a-case'
        }),
        /zero cases/);
      t.throws(() => parseArgs(['--unknown']), /Unknown argument/);
    }),
  unitCase('missing-compile-tools-are-explicit',
    'Compile preflight identifies missing SDK, Hvigor, Java and ohpm rather than skipping', t => {
      const error = t.throws(() => resolveToolchain({}), /Missing required compile tools/);
      t.ok(error.details.missing.length >= 5);
      const variables = error.details.missing.map(item => item.variable);
      for (const variable of [
        'INTEROP_UI_SDK_HOME',
        'INTEROP_UI_JAVA_HOME',
        'INTEROP_UI_HVIGOR',
        'INTEROP_UI_OHPM'
      ]) {
        t.ok(variables.includes(variable), `Missing-tool report omits ${variable}`);
      }
      t.equal(resolveSdkHome({ INTEROP_UI_SDK: '/alias/sdk' }), '/alias/sdk');
      t.equal(resolveSdkHome({ INTEROP_UI_SDK_HOME: '/existing/sdk' }), '/existing/sdk');
      t.equal(resolveSdkHome({ DEVECO_SDK_HOME: '/deveco/sdk' }), '/deveco/sdk');
      const fakeRoot = path.join(t.workspace, 'missing-lib');
      const missing = t.throws(() => assertInteropLibFresh(fakeRoot), /MISSING_INTEROP_INPUT/);
      t.equal(missing.code, 'MISSING_INTEROP_INPUT');
      t.includes(missing.details.action, 'interopBuild');
      const staleSource = path.join(fakeRoot, 'src/interop/src/process_interop_component.ts');
      const staleLib = path.join(fakeRoot, 'lib/process_interop_component.js');
      fs.mkdirSync(path.dirname(staleSource), { recursive: true });
      fs.mkdirSync(path.dirname(staleLib), { recursive: true });
      fs.writeFileSync(staleSource, 'export {};');
      fs.writeFileSync(staleLib, 'createStaticComponentOptions');
      const old = new Date(Date.now() - 10000);
      fs.utimesSync(staleLib, old, old);
      const stale = t.throws(() => assertInteropLibFresh(fakeRoot), /STALE_INTEROP_LIB/);
      t.equal(stale.code, 'STALE_INTEROP_LIB');
      t.equal(stale.stage, 'lib-preflight');
    }),
  unitCase('diagnostic-gate-rejects-hvigor-false-success',
    'A BUILD SUCCESSFUL line cannot hide compiler and linker failures', t => {
      const failed = findFatalDiagnostics([
        '> hvigor BUILD SUCCESSFUL in 5 s',
        '[ERROR] ERROR Code: 11410001 Compile abc files failed.',
        'Semantic error ESE71336: Exported function build requires type annotation.'
      ].join('\n'));
      t.equal(failed.length, 2);
      t.includes(failed[0].text, '11410001');
      t.includes(failed[1].text, 'ESE71336');
      const clean = findFatalDiagnostics([
        'WARNING: SDK declaration uses a deprecated annotation',
        '> hvigor BUILD SUCCESSFUL in 5 s'
      ].join('\n'));
      t.deepEqual(clean, []);
    }),
  unitCase('artifact-freshness-rejects-stale-time-and-hash',
    'Freshness checks reject an old mtime and an unchanged previous artifact hash', t => {
      const artifact = path.join(t.workspace, 'artifact.abc');
      fs.writeFileSync(artifact, Buffer.from('PANDA-new-artifact'));
      const current = assertFreshArtifact(artifact, {
        notBeforeMs: Date.now() - 1000,
        minimumBytes: 4
      });
      t.equal(current.bytes > 4, true);
      t.throws(
        () => assertFreshArtifact(artifact, {
          notBeforeMs: Date.now() - 1000,
          previousHash: current.sha256
        }),
        /hash did not change/);
      const oldDate = new Date(Date.now() - 120000);
      fs.utimesSync(artifact, oldDate, oldDate);
      t.throws(
        () => assertFreshArtifact(artifact, { notBeforeMs: Date.now() }),
        /predates this run/);
    }),
  unitCase('old-bridge-protocol-cannot-use-config-path',
    'Projection validation requires declgenBridgeCodePath and rejects ConfigPath substitution', t => {
      const valid = makeProjectionModule();
      t.equal(assertOldProtocolModule(valid), true);
      const substituted = makeProjectionModule({
        declgenBridgeCodePath: undefined,
        declgenBridgeConfigPath: '/tmp/bridge-config.json'
      });
      t.throws(() => assertOldProtocolModule(substituted), /declgenBridgeCodePath is required/);
      const both = makeProjectionModule({ declgenBridgeConfigPath: '/tmp/config.json' });
      t.throws(() => assertOldProtocolModule(both), /not the old TS bridge protocol/);
      t.throws(
        () => assertOldProtocolModule(valid, { declgenV1OutPath: '/tmp/other' }),
        /does not identify this run/);
      const generated = path.join(t.workspace, 'Generated.ts');
      const cached = path.join(t.workspace, 'Cached.ts');
      fs.writeFileSync(generated,
        'import { Component, Column, Text, Button } from "@ohos.arkui.component";\n' +
        'import { State } from "@ohos.arkui.stateManagement";\nexport {};\n' +
        'const value = function () {};\n');
      fs.writeFileSync(cached, 'const value = function () { };\n');
      assertBridgeIdentity(t, generated, cached, false);
      fs.writeFileSync(generated, 'export {};\nexport { StaticCounter } from "./src/main/ets/StaticCounter";\n');
      fs.writeFileSync(cached,
        'export { StaticCounter } from "@normalized:N&&&static_component/src/main/ets/StaticCounter&1.0.0";\n');
      assertBridgeIdentity(t, generated, cached, true);
      fs.appendFileSync(cached, 'const stale = true;\n');
      t.throws(() => assertBridgeIdentity(t, generated, cached, true), /Caller cache must equal/);
    }),
  unitCase('abc-header-gate-distinguishes-mixed-layouts',
    'ABC validation accepts real header shapes and rejects bad magic, zero versions and short data', t => {
      const dynamic = Buffer.alloc(16);
      dynamic.write('PANDA', 0, 'ascii');
      dynamic.writeUInt32LE(24, 12);
      const staticBuffer = Buffer.alloc(16);
      staticBuffer.write('PANDA', 0, 'ascii');
      staticBuffer.writeUInt32LE(0x07000100, 12);
      const dynamicHeader = readAbcHeader(dynamic);
      const staticHeader = readAbcHeader(staticBuffer);
      t.equal(dynamicHeader.versionHex, '18000000');
      t.equal(staticHeader.versionHex, '00010007');
      t.equal(assertAbcHeader(dynamicHeader, 'dynamic'), true);
      t.equal(assertAbcHeader(staticHeader, 'static'), true);
      t.throws(() => readAbcHeader(Buffer.alloc(4)), /too short/);
      dynamic.write('XXXXX', 0, 'ascii');
      t.throws(() => assertAbcHeader(readAbcHeader(dynamic), 'dynamic'), /magic/);
    }),
  unitCase('bytecode-path-fragment-preserves-module-identity',
    'The real helper derives StaticCounter options class and interface records from declgenV1', t => {
      const { component, evolution, preflight } = production();
      t.record('lib-preflight', preflight);
      evolution.arkTSEvolutionModuleMap.clear();
      evolution.arkTSEvolutionModuleMap.set('static_component', {
        language: '1.2',
        packageName: 'static_component',
        moduleName: 'static_component',
        modulePath: '/TestProject/static_component',
        declgenV1OutPath: '/TestProject/declgenV1'
      });
      try {
        const fragments = component.generateBytecodePathFragement(
          'StaticCounter',
          '/TestProject/declgenV1/src/main/ets/StaticCounter.d.ets',
          'static_component'
        );
        t.equal(fragments.instanceName, '__Options_StaticCounter');
        t.equal(fragments.classPath, STATIC_OPTIONS_RECORD);
        t.equal(fragments.interfacePath, STATIC_OPTIONS_INTERFACE);
        t.record('bytecode-path-fragments', fragments);
      } finally {
        evolution.arkTSEvolutionModuleMap.clear();
      }
    }),
  unitCase('static-options-bridge-assigns-literal-parameter',
    'The real options transformer emits count and presence assignments for a literal argument', t => {
      const { component } = production();
      const options = makeOptions([
        propertyAssignment('count', ts.factory.createNumericLiteral(7))
      ]);
      const transformed = component.createStaticComponentOptions(options, 'StaticCounter');
      const output = printNode(transformed);
      t.includes(output, 'new __Options_StaticCounter()');
      t.includes(output, 'result["count"] = 7');
      t.includes(output, 'result["__options_has_count"] = true');
      t.includes(output, 'return result');
      t.ok(output.indexOf('result["count"]') < output.indexOf('return result'));
      t.record('literal-options-transform', { output });
    }),
  unitCase('static-options-bridge-preserves-dynamic-expression',
    'The real options transformer preserves this.counterSeed instead of flattening it to a constant', t => {
      const { component } = production();
      const counterSeed = ts.factory.createPropertyAccessExpression(
        ts.factory.createThis(),
        ts.factory.createIdentifier('counterSeed'));
      const options = makeOptions([propertyAssignment('count', counterSeed)]);
      const output = printNode(
        component.createStaticComponentOptions(options, 'StaticCounter'));
      t.includes(output, 'result["count"] = this.counterSeed');
      t.includes(output, 'result["__options_has_count"] = true');
      t.notIncludes(output, 'result["count"] = 7');
      t.record('expression-options-transform', { output });
    }),
  unitCase('static-options-empty-call-has-no-parameter-flags',
    'A no-argument static component still gets options without inventing parameter presence flags', t => {
      const { component } = production();
      const output = printNode(
        component.createStaticComponentOptions(makeOptions([]), 'StaticCounter'));
      t.includes(output, 'const result = new __Options_StaticCounter()');
      t.includes(output, 'return result');
      t.notIncludes(output, '__options_has_count');
      t.notIncludes(output, 'counterSeed');
      t.record('empty-options-transform', { output });
    }),
  unitCase('static-component-creation-bridge-uses-options',
    'The real creation helper combines StaticCounter construction with generated options', t => {
      const { component } = production();
      const options = makeOptions([
        propertyAssignment(
          'count',
          ts.factory.createPropertyAccessExpression(
            ts.factory.createThis(),
            ts.factory.createIdentifier('counterSeed')
          )
        )
      ]);
      const statement = component.createStaticComponent(
        'StaticCounter',
        makeNewNode(options),
        makeComponentReturn());
      const output = printNode(statement);
      t.includes(output, 'static_StaticCounter = __Interop_CreateStaticComponent_Internal');
      t.includes(output, 'return new StaticCounter(undefined, undefined)');
      t.includes(output, 'const result = new __Options_StaticCounter()');
      t.includes(output, 'result["count"] = this.counterSeed');
      t.includes(output, 'result["__options_has_count"] = true');
      t.record('static-creation-transform', { output });
    }),
  unitCase('static-component-update-and-stack-order',
    'The real render helper keeps create, push, pop and subsequent update in separate branches', t => {
      const { component } = production();
      const options = makeOptions([
        propertyAssignment('count', ts.factory.createNumericLiteral(3))
      ]);
      const statement = component.createIfStaticComponent(
        makeNewNode(options),
        options,
        'StaticCounter',
        makeComponentReturn());
      const output = printNode(statement);
      t.includes(output, 'if (isInitialRender)');
      t.includes(output, '__Interop_UpdateInteropExtendableComponent_Internal(this)');
      t.includes(output, '__Interop_CreateStaticComponent_Internal');
      t.includes(output, '__Interop_ResetInteropExtendableComponent_Internal()');
      t.includes(output, 'ViewStackProcessor.push(static_StaticCounter[1])');
      t.includes(output, 'ViewStackProcessor.pop()');
      t.includes(output, 'else');
      t.includes(output, 'static_StaticCounter[0]()');
      const order = [
        '__Interop_CreateStaticComponent_Internal',
        'ViewStackProcessor.push(static_StaticCounter[1])',
        'ViewStackProcessor.pop()',
        'static_StaticCounter[0]()'
      ].map(snippet => output.indexOf(snippet));
      t.ok(order.every((value, index) => value >= 0 && (index === 0 || value > order[index - 1])));
      t.record('static-update-transform', { output, order });
    }),
  unitCase('static-component-tuple-and-stack-nodes',
    'The real helper emits a typed static tuple and matching ViewStackProcessor operations', t => {
      const { component } = production();
      const tuple = printNode(component.createStaticTuple('StaticCounter'));
      const push = printNode(component.pushStaticComponent('StaticCounter'));
      const pop = printNode(component.popStaticComponent());
      t.includes(tuple, 'let static_StaticCounter');
      t.includes(tuple.replace(/\s+/g, ''), 'static_StaticCounter:[StaticCounter,number]');
      t.includes(push, 'ViewStackProcessor.push(static_StaticCounter[1])');
      t.includes(pop, 'ViewStackProcessor.pop()');
      t.record('static-stack-transform', { tuple, push, pop });
    }),
  unitCase('interop-transform-preserves-old-ts-bridge',
    'The actual interopTransform leaves generated .ts bridge input untouched', t => {
      const { evolution } = production();
      const bridge = ts.createSourceFile(
        '/tmp/declgenBridgeCode/static_component/StaticCounter.ts',
        `export const StaticCounter = globalThis.Panda.getClass('${STATIC_CLASS_RECORD}');`,
        ts.ScriptTarget.ES2021,
        true,
        ts.ScriptKind.TS);
      const result = ts.transform(bridge, [
        evolution.interopTransform(null, bridge.fileName, true)
      ]);
      t.equal(result.transformed[0], bridge);
      result.dispose();
      const dynamic = ts.createSourceFile(
        '/tmp/entry/Index.ets',
        'const value = 1;',
        ts.ScriptTarget.ES2021,
        true,
        ts.ScriptKind.ETS);
      const nonMixed = ts.transform(dynamic, [
        evolution.interopTransform(null, dynamic.fileName, false)
      ]);
      t.equal(nonMixed.transformed[0], dynamic);
      nonMixed.dispose();
    }),
  unitCase('process-ui-syntax-emits-dynamic-state-update',
    'The actual 1.1 processUISyntax transforms dynamic state and button update UI', t => {
      const { processUISyntax, validate, utils, main } = production();
      const previousPartialUpdate = main.partialUpdateConfig.partialUpdateMode;
      const previousProjectPath = main.projectConfig.projectPath;
      main.projectConfig.projectPath = t.workspace;
      main.partialUpdateConfig.partialUpdateMode = true;
      validate.resetComponentCollection();
      validate.componentCollection.customComponents.clear();
      utils.componentInfo.id = 0;
      utils.storedFileInfo.setCurrentArkTsFile();
      const previousCompiler = process.env.compiler;
      process.env.compiler = 'on';
      try {
        const diagnostics = validate.validateUISyntax(
          UNIT_DYNAMIC_SOURCE,
          UNIT_DYNAMIC_SOURCE,
          'DynamicStateCard.ets'
        );
        t.deepEqual(diagnostics, []);
        const compilerOptions = ts.readConfigFile(
          path.join(COMPILER_ROOT, 'tsconfig.json'),
          ts.sys.readFile
        ).config.compilerOptions;
        Object.assign(compilerOptions, { sourceMap: false, module: ts.ModuleKind.ESNext });
        const result = ts.transpileModule(UNIT_DYNAMIC_SOURCE, {
          compilerOptions,
          fileName: 'DynamicStateCard.ets',
          transformers: { before: [processUISyntax(null, true)] }
        });
        const output = result.outputText;
        t.record('dynamic-process-ui-syntax', { output });
        t.includes(output, 'ObservedPropertySimple');
        t.includes(output, 'Text.create(this.value.toString())');
        t.includes(output, "Button.createWithLabel('increment')");
        t.includes(output, 'this.value += 1');
        t.includes(output, 'updateStateVars');
        t.includes(output, 'this.updateDirtyElements()');
      } finally {
        if (previousCompiler === undefined) {
          delete process.env.compiler;
        } else {
          process.env.compiler = previousCompiler;
        }
        validate.resetComponentCollection();
        main.partialUpdateConfig.partialUpdateMode = previousPartialUpdate;
        main.projectConfig.projectPath = previousProjectPath;
      }
    }),
  unitCase('zero-assertion-case-is-a-failed-report',
    'The reporting layer does not count a no-op case as a successful test',
    async t => {
      const outputRoot = path.join(t.workspace, 'nested-report');
      const summary = await runCases([{
        id: 'no-op',
        group: 'unit',
        direction: DIRECTION,
        description: 'deliberately empty runner control case',
        run() {}
      }], {
        group: 'unit',
        direction: DIRECTION,
        caseId: ''
      }, outputRoot);
      t.equal(summary.total, 1);
      t.equal(summary.failed, 1);
      t.equal(summary.passed, 0);
      t.equal(summary.groups.unit.failed, 1);
      t.equal(fs.existsSync(path.join(outputRoot, 'unit-report.json')), true);
    }
  )
];
module.exports = {
  COMPILER_ROOT,
  assertInteropLibFresh,
  cases,
  makeComponentReturn,
  makeNewNode,
  makeOptions,
  printNode,
  production,
  propertyAssignment
};
