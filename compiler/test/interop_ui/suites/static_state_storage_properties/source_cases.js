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

const unitCases = [
  {
    id: 'state-primitive-update',
    branch: 'state-defaults-and-local-mutation',
    purpose: 'Primitive State defaults remain typed while all three local update forms remain in the component body.',
    source: `
@Component
export struct PrimitiveStateCard {
  @State count: number = 1;
  @State label: string = 'ready';
  @State enabled: boolean = true;

  advance(): void {
    this.count += 1;
    this.label = 'running';
    this.enabled = !this.enabled;
  }

  build(): void {
  }
}
`,
    updates: {
      advance: [
        'this.count += 1',
        "this.label = 'running'",
        'this.enabled = !this.enabled'
      ]
    },
  },
  {
    id: 'state-model-collection-update',
    branch: 'state-object-and-array-mutation',
    purpose: 'A class instance and an Array generic survive declaration adaptation without confusing object and collection updates.',
    source: `
export class CounterModel {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

@Component
export struct ModelStateCard {
  @State model: CounterModel = new CounterModel(2);
  @State history: Array<number> = [0];

  record(): void {
    this.model.value += 1;
    this.history.push(this.model.value);
  }

  build(): void {
  }
}
`,
    updates: {
      record: [
        'this.model.value += 1',
        'this.history.push(this.model.value)'
      ]
    },
  },
  {
    id: 'mixed-v1-state-storage',
    branch: 'all-requested-v1-decorators-one-component',
    purpose: 'State, Link, Prop and all requested storage decorators coexist as V1 without importing or emitting V2 annotations.',
    source: `
@Component
export struct MixedV1Card {
  @State localCount: number = 1;
  @Link sharedCount: number;
  @Prop title: string = 'mixed';
  @StorageProp('pr09.mixed.score') storedScore: number = 5;
  @LocalStorageProp('pr09.mixed.draft') draft: string = 'draft';
  @StorageLink('pr09.mixed.muted') muted: boolean = false;

  updateMixed(): void {
    this.localCount += 1;
    this.sharedCount += 1;
    this.title = 'local-mixed';
    this.storedScore += 1;
    this.draft = 'local-draft';
    this.muted = !this.muted;
  }

  summary(): string {
    return this.title + ':' + this.storedScore + ':' + this.draft;
  }

  build(): void {
  }
}
`,
    updates: {
      updateMixed: [
        'this.localCount += 1',
        'this.sharedCount += 1',
        "this.title = 'local-mixed'",
        'this.storedScore += 1',
        "this.draft = 'local-draft'",
        'this.muted = !this.muted'
      ]
    },
    reads: {
      summary: ['title', 'storedScore', 'draft']
    },

  },
  {
    id: 'storage-key-namespaces',
    branch: 'storage-key-punctuation-fidelity',
    purpose: 'Colon, slash, dash and dot characters in storage keys survive every storage decorator conversion verbatim.',
    source: `
@Component
export struct NamespacedStorageCard {
  @StorageProp('pr09:session/user-name') userName: string = 'anonymous';
  @LocalStorageProp('pr09:draft/revision-count') revisionCount: number = 0;
  @StorageLink('pr09:session/editor-enabled') editorEnabled: boolean = true;

  toggleEditor(): void {
    this.userName = 'local-user';
    this.revisionCount += 1;
    this.editorEnabled = !this.editorEnabled;
  }

  build(): void {
  }
}
`,
    updates: {
      toggleEditor: [
        "this.userName = 'local-user'",
        'this.revisionCount += 1',
        'this.editorEnabled = !this.editorEnabled'
      ]
    },
    oneWay: ['userName', 'revisionCount']
  },
  {
    id: 'link-enum-transition',
    branch: 'link-enum-parent-parameter',
    purpose: 'An enum-typed Link remains uninitialized locally and supports a parent-driven two-way enum transition.',
    source: `
enum SelectionMode {
  Single = 0,
  Multiple = 1
}

@Component
export struct EnumLinkCard {
  @Link selectionMode: SelectionMode;

  enableMultiple(): void {
    this.selectionMode = SelectionMode.Multiple;
  }

  build(): void {
  }
}
`,
    updates: {
      enableMultiple: ['this.selectionMode = SelectionMode.Multiple']
    },
  },
  {
    id: 'prop-model-one-way',
    branch: 'prop-ref-class-and-one-way-local-update',
    purpose: 'A class-typed Prop becomes PropRef and permits local replacement without writing the new value back to its parent.',
    source: `
export class PropModel {
  title: string = 'model';
}

@Component
export struct ModelPropCard {
  @Prop model: PropModel = new PropModel();
  @Prop aliases: Array<string> = ['primary'];

  updateLocally(): void {
    this.model = new PropModel();
    this.aliases = ['local'];
  }

  displayName(): string {
    return this.model.title + ':' + this.aliases[0];
  }

  build(): void {
  }
}
`,
    updates: {
      updateLocally: [
        'this.model = new PropModel()',
        "this.aliases = ['local']"
      ]
    },
    reads: {
      displayName: ['model', 'aliases']
    },
    oneWay: ['model', 'aliases']
  },
  {
    id: 'storage-model-types',
    branch: 'storage-class-and-array-types',
    purpose: 'Storage decorators preserve application model and Array types rather than degrading them to a generic storage value.',
    source: `
export class StoredProfile {
  displayName: string = 'profile';
}

@Component
export struct ModelStorageCard {
  @StorageProp('pr09.model.profile') profile: StoredProfile = new StoredProfile();
  @LocalStorageProp('pr09.model.history') history: Array<string> = ['created'];
  @StorageLink('pr09.model.selected') selectedIndex: number = 0;

  select(nextIndex: number): void {
    this.profile = new StoredProfile();
    this.history = ['local'];
    this.selectedIndex = nextIndex;
  }

  build(): void {
  }
}
`,
    updates: {
      select: [
        'this.profile = new StoredProfile()',
        "this.history = ['local']",
        'this.selectedIndex = nextIndex'
      ]
    },
    oneWay: ['profile', 'history']
  }
];

const declgenCases = [
  {
    id: 'declgen-state-link-prop',
    sourceName: 'state_link_prop.ets',
    componentName: 'GeneratedStateLinkProp',
    purpose: 'Real declaration generation keeps State and Link, converts Prop and strips implementation initializers for a consumer.',
    source: `
@Component
export struct GeneratedStateLinkProp {
  @State localCount: number = 1;
  @Link sharedCount: number;
  @Prop title: string = 'generated';

  update(): void {
    this.localCount += 1;
    this.sharedCount += 1;
    this.title = 'local-generated';
  }

  build(): void {
  }
}
`,
    consumerProperty: 'title',
    consumerType: 'string',
    updates: {
      update: [
        'this.localCount += 1',
        'this.sharedCount += 1',
        "this.title = 'local-generated'"
      ]
    },
    oneWay: ['title']
  },
  {
    id: 'declgen-storage-refs',
    sourceName: 'storage_refs.ets',
    componentName: 'GeneratedStorageRefs',
    purpose: 'Real declgen maps both Prop storage forms to refs, retains StorageLink and preserves every literal key.',
    source: `
@Component
export struct GeneratedStorageRefs {
  @StorageProp('pr09.generated.count') storedCount: number = 2;
  @LocalStorageProp('pr09.generated.draft') draft: string = 'draft';
  @StorageLink('pr09.generated.enabled') enabled: boolean = false;

  toggle(): void {
    this.storedCount += 1;
    this.draft = 'local-draft';
    this.enabled = !this.enabled;
  }

  build(): void {
  }
}
`,
    consumerProperty: 'storedCount',
    consumerType: 'number',
    updates: {
      toggle: [
        'this.storedCount += 1',
        "this.draft = 'local-draft'",
        'this.enabled = !this.enabled'
      ]
    },
    oneWay: ['storedCount', 'draft']
  },
  {
    id: 'declgen-mixed-v1',
    sourceName: 'mixed_v1.ets',
    componentName: 'GeneratedMixedV1',
    purpose: 'The declaration stage handles all requested V1 property forms together and adds only their static SDK imports.',
    source: `
@Component
export struct GeneratedMixedV1 {
  @State localCount: number = 0;
  @Link sharedCount: number;
  @Prop title: string = 'mixed';
  @StorageProp('pr09.generated.score') score: number = 10;
  @LocalStorageProp('pr09.generated.note') note: string = 'note';
  @StorageLink('pr09.generated.selected') selected: boolean = true;

  update(): void {
    this.localCount += 1;
    this.sharedCount += 1;
    this.title = 'local-mixed';
    this.score += 1;
    this.note = 'local-note';
    this.selected = !this.selected;
  }

  build(): void {
  }
}
`,
    consumerProperty: 'sharedCount',
    consumerType: 'number',
    updates: {
      update: [
        'this.localCount += 1',
        'this.sharedCount += 1',
        "this.title = 'local-mixed'",
        'this.score += 1',
        "this.note = 'local-note'",
        'this.selected = !this.selected'
      ]
    },
    oneWay: ['title', 'score', 'note']
  },
  {
    id: 'declgen-key-type-fidelity',
    sourceName: 'key_type_fidelity.ets',
    componentName: 'GeneratedKeyTypeFidelity',
    purpose: 'Namespaced keys and optional, Array and class types survive real declaration output and consumer resolution.',
    source: `
export class GeneratedProfile {
  name: string = 'generated';
}

@Component
export struct GeneratedKeyTypeFidelity {
  @Prop subtitle?: string = 'subtitle';
  @StorageProp('pr09:generated/profile') profile: GeneratedProfile = new GeneratedProfile();
  @LocalStorageProp('pr09:generated/history') history: Array<string> = ['one'];
  @StorageLink('pr09:generated/index') selectedIndex: number = 0;

  updateLocally(): void {
    this.subtitle = 'local-subtitle';
    this.profile = new GeneratedProfile();
    this.history = ['local'];
    this.selectedIndex = 1;
  }

  build(): void {
  }
}
`,
    consumerProperty: 'subtitle',
    consumerType: 'string',
    updates: {
      updateLocally: [
        "this.subtitle = 'local-subtitle'",
        'this.profile = new GeneratedProfile()',
        "this.history = ['local']",
        'this.selectedIndex = 1'
      ]
    },
    oneWay: ['subtitle', 'profile', 'history']
  }
];

const dynamicStateStorage = `@Component
export struct DynamicStateStorage {
  @State localCount: number = 1;
  @Link sharedCount: number;
  @Prop title: string = 'dynamic-default';
  @StorageProp('pr09.runtime.score') storedScore: number = 6;
  @LocalStorageProp('pr09.runtime.draft') draft: string = 'draft';
  @StorageLink('pr09.runtime.muted') muted: boolean = false;

  updateValues(): void {
    this.localCount += 1;
    this.sharedCount += 1;
    this.title = 'local-title';
    this.storedScore += 1;
    this.draft = 'local-draft';
    this.muted = !this.muted;
  }

  build() {
    Column() {
      Text(this.title)
        .id('pr09Title')
      Text('local=' + this.localCount + ', shared=' + this.sharedCount)
        .id('pr09Counts')
      Text('score=' + this.storedScore + ', draft=' + this.draft + ', muted=' + this.muted)
        .id('pr09Storage')
      Button('update V1 state')
        .id('pr09Update')
        .onClick(() => {
          this.updateValues();
        })
    }
    .width('100%')
    .padding(16)
  }
}
`;

const dynamicIndex = `export { DynamicStateStorage } from './src/main/ets/DynamicStateStorage';
`;

const staticPreparationCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';

@Entry
@Component
struct Index {
  @State sharedCount: number = 8;

  build() {
    Column(undefined) {
      Text('Prepare the ArkTS 1.2 projection before dynamic consumption')
        .id('pr09StaticPreparation')
    }
    .width('100%')
    .height('100%')
    .padding(20)
  }
}
`;

const staticCaller = `'use static'
import { Entry, Component, Column, Text } from '@ohos.arkui.component';
import { State } from '@ohos.arkui.stateManagement';
import { DynamicStateStorage } from 'dynamic_state_storage/src/main/ets/DynamicStateStorage';

@Entry
@Component
struct Index {
  @State sharedCount: number = 8;

  build() {
    Column(undefined) {
      Text('ArkTS 1.2 consumes V1 state and storage declarations')
        .id('pr09StaticCaller')
      DynamicStateStorage({
        localCount: 12,
        sharedCount: this.sharedCount,
        title: 'title-from-static-caller'
      })
    }
    .width('100%')
    .height('100%')
    .padding(20)
  }
}
`;

const entryAbility = `'use static'
import UIAbility from '@ohos.app.ability.UIAbility';
import window from '@ohos.window';

export default class EntryAbility extends UIAbility {
  onWindowStageCreate(stage: window.WindowStage): void {
    stage.loadContent('pages/Index');
  }
}
`;

const storageParameterCases = [
  {
    id: 'storage-prop-parent-parameter-rejected',
    property: 'storedScore',
    decorator: 'StoragePropRef',
    assignment: 'storedScore: 99'
  },
  {
    id: 'local-storage-prop-parent-parameter-rejected',
    property: 'draft',
    decorator: 'LocalStoragePropRef',
    assignment: "draft: 'parent-draft'"
  },
  {
    id: 'storage-link-parent-parameter-rejected',
    property: 'muted',
    decorator: 'StorageLink',
    assignment: 'muted: true'
  }
];

const integratedCase = {
  id: 'real-declgen-static-consumes-v1-state-storage',
  sourceName: 'DynamicStateStorage.ets',
  componentName: 'DynamicStateStorage',
  purpose: 'Generate current repository declarations, compile the real ArkTS 1.2 caller and inspect Link and Prop parameter bridges.',
  source: dynamicStateStorage,
  updates: {
    updateValues: [
      'this.localCount += 1',
      'this.sharedCount += 1',
      "this.title = 'local-title'",
      'this.storedScore += 1',
      "this.draft = 'local-draft'",
      'this.muted = !this.muted'
    ]
  },
  oneWay: ['title', 'storedScore', 'draft']
};

const moduleIdentity = {
  packageName: 'dynamic_state_storage',
  packageVersion: '1.0.0',
  componentName: 'DynamicStateStorage',
  componentModule: 'dynamic_state_storage/src/main/ets/DynamicStateStorage',
  componentOhmUrl: '@normalized:N&&&dynamic_state_storage/src/main/ets/DynamicStateStorage&1.0.0',
  indexModule: 'dynamic_state_storage/Index',
  indexOhmUrl: '@normalized:N&&&dynamic_state_storage/Index&1.0.0',
  callerModule: 'entry',
  callerRecord: 'entry.src.main.ets.pages.Index',
  bundleName: 'com.example.interopuipr09'
};

module.exports = {
  declgenCases,
  dynamicIndex,
  dynamicStateStorage,
  entryAbility,
  integratedCase,
  moduleIdentity,
  staticCaller,
  staticPreparationCaller,
  storageParameterCases,
  unitCases
};
