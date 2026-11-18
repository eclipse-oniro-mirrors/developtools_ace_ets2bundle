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

const componentModule = '@ohos.arkui.component';
const dynamicAnnotationModule = 'dynamic/@ohos.arkui.GlobalAnnotation';
const stateModule = '@ohos.arkui.stateManagement';

const expectedCases = {
  'bare-prop': {
    structName: 'BarePropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      count: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '0'
      }
    }
  },
  'prop-empty-call': {
    structName: 'EmptyCallCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      title: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'untitled'"
      }
    }
  },
  'prop-call-type-argument': {
    structName: 'TypedDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      amount: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: ['number'] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      }
    }
  },
  'storage-prop-string-key': {
    structName: 'StorageKeyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] }
    ],
    properties: {
      userName: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'active-user' }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'anonymous'"
      }
    }
  },
  'storage-prop-expression-key': {
    structName: 'CompoundStorageKeyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] }
    ],
    properties: {
      label: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'BinaryExpression', text: "'user.' + USER_ID" }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'none'"
      }
    }
  },
  'local-storage-prop-string-key': {
    structName: 'LocalStorageKeyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'LocalStoragePropRef'] }
    ],
    properties: {
      draft: {
        decorators: [{
          name: 'LocalStoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'draft-message' }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'empty'"
      }
    }
  },
  'local-storage-prop-identifier-key': {
    structName: 'IdentifierLocalKeyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'LocalStoragePropRef'] }
    ],
    properties: {
      content: {
        decorators: [{
          name: 'LocalStoragePropRef',
          arguments: [{ kind: 'Identifier', value: 'DRAFT_KEY' }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'initial'"
      }
    }
  },
  'existing-prop-ref-idempotent': {
    structName: 'ExistingPropRefCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      first: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      second: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'two'"
      }
    }
  },
  'existing-storage-ref-idempotent': {
    structName: 'ExistingStorageRefCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      {
        source: stateModule,
        named: ['LocalStorage', 'LocalStoragePropRef', 'StoragePropRef']
      }
    ],
    properties: {
      stored: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'stored' }],
          typeArguments: []
        }],
        type: 'boolean',
        modifiers: [],
        token: '',
        initializer: 'false'
      },
      local: {
        decorators: [{
          name: 'LocalStoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'local' }],
          typeArguments: []
        }],
        type: 'boolean',
        modifiers: [],
        token: '',
        initializer: 'true'
      }
    }
  },
  'state-link-watch-unchanged': {
    structName: 'OtherDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'State', 'Link', 'Watch'] }
    ],
    properties: {
      localCount: {
        decorators: [{ name: 'State', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '0'
      },
      linkedCount: {
        decorators: [{ name: 'Link', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: undefined
      },
      score: {
        decorators: [{
          name: 'Watch',
          arguments: [{ kind: 'StringLiteral', value: 'onScoreChanged' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '0'
      }
    }
  },
  'decorator-order-preserved': {
    structName: 'OrderedDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'Watch', 'PropRef'] }
    ],
    properties: {
      value: {
        decorators: [
          {
            name: 'Watch',
            arguments: [{ kind: 'StringLiteral', value: 'onValueChanged' }],
            typeArguments: []
          },
          { name: 'PropRef', arguments: [], typeArguments: [] },
          { name: 'CustomMarker', arguments: [], typeArguments: [] }
        ],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '0'
      }
    }
  },
  'readonly-public-static-modifiers': {
    structName: 'ModifierCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      readonlyValue: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: ['readonly'],
        token: '',
        initializer: "'read-only'"
      },
      publicValue: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: ['public'],
        token: '',
        initializer: '2'
      },
      staticValue: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'boolean',
        modifiers: ['static'],
        token: '',
        initializer: 'true'
      }
    }
  },
  'optional-initializer-preserved': {
    structName: 'OptionalPropertyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      description: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '?',
        initializer: "createDescription('default')"
      }
    }
  },
  'definite-assignment-preserved': {
    structName: 'DefinitePropertyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] }
    ],
    properties: {
      score: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'required-score' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: ['readonly'],
        token: '!',
        initializer: undefined
      }
    }
  },
  'complex-type-initializer-preserved': {
    structName: 'ComplexInitializerCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      items: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'Array<string>',
        modifiers: [],
        token: '',
        initializer: "makeItems('entry', 3)"
      }
    }
  },
  'named-dynamic-prop': {
    structName: 'NamedDynamicPropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      { source: dynamicAnnotationModule, named: ['Prop'] }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '7'
      }
    }
  },
  'default-dynamic-prop': {
    structName: 'DefaultDynamicPropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      { source: dynamicAnnotationModule, named: [], defaultImport: 'Prop' }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'dynamic'"
      }
    }
  },
  'aliased-dynamic-prop': {
    structName: 'AliasedDynamicPropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      {
        source: dynamicAnnotationModule,
        named: [{ imported: 'Prop', local: 'DynamicProp' }]
      }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'DynamicProp', arguments: [], typeArguments: [] }],
        type: 'boolean',
        modifiers: [],
        token: '',
        initializer: 'true'
      }
    }
  },
  'named-dynamic-storage-props': {
    structName: 'DynamicStorageCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      {
        source: dynamicAnnotationModule,
        named: ['LocalStorageProp', 'StorageProp']
      }
    ],
    properties: {
      stored: {
        decorators: [{
          name: 'StorageProp',
          arguments: [{ kind: 'StringLiteral', value: 'dynamic-stored' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      local: {
        decorators: [{
          name: 'LocalStorageProp',
          arguments: [{ kind: 'StringLiteral', value: 'dynamic-local' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '2'
      }
    }
  },
  'dynamic-prop-with-framework-storage-prop': {
    structName: 'MixedOriginCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] },
      { source: dynamicAnnotationModule, named: [], defaultImport: 'Prop' }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'dynamic'"
      },
      frameworkValue: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'framework-key' }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'framework'"
      }
    }
  },
  'ordinary-module-aliased-prop': {
    structName: 'AliasedBusinessDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      {
        source: './ordinary',
        named: [{ imported: 'Prop', local: 'BusinessProp' }]
      }
    ],
    properties: {
      value: {
        decorators: [{ name: 'BusinessProp', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'business'"
      }
    }
  },
  'ordinary-module-prop': {
    structName: 'BusinessDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      { source: './ordinary', named: ['Prop'] }
    ],
    properties: {
      value: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'business'"
      }
    }
  },
  'local-custom-prop': {
    structName: 'LocalDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] }
    ],
    properties: {
      value: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'local'"
      }
    }
  },
  'local-custom-prop-call': {
    structName: 'LocalCallDecoratorCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] }
    ],
    properties: {
      value: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'local-call'"
      }
    }
  },
  'qualified-ui-prop': {
    structName: 'QualifiedPropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'Prop'] },
      { source: stateModule, named: [], namespaceImport: 'UI' }
    ],
    properties: {
      first: {
        decorators: [{ name: 'UI.Prop', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      second: {
        decorators: [{ name: 'UI.Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: "'two'"
      }
    }
  },
  'qualified-ui-storage-prop': {
    structName: 'QualifiedStorageCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StorageProp'] },
      { source: stateModule, named: [], namespaceImport: 'UI' }
    ],
    properties: {
      value: {
        decorators: [{
          name: 'UI.StorageProp',
          arguments: [{ kind: 'StringLiteral', value: 'qualified-key' }],
          typeArguments: []
        }],
        type: 'boolean',
        modifiers: [],
        token: '',
        initializer: 'false'
      }
    }
  },
  'multiple-prop-import-dedup': {
    structName: 'MultiplePropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      first: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      second: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '2'
      },
      third: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '3'
      }
    }
  },
  'mixed-prop-family-import-order': {
    structName: 'MixedPropFamilyCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      {
        source: stateModule,
        named: ['LocalStorage', 'StoragePropRef', 'PropRef', 'LocalStoragePropRef']
      }
    ],
    properties: {
      stored: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'storage' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      direct: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '2'
      },
      local: {
        decorators: [{
          name: 'LocalStoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'local' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '3'
      },
      another: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '4'
      }
    }
  },
  'existing-import-dedup': {
    structName: 'ExistingImportCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] },
      { source: stateModule, named: ['PropRef', 'State'] }
    ],
    properties: {
      existing: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      local: {
        decorators: [{ name: 'State', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '2'
      },
      added: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '3'
      },
      stored: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'stored' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '4'
      }
    }
  },
  'unimported-prop-ref-idempotent': {
    structName: 'UnimportedRefCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      first: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '1'
      },
      second: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '2'
      }
    }
  },
  'directive-prologue-import-position': {
    structName: 'DirectiveCard',
    directive: 'use static',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] }
    ],
    properties: {
      count: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: '0'
      }
    }
  },
  'non-decorator-local-prop-usage': {
    structName: 'NonDecoratorPropCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'State'] }
    ],
    properties: {
      value: {
        decorators: [{ name: 'State', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: 'Prop()'
      }
    }
  }
};

const knownFailures = {
  'PR04-ORDINARY-ALIAS-IMPORT-001': {
    stage: 'HandleUIImports.addUIImports', category: 'existing', code: 'PR04-ORDINARY-ALIAS-IMPORT-001'
  },
  'PR04-ORDINARY-PROP-001': {
    stage: 'HandleUIImports.transformPropertyRefDecorator', category: 'existing', code: 'PR04-ORDINARY-PROP-001'
  },
  'PR04-LOCAL-PROP-001': {
    stage: 'HandleUIImports.transformPropertyRefDecorator', category: 'existing', code: 'PR04-LOCAL-PROP-001'
  },
  'PR04-LOCAL-PROP-CALL-001': {
    stage: 'HandleUIImports.transformPropertyRefDecorator', category: 'existing', code: 'PR04-LOCAL-PROP-CALL-001'
  }
};

const declgenExpectations = {
  'declgen-basic-prop': {
    structName: 'BasicGeneratedCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'PropRef'] },
      { source: '@ohos.lang.interop', named: [], defaultImport: 'es' }
    ],
    properties: {
      count: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: undefined
      },
      title: {
        decorators: [{ name: 'PropRef', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '?',
        initializer: undefined
      }
    }
  },
  'declgen-storage-modifiers': {
    structName: 'StorageGeneratedCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      {
        source: stateModule,
        named: ['LocalStorage', 'StoragePropRef', 'LocalStoragePropRef', 'State']
      },
      { source: '@ohos.lang.interop', named: [], defaultImport: 'es' }
    ],
    properties: {
      stored: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'generated-storage' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: ['readonly'],
        token: '',
        initializer: undefined
      },
      local: {
        decorators: [{
          name: 'LocalStoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'generated-local' }],
          typeArguments: []
        }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: undefined
      },
      internal: {
        decorators: [{ name: 'State', arguments: [], typeArguments: [] }],
        type: 'boolean',
        modifiers: [],
        token: '',
        initializer: undefined
      }
    }
  },
  'declgen-named-dynamic-prop': {
    structName: 'DynamicGeneratedCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage', 'StoragePropRef'] },
      { source: dynamicAnnotationModule, named: ['Prop'] },
      { source: '@ohos.lang.interop', named: [], defaultImport: 'es' }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: undefined
      },
      storedValue: {
        decorators: [{
          name: 'StoragePropRef',
          arguments: [{ kind: 'StringLiteral', value: 'generated-key' }],
          typeArguments: []
        }],
        type: 'number',
        modifiers: [],
        token: '',
        initializer: undefined
      }
    }
  },
  'declgen-default-dynamic-prop': {
    structName: 'DefaultDynamicGeneratedCard',
    imports: [
      { source: componentModule, named: ['Component'] },
      { source: stateModule, named: ['LocalStorage'] },
      { source: dynamicAnnotationModule, named: [], defaultImport: 'Prop' },
      { source: '@ohos.lang.interop', named: [], defaultImport: 'es' }
    ],
    properties: {
      dynamicValue: {
        decorators: [{ name: 'Prop', arguments: [], typeArguments: [] }],
        type: 'string',
        modifiers: [],
        token: '',
        initializer: undefined
      }
    }
  }
};

const declgenKnownFailures = {
  'PR04-DECLGEN-NAMED-DYNAMIC-001': {
    stage: 'declgen.declaration', category: 'existing', code: 'PR04-DECLGEN-NAMED-DYNAMIC-001'
  },
  'PR04-DECLGEN-DEFAULT-DYNAMIC-001': {
    stage: 'declgen.declaration', category: 'existing', code: 'PR04-DECLGEN-DEFAULT-DYNAMIC-001'
  }
};

module.exports = {
  declgenExpectations,
  declgenKnownFailures,
  expectedCases,
  knownFailures,
  modules: {
    componentModule,
    dynamicAnnotationModule,
    stateModule
  }
};
