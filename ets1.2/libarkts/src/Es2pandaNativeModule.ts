/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import {
    KNativePointer as KPtr,
    KInt,
    KBoolean,
    KNativePointer,
    registerNativeModuleLibraryName,
    loadNativeModuleLibrary,
    KDouble,
    KUInt,
    KStringArrayPtr,
} from "@koalaui/interop"
import { Es2pandaNativeModule as GeneratedEs2pandaNativeModule, KNativePointerArray } from "./generated/Es2pandaNativeModule"
import * as path from "path"
import * as fs from "fs"
import { Es2pandaPluginDiagnosticType } from "./generated/Es2pandaEnums"

// Improve: this type should be in interop
export type KPtrArray = BigUint64Array

export class Es2pandaNativeModule {
    _AnnotationAllowedAnnotations(context: KPtr, node: KPtr, returnLen: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _AstNodeRebind(context: KPtr, node: KPtr): void {
        throw new Error("Not implemented")
    }
    _ContextState(context: KPtr): KInt {
        throw new Error("Not implemented")
    }
    _AstNodeChildren(context: KPtr, node: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _AstNodeDumpModifiers(context: KPtr, node: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _CreateConfig(argc: number, argv: string[]): KPtr {
        throw new Error("Not implemented")
    }
    _DestroyConfig(peer: KNativePointer): void {
        throw new Error("Not implemented")
    }
    _CreateContextFromString(config: KPtr, source: String, filename: String): KPtr {
        throw new Error("Not implemented")
    }
    _CreateContextFromFile(config: KPtr, filename: String): KPtr {
        throw new Error("Not implemented")
    }
    _CreateCacheContextFromFile(config: KNativePointer, sourceFileName: String, globalContext: KNativePointer, isExternal: KBoolean): KNativePointer {
        throw new Error("Not implemented");
    }
    _InsertGlobalStructInfo(context: KNativePointer, str: String): void {
        throw new Error("Not implemented");
    }
    _HasGlobalStructInfo(context: KNativePointer, str: String): KBoolean {
        throw new Error("Not implemented");
    }
    _CreateGlobalContext(config: KNativePointer, externalFileList: KStringArrayPtr, fileNum: KUInt, lspUsage: KBoolean): KNativePointer {
        throw new Error("Not implemented");
    }
    _DestroyGlobalContext(context: KNativePointer): void {
        throw new Error("Not implemented");
    }
    _DestroyContext(context: KPtr): void {
        throw new Error("Not implemented")
    }
    _ProceedToState(context: KPtr, state: number): void {
        throw new Error("Not implemented")
    }
    _CheckerStartChecker(context: KPtr): KBoolean {
        throw new Error("Not implemented")
    }
    _AstNodeVariableConst(context: KPtr, ast: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _CreateNumberLiteral(context: KPtr, value: KDouble): KPtr {
        throw new Error("Not implemented")
    }
    _AstNodeSetChildrenParentPtr(context: KPtr, node: KPtr): void {
        throw new Error("Not implemented")
    }
    _AstNodeOnUpdate(context: KPtr, newNode: KPtr, replacedNode: KPtr): void {
        throw new Error("Not implemented")
    }
    _AstNodeUpdateAll(context: KPtr, node: KPtr): void {
        throw new Error("Not implemented")
    }
    _VariableDeclaration(context: KPtr, variable: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _DeclNode(context: KPtr, decl: KPtr): KPtr {
        throw new Error("Not implemented")
    }
    _ProgramSourceFilePath(context: KNativePointer, instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ProgramExternalSources(context: KNativePointer, instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ProgramDirectExternalSources(context: KNativePointer, instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _ExternalSourceName(instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ExternalSourcePrograms(instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ETSParserBuildImportDeclaration(context: KNativePointer, importKinds: KInt, specifiers: KNativePointerArray, specifiersSequenceLength: KUInt, source: KNativePointer, program: KNativePointer, flags: KInt): KNativePointer {
        throw new Error("Not implemented");
    }
    _ImportPathManagerResolvePathConst(context: KNativePointer, importPathManager: KNativePointer, currentModulePath: String, importPath: String, sourcePosition: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ETSParserGetImportPathManager(context: KNativePointer): KPtr {
        throw new Error("Not implemented");
    }
    _SourcePositionCol(context: KNativePointer, instance: KNativePointer): KInt {
        throw new Error("Not implemented");
    }
    _ConfigGetOptions(config: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _OptionsArkTsConfig(context: KNativePointer, options: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_CreateOpaqueTypeNode(context: KNativePointer, type: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_ScriptFunctionSignature(context: KNativePointer, node: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_ScriptFunctionSetSignature(context: KNativePointer, node: KNativePointer, signature: KNativePointer): void {
        throw new Error("Not implemented");
    }
    _Checker_SignatureReturnType(context: KNativePointer, signature: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_ScriptFunctionGetPreferredReturnType(context: KNativePointer, node: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_ScriptFunctionSetPreferredReturnType(context: KNativePointer, node: KNativePointer, type: KNativePointer): void {
        throw new Error("Not implemented");
    }
    _Checker_ExpressionGetPreferredType(context: KNativePointer, node: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_ExpressionSetPreferredType(context: KNativePointer, node: KNativePointer, type: KNativePointer): void {
        throw new Error("Not implemented");
    }
    _Checker_TypeToString(context: KNativePointer, type: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_TypeClone(context: KNativePointer, type: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _Checker_TypeNodeGetType(context: KNativePointer, node: KNativePointer): KNativePointer {
        throw new Error("Not implemented");
    }
    _ScriptFunctionSetParams(context: KNativePointer, receiver: KNativePointer, paramsList: BigUint64Array, paramsListLength: KUInt): void {
        throw new Error("Not implemented")
    }
    _ClassDefinitionSetBody(context: KNativePointer, receiver: KNativePointer, body: BigUint64Array, bodyLength: KUInt): void {
        throw new Error("Not implemented")
    }

    // From koala-wrapper
    _ClassVariableDeclaration(context: KNativePointer, classInstance: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _ETSParserGetGlobalProgramAbsName(context: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _CreateDiagnosticKind(context: KNativePointer, message: string, type: Es2pandaPluginDiagnosticType): KNativePointer {
        throw new Error("Not implemented")
    }
    _CreateDiagnosticInfo(context: KNativePointer, kind: KNativePointer, args: string[], argc: number, pos: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _CreateSuggestionInfo(context: KNativePointer, kind: KNativePointer, args: string[],
        argc: number, substitutionCode: string, title: string, range: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _LogDiagnostic(context: KNativePointer, kind: KNativePointer, argv: string[], argc: number, pos: KNativePointer): void {
        throw new Error("Not implemented")
    }
    _SetUpSoPath(soPath: string): void {
        throw new Error("Not implemented")
    }
    _MemInitialize(): void {
        throw new Error("Not implemented")
    }
    _MemFinalize(): void {
        throw new Error("Not implemented")
    }
    _ProgramCanSkipPhases(context: KNativePointer, program: KNativePointer): boolean {
        throw new Error("Not implemented")
    }
    _GenerateTsDeclarationsFromContext(config: KPtr, outputDeclEts: String, outputEts: String, exportAll: KBoolean, isolated: KBoolean, recordFile: String): KPtr {
        throw new Error("Not implemented")
    }
    _AstNodeProgram(context: KNativePointer, instance: KNativePointer): KNativePointer {
        throw new Error("Not implemented")
    }
    _CreateContextGenerateAbcForExternalSourceFiles(config: KPtr, fileCount: KInt, filenames: string[]): KPtr {
        throw new Error('Not implemented');
    }

    _GetCompilationMode(config: KNativePointer): KInt {
        throw new Error('Not implemented');
    }

    _CreateTypeNodeFromTsType(context: KNativePointer, classInstance: KNativePointer): KNativePointer {
        throw new Error('Not implemented');
    }
}

export function findNativeModule(): string {
    const candidates = [
        path.resolve(__dirname, "../native/build"),
        path.resolve(__dirname, "../build/native/build"),
    ]
    let result = undefined
    candidates.forEach(path => {
        if (fs.existsSync(path)) {
            result = path
            return
        }
    })
    if (result)
        return path.join(result, "es2panda")
    throw new Error("Cannot find native module")
}

export function initEs2panda(): Es2pandaNativeModule {
    registerNativeModuleLibraryName("NativeModule", findNativeModule())
    const instance = new Es2pandaNativeModule()
    loadNativeModuleLibrary("NativeModule", instance)
    return instance
}

export function initGeneratedEs2panda(): GeneratedEs2pandaNativeModule {
    registerNativeModuleLibraryName("NativeModule", findNativeModule())
    const instance = new GeneratedEs2pandaNativeModule()
    // registerNativeModule("InteropNativeModule", NativeModule)
    loadNativeModuleLibrary("NativeModule", instance)
    return instance
}
