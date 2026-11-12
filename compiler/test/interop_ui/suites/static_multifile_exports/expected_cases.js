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

const DECLARATION_EXPECTATIONS = {
  'relative-cross-file-model': {
    imports: [
      { file: 'src/main/ets/model/Profile', module: './Address', imported: 'Address', local: 'Address' }
    ],
    exports: [
      { file: 'Index', exported: 'Profile', local: 'Profile', module: './src/main/ets/model/Profile' }
    ],
    origins: {
      Profile: { file: 'src/main/ets/model/Profile', local: 'Profile', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Profile': ['address: Address;', 'constructor(address: Address);'],
      'src/main/ets/model/Address': ['export declare class Address', 'city: string;']
    }
  },
  'parent-relative-import-alias': {
    imports: [
      { file: 'src/main/ets/model/Profile', module: '../shared/Location', imported: 'Location', local: 'Residence' }
    ],
    exports: [
      { file: 'Index', exported: 'PublicProfile', local: 'Profile', module: './src/main/ets/model/Profile' }
    ],
    origins: {
      PublicProfile: { file: 'src/main/ets/model/Profile', local: 'Profile', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Profile': ['import { Location as Residence }', 'residence: Residence;']
    }
  },
  'nested-dynamic-barrel': {
    imports: [],
    exports: [
      { file: 'src/main/ets/internal/barrel', exported: 'PublicModel', local: 'Model', module: '../model/Model' },
      { file: 'Index', exported: 'PublicModel', local: 'PublicModel', module: './src/main/ets/internal/barrel' }
    ],
    origins: {
      PublicModel: { file: 'src/main/ets/model/Model', local: 'Model', kind: 'class' }
    },
    fragments: {
      Index: [`export { PublicModel } from './src/main/ets/internal/barrel';`]
    }
  },
  'renamed-component-barrel': {
    imports: [],
    exports: [
      { file: 'src/main/ets/internal/barrel', exported: 'BarrelCard', local: 'InternalCard', module: '../components/InternalCard' },
      { file: 'Index', exported: 'PublicCard', local: 'BarrelCard', module: './src/main/ets/internal/barrel' }
    ],
    origins: {
      PublicCard: { file: 'src/main/ets/components/InternalCard', local: 'InternalCard', kind: 'struct' }
    },
    fragments: {
      'src/main/ets/components/InternalCard': ['export declare struct InternalCard', 'title: string;', 'build(): void;']
    }
  },
  'same-name-component-origins': {
    imports: [],
    exports: [
      { file: 'Index', exported: 'AlphaCard', local: 'SharedCard', module: './src/main/ets/alpha/SharedCard' },
      { file: 'Index', exported: 'BetaCard', local: 'SharedCard', module: './src/main/ets/beta/SharedCard' }
    ],
    origins: {
      AlphaCard: { file: 'src/main/ets/alpha/SharedCard', local: 'SharedCard', kind: 'struct' },
      BetaCard: { file: 'src/main/ets/beta/SharedCard', local: 'SharedCard', kind: 'struct' }
    },
    fragments: {
      'src/main/ets/alpha/SharedCard': ['export declare struct SharedCard'],
      'src/main/ets/beta/SharedCard': ['export declare struct SharedCard']
    }
  },
  'same-basename-model-origins': {
    imports: [],
    exports: [
      { file: 'Index', exported: 'AlphaToken', local: 'Token', module: './src/main/ets/alpha/Token' },
      { file: 'Index', exported: 'BetaToken', local: 'Token', module: './src/main/ets/beta/Token' }
    ],
    origins: {
      AlphaToken: { file: 'src/main/ets/alpha/Token', local: 'Token', kind: 'class' },
      BetaToken: { file: 'src/main/ets/beta/Token', local: 'Token', kind: 'class' }
    },
    fragments: {
      'src/main/ets/alpha/Token': [`origin: string;`],
      'src/main/ets/beta/Token': [`origin: string;`]
    }
  },
  'local-export-alias': {
    imports: [],
    exports: [
      { file: 'src/main/ets/model/Model', exported: 'PublicModel', local: 'InternalModel' },
      { file: 'Index', exported: 'PublicModel', local: 'PublicModel', module: './src/main/ets/model/Model' }
    ],
    origins: {
      PublicModel: { file: 'src/main/ets/model/Model', local: 'InternalModel', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Model': ['declare class InternalModel', 'export { InternalModel as PublicModel };']
    }
  },
  'default-export-through-barrel': {
    imports: [],
    exports: [
      { file: 'Index', exported: 'PublicModel', local: 'default', module: './src/main/ets/model/Model' }
    ],
    origins: {
      PublicModel: { file: 'src/main/ets/model/Model', local: 'InternalModel', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Model': ['export default declare class InternalModel']
    }
  },
  'export-star-internal-barrel': {
    imports: [],
    exports: [],
    origins: {
      FirstModel: { file: 'src/main/ets/model/First', local: 'FirstModel', kind: 'class' },
      SecondModel: { file: 'src/main/ets/model/Second', local: 'SecondModel', kind: 'class' }
    },
    exportedNames: ['FirstModel', 'SecondModel'],
    fragments: {
      Index: [`export * from './src/main/ets/internal/barrel';`]
    }
  },
  'model-directory-index': {
    imports: [
      { file: 'src/main/ets/model/Profile', module: './index', imported: 'Address', local: 'Address' }
    ],
    exports: [
      { file: 'Index', exported: 'Profile', local: 'Profile', module: './src/main/ets/model/Profile' },
      { file: 'src/main/ets/model/index', exported: 'Address', local: 'Address', module: './Address' }
    ],
    origins: {
      Profile: { file: 'src/main/ets/model/Profile', local: 'Profile', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Profile': [`from './index';`],
      'src/main/ets/model/index': [`export { Address } from './Address';`]
    }
  },
  'chained-export-aliases': {
    imports: [],
    exports: [
      { file: 'src/main/ets/internal/privateBarrel', exported: 'SecondModel', local: 'FirstModel', module: '../model/Model' },
      { file: 'src/main/ets/internal/publicBarrel', exported: 'ThirdModel', local: 'SecondModel', module: './privateBarrel' },
      { file: 'Index', exported: 'PublicModel', local: 'ThirdModel', module: './src/main/ets/internal/publicBarrel' }
    ],
    origins: {
      PublicModel: { file: 'src/main/ets/model/Model', local: 'FirstModel', kind: 'class' }
    },
    fragments: {
      'src/main/ets/internal/publicBarrel': [`export { SecondModel as ThirdModel } from './privateBarrel';`]
    }
  },
  'value-and-type-barrel': {
    imports: [
      { file: 'src/main/ets/model/Profile', module: './ProfileView', imported: 'ProfileView', local: 'ProfileView' }
    ],
    exports: [
      { file: 'Index', exported: 'Profile', local: 'Profile', module: './src/main/ets/internal/barrel' },
      { file: 'Index', exported: 'ProfileView', local: 'ProfileView', module: './src/main/ets/internal/barrel' },
      { file: 'Index', exported: 'makeProfile', local: 'makeProfile', module: './src/main/ets/internal/barrel' }
    ],
    origins: {
      Profile: { file: 'src/main/ets/model/Profile', local: 'Profile', kind: 'class' },
      ProfileView: { file: 'src/main/ets/model/ProfileView', local: 'ProfileView', kind: 'interface' },
      makeProfile: { file: 'src/main/ets/model/Profile', local: 'makeProfile', kind: 'function' }
    },
    fragments: {
      'src/main/ets/model/Profile': ['export declare class Profile implements ProfileView', 'export declare function makeProfile(): Profile;']
    }
  },
  'explicit-ets-relative-import': {
    imports: [
      { file: 'src/main/ets/model/Profile', module: './Address.ets', imported: 'Address', local: 'Address' }
    ],
    exports: [
      { file: 'Index', exported: 'Profile', local: 'Profile', module: './src/main/ets/model/Profile.ets' }
    ],
    origins: {
      Profile: { file: 'src/main/ets/model/Profile', local: 'Profile', kind: 'class' }
    },
    fragments: {
      'src/main/ets/model/Profile': [`import { Address } from './Address.ets';`],
      Index: [`export { Profile } from './src/main/ets/model/Profile.ets';`]
    }
  },
  'type-only-interface-barrel': {
    imports: [],
    exports: [
      { file: 'src/main/ets/internal/barrel', exported: 'PublicProfileView', local: 'ProfileView', module: '../model/ProfileView' },
      { file: 'Index', exported: 'PublicProfileView', local: 'PublicProfileView', module: './src/main/ets/internal/barrel' }
    ],
    origins: {
      PublicProfileView: { file: 'src/main/ets/model/ProfileView', local: 'ProfileView', kind: 'interface' }
    },
    fragments: {
      'src/main/ets/model/ProfileView': ['export declare interface ProfileView', 'readonly count: number;'],
      Index: [`export type { PublicProfileView } from './src/main/ets/internal/barrel';`]
    }
  },
  'same-name-factory-origins': {
    imports: [
      { file: 'src/main/ets/alpha/Factory', module: './Token', imported: 'Token', local: 'Token' },
      { file: 'src/main/ets/beta/Factory', module: './Token', imported: 'Token', local: 'Token' }
    ],
    exports: [
      { file: 'Index', exported: 'makeAlphaToken', local: 'makeToken', module: './src/main/ets/alpha/Factory' },
      { file: 'Index', exported: 'makeBetaToken', local: 'makeToken', module: './src/main/ets/beta/Factory' }
    ],
    origins: {
      makeAlphaToken: { file: 'src/main/ets/alpha/Factory', local: 'makeToken', kind: 'function' },
      makeBetaToken: { file: 'src/main/ets/beta/Factory', local: 'makeToken', kind: 'function' }
    },
    fragments: {
      'src/main/ets/alpha/Factory': ['export declare function makeToken(value: string): Token;'],
      'src/main/ets/beta/Factory': ['export declare function makeToken(value: string): Token;']
    }
  },
  'barrel-local-name-shadow': {
    imports: [],
    exports: [
      { file: 'src/main/ets/internal/barrel', exported: 'PublicModel', local: 'Model', module: '../model/Model' },
      { file: 'Index', exported: 'PublicModel', local: 'PublicModel', module: './src/main/ets/internal/barrel' }
    ],
    origins: {
      PublicModel: { file: 'src/main/ets/model/Model', local: 'Model', kind: 'class' }
    },
    fragments: {
      'src/main/ets/internal/barrel': [`export { Model as PublicModel } from '../model/Model';`],
      'src/main/ets/model/Model': ['external: boolean;']
    }
  }
};

const FULL_PROJECT_ORIGINS = {
  ProfileCard: { file: 'src/main/ets/components/ProfileCard', local: 'ProfileCard', kind: 'struct' },
  AliasedProfileCard: { file: 'src/main/ets/components/ProfileCard', local: 'ProfileCard', kind: 'struct' },
  AlphaSharedCard: { file: 'src/main/ets/modules/alpha/SharedCard', local: 'SharedCard', kind: 'struct' },
  BetaSharedCard: { file: 'src/main/ets/modules/beta/SharedCard', local: 'SharedCard', kind: 'struct' },
  UserProfile: { file: 'src/main/ets/model/UserProfile', local: 'UserProfile', kind: 'class' },
  Address: { file: 'src/main/ets/model/Address', local: 'Address', kind: 'class' },
  makeProfile: { file: 'src/main/ets/model/UserProfile', local: 'makeUserProfile', kind: 'function' },
  formatProfile: { file: 'src/main/ets/model/UserProfile', local: 'formatUserProfile', kind: 'function' },
  AlphaToken: { file: 'src/main/ets/modules/alpha/Token', local: 'Token', kind: 'class' },
  BetaToken: { file: 'src/main/ets/modules/beta/Token', local: 'Token', kind: 'class' }
};

const FULL_DECLARATION_FRAGMENTS = {
  'src/main/ets/model/UserProfile': [
    `import { Address } from './Address';`,
    'export declare class UserProfile',
    'address: Address;',
    'export declare function makeUserProfile(displayName: string, visitCount: number): UserProfile;',
    'export declare function formatUserProfile(profile: UserProfile): string;'
  ],
  'src/main/ets/components/ProfileCard': [
    `import { UserProfile } from '../model/UserProfile';`,
    'export declare struct ProfileCard',
    'profile: UserProfile;',
    'caption: string;'
  ],
  'src/main/ets/internal/componentBarrel': [
    `export { ProfileCard } from '../components/ProfileCard';`,
    `export { ProfileCard as AliasedProfileCard } from '../components/ProfileCard';`
  ],
  'src/main/ets/internal/sharedBarrel': [
    `export { SharedCard as AlphaSharedCard } from '../modules/alpha/SharedCard';`,
    `export { SharedCard as BetaSharedCard } from '../modules/beta/SharedCard';`
  ]
};

const ARTIFACTS = {
  declgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/declgenV2',
  declarationMap: 'dynamic_component/build/default/intermediates/declgen/default/decl-fileInfo.json',
  repositoryDeclgenRoot: 'dynamic_component/build/default/intermediates/declgen/default/repositoryDeclgenV2',
  repositoryDeclarationMap: 'dynamic_component/build/default/intermediates/declgen/default/repository-decl-fileInfo.json',
  callerDeclarationMap: 'entry/build/default/intermediates/declgen/default/cache/entry/decl_file_map.json',
  callerConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/entry/arktsconfig.json',
  projectionConfig: 'entry/build/default/cache/default/default@CompileStaticArkTS/debug/projectionConfig.json',
  bridgeSource: 'entry/build/default/intermediates/declgen/default/declgenBridgeCode/entry/src/main/ets/pages/Index.ts',
  dynamicAbc: 'entry/build/default/intermediates/loader_out/default/ets/modules.abc',
  repositoryProjection: 'repository-consume/projection.json',
  repositoryCache: 'repository-consume/cache',
  repositoryLoaderOut: 'repository-consume/ets',
  repositoryDynamicLoaderOut: 'repository-consume/dynamic-ets',
  repositoryStaticAbc: 'repository-consume/ets/modules_static.abc',
  buildLog: 'evidence/hvigor.log',
  repositoryBuildLog: 'evidence/repository-static.log',
  staticDisassembly: 'evidence/multifile-static.pa',
  dynamicDisassembly: 'evidence/multifile-dynamic.pa',
  consumptionEvidence: 'evidence/multifile-consumption.json'
};

const KNOWN_DECLARATION_DIAGNOSTICS = {
  stage: 'GenerateDeclaration',
  category: 'existing',
  sequence: [
    { code: 'F0014', text: `Unresolved module name for path: ''` },
    { code: 'ESE0360', text: 'Cannot find import: *ERROR_LITERAL*' },
    { code: 'F0016', text: `Can't find prefix for 'dynamic_component'` }
  ],
  cascade: [
    { code: 'ESE0371', text: `Cannot find type 'StaticUserProfile'` }, { code: 'ESE0143', text: 'Unresolved reference makeProfile' },
    { code: 'ESE0371', text: `Cannot find type 'AlphaToken'` }, { code: 'ESE0371', text: `Cannot find type 'AlphaToken'` },
    { code: 'ESE0371', text: `Cannot find type 'BetaToken'` }, { code: 'ESE0371', text: `Cannot find type 'BetaToken'` }
  ],
  classification: 'Only the ordered F0014/ESE0360/F0016 prefix and the explicitly listed ' +
    'multifile unresolved-symbol cascade are existing SDK 26.0.0.35 diagnostics.'
};

const ABC_CALLER_BINDINGS = [
  { component: 'AlphaSharedCard', page: 'dynamic_component.src.main.ets.modules.alpha.SharedCard', labelFunction: 'alphaLabel', token: 'AlphaToken', argument: 'A' },
  { component: 'BetaSharedCard', page: 'dynamic_component.src.main.ets.modules.beta.SharedCard', labelFunction: 'betaLabel', token: 'BetaToken', argument: 'B' }
];

const FULL_PROJECT_BARRELS = {
  ProfileCard: 'src/main/ets/internal/componentBarrel', AliasedProfileCard: 'src/main/ets/internal/componentBarrel',
  AlphaSharedCard: 'src/main/ets/internal/sharedBarrel', BetaSharedCard: 'src/main/ets/internal/sharedBarrel',
  UserProfile: 'src/main/ets/internal/modelBarrel', Address: 'src/main/ets/internal/modelBarrel',
  makeProfile: 'src/main/ets/internal/modelBarrel', formatProfile: 'src/main/ets/internal/modelBarrel',
  AlphaToken: 'src/main/ets/internal/tokenBarrel', BetaToken: 'src/main/ets/internal/tokenBarrel'
};

const STATIC_IDENTITY_FRAGMENTS = [
  'entry.src.main.ets.pages.Index', '@normalized:N&&&dynamic_component/Index&1.0.0',
  '@normalized:N&&&dynamic_component/src/main/ets/components/ProfileCard&1.0.0', '@normalized:N&&&dynamic_component/src/main/ets/model/UserProfile&1.0.0',
  '@normalized:N&&&dynamic_component/src/main/ets/modules/alpha/SharedCard&1.0.0', '@normalized:N&&&dynamic_component/src/main/ets/modules/beta/SharedCard&1.0.0',
  '@normalized:N&&&dynamic_component/src/main/ets/modules/alpha/Token&1.0.0', '@normalized:N&&&dynamic_component/src/main/ets/modules/beta/Token&1.0.0',
  'AliasedProfileCard', 'makeProfile', 'CompatibleComponentInfo'
];

const DYNAMIC_IDENTITY_FRAGMENTS = [
  '&dynamic_component.src.main.ets.components.ProfileCard&1.0.0',
  '&dynamic_component.src.main.ets.modules.alpha.SharedCard&1.0.0',
  '&dynamic_component.src.main.ets.modules.beta.SharedCard&1.0.0',
  'initialRender'
];

module.exports = {
  ABC_CALLER_BINDINGS,
  ARTIFACTS,
  DECLARATION_EXPECTATIONS,
  DYNAMIC_IDENTITY_FRAGMENTS,
  FULL_DECLARATION_FRAGMENTS,
  FULL_PROJECT_BARRELS,
  FULL_PROJECT_ORIGINS,
  KNOWN_DECLARATION_DIAGNOSTICS,
  STATIC_IDENTITY_FRAGMENTS
};
