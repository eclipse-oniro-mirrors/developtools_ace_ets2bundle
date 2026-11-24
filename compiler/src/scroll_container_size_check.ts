/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import ts from 'typescript';
import {
  LIST,
  GRID,
  SIZE,
  WATERFLOW,
  COMPONENT_EXTEND_DECORATOR
} from './pre_define';
import { GLOBAL_STYLE_FUNCTION, INNER_STYLE_FUNCTION } from './component_map';
import { LogType, LogInfo, addLog } from './utils';
import { getDecoratorNameFromAst } from './process_struct_componentV2';

export const LIST_DIRECTION: string = 'listDirection';
export const LAYOUT_DIRECTION: string = 'layoutDirection';
export const LAYOUT_WEIGHT: string = 'layoutWeight';
export const ASPECT_RATIO: string = 'aspectRatio';
export const CONSTRAINT_SIZE: string = 'constraintSize';
export const HEIGHT: string = 'height';
export const WIDTH: string = 'width';
export const MAX_HEIGHT: string = 'maxHeight';
export const MAX_WIDTH: string = 'maxWidth';
export const AXIS_VERTICAL: string = 'Axis.Vertical'; // 0 default
export const AXIS_HORIZONTAL: string = 'Axis.Horizontal'; // 1
export const GRID_DIRECTION_COLUMN: string = 'GridDirection.Column'; // 1 default
export const GRID_DIRECTION_ROW: string = 'GridDirection.Row'; // 0
export const GRID_DIRECTION_COLUMN_REVERSE: string = 'GridDirection.ColumnReverse'; // 3
export const GRID_DIRECTION_ROW_REVERSE: string = 'GridDirection.RowReverse'; // 2
export const FLEX_DIRECTION_COLUMN: string = 'FlexDirection.Column'; // 1 default
export const FLEX_DIRECTION_ROW: string = 'FlexDirection.Row'; // 0
export const FLEX_DIRECTION_COLUMN_REVERSE: string = 'FlexDirection.ColumnReverse'; // 3
export const FLEX_DIRECTION_ROW_REVERSE: string = 'FlexDirection.RowReverse'; // 2
export const SCROLL_CONTAINER_SIZE_CHECK_COMPONENTS: Set<string> = new Set([LIST, GRID, WATERFLOW]);

const extendStyleBlockCache: Map<string, ts.Block> = new Map();
let extendStyleBlockCacheFile: string = '';

enum ScrollContainerDirection {
  Unknown = 'unknown',
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

interface ScrollContainerDirectionMapping {
    verticalTexts: Set<string>,
    horizontalTexts: Set<string>,
    numericMap: Map<number, ScrollContainerDirection>,
    defaultDirection: ScrollContainerDirection
};

const LIST_DIRECTION_MAPPING: ScrollContainerDirectionMapping = {
    verticalTexts: new Set([AXIS_VERTICAL]),
    horizontalTexts: new Set([AXIS_HORIZONTAL]),
    numericMap: new Map<number, ScrollContainerDirection>([
        [0, ScrollContainerDirection.Vertical],
        [1, ScrollContainerDirection.Horizontal]
    ]),
    defaultDirection: ScrollContainerDirection.Vertical
};

const GRID_DIRECTION_MAPPING: ScrollContainerDirectionMapping = {
    verticalTexts: new Set([GRID_DIRECTION_COLUMN, GRID_DIRECTION_COLUMN_REVERSE]),
    horizontalTexts: new Set([GRID_DIRECTION_ROW, GRID_DIRECTION_ROW_REVERSE]),
    numericMap: new Map<number, ScrollContainerDirection>([
        [0, ScrollContainerDirection.Horizontal],
        [1, ScrollContainerDirection.Vertical],
        [2, ScrollContainerDirection.Horizontal],
        [3, ScrollContainerDirection.Vertical]
    ]),
    defaultDirection: ScrollContainerDirection.Vertical
};

const WATERFLOW_DIRECTION_MAPPING: ScrollContainerDirectionMapping = {
    verticalTexts: new Set([FLEX_DIRECTION_COLUMN, FLEX_DIRECTION_COLUMN_REVERSE]),
    horizontalTexts: new Set([FLEX_DIRECTION_ROW, FLEX_DIRECTION_ROW_REVERSE]),
    numericMap: new Map<number, ScrollContainerDirection>([
        [0, ScrollContainerDirection.Horizontal],
        [1, ScrollContainerDirection.Vertical],
        [2, ScrollContainerDirection.Horizontal],
        [3, ScrollContainerDirection.Vertical]
    ]),
    defaultDirection: ScrollContainerDirection.Vertical
};

function validateScrollComponentSizeWarning(
    componentName: string,
    identifierNode: ts.Identifier,
    log: LogInfo[],
    sourceFile: ts.SourceFile
): void {
    const message: string = `You are advised to initialize the width and height attributes of the ${componentName} component.`;
    addLog(LogType.WARN, message, identifierNode.getEnd(), log, sourceFile);
}

function hasExtendDecorator(functionDeclaration: ts.FunctionDeclaration): boolean {
    const decorators: readonly ts.Decorator[] = ts.getAllDecorators(functionDeclaration);
    if (!decorators || !decorators.length) {
        return false;
    }
    return decorators.some((decorator: ts.Decorator) => {
        if (!ts.isCallExpression(decorator.expression) ||
            !ts.isIdentifier(decorator.expression.expression)) {
            return false;
        }
        const astDecoratorName: string = getDecoratorNameFromAst(decorator);
        return astDecoratorName === COMPONENT_EXTEND_DECORATOR;
    });
}

function collectScrollContainerSizeAttrs(
    node: ts.EtsComponentExpression,
    attrMap: Map<string, ts.CallExpression>,
    sourceFileNode: ts.SourceFile
): void {
    let currentNode: ts.Node = node.parent;
    while (currentNode && !ts.isExpressionStatement(currentNode)) {
        if (ts.isPropertyAccessExpression(currentNode) && ts.isIdentifier(currentNode.name) &&
            currentNode.parent && ts.isCallExpression(currentNode.parent)) {
            const attributeName: string = currentNode.name.escapedText.toString();
            if (isScrollContainerStyleName(attributeName, sourceFileNode)) {
                expandScrollContainerSizeStyleAttrs(
                    getScrollContainerStyleBlock(attributeName, sourceFileNode), attrMap);
            } else {
                attrMap.set(attributeName, currentNode.parent);
            }
            currentNode = currentNode.parent.parent;
            continue;
        }
        currentNode = currentNode.parent;
    }
}

function getExtendStyleBlocks(sourceFileNode: ts.SourceFile): Map<string, ts.Block> {
    if (extendStyleBlockCacheFile === sourceFileNode.fileName) {
        return extendStyleBlockCache;
    }
    extendStyleBlockCache.clear();
    sourceFileNode.statements.forEach((statement: ts.Statement) => {
        if (ts.isFunctionDeclaration(statement) && statement.name && statement.body &&
            ts.isBlock(statement.body) && hasExtendDecorator(statement)) {
            extendStyleBlockCache.set(statement.name.getText(), statement.body);
        }
    });
    extendStyleBlockCacheFile = sourceFileNode.fileName;
    return extendStyleBlockCache;
}

function collectStyleBlockAttrs(
    stylesBlock: ts.Block,
    attrs: Map<string, ts.CallExpression>
): void {
    if (!stylesBlock.statements.length || !ts.isExpressionStatement(stylesBlock.statements[0])) {
        return;
    }
    let current: ts.Expression = stylesBlock.statements[0].expression;
    while (current) {
        if (ts.isCallExpression(current) &&
            ts.isPropertyAccessExpression(current.expression) &&
            ts.isIdentifier(current.expression.name)) {
            const attributeName: string = current.expression.name.escapedText.toString();
            if (!attrs.has(attributeName)) {
                attrs.set(attributeName, current);
            }
            current = current.expression.expression;
            continue;
        }
        if (ts.isPropertyAccessExpression(current)) {
            current = current.expression;
            continue;
        }
        break;
    }
}

function expandScrollContainerSizeStyleAttrs(
    styleBlock: ts.Block | undefined,
    attrMap: Map<string, ts.CallExpression>
): void {
    if (!styleBlock || !styleBlock.statements.length || !ts.isExpressionStatement(styleBlock.statements[0])) {
        return;
    }
    const bodyCalls: ts.CallExpression[] = [];
    let current: ts.Expression = styleBlock.statements[0].expression;
    while (current) {
        if (ts.isCallExpression(current) && ts.isPropertyAccessExpression(current.expression) &&
            ts.isIdentifier(current.expression.name)) {
            bodyCalls.push(current);
            current = current.expression.expression;
            continue;
        }
        if (ts.isPropertyAccessExpression(current)) {
            current = current.expression;
            continue;
        }
        break;
    }
    for (let index: number = bodyCalls.length - 1; index >= 0; index--) {
        const call: ts.CallExpression = bodyCalls[index];
        const attributeName: string = (call.expression as ts.PropertyAccessExpression).name.escapedText.toString();
        attrMap.set(attributeName, call);
    }
}

function isScrollContainerStyleName(
    attributeName: string,
    sourceFileNode: ts.SourceFile
): boolean {
    return INNER_STYLE_FUNCTION.has(attributeName) || GLOBAL_STYLE_FUNCTION.has(attributeName) ||
        getExtendStyleBlocks(sourceFileNode).has(attributeName);
}

function getScrollContainerStyleBlock(
    attributeName: string,
    sourceFileNode: ts.SourceFile
): ts.Block | undefined {
    return INNER_STYLE_FUNCTION.get(attributeName) || GLOBAL_STYLE_FUNCTION.get(attributeName) ||
        getExtendStyleBlocks(sourceFileNode).get(attributeName);
}

function getScrollContainerDirectionMapping(
    componentName: string
): ScrollContainerDirectionMapping {
    if (componentName === LIST) {
        return LIST_DIRECTION_MAPPING;
    }
    if (componentName === WATERFLOW) {
        return WATERFLOW_DIRECTION_MAPPING;
    }
    return GRID_DIRECTION_MAPPING;
}

function resolveScrollContainerDirection(
    componentName: string,
    attrs: Map<string, ts.CallExpression>
): ScrollContainerDirection {
    const mapping: ScrollContainerDirectionMapping = getScrollContainerDirectionMapping(componentName);
    const directionAttributeName: string = componentName === LIST ? LIST_DIRECTION : LAYOUT_DIRECTION;
    const directionCall: ts.CallExpression | undefined = attrs.get(directionAttributeName);
    if (!directionCall || !directionCall.arguments || directionCall.arguments.length === 0) {
        return mapping.defaultDirection;
    }
    const firstArgument: ts.Expression = directionCall.arguments[0];
    if (ts.isNumericLiteral(firstArgument)) {
        return mapping.numericMap.get(Number(firstArgument.text)) ?? mapping.defaultDirection;
    }
    const directionText: string = firstArgument.getText();
    if (mapping.verticalTexts.has(directionText)) {
        return ScrollContainerDirection.Vertical;
    }
    if (mapping.horizontalTexts.has(directionText)) {
        return ScrollContainerDirection.Horizontal;
    }
    return ScrollContainerDirection.Unknown;
}

function hasScrollContainerObjectLiteralKey(
    callExpression: ts.CallExpression,
    key: string
): boolean {
    if (callExpression.arguments && callExpression.arguments.length) {
        const firstArgument: ts.Expression = callExpression.arguments[0];
        if (ts.isObjectLiteralExpression(firstArgument)) {
            return firstArgument.properties.some((property: ts.ObjectLiteralElement) =>
                ts.isPropertyAssignment(property) && property.name && property.name.getText() === key
            );
        }
    }
    return false;
}

function hasScrollContainerEffectiveSize(
    attrs: Map<string, ts.CallExpression>,
    dimension: string
): boolean {
    if (attrs.has(dimension)) {
        return true;
    }
    const sizeCall: ts.CallExpression | undefined = attrs.get(SIZE);
    if (sizeCall && hasScrollContainerObjectLiteralKey(sizeCall, dimension)) {
        return true;
    }
    const constraintSizeCall: ts.CallExpression | undefined = attrs.get(CONSTRAINT_SIZE);
    const maxKey: string = dimension === HEIGHT ? MAX_HEIGHT : MAX_WIDTH;
    if (constraintSizeCall && hasScrollContainerObjectLiteralKey(constraintSizeCall, maxKey)) {
        return true;
    }
    return false;
}

function hasScrollContainerWithNoDirection(
    attrs: Map<string, ts.CallExpression>
): boolean {
    const hasHeightValue: boolean = hasScrollContainerEffectiveSize(attrs, HEIGHT);
    const hasWidthValue: boolean = hasScrollContainerEffectiveSize(attrs, WIDTH);
    if (hasHeightValue && hasWidthValue) {
        return true;
    }
    if (!attrs.has(ASPECT_RATIO)) {
        return false;
    }
    return hasHeightValue || hasWidthValue;
}

export function checkScrollContainerSize(
    node: ts.EtsComponentExpression,
    sourceFileNode: ts.SourceFile,
    log: LogInfo[]
): void {
    if (!ts.isIdentifier(node.expression)) {
        return;
    }
    const componentName: string = node.expression.escapedText.toString();
    if (!SCROLL_CONTAINER_SIZE_CHECK_COMPONENTS.has(componentName)) {
        return;
    }
    const attrMaps: Map<string, ts.CallExpression> = new Map<string, ts.CallExpression>();
    collectScrollContainerSizeAttrs(node, attrMaps, sourceFileNode);
    if (attrMaps.has(LAYOUT_WEIGHT)) {
        return;
    }
    const direction: ScrollContainerDirection = resolveScrollContainerDirection(componentName, attrMaps);
    if (direction === ScrollContainerDirection.Unknown) {
        !hasScrollContainerWithNoDirection(attrMaps) &&
            validateScrollComponentSizeWarning(componentName, node.expression, log, sourceFileNode);
        return;
    }
    const mainDimension: string =
        direction === ScrollContainerDirection.Vertical ? HEIGHT : WIDTH;
    const crossDimension: string =
        direction === ScrollContainerDirection.Vertical ? WIDTH : HEIGHT;
    if (hasScrollContainerEffectiveSize(attrMaps, mainDimension)) {
        return;
    }
    if (attrMaps.has(ASPECT_RATIO) && hasScrollContainerEffectiveSize(attrMaps, crossDimension)) {
        return;
    }
    validateScrollComponentSizeWarning(componentName, node.expression, log, sourceFileNode);
}

export function clearExtendBlockCache(): void {
    extendStyleBlockCache.clear();
    extendStyleBlockCacheFile = '';
}