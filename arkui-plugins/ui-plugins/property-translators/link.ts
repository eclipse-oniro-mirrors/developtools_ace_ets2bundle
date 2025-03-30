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

import { generateToRecord, createGetter, createSetter2, generateThisBacking, generateGetOrSetCall } from './utils';
import { PropertyTranslator } from './base';
import { GetterSetter, InitializerConstructor } from './types';
import { backingField, expectName } from '../../common/arkts-utils';
import { factory } from './factory';
import { createOptionalClassProperty } from '../utils';

export class LinkTranslator extends PropertyTranslator implements InitializerConstructor, GetterSetter {
    translateMember(): arkts.AstNode[] {
        const originalName: string = expectName(this.property.key);
        const newName: string = backingField(originalName);

        this.cacheTranslatedInitializer(newName, originalName); // TODO: need to release cache after some point...
        return this.translateWithoutInitializer(newName, originalName);
    }

    cacheTranslatedInitializer(newName: string, originalName: string): void {
        const currentStructInfo: arkts.StructInfo = arkts.GlobalInfo.getInfoInstance().getStructInfo(this.structName);
        const initializeStruct: arkts.AstNode = this.generateInitializeStruct(newName, originalName);
        currentStructInfo.initializeBody.push(initializeStruct);
        if (currentStructInfo.isReusable) {
            const toRecord = generateToRecord(newName, originalName);
            currentStructInfo.toRecordBody.push(toRecord);
        }
        arkts.GlobalInfo.getInfoInstance().setStructInfo(this.structName, currentStructInfo);
    }

    generateInitializeStruct(newName: string, originalName: string) {
        const test = factory.createBlockStatementForOptionalExpression(
            arkts.factory.createIdentifier('initializers'),
            newName,
        );

        const first = arkts.factory.createArrowFunction(
            arkts.factory.createScriptFunction(
                arkts.BlockStatement.createBlockStatement([
                    arkts.factory.createReturnStatement(
                        arkts.factory.createCallExpression(
                            arkts.factory.createMemberExpression(
                                arkts.factory.createTSNonNullExpression(
                                    arkts.factory.createMemberExpression(
                                        arkts.factory.createTSNonNullExpression(
                                            arkts.factory.createIdentifier('initializers'),
                                        ),
                                        arkts.factory.createIdentifier(newName),
                                        arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                                        false,
                                        false,
                                    ),
                                ),
                                arkts.factory.createIdentifier('get'),
                                arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                                false,
                                false,
                            ),
                            undefined,
                            undefined,
                        ),
                    ),
                ]),
                arkts.factory.createFunctionSignature(undefined, [], undefined, false),
                arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_ARROW,
                arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_NONE,
            ),
        );

        const second = arkts.factory.createArrowFunction(
            arkts.factory.createScriptFunction(
                arkts.BlockStatement.createBlockStatement([
                    arkts.factory.createExpressionStatement(
                        arkts.factory.createCallExpression(
                            arkts.factory.createMemberExpression(
                                arkts.factory.createTSNonNullExpression(
                                    arkts.factory.createMemberExpression(
                                        arkts.factory.createTSNonNullExpression(
                                            arkts.factory.createIdentifier('initializers'),
                                        ),
                                        arkts.factory.createIdentifier(newName),
                                        arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                                        false,
                                        false,
                                    ),
                                ),
                                arkts.factory.createIdentifier('set'),
                                arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                                false,
                                false,
                            ),
                            undefined,
                            [arkts.factory.createIdentifier('newValue')],
                        ),
                    ),
                ]),
                arkts.factory.createFunctionSignature(
                    undefined,
                    [
                        arkts.ETSParameterExpression.create(
                            arkts.factory.createIdentifier('newValue', this.property.typeAnnotation),
                            undefined,
                        ),
                    ],
                    undefined,
                    false,
                ),
                arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_ARROW,
                arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_NONE,
            ),
        );

        const consequent = arkts.BlockStatement.createBlockStatement([
            arkts.factory.createExpressionStatement(
                arkts.factory.createAssignmentExpression(
                    arkts.factory.createMemberExpression(
                        arkts.factory.createThisExpression(),
                        arkts.factory.createIdentifier(newName),
                        arkts.Es2pandaMemberExpressionKind.MEMBER_EXPRESSION_KIND_PROPERTY_ACCESS,
                        false,
                        false,
                    ),
                    arkts.Es2pandaTokenType.TOKEN_TYPE_PUNCTUATOR_SUBSTITUTION,
                    arkts.factory.createETSNewClassInstanceExpression(
                        arkts.factory.createTypeReference(
                            arkts.factory.createTypeReferencePart(
                                arkts.factory.createIdentifier('LinkDecoratedVariable'),
                                arkts.factory.createTSTypeParameterInstantiation(
                                    this.property.typeAnnotation ? [this.property.typeAnnotation] : [],
                                ),
                            ),
                        ),
                        [first, second],
                    ),
                ),
            ),
        ]);

        return arkts.factory.createExpressionStatement(arkts.factory.createIfStatement(test, consequent));
    }

    translateWithoutInitializer(newName: string, originalName: string): arkts.AstNode[] {
        const field: arkts.ClassProperty = createOptionalClassProperty(
            newName,
            this.property,
            'LinkDecoratedVariable',
            arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PRIVATE,
        );
        const thisValue: arkts.Expression = generateThisBacking(newName, false, true);
        const thisGet: arkts.CallExpression = generateGetOrSetCall(thisValue, 'get');
        const thisSet: arkts.ExpressionStatement = arkts.factory.createExpressionStatement(
            generateGetOrSetCall(thisValue, 'set'),
        );
        const getter: arkts.MethodDefinition = this.translateGetter(
            originalName,
            this.property.typeAnnotation,
            thisGet,
        );
        const setter: arkts.MethodDefinition = this.translateSetter(
            originalName,
            this.property.typeAnnotation,
            thisSet,
        );

        return [field, getter, setter];
    }

    translateGetter(
        originalName: string,
        typeAnnotation: arkts.TypeNode | undefined,
        returnValue: arkts.Expression,
    ): arkts.MethodDefinition {
        return createGetter(originalName, typeAnnotation, returnValue);
    }

    translateSetter(
        originalName: string,
        typeAnnotation: arkts.TypeNode | undefined,
        statement: arkts.AstNode,
    ): arkts.MethodDefinition {
        return createSetter2(originalName, typeAnnotation, statement);
    }
}
