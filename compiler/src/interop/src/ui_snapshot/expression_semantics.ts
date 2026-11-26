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
import { projectConfig } from '../../main';
import { FileUISemantics, getUISemantics, uiNodeKey } from './semantic_snapshot';
import { BUILDER_TYPE, WRAPPEDBUILDER_CLASS, MUTABLEBUILDER_CLASS } from '../pre_define';
import { CurrentProcessFile, findNonNullType, hasInitialRenderCondition } from '../utils';
import { useUISemanticSnapshots } from './context';

export const UIExpressionFact = {
  Const: 1, Enum: 2, SimpleProperty: 4, BuilderType: 8, StorageParameter: 16,
  UnresolvedDollar: 32, ForbiddenV2: 64, ApiAvailable: 128
} as const;

export function getUIExpressionFacts(node: ts.Node): number {
  const snapshot = getUISemantics(node);
  if (!snapshot?.validationPrepared || ts.getOriginalNode(node).pos < 0) {
    throw new Error('UI expression semantics were not prepared: ' + node.getSourceFile()?.fileName + ':' + node.pos);
  }
  return snapshot.expressionFacts.get(uiNodeKey(node)) || 0;
}

export function setUIExpressionFact(snapshot: FileUISemantics, node: ts.Node, fact: number): void {
  const key = uiNodeKey(node);
  snapshot.expressionFacts.set(key, (snapshot.expressionFacts.get(key) || 0) | fact);
}

function prepareIdentifier(node: ts.Identifier, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  const collectConst = hasInitialRenderCondition();
  if (!collectConst && !projectConfig.optLazyForEach) {
    return;
  }
  let symbol = checker?.getSymbolAtLocation?.(node);
  const declaration = symbol?.valueDeclaration;
  if (projectConfig.optLazyForEach && declaration && ts.isParameter(declaration)) {
    snapshot.parameterReferences.set(uiNodeKey(node), {
      fileName: declaration.getSourceFile().fileName, key: uiNodeKey(declaration)
    });
  }
  if (!collectConst) {
    return;
  }
  if (symbol?.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const first = symbol?.declarations?.[0];
  if (first && ts.isVariableDeclaration(first) && first.parent && ts.isVariableDeclarationList(first.parent) &&
    (first.parent.flags & ts.NodeFlags.Const)) {
    setUIExpressionFact(snapshot, node, UIExpressionFact.Const);
  }
}

function prepareProperty(node: ts.PropertyAccessExpression, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  if (ts.isIdentifier(node.expression) && ts.isIdentifier(node.name) &&
    (checker?.getTypeAtLocation?.(node)?.flags & (ts.TypeFlags.Enum | ts.TypeFlags.EnumLiteral))) {
    setUIExpressionFact(snapshot, node, UIExpressionFact.Enum);
  }
  if (node.expression.kind !== ts.SyntaxKind.ThisKeyword) {
    return;
  }
  let symbol = checker?.getSymbolAtLocation?.(node);
  if (symbol?.flags & ts.SymbolFlags.Alias) {
    symbol = checker.getAliasedSymbol(symbol);
  }
  const declaration = symbol?.declarations?.length === 1 ? symbol.declarations[0] : undefined;
  if (declaration && ts.isPropertyDeclaration(declaration) && declaration.type &&
    [ts.SyntaxKind.StringKeyword, ts.SyntaxKind.NumberKeyword, ts.SyntaxKind.BooleanKeyword].includes(declaration.type.kind)) {
    setUIExpressionFact(snapshot, node, UIExpressionFact.SimpleProperty);
  }
}

export function hasDollarReference(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) {
    expression = expression.name;
  }
  return ts.isIdentifier(expression) && expression.getText().startsWith('$');
}

function prepareBuilderCall(node: ts.Node, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  if (!ts.isExpressionStatement(node) ||
    !(ts.isCallExpression(node.expression) || ts.isEtsComponentExpression(node.expression))) {
    return;
  }
  if (checker?.getTypeAtLocation?.(node.expression.expression)?.aliasSymbol?.escapedName === BUILDER_TYPE) {
    setUIExpressionFact(snapshot, node, UIExpressionFact.BuilderType);
  }
}

function prepareStorageSignature(node: ts.Node, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  if (!(ts.isCallExpression(node) || ts.isEtsComponentExpression(node)) || node.arguments?.length !== 1) {
    return;
  }
  const signature = checker?.getResolvedSignature?.(node as ts.CallExpression);
  if (signature?.parameters?.length === 1 && signature.parameters[0].escapedName === '##storage') {
    setUIExpressionFact(snapshot, node, UIExpressionFact.StorageParameter);
  }
}

function prepareUnresolvedDollar(node: ts.Node, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  if (!ts.isPropertyAssignment(node) || !hasDollarReference(node.initializer) ||
    checker?.getSymbolAtLocation?.(node.initializer)) {
    return;
  }
  setUIExpressionFact(snapshot, node.initializer, UIExpressionFact.UnresolvedDollar);
}

export function prepareUIExpressionNode(node: ts.Node, checker: ts.TypeChecker, snapshot: FileUISemantics): void {
  if (ts.isIdentifier(node)) {
    prepareIdentifier(node, checker, snapshot);
  } else if (ts.isPropertyAccessExpression(node)) {
    prepareProperty(node, checker, snapshot);
  } else {
    prepareBuilderCall(node, checker, snapshot);
  }
  prepareStorageSignature(node, checker, snapshot);
  prepareUnresolvedDollar(node, checker, snapshot);
}

export function isUIParameterReference(node: ts.Identifier, parameter: ts.ParameterDeclaration): boolean {
  getUIExpressionFacts(node);
  const reference = getUISemantics(node).parameterReferences.get(uiNodeKey(node));
  return !!reference && reference.key === uiNodeKey(parameter) &&
    reference.fileName === ts.getOriginalNode(parameter).getSourceFile().fileName;
}

export const UIBuilderReceiver = { Other: 0, Wrapped: 1, Mutable: 2 } as const;
export type UIBuilderReceiverKind = typeof UIBuilderReceiver[keyof typeof UIBuilderReceiver];

export function resolveUIBuilderReceiver(node: ts.PropertyAccessExpression,
  checker: ts.TypeChecker | undefined): UIBuilderReceiverKind {
  if (!checker) {
    return UIBuilderReceiver.Other;
  }
  const type: ts.Type | ts.Type[] = findNonNullType(checker.getTypeAtLocation(node.expression));
  if (!Array.isArray(type)) {
    if (type.symbol?.escapedName === WRAPPEDBUILDER_CLASS) {
      return UIBuilderReceiver.Wrapped;
    }
    if (type.symbol?.escapedName === MUTABLEBUILDER_CLASS) {
      return UIBuilderReceiver.Mutable;
    }
  }
  return UIBuilderReceiver.Other;
}

export function consumeUIBuilderReceiver(node: ts.PropertyAccessExpression): UIBuilderReceiverKind {
  if (!useUISemanticSnapshots()) {
    return resolveUIBuilderReceiver(node, CurrentProcessFile.getChecker());
  }
  const result: UIBuilderReceiverKind | undefined = getUISemantics(node)?.builderReceivers.get(uiNodeKey(node));
  if (result === undefined) {
    throw new Error('UI Builder receiver was not prepared: ' + node.getSourceFile()?.fileName + ':' + node.pos);
  }
  return result;
}
