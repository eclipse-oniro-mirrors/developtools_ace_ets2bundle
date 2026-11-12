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

const ast = require('./ast_contract');

const COMPONENT_MODULE = '@ohos.arkui.component';
const STATE_MODULE = '@ohos.arkui.stateManagement';
const DYNAMIC_MODULE = 'dynamic/@ohos.arkui.GlobalAnnotation';

function componentImport(...named) {
  return {
    module: COMPONENT_MODULE,
    named
  };
}

function stateImport(...named) {
  return {
    module: STATE_MODULE,
    named
  };
}

function noImports() {
  return {
    generatedImports: [],
    originalImports: []
  };
}

function noGeneratedImports(originalImports = []) {
  return {
    generatedImports: [],
    originalImports
  };
}

const expectations = {
  'white-list-type-value-dedup': {
    generatedImports: [componentImport('Length', 'Text')],
    originalImports: [],
    verify(context) {
      ast.assertGeneratedNameCount(context, 'Length', 1);
      ast.assertGeneratedNameCount(context, 'Text', 1);
      ast.assertGeneratedNameAbsent(context, 'State');
      ast.assertGeneratedNameAbsent(context, 'LocalStorage');
      const imports = ast.importsOf(context, true);
      context.assert.strictEqual(imports.length, 1);
      context.assert.deepStrictEqual(
        imports[0].named.map(item => item.local),
        ['Length', 'Text']
      );
      return {
        resolvedSymbols: ['Length:type-and-value-deduplicated', 'Text:type-and-value-deduplicated']
      };
    }
  },
  'repeated-component-state-symbols': {
    generatedImports: [
      componentImport('Component', 'Text'),
      stateImport('LocalStorage', 'State')
    ],
    originalImports: [],
    verify(context) {
      ['Component', 'State', 'Text', 'LocalStorage'].forEach(name => {
        ast.assertGeneratedNameCount(context, name, 1);
      });
      const first = ast.findStruct(context, 'FirstCard');
      const second = ast.findStruct(context, 'SecondCard');
      ast.assertDecoratorNames(context, first, ['Component']);
      ast.assertDecoratorNames(context, second, ['Component']);
      ast.assertDecoratorNames(context, ast.findProperty(context, first, 'first'), ['State']);
      ast.assertDecoratorNames(context, ast.findProperty(context, second, 'second'), ['State']);
      ast.assertDecoratorNames(context, ast.findProperty(context, second, 'third'), ['State']);
      ast.assertMethodReturnKind(context, first, 'build', context.ts.SyntaxKind.VoidKeyword);
      ast.assertMethodReturnKind(context, second, 'build', context.ts.SyntaxKind.VoidKeyword);
      return {
        decoratedStructs: 2,
        stateProperties: 3,
        automaticLocalStorageCount: 1
      };
    }
  },
  'local-white-list-type-shadow': {
    ...noImports(),
    verify(context) {
      const declaration = ast.findInterface(context, 'Length');
      context.assert.strictEqual(declaration.members.length, 2);
      ast.assertGeneratedNameAbsent(context, 'Length');
      const imports = ast.importsOf(context, undefined);
      context.assert.strictEqual(imports.length, 0);
      const symbols = context.typeChecker.getSymbolsInScope(
        declaration,
        context.ts.SymbolFlags.Type
      );
      context.assert.ok(symbols.some(symbol => symbol.name === 'Length'));
      return {
        localDeclaration: 'Length',
        generatedImportCount: imports.length,
        checkerEvidence: 'local-interface-symbol'
      };
    }
  },
  'local-white-list-value-shadow': {
    ...noImports(),
    verify(context) {
      const declaration = ast.findClass(context, 'Text');
      ast.assertGeneratedNameAbsent(context, 'Text');
      ast.assertMethodReturnKind(
        context,
        declaration,
        'create',
        context.ts.SyntaxKind.TypeReference
      );
      ast.assertMethodReturnKind(
        context,
        declaration,
        'from',
        context.ts.SyntaxKind.TypeReference
      );
      ast.assertConstructorCount(context, declaration, 0);
      const symbol = context.typeChecker.getSymbolAtLocation(declaration.name);
      context.assert.ok(symbol);
      context.assert.strictEqual(symbol.declarations[0], declaration);
      return {
        localDeclaration: 'Text',
        checkerEvidence: 'class-symbol-declaration-identity',
        staticMethods: ['create', 'from']
      };
    }
  },
  'named-import-alias': {
    ...noGeneratedImports([{
      module: './aliased_symbols',
      named: [
        { imported: 'Length', local: 'LocalLength' },
        { imported: 'Text', local: 'LocalText' }
      ]
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.deepStrictEqual(
        original[0].named.map(item => [item.imported, item.local]),
        [['Length', 'LocalLength'], ['Text', 'LocalText']]
      );
      ['Length', 'Text', 'LocalLength', 'LocalText'].forEach(name => {
        ast.assertGeneratedNameAbsent(context, name);
      });
      const source = context.sourceFile.statements
        .find(statement => context.ts.isVariableStatement(statement));
      context.assert.ok(source, 'The alias-consuming variable statement remains');
      return {
        aliasPairs: ['Length->LocalLength', 'Text->LocalText'],
        synthesizedImports: 0
      };
    }
  },
  'default-import-binding': {
    ...noGeneratedImports([{
      module: './default_text',
      default: 'Text'
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.strictEqual(original[0].default, 'Text');
      context.assert.strictEqual(original[0].named.length, 0);
      context.assert.strictEqual(original[0].namespace, null);
      ast.assertGeneratedNameAbsent(context, 'Text');
      ast.assertGeneratedNameCount(context, 'Text', 0);
      return {
        bindingForm: 'default',
        module: './default_text',
        synthesizedImports: 0
      };
    }
  },
  'namespace-qualified-symbols': {
    ...noGeneratedImports([{
      module: './namespace_symbols',
      namespace: 'UI'
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.strictEqual(original[0].namespace, 'UI');
      ast.assertGeneratedNameAbsent(context, 'Length');
      ast.assertGeneratedNameAbsent(context, 'Text');
      ast.assertGeneratedNameAbsent(context, 'UI');
      context.assert.ok(context.transformedText.includes('UI.Length'));
      context.assert.ok(context.transformedText.includes('UI.Text'));
      context.assert.strictEqual(ast.importsOf(context, true).length, 0);
      return {
        namespaceBinding: 'UI',
        synthesizedDirectImports: 0,
        qualifiedReferencesPreserved: true
      };
    }
  },
  'special-component-original-import': {
    ...noGeneratedImports([{
      module: COMPONENT_MODULE,
      named: [
        'Text',
        { imported: 'Length', local: 'LocalLength' }
      ]
    }]),
    verify(context) {
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 1);
      context.assert.strictEqual(ast.importsOf(context, false)[0].module, COMPONENT_MODULE);
      ['Text', 'Length', 'LocalLength'].forEach(name => {
        ast.assertGeneratedNameAbsent(context, name);
      });
      context.assert.ok(context.transformedText.includes('Length as LocalLength'));
      return {
        specialModulePreserved: COMPONENT_MODULE,
        originalAliasPreserved: 'Length as LocalLength'
      };
    }
  },
  'special-state-original-import': {
    ...noGeneratedImports([{
      module: STATE_MODULE,
      named: ['State']
    }]),
    verify(context) {
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 1);
      const model = ast.findClass(context, 'StateModel');
      ast.assertDecoratorNames(context, ast.findProperty(context, model, 'value'), ['State']);
      ast.assertDecoratorNames(context, ast.findProperty(context, model, 'title'), ['State']);
      ast.assertGeneratedNameAbsent(context, 'State');
      ast.assertGeneratedNameAbsent(context, 'LocalStorage');
      return {
        specialModulePreserved: STATE_MODULE,
        stateDecoratorCount: 2,
        localStorageImportCount: 0
      };
    }
  },
  'special-dynamic-property-decorators': {
    ...noGeneratedImports([{
      module: DYNAMIC_MODULE,
      named: ['Prop', 'StorageProp', 'LocalStorageProp']
    }]),
    verify(context) {
      const model = ast.findClass(context, 'DynamicStorageModel');
      const value = ast.findProperty(context, model, 'value');
      const stored = ast.findProperty(context, model, 'stored');
      const local = ast.findProperty(context, model, 'local');
      ast.assertDecoratorNames(context, value, ['Prop']);
      ast.assertDecoratorNames(context, stored, ['StorageProp']);
      ast.assertDecoratorNames(context, local, ['LocalStorageProp']);
      ast.assertDecoratorArguments(context, stored, 'StorageProp', ['stored']);
      ast.assertDecoratorArguments(context, local, 'LocalStorageProp', ['local']);
      ['PropRef', 'StoragePropRef', 'LocalStoragePropRef'].forEach(name => {
        ast.assertGeneratedNameAbsent(context, name);
      });
      context.assert.strictEqual(context.transformedText.includes('@PropRef'), false);
      return {
        dynamicDecorators: ['Prop', 'StorageProp(stored)', 'LocalStorageProp(local)'],
        propRefRewriteApplied: false
      };
    }
  },
  'component-reusable-v1': {
    generatedImports: [
      componentImport('Component', 'Reusable', 'Text'),
      stateImport('LocalStorage', 'State')
    ],
    originalImports: [],
    verify(context) {
      const card = ast.findStruct(context, 'ReusableCard');
      ast.assertDecoratorNames(context, card, ['Component', 'Reusable']);
      ast.assertDecoratorNames(context, ast.findProperty(context, card, 'title'), ['State']);
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      ['Component', 'Reusable', 'State', 'Text', 'LocalStorage'].forEach(name => {
        ast.assertGeneratedNameCount(context, name, 1);
      });
      return {
        componentGeneration: 'V1',
        reuseDecorator: 'Reusable',
        localStorageImportCount: 1
      };
    }
  },
  'component-reusable-v2': {
    generatedImports: [
      componentImport('ComponentV2', 'ReusableV2', 'Text'),
      stateImport('LocalStorage', 'Local', 'Param', 'Once')
    ],
    originalImports: [],
    verify(context) {
      const card = ast.findStruct(context, 'ReusableV2Card');
      ast.assertDecoratorNames(context, card, ['ComponentV2', 'ReusableV2']);
      ast.assertDecoratorNames(context, ast.findProperty(context, card, 'title'), ['Local']);
      ast.assertDecoratorNames(context, ast.findProperty(context, card, 'count'), ['Param']);
      ast.assertDecoratorNames(context, ast.findProperty(context, card, 'initialCount'), ['Once', 'Param']);
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      ['ComponentV2', 'ReusableV2', 'LocalStorage', 'Local', 'Param', 'Once', 'Text'].forEach(name => {
        ast.assertGeneratedNameCount(context, name, 1);
      });
      return {
        componentGeneration: 'V2',
        reuseDecorator: 'ReusableV2',
        repeatedParamImportCount: 1
      };
    }
  },
  'state-management-component-grouping': {
    generatedImports: [
      componentImport('Length', 'Text'),
      stateImport('State', 'PropRef', 'StorageLink')
    ],
    originalImports: [],
    verify(context) {
      const card = ast.findStruct(context, 'GroupedCard');
      ast.assertDecoratorNames(context, ast.findProperty(context, card, 'title'), ['State']);
      const size = ast.findProperty(context, card, 'size');
      ast.assertDecoratorNames(context, size, ['PropRef']);
      const count = ast.findProperty(context, card, 'count');
      ast.assertDecoratorNames(context, count, ['StorageLink']);
      ast.assertDecoratorArguments(context, count, 'StorageLink', ['count']);
      ast.assertGeneratedNameAbsent(context, 'Prop');
      ast.assertGeneratedNameAbsent(context, 'LocalStorage');
      ast.assertGeneratedNameCount(context, 'PropRef', 1);
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      return {
        stateGroup: ['State', 'PropRef', 'StorageLink'],
        componentGroup: ['Length', 'Text'],
        propRewrite: 'Prop->PropRef'
      };
    }
  },
  'extend-styles-builder': {
    generatedImports: [componentImport('Builder')],
    originalImports: [{
      module: COMPONENT_MODULE,
      named: ['Text']
    }],
    absentGeneratedNames: ['Extend', 'Styles', 'Text'],
    verify(context) {
      ast.assertGeneratedNameCount(context, 'Builder', 1);
      const extend = ast.findFunction(context, 'extendedText');
      const styles = ast.findFunction(context, 'cardStyles');
      const builder = ast.findFunction(context, 'cardBuilder');
      ast.assertDecoratorNames(context, extend, ['Extend']);
      ast.assertDecoratorNames(context, styles, ['Styles']);
      ast.assertDecoratorNames(context, builder, ['Builder']);
      ast.assertFunctionHasNoReturnType(context, 'extendedText');
      ast.assertFunctionHasNoReturnType(context, 'cardStyles');
      ast.assertFunctionHasNoReturnType(context, 'cardBuilder');
      return {
        skippedDecorators: ['Extend', 'Styles'],
        collectedDecorator: 'Builder',
        methodVoidRewriteAppliedToFreeFunctions: false
      };
    }
  },
  'directive-and-generated-import-order': {
    generatedImports: [
      componentImport('Component'),
      stateImport('LocalStorage', 'State')
    ],
    originalImports: [],
    verify(context) {
      ast.assertDirectives(context, ['use static', 'use strict']);
      ast.assertStatementOrder(context, [
        'directive:use static',
        'directive:use strict',
        `import:${COMPONENT_MODULE}`,
        `import:${STATE_MODULE}`,
        'struct:DirectedCard'
      ]);
      const indices = ast.importStatementIndices(context);
      context.assert.deepStrictEqual(indices[COMPONENT_MODULE], [2]);
      context.assert.deepStrictEqual(indices[STATE_MODULE], [3]);
      return {
        directiveOrder: ['use static', 'use strict'],
        componentImportIndex: 2,
        stateImportIndex: 3
      };
    }
  },
  'struct-constructor-class-control': {
    generatedImports: [
      componentImport('Component'),
      stateImport('LocalStorage')
    ],
    originalImports: [],
    verify(context) {
      const card = ast.findStruct(context, 'ConstructedCard');
      const model = ast.findClass(context, 'OrdinaryModel');
      ast.assertConstructorCount(context, card, 0);
      ast.assertConstructorCount(context, model, 1);
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      ast.assertMethodReturnKind(context, model, 'reset', context.ts.SyntaxKind.VoidKeyword);
      ast.assertStatementOrder(context, [
        `import:${COMPONENT_MODULE}`,
        `import:${STATE_MODULE}`,
        'struct:ConstructedCard',
        'class:OrdinaryModel'
      ]);
      return {
        structConstructors: 0,
        ordinaryClassConstructors: 1,
        classControlPreserved: true
      };
    }
  },
  'local-component-decorator-shadow': {
    ...noImports(),
    verify(context) {
      const localComponent = ast.findClass(context, 'Component');
      const card = ast.findStruct(context, 'LocallyDecoratedCard');
      ast.assertDecoratorNames(context, card, ['Component']);
      ast.assertGeneratedNameAbsent(context, 'Component');
      ast.assertGeneratedNameAbsent(context, 'LocalStorage');
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      const decorator = ast.findDecorator(context, card, 'Component');
      const symbol = context.typeChecker.getSymbolAtLocation(decorator.expression);
      context.assert.ok(symbol);
      context.assert.strictEqual(symbol.declarations[0].getSourceFile(), context.original);
      context.assert.strictEqual(localComponent.name.text, 'Component');
      return {
        localDecoratorDeclaration: 'Component',
        localStorageImportCount: 0,
        checkerEvidence: 'decorator-resolves-to-entry-file'
      };
    }
  },
  'ordinary-named-import-control': {
    ...noGeneratedImports([{
      module: './ordinary_symbols',
      named: ['Length', 'Text']
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.deepStrictEqual(
        original[0].named.map(item => [item.imported, item.local]),
        [['Length', 'Length'], ['Text', 'Text']]
      );
      ast.assertGeneratedNameAbsent(context, 'Length');
      ast.assertGeneratedNameAbsent(context, 'Text');
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 1);
      return {
        bindingForm: 'named-without-alias',
        importedBindings: ['Length', 'Text'],
        generatedImportCount: 0
      };
    }
  },
  'local-namespace-shadow': {
    ...noImports(),
    verify(context) {
      const namespaces = ast.declarationsOf(
        context,
        node => context.ts.isModuleDeclaration(node) && node.name.text === 'UI'
      );
      context.assert.strictEqual(namespaces.length, 1);
      ast.assertGeneratedNameAbsent(context, 'Length');
      ast.assertGeneratedNameAbsent(context, 'Text');
      ast.assertGeneratedNameAbsent(context, 'UI');
      context.assert.ok(context.transformedText.includes('UI.Length'));
      context.assert.ok(context.transformedText.includes('UI.Text'));
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 0);
      return {
        localNamespace: 'UI',
        locallyShadowedSymbols: ['Length', 'Text'],
        generatedImportCount: 0
      };
    }
  },
  'existing-component-decorator-import': {
    generatedImports: [stateImport('LocalStorage')],
    originalImports: [{
      module: COMPONENT_MODULE,
      named: ['Component', 'Reusable']
    }],
    verify(context) {
      const card = ast.findStruct(context, 'ExistingImportCard');
      ast.assertDecoratorNames(context, card, ['Component', 'Reusable']);
      ast.assertGeneratedNameAbsent(context, 'Component');
      ast.assertGeneratedNameAbsent(context, 'Reusable');
      ast.assertGeneratedNameCount(context, 'LocalStorage', 1);
      ast.assertMethodReturnKind(context, card, 'build', context.ts.SyntaxKind.VoidKeyword);
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 2);
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original[0].module, COMPONENT_MODULE);
      return {
        existingComponentImports: ['Component', 'Reusable'],
        addedStateImports: ['LocalStorage'],
        duplicateDecoratorImports: 0
      };
    }
  },
  'static-storage-property-ref-imports': {
    generatedImports: [stateImport('StoragePropRef', 'LocalStoragePropRef')],
    originalImports: [],
    verify(context) {
      const model = ast.findClass(context, 'StaticStorageModel');
      const stored = ast.findProperty(context, model, 'stored');
      const local = ast.findProperty(context, model, 'local');
      ast.assertDecoratorNames(context, stored, ['StoragePropRef']);
      ast.assertDecoratorNames(context, local, ['LocalStoragePropRef']);
      ast.assertDecoratorArguments(context, stored, 'StoragePropRef', ['stored']);
      ast.assertDecoratorArguments(context, local, 'LocalStoragePropRef', ['local']);
      ast.assertGeneratedNameAbsent(context, 'StorageProp');
      ast.assertGeneratedNameAbsent(context, 'LocalStorageProp');
      ast.assertGeneratedNameCount(context, 'StoragePropRef', 1);
      ast.assertGeneratedNameCount(context, 'LocalStoragePropRef', 1);
      ast.assertMethodReturnKind(context, model, 'reset', context.ts.SyntaxKind.VoidKeyword);
      return {
        storageRewrites: ['StorageProp->StoragePropRef', 'LocalStorageProp->LocalStoragePropRef'],
        preservedKeys: ['stored', 'local'],
        importGroup: STATE_MODULE
      };
    }
  },
  'side-effect-import-directive-order': {
    generatedImports: [
      componentImport('Component'),
      stateImport('LocalStorage', 'State')
    ],
    originalImports: [{
      module: './register'
    }],
    verify(context) {
      ast.assertDirectives(context, ['use static']);
      ast.assertStatementOrder(context, [
        'directive:use static',
        `import:${COMPONENT_MODULE}`,
        `import:${STATE_MODULE}`,
        'import:./register',
        'struct:SideEffectCard'
      ]);
      const sideEffect = context.sourceFile.statements.find(statement =>
        context.ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier.text === './register');
      context.assert.ok(sideEffect);
      context.assert.strictEqual(sideEffect.importClause, undefined);
      const indices = ast.importStatementIndices(context);
      context.assert.deepStrictEqual(indices[COMPONENT_MODULE], [1]);
      context.assert.deepStrictEqual(indices[STATE_MODULE], [2]);
      context.assert.deepStrictEqual(indices['./register'], [3]);
      return {
        directiveIndex: 0,
        generatedImportIndices: [1, 2],
        sideEffectImportIndex: 3,
        sideEffectHasImportClause: false
      };
    }
  },
  'type-only-white-list-import': {
    ...noGeneratedImports([{
      module: './type_only_symbols',
      named: ['Length'],
      typeOnly: true
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.strictEqual(original[0].typeOnly, true);
      context.assert.strictEqual(original[0].named[0].local, 'Length');
      ast.assertGeneratedNameAbsent(context, 'Length');
      const declaration = context.sourceFile.statements.find(statement =>
        context.ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier.text === './type_only_symbols');
      context.assert.ok(declaration);
      context.assert.strictEqual(declaration.importClause.isTypeOnly, true);
      context.assert.strictEqual(ast.importsOf(context, true).length, 0);
      return {
        bindingForm: 'type-only-named',
        importedBinding: 'Length',
        generatedValueImportCount: 0
      };
    }
  },
  'inline-type-only-import': {
    ...noGeneratedImports([{
      module: './inline_type_symbols',
      named: [{
        imported: 'Length',
        local: 'Length',
        typeOnly: true
      }]
    }]),
    verify(context) {
      const original = ast.importsOf(context, false);
      context.assert.strictEqual(original.length, 1);
      context.assert.strictEqual(original[0].typeOnly, false);
      context.assert.strictEqual(original[0].named.length, 1);
      context.assert.strictEqual(original[0].named[0].typeOnly, true);
      ast.assertGeneratedNameAbsent(context, 'Length');
      const declaration = context.sourceFile.statements.find(statement =>
        context.ts.isImportDeclaration(statement) &&
        statement.moduleSpecifier.text === './inline_type_symbols');
      context.assert.ok(declaration);
      context.assert.strictEqual(declaration.importClause.isTypeOnly, false);
      context.assert.strictEqual(declaration.importClause.namedBindings.elements[0].isTypeOnly, true);
      context.assert.strictEqual(ast.importsOf(context, true).length, 0);
      return {
        bindingForm: 'inline-type-only-specifier',
        clauseTypeOnly: false,
        specifierTypeOnly: true,
        generatedValueImportCount: 0
      };
    }
  },
  'local-state-decorator-shadow': {
    ...noImports(),
    verify(context) {
      const model = ast.findClass(context, 'LocalStateModel');
      ast.assertDecoratorNames(context, model, ['State']);
      ast.assertGeneratedNameAbsent(context, 'State');
      ast.assertGeneratedNameAbsent(context, 'LocalStorage');
      ast.assertMethodReturnKind(context, model, 'reset', context.ts.SyntaxKind.VoidKeyword);
      const decorator = ast.findDecorator(context, model, 'State');
      const symbol = context.typeChecker.getSymbolAtLocation(decorator.expression);
      context.assert.ok(symbol);
      context.assert.strictEqual(symbol.declarations.length, 1);
      context.assert.strictEqual(symbol.declarations[0].getSourceFile(), context.original);
      context.assert.strictEqual(context.ts.isFunctionDeclaration(symbol.declarations[0]), true);
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 0);
      return {
        localDecoratorDeclaration: 'State',
        checkerEvidence: 'decorator-resolves-to-local-function',
        generatedStateImportCount: 0,
        independentVoidRewriteObserved: true
      };
    }
  },
  'non-white-list-negative-control': {
    ...noImports(),
    verify(context) {
      const model = ast.findClass(context, 'CustomModel');
      ast.assertDecoratorNames(context, model, ['CustomDecorator']);
      ast.assertMethodReturnKind(context, model, 'reset', context.ts.SyntaxKind.VoidKeyword);
      ['CustomDecorator', 'UnknownType', 'customReset'].forEach(name => {
        ast.assertGeneratedNameAbsent(context, name);
      });
      context.assert.ok(context.transformedText.includes('UnknownType'));
      context.assert.ok(context.transformedText.includes('customReset()'));
      context.assert.strictEqual(ast.importsOf(context, undefined).length, 0);
      return {
        unknownSymbols: ['CustomDecorator', 'UnknownType', 'customReset'],
        generatedImportCount: 0,
        independentMethodRewriteObserved: true
      };
    }
  }
};

function expectationFor(caseDefinition) {
  const expectation = expectations[caseDefinition.id];
  if (!expectation) {
    throw new Error(`${caseDefinition.id}: no independently reviewed expectations registered`);
  }
  if (typeof expectation.verify !== 'function') {
    throw new Error(`${caseDefinition.id}: expected AST assertions are missing`);
  }
  return expectation;
}

function expectationIds() {
  return Object.keys(expectations).sort();
}

module.exports = {
  COMPONENT_MODULE,
  DYNAMIC_MODULE,
  STATE_MODULE,
  expectationFor,
  expectationIds,
  expectations
};
