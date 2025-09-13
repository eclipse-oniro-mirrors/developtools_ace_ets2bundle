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

#include "common.h"

#include <set>
#include <string>
#include <mutex>

/** XXX: If you add or remove methods that exist in C API,
 * please change generator/options.json5 accordingly.
 */

KNativePointer impl_AstNodeRebind(KNativePointer contextPtr, KNativePointer nodePtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto node = reinterpret_cast<es2panda_AstNode*>(nodePtr);
    GetImpl()->AstNodeRebind(context, node);
    return nullptr;
}
KOALA_INTEROP_2(AstNodeRebind, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_AnnotationAllowedAnnotations(KNativePointer contextPtr, KNativePointer nodePtr,
    KNativePointer returnLen
)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto node = reinterpret_cast<es2panda_AstNode*>(nodePtr);
    std::size_t params_len = 0;
    auto annotations = GetImpl()->AnnotationAllowedAnnotations(context, node, &params_len);
    return StageArena::cloneVector(annotations, params_len);
}
KOALA_INTEROP_3(AnnotationAllowedAnnotations, KNativePointer, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_AnnotationAllowedAnnotationsConst(KNativePointer contextPtr, KNativePointer nodePtr,
    KNativePointer returnLen
)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto node = reinterpret_cast<es2panda_AstNode*>(nodePtr);
    std::size_t params_len = 0;
    auto annotations = GetImpl()->AnnotationAllowedAnnotationsConst(context, node, &params_len);
    return StageArena::cloneVector(annotations, params_len);
}
KOALA_INTEROP_3(AnnotationAllowedAnnotationsConst, KNativePointer, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_VariableDeclaration(KNativePointer contextPtr, KNativePointer variablePtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto variable = reinterpret_cast<es2panda_Variable*>(variablePtr);

    return GetImpl()->VariableDeclaration(context, variable);
}
KOALA_INTEROP_2(VariableDeclaration, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_DeclNode(KNativePointer contextPtr, KNativePointer declPtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto decl = reinterpret_cast<es2panda_Declaration*>(declPtr);

    return GetImpl()->DeclNode(context, decl);
}
KOALA_INTEROP_2(DeclNode, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_ScopeSetParent(KNativePointer contextPtr, KNativePointer nodePtr, KNativePointer parentPtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto node = reinterpret_cast<es2panda_Scope*>(nodePtr);
    auto parent = reinterpret_cast<es2panda_Scope*>(parentPtr);
    GetImpl()->ScopeSetParent(context, node, parent);
    return node;
}
KOALA_INTEROP_3(ScopeSetParent, KNativePointer, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_ETSParserCreateExpression(KNativePointer contextPtr, KStringPtr& sourceCodePtr, KInt flagsT)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto flags = static_cast<Es2pandaExpressionParseFlags>(flagsT);

    return GetImpl()->ETSParserCreateExpression(context, getStringCopy(sourceCodePtr), flags);
}
KOALA_INTEROP_3(ETSParserCreateExpression, KNativePointer, KNativePointer, KStringPtr, KInt)

KNativePointer impl_CreateContextFromString(KNativePointer configPtr, KStringPtr& sourcePtr, KStringPtr& filenamePtr)
{
    auto config = reinterpret_cast<es2panda_Config*>(configPtr);
    return GetImpl()->CreateContextFromString(config, sourcePtr.data(), filenamePtr.data());
}
KOALA_INTEROP_3(CreateContextFromString, KNativePointer, KNativePointer, KStringPtr, KStringPtr)

KNativePointer impl_CreateContextFromFile(KNativePointer configPtr, KStringPtr& filenamePtr)
{
    auto config = reinterpret_cast<es2panda_Config*>(configPtr);
    return GetImpl()->CreateContextFromFile(config, getStringCopy(filenamePtr));
}
KOALA_INTEROP_2(CreateContextFromFile, KNativePointer, KNativePointer, KStringPtr)

KNativePointer impl_SignatureFunction(KNativePointer context, KNativePointer classInstance)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _classInstance = reinterpret_cast<es2panda_Signature*>(classInstance);
    const auto result = GetImpl()->SignatureFunction(_context, _classInstance);
    return result;
}
KOALA_INTEROP_2(SignatureFunction, KNativePointer, KNativePointer, KNativePointer)

static KNativePointer impl_ProgramExternalSources(KNativePointer contextPtr, KNativePointer instancePtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto&& instance = reinterpret_cast<es2panda_Program *>(instancePtr);
    std::size_t source_len = 0;
    auto external_sources = GetImpl()->ProgramExternalSources(context, instance, &source_len);
    return StageArena::cloneVector(external_sources, source_len);
}
KOALA_INTEROP_2(ProgramExternalSources, KNativePointer, KNativePointer, KNativePointer);

static KNativePointer impl_ProgramDirectExternalSources(KNativePointer contextPtr, KNativePointer instancePtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto&& instance = reinterpret_cast<es2panda_Program *>(instancePtr);
    std::size_t sourceLen = 0;
    auto externalSources = GetImpl()->ProgramDirectExternalSources(context, instance, &sourceLen);
    return new std::vector<void*>(externalSources, externalSources + sourceLen);
}
KOALA_INTEROP_2(ProgramDirectExternalSources, KNativePointer, KNativePointer, KNativePointer);

static KNativePointer impl_ProgramSourceFilePath(KNativePointer contextPtr, KNativePointer instancePtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto&& instance = reinterpret_cast<es2panda_Program *>(instancePtr);
    auto&& result = GetImpl()->ProgramSourceFilePathConst(context, instance);
    return StageArena::strdup(result);
}
KOALA_INTEROP_2(ProgramSourceFilePath, KNativePointer, KNativePointer, KNativePointer);

static KNativePointer impl_ExternalSourceName(KNativePointer instance)
{
    auto&& _instance_ = reinterpret_cast<es2panda_ExternalSource *>(instance);
    auto&& result = GetImpl()->ExternalSourceName(_instance_);
    return StageArena::strdup(result);
}
KOALA_INTEROP_1(ExternalSourceName, KNativePointer, KNativePointer);

static KNativePointer impl_ExternalSourcePrograms(KNativePointer instance)
{
    auto&& _instance_ = reinterpret_cast<es2panda_ExternalSource *>(instance);
    std::size_t program_len = 0;
    auto programs = GetImpl()->ExternalSourcePrograms(_instance_, &program_len);
    return StageArena::cloneVector(programs, program_len);
}
KOALA_INTEROP_1(ExternalSourcePrograms, KNativePointer, KNativePointer);

KNativePointer impl_ETSParserBuildImportDeclaration(KNativePointer context, KInt importKinds,
    KNativePointerArray specifiers, KUInt specifiersSequenceLength,
    KNativePointer source, KNativePointer program, KInt importFlag)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _kinds = static_cast<Es2pandaImportKinds>(importKinds);
    const auto _specifiers = reinterpret_cast<es2panda_AstNode**>(specifiers);
    const auto _specifiersSequenceLength = static_cast<size_t>(specifiersSequenceLength);
    const auto _source = reinterpret_cast<es2panda_AstNode*>(source);
    const auto _program = reinterpret_cast<es2panda_Program*>(program);
    const auto _importFlag = static_cast<Es2pandaImportFlags>(importFlag);

    return GetImpl()->ETSParserBuildImportDeclaration(_context, _kinds, _specifiers,
        _specifiersSequenceLength, _source, _program, _importFlag);
}
KOALA_INTEROP_7(ETSParserBuildImportDeclaration, KNativePointer, KNativePointer, KInt,
    KNativePointerArray, KUInt, KNativePointer, KNativePointer, KInt)

KNativePointer impl_ETSParserGetImportPathManager(KNativePointer contextPtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    return GetImpl()->ETSParserGetImportPathManager(context);
}
KOALA_INTEROP_1(ETSParserGetImportPathManager, KNativePointer, KNativePointer);

KInt impl_SourcePositionCol(KNativePointer context, KNativePointer instance)
{
    auto&& _context_ = reinterpret_cast<es2panda_Context *>(context);
    auto&& _instance_ = reinterpret_cast<es2panda_SourcePosition *>(instance);
    return GetImpl()->SourcePositionCol(_context_, _instance_);
}
KOALA_INTEROP_2(SourcePositionCol, KInt, KNativePointer, KNativePointer);

KNativePointer impl_ConfigGetOptions(KNativePointer config)
{
    const auto _config = reinterpret_cast<es2panda_Config *>(config);
    auto result = GetImpl()->ConfigGetOptions(_config);
    return (void*)result;
}
KOALA_INTEROP_1(ConfigGetOptions, KNativePointer, KNativePointer)

KNativePointer impl_OptionsArkTsConfig(KNativePointer context, KNativePointer options)
{
    const auto _context = reinterpret_cast<es2panda_Context *>(context);
    const auto _options = reinterpret_cast<es2panda_Options *>(options);
    auto result = GetImpl()->OptionsUtilArkTSConfigConst(_context, _options);
    return (void*)result;
}
KOALA_INTEROP_2(OptionsArkTsConfig, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_CreateCacheContextFromFile(KNativePointer configPtr, KStringPtr& source_file_namePtr,
    KNativePointer globalContextPtr, KBoolean isExternal
) {
    auto config = reinterpret_cast<es2panda_Config*>(configPtr);
    auto globalContext = reinterpret_cast<es2panda_GlobalContext*>(globalContextPtr);
    return GetImpl()->CreateCacheContextFromFile(config,
        getStringCopy(source_file_namePtr),
        globalContext,
        isExternal
    );
}
KOALA_INTEROP_4(CreateCacheContextFromFile, KNativePointer, KNativePointer, KStringPtr, KNativePointer, KBoolean)

KNativePointer impl_CreateGlobalContext(KNativePointer configPtr, KStringArray externalFileListPtr,
    KUInt fileNum, KBoolean LspUsage
) {
    auto config = reinterpret_cast<es2panda_Config*>(configPtr);
    const int headerLen = 4;
    const char** files = StageArena::allocArray<const char*>(fileNum);
    uint8_t* filesPtr = (uint8_t*)externalFileListPtr;
    std::size_t position = headerLen;
    std::size_t strLen;
    for (std::size_t i = 0; i < static_cast<std::size_t>(fileNum); ++i) {
        strLen = unpackUInt(filesPtr + position);
        position += headerLen;
        files[i] = StageArena::strdup(std::string(reinterpret_cast<const char*>(filesPtr + position), strLen).c_str());
        position += strLen;
    }
    return GetImpl()->CreateGlobalContext(config, files, fileNum, LspUsage);
}
KOALA_INTEROP_4(CreateGlobalContext, KNativePointer, KNativePointer, KStringArray, KUInt, KBoolean)

void impl_DestroyGlobalContext(KNativePointer globalContextPtr) {
    auto globalContext = reinterpret_cast<es2panda_GlobalContext*>(globalContextPtr);
    GetImpl()->DestroyGlobalContext(globalContext);
}
KOALA_INTEROP_V1(DestroyGlobalContext, KNativePointer)

// All these "Checker_" bridges are related to checker namespace in es2panda, so work with them carefully
// Checker.Type does reset on recheck, so modifying them makes no sence
// It seems that compiler does not provide API to convert Checker.Type to ir.Type
KNativePointer impl_Checker_CreateOpaqueTypeNode(KNativePointer context, KNativePointer type)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _type = reinterpret_cast<es2panda_Type*>(type);
    return GetImpl()->CreateOpaqueTypeNode(_context, _type);
}
KOALA_INTEROP_2(Checker_CreateOpaqueTypeNode, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_ScriptFunctionSignature(KNativePointer context, KNativePointer node)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    return GetImpl()->ScriptFunctionSignature(_context, _node);
}
KOALA_INTEROP_2(Checker_ScriptFunctionSignature, KNativePointer, KNativePointer, KNativePointer)

void impl_Checker_ScriptFunctionSetSignature(KNativePointer context, KNativePointer node, KNativePointer signature)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    auto _signature = reinterpret_cast<es2panda_Signature*>(signature);
    GetImpl()->ScriptFunctionSetSignature(_context, _node, _signature);
    return;
}
KOALA_INTEROP_V3(Checker_ScriptFunctionSetSignature, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_SignatureReturnType(KNativePointer context, KNativePointer signature)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _signature = reinterpret_cast<es2panda_Signature*>(signature);
    return GetImpl()->SignatureReturnType(_context, _signature);
}
KOALA_INTEROP_2(Checker_SignatureReturnType, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_ScriptFunctionGetPreferredReturnType(KNativePointer context, KNativePointer node)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    return GetImpl()->ScriptFunctionGetPreferredReturnType(_context, _node);
}
KOALA_INTEROP_2(Checker_ScriptFunctionGetPreferredReturnType, KNativePointer, KNativePointer, KNativePointer)

void impl_Checker_ScriptFunctionSetPreferredReturnType(KNativePointer context, KNativePointer node,
    KNativePointer type
)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    auto _type = reinterpret_cast<es2panda_Type*>(type);
    GetImpl()->ScriptFunctionSetPreferredReturnType(_context, _node, _type);
    return;
}
KOALA_INTEROP_V3(Checker_ScriptFunctionSetPreferredReturnType, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_ExpressionGetPreferredType(KNativePointer context, KNativePointer node)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    return GetImpl()->ExpressionPreferredTypeConst(_context, _node);
}
KOALA_INTEROP_2(Checker_ExpressionGetPreferredType, KNativePointer, KNativePointer, KNativePointer)

void impl_Checker_ExpressionSetPreferredType(KNativePointer context, KNativePointer node, KNativePointer type)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _node = reinterpret_cast<es2panda_AstNode*>(node);
    auto _type = reinterpret_cast<es2panda_Type*>(type);
    GetImpl()->ExpressionSetPreferredType(_context, _node, _type);
    return;
}
KOALA_INTEROP_V3(Checker_ExpressionSetPreferredType, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_TypeToString(KNativePointer context, KNativePointer type)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _type = reinterpret_cast<es2panda_Type*>(type);
    auto result = GetImpl()->TypeToStringConst(_context, _type);
    return StageArena::strdup(result);
}
KOALA_INTEROP_2(Checker_TypeToString, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_TypeClone(KNativePointer context, KNativePointer type)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _type = reinterpret_cast<es2panda_Type*>(type);
    return GetImpl()->TypeClone(_context, _type);
}
KOALA_INTEROP_2(Checker_TypeClone, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_Checker_TypeNodeGetType(KNativePointer context, KNativePointer astNode)
{
    auto _context = reinterpret_cast<es2panda_Context*>(context);
    auto _astNode = reinterpret_cast<es2panda_AstNode*>(astNode);
    return GetImpl()->TypeNodeGetType(_context, _astNode);
}
KOALA_INTEROP_2(Checker_TypeNodeGetType, KNativePointer, KNativePointer, KNativePointer)

// From koala-wrapper
// Improve: check if some code should be generated

std::set<std::string> globalStructInfo;
#ifdef _GLIBCXX_HAS_GTHREADS
std::mutex g_structMutex;
#endif

void impl_InsertGlobalStructInfo(KNativePointer contextPtr, KStringPtr& instancePtr)
{
#ifdef _GLIBCXX_HAS_GTHREADS
    std::lock_guard<std::mutex> lock(g_structMutex);
#endif
    globalStructInfo.insert(getStringCopy(instancePtr));
    return;
}
KOALA_INTEROP_V2(InsertGlobalStructInfo, KNativePointer, KStringPtr);

KBoolean impl_HasGlobalStructInfo(KNativePointer contextPtr, KStringPtr& instancePtr)
{
#ifdef _GLIBCXX_HAS_GTHREADS
    std::lock_guard<std::mutex> lock(g_structMutex);
#endif
    return globalStructInfo.count(getStringCopy(instancePtr));
}
KOALA_INTEROP_2(HasGlobalStructInfo, KBoolean, KNativePointer, KStringPtr);

KNativePointer impl_ClassVariableDeclaration(KNativePointer context, KNativePointer classInstance)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _classInstance = reinterpret_cast<es2panda_AstNode*>(classInstance);
    auto _typedTsType = GetImpl()->TypedTsType(_context, _classInstance);
    if (_typedTsType == nullptr) {
        return nullptr;
    }
    const auto _instanceType = reinterpret_cast<es2panda_Type*>(_typedTsType);
    auto _typeVar = GetImpl()->TypeVariable(_context, _instanceType);
    if (_typeVar == nullptr) {
        return nullptr;
    }
    const auto result = reinterpret_cast<es2panda_Declaration*>(GetImpl()->VariableDeclaration(_context, _typeVar));
    const auto declNode = GetImpl()->DeclNode(_context, result);
    return declNode;
}
KOALA_INTEROP_2(ClassVariableDeclaration, KNativePointer, KNativePointer, KNativePointer)

KNativePointer impl_TSInterfaceBodyBodyPtr(KNativePointer context, KNativePointer receiver)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _receiver = reinterpret_cast<es2panda_AstNode*>(receiver);
    std::size_t length;
    auto result = GetImpl()->TSInterfaceBodyBodyPtr(_context, _receiver, &length);
    return StageArena::cloneVector(result, length);
}
KOALA_INTEROP_2(TSInterfaceBodyBodyPtr, KNativePointer, KNativePointer, KNativePointer);

KNativePointer impl_AnnotationDeclarationPropertiesPtrConst(KNativePointer context, KNativePointer receiver)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _receiver = reinterpret_cast<es2panda_AstNode*>(receiver);
    std::size_t length;
    auto result = GetImpl()->AnnotationDeclarationPropertiesPtrConst(_context, _receiver, &length);
    return StageArena::cloneVector(result, length);
}
KOALA_INTEROP_2(AnnotationDeclarationPropertiesPtrConst, KNativePointer, KNativePointer, KNativePointer);

KNativePointer impl_ETSParserGetGlobalProgramAbsName(KNativePointer contextPtr)
{
    auto context = reinterpret_cast<es2panda_Context*>(contextPtr);
    auto result = GetImpl()->ETSParserGetGlobalProgramAbsName(context);
    return new std::string(result);
}
KOALA_INTEROP_1(ETSParserGetGlobalProgramAbsName, KNativePointer, KNativePointer)

KNativePointer impl_CreateDiagnosticKind(KNativePointer context, KStringPtr& message, KInt type)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _message = getStringCopy(message);
    const auto _type = static_cast<es2panda_PluginDiagnosticType>(type);
    return const_cast<es2panda_DiagnosticKind *>(GetImpl()->CreateDiagnosticKind(_context, _message, _type));
}
KOALA_INTEROP_3(CreateDiagnosticKind, KNativePointer, KNativePointer, KStringPtr, KInt)

KNativePointer impl_CreateDiagnosticInfo(KNativePointer context, KNativePointer kind, KStringArray argsPtr,
                                         KInt argc, KNativePointer pos)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _kind = reinterpret_cast<es2panda_DiagnosticKind*>(kind);
    const auto _pos = reinterpret_cast<es2panda_SourcePosition *>(pos);
    const std::size_t headerLen = 4;
    const char** _args = new const char*[argc];
    std::size_t position = headerLen;
    std::size_t strLen;
    for (std::size_t i = 0; i < static_cast<std::size_t>(argc); ++i) {
        strLen = unpackUInt(argsPtr + position);
        position += headerLen;
        _args[i] = strdup(std::string(reinterpret_cast<const char*>(argsPtr + position), strLen).c_str());
        position += strLen;
    }
    return GetImpl()->CreateDiagnosticInfo(_context, _kind, _args, argc, _pos);
}
KOALA_INTEROP_5(CreateDiagnosticInfo, KNativePointer, KNativePointer, KNativePointer,
                KStringArray, KInt, KNativePointer)

KNativePointer impl_CreateSuggestionInfo(KNativePointer context, KNativePointer kind, KStringArray argsPtr,
    KInt argc, KStringPtr& substitutionCode, KStringPtr& title, KNativePointer range
)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _kind = reinterpret_cast<es2panda_DiagnosticKind *>(kind);
    const auto _title = getStringCopy(title);
    const auto _range = reinterpret_cast<es2panda_SourceRange *>(range);
    const std::size_t headerLen = 4;
    const char** _args = new const char*[argc];
    std::size_t position = headerLen;
    std::size_t strLen;
    for (std::size_t i = 0; i < static_cast<std::size_t>(argc); ++i) {
        strLen = unpackUInt(argsPtr + position);
        position += headerLen;
        _args[i] = strdup(std::string(reinterpret_cast<const char*>(argsPtr + position), strLen).c_str());
        position += strLen;
    }
    const auto _substitutionCode = getStringCopy(substitutionCode);
    return GetImpl()->CreateSuggestionInfo(_context, _kind, _args, argc, _substitutionCode, _title, _range);
}
KOALA_INTEROP_7(CreateSuggestionInfo, KNativePointer, KNativePointer, KNativePointer, KStringArray, KInt,
                KStringPtr, KStringPtr, KNativePointer)

void impl_LogDiagnostic(KNativePointer context, KNativePointer kind, KStringArray argvPtr,
                        KInt argc, KNativePointer pos)
{
    auto&& _context_ = reinterpret_cast<es2panda_Context *>(context);
    auto&& _kind_ = reinterpret_cast<es2panda_DiagnosticKind *>(kind);
    auto&& _pos_ = reinterpret_cast<es2panda_SourcePosition *>(pos);
    const std::size_t headerLen = 4;
    const char** argv = new const char*[argc];
    std::size_t position = headerLen;
    std::size_t strLen;
    for (std::size_t i = 0; i < static_cast<std::size_t>(argc); ++i) {
        strLen = unpackUInt(argvPtr + position);
        position += headerLen;
        argv[i] = strdup(std::string(reinterpret_cast<const char*>(argvPtr + position), strLen).c_str());
        position += strLen;
    }
    GetImpl()->LogDiagnostic(_context_, _kind_, argv, argc, _pos_);
}
KOALA_INTEROP_V5(LogDiagnostic, KNativePointer, KNativePointer, KStringArray, KInt, KNativePointer)

KNativePointer impl_AnnotationUsageIrPropertiesPtrConst(KNativePointer context, KNativePointer receiver)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _receiver = reinterpret_cast<es2panda_AstNode*>(receiver);
    std::size_t length;
    auto result = GetImpl()->AnnotationUsageIrPropertiesPtrConst(_context, _receiver, &length);
    return StageArena::cloneVector(result, length);
}
KOALA_INTEROP_2(AnnotationUsageIrPropertiesPtrConst, KNativePointer, KNativePointer, KNativePointer);

KInt impl_GenerateTsDeclarationsFromContext(KNativePointer contextPtr, KStringPtr& outputDeclEts, KStringPtr& outputEts,
    KBoolean exportAll, KBoolean isolated, KStringPtr& recordFile, KBoolean genAnnotations)
{
    auto context = reinterpret_cast<es2panda_Context *>(contextPtr);
    return GetImpl()->GenerateTsDeclarationsFromContext(context, outputDeclEts.data(), outputEts.data(),
        exportAll, isolated, recordFile.data(), genAnnotations);
}
KOALA_INTEROP_7(GenerateTsDeclarationsFromContext, KInt, KNativePointer, KStringPtr,
                KStringPtr, KBoolean, KBoolean, KStringPtr, KBoolean)

// Improve: simplify
KNativePointer impl_CreateContextGenerateAbcForExternalSourceFiles(
    KNativePointer configPtr, KInt fileNamesCount, KStringArray fileNames)
{
    auto config = reinterpret_cast<es2panda_Config *>(configPtr);
    const std::size_t headerLen = 4;
    const char **argv =
        new const char *[static_cast<unsigned int>(fileNamesCount)];
    std::size_t position = headerLen;
    std::size_t strLen;
    for (std::size_t i = 0; i < static_cast<std::size_t>(fileNamesCount); ++i) {
        strLen = unpackUInt(fileNames + position);
        position += headerLen;
        argv[i] = strdup(
            std::string(reinterpret_cast<const char *>(fileNames + position),
                        strLen)
                .c_str());
        position += strLen;
    }
    return GetImpl()->CreateContextGenerateAbcForExternalSourceFiles(
        config, fileNamesCount, argv);
}
KOALA_INTEROP_3(CreateContextGenerateAbcForExternalSourceFiles, KNativePointer, KNativePointer, KInt, KStringArray)

KInt impl_GetCompilationMode(KNativePointer configPtr)
{
    auto _config = reinterpret_cast<es2panda_Config *>(configPtr);
    auto _options = const_cast<es2panda_Options *>(GetImpl()->ConfigGetOptions(_config));
    return GetImpl()->OptionsUtilGetCompilationModeConst(nullptr, _options);
}
KOALA_INTEROP_1(GetCompilationMode, KInt, KNativePointer)

KNativePointer impl_CreateTypeNodeFromTsType(KNativePointer context, KNativePointer nodePtr)
{
    const auto _context = reinterpret_cast<es2panda_Context*>(context);
    const auto _nodePtr = reinterpret_cast<es2panda_AstNode*>(nodePtr);
    auto _tsType = GetImpl()->TypedTsType(_context, _nodePtr);
    if (_tsType == nullptr) {
        _tsType = GetImpl()->ExpressionTsType(_context, _nodePtr);
    }
    if (_tsType == nullptr) {
        return nullptr;
    }
    const auto _nodeTsType = reinterpret_cast<es2panda_Type*>(_tsType);
    auto _typeAnnotation = GetImpl()->CreateOpaqueTypeNode(_context, _nodeTsType);
    return _typeAnnotation;
}
KOALA_INTEROP_2(CreateTypeNodeFromTsType, KNativePointer, KNativePointer, KNativePointer)