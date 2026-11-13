/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use rollupObject file except in compliance with the License.
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

import mocha from 'mocha';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import * as ts from 'typescript';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import {
  DEFAULT_ENTRY,
  DEFAULT_PROJECT,
  EXPECT_INDEX_ETS,
  PROJECT_ROOT
} from './mock/rollup_mock/path_config';
import RollUpPluginMock from './mock/rollup_mock/rollup_plugin_mock';
import {
  addLocalPackageSet,
  compilerOptions,
  localPackageSet,
  needReCheckForChangedDepUsers,
  resetEtsCheck,
  serviceChecker,
  resolveModuleNames as resolveModuleNamesMain,
  getMaxFlowDepth,
  MAX_FLOW_DEPTH_DEFAULT_VALUE,
  fileCache,
  getFileContentWithHash,
  areEqualArrays,
  obfuscationConfigChanged,
  isOhExport
} from '../../lib/ets_checker';
import { TS_BUILD_INFO_SUFFIX } from '../../lib/pre_define';
import {
  globalProgram,
  projectConfig
} from '../../main';
import { mkdirsSync } from '../../lib/utils';
import {
  arkTSEvolutionModuleMap,
  cleanUpProcessArkTSEvolutionObj
} from '../../lib/fast_build/ark_compiler/interop/process_arkts_evolution';

mocha.describe('test ets_checker file api', function () {
    mocha.before(function () {
        this.rollup = new RollUpPluginMock();
    });

    mocha.after(() => {
        delete this.rollup;
        const cacheFile: string = path.resolve(projectConfig.cachePath, '../.ts_checker_cache');
        const cacheFileWidget: string = path.resolve(projectConfig.cachePath, '../.ts_checker_cache_widget');
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
        if (fs.existsSync(cacheFileWidget)) {
            fs.unlinkSync(cacheFileWidget);
        }
        const tsBuildInfoFilePath: string = path.resolve(projectConfig.cachePath, '..', TS_BUILD_INFO_SUFFIX);
        const tsBuildInfoWidgetFilePath: string = path.resolve(projectConfig.cachePath, '..', TS_BUILD_INFO_SUFFIX + '_widget');
        if (fs.existsSync(tsBuildInfoFilePath)) {
            fs.unlinkSync(tsBuildInfoFilePath);
        }
        if (fs.existsSync(tsBuildInfoWidgetFilePath)) {
            fs.unlinkSync(tsBuildInfoWidgetFilePath);
        }
        const tsBuildInfoLinterFilePath: string = tsBuildInfoFilePath + '.linter';
        const tsBuildInfoWidgetLinterFilePath: string = tsBuildInfoWidgetFilePath + '.linter';
        if (fs.existsSync(tsBuildInfoLinterFilePath)) {
            fs.unlinkSync(tsBuildInfoLinterFilePath);
        }
        if (fs.existsSync(tsBuildInfoWidgetLinterFilePath)) {
            fs.unlinkSync(tsBuildInfoWidgetLinterFilePath);
        }
    });

    mocha.it('1-1: test addLocalPackageSet for original ohmurl', function () {
        this.rollup.build();
        const rollupObject = this.rollup;
        const rollupFileList = rollupObject.getModuleIds();
        projectConfig.useNormalizedOHMUrl = false;
        for (const moduleId of rollupFileList) {
            if (fs.existsSync(moduleId)) {
                addLocalPackageSet(moduleId, rollupObject);
            }
        }
        expect(localPackageSet.has('entry')).to.be.true;
        localPackageSet.clear();
    });

    mocha.it('1-2: test addLocalPackageSet for normalized ohmurl', function () {
        this.rollup.build();
        const rollupObject = this.rollup;
        const rollupFileList = rollupObject.getModuleIds();
        projectConfig.useNormalizedOHMUrl = true;
        for (const moduleId of rollupFileList) {
            const moduleInfo: Object = rollupObject.getModuleInfo(moduleId);
            if (moduleInfo) {
                const metaInfo: Object = moduleInfo.meta;
                metaInfo.pkgName = 'pkgname';
            }
            if (fs.existsSync(moduleId)) {
                addLocalPackageSet(moduleId, rollupObject);
            }
        }
        expect(localPackageSet.has('pkgname')).to.be.true;
    });

    mocha.it('1-3: test getOrCreateLanguageService when dependency in oh-package.json change', function () {
        this.timeout(10000);
        this.rollup.build();
        let rollupObject = this.rollup;
        expect(needReCheckForChangedDepUsers).to.be.false;

        interface MockCacheStore {
            service: Object | undefined;
            pkgJsonFileHash: string;
            targetESVersion: number;
        }
        const mockServiceCache = {
            service: undefined,
            pkgJsonFileHash: '9f07917d395682c73a90af8f5796a2c6',
            targetESVersion: 8
        }
        let mockCache = new Map<string, MockCacheStore>();
        mockCache.set('service', mockServiceCache);
        rollupObject.share.cache = mockCache;
        rollupObject.share.depInfo = {enableIncre: true};
        rollupObject.share.projectConfig.pkgJsonFileHash = '26bde0f30dda53b0afcbf39428ec9851';
        Object.assign(projectConfig, rollupObject.share.projectConfig);

        // The current hash and the hash in cache of the dependency differs, should recheck
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, rollupObject.share);
        expect(needReCheckForChangedDepUsers).to.be.true;
        expect(globalProgram.program != null).to.be.true;

        resetEtsCheck();
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program == null).to.be.true;

        // The current hash and the hash in cache of the dependency are the same, no need to recheck
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, rollupObject.share);
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program != null).to.be.true;

        resetEtsCheck();
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program == null).to.be.true;
    });

    mocha.it('1-4: test getOrCreateLanguageService when paths in compilerOptions change', function () {
        this.timeout(10000);
        this.rollup.build();
        let rollupObject = this.rollup;
        process.env.compileTool = 'rollup';

        Object.assign(projectConfig, rollupObject.share.projectConfig);
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, rollupObject.share);
        expect(JSON.stringify(compilerOptions.paths) === '{"*":["*","../../../../*","../*"]}').to.be.true;
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program != null).to.be.true;
        expect(compilerOptions.skipPathsInKeyForCompilationSettings).to.be.true;

        resetEtsCheck();
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program == null).to.be.true;
        expect(compilerOptions.skipPathsInKeyForCompilationSettings).to.be.true;

        interface MockCacheStore {
            service: Object | undefined;
            pkgJsonFileHash: string;
            targetESVersion: number;
        }
        const mockServiceCache = {
            service: undefined,
            pkgJsonFileHash: '9f07917d395682c73a90af8f5796a2c6',
            targetESVersion: 8
        }
        let mockCache = new Map<string, MockCacheStore>();
        mockCache.set('service', mockServiceCache);
        rollupObject.share.cache = mockCache;
        rollupObject.share.depInfo = {enableIncre: true};
        rollupObject.share.projectConfig.pkgJsonFileHash = '26bde0f30dda53b0afcbf39428ec9851';

        // The current hash of the dependency differs, and the paths in compilerOptions will change since resolveModulePaths change
        const resolveModulePaths = ['../testdata/expect'];
        serviceChecker([EXPECT_INDEX_ETS], null, resolveModulePaths, null, rollupObject.share);
        expect(JSON.stringify(compilerOptions.paths) === '{"*":["*","../../../../../../../testdata/expect/*"]}').to.be.true;
        expect(needReCheckForChangedDepUsers).to.be.true;
        expect(globalProgram.program != null).to.be.true;
        expect(compilerOptions.skipPathsInKeyForCompilationSettings).to.be.true;

        resetEtsCheck();
        expect(needReCheckForChangedDepUsers).to.be.false;
        expect(globalProgram.program == null).to.be.true;
        expect(compilerOptions.skipPathsInKeyForCompilationSettings).to.be.true;
    });
    mocha.it('1-4-1: test enableAccurateNullChecks ArkTS version gate and cache invalidation', function () {
        this.timeout(10000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const share = this.rollup.share;
        share.projectConfig.arkTSVersion = '1.0';
        share.projectConfig.enableAccurateNullChecks = true;
        Object.assign(projectConfig, share.projectConfig);

        serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);
        const firstCache = share.cache.get('service') as {
            service: ts.LanguageService;
            enableAccurateNullChecks: boolean;
        };
        const options = compilerOptions as ts.CompilerOptions & { enableAccurateNullChecks?: boolean };
        expect(options.enableAccurateNullChecks).to.be.false;
        expect(firstCache.enableAccurateNullChecks).to.be.false;
        const firstService = firstCache.service;
        resetEtsCheck();

        share.projectConfig.arkTSVersion = '1.1';
        Object.assign(projectConfig, share.projectConfig);
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);
        const secondCache = share.cache.get('service') as {
            service: ts.LanguageService;
            enableAccurateNullChecks: boolean;
        };
        expect(options.enableAccurateNullChecks).to.be.true;
        expect(secondCache.enableAccurateNullChecks).to.be.true;
        expect(secondCache.service).to.not.equal(firstService);
        resetEtsCheck();
    });
    mocha.it('1-4-2: test enableAccurateNullChecks uses the default ArkTS version', function () {
        this.timeout(10000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const share = this.rollup.share;
        share.projectConfig.arkTSVersion = undefined;
        share.projectConfig.enableAccurateNullChecks = true;
        Object.assign(projectConfig, share.projectConfig);

        serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);
        const cache = share.cache.get('service') as {
            enableAccurateNullChecks: boolean;
        };
        const options = compilerOptions as ts.CompilerOptions & { enableAccurateNullChecks?: boolean };
        expect(options.enableAccurateNullChecks).to.be.true;
        expect(cache.enableAccurateNullChecks).to.be.true;
        resetEtsCheck();
    });
    mocha.it('1-5: test obfuscation rule change rebuilds language service', function () {
        this.timeout(10000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const rulePath = path.join(tempDir, 'obfuscation-rules.txt');
        fs.writeFileSync(rulePath, '-keep-global-name A\n', 'utf-8');
        this.rollup.share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [rulePath]
                }
            }
        };
        Object.assign(projectConfig, this.rollup.share.projectConfig);

        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        fs.writeFileSync(rulePath, '-keep-global-name B\n', 'utf-8');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-6: test disabled or absent obfuscation never rebuilds language service', function () {
        this.timeout(30000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const rulePath = path.join(tempDir, 'obfuscation-rules.txt');
        fs.writeFileSync(rulePath, '-keep-global-name A\n', 'utf-8');
        const share = this.rollup.share;
        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: false,
                    rules: [rulePath]
                }
            }
        };
        Object.assign(projectConfig, share.projectConfig);
        const check = (): void => serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);

        check();
        resetEtsCheck();
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        fs.writeFileSync(rulePath, '-keep-global-name B\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        share.projectConfig.obfuscationOptions = undefined;
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [rulePath]
                }
            }
        };
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-7: test obfuscation rule path list change rebuilds language service', function () {
        this.timeout(30000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const firstRulePath = path.join(tempDir, 'first-rules.txt');
        const secondRulePath = path.join(tempDir, 'second-rules.txt');
        fs.writeFileSync(firstRulePath, '-keep-global-name A\n', 'utf-8');
        fs.writeFileSync(secondRulePath, '-keep-global-name B\n', 'utf-8');
        const share = this.rollup.share;
        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [firstRulePath]
                }
            }
        };
        Object.assign(projectConfig, share.projectConfig);
        const check = (): void => serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);
        const updateRules = (rules: string | string[]): void => {
            share.projectConfig.obfuscationOptions.selfConfig.ruleOptions.rules = rules;
        };

        check();
        resetEtsCheck();
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        updateRules(firstRulePath);
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        updateRules([firstRulePath, secondRulePath]);
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        updateRules([firstRulePath]);
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-8: test obfuscation files and consumer rule paths rebuild language service', function () {
        this.timeout(30000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const rulePath = path.join(tempDir, 'rules.txt');
        const filesPath = path.join(tempDir, 'files.txt');
        const consumerRulePath = path.join(tempDir, 'consumer-rules.txt');
        const consumerFilesPath = path.join(tempDir, 'consumer-files.txt');
        fs.writeFileSync(rulePath, '-keep-global-name R\n', 'utf-8');
        fs.writeFileSync(filesPath, '-keep-global-name F\n', 'utf-8');
        fs.writeFileSync(consumerRulePath, '-keep-global-name C\n', 'utf-8');
        fs.writeFileSync(consumerFilesPath, '-keep-global-name D\n', 'utf-8');
        const share = this.rollup.share;
        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [rulePath],
                    files: [filesPath]
                },
                consumerRules: [consumerRulePath],
                consumerFiles: [consumerFilesPath]
            }
        };
        Object.assign(projectConfig, share.projectConfig);
        const check = (): void => serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);

        check();
        resetEtsCheck();
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        fs.writeFileSync(filesPath, '-keep-global-name F2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        fs.writeFileSync(consumerRulePath, '-keep-global-name C2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        fs.writeFileSync(consumerFilesPath, '-keep-global-name D2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-9: test missing obfuscation rule file appearing rebuilds language service', function () {
        this.timeout(30000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const missingRulePath = path.join(tempDir, 'missing-rules.txt');
        const share = this.rollup.share;
        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [missingRulePath]
                }
            }
        };
        Object.assign(projectConfig, share.projectConfig);
        const check = (): void => serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);

        check();
        resetEtsCheck();
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        fs.writeFileSync(missingRulePath, '-keep-global-name A\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-10: test obfuscation dependency rule paths rebuild language service', function () {
        this.timeout(40000);
        this.rollup.build();
        this.rollup.share.initWithCache();
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ets-checker-obfuscation-'));
        const rulePath = path.join(tempDir, 'rules.txt');
        const harRulePath = path.join(tempDir, 'har-rules.txt');
        const hspRulePath = path.join(tempDir, 'hsp-rules.txt');
        const libraryRulePath = path.join(tempDir, 'library-rules.txt');
        const hspLibraryRulePath = path.join(tempDir, 'hsp-library-rules.txt');
        fs.writeFileSync(rulePath, '-keep-global-name R\n', 'utf-8');
        fs.writeFileSync(harRulePath, '-keep-global-name H\n', 'utf-8');
        fs.writeFileSync(hspRulePath, '-keep-global-name S\n', 'utf-8');
        fs.writeFileSync(libraryRulePath, '-keep-global-name L\n', 'utf-8');
        fs.writeFileSync(hspLibraryRulePath, '-keep-global-name P\n', 'utf-8');
        const share = this.rollup.share;
        share.projectConfig.obfuscationOptions = {
            selfConfig: {
                ruleOptions: {
                    enable: true,
                    rules: [rulePath]
                }
            }
        };
        Object.assign(projectConfig, share.projectConfig);
        const check = (): void => serviceChecker([EXPECT_INDEX_ETS], null, null, null, share);

        check();
        resetEtsCheck();
        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        share.projectConfig.obfuscationOptions.dependencies = {
            hars: [harRulePath],
            hsps: [hspRulePath],
            libraries: [{ ruleOptions: { rules: [libraryRulePath] } }],
            hspLibraries: [{ consumerRules: [hspLibraryRulePath] }]
        };
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        check();
        expect(obfuscationConfigChanged).to.be.false;
        resetEtsCheck();

        fs.writeFileSync(harRulePath, '-keep-global-name H2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        fs.writeFileSync(libraryRulePath, '-keep-global-name L2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();

        fs.writeFileSync(hspLibraryRulePath, '-keep-global-name P2\n', 'utf-8');
        check();
        expect(obfuscationConfigChanged).to.be.true;
        resetEtsCheck();
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    mocha.it('1-11: test GetEmitHost of program', function () {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testGetEmitHost.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        expect(program.getEmitHost()).to.not.be.undefined;
    });
});

mocha.describe('test areEqualArrays function', () => {
    // test cases for basic functions
    mocha.it('1-1: should return true for identical arrays', () => {
        expect(areEqualArrays(['a', 'b', 'c'], ['a', 'b', 'c'])).to.equal(true);
    });

    mocha.it('1-2: should return true for arrays with same elements in different order', () => {
        expect(areEqualArrays(['a', 'b', 'c'], ['c', 'a', 'b'])).to.equal(true);
    });

    mocha.it('1-3: should return false for arrays with different elements', () => {
        expect(areEqualArrays(['a', 'b', 'c'], ['a', 'b', 'd'])).to.equal(false);
    });

    mocha.it('1-4: should return false for arrays with different lengths', () => {
        expect(areEqualArrays(['a', 'b', 'c'], ['a', 'b'])).to.equal(false);
        expect(areEqualArrays(['a', 'b'], ['a', 'b', 'c'])).to.equal(false);
    });

    // test cases for boundary conditions
    mocha.it('1-5: should return true for empty arrays', () => {
        expect(areEqualArrays([], [])).to.equal(true);
    });

    mocha.it('1-6: should return false when one array is empty and other is not', () => {
        expect(areEqualArrays([], ['a'])).to.equal(false);
        expect(areEqualArrays(['a'], [])).to.equal(false);
    });

    // test cases for null and undefined scenarios
    mocha.it('1-7: should return true when both arrays are undefined', () => {
        expect(areEqualArrays(undefined, undefined)).to.equal(true);
    });

    mocha.it('1-8: should return true when both arrays are null', () => {
        expect(areEqualArrays(null as any, null as any)).to.equal(true);
    });

    mocha.it('1-9: should return false when one array is undefined and other is not', () => {
        expect(areEqualArrays(undefined, ['a'])).to.equal(false);
        expect(areEqualArrays(['a'], undefined)).to.equal(false);
    });

    mocha.it('1-10: should return false when one array is null and other is not', () => {
        expect(areEqualArrays(null as any, ['a'])).to.equal(false);
        expect(areEqualArrays(['a'], null as any)).to.equal(false);
    });

    // test cases for duplicate elements
    mocha.it('1-11: should handle duplicate elements correctly', () => {
        expect(areEqualArrays(['a', 'a', 'b'], ['a', 'b', 'a'])).to.equal(true);
        expect(areEqualArrays(['a', 'a', 'b'], ['a', 'b', 'b'])).to.equal(true);
    });

    // test case sensitivity scenarios
    mocha.it('1-12: should be case sensitive', () => {
        expect(areEqualArrays(['A', 'B'], ['a', 'b'])).to.equal(false);
        expect(areEqualArrays(['A', 'B'], ['A', 'B'])).to.equal(true);
    });

    // test cases for special value scenarios
    mocha.it('1-13: should handle special values', () => {
        expect(areEqualArrays(['', 'null'], ['', 'null'])).to.equal(true);
        expect(areEqualArrays(['0', '1'], ['0', '1'])).to.equal(true);
    });

    // test cases for performance
    mocha.it('1-14: should handle large arrays efficiently', () => {
        const largeArray1 = Array(10000).fill('item');
        const largeArray2 = Array(10000).fill('item');

        expect(areEqualArrays(largeArray1, largeArray2)).to.equal(true);
    });

    // test cases for the edge condition
    mocha.it('1-15: should return false for arrays with same length but different content', () => {
        expect(areEqualArrays(['a', 'b'], ['a', 'c'])).to.equal(false);
    });

    mocha.it('1-16: should return true for single element arrays', () => {
        expect(areEqualArrays(['a'], ['a'])).to.equal(true);
        expect(areEqualArrays(['a'], ['b'])).to.equal(false);
    });
  });

mocha.describe('getMaxFlowDepth', () => { 
    mocha.it('1-1: test should return the default value when maxFlowDepth is undefined', () => {
        const result = getMaxFlowDepth();
        expect(result).to.equal(MAX_FLOW_DEPTH_DEFAULT_VALUE);
    });

    mocha.it('1-2: test should return the default value and log a warning when maxFlowDepth is less than the minimum valid value', () => {
        const invalidMaxFlowDepth = 1999;
        projectConfig.projectArkOption = {
            tscConfig: {
                maxFlowDepth: invalidMaxFlowDepth
          }
        }
        const result = getMaxFlowDepth();
        expect(result).to.equal(MAX_FLOW_DEPTH_DEFAULT_VALUE);
    });

    mocha.it('1-3: test should return the value of maxFlowDepth when it is 2000 within the valid range', () => {
        const validMaxFlowDepth = 2000;
        projectConfig.projectArkOption = {
            tscConfig: {
                maxFlowDepth: validMaxFlowDepth
            }
        }
        const result = getMaxFlowDepth();
        expect(result).to.equal(validMaxFlowDepth);
    });

    mocha.it('1-4: test should return the value of maxFlowDepth when it is 3000 within the valid range', () => {
        const validMaxFlowDepth = 3000;
        projectConfig.projectArkOption = {
            tscConfig: {
                maxFlowDepth: validMaxFlowDepth
            }
        }
        const result = getMaxFlowDepth();
        expect(result).to.equal(validMaxFlowDepth);
    });

    mocha.it('1-5: test should return the value of maxFlowDepth when it is 65535 within the valid range', () => {
        const validMaxFlowDepth = 65535;
        projectConfig.projectArkOption = {
            tscConfig: {
                maxFlowDepth: validMaxFlowDepth
            }
        }
        const result = getMaxFlowDepth();
        expect(result).to.equal(validMaxFlowDepth);
    });

    mocha.it('1-6: test should return the default value and log a warning when maxFlowDepth is greater than the maximum valid value', () => {
        const invalidMaxFlowDepth = 65536;
        projectConfig.projectArkOption = {
            tscConfig: {
                maxFlowDepth: invalidMaxFlowDepth
            }
        }
        const result = getMaxFlowDepth();
        expect(result).to.equal(MAX_FLOW_DEPTH_DEFAULT_VALUE);
    });
});

mocha.describe('setProgramSourceFiles', () => { 
    mocha.it('1-1: test add new sourcefile to program', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        const fileContent: string = `
            let a = 1;
        `;
        let newSourceFile: ts.SourceFile = ts.createSourceFile('demo.ts', fileContent, ts.ScriptTarget.ES2021, true);
        expect(program.getSourceFiles().includes(newSourceFile)).to.be.false;
        expect(program.getSourceFile('demo.ts')).to.be.undefined;
        const origrinFileSize: number = program.getSourceFiles().length;
        program.setProgramSourceFiles(newSourceFile);
        const newFileSize: number = program.getSourceFiles().length;
        expect(program.getSourceFiles().includes(newSourceFile)).to.be.true;
        expect(program.getSourceFile('demo.ts')).to.not.be.undefined;
        expect(origrinFileSize === (newFileSize - 1)).to.be.true;
    });
  
    mocha.it('1-2: test should do nothing when adding an existed sourcefile to the program', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        const fileContent1: string = `let a = 1;`;
        let newSourceFile1: ts.SourceFile = ts.createSourceFile('demo.ts', fileContent1, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile1);
        const origrinFileSize: number = program.getSourceFiles().length;
        expect(program.getSourceFiles().includes(newSourceFile1)).to.be.true;
        expect(program.getSourceFile('demo.ts').text).to.be.equal('let a = 1;');
        const fileContent2: string = `let b = 1;`;
        let newSourceFile2: ts.SourceFile = ts.createSourceFile('demo.ts', fileContent2, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile2);
        const newFileSize: number = program.getSourceFiles().length;
        expect(program.getSourceFiles().includes(newSourceFile2)).to.be.false;
        expect(program.getSourceFile('demo.ts').text).to.be.equal('let a = 1;');
        expect(origrinFileSize === newFileSize).to.be.true;
    });
});

mocha.describe('initProcessingFiles and getProcessingFiles', () => { 
    mocha.it('1-1: test should return undefined when processingDefaultFiles and processingOtherFiles is undefined', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        let processingFiles: ts.SourceFile[] | undefined = program.getProcessingFiles();
        expect(processingFiles === undefined).to.be.true;
    });
  
    mocha.it('1-2: test should return array when processingDefaultFiles and processingOtherFiles is not undefined', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        program.initProcessingFiles();
        let processingFiles: ts.SourceFile[] | undefined = program.getProcessingFiles();
        expect(processingFiles === undefined).to.be.false;
    });

});

mocha.describe('refreshTypeChecker', () => { 
    mocha.it('1-1: test should recreate typeChecker and linterTypeChecker', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        const fileContent: string = `
            let a = 1;
            let b = x; // Error!
        `;
        let newSourceFile: ts.SourceFile = ts.createSourceFile('demo.ts', fileContent, ts.ScriptTarget.ES2021, true);
        newSourceFile.originalFileName = newSourceFile.fileName;
        newSourceFile.resolvedPath = 'demo.ts';
        newSourceFile.path = 'demo.ts';
        program.processImportedModules(newSourceFile);
        program.setProgramSourceFiles(newSourceFile);
        program.refreshTypeChecker();
        const diagnostics: readonly ts.Diagnostic[] = program.getSemanticDiagnostics(newSourceFile);
        expect(diagnostics[0].messageText === `Cannot find name 'x'.`);
        expect(diagnostics.length === 1).to.be.true;
    });
});

mocha.describe('deleteProgramSourceFiles', () => { 
    mocha.it('1-1: test should delete when sourcefiles are exist in program', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        const fileContent1: string = `
            let a = 1;
        `;
        let newSourceFile1: ts.SourceFile = ts.createSourceFile('demo1.ts', fileContent1, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile1);
        expect(program.getSourceFiles().includes(newSourceFile1)).to.be.true;
        expect(program.getSourceFile('demo1.ts')).to.not.be.undefined;
        const fileContent2: string = `
            let b = 1;
        `;
        let newSourceFile2: ts.SourceFile = ts.createSourceFile('demo2.ts', fileContent2, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile2);
        expect(program.getSourceFiles().includes(newSourceFile2)).to.be.true;
        expect(program.getSourceFile('demo2.ts')).to.not.be.undefined;
        const origrinFileSize: number = program.getSourceFiles().length;
        const deleteFileNames: string[] = ['demo1.ts', 'demo2.ts'];
        program.deleteProgramSourceFiles(deleteFileNames);
        expect(program.getSourceFiles().includes(newSourceFile1)).to.be.false;
        expect(program.getSourceFile('demo1.ts')).to.be.undefined;
        expect(program.getSourceFiles().includes(newSourceFile2)).to.be.false;
        expect(program.getSourceFile('demo2.ts')).to.be.undefined;
        const newFileSize: number = program.getSourceFiles().length;
        expect(origrinFileSize === (newFileSize + 2)).to.be.true;
    });

    mocha.it('1-2: test should do nothing when sourcefiles are not exist in program', () => {
        const compilerOptions: ts.CompilerOptions = {
            target: ts.ScriptTarget.ES2021
        };
        const fileNames: string[] = ['../testdata/testfiles/testProgramSourceFiles.ts'];
        let program: ts.Program = ts.createProgram(fileNames, compilerOptions);
        const fileContent1: string = `
            let a = 1;
        `;
        let newSourceFile1: ts.SourceFile = ts.createSourceFile('demo1.ts', fileContent1, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile1);
        expect(program.getSourceFiles().includes(newSourceFile1)).to.be.true;
        expect(program.getSourceFile('demo1.ts')).to.not.be.undefined;
        const fileContent2: string = `
            let b = 1;
        `;
        let newSourceFile2: ts.SourceFile = ts.createSourceFile('demo2.ts', fileContent2, ts.ScriptTarget.ES2021, true);
        program.setProgramSourceFiles(newSourceFile2);
        expect(program.getSourceFiles().includes(newSourceFile2)).to.be.true;
        expect(program.getSourceFile('demo2.ts')).to.not.be.undefined;
        const origrinFileSize: number = program.getSourceFiles().length;
        const deleteFileNames: string[] = ['demo3.ts', 'demo4.ts'];
        program.deleteProgramSourceFiles(deleteFileNames);
        expect(program.getSourceFiles().includes(newSourceFile1)).to.be.true;
        expect(program.getSourceFile('demo1.ts')).to.not.be.undefined;
        expect(program.getSourceFiles().includes(newSourceFile2)).to.be.true;
        expect(program.getSourceFile('demo2.ts')).to.not.be.undefined;
        const newFileSize: number = program.getSourceFiles().length;
        expect(origrinFileSize === newFileSize).to.be.true;
    });
});

mocha.describe('optimize createProgram', () => {
    const testFileName = 'test.txt';
    const testFileContent = 'Hello, world!';
    let readFileSyncStub: sinon.SinonStub;

    mocha.beforeEach(() => {
      fileCache.clear();
      readFileSyncStub = sinon.stub(fs, 'readFileSync').returns(Buffer.from(testFileContent));
    });
  
    mocha.afterEach(() => {
      sinon.restore();
    });

    mocha.it('1-1: test should return file content when file exists ', () => {
      const result = getFileContentWithHash(testFileName);
      expect(result).to.equal(testFileContent);
    });

    mocha.it('1-2: test should cache the file content after first read', () => {
        // First call - should read from file system
        const firstResult = getFileContentWithHash(testFileName);
        expect(fileCache.has(testFileName)).to.be.true;
        expect(fileCache.get(testFileName)).to.equal(testFileContent);
        
        // Second call - should use cache
        readFileSyncStub.resetHistory();
        const secondResult = getFileContentWithHash(testFileName);
        expect(readFileSyncStub.called).to.be.false;
        expect(secondResult).to.equal(firstResult);
    });
});

mocha.describe('function isOhExport', () => {  
    mocha.beforeEach(() => {
        projectConfig.depName2OhExports = new Map()
    });

    mocha.it('1-1: should return true when both parameters are undefined', () => {
      const result = isOhExport(undefined, undefined);
      expect(result).to.be.true;
    });

    mocha.it('1-2: should return true when resolvedFileName is undefined', () => {
      const result = isOhExport('library', undefined);
      expect(result).to.be.true;
    });

    mocha.it('1-3: should return true when packageName is undefined', () => {
      const result = isOhExport(undefined, 'D:/xxx/Myapplication/library/src/main/ets/test.d.ets');
      expect(result).to.be.true;
    });

    mocha.it('1-4: should return true when package exists and file path matches', () => {
      projectConfig.depName2OhExports.set('library', { 'oh-exports': new Set(['D:/xxx/TestApplication/library/src/main/ets/test.d.ets']) })
      const result = isOhExport('library', 'D:/xxx/TestApplication/library/src/main/ets/test.d.ets');
      expect(result).to.be.true;
    });

    mocha.it('1-5: Should return true when package is not configured in oh-exports', () => {
      projectConfig.depName2OhExports.set('library', { 'oh-exports': new Set(['D:/xxx/TestApplication/library/src/main/ets/test.d.ets']) })
      const result = isOhExport('isNotOhExportLibrary', 'D:/xxx/TestApplication/library/src/main/ets/test.d.ets');
      expect(result).to.be.true;
    });

    mocha.it('1-6: Should return false when package exists but file path does not match', () => {
      projectConfig.depName2OhExports.set('library', { 'oh-exports': new Set(['D:/xxx/TestApplication/library/src/main/ets/test.d.ets']) })
      const result = isOhExport('library', 'D:/xxx/TestApplication/library/src/main/ets/test2.d.ets');
      expect(result).to.be.false;
    });
});

const externalApiPathsSandbox: sinon.SinonSandbox = sinon.createSandbox();
let resolveModuleNameStub: sinon.SinonStub;
let resolveModuleNamesIsolated: typeof resolveModuleNamesMain;
let savedExternalApiConfig: Record<string, unknown> = {};

function makeResolvedModule(resolvedFileName?: string, originalPath?: string):
  ts.ResolvedModuleFull & { originalPath?: string } {
  return { resolvedFileName, extension: ts.Extension.Dts, originalPath } as
    ts.ResolvedModuleFull & { originalPath?: string };
}

function setupIsolatedEtsChecker(): void {
  resolveModuleNameStub = externalApiPathsSandbox.stub();
  // Load an isolated lib/ets_checker instance whose typescript import is stubbed,
  // so per-test resolveModuleName results do not touch the real file system.
  const tsWithStub: typeof ts = Object.assign({}, ts, { resolveModuleName: resolveModuleNameStub });
  resolveModuleNamesIsolated =
    proxyquire('../../lib/ets_checker', { 'typescript': tsWithStub }).resolveModuleNames;
}

mocha.describe('module resolution memoization', () => {
  let checker: typeof import('../../lib/ets_checker');
  let realpath: sinon.SinonStub;
  const dependency: string = path.resolve('shared.ts');
  const first: string = path.resolve('first.ets');
  const second: string = path.resolve('second.ets');

  mocha.beforeEach((): void => {
    snapshotProjectConfig();
    quarantineProjectConfig();
    projectConfig.externalApiPaths = undefined;
    realpath = sinon.stub();
    const resolveModuleName = sinon.stub().callsFake(() => ({
      resolvedModule: makeResolvedModule(dependency)
    }));
    checker = proxyquire('../../lib/ets_checker', {
      'typescript': { ...ts, sys: { ...ts.sys, realpath }, resolveModuleName }
    });
  });

  mocha.afterEach((): void => {
    checker.resetEtsCheck();
    restoreProjectConfig();
  });

  function installPathsSetter(options: ts.CompilerOptions): void {
    let mergedPaths: NonNullable<ts.CompilerOptions['paths']> = { '*': ['initial/*'], '@alias/*': ['alias/*'] };
    // Match the Hvigor merge of two wildcard rules.
    Object.defineProperty(options, 'paths', {
      enumerable: true,
      configurable: true,
      get: () => mergedPaths,
      set(incomingPaths: NonNullable<ts.CompilerOptions['paths']>) {
        mergedPaths['*'] = [...new Set([...mergedPaths['*'], ...incomingPaths['*']])];
        delete incomingPaths['*'];
        mergedPaths = { ...mergedPaths, ...incomingPaths };
      }
    });
  }

  mocha.it('freezes the merged Hvigor paths after configuration and reuses them in Rollup preview', () => {
    const resolveModuleName = sinon.stub().returns({ resolvedModule: makeResolvedModule(dependency) });
    const config = { cachePath: process.cwd(), projectPath: process.cwd() };
    const isolatedChecker: typeof checker = proxyquire('../../lib/ets_checker', {
      '../main': { projectConfig: config },
      'typescript': { ...ts, createWatchCompilerHost: sinon.stub().returns({}), resolveModuleName }
    });
    const savedCompileTool: string | undefined = process.env.compileTool;
    process.env.compileTool = 'rollup';
    try {
      installPathsSetter(isolatedChecker.compilerOptions);
      isolatedChecker.createWatchCompilerHost([], () => {}, () => {}, () => {}, false, [path.resolve('first-lib')]);
      isolatedChecker.resolveModuleNames(['shared', 'other'], first);
      const firstPaths = resolveModuleName.firstCall.args[2].paths;
      expect(firstPaths).to.deep.equal({ '*': ['initial/*', '*', path.join('first-lib', '*')], '@alias/*': ['alias/*'] });
      expect(Object.isFrozen(firstPaths)).to.be.true;
      expect(isolatedChecker.compilerOptions.paths).to.equal(firstPaths);
      expect(resolveModuleName.secondCall.args[2].paths).to.equal(firstPaths);

      isolatedChecker.createWatchCompilerHost([], () => {}, () => {}, () => {}, true);
      expect(isolatedChecker.compilerOptions.paths).to.equal(firstPaths);

      // Hvigor installs a new setter with new build configuration before starting a new build.
      installPathsSetter(isolatedChecker.compilerOptions);
      isolatedChecker.createWatchCompilerHost([], () => {}, () => {}, () => {},
        false, [path.resolve('first-lib'), path.resolve('second-lib')]);
      isolatedChecker.resolveModuleNames(['shared'], second);
      const updatedPaths = resolveModuleName.lastCall.args[2].paths;
      expect(updatedPaths).not.to.equal(firstPaths);
      expect(Object.isFrozen(updatedPaths)).to.be.true;
      expect(updatedPaths['*']).to.deep.equal(['initial/*', '*', path.join('first-lib', '*'), path.join('second-lib', '*')]);
      expect(firstPaths['*']).to.deep.equal(['initial/*', '*', path.join('first-lib', '*')]);
    } finally {
      isolatedChecker.resetEtsCheck();
      if (savedCompileTool === undefined) {
        delete process.env.compileTool;
      } else {
        process.env.compileTool = savedCompileTool;
      }
    }
  });

  mocha.it('reuses realpath results and the original-path fallback until reset', () => {
    realpath.withArgs(dependency).returns(path.resolve('target.ts'));
    const missing: string = path.resolve('missing.ts');
    realpath.withArgs(missing).returns(missing);
    const host = checker.moduleResolutionHostTest;
    for (let i = 0; i < 2; i++) {
      expect(host.realpath(dependency)).to.equal(path.resolve('target.ts'));
      expect(host.realpath(missing)).to.equal(missing);
    }
    expect(realpath.callCount).to.equal(2);
    checker.resetEtsCheck();
    realpath.withArgs(dependency).returns(path.resolve('new-target.ts'));
    expect(host.realpath(dependency)).to.equal(path.resolve('new-target.ts'));
    expect(realpath.callCount).to.equal(3);
  });

  mocha.it('updates the parent array in place without duplicating existing importers', () => {
    checker.resolveModuleNames(['shared'], first);
    const parents = checker.cache[dependency].parent;
    checker.resolveModuleNames(['shared', 'shared'], second);
    checker.resolveModuleNames(['shared'], first);
    expect(checker.cache[dependency].parent).to.equal(parents);
    expect(parents).to.deep.equal([first, second]);
  });

  mocha.it('treats an empty-string parent loaded from the checker cache as an empty list', () => {
    const cachedEntry = '{"mtimeMs":0,"children":[],"parent":"","error":false}';
    checker.cache[dependency] = JSON.parse(cachedEntry);
    checker.cache[first] = JSON.parse(cachedEntry);

    checker.resolveModuleNames(['shared'], first);

    expect(checker.cache[dependency].parent).to.deep.equal([first]);
    expect(checker.cache[first].parent).to.deep.equal([]);
  });

  mocha.it('deduplicates loaded parents in order and reuses the repaired list for later importers', () => {
    checker.cache[dependency] = {
      mtimeMs: 0, children: [], parent: [first, second, first], error: true
    };
    checker.resolveModuleNames(['shared'], first);
    const parents = checker.cache[dependency].parent;
    expect(parents).to.deep.equal([first, second]);
    expect(checker.cache[dependency].error).to.equal(false);

    const third: string = path.resolve('third.ets');
    checker.resolveModuleNames(['shared', 'shared'], third);
    checker.resolveModuleNames(['shared'], second);
    expect(checker.cache[dependency].parent).to.equal(parents);
    expect(parents).to.deep.equal([first, second, third]);
  });

  mocha.it('does not conflate paths that may cross a symlink', () => {
    const throughLink = `${path.dirname(dependency)}${path.sep}link${path.sep}..${path.sep}shared.ts`;
    realpath.withArgs(dependency).returns(dependency);
    realpath.withArgs(throughLink).returns(path.resolve('other', 'shared.ts'));
    const host = checker.moduleResolutionHostTest;
    expect(host.realpath(dependency)).to.equal(dependency);
    expect(host.realpath(throughLink)).to.equal(path.resolve('other', 'shared.ts'));
    expect(realpath.callCount).to.equal(2);
  });

  mocha.it('releases realpath results and seeds the parent index from the surviving array', () => {
    const host = checker.moduleResolutionHostTest;
    realpath.withArgs(dependency).returns(dependency);
    host.realpath(dependency);
    checker.resolveModuleNames(['shared'], first);
    checker.resolveModuleNames(['shared'], second);
    checker.releaseModuleResolutionCaches();
    realpath.withArgs(dependency).returns(path.resolve('updated.ts'));
    expect(host.realpath(dependency)).to.equal(path.resolve('updated.ts'));
    checker.resolveModuleNames(['shared'], first);
    expect(checker.cache[dependency].parent).to.deep.equal([first, second]);
  });

  mocha.it('restores parents after watch clears them and preserves order in later rounds', () => {
    checker.resolveModuleNames(['shared'], first);
    checker.resolveModuleNames(['shared'], second);
    for (let round = 0; round < 2; round++) {
      checker.incrementWatchFile([dependency], []);
      expect(checker.cache[dependency].parent).to.deep.equal([]);
      checker.resolveModuleNames(['shared'], first);
      checker.resolveModuleNames(['shared'], second);
      expect(checker.cache[dependency].parent).to.deep.equal([first, second]);
    }
  });

  mocha.it('isolates native watch realpath results from other rounds and the shared resolver', () => {
    const savedCompileTool: string | undefined = process.env.compileTool;
    const createWatchCompilerHost = sinon.stub().callsFake((_roots, _options, _sys, createProgram) => ({
      createProgram
    }));
    const resolveModuleName = sinon.stub().callsFake((_name, _file, _options, host: ts.ModuleResolutionHost) => ({
      resolvedModule: makeResolvedModule(host.realpath(dependency))
    }));
    let resolveInRound: () => void;
    const watchChecker: typeof checker = proxyquire('../../lib/ets_checker', {
      '../main': { projectConfig: { cachePath: process.cwd(), modulePath: process.cwd(), xtsMode: true } },
      'typescript': {
        ...ts, sys: { ...ts.sys, realpath }, createWatchCompilerHost, resolveModuleName,
        resolveTypeReferenceDirective: (_name, _file, _options, host: ts.ModuleResolutionHost) => ({
          resolvedTypeReferenceDirective: { resolvedFileName: host.realpath(dependency), primary: true }
        }),
        createSemanticDiagnosticsBuilderProgram: () => resolveInRound()
      }
    });
    process.env.compileTool = 'rollup';
    try {
      const host = watchChecker.createWatchCompilerHost([], () => {}, () => {}, () => {}, true);
      const resolve = (importer: string): string => host.resolveModuleNames(['shared'], importer, undefined, undefined,
        watchChecker.compilerOptions)[0].resolvedFileName;
      const resolveType = (): string => host.resolveTypeReferenceDirectives(['shared'], first, undefined,
        watchChecker.compilerOptions)[0].resolvedFileName;
      const oldTarget = path.resolve('v1', 'shared.ts');
      const newTarget = path.resolve('v2', 'shared.ts');
      const sharedTarget = path.resolve('outside-watch', 'shared.ts');
      realpath.withArgs(dependency).returns(sharedTarget);
      expect(watchChecker.moduleResolutionHostTest.realpath(dependency)).to.equal(sharedTarget);
      realpath.withArgs(dependency).returns(oldTarget);
      resolveInRound = () => {
        expect(resolve(first)).to.equal(oldTarget);
        expect(resolveType()).to.equal(oldTarget);
        throw new Error('interrupted round');
      };
      expect(() => host.createProgram([], {})).to.throw('interrupted round');
      expect(watchChecker.moduleResolutionHostTest.realpath(dependency)).to.equal(sharedTarget);
      expect(resolveType()).to.equal(sharedTarget);
      expect(realpath.callCount).to.equal(2);
      realpath.withArgs(dependency).returns(newTarget);
      resolveInRound = () => {
        expect(resolve(second)).to.equal(newTarget);
        expect(resolveType()).to.equal(newTarget);
      };
      host.createProgram([], {});
      expect(watchChecker.moduleResolutionHostTest.realpath(dependency)).to.equal(sharedTarget);
      expect(realpath.callCount).to.equal(3);
    } finally {
      if (savedCompileTool === undefined) {
        delete process.env.compileTool;
      } else {
        process.env.compileTool = savedCompileTool;
      }
    }
  });

  mocha.it('refreshes the shared parent index after a native watch round appends an importer', () => {
    const third = path.resolve('third.ets');
    let resolveInRound: () => void;
    const watchChecker: typeof checker = proxyquire('../../lib/ets_checker', {
      '../main': { projectConfig: { cachePath: process.cwd(), xtsMode: false } },
      'typescript': {
        ...ts,
        createWatchCompilerHost: (_roots, _options, _sys, createProgram) => ({ createProgram }),
        resolveModuleName: () => ({ resolvedModule: makeResolvedModule(dependency) }),
        createSemanticDiagnosticsBuilderProgram: () => resolveInRound()
      }
    });
    const savedCompileTool: string | undefined = process.env.compileTool;
    process.env.compileTool = 'rollup';
    try {
      const host = watchChecker.createWatchCompilerHost([], () => {}, () => {}, () => {}, true);
      watchChecker.resolveModuleNames(['shared'], first);
      watchChecker.resolveModuleNames(['shared'], second);
      const parents = watchChecker.cache[dependency].parent;
      resolveInRound = () => {
        host.resolveModuleNames(['shared'], third, undefined, undefined, watchChecker.compilerOptions);
        host.resolveModuleNames(['shared'], third, undefined, undefined, watchChecker.compilerOptions);
      };
      host.createProgram([], {});
      watchChecker.resolveModuleNames(['shared'], third);
      expect(watchChecker.cache[dependency].parent).to.equal(parents);
      expect(parents).to.deep.equal([first, second, third]);
    } finally {
      if (savedCompileTool === undefined) {
        delete process.env.compileTool;
      } else {
        process.env.compileTool = savedCompileTool;
      }
    }
  });

  mocha.it('discards standalone realpath results when Program creation throws', () => {
    const savedWatchMode: string | undefined = process.env.watchMode;
    const config = { cachePath: process.cwd(), projectPath: process.cwd(), xtsMode: true };
    const resolvedTargets: string[] = [];
    let importer = first;
    const standaloneChecker: typeof checker = proxyquire('../../lib/ets_checker', {
      '../main': { projectConfig: { ...config } },
      'typescript': {
        ...ts,
        sys: { ...ts.sys, realpath },
        resolveModuleName: (_name, _file, _options, host: ts.ModuleResolutionHost) => ({
          resolvedModule: makeResolvedModule(host.realpath(dependency))
        }),
        createLanguageService: (host: ts.LanguageServiceHost) => ({
          getBuilderProgram() {
            resolvedTargets.push(host.resolveModuleNames(['shared'], importer, undefined, undefined,
              standaloneChecker.compilerOptions)[0].resolvedFileName);
            throw new Error('interrupted standalone checker');
          }
        })
      }
    });
    process.env.watchMode = 'true';
    try {
      const oldTarget = path.resolve('v1', 'shared.ts');
      const newTarget = path.resolve('v2', 'shared.ts');
      realpath.withArgs(dependency).returns(oldTarget);
      expect(() => standaloneChecker.etsStandaloneChecker({}, console, config)).to.throw('interrupted standalone checker');
      importer = second;
      realpath.withArgs(dependency).returns(newTarget);
      expect(() => standaloneChecker.etsStandaloneChecker({}, console, config)).to.throw('interrupted standalone checker');
      expect(resolvedTargets).to.deep.equal([oldTarget, newTarget]);
      expect(realpath.callCount).to.equal(2);
      const nextTarget = path.resolve('v3', 'shared.ts');
      realpath.withArgs(dependency).returns(nextTarget);
      expect(standaloneChecker.moduleResolutionHostTest.realpath(dependency)).to.equal(nextTarget);
    } finally {
      if (savedWatchMode === undefined) {
        delete process.env.watchMode;
      } else {
        process.env.watchMode = savedWatchMode;
      }
    }
  });

  mocha.it('discards service checker realpath results when Program creation throws', () => {
    const savedWatchMode = process.env.watchMode;
    const config = { cachePath: process.cwd(), projectPath: process.cwd(), xtsMode: true };
    const oldTarget = path.resolve('v1', 'shared.ts');
    const newTarget = path.resolve('v2', 'shared.ts');
    const interrupted = new Error('interrupted service checker');
    const service: typeof checker = proxyquire('../../lib/ets_checker', {
      '../main': { projectConfig: config },
      'typescript': {
        ...ts,
        sys: { ...ts.sys, realpath },
        createLanguageService: () => ({
          getProps: () => new Set(),
          getBuilderProgram() {
            expect(service.moduleResolutionHostTest.realpath(dependency)).to.equal(oldTarget);
            throw interrupted;
          }
        })
      }
    });
    process.env.watchMode = 'true';
    try {
      realpath.withArgs(dependency).returns(oldTarget);
      expect(() => service.serviceChecker([])).to.throw(interrupted);
      realpath.withArgs(dependency).returns(newTarget);
      expect(service.moduleResolutionHostTest.realpath(dependency)).to.equal(newTarget);
      expect(realpath.callCount).to.equal(2);
    } finally {
      if (savedWatchMode === undefined) {
        delete process.env.watchMode;
      } else {
        process.env.watchMode = savedWatchMode;
      }
    }
  });

  for (const shouldThrow of [false, true]) {
    mocha.it(`discards declaration merge realpath results on ${shouldThrow ? 'failure' : 'success'}`, () => {
      const savedWatchMode = process.env.watchMode;
      const oldTarget = path.resolve('v1', 'shared.ts');
      const newTarget = path.resolve('v2', 'shared.ts');
      const config = {
        cachePath: process.cwd(), projectPath: process.cwd(), modulePath: process.cwd(), moduleName: 'mod',
        ohExports: [first], xtsMode: true, projectArkOption: { bundle: { bundledDeclare: true } }
      };
      const interrupted = new Error('interrupted declaration merge');
      let resolveDeclaration: (names: string[], file: string) => ts.ResolvedModuleFull[];
      const mergeDeclarationFiles = sinon.spy(() => {
        expect(resolveDeclaration(['shared'], path.resolve('first.d.ts'))[0].resolvedFileName).to.equal(oldTarget);
        if (shouldThrow) {
          throw interrupted;
        }
      });
      const service: typeof checker = proxyquire('../../lib/ets_checker', {
        '../main': { projectConfig: config, globalProgram: {}, partialUpdateConfig: {} },
        'typescript': {
          ...ts,
          sys: { ...ts.sys, realpath },
          createLanguageService: () => ({
            getProps: () => new Set(),
            getBuilderProgram: () => ({ getProgram: () => ({ getSourceFiles: () => [] }) })
          }),
          resolveModuleName: (_name, _file, _options, host: ts.ModuleResolutionHost) => ({
            resolvedModule: makeResolvedModule(host.realpath(dependency))
          })
        },
        './do_arkTS_linter': { doArkTSLinter: () => [] },
        './declaration_merger': { DeclarationMerger: { mergeDeclarationFiles } }
      });
      resolveDeclaration = proxyquire('../../lib/declaration_merger_utils', { './ets_checker': service })
        .createDeclarationModuleResolver(process.cwd());
      process.env.watchMode = 'true';
      try {
        realpath.withArgs(dependency).returns(oldTarget);
        if (shouldThrow) {
          expect(() => service.serviceChecker([])).to.throw(interrupted);
        } else {
          service.serviceChecker([]);
        }
        expect(mergeDeclarationFiles.calledOnce).to.be.true;
        realpath.withArgs(dependency).returns(newTarget);
        expect(service.moduleResolutionHostTest.realpath(dependency)).to.equal(newTarget);
        expect(realpath.callCount).to.equal(2);
      } finally {
        if (savedWatchMode === undefined) {
          delete process.env.watchMode;
        } else {
          process.env.watchMode = savedWatchMode;
        }
      }
    });
  }

  mocha.it('discards Rollup watch realpath results when a later Program creation throws', () => {
    const savedWatchMode = process.env.watchMode;
    const savedTrigger = process.env.triggerTsWatch;
    const oldTarget = path.resolve('v1', 'shared.ts');
    const newTarget = path.resolve('v2', 'shared.ts');
    const interrupted = new Error('interrupted Rollup watch checker');
    const watchPlugin = proxyquire('../../lib/fast_build/ets_ui/rollup-plugin-ets-checker', {
      '../../../main': {
        projectConfig: { entryObj: {}, ohExports: [] },
        globalProgram: { builderProgram: { getSyntacticDiagnostics: () => [], getSemanticDiagnostics: () => [] } }
      },
      '../../ets_checker': {
        serviceChecker: () => {},
        emitBuildInfo: () => {},
        fastBuildLogger: { debug: () => {} },
        releaseModuleResolutionCaches: checker.releaseModuleResolutionCaches,
        languageService: {
          getBuilderProgram() {
            expect(checker.moduleResolutionHostTest.realpath(dependency)).to.equal(oldTarget);
            throw interrupted;
          }
        }
      },
      '../../utils': { setChecker: () => {} },
      '../../file_info_cache': { fileInfoCache: { setShare: () => {} } },
      '../ark_compiler/common/process_ark_config': { validateHarWidgetCompile: () => {} }
    }).etsChecker();
    const context = { share: { projectConfig: {}, getLogger: () => console } };
    process.env.watchMode = 'true';
    process.env.triggerTsWatch = 'true';
    try {
      watchPlugin.buildStart.call(context);
      realpath.withArgs(dependency).returns(oldTarget);
      expect(() => watchPlugin.buildStart.call(context)).to.throw(interrupted);
      realpath.withArgs(dependency).returns(newTarget);
      expect(checker.moduleResolutionHostTest.realpath(dependency)).to.equal(newTarget);
      expect(realpath.callCount).to.equal(2);
    } finally {
      if (savedWatchMode === undefined) {
        delete process.env.watchMode;
      } else {
        process.env.watchMode = savedWatchMode;
      }
      if (savedTrigger === undefined) {
        delete process.env.triggerTsWatch;
      } else {
        process.env.triggerTsWatch = savedTrigger;
      }
    }
  });
});

function snapshotProjectConfig(): void {
  savedExternalApiConfig = {
    externalApiPaths: projectConfig.externalApiPaths,
    compileHar: projectConfig.compileHar,
    compileShared: projectConfig.compileShared,
    hotReload: projectConfig.hotReload,
    xtsMode: projectConfig.xtsMode
  };
}

function quarantineProjectConfig(): void {
  projectConfig.compileHar = false;
  projectConfig.compileShared = false;
  projectConfig.hotReload = false;
  projectConfig.xtsMode = false;
}

function restoreProjectConfig(): void {
  projectConfig.externalApiPaths = savedExternalApiConfig.externalApiPaths as never;
  projectConfig.compileHar = savedExternalApiConfig.compileHar as never;
  projectConfig.compileShared = savedExternalApiConfig.compileShared as never;
  projectConfig.hotReload = savedExternalApiConfig.hotReload as never;
  projectConfig.xtsMode = savedExternalApiConfig.xtsMode as never;
}

function runResolveCase(
  externalApiPaths: string[] | undefined,
  ...modules: Array<ts.ResolvedModuleFull & { originalPath?: string }>
): Array<ts.ResolvedModuleFull | null> {
  projectConfig.externalApiPaths = externalApiPaths as never;
  resolveModuleNameStub.resetBehavior();
  resolveModuleNameStub.resetHistory();
  modules.forEach((mod: ts.ResolvedModuleFull & { originalPath?: string }, idx: number): void => {
    resolveModuleNameStub.onCall(idx).returns({ resolvedModule: mod });
  });
  return resolveModuleNamesIsolated(
    modules.map((unused: ts.ResolvedModuleFull, idx: number): string => `lib${idx}`),
    '/project/src/main/ets/Index.ets'
  ) as Array<ts.ResolvedModuleFull | null>;
}

mocha.describe('function resolveModuleNames externalApiPaths filtering', () => {
  mocha.before((): void => setupIsolatedEtsChecker());
  mocha.beforeEach((): void => {
    snapshotProjectConfig();
    quarantineProjectConfig();
  });
  mocha.afterEach((): void => {
    restoreProjectConfig();
    resolveModuleNameStub.resetBehavior();
  });
  mocha.after((): void => externalApiPathsSandbox.restore());
  mocha.it('1-1: should return null when resolvedFileName starts with an externalApiPath', () => {
    const result = runResolveCase(['/sdk/external'],
      makeResolvedModule('/sdk/external/api/lib.d.ts', '/real/path/lib.d.ts'));
    expect(result).to.deep.equal([null]);
  });
  mocha.it('1-2: should return null when only originalPath starts with an externalApiPath', () => {
    const result = runResolveCase(['/oh_modules/.ohpm'],
      makeResolvedModule('/real/cache/path/lib.d.ts', '/oh_modules/.ohpm/lib@1.0.0/lib.d.ts'));
    expect(result).to.deep.equal([null]);
  });
  mocha.it('1-3: should pass through the resolved module when no path matches', () => {
    const mod = makeResolvedModule('/project/oh_modules/lib/lib.d.ts', '/project/oh_modules/lib/lib.d.ts');
    expect(runResolveCase(['/sdk/external'], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-4: should pass through when externalApiPaths is undefined or an empty array', () => {
    const mod = makeResolvedModule('/any/path/lib.d.ts');
    expect(runResolveCase(undefined, mod)).to.deep.equal([mod]);
    expect(runResolveCase([], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-5: should return null when the second externalApiPath matches', () => {
    const result = runResolveCase(['/first/prefix', '/sdk/external'],
      makeResolvedModule('/sdk/external/api/lib.d.ts'));
    expect(result).to.deep.equal([null]);
  });
  mocha.it('1-6: should not treat a prefix occurring in the middle of the path as a match', () => {
    const mod = makeResolvedModule('/sdk/api/external/lib.d.ts');
    expect(runResolveCase(['/sdk/external'], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-7: should filter before the .js to .d.ets redirection when path matches', () => {
    const result = runResolveCase(['/sdk/external'],
      makeResolvedModule('/sdk/external/api/lib.js'));
    expect(result).to.deep.equal([null]);
  });
  mocha.it('1-8: should filter each module independently in a mixed list', () => {
    const externalMod = makeResolvedModule('/ext/hidden/lib1.d.ts');
    const normalMod = makeResolvedModule('/project/oh_modules/lib2/lib2.d.ts');
    expect(runResolveCase(['/ext/hidden'], externalMod, normalMod)).to.deep.equal([null, normalMod]);
  });
  mocha.it('1-9: should not match a sibling directory whose name starts with the externalApiPath', () => {
    const mod = makeResolvedModule('/sdk/externalBeta/api/lib.d.ts');
    expect(runResolveCase(['/sdk/external'], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-10: should not match when resolvedFileName extends the externalApiPath without a path separator', () => {
    const mod = makeResolvedModule('/sdk/externalbackup/lib.d.ts');
    expect(runResolveCase(['/sdk/external'], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-11: should not match a sibling directory via originalPath prefix', () => {
    const mod = makeResolvedModule('/real/cache/lib.d.ts', '/oh_modules/.ohpm-beta/lib.d.ts');
    expect(runResolveCase(['/oh_modules/.ohpm'], mod)).to.deep.equal([mod]);
  });
  mocha.it('1-12: should still match when the externalApiPath has a trailing separator', () => {
    const result = runResolveCase(['/sdk/external/'],
      makeResolvedModule('/sdk/external/api/lib.d.ts'));
    expect(result).to.deep.equal([null]);
  });
});

mocha.describe('skipArkTSLinter option', function () {
    this.timeout(30000);

    mocha.before(function () {
        this.rollup = new RollUpPluginMock();
    });

    mocha.after(function () {
        const cacheFile: string = path.resolve(projectConfig.cachePath, '../.ts_checker_cache');
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
        const tsBuildInfoFilePath: string = path.resolve(projectConfig.cachePath, '..', TS_BUILD_INFO_SUFFIX);
        const tsBuildInfoLinterFilePath: string = tsBuildInfoFilePath + '.linter';
        if (fs.existsSync(tsBuildInfoFilePath)) {
            fs.unlinkSync(tsBuildInfoFilePath);
        }
        if (fs.existsSync(tsBuildInfoLinterFilePath)) {
            fs.unlinkSync(tsBuildInfoLinterFilePath);
        }
        delete this.rollup;
    });

    mocha.afterEach(() => {
        resetEtsCheck();
    });

    function applyConfig(rollup: any, skipArkTSLinter: boolean, buildMode: string): void {
        rollup.share.projectConfig.skipArkTSLinter = skipArkTSLinter;
        rollup.share.projectConfig.buildMode = buildMode;
        Object.assign(projectConfig, rollup.share.projectConfig);
    }

    function getCachedService(share: any): any | undefined {
        const cache = share.cache?.get('service');
        return cache?.service;
    }

    mocha.it('1: debug + skip=true → compilerOptions.skipArkTSLinter=true', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(compilerOptions.skipArkTSLinter).to.be.true;
    });

    mocha.it('2: debug + skip=false → compilerOptions.skipArkTSLinter=false', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(compilerOptions.skipArkTSLinter).to.be.false;
    });

    mocha.it('3: release + skip=true → compilerOptions.skipArkTSLinter=false', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(compilerOptions.skipArkTSLinter).to.be.false;
    });

    mocha.it('4: release + skip=false → compilerOptions.skipArkTSLinter=false', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        expect(compilerOptions.skipArkTSLinter).to.be.false;
    });

    mocha.it('5: debug, skip true→false → cache rebuilt (effective: true→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, false, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.not.equal(getCachedService(this.rollup.share));
    });

    mocha.it('6: debug, skip false→true → cache rebuilt (effective: false→true)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, true, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.not.equal(getCachedService(this.rollup.share));
    });

    mocha.it('7: release, skip true→false → cache reused (effective: false→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, false, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.equal(getCachedService(this.rollup.share));
    });

    mocha.it('8: release, skip false→true → cache reused (effective: false→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, true, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.equal(getCachedService(this.rollup.share));
    });

    mocha.it('9: debug→release, skip false→true → cache reused (effective: false→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, true, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.equal(getCachedService(this.rollup.share));
    });

    mocha.it('10: debug→release, skip true→false → cache rebuilt (effective: true→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, false, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.not.equal(getCachedService(this.rollup.share));
    });

    mocha.it('11: release→debug, skip false→true → cache rebuilt (effective: false→true)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, false, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, true, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.not.equal(getCachedService(this.rollup.share));
    });

    mocha.it('12: release→debug, skip true→false → cache reused (effective: false→false)', function () {
        this.rollup.build();
        this.rollup.share.initWithCache();
        applyConfig(this.rollup, true, 'Release');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);
        resetEtsCheck();
        const beforeService = getCachedService(this.rollup.share);

        applyConfig(this.rollup, false, 'Debug');
        serviceChecker([EXPECT_INDEX_ETS], null, null, null, this.rollup.share);

        expect(beforeService).to.equal(getCachedService(this.rollup.share));
    });
});
