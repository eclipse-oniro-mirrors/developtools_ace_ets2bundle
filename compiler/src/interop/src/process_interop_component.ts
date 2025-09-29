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
import { componentCollection, linkCollection, builderParamObjectCollection } from './validate_ui_syntax';
import { CREATESTATICCOMPONENT, COMPONENT_POP_FUNCTION, GLOBAL_THIS, PUSH, VIEWSTACKPROCESSOR, UPDATESTATICCOMPONENT, ISINITIALRENDER } from './pre_define';
import { INTEROP_TRAILING_LAMBDA } from './component_map'

function generateGetClassStatements(): ts.Statement[] {
  const statements: ts.Statement[] = [];
  for (const element of componentCollection.arkoalaComponents) {
    const byteCodePath = generateBytecodePathFragement(element[0], element[1]);
    const optionsVariable = ts.factory.createVariableDeclaration(
      ts.factory.createIdentifier(`__Options_${element[0]}`),
      undefined,
      undefined,
      ts.factory.createCallExpression(
          ts.factory.createPropertyAccessExpression(
              ts.factory.createAsExpression(
                  ts.factory.createIdentifier(GLOBAL_THIS),
                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
              ),
              ts.factory.createIdentifier('Panda.getClass')
          ),
          undefined,
          [ts.factory.createStringLiteral(byteCodePath)]
        )
      );

    const optionsVariableStatement = ts.factory.createVariableStatement(
        [],
        ts.factory.createVariableDeclarationList([optionsVariable], ts.NodeFlags.Const)
    );

    statements.push(optionsVariableStatement);
  }
  return statements;
}

/**
 * 
 * @param sourceFile 
 * @returns const __Options_Child = (globalThis as any).Panda.getClass(...);
 */
export function insertGetOptionsAtTop(sourceFile: ts.SourceFile): ts.SourceFile {
    const getClassStatements = generateGetClassStatements();
    const newStatements = [...getClassStatements, ...sourceFile.statements];
    return ts.factory.updateSourceFile(sourceFile, newStatements);
}

export function generateBytecodePathFragement(className: string, filePath: string): string {
    const regex = /.*declgenV1\/(.*?)\.d\.ets$/;
    const match = filePath.match(regex);

    if (!match) {
        throw new Error('declgenV1 path not found.');
    }

    const targetPath = match[1];
    const targetPathWithDollar = targetPath.replace(/\//g, '$');

    return `L${targetPath}/${targetPathWithDollar}$__Options_${className}$ObjectLiteral;`;
}

// create block in this.observeComponentCreation2
export function createStaticArrowBlock(newNode: ts.NewExpression,componentParameter: ts.ObjectLiteralExpression, name: string): ts.Statement[] {
  return [
    setInteropRenderingFlag(),
    createIfStaticComponent(newNode, componentParameter, name),
    resetInteropRenderingFlag()
  ]
}

// isInitialRender
export function createIfStaticComponent(newNode: ts.NewExpression, componentParameter: ts.ObjectLiteralExpression, name: string): ts.IfStatement {
  return ts.factory.createIfStatement(
    ts.factory.createIdentifier(ISINITIALRENDER),
    ts.factory.createBlock(
      [ 
        createInteropExtendableComponent(true),
        createStaticComponent(name, newNode),
        createInteropExtendableComponent(false),
        pushStaticComponent(name),
        popStaticComponent()
      ], true),
    ts.factory.createBlock(
      [
        ts.factory.createCallExpression(
          ts.factory.createElementAccessExpression(
            ts.factory.createIdentifier('static_' + name),
            ts.factory.createNumericLiteral('0')
          ),
          undefined,
          []
        )
      ]
    )
  );
}


function createInteropExtendableComponent(ifUpdate: boolean): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(
        ifUpdate
          ? "__Interop_UpdateInteropExtendableComponent_Internal"
          : "__Interop_ResetInteropExtendableComponent_Internal"
      ),
      undefined,
      ifUpdate ? [ts.factory.createThis()] : []
    )
  );
}

export function setInteropRenderingFlag(): ts.Statement {
  return ts.factory.createExpressionStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createThis(),
        ts.factory.createIdentifier('__interopInStaticRendering_internal_')
      ),
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsToken),
      ts.factory.createTrue()
    )
  );
}

export function resetInteropRenderingFlag(): ts.Statement {
  return ts.factory.createExpressionStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createThis(),
        ts.factory.createIdentifier('__interopInStaticRendering_internal_')
      ),
      ts.factory.createToken(ts.SyntaxKind.EqualsToken),
      ts.factory.createFalse()
    )
  );
}


function createStaticOptions(structName: string): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    [],
    ts.factory.createVariableDeclarationList(
      [ts.factory.createVariableDeclaration(
        ts.factory.createIdentifier('result'),
        undefined,
        undefined,
        ts.factory.createNewExpression(
          ts.factory.createIdentifier(structName),
          undefined,
          []
        )
      )],
      ts.NodeFlags.Const
    )
  );
}

/**
 * 
 * @param objectExpr 
 * @param structName 
 * @returns (() => { const result = new Child(); result[key] = value; return result; })()
 */
export function createStaticComponentOptions(
  objectExpr: ts.ObjectLiteralExpression,
  structName: string
): ts.Expression {
  const constResult = createStaticOptions(`__Options_${structName}`);
  let propertyAssignments: ts.Statement[] = [];
  objectExpr.properties.forEach(prop => {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const name = prop.name.text;
      let propertyName: ts.StringLiteral = ts.factory.createStringLiteral(name);
      let initializer: ts.Expression = prop.initializer;
      if (linkCollection.get(structName)?.has(name)) {
        propertyName = ts.factory.createStringLiteral('__backing_' + name);
      } else if (builderParamObjectCollection.get(structName)?.has(name)) {
        initializer = transformBuilderParam(INTEROP_TRAILING_LAMBDA.has(name) ? INTEROP_TRAILING_LAMBDA.get(name) : prop.initializer);
      }
      propertyAssignments.push(ts.factory.createExpressionStatement(
        ts.factory.createAssignment(
          ts.factory.createElementAccessExpression(
            ts.factory.createIdentifier('result'),
            propertyName
          ),
          initializer
        )
      ));
      propertyAssignments.push(ts.factory.createExpressionStatement(
        ts.factory.createAssignment(
          ts.factory.createElementAccessExpression(
            ts.factory.createIdentifier('result'),
            ts.factory.createStringLiteral('__options_has_' + name)
          ),
          ts.factory.createTrue()
        )
      ));
    }
  });

  const returnStatement = ts.factory.createReturnStatement(
    ts.factory.createIdentifier('result')
  );

  const functionBody = ts.factory.createBlock([
    constResult,
    ...propertyAssignments,
    returnStatement
  ], true);

  const arrowFunction = ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    functionBody
  );

  return arrowFunction;
}

function makeStaticFactory(name: string): ts.ArrowFunction {
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(
      [
        ts.factory.createReturnStatement(
          ts.factory.createNewExpression(
            ts.factory.createIdentifier(name),
            undefined,
            []
          )
        )
      ],
      false
    )
  );
}

// (...args) => __transferCompatibleDynamicBuilder_Interop_Internal(...args)
function transformBuilderParam(initializer: ts.Expression): ts.ArrowFunction {
  const transferCall = ts.factory.createCallExpression(
    ts.factory.createIdentifier("__Interop_transferCompatibleDynamicBuilder_Internal"),
    undefined,
    [initializer]
  );
  
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        ts.factory.createToken(ts.SyntaxKind.DotDotDotToken),
        ts.factory.createIdentifier("args"),
        undefined,
        undefined,
        undefined
      )
    ],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createCallExpression(
      transferCall,
      undefined,
      [ ts.factory.createSpreadElement(ts.factory.createIdentifier("args")) ]
    )
  );
}

/**
 * 
 * @param name the name of staticComponent
 * @param newNode 
 * @returns static_Child = __Interop_CreateStaticComponent_Internal(() => { return new Child(); });
 */
export function createStaticComponent(name: string, newNode: ts.NewExpression): ts.Statement {
  const argument = newNode.arguments;
  const options = argument.length > 2 ? argument[1] : undefined;
  return ts.factory.createExpressionStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier('static_' + name),
      ts.factory.createToken(ts.SyntaxKind.EqualsToken),
      ts.factory.createCallExpression(
        ts.factory.createIdentifier(CREATESTATICCOMPONENT),
        undefined,
        [
          makeStaticFactory(name),
          createStaticComponentOptions(options, name)
        ]
      )
    )
  );
}

/**
 * 
 * @returns ViewStackProcessor.push(static_Child[1]);
 */
export function pushStaticComponent(name: string): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(VIEWSTACKPROCESSOR),
        ts.factory.createIdentifier(PUSH)
      ),
      undefined,
      [
        ts.factory.createElementAccessExpression(
          ts.factory.createIdentifier('static_' + name),
          ts.factory.createNumericLiteral('1')
        )
      ]
    )
  );
}

/**
 * 
 * @returns ViewStackProcessor.pop();
 */
export function popStaticComponent(): ts.ExpressionStatement {
  return ts.factory.createExpressionStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(VIEWSTACKPROCESSOR),
        ts.factory.createIdentifier(COMPONENT_POP_FUNCTION)
      ),
      undefined,
      undefined
    )
  );
}

export function createStaticTuple(name: string): ts.VariableStatement {
  return ts.factory.createVariableStatement(
    undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          ts.factory.createIdentifier('static_' + name),
          undefined,
          ts.factory.createTupleTypeNode(
            [
              ts.factory.createTypeReferenceNode(
                ts.factory.createIdentifier(name),
                undefined
              ),
              ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
            ]
          ),
          undefined
        )
      ],
      ts.NodeFlags.Let
    )
  )
}