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

import * as ts from 'typescript';

import { projectConfig } from '../main';
import type { ImportTransformResolver } from './utils';
import type { ImportPathExpandDataSource, SymbolInfo } from './import_path_expand';

export const EARLY_RELEASE_CHECKER: string = 'earlyReleaseChecker';

export interface CheckerlessImportTransformHooks {
  expand?: {
    shouldExpandImportDeclaration(node: ts.ImportDeclaration, exclude: string[], projectConfig: Object): boolean;
    getRealFilePath(checker: ts.TypeChecker, moduleSpecifier: ts.StringLiteral, importName: string,
      packageDir: string, depName2DepInfo: Object): SymbolInfo | undefined;
  };
  kit?: {
    isKitImportOrExportDeclaration(node: ts.Node): node is ts.ImportDeclaration | ts.ExportDeclaration;
    shouldSkipKitTypeSymbols(sourceFile: ts.SourceFile, processTs: boolean): boolean;
    isKitTypeSymbol(node: ts.Node, resolver: ImportTransformResolver): boolean;
  };
  lazy?: {
    updateImportDecl(node: ts.ImportDeclaration,
      resolver?: ImportTransformResolver): ts.ImportDeclaration | ts.ImportDeclaration[];
  };
}

interface ResolverPreprocessData {
  isReferenced: WeakMap<ts.Node, boolean>;
  isReferencedAliasDeclaration: WeakMap<ts.Node, boolean>;
  isValueAliasDeclaration: WeakMap<ts.Node, boolean>;
  symbolInfos: WeakMap<ts.StringLiteral, Map<string, SymbolInfo | undefined>>;
}

let preprocessEnabled: boolean = false;
let resolverPreprocessData: ResolverPreprocessData | undefined;
let expandImportPathEnabled: boolean = false;
let importPathExpandProjectConfig: Object | undefined;
let importPathExpandExclude: string[] = [];
let autoLazyImportEnabled: boolean = false;
let importTransformHooks: CheckerlessImportTransformHooks = {};
let getImportTransformHooks: (() => CheckerlessImportTransformHooks) | undefined;

export function registerCheckerlessImportHooks(provider: () => CheckerlessImportTransformHooks): void {
  getImportTransformHooks = provider;
}

export function isEarlyReleaseCheckerEnabled(shareProjectConfig: Object): boolean {
  return shareProjectConfig?.earlyReleaseChecker === true;
}

export function initCheckerlessImportPreprocess(rollupObject: Object): void {
  resetCheckerlessImportTransform();
  if (!isEarlyReleaseCheckerEnabled(rollupObject.share.projectConfig)) {
    return;
  }
  importTransformHooks = getImportTransformHooks();
  preprocessEnabled = true;
  autoLazyImportEnabled = !!rollupObject.share.projectConfig.autoLazyImport;
  const expandImportPath: Object = rollupObject.share.projectConfig.expandImportPath;
  expandImportPathEnabled = !!expandImportPath?.enable;
  if (expandImportPathEnabled) {
    importPathExpandProjectConfig = Object.assign({}, rollupObject.share.projectConfig, rollupObject.share.arkProjectConfig);
    importPathExpandExclude = expandImportPath.exclude ?? [];
  }
  resolverPreprocessData = createResolverPreprocessData();
}

export function preprocessSourceFileForCheckerlessImport(program: ts.Program, sourceFile: ts.SourceFile): void {
  if (!preprocessEnabled || !/(?<!\.d)\.(ets|ts)$/.test(sourceFile.fileName)) {
    return;
  }
  const checker: ts.TypeChecker = program.getTypeChecker();
  const resolver: ts.EmitResolver = checker.getEmitResolver(sourceFile, undefined);
  const recordingResolver = createPreprocessResolver(resolver, resolverPreprocessData!);
  const expandHooks = importTransformHooks.expand!;
  const expandConfig = importPathExpandProjectConfig;
  const expandChecker = expandImportPathEnabled && sourceFile.fileName.endsWith('.ets') ?
    program.getLinterTypeChecker() : checker;
  const shouldPreprocessKit: boolean = importTransformHooks.kit!.shouldSkipKitTypeSymbols(
    sourceFile, projectConfig.processTs);
  const preprocessExpandImport = expandImportPathEnabled ?
    (statement: ts.Statement): void => {
      if (ts.isImportDeclaration(statement) &&
        expandHooks.shouldExpandImportDeclaration(statement, importPathExpandExclude, expandConfig!)) {
        preprocessImportPath(expandChecker, recordingResolver, statement);
      }
    } : undefined;
  const preprocessKit = shouldPreprocessKit ?
    (statement: ts.Statement): void => preprocessKitImport(statement, recordingResolver) : undefined;
  const preprocessLazy = autoLazyImportEnabled ?
    (statement: ts.Statement): void => preprocessLazyImport(statement, recordingResolver) : undefined;
  for (const statement of sourceFile.statements) {
    preprocessExpandImport?.(statement);
    preprocessKit?.(statement);
    preprocessLazy?.(statement);
  }
}

export function resetCheckerlessImportTransform(): void {
  preprocessEnabled = false;
  importTransformHooks = {};
  resolverPreprocessData = undefined;
  expandImportPathEnabled = false;
  importPathExpandProjectConfig = undefined;
  importPathExpandExclude = [];
  autoLazyImportEnabled = false;
}

export function getCheckerlessKitResolver(): ImportTransformResolver | undefined {
  if (!isEarlyReleaseCheckerEnabled(projectConfig)) {
    return undefined;
  }
  return createCheckerlessResolver(resolverPreprocessData!);
}

export function getCheckerlessLazyImportResolver(): ImportTransformResolver | undefined {
  if (!isEarlyReleaseCheckerEnabled(projectConfig) || !autoLazyImportEnabled) {
    return undefined;
  }
  return createCheckerlessResolver(resolverPreprocessData!);
}

export function getCheckerlessImportPathExpandDataSource(): ImportPathExpandDataSource {
  const preprocessData = resolverPreprocessData;
  return {
    resolver: createCheckerlessResolver(preprocessData),
    getRealFilePath: (moduleSpecifier: ts.StringLiteral, importName: string): SymbolInfo | undefined =>
      preprocessData?.symbolInfos.get(moduleSpecifier)?.get(importName)
  };
}

function preprocessImportPath(checker: ts.TypeChecker, resolver: ImportTransformResolver,
  declaration: ts.ImportDeclaration): void {
  const importClause: ts.ImportClause = declaration.importClause!;
  const moduleSpecifier: ts.StringLiteral = declaration.moduleSpecifier as ts.StringLiteral;
  const symbolInfos: Map<string, SymbolInfo | undefined> = new Map();
  resolverPreprocessData!.symbolInfos.set(moduleSpecifier, symbolInfos);

  resolver.isReferenced(importClause);
  resolver.isReferencedAliasDeclaration(importClause);
  if (importClause.name) {
    symbolInfos.set('default', resolveImportPath(checker, moduleSpecifier, 'default'));
  }
  if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings)) {
    for (const element of importClause.namedBindings.elements) {
      resolver.isReferenced(element);
      resolver.isReferencedAliasDeclaration(element);
      const name: string = element.propertyName?.text || element.name.text;
      symbolInfos.set(name, resolveImportPath(checker, moduleSpecifier, name));
    }
  }
}

function resolveImportPath(checker: ts.TypeChecker,
  moduleSpecifier: ts.StringLiteral, importName: string): SymbolInfo | undefined {
  return importTransformHooks.expand!.getRealFilePath(checker, moduleSpecifier, importName,
    importPathExpandProjectConfig!.packageDir, importPathExpandProjectConfig!.depName2DepInfo);
}

function preprocessKitImport(statement: ts.Statement, resolver: ImportTransformResolver): void {
  const kitHooks = importTransformHooks.kit!;
  if (!kitHooks.isKitImportOrExportDeclaration(statement)) {
    return;
  }
  if (ts.isImportDeclaration(statement)) {
    const importClause: ts.ImportClause | undefined = statement.importClause;
    if (!importClause) {
      return;
    }
    if (importClause.namedBindings && ts.isNamedImports(importClause.namedBindings) &&
      !kitHooks.isKitTypeSymbol(statement, resolver)) {
      for (const element of importClause.namedBindings.elements) {
        kitHooks.isKitTypeSymbol(element, resolver);
      }
    }
    if (importClause.name) {
      kitHooks.isKitTypeSymbol(importClause, resolver);
    }
    return;
  }
  if (statement.exportClause && ts.isNamedExports(statement.exportClause) &&
    !kitHooks.isKitTypeSymbol(statement, resolver)) {
    for (const element of statement.exportClause.elements) {
      kitHooks.isKitTypeSymbol(element, resolver);
    }
  }
}

function createPreprocessResolver(resolver: ImportTransformResolver,
  preprocessData: ResolverPreprocessData): ImportTransformResolver {
  return {
    isReferenced: (node: ts.Node): boolean => getOrSetResolverValue(
      preprocessData.isReferenced, node, () => resolver.isReferenced(node)),
    isReferencedAliasDeclaration: (node: ts.Node): boolean => getOrSetResolverValue(
      preprocessData.isReferencedAliasDeclaration, node, () => resolver.isReferencedAliasDeclaration(node)),
    isValueAliasDeclaration: (node: ts.Node): boolean => getOrSetResolverValue(
      preprocessData.isValueAliasDeclaration, node, () => resolver.isValueAliasDeclaration(node))
  };
}

function createResolverPreprocessData(): ResolverPreprocessData {
  return {
    isReferenced: new WeakMap(),
    isReferencedAliasDeclaration: new WeakMap(),
    isValueAliasDeclaration: new WeakMap(),
    symbolInfos: new WeakMap()
  };
}

function createCheckerlessResolver(preprocessData?: ResolverPreprocessData): ImportTransformResolver {
  return {
    isReferenced: (node: ts.Node): boolean => preprocessData?.isReferenced.get(node) ?? false,
    isReferencedAliasDeclaration: (node: ts.Node): boolean =>
      preprocessData?.isReferencedAliasDeclaration.get(node) ?? true,
    isValueAliasDeclaration: (node: ts.Node): boolean =>
      preprocessData?.isValueAliasDeclaration.get(node) ?? true
  };
}

function getOrSetResolverValue(cache: WeakMap<ts.Node, boolean>, node: ts.Node,
  getValue: () => boolean): boolean {
  if (!cache.has(node)) {
    cache.set(node, getValue());
  }
  return cache.get(node)!;
}

function preprocessLazyImport(statement: ts.Statement, resolver: ImportTransformResolver): void {
  if (!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings ||
    !ts.isNamedImports(statement.importClause.namedBindings) || !importTransformHooks.lazy) {
    return;
  }
  importTransformHooks.lazy.updateImportDecl(statement, resolver);
}
