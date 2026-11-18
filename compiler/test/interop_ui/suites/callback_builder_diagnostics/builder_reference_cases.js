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
    id: 'owned-method-two-parameters',
    boundary: 'A method reference retains both declared argument slots.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number, label: string): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'method-optional-tail',
    boundary: 'An optional method parameter still contributes its declared bridge slot.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number, label?: string): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'method-rest-only',
    boundary: 'A syntactic rest parameter contributes one declared bridge slot.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(...values: number[]): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder1_Internal',
      initializer: 'this.render',
      parameterCount: 1
    }
  },
  {
    id: 'method-rest-after-prefix',
    boundary: 'A fixed parameter followed by rest retains both syntactic parameter nodes.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(label: string, ...values: number[]): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'method-arity-10',
    boundary: 'The supported bridge boundary selects its declared helper or the explicit zero-slot fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(
    value0: number,
    value1: number,
    value2: number,
    value3: number,
    value4: number,
    value5: number,
    value6: number,
    value7: number,
    value8: number,
    value9: number
  ): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder10_Internal',
      initializer: 'this.render',
      parameterCount: 10
    }
  },
  {
    id: 'method-arity-11',
    boundary: 'The supported bridge boundary selects its declared helper or the explicit zero-slot fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(
    value0: number,
    value1: number,
    value2: number,
    value3: number,
    value4: number,
    value5: number,
    value6: number,
    value7: number,
    value8: number,
    value9: number,
    value10: number
  ): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render',
      parameterCount: 0
    }
  },
  {
    id: 'direct-function-reference',
    boundary: 'A directly named function uses its declared argument count.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `function render(value: number, label: string): void {}
class Host {
  options() {
    return { content: render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'render',
      parameterCount: 2
    }
  },
  {
    id: 'variable-alias-fallback',
    boundary: 'A variable alias keeps the lowerer fallback because its declaration is not a function declaration.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `function render(value: number): void {}
const alias = render;
class Host {
  options() {
    return { content: alias };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'alias',
      parameterCount: 0
    }
  },
  {
    id: 'typed-function-property-fallback',
    boundary: 'A typed function property retains the property-declaration fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render: (value: number) => void;
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render',
      parameterCount: 0
    }
  },
  {
    id: 'arrow-property-fallback',
    boundary: 'An arrow-valued property remains distinct from a declared method.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render = (value: number): void => {};
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render',
      parameterCount: 0
    }
  },
  {
    id: 'parenthesized-method-fallback',
    boundary: 'A parenthesized expression follows the explicit unsupported-node fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number): void {}
  options() {
    return { content: (this.render) };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: '(this.render)',
      parameterCount: 0
    }
  },
  {
    id: 'element-access-method-fallback',
    boundary: 'An element access remains outside named property-access arity lookup.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number): void {}
  options() {
    return { content: this['render'] };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this[\'render\']',
      parameterCount: 0
    }
  },
  {
    id: 'inline-arrow-fallback',
    boundary: 'An inline arrow does not acquire a method symbol solely from its parameter annotation.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `
class Host {
  options() {
    return { content: (value: number): void => {} };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: '(value: number): void => {}',
      parameterCount: 0
    }
  },
  {
    id: 'inline-function-fallback',
    boundary: 'A function expression follows its own fallback node path.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `
class Host {
  options() {
    return { content: function(value: number): void {} };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'function(value: number): void {}',
      parameterCount: 0
    }
  },
  {
    id: 'bound-method-fallback',
    boundary: 'A bind call remains a call expression and keeps the configured fallback helper.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number): void {}
  options() {
    return { content: this.render.bind(this) };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render.bind(this)',
      parameterCount: 0
    }
  },
  {
    id: 'inherited-method-count',
    boundary: 'An inherited method resolves to its original declaration parameter count.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Base {
  render(value: number, label: string): void {}
}
class Host extends Base {
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'overridden-method-count',
    boundary: 'A derived method contributes its own declaration rather than the base method count.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Base {
  render(value: number): void {}
}
class Host extends Base {
  render(value: number, label: string): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'overload-first-declaration-count',
    boundary: 'The first method declaration controls the current syntactic arity lookup.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render(value: number): void;
  render(value: number, label: string): void;
  render(value: number, label?: string): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder1_Internal',
      initializer: 'this.render',
      parameterCount: 1
    }
  },
  {
    id: 'object-method-count',
    boundary: 'A method declaration inside an object literal still supplies its declared parameter count.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `const slots = {
  render(value: number, label: string): void {}
};
class Host {
  options() {
    return { content: slots.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'slots.render',
      parameterCount: 2
    }
  },
  {
    id: 'missing-checker-fallback',
    boundary: 'The absent-checker branch uses the explicit fallback helper without guessing an arity.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: true,
    source: `class Host {
  render(value: number): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render',
      parameterCount: 0
    }
  },
  {
    id: 'namespace-function-count',
    boundary: 'A qualified namespace function resolves to its function declaration.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `namespace Slots {
  export function render(value: number, label: string): void {}
}
class Host {
  options() {
    return { content: Slots.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'Slots.render',
      parameterCount: 2
    }
  },
  {
    id: 'generic-method-count',
    boundary: 'Generic type parameters do not become runtime Builder argument slots.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render<T>(value: T, label: string): void {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder2_Internal',
      initializer: 'this.render',
      parameterCount: 2
    }
  },
  {
    id: 'async-method-count',
    boundary: 'An async return marker does not change the declared method parameter count.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  async render(value: number): Promise<void> {}
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder1_Internal',
      initializer: 'this.render',
      parameterCount: 1
    }
  },
  {
    id: 'getter-function-fallback',
    boundary: 'A getter returning a function retains the accessor-declaration fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  get render(): (value: number) => void { return (value: number): void => {}; }
  options() {
    return { content: this.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render',
      parameterCount: 0
    }
  },
  {
    id: 'interface-method-fallback',
    boundary: 'An interface method signature remains distinct from a concrete method declaration.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `interface Slot { render(value: number): void; }
declare const slots: Slot;
class Host {
  options() {
    return { content: slots.render };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'slots.render',
      parameterCount: 0
    }
  },
  {
    id: 'nonnull-method-expression-fallback',
    boundary: 'A non-null expression retains the explicit non-property-access fallback.',
    operation: 'builder',
    component: 'StaticCard',
    builders: [
      'content'
    ],
    links: [],
    evaluate: false,
    withoutChecker: false,
    source: `class Host {
  render?(value: number): void;
  options() {
    return { content: this.render! };
  }
}
`,
    expected: {
      helper: '__Interop_transferCompatibleDynamicBuilder_Internal',
      initializer: 'this.render!',
      parameterCount: 0
    }
  }
];

module.exports = { fixtures };
