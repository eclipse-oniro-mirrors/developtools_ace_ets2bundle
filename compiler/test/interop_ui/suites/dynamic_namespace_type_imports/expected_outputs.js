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
  'namespace-1-value-kinds': `namespace cards {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
}
globalThis.probe = [cards.Card.identity];
`,
  'namespace-2-value-kinds': `namespace cards {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
}
globalThis.probe = [cards.Card.identity];
`,
  'namespace-3-value-kinds': `namespace cards {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
    export const title = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Global;')['title'], 'title');
}
globalThis.probe = [cards.Card.identity];
`,
  'nested-namespace-depth-1': `namespace cards {
    export namespace Controls {
        export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
        export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
        export const title = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Global;')['title'], 'title');
    }
}
globalThis.probe = [cards.Controls.Card.identity];
`,
  'nested-namespace-depth-2': `namespace cards {
    export namespace Controls {
        export namespace Panels {
            export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
            export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
            export const title = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Global;')['title'], 'title');
        }
    }
}
globalThis.probe = [cards.Controls.Panels.Card.identity];
`,
  'nested-namespace-depth-3': `namespace cards {
    export namespace Controls {
        export namespace Panels {
            export namespace Widgets {
                export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
                export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
                export const title = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Global;')['title'], 'title');
            }
        }
    }
}
globalThis.probe = [cards.Controls.Panels.Widgets.Card.identity];
`,
  'named-namespace-UI': `namespace UI {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
}
globalThis.probe = [UI.Card.identity];
`,
  'named-namespace-CardsAlias': `namespace CardsAlias {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
}
globalThis.probe = [CardsAlias.Card.identity];
`,
  'named-namespace-控件': `namespace 控件 {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'format'), 'format');
}
globalThis.probe = [控件.Card.identity];
`,
  'default-namespace': `namespace UI {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
}
globalThis.probe = [UI.Card.identity];
`,
  'same-leaf-name-two-namespaces': `namespace cards {
    export namespace Header {
        export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lheader/Card;'), 'Card');
    }
    export namespace Footer {
        export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lfooter/Card;'), 'Card');
    }
}
globalThis.probe = [cards.Header.Card.identity, cards.Footer.Card.identity];
`,
  'namespace-runtime-renamed-function': `namespace cards {
    export const format = __createLazy__(() => (globalThis as any).Panda.getFunction('Lcards/Global;', 'actualFormat'), 'format');
}
globalThis.probe = [cards.format("title")];
`,
  'namespace-runtime-renamed-property': `namespace cards {
    export const title = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Global;')['actualTitle'], 'title');
}
globalThis.probe = [cards.title];
`,
  'type-only-class': `const value = 1;
`,
  'type-only-alias': `const value = 1;
`,
  'type-only-default': `const value = 1;
`,
  'type-only-namespace': `const value = 1;
`,
  'named-type-specifier': `const value = 1;
`,
  'named-type-alias': `const value = 1;
`,
  'multiple-type-specifiers': `const value = 1;
`,
  'type-only-metadata-absent': `const value = 1;
`,
  'type-only-export-absent': `const value = 1;
`,
  'type-namespace-metadata-absent': `const value = 1;
`,
  'mixed-type-first': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'mixed-type-last': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'mixed-type-alias': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'separate-type-value': `const LocalCard = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'LocalCard');
globalThis.probe = [LocalCard.identity];
`,
  'empty-namespace': `namespace UI { }
const value = 1;
`,
  'namespace-skips-interface': `namespace UI { }
const value = 1;
`,
  'namespace-skips-recordless-class': `namespace UI { }
const value = 1;
`,
  'namespace-invalid-array': `import { Controls as UI } from "./Static";
const value = 1;
`,
  'namespace-invalid-null': `import { Controls as UI } from "./Static";
const value = 1;
`,
  'namespace-filters-unsupported-child': `namespace cards {
    export const Card = __createLazy__(() => (globalThis as any).Panda.getClass('Lcards/Card;'), 'Card');
}
globalThis.probe = [cards.Card.identity];
`,
  'dynamic-type-import-retained': `import type { DynamicCard } from "./Dynamic";
const value = 1;
`,
  'unresolved-type-import-retained': `import type { Card } from "./Missing";
const value = 1;
`
};

module.exports = { outputs };
