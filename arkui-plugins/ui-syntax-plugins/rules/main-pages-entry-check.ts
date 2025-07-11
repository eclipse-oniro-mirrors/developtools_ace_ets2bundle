/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as arkts from '@koalaui/libarkts';
import { getAnnotationUsage, PresetDecorators } from '../utils';
import { AbstractUISyntaxRule } from './ui-syntax-rule';

class MainPagesEntryCheckRule extends AbstractUISyntaxRule {
  public setup(): Record<string, string> {
    return {
      mainPagesEntryCheck: `A page configured in 'main_pages. json or build-profile. json5' must have one and only one '@Entry' annotation. `
    };
  }
  public parsed(node: arkts.StructDeclaration): void {
    if (!arkts.isEtsScript(node)) {
      return;
    }
    const currentFilePath = this.getPath();
    if (!currentFilePath) {
      return;
    }
    if (!this.context.getMainPages().includes(currentFilePath)) {
      return;
    }
    let entryDecoratorCount = 0;
    // Store the first StructDeclaration
    let firstStructDeclaration: arkts.AstNode | undefined = undefined;
    // Traverse all child nodes of the Program
    for (const child of node.getChildren()) {
      // Check if it's of type StructDeclaration
      if (arkts.isStructDeclaration(child)) {
        if (!firstStructDeclaration) {
          firstStructDeclaration = child;
        }
        const entryDocoratorUsage = getAnnotationUsage(
          child,
          PresetDecorators.ENTRY,
        );
        if (entryDocoratorUsage) {
          ++entryDecoratorCount;
        }
      }
    }
    if (entryDecoratorCount === 0) {
      this.report({
        node: firstStructDeclaration ? firstStructDeclaration : node,
        message: this.messages.mainPagesEntryCheck,
      });
    }
  }

  private getPath(): string | undefined {
    const contextPtr = arkts.arktsGlobal.compilerContext?.peer;
    if (!!contextPtr) {
      let program = arkts.getOrUpdateGlobalContext(contextPtr).program;
      return program.globalAbsName;
    }
    return undefined;
  }
}

export default MainPagesEntryCheckRule;