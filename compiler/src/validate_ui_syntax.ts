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

import {
  INNER_COMPONENT_DECORATORS,
  COMPONENT_DECORATOR_ENTRY,
  COMPONENT_DECORATOR_PREVIEW,
  COMPONENT_DECORATOR_COMPONENT,
  COMPONENT_DECORATOR_CUSTOM_DIALOG,
  NATIVE_MODULE,
  SYSTEM_PLUGIN,
  OHOS_PLUGIN,
  INNER_COMPONENT_MEMBER_DECORATORS,
  COMPONENT_FOREACH,
  COMPONENT_LAZYFOREACH,
  COMPONENT_STATE_DECORATOR,
  COMPONENT_LINK_DECORATOR,
  COMPONENT_PROP_DECORATOR,
  COMPONENT_STORAGE_PROP_DECORATOR,
  COMPONENT_STORAGE_LINK_DECORATOR,
  COMPONENT_PROVIDE_DECORATOR,
  COMPONENT_CONSUME_DECORATOR,
  COMPONENT_OBJECT_LINK_DECORATOR,
  COMPONENT_OBSERVED_DECORATOR,
  COMPONENT_LOCAL_STORAGE_LINK_DECORATOR,
  COMPONENT_LOCAL_STORAGE_PROP_DECORATOR,
  COMPONENT_BUILDER_DECORATOR,
  COMPONENT_CONCURRENT_DECORATOR,
  CHECK_EXTEND_DECORATORS,
  COMPONENT_STYLES_DECORATOR,
  RESOURCE_NAME_TYPE,
  COMPONENT_BUTTON,
  COMPONENT_TOGGLE,
  COMPONENT_BUILDERPARAM_DECORATOR,
  ESMODULE,
  CARD_ENABLE_DECORATORS,
  CARD_LOG_TYPE_DECORATORS,
  JSBUNDLE,
  COMPONENT_DECORATOR_REUSEABLE,
  STRUCT_DECORATORS,
  STRUCT_CONTEXT_METHOD_DECORATORS,
  CHECK_COMPONENT_EXTEND_DECORATOR,
  CHECK_COMPONENT_ANIMATABLE_EXTEND_DECORATOR,
  CLASS_TRACK_DECORATOR,
  COMPONENT_REQUIRE_DECORATOR,
  COMPONENT_SENDABLE_DECORATOR,
  CLASS_MIN_TRACK_DECORATOR,
  MIN_OBSERVED,
  COMPONENT_NON_DECORATOR
} from './pre_define';
import {
  INNER_COMPONENT_NAMES,
  AUTOMIC_COMPONENT,
  SINGLE_CHILD_COMPONENT,
  SPECIFIC_CHILD_COMPONENT,
  BUILDIN_STYLE_NAMES,
  EXTEND_ATTRIBUTE,
  GLOBAL_STYLE_FUNCTION,
  STYLES_ATTRIBUTE,
  CUSTOM_BUILDER_METHOD,
  GLOBAL_CUSTOM_BUILDER_METHOD,
  INNER_CUSTOM_BUILDER_METHOD,
  INNER_STYLE_FUNCTION
} from './component_map';
import {
  LogType,
  LogInfo,
  componentInfo,
  addLog,
  hasDecorator,
  storedFileInfo,
  ExtendResult
} from './utils';
import { globalProgram, projectConfig, abilityPagesFullPath } from '../main';
import {
  collectExtend,
  isExtendFunction,
  transformLog,
  validatorCard
} from './process_ui_syntax';
import { stateObjectCollection } from './process_component_member';

export interface ComponentCollection {
  localStorageName: string;
  localStorageNode: ts.Identifier | ts.ObjectLiteralExpression;
  entryComponentPos: number;
  entryComponent: string;
  previewComponent: Array<string>;
  customDialogs: Set<string>;
  customComponents: Set<string>;
  currentClassName: string;
}

export class IComponentSet {
  properties: Set<string> = new Set();
  regulars: Set<string> = new Set();
  states: Set<string> = new Set();
  links: Set<string> = new Set();
  props: Set<string> = new Set();
  storageProps: Set<string> = new Set();
  storageLinks: Set<string> = new Set();
  provides: Set<string> = new Set();
  consumes: Set<string> = new Set();
  objectLinks: Set<string> = new Set();
  localStorageLink: Map<string, Set<string>> = new Map();
  localStorageProp: Map<string, Set<string>> = new Map();
  builderParams: Set<string> = new Set();
  builderParamData: Set<string> = new Set();
  propData: Set<string> = new Set();
  regularInit: Set<string> = new Set();
  stateInit: Set<string> = new Set();
  provideInit: Set<string> = new Set();
  privateCollection: Set<string> = new Set();
}

export const componentCollection: ComponentCollection = {
  localStorageName: null,
  localStorageNode: null,
  entryComponentPos: null,
  entryComponent: null,
  previewComponent: new Array(),
  customDialogs: new Set([]),
  customComponents: new Set([]),
  currentClassName: null
};

export const observedClassCollection: Set<string> = new Set();
export const enumCollection: Set<string> = new Set();
export const classMethodCollection: Map<string, Set<string>> = new Map();
export const dollarCollection: Set<string> = new Set();

export const propertyCollection: Map<string, Set<string>> = new Map();
export const stateCollection: Map<string, Set<string>> = new Map();
export const linkCollection: Map<string, Set<string>> = new Map();
export const propCollection: Map<string, Set<string>> = new Map();
export const regularCollection: Map<string, Set<string>> = new Map();
export const storagePropCollection: Map<string, Set<string>> = new Map();
export const storageLinkCollection: Map<string, Set<string>> = new Map();
export const provideCollection: Map<string, Set<string>> = new Map();
export const consumeCollection: Map<string, Set<string>> = new Map();
export const objectLinkCollection: Map<string, Set<string>> = new Map();
export const builderParamObjectCollection: Map<string, Set<string>> = new Map();
export const localStorageLinkCollection: Map<string, Map<string, Set<string>>> = new Map();
export const localStoragePropCollection: Map<string, Map<string, Set<string>>> = new Map();
export const builderParamInitialization: Map<string, Set<string>> = new Map();
export const propInitialization: Map<string, Set<string>> = new Map();
export const regularInitialization: Map<string, Set<string>> = new Map();
export const stateInitialization: Map<string, Set<string>> = new Map();
export const provideInitialization: Map<string, Set<string>> = new Map();
export const privateCollection: Map<string, Set<string>> = new Map();

export const isStaticViewCollection: Map<string, boolean> = new Map();

export const useOSFiles: Set<string> = new Set();
export const sourcemapNamesCollection: Map<string, Map<string, string>> = new Map();
export const originalImportNamesMap: Map<string, string> = new Map();

export function validateUISyntax(source: string, content: string, filePath: string,
  fileQuery: string, sourceFile: ts.SourceFile = null): LogInfo[] {
  let log: LogInfo[] = [];
  if (process.env.compileMode === 'moduleJson' ||
    path.resolve(filePath) !== path.resolve(projectConfig.projectPath || '', 'app.ets')) {
    const res: LogInfo[] = checkComponentDecorator(source, filePath, fileQuery, sourceFile);
    if (res) {
      log = log.concat(res);
    }
    const allComponentNames: Set<string> =
      new Set([...INNER_COMPONENT_NAMES, ...componentCollection.customComponents]);
    checkUISyntax(filePath, allComponentNames, content, log, sourceFile, fileQuery);
    componentCollection.customComponents.forEach(item => componentInfo.componentNames.add(item));
  }

  return log;
}

function checkComponentDecorator(source: string, filePath: string,
  fileQuery: string, sourceFile: ts.SourceFile | null): LogInfo[] | null {
  const log: LogInfo[] = [];
  if (!sourceFile) {
    sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS);
  }
  if (sourceFile && sourceFile.statements && sourceFile.statements.length) {
    const result: DecoratorResult = {
      entryCount: 0,
      previewCount: 0
    };
    sourceFile.statements.forEach((item, index, arr) => {
      if (isObservedClass(item)) {
        // @ts-ignore
        observedClassCollection.add(item.name.getText());
      }
      if (ts.isEnumDeclaration(item) && item.name) {
        enumCollection.add(item.name.getText());
      }
      if (ts.isStructDeclaration(item)) {
        if (item.name && ts.isIdentifier(item.name)) {
          const decorators: readonly ts.Decorator[] = ts.getAllDecorators(item);
          if (decorators && decorators.length) {
            checkDecorators(decorators, result, item.name, log, sourceFile, item);
          } else {
            const message: string = `A struct should use decorator '@Component'.`;
            addLog(LogType.WARN, message, item.getStart(), log, sourceFile);
          }
        } else {
          const message: string = `A struct must have a name.`;
          addLog(LogType.ERROR, message, item.getStart(), log, sourceFile);
        }
      }
      if (ts.isMissingDeclaration(item)) {
        const decorators = ts.getAllDecorators(item);
        for (let i = 0; i < decorators.length; i++) {
          if (decorators[i] && /struct/.test(decorators[i].getText())) {
            const message: string = `Please use a valid decorator.`;
            addLog(LogType.ERROR, message, item.getStart(), log, sourceFile);
            break;
          }
        }
      }
    });
    if (process.env.compileTool === 'rollup') {
      if (result.entryCount > 0) {
        storedFileInfo.wholeFileInfo[path.resolve(sourceFile.fileName)].hasEntry = true;
      } else {
        storedFileInfo.wholeFileInfo[path.resolve(sourceFile.fileName)].hasEntry = false;
      }
    }
    validateEntryAndPreviewCount(result, fileQuery, sourceFile.fileName, projectConfig.isPreview,
      !!projectConfig.checkEntry, log);
  }

  return log.length ? log : null;
}

function validateEntryAndPreviewCount(result: DecoratorResult, fileQuery: string,
  fileName: string, isPreview: boolean, checkEntry: boolean, log: LogInfo[]): void {
  if (result.previewCount > 10 && (fileQuery === '?entry' || process.env.watchMode === 'true')) {
    log.push({
      type: LogType.ERROR,
      message: `A page can contain at most 10 '@Preview' decorators.`,
      fileName: fileName
    });
  }
  if (result.entryCount > 1 && fileQuery === '?entry') {
    log.push({
      type: LogType.ERROR,
      message: `A page can't contain more than one '@Entry' decorator`,
      fileName: fileName
    });
  }
  if (isPreview && !checkEntry && result.previewCount < 1 && result.entryCount !== 1 &&
    fileQuery === '?entry') {
    log.push({
      type: LogType.ERROR,
      message: `A page which is being previewed must have one and only one '@Entry' ` +
        `decorator, or at least one '@Preview' decorator.`,
      fileName: fileName
    });
  } else if ((!isPreview || isPreview && checkEntry) && result.entryCount !== 1 && fileQuery === '?entry' &&
    !abilityPagesFullPath.includes(path.resolve(fileName).toLowerCase())) {
    log.push({
      type: LogType.ERROR,
      message: `A page configured in '${projectConfig.pagesJsonFileName}' must have one and only one '@Entry' ` +
        `decorator.`,
      fileName: fileName
    });
  }
}

export function isObservedClass(node: ts.Node): boolean {
  if (ts.isClassDeclaration(node) && hasDecorator(node, COMPONENT_OBSERVED_DECORATOR)) {
    return true;
  }
  return false;
}

export function isCustomDialogClass(node: ts.Node): boolean {
  if (ts.isStructDeclaration(node) && hasDecorator(node, COMPONENT_DECORATOR_CUSTOM_DIALOG)) {
    return true;
  }
  return false;
}

interface DecoratorResult {
  entryCount: number;
  previewCount: number;
}

function checkDecorators(decorators: readonly ts.Decorator[], result: DecoratorResult,
  component: ts.Identifier, log: LogInfo[], sourceFile: ts.SourceFile, node: ts.StructDeclaration): void {
  let hasComponentDecorator: boolean = false;
  const componentName: string = component.getText();
  decorators.forEach((element) => {
    let name: string = element.getText().replace(/\([^\(\)]*\)/, '').trim();
    if (element.expression && element.expression.expression && ts.isIdentifier(element.expression.expression)) {
      name = '@' + element.expression.expression.getText();
    }
    if (INNER_COMPONENT_DECORATORS.has(name)) {
      componentCollection.customComponents.add(componentName);
      switch (name) {
        case COMPONENT_DECORATOR_ENTRY:
          checkEntryComponent(node, log, sourceFile);
          result.entryCount++;
          componentCollection.entryComponent = componentName;
          componentCollection.entryComponentPos = node.getStart();
          collectLocalStorageName(element);
          break;
        case COMPONENT_DECORATOR_PREVIEW:
          result.previewCount++;
          componentCollection.previewComponent.push(componentName);
          break;
        case COMPONENT_DECORATOR_COMPONENT:
          hasComponentDecorator = true;
          break;
        case COMPONENT_DECORATOR_CUSTOM_DIALOG:
          componentCollection.customDialogs.add(componentName);
          hasComponentDecorator = true;
          break;
        case COMPONENT_DECORATOR_REUSEABLE:
          storedFileInfo.getCurrentArkTsFile().recycleComponents.add(componentName);
          hasComponentDecorator = true;
          break;
      }
    } else {
      const pos: number = element.expression ? element.expression.pos : element.pos;
      const message: string = `The struct '${componentName}' use invalid decorator.`;
      addLog(LogType.WARN, message, pos, log, sourceFile);
    }
  });
  if (!hasComponentDecorator) {
    const message: string = `The struct '${componentName}' should use decorator '@Component'.`;
    addLog(LogType.WARN, message, component.pos, log, sourceFile);
  }
  if (BUILDIN_STYLE_NAMES.has(componentName)) {
    const message: string = `The struct '${componentName}' cannot have the same name ` +
      `as the built-in attribute '${componentName}'.`;
    addLog(LogType.ERROR, message, component.pos, log, sourceFile);
  }
  if (INNER_COMPONENT_NAMES.has(componentName)) {
    const message: string = `The struct '${componentName}' cannot have the same name ` +
      `as the built-in component '${componentName}'.`;
    addLog(LogType.ERROR, message, component.pos, log, sourceFile);
  }
}

function checkConcurrentDecorator(node: ts.FunctionDeclaration | ts.MethodDeclaration, log: LogInfo[],
  sourceFile: ts.SourceFile): void {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);
  if (projectConfig.compileMode === JSBUNDLE) {
    const message: string = `@Concurrent can only be used in ESMODULE compile mode.`;
    addLog(LogType.ERROR, message, decorators![0].pos, log, sourceFile);
  }
  if (ts.isMethodDeclaration(node)) {
    const message: string = `@Concurrent can not be used on method. please use it on function declaration.`;
    addLog(LogType.ERROR, message, decorators![0].pos, log, sourceFile);
  }
  if (node.asteriskToken) {
    let hasAsync: boolean = false;
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    const checkAsyncModifier = (modifier: ts.Modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword;
    modifiers && (hasAsync = modifiers.some(checkAsyncModifier));
    const funcKind: string = hasAsync ? 'Async generator' : 'Generator';
    const message: string = `@Concurrent can not be used on ${funcKind} function declaration.`;
    addLog(LogType.ERROR, message, decorators![0].pos, log, sourceFile);
  }
}

function collectLocalStorageName(node: ts.Decorator): void {
  if (node && node.expression && ts.isCallExpression(node.expression)) {
    if (node.expression.arguments && node.expression.arguments.length) {
      node.expression.arguments.forEach((item: ts.Node, index: number) => {
        if (ts.isIdentifier(item) && index === 0) {
          componentCollection.localStorageName = item.getText();
          componentCollection.localStorageNode = item;
        } else if (ts.isObjectLiteralExpression(item) && index === 0) {
          componentCollection.localStorageName = null;
          componentCollection.localStorageNode = item;
        }
      });
    }
  } else {
    componentCollection.localStorageName = null;
    componentCollection.localStorageNode = null;
  }
}

function checkUISyntax(filePath: string, allComponentNames: Set<string>, content: string,
  log: LogInfo[], sourceFile: ts.SourceFile | null, fileQuery: string): void {
  if (!sourceFile) {
    sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS);
  }
  visitAllNode(sourceFile, sourceFile, allComponentNames, log, false, false, fileQuery);
}

function propertyInitializeInEntry(fileQuery: string, name: string): boolean {
  return fileQuery === '?entry' && name === componentCollection.entryComponent;
}

function visitAllNode(node: ts.Node, sourceFileNode: ts.SourceFile, allComponentNames: Set<string>,
  log: LogInfo[], structContext: boolean, classContext: boolean, fileQuery: string): void {
  if (ts.isStructDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
    structContext = true;
    collectComponentProps(node, propertyInitializeInEntry(fileQuery, node.name.escapedText.toString()));
  }
  if (ts.isClassDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
    classContext = true;
    if (isSendableClassDeclaration(node as ts.ClassDeclaration)) {
      validateSendableClass(sourceFileNode, node as ts.ClassDeclaration, log);
    }
  }
  if (ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) {
    const extendResult: ExtendResult = { decoratorName: '', componentName: '' };
    if (hasDecorator(node, COMPONENT_BUILDER_DECORATOR)) {
      CUSTOM_BUILDER_METHOD.add(node.name.getText());
      if (ts.isFunctionDeclaration(node)) {
        GLOBAL_CUSTOM_BUILDER_METHOD.add(node.name.getText());
      } else {
        INNER_CUSTOM_BUILDER_METHOD.add(node.name.getText());
      }
    } else if (ts.isFunctionDeclaration(node) && isExtendFunction(node, extendResult)) {
      if (extendResult.decoratorName === CHECK_COMPONENT_EXTEND_DECORATOR) {
        collectExtend(EXTEND_ATTRIBUTE, extendResult.componentName, node.name.getText());
      }
      if (extendResult.decoratorName === CHECK_COMPONENT_ANIMATABLE_EXTEND_DECORATOR) {
        collectExtend(storedFileInfo.getCurrentArkTsFile().animatableExtendAttribute,
          extendResult.componentName, node.name.getText());
      }
    } else if (hasDecorator(node, COMPONENT_STYLES_DECORATOR)) {
      collectStyles(node);
    }
    if (hasDecorator(node, COMPONENT_CONCURRENT_DECORATOR)) {
      // ark compiler's feature
      checkConcurrentDecorator(node, log, sourceFileNode);
    }
  }
  checkDecorator(sourceFileNode, node, log, structContext, classContext);
  node.getChildren().forEach((item: ts.Node) => visitAllNode(item, sourceFileNode, allComponentNames,
    log, structContext, classContext, fileQuery));
  structContext = false;
  classContext = false;
}

function collectStyles(node: ts.FunctionLikeDeclarationBase): void {
  if (ts.isBlock(node.body) && node.body.statements) {
    if (ts.isFunctionDeclaration(node)) {
      GLOBAL_STYLE_FUNCTION.set(node.name.getText(), node.body);
    } else {
      INNER_STYLE_FUNCTION.set(node.name.getText(), node.body);
    }
    STYLES_ATTRIBUTE.add(node.name.getText());
    BUILDIN_STYLE_NAMES.add(node.name.getText());
  }
}

function checkDecorator(sourceFileNode: ts.SourceFile, node: ts.Node,
  log: LogInfo[], structContext: boolean, classContext: boolean): void {
  if (ts.isIdentifier(node) && (ts.isDecorator(node.parent) ||
    (ts.isCallExpression(node.parent) && ts.isDecorator(node.parent.parent)))) {
    const decoratorName: string = node.escapedText.toString();
    validateStructDecorator(sourceFileNode, node, log, structContext, decoratorName);
    validateMethodDecorator(sourceFileNode, node, log, structContext, decoratorName);
    validateClassDecorator(sourceFileNode, node, log, classContext, decoratorName);
  }
}

const classDecorators: string[] = [CLASS_TRACK_DECORATOR, CLASS_MIN_TRACK_DECORATOR, MIN_OBSERVED];

function validateClassDecorator(sourceFileNode: ts.SourceFile, node: ts.Identifier, log: LogInfo[],
  classContext: boolean, decoratorName: string): void {
  if (!classContext && classDecorators.includes(decoratorName)) {
    const message: string = `The '@${decoratorName}' decorator can only be used in 'class'.`;
    addLog(LogType.ERROR, message, node.pos, log, sourceFileNode);
  } else if ('@' + decoratorName === COMPONENT_SENDABLE_DECORATOR &&
      (!node.parent || !node.parent.parent || !ts.isClassDeclaration(node.parent.parent))) {
    const message: string = 'The \'@Sendable\' decorator can only be added to \'class\'.';
    addLog(LogType.ERROR, message, node.pos, log, sourceFileNode);
  } else if (decoratorName === CLASS_MIN_TRACK_DECORATOR && !hasObservedClass(classContext, node)) {
    const message: string = `The '@track' decorator can only be used within a 'class' decorated with observed.`;
    addLog(LogType.ERROR, message, node.pos, log, sourceFileNode);
  }
}

function parseClassDecorator(node: ts.ClassDeclaration): boolean {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);
  return decorators.some((item: ts.Decorator) => {
    return ts.isIdentifier(item.expression) && item.expression.escapedText.toString() === MIN_OBSERVED;
  });
}

function hasObservedClass(classContext: boolean, node: ts.Identifier): boolean {
  let isObservedClass: boolean = false;
  if (classContext && ts.isDecorator(node.parent) && ts.isPropertyDeclaration(node.parent.parent) &&
    ts.isClassDeclaration(node.parent.parent.parent)) {
    isObservedClass = parseClassDecorator(node.parent.parent.parent);
  }
  return isObservedClass;
}

function validateStructDecorator(sourceFileNode: ts.SourceFile, node: ts.Identifier, log: LogInfo[],
  structContext: boolean, decoratorName: string): void {
  if (!structContext && STRUCT_DECORATORS.has(`@${decoratorName}`)) {
    const message: string = `The '@${decoratorName}' decorator can only be used with 'struct'.`;
    addLog(LogType.ERROR, message, node.pos, log, sourceFileNode);
  }
}

function validateMethodDecorator(sourceFileNode: ts.SourceFile, node: ts.Identifier, log: LogInfo[],
  structContext: boolean, decoratorName: string): void {
  let message: string;
  if (ts.isMethodDeclaration(node.parent.parent) ||
    (ts.isDecorator(node.parent.parent) && ts.isMethodDeclaration(node.parent.parent.parent))) {
    if (!structContext && STRUCT_CONTEXT_METHOD_DECORATORS.has(`@${decoratorName}`)) {
      message = `The '@${decoratorName}' decorator can only be used in 'struct'.`;
    }
    if (CHECK_EXTEND_DECORATORS.includes(decoratorName)) {
      message = `The '@${decoratorName}' decorator can not be a member property method of a 'class' or 'struct'.`;
    }
    if (message) {
      addLog(LogType.ERROR, message, node.pos, log, sourceFileNode);
    }
  }
}

function isSendableClassDeclaration(classDeclarationNode: ts.ClassDeclaration): boolean {
  return hasDecorator(classDeclarationNode, COMPONENT_SENDABLE_DECORATOR) ||
      (classDeclarationNode.members && classDeclarationNode.members.some((member: ts.Node) => {
        // Check if the constructor has "use sendable" as the first statement
        // (Sendable classes already transformed by process_ui_syntax.ts)
        if (ts.isConstructorDeclaration(member)) {
          if (!(member as ts.ConstructorDeclaration).body ||
              !(member as ts.ConstructorDeclaration).body.statements) {
            return false;
          }
          const constructorStatements: ts.Statement[] = (member as ts.ConstructorDeclaration).body.statements;
          if (constructorStatements && constructorStatements[0] &&
              ts.isExpressionStatement(constructorStatements[0])) {
            const expression: ts.Node = (constructorStatements[0] as ts.ExpressionStatement).expression;
            return expression && ts.isStringLiteral(expression) &&
                (expression as ts.StringLiteral).text === 'use sendable';
          }
        }
        return false;
      }));
}

function isSendableTypeReference(type: ts.Type): boolean {
  if (!type || !type.getSymbol() || !type.getSymbol().valueDeclaration) {
    return false;
  }
  const valueDeclarationNode: ts.Node = type.getSymbol().valueDeclaration;
  if (valueDeclarationNode && ts.isClassDeclaration(valueDeclarationNode)) {
    return isSendableClassDeclaration(valueDeclarationNode as ts.ClassDeclaration);
  }
  return false;
}

function isSendableTypeNode(typeNode: ts.TypeNode): boolean {
  if (ts.isUnionTypeNode(typeNode)) {
    return true;
  }
  // input typeNode should not be undefined or none, ensured by caller
  switch (typeNode.kind) {
    case ts.SyntaxKind.StringKeyword:
    case ts.SyntaxKind.NumberKeyword:
    case ts.SyntaxKind.BooleanKeyword:
    case ts.SyntaxKind.BigIntKeyword:
      return true;
    case ts.SyntaxKind.TypeReference: {
      if (globalProgram.checker) {
        return isSendableTypeReference(globalProgram.checker.getTypeFromTypeNode(typeNode));
      }
      return false;
    }
    default:
      return false;
  }
}

function validateSendableClass(sourceFileNode: ts.SourceFile, node: ts.ClassDeclaration, log: LogInfo[]): void {
  // process parent classes
  // extend clause must precede implements clause, so parent can only be heritageClauses[0]
  if (node.heritageClauses && node.heritageClauses.length >= 1 &&
      node.heritageClauses[0].token && node.heritageClauses[0].token === ts.SyntaxKind.ExtendsKeyword &&
      node.heritageClauses[0].types && node.heritageClauses[0].types.length === 1) {
    const expressionNode: ts.ExpressionWithTypeArguments = node.heritageClauses[0].types[0];
    if (expressionNode.expression && ts.isIdentifier(expressionNode.expression) && globalProgram.checker) {
      if (!isSendableTypeReference(globalProgram.checker.getTypeAtLocation(expressionNode.expression))) {
        addLog(LogType.ERROR, 'The parent class of @Sendable classes must be @Sendable class',
          expressionNode.expression.getStart(), log, sourceFileNode);
      }
    }
  }

  // process all properties
  node.members.forEach(item => {
    if (ts.isPropertyDeclaration(item)) {
      const propertyItem: ts.PropertyDeclaration = (item as ts.PropertyDeclaration);
      if (propertyItem.questionToken) {
        addLog(LogType.ERROR, 'Optional properties are not supported in @Sendable classes',
          propertyItem.questionToken.getStart(), log, sourceFileNode);
      } else if (propertyItem.exclamationToken) {
        addLog(LogType.ERROR, 'Definite assignment assertions are not supported in @Sendable classes.',
          propertyItem.exclamationToken.getStart(), log, sourceFileNode);
      } else if (!ts.isIdentifier(propertyItem.name)) {
        addLog(LogType.ERROR,
          'Properties with names that are not identifiers are not supported in @Sendable classes.',
          propertyItem.name.getStart(), log, sourceFileNode);
      } else if (!propertyItem.type) {
        addLog(LogType.ERROR,
          'Property declarations without explicit types are not supported in @Sendable classes.',
          propertyItem.name.getStart(), log, sourceFileNode);
      } else if (!isSendableTypeNode(propertyItem.type)) {
        addLog(LogType.ERROR,
          'Properties with types that are not basic types (string, number, boolean) or @Sendable classes ' +
          'are not supported in @Sendable classes.',
          propertyItem.type.getStart(), log, sourceFileNode);
      }
    } else if (ts.isGetAccessorDeclaration(item) || ts.isSetAccessorDeclaration(item)) {
      if (!ts.isIdentifier((item as ts.AccessorDeclaration).name)) {
        addLog(LogType.ERROR,
          'Accessors with names that are not identifiers are not supported in @Sendable classes.',
          item.name.getStart(), log, sourceFileNode);
      }
    }
  });
}

export function checkAllNode(
  node: ts.EtsComponentExpression,
  allComponentNames: Set<string>,
  sourceFileNode: ts.SourceFile,
  log: LogInfo[]
): void {
  if (ts.isIdentifier(node.expression)) {
    checkNoChildComponent(node, sourceFileNode, log);
    checkOneChildComponent(node, allComponentNames, sourceFileNode, log);
    checkSpecificChildComponent(node, allComponentNames, sourceFileNode, log);
  }
}

interface ParamType {
  name: string,
  value: string,
}

function checkNoChildComponent(node: ts.EtsComponentExpression, sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  const isCheckType: ParamType = { name: null, value: null};
  if (hasChild(node, isCheckType)) {
    const componentName: string = (node.expression as ts.Identifier).escapedText.toString();
    const pos: number = node.expression.getStart();
    const message: string = isCheckType.name === null ?
      `The component '${componentName}' can't have any child.` :
      `When the component '${componentName}' set '${isCheckType.name}' is '${isCheckType.value}'` +
        `, can't have any child.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasChild(node: ts.EtsComponentExpression, isCheckType: ParamType): boolean {
  const nodeName: ts.Identifier = node.expression as ts.Identifier;
  if ((AUTOMIC_COMPONENT.has(nodeName.escapedText.toString()) || judgeComponentType(nodeName, node, isCheckType)) &&
    getNextNode(node)) {
    return true;
  }
  return false;
}

function judgeComponentType(nodeName: ts.Identifier, etsComponentExpression: ts.EtsComponentExpression,
  isCheckType: ParamType): boolean {
  return COMPONENT_TOGGLE === nodeName.escapedText.toString() &&
    etsComponentExpression.arguments && etsComponentExpression.arguments[0] &&
    ts.isObjectLiteralExpression(etsComponentExpression.arguments[0]) &&
    etsComponentExpression.arguments[0].getText() &&
    judgeToggleComponentParamType(etsComponentExpression.arguments[0].getText(), isCheckType);
}

function judgeToggleComponentParamType(param: string, isCheckType: ParamType): boolean {
  if (param.indexOf(RESOURCE_NAME_TYPE) > -1) {
    isCheckType.name = RESOURCE_NAME_TYPE;
    const match: string[] = param.match(/\b(Checkbox|Switch|Button)\b/);
    if (match && match.length) {
      isCheckType.value = match[0];
      if (isCheckType.value === COMPONENT_BUTTON) {
        return false;
      }
      return true;
    }
  }
  return false;
}

function getNextNode(node: ts.EtsComponentExpression): ts.Block {
  if (node.body && ts.isBlock(node.body)) {
    const statementsArray: ts.Block = node.body;
    return statementsArray;
  }
}

function checkOneChildComponent(node: ts.EtsComponentExpression, allComponentNames: Set<string>,
  sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  const isCheckType: ParamType = { name: null, value: null};
  if (hasNonSingleChild(node, allComponentNames, isCheckType)) {
    const componentName: string = (node.expression as ts.Identifier).escapedText.toString();
    const pos: number = node.expression.getStart();
    const message: string = isCheckType.name === null ?
      `The component '${componentName}' can only have a single child component.` :
      `When the component '${componentName}' set '${isCheckType.name}' is ` +
        `'${isCheckType.value}', can only have a single child component.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasNonSingleChild(node: ts.EtsComponentExpression, allComponentNames: Set<string>,
  isCheckType: ParamType): boolean {
  const nodeName: ts.Identifier = node.expression as ts.Identifier;
  const BlockNode: ts.Block = getNextNode(node);
  if (SINGLE_CHILD_COMPONENT.has(nodeName.escapedText.toString()) || !judgeComponentType(nodeName, node, isCheckType) &&
    isCheckType.value === COMPONENT_BUTTON) {
    if (!BlockNode) {
      return false;
    }
    if (BlockNode && BlockNode.statements) {
      const length: number = BlockNode.statements.length;
      if (!length) {
        return false;
      }
      if (length > 3) {
        return true;
      }
      const childCount: number = getBlockChildrenCount(BlockNode, allComponentNames);
      if (childCount > 1) {
        return true;
      }
    }
  }
  return false;
}

function getBlockChildrenCount(blockNode: ts.Block, allComponentNames: Set<string>): number {
  let maxCount: number = 0;
  const length: number = blockNode.statements.length;
  for (let i = 0; i < length; ++i) {
    const item: ts.Node = blockNode.statements[i];
    if (ts.isExpressionStatement(item) && ts.isCallExpression(item.expression) &&
      isForEachComponent(item.expression)) {
      maxCount += 2;
    }
    if (ts.isIfStatement(item)) {
      maxCount += getIfChildrenCount(item, allComponentNames);
    }
    if (ts.isExpressionStatement(item) && ts.isEtsComponentExpression(item.expression)) {
      maxCount += 1;
    }
    if (ts.isExpressionStatement(item) && ts.isCallExpression(item.expression)) {
      let newNode: any = item.expression;
      while (newNode.expression) {
        if (ts.isEtsComponentExpression(newNode) || ts.isCallExpression(newNode) &&
          isComponent(newNode, allComponentNames)) {
          maxCount += 1;
        }
        newNode = newNode.expression;
      }
    }
    if (maxCount > 1) {
      break;
    }
  }
  return maxCount;
}

function isComponent(node: ts.EtsComponentExpression | ts.CallExpression, allComponentNames: Set<string>): boolean {
  if (ts.isIdentifier(node.expression) &&
    allComponentNames.has(node.expression.escapedText.toString())) {
    return true;
  }
  return false;
}

function isForEachComponent(node: ts.EtsComponentExpression | ts.CallExpression): boolean {
  if (ts.isIdentifier(node.expression)) {
    const componentName: string = node.expression.escapedText.toString();
    return componentName === COMPONENT_FOREACH || componentName === COMPONENT_LAZYFOREACH;
  }
  return false;
}

function getIfChildrenCount(ifNode: ts.IfStatement, allComponentNames: Set<string>): number {
  const maxCount: number =
    Math.max(getStatementCount(ifNode.thenStatement, allComponentNames),
      getStatementCount(ifNode.elseStatement, allComponentNames));
  return maxCount;
}

function getStatementCount(node: ts.Node, allComponentNames: Set<string>): number {
  let maxCount: number = 0;
  if (!node) {
    return maxCount;
  } else if (ts.isBlock(node)) {
    maxCount = getBlockChildrenCount(node, allComponentNames);
  } else if (ts.isIfStatement(node)) {
    maxCount = getIfChildrenCount(node, allComponentNames);
  } else if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    isForEachComponent(node.expression)) {
    maxCount = 2;
  } else if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    !isForEachComponent(node.expression) && isComponent(node.expression, allComponentNames)) {
    maxCount = 1;
  }
  return maxCount;
}

function checkSpecificChildComponent(node: ts.EtsComponentExpression, allComponentNames: Set<string>,
  sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  if (hasNonspecificChild(node, allComponentNames)) {
    const componentName: string = (node.expression as ts.Identifier).escapedText.toString();
    const pos: number = node.expression.getStart();
    const specificChildArray: string =
      Array.from(SPECIFIC_CHILD_COMPONENT.get(componentName)).join(' and ');
    const message: string =
      `The component '${componentName}' can only have the child component ${specificChildArray}.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasNonspecificChild(node: ts.EtsComponentExpression,
  allComponentNames: Set<string>): boolean {
  const nodeName: ts.Identifier = node.expression as ts.Identifier;
  const nodeNameString: string = nodeName.escapedText.toString();
  const blockNode: ts.Block = getNextNode(node);
  let isNonspecific: boolean = false;
  if (SPECIFIC_CHILD_COMPONENT.has(nodeNameString) && blockNode) {
    const specificChildSet: Set<string> = SPECIFIC_CHILD_COMPONENT.get(nodeNameString);
    isNonspecific = isNonspecificChildBlock(blockNode, specificChildSet, allComponentNames);
    if (isNonspecific) {
      return isNonspecific;
    }
  }
  return isNonspecific;
}

function isNonspecificChildBlock(blockNode: ts.Block, specificChildSet: Set<string>,
  allComponentNames: Set<string>): boolean {
  if (blockNode.statements) {
    const length: number = blockNode.statements.length;
    for (let i = 0; i < length; ++i) {
      const item: ts.Node = blockNode.statements[i];
      if (ts.isIfStatement(item) && isNonspecificChildIf(item, specificChildSet, allComponentNames)) {
        return true;
      }
      if (ts.isExpressionStatement(item) && ts.isCallExpression(item.expression) &&
        isForEachComponent(item.expression) &&
        isNonspecificChildForEach(item.expression, specificChildSet, allComponentNames)) {
        return true;
      }
      if (ts.isBlock(item) && isNonspecificChildBlock(item, specificChildSet, allComponentNames)) {
        return true;
      }
      if (ts.isExpressionStatement(item)) {
        let newNode: any = item.expression;
        while (newNode.expression) {
          if (ts.isEtsComponentExpression(newNode) && ts.isIdentifier(newNode.expression) &&
          !isForEachComponent(newNode) && isComponent(newNode, allComponentNames)) {
            const isNonspecific: boolean =
            isNonspecificChildNonForEach(newNode, specificChildSet);
            if (isNonspecific) {
              return isNonspecific;
            }
            if (i + 1 < length && ts.isBlock(blockNode.statements[i + 1])) {
              ++i;
            }
          }
          newNode = newNode.expression;
        }
      }
    }
  }
  return false;
}

function isNonspecificChildIf(node: ts.IfStatement, specificChildSet: Set<string>,
  allComponentNames: Set<string>): boolean {
  return isNonspecificChildIfStatement(node.thenStatement, specificChildSet, allComponentNames) ||
    isNonspecificChildIfStatement(node.elseStatement, specificChildSet, allComponentNames);
}

function isNonspecificChildForEach(node: ts.EtsComponentExpression, specificChildSet: Set<string>,
  allComponentNames: Set<string>): boolean {
  if (ts.isCallExpression(node) && node.arguments &&
    node.arguments.length > 1 && ts.isArrowFunction(node.arguments[1])) {
    const arrowFunction: ts.ArrowFunction = node.arguments[1] as ts.ArrowFunction;
    const body: ts.Block | ts.EtsComponentExpression | ts.IfStatement =
      arrowFunction.body as ts.Block | ts.EtsComponentExpression | ts.IfStatement;
    if (!body) {
      return false;
    }
    if (ts.isBlock(body) && isNonspecificChildBlock(body, specificChildSet, allComponentNames)) {
      return true;
    }
    if (ts.isIfStatement(body) && isNonspecificChildIf(body, specificChildSet, allComponentNames)) {
      return true;
    }
    if (ts.isCallExpression(body) && isForEachComponent(body) &&
      isNonspecificChildForEach(body, specificChildSet, allComponentNames)) {
      return true;
    }
    if (ts.isEtsComponentExpression(body) && !isForEachComponent(body) &&
      isComponent(body, allComponentNames) &&
      isNonspecificChildNonForEach(body, specificChildSet)) {
      return true;
    }
  }
  return false;
}

function isNonspecificChildNonForEach(node: ts.EtsComponentExpression,
  specificChildSet: Set<string>): boolean {
  if (ts.isIdentifier(node.expression) &&
    !specificChildSet.has(node.expression.escapedText.toString())) {
    return true;
  }
  return false;
}

function isNonspecificChildIfStatement(node: ts.Node, specificChildSet: Set<string>,
  allComponentNames: Set<string>): boolean {
  if (!node) {
    return false;
  }
  if (ts.isBlock(node) && isNonspecificChildBlock(node, specificChildSet, allComponentNames)) {
    return true;
  }
  if (ts.isIfStatement(node) && isNonspecificChildIf(node, specificChildSet, allComponentNames)) {
    return true;
  }
  if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    isForEachComponent(node.expression) &&
    isNonspecificChildForEach(node.expression, specificChildSet, allComponentNames)) {
    return true;
  }
  if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    !isForEachComponent(node.expression) && isComponent(node.expression, allComponentNames) &&
    isNonspecificChildNonForEach(node.expression, specificChildSet)) {
    return true;
  }
  return false;
}

function collectComponentProps(node: ts.StructDeclaration, judgeInitializeInEntry: boolean): void {
  const componentName: string = node.name.getText();
  const componentSet: IComponentSet = getComponentSet(node, judgeInitializeInEntry, true);
  propertyCollection.set(componentName, componentSet.properties);
  stateCollection.set(componentName, componentSet.states);
  linkCollection.set(componentName, componentSet.links);
  propCollection.set(componentName, componentSet.props);
  regularCollection.set(componentName, componentSet.regulars);
  storagePropCollection.set(componentName, componentSet.storageProps);
  storageLinkCollection.set(componentName, componentSet.storageLinks);
  provideCollection.set(componentName, componentSet.provides);
  consumeCollection.set(componentName, componentSet.consumes);
  objectLinkCollection.set(componentName, componentSet.objectLinks);
  localStorageLinkCollection.set(componentName, componentSet.localStorageLink);
  localStoragePropCollection.set(componentName, componentSet.localStorageProp);
  builderParamObjectCollection.set(componentName, componentSet.builderParams);
  builderParamInitialization.set(componentName, componentSet.builderParamData);
  propInitialization.set(componentName, componentSet.propData);
  regularInitialization.set(componentName, componentSet.regularInit);
  stateInitialization.set(componentName, componentSet.stateInit);
  provideInitialization.set(componentName, componentSet.provideInit);
  privateCollection.set(componentName, componentSet.privateCollection);
}

export function getComponentSet(node: ts.StructDeclaration, judgeInitializeInEntry: boolean,
  uiCheck: boolean = false): IComponentSet {
  const componentSet: IComponentSet = new IComponentSet();
  traversalComponentProps(node, judgeInitializeInEntry, componentSet, uiCheck);
  return componentSet;
}

class RecordRequire {
  hasRequire: boolean = false;
  hasProp: boolean = false;
  hasBuilderParam: boolean = false;
  hasRegular: boolean = false;
  hasState: boolean = false;
  hasProvide: boolean = false;
}

function traversalComponentProps(node: ts.StructDeclaration, judgeInitializeInEntry: boolean,
  componentSet: IComponentSet, uiCheck: boolean = false): void {
  let isStatic: boolean = true;
  if (node.members) {
    const currentMethodCollection: Set<string> = new Set();
    node.members.forEach(item => {
      if (ts.isPropertyDeclaration(item) && ts.isIdentifier(item.name)) {
        const propertyName: string = item.name.getText();
        componentSet.properties.add(propertyName);
        const decorators: readonly ts.Decorator[] = ts.getAllDecorators(item);
        const accessQualifierResult: AccessQualifierResult = getAccessQualifier(item, uiCheck);
        if (!decorators || !decorators.length) {
          componentSet.regulars.add(propertyName);
          setPrivateCollection(componentSet, accessQualifierResult, propertyName, COMPONENT_NON_DECORATOR);
        } else {
          isStatic = false;
          let hasValidatePrivate: boolean = false;
          const recordRequire: RecordRequire = new RecordRequire();
          for (let i = 0; i < decorators.length; i++) {
            const decoratorName: string = decorators[i].getText().replace(/\(.*\)$/, '').trim();
            if (INNER_COMPONENT_MEMBER_DECORATORS.has(decoratorName)) {
              dollarCollection.add('$' + propertyName);
              collectionStates(decorators[i], judgeInitializeInEntry, decoratorName, propertyName,
                componentSet, recordRequire);
              setPrivateCollection(componentSet, accessQualifierResult, propertyName, decoratorName);
              validateAccessQualifier(item, propertyName, decoratorName, accessQualifierResult,
                recordRequire, uiCheck, hasValidatePrivate);
              hasValidatePrivate = true;
            }
          }
          regularAndRequire(decorators, componentSet, recordRequire, propertyName, accessQualifierResult);
          checkRequire(propertyName, componentSet, recordRequire);
        }
      }
      if (ts.isMethodDeclaration(item) && item.name && ts.isIdentifier(item.name)) {
        validateStateVariable(item);
        currentMethodCollection.add(item.name.getText());
      }
    });
    classMethodCollection.set(node.name.getText(), currentMethodCollection);
  }
  isStaticViewCollection.set(node.name.getText(), isStatic);
}

const FORBIDDEN_PUBLIC_ACCESS: string[] = [COMPONENT_STORAGE_PROP_DECORATOR,
  COMPONENT_STORAGE_LINK_DECORATOR, COMPONENT_LOCAL_STORAGE_LINK_DECORATOR,
  COMPONENT_LOCAL_STORAGE_PROP_DECORATOR, COMPONENT_CONSUME_DECORATOR
];
const FORBIDDEN_PRIVATE_ACCESS: string[] = [COMPONENT_LINK_DECORATOR, COMPONENT_OBJECT_LINK_DECORATOR];

function validateAccessQualifier(node: ts.PropertyDeclaration, propertyName: string,
  decoratorName: string, accessQualifierResult: AccessQualifierResult,
  recordRequire: RecordRequire, uiCheck: boolean = false, hasValidatePrivate: boolean): void {
  if (uiCheck) {
    if (accessQualifierResult.hasPublic && FORBIDDEN_PUBLIC_ACCESS.includes(decoratorName)) {
      transformLog.errors.push({
        type: LogType.WARN,
        message: `Property '${propertyName}' can not be decorated with both ${decoratorName} and public.`,
        pos: node.getStart()
      });
    }
    if (accessQualifierResult.hasPrivate) {
      if (FORBIDDEN_PRIVATE_ACCESS.includes(decoratorName)) {
        transformLog.errors.push({
          type: LogType.WARN,
          message: `Property '${propertyName}' can not be decorated with both ${decoratorName} and private.`,
          pos: node.getStart()
        });
      }
      if (recordRequire.hasRequire && !hasValidatePrivate) {
        transformLog.errors.push({
          type: LogType.WARN,
          message: `Property '${propertyName}' can not be decorated with both @Require and private.`,
          pos: node.getStart()
        });
      }
    }
  }
}

const SUPPORT_PRIVATE_PROPS: string[] = [COMPONENT_NON_DECORATOR, COMPONENT_STATE_DECORATOR,
  COMPONENT_PROP_DECORATOR, COMPONENT_PROVIDE_DECORATOR, COMPONENT_BUILDERPARAM_DECORATOR
];

function setPrivateCollection(componentSet: IComponentSet, accessQualifierResult: AccessQualifierResult,
  propertyName: string, decoratorName: string): void {
  if (accessQualifierResult.hasPrivate && SUPPORT_PRIVATE_PROPS.includes(decoratorName)) {
    componentSet.privateCollection.add(propertyName);
  }
}

class AccessQualifierResult {
  hasPrivate: boolean = false;
  hasPublic: boolean = false;
}

function getAccessQualifier(node: ts.PropertyDeclaration, uiCheck: boolean = false): AccessQualifierResult {
  const modifiers: readonly ts.Modifier[] = ts.getModifiers(node);
  const accessQualifierResult: AccessQualifierResult = new AccessQualifierResult();
  if (modifiers && modifiers.length) {
    modifiers.forEach((item) => {
      if (item.kind === ts.SyntaxKind.PrivateKeyword) {
        accessQualifierResult.hasPrivate = true;
      }
      if (item.kind === ts.SyntaxKind.PublicKeyword) {
        accessQualifierResult.hasPublic = true;
      }
      if (uiCheck && item.kind === ts.SyntaxKind.ProtectedKeyword) {
        transformLog.errors.push({
          type: LogType.WARN,
          message: `The member attributes of a struct can not be protected.`,
          pos: node.getStart()
        });
      }
    });
  }
  return accessQualifierResult;
}

function regularAndRequire(decorators: readonly ts.Decorator[], componentSet: IComponentSet,
  recordRequire: RecordRequire, propertyName: string, accessQualifierResult: AccessQualifierResult): void {
  if (decorators && decorators.length === 1 && decorators[0].getText() === COMPONENT_REQUIRE_DECORATOR) {
    componentSet.regulars.add(propertyName);
    recordRequire.hasRegular = true;
    setPrivateCollection(componentSet, accessQualifierResult, propertyName, COMPONENT_NON_DECORATOR);
  }
}

function checkRequire(name: string, componentSet: IComponentSet, recordRequire: RecordRequire): void {
  if (recordRequire.hasRequire) {
    setInitValue('hasProp', 'propData', name, componentSet, recordRequire);
    setInitValue('hasBuilderParam', 'builderParamData', name, componentSet, recordRequire);
    setInitValue('hasRegular', 'regularInit', name, componentSet, recordRequire);
    setInitValue('hasState', 'stateInit', name, componentSet, recordRequire);
    setInitValue('hasProvide', 'provideInit', name, componentSet, recordRequire);
  }
}

function setInitValue(requirekey: string, initKey: string, name: string, componentSet: IComponentSet,
  recordRequire: RecordRequire): void {
  if (recordRequire[requirekey]) {
    componentSet[initKey].add(name);
  }
}

function collectionStates(node: ts.Decorator, judgeInitializeInEntry: boolean, decorator: string, name: string,
  componentSet: IComponentSet, recordRequire: RecordRequire): void {
  switch (decorator) {
    case COMPONENT_STATE_DECORATOR:
      componentSet.states.add(name);
      recordRequire.hasState = true;
      break;
    case COMPONENT_LINK_DECORATOR:
      componentSet.links.add(name);
      break;
    case COMPONENT_PROP_DECORATOR:
      recordRequire.hasProp = true;
      componentSet.props.add(name);
      break;
    case COMPONENT_STORAGE_PROP_DECORATOR:
      componentSet.storageProps.add(name);
      break;
    case COMPONENT_STORAGE_LINK_DECORATOR:
      componentSet.storageLinks.add(name);
      break;
    case COMPONENT_PROVIDE_DECORATOR:
      recordRequire.hasProvide = true;
      componentSet.provides.add(name);
      break;
    case COMPONENT_CONSUME_DECORATOR:
      componentSet.consumes.add(name);
      break;
    case COMPONENT_OBJECT_LINK_DECORATOR:
      componentSet.objectLinks.add(name);
      break;
    case COMPONENT_BUILDERPARAM_DECORATOR:
      if (judgeInitializeInEntry) {
        validateInitializeInEntry(node, name);
      }
      recordRequire.hasBuilderParam = true;
      componentSet.builderParams.add(name);
      break;
    case COMPONENT_LOCAL_STORAGE_LINK_DECORATOR :
      collectionlocalStorageParam(node, name, componentSet.localStorageLink);
      break;
    case COMPONENT_LOCAL_STORAGE_PROP_DECORATOR:
      collectionlocalStorageParam(node, name, componentSet.localStorageProp);
      break;
    case COMPONENT_REQUIRE_DECORATOR:
      recordRequire.hasRequire = true;
      break;
  }
}

function validateInitializeInEntry(node: ts.Decorator, name: string): void {
  transformLog.errors.push({
    type: LogType.WARN,
    message: `'${name}' should be initialized in @Entry Component`,
    pos: node.getStart()
  });
}

function collectionlocalStorageParam(node: ts.Decorator, name: string,
  localStorage: Map<string, Set<string>>): void {
  const localStorageParam: Set<string> = new Set();
  if (node && ts.isCallExpression(node.expression) && node.expression.arguments &&
    node.expression.arguments.length) {
    localStorage.set(name, localStorageParam.add(
      node.expression.arguments[0].getText()));
  }
}

export interface ReplaceResult {
  content: string,
  log: LogInfo[]
}

export function sourceReplace(source: string, sourcePath: string): ReplaceResult {
  let content: string = source;
  const log: LogInfo[] = [];
  content = preprocessExtend(content);
  content = preprocessNewExtend(content);
  // process @system.
  content = processSystemApi(content, false, sourcePath);
  CollectImportNames(content, sourcePath);

  return {
    content: content,
    log: log
  };
}

export function preprocessExtend(content: string, extendCollection?: Set<string>): string {
  const REG_EXTEND: RegExp = /@Extend(\s+)([^\.\s]+)\.([^\(]+)\(/gm;
  return content.replace(REG_EXTEND, (item, item1, item2, item3) => {
    collectExtend(EXTEND_ATTRIBUTE, item2, '__' + item2 + '__' + item3);
    collectExtend(EXTEND_ATTRIBUTE, item2, item3);
    if (extendCollection) {
      extendCollection.add(item3);
    }
    return `@Extend(${item2})${item1}function __${item2}__${item3}(`;
  });
}

export function preprocessNewExtend(content: string, extendCollection?: Set<string>): string {
  const REG_EXTEND: RegExp = /@Extend\s*\([^\)]+\)\s*function\s+([^\(\s]+)\s*\(/gm;
  return content.replace(REG_EXTEND, (item, item1) => {
    if (extendCollection) {
      extendCollection.add(item1);
    }
    return item;
  });
}

function replaceSystemApi(item: string, systemValue: string, moduleType: string, systemKey: string): string {
  // if change format, please update regexp in transformModuleSpecifier
  if (NATIVE_MODULE.has(`${moduleType}.${systemKey}`)) {
    item = `var ${systemValue} = globalThis.requireNativeModule('${moduleType}.${systemKey}')`;
  } else if (moduleType === SYSTEM_PLUGIN || moduleType === OHOS_PLUGIN) {
    item = `var ${systemValue} = globalThis.requireNapi('${systemKey}')`;
  }
  return item;
}

function replaceLibSo(importValue: string, libSoKey: string, sourcePath: string = null): string {
  if (sourcePath) {
    useOSFiles.add(sourcePath);
  }
  // if change format, please update regexp in transformModuleSpecifier
  return projectConfig.bundleName && projectConfig.moduleName ?
    `var ${importValue} = globalThis.requireNapi("${libSoKey}", true, "${projectConfig.bundleName}/${projectConfig.moduleName}");` :
    `var ${importValue} = globalThis.requireNapi("${libSoKey}", true);`;
}

export function processSystemApi(content: string, isProcessAllowList: boolean = false,
  sourcePath: string = null, isSystemModule: boolean = false): string {
  if (isProcessAllowList && projectConfig.compileMode === ESMODULE) {
    // remove the unused system api import decl like following when compile as [esmodule]
    // in the result_process phase
    // e.g. import "@ohos.application.xxx"
    const REG_UNUSED_SYSTEM_IMPORT: RegExp = /import(?:\s*)['"]@(system|ohos)\.(\S+)['"]/g;
    content = content.replace(REG_UNUSED_SYSTEM_IMPORT, '');
  }

  const REG_IMPORT_DECL: RegExp = isProcessAllowList ? projectConfig.compileMode === ESMODULE ?
    /import\s+(.+)\s+from\s+['"]@(system|ohos)\.(\S+)['"]/g :
    /(import|const)\s+(.+)\s*=\s*(\_\_importDefault\()?require\(\s*['"]@(system|ohos)\.(\S+)['"]\s*\)(\))?/g :
    /(import|export)\s+(?:(.+)|\{([\s\S]+)\})\s+from\s+['"](\S+)['"]|import\s+(.+)\s*=\s*require\(\s*['"](\S+)['"]\s*\)/g;

  const systemValueCollection: Set<string> = new Set();
  const processedContent: string = content.replace(REG_IMPORT_DECL, (item, item1, item2, item3, item4, item5, item6) => {
    const importValue: string = isProcessAllowList ? projectConfig.compileMode === ESMODULE ? item1 : item2 : item2 || item5;

    if (isProcessAllowList) {
      systemValueCollection.add(importValue);
      if (projectConfig.compileMode !== ESMODULE) {
        collectSourcemapNames(sourcePath, importValue, item5);
        return replaceSystemApi(item, importValue, item4, item5);
      }
      collectSourcemapNames(sourcePath, importValue, item3);
      return replaceSystemApi(item, importValue, item2, item3);
    }

    const moduleRequest: string = item4 || item6;
    if (/^@(system|ohos)\./.test(moduleRequest)) { // ohos/system.api
      // ets & ts file need compile with .d.ts, so do not replace at the phase of pre_process
      if (!isSystemModule) {
        return item;
      }
      const result: RegExpMatchArray = moduleRequest.match(/^@(system|ohos)\.(\S+)$/);
      const moduleType: string = result[1];
      const apiName: string = result[2];
      return replaceSystemApi(item, importValue, moduleType, apiName);
    } else if (/^lib(\S+)\.so$/.test(moduleRequest)) { // libxxx.so
      const result: RegExpMatchArray = moduleRequest.match(/^lib(\S+)\.so$/);
      const libSoKey: string = result[1];
      return replaceLibSo(importValue, libSoKey, sourcePath);
    }
    return item;
  });
  return processInnerModule(processedContent, systemValueCollection);
}

function collectSourcemapNames(sourcePath: string, changedName: string, originalName: string): void {
  if (sourcePath == null) {
    return;
  }
  const cleanSourcePath: string = sourcePath.replace('.ets', '.js').replace('.ts', '.js');
  if (!sourcemapNamesCollection.has(cleanSourcePath)) {
    return;
  }

  const map: Map<string, string> = sourcemapNamesCollection.get(cleanSourcePath);
  if (map.has(changedName)) {
    return;
  }

  for (const entry of originalImportNamesMap.entries()) {
    const key: string = entry[0];
    const value: string = entry[1];
    if (value === '@ohos.' + originalName || value === '@system.' + originalName) {
      map.set(changedName.trim(), key);
      sourcemapNamesCollection.set(cleanSourcePath, map);
      originalImportNamesMap.delete(key);
      break;
    }
  }
}

export function CollectImportNames(content: string, sourcePath: string = null): void {
  const REG_IMPORT_DECL: RegExp =
    /(import|export)\s+(.+)\s+from\s+['"](\S+)['"]|import\s+(.+)\s*=\s*require\(\s*['"](\S+)['"]\s*\)/g;

  const decls: string[] = content.match(REG_IMPORT_DECL);
  if (decls != undefined) {
    decls.forEach(decl => {
      const parts: string[] = decl.split(' ');
      if (parts.length === 4 && parts[0] === 'import' && parts[2] === 'from' && !parts[3].includes('.so')) {
        originalImportNamesMap.set(parts[1], parts[3].replace(/'/g, ''));
      }
    });
  }

  if (sourcePath && sourcePath != null) {
    const cleanSourcePath: string = sourcePath.replace('.ets', '.js').replace('.ts', '.js');
    if (!sourcemapNamesCollection.has(cleanSourcePath)) {
      sourcemapNamesCollection.set(cleanSourcePath, new Map());
    }
  }
}

function processInnerModule(content: string, systemValueCollection: Set<string>): string {
  systemValueCollection.forEach(element => {
    const target: string = element.trim() + '.default';
    while (content.includes(target)) {
      content = content.replace(target, element.trim());
    }
  });
  return content;
}

export function resetComponentCollection() {
  componentCollection.entryComponent = null;
  componentCollection.entryComponentPos = null;
  componentCollection.previewComponent = new Array();
  stateObjectCollection.clear();
  builderParamInitialization.clear();
  propInitialization.clear();
  propCollection.clear();
  objectLinkCollection.clear();
  linkCollection.clear();
  regularInitialization.clear();
  stateInitialization.clear();
  provideInitialization.clear();
  privateCollection.clear();
}

function checkEntryComponent(node: ts.StructDeclaration, log: LogInfo[], sourceFile: ts.SourceFile): void {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  if (modifiers) {
    for (let i = 0; i < modifiers.length; i++) {
      if (modifiers[i].kind === ts.SyntaxKind.ExportKeyword) {
        const message: string = `It's not a recommended way to export struct with @Entry decorator, ` +
          `which may cause ACE Engine error in component preview mode.`;
        addLog(LogType.WARN, message, node.getStart(), log, sourceFile);
        break;
      }
    }
  }
}

function validateStateVariable(node: ts.MethodDeclaration): void {
  const decorators: readonly ts.Decorator[] = ts.getAllDecorators(node);
  if (decorators && decorators.length) {
    for (let i = 0; i < decorators.length; i++) {
      const decoratorName: string = decorators[i].getText().replace(/\(.*\)$/, '').trim();
      if (CARD_ENABLE_DECORATORS[decoratorName]) {
        validatorCard(transformLog.errors, CARD_LOG_TYPE_DECORATORS,
          decorators[i].getStart(), decoratorName);
      }
      if (INNER_COMPONENT_MEMBER_DECORATORS.has(decoratorName)) {
        transformLog.errors.push({
          type: LogType.ERROR,
          message: `'${decorators[i].getText()}' can not decorate the method.`,
          pos: decorators[i].getStart()
        });
      }
    }
  }
}

export function getObservedPropertyCollection(className: string): Set<string> {
  const observedProperthCollection: Set<string> = new Set([
    ...stateCollection.get(className),
    ...linkCollection.get(className),
    ...propCollection.get(className),
    ...storageLinkCollection.get(className),
    ...storageLinkCollection.get(className),
    ...provideCollection.get(className),
    ...consumeCollection.get(className),
    ...objectLinkCollection.get(className)
  ]);
  getLocalStorageCollection(className, observedProperthCollection);
  return observedProperthCollection;
}

export function getLocalStorageCollection(componentName: string, collection: Set<string>): void {
  if (localStorageLinkCollection.get(componentName)) {
    for (const key of localStorageLinkCollection.get(componentName).keys()) {
      collection.add(key);
    }
  }
  if (localStoragePropCollection.get(componentName)) {
    for (const key of localStoragePropCollection.get(componentName).keys()) {
      collection.add(key);
    }
  }
}

export function resetValidateUiSyntax(): void {
  observedClassCollection.clear();
  enumCollection.clear();
  classMethodCollection.clear();
  dollarCollection.clear();
  stateCollection.clear();
  regularCollection.clear();
  storagePropCollection.clear();
  storageLinkCollection.clear();
  provideCollection.clear();
  consumeCollection.clear();
  builderParamObjectCollection.clear();
  localStorageLinkCollection.clear();
  localStoragePropCollection.clear();
  isStaticViewCollection.clear();
  useOSFiles.clear();
  sourcemapNamesCollection.clear();
  originalImportNamesMap.clear();
}
