/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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
import * as ts from 'typescript';
import path from 'path';

import {
  processKitImport,
  kitTransformLog,
  KitInfo
} from '../../../lib/process_kit_import';
import { findImportSpecifier } from '../utils/utils';

const KIT_IMPORT_CODE: string =
`
import { Ability, featureAbility, ErrorCode } from "@kit.AbilityKit";
let localAbility = new Ability();
let localFeature = new featureAbility();
let noError = ErrorCode.NO_ERROR;
`

const KIT_IMPORT_CODE_EXPECT: string =
'import Ability from "@ohos.app.ability.Ability";\n' +
'import featureAbility from "@ohos.ability.featureAbility";\n'+
'import { ErrorCode } from "@ohos.ability.errorCode";\n'+
'let localAbility = new Ability();\n'+
'let localFeature = new featureAbility();\n'+
'let noError = ErrorCode.NO_ERROR;\n'+
'//# sourceMappingURL=kitTest.js.map'

const KIT_EXPORT_CODE: string =
`
export { Ability, featureAbility, ErrorCode } from "@kit.AbilityKit";
`

const KIT_EXPORT_CODE_EXPECT: string =
'export { default as Ability } from "@ohos.app.ability.Ability";\n' +
'export { default as featureAbility } from "@ohos.ability.featureAbility";\n'+
'export { ErrorCode } from "@ohos.ability.errorCode";\n'+
'//# sourceMappingURL=kitTest.js.map'

const KIT_STAR_EXPORT_CODE: string =
`
export * from "@kit.AudioKit";
`

const KIT_STAR_EXPORT_CODE_EXPECT: string =
'export * from "@ohos.multimedia.audio";\n' +
'export * from "@ohos.multimedia.audioHaptic";\n'+
'export * from "@ohos.multimedia.systemSoundManager";\n'+
'export * from "@ohos.multimedia.AVVolumePanel";\n' +
'//# sourceMappingURL=kitTest.js.map'

const KIT_IMPORT_ERROR_CODE: string =
'import { Ability } from "@kit.Kit";'

const KIT_IMPORT_DEFAULT_CODE: string =
'import { Ability } from "@kit.AbilityKit";'

const KIT_UNUSED_TYPE_IMPROT_CODE: string = 
'import { BusinessError } from "@kit.BasicServicesKit";'

const KIT_UNUSED_TYPE_IMPROT_CODE_EXPECT: string =
'export {};\n' +
'//# sourceMappingURL=kitTest.js.map'

const KIT_USED_TYPE_IMPROT_CODE: string = 
'import { BusinessError } from "@kit.BasicServicesKit";\n' +
'let e: BusinessError = undefined';

const KIT_USED_TYPE_IMPROT_CODE_EXPECT: string =
'let e = undefined;\n' +
'export {};\n' +
'//# sourceMappingURL=kitTest.js.map'

const KIT_UNUSED_VALUE_IMPORT_CODE: string =
'import { appAccount } from "@kit.BasicServicesKit";'

const KIT_UNUSED_VALUE_IMPROT_CODE_EXPECT: string =
'export {};\n' +
'//# sourceMappingURL=kitTest.js.map'

const KIT_USED_VALUE_IMPORT_CODE: string =
'import { appAccount } from "@kit.BasicServicesKit";\n' +
'appAccount.createAppAccountManager();';

const KIT_USED_VALUE_IMPROT_CODE_EXPECT: string =
'import appAccount from "@ohos.account.appAccount";\n' +
'appAccount.createAppAccountManager();\n' +
'//# sourceMappingURL=kitTest.js.map'

const KIT_EMPTY_IMPORT_CODE: string =
'import { appAccount } from "@kit.BasicServicesKit";\n' +
'import "@kit.ArkUI";\n' +
'appAccount.createAppAccountManager();';

const compilerOptions = ts.readConfigFile(
  path.resolve(__dirname, '../../../tsconfig.json'), ts.sys.readFile).config.compilerOptions;
compilerOptions['moduleResolution'] = 'nodenext';
compilerOptions['module'] = 'es2020';

// !! The Kit transform result would be changed once the kit config file has updated.
mocha.describe('process Kit Imports tests', function () {
  mocha.it('process specifier imports', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_IMPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_IMPORT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process specifier exports', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_EXPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_EXPORT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process star export', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_STAR_EXPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_STAR_EXPORT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process unused type import', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_UNUSED_TYPE_IMPROT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_UNUSED_TYPE_IMPROT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process used type import', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_USED_TYPE_IMPROT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_USED_TYPE_IMPROT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process unused value import', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_UNUSED_VALUE_IMPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_UNUSED_VALUE_IMPROT_CODE_EXPECT).to.be.true;
  });

  mocha.it('process used value import', function () {
    const result: ts.TranspileOutput = ts.transpileModule(KIT_USED_VALUE_IMPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    expect(result.outputText == KIT_USED_VALUE_IMPROT_CODE_EXPECT).to.be.true;
  });

  mocha.it('the error message of processKitImport', function () {
    ts.transpileModule(KIT_IMPORT_ERROR_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    const hasError = kitTransformLog.errors.some(error =>
      error.message.includes("Kit '@kit.Kit' has no corresponding config file in ArkTS SDK. "+
      'Please make sure the Kit apis are consistent with SDK ' +
      "and there's no local modification on Kit apis.")
    );
    expect(hasError).to.be.true;
  });

  mocha.it('the error message of newSpecificerInfo', function () {
    const symbols = {
      'test': ''
    }
    const sourceCode = 'import { test } from "my-module";';
    const sourceFile = ts.createSourceFile(
        "tempFile.ts",
        sourceCode,
        ts.ScriptTarget.Latest,
        true
    );
    const kitNode = findImportSpecifier(sourceFile);
    const kitInfo = new KitInfo(kitNode, symbols);
    kitInfo.newSpecificerInfo('', 'test', undefined)
    const hasError = kitTransformLog.errors.some(error =>
      error.message.includes("'test' is not exported from Kit")
    );
    expect(hasError).to.be.true;
  });

  mocha.it('the error message of empty import', function () {
    ts.transpileModule(KIT_EMPTY_IMPORT_CODE, {
      compilerOptions: compilerOptions,
      fileName: "kitTest.ts",
      transformers: { before: [ processKitImport() ] }
    });
    const hasError = kitTransformLog.errors.some(error =>
      error.message.includes("Can not use empty import(side-effect import) statement with Kit '@kit.ArkUI', " +
      "Please specify imported symbols explicitly.")
    );
    expect(hasError).to.be.true;
  });
});
