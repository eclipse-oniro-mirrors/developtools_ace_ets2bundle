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
import { FileUISemantics, getUISemantics, uiNodeKey } from './semantic_snapshot';
import { CurrentProcessFile, LogInfo } from '../utils';
import logMessageCollection from '../log_message_collection';
import { useUISemanticSnapshots } from './context';

export function consumeTwoWayComputedDiagnostics(node: ts.PropertyAccessExpression, log: LogInfo[]): void {
  if (node.expression.kind !== ts.SyntaxKind.ThisKeyword) {
    return;
  }
  if (useUISemanticSnapshots()) {
    const snapshot: FileUISemantics | undefined = getUISemantics(node);
    if (!snapshot?.validationPrepared) {
      throw new Error('UI two-way Computed validation was not prepared: ' + node.getSourceFile().fileName);
    }
    const diagnostics: LogInfo[] = snapshot.validations.get(uiNodeKey(node))?.twoWayComputed || [];
    log.push(...diagnostics.map(item => ({ ...item })));
    return;
  }
  const checker: ts.TypeChecker | undefined = CurrentProcessFile.getChecker();
  if (checker) {
    logMessageCollection.checkTwoWayComputed(node, checker.getSymbolAtLocation(node), log);
  }
}
