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
import { LogInfo, LogType } from './utils';


export const COMPONENT_BUILDER_DECORATOR_NAME: string = 'Builder';

export function validateBuilderDecorator(
    node: ts.Identifier,
    sourceFileNode: ts.SourceFile,
    log: LogInfo[],
    decoratorName: string
): void {
    if (decoratorName !== COMPONENT_BUILDER_DECORATOR_NAME) {
        return;
    }
    const InterfaceAncestor: ts.InterfaceDeclaration | undefined = ts.findAncestor(node, ts.isInterfaceDeclaration);
    if (!InterfaceAncestor) {
        return;
    }
    validateBuilderInInterfaceDecl(node, sourceFileNode, log);
}

function validateBuilderInInterfaceDecl(
    node: ts.Identifier,
    sourceFileNode: ts.SourceFile,
    log: LogInfo[]
): void {
    const message: string = `'@Builder' decorator cannot be used with InterfaceDeclaration.`;
    log.push({
        type: LogType.WARN,
        message: message,
        pos: node.getStart(),
        fileName: sourceFileNode.fileName
    });
}