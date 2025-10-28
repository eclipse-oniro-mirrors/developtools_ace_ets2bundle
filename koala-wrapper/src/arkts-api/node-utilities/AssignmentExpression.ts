/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { isSameNativeObject } from '../peers/ArktsObject';
import { AstNode } from '../peers/AstNode';
import { AssignmentExpression } from '../types';
import { Es2pandaTokenType } from '../../generated/Es2pandaEnums';
import { Expression } from '../../generated/peers/Expression';

export function updateAssignmentExpression(
    original: AssignmentExpression,
    left: AstNode,
    assignmentOperator: Es2pandaTokenType,
    right: AstNode
): AssignmentExpression {
    if (
        isSameNativeObject(left, original.left) &&
        isSameNativeObject(assignmentOperator, original.operatorType) &&
        isSameNativeObject(right, original.right)
    ) {
        return original;
    }

    original.setOperatorType(assignmentOperator);
    original.setLeft(left as Expression);
    original.setRight(right as Expression);
    return original;
}
