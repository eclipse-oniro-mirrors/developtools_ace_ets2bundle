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
import { LogInfo, LogType, isIdentifierConst, isArrayEqualIgnoreOrder } from './utils';
import { COMPONENT_ENV_DECORATOR, COMPONENT_CUSTOM_ENV_DECORATOR } from './pre_define';
import { getDecoratorName, getDecoratorNameFromAst } from './process_struct_componentV2';
import { transformLog } from './process_ui_syntax';

export function parseEnvDecoratorV2(member: ts.PropertyDeclaration, checker: ts.TypeChecker, log: LogInfo[]): void {
  if (member.initializer) {
    log.push({
      type: LogType.ERROR, message: `The '@Env' property cannot be specified a default value.`,
      pos: member.getStart(), code: '10905362'
    });
  }
  const decorator: ts.Decorator | undefined = ts.getAllDecorators(member).find(item =>
    getDecoratorName(item) === COMPONENT_ENV_DECORATOR);
  const propertyType: ts.Type | undefined = checker?.getTypeAtLocation?.(member);
  const envTypeName: EnvTypeName = { currentTypeName: '', envArgStatus: ENV_ARG_STATUS.SYSTEM_PROPERTIES };
  decorator && preCheckEnvDecoratorArg(decorator, envTypeName);
  if (envTypeName.envArgStatus === ENV_ARG_STATUS.WRITABLE_SYSTEM_ENV ||
    envTypeName.envArgStatus === ENV_ARG_STATUS.READONLY_SYSTEM_ENV) {
    checkNonSystemEnvDecoratorExp(decorator, member.type, checker);
  } else if (propertyType && !checkEnvType(propertyType, envTypeName, checker)) {
    validateEnvType(member);
  } else if (propertyType && decorator) {
    checkEnvDecoratorExp(decorator, envTypeName.currentTypeName, checker);
  }
}

export function parseCustomEnvDecoratorV2(member: ts.PropertyDeclaration, checker: ts.TypeChecker): void {
  const decorator: ts.Decorator | undefined = ts.getAllDecorators(member).find(item =>
    getDecoratorNameFromAst(item) === COMPONENT_CUSTOM_ENV_DECORATOR);
  const typeNames: CustomEnvTypeName = { currentTypeNames: [] };
  checkCustomEnvType(member.type, typeNames);
  if (decorator) {
    checkCustomEnvDecoratorExp(decorator, typeNames.currentTypeNames, checker);
  }
}

export function parseEnvDecoratorV1(member: ts.PropertyDeclaration, checker: ts.TypeChecker): void {
  const type = checker?.getTypeAtLocation?.(member);
  if (!type) {
    return;
  }
  const decorator = (ts.getAllDecorators(member) || []).find(item => getDecoratorName(item) === COMPONENT_ENV_DECORATOR);
  const names: EnvTypeName = { currentTypeName: '', envArgStatus: ENV_ARG_STATUS.SYSTEM_PROPERTIES };
  decorator && preCheckEnvDecoratorArg(decorator, names);
  if (names.envArgStatus === ENV_ARG_STATUS.WRITABLE_SYSTEM_ENV || names.envArgStatus === ENV_ARG_STATUS.READONLY_SYSTEM_ENV) {
    checkNonSystemEnvDecoratorExp(decorator, member.type, checker);
  } else if (!checkEnvType(type, names, checker)) {
    validateEnvType(member);
  } else if (decorator) {
    checkEnvDecoratorExp(decorator, names.currentTypeName, checker);
  }
}

const envSupportClass: string = 'WindowSizeLayoutBreakpointInfo';
const sizeInVPClass: string = 'SizeInVP';
const sizeClass: string = 'Size';
const uiEnvWindowAvoidAreaInfoPXClass: string = 'UIEnvWindowAvoidAreaInfoPX';
const uiEnvWindowAvoidAreaInfoVPClass: string = 'UIEnvWindowAvoidAreaInfoVP';
const envPrimitiveNumberType: string = 'number';
const envPrimitiveBooleanType: string = 'boolean';

const SYSTEM_PROPERTIES: string = 'SystemProperties';
const WRITABLE_SYSTEMENV: string = 'WritableEnvKey';
const READONLY_SYSTEMENV: string = 'ReadonlyEnvKey';

const envSupportArg: string = 'SystemProperties.BREAK_POINT';
const envWindowAvoidArea: string = 'SystemProperties.WINDOW_AVOID_AREA';
const envWindowAvoidAreaPx: string = 'SystemProperties.WINDOW_AVOID_AREA_PX';
const envWindowSize: string = 'SystemProperties.WINDOW_SIZE';
const envWindowSizePx: string = 'SystemProperties.WINDOW_SIZE_PX';

const envIsFocused: string = 'SystemProperties.WINDOW_IS_FOCUSED';
const envIsHighlighted: string = 'SystemProperties.WINDOW_IS_HIGHLIGHTED';
const systemDensity: string = 'SystemProperties.WINDOW_SYSTEM_DENSITY';
const systemDisplayId: string = 'SystemProperties.WINDOW_DISPLAY_ID';

const envAllowTypesAndArgs: Map<string, Array<string>> = new Map([
  [envSupportClass, [envSupportArg]],
  [uiEnvWindowAvoidAreaInfoVPClass, [envWindowAvoidArea]],
  [uiEnvWindowAvoidAreaInfoPXClass, [envWindowAvoidAreaPx]],
  [sizeInVPClass, [envWindowSize]],
  [sizeClass, [envWindowSizePx]],
  [envPrimitiveNumberType, [systemDisplayId, systemDensity]],
  [envPrimitiveBooleanType, [envIsFocused, envIsHighlighted]]
]);

const CUSTOM_ENV_KEY: string = 'CustomEnvKey';
const CREATE: string = 'create';

export interface CustomEnvTypeName {
  currentTypeNames: string[]
}

export function checkCustomEnvType(
  propertyTypeNode: ts.TypeNode | undefined,
  customEnvTypeName: CustomEnvTypeName
): void {
  if (!propertyTypeNode) {
    return;
  }
  const result: string[] = [];
  if (!ts.isUnionTypeNode(propertyTypeNode)) {
    result.push(propertyTypeNode.getText());
    customEnvTypeName.currentTypeNames = result;
    return;
  }
  result.push(...collectUnionTypes(propertyTypeNode));
  customEnvTypeName.currentTypeNames = result;
}

export function checkCustomEnvDecoratorExp(
  node: ts.Decorator,
  currentTypeNames: string[],
  checker: ts.TypeChecker | undefined): void {
  if (!checker || !node.expression || !ts.isCallExpression(node.expression) ||
    !node.expression.arguments || !node.expression.arguments.length) {
    return;
  }
  const customEnvArg: ts.Expression = node.expression.arguments[0];
  if (ts.isIdentifier(customEnvArg)) {
    checkCustomEnvIdentifierType(
      customEnvArg,
      checker,
      currentTypeNames
    );
    return;
  }
  if (!ts.isCallExpression(customEnvArg) ||
    !ts.isPropertyAccessExpression(customEnvArg.expression)) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return;
  }
  const TEMP_PROPERTYACCESS: ts.PropertyAccessExpression = customEnvArg.expression;
  const shouldContinue: boolean = validateCustomEnvPropertyAccess(TEMP_PROPERTYACCESS, customEnvArg);
  if (!shouldContinue) {
    return;
  }
  if (!customEnvArg.typeArguments ||
    !customEnvArg.typeArguments.length) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return;
  }
  const TEMP_REFERENCE_NODE: ts.TypeNode = customEnvArg.typeArguments[0];
  const TYPE_NAMES: string[] = [];
  if (!ts.isUnionTypeNode(TEMP_REFERENCE_NODE)) {
    TYPE_NAMES.push(TEMP_REFERENCE_NODE.getText());
  } else {
    TYPE_NAMES.push(...collectUnionTypes(TEMP_REFERENCE_NODE));
  }
  (!isArrayEqualIgnoreOrder(TYPE_NAMES, currentTypeNames)) &&
    validateCustomEnvArgType(customEnvArg);
}

function checkCustomEnvInitializer(
  initializer: ts.Expression,
  currentTypeNames: string[],
  customEnvArg: ts.Identifier
): void {
  let shouldContinue: boolean = true;
  if (!ts.isCallExpression(initializer) ||
    !ts.isPropertyAccessExpression(initializer.expression) ||
    !initializer.typeArguments ||
    !initializer.typeArguments.length) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return;
  }
  const TEMP_PROPERTYACCESS: ts.PropertyAccessExpression = initializer.expression;
  shouldContinue = validateCustomEnvPropertyAccess(TEMP_PROPERTYACCESS, customEnvArg);
  if (!shouldContinue) {
    return;
  }
  const TEMP_REFERENCE_NODE: ts.TypeNode = initializer.typeArguments[0];
  const TYPE_NAMES: string[] = [];
  if (!ts.isUnionTypeNode(TEMP_REFERENCE_NODE)) {
    TYPE_NAMES.push(TEMP_REFERENCE_NODE.getText());
  } else {
    TYPE_NAMES.push(...collectUnionTypes(TEMP_REFERENCE_NODE));
  }
  (!isArrayEqualIgnoreOrder(TYPE_NAMES, currentTypeNames)) &&
    validateCustomEnvArgType(customEnvArg);
}

function validateCustomEnvPropertyAccess(
  tempPropertyAccess: ts.PropertyAccessExpression,
  customEnvArg: ts.Expression
): boolean {
  if (!ts.isIdentifier(tempPropertyAccess.expression) || !ts.isIdentifier(tempPropertyAccess.name) ||
tempPropertyAccess.expression.escapedText.toString() !== CUSTOM_ENV_KEY ||
tempPropertyAccess.name.escapedText.toString() !== CREATE) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return false;
  }
  return true;
}

function checkCustomEnvIdentifierType(
  customEnvArg: ts.Identifier,
  checker: ts.TypeChecker,
  currentTypeNames: string[]
): void {
  const symbol: ts.Symbol | undefined = checker.getSymbolAtLocation(customEnvArg);
  if (!symbol) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return;
  }
  const variableDecl: ts.VariableDeclaration | undefined =
    isIdentifierConst(customEnvArg, checker);
  if (!variableDecl || !variableDecl.initializer) {
    validateInvalidCustomEnvCreation(customEnvArg);
    return;
  }
  const variableInitializer: ts.Expression = variableDecl.initializer;
  checkCustomEnvInitializer(variableInitializer, currentTypeNames, customEnvArg);
}

function validateCustomEnvArgType(
  customEnvArg: ts.Expression,
  isEnv: boolean = false
): void {
  const CURRENT_DECORATORNAME: string = isEnv ? COMPONENT_ENV_DECORATOR : COMPONENT_CUSTOM_ENV_DECORATOR;
  transformLog.errors.push({
    type: LogType.ERROR,
    code: '10905381',
    message: `The type of the property decorated with '${CURRENT_DECORATORNAME}' must be consistent with the generic type of the key.`,
    pos: customEnvArg.getStart()
  });
}

function validateInvalidCustomEnvCreation(
  customEnvArg: ts.Expression
): void {
  transformLog.errors.push({
    type: LogType.ERROR,
    code: '10905382',
    message: `Invalid key for '@CustomEnv', '@CustomEnv' key must be global const and created from CustomEnvKey.create<T>().`,
    pos: customEnvArg.getStart()
  });
}

export function preCheckEnvDecoratorArg(
  node: ts.Decorator,
  envTypeName: EnvTypeName
): void {
  if (!node.expression || !ts.isCallExpression(node.expression) ||
    !node.expression.arguments || !node.expression.arguments.length) {
    return;
  }
  const envExp: ts.Expression = node.expression.arguments[0];
  if (!ts.isPropertyAccessExpression(envExp) ||
    !ts.isIdentifier(envExp.expression) ||
    !ts.isIdentifier(envExp.name)) {
    return;
  }
  const EXPRESSION_NAME: string = envExp.expression.text;
  if (EXPRESSION_NAME === SYSTEM_PROPERTIES) {
    envTypeName.envArgStatus = ENV_ARG_STATUS.SYSTEM_PROPERTIES;
  } else if (EXPRESSION_NAME === WRITABLE_SYSTEMENV) {
    envTypeName.envArgStatus = ENV_ARG_STATUS.WRITABLE_SYSTEM_ENV;
  } else if (EXPRESSION_NAME === READONLY_SYSTEMENV) {
    envTypeName.envArgStatus = ENV_ARG_STATUS.READONLY_SYSTEM_ENV;
  }
}

export function checkNonSystemEnvDecoratorExp(
  node: ts.Decorator,
  propertyTypeNode: ts.TypeNode | undefined,
  checker: ts.TypeChecker | undefined): void {
  if (!propertyTypeNode || !checker || !node.expression ||
    !ts.isCallExpression(node.expression) ||
    !node.expression.arguments || !node.expression.arguments.length) {
    return;
  }
  const envExp: ts.Expression = node.expression.arguments[0];
  if (!ts.isPropertyAccessExpression(envExp) ||
    !ts.isIdentifier(envExp.expression) ||
    !ts.isIdentifier(envExp.name)) {
    return;
  }
  const NAME_SYMBOL: ts.Symbol | undefined = checker.getSymbolAtLocation(envExp.name);
  if (!NAME_SYMBOL) {
    validateCustomEnvArgType(envExp, true);
    return;
  }
  const ARG_TYPES: string[] = findPropertyDeclTypeArg(NAME_SYMBOL);
  const PROPERTY_TYPES: string[] = [];
  if (!ts.isUnionTypeNode(propertyTypeNode)) {
    PROPERTY_TYPES.push(propertyTypeNode.getText());
  } else {
    PROPERTY_TYPES.push(...collectUnionTypes(propertyTypeNode));
  }
  if (isArrayEqualIgnoreOrder(ARG_TYPES, PROPERTY_TYPES)) {
    return;
  }
  validateCustomEnvArgType(envExp, true);
}

function findPropertyDeclTypeArg(
  symbol: ts.Symbol
): string[] {
  const decls: ts.Declaration[] | undefined = symbol.getDeclarations();
  if (!decls || !decls.length || !ts.isPropertyDeclaration(decls[0]) ||
    !ts.isTypeReferenceNode(decls[0].type)) {
    return [];
  }
  const CURRENT_TYPE: ts.TypeReferenceNode = decls[0].type;
  if (!CURRENT_TYPE.typeArguments || !CURRENT_TYPE.typeArguments.length) {
    return [];
  }
  if (!ts.isUnionTypeNode(CURRENT_TYPE.typeArguments[0])) {
    return [CURRENT_TYPE.typeArguments[0].getText()];
  }
  return collectUnionTypes(CURRENT_TYPE.typeArguments[0]);
}

function collectUnionTypes(
  unionType: ts.UnionTypeNode
): string[] {
  const result: string[] = [];
  unionType.types.forEach(typeNode => {
    result.push(typeNode.getText());
  });
  return result;
}

export const ENV_ARG_STATUS = {
  SYSTEM_PROPERTIES: 0, WRITABLE_SYSTEM_ENV: 1, READONLY_SYSTEM_ENV: 2
} as const;
export type EnvArgStatus = typeof ENV_ARG_STATUS[keyof typeof ENV_ARG_STATUS];

export function checkEnvDecoratorExp(node: ts.Decorator, currentTypeName: string,
  checker: ts.TypeChecker | undefined): void {
  if (!checker || !node.expression || !ts.isCallExpression(node.expression) ||
    !node.expression.arguments || !node.expression.arguments.length) {
    return;
  }
  const envExp: ts.Expression = node.expression.arguments[0];
  if (!ts.isPropertyAccessExpression(envExp) ||
    !ts.isIdentifier(envExp.expression) ||
    !isIdentifierHasEnumDecl(envExp.expression, checker) ||
    !ts.isIdentifier(envExp.name)) {
    validateEnvDecoratorExp(envExp, currentTypeName);
    return;
  }
  const argText: string = envExp.getText();
  if (!envAllowTypesAndArgs.has(currentTypeName)) {
    return;
  }
  if (!envAllowTypesAndArgs.get(currentTypeName)?.includes(argText)) {
    validateEnvDecoratorExp(envExp, currentTypeName);
  }
}

export function validateEnvDecoratorExp(node: ts.Expression, currentTypeName: string): void {
  const trueArgs: Array<string> | undefined = envAllowTypesAndArgs.get(currentTypeName);
  if (trueArgs === undefined || trueArgs.length === 0) {
    return;
  }
  const acceptArgStr: string = trueArgs.join(', ');
  transformLog.errors.push({
    type: LogType.ERROR,
    code: '10905368',
    message: `Invalid parameter. State variables decorated with '@Env' of type '${currentTypeName}' can only accept ${acceptArgStr}.`,
    pos: node.getStart()
  });
}

function isIdentifierHasEnumDecl(
  identifier: ts.Identifier,
  checker: ts.TypeChecker
): boolean {
  const symbol = checker.getSymbolAtLocation(identifier);
  if (!symbol) {
    return false;
  }
  const declarations = symbol.getDeclarations() || [];
  const hasEnumDeclaration: boolean = declarations.some(decl => ts.isEnumDeclaration(decl));
  return hasEnumDeclaration;
}

export interface EnvTypeName {
  currentTypeName: string;
  envArgStatus: EnvArgStatus;
}

export function checkEnvType(propertyType: ts.Type, envTypeName: EnvTypeName,
  checker: ts.TypeChecker | undefined): boolean {
  if (!propertyType) {
    return false;
  }
  const symbol = propertyType.getSymbol();
  if (!checker) {
    return false;
  }
  const typeName = checker.typeToString(propertyType);
  if (envAllowTypesAndArgs.has(typeName)) {
    envTypeName.currentTypeName = typeName;
    return true;
  }
  if (['string', 'number', 'boolean'].includes(typeName)) {
    return false;
  }
  if (symbol.declarations && symbol.declarations.some(declaration => ts.isTypeAliasDeclaration(declaration))) {
    const typeAliasDeclaration = symbol.declarations.find(ts.isTypeAliasDeclaration);
    if (typeAliasDeclaration) {
      const aliasType = checker.getTypeAtLocation(typeAliasDeclaration);
      return checkEnvType(aliasType, envTypeName, checker);
    }
  }
  if (propertyType.isClassOrInterface()) {
    const typeName = checker.typeToString(propertyType);
    if (envAllowTypesAndArgs.has(typeName)) {
      envTypeName.currentTypeName = typeName;
      return true;
    }
    const baseTypes = checker.getBaseTypes(propertyType);
    for (const baseType of baseTypes) {
      const checkBaseType = checkEnvType(baseType, envTypeName, checker);
      if (checkBaseType) {
        return true;
      }
    }
  }
  return false;
}

export function validateEnvType(item: ts.PropertyDeclaration): void {
  transformLog.errors.push({
    type: LogType.ERROR,
    code: '10905251',
    message: `The '@Env' decorator can only decorate 'WindowSizeLayoutBreakpointInfo', 'SizeInVP', 'Size', ` +
      `'UIEnvWindowAvoidAreaInfoPX', 'UIEnvWindowAvoidAreaInfoVP' classes or their child classes.`,
    pos: item.getStart()
  });
}
