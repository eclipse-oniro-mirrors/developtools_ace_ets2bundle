/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import { projectConfig } from '../../../../main';
import {
  getValueChecker,
  defaultValueChecker,
  comparePointVersion,
  isCheckDistributionOSVersion,
  checkMSFVersionMajor,
  checkIntegerMoreVersion,
  isOpenHarmonyRuntime
} from '../api_check_utils';
import { checkApiAvailableLiteral } from './apiAvailable_validate_utils';
import {
  SINCE_TAG_NAME,
  ComparisonSenario,
  ValueCheckerFunction,
  ParsedVersion,
  VersionValidationResult,
  ComparisonResult,
  DistributionOSApiAvailableVersionResult,
  MSF_INTEGER_VERSION
} from '../api_check_define';
import {
  SDK_CONSTANTS
} from './api_validate_node';

/**
 * 从条件表达式按规则推出哪个子表达式为真：括号透明、取反翻转值、&& 为真则两侧都真。
 * 叶子（比如是不是 apiAvailable 调用）由注入的判定函数决定，引擎本身不认守卫类型。
 */
export function findImpliedGuardExpression(
  expression: ts.Expression | undefined,
  value: boolean,
  leaf: GuardTruthPredicate
): ts.Expression | null {
  if (!expression) {
    return null;
  }
  let current: ts.Expression = expression;
  while (ts.isParenthesizedExpression(current)) {
    current = current.expression;
  }
  if (ts.isPrefixUnaryExpression(current) && current.operator === ts.SyntaxKind.ExclamationToken) {
    return findImpliedGuardExpression(current.operand, !value, leaf);
  }
  if (ts.isBinaryExpression(current)) {
    const operator: ts.SyntaxKind = current.operatorToken.kind;
    if (value && operator === ts.SyntaxKind.AmpersandAmpersandToken) {
      return findImpliedGuardExpression(current.left, true, leaf) ||
        findImpliedGuardExpression(current.right, true, leaf);
    }
    if (operator === ts.SyntaxKind.BarBarToken) {
      return null;
    }
  }
  return leaf(current, value) ? current : null;
}

/** 叶子判定：已知表达式为真/假时，判断它是不是守卫调用。 */
export type GuardTruthPredicate = (expression: ts.Expression, value: boolean) => boolean;

/**
 * 逐层上溯检查 API 调用是否在四种守卫形态内：
 * 1. else branch:  if (!guard) {...} else { api() }
 * 2. guard clause: if (!guard) { return; } api();
 * 3. ternary:      guard ? api() : fallback   (and the negated mirror)
 * 4. then branch:  if (guard) { api() }       (covers && chains)
 */
export function isNodeInGuardPattern(node: ts.Node, isGuard: GuardTruthPredicate): boolean {
  let current: ts.Node = node.parent;
  while (current) {
    if (checkElseBranchAt(node, current, isGuard) ||
      checkGuardClauseAt(current, isGuard) ||
      checkTernaryAt(node, current, isGuard) ||
      checkThenBranchAt(node, current, isGuard)) {
      return true;
    }
    current = current.parent;
  }
  
  return false;
}

/** 判断节点是否落在 if 语句的 then 块内。 */
function isNodeInIfThenBlock(node: ts.Node, ifStatement: ts.IfStatement): boolean {
  if (!ifStatement.thenStatement) {
    return false;
  }
  // 节点区间完全落在 then 块区间内，即在 then 块里
  const nodeStart = node.getStart();
  const nodeEnd = node.getEnd();
  const thenStart = ifStatement.thenStatement.getStart();
  const thenEnd = ifStatement.thenStatement.getEnd();
  return nodeStart >= thenStart && nodeEnd <= thenEnd;
}

/**
 * else 分支守卫：API 调用在 if 的 else 分支内。
 * if (!deviceInfo.apiAvailable(18)) { 
 * } else { 
 *   a.b();
 * }
 */
function checkElseBranchAt(node: ts.Node, ancestor: ts.Node, isGuard: GuardTruthPredicate): boolean {
  // 祖先必须是 if 且带 else 分支，否则不是本形态
  if (!ts.isIfStatement(ancestor) || !ancestor.elseStatement) {
    return false;
  }
  // node 要落在 else 分支的源码区间内，且条件为假时蕴含守卫为真
  const inElseBranch = node.getStart() >= ancestor.elseStatement.getStart() &&
    node.getEnd() <= ancestor.elseStatement.getEnd();
  return inElseBranch && isGuard(ancestor.expression, false);
}

/**
 * 卫语句守卫：if 带 return/throw，API 调用在它之后。
 * if (!deviceInfo.apiAvailable(18)) { 
 *      return; 
 * }
 * a.b();
 */
function checkGuardClauseAt(ancestor: ts.Node, isGuard: GuardTruthPredicate): boolean {
  //
  const container: ts.Node = ancestor.parent;
  if (!container || !ts.isBlock(container)) {
    return false;
  }

  const statementIndex: number = container.statements.indexOf(ancestor as ts.Statement);
  for (let index: number = statementIndex - 1; index >= 0; index--) {
    const candidate: ts.Statement = container.statements[index];
    // 不是 if、或带 else 的：跳过
    if (!ts.isIfStatement(candidate) || candidate.elseStatement) {
      continue;
    }
    // then 块末尾不是 return/throw（控制流未被终结）的：跳过
    if (!isTerminatingStatement(candidate.thenStatement)) {
      continue;
    }
    // 结构满足 + 条件为假时蕴含守卫为真：认定受保护
    if (isGuard(candidate.expression, false)) {
      return true;
    }
  }
  return false;
}

/** 判断语句（或块末语句）是否 return/throw。 */
function isTerminatingStatement(statement: ts.Statement): boolean {
  const lastStatement: ts.Statement = ts.isBlock(statement) && statement.statements.length > 0
    ? statement.statements[statement.statements.length - 1]
    : statement;
  return ts.isReturnStatement(lastStatement) || ts.isThrowStatement(lastStatement);
}

/**
 * 三元守卫：API 调用在受保护分支。
 * 1. when-true:  deviceInfo.apiAvailable(18) ? a.b() : 0
 * 2. when-false: !deviceInfo.apiAvailable(18) ? 0 : a.b()
 */
function checkTernaryAt(node: ts.Node, ancestor: ts.Node, isGuard: GuardTruthPredicate): boolean {

  if (!ts.isConditionalExpression(ancestor)) {
    return false;
  }

  const inWhenTrue: boolean = node.getStart() >= ancestor.whenTrue.getStart() &&
    node.getEnd() <= ancestor.whenTrue.getEnd();
  if (inWhenTrue && isGuard(ancestor.condition, true)) {
    return true;
  }
  const inWhenFalse: boolean = node.getStart() >= ancestor.whenFalse.getStart() &&
    node.getEnd() <= ancestor.whenFalse.getEnd();
  return inWhenFalse && isGuard(ancestor.condition, false);
}

/**
 * then 块守卫：API 调用在 if 的 then 块内（含 && 链）。
 */
function checkThenBranchAt(node: ts.Node, ancestor: ts.Node, isGuard: GuardTruthPredicate): boolean {
  // 祖先必须是 if，node 落在 then 块内，且条件为真时蕴含守卫为真
  if (!ts.isIfStatement(ancestor)) {
    return false;
  }
  return isNodeInIfThenBlock(node, ancestor) &&
    isGuard(ancestor.expression, true);
}
/**
 * Shared helper for SDK version comparison logic.
 * Encapsulates all version comparison and validation logic.
 * 
 * Uses centralized comparison functions system for runtime-specific validation.
 * Supports both OpenHarmony (simple integer comparison) and other runtimes (external plugins).
 */
export class SdkComparisonHelper {
  private readonly otherSourceDeviceInfo: string;
  private readonly openSourceDeviceInfo: string;
  private readonly openSourceRuntime: string;
  private readonly deviceInfoChecker: Map<string, string[]>;

  // Comparison function loaded from central system
  private valueChecker: ValueCheckerFunction = defaultValueChecker;

  constructor(
    private readonly compatibleSdkVersion: string,
    private readonly minRequiredVersion: string,
    private readonly typeChecker: ts.TypeChecker | undefined,
    private readonly minAvailableVersion: ParsedVersion | undefined,
    deviceInfoMap: Map<string, string[]>,
    otherSourceDeviceInfo: string,
    openSourceDeviceInfo: string,
    openSourceRuntime: string
  ) {
    this.deviceInfoChecker = deviceInfoMap;
    this.otherSourceDeviceInfo = otherSourceDeviceInfo;
    this.openSourceDeviceInfo = openSourceDeviceInfo;
    this.openSourceRuntime = openSourceRuntime;

    // Initialize comparison function
    this.init();
  }

  /**
   * Initialize comparison function for SDK version validation.
   * 
   * Loads value checker from central system:
   * - Uses 'since' tag for SDK version comparisons
   * - Falls back to default checker if no external plugin available
   */
  private init(): void {
    // Load value checker for 'since' tag (used for SDK version comparisons)
    const valueChecker = getValueChecker(SINCE_TAG_NAME);
    this.valueChecker = valueChecker || defaultValueChecker;
  }

  /**
   * Checks if an expression contains a valid SDK version comparison.
   *
   * @param expression - The expression to analyze
   * @returns True if valid SDK comparison found
   */
  public isSdkComparisonHelper(expression: ts.Expression): boolean {
    let isSinceMSFVersion: boolean = true;
    const expressionText = expression.getText();
    const runtimeType = projectConfig.runtimeOS;
    const matchedEntry = Array.from(this.deviceInfoChecker.entries())
      .find(([api]) => expressionText.includes(api));
    if (!matchedEntry) {
      return false;
    }

    if (this.minAvailableVersion) {
      isSinceMSFVersion = this.checkSinceMSFVersionMajor(this.minAvailableVersion.version);
    } else {
      isSinceMSFVersion = this.checkSinceMSFVersionMajor(this.minRequiredVersion);
    }

    if (!isSinceMSFVersion) {
      return false;
    }

    const [matchedApi, validPackagePath] = matchedEntry;
    if (runtimeType === this.openSourceRuntime && matchedApi === this.otherSourceDeviceInfo) {
      return false;
    }

    const parts = this.extractComparisonParts(expression, matchedApi);
    if (!parts) {
      return false;
    }

    if (!this.validateSdkVersionCompatibility(parts.operator, parts.value, matchedApi, runtimeType, parts.apiPosition)) {
      return false;
    }

    const apiIdentifier = this.findValidImportApiIdentifier(expression, matchedApi);

    return apiIdentifier
      ? this.isValidSdkDeclaration(apiIdentifier, validPackagePath)
      : false;
  }

  /** apiAvailable 守卫检测：匹配→预检→解析常量→校验→比版本。 */
  public isApiAvailableHelper(expression: ts.Expression): boolean {
    const expressionText = expression.getText();
    const matchedEntry = Array.from(this.deviceInfoChecker.entries())
      .find(([api]) => expressionText.includes(api));
    if (!matchedEntry) {
      return false;
    }
    const [matchedApi] = matchedEntry;
    if (!this.validateApiAvailablePreCheck(expression, matchedApi)) {
      return false;
    }
    const call = expression as ts.CallExpression;
    const arg = this.resolveInitializerExpression(call.arguments[0]) ?? call.arguments[0];
    if (!this.validateApiAvailableArgument(arg)) {
      return false;
    }
    return this.compareApiAvailableVersion(arg, matchedApi);
  }

  private validateApiAvailablePreCheck(expression: ts.Expression, matchedApi: string): boolean {
    const runtimeType = projectConfig.runtimeOS;
    if (!ts.isCallExpression(expression)) {
      return false;
    }

    if (!expression.arguments || expression.arguments.length !== 1) {
      return false;
    }

    if (runtimeType === this.openSourceRuntime && matchedApi === this.otherSourceDeviceInfo) {
      return false;
    }

    return true;
  }

  /** 校验参数合法性（委托 checkApiAvailableLiteral）。 */
  private validateApiAvailableArgument(arg: ts.Expression): boolean {
    return checkApiAvailableLiteral(arg, { isOpenHarmonyRuntime, isCheckDistributionOSVersion }).valid;
  }

  private compareApiAvailableVersion(arg: ts.Expression, matchedApi: string): boolean {
    return this.compareApiAvailableVersionByValue(this.extractValueFromInitializer(arg).trim(), matchedApi);
  }

  private compareApiAvailableVersionByValue(sinceValue: string, matchedApi: string): boolean {
    const runtimeType = projectConfig.runtimeOS;
    const distributeResult: DistributionOSApiAvailableVersionResult = this.distributionVersionFormat();
    const sinceFormat: string = sinceValue.replace(/[\'|\"|\`]/g, '');
    const sincePointVersion: string[] = sinceFormat.split('.');

    if (sincePointVersion.length === 1 || runtimeType === this.openSourceRuntime) {
      return this.checkMajorNumberVersion(sinceFormat, sincePointVersion, distributeResult);
    }

    if (!checkMSFVersionMajor(sinceFormat)) {
      return this.checkDistributionOSVersion(sinceFormat, matchedApi);
    }

    if (!checkIntegerMoreVersion(sinceFormat)) {
      return false;
    }

    return comparePointVersion(sinceFormat, distributeResult.version) !== ComparisonResult.Less;
  }

  private checkDistributionOSVersion(sinceFormat: string, matchedApi: string): boolean {
    const distributionOSCheck: DistributionOSApiAvailableVersionResult = isCheckDistributionOSVersion(SINCE_TAG_NAME, sinceFormat);
    if (!distributionOSCheck.valid) {
      return false;
    }
    const scenario = matchedApi === SDK_CONSTANTS.OPEN_SOURCE_APIAVAILABLE_INFO
      ? ComparisonSenario.SuppressByOHVersion
      : ComparisonSenario.SuppressByOtherOSVersion;
    const distributionOSResult: VersionValidationResult = this.valueChecker(this.minRequiredVersion, sinceFormat, scenario);
    return distributionOSResult.result;
  }

  private checkMajorNumberVersion(sinceFormat: string, sincePointVersion: string[], distributeResult: DistributionOSApiAvailableVersionResult): boolean {
    const compatibileReg: RegExp = /^(?:[1-9]\d{0,2}|[1-9]\d?\.\d{1,2}\.\d{1,2})$/;
    if (!compatibileReg.test(sinceFormat)) {
      return false;
    }
    switch (sincePointVersion.length) {
      case 1:
        return comparePointVersion(sinceFormat, distributeResult.version) !== ComparisonResult.Less;
      case 3:
        if (!checkMSFVersionMajor(sinceFormat)) {
          return false;
        } else if (comparePointVersion(sinceFormat, distributeResult.version) !== ComparisonResult.Less) {
          return true;
        }
      default:
        return false;
    }
  }

  private distributionVersionFormat(): DistributionOSApiAvailableVersionResult {
    let distributeResult: DistributionOSApiAvailableVersionResult = {
      valid: true,
      version: '',
      message: ''
    };
    const isMSFBracketsVersion: boolean = /^(?:[1-9]\d?\.\d{1,2}\.\d{1,2}|[1-9]\d?\.\d{1,2}\.\d{1,2}\(\d+\))$/.test(this.minRequiredVersion);
    if (isMSFBracketsVersion) {
      const resultOS: DistributionOSApiAvailableVersionResult = isCheckDistributionOSVersion(SINCE_TAG_NAME, this.minRequiredVersion);
      if (resultOS.valid) {
        distributeResult = resultOS;
      } else {
        distributeResult.version = this.minRequiredVersion;
      }
    } else {
      distributeResult.version = this.minRequiredVersion;
    }
    return distributeResult;
  }

  /**
   * Determine if the MSF version is more than 26, Integer does not make judgments.
   * @param since - Version string to validate
   * @returns When MSF (26.0.0) is more than 26, return false and do not judge integers
   */
  private checkSinceMSFVersionMajor(since: string): boolean {
    const msfVersionReg: RegExp = /^[1-9]\d?\.\d{1,2}\.\d{1,2}|[1-9]\d?\.\d{1,2}\.\d{1,2}\(\d+\)$/;
    if (msfVersionReg.test(since)) {
      const majorVersion = parseInt(since.split('.')[0]);
      if (majorVersion > MSF_INTEGER_VERSION) {
        return false;
      }
    }
    return true;
  }

  /**
   * Extracts comparison parts from a binary expression and resolves declaration values.
   *
   * @param expression - The binary expression to analyze
   * @param matchedApi - The API identifier to match against
   * @returns Object with operator, resolved value, and API position, or undefined if invalid
   */
  private extractComparisonParts(
    expression: ts.Expression,
    matchedApi: string
  ): { operator: string; value: string; apiPosition: 'left' | 'right' } | undefined {
    if (!ts.isBinaryExpression(expression)) {
      return undefined;
    }

    const operator = expression.operatorToken.getText();
    const left = expression.left.getText();
    const right = expression.right.getText();

    let targetValue: string;
    let valueExpression: ts.Expression;
    let apiPosition: 'left' | 'right';

    if (left.includes(matchedApi)) {
      targetValue = right;
      valueExpression = expression.right;
      apiPosition = 'left';
    } else if (right.includes(matchedApi)) {
      targetValue = left;
      valueExpression = expression.left;
      apiPosition = 'right';
    } else {
      return undefined;
    }

    const resolvedValue = this.resolveDeclarationValue(valueExpression, targetValue);

    return { operator, value: resolvedValue, apiPosition };
  }

  /**
   * Resolves the declaration value of an expression if it exists.
   *
   * @param expression - The expression to resolve
   * @param fallbackValue - The fallback text value if resolution fails
   * @returns The resolved declaration value or fallback value
   */
  private resolveDeclarationValue(expression: ts.Expression, fallbackValue: string): string {
    if (!this.typeChecker) {
      return fallbackValue;
    }

    try {
      if (!ts.isIdentifier(expression)) {
        return fallbackValue;
      }

      const symbol = this.typeChecker.getSymbolAtLocation(expression);
      if (!symbol?.declarations?.length) {
        return fallbackValue;
      }

      const declaration = symbol.declarations[0];

      if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
        return this.extractValueFromInitializer(declaration.initializer);
      }

      if (ts.isBindingElement(declaration) && declaration.initializer) {
        return this.extractValueFromInitializer(declaration.initializer);
      }

      return fallbackValue;
    } catch (error) {
      return fallbackValue;
    }
  }

  /**
   * 解析参数节点 → 声明初始化器：标识符走 resolveIdentifierInitializer，
   * 属性访问按来源分流——命名空间导入走 resolveNamespaceImportMember，
   * 其他（enum）走 resolveEnumMember。
   */
  private resolveInitializerExpression(expression: ts.Expression): ts.Expression | undefined {
    if (!this.typeChecker) {
      return undefined;
    }

    const typeChecker = this.typeChecker;
    try {
      if (ts.isIdentifier(expression)) {
        return this.resolveIdentifierInitializer(expression, typeChecker);
      }
      if (ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.name)) {
        // 先判断是不是命名空间导入（import * as C），只有导入才解析常量
        if (ts.isIdentifier(expression.expression) &&
          this.isNamespaceImport(expression.expression, typeChecker)) {
          return this.resolveNamespaceImportMember(expression, typeChecker);
        }
        // 非命名空间导入 → enum 成员（同文件或 import enum 均可，不判断 import）
        return this.resolveEnumMember(expression, typeChecker);
      }
      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * 标识符参数 → 声明初始化器：同文件 const/let、解构默认值、命名/默认导入
   */
  private resolveIdentifierInitializer(
    identifier: ts.Identifier,
    typeChecker: ts.TypeChecker
  ): ts.Expression | undefined {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol?.declarations?.length) {
      return undefined;
    }

    const declaration = symbol.declarations[0];
    // eg. const LEVEL = 20; let v = 20; apiAvailable(LEVEL)
    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      return declaration.initializer;
    }
    if (ts.isImportSpecifier(declaration) || ts.isImportClause(declaration)) {
      const aliased = this.getAliasedDeclaration(symbol, typeChecker);
      if (!aliased) {
        return undefined;
      }
      // eg. import DEF from './m'; apiAvailable(DEF)  (./m: export default 20)
      if (ts.isImportClause(declaration) && ts.isExportAssignment(aliased)) {
        return aliased.expression;
      }
      // eg. import { LEVEL } from './m'; apiAvailable(LEVEL)  (./m: export const LEVEL = 20)
      // eg. import DEF from './m'; apiAvailable(DEF)  (./m: const v = 20; export default v)
      if (ts.isVariableDeclaration(aliased) && aliased.initializer) {
        return aliased.initializer;
      }
    }
    return undefined;
  }

  /**
   * 判断标识符是否为命名空间导入（import * as C from './m'）。
   */
  private isNamespaceImport(identifier: ts.Identifier, typeChecker: ts.TypeChecker): boolean {
    const symbol = typeChecker.getSymbolAtLocation(identifier);
    if (!symbol?.declarations?.length) {
      return false;
    }
    const declaration = symbol.declarations[0];
    // import * as C from './m' → C 的声明节点是 NamespaceImport
    return ts.isNamespaceImport(declaration);
  }

  /**
   * enum 成员 → 声明初始化器。enum 同文件或 import 均可，不判断 import。
   * eg. enum L { A = 20 }; apiAvailable(L.A)
   */
  private resolveEnumMember(
    propertyAccess: ts.PropertyAccessExpression,
    typeChecker: ts.TypeChecker
  ): ts.Expression | undefined {
    const symbol = typeChecker.getSymbolAtLocation(propertyAccess.name);
    if (!symbol?.declarations?.length) {
      return undefined;
    }

    const member = symbol.declarations[0];
    if (ts.isEnumMember(member) && member.initializer) {
      return member.initializer;
    }
    return undefined;
  }

  /**
   * 命名空间限定导入常量 → 声明初始化器。支持 import * as
   * eg. import * as C from './m'; apiAvailable(C.LEVEL)  (./m: export const LEVEL = 20)
   */
  private resolveNamespaceImportMember(
    propertyAccess: ts.PropertyAccessExpression,
    typeChecker: ts.TypeChecker
  ): ts.Expression | undefined {
    // 进入时已确认 propertyAccess.expression 是 import * as 的标识符
    const symbol = typeChecker.getSymbolAtLocation(propertyAccess.name);
    if (!symbol?.declarations?.length) {
      return undefined;
    }

    const member = symbol.declarations[0];
    if (ts.isVariableDeclaration(member) && member.initializer) {
      return member.initializer;
    }
    return undefined;
  }

  private getAliasedDeclaration(symbol: ts.Symbol, typeChecker: ts.TypeChecker): ts.Declaration | undefined {
    const targetSymbol = typeChecker.getAliasedSymbol(symbol);
    const actualSymbol = targetSymbol !== symbol ? targetSymbol : symbol;
    return actualSymbol.declarations && actualSymbol.declarations[0];
  }

  /**
   * Extracts the actual value from a variable initializer expression.
   *
   * @param initializer - The initializer expression
   * @returns The extracted value as string
   */
  private extractValueFromInitializer(initializer: ts.Expression): string {
    if (ts.isNumericLiteral(initializer)) {
      return initializer.text;
    }

    if (ts.isStringLiteral(initializer)) {
      return initializer.text;
    }

    if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
      return 'true';
    }
    if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
      return 'false';
    }

    return initializer.getText();
  }

  /**
   * Validates SDK version compatibility by comparing operator, value, and API type.
   *
   * Uses centralized comparison system with runtime-specific scenarios:
   * - OpenHarmony: Simple integer comparison
   * - Other runtimes: External value checker with scenario based on API type:
   *   - sdkApiVersion (openSourceDeviceInfo): SuppressWithoutMSF (1)
   *   - distributionOSApiVersion (otherSourceDeviceInfo): SuppressWithMSF (2)
   *
   * @param operator - Comparison operator from the expression
   * @param value - Version value to compare against
   * @param matchedApi - The matched API identifier
   * @param runtimeType - Runtime environment type (OpenHarmony or Other)
   * @param apiPosition - Position of API in comparison: 'left' or 'right'
   * @returns True if SDK version is compatible, false otherwise
   */
  private validateSdkVersionCompatibility(
    operator: string,
    value: string,
    matchedApi: string,
    runtimeType: string,
    apiPosition: 'left' | 'right'
  ): boolean {
    const numValue = Number(value);
    const comparisonValue = numValue % 1 === 0 ? numValue : Math.ceil(numValue);
    const assignedSdkVersion = this.calculateAssignedSdkVersion(operator, comparisonValue, apiPosition);

    // If we can't determine a specific SDK version (e.g., !=, !==, <, <=), don't suppress warning
    if (assignedSdkVersion === null) {
      return false;
    }

    // OpenHarmony runtime: Simple integer comparison
    if (runtimeType === this.openSourceRuntime) {
      return comparePointVersion(String(assignedSdkVersion), this.minRequiredVersion) !== ComparisonResult.Less;
    }

    // Other runtimes: Use external value checker with appropriate scenario
    // Determine scenario based on which API is being checked:
    // - openSourceDeviceInfo (sdkApiVersion) → SuppressWithoutMSF (1)
    // - otherSourceDeviceInfo (distributionOSApiVersion) → SuppressWithMSF (2)
    const scenario = matchedApi === this.openSourceDeviceInfo
      ? ComparisonSenario.SuppressByOHVersion
      : ComparisonSenario.SuppressByOtherOSVersion;

    // Use centralized value checker
    let validationResult: VersionValidationResult;
    if (this.minAvailableVersion) {
      validationResult = this.valueChecker(
        this.minAvailableVersion.formatVersion,
        assignedSdkVersion.toString(),
        scenario
      );
    } else {
      validationResult = this.valueChecker(
        this.minRequiredVersion,
        assignedSdkVersion.toString(),
        scenario
      );
    }

    return validationResult.result;
  }

  /**
   * Compares SDK version for OpenHarmony runtime.
   *
   * @param assignedSdkVersion - The value being compared against in the condition
   * @returns True if the assigned SDK version meets the minimum requirement
   */
  private sdkOpenSourceComparison(assignedSdkVersion: number): boolean {
    const minRequiredVersion = Number(this.minRequiredVersion);

    if (!Number.isInteger(minRequiredVersion)) {
      return false;
    }

    return assignedSdkVersion >= minRequiredVersion;
  }

  /**
   * Calculates what value the SDK version would have based on the comparison condition.
   * For '<' and '<=' operators, returns null because SDK version could be any value from 1 to comparisonValue.
   *
   * @param operator - Comparison operator
   * @param comparisonValue - Value being compared against
   * @param apiPosition - Whether API is on left or right side
   * @returns Assigned SDK version value, or null if indeterminate
   */
  private calculateAssignedSdkVersion(
    operator: string,
    comparisonValue: number,
    apiPosition: 'left' | 'right'
  ): number | null {
    const effectiveOperator = apiPosition === 'right' ? this.flipOperator(operator) : operator;

    switch (effectiveOperator) {
      case '>':
        return comparisonValue + 1;
      case '>=':
        return comparisonValue;
      case '<':
      case '<=':
        // SDK version could be anywhere from 1 (or minimum) to comparisonValue
        // We cannot determine a specific version, so return null to trigger warning
        return null;
      case '==':
      case '===':
        return comparisonValue;
      case '!=':
      case '!==':
        return null;
      default:
        return null;
    }
  }

  /**
   * Flips comparison operators for when API is on the right side of comparison.
   *
   * @param operator - Original operator
   * @returns Flipped operator
   */
  private flipOperator(operator: string): string {
    switch (operator) {
      case '>': return '<';
      case '<': return '>';
      case '>=': return '<=';
      case '<=': return '>=';
      case '==':
      case '===':
      case '!=':
      case '!==':
        return operator;
      default:
        return operator;
    }
  }

  private findValidImportApiIdentifier(expression: ts.Expression, api: string): ts.Identifier | undefined {
    if (ts.isBinaryExpression(expression)) {
      return this.extractApiIdentifierFromExpression(expression.left, api) ||
        this.extractApiIdentifierFromExpression(expression.right, api);
    }
    return this.extractApiIdentifierFromExpression(expression, api);
  }

  private extractApiIdentifierFromExpression(
    expression: ts.Expression,
    targetProperty: string
  ): ts.Identifier | undefined {
    if (!ts.isPropertyAccessExpression(expression)) {
      return undefined;
    }
    if (expression.name.text !== targetProperty) {
      return undefined;
    }
    return this.getRootIdentifier(expression.expression);
  }

  private getRootIdentifier(expression: ts.Expression): ts.Identifier | undefined {
    let current: ts.Expression = expression;
    while (ts.isPropertyAccessExpression(current)) {
      current = current.expression;
    }
    return ts.isIdentifier(current) ? current : undefined;
  }

  private isValidSdkDeclaration(identifier: ts.Identifier, validPackagePaths: string[]): boolean {
    if (!this.typeChecker) {
      return false;
    }
    const symbol = this.typeChecker.getSymbolAtLocation(identifier);
    if (!symbol) {
      return false;
    }
    const declarationFile = this.getActualDeclarationFile(symbol);
    return declarationFile ?
      this.isValidSdkDeclarationPath(declarationFile, validPackagePaths) :
      false;
  }

  private getActualDeclarationFile(symbol: ts.Symbol): string | undefined {
    if (!this.typeChecker) {
      return undefined;
    }
    const targetSymbol = this.typeChecker.getAliasedSymbol(symbol);
    const actualSymbol = targetSymbol !== symbol ? targetSymbol : symbol;
    if (!actualSymbol.declarations?.length) {
      return undefined;
    }
    const declarationFile = actualSymbol.declarations[0].getSourceFile().fileName;

    return declarationFile.replace(/^.*sdk[\\/].*[\\/](?=@)/, '');
  }

  private isValidSdkDeclarationPath(filePath: string, validPackagePaths: string[]): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/').toLowerCase();
    return validPackagePaths.some(validPath =>
      normalizedPath.includes(validPath.replace(/\\/g, '/').toLowerCase())
    );
  }
}