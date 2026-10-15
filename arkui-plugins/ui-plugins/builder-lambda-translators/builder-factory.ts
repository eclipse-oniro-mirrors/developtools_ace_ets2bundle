/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as arkts from '@koalaui/libarkts';
import { findClassInstanceFromCallArgument } from './utils';
import { factory as BuilderLambdaFactory } from './factory';
import { factory as UIFactory } from '../ui-factory';
import { addMemoAnnotation, MemoNames } from '../../collectors/memo-collectors/utils';
import { coerceToAstNode } from '../../common/arkts-utils';
import { generateBuilderCompatible, addcompatibleComponentImport, isFromBuilder1_1 } from '../interop/builder-interop';
import { ImportCollector } from '../../common/import-collector';
import { NodeCacheFactory } from '../../common/node-cache';
import {
    ACE_BEGIN_SCROLL_PLACEHOLDER,
    ACE_END_SCROLL_PLACEHOLDER,
    ARKUI_BUILDER_SOURCE_NAME,
    BUILDER_DECORATOR_OPTION_IS_PLACEHOLDER,
    DecoratorNames,
    NodeCacheNames,
} from '../../common/predefines';
import { MetaDataCollector } from '../../common/metadata-collector';

export class BuilderFactory {
    /**
     * rewrite `@Builder` function body.
     *
     * @internal
     */
    static rewriteBuilderScriptFunction<T extends arkts.AstNode = arkts.ScriptFunction>(node: T): arkts.ScriptFunction {
        const _node = coerceToAstNode<arkts.ScriptFunction>(node);
        let params = (_node.params as arkts.ETSParameterExpression[]).map((p) =>
            addMemoAnnotation(p, MemoNames.MEMO_SKIP_UI)
        );
        return UIFactory.updateScriptFunction(_node, { params });
    }

    /**
     * rewrite `@Builder` method.
     */
    static rewriteBuilderMethod<T extends arkts.AstNode = arkts.MethodDefinition>(
        node: T,
        isGlobalFunction?: boolean
    ): arkts.MethodDefinition {
        const _node = coerceToAstNode<arkts.MethodDefinition>(node);
        if (_node.kind === arkts.Es2pandaMethodDefinitionKind.METHOD_DEFINITION_KIND_GET) {
            return _node;
        }
        const newFunc = BuilderFactory.rewriteBuilderScriptFunction(_node.function!);
        const newFuncExpr = arkts.factory.createFunctionExpression(newFunc.id?.clone(), newFunc);
        let result = arkts.factory.updateMethodDefinition(_node, _node.kind, _node.id, newFuncExpr, _node.modifierFlags, false, _node.overloads);
        if (BuilderFactory.shouldInstrumentScrollPlaceholder(result, isGlobalFunction)) {
            result = BuilderFactory.instrumentScrollPlaceholder(result);
        }
        NodeCacheFactory.getInstance().getCache(NodeCacheNames.MEMO).refresh(_node, result);
        NodeCacheFactory.getInstance().getCache(NodeCacheNames.MEMO).refreshUpdate(_node, result);
        NodeCacheFactory.getInstance().getCache(NodeCacheNames.MEMO).refresh(_node.function, result.function);
        NodeCacheFactory.getInstance().getCache(NodeCacheNames.MEMO).refreshUpdate(_node.function, result.function);
        return result
    }

    /**
     * Decide whether the rewritten `@Builder` method is a global parameterless placeholder
     * builder (`@Builder({ isPlaceholder: true })`) whose product carries the scroll
     * placeholder scope instrumentation. Only the cache-path call site knows the enclosing
     * context, so instrumentation requires `isGlobalFunction === true`.
     */
    private static shouldInstrumentScrollPlaceholder(
        node: arkts.MethodDefinition,
        isGlobalFunction?: boolean
    ): boolean {
        if (isGlobalFunction !== true) {
            return false;
        }
        if (MetaDataCollector.getInstance().isDeclaration) {
            return false;
        }
        const func = node.function;
        const builderAnnotation = func?.annotations?.find(
            (annotation) => annotation.expr && arkts.isIdentifier(annotation.expr) &&
                annotation.expr.name === DecoratorNames.BUILDER
        );
        if (!builderAnnotation || !func || func.params.length !== 0) {
            return false;
        }
        return BuilderFactory.getIsPlaceholderOption(builderAnnotation) === true;
    }

    /**
     * Read the `isPlaceholder` option of a `Builder` annotation usage. Only an explicit
     * boolean literal counts; any other form yields undefined.
     */
    private static getIsPlaceholderOption(annotation: arkts.AnnotationUsage): boolean | undefined {
        for (const property of annotation.properties) {
            if (
                arkts.isClassProperty(property) &&
                property.key &&
                arkts.isIdentifier(property.key) &&
                property.key.name === BUILDER_DECORATOR_OPTION_IS_PLACEHOLDER &&
                property.value &&
                arkts.isBooleanLiteral(property.value)
            ) {
                return property.value.value;
            }
        }
        return undefined;
    }

    /**
     * Insert the scroll placeholder scope instrumentation into the builder body:
     * `__aceBeginScrollPlaceholder__();` first, `__aceEndScrollPlaceholder__();` last,
     * and register the helper imports.
     */
    private static instrumentScrollPlaceholder(node: arkts.MethodDefinition): arkts.MethodDefinition {
        ImportCollector.getInstance().collectSource(ACE_BEGIN_SCROLL_PLACEHOLDER, ARKUI_BUILDER_SOURCE_NAME);
        ImportCollector.getInstance().collectImport(ACE_BEGIN_SCROLL_PLACEHOLDER);
        ImportCollector.getInstance().collectSource(ACE_END_SCROLL_PLACEHOLDER, ARKUI_BUILDER_SOURCE_NAME);
        ImportCollector.getInstance().collectImport(ACE_END_SCROLL_PLACEHOLDER);
        const createPlaceholderCall = (name: string): arkts.ExpressionStatement =>
            arkts.factory.createExpressionStatement(
                arkts.factory.createCallExpression(
                    arkts.factory.createIdentifier(name),
                    [],
                    undefined,
                    false,
                    false
                )
            );
        const func = node.function!;
        const body = func.body;
        if (!body || !arkts.isBlockStatement(body)) {
            return node;
        }
        const newBody = arkts.factory.updateBlockStatement(body, [
            createPlaceholderCall(ACE_BEGIN_SCROLL_PLACEHOLDER),
            ...body.statements,
            createPlaceholderCall(ACE_END_SCROLL_PLACEHOLDER),
        ]);
        const newFunc = UIFactory.updateScriptFunction(func, { body: newBody });
        return arkts.factory.updateMethodDefinition(
            node,
            node.kind,
            node.id,
            arkts.factory.createFunctionExpression(newFunc.id?.clone(), newFunc),
            node.modifierFlags,
            false,
            node.overloads
        );
    }

    /**
     * rewrite `@Builder` class property with arrow function value.
     */
    static rewirteBuilderClassProperty<T extends arkts.AstNode = arkts.ClassProperty>(node: T): arkts.ClassProperty {
        const _node = coerceToAstNode<arkts.ClassProperty>(node);
        if (MetaDataCollector.getInstance().isDeclaration) {
            return _node;
        }
        const value = _node.value;
        if (!value || !arkts.isArrowFunctionExpression(value)) {
            return _node;
        }
        const newValue = BuilderFactory.rewriteBuilderArrowFunction(value);
        return arkts.factory.updateClassProperty(
            _node,
            _node.key,
            newValue,
            _node.typeAnnotation,
            _node.modifierFlags,
            false,
            _node.annotations
        );
    }

    /**
     * rewrite `@Builder` property with arrow function value.
     */
    static rewriteBuilderProperty<T extends arkts.AstNode = arkts.Property>(node: T): arkts.Property {
        const _node = coerceToAstNode<arkts.Property>(node);
        if (MetaDataCollector.getInstance().isDeclaration) {
            return _node;
        }
        const value = _node.value;
        if (!value) {
            return _node;
        }
        if (arkts.isIdentifier(value) && isFromBuilder1_1(arkts.getDecl(value))) {
            addcompatibleComponentImport();
            return generateBuilderCompatible(_node, value.name) as arkts.Property;
        }
        if (!arkts.isArrowFunctionExpression(value)) {
            return _node;
        }
        const newValue = BuilderFactory.rewriteBuilderArrowFunction(value);
        _node.setValue(newValue);
        return _node;
    }

    /**
     * rewrite `@Builder` arrow function.
     */
    static rewriteBuilderArrowFunction<T extends arkts.AstNode = arkts.ArrowFunctionExpression>(
        node: T
    ): arkts.ArrowFunctionExpression {
        const _node = coerceToAstNode<arkts.ArrowFunctionExpression>(node);
        if (MetaDataCollector.getInstance().isDeclaration) {
            return _node;
        }
        const newFunc = BuilderFactory.rewriteBuilderScriptFunction(_node.function!);
        return arkts.factory.updateArrowFunctionExpression(_node, newFunc, _node.annotations);
    }

    /**
     * rewrite `@Builder` parameter with arrow function value.
     */
    static rewriteBuilderParameter<T extends arkts.AstNode = arkts.ETSParameterExpression>(
        node: T
    ): arkts.ETSParameterExpression {
        const _node = coerceToAstNode<arkts.ETSParameterExpression>(node);
        if (MetaDataCollector.getInstance().isDeclaration) {
            return _node;
        }
        const initializer = _node.initializer;
        if (!initializer || !arkts.isArrowFunctionExpression(initializer)) {
            return _node;
        }
        const newInitializer = BuilderFactory.rewriteBuilderArrowFunction(initializer);
        return arkts.factory.updateETSParameterExpression(_node, _node.ident, _node.isOptional, newInitializer, _node.annotations);
    }

    /**
     * rewrite `@Builder` call.
     */
    static rewriteBuilderCall<T extends arkts.AstNode = arkts.CallExpression>(node: T): arkts.CallExpression {
        const _node = coerceToAstNode<arkts.CallExpression>(node);
        if (MetaDataCollector.getInstance().isDeclaration) {
            return _node;
        }
        const args = _node.arguments;
        if (args.length !== 1) {
            return _node;
        }
        const arg = args[0]!;
        if (!arkts.isTSAsExpression(arg) && !arkts.isObjectExpression(arg)) {
            return _node;
        }
        const decl = findClassInstanceFromCallArgument(arg);
        if (!decl) {
            return _node;
        }
        const isFromClass = arkts.isClassDefinition(decl);
        const typeRef = BuilderLambdaFactory.createTypeRefInBuilderParameterProxyCall(arg, decl);
        let newArgument: arkts.Expression;
        if (arkts.isTSAsExpression(arg)) {
            const objectExpr = arg.expr as arkts.ObjectExpression;
            newArgument = arkts.factory.updateTSAsExpression(
                arg,
                BuilderLambdaFactory.createBuilderParameterProxyCall(objectExpr, decl, typeRef, isFromClass),
                arg.typeAnnotation,
                arg.isConst
            );
        } else {
            newArgument = BuilderLambdaFactory.createBuilderParameterProxyCall(arg, decl, typeRef, isFromClass);
        }
        return arkts.factory.updateCallExpression(_node, _node.callee, [newArgument], _node.typeParams, _node.isOptional, _node.hasTrailingComma, _node.trailingBlock);
    }
}

export type BuilderRewriteFn<T extends arkts.AstNode = arkts.AstNode> = (node: T) => T;

export const builderRewriteByType = new Map<arkts.Es2pandaAstNodeType, BuilderRewriteFn<arkts.AstNode>>([
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_METHOD_DEFINITION, BuilderFactory.rewriteBuilderMethod],
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_CLASS_PROPERTY, BuilderFactory.rewirteBuilderClassProperty],
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_PROPERTY, BuilderFactory.rewriteBuilderProperty],
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_ARROW_FUNCTION_EXPRESSION, BuilderFactory.rewriteBuilderArrowFunction],
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_ETS_PARAMETER_EXPRESSION, BuilderFactory.rewriteBuilderParameter],
    [arkts.Es2pandaAstNodeType.AST_NODE_TYPE_CALL_EXPRESSION, BuilderFactory.rewriteBuilderCall],
]);
