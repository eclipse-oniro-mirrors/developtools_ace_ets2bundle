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
    id: 'missing-class-export',
    boundary: 'The generated class module rejects a nonexistent named class while a repaired import resolves.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { AbsentClass } from 'generated';

`,
    validConsumer: `import { CardModel } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'AbsentClass'
      ]
    }
  },
  {
    id: 'missing-interface-export',
    boundary: 'An absent public interface is diagnosed at its import specifier.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { AbsentOptions } from 'generated';

`,
    validConsumer: `import { CardOptions } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'AbsentOptions'
      ]
    }
  },
  {
    id: 'missing-function-export',
    boundary: 'A nonexistent public factory is rejected before any call can be emitted.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { AbsentFactory } from 'generated';

`,
    validConsumer: `import { makeCard } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'AbsentFactory'
      ]
    }
  },
  {
    id: 'missing-alias-export',
    boundary: 'A generated type alias exposes only its declared export identity.',
    mode: 'emit',
    source: `export type Payload = number[];
`,
    consumer: `import { AbsentPayload } from 'generated';

`,
    validConsumer: `import { Payload } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'AbsentPayload'
      ]
    }
  },
  {
    id: 'missing-enum-export',
    boundary: 'A nonexistent enum export is not accepted through the generated declaration.',
    mode: 'emit',
    source: `export enum Choice { First, Second }
`,
    consumer: `import { AbsentChoice } from 'generated';

`,
    validConsumer: `import { Choice } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'AbsentChoice'
      ]
    }
  },
  {
    id: 'unexported-helper',
    boundary: 'An implementation-only helper does not become a public export during declaration emission.',
    mode: 'emit',
    source: `class HiddenModel { value: number = 1; }
export class VisibleModel { value: number = 2; }
`,
    consumer: `import { HiddenModel } from 'generated';

`,
    validConsumer: `import { VisibleModel } from 'generated';

`,
    expected: {
      code: 2305,
      file: 'Consumer.ets',
      line: 1,
      column: 10,
      fragments: [
        'has no exported member',
        'HiddenModel'
      ]
    }
  },
  {
    id: 'class-alias-retains-property-type',
    boundary: 'A renamed class import keeps the original numeric field type.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardModel as PublicCard } from 'generated';
const card = new PublicCard();
card.count = 'bad';
`,
    validConsumer: `import { CardModel as PublicCard } from 'generated';
const card = new PublicCard();
card.count = 4;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'factory-result-retains-field-type',
    boundary: 'A generated factory return retains its class properties.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { makeCard } from 'generated';
const card = makeCard();
card.title = 4;
`,
    validConsumer: `import { makeCard } from 'generated';
const card = makeCard();
card.title = 'ready';
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'interface-required-field',
    boundary: 'A missing required field is diagnosed through the emitted interface.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardOptions } from 'generated';

const options: CardOptions = { count: 1 };
`,
    validConsumer: `import { CardOptions } from 'generated';

const options: CardOptions = { count: 1, title: 'ready' };
`,
    expected: {
      code: 2741,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'title',
        'missing'
      ]
    }
  },
  {
    id: 'interface-excess-field',
    boundary: 'An unknown object field cannot enter the emitted public options contract.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardOptions } from 'generated';

const options: CardOptions = { count: 1, title: 'ready', unexpected: true };
`,
    validConsumer: `import { CardOptions } from 'generated';

const options: CardOptions = { count: 1, title: 'ready' };
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 58,
      fragments: [
        'unexpected',
        'CardOptions'
      ]
    }
  },
  {
    id: 'factory-is-not-numeric-value',
    boundary: 'The function value and its return instance keep distinct public types.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { makeCard } from 'generated';

const count: number = makeCard;
`,
    validConsumer: `import { makeCard } from 'generated';

const count: number = makeCard().count;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'number'
      ]
    }
  },
  {
    id: 'interface-is-not-constructor',
    boundary: 'An interface export remains a type-only symbol at a construction site.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardOptions } from 'generated';

const options = new CardOptions();
`,
    validConsumer: `import { CardOptions } from 'generated';

const options: CardOptions = { count: 1, title: 'ready' };
`,
    expected: {
      code: 2693,
      file: 'Consumer.ets',
      line: 3,
      column: 21,
      fragments: [
        'only refers to a type',
        'CardOptions'
      ]
    }
  },
  {
    id: 'type-alias-is-not-constructor',
    boundary: 'A type alias cannot be called as a runtime class after generation.',
    mode: 'emit',
    source: `export type Payload = { count: number };
`,
    consumer: `import { Payload } from 'generated';

const value = new Payload();
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = { count: 1 };
`,
    expected: {
      code: 2693,
      file: 'Consumer.ets',
      line: 3,
      column: 19,
      fragments: [
        'only refers to a type',
        'Payload'
      ]
    }
  },
  {
    id: 'type-only-class-cannot-construct',
    boundary: 'An explicit type-only class import is rejected when used as a value.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import type { CardModel } from 'generated';

const card = new CardModel();
`,
    validConsumer: `import type { CardModel } from 'generated';

let card: CardModel | undefined = undefined;
`,
    expected: {
      code: 1361,
      file: 'Consumer.ets',
      line: 3,
      column: 18,
      fragments: [
        'imported using',
        'import type'
      ]
    }
  },
  {
    id: 'type-only-enum-cannot-read-member',
    boundary: 'An explicit type-only enum import cannot supply a runtime member.',
    mode: 'emit',
    source: `export enum Choice { First, Second }
`,
    consumer: `import type { Choice } from 'generated';

const choice = Choice.First;
`,
    validConsumer: `import type { Choice } from 'generated';

let choice: Choice | undefined = undefined;
`,
    expected: {
      code: 1361,
      file: 'Consumer.ets',
      line: 3,
      column: 16,
      fragments: [
        'imported using',
        'import type'
      ]
    }
  },
  {
    id: 'namespace-missing-member',
    boundary: 'A namespace import retains the generated module member set.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import * as cards from 'generated';

const value = cards.AbsentValue;
`,
    validConsumer: `import * as cards from 'generated';

const value = cards.makeCard();
`,
    expected: {
      code: 2339,
      file: 'Consumer.ets',
      line: 3,
      column: 21,
      fragments: [
        'AbsentValue',
        'does not exist'
      ]
    }
  },
  {
    id: 'class-missing-member',
    boundary: 'A generated class instance does not acquire undeclared fields.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardModel } from 'generated';
const card = new CardModel();
const value = card.absentValue;
`,
    validConsumer: `import { CardModel } from 'generated';
const card = new CardModel();
const value = card.count;
`,
    expected: {
      code: 2339,
      file: 'Consumer.ets',
      line: 3,
      column: 20,
      fragments: [
        'absentValue',
        'does not exist'
      ]
    }
  },
  {
    id: 'instance-member-is-not-static',
    boundary: 'Instance members remain unavailable on the generated constructor.',
    mode: 'emit',
    source: `export class CardModel {
  count: number = 0;
  title: string = 'card';
  enabled: boolean = true;
}
export interface CardOptions {
  count: number;
  title: string;
}
export function makeCard(): CardModel {
  return new CardModel();
}
`,
    consumer: `import { CardModel } from 'generated';

const count = CardModel.count;
`,
    validConsumer: `import { CardModel } from 'generated';

const count = new CardModel().count;
`,
    expected: {
      code: 2339,
      file: 'Consumer.ets',
      line: 3,
      column: 25,
      fragments: [
        'count',
        'does not exist'
      ]
    }
  },
  {
    id: 'static-member-is-not-instance',
    boundary: 'A static public field remains owned by the constructor.',
    mode: 'emit',
    source: `export class Card {
  static count: number = 1;
}
`,
    consumer: `import { Card } from 'generated';

const count = new Card().count;
`,
    validConsumer: `import { Card } from 'generated';

const count = Card.count;
`,
    expected: {
      code: 2576,
      file: 'Consumer.ets',
      line: 3,
      column: 26,
      fragments: [
        'static member',
        'count'
      ]
    }
  },
  {
    id: 'private-instance-field',
    boundary: 'Generated access modifiers are enforced at the external private instance field use site.',
    mode: 'emit',
    source: `export class Card {
  private secret: number = 1;
  read(): number { return 1; }
}
`,
    consumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.secret;
`,
    validConsumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.read();
`,
    expected: {
      code: 2341,
      file: 'Consumer.ets',
      line: 3,
      column: 20,
      fragments: [
        'private',
        'secret'
      ]
    }
  },
  {
    id: 'protected-instance-field',
    boundary: 'Generated access modifiers are enforced at the external protected instance field use site.',
    mode: 'emit',
    source: `export class Card {
  protected secret: number = 1;
  read(): number { return 1; }
}
`,
    consumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.secret;
`,
    validConsumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.read();
`,
    expected: {
      code: 2445,
      file: 'Consumer.ets',
      line: 3,
      column: 20,
      fragments: [
        'protected',
        'secret'
      ]
    }
  },
  {
    id: 'readonly-instance-field',
    boundary: 'Generated access modifiers are enforced at the external readonly instance field use site.',
    mode: 'emit',
    source: `export class Card {
  readonly count: number = 1;
  read(): number { return 1; }
}
`,
    consumer: `import { Card } from 'generated';
declare const card: Card;
card.count = 2;
`,
    validConsumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.count;
`,
    expected: {
      code: 2540,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'read-only',
        'count'
      ]
    }
  },
  {
    id: 'readonly-interface-field',
    boundary: 'Generated access modifiers are enforced at the external readonly interface field use site.',
    mode: 'emit',
    source: `export interface Card { readonly count: number; }
`,
    consumer: `import { Card } from 'generated';
declare const card: Card;
card.count = 2;
`,
    validConsumer: `import { Card } from 'generated';
declare const card: Card;
const value = card.count;
`,
    expected: {
      code: 2540,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'read-only',
        'count'
      ]
    }
  },
  {
    id: 'private-constructor',
    boundary: 'A private constructor remains inaccessible to an external caller.',
    mode: 'emit',
    source: `export class Card {
 private constructor() {}
 static make(): Card { return new Card(); }
}
`,
    consumer: `import { Card } from 'generated';

const value = new Card();
`,
    validConsumer: `import { Card } from 'generated';

const value = Card.make();
`,
    expected: {
      code: 2673,
      file: 'Consumer.ets',
      line: 3,
      column: 15,
      fragments: [
        'private',
        'Constructor'
      ]
    }
  },
  {
    id: 'abstract-class-construction',
    boundary: 'An abstract class remains non-instantiable after declaration emission.',
    mode: 'emit',
    source: `export abstract class Card { abstract read(): number; }
`,
    consumer: `import { Card } from 'generated';

const value = new Card();
`,
    validConsumer: `import { Card } from 'generated';

declare const value: Card;
`,
    expected: {
      code: 2511,
      file: 'Consumer.ets',
      line: 3,
      column: 15,
      fragments: [
        'abstract class'
      ]
    }
  },
  {
    id: 'literal-string-domain',
    boundary: 'The generated literal string domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = 'ready' | 'busy';
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = 'unknown';
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = 'ready';
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'unknown'
      ]
    }
  },
  {
    id: 'literal-number-domain',
    boundary: 'The generated literal number domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = 1 | 2;
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = 3;
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = 1;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        '3'
      ]
    }
  },
  {
    id: 'literal-boolean-domain',
    boundary: 'The generated literal boolean domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = true;
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = false;
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = true;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'false'
      ]
    }
  },
  {
    id: 'nullable-string-domain',
    boundary: 'The generated nullable string domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = string | null;
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = 1;
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = null;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        '\'1\'',
        'Payload'
      ]
    }
  },
  {
    id: 'optional-number-domain',
    boundary: 'The generated optional number domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = number | undefined;
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = 'bad';
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = undefined;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'bad',
        'Payload'
      ]
    }
  },
  {
    id: 'array-element-domain',
    boundary: 'The generated array element domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = number[];
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = ['bad'];
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = [1];
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
    id: 'readonly-array-write-domain',
    boundary: 'The generated readonly array write domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = readonly number[];
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = ['bad'];
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = [1];
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
    id: 'tuple-position-domain',
    boundary: 'The generated tuple position domain rejects a value outside its public domain.',
    mode: 'emit',
    source: `export type Payload = [number, string];
`,
    consumer: `import { Payload } from 'generated';

const value: Payload = ['bad', 'ready'];
`,
    validConsumer: `import { Payload } from 'generated';

const value: Payload = [1, 'ready'];
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
    id: 'enum-unknown-member',
    boundary: 'A generated enum exposes exactly its original member names.',
    mode: 'emit',
    source: `export enum Choice { First = 1, Second = 2 }
`,
    consumer: `import { Choice } from 'generated';

const value = Choice.Absent;
`,
    validConsumer: `import { Choice } from 'generated';

const value = Choice.First;
`,
    expected: {
      code: 2339,
      file: 'Consumer.ets',
      line: 3,
      column: 22,
      fragments: [
        'Absent',
        'does not exist'
      ]
    }
  },
  {
    id: 'enum-nominal-type',
    boundary: 'Distinct exported enums retain separate nominal identities.',
    mode: 'emit',
    source: `export enum Choice { First = 1 }
export enum Other { First = 1 }
`,
    consumer: `import { Choice, Other } from 'generated';

const value: Choice = Other.First;
`,
    validConsumer: `import { Choice, Other } from 'generated';

const value: Choice = Choice.First;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'Other',
        'Choice'
      ]
    }
  },
  {
    id: 'generic-constraint-domain',
    boundary: 'Generated generics preserve the generic constraint domain at external consumption.',
    mode: 'emit',
    source: `export interface Box<T extends number> { value: T; }
`,
    consumer: `import { Box } from 'generated';

declare const value: Box<string>;
`,
    validConsumer: `import { Box } from 'generated';

declare const value: Box<number>;
`,
    expected: {
      code: 2344,
      file: 'Consumer.ets',
      line: 3,
      column: 26,
      fragments: [
        'constraint',
        'number'
      ]
    }
  },
  {
    id: 'generic-arity-missing',
    boundary: 'Generated generics preserve the generic arity missing at external consumption.',
    mode: 'emit',
    source: `export interface Box<T> { value: T; }
`,
    consumer: `import { Box } from 'generated';

declare const value: Box;
`,
    validConsumer: `import { Box } from 'generated';

declare const value: Box<number>;
`,
    expected: {
      code: 2314,
      file: 'Consumer.ets',
      line: 3,
      column: 22,
      fragments: [
        'requires 1 type argument'
      ]
    }
  },
  {
    id: 'generic-arity-excess',
    boundary: 'Generated generics preserve the generic arity excess at external consumption.',
    mode: 'emit',
    source: `export interface Box<T> { value: T; }
`,
    consumer: `import { Box } from 'generated';

declare const value: Box<number, string>;
`,
    validConsumer: `import { Box } from 'generated';

declare const value: Box<number>;
`,
    expected: {
      code: 2314,
      file: 'Consumer.ets',
      line: 3,
      column: 22,
      fragments: [
        'requires 1 type argument'
      ]
    }
  },
  {
    id: 'generic-default-domain',
    boundary: 'Generated generics preserve the generic default domain at external consumption.',
    mode: 'emit',
    source: `export interface Box<T = number> { value: T; }
`,
    consumer: `import { Box } from 'generated';

const value: Box = { value: 'bad' };
`,
    validConsumer: `import { Box } from 'generated';

const value: Box = { value: 1 };
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
    id: 'generic-nested-domain',
    boundary: 'Generated generics preserve the generic nested domain at external consumption.',
    mode: 'emit',
    source: `export interface Box<T> { value: T[]; }
`,
    consumer: `import { Box } from 'generated';

const box: Box<number> = { value: ['bad'] };
`,
    validConsumer: `import { Box } from 'generated';

const box: Box<number> = { value: [1] };
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 36,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'generic-method-domain',
    boundary: 'Generated generics preserve the generic method domain at external consumption.',
    mode: 'emit',
    source: `export interface Box { read<T>(value: T): T; }
`,
    consumer: `import { Box } from 'generated';
declare const box: Box;
const value: number = box.read<string>('bad');
`,
    validConsumer: `import { Box } from 'generated';
declare const box: Box;
const value: string = box.read<string>('ready');
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
    id: 'constructor-required-argument',
    boundary: 'An emitted constructor retains its required public parameter.',
    mode: 'emit',
    source: `export class Card {
 constructor(public count: number) {}
}
`,
    consumer: `import { Card } from 'generated';

const card = new Card();
`,
    validConsumer: `import { Card } from 'generated';

const card = new Card(1);
`,
    expected: {
      code: 2554,
      file: 'Consumer.ets',
      line: 3,
      column: 14,
      fragments: [
        'Expected 1 arguments',
        'got 0'
      ]
    }
  },
  {
    id: 'constructor-argument-type',
    boundary: 'The emitted constructor rejects a wrong primitive argument.',
    mode: 'emit',
    source: `export class Card {
 constructor(public count: number) {}
}
`,
    consumer: `import { Card } from 'generated';

const card = new Card('bad');
`,
    validConsumer: `import { Card } from 'generated';

const card = new Card(1);
`,
    expected: {
      code: 2345,
      file: 'Consumer.ets',
      line: 3,
      column: 23,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'getter-result-domain',
    boundary: 'A getter return type remains visible through its emitted accessor.',
    mode: 'emit',
    source: `export class Card {
 get count(): number { return 1; }
}
`,
    consumer: `import { Card } from 'generated';

const value: string = new Card().count;
`,
    validConsumer: `import { Card } from 'generated';

const value: number = new Card().count;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 7,
      fragments: [
        'number',
        'string'
      ]
    }
  },
  {
    id: 'setter-argument-domain',
    boundary: 'A setter input type is checked through the generated accessor pair.',
    mode: 'emit',
    source: `export class Card {
 get count(): number { return 1; }
 set count(value: number) {}
}
`,
    consumer: `import { Card } from 'generated';
const card = new Card();
card.count = 'bad';
`,
    validConsumer: `import { Card } from 'generated';
const card = new Card();
card.count = 1;
`,
    expected: {
      code: 2322,
      file: 'Consumer.ets',
      line: 3,
      column: 1,
      fragments: [
        'string',
        'number'
      ]
    }
  },
  {
    id: 'readonly-getter-write',
    boundary: 'A getter without a setter remains a readonly external property.',
    mode: 'emit',
    source: `export class Card {
 get count(): number { return 1; }
}
`,
    consumer: `import { Card } from 'generated';
const card = new Card();
card.count = 2;
`,
    validConsumer: `import { Card } from 'generated';
const card = new Card();
const value = card.count;
`,
    expected: {
      code: 2540,
      file: 'Consumer.ets',
      line: 3,
      column: 6,
      fragments: [
        'read-only',
        'count'
      ]
    }
  },
  {
    id: 'overload-no-matching-signature',
    boundary: 'An emitted overload set rejects a third primitive domain.',
    mode: 'emit',
    source: `export function convert(value: number): number;
export function convert(value: string): string;
export function convert(value: number | string): number | string { return value; }
`,
    consumer: `import { convert } from 'generated';

const value = convert(true);
`,
    validConsumer: `import { convert } from 'generated';

const value = convert(1);
`,
    expected: {
      code: 2769,
      file: 'Consumer.ets',
      line: 3,
      column: 23,
      fragments: [
        'No overload matches'
      ]
    }
  },
  {
    id: 'nested-interface-required-member',
    boundary: 'A nested public interface enforces its own required field.',
    mode: 'emit',
    source: `export interface Detail { title: string; }
export interface Options { detail: Detail; }
`,
    consumer: `import { Options } from 'generated';

const value: Options = { detail: {} };
`,
    validConsumer: `import { Options } from 'generated';

const value: Options = { detail: { title: 'ready' } };
`,
    expected: {
      code: 2741,
      file: 'Consumer.ets',
      line: 3,
      column: 26,
      fragments: [
        'title',
        'missing'
      ]
    }
  },
  {
    id: 'record-index-domain',
    boundary: 'A Record export retains its indexed value domain.',
    mode: 'emit',
    source: `export type Counts = Record<string, number>;
`,
    consumer: `import { Counts } from 'generated';

const value: Counts = { ready: 'bad' };
`,
    validConsumer: `import { Counts } from 'generated';

const value: Counts = { ready: 1 };
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
  }
];

module.exports = { fixtures };
