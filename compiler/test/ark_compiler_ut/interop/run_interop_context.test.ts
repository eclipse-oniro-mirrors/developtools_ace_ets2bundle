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

import { expect } from 'chai';
import mocha from 'mocha';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { InteropContext, run } from '../../../lib/fast_build/ark_compiler/interop/run_interop_context';
import { toUnixPath } from '../../../lib/utils';
import { FileManager } from '../../../lib/fast_build/ark_compiler/interop/interop_manager';

export interface ArkTSEvolutionModule {
    language: string;
    packageName: string;
    moduleName: string;
    modulePath: string;
    declgenV1OutPath?: string;
    declgenV2OutPath?: string;
    declFilesPath?: string;
    dynamicFiles: string[];
    staticFiles: string[];
    cachePath: string;
    byteCodeHarInfo?: Object;
    packageVersion: string;
    moduleType: string;
}


mocha.describe('InteropContext', () => {
    let interopContext: InteropContext;
    mocha.before(() => {
        FileManager.cleanFileManagerObject();
        const dependentModuleMap: Map<string, ArkTSEvolutionModule> = new Map();
        dependentModuleMap.set('entry', {
            language: '1.1',
            packageName: 'entry',
            moduleName: 'entry',
            modulePath: '/path/to/project/entry',
            declgenV1OutPath: '/path/to/project/entry/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/entry/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/entry/src/ets/dynamic1.ets'],
            staticFiles: ['/path/to/project/entry/src/ets/index.ets'],
            cachePath: '/path/to/project/entry/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'entry'
        });
        dependentModuleMap.set('har1', {
            language: '1.1',
            packageName: 'har1',
            moduleName: 'har1',
            modulePath: '/path/to/project/har1',
            declgenV1OutPath: '/path/to/project/har1/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/har1/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/har1/src/ets/dynamic2.js'],
            staticFiles: ['/path/to/project/har1/src/ets/index.ets'],
            cachePath: '/path/to/project/har1/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'har'
        });
        dependentModuleMap.set('hsp1', {
            language: '1.1',
            packageName: 'hsp1',
            moduleName: 'hsp1',
            modulePath: '/path/to/project/hsp1',
            declgenV1OutPath: '/path/to/project/hsp1/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/hsp1/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/hsp1/src/ets/dynamic3.ets'],
            staticFiles: ['/path/to/project/hsp1/src/ets/index.ets'],
            cachePath: '/path/to/project/hsp1/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'shared'  // HSP 类型
        });
        FileManager.initForTest(
            dependentModuleMap,
            undefined,
            '',
            '',
            ''
        );
    });
    mocha.beforeEach(() => {
        const params = {
            projectConfig: {
                projectRootPath: '/path/to/project',
                bundleName: 'com.project'
            }
        } as any;
        InteropContext.init();
        interopContext = InteropContext.getInstance();
    });

    mocha.it('1-1: add ets decl files', () => {
        const moduleInfo: ArkTSEvolutionModule = {
            language: '1.1',
            packageName: 'entry',
            moduleName: 'entry',
            modulePath: '/path/to/project/entry',
            declgenV1OutPath: '/path/to/project/entry/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/entry/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/entry/src/ets/dynamic1.ets'],
            staticFiles: ['/path/to/project/entry/src/ets/index.ets'],
            cachePath: '/path/to/project/entry/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'entry'
        }
        const filePath = '/path/to/project/entry/src/main/ets/dynamic1.ets';

        interopContext.addDeclFilesConfig(filePath, moduleInfo);

        const expectedProjectFilePath = 'src/main/ets/dynamic1';
        const expectedDeclPath = toUnixPath(path.join(moduleInfo.declgenV2OutPath!, expectedProjectFilePath + '.d.ets'));
        const expectedOhmUrl = `@normalized:N&&&${moduleInfo.packageName}/src/main/ets/dynamic1&`;

        const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
        expect(config.files[expectedProjectFilePath].ohmUrl === expectedOhmUrl).to.be.true;
        expect(config.files[expectedProjectFilePath].declPath === expectedDeclPath).to.be.true;
    });

    mocha.it('1-2: add js decl files', () => {
        const moduleInfo: ArkTSEvolutionModule = {
            language: '1.1',
            packageName: 'har1',
            moduleName: 'har1',
            modulePath: '/path/to/project/har1',
            declgenV1OutPath: '/path/to/project/har1/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/har1/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/har1/src/ets/dynamic2.js'],
            staticFiles: ['/path/to/project/har1/src/ets/index.ets'],
            cachePath: '/path/to/project/har1/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'har'
        }
        const filePath = '/path/to/project/har1/src/main/ets/dynamic2.js';

        interopContext.addDeclFilesConfig(filePath, moduleInfo);

        const expectedProjectFilePath = 'src/main/ets/dynamic2';
        const expectedDeclPath = toUnixPath(path.join(moduleInfo.declgenV2OutPath!, expectedProjectFilePath + '.d.ets'));
        const expectedOhmUrl = `@normalized:N&&&${moduleInfo.packageName}/src/main/ets/dynamic2&`;
        
        const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
        expect(config.files[expectedProjectFilePath].ohmUrl === expectedOhmUrl).to.be.true;
        expect(config.files[expectedProjectFilePath].declPath === expectedDeclPath).to.be.true;
    });

    mocha.it('1-3: add hsp decl files (no version in ohmUrl)', () => {
        const moduleInfo: ArkTSEvolutionModule = {
            language: '1.1',
            packageName: 'hsp1',
            moduleName: 'hsp1',
            modulePath: '/path/to/project/hsp1',
            declgenV1OutPath: '/path/to/project/hsp1/build/default/intermediates/declgen/default/declgenV1',
            declgenV2OutPath: '/path/to/project/hsp1/build/default/intermediates/declgen/default/declgenV2',
            dynamicFiles: ['/path/to/project/hsp1/src/ets/dynamic3.ets'],
            staticFiles: ['/path/to/project/hsp1/src/ets/index.ets'],
            cachePath: '/path/to/project/hsp1/build/default/cache',
            byteCodeHarInfo: [],
            packageVersion: '1.0.0',
            moduleType: 'shared'
        };
        const filePath = '/path/to/project/hsp1/src/main/ets/dynamic3.ets';
        interopContext.addDeclFilesConfig(filePath, moduleInfo);

        const expectedProjectFilePath = 'src/main/ets/dynamic3';
        const expectedDeclPath = toUnixPath(path.join(moduleInfo.declgenV2OutPath!, expectedProjectFilePath + '.d.ets'));
        const expectedOhmUrl = `@normalized:N&&&${moduleInfo.packageName}/src/main/ets/dynamic3&`;
        
        const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
        expect(config.files[expectedProjectFilePath].ohmUrl === expectedOhmUrl).to.be.true;
        expect(config.files[expectedProjectFilePath].declPath === expectedDeclPath).to.be.true;
    });
    mocha.it('2-1: declPath points to override file when override exists', () => {
        const tempDir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'interop-override-decl-test-'));
        try {
            const modulePath: string = path.join(tempDir, 'har');
            const sourceDir: string = path.join(modulePath, 'src/main/ets');
            fs.mkdirSync(sourceDir, { recursive: true });
            const sourceFilePath: string = path.join(sourceDir, 'a.ets');
            fs.writeFileSync(sourceFilePath, 'export const a: number = 1;\n', 'utf-8');

            const declgenV2OutPath: string = path.join(tempDir, 'har/build/declgenV2');
            const declDir: string = path.join(declgenV2OutPath, 'src/main/ets');
            fs.mkdirSync(declDir, { recursive: true });
            const overrideDeclPath: string = path.join(declDir, 'a.override.d.ets');
            fs.writeFileSync(overrideDeclPath, 'export declare const a: number;\n', 'utf-8');

            const moduleInfo: ArkTSEvolutionModule = {
                language: '1.1',
                packageName: 'harOverride',
                moduleName: 'harOverride',
                modulePath: modulePath,
                declgenV1OutPath: path.join(tempDir, 'har/build/declgenV1'),
                declgenV2OutPath: declgenV2OutPath,
                dynamicFiles: [sourceFilePath],
                staticFiles: [],
                cachePath: path.join(tempDir, 'har/build/cache'),
                byteCodeHarInfo: [],
                packageVersion: '1.0.0',
                moduleType: 'har'
            };
            FileManager.arkTSModuleMap.set('harOverride', moduleInfo);

            interopContext.addDeclFilesConfig(sourceFilePath, moduleInfo);

            const expectedProjectFilePath = 'src/main/ets/a';
            const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
            expect(config.files[expectedProjectFilePath].declPath === toUnixPath(overrideDeclPath)).to.be.true;
            expect(config.files[expectedProjectFilePath].filePath === toUnixPath(sourceFilePath)).to.be.true;
        } finally {
            FileManager.arkTSModuleMap.delete('harOverride');
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    mocha.it('2-2: declPath points to override file even when the original declaration file is missing', () => {
        const tempDir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'interop-override-only-decl-test-'));
        try {
            const modulePath: string = path.join(tempDir, 'har');
            const sourceDir: string = path.join(modulePath, 'src/main/ets');
            fs.mkdirSync(sourceDir, { recursive: true });
            const sourceFilePath: string = path.join(sourceDir, 'c.ets');
            fs.writeFileSync(sourceFilePath, 'export const c: number = 1;\n', 'utf-8');

            const declgenV2OutPath: string = path.join(tempDir, 'har/build/declgenV2');
            const declDir: string = path.join(declgenV2OutPath, 'src/main/ets');
            fs.mkdirSync(declDir, { recursive: true });
            // Only the override declaration exists; the generated c.d.ets is absent.
            const overrideDeclPath: string = path.join(declDir, 'c.override.d.ets');
            fs.writeFileSync(overrideDeclPath, 'export declare const c: number;\n', 'utf-8');

            const moduleInfo: ArkTSEvolutionModule = {
                language: '1.1',
                packageName: 'harOverrideOnly',
                moduleName: 'harOverrideOnly',
                modulePath: modulePath,
                declgenV1OutPath: path.join(tempDir, 'har/build/declgenV1'),
                declgenV2OutPath: declgenV2OutPath,
                dynamicFiles: [sourceFilePath],
                staticFiles: [],
                cachePath: path.join(tempDir, 'har/build/cache'),
                byteCodeHarInfo: [],
                packageVersion: '1.0.0',
                moduleType: 'har'
            };
            FileManager.arkTSModuleMap.set('harOverrideOnly', moduleInfo);

            interopContext.addDeclFilesConfig(sourceFilePath, moduleInfo);

            const expectedProjectFilePath = 'src/main/ets/c';
            const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
            expect(config.files[expectedProjectFilePath].declPath === toUnixPath(overrideDeclPath)).to.be.true;
            expect(config.files[expectedProjectFilePath].filePath === toUnixPath(sourceFilePath)).to.be.true;
        } finally {
            FileManager.arkTSModuleMap.delete('harOverrideOnly');
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    mocha.it('2-3: declPath only replaces the trailing .d.ets of the generated declaration', () => {
        const tempDir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'interop-override-trailing-test-'));
        try {
            const modulePath: string = path.join(tempDir, 'har');
            const sourceDir: string = path.join(modulePath, 'src/main/ets');
            fs.mkdirSync(sourceDir, { recursive: true });
            const sourceFilePath: string = path.join(sourceDir, 'd.ets');
            fs.writeFileSync(sourceFilePath, 'export const d: number = 1;\n', 'utf-8');

            // The declgen output directory itself contains a .d.ets segment; only the
            // trailing .d.ets of the generated declaration may be replaced.
            const declgenV2OutPath: string = path.join(tempDir, 'har.d.ets/build/declgenV2');
            const declDir: string = path.join(declgenV2OutPath, 'src/main/ets');
            fs.mkdirSync(declDir, { recursive: true });
            const overrideDeclPath: string = path.join(declDir, 'd.override.d.ets');
            fs.writeFileSync(overrideDeclPath, 'export declare const d: number;\n', 'utf-8');

            const moduleInfo: ArkTSEvolutionModule = {
                language: '1.1',
                packageName: 'harTrailingOverride',
                moduleName: 'harTrailingOverride',
                modulePath: modulePath,
                declgenV1OutPath: path.join(tempDir, 'har/build/declgenV1'),
                declgenV2OutPath: declgenV2OutPath,
                dynamicFiles: [sourceFilePath],
                staticFiles: [],
                cachePath: path.join(tempDir, 'har/build/cache'),
                byteCodeHarInfo: [],
                packageVersion: '1.0.0',
                moduleType: 'har'
            };
            FileManager.arkTSModuleMap.set('harTrailingOverride', moduleInfo);

            interopContext.addDeclFilesConfig(sourceFilePath, moduleInfo);

            const expectedProjectFilePath = 'src/main/ets/d';
            const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
            expect(config.files[expectedProjectFilePath].declPath === toUnixPath(overrideDeclPath)).to.be.true;
        } finally {
            FileManager.arkTSModuleMap.delete('harTrailingOverride');
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    mocha.it('2-4: declPath keeps original declaration path when override file does not exist', () => {
        const tempDir: string = fs.mkdtempSync(path.join(os.tmpdir(), 'interop-no-override-decl-test-'));
        try {
            const modulePath: string = path.join(tempDir, 'har');
            const sourceDir: string = path.join(modulePath, 'src/main/ets');
            fs.mkdirSync(sourceDir, { recursive: true });
            const sourceFilePath: string = path.join(sourceDir, 'b.ets');
            fs.writeFileSync(sourceFilePath, 'export const b: number = 1;\n', 'utf-8');

            const declgenV2OutPath: string = path.join(tempDir, 'har/build/declgenV2');
            const moduleInfo: ArkTSEvolutionModule = {
                language: '1.1',
                packageName: 'harNoOverride',
                moduleName: 'harNoOverride',
                modulePath: modulePath,
                declgenV1OutPath: path.join(tempDir, 'har/build/declgenV1'),
                declgenV2OutPath: declgenV2OutPath,
                dynamicFiles: [sourceFilePath],
                staticFiles: [],
                cachePath: path.join(tempDir, 'har/build/cache'),
                byteCodeHarInfo: [],
                packageVersion: '1.0.0',
                moduleType: 'har'
            };
            FileManager.arkTSModuleMap.set('harNoOverride', moduleInfo);

            interopContext.addDeclFilesConfig(sourceFilePath, moduleInfo);

            const expectedProjectFilePath = 'src/main/ets/b';
            const expectedDeclPath = toUnixPath(path.join(declgenV2OutPath, expectedProjectFilePath + '.d.ets'));
            const config = interopContext['pkgDeclFilesConfig'][moduleInfo.packageName];
            expect(config.files[expectedProjectFilePath].declPath === expectedDeclPath).to.be.true;
            expect(config.files[expectedProjectFilePath].filePath === toUnixPath(sourceFilePath)).to.be.true;
        } finally {
            FileManager.arkTSModuleMap.delete('harNoOverride');
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    mocha.after(() => {
        FileManager.cleanFileManagerObject();
    });
});
