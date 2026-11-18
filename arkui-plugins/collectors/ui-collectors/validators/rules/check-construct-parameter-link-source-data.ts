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
import { BaseValidator } from '../base';
import { CallInfo } from '../../records';
import { LogType } from '../../../../common/predefines';
import { getPerfName, performanceLog } from '../../../../common/debug';

export const checkConstructParameterLinkSourceData = performanceLog(
    _checkConstructParameterLinkSourceData,
    getPerfName([0, 0, 0, 0, 0], 'checkConstructParameterLinkSourceData')
);

const LINK_SOURCE_DATA_MISMATCH = (propertyName: string): string =>
    `The type of the parent component's state variable initializing the '@Link' variable '${propertyName}' must match the '@Link' variable's declared type.`;

function _checkConstructParameterLinkSourceData(
    this: BaseValidator<arkts.CallExpression, CallInfo>,
    node: arkts.CallExpression
): void {
    const metadata = this.context ?? {};
    if (!metadata.structDeclInfo || !metadata.fromStructInfo) {
        return;
    }
    const fromAnnoInfo = metadata.fromStructInfo.annotationInfo;
    if (!fromAnnoInfo?.hasComponent && !fromAnnoInfo?.hasCustomDialog) {
        return;
    }
    // A struct call used as a property value (e.g. the official @CustomDialog pattern
    // `builder: CustomDialogExample({...})`, optionally with the value wrapped in a type
    // assertion) instantiates a slot with placeholder options: they are not parent state
    // initializing the child's @Link variables, so the check does not apply.
    if (isCallInPropertyValuePosition(node)) {
        return;
    }
    metadata.structPropertyInfos?.forEach(([propertyPtr, propertyInfo]) => {
        if (!propertyPtr || !propertyInfo) {
            return;
        }
        if (!propertyInfo.annotationInfo?.hasLink) {
            return;
        }
        const property = arkts.unpackNonNullableNode<arkts.Property>(propertyPtr);
        if (!property.key || !arkts.isIdentifier(property.key)) {
            return;
        }
        const propertyName = property.key.name;
        const propertyValue = property.value;
        if (!propertyName || !propertyValue || isInitFromMatchSourceDataPropertyValue(propertyValue)) {
            return;
        }
        this.report({
            node: property,
            level: LogType.ERROR,
            message: LINK_SOURCE_DATA_MISMATCH(propertyName),
        });
    });
}

function isCallInPropertyValuePosition(node: arkts.CallExpression): boolean {
    const parent = node.parent;
    if (!parent) {
        return false;
    }
    if (arkts.isProperty(parent)) {
        return true;
    }
    if (arkts.isTSAsExpression(parent)) {
        const grandParent = parent.parent;
        return !!grandParent && arkts.isProperty(grandParent);
    }
    return false;
}

function isInitFromMatchSourceDataPropertyValue(value: arkts.Expression): boolean {
    if (arkts.isTSNonNullExpression(value)) {
        const expr = value.expr;
        return !!expr && isInitFromMatchSourceDataPropertyValue(expr);
    }
    if (arkts.isTSAsExpression(value)) {
        const expr = value.expr;
        return !!expr && isInitFromMatchSourceDataPropertyValue(expr);
    }
    return arkts.isMemberExpression(value) && !!value.object && arkts.isThisExpression(value.object);
}
