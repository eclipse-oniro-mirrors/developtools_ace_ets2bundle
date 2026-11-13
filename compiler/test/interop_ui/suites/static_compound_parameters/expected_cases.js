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

const artifactContracts = {
  declarationMap: 'dynamic_component/build/default/intermediates/declgen/default/decl-fileInfo.json',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  bridgeSource: 'entry/build/default/intermediates/declgen/default/declgenBridgeCode/entry/src/main/ets/pages/Index.ts',
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  repositoryDeclgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  repositoryDeclarationMap: 'dynamic_component/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  repositoryBuildLog: 'evidence/repository-static.log',
  repositoryStaticDisassembly: 'evidence/repository-modules_static.pa',
  dynamicDisassembly: 'evidence/modules_dynamic.pa',
  buildLog: 'evidence/hvigor.log',
  buildCommand: 'evidence/hvigor-command.txt',
  generationEvidence: 'evidence/fresh-generation.json',
  consumptionEvidence: 'evidence/consumption.json'
};

const generatedDeclarations = {
  CompoundCard: {
    required: [
      `'use static'`,
      `import { Component } from '@ohos.arkui.component';`,
      `export declare struct CompoundCard`,
      `profile: ProfileModel;`,
      `aliases: ReadonlyArray<string>;`,
      `matrix: ScoreMatrix;`,
      `profileHistory: ProfileList;`,
      `optionalProfile: NullableProfile;`,
      `preferences: PreferenceModel;`,
      `build(): void;`
    ],
    forbidden: [
      `profile: ProfileModel = new ProfileModel()`,
      `aliases: string[] = []`,
      `Text('compound=`,
      `constructor(`
    ]
  },
  CompoundModels: {
    required: [
      `@Observed`,
      `export declare class GeoPoint`,
      `latitude: number;`,
      `longitude: number;`,
      `export declare class ContactModel`,
      `point: GeoPoint;`,
      `aliases: ReadonlyArray<string>;`,
      `export declare interface PreferenceModel`,
      `enabled: boolean;`,
      `levels: ReadonlyArray<number>;`,
      `export declare class ProfileModel`,
      `contact: ContactModel;`,
      `preferences: PreferenceModel;`,
      `history: ReadonlyArray<ProfileModel>;`,
      `export declare class OptionalModel`,
      `export declare class AlternateProfile`,
      `export declare class RequiredCtorModel`,
      `constructor(id: string);`,
      `export type ProfileList = ReadonlyArray<ProfileModel>;`,
      `export type NullableProfile = ProfileModel | undefined;`,
      `export type AmbiguousProfile = ProfileModel | AlternateProfile;`,
      `export type ScoreRow = ReadonlyArray<number>;`,
      `export type ScoreMatrix = ReadonlyArray<ScoreRow>;`,
      `export declare function createOptionalProfile(): NullableProfile;`,
      `export declare function selectProfile(value: AmbiguousProfile): string;`,
      `export declare function requireConstructedModel(value: RequiredCtorModel): string;`,
      `export declare function consumeOptionalModel(value: OptionalModel | undefined): string;`
    ],
    forbidden: [
      `latitude: number = 0.0`,
      `history: Array<ProfileModel> = []`,
      `point: {`,
      `contact: {`
    ]
  },
  Index: {
    required: [
      `'use static'`,
      `export { CompoundCard } from './src/main/ets/CompoundCard';`,
      `AlternateProfile`,
      `NullableProfile`,
      `ProfileList`,
      `ScoreMatrix`
    ],
    forbidden: [
      `export default`,
      `@Observed export`
    ]
  }
};

const callerContracts = {
  bridgeRequired: [
    `CompoundCard,`, `createOptionalProfile`, `from "dynamic_component";`,
    `globalThis as any`, `Panda.getClass`, `Lentry/src/main/ets/pages/Index/ETSGLOBAL;`
  ],
  bridgeForbidden: [`createUnsupportedObject(e, label) as ProfileModel`, `Ambiguous union type`],
  staticDisassemblyRequired: [
    `entry.src.main.ets.pages.Index`,
    `dynamic_component/src/main/ets/CompoundCard`,
    `@normalized:N&&&dynamic_component/src/main/ets/CompoundCard&1.0.0`,
    `arkui.component.interop.CompatibleComponentInfo`,
    `compatibleComponent`, `viewPUCreate`, `setProperty`,
    `profile`, `aliases`, `matrix`, `profileHistory`, `optionalProfile`, `preferences`,
    `instantiateEmptyObject`, `static-profile`, `primary-contact`,
    `mobile`, `office`, `compound`, `array`,
    `optional-profile`, `optional-contact`, `backup`, `createOptionalProfile`
  ],
  staticParameterOrder: [
    `static-profile`, `primary-contact`, `latitude`, `longitude`, `mobile`, `office`,
    `levels`, `history`, `aliases`, `compound`, `array`, `matrix`, `profileHistory`,
    `optionalProfile`, `optional-profile`, `optional-contact`, `backup`, `preferences`,
    `levels`, `createOptionalProfile`
  ],
  dynamicDisassemblyRequired: [
    `&dynamic_component.src.main.ets.CompoundCard&1.0.0`,
    `&dynamic_component.src.main.ets.CompoundModels&1.0.0`,
    `ModuleTag: LOCAL_EXPORT, local_name: CompoundCard, export_name: CompoundCard;`,
    `@normalized:N&&&dynamic_component/src/main/ets/CompoundCard&1.0.0`,
    `ProfileModel`, `ContactModel`, `GeoPoint`, `initialRender`, `updateStateVars`,
    `#~@2=#ProfileModel`, `createOptionalProfile`, `stobjbyname`,
    `latitude`, `longitude`, `optional-profile`
  ]
};

const knownGenerateDeclarationFailure = {
  stage: 'GenerateDeclaration',
  category: 'existing',
  code: 'F0014',
  sequence: ['F0014', 'ESE0360', 'F0016'],
  requiredText: [
    `Unresolved module name for path: ''`,
    `Cannot find import: *ERROR_LITERAL*`,
    `Can't find prefix for 'dynamic_component'`
  ],
  classification: 'Pre-existing SDK 26.0.0.35 declaration task failure, also reproduced by merged static_calls_dynamic_basic.'
};

const consumerSource = `'use static'
import es from '@ohos.lang.interop';
import { CompoundCard } from './src/main/ets/CompoundCard';
import {
  ContactModel,
  createOptionalProfile,
  GeoPoint,
  NullableProfile,
  PreferenceModel,
  ProfileList,
  ProfileModel,
  ScoreMatrix
} from './src/main/ets/CompoundModels';

function consumeCompoundParameters(): void {
  CompoundCard({
    profile: ({
      id: 'checker-profile',
      contact: {
        label: 'checker-contact',
        point: {
          latitude: 1.0,
          longitude: 2.0
        },
        aliases: ['checker']
      },
      preferences: {
        enabled: true,
        levels: [3.0]
      },
      history: []
    } as ProfileModel),
    aliases: ['checker', 'array'] as ReadonlyArray<string>,
    matrix: [[4.0, 5.0]] as ScoreMatrix,
    profileHistory: [] as ProfileList,
    optionalProfile: ({
      id: 'checker-optional',
      contact: {
        label: 'checker-optional-contact',
        point: {
          latitude: 6.0,
          longitude: 7.0
        },
        aliases: ['optional']
      },
      preferences: {
        enabled: false,
        levels: [8.0]
      },
      history: []
    } as ProfileModel),
    preferences: ({
      enabled: false,
      levels: [9.0]
    } as PreferenceModel)
  })
  CompoundCard({ optionalProfile: createOptionalProfile() })
}
`;

const mockSdkFiles = {
  'sdk/component.d.ets': `
export declare function Component(target: Object): void;
export declare function Observed(target: Object): void;
`,
  'sdk/stateManagement.d.ets': `
export declare class LocalStorage {}
export declare function Observed(target: Object): void;
export declare function PropRef(target: Object, propertyKey: string): void;
export declare function State(target: Object, propertyKey: string): void;
`,
  'sdk/interop.d.ets': `
declare namespace es {
  interface Array<T> {
    [index: number]: T;
    length: number;
  }
}
export default es;
`,
  'sdk/globalAnnotation.d.ets': `
export declare function Prop(target: Object, propertyKey: string): void;
`
};

module.exports = {
  artifactContracts,
  callerContracts,
  consumerSource,
  generatedDeclarations,
  knownGenerateDeclarationFailure,
  mockSdkFiles
};
