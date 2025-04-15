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

import * as arkts from '@koalaui/libarkts';
import { getCustomComponentOptionsName, Router } from './utils';


export function addRegisterRouterMethod(
    node: arkts.ClassDeclaration
): arkts.ClassDeclaration {
    const definition: arkts.ClassDefinition = node.definition!;
    const registerMethod = createRegisterMethod()
    return node;
}

export function createRegisterMethod(): arkts.MethodDefinition {
    const script = arkts.factory.createScriptFunction(
        arkts.factory.createBlock([createRegisterCall()]),
        arkts.FunctionSignature.createFunctionSignature(
            undefined,
            [],
            arkts.factory.createPrimitiveType(arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_VOID),
            false
        ),
        arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_METHOD,
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC | arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC
    );

    return arkts.factory.createMethodDefinition(
        arkts.Es2pandaMethodDefinitionKind.METHOD_DEFINITION_KIND_METHOD,
        arkts.factory.createIdentifier(Router.REGISTERROUTER),
        arkts.factory.createFunctionExpression(script),
        arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC | arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_STATIC,
        false
    );
}

export function createRegisterCall (): arkts.Statement {
    return arkts.factory.createCallExpression(
        arkts.factory.createIdentifier(Router.REGISTERPAGE),
        undefined,
        [
            
        ]
    )
}