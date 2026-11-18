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

import mocha from 'mocha';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { expect } from 'chai';
import * as ts from 'typescript';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

import { FileManager } from '../../../lib/fast_build/ark_compiler/interop/interop_manager';
import * as processArktsEvolution from '../../../lib/fast_build/ark_compiler/interop/process_arkts_evolution';
import { projectConfig } from '../../../main';
import { toUnixPath } from '../../../lib/utils';

interface ArkTsModuleInfo {
    language: string;
    packageName: string;
    moduleName: string;
    modulePath: string;
    declgenV1OutPath?: string;
    dynamicFiles: string[];
    staticFiles: string[];
    cachePath: string;
    byteCodeHarInfo: Object[];
    packageVersion: string;
    moduleType: string;
}

function buildModuleInfo(language: string, packageName: string, modulePath: string,
    declgenV1OutPath?: string, staticFiles: string[] = []): ArkTsModuleInfo {
    return {
        language,
        packageName,
        moduleName: packageName,
        modulePath,
        declgenV1OutPath,
        dynamicFiles: [],
        staticFiles,
        cachePath: path.join(modulePath, 'build/cache'),
        byteCodeHarInfo: [],
        packageVersion: '1.0.0',
        moduleType: 'har'
    };
}

mocha.describe('interop resolveModuleNames override declaration redirection', () => {
    const pkgName: string = 'resolveOverrideHar';
    let tempDir: string = '';
    let sourceFilePath: string = '';
    let declPath: string = '';
    let overrideDeclPath: string = '';
    let containingFile: string = '';
    let resolveModuleNameStub: sinon.SinonStub;
    let resolveModuleNamesIsolated: (moduleNames: string[], containingFile: string) => ts.ResolvedModuleFull[];
    let savedMixCompileEnv: string | undefined;
    let savedProjectConfig: Record<string, unknown> = {};

    mocha.before(() => {
        resolveModuleNameStub = sinon.stub();
        // Load an isolated lib/ets_checker instance whose typescript import is stubbed,
        // so per-test resolveModuleName results do not depend on tsc path lookup.
        const tsWithStub: typeof ts = Object.assign({}, ts, { resolveModuleName: resolveModuleNameStub });
        resolveModuleNamesIsolated =
            proxyquire('../../../lib/ets_checker', { 'typescript': tsWithStub }).resolveModuleNames;
    });

    mocha.beforeEach(() => {
        savedMixCompileEnv = process.env.mixCompile;
        process.env.mixCompile = 'true';
        savedProjectConfig = {
            externalApiPaths: projectConfig.externalApiPaths,
            compileHar: projectConfig.compileHar,
            compileShared: projectConfig.compileShared,
            hotReload: projectConfig.hotReload,
            xtsMode: projectConfig.xtsMode
        };
        projectConfig.externalApiPaths = undefined;
        projectConfig.compileHar = false;
        projectConfig.compileShared = false;
        projectConfig.hotReload = false;
        projectConfig.xtsMode = false;

        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resolve-override-decl-'));
        const harModulePath: string = path.join(tempDir, 'har');
        const sourceDir: string = path.join(harModulePath, 'src/main/ets');
        fs.mkdirSync(sourceDir, { recursive: true });
        sourceFilePath = path.join(sourceDir, 'a.ets');
        fs.writeFileSync(sourceFilePath, 'export const a: number = 1;\n', 'utf-8');

        const declgenV1OutPath: string = path.join(harModulePath, 'build/declgenV1');
        const declDir: string = path.join(declgenV1OutPath, 'src/main/ets');
        fs.mkdirSync(declDir, { recursive: true });
        declPath = path.join(declDir, 'a.d.ets');
        fs.writeFileSync(declPath, 'export declare const a: number;\n', 'utf-8');
        overrideDeclPath = path.join(declDir, 'a.override.d.ets');

        const entryModulePath: string = path.join(tempDir, 'entry');
        const pagesDir: string = path.join(entryModulePath, 'src/main/ets/pages');
        fs.mkdirSync(pagesDir, { recursive: true });
        containingFile = path.join(pagesDir, 'index.ets');
        fs.writeFileSync(containingFile, 'import { a } from \'./a\';\n', 'utf-8');

        FileManager.cleanFileManagerObject();
        FileManager.setMixCompile(true);
        FileManager.arkTSModuleMap.set('entry',
            buildModuleInfo('1.1', 'entry', toUnixPath(entryModulePath)));
        FileManager.arkTSModuleMap.set(pkgName,
            buildModuleInfo('1.2', pkgName, toUnixPath(harModulePath), toUnixPath(declgenV1OutPath),
                [toUnixPath(sourceFilePath)]));
        processArktsEvolution.arkTSEvolutionModuleMap.set(pkgName,
            buildModuleInfo('1.2', pkgName, toUnixPath(harModulePath), toUnixPath(declgenV1OutPath),
                [toUnixPath(sourceFilePath)]));
    });

    mocha.afterEach(() => {
        resolveModuleNameStub.resetBehavior();
        resolveModuleNameStub.resetHistory();
        FileManager.cleanFileManagerObject();
        processArktsEvolution.cleanUpProcessArkTSEvolutionObj();
        if (savedMixCompileEnv === undefined) {
            delete process.env.mixCompile;
        } else {
            process.env.mixCompile = savedMixCompileEnv;
        }
        projectConfig.externalApiPaths = savedProjectConfig.externalApiPaths;
        projectConfig.compileHar = savedProjectConfig.compileHar;
        projectConfig.compileShared = savedProjectConfig.compileShared;
        projectConfig.hotReload = savedProjectConfig.hotReload;
        projectConfig.xtsMode = savedProjectConfig.xtsMode;
        if (tempDir) {
            fs.rmSync(tempDir, { recursive: true, force: true });
            tempDir = '';
        }
    });

    function stubTscResolveToSource(): void {
        resolveModuleNameStub.resetBehavior();
        resolveModuleNameStub.resetHistory();
        resolveModuleNameStub.returns({
            resolvedModule: {
                resolvedFileName: sourceFilePath,
                isExternalLibraryImport: false,
                extension: '.ets'
            }
        });
    }

    function stubTscResolveToMiss(): void {
        resolveModuleNameStub.resetBehavior();
        resolveModuleNameStub.resetHistory();
        resolveModuleNameStub.returns({ resolvedModule: undefined });
    }

    mocha.it('1-1: redirects the interop declaration resolution to the override file when it exists', () => {
        fs.writeFileSync(overrideDeclPath, 'export declare const a: number;\n', 'utf-8');
        stubTscResolveToSource();
        const resolved: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(resolved.length).to.equal(1);
        expect(resolved[0].resolvedFileName).to.equal(toUnixPath(overrideDeclPath));
        expect(resolved[0].extension).to.equal('.d.ets');
    });

    mocha.it('1-2: keeps the generated interop declaration when no override file exists', () => {
        stubTscResolveToSource();
        const resolved: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(resolved.length).to.equal(1);
        expect(resolved[0].resolvedFileName).to.equal(toUnixPath(declPath));
        expect(resolved[0].extension).to.equal('.d.ets');
    });

    mocha.it('1-3: keeps redirecting to the override file on declFilesCache hit for repeated resolution', () => {
        fs.writeFileSync(overrideDeclPath, 'export declare const a: number;\n', 'utf-8');
        stubTscResolveToSource();
        const first: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(first[0].resolvedFileName).to.equal(toUnixPath(overrideDeclPath));

        // The second call hits declFilesCache; the cached module must stay redirected.
        const second: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(second.length).to.equal(1);
        expect(second[0].resolvedFileName).to.equal(toUnixPath(overrideDeclPath));
        expect(second[0].extension).to.equal('.d.ets');
    });

    mocha.it('1-4: caches the unredirected module when no override file exists at first resolution', () => {
        stubTscResolveToSource();
        const first: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(first[0].resolvedFileName).to.equal(toUnixPath(declPath));

        // An override file appearing afterwards must not affect the cached resolution.
        fs.writeFileSync(overrideDeclPath, 'export declare const a: number;\n', 'utf-8');
        const second: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated(['./a'], containingFile);
        expect(second.length).to.equal(1);
        expect(second[0].resolvedFileName).to.equal(toUnixPath(declPath));
    });

    mocha.it('2-1: redirects the package-name interop import resolution to the override file when it exists', () => {
        fs.writeFileSync(overrideDeclPath, 'export declare const a: number;\n', 'utf-8');
        stubTscResolveToMiss();
        const resolved: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated([`${pkgName}/a`], containingFile);
        expect(resolved.length).to.equal(1);
        expect(resolved[0].resolvedFileName).to.equal(toUnixPath(overrideDeclPath));
        expect(resolved[0].extension).to.equal('.d.ets');
    });

    mocha.it('2-2: keeps the generated declaration for package-name import when no override file exists', () => {
        stubTscResolveToMiss();
        const resolved: ts.ResolvedModuleFull[] = resolveModuleNamesIsolated([`${pkgName}/a`], containingFile);
        expect(resolved.length).to.equal(1);
        expect(resolved[0].resolvedFileName).to.equal(toUnixPath(declPath));
        expect(resolved[0].extension).to.equal('.d.ets');
    });
});
