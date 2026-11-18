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

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const ts = require(path.join(COMPILER_ROOT, 'node_modules/typescript'));
const { production } = require('../dynamic_calls_static_basic/unit.test');

function findNode(source, predicate) {
  let found;
  function visit(node) {
    if (predicate(node)) {
      found = node;
      return;
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  }
  visit(source);
  if (!found) {
    throw new Error('Fixture did not contain the requested AST node');
  }
  return found;
}

function fixtureProgram(root, fixture) {
  const fileName = path.join(root, 'Host.ts');
  fs.writeFileSync(fileName, fixture.source);
  for (const [relative, content] of Object.entries(fixture.files || {})) {
    const destination = path.resolve(root, relative);
    if (!destination.startsWith(root + path.sep)) {
      throw new Error('Builder fixture dependency escapes its workspace');
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, content);
  }
  const program = ts.createProgram([fileName], {
    target: ts.ScriptTarget.ES2021,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noLib: true,
    experimentalDecorators: true
  });
  const source = program.getSourceFile(fileName);
  if (source.parseDiagnostics.length > 0) {
    throw new Error(JSON.stringify(source.parseDiagnostics.map(diagnostic => diagnostic.messageText)));
  }
  return { program, source, checker: program.getTypeChecker() };
}

function printer(node, source) {
  return ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, node, source);
}

function optionsExpression(source) {
  return findNode(source, node => ts.isReturnStatement(node) &&
    node.expression && ts.isObjectLiteralExpression(node.expression)).expression;
}

function configureCollections(fixture, modules) {
  const { validate, main } = modules;
  validate.linkCollection.clear();
  validate.builderParamObjectCollection.clear();
  validate.linkCollection.set(fixture.component, new Set(fixture.links || []));
  validate.builderParamObjectCollection.set(fixture.component, new Set(fixture.builders || []));
  const componentMap = require(path.join(COMPILER_ROOT, 'lib/component_map'));
  componentMap.STATIC_BUILDER.clear();
  componentMap.INTEROP_TRAILING_LAMBDA.clear();
  for (const name of fixture.staticBuilders || []) {
    componentMap.STATIC_BUILDER.add(name);
  }
  if (fixture.withoutChecker) {
    main.globalProgram.checker = null;
  }
  return componentMap;
}

function optionsSandbox(fixture, component) {
  const calls = [];
  const sandbox = { calls, console: { log() {}, info() {}, error() {} } };
  sandbox[`__Options_${component}`] = class {};
  sandbox.__Interop_createCompatibleStaticState_Internal = value => ({ backing: value });
  for (let arity = 0; arity <= 10; arity += 1) {
    const name = arity === 0 ? '__Interop_transferCompatibleDynamicBuilder_Internal' :
      `__Interop_transferCompatibleDynamicBuilder${arity}_Internal`;
    sandbox[name] = builder => {
      calls.push({ helper: name });
      return (...args) => builder(...args);
    };
  }
  Object.assign(sandbox, fixture.globals || {});
  return sandbox;
}

function evaluateOptions(output, fixture) {
  const sandbox = optionsSandbox(fixture, fixture.component);
  const code = ts.transpileModule(`globalThis.makeFactory = function() { return ${output}; };`, {
    compilerOptions: { target: ts.ScriptTarget.ES2021 }
  }).outputText;
  vm.runInNewContext(code, sandbox, { timeout: 2000 });
  const state = { ...(fixture.state || {}) };
  const factory = sandbox.makeFactory.call(state);
  const values = factory();
  return { values, calls: sandbox.calls };
}

function evaluateBuilder(output, fixture) {
  const sandbox = optionsSandbox(fixture, fixture.component);
  const options = { compilerOptions: { target: ts.ScriptTarget.ES2021 } };
  const hostSource = ts.transpileModule(`${fixture.source}\nglobalThis.HostCtor = Host;`, options).outputText;
  vm.runInNewContext(hostSource, sandbox, { timeout: 2000, filename: 'Host.js' });
  const generated = ts.transpileModule(
    `globalThis.makeFactory = function() { return ${output}; };`, options).outputText;
  vm.runInNewContext(generated, sandbox, { timeout: 2000, filename: 'generated-options.js' });
  const instance = new sandbox.HostCtor();
  const factory = sandbox.makeFactory.call(instance);
  const values = factory();
  const callback = values[fixture.parameter];
  if (typeof callback !== 'function') {
    throw new Error(`Generated ${fixture.parameter} must remain callable`);
  }
  callback(...fixture.arguments);
  return {
    helperCalls: sandbox.calls,
    receiverValue: instance.value,
    received: instance.received,
    presence: values[`__options_has_${fixture.parameter}`],
    factoryStatements: output
  };
}

function transformOptions(root, fixture, modules) {
  const { program, source, checker } = fixtureProgram(root, fixture);
  modules.main.globalProgram.program = program;
  modules.main.globalProgram.checker = checker;
  const componentMap = configureCollections(fixture, modules);
  const options = optionsExpression(source);
  if (fixture.trailingLambda) {
    const declaration = findNode(source, node => ts.isVariableDeclaration(node) &&
      node.name.text === fixture.trailingLambda);
    const trailing = declaration.initializer;
    if (!ts.isArrowFunction(trailing)) {
      throw new Error('A trailing Builder fixture must provide an actual arrow expression');
    }
    componentMap.INTEROP_TRAILING_LAMBDA.set(fixture.builders[0], trailing);
  }
  const generated = modules.component.createStaticComponentOptions(options, fixture.component);
  const output = printer(generated, source);
  fs.writeFileSync(path.join(root, 'options.ts'), output);
  const runtime = fixture.runtimeBuilder ? evaluateBuilder(output, fixture) :
    (fixture.evaluate ? evaluateOptions(output, fixture) : null);
  const returnNode = generated.body.statements[generated.body.statements.length - 1];
  return {
    output,
    runtime,
    statementCount: generated.body.statements.length,
    returnsResult: ts.isReturnStatement(returnNode) && returnNode.expression.text === 'result'
  };
}

function renderCode(root, fixture, modules) {
  const { source } = fixtureProgram(root, fixture);
  const options = optionsExpression(source);
  const name = fixture.component;
  const newNode = ts.factory.createNewExpression(ts.factory.createIdentifier(name), undefined, [
    ts.factory.createIdentifier('undefined'), options, ts.factory.createIdentifier('undefined')
  ]);
  const componentNode = ts.factory.createReturnStatement(
    ts.factory.createCallExpression(ts.factory.createIdentifier(name), undefined, []));
  const tuple = modules.component.createStaticTuple(name);
  const statements = modules.component.createStaticArrowBlock(newNode, options, name, componentNode);
  return `${printer(tuple, source)}\nfunction render(isInitialRender: boolean) {\n` +
    statements.map(statement => printer(statement, source)).join('\n') + '\n}\n';
}

function executeRender(code, fixture) {
  const trace = [];
  const optionsSnapshots = [];
  const sandbox = optionsSandbox(fixture, fixture.component);
  const state = { __interopInStaticRendering_internal_: false, ...(fixture.state || {}) };
  sandbox[fixture.component] = class {
    constructor(first, second) {
      trace.push(['construct', first === undefined, second === undefined]);
    }
  };
  sandbox.__Interop_UpdateInteropExtendableComponent_Internal = host => trace.push(['extend', host === state]);
  sandbox.__Interop_ResetInteropExtendableComponent_Internal = () => trace.push(['reset']);
  sandbox.__Interop_CreateStaticComponent_Internal = (factory, options) => {
    trace.push(['create']);
    factory();
    optionsSnapshots.push(options.call(state));
    return [() => {
      trace.push(['update']);
      optionsSnapshots.push(options.call(state));
    }, 41];
  };
  sandbox.ViewStackProcessor = {
    push(id) {
      trace.push(['push', id]);
    },
    pop() {
      trace.push(['pop']);
    }
  };
  const emitted = ts.transpileModule(code, {
    compilerOptions: { target: ts.ScriptTarget.ES2021 }
  }).outputText;
  vm.runInNewContext(emitted, sandbox, { timeout: 2000 });
  for (const step of fixture.renders) {
    Object.assign(state, step.state || {});
    sandbox.render.call(state, step.initial);
  }
  return { trace, optionsSnapshots, renderingFlag: state.__interopInStaticRendering_internal_ };
}

function transformValidation(root, fixture, modules) {
  const source = ts.createSourceFile(path.join(root, 'Parent.ets'), fixture.source,
    ts.ScriptTarget.ES2021, true, ts.ScriptKind.ETS);
  const call = findNode(source, node => ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) && node.expression.text === fixture.component);
  const log = [];
  const result = modules.component.validateInteropProperty(call, log, fixture.info, fixture.arkoala);
  return { result, log, callStart: call.getStart(source), parentSource: fixture.source };
}

function transformBuilder(root, fixture, modules) {
  const result = transformOptions(root, fixture, modules);
  return result;
}

function worker(request) {
  const modules = production();
  if (request.fixture.operation === 'validation') {
    return transformValidation(request.root, request.fixture, modules);
  }
  if (request.fixture.operation === 'render') {
    const output = renderCode(request.root, request.fixture, modules);
    fs.writeFileSync(path.join(request.root, 'render.ts'), output);
    return { output, runtime: executeRender(output, request.fixture) };
  }
  if (request.fixture.operation === 'builder') {
    return transformBuilder(request.root, request.fixture, modules);
  }
  return transformOptions(request.root, request.fixture, modules);
}

function executeFixture(t, fixture) {
  const processResult = spawnSync(process.execPath, [__filename, '--worker'], {
    input: JSON.stringify({ root: t.workspace, fixture }),
    encoding: 'utf8',
    timeout: 30000,
    maxBuffer: 8 * 1024 * 1024
  });
  t.equal(processResult.status, 0, processResult.stderr || 'component transform worker failed');
  const resultPath = path.join(t.workspace, 'worker-result.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  t.record('actual-component-transform', { resultPath, ...result });
  return result;
}

if (require.main === module && process.argv[2] === '--worker') {
  try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    fs.writeFileSync(path.join(request.root, 'worker-result.json'), JSON.stringify(worker(request), null, 2));
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  }
}

module.exports = { executeFixture, findNode, printer };
