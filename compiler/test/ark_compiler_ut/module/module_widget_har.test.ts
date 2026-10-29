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

import { expect } from 'chai';
import fs from 'fs';
import mocha from 'mocha';
import os from 'os';
import path from 'path';
import sinon from 'sinon';

import { ES2ABC } from '../../../lib/fast_build/ark_compiler/common/ark_define';
import { validateHarWidgetCompile } from '../../../lib/fast_build/ark_compiler/common/process_ark_config';
import { ArkTSErrorDescription, ErrorCode } from '../../../lib/fast_build/ark_compiler/error_code';
import { CommonLogger } from '../../../lib/fast_build/ark_compiler/logger';
import { ModuleMode } from '../../../lib/fast_build/ark_compiler/module/module_mode';
import { etsChecker } from '../../../lib/fast_build/ets_ui/rollup-plugin-ets-checker';
import { MemoryMonitor } from '../../../lib/fast_build/meomry_monitor/rollup-plugin-memory-monitor';
import { toUnixPath } from '../../../lib/utils';
import { projectConfig as mainProjectConfig } from '../../../main';
import RollUpPluginMock from '../mock/rollup_mock/rollup_plugin_mock';

let root: string;
let rollup: RollUpPluginMock;
let abcPath: string;
let widgetAbcPath: string;
let sandbox: sinon.SinonSandbox;
let customizedHarDescriptor: PropertyDescriptor | undefined;

function prepareFixture(): void {
  sandbox = sinon.createSandbox();
  customizedHarDescriptor = Object.getOwnPropertyDescriptor(mainProjectConfig, 'customizedHar');
  mainProjectConfig.customizedHar = false;
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'module-widget-har-'));
  abcPath = toUnixPath(path.join(root, 'library', 'modules.abc'));
  widgetAbcPath = toUnixPath(path.join(root, 'library', 'widgets.abc'));
  rollup = new RollUpPluginMock();
  rollup.build();
  Object.assign(rollup.share.projectConfig, {
    cachePath: path.join(root, 'cache'),
    aceModuleBuild: path.join(root, 'output'),
    projectTopDir: root,
    moduleRootPath: root,
    pandaMode: ES2ABC,
    byteCodeHar: false,
    customizedHar: false,
    widgetCompile: false,
    useNormalizedOHMUrl: false,
    cacheBytecodeHar: true,
    cardEntryObj: {},
    byteCodeHarInfo: { library: { abcPath, widgetAbcPath } }
  });
  fs.mkdirSync(rollup.share.projectConfig.cachePath, { recursive: true });
  CommonLogger.destroyInstance();
}

function cleanFixture(): void {
  sandbox.restore();
  CommonLogger.destroyInstance();
  if (customizedHarDescriptor) {
    Object.defineProperty(mainProjectConfig, 'customizedHar', customizedHarDescriptor);
  } else {
    delete mainProjectConfig.customizedHar;
  }
  fs.rmSync(root, { recursive: true, force: true });
}

function createMode(options: Object = {}): ModuleMode {
  Object.assign(rollup.share.projectConfig, options);
  return new ModuleMode(rollup);
}

function readLines(filePath: string): string[] {
  return fs.readFileSync(filePath, 'utf8').split('\n').filter(line => line.length > 0);
}

function expectCompilerFlags(mode: ModuleMode): void {
  mode.generateEs2AbcCmd();
  expect(mode.cmdArgs).to.include('--enable-abc-input');
  expect(mode.cmdArgs).to.include('--remove-redundant-file');
}

function configureUnsupportedHar(harType: string): void {
  Object.assign(rollup.share.projectConfig, harType === 'bundle HAR' ?
    { projectArkOption: { bundle: { bundledAllDependencies: true } } } :
    { customizedHar: true, customizedOptions: undefined });
}

function expectUnsupportedCompilation(action: () => void, harType: string): void {
  const cause = `Widget compilation is not supported when building a ${harType}.`;
  const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit').callsFake(error => {
    throw new Error(error.cause);
  });

  expect(action).to.throw(cause);
  expect(printError.calledOnce).to.be.true;
  const error = printError.firstCall.args[0];
  expect(error.code).to.equal(ErrorCode.ETS2BUNDLE_EXTERNAL_WIDGET_COMPILATION_NOT_SUPPORTED);
  expect(error.description).to.equal(ArkTSErrorDescription);
  expect(error.cause).to.equal(cause);
}

function registerValidationTests(): void {
  for (const harType of ['bundle HAR', 'customized HAR']) {
    mocha.it(`rejects current ${harType} card compilation without entries or HAR dependencies`, function() {
      configureUnsupportedHar(harType);
      Object.assign(rollup.share.projectConfig, {
        widgetCompile: true,
        byteCodeHar: true,
        cardEntryObj: undefined,
        byteCodeHarInfo: undefined
      });

      expectUnsupportedCompilation(() => validateHarWidgetCompile(rollup), harType);
    });

    mocha.it(`allows ${harType} outside card compilation`, function() {
      configureUnsupportedHar(harType);
      Object.assign(rollup.share.projectConfig, { widgetCompile: false, byteCodeHar: true });
      const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit');

      expect(() => validateHarWidgetCompile(rollup)).not.to.throw();
      expect(printError.called).to.be.false;
    });
  }

  mocha.it('allows bundle options during non-bytecode-HAR card compilation', function() {
    configureUnsupportedHar('bundle HAR');
    Object.assign(rollup.share.projectConfig, { widgetCompile: true, byteCodeHar: false });
    const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit');

    expect(() => validateHarWidgetCompile(rollup)).not.to.throw();
    expect(printError.called).to.be.false;
  });

  mocha.it('allows card compilation of an ordinary bytecode HAR', function() {
    Object.assign(rollup.share.projectConfig, {
      widgetCompile: true,
      byteCodeHar: true,
      projectArkOption: { bundle: { bundledAllDependencies: false } },
      customizedOptions: {}
    });
    const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit');

    expect(() => validateHarWidgetCompile(rollup)).not.to.throw();
    expect(printError.called).to.be.false;
  });
}

function registerCustomizedHarValidationTests(): void {
  mocha.it('rejects the Rollup customized HAR flag without a bytecode flag or base package', function() {
    configureUnsupportedHar('customized HAR');
    Object.assign(rollup.share.projectConfig, { widgetCompile: true, byteCodeHar: false });

    expectUnsupportedCompilation(() => validateHarWidgetCompile(rollup), 'customized HAR');
  });

  mocha.it('uses the Rollup customized HAR flag instead of the main flag or base package', function() {
    mainProjectConfig.customizedHar = true;
    Object.assign(rollup.share.projectConfig, {
      widgetCompile: true,
      byteCodeHar: true,
      customizedHar: false,
      customizedOptions: { basePackage: path.join(root, 'base.abc') }
    });
    const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit');

    expect(() => validateHarWidgetCompile(rollup)).not.to.throw();
    expect(printError.called).to.be.false;
  });
}

function registerCheckerValidationTests(): void {
  for (const harType of ['bundle HAR', 'customized HAR']) {
    mocha.it(`rejects ${harType} card compilation before the checker starts`, function() {
      configureUnsupportedHar(harType);
      Object.assign(rollup.share.projectConfig, {
        widgetCompile: true,
        byteCodeHar: harType === 'bundle HAR',
        cardEntryObj: undefined,
        byteCodeHarInfo: undefined
      });
      const customizedHar = rollup.share.projectConfig.customizedHar;
      const recordStage = sandbox.stub(MemoryMonitor, 'recordStage').throws(new Error('Checker must not start.'));
      const checker = etsChecker();

      expectUnsupportedCompilation(() => checker.buildStart.call(rollup), harType);
      expect(rollup.share.projectConfig.customizedHar).to.equal(customizedHar);
      expect(recordStage.called).to.be.false;
      expect(fs.existsSync(path.join(rollup.share.projectConfig.cachePath, 'filesInfo.txt'))).to.be.false;
    });
  }

  mocha.it('preserves the passed Rollup customized HAR flag when it differs from the main flag', function() {
    mainProjectConfig.customizedHar = true;
    Object.assign(rollup.share.projectConfig, { widgetCompile: true, customizedHar: false });
    const reachedChecker = new Error('Checker reached after HAR validation.');
    const recordStage = sandbox.stub(MemoryMonitor, 'recordStage').throws(reachedChecker);
    const printError = sandbox.stub(CommonLogger.getInstance(rollup), 'printErrorAndExit');
    const checker = etsChecker();

    expect(() => checker.buildStart.call(rollup)).to.throw(reachedChecker);
    expect(rollup.share.projectConfig.customizedHar).to.be.false;
    expect(printError.called).to.be.false;
    expect(recordStage.calledOnce).to.be.true;
  });
}

function registerInputTests(): void {
  mocha.it('includes only the ordinary ABC outside card compilation', function() {
    const mode = createMode();
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([`${abcPath};;;;library;`]);
  });

  mocha.it('includes both HAR ABC files during card compilation', function() {
    const mode = createMode({ widgetCompile: true });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath, widgetAbcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([
      `${abcPath};;;;library;`, `${widgetAbcPath};;;;library;`
    ]);
  });

  for (const value of [undefined, '']) {
    mocha.it(`accepts ${value === undefined ? 'a missing' : 'an empty'} widget ABC path`, function() {
      const info = value === undefined ? { abcPath } : { abcPath, widgetAbcPath: value };
      const mode = createMode({ widgetCompile: true, byteCodeHarInfo: { library: info } });
      mode.genDescriptionsForMergedEs2abc(true, undefined);

      expect(mode.abcPaths).to.deep.equal([abcPath]);
      expect(readLines(mode.filesInfoPath)).to.deep.equal([`${abcPath};;;;library;`]);
    });
  }
}

function registerDeduplicationTests(): void {
  mocha.it('does not repeat the same ABC path within one HAR', function() {
    const mode = createMode({ widgetCompile: true, byteCodeHarInfo: { library: { abcPath, widgetAbcPath: abcPath } } });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([`${abcPath};;;;library;`]);
    expect(readLines(mode.cacheFilePath).filter(line => line.startsWith(abcPath + ';'))).to.have.lengthOf(1);
  });

  mocha.it('preserves each package name when HARs share ABC paths', function() {
    const mode = createMode({
      widgetCompile: true,
      byteCodeHarInfo: { first: { abcPath, widgetAbcPath }, second: { abcPath, widgetAbcPath } }
    });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath, widgetAbcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([
      `${abcPath};;;;first;`, `${widgetAbcPath};;;;first;`,
      `${abcPath};;;;second;`, `${widgetAbcPath};;;;second;`
    ]);
    expect(readLines(mode.cacheFilePath)).to.have.lengthOf(3);
  });
}

function registerHarModeTests(): void {
  mocha.it('excludes the widget ABC when building a bundled bytecode HAR', function() {
    const mode = createMode({
      widgetCompile: true,
      byteCodeHar: true,
      projectArkOption: { bundle: { bundledAllDependencies: true } }
    });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([`${abcPath};;;;library;`]);
  });

  mocha.it('excludes the widget ABC when building a customized HAR', function() {
    const basePackage = toUnixPath(path.join(root, 'base.abc'));
    const mode = createMode({
      widgetCompile: true,
      byteCodeHar: true,
      entryPackageName: 'customized',
      customizedOptions: { basePackage }
    });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.customizedHar).to.be.true;
    expect(mode.abcPaths).to.deep.equal([abcPath, basePackage]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([
      `${abcPath};;;;library;`, `${basePackage};;;;customized;`
    ]);
  });

  mocha.it('does not treat a consuming HAP with bundle options as a bundled HAR', function() {
    const mode = createMode({ widgetCompile: true, projectArkOption: { bundle: { bundledAllDependencies: true } } });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath, widgetAbcPath]);
    expect(readLines(mode.filesInfoPath)).to.include(`${widgetAbcPath};;;;library;`);
  });
}

function registerCacheTests(): void {
  mocha.it('creates separate cache mappings for ordinary and widget ABC files', function() {
    const mode = createMode({ widgetCompile: true });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(readLines(mode.cacheFilePath)).to.deep.equal([
      `${mode.npmEntriesInfoPath};${path.join(root, 'cache', 'npmEntries.protoBin')}`,
      `${abcPath};${path.join(root, 'cache', 'library', 'modules.protoBin')}`,
      `${widgetAbcPath};${path.join(root, 'cache', 'library', 'widgets.protoBin')}`
    ]);
  });

  mocha.it('keeps widget ABC inputs when HAR bytecode caching is disabled', function() {
    const mode = createMode({ widgetCompile: true, cacheBytecodeHar: false });
    mode.genDescriptionsForMergedEs2abc(true, undefined);

    expect(readLines(mode.filesInfoPath)).to.deep.equal([
      `${abcPath};;;;library;`, `${widgetAbcPath};;;;library;`
    ]);
    expect(readLines(mode.cacheFilePath)).to.deep.equal([
      `${mode.npmEntriesInfoPath};${path.join(root, 'cache', 'npmEntries.protoBin')}`
    ]);
  });

  mocha.it('omits both HAR ABC inputs when the incremental input switch is disabled', function() {
    const mode = createMode({ widgetCompile: true });
    mode.genDescriptionsForMergedEs2abc(false, undefined);

    expect(mode.abcPaths).to.deep.equal([abcPath, widgetAbcPath]);
    expect(readLines(mode.filesInfoPath)).to.deep.equal([]);
  });
}

function registerCommandTests(): void {
  for (const cardEntryObj of [{}, undefined]) {
    mocha.it(`retains redundant file removal with ${cardEntryObj ? 'empty' : 'missing'} card entries`, function() {
      const mode = createMode({ widgetCompile: true, cardEntryObj });
      expectCompilerFlags(mode);
    });
  }

  mocha.it('allows redundant file removal when a card entry exists', function() {
    const mode = createMode({ widgetCompile: true, cardEntryObj: { card: path.join(root, 'Card.ets') } });
    expectCompilerFlags(mode);
  });

  mocha.it('retains redundant file removal outside card compilation', function() {
    expectCompilerFlags(createMode());
  });

  mocha.it('does not enable ABC input or removal when there are no HAR dependencies', function() {
    const mode = createMode({ widgetCompile: true, byteCodeHarInfo: {} });
    mode.generateEs2AbcCmd();

    expect(mode.cmdArgs).not.to.include('--enable-abc-input');
    expect(mode.cmdArgs).not.to.include('--remove-redundant-file');
  });
}

function registerContextTests(): void {
  mocha.it('retains redundant file removal with declaration entries', function() {
    const mode = createMode({
      widgetCompile: true,
      useNormalizedOHMUrl: true,
      declarationEntry: ['@normalized:N&&&library/Index&'],
      dependencyAliasMap: new Map(),
      hspNameOhmMap: {}
    });
    const context = JSON.parse(fs.readFileSync(mode.compileContextInfoPath, 'utf8'));

    expect(context.compileEntries).not.to.be.empty;
    expectCompilerFlags(mode);
  });
}

mocha.describe('widget HAR module compilation', function() {
  mocha.beforeEach(prepareFixture);
  mocha.afterEach(cleanFixture);
  registerValidationTests();
  registerCustomizedHarValidationTests();
  registerCheckerValidationTests();
  registerInputTests();
  registerDeduplicationTests();
  registerHarModeTests();
  registerCacheTests();
  registerCommandTests();
  registerContextTests();
});
