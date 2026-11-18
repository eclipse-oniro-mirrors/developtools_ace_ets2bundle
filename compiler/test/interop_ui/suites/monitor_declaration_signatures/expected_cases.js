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

const STATE_MODULE = '@ohos.arkui.stateManagement';
const COMPONENT_MODULE = '@ohos.arkui.component';
const INTEROP_MODULE = '@ohos.lang.interop';

function expression(kind, text, extra = {}) {
  return Object.assign({ kind, text }, extra);
}

function stringLiteral(text) {
  return expression('StringLiteral', text);
}

function identifier(text) {
  return expression('Identifier', text);
}

function callExpression(text) {
  return expression('CallExpression', text);
}

function propertyAccess(text) {
  return expression('PropertyAccessExpression', text);
}

function binaryExpression(text) {
  return expression('BinaryExpression', text);
}

function spreadElement(text, child) {
  return expression('SpreadElement', text, { expression: child });
}

function arrayLiteral(...elements) {
  return { kind: 'ArrayLiteralExpression', elements };
}

function decorator(name, args) {
  return { name, arguments: args };
}

function bareDecorator(name) {
  return { name, arguments: null };
}

function rawCall(name, args) {
  return decorator(name, args);
}

function monitor(...elements) {
  return decorator('Monitor', [arrayLiteral(...elements)]);
}

function rawMonitor(...args) {
  return rawCall('Monitor', args);
}

function watch(path) {
  return rawCall('Watch', [stringLiteral(path)]);
}

function syncMonitor(path) {
  return rawCall('SyncMonitor', [stringLiteral(path)]);
}

function parameter(name, type, options = {}) {
  return Object.assign({
    kind: 'Parameter',
    name,
    type,
    optional: false,
    rest: false,
    modifiers: []
  }, options);
}

function method(name, options = {}) {
  return Object.assign({
    kind: 'MethodDeclaration',
    name,
    modifiers: [],
    decorators: [],
    parameters: [],
    returnType: 'void'
  }, options);
}

function property(name, options = {}) {
  return Object.assign({
    kind: 'PropertyDeclaration',
    name,
    modifiers: [],
    decorators: [],
    optional: false
  }, options);
}

function constructor(options = {}) {
  return Object.assign({
    kind: 'Constructor',
    modifiers: [],
    decorators: [],
    parameters: []
  }, options);
}

function classDeclaration(name, members, options = {}) {
  return Object.assign({
    kind: 'ClassDeclaration',
    name,
    modifiers: ['export', 'declare'],
    members
  }, options);
}

function structDeclaration(name, members, options = {}) {
  return Object.assign({
    kind: 'StructDeclaration',
    name,
    modifiers: ['export'],
    members
  }, options);
}

function interfaceDeclaration(name, members, options = {}) {
  return Object.assign({
    kind: 'InterfaceDeclaration',
    name,
    modifiers: ['export', 'declare'],
    members
  }, options);
}

function functionDeclaration(name, options = {}) {
  return Object.assign({
    kind: 'FunctionDeclaration',
    name,
    modifiers: ['export', 'declare'],
    decorators: [],
    parameters: []
  }, options);
}

function namedImport(source, names, options = {}) {
  return Object.assign({
    source,
    names,
    defaultName: undefined,
    typeOnly: false
  }, options);
}

function stateImport(...names) {
  return namedImport(STATE_MODULE, names);
}

function componentImport(...names) {
  return namedImport(COMPONENT_MODULE, names);
}

function interopImport() {
  return namedImport(INTEROP_MODULE, [], { defaultName: 'es' });
}

function declgenOutput(id) {
  return `build/declgenV2/src/main/ets/${id}.d.ets`;
}

function monitorCase(className, methodName, elements, methodOptions = {}, options = {}) {
  const member = Object.assign({ decorators: [monitor(...elements)] }, methodOptions);
  return Object.assign({
    imports: options.imports || [stateImport('Monitor')],
    declarations: [classDeclaration(className, [method(methodName, member)])]
  }, options.extra || {});
}

const modifierLossFailure = {
  issue: 'PR05-MONITOR-MODIFIER-LOSS',
  category: 'implementation',
  contract: 'Updating @Monitor must concatenate decorators with existing modifiers.',
  sourceEvidence: 'compiler/src/interop/src/process_interop_ui.ts:125-145'
};

const EXPECTED_CASES = {
  monitorSingle: monitorCase('SingleMonitor', 'onCountChange', [stringLiteral("'count'")],
    { checkerReturnType: 'void' }),
  monitorMultiple: monitorCase('MultipleMonitor', 'onChange', [
    stringLiteral("'first'"), stringLiteral("'second'"), stringLiteral("'third'")
  ]),
  monitorZero: monitorCase('ZeroMonitor', 'onChange', []),
  monitorArrayIdempotent: monitorCase('ArrayMonitor', 'onChange', [
    stringLiteral("'first'"), stringLiteral("'second'")
  ], { identity: true }),
  monitorArraySpreadIdempotent: monitorCase('ArraySpreadMonitor', 'onChange', [
    stringLiteral("'first'"), spreadElement('...paths', identifier('paths'))
  ], { identity: true }),
  monitorMixedArguments: monitorCase('MixedMonitor', 'onChange', [
    stringLiteral("'first'"), spreadElement('...paths', identifier('paths')),
    stringLiteral("'last'")
  ]),
  monitorSpreadOnly: monitorCase('SpreadMonitor', 'onChange', [
    spreadElement('...paths', identifier('paths'))
  ]),
  monitorBare: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('BareMonitor', [
      method('onChange', {
        decorators: [bareDecorator('Monitor')],
        identity: true
      })
    ])]
  },
  watchCall: {
    imports: [stateImport('Watch')],
    declarations: [classDeclaration('WatchOnly', [
      method('onChange', {
        decorators: [watch("'count'")],
        identity: true
      })
    ])]
  },
  watchMonitorOrder: {
    imports: [stateImport('Monitor', 'Watch')],
    declarations: [classDeclaration('OrderedDecorators', [
      method('onChange', {
        decorators: [
          watch("'count'"),
          monitor(stringLiteral("'count'"), stringLiteral("'other'"))
        ]
      })
    ])]
  },
  explicitNumber: monitorCase('NumericMonitor', 'calculate', [stringLiteral("'count'")], {
    parameters: [parameter('value', 'number')],
    returnType: 'number',
    checkerReturnType: 'number'
  }),
  inferredVoid: monitorCase('InferredVoidMonitor', 'onChange', [stringLiteral("'count'")], {
    returnType: 'void',
    checkerReturnType: 'any'
  }),
  genericSignature: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('GenericMonitor', [
      method('convert', {
        decorators: [monitor(stringLiteral("'item'"))],
        typeParameters: ['U extends object', 'V = U[]'],
        parameters: [
          parameter('value', 'U'),
          parameter('fallback', 'V', { optional: true })
        ],
        returnType: 'V'
      })
    ], { typeParameters: ['T'] })]
  },
  optionalSignature: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('OptionalMonitor', [
      method('optional', {
        decorators: [monitor(stringLiteral("'value'"))],
        optional: true,
        typeParameters: ['T'],
        parameters: [parameter('value', 'T', { optional: true })],
        returnType: 'T | undefined'
      })
    ])]
  },
  parameterPreservation: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('ParameterMonitor', [
      method('update', {
        decorators: [monitor(stringLiteral("'all'"))],
        parameters: [
          parameter('first', 'number'),
          parameter('second', 'string', { optional: true }),
          parameter('rest', 'boolean[]', { rest: true })
        ]
      })
    ])]
  },
  parameterDefault: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('DefaultMonitor', [
      method('update', {
        decorators: [monitor(stringLiteral("'value'"))],
        parameters: [parameter('value', 'number', { initializer: '1' })],
        body: true
      })
    ], { modifiers: ['export'] })]
  },
  staticAsyncModifiers: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('AsyncMonitor', [
      method('load', {
        decorators: [monitor(stringLiteral("'value'"))],
        modifiers: ['public', 'static', 'async'],
        parameters: [parameter('value', 'string', { optional: true })],
        returnType: 'Promise<number>'
      })
    ])],
    knownFailure: modifierLossFailure
  },
  watchStaticAsync: {
    imports: [stateImport('Watch')],
    declarations: [classDeclaration('AsyncWatch', [
      method('load', {
        decorators: [watch("'value'")],
        modifiers: ['public', 'static', 'async'],
        parameters: [parameter('value', 'string', { optional: true })],
        returnType: 'Promise<number>',
        identity: true
      })
    ])]
  },
  functionBoundary: {
    imports: [stateImport('Monitor')],
    declarations: [functionDeclaration('free', {
      decorators: [rawMonitor(stringLiteral("'free'"))],
      parameters: [parameter('value', 'number')],
      returnType: 'void',
      identity: true
    })]
  },
  methodSignatureBoundary: {
    imports: [stateImport('Monitor')],
    declarations: [interfaceDeclaration('Contract', [
      method('onChange', {
        kind: 'MethodSignature',
        decorators: [rawMonitor(stringLiteral("'value'"))],
        parameters: [parameter('value', 'string')],
        identity: true
      })
    ])]
  },
  propertyBoundary: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('PropertyBoundary', [
      property('count', {
        decorators: [rawMonitor(stringLiteral("'value'"))],
        modifiers: ['static', 'readonly'],
        optional: true,
        propertyType: 'number',
        identity: true
      })
    ])]
  },
  constructorBoundary: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('ConstructorBoundary', [
      constructor({
        parameters: [parameter('value', 'number', {
          modifiers: ['public', 'readonly']
        })],
        identity: true
      })
    ])]
  },
  overloadSignatures: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('OverloadedMonitor', [
      method('convert', {
        decorators: [monitor(stringLiteral("'value'"))],
        parameters: [parameter('value', 'string')],
        returnType: 'number',
        occurrence: 0
      }),
      method('convert', {
        parameters: [parameter('value', 'number')],
        returnType: 'string',
        occurrence: 1,
        identity: true
      })
    ], { memberCount: 2 })]
  },
  propertyConstructorFidelity: {
    imports: [],
    declarations: [classDeclaration('SignatureModel', [
      property('version', {
        modifiers: ['static', 'readonly'],
        propertyType: 'number'
      }),
      property('title', {
        optional: true,
        propertyType: 'string'
      }),
      constructor({
        parameters: [
          parameter('title', 'string'),
          parameter('version', 'number', { optional: true })
        ]
      }),
      method('describe', {
        parameters: [parameter('prefix', 'string')],
        returnType: 'string'
      })
    ], { memberCount: 4 })]
  },
  accessorBoundary: {
    imports: [stateImport('Monitor')],
    declarations: [classDeclaration('AccessorBoundary', [
      method('current', {
        kind: 'GetAccessor',
        decorators: [rawMonitor(stringLiteral("'value'"))],
        returnType: 'number',
        identity: true
      })
    ])]
  },
  structMonitor: {
    imports: [
      stateImport('LocalStorage'),
      stateImport('Monitor'),
      componentImport('ComponentV2')
    ],
    declarations: [structDeclaration('Card', [
      method('onChange', {
        decorators: [monitor(stringLiteral("'count'"))]
      })
    ], {
      memberCount: 1,
      absentMembers: [{ kind: 'Constructor' }]
    })]
  },
  localMonitorShadow: monitorCase('LocalMonitor', 'onChange', [stringLiteral("'value'")],
    {}, { imports: [] }),
  autoMonitorImport: monitorCase('AutoImportMonitor', 'onChange', [stringLiteral("'value'")],
    {}, { extra: { statementKinds: ['ImportDeclaration', 'ClassDeclaration'] } }),
  existingStateImport: {
    imports: [stateImport('Monitor', 'Watch')],
    declarations: [classDeclaration('ExistingImportMonitor', [
      method('onChange', {
        decorators: [monitor(stringLiteral("'count'")), watch("'other'")]
      })
    ])]
  },
  dynamicOrigin: monitorCase('DynamicOriginMonitor', 'onChange', [stringLiteral("'value'")],
    {}, { imports: [namedImport('dynamic/@ohos.arkui.GlobalAnnotation', ['Monitor'])] }),
  relativeOrigin: monitorCase('RelativeOriginMonitor', 'onChange', [stringLiteral("'value'")],
    {}, { imports: [namedImport('./monitor_decorator', ['Monitor'])] }),
  directivePosition: monitorCase('DirectiveMonitor', 'onChange', [stringLiteral("'value'")],
    {}, { extra: { statementKinds: ['ExpressionStatement', 'ImportDeclaration', 'ClassDeclaration'] } }),
  callArgument: monitorCase('CallArgumentMonitor', 'onChange', [callExpression('getPath()')]),
  propertyAccessArgument: monitorCase('PropertyArgumentMonitor', 'onChange', [
    propertyAccess('paths.current')
  ]),
  binaryArgument: monitorCase('BinaryArgumentMonitor', 'onChange', [
    binaryExpression("'count' + suffix")
  ]),
  multipleMethods: {
    imports: [stateImport('Monitor', 'Watch')],
    declarations: [classDeclaration('MultipleMethods', [
      method('first', {
        decorators: [monitor(stringLiteral("'first'"))]
      }),
      method('second', {
        decorators: [monitor(
          stringLiteral("'second'"),
          stringLiteral("'third'")
        )]
      }),
      method('third', {
        decorators: [watch("'third'")],
        identity: true
      })
    ], { memberCount: 3 })]
  },
  multipleClasses: {
    imports: [stateImport('Monitor')],
    declarations: [
      classDeclaration('FirstMonitor', [
        method('onChange', {
          decorators: [monitor(stringLiteral("'first'"))]
        })
      ]),
      classDeclaration('SecondMonitor', [
        method('onChange', {
          decorators: [monitor(stringLiteral("'second'"))]
        })
      ])
    ]
  },
  noMonitorUntouched: {
    imports: [],
    declarations: [classDeclaration('PlainSignature', [
      method('onChange', {
        parameters: [parameter('value', 'number')],
        identity: true
      })
    ])]
  },
  syncMonitor: {
    imports: [stateImport('SyncMonitor')],
    declarations: [classDeclaration('SyncOnly', [
      method('onChange', {
        decorators: [syncMonitor("'count'")],
        identity: true
      })
    ])]
  },
  monitorArrayAndPositional: monitorCase('MixedArrayMonitor', 'onChange', [
    arrayLiteral(stringLiteral("'first'"), stringLiteral("'second'")), stringLiteral("'third'")
  ]),
  monitorSpreadArrayLiteral: monitorCase('SpreadArrayMonitor', 'onChange', [
    spreadElement("...['first', 'second']",
      arrayLiteral(stringLiteral("'first'"), stringLiteral("'second'")))
  ]),
  monitorArrayStaticAsync: monitorCase('ArrayAsyncMonitor', 'load', [stringLiteral("'value'")], {
    modifiers: ['public', 'static', 'async'],
    parameters: [parameter('value', 'string', { optional: true })],
    returnType: 'Promise<number>',
    identity: true
  }),
  emitPrimitiveInference: {
    imports: [],
    declarations: [classDeclaration('PrimitiveInference', [
      method('isPositive', {
        parameters: [parameter('value', 'number')],
        returnType: 'boolean'
      }),
      method('double', {
        parameters: [parameter('value', 'number')],
        returnType: 'number'
      }),
      method('label', {
        parameters: [parameter('value', 'number')],
        returnType: 'string'
      })
    ], { memberCount: 3 })]
  },
  emitPromiseInference: {
    imports: [],
    declarations: [classDeclaration('PromiseInference', [
      method('load', {
        modifiers: ['static'],
        parameters: [parameter('value', 'number', { optional: true })],
        returnType: 'Promise<string>'
      })
    ])]
  },
  emitGenericOptional: {
    imports: [],
    declarations: [classDeclaration('GenericInference', [
      method('convert', {
        typeParameters: ['U extends T'],
        parameters: [
          parameter('value', 'T'),
          parameter('fallback', 'U', { optional: true })
        ],
        returnType: 'U'
      })
    ], { typeParameters: ['T'] })]
  },
  emitPropertyConstructor: {
    imports: [],
    declarations: [classDeclaration('EmittedModel', [
      property('version', {
        modifiers: ['static', 'readonly'],
        propertyType: 'number'
      }),
      property('title', {
        optional: true,
        propertyType: 'string'
      }),
      constructor({
        parameters: [
          parameter('title', 'string'),
          parameter('version', 'number', { optional: true })
        ]
      })
    ], { memberCount: 3 })]
  },
  emitOverloads: {
    imports: [],
    declarations: [classDeclaration('EmittedOverloads', [
      method('convert', {
        parameters: [parameter('value', 'string')],
        returnType: 'number',
        occurrence: 0
      }),
      method('convert', {
        parameters: [parameter('value', 'number')],
        returnType: 'string',
        occurrence: 1
      })
    ], { memberCount: 2 })]
  },
  emitFunctionInterface: {
    imports: [],
    declarations: [
      functionDeclaration('score', {
        parameters: [parameter('value', 'number')],
        returnType: 'number'
      }),
      interfaceDeclaration('EmittedContract', [
        method('convert', {
          kind: 'MethodSignature',
          parameters: [parameter('input', 'string')],
          returnType: 'number'
        })
      ], { modifiers: ['export'] })
    ]
  },
  declgenMonitorBasic: {
    imports: [stateImport('Monitor', 'Watch'), interopImport()],
    declarations: [classDeclaration('DeclgenMonitor', [
      method('single', {
        decorators: [monitor(stringLiteral("'count'"))]
      }),
      method('multiple', {
        decorators: [monitor(
          stringLiteral("'first'"),
          stringLiteral("'second'")
        )]
      }),
      method('array', {
        decorators: [monitor(stringLiteral("'already'"), stringLiteral("'array'"))]
      }),
      method('watched', {
        decorators: [watch("'count'")]
      })
    ], { memberCount: 4 })],
    requiredText: ["'use static'", 'import es from "@ohos.lang.interop";'],
    outputSuffix: declgenOutput('declgen-monitor-basic')
  },
  declgenStaticAsync: {
    imports: [stateImport('Monitor'), interopImport()],
    declarations: [classDeclaration('DeclgenAsyncMonitor', [
      method('load', {
        decorators: [monitor(stringLiteral("'value'"))],
        modifiers: ['public', 'static', 'async'],
        parameters: [parameter('value', 'string', { optional: true })],
        returnType: 'Promise<number>'
      })
    ])],
    requiredText: ["'use static'"],
    outputSuffix: declgenOutput('declgen-static-async'),
    knownFailure: modifierLossFailure
  },
  declgenSourceInference: {
    imports: [interopImport()],
    declarations: [classDeclaration('DeclgenInference', [
      method('isPositive', {
        parameters: [parameter('value', 'number')],
        returnType: 'boolean'
      }),
      method('double', {
        parameters: [parameter('value', 'number')],
        returnType: 'number'
      }),
      method('convert', {
        typeParameters: ['T'],
        parameters: [
          parameter('value', 'T'),
          parameter('fallback', 'T', { optional: true })
        ],
        returnType: 'T'
      })
    ], { memberCount: 3 })],
    requiredText: ["'use static'"],
    outputSuffix: declgenOutput('declgen-source-inference')
  }
};

module.exports = {
  EXPECTED_CASES,
  modifierLossFailure
};
