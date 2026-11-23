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
import constantDefine from './constant_define';
import { LogInfo, LogType, addLog, getOriginPropertyType } from './utils';
import { transformLog } from './process_ui_syntax';
import { getDecoratorName } from './process_struct_componentV2';
import { COMPONENTV2_LOCAL_DECORATOR, COMPONENTV2_PARAM_DECORATOR, COMPONENTV2_PROVIDER_DECORATOR,
  COMPONENTV2_CONSUMER_DECORATOR, COMPONENTV2_ONCE_DECORATOR, ENABLEWILDCARD } from './pre_define';

export function parseMonitorDecorators(parentCallExpression: ts.CallExpression, sourceFileNode: ts.SourceFile,
  classNode: ts.ClassDeclaration | ts.StructDeclaration, isMonitor: boolean, checker: ts.TypeChecker): LogInfo[] {
  const log: LogInfo[] = [];
  checkMonitorDecoratorsWithChecker(parentCallExpression, sourceFileNode, log, classNode, isMonitor, checker);
  return log;
}

function checkMonitorDecoratorsWithChecker(parentCallExpression: ts.CallExpression, sourceFileNode: ts.SourceFile,
  log: LogInfo[], classNode: ts.ClassDeclaration | ts.StructDeclaration, isMonitor: boolean, checker: ts.TypeChecker): void {
  if (!parentCallExpression.arguments || !parentCallExpression.arguments.length) {
    return;
  }
  let monitorCheckWild: boolean = false;
  const shouldCheck: { needCheck: boolean } = {
    needCheck: true
  };
  if (isMonitor) {
    const firstMonitorArg: ts.Expression = parentCallExpression.arguments[0];
    monitorCheckWild = shouldMonitorCheckWild(firstMonitorArg, shouldCheck);
  }
  parentCallExpression.arguments.forEach((monitorArgument, index) => {
    checkMonitorDecoratorsArg(monitorArgument, sourceFileNode, log,
      isMonitor, index, monitorCheckWild, shouldCheck);
    if (!ts.isStringLiteral(monitorArgument)) {
      return;
    }
    if (isMonitor) {
      checkMonitorDecoratorArgContent(monitorArgument, sourceFileNode, log,
        classNode, index, monitorCheckWild, checker);
      return;
    }
    checkSyncMonitorDecoratorArgContent(monitorArgument, sourceFileNode, log, classNode, checker);
  });
}

function checkMonitorDecoratorArgContent(monitorArgument: ts.StringLiteral,
  sourceFileNode: ts.SourceFile, log: LogInfo[],
  classNode: ts.ClassDeclaration | ts.StructDeclaration,
  index: number, shouldCheckWild: boolean, checker: ts.TypeChecker): void {
  const monitorArg: argWrapper = { value: monitorArgument.text };
  let needCheckContent: boolean = true;
  if (shouldCheckWild) {
    if (index === 0) {
      return;
    }
    needCheckContent = checkWildCard(monitorArgument, sourceFileNode, log, monitorArg, true);
  }
  if (!needCheckContent) {
    return;
  }
  if (monitorArg.value.startsWith('.')) {
    validateMonitorArgExist(monitorArgument, log, sourceFileNode);
    return;
  }
  const monitorArgs: string[] = monitorArg.value.trim().split('.');
  if (!monitorArgs.length) {
    validateMonitorArgExist(monitorArgument, log, sourceFileNode);
    return;
  }
  if (ts.isClassDeclaration(classNode)) {
    checkMonitorDecoratorArgInClass(monitorArgs, classNode,
      monitorArgument, log, sourceFileNode, checker);
  } else {
    checkMonitorDecoratorArgInStruct(monitorArgs, classNode,
      monitorArgument, log, sourceFileNode, checker);
  }
  return;
}

function checkMonitorDecoratorArgInClass(monitorArgs: string[], classNode: ts.ClassDeclaration,
  monitorArgument: ts.StringLiteral, log: LogInfo[], sourceFileNode: ts.SourceFile, checker: ts.TypeChecker): void {
  const argsLen: number = monitorArgs.length;
  const firstArg: string = monitorArgs[0];
  if (firstArg === '') {
    validateMonitorArgExist(monitorArgument, log, sourceFileNode);
    return;
  }
  if (!checker) {
    return;
  }
  const status: MonitorStatus = {
    currentStatus: MonitorArgsStatus.PASS,
    needCheck: true,
    currentPropertyType: checker.getTypeAtLocation(classNode)
  };
  for (let i = 0; i < argsLen; i++) {
    if (!status.needCheck) {
      statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    if (!preCheckSingleMonitorArgContent(status, checker, true)) {
      statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    checkSingleMonitorArgContent(monitorArgs[i], status, checker, true);
  }
  statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
}

function checkMonitorDecoratorArgInStruct(monitorArgs: string[], structNode: ts.StructDeclaration,
  monitorArgument: ts.StringLiteral, log: LogInfo[], sourceFileNode: ts.SourceFile, checker: ts.TypeChecker): void {
  const argsLen: number = monitorArgs.length;
  const firstArg: string = monitorArgs[0];
  if (firstArg === '') {
    validateMonitorArgExist(monitorArgument, log, sourceFileNode);
    return;
  }
  if (!checker) {
    return;
  }
  const status: MonitorStatus = {
    currentStatus: MonitorArgsStatus.PASS,
    needCheck: true,
    currentPropertyType: undefined
  };
  const isFound: boolean = findPropertyInStruct(
    checker, firstArg, status, structNode
  );
  if (!isFound) {
    validateMonitorArgExist(monitorArgument, log, sourceFileNode);
    return;
  }
  for (let i = 1; i < argsLen; i++) {
    if (!status.needCheck) {
      statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    if (!preCheckSingleMonitorArgContent(status, checker, true)) {
      statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    checkSingleMonitorArgContent(monitorArgs[i], status, checker, true);
  }
  statusDecideMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
}

interface argWrapper {
  value: string
}

export const MonitorArgsStatus = { PASS: 0, ERROR: 1, WARN: 2 } as const;
export type MonitorArgStatus = typeof MonitorArgsStatus[keyof typeof MonitorArgsStatus];

interface MonitorStatus {
  currentStatus: MonitorArgStatus;
  needCheck: boolean;
  currentPropertyType: ts.Type | undefined;
  currentClassNode?: ts.ClassDeclaration | ts.StructDeclaration | undefined;
  visitedTypes?: Set<ts.Type>
  currentPropertyTypeNode?: ts.TypeNode | undefined;
}

function checkSyncMonitorDecoratorArgContent(monitorArgument: ts.StringLiteral,
  sourceFileNode: ts.SourceFile, log: LogInfo[], classNode: ts.ClassDeclaration | ts.StructDeclaration, checker: ts.TypeChecker): void {
  const monitorArg: argWrapper = { value: monitorArgument.text };
  const needCheckContent: boolean = checkWildCard(monitorArgument, sourceFileNode, log, monitorArg, false);
  if (!needCheckContent) {
    return;
  }
  if (monitorArg.value.startsWith('.')) {
    validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, true);
    return;
  }
  const monitorArgs: string[] = monitorArg.value.trim().split('.');
  if (!monitorArgs.length) {
    validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, true);
    return;
  }
  if (ts.isClassDeclaration(classNode)) {
    checkSyncMonitorDecoratorArgInClass(monitorArgs, classNode,
      monitorArgument, log, sourceFileNode, checker);
  } else {
    checkSyncMonitorDecoratorArgInStruct(monitorArgs, classNode,
      monitorArgument, log, sourceFileNode, checker);
  }
  return;
}

function checkSyncMonitorDecoratorArgInClass(monitorArgs: string[], classNode: ts.ClassDeclaration,
  monitorArgument: ts.StringLiteral, log: LogInfo[], sourceFileNode: ts.SourceFile, checker: ts.TypeChecker): void {
  const argsLen: number = monitorArgs.length;
  const firstArg: string = monitorArgs[0];
  if (firstArg === '') {
    validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, true);
    return;
  }
  if (!checker) {
    return;
  }
  const status: MonitorStatus = {
    currentStatus: MonitorArgsStatus.PASS,
    needCheck: true,
    currentPropertyType: checker.getTypeAtLocation(classNode)
  };
  for (let i = 0; i < argsLen; i++) {
    if (!status.needCheck) {
      statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    if (!preCheckSingleMonitorArgContent(status, checker, false)) {
      statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    checkSingleMonitorArgContent(monitorArgs[i], status, checker, false);
  }
  statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
}

function checkSyncMonitorDecoratorArgInStruct(monitorArgs: string[], structNode: ts.StructDeclaration,
  monitorArgument: ts.StringLiteral, log: LogInfo[], sourceFileNode: ts.SourceFile, checker: ts.TypeChecker): void {
  const argsLen: number = monitorArgs.length;
  const firstArg: string = monitorArgs[0];
  if (firstArg === '') {
    validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, true);
    return;
  }
  if (!checker) {
    return;
  }
  const status: MonitorStatus = {
    currentStatus: MonitorArgsStatus.PASS,
    needCheck: true,
    currentPropertyType: undefined
  };
  const isFound: boolean = findPropertyInStruct(
    checker, firstArg, status, structNode
  );
  if (!isFound) {
    validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, true);
    return;
  }
  for (let i = 1; i < argsLen; i++) {
    if (!status.needCheck) {
      statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    if (!preCheckSingleMonitorArgContent(status, checker, false)) {
      statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
      return;
    }
    checkSingleMonitorArgContent(monitorArgs[i], status, checker, false);
  }
  statusDecideSyncMonitorArgExist(status.currentStatus, monitorArgument, log, sourceFileNode);
}

function preCheckSingleMonitorArgContent(status: MonitorStatus, checker: ts.TypeChecker, isMonitor: boolean): boolean {
  if (status.visitedTypes) {
    status.visitedTypes.clear();
  }
  const currentPropertyType: ts.Type | undefined = status.currentPropertyType;
  if (!currentPropertyType) {
    return false;
  }
  const originType: ts.Type | undefined = getOriginPropertyType(currentPropertyType, checker);
  if (!originType) {
    return false;
  }
  if (checkBasicType(originType)) {
    status.currentStatus = isMonitor ? MonitorArgsStatus.WARN : MonitorArgsStatus.ERROR;
    return false;
  }
  status.currentPropertyType = originType;
  return true;
}

const MonitorBasicType = {
  string: ts.TypeFlags.String,
  number: ts.TypeFlags.Number,
  boolean: ts.TypeFlags.Boolean,
  bigint: ts.TypeFlags.BigInt,
  null: ts.TypeFlags.Null,
  undefined: ts.TypeFlags.Undefined,
  void: ts.TypeFlags.Void,
  enum: ts.TypeFlags.Enum
};

function checkBasicType(
  originType: ts.Type
): boolean {
  const typeFlags: ts.TypeFlags = originType.getFlags();
  const allBasicFlags = Object.values(MonitorBasicType).reduce((sum, flag) => sum | flag, 0);
  return (typeFlags & allBasicFlags) !== 0;
}

function checkSingleMonitorArgContent(singleArg: string, status: MonitorStatus,
  checker: ts.TypeChecker, isMonitor: boolean): boolean {
  if (singleArg === '') {
    status.needCheck = false;
    status.currentStatus = isMonitor ? MonitorArgsStatus.WARN : MonitorArgsStatus.ERROR;
    return false;
  }
  const currentPropertyType: ts.Type = status.currentPropertyType;
  const currentPropertyTypeNode: ts.TypeNode | undefined = status.currentPropertyTypeNode;
  if (!status.visitedTypes) {
    status.visitedTypes = new Set<ts.Type>();
  }
  if (status.visitedTypes.has(currentPropertyType)) {
    status.needCheck = false;
    return false;
  }
  status.visitedTypes.add(currentPropertyType);
  status.currentPropertyType = undefined;
  if (hasNumberPattern(singleArg)) {
    processNumberPattern(status, isMonitor, singleArg, checker);
    return false;
  }
  const symbol = currentPropertyType?.getSymbol();
  const isTypeValid: boolean = checkTypeValid(symbol, currentPropertyType, status);
  if (!isTypeValid) {
    hasAttributeType(singleArg) && processAttributeType(status, currentPropertyTypeNode, singleArg);
    return false;
  }
  const classNode = getClassNodeFromSymbol(symbol);
  if (!classNode) {
    status.needCheck = false;
    return false;
  }
  let isFound: boolean = findPropertyInClass(checker, singleArg, status, classNode);
  if (isFound) {
    return true;
  }
  isFound = findPropertyInBaseTypes(checker, currentPropertyType as ts.InterfaceType,
    status, singleArg, isMonitor);
  if (isFound) {
    return true;
  }
  status.currentStatus = isMonitor ? MonitorArgsStatus.WARN : MonitorArgsStatus.ERROR;
  status.needCheck = false;
  return false;
}

function findPropertyInStruct(
  checker: ts.TypeChecker,
  singleArg: string,
  status: MonitorStatus,
  structNode: ts.StructDeclaration
): boolean {
  let isFound: boolean = false;
  structNode.members.some(propertyMember => {
    if (ts.isPropertyDeclaration(propertyMember) &&
      ts.isIdentifier(propertyMember.name)) {
      const findInPropertyDecl: boolean = findPropertyInDecl(
        propertyMember, checker, singleArg, status, [COMPONENTV2_LOCAL_DECORATOR,
          COMPONENTV2_PARAM_DECORATOR, COMPONENTV2_PROVIDER_DECORATOR,
          COMPONENTV2_CONSUMER_DECORATOR, COMPONENTV2_ONCE_DECORATOR]
      );
      if (findInPropertyDecl) {
        isFound = true;
        return true;
      }
    } else if (ts.isGetAccessor(propertyMember) &&
      ts.isIdentifier(propertyMember.name)) {
      const findInGetAccessor: boolean = findPropertyInDecl(
        propertyMember, checker, singleArg, status, [constantDefine.COMPUTED_DECORATOR]
      );
      if (findInGetAccessor) {
        isFound = true;
        return true;
      }
    }
    return false;
  });
  return isFound;
}

function findPropertyInClass(
  checker: ts.TypeChecker,
  singleArg: string,
  status: MonitorStatus,
  classNode: ts.ClassDeclaration | ts.InterfaceDeclaration
): boolean {
  let isFound: boolean = false;
  classNode.members.some(propertyMember => {
    if (ts.isPropertyDeclaration(propertyMember) &&
      ts.isIdentifier(propertyMember.name)) {
      const findInPropertyDecl: boolean = findPropertyInDecl(
        propertyMember, checker, singleArg, status, [constantDefine.TRACE_DECORATOR]
      );
      if (findInPropertyDecl) {
        isFound = true;
        return true;
      }
    } else if (ts.isGetAccessor(propertyMember) &&
      ts.isIdentifier(propertyMember.name)) {
      const findInGetAccessor: boolean = findPropertyInDecl(
        propertyMember, checker, singleArg, status, [constantDefine.COMPUTED_DECORATOR]
      );
      if (findInGetAccessor) {
        isFound = true;
        return true;
      }
    }
    return false;
  });
  return isFound;
}

function findPropertyInDecl(
  propertyMember: ts.PropertyDeclaration | ts.GetAccessorDeclaration,
  checker: ts.TypeChecker,
  singleArg: string,
  status: MonitorStatus,
  targetDecorators: string[]
): boolean {
  const propertyName: string = (propertyMember.name as ts.Identifier).escapedText.toString();
  if (propertyName === singleArg) {
    const decorators: readonly ts.Decorator[] = ts.getAllDecorators(propertyMember);
    const hasTarget: boolean = decorators.some(decorator => {
      return targetDecorators.includes(getDecoratorName(decorator));
    });
    const propertyType: ts.Type | undefined = checker?.getTypeAtLocation(propertyMember);
    status.currentPropertyType = propertyType;
    status.currentPropertyTypeNode = propertyMember?.type;
    if (!hasTarget) {
      status.currentStatus = MonitorArgsStatus.WARN;
    }
    return true;
  }
  return false;
}

function findPropertyInBaseTypes(
  checker: ts.TypeChecker,
  currentPropertyType: ts.InterfaceType,
  status: MonitorStatus,
  singleArg: string,
  isMonitor: boolean
): boolean {
  const baseTypes = checker.getBaseTypes(currentPropertyType) || [];
  for (const baseType of baseTypes) {
    status.currentPropertyType = baseType;
    const foundInBaseTypes: boolean = checkSingleMonitorArgContent(singleArg, status,
      checker, isMonitor);
    if (foundInBaseTypes) {
      return true;
    }
  }
  return false;
}

function checkTypeValid(
  symbol: ts.Symbol | undefined,
  currentPropertyType: ts.Type,
  status: MonitorStatus
): boolean {
  if (!symbol || !symbol.declarations || !symbol.declarations.length ||
    !currentPropertyType.isClassOrInterface()) {
    status.currentStatus = MonitorArgsStatus.WARN;
    status.needCheck = false;
    return false;
  }
  return true;
}

function getClassNodeFromSymbol(
  symbol: ts.Symbol
): ts.ClassDeclaration | ts.InterfaceDeclaration | undefined {
  let classNode: ts.ClassDeclaration | ts.InterfaceDeclaration | undefined;
  const classDeclarations = [];
  const interfaceDeclarations = [];
  symbol.declarations.forEach(declaration => {
    if (ts.isClassDeclaration(declaration)) {
      classDeclarations.push(declaration);
      return;
    }
    if (ts.isInterfaceDeclaration(declaration)) {
      interfaceDeclarations.push(declaration);
    }
  });
  if (classDeclarations.length && classDeclarations.length > 0 && ts.isClassDeclaration(classDeclarations[0])) {
    classNode = classDeclarations[0];
  } else if (interfaceDeclarations.length && interfaceDeclarations.length > 0 &&
    ts.isInterfaceDeclaration(interfaceDeclarations[0])) {
    classNode = interfaceDeclarations[0];
  }
  return classNode;
}

function statusDecideSyncMonitorArgExist(status: MonitorArgStatus, monitorArgument: ts.StringLiteral,
  log: LogInfo[], sourceFileNode: ts.SourceFile): void {
  if (status === MonitorArgsStatus.PASS) {
    return;
  }
  const isError: boolean = status === MonitorArgsStatus.ERROR;
  validateSyncMonitorArgExist(monitorArgument, log, sourceFileNode, isError);
}

function statusDecideMonitorArgExist(status: MonitorArgStatus, monitorArgument: ts.StringLiteral,
  log: LogInfo[], sourceFileNode: ts.SourceFile): void {
  if (status === MonitorArgsStatus.PASS) {
    return;
  }
  validateMonitorArgExist(monitorArgument, log, sourceFileNode);
}

function validateSyncMonitorArgExist(monitorArgument: ts.StringLiteral,
  log: LogInfo[], sourceFileNode: ts.SourceFile, isError: boolean): void {
  const variableExistMessage: string = `'@SyncMonitor' cannot observe non-existent variables or non-state variables, ` +
    `except in wildcard-based monitoring scenarios.`;
  isError ? addLog(LogType.ERROR, variableExistMessage, monitorArgument.pos, log, sourceFileNode, { code: '10905366' }) :
    addLog(LogType.WARN, variableExistMessage, monitorArgument.pos, log, sourceFileNode);
}

function validateMonitorArgExist(monitorArgument: ts.StringLiteral,
  log: LogInfo[], sourceFileNode: ts.SourceFile): void {
  const variableExistMessage: string = `The '@Monitor' decorator needs to monitor the state variables that exist.`;
  addLog(LogType.WARN, variableExistMessage, monitorArgument.pos, log, sourceFileNode);
}

function hasNumberPattern(singleArg: string): boolean {
  const regx: RegExp = /^\d+$/g;
  return regx.test(singleArg);
}

const attributesTypes: Set<string> = new Set(['size', 'length']);
const containerTypes: Set<string> = new Set(['Set', 'Map']);

function hasAttributeType(singleArg: string): boolean {
  return attributesTypes.has(singleArg);
}

function isArrayContainer(
  currentTypeNode: ts.TypeNode | undefined
): boolean {
  if (!currentTypeNode) {
    return false;
  }
  if (ts.isArrayTypeNode(currentTypeNode)) {
    return true;
  }
  if (ts.isTypeReferenceNode(currentTypeNode) && ts.isIdentifier(currentTypeNode.typeName) &&
    currentTypeNode.typeName.escapedText.toString() === 'Array') {
    return true;
  }
  return false;
}

function isSetOrMapContainer(
  currentTypeNode: ts.TypeNode | undefined
): boolean {
  if (!currentTypeNode) {
    return false;
  }
  if (ts.isTypeReferenceNode(currentTypeNode) && ts.isIdentifier(currentTypeNode.typeName) &&
    containerTypes.has(currentTypeNode.typeName.escapedText.toString())) {
    return true;
  }
  return false;
}

function processAttributeType(
  status: MonitorStatus,
  currentTypeNode: ts.TypeNode | undefined,
  singleArg: string
): void {
  const isArray: boolean = isArrayContainer(currentTypeNode);
  const isSetOrMap: boolean = isSetOrMapContainer(currentTypeNode);
  if (!isArray && !isSetOrMap) {
    return;
  }
  if (isArray && singleArg === 'length' &&
    status.currentStatus === MonitorArgsStatus.WARN) {
    status.currentStatus = MonitorArgsStatus.PASS;
    return;
  }
  if (isSetOrMap && singleArg === 'size' &&
    status.currentStatus === MonitorArgsStatus.WARN) {
    status.currentStatus = MonitorArgsStatus.PASS;
  }
}

function processNumberPattern(
  status: MonitorStatus,
  isMonitor: boolean,
  singleArg: string,
  checker: ts.TypeChecker
): void {
  if (!isMonitor) {
    status.needCheck = false;
    return;
  }
  if (!status.currentPropertyTypeNode || !checkArrayType(status, checker)) {
    status.needCheck = false;
    return;
  }
  const currentIndex: number = Number(singleArg);
  if (isNaN(currentIndex)) {
    status.currentStatus = MonitorArgsStatus.WARN;
    status.needCheck = false;
    return;
  }
}

function checkArrayType(
  status: MonitorStatus,
  checker: ts.TypeChecker
): boolean {
  const currentTypeNode: ts.TypeNode | undefined = status.currentPropertyTypeNode;
  if (!currentTypeNode) {
    status.currentStatus = MonitorArgsStatus.WARN;
    status.needCheck = false;
  }
  if (ts.isArrayTypeNode(currentTypeNode)) {
    status.currentPropertyTypeNode = currentTypeNode.elementType;
    status.currentPropertyType = checker.getTypeFromTypeNode(status.currentPropertyTypeNode);
    return true;
  }
  if (ts.isTypeReferenceNode(currentTypeNode) && ts.isIdentifier(currentTypeNode.typeName) &&
    currentTypeNode.typeName.escapedText.toString() === 'Array' && currentTypeNode.typeArguments) {
    status.currentPropertyTypeNode = currentTypeNode.typeArguments[0];
    status.currentPropertyType = checker.getTypeFromTypeNode(status.currentPropertyTypeNode);
    return true;
  }
  status.currentStatus = MonitorArgsStatus.WARN;
  status.needCheck = false;
  return false;
}

function checkWildCard(monitorArgument: ts.StringLiteral,
  sourceFileNode: ts.SourceFile, log: LogInfo[], monitorArg: argWrapper,
  isMonitor: boolean): boolean {
  const argText: string = monitorArgument.text;
  const currentDecoratorName: string = isMonitor ? '@Monitor' : '@SyncMonitor';
  const wildCardMessage: string = `In wildcard-based monitoring scenarios with '${currentDecoratorName}',` +
    ` the .* pattern must be placed at the end of the string.`;
  const wildCardRegex: RegExp = /\*/g;
  const matches = argText.match(wildCardRegex);
  if (!matches || !matches.length) {
    return true;
  }
  const wildCardCount: number = matches.length;
  const isAtEnd: boolean = argText.endsWith('.*');
  const isInvalidStr: boolean = argText === '*' || argText === '.*';
  if (wildCardCount !== 1 || !isAtEnd || isInvalidStr) {
    addLog(LogType.ERROR, wildCardMessage, monitorArgument.pos, log, sourceFileNode, { code: '10905367' });
    return false;
  }
  const prefix: string = argText.slice(0, -2);
  if (prefix.length > 0 && prefix.endsWith('.')) {
    addLog(LogType.ERROR, wildCardMessage, monitorArgument.pos, log, sourceFileNode, { code: '10905367' });
    return false;
  }
  monitorArg.value = argText.slice(0, -2);
  return true;
}

function checkMonitorDecoratorsArg(monitorArgument: ts.Expression,
  sourceFileNode: ts.SourceFile, log: LogInfo[], isMonitor: boolean,
  index: number, shouldCheckWild: boolean,
  shouldCheck: { needCheck: boolean }): void {
  const decoratorName: string = isMonitor ? constantDefine.MONITOR : constantDefine.SYNC_MONITOR;
  const typeMessage: string = `Only constant expressions are supported as parameters in '@${decoratorName}'. Variables are not allowed.`;
  if (isMonitor && index === 0 && !shouldCheck.needCheck) {
    return;
  }
  if (!ts.isStringLiteral(monitorArgument)) {
    isMonitor ?
      addLog(LogType.WARN, typeMessage, monitorArgument.pos, log, sourceFileNode) :
      addLog(LogType.ERROR, typeMessage, monitorArgument.pos, log, sourceFileNode, { code: '10905365' });
    return;
  }
}

function shouldMonitorCheckWild(firstMonitorArg: ts.Expression,
  shouldCheck: { needCheck: boolean }): boolean {
  if (!firstMonitorArg) {
    return false;
  }
  if (!ts.isObjectLiteralExpression(firstMonitorArg)) {
    return false;
  }
  if (!firstMonitorArg.properties || !firstMonitorArg.properties.length) {
    return true;
  }
  if (firstMonitorArg.properties.length > 1) {
    return false;
  }
  const assignmentOne: ts.ObjectLiteralElementLike = firstMonitorArg.properties[0];
  if (!ts.isPropertyAssignment(assignmentOne) ||
    !ts.isIdentifier(assignmentOne.name)) {
    return false;
  }
  const assignmentName: string = assignmentOne.name.getText();
  if (assignmentName !== ENABLEWILDCARD) {
    return false;
  }
  shouldCheck.needCheck = false;
  if (!assignmentOne.initializer?.kind ||
    ![ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(assignmentOne.initializer.kind)) {
    const typeMessage: string = `The value of 'enableWildcard' must be a Boolean keyword.`;
    transformLog.errors.push({
      type: LogType.ERROR,
      code: '10905372',
      message: typeMessage,
      pos: firstMonitorArg.getStart()
    });
    return false;
  }
  const initializerExpression: ts.Expression = assignmentOne.initializer;
  return initializerExpression.kind === ts.SyntaxKind.TrueKeyword;
}
