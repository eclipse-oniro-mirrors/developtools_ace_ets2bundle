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

const fixtures = [
  {
    id: 'numeric-parameter-domain',
    boundary: 'The generated numeric parameter domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: string): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'string-parameter-domain',
    boundary: 'The generated string parameter domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: string) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: string): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'boolean-parameter-domain',
    boundary: 'The generated boolean parameter domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: boolean) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: boolean): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'boolean'
      ]
    }
  },
  {
    id: 'required-parameter-count',
    boundary: 'The generated required parameter count callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'not assignable',
        'Render'
      ]
    }
  },
  {
    id: 'second-required-parameter',
    boundary: 'The generated second required parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number, label: string): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'not assignable',
        'Render'
      ]
    }
  },
  {
    id: 'optional-parameter-contravariance',
    boundary: 'The generated optional parameter contravariance callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value?: number) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value?: number): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'undefined',
        'number'
      ]
    }
  },
  {
    id: 'nullable-parameter-contravariance',
    boundary: 'The generated nullable parameter contravariance callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number | null) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number | null): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'null',
        'number'
      ]
    }
  },
  {
    id: 'undefined-parameter-contravariance',
    boundary: 'The generated undefined parameter contravariance callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: string | undefined) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: string): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: string | undefined): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'undefined',
        'string'
      ]
    }
  },
  {
    id: 'union-parameter-contravariance',
    boundary: 'The generated union parameter contravariance callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: string | number) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: string): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: string | number): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'literal-parameter-contravariance',
    boundary: 'The generated literal parameter contravariance callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: string) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: 'ready'): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: string): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'ready'
      ]
    }
  },
  {
    id: 'numeric-array-parameter',
    boundary: 'The generated numeric array parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (values: number[]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((values: string[]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((values: number[]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string[]',
        'number[]'
      ]
    }
  },
  {
    id: 'readonly-array-parameter',
    boundary: 'The generated readonly array parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (values: readonly number[]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((values: number[]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((values: readonly number[]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'readonly',
        'number[]'
      ]
    }
  },
  {
    id: 'nested-array-parameter',
    boundary: 'The generated nested array parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (values: number[][]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((values: number[]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((values: number[][]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number[][]',
        'number[]'
      ]
    }
  },
  {
    id: 'tuple-position-parameter',
    boundary: 'The generated tuple position parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: [number, string]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: [string, number]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: [number, string]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'tuple-required-tail',
    boundary: 'The generated tuple required tail callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: [number, string?]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: [number, string]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: [number, string?]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'undefined',
        'string'
      ]
    }
  },
  {
    id: 'rest-element-parameter',
    boundary: 'The generated rest element parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (...values: number[]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((...values: string[]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((...values: number[]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'rest-fixed-prefix',
    boundary: 'The generated rest fixed prefix callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (label: string, ...values: number[]) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((label: number, ...values: number[]): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((label: string, ...values: number[]): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'string-result-domain',
    boundary: 'The generated string result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => string;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): number => value);
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): string => value.toString());
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'number-result-domain',
    boundary: 'The generated number result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: string) => number;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: string): string => value);
`,
    validConsumer: `import { accept } from 'generated';

accept((value: string): number => value.length);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'boolean-result-domain',
    boundary: 'The generated boolean result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => boolean;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): number => value);
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): boolean => value > 0);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'boolean'
      ]
    }
  },
  {
    id: 'nullable-result-domain',
    boundary: 'The generated nullable result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => string | null;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): number => 1);
`,
    validConsumer: `import { accept } from 'generated';

accept((): string | null => null);
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 22,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'undefined-result-domain',
    boundary: 'The generated undefined result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => number | undefined;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): string => 'bad');
`,
    validConsumer: `import { accept } from 'generated';

accept((): number | undefined => undefined);
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 22,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'nonnull-result-domain',
    boundary: 'The generated nonnull result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => number;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): number | null => null);
`,
    validConsumer: `import { accept } from 'generated';

accept((): number => 1);
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 29,
      fragments: [
        'null',
        'number'
      ]
    }
  },
  {
    id: 'promise-result-domain',
    boundary: 'The generated promise result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => Promise<number>;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): Promise<string> => Promise.resolve('bad'));
`,
    validConsumer: `import { accept } from 'generated';

accept((): Promise<number> => Promise.resolve(1));
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 31,
      fragments: [
        'Promise<string>',
        'Promise<number>'
      ]
    }
  },
  {
    id: 'array-result-domain',
    boundary: 'The generated array result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => number[];
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): string[] => ['bad']);
`,
    validConsumer: `import { accept } from 'generated';

accept((): number[] => [1]);
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 25,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'tuple-result-domain',
    boundary: 'The generated tuple result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => [number, string];
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): [string, number] => ['bad', 1]);
`,
    validConsumer: `import { accept } from 'generated';

accept((): [number, string] => [1, 'ready']);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ],
      diagnostics: [
        {
          code: 2322,
          file: 'Consumer.ets',
          line: 3,
          column: 33,
          fragments: [
            'string',
            'number'
          ]
        },
        {
          code: 2322,
          file: 'Consumer.ets',
          line: 3,
          column: 40,
          fragments: [
            'number',
            'string'
          ]
        }
      ]
    }
  },
  {
    id: 'nested-callback-result',
    boundary: 'The generated nested callback result callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => (value: number) => string;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): ((value: string) => string) => (value: string): string => value);
`,
    validConsumer: `import { accept } from 'generated';

accept((): ((value: number) => string) => (value: number): string => value.toString());
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 43,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'generic-callback-domain',
    boundary: 'The generated generic callback domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = <T>(value: T) => T;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): number => value);
`,
    validConsumer: `import { accept } from 'generated';

accept(<T>(value: T): T => value);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'T',
        'number'
      ]
    }
  },
  {
    id: 'generic-array-callback',
    boundary: 'The generated generic array callback callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = <T>(values: T[]) => T[];
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((values: number[]): number[] => values);
`,
    validConsumer: `import { accept } from 'generated';

accept(<T>(values: T[]): T[] => values);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'T',
        'number'
      ]
    }
  },
  {
    id: 'object-parameter-domain',
    boundary: 'The generated object parameter domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export interface Payload { count: number; }
export interface Other { title: string; }
export type Render = (value: Payload) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept, Payload, Other } from 'generated';

accept((value: Other): void => {});
`,
    validConsumer: `import { accept, Payload, Other } from 'generated';

accept((value: Payload): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'title',
        'Payload',
        'Other'
      ]
    }
  },
  {
    id: 'object-result-domain',
    boundary: 'The generated object result domain callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export interface Payload { count: number; }
export interface Other { title: string; }
export type Render = () => Payload;
export function accept(render: Render): void {}
`,
    consumer: `import { accept, Payload, Other } from 'generated';

accept((): Other => ({ title: 'bad' }));
`,
    validConsumer: `import { accept, Payload, Other } from 'generated';

accept((): Payload => ({ count: 1 }));
`,
    expected: {
      code: 2741,
      file: 'Consumer.ets',
      line: 3,
      column: 21,
      fragments: [
        'count',
        'Other'
      ]
    }
  },
  {
    id: 'record-value-parameter',
    boundary: 'The generated record value parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: Record<string, number>) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: Record<string, string>): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: Record<string, number>): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'record-value-result',
    boundary: 'The generated record value result callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = () => Record<string, number>;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((): Record<string, string> => ({ ready: 'bad' }));
`,
    validConsumer: `import { accept } from 'generated';

accept((): Record<string, number> => ({ ready: 1 }));
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 41,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'optional-property-parameter',
    boundary: 'The generated optional property parameter callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export interface Payload { count?: number; }
export interface RequiredPayload { count: number; }
export type Render = (value: Payload) => void;
export function accept(render: Render): void {}
`,
    consumer: `import { accept, Payload, RequiredPayload } from 'generated';

accept((value: RequiredPayload): void => {});
`,
    validConsumer: `import { accept, Payload, RequiredPayload } from 'generated';

accept((value: Payload): void => {});
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number | undefined',
        'RequiredPayload'
      ]
    }
  },
  {
    id: 'builder-slot-number-result',
    boundary: 'The generated builder slot number result callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => string;
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): void => {});
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): string => value.toString());
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'void',
        'string'
      ]
    }
  },
  {
    id: 'builder-slot-result-function',
    boundary: 'The generated builder slot result function callback contract rejects the incompatible function while its repaired callback is accepted.',
    mode: 'emit',
    source: `export type Render = (value: number) => (() => string);
export function accept(render: Render): void {}
`,
    consumer: `import { accept } from 'generated';

accept((value: number): (() => number) => (): number => value);
`,
    validConsumer: `import { accept } from 'generated';

accept((value: number): (() => string) => (): string => value.toString());
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'slot-call-too-few',
    boundary: 'The emitted Builder-like method enforces slot call too few.',
    mode: 'emit',
    source: `export interface Slot {
  render(value: number, label: string): string;
}
export function requireSlot(slot: Slot): void {}
`,
    consumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1);
`,
    validConsumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 'ready');
`,
    expected: {
      code: 2554,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'Expected 2 arguments',
        'got 1'
      ]
    }
  },
  {
    id: 'slot-call-too-many',
    boundary: 'The emitted Builder-like method enforces slot call too many.',
    mode: 'emit',
    source: `export interface Slot {
  render(value: number, label: string): string;
}
export function requireSlot(slot: Slot): void {}
`,
    consumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 'ready', true);
`,
    validConsumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 'ready');
`,
    expected: {
      code: 2554,
      file: 'Consumer.ets',
      line: 3,
      column: 25,
      fragments: [
        'Expected 2 arguments',
        'got 3'
      ]
    }
  },
  {
    id: 'slot-first-argument-domain',
    boundary: 'The emitted Builder-like method enforces slot first argument domain.',
    mode: 'emit',
    source: `export interface Slot {
  render(value: number, label: string): string;
}
export function requireSlot(slot: Slot): void {}
`,
    consumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render('bad', 'ready');
`,
    validConsumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 'ready');
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 13,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'slot-second-argument-domain',
    boundary: 'The emitted Builder-like method enforces slot second argument domain.',
    mode: 'emit',
    source: `export interface Slot {
  render(value: number, label: string): string;
}
export function requireSlot(slot: Slot): void {}
`,
    consumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 2);
`,
    validConsumer: `import { Slot } from 'generated';
declare const slot: Slot;
slot.render(1, 'ready');
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 16,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'slot-result-assignment',
    boundary: 'The emitted Builder-like method enforces slot result assignment.',
    mode: 'emit',
    source: `export interface Slot {
  render(value: number, label: string): string;
}
export function requireSlot(slot: Slot): void {}
`,
    consumer: `import { Slot } from 'generated';
declare const slot: Slot;
const result: number = slot.render(1, 'ready');
`,
    validConsumer: `import { Slot } from 'generated';
declare const slot: Slot;
const result: string = slot.render(1, 'ready');
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'slot-property-required',
    boundary: 'An emitted callback property rejects the slot property required mismatch.',
    mode: 'emit',
    source: `export interface Options {
  content: (value: number) => string;
}
export function requireOptions(options: Options): void {}
`,
    consumer: `import { requireOptions } from 'generated';

requireOptions({});
`,
    validConsumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: number): string => value.toString() });
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 16,
      fragments: [
        'content',
        'missing'
      ]
    }
  },
  {
    id: 'slot-property-callable',
    boundary: 'An emitted callback property rejects the slot property callable mismatch.',
    mode: 'emit',
    source: `export interface Options {
  content: (value: number) => string;
}
export function requireOptions(options: Options): void {}
`,
    consumer: `import { requireOptions } from 'generated';

requireOptions({ content: 1 });
`,
    validConsumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: number): string => value.toString() });
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 18,
      fragments: [
        'number',
        'assignable'
      ]
    }
  },
  {
    id: 'slot-property-parameter',
    boundary: 'An emitted callback property rejects the slot property parameter mismatch.',
    mode: 'emit',
    source: `export interface Options {
  content: (value: number) => string;
}
export function requireOptions(options: Options): void {}
`,
    consumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: string): string => value });
`,
    validConsumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: number): string => value.toString() });
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 18,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'slot-property-result',
    boundary: 'An emitted callback property rejects the slot property result mismatch.',
    mode: 'emit',
    source: `export interface Options {
  content: (value: number) => string;
}
export function requireOptions(options: Options): void {}
`,
    consumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: number): number => value });
`,
    validConsumer: `import { requireOptions } from 'generated';

requireOptions({ content: (value: number): string => value.toString() });
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 18,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'callback-call-argument-missing',
    boundary: 'The exported callback invoker enforces callback call argument missing.',
    mode: 'emit',
    source: `export function invoke(callback: (value: number) => string, value: number): string { return callback(value); }
`,
    consumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString());
`,
    validConsumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString(), 1);
`,
    expected: {
      code: 2554,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'Expected 2 arguments',
        'got 1'
      ]
    }
  },
  {
    id: 'callback-call-argument-excess',
    boundary: 'The exported callback invoker enforces callback call argument excess.',
    mode: 'emit',
    source: `export function invoke(callback: (value: number) => string, value: number): string { return callback(value); }
`,
    consumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString(), 1, 2);
`,
    validConsumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString(), 1);
`,
    expected: {
      code: 2554,
      file: 'Consumer.ets',
      line: 3,
      column: 56,
      fragments: [
        'Expected 2 arguments',
        'got 3'
      ]
    }
  },
  {
    id: 'callback-value-not-callable',
    boundary: 'The exported callback invoker enforces callback value not callable.',
    mode: 'emit',
    source: `export function invoke(callback: (value: number) => string, value: number): string { return callback(value); }
`,
    consumer: `import { invoke } from 'generated';

invoke(1, 2);
`,
    validConsumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString(), 1);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'assignable'
      ]
    }
  },
  {
    id: 'callback-argument-order',
    boundary: 'The exported callback invoker enforces callback argument order.',
    mode: 'emit',
    source: `export function invoke(callback: (value: number) => string, value: number): string { return callback(value); }
`,
    consumer: `import { invoke } from 'generated';

invoke(1, (value: number): string => value.toString());
`,
    validConsumer: `import { invoke } from 'generated';

invoke((value: number): string => value.toString(), 1);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 8,
      fragments: [
        'number',
        'assignable'
      ]
    }
  },
  {
    id: 'optional-slot-requires-guard',
    boundary: 'A potentially absent generated callback requires an explicit guard at its call site.',
    mode: 'emit',
    source: `export interface Options { onValue?: () => void; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
if (options.onValue) { options.onValue(); }
`,
    expected: {
      code: 2722,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'undefined'
      ]
    }
  },
  {
    id: 'nullable-slot-requires-guard',
    boundary: 'A potentially absent generated callback requires an explicit guard at its call site.',
    mode: 'emit',
    source: `export interface Options { onValue: (() => void) | null; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
if (options.onValue) { options.onValue(); }
`,
    expected: {
      code: 2721,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'null'
      ]
    }
  },
  {
    id: 'nullable-optional-slot-requires-guard',
    boundary: 'A potentially absent generated callback requires an explicit guard at its call site.',
    mode: 'emit',
    source: `export interface Options { onValue?: (() => void) | null; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
if (options.onValue) { options.onValue(); }
`,
    expected: {
      code: 2723,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'null'
      ]
    }
  },
  {
    id: 'numeric-slot-is-not-callable',
    boundary: 'A numeric public property cannot be invoked as a callback.',
    mode: 'emit',
    source: `export interface Options { onValue: number; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
const value: number = options.onValue;
`,
    expected: {
      code: 2349,
      file: 'Consumer.ets',
      line: 3,
      column: 9,
      fragments: [
        'callable'
      ]
    }
  },
  {
    id: 'union-slot-requires-narrowing',
    boundary: 'A union of a function and a numeric value requires narrowing before invocation.',
    mode: 'emit',
    source: `export interface Options { onValue: (() => void) | number; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
if (typeof options.onValue === 'function') { options.onValue(); }
`,
    expected: {
      code: 2349,
      file: 'Consumer.ets',
      line: 3,
      column: 9,
      fragments: [
        'callable'
      ]
    }
  },
  {
    id: 'readonly-slot-rejects-replacement',
    boundary: 'A readonly exported callback can be called while replacement remains forbidden.',
    mode: 'emit',
    source: `export interface Options { readonly onValue: () => void; }
`,
    consumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue = (): void => {};
`,
    validConsumer: `import { Options } from 'generated';
declare const options: Options;
options.onValue();
`,
    expected: {
      code: 2540,
      file: 'Consumer.ets',
      line: 3,
      column: 9,
      fragments: [
        'read-only',
        'onValue'
      ]
    }
  },
  {
    id: 'callback-this-context',
    boundary: 'A generated callback with an explicit receiver rejects a detached invocation.',
    mode: 'emit',
    source: `export interface Context { count: number; }
export function invoke(this: Context, value: number): void {}
`,
    consumer: `import { invoke } from 'generated';

invoke(1);
`,
    validConsumer: `import { invoke } from 'generated';

invoke.call({ count: 1 }, 1);
`,
    expected: {
      code: 2684,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'this',
        'Context'
      ]
    }
  },
  {
    id: 'async-callback-result-domain',
    boundary: 'An asynchronous callback result retains its Promise element type.',
    mode: 'emit',
    source: `export function create(): Promise<number> { return Promise.resolve(1); }
`,
    consumer: `import { create } from 'generated';

const result: Promise<string> = create();
`,
    validConsumer: `import { create } from 'generated';

const result: Promise<number> = create();
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'Promise<number>',
        'Promise<string>'
      ]
    }
  },
  {
    id: 'private-builder-method-access',
    boundary: 'An emitted private Builder-like method remains inaccessible to an external caller.',
    mode: 'emit',
    source: `export class Slots {
 private render(value: number): void {}
 start(): void {}
}
`,
    consumer: `import { Slots } from 'generated';
const slot = new Slots();
slot.render(1);
`,
    validConsumer: `import { Slots } from 'generated';
const slot = new Slots();
slot.start();
`,
    expected: {
      code: 2341,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'private',
        'render'
      ]
    }
  },
  {
    id: 'protected-builder-method-access',
    boundary: 'An emitted protected Builder-like method remains inaccessible to an external caller.',
    mode: 'emit',
    source: `export class Slots {
 protected render(value: number): void {}
 start(): void {}
}
`,
    consumer: `import { Slots } from 'generated';
const slot = new Slots();
slot.render(1);
`,
    validConsumer: `import { Slots } from 'generated';
const slot = new Slots();
slot.start();
`,
    expected: {
      code: 2445,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'protected',
        'render'
      ]
    }
  }
];

module.exports = { fixtures };
