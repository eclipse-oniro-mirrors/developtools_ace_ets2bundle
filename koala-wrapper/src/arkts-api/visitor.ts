/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
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

import { global } from "./static/global"
import { factory } from "./factory/nodeFactory"
import {
    Es2pandaClassDefinitionModifiers,
    Es2pandaImportKinds,
    Es2pandaModifierFlags,
    Es2pandaVariableDeclaratorFlag
} from "../generated/Es2pandaEnums"
import { AstNode } from "./peers/AstNode"
import { 
    isBlockStatement, 
    isConditionalExpression, 
    isTSInterfaceBody, 
    isTSInterfaceDeclaration, 
    isClassDeclaration, 
    isClassDefinition,
    isTSAsExpression,
    isETSImportDeclaration,
    ImportSource,
    isScriptFunction,
    FunctionSignature,
    Property,
    isClassProperty,
    isImportDeclaration
} from "../generated"
import {
    isEtsScript,
    isCallExpression,
    isFunctionDeclaration,
    isExpressionStatement,
    isStructDeclaration,
    isMethodDefinition,
    // isScriptFunction,
    isMemberExpression,
    isIfStatement,
    isVariableDeclaration,
    isVariableDeclarator,
    isArrowFunctionExpression  
} from "./factory/nodeTests"
import { 
    classDefinitionFlags, 
    hasModifierFlag,
    classPropertySetOptional
 } from "./utilities/public"

type Visitor = (node: AstNode) => AstNode

export interface StructVariableMetadata {
    name: string,
    properties: string[],
    modifiers: Es2pandaModifierFlags,
    hasStateManagementType?: boolean
}

export class StructInfo {
    metadata: Record<string, StructVariableMetadata> = {};
    initializeBody: AstNode[] = [];
    updateBody: AstNode[] = [];
    isReusable: boolean = false;
    toRecordBody: Property[] = [];
}

export class GlobalInfo {
    private _structCollection: Set<string>;
    private static instance: GlobalInfo;
    private _structMap: Map<string, StructInfo>;

    private constructor() {
        this._structCollection = new Set();
        this._structMap = new Map();
    }

    public static getInfoInstance(): GlobalInfo {
        if (!this.instance) {
            this.instance = new GlobalInfo();
        }
        return this.instance;
    }

    public add(str: string): void {
        this._structCollection.add(str);
    }

    public getStructCollection(): Set<string> {
        return this._structCollection;
    }

    public getStructInfo(structName: string): StructInfo {
        const structInfo = this._structMap.get(structName);
        if (!structInfo) {
            return new StructInfo();
        }
        return structInfo;
    }

    public setStructInfo(structName: string, info: StructInfo): void {
        this._structMap.set(structName, info);
    }
}

// TODO: rethink (remove as)
function nodeVisitor<T extends AstNode | undefined>(node: T, visitor: Visitor): T {
    if (node === undefined) {
        return node
    }
    return visitor(node) as T
}

// TODO: rethink (remove as)
function nodesVisitor<T extends AstNode, TIn extends readonly T[] | undefined>(nodes: TIn, visitor: Visitor): T[] | TIn {
    if (nodes === undefined) {
        return nodes
    }
    return nodes.map(node => visitor(node) as T)
}

// TODO: apply this to all nodes that does not require updating
function visitWithoutUpdate<T extends AstNode>(
    node: T,
    visitor: Visitor
): T {
    if (isImportDeclaration(node)) {
        nodesVisitor(node.specifiers, visitor);
    }
    return node;
}

export function visitEachChild(
    node: AstNode,
    visitor: Visitor
): AstNode {
    if (isEtsScript(node)) {
        return factory.updateEtsScript(
            node,
            nodesVisitor(node.statements, visitor)
        );
    }
    if (isCallExpression(node)) {
        const call = factory.updateCallExpression(
            node,
            nodeVisitor(node.expression, visitor),
            nodesVisitor(node.typeArguments, visitor),
            nodesVisitor(node.arguments, visitor)
        );
        if (!!node.trailingBlock) {
            call.setTralingBlock(nodeVisitor(node.trailingBlock, visitor));
        }
        return call;
    }
    if (isFunctionDeclaration(node)) {
        return factory.updateFunctionDeclaration(
            node,
            nodeVisitor(node.scriptFunction, visitor),
            node.isAnon,
            node.annotations,
        );
    }
    if (isBlockStatement(node)) {
        return factory.updateBlock(
            node,
            nodesVisitor(node.statements, visitor),
        );
    }
    if (isExpressionStatement(node)) {
        return factory.updateExpressionStatement(
            node,
            nodeVisitor(node.expression, visitor)
        );
    }
    if (isClassDeclaration(node)) {
        return factory.updateClassDeclaration(
            node,
            nodeVisitor(node.definition, visitor)
        );
    }
    if (isStructDeclaration(node)) {
        return factory.updateStructDeclaration(
            node,
            nodeVisitor(node.definition, visitor)
        );
    }
    if (isClassDefinition(node)) {
        // TODO: fix
        return factory.updateClassDefinition(
            node,
            node.ident,
            node.typeParams,
            node.superTypeParams,
            node.implements,
            undefined,
            node.super,
            nodesVisitor(node.body, visitor),
            node.modifiers,
            classDefinitionFlags(node)
        );
    }
    if (isMethodDefinition(node)) {
        // TODO: fix
        return factory.updateMethodDefinition(
            node,
            node.kind,
            node.name,
            factory.createFunctionExpression(
                // TODO: maybe fix
                nodeVisitor(node.scriptFunction, visitor)
            ),
            node.modifiers,
            false
        );
    }
    if (isScriptFunction(node)) {
        return factory.updateScriptFunction(
            node,
            nodeVisitor(node.body, visitor),
            FunctionSignature.createFunctionSignature(
                nodeVisitor(node.typeParams, visitor),
                nodesVisitor(node.params, visitor),
                nodeVisitor(node.returnTypeAnnotation, visitor),
                node.hasReceiver
            ),
            node.flags,
            node.modifiers
        );
    }
    if (isMemberExpression(node)) {
        return factory.updateMemberExpression(
            node,
            nodeVisitor(node.object, visitor),
            nodeVisitor(node.property, visitor),
            node.kind,
            node.computed,
            node.optional
        );
    }
    if (isTSInterfaceDeclaration(node)) {
        return factory.updateInterfaceDeclaration(
            node,
            nodesVisitor(node.extends, visitor),
            nodeVisitor(node.id, visitor),
            nodeVisitor(node.typeParams, visitor),
            nodeVisitor(node.body, visitor),
            node.isStatic,
            // TODO: how do I get it?
            true
        );
    }
    if (isTSInterfaceBody(node)) {
        return factory.updateInterfaceBody(
            node,
            nodesVisitor(node.body, visitor)
        );
    }
    if (isIfStatement(node)) {
        return factory.updateIfStatement(
            node,
            nodeVisitor(node.test, visitor),
            nodeVisitor(node.consequent, visitor),
            nodeVisitor(node.alternate, visitor),
        );
    }
    if (isConditionalExpression(node)) {
        return factory.updateConditionalExpression(
            node,
            nodeVisitor(node.test, visitor),
            nodeVisitor(node.consequent, visitor),
            nodeVisitor(node.alternate, visitor),
        );
    }
    if (isVariableDeclaration(node)) {
        return factory.updateVariableDeclaration(
            node,
            0,
            node.declarationKind,
            nodesVisitor(node.declarators, visitor),
        );
    }
    if (isVariableDeclarator(node)) {
        return factory.updateVariableDeclarator(
            node,
            global.generatedEs2panda._VariableDeclaratorFlag(global.context, node.peer),
            nodeVisitor(node.name, visitor),
            nodeVisitor(node.initializer, visitor),
        );
    }
    if (isArrowFunctionExpression(node)) {
        return factory.updateArrowFunction(
            node,
            nodeVisitor(node.scriptFunction, visitor),
        );
    }
    if (isTSAsExpression(node)) {
        return factory.updateTSAsExpression(
            node,
            nodeVisitor(node.expr, visitor),
            nodeVisitor(node.typeAnnotation, visitor),
            node.isConst
        );
    }
    if (isClassProperty(node)) {
        return factory.updateClassProperty(
            node,
            node.key,
            nodeVisitor(node.value, visitor),
            node.typeAnnotation,
            node.modifiers,
            node.isComputed
        );
    }
    if (isClassProperty(node)) {
        const _node = factory.updateClassProperty(
            node,
            node.key,
            nodeVisitor(node.value, visitor),
            node.typeAnnotation,
            node.modifiers,
            node.isComputed
        );
        if (hasModifierFlag(node, Es2pandaModifierFlags.MODIFIER_FLAGS_OPTIONAL)) {
            classPropertySetOptional(_node, true);
        }
        _node.setAnnotations(node.annotations);
        return _node;
    }
    // TODO
    return visitWithoutUpdate(node, visitor);
}
