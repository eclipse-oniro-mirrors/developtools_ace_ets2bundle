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
import {
    FunctionInfo,
    NormalClassMethodInfo,
    NormalClassPropertyInfo,
    StructMethodInfo,
    StructPropertyInfo,
} from '../../records';
import {
    BUILDER_DECORATOR_OPTION_IS_PLACEHOLDER,
    DecoratorNames,
    LogType,
} from '../../../../common/predefines';
import { getAnnotationUsageByName } from '../utils';
import { getPerfName, performanceLog } from '../../../../common/debug';

export const checkBuilderPlaceholderNoParam = performanceLog(
    _checkBuilderPlaceholderNoParam,
    getPerfName([0, 0, 0, 0, 0], 'checkBuilderPlaceholderNoParam')
);

export const checkBuilderMethodDecoratorArguments = performanceLog(
    _checkBuilderMethodDecoratorArguments,
    getPerfName([0, 0, 0, 0, 0], 'checkBuilderMethodDecoratorArguments')
);

export const checkBuilderFieldDecoratorArguments = performanceLog(
    _checkBuilderFieldDecoratorArguments,
    getPerfName([0, 0, 0, 0, 0], 'checkBuilderFieldDecoratorArguments')
);

const BUILDER_DECORATOR_ARGUMENTS_MESSAGE: string =
    `The '@Builder' decorator can only pass arguments when decorating a global function`;
const BUILDER_PLACEHOLDER_NO_PARAM_MESSAGE: string =
    `The '@Builder' function cannot have parameters when it serves as a placeholder`;

/**
 * Read the `isPlaceholder` option of a `Builder` annotation usage. Only an explicit boolean
 * literal counts; any other form yields undefined (invalid forms are rejected by the
 * front-end/checker via the typed `@interface Builder` declaration).
 */
export function getIsPlaceholderOption(annotation: arkts.AnnotationUsage): boolean | undefined {
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
 * 校验规则（D-4）：全局 `@Builder({ isPlaceholder: true })` 函数不可声明参数。
 *
 * 校验等级：error
 */
function _checkBuilderPlaceholderNoParam(
    this: BaseValidator<arkts.MethodDefinition, FunctionInfo>,
    node: arkts.MethodDefinition
): void {
    const builderAnnotation = getBuilderAnnotationOfMethod(node);
    if (!builderAnnotation) {
        return;
    }
    if (getIsPlaceholderOption(builderAnnotation) !== true) {
        return;
    }
    if (node.function && node.function.params.length > 0) {
        this.report({
            node: builderAnnotation,
            level: LogType.ERROR,
            message: BUILDER_PLACEHOLDER_NO_PARAM_MESSAGE,
        });
    }
}

/**
 * 校验规则（D-1）：struct/普通 class 成员方法的 `@Builder` 装饰器不可携带实参（任意形态，
 * 含单值合成键）；裸 `@Builder` 与 `@Builder()` 不受影响。
 *
 * 校验等级：error
 */
function _checkBuilderMethodDecoratorArguments(
    this: BaseValidator<arkts.MethodDefinition, StructMethodInfo | NormalClassMethodInfo>,
    node: arkts.MethodDefinition
): void {
    const builderAnnotation = getBuilderAnnotationOfMethod(node);
    if (!builderAnnotation) {
        return;
    }
    if (builderAnnotation.properties.length > 0) {
        this.report({
            node: builderAnnotation,
            level: LogType.ERROR,
            message: BUILDER_DECORATOR_ARGUMENTS_MESSAGE,
        });
    }
}

/**
 * 校验规则（D-1）：struct/普通 class 成员属性（class field）的 `@Builder` 装饰器同样不可
 * 携带实参——占位 Builder 契约仅覆盖全局函数，字段位置声明装饰器参数即误用。
 *
 * 校验等级：error
 */
function _checkBuilderFieldDecoratorArguments(
    this: BaseValidator<arkts.ClassProperty, StructPropertyInfo | NormalClassPropertyInfo>,
    node: arkts.ClassProperty
): void {
    const builderAnnotation = getAnnotationUsageByName(node.annotations, DecoratorNames.BUILDER);
    if (!builderAnnotation) {
        return;
    }
    if (builderAnnotation.properties.length > 0) {
        this.report({
            node: builderAnnotation,
            level: LogType.ERROR,
            message: BUILDER_DECORATOR_ARGUMENTS_MESSAGE,
        });
    }
}

function getBuilderAnnotationOfMethod(node: arkts.MethodDefinition): arkts.AnnotationUsage | undefined {
    if (!node.function) {
        return undefined;
    }
    return getAnnotationUsageByName(node.function.annotations, DecoratorNames.BUILDER);
}
