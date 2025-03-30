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
import { annotation } from '../../common/arkts-utils';
import { factory } from './factory';

export enum DecoratorNames {
    STATE = 'State',
    STORAGE_LINK = 'StorageLink',
    STORAGE_PROP = 'StorageProp',
    LINK = 'Link',
    PROP = 'Prop',
    PROVIDE = 'Provide',
    CONSUME = 'Consume',
    OBJECT_LINK = 'ObjectLink',
    OBSERVED = 'Observed',
    WATCH = 'Watch',
    BUILDER_PARAM = 'BuilderParam',
    BUILDER = 'Builder',
    CUSTOM_DIALOG = 'CustomDialog',
    LOCAL_STORAGE_PROP = 'LocalStorageProp',
    LOCAL_STORAGE_LINK = 'LocalStorageLink',
    REUSABLE = 'Reusable',
}

export function collectPropertyDecorators(property: arkts.ClassProperty): string[] {
    const properties: string[] = [];
    property.annotations.forEach((anno) => {
        if (!!anno.expr && arkts.isIdentifier(anno.expr)) {
            properties.push(anno.expr.name);
        }
    });
    return properties;
}

export function isDecoratorAnnotation(anno: arkts.AnnotationUsage, decoratorName: DecoratorNames): boolean {
    return !!anno.expr && arkts.isIdentifier(anno.expr) && anno.expr.name === decoratorName;
}

export function hasDecorator(
    property: arkts.ClassProperty | arkts.ClassDefinition | arkts.MethodDefinition,
    decoratorName: DecoratorNames,
): boolean {
    if (arkts.isMethodDefinition(property)) {
        return property.scriptFunction.annotations.some((anno) => isDecoratorAnnotation(anno, decoratorName));
    }
    return property.annotations.some((anno) => isDecoratorAnnotation(anno, decoratorName));
}

export function getStageManagementType(node: arkts.ClassProperty): string {
    if (hasDecorator(node, DecoratorNames.STATE)) {
        return 'StateDecoratedVariable';
    } else if (hasDecorator(node, DecoratorNames.LINK)) {
        return 'DecoratedMutableVariable';
    } else if (
        hasDecorator(node, DecoratorNames.PROP) ||
        hasDecorator(node, DecoratorNames.STORAGE_PROP) ||
        hasDecorator(node, DecoratorNames.LOCAL_STORAGE_PROP) ||
        hasDecorator(node, DecoratorNames.OBJECT_LINK)
    ) {
        return 'SyncedProperty';
    }
    return 'MutableState';
}

export function createGetter(
    name: string,
    type: arkts.TypeNode | undefined,
    returns: arkts.Expression,
): arkts.MethodDefinition {
    const body = arkts.factory.createBlock([arkts.factory.createReturnStatement(returns)]);

    const scriptFunction = arkts.factory.createScriptFunction(
        body,
        arkts.FunctionSignature.createFunctionSignature(undefined, [], type?.clone(), false),
        arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_GETTER,
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
    );
    return arkts.factory.createMethodDefinition(
        arkts.Es2pandaMethodDefinitionKind.METHOD_DEFINITION_KIND_GET,
        arkts.factory.createIdentifier(name),
        arkts.factory.createFunctionExpression(scriptFunction),
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
        false,
    );
}

export function createSetter(
    name: string,
    type: arkts.TypeNode | undefined,
    left: arkts.Expression,
    right: arkts.AstNode,
    needMemo: boolean = false,
): arkts.MethodDefinition {
    const body = arkts.factory.createBlock([
        arkts.factory.createExpressionStatement(
            arkts.factory.createAssignmentExpression(
                left,
                arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_SUBSTITUTION,
                right,
            ),
        ),
    ]);
    const param: arkts.ETSParameterExpression = arkts.factory.createParameterDeclaration(
        arkts.factory.createIdentifier('value', type?.clone()),
        undefined,
    );
    if (needMemo) {
        param.annotations = [annotation('memo')];
    }
    const scriptFunction = arkts.factory.createScriptFunction(
        body,
        arkts.FunctionSignature.createFunctionSignature(undefined, [param], undefined, false),
        arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_SETTER,
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
    );

    return arkts.factory.createMethodDefinition(
        arkts.Es2pandaMethodDefinitionKind.METHOD_DEFINITION_KIND_SET,
        arkts.factory.createIdentifier(name),
        arkts.factory.createFunctionExpression(scriptFunction),
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
        false,
    );
}

export function createSetter2(
    name: string,
    type: arkts.TypeNode | undefined,
    statement: arkts.AstNode,
): arkts.MethodDefinition {
    const body = arkts.factory.createBlock([statement]);
    const param: arkts.ETSParameterExpression = arkts.factory.createParameterDeclaration(
        arkts.factory.createIdentifier('value', type?.clone()),
        undefined,
    );
    const scriptFunction = arkts.factory.createScriptFunction(
        body,
        arkts.FunctionSignature.createFunctionSignature(undefined, [param], undefined, false),
        arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_SETTER,
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
    );

    return arkts.factory.createMethodDefinition(
        arkts.Es2pandaMethodDefinitionKind.METHOD_DEFINITION_KIND_SET,
        arkts.factory.createIdentifier(name),
        arkts.factory.createFunctionExpression(scriptFunction),
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC,
        false,
    );
}

export function generateThisBackingValue(
    name: string,
    optional: boolean = false,
    nonNull: boolean = false,
): arkts.MemberExpression {
    const member: arkts.Expression = generateThisBacking(name, optional, nonNull);
    return arkts.factory.createMemberExpression(
        member,
        arkts.factory.createIdentifier('value'),
        arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
        false,
        false,
    );
}

export function generateThisBacking(
    name: string,
    optional: boolean = false,
    nonNull: boolean = false,
): arkts.Expression {
    const member: arkts.Expression = arkts.factory.createMemberExpression(
        arkts.factory.createThisExpression(),
        arkts.factory.createIdentifier(`${name}`),
        arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
        false,
        optional,
    );
    return nonNull ? arkts.factory.createTSNonNullExpression(member) : member;
}

function getValueStr(node: arkts.AstNode): string | undefined {
    if (!arkts.isClassProperty(node) || !node.value) return undefined;
    return arkts.isStringLiteral(node.value) ? node.value.str : undefined;
}

function getAnnotationValue(anno: arkts.AnnotationUsage, decoratorName: DecoratorNames): string | undefined {
    const isSuitableAnnotation: boolean =
        !!anno.expr && arkts.isIdentifier(anno.expr) && anno.expr.name === decoratorName;
    if (isSuitableAnnotation && anno.properties.length === 1) {
        return getValueStr(anno.properties.at(0)!);
    }
    return undefined;
}

export function getValueInAnnotation(node: arkts.ClassProperty, decoratorName: DecoratorNames): string | undefined {
    const annotations: readonly arkts.AnnotationUsage[] = node.annotations;
    for (let i = 0; i < annotations.length; i++) {
        const anno: arkts.AnnotationUsage = annotations[i];
        const str: string | undefined = getAnnotationValue(anno, decoratorName);
        if (!!str) {
            return str;
        }
    }
    return undefined;
}

export function generateGetOrSetCall(beforCall: arkts.AstNode, type: string) {
    return arkts.factory.createCallExpression(
        arkts.factory.createMemberExpression(
            beforCall,
            arkts.factory.createIdentifier(type),
            arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
            false,
            false,
        ),
        undefined,
        type === 'set' ? [arkts.factory.createIdentifier('value')] : undefined,
        undefined,
    );
}

export function generateToRecord(newName: string, originalName: string): arkts.Property {
    return arkts.Property.createProperty(
        arkts.factory.createStringLiteral(originalName),
        arkts.factory.createBinaryExpression(
            // arkts.factory.createMemberExpression(
            //     arkts.factory.createMemberExpression(
            //         arkts.factory.createThisExpression(),
            //         arkts.factory.createIdentifier(newName),
            //         arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
            //         false,
            //         false
            //     ),
            //     arkts.factory.createIdentifier("value"),
            //     arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
            //     false,
            //     false
            // ),
            factory.createBlockStatementForOptionalExpression(
                arkts.factory.createMemberExpression(
                    arkts.factory.createThisExpression(),
                    arkts.factory.createIdentifier(newName),
                    arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                    false,
                    false,
                ),
                'value',
            ),
            arkts.ETSNewClassInstanceExpression.createETSNewClassInstanceExpression(
                arkts.factory.createTypeReference(
                    arkts.factory.createTypeReferencePart(arkts.factory.createIdentifier('Object')),
                ),
                [],
            ),
            arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_NULLISH_COALESCING,
        ),
    );
}

export function getStageManagementIdent(property: arkts.ClassProperty): string {
    const useMutableState: boolean =
        hasDecorator(property, DecoratorNames.STATE) ||
        hasDecorator(property, DecoratorNames.STORAGE_LINK) ||
        hasDecorator(property, DecoratorNames.PROVIDE) ||
        hasDecorator(property, DecoratorNames.CONSUME) ||
        hasDecorator(property, DecoratorNames.LINK) ||
        hasDecorator(property, DecoratorNames.LOCAL_STORAGE_LINK) ||
        hasDecorator(property, DecoratorNames.LINK);
    const useSyncedProperty: boolean =
        hasDecorator(property, DecoratorNames.PROP) ||
        hasDecorator(property, DecoratorNames.STORAGE_PROP) ||
        hasDecorator(property, DecoratorNames.LOCAL_STORAGE_PROP) ||
        hasDecorator(property, DecoratorNames.OBJECT_LINK);
    if (useMutableState) {
        return 'MutableState';
    } else if (useSyncedProperty) {
        return 'SyncedProperty';
    } else {
        return '';
    }
}
