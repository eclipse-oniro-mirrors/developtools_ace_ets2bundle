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
import {
  AvailableComparisonValidator,
  CompositeValidator,
  NodeValidator,
  SdkComparisonValidator,
} from './api_validate_node';

/**
 * Suppressor for @available annotations.
 * Only supports SDK version comparison suppression strategy.
 * 
 * Note: Unlike @since, @available does NOT support try/catch or undefined checks.
 */
export class AvailableWarningSuppressor {
  private validator: NodeValidator;

  constructor(
    projectCompatibleSdkVersion: string,
    minRequiredVersion: string,
    typeChecker?: ts.TypeChecker
  ) {
    this.validator = new CompositeValidator([
      new AvailableComparisonValidator(
        projectCompatibleSdkVersion,
        minRequiredVersion,
        typeChecker
      ),
      new SdkComparisonValidator(
        projectCompatibleSdkVersion,
        minRequiredVersion,
        typeChecker
      )
    ]);
  }

  /**
   * Checks if a node's usage is suppressed.
   * For @available, only SDK comparison is supported.
   *
   * @param node - The AST node to check
   * @returns True if the node is properly handled with SDK comparison
   */
  public isApiVersionHandled(node: ts.Node): boolean {
    if (!node) {
      return false;
    }

    return this.validator.validate(node);
  }
}