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

function transform(id, title, boundary, source, expectation, extra = {}) {
  return Object.assign({
    id,
    title,
    boundary,
    source,
    expectation,
    mode: 'transform',
    fileName: `${id}.d.ets`
  }, extra);
}

function declarationEmit(id, title, boundary, source, expectation, extra = {}) {
  return Object.assign({
    id,
    title,
    boundary,
    source,
    expectation,
    mode: 'emit',
    fileName: `${id}.ets`
  }, extra);
}

function declgen(id, title, boundary, source, expectation, extra = {}) {
  return Object.assign({
    id,
    title,
    boundary,
    source,
    expectation,
    mode: 'declgen',
    fileName: `${id}.d.ets`
  }, extra);
}

const SOURCE_CASES = [
  transform(
    'monitor-single-argument',
    'wraps one Monitor path in an array',
    'The one-argument branch must create one array without changing its string literal.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class SingleMonitor {
  @Monitor('count') onCountChange(): void;
}
`,
    'monitorSingle'
  ),
  transform(
    'monitor-multiple-arguments',
    'preserves every Monitor path in source order',
    'Multiple positional arguments exercise ordered array construction.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class MultipleMonitor {
  @Monitor('first', 'second', 'third') onChange(): void;
}
`,
    'monitorMultiple'
  ),
  transform(
    'monitor-zero-arguments',
    'creates an empty path array for Monitor()',
    'Zero arguments distinguish an empty array from a bare decorator.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class ZeroMonitor {
  @Monitor() onChange(): void;
}
`,
    'monitorZero'
  ),
  transform(
    'monitor-array-idempotent',
    'does not wrap an existing Monitor path array again',
    'The sole-array early return must be idempotent down to node identity.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class ArrayMonitor {
  @Monitor(['first', 'second']) onChange(): void;
}
`,
    'monitorArrayIdempotent'
  ),
  transform(
    'monitor-array-spread-idempotent',
    'keeps spread elements in an existing Monitor array',
    'An existing array containing spread must not trigger another rewrite.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare const paths: string[];
export declare class ArraySpreadMonitor {
  @Monitor(['first', ...paths]) onChange(): void;
}
`,
    'monitorArraySpreadIdempotent'
  ),
  transform(
    'monitor-mixed-arguments',
    'preserves literal, spread, and trailing Monitor arguments',
    'Mixed arguments verify order and SpreadElement nesting in the new array.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare const paths: string[];
export declare class MixedMonitor {
  @Monitor('first', ...paths, 'last') onChange(): void;
}
`,
    'monitorMixedArguments'
  ),
  transform(
    'monitor-spread-only',
    'wraps a lone spread argument as one array element',
    'A spread-only call must not be mistaken for an existing array argument.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare const paths: string[];
export declare class SpreadMonitor {
  @Monitor(...paths) onChange(): void;
}
`,
    'monitorSpreadOnly'
  ),
  transform(
    'monitor-bare-decorator',
    'leaves the bare @Monitor decorator untouched',
    'A bare decorator has no CallExpression and must retain node identity.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class BareMonitor {
  @Monitor onChange(): void;
}
`,
    'monitorBare'
  ),
  transform(
    'watch-call-not-wrapped',
    'does not apply Monitor array conversion to Watch',
    'Watch uses a different decorator contract and remains unchanged.',
    `import { Watch } from '@ohos.arkui.stateManagement';
export declare class WatchOnly {
  @Watch('count') onChange(): void;
}
`,
    'watchCall'
  ),
  transform(
    'watch-monitor-order',
    'updates only Monitor when Watch is also present',
    'Decorator ordering and non-Monitor arguments must survive the rewrite.',
    `import { Monitor, Watch } from '@ohos.arkui.stateManagement';
export declare class OrderedDecorators {
  @Watch('count')
  @Monitor('count', 'other')
  onChange(): void;
}
`,
    'watchMonitorOrder'
  ),
  transform(
    'explicit-number-return',
    'keeps an explicit number return type',
    'Decorator rewriting must not replace an explicit non-void return type.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class NumericMonitor {
  @Monitor('count') calculate(value: number): number;
}
`,
    'explicitNumber'
  ),
  transform(
    'direct-inferred-return-void',
    'adds void when a transformed method has no return annotation',
    'The independent missing-type branch runs alongside Monitor conversion.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class InferredVoidMonitor {
  @Monitor('count') onChange();
}
`,
    'inferredVoid'
  ),
  transform(
    'generic-signature',
    'retains class and method generic type parameters',
    'Constraints, defaults, optional parameters, and generic returns must survive.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class GenericMonitor<T> {
  @Monitor('item') convert<U extends object, V = U[]>(value: U, fallback?: V): V;
}
`,
    'genericSignature'
  ),
  transform(
    'optional-signature',
    'retains optional method and parameter tokens',
    'Question tokens belong to both the method and its optional parameter.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class OptionalMonitor {
  @Monitor('value') optional?<T>(value?: T): T | undefined;
}
`,
    'optionalSignature'
  ),
  transform(
    'parameter-preservation',
    'retains required, optional, and rest parameters',
    'Parameter kinds and order are checked independently of Monitor path order.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class ParameterMonitor {
  @Monitor('all') update(first: number, second?: string, ...rest: boolean[]): void;
}
`,
    'parameterPreservation'
  ),
  transform(
    'parameter-default',
    'retains a parameter initializer and method body',
    'A non-ambient input proves parameter defaults and bodies are not rebuilt away.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export class DefaultMonitor {
  @Monitor('value') update(value: number = 1): void {
    console.info(value);
  }
}
`,
    'parameterDefault',
    { fileName: 'parameter-default.ets' }
  ),
  transform(
    'static-async-modifiers',
    'keeps public static async on a Promise-returning Monitor method',
    'Known production regression: decorator-only update currently drops every modifier.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class AsyncMonitor {
  @Monitor('value') public static async load(value?: string): Promise<number>;
}
`,
    'staticAsyncModifiers'
  ),
  transform(
    'watch-static-async',
    'keeps public static async on the Watch control',
    'The Watch control isolates modifier loss to the Monitor update branch.',
    `import { Watch } from '@ohos.arkui.stateManagement';
export declare class AsyncWatch {
  @Watch('value') public static async load(value?: string): Promise<number>;
}
`,
    'watchStaticAsync'
  ),
  transform(
    'function-declaration-boundary',
    'does not rewrite a FunctionDeclaration decorator',
    'HandleUIImports transforms MethodDeclaration, not top-level functions.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
@Monitor('free')
export declare function free(value: number): void;
`,
    'functionBoundary'
  ),
  transform(
    'method-signature-boundary',
    'does not rewrite an interface MethodSignature decorator',
    'MethodSignature and MethodDeclaration have different AST contracts.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare interface Contract {
  @Monitor('value') onChange(value: string): void;
}
`,
    'methodSignatureBoundary'
  ),
  transform(
    'property-declaration-boundary',
    'does not apply method Monitor rewriting to a property',
    'Property modifiers, optionality, type, and decorator remain intact.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class PropertyBoundary {
  @Monitor('value') static readonly count?: number;
}
`,
    'propertyBoundary'
  ),
  transform(
    'constructor-boundary',
    'retains a class constructor and parameter property',
    'Only struct constructors are removed; class constructor signatures survive.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class ConstructorBoundary {
  constructor(public readonly value: number);
}
`,
    'constructorBoundary'
  ),
  transform(
    'overload-signatures',
    'keeps overload parameter and return signatures distinct',
    'Only the decorated overload is rewritten; the other overload keeps identity.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class OverloadedMonitor {
  @Monitor('value') convert(value: string): number;
  convert(value: number): string;
}
`,
    'overloadSignatures'
  ),
  transform(
    'property-constructor-fidelity',
    'retains ordinary properties, construction, and a method',
    'Unrelated class members provide a signature-fidelity control group.',
    `export declare class SignatureModel {
  static readonly version: number;
  title?: string;
  constructor(title: string, version?: number);
  describe(prefix: string): string;
}
`,
    'propertyConstructorFidelity'
  ),
  transform(
    'accessor-boundary',
    'does not treat a getter as a MethodDeclaration',
    'Accessor decorators and return types must remain unchanged.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class AccessorBoundary {
  @Monitor('value') get current(): number;
}
`,
    'accessorBoundary'
  ),
  transform(
    'struct-monitor',
    'uses ohos-typescript StructDeclaration and removes its constructor',
    'This ArkTS-only boundary fails if ordinary TypeScript is substituted.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
import { ComponentV2 } from '@ohos.arkui.component';
@ComponentV2
export struct Card {
  @Monitor('count') onChange(): void;
  constructor(value: number) {}
}
`,
    'structMonitor'
  ),
  transform(
    'local-monitor-shadow',
    'does not import over a locally declared Monitor symbol',
    'The real TypeChecker identifies a same-file declaration and suppresses insertion.',
    `declare function Monitor(...paths: string[]): void;
export declare class LocalMonitor {
  @Monitor('value') onChange(): void;
}
`,
    'localMonitorShadow'
  ),
  transform(
    'auto-monitor-import',
    'adds Monitor from the state-management module',
    'An unresolved global Monitor requires exactly one generated named import.',
    `export declare class AutoImportMonitor {
  @Monitor('value') onChange(): void;
}
`,
    'autoMonitorImport'
  ),
  transform(
    'existing-state-import',
    'does not duplicate an existing state-management import',
    'Monitor and Watch retain their original source and specifier order.',
    `import { Monitor, Watch } from '@ohos.arkui.stateManagement';
export declare class ExistingImportMonitor {
  @Monitor('count')
  @Watch('other')
  onChange(): void;
}
`,
    'existingStateImport'
  ),
  transform(
    'dynamic-origin',
    'preserves an explicit dynamic GlobalAnnotation import origin',
    'Existing interop imports must not be replaced by a state-management import.',
    `import { Monitor } from 'dynamic/@ohos.arkui.GlobalAnnotation';
export declare class DynamicOriginMonitor {
  @Monitor('value') onChange(): void;
}
`,
    'dynamicOrigin'
  ),
  transform(
    'relative-origin',
    'preserves a resolved relative Monitor import origin',
    'TypeChecker alias resolution and imported-name collection prevent a second import.',
    `import { Monitor } from './monitor_decorator';
export declare class RelativeOriginMonitor {
  @Monitor('value') onChange(): void;
}
`,
    'relativeOrigin',
    {
      auxiliaryFiles: {
        'monitor_decorator.d.ts': 'export declare function Monitor(...paths: string[]): void;\n'
      }
    }
  ),
  transform(
    'directive-import-position',
    'inserts the generated import after a directive prologue',
    'The insertion algorithm must not move the use-static directive.',
    `'use static';
export declare class DirectiveMonitor {
  @Monitor('value') onChange(): void;
}
`,
    'directivePosition'
  ),
  transform(
    'call-expression-argument',
    'preserves a CallExpression inside the new Monitor array',
    'Expression node type is asserted instead of accepting text-only conversion.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare function getPath(): string;
export declare class CallArgumentMonitor {
  @Monitor(getPath()) onChange(): void;
}
`,
    'callArgument'
  ),
  transform(
    'property-access-argument',
    'preserves a PropertyAccessExpression Monitor argument',
    'Property access must become one array element without flattening.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare const paths: { current: string };
export declare class PropertyArgumentMonitor {
  @Monitor(paths.current) onChange(): void;
}
`,
    'propertyAccessArgument'
  ),
  transform(
    'binary-expression-argument',
    'preserves a BinaryExpression Monitor argument',
    'The complete binary expression remains one ordered array element.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
declare const suffix: string;
export declare class BinaryArgumentMonitor {
  @Monitor('count' + suffix) onChange(): void;
}
`,
    'binaryArgument'
  ),
  transform(
    'multiple-methods',
    'isolates rewrites between methods on one class',
    'Each decorator owns its argument list; Watch remains an identity control.',
    `import { Monitor, Watch } from '@ohos.arkui.stateManagement';
export declare class MultipleMethods {
  @Monitor('first') first(): void;
  @Monitor('second', 'third') second(): void;
  @Watch('third') third(): void;
}
`,
    'multipleMethods'
  ),
  transform(
    'multiple-classes',
    'shares one generated import across multiple classes',
    'Repeated Monitor usage must not duplicate the module import.',
    `export declare class FirstMonitor {
  @Monitor('first') onChange(): void;
}
export declare class SecondMonitor {
  @Monitor('second') onChange(): void;
}
`,
    'multipleClasses'
  ),
  transform(
    'no-monitor-untouched',
    'keeps a fully annotated plain method identical',
    'The no-op path guards against unrelated signature reconstruction.',
    `export declare class PlainSignature {
  onChange(value: number): void;
}
`,
    'noMonitorUntouched'
  ),
  transform(
    'sync-monitor-distinction',
    'does not apply Monitor rewriting to SyncMonitor',
    'SyncMonitor is a separate decorator and remains unchanged.',
    `import { SyncMonitor } from '@ohos.arkui.stateManagement';
export declare class SyncOnly {
  @SyncMonitor('count') onChange(): void;
}
`,
    'syncMonitor'
  ),
  transform(
    'monitor-array-and-positional',
    'wraps mixed array and positional Monitor arguments once',
    'Two arguments disable the idempotent fast path and require nested array assertions.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class MixedArrayMonitor {
  @Monitor(['first', 'second'], 'third') onChange(): void;
}
`,
    'monitorArrayAndPositional'
  ),
  transform(
    'monitor-spread-array-literal',
    'preserves an array literal inside a spread Monitor argument',
    'The new outer array and the original inner array have distinct AST roles.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class SpreadArrayMonitor {
  @Monitor(...['first', 'second']) onChange(): void;
}
`,
    'monitorSpreadArrayLiteral'
  ),
  transform(
    'monitor-array-static-async',
    'keeps modifiers when an existing array needs no rewrite',
    'The idempotent control proves modifier loss is specific to actual Monitor wrapping.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class ArrayAsyncMonitor {
  @Monitor(['value']) public static async load(value?: string): Promise<number>;
}
`,
    'monitorArrayStaticAsync'
  ),
  declarationEmit(
    'emit-primitive-inference',
    'uses declaration emit for primitive return inference',
    'afterDeclarations captures boolean, number, and string inferred by ohos-typescript.',
    `export class PrimitiveInference {
  isPositive(value: number) { return value > 0; }
  double(value: number) { return value * 2; }
  label(value: number) { return value.toString(); }
}
`,
    'emitPrimitiveInference'
  ),
  declarationEmit(
    'emit-promise-inference',
    'uses declaration emit for static async Promise inference',
    'Declaration emit intentionally keeps static and Promise while omitting async.',
    `export class PromiseInference {
  static async load(value?: number) { return String(value); }
}
`,
    'emitPromiseInference'
  ),
  declarationEmit(
    'emit-generic-optional',
    'uses declaration emit for generic optional parameters',
    'Captured declaration AST preserves class and method type parameters.',
    `export class GenericInference<T> {
  convert<U extends T>(value: T, fallback?: U): U {
    return fallback === undefined ? value as U : fallback;
  }
}
`,
    'emitGenericOptional'
  ),
  declarationEmit(
    'emit-property-constructor',
    'uses declaration emit for property and constructor fidelity',
    'Real declaration emit removes initializers but retains public signatures.',
    `export class EmittedModel {
  static readonly version: number = 1;
  title?: string;
  constructor(title: string, version?: number) {
    this.title = title;
  }
}
`,
    'emitPropertyConstructor'
  ),
  declarationEmit(
    'emit-overloads',
    'uses declaration emit for overload signature fidelity',
    'Only public overload signatures are emitted, with distinct parameter and return types.',
    `export class EmittedOverloads {
  convert(value: string): number;
  convert(value: number): string;
  convert(value: string | number): string | number {
    return typeof value === 'string' ? value.length : String(value);
  }
}
`,
    'emitOverloads'
  ),
  declarationEmit(
    'emit-function-interface',
    'uses declaration emit for function and MethodSignature boundaries',
    'FunctionDeclaration inference and interface signatures remain distinct.',
    `export function score(value: number) { return value * 2; }
export interface EmittedContract {
  convert(input: string): number;
}
`,
    'emitFunctionInterface'
  ),
  declgen(
    'declgen-monitor-basic',
    'runs Monitor conversion through DeclfileProductor after-declaration',
    'Real Declgen runs uiPlugin, emits a mapped d.ets file, and preserves Watch.',
    `import { Monitor, Watch } from '@ohos.arkui.stateManagement';
export declare class DeclgenMonitor {
  @Monitor('count') single(): void;
  @Monitor('first', 'second') multiple(): void;
  @Monitor(['already', 'array']) array(): void;
  @Watch('count') watched(): void;
}
`,
    'declgenMonitorBasic'
  ),
  declgen(
    'declgen-static-async',
    'checks modifier fidelity in the real after-declaration integration',
    'Known production regression is reproduced through DeclfileProductor, not a mock.',
    `import { Monitor } from '@ohos.arkui.stateManagement';
export declare class DeclgenAsyncMonitor {
  @Monitor('value') public static async load(value?: string): Promise<number>;
}
`,
    'declgenStaticAsync'
  ),
  declgen(
    'declgen-source-inference',
    'runs source return inference through real DeclfileProductor',
    'Actual source input verifies inferred declaration types and the final artifact path.',
    `export class DeclgenInference {
  isPositive(value: number) { return value > 0; }
  double(value: number) { return value * 2; }
  convert<T>(value: T, fallback?: T): T {
    return fallback === undefined ? value : fallback;
  }
}
`,
    'declgenSourceInference',
    { fileName: 'declgen-source-inference.ets' }
  )
];

module.exports = {
  SOURCE_CASES
};
