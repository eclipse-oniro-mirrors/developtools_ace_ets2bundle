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
import mocha from 'mocha';
import sourceMap from 'source-map';

import { updateSourceMap } from '../../../lib/fast_build/ark_compiler/utils';
import { updateSourceMapSync } from '../../../lib/fast_build/ark_compiler/source_map_utils';

function createMap(mappings: string, options: Partial<sourceMap.RawSourceMap> = {}): sourceMap.RawSourceMap {
  return {
    version: 3,
    file: 'output.js',
    sources: ['source.ets'],
    names: [],
    mappings,
    ...options
  };
}

async function expectMatchingMaps(origin: sourceMap.RawSourceMap, current: sourceMap.RawSourceMap): Promise<void> {
  const originalInputs = JSON.stringify([origin, current]);
  const expected = await updateSourceMap(origin, current);
  const actual = updateSourceMapSync(origin, current);
  expect(actual).not.to.be.instanceOf(Promise);
  expect(actual).to.deep.equal(expected);
  expect(JSON.stringify([origin, current])).to.equal(originalInputs);
}

function registerPositionTests(): void {
  mocha.it('returns the existing map directly when either input is absent', function() {
    const map = createMap('AAAA');
    expect(updateSourceMapSync(undefined, map)).to.equal(map);
    expect(updateSourceMapSync(map)).to.equal(map);
    expect(updateSourceMapSync(undefined)).to.equal(undefined);
  });

  mocha.it('uses the greatest lower bound for columns between origin mappings', async function() {
    await expectMatchingMaps(createMap('AAIC,OAAO'), createMap('AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC'));
  });

  mocha.it('does not use a mapping from a preceding line or after the requested column', async function() {
    await expectMatchingMaps(createMap('KAAA;;AACA'), createMap('AAAA,IAAI,CAAC;AACA;AACA'));
  });

  mocha.it('omits unmapped segments from both maps', async function() {
    await expectMatchingMaps(createMap('AAAA,K,KAIA'), createMap('AAAA,KAAK,KAAK,K'));
  });
}

function registerContentTests(): void {
  mocha.it('preserves current names, sources, contents and the origin file name', async function() {
    const origin = createMap('AACGA', {
      file: 'original.js',
      sourceRoot: '/original/',
      sources: ['original.ets'],
      sourcesContent: ['original source'],
      names: ['originalName']
    });
    const current = createMap('AAAAA', {
      file: 'current.js',
      sourceRoot: '',
      sources: ['./current.js', 'unused.js'],
      sourcesContent: ['current source', 'unused source'],
      names: ['currentName', 'unusedName']
    });
    await expectMatchingMaps(origin, current);
    const result = updateSourceMapSync(origin, current)!;
    expect(result.file).to.equal(origin.file);
    expect(result.names).to.deep.equal(['currentName']);
    expect(result.sources).to.deep.equal(['current.js', 'unused.js']);
    expect(result.sourcesContent).to.deep.equal(current.sourcesContent);
    expect(result.sourceRoot).to.equal('');
  });

  mocha.it('handles multiple sources and preserves unused current sources', async function() {
    await expectMatchingMaps(createMap('AAAA;ACCA', { sources: ['first.ets', 'second.ets'] }),
      createMap('ACAA;ADCA', { sources: ['first.js', 'second.js', 'unused.js'] }));
  });

  mocha.it('normalizes paths and URLs using the existing source-map rules', async function() {
    await expectMatchingMaps(createMap('AAAA;ACCA', { sources: ['./a/../first.ets', 'https://example.com/x/../second.ets'] }),
      createMap('AAAA;ACCA', { sources: ['./a/../first.js', 'https://example.com/x/../second.js'] }));
  });
}

function registerRepeatedMappingTests(): void {
  mocha.it('handles equal columns ordered by source, original position and name indices', async function() {
    const options = { sources: ['z.ts', 'a.ts'], names: ['Z', 'A'] };
    await expectMatchingMaps(createMap('KCIAC,ADDGD,AAFFC,AAAAD,LCDD', options), createMap('AAAA,KAAK,CAAC'));
    await expectMatchingMaps(createMap('AAAA'), createMap('KCIAC,ADDGD,AAFFC,AAAAD,LCDD', options));
  });

  mocha.it('selects the last mapping at an equal origin column', async function() {
    await expectMatchingMaps(createMap('AAAA,KAIA,AAHA'), createMap('AAAA,KAAK,CAAC'));
  });

  mocha.it('lets an unmapped segment override a mapped segment at the same origin column', async function() {
    await expectMatchingMaps(createMap('AAAA,K,AACA'), createMap('AAAA,KAAK,CAAC'));
    await expectMatchingMaps(createMap('AAAA,KACA,A'), createMap('AAAA,KAAK,CAAC'));
  });

  mocha.it('deduplicates identical mappings and source/name entries as before', async function() {
    await expectMatchingMaps(createMap('AAAA,AAAA'),
      createMap('AAAAA,AAAAC,ACAAD', { sources: ['same.js', 'same.js'], names: ['name', 'name'] }));
  });
}

function registerEmptyMapTests(): void {
  mocha.it('handles maps without mapped segments', async function() {
    await expectMatchingMaps(createMap(''), createMap('AAAA'));
    await expectMatchingMaps(createMap('AAAA'), createMap(''));
    await expectMatchingMaps(createMap(''), createMap(''));
  });

  mocha.it('retains nonempty current source roots when no composed mappings survive', async function() {
    await expectMatchingMaps(createMap(''), createMap('AAAA', {
      sourceRoot: '/current/',
      sources: ['current.js', 'unused.js'],
      sourcesContent: ['current source', 'unused source']
    }));
  });

  mocha.it('retains the existing error for surviving mappings with a nonempty current source root', async function() {
    const origin = createMap('AAAA');
    const current = createMap('AAAA', { sourceRoot: '/current/' });
    let expectedMessage: string;
    try {
      await updateSourceMap(origin, current);
    } catch (error) {
      expectedMessage = error.message;
    }
    expect(expectedMessage).to.be.a('string');
    expect(() => updateSourceMapSync(origin, current)).to.throw(expectedMessage);
  });
}

mocha.describe('synchronous source map composition', () => {
  registerPositionTests();
  registerContentTests();
  registerRepeatedMappingTests();
  registerEmptyMapTests();
});
