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
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { TestFailure, writeJson } = require('./harness');
const DEFAULT_TIMEOUT_MS = 300000;
const MAX_OUTPUT_BYTES = 128 * 1024 * 1024;
function executableName(baseName) {
  return process.platform === 'win32' ? `${baseName}.exe` : baseName;
}
function isFile(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
function isDirectory(directory) {
  try {
    return fs.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}
function requireFile(map, key, filePath, variable) {
  map[key] = filePath;
  if (!filePath || !isFile(filePath)) {
    map.missing.push({ key, path: filePath || null, variable });
  }
}
function requireDirectory(map, key, directory, variable) {
  map[key] = directory;
  if (!directory || !isDirectory(directory)) {
    map.missing.push({ key, path: directory || null, variable });
  }
}
function resolveSdkHome(env) {
  return env.INTEROP_UI_SDK || env.INTEROP_UI_SDK_HOME || env.DEVECO_SDK_HOME || '';
}
function resolveToolchain(env = process.env) {
  const sdkHome = resolveSdkHome(env);
  const javaHome = env.INTEROP_UI_JAVA_HOME || env.JAVA_HOME || '';
  const node = env.INTEROP_UI_NODE || process.execPath;
  const hvigor = env.INTEROP_UI_HVIGOR || '';
  const ohpm = env.INTEROP_UI_OHPM || '';
  const openHarmony = sdkHome ? path.join(sdkHome, 'default/openharmony') : '';
  const staticRoot = openHarmony ? path.join(openHarmony, 'ets/static') : '';
  const dynamicRoot = openHarmony ? path.join(openHarmony, 'ets/dynamic') : '';
  const staticBin = staticRoot ? path.join(staticRoot, 'build-tools/ets2panda/bin') : '';
  const dynamicTools = openHarmony ? path.join(openHarmony, 'toolchains') : '';
  const result = {
    sdkHome,
    javaHome,
    node,
    hvigor,
    ohpm,
    unzip: env.INTEROP_UI_UNZIP || 'unzip',
    zipinfo: env.INTEROP_UI_ZIPINFO || 'zipinfo',
    timeoutMs: Number(env.INTEROP_UI_BUILD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    missing: []
  };
  requireDirectory(result, 'sdkHome', sdkHome, 'INTEROP_UI_SDK_HOME');
  requireDirectory(result, 'javaHome', javaHome, 'INTEROP_UI_JAVA_HOME');
  requireFile(result, 'node', node, 'INTEROP_UI_NODE');
  requireFile(result, 'hvigor', hvigor, 'INTEROP_UI_HVIGOR');
  requireFile(result, 'ohpm', ohpm, 'INTEROP_UI_OHPM');
  requireFile(result, 'java',
    javaHome ? path.join(javaHome, 'bin', executableName('java')) : '', 'INTEROP_UI_JAVA_HOME');
  requireFile(result, 'staticDisassembler',
    staticBin ? path.join(staticBin, executableName('ark_disasm')) : '', 'INTEROP_UI_SDK_HOME');
  requireFile(result, 'dynamicDisassembler',
    dynamicTools ? path.join(dynamicTools, executableName('ark_disasm')) : '', 'INTEROP_UI_SDK_HOME');
  requireFile(result, 'es2panda',
    staticBin ? path.join(staticBin, executableName('es2panda')) : '', 'INTEROP_UI_SDK_HOME');
  requireFile(result, 'dynamicCompilePlugin',
    dynamicRoot ? path.join(dynamicRoot, 'build-tools/ets-loader/compile_plugin.js') : '',
    'INTEROP_UI_SDK_HOME');
  const pluginRoot = staticRoot ? path.join(staticRoot, 'build-tools/ui-plugins/lib') : '';
  for (const plugin of ['ui-plugins', 'ui-syntax-plugins', 'interop-plugins']) {
    requireFile(result, `${plugin}Entry`,
      pluginRoot ? path.join(pluginRoot, plugin, 'index.js') : '', 'INTEROP_UI_SDK_HOME');
  }
  if (!Number.isFinite(result.timeoutMs) || result.timeoutMs <= 0) {
    result.missing.push({
      key: 'timeoutMs',
      path: String(result.timeoutMs),
      variable: 'INTEROP_UI_BUILD_TIMEOUT_MS'
    });
  }
  if (result.missing.length > 0) {
    const details = result.missing.map(item =>
      `${item.key} (${item.variable}): ${item.path || 'not configured'}`).join('; ');
    const failure = new TestFailure(`Missing required compile tools: ${details}`, {
      missing: result.missing
    });
    failure.stage = 'toolchain';
    failure.category = 'environment';
    failure.code = 'MISSING_COMPILE_TOOLS';
    throw failure;
  }
  delete result.missing;
  result.nodeHome = path.dirname(path.dirname(node));
  result.sdkPackageJson = path.join(openHarmony, 'ets/oh-uni-package.json');
  result.hvigorPackageJson = path.join(path.dirname(hvigor), '../hvigor/package.json');
  return result;
}
function quoteArgument(argument) {
  const value = String(argument);
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ?
    value : `'${value.replace(/'/g, `'\\''`)}'`;
}
function runProcess(options) {
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  fs.mkdirSync(path.dirname(options.logPath), { recursive: true });
  const commandLine = [options.command, ...options.args].map(quoteArgument).join(' ');
  writeJson(`${options.logPath}.command.json`, {
    command: options.command,
    args: options.args,
    cwd: options.cwd,
    timeoutMs: timeout,
    startedAt
  });
  const child = spawnSync(options.command, options.args, {
    cwd: options.cwd,
    env: options.env,
    encoding: options.encoding || 'utf8',
    maxBuffer: MAX_OUTPUT_BYTES,
    timeout,
    windowsHide: true
  });
  const binary = options.encoding === 'buffer';
  const stdout = child.stdout || (binary ? Buffer.alloc(0) : '');
  const stderr = child.stderr || (binary ? Buffer.alloc(0) : '');
  const stdoutText = binary ? stdout.toString('utf8') : stdout;
  const stderrText = binary ? stderr.toString('utf8') : stderr;
  fs.writeFileSync(options.logPath,
    `$ ${commandLine}\n\n[stdout]\n${stdoutText}\n[stderr]\n${stderrText}\n`, 'utf8');
  const record = {
    command: options.command,
    args: options.args,
    cwd: options.cwd,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - startMs,
    exitCode: typeof child.status === 'number' ? child.status : 1,
    signal: child.signal || null,
    timedOut: Boolean(child.error && child.error.code === 'ETIMEDOUT'),
    spawnError: child.error ? child.error.message : null,
    logPath: options.logPath,
    commandRecord: `${options.logPath}.command.json`
  };
  writeJson(`${options.logPath}.result.json`, record);
  return { record, stdout, stderr };
}
function assertProcessSucceeded(result, description) {
  if (result.record.exitCode !== 0 || result.record.spawnError || result.record.timedOut) {
    throw new TestFailure(`${description} failed; see ${result.record.logPath}`, result.record);
  }
  return result.record;
}
function createBuildEnvironment(workspace, tools) {
  const cacheRoot = path.join(workspace, '.cache');
  const directories = {
    home: path.join(cacheRoot, 'home'),
    hvigor: path.join(cacheRoot, 'hvigor'),
    npm: path.join(cacheRoot, 'npm'),
    xdg: path.join(cacheRoot, 'xdg')
  };
  Object.values(directories).forEach(directory => fs.mkdirSync(directory, { recursive: true }));
  const pathValue = [
    path.dirname(tools.node),
    path.join(tools.javaHome, 'bin'),
    process.env.PATH || ''
  ].filter(Boolean).join(path.delimiter);
  return {
    HOME: directories.home,
    HVIGOR_USER_HOME: directories.hvigor,
    DEVECO_SDK_HOME: tools.sdkHome,
    JAVA_HOME: tools.javaHome,
    NODE_HOME: tools.nodeHome,
    npm_config_cache: directories.npm,
    XDG_CACHE_HOME: directories.xdg,
    PATH: pathValue,
    LANG: 'en_US.UTF-8',
    LC_ALL: 'en_US.UTF-8'
  };
}
function executeOhpmInstall(projectRoot, workspace, tools) {
  return runProcess({
    command: tools.ohpm,
    args: ['install'],
    cwd: path.join(projectRoot, 'entry'),
    env: createBuildEnvironment(workspace, tools),
    logPath: path.join(workspace, 'evidence/ohpm-install.log'),
    timeout: tools.timeoutMs
  });
}
function hvigorArguments(task) {
  return [
    '--mode', 'module',
    '-p', 'product=default',
    '-p', 'module=entry@default',
    '-p', 'buildMode=debug',
    task,
    '--no-daemon'
  ];
}
function executeHvigor(projectRoot, workspace, tools, task = 'assembleHap') {
  return runProcess({
    command: tools.node,
    args: [tools.hvigor, ...hvigorArguments(task)],
    cwd: projectRoot,
    env: createBuildEnvironment(workspace, tools),
    logPath: path.join(workspace, 'evidence', `${task}.log`),
    timeout: tools.timeoutMs
  });
}
function executeDisassembler(tools, kind, abcPath, workspace, prefix = '') {
  const executable = kind === 'static' ? tools.staticDisassembler : tools.dynamicDisassembler;
  const basename = path.basename(abcPath, '.abc');
  const outputPath = path.join(workspace, 'evidence', `${prefix}${basename}-${kind}.pa`);
  const result = runProcess({
    command: executable,
    args: [abcPath, outputPath],
    cwd: workspace,
    env: createBuildEnvironment(workspace, tools),
    logPath: `${outputPath}.log`,
    timeout: tools.timeoutMs
  });
  assertProcessSucceeded(result, `${kind} ark_disasm`);
  if (!isFile(outputPath) || fs.statSync(outputPath).size === 0) {
    throw new TestFailure(`Disassembly is missing or empty: ${outputPath}`);
  }
  return { ...result.record, outputPath, content: fs.readFileSync(outputPath, 'utf8') };
}
function executeZipTest(tools, hapPath, workspace) {
  const result = runProcess({
    command: tools.unzip,
    args: ['-t', hapPath],
    cwd: workspace,
    env: process.env,
    logPath: path.join(workspace, 'evidence/hap-unzip-test.log'),
    timeout: tools.timeoutMs
  });
  assertProcessSucceeded(result, 'HAP ZIP CRC validation');
  return result.record;
}
function listZipEntries(tools, hapPath, workspace) {
  const result = runProcess({
    command: tools.zipinfo,
    args: ['-1', hapPath],
    cwd: workspace,
    env: process.env,
    logPath: path.join(workspace, 'evidence/hap-zip-entries.log'),
    timeout: tools.timeoutMs
  });
  assertProcessSucceeded(result, 'HAP ZIP entry listing');
  const entries = result.stdout.split(/\r?\n/).filter(Boolean).sort();
  writeJson(path.join(workspace, 'evidence/hap-zip-entries.json'), entries);
  return entries;
}
function extractZipEntry(tools, hapPath, entryName, outputPath, workspace) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const result = runProcess({
    command: tools.unzip,
    args: ['-p', hapPath, entryName],
    cwd: workspace,
    env: process.env,
    logPath: `${outputPath}.extract.log`,
    timeout: tools.timeoutMs,
    encoding: 'buffer'
  });
  assertProcessSucceeded(result, `Extract ${entryName}`);
  if (!Buffer.isBuffer(result.stdout) || result.stdout.length === 0) {
    throw new TestFailure(`ZIP entry is empty: ${entryName}`);
  }
  fs.writeFileSync(outputPath, result.stdout);
  return outputPath;
}
function readPackageVersion(packageJson) {
  if (!isFile(packageJson)) {
    return { path: packageJson, version: null };
  }
  const value = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
  return {
    path: packageJson,
    name: value.name || value.displayName || null,
    version: value.version || null,
    apiVersion: value.apiVersion || null
  };
}
function readToolchainVersions(tools) {
  const node = spawnSync(tools.node, ['--version'], { encoding: 'utf8' });
  const java = spawnSync(tools.java, ['-version'], { encoding: 'utf8' });
  const ohpm = spawnSync(tools.ohpm, ['--version'], { encoding: 'utf8' });
  return {
    node: {
      path: tools.node,
      version: (node.stdout || node.stderr || '').trim(),
      exitCode: node.status
    },
    java: {
      path: tools.java,
      version: (java.stderr || java.stdout || '').trim().split(/\r?\n/)[0],
      exitCode: java.status
    },
    ohpm: {
      path: tools.ohpm,
      version: (ohpm.stdout || ohpm.stderr || '').trim(),
      exitCode: ohpm.status
    },
    hvigor: {
      entry: tools.hvigor,
      package: readPackageVersion(tools.hvigorPackageJson)
    },
    sdk: readPackageVersion(tools.sdkPackageJson),
    disassemblers: { static: tools.staticDisassembler, dynamic: tools.dynamicDisassembler },
    compilerPlugins: {
      dynamic: tools.dynamicCompilePlugin,
      ui: tools['ui-pluginsEntry'],
      uiSyntax: tools['ui-syntax-pluginsEntry'],
      interop: tools['interop-pluginsEntry']
    }
  };
}
function publicToolchain(versions) {
  return [
    ['node', versions.node.path, versions.node.version],
    ['java', versions.java.path, versions.java.version],
    ['ohpm', versions.ohpm.path, versions.ohpm.version],
    ['hvigor', versions.hvigor.entry, versions.hvigor.package.version],
    ['sdk', versions.sdk.path, versions.sdk.version],
    ['static-ark-disasm', versions.disassemblers.static, 'SDK-matched'],
    ['dynamic-ark-disasm', versions.disassemblers.dynamic, 'SDK-matched']
  ].map(([toolName, toolPath, version]) => ({
    name: toolName,
    path: toolPath,
    version: String(version || 'unknown')
  }));
}
module.exports = {
  DEFAULT_TIMEOUT_MS,
  assertProcessSucceeded,
  createBuildEnvironment,
  executeDisassembler,
  executeHvigor,
  executeOhpmInstall,
  executeZipTest,
  extractZipEntry,
  hvigorArguments,
  isDirectory,
  isFile,
  listZipEntries,
  publicToolchain,
  readToolchainVersions,
  resolveSdkHome,
  resolveToolchain,
  runProcess
};
