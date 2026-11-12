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

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const COMPILER_ROOT = path.resolve(__dirname, '../../../..');
const DIRECTION = '12-to-11';
const FAILURE_CATEGORIES = new Set(['implementation', 'existing', 'environment']);

class StageFailure extends Error {
  constructor(stage, category, code, message, details = {}) {
    super(message);
    this.name = 'StageFailure';
    this.stage = stage;
    this.category = category;
    this.code = code;
    this.details = details;
    validateFailure(this);
  }
}

function validateFailure(failure) {
  assert.strictEqual(typeof failure.stage, 'string');
  assert.ok(failure.stage.length > 0, 'failure stage must not be empty');
  assert.ok(FAILURE_CATEGORIES.has(failure.category), `invalid category: ${failure.category}`);
  assert.strictEqual(typeof failure.code, 'string');
  assert.ok(failure.code.length > 0, 'failure code must not be empty');
}

function fail(stage, category, code, message, details) {
  throw new StageFailure(stage, category, code, message, details);
}

function safeRelativePath(relativePath) {
  assert.strictEqual(typeof relativePath, 'string');
  assert.ok(relativePath.length > 0, 'materialized path must not be empty');
  assert.ok(!path.isAbsolute(relativePath), `absolute materialized path: ${relativePath}`);
  const normalized = path.normalize(relativePath);
  assert.ok(normalized !== '..' && !normalized.startsWith(`..${path.sep}`),
    `materialized path escapes workspace: ${relativePath}`);
  return normalized;
}

function writeFile(root, relativePath, content) {
  const normalized = safeRelativePath(relativePath);
  const destination = path.join(root, normalized);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, content);
  return destination;
}

function materializeFiles(root, files) {
  const written = [];
  for (const relativePath of Object.keys(files).sort()) {
    const content = files[relativePath];
    assert.ok(typeof content === 'string' || Buffer.isBuffer(content),
      `unsupported content for ${relativePath}`);
    written.push(writeFile(root, relativePath, content));
  }
  return written;
}

function createWorkspace(caseName, options = {}) {
  const safeName = caseName.replace(/[^a-zA-Z0-9_.-]/g, '-');
  const parent = options.parent || process.env.INTEROP_UI_WORK_ROOT || os.tmpdir();
  fs.mkdirSync(parent, { recursive: true });
  const root = fs.mkdtempSync(path.join(parent, `interop-ui-${safeName}-`));
  const artifacts = [];
  let cleaned = false;
  return {
    root,
    artifacts,
    write(relativePath, content) {
      const destination = writeFile(root, relativePath, content);
      artifacts.push(destination);
      return destination;
    },
    materialize(files) {
      const written = materializeFiles(root, files);
      artifacts.push(...written);
      return written;
    },
    record(relativePath) {
      const destination = path.join(root, safeRelativePath(relativePath));
      if (fs.existsSync(destination)) {
        artifacts.push(destination);
      }
      return destination;
    },
    cleanup() {
      if (!cleaned && !options.keep && process.env.INTEROP_UI_KEEP_TEMP !== '1') {
        fs.rmSync(root, { recursive: true, force: true });
        cleaned = true;
      }
    }
  };
}

async function executeCase(definition, body, options = {}) {
  const workspace = createWorkspace(definition.name, options);
  const stages = [];
  const context = {
    workspace,
    options,
    passStage(stage, details = {}) {
      stages.push({ stage, status: 'passed', ...details });
    },
    failStage(stage, error) {
      const failure = normalizeFailure(error);
      stages.push({
        stage,
        status: 'failed',
        code: failure.code,
        category: failure.category
      });
    }
  };
  try {
    const details = await body(context);
    workspace.cleanup();
    return {
      ...definition,
      status: 'passed',
      stages,
      artifacts: workspace.artifacts,
      ...(details || {})
    };
  } catch (error) {
    const failure = normalizeFailure(error);
    if (!stages.some(item => item.status === 'failed' && item.stage === failure.stage &&
      item.code === failure.code)) {
      stages.push({ stage: failure.stage, status: 'failed', code: failure.code });
    }
    workspace.cleanup();
    return {
      ...definition,
      status: 'failed',
      failure,
      stages,
      artifacts: workspace.artifacts,
      diagnostics: error.diagnostics
    };
  }
}

function normalizeFailure(error) {
  if (error instanceof StageFailure) {
    return {
      stage: error.stage,
      category: error.category,
      code: error.code,
      message: error.message,
      details: error.details
    };
  }
  return {
    stage: error.stage || 'assertion',
    category: error.category || 'implementation',
    code: error.code || error.name || 'Error',
    message: error.message || String(error),
    details: error.details || {}
  };
}

function normalizeText(text) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim();
}

function assertFragments(actual, fragments, label) {
  const normalized = normalizeText(actual);
  for (const fragment of fragments) {
    assert.ok(normalized.includes(normalizeText(fragment)),
      `${label} missing fragment:\n${fragment}\nactual:\n${normalized}`);
  }
}

function assertForbidden(actual, fragments, label) {
  const normalized = normalizeText(actual);
  for (const fragment of fragments) {
    assert.ok(!normalized.includes(normalizeText(fragment)),
      `${label} contains forbidden fragment:\n${fragment}\nactual:\n${normalized}`);
  }
}

function readNonemptyFile(filePath, stage = 'artifact') {
  if (!fs.existsSync(filePath)) {
    fail(stage, 'implementation', 'MISSING_ARTIFACT', `missing artifact: ${filePath}`, { filePath });
  }
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size === 0) {
    fail(stage, 'implementation', 'EMPTY_ARTIFACT', `empty artifact: ${filePath}`, { filePath });
  }
  return fs.readFileSync(filePath, 'utf8');
}

function readJsonFile(filePath, stage) {
  const content = readNonemptyFile(filePath, stage);
  try {
    return JSON.parse(content);
  } catch (error) {
    return fail(stage, 'implementation', 'INVALID_JSON', `${filePath}: ${error.message}`, { filePath });
  }
}

function runProcess(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env || process.env,
    encoding: 'utf8',
    timeout: options.timeout || 120000,
    maxBuffer: 32 * 1024 * 1024,
    windowsHide: true
  });
  return {
    command,
    args,
    status: result.status,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    output: `${result.stdout || ''}${result.stderr || ''}`
  };
}

function requireExecutable(filePath, variableName, stage = 'toolchain') {
  if (!filePath) {
    fail(stage, 'environment', 'MISSING_TOOL_PATH', `set ${variableName} to an executable path`, {
      variableName
    });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(stage, 'environment', 'TOOL_NOT_FOUND', `${variableName} does not name a file: ${filePath}`, {
      variableName,
      filePath
    });
  }
  try {
    fs.accessSync(filePath, fs.constants.X_OK);
  } catch (error) {
    fail(stage, 'environment', 'TOOL_NOT_EXECUTABLE', `${variableName} is not executable: ${filePath}`, {
      variableName,
      filePath
    });
  }
  return filePath;
}

function requireFile(filePath, variableName, stage = 'toolchain') {
  if (!filePath) {
    fail(stage, 'environment', 'MISSING_TOOL_PATH', `set ${variableName} to a file path`, {
      variableName
    });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    fail(stage, 'environment', 'TOOL_NOT_FOUND', `${variableName} does not name a file: ${filePath}`, {
      variableName,
      filePath
    });
  }
  return filePath;
}

function requireDirectory(filePath, variableName, stage = 'toolchain') {
  if (!filePath) {
    fail(stage, 'environment', 'MISSING_TOOL_PATH', `set ${variableName} to a directory`, {
      variableName
    });
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isDirectory()) {
    fail(stage, 'environment', 'TOOL_NOT_FOUND', `${variableName} does not name a directory: ${filePath}`, {
      variableName,
      filePath
    });
  }
  return filePath;
}

function versionText(result) {
  return normalizeText(result.output).split('\n')[0] || 'unknown';
}

module.exports = {
  COMPILER_ROOT,
  DIRECTION,
  StageFailure,
  assert,
  assertForbidden,
  assertFragments,
  createWorkspace,
  executeCase,
  fail,
  materializeFiles,
  normalizeFailure,
  normalizeText,
  readJsonFile,
  readNonemptyFile,
  requireDirectory,
  requireExecutable,
  requireFile,
  runProcess,
  safeRelativePath,
  validateFailure,
  versionText,
  writeFile
};
