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

const COMPONENT_FILE = 'PropertyCard.ets';
const PACKAGE_NAME = 'dynamic_component';

function property(name, type, options = {}) {
  return {
    name,
    type,
    decorator: options.decorator === undefined ? (options.event ? '' : 'Prop') : options.decorator,
    access: options.access || '',
    optional: options.optional === true,
    initializer: options.initializer,
    caller: options.caller,
    validCaller: options.validCaller,
    abcValue: options.abcValue,
    hasCaller: Object.hasOwn(options, 'caller'),
    event: options.event === true
  };
}

function scenario(id, componentName, purpose, properties, options = {}) {
  const consumerProperty = options.consumerProperty || properties[0].name;
  const consumerDeclaration = [...properties, ...(options.stateProperties || [])].find(declaration =>
    declaration.name === consumerProperty);
  return {
    id: `pr06-${id}`,
    componentName,
    purpose,
    branch: options.branch || id,
    properties,
    stateProperties: options.stateProperties || [],
    consumerProperty,
    consumerType: options.consumerType || consumerDeclaration.type,
    fullChain: options.fullChain === true,
    expectedConsumerCode: options.expectedConsumerCode,
    expectedStaticDiagnostic: options.expectedStaticDiagnostic,
    sourceName: COMPONENT_FILE,
    packageName: PACKAGE_NAME
  };
}

const scenarios = [
  scenario('required-number', 'RequiredNumberCard',
    'A required Prop number is declared with its exact primitive type and consumed by a numeric argument.',
    [property('count', 'number', { caller: '37', abcValue: ['ldai 0x25'] })], {
      fullChain: true,
      branch: 'required-number-parameter'
    }),
  scenario('default-number-omitted', 'DefaultNumberCard',
    'Omitting a number with a source default exercises the default path without weakening the generated number type.',
    [property('count', 'number', { initializer: '0' })], {
      fullChain: true,
      branch: 'default-number-omission'
    }),
  scenario('negative-decimal-number', 'DecimalNumberCard',
    'A negative decimal default and a positive decimal override retain the single number primitive contract.',
    [property('ratio', 'number', { initializer: '-12.5', caller: '8.25' })], {
      branch: 'signed-decimal-number'
    }),
  scenario('required-string', 'RequiredStringCard',
    'A required Prop string accepts a string literal and rejects numeric substitution in its declaration consumer.',
    [property('title', 'string', { caller: "'basic properties'" })], {
      fullChain: true,
      branch: 'required-string-parameter'
    }),
  scenario('default-string-omitted', 'DefaultStringCard',
    'The caller can omit a string with a default while the public declaration remains string.',
    [property('title', 'string', { initializer: "'untitled'" })], {
      branch: 'default-string-omission'
    }),
  scenario('escaped-string-default', 'EscapedStringCard',
    'Quotes and a newline escape in a source initializer do not leak into or alter the emitted string declaration.',
    [property('message', 'string', { initializer: "'first\\n\\'second\\''", caller: "'override'" })], {
      branch: 'escaped-string-literal'
    }),
  scenario('required-boolean', 'RequiredBooleanCard',
    'A required Prop boolean is consumed with true rather than a truthy number or string.',
    [property('enabled', 'boolean', { caller: 'true' })], {
      fullChain: true,
      branch: 'required-boolean-parameter'
    }),
  scenario('default-boolean-omitted', 'DefaultBooleanCard',
    'A boolean default of true supports omission without changing the generated boolean property type.',
    [property('enabled', 'boolean', { initializer: 'true' })], {
      branch: 'default-boolean-omission'
    }),
  scenario('false-boolean-overridden', 'FalseBooleanCard',
    'A false default can be explicitly overridden with true while preserving boolean consumer assignment.',
    [property('visible', 'boolean', { initializer: 'false', caller: 'true' })], {
      branch: 'false-default-true-override'
    }),
  scenario('optional-primitives-omitted', 'OptionalPrimitivesCard',
    'Optional number, string and boolean properties preserve three question tokens when all arguments are omitted.',
    [
      property('count', 'number', { optional: true }),
      property('title', 'string', { optional: true }),
      property('enabled', 'boolean', { optional: true })
    ], {
      fullChain: true,
      consumerProperty: 'title',
      branch: 'optional-primitive-omission'
    }),
  scenario('optional-defaults-omitted', 'OptionalDefaultsCard',
    'Optional primitive properties can independently carry defaults and still retain their optional declaration tokens.',
    [
      property('count', 'number', { optional: true, initializer: '3' }),
      property('title', 'string', { optional: true, initializer: "'fallback'" }),
      property('enabled', 'boolean', { optional: true, initializer: 'false' })
    ], {
      consumerProperty: 'count',
      branch: 'optional-with-default'
    }),
  scenario('mixed-defaults-overridden', 'MixedDefaultsCard',
    'Number, string and boolean defaults are overridden together without cross-contaminating property types.',
    [
      property('count', 'number', { initializer: '1', caller: '9' }),
      property('title', 'string', { initializer: "'old'", caller: "'new'" }),
      property('enabled', 'boolean', { initializer: 'false', caller: 'true' })
    ], {
      fullChain: true,
      consumerProperty: 'enabled',
      branch: 'mixed-primitive-override'
    }),
  scenario('explicit-public-property', 'ExplicitPublicCard',
    'An explicit public modifier is normalized in declaration emit while the property remains publicly consumable.',
    [
      property('publicCount', 'number', { access: 'public', caller: '4' }),
      property('implicitTitle', 'string', { caller: "'public'" })
    ], {
      consumerProperty: 'publicCount',
      branch: 'explicit-public-modifier'
    }),
  scenario('number-payload-event', 'NumberEventCard',
    'A public numeric property and a number-payload event retain independent property and function types.',
    [
      property('count', 'number', { caller: '2' }),
      property('onCountChange', '(value: number) => void', {
        caller: '(value: number): void => { console.info(value.toString()); }',
        event: true
      })
    ], {
      fullChain: true,
      consumerProperty: 'onCountChange',
      branch: 'number-event-signature'
    }),
  scenario('string-payload-event', 'StringEventCard',
    'A string event parameter is not widened or confused with the adjacent string data property.',
    [
      property('title', 'string', { caller: "'event'" }),
      property('onTitleChange', '(value: string) => void', {
        caller: '(value: string): void => { console.info(value); }',
        event: true
      })
    ], {
      consumerProperty: 'onTitleChange',
      branch: 'string-event-signature'
    }),
  scenario('boolean-payload-event', 'BooleanEventCard',
    'A boolean event callback and boolean property keep the same primitive in both data and callback positions.',
    [
      property('enabled', 'boolean', { caller: 'false' }),
      property('onEnabledChange', '(value: boolean) => void', {
        caller: '(value: boolean): void => { console.info(String(value)); }',
        event: true
      })
    ], {
      consumerProperty: 'onEnabledChange',
      branch: 'boolean-event-signature'
    }),
  scenario('number-rejects-string', 'NumberMismatchCard',
    'Passing a string to a generated number property must diagnose the caller argument rather than only the HAP task.',
    [property('count', 'number', { caller: "'not-a-number'", validCaller: '1' })], {
      fullChain: true,
      expectedConsumerCode: 'TS2322',
      consumerType: 'string',
      expectedStaticDiagnostic: {
        messageFragments: ['not-a-number', 'Double', 'count'],
        sourceProperty: 'count'
      },
      branch: 'number-type-negative'
    }),
  scenario('string-rejects-number', 'StringMismatchCard',
    'Passing a number to a generated string property produces a source-located static consumer diagnostic.',
    [property('title', 'string', { caller: '123', validCaller: "'valid'" })], {
      fullChain: true,
      expectedConsumerCode: 'TS2322',
      consumerType: 'number',
      expectedStaticDiagnostic: {
        messageFragments: ['Int', 'String', 'title'],
        sourceProperty: 'title'
      },
      branch: 'string-type-negative'
    }),
  scenario('boolean-rejects-number', 'BooleanMismatchCard',
    'Numeric truthiness is not accepted as a substitute for the generated boolean property contract.',
    [property('enabled', 'boolean', { caller: '1', validCaller: 'true' })], {
      fullChain: true,
      expectedConsumerCode: 'TS2322',
      consumerType: 'number',
      expectedStaticDiagnostic: {
        messageFragments: ['Boolean', 'enabled'],
        sourceProperty: 'enabled'
      },
      branch: 'boolean-type-negative'
    }),
  scenario('optional-number-rejects-string', 'OptionalNumberMismatchCard',
    'Optionality permits omission but does not permit a string value for an optional number property.',
    [property('count', 'number', { optional: true, caller: "'wrong'", validCaller: '0' })], {
      fullChain: true,
      expectedConsumerCode: 'TS2322',
      consumerType: 'string',
      expectedStaticDiagnostic: {
        messageFragments: ['wrong', 'Double', 'count'],
        sourceProperty: 'count'
      },
      branch: 'optional-type-negative'
    }),
  scenario('number-event-rejects-string-handler', 'EventMismatchCard',
    'A string-payload handler cannot consume a number-payload event even when the numeric data argument is valid.',
    [
      property('count', 'number', { caller: '5' }),
      property('onCountChange', '(value: number) => void', {
        caller: '(value: string): void => { console.info(value); }',
        validCaller: '(value: number): void => { console.info(value.toString()); }',
        event: true
      })
    ], {
      fullChain: true,
      consumerProperty: 'onCountChange',
      consumerType: '(value: string) => void',
      expectedConsumerCode: 'TS2322',
      expectedStaticDiagnostic: {
        messageFragments: ['String', 'Double', 'onCountChange'],
        sourceProperty: 'onCountChange'
      },
      branch: 'event-payload-negative'
    }),
  scenario('required-number-omitted', 'MissingRequiredNumberCard',
    'The SDK permits omitting a nonoptional Prop number without an initializer while declaration emit keeps its number type.',
    [property('count', 'number')], {
      fullChain: true,
      branch: 'nondefault-number-omission'
    }),
  scenario('optional-string-rejects-number', 'OptionalStringMismatchCard',
    'An optional string permits omission and a string value, but its generated declaration still rejects a number.',
    [property('title', 'string', { optional: true, caller: "'valid'" })], {
      expectedConsumerCode: 'TS2322',
      consumerType: 'number',
      branch: 'optional-string-negative'
    }),
  scenario('optional-boolean-rejects-string', 'OptionalBooleanMismatchCard',
    'An optional boolean keeps its primitive assignability boundary independently of optional number and string cases.',
    [property('enabled', 'boolean', { optional: true, caller: 'false' })], {
      expectedConsumerCode: 'TS2322',
      consumerType: 'string',
      branch: 'optional-boolean-negative'
    }),
  scenario('default-number-rejects-string', 'DefaultNumberMismatchCard',
    'A numeric default does not widen the public property to accept a string override.',
    [property('count', 'number', { initializer: '1', caller: '2' })], {
      expectedConsumerCode: 'TS2322',
      consumerType: 'string',
      branch: 'default-number-negative'
    }),
  scenario('default-string-rejects-boolean', 'DefaultStringMismatchCard',
    'A string default does not make a boolean override assignable to the generated string declaration.',
    [property('title', 'string', { initializer: "'default'", caller: "'override'" })], {
      expectedConsumerCode: 'TS2322',
      consumerType: 'boolean',
      branch: 'default-string-negative'
    }),
  scenario('default-boolean-rejects-string', 'DefaultBooleanMismatchCard',
    'A boolean default remains boolean when the caller supplies a valid boolean rather than a string.',
    [property('enabled', 'boolean', { initializer: 'true', caller: 'false' })], {
      expectedConsumerCode: 'TS2322',
      consumerType: 'string',
      branch: 'default-boolean-negative'
    }),
  scenario('optional-event-rejects-handler', 'OptionalEventMismatchCard',
    'An optional event may be absent, but a present handler still has to accept the declared number payload.',
    [property('onCountChange', '(value: number) => void', {
      optional: true,
      caller: '(value: number): void => { console.info(value.toString()); }',
      event: true
    })], {
      consumerType: '(value: string) => void',
      expectedConsumerCode: 'TS2322',
      branch: 'optional-event-negative'
    }),
  scenario('two-events-distinct-payloads', 'TwoEventsCard',
    'Adjacent number and string callbacks preserve their own payload types rather than sharing one event signature.',
    [
      property('onCountChange', '(value: number) => void', {
        caller: '(value: number): void => { console.info(value.toString()); }',
        event: true
      }),
      property('onTitleChange', '(value: string) => void', {
        caller: '(value: string): void => { console.info(value); }',
        event: true
      })
    ], {
      consumerProperty: 'onTitleChange',
      branch: 'independent-event-payloads'
    }),
  scenario('event-with-default-handler', 'DefaultEventCard',
    'A source-level default callback is erased from declaration emit while its function type remains consumable.',
    [property('onCountChange', '(value: number) => void', {
      initializer: '(value: number): void => { console.info(value.toString()); }',
      caller: '(value: number): void => { console.info(value.toString()); }',
      event: true
    })], {
      branch: 'default-event-handler'
    }),
  scenario('public-property-order', 'PublicPropertyOrderCard',
    'Explicit public number, string and boolean fields retain declaration order and public consumer types.',
    [
      property('firstCount', 'number', { access: 'public', caller: '1' }),
      property('secondTitle', 'string', { access: 'public', caller: "'second'" }),
      property('thirdEnabled', 'boolean', { access: 'public', caller: 'true' })
    ], {
      consumerProperty: 'secondTitle',
      branch: 'public-property-order'
    }),
  scenario('optional-default-number-zero', 'OptionalZeroCard',
    'Explicit zero is a real override of an optional nonzero number default, not an omitted-value sentinel.',
    [property('count', 'number', { optional: true, initializer: '5', caller: '0', abcValue: ['ldai 0x0'] })], {
      branch: 'optional-number-zero-override'
    }),
  scenario('optional-default-string-value', 'OptionalStringValueCard',
    'An optional string default can be replaced by an empty string without confusing absence and presence.',
    [property('title', 'string', {
      optional: true, initializer: "'default'", caller: "''", abcValue: ['lda.str ""']
    })], {
      branch: 'optional-empty-string-override'
    }),
  scenario('optional-default-boolean-false', 'OptionalFalseCard',
    'An optional boolean default of true can be explicitly overridden by false.',
    [property('enabled', 'boolean', {
      optional: true, initializer: 'true', caller: 'false', abcValue: ['ldai 0x0', 'std.core.Boolean._ctor_']
    })], {
      branch: 'optional-false-override'
    }),
  scenario('optional-number-present', 'OptionalNumberPresentCard',
    'An optional number without a default accepts an explicit numeric value as a distinct branch from omission.',
    [property('count', 'number', { optional: true, caller: '11' })], {
      branch: 'optional-number-presence'
    }),
  scenario('optional-string-present', 'OptionalStringPresentCard',
    'An optional string without a default accepts text while preserving its question token in declaration emit.',
    [property('title', 'string', { optional: true, caller: "'present'" })], {
      branch: 'optional-string-presence'
    }),
  scenario('optional-boolean-present', 'OptionalBooleanPresentCard',
    'An optional boolean without a default accepts false rather than treating false as absence.',
    [property('enabled', 'boolean', {
      optional: true, caller: 'false', abcValue: ['ldai 0x0', 'std.core.Boolean._ctor_']
    })], {
      branch: 'optional-boolean-presence'
    }),
  scenario('mixed-required-primitives', 'MixedRequiredCard',
    'Required number, string and boolean arguments coexist in one call without relying on any default value.',
    [
      property('count', 'number', { caller: '6' }),
      property('title', 'string', { caller: "'required'" }),
      property('enabled', 'boolean', { caller: 'true' })
    ], {
      consumerProperty: 'title',
      branch: 'mixed-required-parameters'
    }),
  scenario('unicode-string-default', 'UnicodeStringCard',
    'A Unicode source default is removed from declaration emit without changing the string consumer contract.',
    [property('title', 'string', { initializer: "'属性默认值'", caller: "'中文覆盖'" })], {
      branch: 'unicode-string-literal'
    }),
  scenario('large-number-default', 'LargeNumberCard',
    'A large safe-integer default and a smaller explicit override remain number rather than a separate integer type.',
    [property('count', 'number', { initializer: '9007199254740991', caller: '9007199254740990' })], {
      branch: 'safe-integer-number'
    }),
  scenario('empty-string-default', 'EmptyStringCard',
    'An empty string is a present default value and does not make its required property optional.',
    [property('title', 'string', { initializer: "''", caller: "'not-empty'" })], {
      branch: 'empty-required-string-default'
    }),
  scenario('false-default-omitted', 'FalseDefaultOmittedCard',
    'A false default supports omission just like true while the emitted property remains a required boolean.',
    [property('enabled', 'boolean', { initializer: 'false' })], {
      branch: 'false-default-omission'
    }),
  scenario('optional-event-omitted', 'OptionalEventOmittedCard',
    'An optional number-payload event can be absent without supplying a placeholder callback.',
    [property('onCountChange', '(value: number) => void', {
      optional: true,
      event: true
    })], {
      branch: 'optional-event-omission'
    }),
  scenario('mixed-optional-presence', 'MixedOptionalPresenceCard',
    'One optional argument can be present while sibling optional number and boolean arguments remain omitted.',
    [
      property('count', 'number', { optional: true }),
      property('title', 'string', { optional: true, caller: "'only-title'", abcValue: ['lda.str "only-title"'] }),
      property('enabled', 'boolean', { optional: true })
    ], {
      consumerProperty: 'title',
      branch: 'mixed-optional-presence'
    }),
  scenario('private-state-not-public', 'PrivateStateCard',
    'A private State implementation detail does not become a public consumer property merely because a Prop is public.',
    [property('count', 'number', { caller: '1' })], {
      stateProperties: [property('internalTitle', 'string', {
        decorator: 'State', access: 'private', initializer: "'hidden'"
      })],
      consumerProperty: 'internalTitle',
      expectedConsumerCode: 'TS2339',
      branch: 'private-property-negative'
    })
];

function precompileScenario(testCase) {
  if (!testCase.expectedStaticDiagnostic) {
    return testCase;
  }
  return {
    ...testCase,
    properties: testCase.properties.map(declaration => ({
      ...declaration,
      caller: declaration.validCaller === undefined ? declaration.caller : declaration.validCaller
    }))
  };
}

function associatedConsumersFor(leader) {
  const leaders = scenarios.filter(testCase => testCase.fullChain);
  const leaderIndex = leaders.findIndex(testCase => testCase.id === leader.id);
  return scenarios.filter(testCase => !testCase.fullChain).filter((testCase, index) =>
    index % leaders.length === leaderIndex);
}

function renderProperty(declaration) {
  const decorator = declaration.decorator ? `@${declaration.decorator} ` : '';
  const access = declaration.access ? `${declaration.access} ` : '';
  const optional = declaration.optional ? '?' : '';
  const initializer = declaration.initializer === undefined ? '' : ` = ${declaration.initializer}`;
  return `  ${decorator}${access}${declaration.name}${optional}: ${declaration.type}${initializer};`;
}

function dynamicSource(testCase) {
  const declarations = [...testCase.properties, ...testCase.stateProperties].map(renderProperty).join('\n');
  return `@Component
export struct ${testCase.componentName} {
${declarations}

  build(): void {
  }
}
`;
}

function dynamicIndex(testCase) {
  return `export { ${testCase.componentName} } from './src/main/ets/${COMPONENT_FILE.replace(/\.ets$/, '')}';\n`;
}

function callerArguments(testCase) {
  return testCase.properties.filter(declaration => declaration.hasCaller).map(declaration => ({
    name: declaration.name,
    value: declaration.caller,
    event: declaration.event
  }));
}

function moduleIdentity(testCase) {
  const componentModule = `${PACKAGE_NAME}/src/main/ets/${COMPONENT_FILE.replace(/\.ets$/, '')}`;
  return {
    packageName: PACKAGE_NAME,
    componentName: testCase.componentName,
    componentModule,
    componentOhmUrl: `@normalized:N&&&${componentModule}&1.0.0`,
    indexModule: `${PACKAGE_NAME}/Index`,
    indexOhmUrl: `@normalized:N&&&${PACKAGE_NAME}/Index&1.0.0`,
    callerRecord: 'entry.src.main.ets.pages.Index',
    dynamicRecord: `&${componentModule.replace(/\//g, '.')}&1.0.0`
  };
}

module.exports = {
  COMPONENT_FILE,
  PACKAGE_NAME,
  associatedConsumersFor,
  callerArguments,
  dynamicIndex,
  dynamicSource,
  moduleIdentity,
  precompileScenario,
  scenarios
};
