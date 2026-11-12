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

const ordinaryDecoratorModule = `
export declare function Prop(target: Object, propertyKey: string): void;
`;

const sourceCases = [
  {
    id: 'bare-prop',
    branch: 'identifier-decorator',
    purpose: 'A bare Prop changes to PropRef without changing its property type or initializer.',
    source: `
@Component
export struct BarePropCard {
  @Prop count: number = 0;
}
`
  },
  {
    id: 'prop-empty-call',
    branch: 'call-decorator-without-arguments',
    purpose: 'The empty Prop call retains its call form and receives no synthetic argument.',
    source: `
@Component
export struct EmptyCallCard {
  @Prop() title: string = 'untitled';
}
`
  },
  {
    id: 'prop-call-type-argument',
    branch: 'call-decorator-type-arguments',
    purpose: 'Updating a Prop call preserves explicit decorator type arguments.',
    source: `
@Component
export struct TypedDecoratorCard {
  @Prop<number>() amount: number = 1;
}
`
  },
  {
    id: 'storage-prop-string-key',
    branch: 'storage-prop-literal-argument',
    purpose: 'StorageProp changes only its decorator name and keeps the literal storage key.',
    source: `
@Component
export struct StorageKeyCard {
  @StorageProp('active-user') userName: string = 'anonymous';
}
`
  },
  {
    id: 'storage-prop-expression-key',
    branch: 'storage-prop-compound-argument',
    purpose: 'A compound key expression remains the original single decorator argument.',
    source: `
const USER_ID: string = '42';

@Component
export struct CompoundStorageKeyCard {
  @StorageProp('user.' + USER_ID) label: string = 'none';
}
`
  },
  {
    id: 'local-storage-prop-string-key',
    branch: 'local-storage-prop-literal-argument',
    purpose: 'LocalStorageProp maps to LocalStoragePropRef and preserves its local key.',
    source: `
@Component
export struct LocalStorageKeyCard {
  @LocalStorageProp('draft-message') draft: string = 'empty';
}
`
  },
  {
    id: 'local-storage-prop-identifier-key',
    branch: 'local-storage-prop-identifier-argument',
    purpose: 'An identifier used as a local storage key is neither inlined nor converted to a string.',
    source: `
const DRAFT_KEY: string = 'shared-draft';

@Component
export struct IdentifierLocalKeyCard {
  @LocalStorageProp(DRAFT_KEY) content: string = 'initial';
}
`
  },
  {
    id: 'existing-prop-ref-idempotent',
    branch: 'existing-ref-import',
    purpose: 'Existing PropRef decorators and their stateManagement import are already in target form.',
    files: {
      'main.d.ets': `
import { LocalStorage, PropRef } from '@ohos.arkui.stateManagement';

@Component
export struct ExistingPropRefCard {
  @PropRef first: number = 1;
  @PropRef() second: string = 'two';
}
`
    }
  },
  {
    id: 'existing-storage-ref-idempotent',
    branch: 'existing-storage-ref-imports',
    purpose: 'Storage ref decorators keep their keys and do not duplicate existing named imports.',
    files: {
      'main.d.ets': `
import {
  LocalStorage,
  LocalStoragePropRef,
  StoragePropRef
} from '@ohos.arkui.stateManagement';

@Component
export struct ExistingStorageRefCard {
  @StoragePropRef('stored') stored: boolean = false;
  @LocalStoragePropRef('local') local: boolean = true;
}
`
    }
  },
  {
    id: 'state-link-watch-unchanged',
    branch: 'non-target-decorators',
    purpose: 'State, Link and Watch names, arguments and relative order are outside the PropRef rewrite.',
    source: `
@Component
export struct OtherDecoratorCard {
  @State localCount: number = 0;
  @Link linkedCount: number;
  @Watch('onScoreChanged') score: number = 0;

  onScoreChanged(): void {
  }
}
`
  },
  {
    id: 'decorator-order-preserved',
    branch: 'multiple-decorator-order',
    purpose: 'Only the Prop element changes when Watch and a custom decorator share one property.',
    source: `
declare function CustomMarker(target: Object, propertyKey: string): void;

@Component
export struct OrderedDecoratorCard {
  @Watch('onValueChanged')
  @Prop
  @CustomMarker
  value: number = 0;

  onValueChanged(): void {
  }
}
`
  },
  {
    id: 'readonly-public-static-modifiers',
    branch: 'property-modifier-preservation',
    purpose: 'Readonly, public and static modifiers survive reconstruction of three property declarations.',
    source: `
@Component
export struct ModifierCard {
  @Prop readonly readonlyValue: string = 'read-only';
  @Prop public publicValue: number = 2;
  @Prop static staticValue: boolean = true;
}
`
  },
  {
    id: 'optional-initializer-preserved',
    branch: 'question-token-and-initializer',
    purpose: 'The optional token and initializer are independent data and both survive a Prop call rewrite.',
    source: `
@Component
export struct OptionalPropertyCard {
  @Prop() description?: string = createDescription('default');
}

declare function createDescription(value: string): string;
`
  },
  {
    id: 'definite-assignment-preserved',
    branch: 'exclamation-token-and-readonly',
    purpose: 'StorageProp reconstruction keeps definite assignment and readonly rather than selecting a question token.',
    source: `
@Component
export struct DefinitePropertyCard {
  @StorageProp('required-score') readonly score!: number;
}
`
  },
  {
    id: 'complex-type-initializer-preserved',
    branch: 'generic-type-and-call-initializer',
    purpose: 'A generic property type and a multi-argument initializer remain attached to the rewritten property.',
    source: `
declare function makeItems(prefix: string, count: number): Array<string>;

@Component
export struct ComplexInitializerCard {
  @Prop items: Array<string> = makeItems('entry', 3);
}
`
  },
  {
    id: 'named-dynamic-prop',
    branch: 'named-global-annotation-prop',
    purpose: 'A named Prop imported from dynamic GlobalAnnotation is already dynamic and must not become PropRef.',
    source: `
import { Prop } from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct NamedDynamicPropCard {
  @Prop dynamicValue: number = 7;
}
`
  },
  {
    id: 'default-dynamic-prop',
    branch: 'default-global-annotation-prop',
    purpose: 'The default GlobalAnnotation Prop spelling is protected by the same dynamic decorator rule.',
    source: `
import Prop from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct DefaultDynamicPropCard {
  @Prop dynamicValue: string = 'dynamic';
}
`
  },
  {
    id: 'aliased-dynamic-prop',
    branch: 'aliased-global-annotation-prop',
    purpose: 'An aliased dynamic decorator keeps its local alias and is not confused with the global Prop name.',
    source: `
import { Prop as DynamicProp } from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct AliasedDynamicPropCard {
  @DynamicProp dynamicValue: boolean = true;
}
`
  },
  {
    id: 'named-dynamic-storage-props',
    branch: 'named-global-annotation-storage-decorators',
    purpose: 'Storage decorators imported from dynamic GlobalAnnotation retain names and literal keys.',
    source: `
import {
  LocalStorageProp,
  StorageProp
} from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct DynamicStorageCard {
  @StorageProp('dynamic-stored') stored: number = 1;
  @LocalStorageProp('dynamic-local') local: number = 2;
}
`
  },
  {
    id: 'dynamic-prop-with-framework-storage-prop',
    branch: 'dynamic-and-framework-decorators-in-one-file',
    purpose: 'Dynamic Prop protection does not prevent an independent framework StorageProp rewrite.',
    source: `
import Prop from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct MixedOriginCard {
  @Prop dynamicValue: string = 'dynamic';
  @StorageProp('framework-key') frameworkValue: string = 'framework';
}
`
  },
  {
    id: 'ordinary-module-aliased-prop',
    branch: 'ordinary-module-alias-control',
    purpose: 'A local alias from an ordinary module is not a framework decorator and remains unchanged.',
    files: {
      'main.d.ets': `
import { Prop as BusinessProp } from './ordinary';

@Component
export struct AliasedBusinessDecoratorCard {
  @BusinessProp value: string = 'business';
}
`,
      'ordinary.d.ets': ordinaryDecoratorModule
    },
    inputResolution: {
      property: 'value',
      decorator: 'BusinessProp',
      sourceFile: 'ordinary.d.ets',
      declarationKind: 'FunctionDeclaration'
    },
    knownFailureId: 'PR04-ORDINARY-ALIAS-IMPORT-001'
  },
  {
    id: 'ordinary-module-prop',
    branch: 'ordinary-module-unaliased-name-collision',
    purpose: 'An ordinary module Prop must be preserved instead of receiving an unresolved PropRef rewrite.',
    files: {
      'main.d.ets': `
import { Prop } from './ordinary';

@Component
export struct BusinessDecoratorCard {
  @Prop value: string = 'business';
}
`,
      'ordinary.d.ets': ordinaryDecoratorModule
    },
    inputResolution: {
      property: 'value',
      decorator: 'Prop',
      sourceFile: 'ordinary.d.ets',
      declarationKind: 'FunctionDeclaration'
    },
    knownFailureId: 'PR04-ORDINARY-PROP-001'
  },
  {
    id: 'local-custom-prop',
    branch: 'local-unaliased-name-collision',
    purpose: 'A source-local Prop decorator is not the framework Prop and must remain source-local.',
    source: `
declare function Prop(target: Object, propertyKey: string): void;

@Component
export struct LocalDecoratorCard {
  @Prop value: string = 'local';
}
`,
    inputResolution: {
      property: 'value',
      decorator: 'Prop',
      sourceFile: 'main.d.ets',
      declarationKind: 'FunctionDeclaration'
    },
    knownFailureId: 'PR04-LOCAL-PROP-001'
  },
  {
    id: 'local-custom-prop-call',
    branch: 'local-unaliased-call-name-collision',
    purpose: 'The call-expression branch has the same local-symbol boundary as the bare local Prop branch.',
    source: `
declare function Prop(options?: string): (target: Object, propertyKey: string) => void;

@Component
export struct LocalCallDecoratorCard {
  @Prop() value: string = 'local-call';
}
`,
    inputResolution: {
      property: 'value',
      decorator: 'Prop',
      sourceFile: 'main.d.ets',
      declarationKind: 'FunctionDeclaration'
    },
    knownFailureId: 'PR04-LOCAL-PROP-CALL-001'
  },
  {
    id: 'qualified-ui-prop',
    branch: 'property-access-decorator',
    purpose: 'Qualified UI.Prop and UI.Prop() are not unqualified identifiers and must not become UI.PropRef.',
    source: `
import * as UI from '@ohos.arkui.stateManagement';

@Component
export struct QualifiedPropCard {
  @UI.Prop first: number = 1;
  @UI.Prop() second: string = 'two';
}
`
  },
  {
    id: 'qualified-ui-storage-prop',
    branch: 'property-access-call-decorator',
    purpose: 'A qualified storage decorator retains both its UI qualifier and storage key.',
    source: `
import * as UI from '@ohos.arkui.stateManagement';

@Component
export struct QualifiedStorageCard {
  @UI.StorageProp('qualified-key') value: boolean = false;
}
`
  },
  {
    id: 'multiple-prop-import-dedup',
    branch: 'shared-import-specifier-set',
    purpose: 'Several rewritten Prop properties share one PropRef import specifier without repetition.',
    source: `
@Component
export struct MultiplePropCard {
  @Prop first: number = 1;
  @Prop() second: number = 2;
  @Prop third: number = 3;
}
`
  },
  {
    id: 'mixed-prop-family-import-order',
    branch: 'first-use-import-order',
    purpose: 'Prop, StorageProp and LocalStorageProp helpers are imported once in first-use order.',
    source: `
@Component
export struct MixedPropFamilyCard {
  @StorageProp('storage') stored: number = 1;
  @Prop direct: number = 2;
  @LocalStorageProp('local') local: number = 3;
  @Prop another: number = 4;
}
`
  },
  {
    id: 'existing-import-dedup',
    branch: 'existing-and-new-state-imports',
    purpose: 'New helpers avoid existing names while previously imported State and PropRef stay in their source import.',
    files: {
      'main.d.ets': `
import { PropRef, State } from '@ohos.arkui.stateManagement';

@Component
export struct ExistingImportCard {
  @PropRef existing: number = 1;
  @State local: number = 2;
  @Prop added: number = 3;
  @StorageProp('stored') stored: number = 4;
}
`
    }
  },
  {
    id: 'unimported-prop-ref-idempotent',
    branch: 'existing-ref-without-import',
    purpose: 'An already converted but unimported PropRef remains unchanged while its helper import is supplied once.',
    source: `
@Component
export struct UnimportedRefCard {
  @PropRef first: number = 1;
  @PropRef() second: number = 2;
}
`
  },
  {
    id: 'directive-prologue-import-position',
    branch: 'directive-prologue-insertion',
    purpose: 'Generated imports follow the use-static directive and precede the component declaration.',
    source: `'use static'
@Component
export struct DirectiveCard {
  @Prop count: number = 0;
}
`
  },
  {
    id: 'non-decorator-local-prop-usage',
    branch: 'non-decorator-symbol-control',
    purpose: 'A local Prop value used by an initializer is not rewritten because it is not a decorator.',
    source: `
declare function Prop(): number;

@Component
export struct NonDecoratorPropCard {
  @State value: number = Prop();
}
`,
    inputResolution: {
      property: 'value',
      initializer: true,
      decorator: 'Prop',
      sourceFile: 'main.d.ets',
      declarationKind: 'FunctionDeclaration'
    }
  }
];

const declgenCases = [
  {
    id: 'declgen-basic-prop',
    sourceName: 'basic_card.ets',
    componentName: 'BasicGeneratedCard',
    purpose: 'Run declaration generation for bare and call-form Prop, then resolve the generated component from a consumer.',
    source: `
@Component
export struct BasicGeneratedCard {
  @Prop count: number = 0;
  @Prop() title?: string = 'generated';

  build(): void {
  }
}
`,
    consumerProperty: 'count',
    consumerType: 'number'
  },
  {
    id: 'declgen-storage-modifiers',
    sourceName: 'storage_card.ets',
    componentName: 'StorageGeneratedCard',
    purpose: 'Verify UI-stage storage rewrites and declaration modifiers through the real DeclfileProductor output path.',
    source: `
@Component
export struct StorageGeneratedCard {
  @StorageProp('generated-storage') readonly stored!: number;
  @LocalStorageProp('generated-local') local: string = 'local';
  @State internal: boolean = false;

  build(): void {
  }
}
`,
    consumerProperty: 'stored',
    consumerType: 'number'
  },
  {
    id: 'declgen-named-dynamic-prop',
    sourceName: 'dynamic_card.ets',
    componentName: 'DynamicGeneratedCard',
    purpose: 'Confirm that the real UI stage preserves a named dynamic GlobalAnnotation Prop while converting a framework Prop.',
    source: `
import { Prop } from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct DynamicGeneratedCard {
  @Prop dynamicValue: string = 'dynamic';
  @StorageProp('generated-key') storedValue: number = 1;

  build(): void {
  }
}
`,
    consumerProperty: 'dynamicValue',
    consumerType: 'string',
    additionalFiles: {
      'src/main/ets/dynamic/@ohos.arkui.GlobalAnnotation.d.ets': `
export declare function Prop(target: Object, propertyKey: string): void;
`
    },
    knownFailureId: 'PR04-DECLGEN-NAMED-DYNAMIC-001'
  },
  {
    id: 'declgen-default-dynamic-prop',
    sourceName: 'default_dynamic_card.ets',
    componentName: 'DefaultDynamicGeneratedCard',
    purpose: 'Keep a default dynamic GlobalAnnotation Prop through declaration generation and consumer resolution.',
    source: `
import Prop from 'dynamic/@ohos.arkui.GlobalAnnotation';

@Component
export struct DefaultDynamicGeneratedCard {
  @Prop dynamicValue: string = 'dynamic-default';

  build(): void {
  }
}
`,
    consumerProperty: 'dynamicValue',
    consumerType: 'string',
    additionalFiles: {
      'src/main/ets/dynamic/@ohos.arkui.GlobalAnnotation.d.ets': `
export declare function Prop(target: Object, propertyKey: string): void;
export default Prop;
`
    },
    knownFailureId: 'PR04-DECLGEN-DEFAULT-DYNAMIC-001'
  }
];

module.exports = {
  declgenCases,
  sourceCases
};
