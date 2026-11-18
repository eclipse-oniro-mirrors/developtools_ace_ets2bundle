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

import { generateBytecodePathFragement } from '../../../lib/process_interop_component';
import { arkTSEvolutionModuleMap } from '../../../lib/fast_build/ark_compiler/interop/process_arkts_evolution';

const MODULE_NAME: string = 'pathFragmentTest';

mocha.describe('generateBytecodePathFragement tests', function() {
  mocha.afterEach(function() {
    arkTSEvolutionModuleMap.delete(MODULE_NAME);
  });

  function configureModule(outputPath: string): void {
    arkTSEvolutionModuleMap.set(MODULE_NAME, {
      packageName: MODULE_NAME,
      declgenV1OutPath: outputPath
    } as any);
  }

  mocha.it('extracts the relative path using the configured declgenV1 output path', function() {
    configureModule('/path-fragment-test/declgenV1');
    const result = generateBytecodePathFragement(
      'Child', '/path-fragment-test/declgenV1/src/main/ets/pages/Child.d.ets', MODULE_NAME);

    expect(result).to.deep.equal({
      instanceName: '__Options_Child',
      classPath: 'LpathFragmentTest/src/main/ets/pages/Child/__Options_Child;',
      interfacePath: 'LpathFragmentTest/src/main/ets/pages/Child/' +
        'pathFragmentTest$src$main$ets$pages$Child$__Options_Child$ObjectLiteral;'
    });
  });

  mocha.it('extracts the relative path using the configured from-static output path', function() {
    configureModule('/path-fragment-test/from-static');
    const result = generateBytecodePathFragement(
      'Child', '/path-fragment-test/from-static/src/main/ets/pages/Child.d.ets', MODULE_NAME);

    expect(result).to.deep.equal({
      instanceName: '__Options_Child',
      classPath: 'LpathFragmentTest/src/main/ets/pages/Child/__Options_Child;',
      interfacePath: 'LpathFragmentTest/src/main/ets/pages/Child/' +
        'pathFragmentTest$src$main$ets$pages$Child$__Options_Child$ObjectLiteral;'
    });
  });

  mocha.it('does not rely on the output directory name', function() {
    configureModule('/path-fragment-test/custom-output');
    const result = generateBytecodePathFragement(
      'Child', '/path-fragment-test/custom-output/src/main/ets/pages/Child.d.ets', MODULE_NAME);

    expect(result.classPath).to.equal('LpathFragmentTest/src/main/ets/pages/Child/__Options_Child;');
  });

  mocha.it('rejects a declaration outside the configured output path', function() {
    configureModule('/path-fragment-test/declgenV1');

    expect(() => generateBytecodePathFragement(
      'Child', '/path-fragment-test/other/src/main/ets/pages/Child.d.ets', MODULE_NAME))
      .to.throw('Declaration output path not found.');
  });
});
