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

const { entryAbility: baseEntryAbility } = require('../static_calls_dynamic_basic/source_cases');

const compoundModels = `@Observed
export class GeoPoint {
  latitude: number = 0.0;
  longitude: number = 0.0;
}

@Observed
export class ContactModel {
  label: string = '';
  point: GeoPoint = new GeoPoint();
  aliases: ReadonlyArray<string> = [];
}

export interface PreferenceModel {
  enabled: boolean;
  levels: ReadonlyArray<number>;
}

@Observed
export class ProfileModel {
  id: string = '';
  contact: ContactModel = new ContactModel();
  preferences: PreferenceModel = {
    enabled: false,
    levels: []
  };
  history: ReadonlyArray<ProfileModel> = [];
}

@Observed
export class OptionalModel {
  id: string = '';
}

@Observed
export class AlternateProfile {
  id: string = '';
  contact: ContactModel = new ContactModel();
}

export class RequiredCtorModel {
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export type ProfileList = ReadonlyArray<ProfileModel>;
export type NullableProfile = ProfileModel | undefined;
export type AmbiguousProfile = ProfileModel | AlternateProfile;
export type ScoreRow = ReadonlyArray<number>;
export type ScoreMatrix = ReadonlyArray<ScoreRow>;

export function createOptionalProfile(): NullableProfile {
  const value = new ProfileModel();
  value.id = 'optional-profile';
  value.contact.label = 'optional-contact';
  value.contact.point.latitude = 39.9042;
  value.contact.point.longitude = 116.4074;
  value.contact.aliases = ['backup'];
  value.preferences = {
    enabled: false,
    levels: [5.0]
  };
  value.history = [];
  return value;
}

export function selectProfile(value: AmbiguousProfile): string {
  return value.id;
}

export function requireConstructedModel(value: RequiredCtorModel): string {
  return value.id;
}

export function consumeOptionalModel(value: OptionalModel | undefined): string {
  return value === undefined ? 'none' : value.id;
}
`;

const compoundCard = `import {
  NullableProfile,
  PreferenceModel,
  ProfileList,
  ProfileModel,
  ScoreMatrix
} from './CompoundModels';

@Component
export struct CompoundCard {
  profile: ProfileModel = new ProfileModel();
  aliases: ReadonlyArray<string> = [];
  matrix: ScoreMatrix = [];
  profileHistory: ProfileList = [];
  optionalProfile: NullableProfile = undefined;
  preferences: PreferenceModel = {
    enabled: false,
    levels: []
  };

  build() {
    Column() {
      Text('compound=' + this.profile.id)
        .id('compoundProfile')
      Text('aliases=' + this.aliases.length.toString())
        .id('compoundAliases')
      Text('rows=' + this.matrix.length.toString())
        .id('compoundMatrix')
      Text('history=' + this.profileHistory.length.toString())
        .id('compoundHistory')
      Text('optional=' + (this.optionalProfile === undefined ? 'none' : this.optionalProfile.id))
        .id('compoundOptional')
      Text('preference=' + this.preferences.enabled.toString())
        .id('compoundPreference')
    }
    .width('100%')
    .padding(16)
  }
}
`;

const compoundIndex = `export { CompoundCard } from './src/main/ets/CompoundCard';
export {
  AlternateProfile,
  AmbiguousProfile,
  ContactModel,
  createOptionalProfile,
  GeoPoint,
  NullableProfile,
  PreferenceModel,
  ProfileList,
  ProfileModel,
  requireConstructedModel,
  RequiredCtorModel,
  ScoreMatrix,
  ScoreRow,
  selectProfile
} from './src/main/ets/CompoundModels';
`;

const staticCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import es from '@ohos.lang.interop';
import {
  CompoundCard,
  createOptionalProfile,
  PreferenceModel,
  ProfileList,
  ProfileModel,
  ScoreMatrix
} from 'dynamic_component';

const callerTitle: string = 'PR07 compound caller';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text(callerTitle)
        .fontSize(24)
        .id('compoundCallerTitle')
      CompoundCard({
        profile: ({
          id: 'static-profile',
          contact: {
            label: 'primary-contact',
            point: {
              latitude: 31.2304,
              longitude: 121.4737
            },
            aliases: ['mobile', 'office']
          },
          preferences: {
            enabled: true,
            levels: [1.0, 2.0]
          },
          history: []
        } as ProfileModel),
        aliases: ['compound', 'array'] as ReadonlyArray<string>,
        matrix: [
          [1.0, 2.0],
          [3.0, 4.0]
        ] as ScoreMatrix,
        profileHistory: [] as ProfileList,
        optionalProfile: ({
          id: 'optional-profile',
          contact: {
            label: 'optional-contact',
            point: {
              latitude: 39.9042,
              longitude: 116.4074
            },
            aliases: ['backup']
          },
          preferences: {
            enabled: false,
            levels: [5.0]
          },
          history: []
        } as ProfileModel),
        preferences: ({
          enabled: true,
          levels: [8.0, 13.0]
        } as PreferenceModel)
      })
      CompoundCard({ optionalProfile: createOptionalProfile() })
    }
    .width('100%')
    .height('100%')
    .padding(24)
  }
}
`;

const optionalCard = `@Component
export struct OptionalCard {
  build() {
    Text('optional model callee')
      .id('optionalModelValue')
  }
}
`;

const optionalIndex = `export { OptionalCard } from './src/main/ets/OptionalCard';
export { consumeOptionalModel, OptionalModel } from './src/main/ets/CompoundModels';
`;

const optionalCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { consumeOptionalModel, OptionalCard } from 'dynamic_component';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text(consumeOptionalModel(null))
      OptionalCard()
    }
  }
}
`;

const unionCard = `@Component
export struct UnionCard {
  build() {
    Text('non-optional union callee')
      .id('nonOptionalUnionValue')
  }
}
`;

const unionIndex = `export { UnionCard } from './src/main/ets/UnionCard';
export {
  AlternateProfile,
  AmbiguousProfile,
  ContactModel,
  GeoPoint,
  PreferenceModel,
  ProfileModel,
  selectProfile
} from './src/main/ets/CompoundModels';
`;

const unionCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { UnionCard, selectProfile } from 'dynamic_component';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text(selectProfile({
        id: 'non-optional-ambiguous-union',
        contact: {
          label: 'two-model-alternatives',
          point: {
            latitude: 1.0,
            longitude: 2.0
          },
          aliases: []
        }
      }))
      UnionCard()
    }
  }
}
`;

const constructorCard = `@Component
export struct ConstructorCard {
  build() {
    Text('non-optional constructor callee')
      .id('requiredConstructorValue')
  }
}
`;

const constructorIndex = `export { ConstructorCard } from './src/main/ets/ConstructorCard';
export {
  ContactModel,
  GeoPoint,
  requireConstructedModel,
  RequiredCtorModel
} from './src/main/ets/CompoundModels';
`;

const constructorCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { ConstructorCard, requireConstructedModel } from 'dynamic_component';

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text(requireConstructedModel({
        id: 'non-optional-missing-zero-constructor'
      }))
      ConstructorCard()
    }
  }
}
`;

const entryAbility = baseEntryAbility.replaceAll('InteropUiPr01', 'InteropUiPr07');

const moduleIdentity = {
  packageName: 'dynamic_component',
  callerPackage: 'entry',
  bundleName: 'com.example.interopuipr07',
  componentName: 'CompoundCard',
  componentModule: 'dynamic_component/src/main/ets/CompoundCard',
  componentOhmUrl: '@normalized:N&&&dynamic_component/src/main/ets/CompoundCard&1.0.0',
  modelModule: 'dynamic_component/src/main/ets/CompoundModels',
  modelOhmUrl: '@normalized:N&&&dynamic_component/src/main/ets/CompoundModels&1.0.0',
  indexModule: 'dynamic_component/Index',
  indexOhmUrl: '@normalized:N&&&dynamic_component/Index&1.0.0'
};

const scenarios = {
  compound: {
    id: 'compound-models-arrays-nested-union',
    title: 'direct UI object, nonempty array and nested literals plus a factory control feed the static consumer',
    componentName: 'CompoundCard',
    componentFile: 'CompoundCard.ets',
    componentSource: compoundCard,
    indexSource: compoundIndex,
    callerSource: staticCaller,
    expectedDiagnostic: undefined,
    verifySuccessfulConsumer: true
  },
  optionalModel: {
    id: 'nullable-model-null-diagnostic',
    title: 'null is rejected by a nullable dynamic model parameter with an exact caller location',
    componentName: 'OptionalCard',
    componentFile: 'OptionalCard.ets',
    componentSource: optionalCard,
    indexSource: optionalIndex,
    callerSource: optionalCaller,
    expectedDiagnostic: {
      stage: 'repository-static-compile',
      code: 'ESE0046',
      relatedCodes: ['ESE0127'],
      fragments: [
        `Type 'null' is not compatible with type 'OptionalModel|undefined'`
      ],
      fileFragment: 'entry/src/main/ets/pages/Index.ets'
    },
    verifySuccessfulConsumer: false
  },
  ambiguousUnion: {
    id: 'non-optional-union-object-literal-diagnostic',
    title: 'a non-optional two-model union rejects an unasserted object literal',
    componentName: 'UnionCard',
    componentFile: 'UnionCard.ets',
    componentSource: unionCard,
    indexSource: unionIndex,
    callerSource: unionCaller,
    expectedDiagnostic: {
      stage: 'repository-static-compile',
      code: 'ESE0061',
      fragments: [
        `Ambiguous reference to 'ProfileModel|AlternateProfile'`
      ],
      fileFragment: 'entry/src/main/ets/pages/Index.ets'
    },
    verifySuccessfulConsumer: false
  },
  requiredConstructor: {
    id: 'non-optional-constructor-object-literal-diagnostic',
    title: 'a non-optional model without a zero-argument constructor rejects an object literal',
    componentName: 'ConstructorCard',
    componentFile: 'ConstructorCard.ets',
    componentSource: constructorCard,
    indexSource: constructorIndex,
    callerSource: constructorCaller,
    expectedDiagnostic: {
      stage: 'repository-static-compile',
      code: 'ESE0291',
      fragments: [
        'Type RequiredCtorModel has no parameterless constructor',
        'Initialization with literals is not supported'
      ],
      fileFragment: 'entry/src/main/ets/pages/Index.ets'
    },
    verifySuccessfulConsumer: false
  }
};

const declarationProbes = [
  {
    id: 'array-spelling-preservation',
    title: 'suffix and generic array spellings survive declaration UI processing',
    source: `'use static'
import { Component } from '@ohos.arkui.component';
@Component
export declare struct ArrayProbe {
  @Prop names: string[];
  scores: Array<number>;
  matrix: Array<number[]>;
  build(): void;
}
`,
    required: [
      'names: string[];',
      'scores: Array<number>;',
      'matrix: Array<number[]>;'
    ],
    forbidden: [
      'names: Array<string>',
      'matrix: number[][];'
    ]
  },
  {
    id: 'nested-named-model-preservation',
    title: 'named nested models remain references instead of inline object literals',
    source: `'use static'
import { Component } from '@ohos.arkui.component';
export declare interface GeoProbe {
  latitude: number;
}
export declare interface ContactProbe {
  point: GeoProbe;
}
export declare interface ProfileProbe {
  contact: ContactProbe;
}
@Component
export declare struct NestedProbe {
  @Prop profile: ProfileProbe;
  build(): void;
}
`,
    required: [
      'point: GeoProbe;',
      'contact: ContactProbe;'
    ],
    forbidden: [
      'point: {',
      'contact: {'
    ]
  },
  {
    id: 'nullable-union-preservation',
    title: 'a nullable model union retains both alternatives and parentheses',
    source: `'use static'
import { Component } from '@ohos.arkui.component';
export declare class ProfileProbe {
  id: string;
}
export declare type NullableProbe = ProfileProbe | undefined;
export declare type MatrixProbe = (string | number)[][];
@Component
export declare struct UnionProbe {
  @Prop optional: NullableProbe;
  build(): void;
}
`,
    required: [
      'NullableProbe = ProfileProbe | undefined;',
      'MatrixProbe = (string | number)[][];'
    ],
    forbidden: [
      'NullableProbe = ProfileProbe;',
      'MatrixProbe = string | number[][];'
    ]
  }
];

module.exports = {
  compoundCard,
  compoundIndex,
  compoundModels,
  constructorCaller,
  declarationProbes,
  entryAbility,
  moduleIdentity,
  scenarios,
  staticCaller,
  unionCaller
};
