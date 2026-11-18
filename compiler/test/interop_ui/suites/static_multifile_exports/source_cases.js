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

const DIRECTION = '12-to-11';
const PACKAGE_NAME = 'dynamic_component';

const DYNAMIC_PROJECT_FILES = {
  'Index.ets': `export { ProfileCard, AliasedProfileCard } from './src/main/ets/internal/componentBarrel';
export { AlphaSharedCard, BetaSharedCard } from './src/main/ets/internal/sharedBarrel';
export { UserProfile, Address, makeProfile, formatProfile } from './src/main/ets/internal/modelBarrel';
export { AlphaToken, BetaToken } from './src/main/ets/internal/tokenBarrel';
`,
  'src/main/ets/internal/componentBarrel.ets': `export { ProfileCard } from '../components/ProfileCard';
export { ProfileCard as AliasedProfileCard } from '../components/ProfileCard';
`,
  'src/main/ets/internal/sharedBarrel.ets': `export { SharedCard as AlphaSharedCard } from '../modules/alpha/SharedCard';
export { SharedCard as BetaSharedCard } from '../modules/beta/SharedCard';
`,
  'src/main/ets/internal/modelBarrel.ets': `export { UserProfile } from '../model/UserProfile';
export { makeUserProfile as makeProfile } from '../model/UserProfile';
export { formatUserProfile as formatProfile } from '../model/UserProfile';
export { Address } from '../model/Address';
`,
  'src/main/ets/internal/tokenBarrel.ets': `export { Token as AlphaToken } from '../modules/alpha/Token';
export { Token as BetaToken } from '../modules/beta/Token';
`,
  'src/main/ets/model/Address.ets': `export class Address {
  city: string;
  street: string;

  constructor(city: string, street: string) {
    this.city = city;
    this.street = street;
  }

  label(): string {
    return this.city + '/' + this.street;
  }
}
`,
  'src/main/ets/model/UserProfile.ets': `import { Address } from './Address';

export class UserProfile {
  displayName: string;
  visitCount: number;
  address: Address;

  constructor(displayName: string, visitCount: number, address: Address) {
    this.displayName = displayName;
    this.visitCount = visitCount;
    this.address = address;
  }

  summary(): string {
    return this.displayName + '@' + this.address.label();
  }
}

export function makeUserProfile(displayName: string, visitCount: number): UserProfile {
  const address = new Address('Hangzhou', 'WestLake');
  return new UserProfile(displayName, visitCount, address);
}

export function formatUserProfile(profile: UserProfile): string {
  return profile.summary() + '#' + profile.visitCount.toString();
}
`,
  'src/main/ets/components/ProfileCard.ets': `import { UserProfile, formatUserProfile } from '../model/UserProfile';

@Component
export struct ProfileCard {
  @Prop profile: UserProfile;
  @Prop caption: string;

  build() {
    Column() {
      Text(this.caption)
        .fontSize(18)
        .id('dynamicProfileCaption')
      Text(formatUserProfile(this.profile))
        .fontSize(20)
        .margin({ top: 8 })
        .id('dynamicProfileSummary')
      Text(this.profile.address.city)
        .fontSize(16)
        .margin({ top: 4 })
        .id('dynamicProfileCity')
    }
    .width('100%')
    .padding(12)
  }
}
`,
  'src/main/ets/modules/alpha/SharedCard.ets': `@Component
export struct SharedCard {
  @Prop label: string;

  build() {
    Text('alpha:' + this.label)
      .fontSize(18)
      .id('alphaSharedCard')
  }
}
`,
  'src/main/ets/modules/beta/SharedCard.ets': `@Component
export struct SharedCard {
  @Prop label: string;

  build() {
    Text('beta:' + this.label)
      .fontSize(18)
      .id('betaSharedCard')
  }
}
`,
  'src/main/ets/modules/alpha/Token.ets': `export class Token {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  label(): string {
    return 'alpha-token:' + this.value;
  }
}
`,
  'src/main/ets/modules/beta/Token.ets': `export class Token {
  value: string;

  constructor(value: string) {
    this.value = value;
  }

  label(): string {
    return 'beta-token:' + this.value;
  }
}
`
};

const STATIC_CALLER = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import {
  ProfileCard as DynamicProfileCard,
  AliasedProfileCard as SecondaryDynamicCard,
  AlphaSharedCard,
  BetaSharedCard,
  UserProfile as StaticUserProfile,
  makeProfile,
  AlphaToken,
  BetaToken
} from 'dynamic_component';

function profileForCaller(): StaticUserProfile {
  return makeProfile('static-multifile', 10);
}

function alphaLabel(): string {
  const token: AlphaToken = new AlphaToken('A');
  return token.label();
}

function betaLabel(): string {
  const token: BetaToken = new BetaToken('B');
  return token.label();
}

@Component
struct ProfileCard {
  build() {
    Text('caller-local-profile-card')
      .fontSize(16)
      .id('callerLocalProfileCard')
  }
}

@Entry
@Component
struct Index {
  build() {
    Column(undefined) {
      Text('ArkTS 1.2 consumes current multifile declarations')
        .fontSize(22)
        .id('multifileCallerTitle')
      ProfileCard()
      DynamicProfileCard({ profile: profileForCaller(), caption: alphaLabel() })
      SecondaryDynamicCard({ profile: makeProfile('alias', 2), caption: betaLabel() })
      AlphaSharedCard({ label: alphaLabel() })
      BetaSharedCard({ label: betaLabel() })
    }
    .width('100%')
    .height('100%')
    .padding(16)
  }
}
`;

const ENTRY_ABILITY = `'use static'
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(stage: window.WindowStage): void {
    stage.loadContent('pages/Index');
  }
}
`;

const DECLARATION_CASES = [
  {
    id: 'relative-cross-file-model',
    coverage: 'A public model retains a same-directory import and its referenced declaration file.',
    files: {
      'Index.ets': `export { Profile } from './src/main/ets/model/Profile';
`,
      'src/main/ets/model/Address.ets': `export class Address {
  city: string = 'Hangzhou';
}
`,
      'src/main/ets/model/Profile.ets': `import { Address } from './Address';
export class Profile {
  address: Address;
  constructor(address: Address) {
    this.address = address;
  }
}
`
    }
  },
  {
    id: 'parent-relative-import-alias',
    coverage: 'Parent-relative imports distinguish the exported name from the local model alias.',
    files: {
      'Index.ets': `export { Profile as PublicProfile } from './src/main/ets/model/Profile';
`,
      'src/main/ets/shared/Location.ets': `export class Location {
  label: string = 'west-lake';
}
`,
      'src/main/ets/model/Profile.ets': `import { Location as Residence } from '../shared/Location';
export class Profile {
  residence: Residence;
  constructor(residence: Residence) {
    this.residence = residence;
  }
}
`
    }
  },
  {
    id: 'nested-dynamic-barrel',
    coverage: 'The package barrel consumes an internal dynamic re-export without a static-side restriction.',
    files: {
      'Index.ets': `export { PublicModel } from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `export { Model as PublicModel } from '../model/Model';
`,
      'src/main/ets/model/Model.ets': `export class Model {
  value: number = 10;
}
`
    }
  },
  {
    id: 'renamed-component-barrel',
    coverage: 'A dynamic UI component can be renamed by an internal barrel and again by the package entry.',
    files: {
      'Index.ets': `export { BarrelCard as PublicCard } from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `export { InternalCard as BarrelCard } from '../components/InternalCard';
`,
      'src/main/ets/components/InternalCard.ets': `@Component
export struct InternalCard {
  @Prop title: string;
  build() {
    Text(this.title)
  }
}
`
    }
  },
  {
    id: 'same-name-component-origins',
    coverage: 'Same-named structs in different directories retain separate declaration and OHM identities.',
    files: {
      'Index.ets': `export { SharedCard as AlphaCard } from './src/main/ets/alpha/SharedCard';
export { SharedCard as BetaCard } from './src/main/ets/beta/SharedCard';
`,
      'src/main/ets/alpha/SharedCard.ets': `@Component
export struct SharedCard {
  build() {
    Text('alpha')
  }
}
`,
      'src/main/ets/beta/SharedCard.ets': `@Component
export struct SharedCard {
  build() {
    Text('beta')
  }
}
`
    }
  },
  {
    id: 'same-basename-model-origins',
    coverage: 'Aliased classes from same-basename modules resolve to their own original class.',
    files: {
      'Index.ets': `export { Token as AlphaToken } from './src/main/ets/alpha/Token';
export { Token as BetaToken } from './src/main/ets/beta/Token';
`,
      'src/main/ets/alpha/Token.ets': `export class Token {
  origin: string = 'alpha';
}
`,
      'src/main/ets/beta/Token.ets': `export class Token {
  origin: string = 'beta';
}
`
    }
  },
  {
    id: 'local-export-alias',
    coverage: 'A local export alias survives declaration emit before a package barrel re-exports it.',
    files: {
      'Index.ets': `export { PublicModel } from './src/main/ets/model/Model';
`,
      'src/main/ets/model/Model.ets': `class InternalModel {
  value: string = 'local-alias';
}
export { InternalModel as PublicModel };
`
    }
  },
  {
    id: 'default-export-through-barrel',
    coverage: 'A default class export is exposed as a named dynamic package export.',
    files: {
      'Index.ets': `export { default as PublicModel } from './src/main/ets/model/Model';
`,
      'src/main/ets/model/Model.ets': `export default class InternalModel {
  value: string = 'default-alias';
}
`
    }
  },
  {
    id: 'export-star-internal-barrel',
    coverage: 'Export-star aggregation keeps independent model origins inside a dynamic module.',
    files: {
      'Index.ets': `export * from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `export * from '../model/First';
export * from '../model/Second';
`,
      'src/main/ets/model/First.ets': `export class FirstModel {
  first: number = 1;
}
`,
      'src/main/ets/model/Second.ets': `export class SecondModel {
  second: number = 2;
}
`
    }
  },
  {
    id: 'model-directory-index',
    coverage: 'A directory index resolves as a real generated declaration rather than a stale source path.',
    files: {
      'Index.ets': `export { Profile } from './src/main/ets/model/Profile';
`,
      'src/main/ets/model/index.ets': `export { Address } from './Address';
`,
      'src/main/ets/model/Address.ets': `export class Address {
  city: string = 'Hangzhou';
}
`,
      'src/main/ets/model/Profile.ets': `import { Address } from './index';
export class Profile {
  address: Address;
  constructor(address: Address) {
    this.address = address;
  }
}
`
    }
  },
  {
    id: 'chained-export-aliases',
    coverage: 'Multiple alias hops resolve to one defining file without confusing intermediate local names.',
    files: {
      'Index.ets': `export { ThirdModel as PublicModel } from './src/main/ets/internal/publicBarrel';
`,
      'src/main/ets/internal/publicBarrel.ets': `export { SecondModel as ThirdModel } from './privateBarrel';
`,
      'src/main/ets/internal/privateBarrel.ets': `export { FirstModel as SecondModel } from '../model/Model';
`,
      'src/main/ets/model/Model.ets': `export class FirstModel {
  value: number = 3;
}
`
    }
  },
  {
    id: 'value-and-type-barrel',
    coverage: 'Classes, interfaces and factory functions from separate files retain their export kinds.',
    files: {
      'Index.ets': `export { Profile, ProfileView, makeProfile } from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `export { Profile, makeProfile } from '../model/Profile';
export { ProfileView } from '../model/ProfileView';
`,
      'src/main/ets/model/ProfileView.ets': `export interface ProfileView {
  title: string;
}
`,
      'src/main/ets/model/Profile.ets': `import { ProfileView } from './ProfileView';
export class Profile implements ProfileView {
  title: string = 'profile';
}
export function makeProfile(): Profile {
  return new Profile();
}
`
    }
  },
  {
    id: 'explicit-ets-relative-import',
    coverage: 'Explicit .ets specifiers resolve to extensionless declaration identities without losing their source mapping.',
    files: {
      'Index.ets': `export { Profile } from './src/main/ets/model/Profile.ets';
`,
      'src/main/ets/model/Address.ets': `export class Address {
  city: string = 'Hangzhou';
}
`,
      'src/main/ets/model/Profile.ets': `import { Address } from './Address.ets';
export class Profile {
  address: Address;
  constructor(address: Address) {
    this.address = address;
  }
}
`
    }
  },
  {
    id: 'type-only-interface-barrel',
    coverage: 'Type-only exports retain interface origins through two dynamic re-export levels.',
    files: {
      'Index.ets': `export type { PublicProfileView } from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `export type { ProfileView as PublicProfileView } from '../model/ProfileView';
`,
      'src/main/ets/model/ProfileView.ets': `export interface ProfileView {
  title: string;
  readonly count: number;
}
`
    }
  },
  {
    id: 'same-name-factory-origins',
    coverage: 'Same-named factories and their same-named return models retain independent module origins.',
    files: {
      'Index.ets': `export { makeToken as makeAlphaToken } from './src/main/ets/alpha/Factory';
export { makeToken as makeBetaToken } from './src/main/ets/beta/Factory';
`,
      'src/main/ets/alpha/Factory.ets': `import { Token } from './Token';
export function makeToken(value: string): Token {
  return new Token(value);
}
`,
      'src/main/ets/alpha/Token.ets': `export class Token {
  constructor(public value: string) {}
}
`,
      'src/main/ets/beta/Factory.ets': `import { Token } from './Token';
export function makeToken(value: string): Token {
  return new Token(value);
}
`,
      'src/main/ets/beta/Token.ets': `export class Token {
  constructor(public value: string) {}
}
`
    }
  },
  {
    id: 'barrel-local-name-shadow',
    coverage: 'An unexported barrel-local class does not capture the re-exported external symbol of the same name.',
    files: {
      'Index.ets': `export { PublicModel } from './src/main/ets/internal/barrel';
`,
      'src/main/ets/internal/barrel.ets': `class Model {
  localOnly: boolean = true;
}
export { Model as PublicModel } from '../model/Model';
`,
      'src/main/ets/model/Model.ets': `export class Model {
  external: boolean = true;
}
`
    }
  }
];

module.exports = {
  DECLARATION_CASES,
  DIRECTION,
  DYNAMIC_PROJECT_FILES,
  ENTRY_ABILITY,
  PACKAGE_NAME,
  STATIC_CALLER
};
