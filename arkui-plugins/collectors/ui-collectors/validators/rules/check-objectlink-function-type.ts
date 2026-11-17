/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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
import { StructPropertyInfo } from '../../records';
import { DecoratorNames, LogType } from '../../../../common/predefines';
import { expectNameInTypeReference } from '../../../../common/arkts-utils';
import { getPerfName, performanceLog } from '../../../../common/debug';

export const checkObjectLinkFunctionType = performanceLog(
    _checkObjectLinkFunctionType,
    getPerfName([0, 0, 0, 0, 0], 'checkObjectLinkFunctionType')
);

/**
 * 校验规则：用于验证 @ObjectLink 装饰器不能修饰 Function 类型的变量
 * 1. 'Function' 类型引用不能用于 @ObjectLink（含通过类型别名解析到 'Function' 的情况）
 * 2. lambda 函数类型（如 '() => void'，含别名间接引用）不触发本规则：
 *    其为匿名类型，类型符号名不是 'Function'（与编译器 isFunctionType 的符号名判定一致）
 * 3. union 中只要存在 'Function' 类型成员即触发本规则（纯 lambda union 不触发）
 *
 * 校验等级：error
 */
function _checkObjectLinkFunctionType(
    this: BaseValidator<arkts.ClassProperty, StructPropertyInfo>,
    node: arkts.ClassProperty
): void {
    const metadata = this.context ?? {};
    if (!metadata.structInfo || !metadata.annotations?.[DecoratorNames.OBJECT_LINK]) {
        return;
    }
    if (!node.typeAnnotation || !node.key || !arkts.isIdentifier(node.key)) {
        return;
    }
    if (containsFunctionType(node.typeAnnotation, new Set<string>())) {
        this.report({
            node: node.key,
            level: LogType.ERROR,
            message: `'@${DecoratorNames.OBJECT_LINK}' cannot be used with this type. ` +
                `Apply it only to classes decorated by '@ObservedV2' or initialized using the return value of 'makeV1Observed'.`,
        });
    }
}

function containsFunctionType(typeNode: arkts.TypeNode, visited: Set<string>): boolean {
    if (isFunctionTypeReference(typeNode, visited)) {
        return true;
    }
    if (arkts.isETSUnionType(typeNode)) {
        return unionContainsFunctionType(typeNode, visited);
    }
    return false;
}

function isFunctionTypeReference(typeNode: arkts.TypeNode, visited: Set<string>): boolean {
    const nameNode = expectNameInTypeReference(typeNode);
    if (!nameNode) {
        return false;
    }
    const typeName = nameNode.name;
    if (typeName === 'Function') {
        return true;
    }
    const decl = arkts.getPeerIdentifierDecl(nameNode.peer);
    if (!decl || !arkts.isTSTypeAliasDeclaration(decl)) {
        return false;
    }
    if (visited.has(typeName)) {
        return false;
    }
    visited.add(typeName);
    return containsFunctionType(decl.typeAnnotation, visited);
}

function unionContainsFunctionType(unionType: arkts.ETSUnionType, visited: Set<string>): boolean {
    for (const type of unionType.types) {
        if (containsFunctionType(type, new Set(visited))) {
            return true;
        }
    }
    return false;
}
