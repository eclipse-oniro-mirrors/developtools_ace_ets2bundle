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
  STYLES,
  VALIDATE_MODULE,
  COMPONENT_BUILDER_DECORATOR,
  COMPONENT_BUILDERPARAM_DECORATOR
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
  CUSTOM_BUILDER_METHOD
} from './component_map';
import {
  LogType,
  LogInfo,
  componentInfo,
  addLog,
  hasDecorator
} from './utils';
import { projectConfig } from '../main';
import { 
  collectExtend, 
  isExtendFunction, 
  transformLog 
} from './process_ui_syntax';
import { importModuleCollection } from './ets_checker';
import { builderParamObjectCollection } from './process_component_member';

export interface ComponentCollection {
  localStorageName: string;
  entryComponentPos: number;
  entryComponent: string;
  previewComponent: Set<string>;
  customDialogs: Set<string>;
  customComponents: Set<string>;
  currentClassName: string;
}

export interface IComponentSet {
  properties: Set<string>;
  regulars: Set<string>;
  states: Set<string>;
  links: Set<string>;
  props: Set<string>;
  storageProps: Set<string>;
  storageLinks: Set<string>;
  provides: Set<string>;
  consumes: Set<string>;
  objectLinks: Set<string>;
  localStorageLink: Map<string, Set<string>>;
  localStorageProp: Map<string, Set<string>>;
  builderParams: Set<string>;
}

export const componentCollection: ComponentCollection = {
  localStorageName: null,
  entryComponentPos: null,
  entryComponent: null,
  previewComponent: new Set([]),
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
export const localStorageLinkCollection: Map<string, Map<string, Set<string>>> = new Map();
export const localStoragePropCollection: Map<string, Map<string, Set<string>>> = new Map();

export const isStaticViewCollection: Map<string, boolean> = new Map();

export const moduleCollection: Set<string> = new Set();
export const useOSFiles: Set<string> = new Set();

export function validateUISyntax(source: string, content: string, filePath: string,
  fileQuery: string): LogInfo[] {
  let log: LogInfo[] = [];
  if (path.basename(filePath) !== 'app.ets') {
    const res: LogInfo[] = checkComponentDecorator(source, filePath, fileQuery);
    if (res) {
      log = log.concat(res);
    }
    const allComponentNames: Set<string> =
      new Set([...INNER_COMPONENT_NAMES, ...componentCollection.customComponents]);
    checkUISyntax(filePath, allComponentNames, content, log);
    componentCollection.customComponents.forEach(item => componentInfo.componentNames.add(item));
  }

  return log;
}

function checkComponentDecorator(source: string, filePath: string,
  fileQuery: string): LogInfo[] | null {
  const log: LogInfo[] = [];
  const sourceFile: ts.SourceFile = ts.createSourceFile(filePath, source,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS);
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
          if (item.decorators && item.decorators.length) {
            checkDecorators(item.decorators, result, item.name, log, sourceFile, item);
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
        const decorators: ts.NodeArray<ts.Decorator> = item.decorators;
        for (let i = 0; i < decorators.length; i++) {
          if (decorators[i] && /struct/.test(decorators[i].getText())) {
            const message: string = `Please use a valid decorator.`;
            addLog(LogType.ERROR, message, item.getStart(), log, sourceFile);
            break;
          }
        }
      }
      if (ts.isFunctionDeclaration(item) && item.decorators && item.decorators.length === 1 &&
        item.decorators[0].expression && item.decorators[0].expression.getText() === STYLES) {
        if (ts.isBlock(item.body) && item.body.statements && item.body.statements.length) {
          STYLES_ATTRIBUTE.add(item.name.getText());
          GLOBAL_STYLE_FUNCTION.set(item.name.getText(), item.body);
          BUILDIN_STYLE_NAMES.add(item.name.getText());
        }
      }
    });
    validateEntryAndPreviewCount(result, fileQuery, sourceFile.fileName, projectConfig.isPreview,
      !!projectConfig.checkEntry, log);
  }

  return log.length ? log : null;
}

function validateEntryAndPreviewCount(result: DecoratorResult, fileQuery: string,
  fileName: string, isPreview: boolean, checkEntry: boolean, log: LogInfo[]): void {
  if (result.previewCount > 10 && fileQuery === '?entry') {
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
      message: `A page which is being previewed must have one and only one '@Entry' `
        + `decorator, or at least one '@Preview' decorator.`,
      fileName: fileName
    });
  } else if ((!isPreview || isPreview && checkEntry) && result.entryCount !== 1 && fileQuery === '?entry') {
    log.push({
      type: LogType.ERROR,
      message: `A page configured in '${projectConfig.pagesJsonFileName}' must have one and only one '@Entry' `
        + `decorator.`,
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
  if (ts.isClassDeclaration(node) && hasDecorator(node, COMPONENT_DECORATOR_CUSTOM_DIALOG)) {
    return true;
  }
  return false;
}

interface DecoratorResult {
  entryCount: number;
  previewCount: number;
}

function checkDecorators(decorators: ts.NodeArray<ts.Decorator>, result: DecoratorResult,
  component: ts.Identifier, log: LogInfo[], sourceFile: ts.SourceFile, node: ts.StructDeclaration): void {
  let hasComponentDecorator: boolean = false;
  const componentName: string = component.getText();
  decorators.forEach((element) => {
    const name: string = element.getText().replace(/\([^\(\)]*\)/, '').trim();
    if (INNER_COMPONENT_DECORATORS.has(name)) {
      componentCollection.customComponents.add(componentName);
      switch (name) {
        case COMPONENT_DECORATOR_ENTRY:
          checkEntryComponent(node, log, sourceFile);
          result.entryCount++;
          componentCollection.entryComponent = componentName;
          collectLocalStorageName(element);
          break;
        case COMPONENT_DECORATOR_PREVIEW:
          result.previewCount++;
          componentCollection.previewComponent.add(componentName);
          break;
        case COMPONENT_DECORATOR_COMPONENT:
          hasComponentDecorator = true;
          break;
        case COMPONENT_DECORATOR_CUSTOM_DIALOG:
          componentCollection.customDialogs.add(componentName);
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

function collectLocalStorageName(node: ts.Decorator): void {
  if (node && node.expression && ts.isCallExpression(node.expression)) {
    componentCollection.entryComponentPos = node.expression.pos;
    if (node.expression.arguments && node.expression.arguments.length) {
      node.expression.arguments.forEach((item: ts.Node, index: number) => {
        if (ts.isIdentifier(item) && index === 0) {
          componentCollection.localStorageName = item.getText();
        }
      });
    }
  } else {
    componentCollection.localStorageName = null;
  }
}

function checkUISyntax(filePath: string, allComponentNames: Set<string>, content: string,
  log: LogInfo[]): void {
  const sourceFile: ts.SourceFile = ts.createSourceFile(filePath, content,
    ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS);
  visitAllNode(sourceFile, sourceFile, allComponentNames, log);
}

function visitAllNode(node: ts.Node, sourceFileNode: ts.SourceFile, allComponentNames: Set<string>,
  log: LogInfo[]) {
  checkAllNode(node, allComponentNames, sourceFileNode, log);
  if (ts.isStructDeclaration(node) && node.name && ts.isIdentifier(node.name)) {
    collectComponentProps(node);
  }
  if (ts.isMethodDeclaration(node) && hasDecorator(node, COMPONENT_BUILDER_DECORATOR)) {
    CUSTOM_BUILDER_METHOD.add(node.name.getText());
  }
  if (ts.isFunctionDeclaration(node) && isExtendFunction(node)) {
    const componentName: string = isExtendFunction(node);
    collectExtend(EXTEND_ATTRIBUTE, componentName, node.name.getText());
  }
  node.getChildren().forEach((item: ts.Node) => visitAllNode(item, sourceFileNode, allComponentNames, log));
}

function checkAllNode(node: ts.Node, allComponentNames: Set<string>, sourceFileNode: ts.SourceFile,
  log: LogInfo[]): void {
  if (ts.isExpressionStatement(node) && node.expression && ts.isIdentifier(node.expression) &&
    allComponentNames.has(node.expression.escapedText.toString())) {
    const pos: number = node.expression.getStart();
    const message: string =
      `The component name must be followed by parentheses, like '${node.expression.getText()}()'.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
  checkNoChildComponent(node, sourceFileNode, log);
  checkOneChildComponent(node, allComponentNames, sourceFileNode, log);
  checkSpecificChildComponent(node, allComponentNames, sourceFileNode, log);
}

function checkNoChildComponent(node: ts.Node, sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && hasChild(node)) {
    const componentName: string = node.expression.expression.escapedText.toString();
    const pos: number = node.expression.expression.getStart();
    const message: string = `The component '${componentName}' can't have any child.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasChild(node: ts.ExpressionStatement): boolean {
  const etsComponentExpression: ts.EtsComponentExpression = node.expression as ts.EtsComponentExpression;
  const nodeName: ts.Identifier = etsComponentExpression.expression as ts.Identifier;
  if (AUTOMIC_COMPONENT.has(nodeName.escapedText.toString()) && getNextNode(etsComponentExpression)) {
    return true;
  }
  return false;
}

function getNextNode(node: ts.EtsComponentExpression): ts.Block {
  if (node.body && ts.isBlock(node.body)) {
    const statementsArray: ts.Block = node.body;
    return statementsArray;
  }
}

function checkOneChildComponent(node: ts.Node, allComponentNames: Set<string>,
  sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  if (ts.isExpressionStatement(node) && ts.isEtsComponentExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && hasNonSingleChild(node, allComponentNames)) {
    const componentName: string = node.expression.expression.escapedText.toString();
    const pos: number = node.expression.expression.getStart();
    const message: string =
      `The component '${componentName}' can only have a single child component.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasNonSingleChild(node: ts.ExpressionStatement, allComponentNames: Set<string>): boolean {
  const etsComponentExpression: ts.EtsComponentExpression = node.expression as ts.EtsComponentExpression;
  const nodeName: ts.Identifier = etsComponentExpression.expression as ts.Identifier;
  const BlockNode: ts.Block = getNextNode(etsComponentExpression);
  if (SINGLE_CHILD_COMPONENT.has(nodeName.escapedText.toString())) {
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

function isComponent(node: ts.EtsComponentExpression, allComponentNames: Set<string>): boolean {
  if (ts.isIdentifier(node.expression) &&
    allComponentNames.has(node.expression.escapedText.toString())) {
    return true;
  }
  return false;
}

function isForEachComponent(node: ts.CallExpression): boolean {
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

function checkSpecificChildComponent(node: ts.Node, allComponentNames: Set<string>,
  sourceFileNode: ts.SourceFile, log: LogInfo[]): void {
  if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) && hasNonspecificChild(node, allComponentNames)) {
    const componentName: string = node.expression.expression.escapedText.toString();
    const pos: number = node.expression.expression.getStart();
    const specificChildArray: string =
      Array.from(SPECIFIC_CHILD_COMPONENT.get(componentName)).join(' and ');
    const message: string =
      `The component '${componentName}' can only have the child component ${specificChildArray}.`;
    addLog(LogType.ERROR, message, pos, log, sourceFileNode);
  }
}

function hasNonspecificChild(node: ts.ExpressionStatement,
  allComponentNames: Set<string>): boolean {
  const etsComponentExpression: ts.EtsComponentExpression = node.expression as ts.EtsComponentExpression;
  const nodeName: ts.Identifier = etsComponentExpression.expression as ts.Identifier;
  const nodeNameString: string = nodeName.escapedText.toString();
  const blockNode: ts.Block = getNextNode(etsComponentExpression);
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
      if (ts.isExpressionStatement(item) && ts.isEtsComponentExpression(item.expression) &&
        isForEachComponent(item.expression) &&
        isNonspecificChildForEach(item.expression, specificChildSet, allComponentNames)) {
        return true;
      }
      if (ts.isBlock(item) && isNonspecificChildBlock(item, specificChildSet, allComponentNames)) {
        return true;
      }
      if (ts.isExpressionStatement(item) && ts.isEtsComponentExpression(item.expression)) {
        let newNode: any = item.expression;
        while (newNode.expression) {
          if (ts.isEtsComponentExpression(newNode) && ts.isIdentifier(newNode.expression) &&
          !isForEachComponent(newNode) && isComponent(newNode, allComponentNames)) {
            const isNonspecific: boolean =
            isNonspecificChildNonForEach(item.expression, specificChildSet);
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
  if (ts.isEtsComponentExpression(node) && node.arguments &&
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

function collectComponentProps(node: ts.StructDeclaration): void {
  const componentName: string = node.name.getText();
  const ComponentSet: IComponentSet = getComponentSet(node);
  propertyCollection.set(componentName, ComponentSet.properties);
  stateCollection.set(componentName, ComponentSet.states);
  linkCollection.set(componentName, ComponentSet.links);
  propCollection.set(componentName, ComponentSet.props);
  regularCollection.set(componentName, ComponentSet.regulars);
  storagePropCollection.set(componentName, ComponentSet.storageProps);
  storageLinkCollection.set(componentName, ComponentSet.storageLinks);
  provideCollection.set(componentName, ComponentSet.provides);
  consumeCollection.set(componentName, ComponentSet.consumes);
  objectLinkCollection.set(componentName, ComponentSet.objectLinks);
  localStorageLinkCollection.set(componentName, ComponentSet.localStorageLink);
  localStoragePropCollection.set(componentName, ComponentSet.localStorageProp);
  builderParamObjectCollection.set(componentName, ComponentSet.builderParams);
}

export function getComponentSet(node: ts.StructDeclaration): IComponentSet {
  const properties: Set<string> = new Set();
  const states: Set<string> = new Set();
  const links: Set<string> = new Set();
  const props: Set<string> = new Set();
  const regulars: Set<string> = new Set();
  const storageProps: Set<string> = new Set();
  const storageLinks: Set<string> = new Set();
  const provides: Set<string> = new Set();
  const consumes: Set<string> = new Set();
  const objectLinks: Set<string> = new Set();
  const localStorageLink: Map<string, Set<string>> = new Map();
  const localStorageProp: Map<string, Set<string>> = new Map();
  const builderParams: Set<string> = new Set();
  traversalComponentProps(node, properties, regulars, states, links, props, storageProps,
    storageLinks, provides, consumes, objectLinks, localStorageLink, localStorageProp, builderParams);
  return {
    properties, regulars, states, links, props, storageProps, storageLinks, provides,
    consumes, objectLinks, localStorageLink, localStorageProp, builderParams
  };
}

function traversalComponentProps(node: ts.StructDeclaration, properties: Set<string>,
  regulars: Set<string>, states: Set<string>, links: Set<string>, props: Set<string>,
  storageProps: Set<string>, storageLinks: Set<string>, provides: Set<string>,
  consumes: Set<string>, objectLinks: Set<string>,
  localStorageLink: Map<string, Set<string>>, localStorageProp: Map<string, Set<string>>,
  builderParams: Set<string>): void {
  let isStatic: boolean = true;
  if (node.members) {
    const currentMethodCollection: Set<string> = new Set();
    node.members.forEach(item => {
      if (ts.isPropertyDeclaration(item) && ts.isIdentifier(item.name)) {
        const propertyName: string = item.name.getText();
        properties.add(propertyName);
        if (!item.decorators || !item.decorators.length) {
          regulars.add(propertyName);
        } else {
          isStatic = false;
          for (let i = 0; i < item.decorators.length; i++) {
            const decoratorName: string = item.decorators[i].getText().replace(/\(.*\)$/, '').trim();
            if (INNER_COMPONENT_MEMBER_DECORATORS.has(decoratorName)) {
              dollarCollection.add('$' + propertyName);
              collectionStates(item.decorators[i], decoratorName, propertyName, states, links, props, storageProps,
                storageLinks, provides, consumes, objectLinks, localStorageLink, localStorageProp, builderParams);
            }
          }
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

function collectionStates(node: ts.Decorator, decorator: string, name: string,
  states: Set<string>, links: Set<string>, props: Set<string>, storageProps: Set<string>,
  storageLinks: Set<string>, provides: Set<string>, consumes: Set<string>, objectLinks: Set<string>,
  localStorageLink: Map<string, Set<string>>, localStorageProp: Map<string, Set<string>>,
  builderParams: Set<string>): void {
  switch (decorator) {
    case COMPONENT_STATE_DECORATOR:
      states.add(name);
      break;
    case COMPONENT_LINK_DECORATOR:
      links.add(name);
      break;
    case COMPONENT_PROP_DECORATOR:
      props.add(name);
      break;
    case COMPONENT_STORAGE_PROP_DECORATOR:
      storageProps.add(name);
      break;
    case COMPONENT_STORAGE_LINK_DECORATOR:
      storageLinks.add(name);
      break;
    case COMPONENT_PROVIDE_DECORATOR:
      provides.add(name);
      break;
    case COMPONENT_CONSUME_DECORATOR:
      consumes.add(name);
      break;
    case COMPONENT_OBJECT_LINK_DECORATOR:
      objectLinks.add(name);
      break;
    case COMPONENT_BUILDERPARAM_DECORATOR:
      builderParams.add(name);
      break;
    case COMPONENT_LOCAL_STORAGE_LINK_DECORATOR :
      collectionlocalStorageParam(node, name, localStorageLink);
      break;
    case COMPONENT_LOCAL_STORAGE_PROP_DECORATOR:
      collectionlocalStorageParam(node, name, localStorageProp);
      break;
  }
}

function collectionlocalStorageParam(node: ts.Decorator, name: string,
  localStorage: Map<string, Set<string>>): void {
  const localStorageParam: Set<string> = new Set();
  if (node && ts.isCallExpression(node.expression) && node.expression.arguments &&
    node.expression.arguments.length && ts.isStringLiteral(node.expression.arguments[0])) {
    localStorage.set(name, localStorageParam.add(
      node.expression.arguments[0].getText().replace(/\"|'/g, '')));
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

export function processSystemApi(content: string, isProcessAllowList: boolean = false,
  sourcePath: string = null, isSystemModule: boolean = false): string {
  let REG_SYSTEM: RegExp;
  if (isProcessAllowList) {
    REG_SYSTEM =
      /(import|const)\s+(.+)\s*=\s*(\_\_importDefault\()?require\(\s*['"]@(system|ohos)\.(\S+)['"]\s*\)(\))?/g;
  } else {
    REG_SYSTEM =
      /import\s+(.+)\s+from\s+['"]@(system|ohos)\.(\S+)['"]|import\s+(.+)\s*=\s*require\(\s*['"]@(system|ohos)\.(\S+)['"]\s*\)/g;
  }
  const REG_LIB_SO: RegExp =
    /import\s+(.+)\s+from\s+['"]lib(\S+)\.so['"]|import\s+(.+)\s*=\s*require\(\s*['"]lib(\S+)\.so['"]\s*\)/g;
  const systemValueCollection: Set<string> = new Set();
  const newContent: string = content.replace(REG_LIB_SO, (_, item1, item2, item3, item4) => {
    const libSoValue: string = item1 || item3;
    const libSoKey: string = item2 || item4;
    if (sourcePath) {
      useOSFiles.add(sourcePath);
    }
    return `var ${libSoValue} = globalThis.requireNapi("${libSoKey}", true);`;
  }).replace(REG_SYSTEM, (item, item1, item2, item3, item4, item5, item6, item7) => {
    let moduleType: string = item2 || item5;
    let systemKey: string = item3 || item6;
    let systemValue: string = item1 || item4;
    if (!VALIDATE_MODULE.includes(systemValue)) {
      importModuleCollection.add(systemValue);
    }
    if (!isProcessAllowList && !isSystemModule) {
      return item;
    } else if (isProcessAllowList) {
      systemValue = item2;
      moduleType = item4;
      systemKey = item5;
      systemValueCollection.add(systemValue);
    }
    moduleCollection.add(`${moduleType}.${systemKey}`);
    if (NATIVE_MODULE.has(`${moduleType}.${systemKey}`)) {
      item = `var ${systemValue} = globalThis.requireNativeModule('${moduleType}.${systemKey}')`;
    } else if (moduleType === SYSTEM_PLUGIN) {
      item = `var ${systemValue} = isSystemplugin('${systemKey}', '${SYSTEM_PLUGIN}') ? ` +
          `globalThis.systemplugin.${systemKey} : globalThis.requireNapi('${systemKey}')`;
    } else if (moduleType === OHOS_PLUGIN) {
      item = `var ${systemValue} = globalThis.requireNapi('${systemKey}') || ` +
          `(isSystemplugin('${systemKey}', '${OHOS_PLUGIN}') ? ` +
          `globalThis.ohosplugin.${systemKey} : isSystemplugin('${systemKey}', '${SYSTEM_PLUGIN}') ` +
          `? globalThis.systemplugin.${systemKey} : undefined)`;
    }
    return item;
  });
  return processInnerModule(newContent, systemValueCollection);
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

function validateStateVariable(node: ts.MethodDeclaration): void {
  if (node.decorators && node.decorators.length) {
    for (let i = 0; i < node.decorators.length; i++) {
      const decoratorName: string = node.decorators[i].getText().replace(/\(.*\)$/,'').trim();
      if (INNER_COMPONENT_MEMBER_DECORATORS.has(decoratorName)) {
        transformLog.errors.push({
          type: LogType.ERROR,
          message: `'${node.decorators[i].getText()}' can not decorate the method.`,
          pos: node.decorators[i].getStart()
        });
      }
    }
  }
}

const VALIDATE_MODULE_REG: RegExp = new RegExp('^(' + VALIDATE_MODULE.join('|') + ')');
function validateAllowListModule(moduleType: string, systemKey: string): boolean {
  return moduleType === 'ohos' && VALIDATE_MODULE_REG.test(systemKey);
}

export function resetComponentCollection() {
  componentCollection.entryComponent = null;
  componentCollection.entryComponentPos = null;
  componentCollection.previewComponent = new Set([]);
}

function checkEntryComponent(node: ts.StructDeclaration, log: LogInfo[], sourceFile: ts.SourceFile): void {
  if (node.modifiers) {
    for (let i = 0; i < node.modifiers.length; i++) {
      if (node.modifiers[i].kind === ts.SyntaxKind.ExportKeyword) {
        const message: string = `It's not a recommended way to export struct with @Entry decorator, ` +
          `which may cause ACE Engine error in component preview mode.`;
        addLog(LogType.WARN, message, node.getStart(), log, sourceFile);
        break;
      }
    }
  }
}