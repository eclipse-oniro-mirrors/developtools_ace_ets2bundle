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

'use strict';

const path = require('path');
const {
  COMPILER_ROOT,
  assert
} = require('../static_calls_dynamic_basic/harness');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));

function declarationKey(relativePath) {
  const portable = relativePath.replace(/\\/g, '/');
  if (portable.endsWith('.d.ets')) {
    return portable.slice(0, -'.d.ets'.length);
  }
  const extension = path.posix.extname(portable);
  return extension ? portable.slice(0, -extension.length) : portable;
}

function resolveRelativeModule(fromKey, specifier) {
  if (!specifier.startsWith('.')) {
    return undefined;
  }
  return declarationKey(path.posix.normalize(path.posix.join(path.posix.dirname(fromKey), specifier)));
}

function modifiersOf(statement) {
  if (!ts.canHaveModifiers(statement)) {
    return [];
  }
  return ts.getModifiers(statement) || [];
}

function hasModifier(statement, kind) {
  return modifiersOf(statement).some(modifier => modifier.kind === kind);
}

function declarationKind(statement) {
  if (ts.isStructDeclaration(statement)) {
    return 'struct';
  }
  if (ts.isClassDeclaration(statement)) {
    return 'class';
  }
  if (ts.isInterfaceDeclaration(statement)) {
    return 'interface';
  }
  if (ts.isFunctionDeclaration(statement)) {
    return 'function';
  }
  if (ts.isTypeAliasDeclaration(statement)) {
    return 'type';
  }
  if (ts.isEnumDeclaration(statement)) {
    return 'enum';
  }
  if (ts.isVariableStatement(statement)) {
    return 'variable';
  }
  return 'unknown';
}

function importBindings(statement) {
  const clause = statement.importClause;
  if (!clause) {
    return [];
  }
  const bindings = [];
  if (clause.name) {
    bindings.push({ imported: 'default', local: clause.name.text, kind: 'default' });
  }
  const named = clause.namedBindings;
  if (named && ts.isNamespaceImport(named)) {
    bindings.push({ imported: '*', local: named.name.text, kind: 'namespace' });
  }
  if (named && ts.isNamedImports(named)) {
    for (const element of named.elements) {
      bindings.push({
        imported: element.propertyName ? element.propertyName.text : element.name.text,
        local: element.name.text,
        kind: 'named',
        typeOnly: Boolean(clause.isTypeOnly || element.isTypeOnly)
      });
    }
  }
  return bindings;
}

function exportBindings(statement) {
  if (!statement.exportClause || !ts.isNamedExports(statement.exportClause)) {
    return [];
  }
  return statement.exportClause.elements.map(element => ({
    exported: element.name.text,
    local: element.propertyName ? element.propertyName.text : element.name.text,
    typeOnly: Boolean(statement.isTypeOnly || element.isTypeOnly)
  }));
}

function localDeclarationRecords(statement) {
  const records = [];
  const exported = hasModifier(statement, ts.SyntaxKind.ExportKeyword);
  const isDefault = hasModifier(statement, ts.SyntaxKind.DefaultKeyword);
  if (ts.isVariableStatement(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        records.push({ local: declaration.name.text, kind: 'variable', exported, isDefault });
      }
    }
    return records;
  }
  if (statement.name && ts.isIdentifier(statement.name)) {
    records.push({ local: statement.name.text, kind: declarationKind(statement), exported, isDefault });
  } else if (exported && isDefault) {
    records.push({ local: 'default', kind: declarationKind(statement), exported, isDefault });
  }
  return records;
}

function parseDeclaration(key, content) {
  const sourceFile = ts.createSourceFile(
    `${key}.d.ets`,
    content,
    ts.ScriptTarget.ES2021,
    true,
    ts.ScriptKind.ETS
  );
  const file = {
    key,
    sourceFile,
    imports: [],
    exports: [],
    starExports: [],
    declarations: {}
  };
  let defaultNextDeclaration = false;
  for (const statement of sourceFile.statements) {
    if (ts.isImportDeclaration(statement) && ts.isStringLiteral(statement.moduleSpecifier)) {
      const module = statement.moduleSpecifier.text;
      for (const binding of importBindings(statement)) {
        file.imports.push({ ...binding, module });
      }
      continue;
    }
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      const expression = statement.expression.getText(sourceFile);
      if (expression === 'declare') {
        defaultNextDeclaration = true;
      } else if (ts.isIdentifier(statement.expression)) {
        file.exports.push({ exported: 'default', local: expression, module: undefined, typeOnly: false });
      }
      continue;
    }
    if (ts.isExportDeclaration(statement)) {
      const module = statement.moduleSpecifier && ts.isStringLiteral(statement.moduleSpecifier) ?
        statement.moduleSpecifier.text : undefined;
      if (!statement.exportClause && module) {
        file.starExports.push({ module, typeOnly: Boolean(statement.isTypeOnly) });
      }
      for (const binding of exportBindings(statement)) {
        file.exports.push({ ...binding, module });
      }
      continue;
    }
    for (const record of localDeclarationRecords(statement)) {
      const exported = record.exported || defaultNextDeclaration;
      const isDefault = record.isDefault || defaultNextDeclaration;
      defaultNextDeclaration = false;
      file.declarations[record.local] = { kind: record.kind, name: record.local };
      if (exported) {
        file.exports.push({
          exported: isDefault ? 'default' : record.local,
          local: record.local,
          module: undefined,
          typeOnly: false
        });
      }
    }
  }
  return file;
}

function buildDeclarationGraph(declarations) {
  const graph = {};
  for (const [relativePath, declaration] of Object.entries(declarations)) {
    const key = declarationKey(relativePath);
    const content = typeof declaration === 'string' ? declaration : declaration.content;
    assert.strictEqual(typeof content, 'string', `missing declaration content for ${relativePath}`);
    assert.ok(!graph[key], `duplicate declaration graph key: ${key}`);
    graph[key] = parseDeclaration(key, content);
  }
  return graph;
}

function assertRelativeModulesResolve(graph) {
  const checked = [];
  for (const file of Object.values(graph)) {
    const references = [
      ...file.imports.map(binding => binding.module),
      ...file.exports.filter(binding => binding.module).map(binding => binding.module),
      ...file.starExports.map(binding => binding.module)
    ];
    for (const specifier of references) {
      const resolved = resolveRelativeModule(file.key, specifier);
      if (!resolved) {
        continue;
      }
      assert.ok(graph[resolved], `${file.key} references missing generated module ${specifier} (${resolved})`);
      checked.push({ from: file.key, specifier, resolved });
    }
  }
  return checked;
}

function resolveExport(graph, fromKey, exportedName, trail = []) {
  const file = graph[fromKey];
  assert.ok(file, `export resolution entered missing file ${fromKey}: ${trail.join(' -> ')}`);
  const nextTrail = [...trail, `${fromKey}:${exportedName}`];
  assert.ok(nextTrail.length <= Object.keys(graph).length + 1,
    `cyclic export resolution: ${nextTrail.join(' -> ')}`);
  const direct = file.exports.find(binding => binding.exported === exportedName);
  if (direct) {
    if (!direct.module) {
      const declaration = file.declarations[direct.local];
      assert.ok(declaration, `${fromKey} has no local declaration for ${direct.local}`);
      return { file: fromKey, local: direct.local, kind: declaration.kind, trail: nextTrail };
    }
    const target = resolveRelativeModule(fromKey, direct.module);
    assert.ok(target, `only relative exports are resolved here: ${fromKey} imports ${direct.module}`);
    return resolveExport(graph, target, direct.local, nextTrail);
  }
  if (exportedName !== 'default') {
    for (const star of file.starExports) {
      const target = resolveRelativeModule(fromKey, star.module);
      if (!target || !graph[target]) {
        continue;
      }
      if (listExportedNames(graph, target).includes(exportedName)) {
        return resolveExport(graph, target, exportedName, nextTrail);
      }
    }
  }
  throw new assert.AssertionError({
    message: `${fromKey} does not export ${exportedName}; trail=${nextTrail.join(' -> ')}`
  });
}

function listExportedNames(graph, fromKey, visited = new Set()) {
  if (visited.has(fromKey) || !graph[fromKey]) {
    return [];
  }
  visited.add(fromKey);
  const file = graph[fromKey];
  const names = new Set(file.exports.map(binding => binding.exported));
  for (const star of file.starExports) {
    const target = resolveRelativeModule(fromKey, star.module);
    if (!target) {
      continue;
    }
    for (const name of listExportedNames(graph, target, visited)) {
      if (name !== 'default') {
        names.add(name);
      }
    }
  }
  return Array.from(names).sort();
}

function assertImport(graph, expectation) {
  const file = graph[expectation.file];
  assert.ok(file, `missing graph file ${expectation.file}`);
  const actual = file.imports.find(binding =>
    binding.module === expectation.module &&
    binding.imported === expectation.imported &&
    binding.local === expectation.local);
  assert.ok(actual, `${expectation.file} lacks import ${expectation.imported} as ${expectation.local} ` +
    `from ${expectation.module}; actual=${JSON.stringify(file.imports)}`);
  if (expectation.kind) {
    assert.strictEqual(actual.kind, expectation.kind);
  }
  return actual;
}

function assertExport(graph, expectation) {
  const file = graph[expectation.file];
  assert.ok(file, `missing graph file ${expectation.file}`);
  const actual = file.exports.find(binding =>
    binding.exported === expectation.exported &&
    binding.local === expectation.local &&
    binding.module === expectation.module);
  assert.ok(actual, `${expectation.file} lacks export ${expectation.local} as ${expectation.exported} ` +
    `from ${expectation.module || 'local declarations'}; actual=${JSON.stringify(file.exports)}`);
  return actual;
}

function assertOrigins(graph, expectations) {
  const actual = {};
  for (const [exportedName, expected] of Object.entries(expectations)) {
    const origin = resolveExport(graph, 'Index', exportedName);
    assert.strictEqual(origin.file, expected.file, `${exportedName} resolved to the wrong file`);
    assert.strictEqual(origin.local, expected.local, `${exportedName} resolved to the wrong local symbol`);
    if (expected.kind) {
      assert.strictEqual(origin.kind, expected.kind, `${exportedName} changed declaration kind`);
    }
    actual[exportedName] = origin;
  }
  return actual;
}

module.exports = {
  assertExport,
  assertImport,
  assertOrigins,
  assertRelativeModulesResolve,
  buildDeclarationGraph,
  declarationKey,
  listExportedNames,
  parseDeclaration,
  resolveExport,
  resolveRelativeModule,
  ts
};
