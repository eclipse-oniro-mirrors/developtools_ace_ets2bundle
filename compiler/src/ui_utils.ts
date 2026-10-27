/* eslint-disable curly */
/* eslint-disable quotes */
/* eslint-disable max-lines-per-function */
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
import path from "path";
import ts from "typescript";
import fs from "fs";
import os from "os";
import uglifyJS from "uglify-js";

import { getDecoratorNameFromAst } from "./process_struct_componentV2";
import { LogInfo, LogType } from "./utils";
import {
  COMPONENT_EXTEND_DECORATOR,
  COMPONENT_STYLES_DECORATOR,
  DEVICE_INFO,
  REQUIRE_NAPI,
  SDK_API_VERSION_FUNCTION_NAME,
} from "./pre_define";
import { BUILTIN_KEY_TO_DISTRIBUTIONAPI, BUILTIN_VALUE_TO_DISTRIBUTIONAPI, IS_VERSION_IN_RANGE_FUNCTION_NAME } from "./version_condition_helpers";

const SdkApiVersionMapPath = './build-tools/ts-checker-hooks/sdkApiVersionMap.json';

const MIN_API_VERSION: string = 'minApiVersion';
const MAX_API_VERSION: string = 'maxApiVersion';

export interface ISdkApiValues {
    minApiVersionValue: string | number

    maxApiVersionValue: string | number
}

export class VersionComparator {
  private keyToDistributionVersionApiMap = new Map<string, number>();

  private valueToDistributionVersionApiMap = new Map<string, number>();

  constructor() {
    try {
      const raw = this.readWithFallback();
      for (const [key, values] of Object.entries(raw)) {
        if (!Array.isArray(values) || values.length === 0) {
          continue;
        }
        const osVersion = this.toDistributionOSVersion(values[0]);
        if (osVersion === undefined) {
          continue;
        }
        this.keyToDistributionVersionApiMap.set(key, osVersion);
        for (const v of values) {
          const vv = this.toDistributionOSVersion(v);
          if (vv !== undefined) {
            this.valueToDistributionVersionApiMap.set(v, vv);
          }
        }
      }
      const parseFailed =
        this.keyToDistributionVersionApiMap.size === 0 &&
        this.valueToDistributionVersionApiMap.size === 0;
      const missingCriticalVersion =
        !this.valueToDistributionVersionApiMap.has("26.1.0");

      if (parseFailed || missingCriticalVersion) {
        this.applyBuiltinMap();
      }
    } catch (e) {
      this.keyToDistributionVersionApiMap.clear();
      this.valueToDistributionVersionApiMap.clear();
      this.applyBuiltinMap();
    }
  }

  private readWithFallback(): Record<string | number, string[]> {
    try {
      const raw = readSdkVersionMaps();
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        return raw;
      }
    } catch (e) {
      return {};
    }
    return {};
  }

  private toDistributionOSVersion(s: string | number): number | undefined {
    const parts = String(s)
      .replace(/\(.*\)$/, "")
      .split(".");
    if (parts.length < 1 || parts.length > 3) {
      return undefined;
    }
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
      return undefined;
    }
    const [major, minor, patch] = [nums[0] ?? 0, nums[1] ?? 0, nums[2] ?? 0];
    if (minor > 99 || patch > 99) {
      return undefined;
    }
    return major * 10000 + minor * 100 + patch;
  }

  /** 任意形式（key/value）统一映射到 distributionOSVersion 数值 */
  getDistributionOSApiVersion(version: string | number): number | undefined {
    const v = String(version);
    if (this.keyToDistributionVersionApiMap.has(v)) {
      return this.keyToDistributionVersionApiMap.get(v);
    }
    return this.valueToDistributionVersionApiMap.get(v);
  }

  // 是否合法判断
  hasValue(version: string | number): boolean {
    return this.getDistributionOSApiVersion(version) !== undefined;
  }

  compare(a: string | number, b: string | number): number {
    const va = this.getDistributionOSApiVersion(a);
    const vb = this.getDistributionOSApiVersion(b);
    return va - vb;
  }

  /** a >= b 判断 */
  greaterThanTarget(
    version: number | string,
    target: number | string
  ): boolean {
    return this.compare(version, target) >= 0;
  }

  private applyBuiltinMap(): void {
    for (const [key, value] of Object.entries(
      BUILTIN_KEY_TO_DISTRIBUTIONAPI
    )) {
      this.keyToDistributionVersionApiMap.set(key, value);
    }
    for (const [key, value] of Object.entries(
      BUILTIN_VALUE_TO_DISTRIBUTIONAPI
    )) {
      this.valueToDistributionVersionApiMap.set(key, value);
    }
  }
}

const versionComparator: VersionComparator = new VersionComparator();

export function hasDecoratorFromAST(
  node: ts.MethodDeclaration | ts.FunctionDeclaration,
  targetDecoratorName: string
): boolean {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);
  if (!decorators || !decorators.length) {
    return false;
  }
  for (let i = 0; i < decorators.length; i++) {
    const decoratorName: string = getDecoratorNameFromAst(decorators[i]);
    if (decoratorName === targetDecoratorName) {
      return true;
    }
  }
  return false;
}

export function updateExtendBodyWithVersions(
  currentBody: ts.Block,
  sdkApiValues: ISdkApiValues
): ts.Block {
  if (!sdkApiValues.minApiVersionValue && !sdkApiValues.maxApiVersionValue) {
    return currentBody;
  }

  const isInRangeVersionCallExpression: ts.BinaryExpression =
    createIsInRangeVersionStatement(sdkApiValues);

  const resultIfStatement: ts.IfStatement = ts.factory.createIfStatement(
    isInRangeVersionCallExpression,
    currentBody
  );
  const resultBlock: ts.Block = ts.factory.createBlock(
    [resultIfStatement],
    true
  );

  return resultBlock;
}

export function updateStylesStatementsWithSdkVersions(
  currentStatements: ts.Statement[],
  sdkApiValues: ISdkApiValues
): ts.IfStatement | undefined {
  // return origin block when no version conditions
  if (!sdkApiValues.minApiVersionValue && !sdkApiValues.maxApiVersionValue) {
    return undefined;
  }
  const isInRangeVersionCallExpression: ts.BinaryExpression =
    createIsInRangeVersionStatement(sdkApiValues);

  const resultIfStatement: ts.IfStatement = ts.factory.createIfStatement(
    isInRangeVersionCallExpression,
    ts.factory.createBlock(
      currentStatements
    )
  );

  return resultIfStatement;
}

export function fetchExtendDecoratorVersionCondition(
  node: ts.FunctionDeclaration,
  log: LogInfo[]
): ISdkApiValues | undefined {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);

  const extendDecorator: ts.Decorator | undefined = decorators.find((item) => {
    const decoratorName: string = getDecoratorNameFromAst(item);
    return decoratorName === COMPONENT_EXTEND_DECORATOR;
  });

  if (!extendDecorator || !extendDecorator.expression || !ts.isCallExpression(extendDecorator.expression)) {
    return undefined;
  }

  const callExpressionArguments: ts.NodeArray<ts.Expression> | undefined = extendDecorator.expression.arguments;

  if (!callExpressionArguments || !callExpressionArguments.length || callExpressionArguments.length !== 2) {
    return undefined;
  }

  const versionConditionObj: ts.Expression = callExpressionArguments[1];

  if (!ts.isObjectLiteralExpression(versionConditionObj)) {
    log.push({
      type: LogType.ERROR,
      message: `The VersionCondition type only receives an object literal.`,
      pos: versionConditionObj.getStart(),
      code: "10905389"
    });
    return undefined;
  }

  const apiVersionValues: ISdkApiValues | undefined = checkVersionConditionFormat(versionConditionObj, log);

  return apiVersionValues;
}

export function fetchStylesDecoratorVersionCondition(
  node: ts.FunctionDeclaration | ts.MethodDeclaration,
  log: LogInfo[]
): ISdkApiValues | undefined {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);

  const stylesDecorator: ts.Decorator | undefined = decorators.find((item) => {
    const decoratorName: string = getDecoratorNameFromAst(item);
    return decoratorName === COMPONENT_STYLES_DECORATOR;
  });

  if (!stylesDecorator || !stylesDecorator.expression || !ts.isCallExpression(stylesDecorator.expression)) {
    return undefined;
  }

  const callExpressionArguments: ts.NodeArray<ts.Expression> | undefined = stylesDecorator.expression.arguments;

  if (!callExpressionArguments || callExpressionArguments.length !== 1) {
    log.push({
      type: LogType.ERROR,
      message: `'@Styles' decorator call must have exactly one parameter of type VersionCondition.`,
      pos: stylesDecorator.expression.getStart(),
      code: "10905390"
    });
    return undefined;
  }

  const versionConditionObj: ts.Expression = callExpressionArguments[0];

  if (!ts.isObjectLiteralExpression(versionConditionObj)) {
    log.push({
      type: LogType.ERROR,
      message: `The VersionCondition type only receives an object literal.`,
      pos: versionConditionObj.getStart(),
      code: "10905389"
    });
    return undefined;
  }

  const apiVersionValues: ISdkApiValues | undefined = checkVersionConditionFormat(versionConditionObj, log);

  return apiVersionValues;
}

function checkVersionConditionFormat(
  versionConditionObj: ts.ObjectLiteralExpression,
  log: LogInfo[]
): ISdkApiValues | undefined {
  if (
    !versionConditionObj.properties ||
    !versionConditionObj.properties.length
  ) {
    log.push({
      type: LogType.ERROR,
      message: `The VersionCondition object must contain at least one of minApiVersion and maxApiVersion.`,
      pos: versionConditionObj.getStart(),
      code: '10905384'
    });
    return undefined;
  }

  const apiVersionValues: ISdkApiValues = {
    minApiVersionValue: undefined,
    maxApiVersionValue: undefined
  };
  const shouldContinue: { continue: boolean } = { continue: true };
  versionConditionObj.properties.forEach((property) => {
    checkVersionConditionProperty(property, apiVersionValues, shouldContinue, log);
  });
  if (apiVersionValues.minApiVersionValue && apiVersionValues.maxApiVersionValue && shouldContinue.continue) {
    shouldContinue.continue = checkMinLessThanMaxApiVersion(versionConditionObj, apiVersionValues, log);
  }
  if (!shouldContinue.continue) {
    return undefined;
  }
  return apiVersionValues;
}

function checkMinLessThanMaxApiVersion(
  versionConditionObj: ts.ObjectLiteralExpression,
  apiVersionValues: ISdkApiValues,
  log: LogInfo[]
): boolean {
  if (
    versionComparator.greaterThanTarget(
      apiVersionValues.minApiVersionValue,
      apiVersionValues.maxApiVersionValue
    )
  ) {
    log.push({
      type: LogType.ERROR,
      message: `The value of minApiVersion cannot be higher than or equal to that of maxApiVersion.`,
      pos: versionConditionObj.getStart(),
      code: "10905388"
    });
    return false;
  }
  return true;
}

function checkVersionConditionProperty(
  property: ts.ObjectLiteralElementLike,
  apiVersionValues: ISdkApiValues,
  shouldContinue: { continue: boolean },
  log: LogInfo[]
): void {
  if (!ts.isPropertyAssignment(property)) {
    log.push({
      type: LogType.ERROR,
      message: `The attributes of the VersionCondition type must be transferred in the propertyAssignment format.`,
      pos: property.getStart(),
      code: "10905385"
    });
    return;
  }
  const initializer: ts.Expression = property.initializer;
  if (!ts.isStringLiteral(initializer) && !ts.isNumericLiteral(initializer)) {
    log.push({
      type: LogType.ERROR,
      message: `The attribute value of type VersionCondition must be a numeric literal or string literal corresponding to an actual existing version.`,
      pos: initializer.getStart(),
      code: "10905386"
    });
    return;
  }
  const propertyName: string =
    ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ?
      property.name.text :
      undefined;
  if (propertyName === MIN_API_VERSION) {
    const currentMinApiValue: string | number = ts.isStringLiteral(initializer) ?
      initializer.text : Number(initializer.text);
    if (
      checkVersionConditionValueExistence(currentMinApiValue, initializer, log)
    ) {
      apiVersionValues.minApiVersionValue = currentMinApiValue;
    } else {
      shouldContinue.continue = false;
    }
    return;
  }
  if (propertyName === MAX_API_VERSION) {
    const currentMaxApiValue: string | number = ts.isStringLiteral(initializer) ?
      initializer.text : Number(initializer.text);
    if (
      checkVersionConditionValueExistence(currentMaxApiValue, initializer, log)
    ) {
      apiVersionValues.maxApiVersionValue = currentMaxApiValue;
    } else {
      shouldContinue.continue = false;
    }
  }
}

function checkVersionConditionValueExistence(
  versionValue: string | number,
  initializer: ts.Expression,
  log: LogInfo[]
): boolean {
  if (!versionComparator.hasValue(versionValue)) {
    log.push({
      type: LogType.ERROR,
      message: `The attribute value of type VersionCondition must be a numeric literal or string literal corresponding to an actual existing version.`,
      pos: initializer.getStart(),
      code: "10905387"
    });
    return false;
  }
  return true;
}

function getSdkMapPath(): string[] | undefined {
  const sdkVersionMapsPaths: string[] = [];
  if (process.env.externalApiPaths) {
    const externalSdkPaths = process.env.externalApiPaths.split(path.delimiter);
    externalSdkPaths.forEach((apiPath) => {
      sdkVersionMapsPaths.push(path.resolve(apiPath, SdkApiVersionMapPath));
    });
    return sdkVersionMapsPaths;
  }
  return undefined;
}

function readSdkVersionMaps(): Record<string | number, string[]> | undefined {
  const sdkApiPaths: string[] | undefined = getSdkMapPath();
  if (!sdkApiPaths) {
    return undefined;
  }
  for (const sdkMapPath of sdkApiPaths) {
    if (!fs.existsSync(sdkMapPath)) {
      continue;
    }
    const raw: Record<string, string[]> = JSON.parse(
      fs.readFileSync(sdkMapPath, 'utf-8')
    );
    const versionMap: Record<string | number, string[]> = Object.fromEntries(
      Object.entries(raw).map(([key, values]) => [
        /^\d+$/.test(key) ? Number(key) : key,
        values.map((v) => v.replace(/\(.*\)$/, ''))
      ])
    );
    return versionMap;
  }
  return undefined;
}

export function createIsInRangeVersionStatement(sdkValues: ISdkApiValues): ts.BinaryExpression {
  let minApiVersion: number | undefined;
  let maxApiVersion: number | undefined;

  let minApiVersionExpression: ts.NumericLiteral | ts.Identifier =
    ts.factory.createIdentifier("undefined");
  let maxApiVersionExpression: ts.NumericLiteral | ts.Identifier =
    ts.factory.createIdentifier("undefined");

  if (sdkValues.maxApiVersionValue) {
    maxApiVersion = versionComparator.getDistributionOSApiVersion(sdkValues.maxApiVersionValue);
    maxApiVersion &&
      (maxApiVersionExpression = ts.factory.createNumericLiteral(maxApiVersion));
  }
  if (sdkValues.minApiVersionValue) {
    minApiVersion = versionComparator.getDistributionOSApiVersion(sdkValues.minApiVersionValue);
    minApiVersion &&
      (minApiVersionExpression = ts.factory.createNumericLiteral(minApiVersion));
  }

  const typeOfExpression: ts.BinaryExpression = ts.factory.createBinaryExpression(
    ts.factory.createTypeOfExpression(ts.factory.createIdentifier(IS_VERSION_IN_RANGE_FUNCTION_NAME)),
    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
    ts.factory.createStringLiteral("function")
  );

  return ts.factory.createBinaryExpression(
    typeOfExpression,
    ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(IS_VERSION_IN_RANGE_FUNCTION_NAME),
      undefined,
      [minApiVersionExpression, maxApiVersionExpression]
    )
  );
}