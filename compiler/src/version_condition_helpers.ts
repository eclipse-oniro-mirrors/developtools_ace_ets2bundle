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
import { IS_VERSION_IN_RANGE_FUNCTION_NAME } from "./ui_utils";
import {
  DEVICE_INFO,
  DISTRIBUTE_API_VERSION_FUNCTION_NAME,
  REQUIRE_NAPI,
} from "./pre_define";

export const BUILTIN_KEY_TO_DISTRIBUTIONAPI: Record<string, number> = {
  "12": 50000,
  "13": 50001,
  "14": 50002,
  "15": 50003,
  "16": 50004,
  "17": 50005,
  "18": 50100,
  "19": 50101,
  "20": 60000,
  "21": 60001,
  "22": 60002,
  "23": 60100,
  "24": 60101,
  "26.0.0": 260000,
  "26.0.1": 260001,
  "26.1.0": 260100
};

export const BUILTIN_VALUE_TO_DISTRIBUTIONAPI: Record<string, number> = {
  "5.0.0": 50000,
  "5.0.1": 50001,
  "5.0.2": 50002,
  "5.0.3": 50003,
  "5.0.4": 50004,
  "5.0.5": 50005,
  "5.1.0": 50100,
  "5.1.1": 50101,
  "6.0.0": 60000,
  "6.0.1": 60001,
  "6.0.2": 60002,
  "6.1.0": 60100,
  "6.1.1": 60101,
  "26.0.0": 260000,
  "26.0.1": 260001,
  "26.1.0": 260100
};

export function mockIsVersionInRange(): ts.FunctionDeclaration {
  const result: ts.FunctionDeclaration = ts.factory.createFunctionDeclaration(
    undefined,
    undefined,
    ts.factory.createIdentifier(IS_VERSION_IN_RANGE_FUNCTION_NAME),
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("min"),
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        undefined
      ),
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier("max"),
        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
        undefined
      ),
    ],
    ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
    ts.factory.createBlock(
      [
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [
              ts.factory.createVariableDeclaration(
                ts.factory.createIdentifier("currentVersion"),
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
                undefined
              ),
            ],
            ts.NodeFlags.Let |
              ts.NodeFlags.EtsContext |
              ts.NodeFlags.ContextFlags
          )
        ),
        ts.factory.createTryStatement(
          ts.factory.createBlock(
            [
              ts.factory.createVariableStatement(
                undefined,
                ts.factory.createVariableDeclarationList(
                  [
                    ts.factory.createVariableDeclaration(
                      ts.factory.createIdentifier(DEVICE_INFO),
                      undefined,
                      undefined,
                      ts.factory.createCallExpression(
                        ts.factory.createIdentifier(REQUIRE_NAPI),
                        undefined,
                        [ts.factory.createStringLiteral(DEVICE_INFO)]
                      )
                    )
                  ],
                  ts.NodeFlags.Const |
                    ts.NodeFlags.EtsContext |
                    ts.NodeFlags.ContextFlags
                )
              ),
              ts.factory.createExpressionStatement(
                ts.factory.createBinaryExpression(
                  ts.factory.createIdentifier("currentVersion"),
                  ts.factory.createToken(ts.SyntaxKind.EqualsToken),
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier(DEVICE_INFO),
                    ts.factory.createIdentifier(
                      DISTRIBUTE_API_VERSION_FUNCTION_NAME
                    )
                  )
                )
              ),
            ],
            true
          ),
          ts.factory.createCatchClause(
            undefined,
            ts.factory.createBlock(
              [ts.factory.createReturnStatement(ts.factory.createFalse())],
              true
            )
          ),
          undefined
        ),
        ts.factory.createIfStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createBinaryExpression(
              ts.factory.createBinaryExpression(
                ts.factory.createTypeOfExpression(
                  ts.factory.createIdentifier("currentVersion")
                ),
                ts.factory.createToken(
                  ts.SyntaxKind.ExclamationEqualsEqualsToken
                ),
                ts.factory.createStringLiteral("number")
              ),
              ts.factory.createToken(ts.SyntaxKind.BarBarToken),
              ts.factory.createPrefixUnaryExpression(
                ts.SyntaxKind.ExclamationToken,
                ts.factory.createCallExpression(
                  ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("Number"),
                    ts.factory.createIdentifier("isFinite")
                  ),
                  undefined,
                  [ts.factory.createIdentifier("currentVersion")]
                )
              )
            ),
            ts.factory.createToken(ts.SyntaxKind.BarBarToken),
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("currentVersion"),
              ts.factory.createToken(ts.SyntaxKind.LessThanToken),
              ts.factory.createNumericLiteral("0")
            )
          ),
          ts.factory.createBlock(
            [ts.factory.createReturnStatement(ts.factory.createFalse())],
            true
          ),
          undefined
        ),
        ts.factory.createIfStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("min"),
              ts.factory.createToken(
                ts.SyntaxKind.ExclamationEqualsEqualsToken
              ),
              ts.factory.createIdentifier("undefined")
            ),
            ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("currentVersion"),
              ts.factory.createToken(ts.SyntaxKind.LessThanToken),
              ts.factory.createIdentifier("min")
            )
          ),
          ts.factory.createBlock(
            [ts.factory.createReturnStatement(ts.factory.createFalse())],
            true
          ),
          undefined
        ),
        ts.factory.createIfStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("max"),
              ts.factory.createToken(
                ts.SyntaxKind.ExclamationEqualsEqualsToken
              ),
              ts.factory.createIdentifier("undefined")
            ),
            ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
            ts.factory.createBinaryExpression(
              ts.factory.createIdentifier("currentVersion"),
              ts.factory.createToken(ts.SyntaxKind.GreaterThanEqualsToken),
              ts.factory.createIdentifier("max")
            )
          ),
          ts.factory.createBlock(
            [ts.factory.createReturnStatement(ts.factory.createFalse())],
            true
          ),
          undefined
        ),
        ts.factory.createReturnStatement(ts.factory.createTrue()),
      ],
      true
    )
  );

  return result;
}
