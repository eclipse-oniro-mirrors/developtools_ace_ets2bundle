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

const outputs = {
  'class-Card': `const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/StaticCard;'), 'Card');
globalThis.probe = [Card.identity];
`,
  'class-StaticCard': `const StaticCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/StaticCard;'), 'StaticCard');
globalThis.probe = [StaticCard.identity];
`,
  'function-createCard': `const createCard = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/ETSGLOBAL;', 'makeCard'), 'createCard');
globalThis.probe = [createCard('card')];
`,
  'property-cardTheme': `const cardTheme = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/ETSGLOBAL;')['theme'], 'cardTheme');
globalThis.probe = [cardTheme];
`,
  'class-LocalCard': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/deep/module/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'class-CardAlias': `const CardAlias = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/module with spaces/Card;'), 'CardAlias');
globalThis.probe = [CardAlias.identity];
`,
  'class-卡片': `const 卡片 = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/\\u7EC4\\u4EF6/Card;'), '\\u5361\\u7247');
globalThis.probe = [卡片.identity];
`,
  'function-formatCard': `const formatCard = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Format;', 'format'), 'formatCard');
globalThis.probe = [formatCard('card')];
`,
  'property-cardLabel': `const cardLabel = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Theme;')['label'], 'cardLabel');
globalThis.probe = [cardLabel];
`,
  'renamed-runtime-function': `const display = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/ETSGLOBAL;', 'formatInternal'), 'display');
globalThis.probe = [display('card')];
`,
  'renamed-runtime-property': `const caption = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Theme;')['actualLabel'], 'caption');
globalThis.probe = [caption];
`,
  'explicit-ets-extension': `import { Card as LocalCard } from "./Static.ets";
globalThis.probe = [LocalCard.identity];
`,
  'trailing-comma': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'multiline-import': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'comment-between-bindings': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'caller-query-independent': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
const marker = "Caller.ets?entry";
globalThis.probe = [LocalCard.identity];
`,
  'body-local-shadow': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
function nested() { const LocalCard = "inner"; return LocalCard; }
globalThis.probe = [LocalCard.identity];
`,
  'runtime-name-escaped-quote': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/"quoted"/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  '2-independent-exports': `const LocalHeaderCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/HeaderCard;'), 'LocalHeaderCard');
const LocalBodyCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/BodyCard;'), 'LocalBodyCard');
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity];
`,
  '3-independent-exports': `const LocalHeaderCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/HeaderCard;'), 'LocalHeaderCard');
const LocalBodyCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/BodyCard;'), 'LocalBodyCard');
const LocalFooterCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/FooterCard;'), 'LocalFooterCard');
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity, LocalFooterCard.identity];
`,
  '4-independent-exports': `const LocalHeaderCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/HeaderCard;'), 'LocalHeaderCard');
const LocalBodyCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/BodyCard;'), 'LocalBodyCard');
const LocalFooterCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/FooterCard;'), 'LocalFooterCard');
const LocalActionCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/ActionCard;'), 'LocalActionCard');
globalThis.probe = [LocalHeaderCard.identity, LocalBodyCard.identity, LocalFooterCard.identity, LocalActionCard.identity];
`,
  'one-export-2-aliases': `const FirstCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'FirstCard');
const SecondCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'SecondCard');
globalThis.probe = [FirstCard.identity, SecondCard.identity];
`,
  'one-export-3-aliases': `const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
const SecondCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'SecondCard');
const ThirdCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'ThirdCard');
globalThis.probe = [Card.identity, SecondCard.identity, ThirdCard.identity];
`,
  'default-class': `const DefaultCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Default;'), 'DefaultCard');
globalThis.probe = [DefaultCard.identity];
`,
  'default-function': `const DefaultCard = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Default;', 'buildDefault'), 'DefaultCard');
globalThis.probe = [DefaultCard('card')];
`,
  'default-property': `const DefaultCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Default;')['defaultTheme'], 'DefaultCard');
globalThis.probe = [DefaultCard];
`,
  'separate-import-helper-dedup': `const First = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'First');
const make = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'build'), 'make');
globalThis.probe = [First.identity, make("card")];
`,
  'unresolved-target': `import { Card } from "./Missing";
const value = 1;
`,
  'dynamic-target-retained': `import { DynamicCard } from "./Dynamic";
const value = 1;
`,
  'side-effect-static-import': `import "./Static";
const value = 1;
`,
  'missing-metadata': `import { Card } from "./Static";
const value = 1;
`,
  'missing-export': `import { Missing } from "./Static";
const value = 1;
`,
  'atomic-missing-second-binding': `import { Card, Missing } from "./Static";
const value = 1;
`,
  'unsupported-interface-kind': `import { Card } from "./Static";
const value = 1;
`,
  'missing-runtime-record': `import { Card } from "./Static";
const value = 1;
`
};

module.exports = { outputs };
