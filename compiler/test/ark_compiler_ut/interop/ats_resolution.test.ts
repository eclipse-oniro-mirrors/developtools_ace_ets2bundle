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
import os from 'os';
import path from 'path';
import mocha from 'mocha';

function unix(value: string): string {
  return value.replace(/\\/g, '/');
}

function loadManager(): any {
  return require('proxyquire').noCallThru()('../../../lib/fast_build/ark_compiler/interop/interop_manager', {
    '../../../../main': {}, '../../../utils': { toUnixPath: unix },
    '../utils': { isSubPathOf: (file, base) => file.startsWith(base + '/') },
    '../logger': {}, '../../../compile_info': {}, '../error_code': {}
  });
}

function loadEvolution(manager: any, arkUtils: any = {}): any {
  return require('proxyquire').noCallThru()(
    '../../../lib/fast_build/ark_compiler/interop/process_arkts_evolution', {
      '../../../ets_checker': { getResolveModule: (resolvedFileName, extension) => ({ resolvedFileName, extension }) },
      '../../../utils': { toUnixPath: unix }, '../../../ark_utils': arkUtils, '../logger': {}, '../error_code': {},
      '../../../create_ast_node_utils': { FileLog: class {} }, '../common/ark_define': {}, './interop_manager': manager
    });
}

class ResolutionFixture {
  root: string;
  evolution: any;
  moduleInfo: any;

  create(): void {
    this.root = fs.mkdtempSync(path.join(os.tmpdir(), 'ats-resolution-'));
    const manager = loadManager();
    this.evolution = loadEvolution(manager);
    this.moduleInfo = {
      language: 'hybrid', packageName: 'pkg', modulePath: this.filePath('module'),
      declgenV1OutPath: this.filePath('decl'), staticFiles: [], dynamicFiles: []
    };
    manager.FileManager.arkTSModuleMap.set('pkg', this.moduleInfo);
    this.evolution.arkTSHybridModuleMap.set('pkg', this.moduleInfo);
  }

  remove(): void {
    fs.rmSync(this.root, { recursive: true, force: true });
  }

  filePath(...parts: string[]): string {
    return unix(path.join(this.root, ...parts));
  }

  write(name: string, content: string = ''): string {
    const file = this.filePath(name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
    return file;
  }

  addStaticFile(name: string): string {
    this.moduleInfo.staticFiles.push(this.write('module/' + name));
    return this.write('decl/' + name.replace(/\.(?:d\.)?(?:ets|ats)$/, '.d.ets'));
  }
}

// Keep each suite's temporary files and module maps isolated between tests.
function useFixture(): ResolutionFixture {
  const fixture = new ResolutionFixture();
  mocha.beforeEach(function() {
    fixture.create();
  });
  mocha.afterEach(function() {
    fixture.remove();
  });
  return fixture;
}

mocha.describe('ATS interop declaration paths', function() {
  const fixture = useFixture();

  for (const { suffixes, expectedSuffix } of [
    { suffixes: [], expectedSuffix: '.d.ets' },
    { suffixes: ['.d.ets'], expectedSuffix: '.d.ets' },
    { suffixes: ['.d.ats'], expectedSuffix: '.d.ats' },
    { suffixes: ['.d.ets', '.d.ats'], expectedSuffix: '.d.ats' },
    { suffixes: ['.d.ets', '.d.ats', '.override.d.ets'], expectedSuffix: '.override.d.ets' },
    { suffixes: ['.d.ets', '.d.ats', '.override.d.ets', '.override.d.ats'], expectedSuffix: '.override.d.ats' },
    { suffixes: ['.override.d.ets'], expectedSuffix: '.override.d.ets' },
    { suffixes: ['.override.d.ats'], expectedSuffix: '.override.d.ats' }
  ]) {
    mocha.it(`selects declfile-info paths with ${suffixes.join(', ') || 'no declarations'}`, function() {
      const projectFilePath = 'src/main/ets/Foo';
      const evolution = loadEvolution(loadManager(), {
        getPkgInfo: () => ({ projectFilePath, pkgInfo: { isSO: false, version: '1.0.0' } })
      });
      const declgenV2OutPath = fixture.filePath('declgenV2');
      evolution.arkTSModuleMap.set('pkg', { declgenV2OutPath });
      for (const suffix of suffixes) {
        fixture.write(`declgenV2/${projectFilePath}${suffix}`);
      }
      evolution.addDeclFilesConfig(fixture.write('module/src/main/ets/Foo.ets'), {
        mainModuleName: 'entry', bundleName: 'com.example'
      }, undefined, fixture.filePath('module'), 'pkg');

      expect(evolution.pkgDeclFilesConfig.pkg.files[projectFilePath]).to.deep.equal({
        declPath: `${declgenV2OutPath}/${projectFilePath}${expectedSuffix}`,
        ohmUrl: '@normalized:N&entry&com.example&pkg/src/main/ets/Foo&1.0.0'
      });
    });
  }

  mocha.it('keeps ATS overrides out of dynamic declaration resolution', function() {
    const manager = loadManager();
    const declaration = fixture.write('decl/Foo.d.ets');
    fixture.write('decl/Foo.d.ats');
    fixture.write('decl/Foo.override.d.ats');
    expect(manager.getOverrideDeclPath(declaration)).to.equal(declaration);
    const override = fixture.write('decl/Foo.override.d.ets');
    expect(manager.getOverrideDeclPath(declaration)).to.equal(override);
  });
});

mocha.describe('ATS interop relative imports from declarations', function() {
  const fixture = useFixture();

  for (const suffix of ['.ets', '.d.ets']) {
    mocha.it(`maps a d.ets importer back to source before resolving ${suffix}`, function() {
      const containingFile = fixture.write('decl/pages/Main.d.ets');
      const declaration = fixture.addStaticFile('Foo' + suffix);
      for (const request of ['../Foo', '../Foo' + suffix]) {
        expect(fixture.evolution.resolveRelativeModuleFromDecl(request, containingFile)).to.equal(declaration);
      }
    });
    mocha.it(`preserves the source fallback for ${suffix} when no declaration redirect is available`, function() {
      const declaration = fixture.addStaticFile('Foo' + suffix);
      fs.unlinkSync(declaration);
      const source = fixture.filePath('module/Foo' + suffix);
      const unlisted = fixture.write('module/Unlisted' + suffix);
      fixture.write('decl/Unlisted.d.ets');
      const containingFile = fixture.write('decl/Main.d.ets');
      for (const request of ['./Foo', './Foo' + suffix]) {
        expect(fixture.evolution.resolveRelativeModuleFromDecl(request, containingFile)).to.equal(source);
      }
      for (const request of ['./Unlisted', './Unlisted' + suffix]) {
        expect(fixture.evolution.resolveRelativeModuleFromDecl(request, containingFile)).to.equal(unlisted);
      }
      expect(fixture.evolution.resolveRelativeModuleFromDecl('./Missing', containingFile)).to.equal(undefined);
    });
  }
});

mocha.describe('ATS interop declaration fallbacks', function() {
  const fixture = useFixture();

  mocha.it('returns undefined for importers other than d.ets', function() {
    fixture.addStaticFile('Foo.ats');
    for (const suffix of ['.ets', '.ats', '.ts', '.js', '.d.ats']) {
      const containingFile = fixture.write('module/Main' + suffix);
      expect(fixture.evolution.resolveRelativeModuleFromDecl('./Foo', containingFile)).to.equal(undefined);
    }
  });

  mocha.it('returns undefined when a declaration cannot be mapped to source', function() {
    fixture.addStaticFile('Foo.ets');
    const containingFile = fixture.write('module/Main.d.ets');
    expect(fixture.evolution.resolveRelativeModuleFromDecl('./Foo', containingFile)).to.equal(undefined);
  });

  mocha.it('preserves legacy file precedence when an ATS sibling exists', function() {
    fixture.addStaticFile('Foo.ats');
    const legacySource = fixture.write('module/Foo.ets');
    const containingFile = fixture.write('decl/Main.d.ets');
    expect(fixture.evolution.resolveRelativeModuleFromDecl('./Foo', containingFile)).to.equal(legacySource);
  });

  mocha.it('preserves relative imports of legacy files from generated declarations', function() {
    const containingFile = fixture.write('decl/Main.d.ets');
    const declaration = fixture.addStaticFile('Static.ets');
    expect(fixture.evolution.resolveRelativeModuleFromDecl('./Static', containingFile)).to.equal(declaration);
    for (const suffix of ['.ets', '.ts', '.d.ets']) {
      const name = 'Dynamic' + suffix.replace(/\./g, '_');
      const source = fixture.write('module/' + name + suffix);
      expect(fixture.evolution.resolveRelativeModuleFromDecl('./' + name, containingFile)).to.equal(source);
    }
  });

  mocha.it('leaves package imports to the existing declaration lookup', function() {
    const index = fixture.addStaticFile('Index.ats');
    const declaration = fixture.addStaticFile('src/main/ets/Foo.ats');
    const containingFile = fixture.write('decl/Main.d.ets');
    for (const request of ['pkg', 'pkg/Foo']) {
      expect(fixture.evolution.resolveRelativeModuleFromDecl(request, containingFile)).to.equal(undefined);
    }
    expect(fixture.evolution.getArkTSEvoDeclFilePath({ moduleRequest: 'pkg', resolvedFileName: '' })).to.equal(index);
    expect(fixture.evolution.getArkTSEvoDeclFilePath({ moduleRequest: 'pkg/Foo', resolvedFileName: '' })).to.equal(declaration);
  });
});

mocha.describe('ATS interop package roots', function() {
  const fixture = useFixture();

  for (const suffix of ['.ats', '.d.ats']) {
    mocha.it(`resolves a package root to Index${suffix}`, function() {
      fixture.addStaticFile('Index' + suffix);
      fixture.evolution.arkTSHybridModuleMap.set('@scope/pkg', fixture.moduleInfo);
      for (const request of ['pkg', '@scope/pkg']) {
        expect(fixture.evolution.resolvePackageAtsFileFromEtsFile(request, fixture.write('module/Main.ets')))
          .to.equal(fixture.filePath('module/Index' + suffix));
      }
    });
  }
});

mocha.describe('ATS interop package subpaths', function() {
  const fixture = useFixture();

  for (const [suffix, sourceRoot] of [
    ['.ats', 'src/main/ets'], ['.ats', ''], ['.ats', 'src/secondary'],
    ['.d.ats', 'src/main/ets'], ['.d.ats', ''], ['.d.ats', 'src/secondary']
  ]) {
    mocha.it(`resolves a package subpath to the original ${suffix} under ${sourceRoot || 'the package root'}`, function() {
      fixture.addStaticFile(path.posix.join(sourceRoot, 'Foo' + suffix));
      if (sourceRoot === 'src/secondary') {
        fixture.moduleInfo.sourceRoots = ['src/main/ets', 'src/secondary'];
      }
      expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('pkg/Foo', fixture.write('module/Main.ets')))
        .to.equal(fixture.filePath('module', sourceRoot, 'Foo' + suffix));
    });
  }
});

mocha.describe('ATS interop package lookup constraints', function() {
  const fixture = useFixture();

  mocha.it('keeps package source and declaration lookup consistent across multiple sourceRoots', function() {
    fixture.addStaticFile('src/main/ets/Foo.ats');
    const declaration = fixture.addStaticFile('src/secondary/Foo.ats');
    const containingFile = fixture.write('module/Main.ets');
    fixture.moduleInfo.sourceRoots = ['src/main/ets', 'src/secondary'];
    for (let i = 0; i < 2; i++) {
      expect(fixture.evolution.getArkTSEvoDeclFilePath({ moduleRequest: 'pkg/Foo', resolvedFileName: '' })).to.equal(declaration);
      expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('pkg/Foo', containingFile))
        .to.equal(fixture.filePath('module/src/secondary/Foo.ats'));
    }
    expect(fixture.moduleInfo.sourceRoots).to.deep.equal(['src/main/ets', 'src/secondary']);
  });

  mocha.it('requires a registered existing ATS file for a package subpath', function() {
    fixture.addStaticFile('Foo.ats');
    const containingFile = fixture.write('module/Main.ets');
    fixture.moduleInfo.staticFiles = [];
    expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('pkg/Foo', containingFile)).to.equal(undefined);
    const source = fixture.filePath('module/Foo.ats');
    fixture.moduleInfo.staticFiles = [source];
    fs.unlinkSync(source);
    expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('pkg/Foo', containingFile)).to.equal(undefined);
  });

  mocha.it('limits package ATS lookup to extensionless package requests imported by ETS source', function() {
    fixture.addStaticFile('Foo.ats');
    const containingFile = fixture.write('module/Main.ets');
    for (const request of ['pkg/Foo.ats', 'pkg/Foo.d.ats', 'pkg/Missing', 'other/Foo', './Foo']) {
      expect(fixture.evolution.resolvePackageAtsFileFromEtsFile(request, containingFile)).to.equal(undefined);
    }
    for (const suffix of ['.ts', '.js', '.d.ets', '.ats', '.d.ats']) {
      expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('pkg/Foo', fixture.write('module/Main' + suffix))).to.equal(undefined);
    }
    fixture.evolution.arkTSHybridModuleMap.set('@scope/pkg', fixture.moduleInfo);
    expect(fixture.evolution.resolvePackageAtsFileFromEtsFile('@scope/pkg/Foo', containingFile))
      .to.equal(fixture.filePath('module/Foo.ats'));
  });
});

mocha.describe('ATS interop relative imports from ETS source', function() {
  const fixture = useFixture();

  for (const suffix of ['.ats', '.d.ats']) {
    mocha.it(`redirects relative ${suffix} imports to generated d.ets declarations`, function() {
      const declaration = fixture.addStaticFile('Foo' + suffix);
      for (const [importer, prefix] of [['module/Main.ets', './'], ['module/pages/Main.ets', '../']]) {
        const containingFile = fixture.write(importer);
        expect(fixture.evolution.resolveRelativeModuleFromSource(prefix + 'Foo', containingFile)).to.equal(declaration);
        expect(fixture.evolution.resolveRelativeModuleFromSource(prefix + 'Foo' + suffix, containingFile)).to.equal(declaration);
      }
    });

    mocha.it(`returns undefined when ${suffix} has no generated interop declaration`, function() {
      const declaration = fixture.addStaticFile('Foo' + suffix);
      fs.unlinkSync(declaration);
      fixture.write('module/Unlisted' + suffix);
      fixture.write('decl/Unlisted.d.ets');
      const containingFile = fixture.write('module/Main.ets');
      for (const request of ['./Foo', './Foo' + suffix, './Unlisted', './Unlisted' + suffix, './Missing']) {
        expect(fixture.evolution.resolveRelativeModuleFromSource(request, containingFile)).to.equal(undefined);
      }
    });
  }
});

mocha.describe('ATS interop source import fallbacks', function() {
  const fixture = useFixture();

  mocha.it('leaves declaration importers to the declaration resolver', function() {
    const declaration = fixture.addStaticFile('Foo.ets');
    for (const suffix of ['.d.ets', '.d.ats']) {
      const containingFile = fixture.write('decl/Main' + suffix);
      expect(fixture.evolution.resolveRelativeModuleFromSource('./Foo', containingFile)).to.equal(undefined);
    }
    expect(fixture.evolution.resolveRelativeModuleFromDecl('./Foo', fixture.write('decl/Main.d.ets'))).to.equal(declaration);
  });

  mocha.it('leaves package and legacy ETS imports to their existing resolvers', function() {
    fixture.addStaticFile('Index.ats');
    fixture.addStaticFile('Foo.ets');
    const containingFile = fixture.write('module/Main.ets');
    for (const request of ['pkg', 'pkg/Foo', './Foo', './Foo.ets']) {
      expect(fixture.evolution.resolveRelativeModuleFromSource(request, containingFile)).to.equal(undefined);
    }
  });
});

mocha.describe('ATS interop file classification', function() {
  const fixture = useFixture();

  mocha.it('preserves module classification and excludes ATS pages from dynamic compilation', function() {
    const manager = loadManager();
    const ats = fixture.write('module/Foo.ats');
    manager.FileManager.arkTSModuleMap.set('pkg', {
      packageName: 'pkg', language: '1.1', modulePath: fixture.filePath('module')
    });
    expect(manager.FileManager.getInstance().getLanguageVersionByFilePath(ats))
      .to.deep.equal({ languageVersion: '1.1', pkgName: 'pkg' });
    const oldStatic = fixture.write('Old.ets', "'use static';");
    const dynamic = fixture.write('Dynamic.ets');
    const saved = process.env.mixCompile;
    process.env.mixCompile = 'true';
    try {
      const pages = new Set([ats, ats.slice(0, -4), oldStatic, dynamic]);
      manager.processAbilityPagesFullPath(pages);
      expect([...pages]).to.deep.equal([dynamic]);
    } finally {
      if (saved === undefined) {
        delete process.env.mixCompile;
      } else {
        process.env.mixCompile = saved;
      }
    }
  });

  mocha.it('uses the existing static file lists and d.ets declaration paths for ATS', function() {
    const { evolution } = fixture;
    for (const suffix of ['.ets', '.d.ets', '.ats', '.d.ats']) {
      const name = suffix.replace(/\./g, '_');
      const decl = fixture.addStaticFile(name + suffix);
      const source = fixture.filePath('module', name + suffix);
      expect(evolution.getArkTSEvoDeclFilePath({ moduleRequest: '', resolvedFileName: source })).to.equal(decl);
      expect(evolution.isArkTSEvolutionFile(source, { pkgName: 'pkg' })).to.equal(true);
    }
    const unlisted = fixture.write('module/Unlisted.ats');
    expect(evolution.getArkTSEvoDeclFilePath({ moduleRequest: '', resolvedFileName: unlisted })).to.equal('');
    expect(evolution.isArkTSEvolutionFile(unlisted, { pkgName: 'pkg' })).to.equal(false);
  });
});
