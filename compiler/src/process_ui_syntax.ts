/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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
import path from 'path';

import { componentCollection } from './validate_ui_syntax';
import { processComponentClass } from './process_component_class';
import processImport from './process_import';
import {
  PAGE_ENTRY_FUNCTION_NAME,
  PREVIEW_COMPONENT_FUNCTION_NAME,
  STORE_PREVIEW_COMPONENTS,
  GET_PREVIEW_FLAG_FUNCTION_NAME,
  COMPONENT_CONSTRUCTOR_UNDEFINED,
  BUILD_ON,
  COMPONENT_BUILDER_DECORATOR,
  COMPONENT_EXTEND_DECORATOR,
  COMPONENT_STYLES_DECORATOR,
  RESOURCE,
  RESOURCE_TYPE,
  WORKER_OBJECT,
  RESOURCE_NAME_ID,
  RESOURCE_NAME_TYPE,
  RESOURCE_NAME_PARAMS,
  RESOURCE_RAWFILE,
  ATTRIBUTE_ANIMATETO,
  GLOBAL_CONTEXT,
  CHECK_COMPONENT_EXTEND_DECORATOR,
  INSTANCE,
  SET_CONTROLLER_CTR_TYPE,
  SET_CONTROLLER_METHOD,
  JS_DIALOG,
  CUSTOM_DIALOG_CONTROLLER_BUILDER
} from './pre_define';
import {
  componentInfo,
  LogInfo,
  LogType,
  hasDecorator,
  FileLog
} from './utils';
import {
  processComponentBlock,
  bindComponentAttr
} from './process_component_build';
import {
  BUILDIN_STYLE_NAMES,
  CUSTOM_BUILDER_METHOD,
  EXTEND_ATTRIBUTE,
  INNER_STYLE_FUNCTION,
  GLOBAL_STYLE_FUNCTION,
  INTERFACE_NODE_SET
} from './component_map';
import {
  localStorageLinkCollection,
  localStoragePropCollection
} from './validate_ui_syntax'
import {
  resources,
  projectConfig
} from '../main';
import { createCustomComponentNewExpression, createViewCreate } from './process_component_member';

export const transformLog: FileLog = new FileLog();
export let contextGlobal: ts.TransformationContext;

export function processUISyntax(program: ts.Program, ut = false): Function {
  return (context: ts.TransformationContext) => {
    contextGlobal = context;
    let pagesDir: string;
    return (node: ts.SourceFile) => {
      pagesDir = path.resolve(path.dirname(node.fileName));
      if (process.env.compiler === BUILD_ON) {
        if (!ut && (path.basename(node.fileName) === 'app.ets' || /\.ts$/.test(node.fileName))) {
          node = ts.visitEachChild(node, processResourceNode, context);
          return node;
        }
        transformLog.sourceFile = node;
        node = createEntryNode(node, context);
        node = ts.visitEachChild(node, processAllNodes, context);
        GLOBAL_STYLE_FUNCTION.forEach((block, styleName) => {
          BUILDIN_STYLE_NAMES.delete(styleName);
        });
        GLOBAL_STYLE_FUNCTION.clear();
        const statements: ts.Statement[] = Array.from(node.statements);
        INTERFACE_NODE_SET.forEach(item => {
          statements.unshift(item);
        });
        node = ts.factory.updateSourceFile(node, statements);
        INTERFACE_NODE_SET.clear();
        return node;
      } else {
        return node;
      }
    };
    function processAllNodes(node: ts.Node): ts.Node {
      if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) ||
        ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        processImport(node, pagesDir, transformLog.errors);
      } else if (ts.isStructDeclaration(node)) {
        componentCollection.currentClassName = node.name.getText();
        node = processComponentClass(node, context, transformLog.errors, program);
        componentCollection.currentClassName = null;
        INNER_STYLE_FUNCTION.forEach((block, styleName) => {
          BUILDIN_STYLE_NAMES.delete(styleName);
        });
        INNER_STYLE_FUNCTION.clear();
      } else if (ts.isFunctionDeclaration(node)) {
        if (hasDecorator(node, COMPONENT_EXTEND_DECORATOR)) {
          node = processExtend(node, transformLog.errors);
        } else if (hasDecorator(node, COMPONENT_BUILDER_DECORATOR) && node.name && node.body &&
          ts.isBlock(node.body)) {
          CUSTOM_BUILDER_METHOD.add(node.name.getText());
          node = ts.factory.updateFunctionDeclaration(node, undefined, node.modifiers,
            node.asteriskToken, node.name, node.typeParameters, node.parameters, node.type,
            processComponentBlock(node.body, false, transformLog.errors));
        } else if (hasDecorator(node, COMPONENT_STYLES_DECORATOR)) {
          if (node.parameters.length === 0) {
            node = undefined;
          } else {
            transformLog.errors.push({
              type: LogType.ERROR,
              message: `@Styles can't have parameters.`,
              pos: node.getStart()
            });
          }
        }
      } else if (isResource(node)) {
        node = processResourceData(node as ts.CallExpression);
      } else if (isWorker(node)) {
        node = processWorker(node as ts.NewExpression);
      } else if (isAnimateTo(node)) {
        node = processAnimateTo(node as ts.CallExpression);
      } else if (isCustomDialogController(node)) {
        node = createCustomDialogController(node.parent, node, transformLog.errors);
      }
      return ts.visitEachChild(node, processAllNodes, context);
    }
    function processResourceNode(node: ts.Node): ts.Node {
      if (isResource(node)) {
        node = processResourceData(node as ts.CallExpression);
      }
      return ts.visitEachChild(node, processResourceNode, context);
    }
  };
}

function isCustomDialogController(node: ts.Expression) {
  const tempParent: ts.Node = node.parent;
  // @ts-ignore
  if (!node.parent && node.original) {
    // @ts-ignore
    node.parent = node.original.parent;
  }
  if (ts.isNewExpression(node) && node.expression && ts.isIdentifier(node.expression) &&
    node.expression.escapedText.toString() === SET_CONTROLLER_CTR_TYPE) {
    return true;
  } else {
    // @ts-ignore
    node.parent = tempParent;
    return false;
  }
}

function createCustomDialogController(parent: ts.Expression, node: ts.NewExpression,
  log: LogInfo[]): ts.NewExpression {
  if (node.arguments && node.arguments.length === 1 &&
    ts.isObjectLiteralExpression(node.arguments[0]) && node.arguments[0].properties) {
    const newproperties: ts.ObjectLiteralElementLike[] = node.arguments[0].properties.map((item) => {
      if (isCustomDialogControllerPropertyAssignment(item, log)) {
        item = processCustomDialogControllerPropertyAssignment(parent, item as ts.PropertyAssignment);
      }
      return item;
    });
    return ts.factory.createNewExpression(node.expression, node.typeArguments,
      [ts.factory.createObjectLiteralExpression(newproperties, true), ts.factory.createThis()]);
  }
}

function isCustomDialogControllerPropertyAssignment(node: ts.ObjectLiteralElementLike,
  log: LogInfo[]): boolean {
  if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) &&
    node.name.getText() === CUSTOM_DIALOG_CONTROLLER_BUILDER) {
    if (ts.isCallExpression(node.initializer) && ts.isIdentifier(node.initializer.expression) &&
      componentCollection.customDialogs.has(node.initializer.expression.getText())) {
      return true;
    } else {
      validateCustomDialogControllerBuilderInit(node, log);
    }
  }
}

function validateCustomDialogControllerBuilderInit(node: ts.ObjectLiteralElementLike,
  log: LogInfo[]): void {
  log.push({
    type: LogType.ERROR,
    message: 'The builder should be initialized with a @CustomDialog Component.',
    pos: node.getStart()
  });
}

function processCustomDialogControllerPropertyAssignment(parent: ts.Expression,
  node: ts.PropertyAssignment): ts.PropertyAssignment {
  if (ts.isCallExpression(node.initializer)) {
    return ts.factory.updatePropertyAssignment(node, node.name,
      processCustomDialogControllerBuilder(parent, node.initializer));
  }
}

function processCustomDialogControllerBuilder(parent: ts.Expression,
  node: ts.CallExpression): ts.ArrowFunction {
  const newExp: ts.Expression = createCustomComponentNewExpression(node);
  const jsDialog: ts.Identifier = ts.factory.createIdentifier(JS_DIALOG);
  return createCustomComponentBuilderArrowFunction(parent, jsDialog, newExp);
}

function createCustomComponentBuilderArrowFunction(parent: ts.Expression,
  jsDialog: ts.Identifier, newExp: ts.Expression): ts.ArrowFunction {
  let mountNodde: ts.PropertyAccessExpression;
  if (ts.isBinaryExpression(parent)) {
    mountNodde = parent.left;
  } else if (ts.isVariableDeclaration(parent) || ts.isPropertyDeclaration(parent)) {
    mountNodde = ts.factory.createPropertyAccessExpression(ts.factory.createThis(),
      parent.name as ts.Identifier);
  }
  return ts.factory.createArrowFunction(
    undefined,
    undefined,
    [],
    undefined,
    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    ts.factory.createBlock(
      [
        ts.factory.createVariableStatement(
          undefined,
          ts.factory.createVariableDeclarationList(
            [ts.factory.createVariableDeclaration(jsDialog, undefined, undefined, newExp)],
            ts.NodeFlags.Let
          )
        ),
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createPropertyAccessExpression(
              jsDialog,
              ts.factory.createIdentifier(SET_CONTROLLER_METHOD)
            ),
            undefined,
            [mountNodde]
          )
        ),
        ts.factory.createExpressionStatement(createViewCreate(jsDialog))
      ],
      true
    )
  );
}

function isResource(node: ts.Node): boolean {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
    (node.expression.escapedText.toString() === RESOURCE ||
    node.expression.escapedText.toString() === RESOURCE_RAWFILE) && node.arguments.length > 0;
}

function isAnimateTo(node: ts.Node): boolean {
  return ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
    node.expression.escapedText.toString() === ATTRIBUTE_ANIMATETO;
}

function processResourceData(node: ts.CallExpression): ts.Node {
  if (ts.isStringLiteral(node.arguments[0])) {
    if (node.expression.getText() === RESOURCE_RAWFILE) {
      return createResourceParam(0, RESOURCE_TYPE.rawfile, [node.arguments[0]]);
    } else {
      return getResourceDataNode(node);
    }
  }
  return node;
}

function getResourceDataNode(node: ts.CallExpression): ts.Node {
  const resourceData: string[] = (node.arguments[0] as ts.StringLiteral).text.trim().split('.');
  if (validateResourceData(resourceData, resources, node.arguments[0].getStart())) {
    const resourceType: number = RESOURCE_TYPE[resourceData[1]];
    if (resourceType === undefined) {
      transformLog.errors.push({
        type: LogType.ERROR,
        message: `The resource type ${resourceData[1]} is not supported.`,
        pos: node.getStart()
      });
      return node;
    }
    const resourceValue: number = resources[resourceData[0]][resourceData[1]][resourceData[2]];
    return createResourceParam(resourceValue, resourceType,
      Array.from(node.arguments).slice(1));
  }
  return node;
}

function createResourceParam(resourceValue: number, resourceType: number, argsArr: ts.Expression[]):
  ts.ObjectLiteralExpression {
  const resourceParams: ts.ObjectLiteralExpression = ts.factory.createObjectLiteralExpression(
    [
      ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral(RESOURCE_NAME_ID),
        ts.factory.createNumericLiteral(resourceValue)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createStringLiteral(RESOURCE_NAME_TYPE),
        ts.factory.createNumericLiteral(resourceType)
      ),
      ts.factory.createPropertyAssignment(
        ts.factory.createIdentifier(RESOURCE_NAME_PARAMS),
        ts.factory.createArrayLiteralExpression(
          argsArr,
          false
        )
      )
    ],
    false
  );
  return resourceParams;
}

function validateResourceData(resourceData: string[], resources: object, pos: number): boolean {
  if (resourceData.length !== 3) {
    transformLog.errors.push({
      type: LogType.ERROR,
      message: 'The input parameter is not supported.',
      pos: pos
    });
  } else if (!resources[resourceData[0]]) {
    transformLog.errors.push({
      type: LogType.ERROR,
      message: `The value of '${resourceData[0]}' is invalid.`,
      pos: pos
    });
  } else if (!resources[resourceData[0]][resourceData[1]]) {
    transformLog.errors.push({
      type: LogType.ERROR,
      message: `Value '${resourceData[1]}' does not exist on type 'typeof ${resourceData[0]}'.`,
      pos: pos
    });
  } else if (!resources[resourceData[0]][resourceData[1]][resourceData[2]]) {
    transformLog.errors.push({
      type: LogType.ERROR,
      message: `Value '${resourceData[2]}' does not exist on type 'typeof ${resourceData[1]}'.`,
      pos: pos
    });
  } else {
    return true;
  }
  return false;
}

function isWorker(node: ts.Node): boolean {
  return ts.isNewExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.name) &&
    node.expression.name.escapedText.toString() === WORKER_OBJECT;
}

function processWorker(node: ts.NewExpression): ts.Node {
  if (node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
    const args: ts.Expression[] = Array.from(node.arguments);
    // @ts-ignore
    const workerPath: string = node.arguments[0].text;
    const stringNode: ts.StringLiteral = ts.factory.createStringLiteral(
      workerPath.replace(/\.ts$/, '.js'));
    args.splice(0, 1, stringNode);
    return ts.factory.updateNewExpression(node, node.expression, node.typeArguments, args);
  }
  return node;
}

function processAnimateTo(node: ts.CallExpression): ts.CallExpression {
  return ts.factory.updateCallExpression(node, ts.factory.createPropertyAccessExpression(
    ts.factory.createIdentifier(GLOBAL_CONTEXT), ts.factory.createIdentifier(ATTRIBUTE_ANIMATETO)),
  node.typeArguments, node.arguments);
}

function processExtend(node: ts.FunctionDeclaration, log: LogInfo[]): ts.FunctionDeclaration {
  const componentName: string = isExtendFunction(node);
  if (componentName && node.body && node.body.statements.length) {
    const statementArray: ts.Statement[] = [];
    const attrSet: ts.CallExpression = node.body.statements[0].expression;
    const changeCompName: ts.ExpressionStatement = ts.factory.createExpressionStatement(processExtendBody(attrSet));
    bindComponentAttr(changeCompName as ts.ExpressionStatement,
      ts.factory.createIdentifier(componentName), statementArray, log);
    let extendFunctionName: string;
    if (node.name.getText().startsWith('__' + componentName + '__')) {
      extendFunctionName = node.name.getText();
    } else {
      extendFunctionName = '__' + componentName + '__' + node.name.getText();
      collectExtend(EXTEND_ATTRIBUTE, componentName, node.name.escapedText.toString());
    }
    return ts.factory.updateFunctionDeclaration(node, undefined, node.modifiers, node.asteriskToken,
      ts.factory.createIdentifier(extendFunctionName), node.typeParameters,
      node.parameters, node.type, ts.factory.updateBlock(node.body, statementArray));
  }
}

function processExtendBody(node: ts.Node): ts.Expression {
  switch (node.kind) {
    case ts.SyntaxKind.CallExpression:
      return ts.factory.createCallExpression(processExtendBody(node.expression), undefined, node.arguments);
    case ts.SyntaxKind.PropertyAccessExpression:
      return ts.factory.createPropertyAccessExpression(processExtendBody(node.expression), node.name);
    case ts.SyntaxKind.Identifier:
      return ts.factory.createIdentifier(node.escapedText.toString().replace(INSTANCE, ''));
  }
}

export function collectExtend(collectionSet: Map<string, Set<string>>, component: string, attribute: string): void {
  if (collectionSet.has(component)) {
    collectionSet.get(component).add(attribute);
  } else {
    collectionSet.set(component, new Set([attribute]));
  }
}

export function isExtendFunction(node: ts.FunctionDeclaration): string {
  if (node.decorators && node.decorators[0].expression && node.decorators[0].expression.expression &&
    node.decorators[0].expression.expression.escapedText.toString() === CHECK_COMPONENT_EXTEND_DECORATOR &&
    node.decorators[0].expression.arguments) {
    return node.decorators[0].expression.arguments[0].escapedText.toString();
  } else {
    return null;
  }
}

function createEntryNode(node: ts.SourceFile, context: ts.TransformationContext): ts.SourceFile {
  if (componentCollection.previewComponent.size === 0 || !projectConfig.isPreview) {
    if (componentCollection.entryComponent) {
      const entryNode: ts.ExpressionStatement =
        createEntryFunction(componentCollection.entryComponent, context);
      return context.factory.updateSourceFile(node, [...node.statements, entryNode]);
    } else {
      return node;
    }
  } else {
    const statementsArray: ts.Statement =
      createPreviewComponentFunction(componentCollection.entryComponent, context);
    return context.factory.updateSourceFile(node, [...node.statements, statementsArray]);
  }
}

function createEntryFunction(name: string, context: ts.TransformationContext)
  : ts.ExpressionStatement {
  let localStorageName: string;
  const localStorageNum: number = localStorageLinkCollection.get(name).size +
    localStoragePropCollection.get(name).size;
  if (componentCollection.entryComponent === name && componentCollection.localStorageName &&
    localStorageNum) {
    localStorageName = componentCollection.localStorageName;
  } else if (componentCollection.entryComponent === name && !componentCollection.localStorageName
    && localStorageNum) {
    transformLog.errors.push({
      type: LogType.ERROR,
      message: `@Entry should have a parameter, like '@Entry (storage)'.`,
      pos: componentCollection.entryComponentPos
    });
    return;
  }
  const newArray: ts.Expression[] = [
    context.factory.createStringLiteral((++componentInfo.id).toString()),
    context.factory.createIdentifier(COMPONENT_CONSTRUCTOR_UNDEFINED),
    context.factory.createObjectLiteralExpression([], false)
  ]
  if (localStorageName) {
    newArray.push(context.factory.createIdentifier(localStorageName))
  }
  const newExpressionStatement: ts.ExpressionStatement =
    context.factory.createExpressionStatement(context.factory.createCallExpression(
      context.factory.createIdentifier(PAGE_ENTRY_FUNCTION_NAME), undefined,
      [context.factory.createNewExpression(context.factory.createIdentifier(name),
        undefined, newArray)]));
  return newExpressionStatement;
}

function createPreviewComponentFunction(name: string, context: ts.TransformationContext)
  : ts.Statement {
  const newArray: ts.Expression[] = [
    context.factory.createStringLiteral((++componentInfo.id).toString()),
    context.factory.createIdentifier(COMPONENT_CONSTRUCTOR_UNDEFINED),
    context.factory.createObjectLiteralExpression([], false)
  ];
  const argsArr: ts.Expression[] = [];
  componentCollection.previewComponent.forEach(componentName => {
    const newExpression: ts.Expression = context.factory.createNewExpression(
      context.factory.createIdentifier(componentName),
      undefined,
      newArray
    );
    argsArr.push(context.factory.createStringLiteral(componentName));
    argsArr.push(newExpression);
  });
  const ifStatement: ts.Statement = context.factory.createIfStatement(
    context.factory.createBinaryExpression(
      context.factory.createTypeOfExpression(context.factory.createIdentifier(GET_PREVIEW_FLAG_FUNCTION_NAME)),
      context.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      context.factory.createStringLiteral(COMPONENT_CONSTRUCTOR_UNDEFINED)
    ),
    context.factory.createBlock(
      [
        context.factory.createIfStatement(
          context.factory.createCallExpression(
            context.factory.createIdentifier(GET_PREVIEW_FLAG_FUNCTION_NAME),
            undefined,
            []
          ),
          context.factory.createBlock(
            [context.factory.createExpressionStatement(context.factory.createCallExpression(
              context.factory.createIdentifier(PREVIEW_COMPONENT_FUNCTION_NAME),
              undefined,
              []
            ))],
            true
          ),
          context.factory.createBlock(
            [
              context.factory.createExpressionStatement(context.factory.createCallExpression(
                context.factory.createIdentifier(STORE_PREVIEW_COMPONENTS),
                undefined,
                [
                  context.factory.createNumericLiteral(componentCollection.previewComponent.size),
                  ...argsArr
                ]
              )),
              name ? context.factory.createExpressionStatement(context.factory.createCallExpression(
                context.factory.createIdentifier(PAGE_ENTRY_FUNCTION_NAME),
                undefined,
                [context.factory.createNewExpression(
                  context.factory.createIdentifier(name),
                  undefined,
                  newArray
                )]
              )) : undefined
            ],
            true
          )
        )
      ],
      true
    ),
    context.factory.createBlock(
      [
        context.factory.createExpressionStatement(context.factory.createCallExpression(
        context.factory.createIdentifier(PAGE_ENTRY_FUNCTION_NAME),
        undefined,
        [context.factory.createNewExpression(
          context.factory.createIdentifier(name ? name : Array.from(componentCollection.previewComponent)[0]),
          undefined,
          newArray
        )]
        ))
      ],
      true
    )
  )
  return ifStatement;
}

export function resetLog(): void {
  transformLog.errors = [];
}
