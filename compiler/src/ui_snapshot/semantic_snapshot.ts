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
import type { UISyntaxSnapshot } from './syntax_snapshot';
import path from 'path';
import { COMPONENT_BUILDER_DECORATOR, WRAPBUILDER_FUNCTION, MUTABLEBUILDER_FUNCTION } from '../pre_define';
import type { LogInfo } from '../utils';
import { hasDecorator } from '../utils';
import { isUIResourceFile } from './context';
import { detachUISnapshotData } from './snapshot_data';
import type { UIBuilderReceiverKind } from './expression_semantics';

export interface UIDeclarationLocation {
  fileName: string;
  pos: number;
  end: number;
  kind: ts.SyntaxKind;
}

export interface FileUISemantics {
  syntaxValidation?: UISyntaxSnapshot;
  fileName: string;
  identity: number;
  validationPrepared: boolean;
  expressionFacts: Map<string, number>;
  parameterReferences: Map<string, { fileName: string; key: string }>;
  builderArguments: Map<string, boolean | null>;
  builderReceivers: Map<string, UIBuilderReceiverKind>;
  simpleStateTypes: Map<string, boolean>;
  objectLinkTypes: Map<string, boolean>;
  validations: Map<string, { twoWayComputed?: LogInfo[] }>;
}

const files: Map<string, FileUISemantics> = new Map();
let identities: WeakMap<ts.SourceFile, number> = new WeakMap();
let nextIdentity: number = 0;

export function uiNodeKey(node: ts.Node): string {
  const original: ts.Node = ts.getOriginalNode(node);
  return `${original.kind}:${original.pos}:${original.end}`;
}

export function resetUISemantics(): void {
  files.clear();
  identities = new WeakMap();
}

export function deleteUISemantics(fileName: string): void {
  files.delete(path.resolve(fileName));
}

export interface UISnapshotStoreStats {
  files: number; validations: number; builderFacts: number;
  stateTypes: number;
  expressionFacts: number; parameterReferences: number;
}

export function getUISnapshotStoreStats(): UISnapshotStoreStats {
  let validations: number = 0;
  let builderFacts: number = 0;
  let stateTypes: number = 0;
  let expressionFacts: number = 0;
  let parameterReferences: number = 0;
  files.forEach(snapshot => {
    validations += snapshot.validations.size;
    builderFacts += snapshot.builderArguments.size + snapshot.builderReceivers.size;
    stateTypes += snapshot.simpleStateTypes.size + snapshot.objectLinkTypes.size;
    expressionFacts += snapshot.expressionFacts.size;
    parameterReferences += snapshot.parameterReferences.size;
  });
  return { files: files.size, validations, builderFacts, stateTypes,
    expressionFacts, parameterReferences };
}

function internParameterReferences(snapshot: FileUISemantics): void {
  const parameters: Map<string, { fileName: string; key: string }> = new Map();
  snapshot.parameterReferences.forEach((reference, nodeKey) => {
    const key: string = JSON.stringify([reference.fileName, reference.key]);
    const existing = parameters.get(key);
    if (existing) {
      snapshot.parameterReferences.set(nodeKey, existing);
    } else {
      parameters.set(key, reference);
    }
  });
}

export function getUISemantics(node: ts.Node): FileUISemantics | undefined {
  const source: ts.SourceFile = ts.getOriginalNode(node).getSourceFile();
  const snapshot: FileUISemantics | undefined = source && files.get(path.resolve(source.fileName));
  return snapshot && identities.get(source) === snapshot.identity ? snapshot : undefined;
}

export function findUIDeclaration(program: ts.Program, target: UIDeclarationLocation): ts.Node {
  const source: ts.SourceFile | undefined = program.getSourceFile(target.fileName);
  let found: ts.Node;
  const visit = (node: ts.Node): void => {
    if (found || node.pos > target.pos || node.end < target.end) {
      return;
    }
    if (node.pos === target.pos && node.end === target.end && node.kind === target.kind) {
      found = node;
      return;
    }
    ts.forEachChild(node, visit);
  };
  if (source) {
    visit(source);
  }
  if (!found) {
    throw new Error(`UI semantic snapshot declaration is stale: ${target.fileName}:${target.pos}`);
  }
  return found;
}

export function resolveUIBuilderArgument(argument: ts.PropertyAccessExpression, checker: ts.TypeChecker): boolean | null {
  let symbol: ts.Symbol | undefined = checker?.getSymbolAtLocation(argument.name);
  if (!symbol) {
    return null;
  }
  if (symbol.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  return (symbol.declarations || []).some(declaration => ts.isFunctionDeclaration(declaration) &&
    hasDecorator(declaration, COMPONENT_BUILDER_DECORATOR));
}

export function prepareUISemantics(source: ts.SourceFile, checker: ts.TypeChecker,
  prepareValidation?: (source: ts.SourceFile, checker: ts.TypeChecker, snapshot: FileUISemantics) => void,
  prepareSyntax?: (source: ts.SourceFile) => UISyntaxSnapshot | undefined): FileUISemantics {
  deleteUISemantics(source.fileName);
  const snapshot: FileUISemantics = {
    fileName: path.resolve(source.fileName), identity: ++nextIdentity, validationPrepared: false,
    builderArguments: new Map(), builderReceivers: new Map(), simpleStateTypes: new Map(),
    objectLinkTypes: new Map(), validations: new Map(),
    expressionFacts: new Map(), parameterReferences: new Map()
  };
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) &&
      [WRAPBUILDER_FUNCTION, MUTABLEBUILDER_FUNCTION].includes(node.expression.text)) {
      const argument: ts.Expression | undefined = node.arguments[0];
      if (argument && ts.isPropertyAccessExpression(argument) && argument.expression.kind !== ts.SyntaxKind.ThisKeyword) {
        snapshot.builderArguments.set(uiNodeKey(argument), resolveUIBuilderArgument(argument, checker));
      }
    }
    ts.forEachChild(node, visit);
  };
  if (!isUIResourceFile(source.fileName)) {
    visit(source);
  }
  prepareValidation?.(source, checker, snapshot);
  internParameterReferences(snapshot);
  const detached: FileUISemantics = detachUISnapshotData(snapshot);
  files.set(detached.fileName, detached);
  identities.set(source, detached.identity);
  if (prepareSyntax) {
    try {
      files.set(detached.fileName, Object.freeze({ ...detached, syntaxValidation: prepareSyntax(source) }));
    } catch (error) {
      deleteUISemantics(source.fileName);
      throw error;
    }
  }
  return files.get(detached.fileName);
}

export function prepareProgramUISemantics(program: ts.Program,
  prepareValidation?: (source: ts.SourceFile, checker: ts.TypeChecker, snapshot: FileUISemantics) => void,
  prepareSyntax?: (source: ts.SourceFile) => UISyntaxSnapshot | undefined): void {
  resetUISemantics();
  try {
    for (const source of program.getSourceFiles()) {
      if (!source.isDeclarationFile && /\.(ets|ts)$/.test(source.fileName)) {
        const checker: ts.TypeChecker = /\.ets$/.test(source.fileName) ?
          program.getLinterTypeChecker() : program.getTypeChecker();
        prepareUISemantics(source, checker, prepareValidation, prepareSyntax);
      }
    }
  } catch (error) {
    resetUISemantics();
    throw error;
  }
}
