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

import { UnaryExpression, Expression } from '../../generated';
import { isSameNativeObject } from '../peers/ArktsObject';
import { attachModifiers, updateThenAttach } from '../utilities/private';
import { Es2pandaTokenType } from '../../generated/Es2pandaEnums';

export function updateUnaryExpression(
    original: UnaryExpression,
    argument: Expression | undefined,
    unaryOperator: Es2pandaTokenType
): UnaryExpression {
    if (isSameNativeObject(argument, original.argument) && isSameNativeObject(unaryOperator, original.operatorType)) {
        return original;
    }

    const update = updateThenAttach(UnaryExpression.updateUnaryExpression, attachModifiers);
    return update(original, argument, unaryOperator);
}
