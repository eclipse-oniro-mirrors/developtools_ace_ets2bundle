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

export const checkBuilderPlaceholderOptions = performanceLog(
    _checkBuilderPlaceholderOptions,
    getPerfName([0, 0, 0, 0, 0], 'checkBuilderPlaceholderOptions')
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
    `Only global functions decorated with @Builder support parameter passing.`;
const BUILDER_PLACEHOLDER_NO_PARAM_MESSAGE: string =
    `An @Builder function with placeholder capabilities does not support parameter passing.`;
const BUILDER_PLACEHOLDER_BOOL_ONLY_MESSAGE: string =
    `The 'isPlaceholder' option of the @Builder decorator only supports passing boolean literal.`;

/**
 * Single-pass parse of a Builder annotation's isPlaceholder option: only an explicit
 * boolean literal counts; other forms are rejected by the front-end via the typed
 * `@interface Builder` declaration.
 */
interface BuilderPlaceholderParseResult {
    /** Value of the first explicit boolean-literal `isPlaceholder` property. */
    placeholderValue: boolean | undefined;
    /** An `isPlaceholder` key exists whose value is not a boolean literal. */
    hasInvalidPlaceholder: boolean;
}

function parseBuilderPlaceholderOptions(
    annotation: arkts.AnnotationUsage
): BuilderPlaceholderParseResult {
    const result: BuilderPlaceholderParseResult = {
        placeholderValue: undefined,
        hasInvalidPlaceholder: false,
    };
    for (const property of annotation.properties) {
        if (
            !arkts.isClassProperty(property) ||
            !property.key ||
            !arkts.isIdentifier(property.key) ||
            property.key.name !== BUILDER_DECORATOR_OPTION_IS_PLACEHOLDER
        ) {
            continue;
        }
        if (property.value && arkts.isBooleanLiteral(property.value)) {
            if (result.placeholderValue === undefined) {
                result.placeholderValue = property.value.value;
            }
        } else {
            result.hasInvalidPlaceholder = true;
        }
    }
    return result;
}

/**
 * Rules D-3 + D-4 for global @Builder functions: one annotation lookup and one property
 * pass for both.
 * - D-3: a passed options object must carry an explicit boolean isPlaceholder. Checker
 *   folds constants and the front-end rejects dirty forms, so this is defense-in-depth.
 *   Bare '@Builder'/'@Builder()'/'@Builder({})' stay lenient, same as the dynamic side.
 * - D-4: explicit true plus declared parameters.
 */
function _checkBuilderPlaceholderOptions(
    this: BaseValidator<arkts.MethodDefinition, FunctionInfo>,
    node: arkts.MethodDefinition
): void {
    const builderAnnotation = getBuilderAnnotationOfMethod(node);
    if (!builderAnnotation) {
        return;
    }
    const properties = builderAnnotation.properties;
    if (!properties || properties.length === 0) {
        // bare '@Builder' / '@Builder()' / '@Builder({})': lenient, same as the dynamic side
        return;
    }
    const parsed = parseBuilderPlaceholderOptions(builderAnnotation);
    if (parsed.hasInvalidPlaceholder || parsed.placeholderValue === undefined) {
        // D-3 (defense-in-depth): non-empty literal without an explicit boolean isPlaceholder
        this.report({
            node: builderAnnotation,
            level: LogType.ERROR,
            message: BUILDER_PLACEHOLDER_BOOL_ONLY_MESSAGE,
        });
        return;
    }
    if (parsed.placeholderValue === true && node.function && node.function.params.length > 0) {
        // D-4: placeholder builder declaring parameters
        this.report({
            node: builderAnnotation,
            level: LogType.ERROR,
            message: BUILDER_PLACEHOLDER_NO_PARAM_MESSAGE,
        });
    }
}

/**
 * Rule D-1: struct/normal-class member method @Builder must not carry arguments;
 * bare '@Builder' and '@Builder()' stay legal.
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
 * Rule D-1: struct/normal-class member property @Builder must not carry arguments either
 * (the placeholder contract covers global functions only).
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
