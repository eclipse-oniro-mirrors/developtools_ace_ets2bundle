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

import fs from 'fs';
import path from 'path';
import mocha from 'mocha';
import * as ts from 'typescript';
import { expect } from 'chai';

// The interop variant of the loader lives in lib/ while `interopArkTest`
// rebuilds lib from src/interop/src via interopBuild, so requiring the
// compiled artifact here exercises the mirrored implementation.
const {
  processUISyntax,
  transformLog
} = require('../../../lib/process_ui_syntax');
const {
  validateUISyntax,
  resetComponentCollection,
  componentCollection
} = require('../../../lib/validate_ui_syntax');
const {
  componentInfo,
  storedFileInfo,
  CurrentProcessFile
} = require('../../../lib/utils');
const {
  getCompilerHost
} = require('../../../lib/fast_build/ets_ui/rollup-plugin-ets-typescript');
const main = require('../../../main');
const processStructComponentV2 = require('../../../lib/process_struct_componentV2');
const {
  BUILD_ON
} = require('../../../lib/pre_define');

const FIXTURE_DIR: string = path.resolve(__dirname,
  '../../../test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component');
const COMPILER_ROOT: string = path.resolve(__dirname, '../../..');
function requireUndefinedWarnMessage(paramName: string, declaredType: string, actualType: string): string {
  return `'@Require' decorated '${paramName}' expects type '${declaredType}' ` +
    `but got '${actualType}' through the component constructor.`;
}

interface TransformLogInfo {
  type: string;
  message: string;
  pos: number;
  code?: string;
}

interface RequireUndefinedWarnExpectation {
  paramName: string;
  declaredType: string;
  actualType: string;
}

mocha.describe('process custom component require param undefined type interop tests', function() {
  this.timeout(60000);

  mocha.after(function() {
    main.resetGlobalProgram();
    main.resetMain();
  });

  function transformPage(pageName: string): TransformLogInfo[] {
    const fixturePath: string = path.join(FIXTURE_DIR, `${pageName}.ets`);
    const code: string = fs.readFileSync(fixturePath, 'utf-8');

    transformLog.errors = [];
    main.resources.app['media'] = { icon: 16777222 };
    main.resources.app['font'] = { song: 16777223 };
    process.env.rawFileResource = './';
    process.env.compileMode = 'moduleJson';
    process.env.compiler = BUILD_ON;
    process.env.compileTool = 'rollup';
    componentInfo.id = 0;
    componentCollection.customComponents.clear();
    resetComponentCollection();
    storedFileInfo.setCurrentArkTsFile();
    storedFileInfo.addFileCacheInfo(fixturePath);

    const compilerOptions = ts.readConfigFile(
      path.join(COMPILER_ROOT, 'tsconfig.json'), ts.sys.readFile).config.compilerOptions;
    compilerOptions.noEmit = false;
    const program: ts.Program = ts.createProgram([fixturePath], compilerOptions, getCompilerHost());
    main.globalProgram.program = program;
    CurrentProcessFile.setIsProcessingFileETS(fixturePath);

    transformLog.errors.push(...validateUISyntax(code, code, fixturePath, '?entry'));
    program.emit(program.getSourceFile(fixturePath), () => {}, undefined, undefined, {
      before: [processUISyntax(null, true, null, fixturePath, {})]
    });
    processStructComponentV2.default.resetStructMapInEts();
    return transformLog.errors;
  }

  function expectSingleRequireUndefinedWarn(logs: TransformLogInfo[], paramName: string,
    declaredType: string, actualType: string): void {
    const warnInfos: TransformLogInfo[] = logs.filter((log: TransformLogInfo) => log.type === 'WARN');
    const errorInfos: TransformLogInfo[] = logs.filter((log: TransformLogInfo) => log.type === 'ERROR');
    expect(errorInfos).to.have.lengthOf(0);
    expect(warnInfos).to.have.lengthOf(1);
    expect(warnInfos[0].message).to.equal(requireUndefinedWarnMessage(paramName, declaredType, actualType));
  }

  function expectRequireUndefinedWarns(logs: TransformLogInfo[],
    expectations: RequireUndefinedWarnExpectation[]): void {
    const warnInfos: TransformLogInfo[] = logs.filter((log: TransformLogInfo) => log.type === 'WARN');
    const errorInfos: TransformLogInfo[] = logs.filter((log: TransformLogInfo) => log.type === 'ERROR');
    expect(errorInfos).to.have.lengthOf(0);
    expect(warnInfos).to.have.lengthOf(expectations.length);
    expectations.forEach((expectation: RequireUndefinedWarnExpectation) => {
      const message: string = requireUndefinedWarnMessage(
        expectation.paramName, expectation.declaredType, expectation.actualType);
      expect(warnInfos.some((warn: TransformLogInfo) => warn.message === message)).to.be.true;
    });
  }

  mocha.it('warns once when a @Require regular param is initialized with undefined', function() {
    const logs: TransformLogInfo[] = transformPage('validateRequireParamUndefinedType');
    expectSingleRequireUndefinedWarn(logs, 'require_value', 'number', 'undefined');
  });

  mocha.it('warns once when a @Require @Param is initialized with undefined in V2', function() {
    const logs: TransformLogInfo[] = transformPage('validateRequireParamUndefinedTypeV2');
    expectSingleRequireUndefinedWarn(logs, 'require_param_value', 'string', 'undefined');
  });

  mocha.it('warns once per field for void expression and union variable in V1 extension', function() {
    const logs: TransformLogInfo[] = transformPage('validateRequireParamUndefinedTypeExtension');
    expectRequireUndefinedWarns(logs, [
      { paramName: 'void_value', declaredType: 'number', actualType: 'undefined' },
      { paramName: 'union_variable_value', declaredType: 'number', actualType: 'number | undefined' }
    ]);
  });

  mocha.it('warns once per field for void expression and union variable in V2 extension', function() {
    const logs: TransformLogInfo[] = transformPage('validateRequireParamUndefinedTypeExtensionV2');
    expectRequireUndefinedWarns(logs, [
      { paramName: 'void_param_value', declaredType: 'string', actualType: 'undefined' },
      { paramName: 'union_param_value', declaredType: 'string', actualType: 'string | undefined' }
    ]);
  });
});
