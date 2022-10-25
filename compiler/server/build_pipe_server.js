/*
 * Copyright (c) 2021-2022 Huawei Device Co., Ltd.
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

const WebSocket = require('ws');
const ts = require('typescript');
const path = require('path');
const fs = require('fs');
const pipeProcess = require('child_process');

const { processComponentChild } = require('../lib/process_component_build');
const { createWatchCompilerHost } = require('../lib/ets_checker');
const { writeFileSync } = require('../lib/utils');
const { projectConfig } = require('../main');
const { props } = require('../lib/compile_info');
const {
  isResource,
  processResourceData
} = require('../lib/process_ui_syntax');

const WebSocketServer = WebSocket.Server;

let pluginSocket = '';

let supplement = {
  isAcceleratePreview: false,
  line: 0,
  column: 0,
  fileName: ''
}

const pluginCommandChannelMessageHandlers = {
  'compileComponent': handlePluginCompileComponent,
  'default': () => {}
};
let es2abcFilePath = path.join(__dirname, '../bin/ark/build-win/bin/es2abc');

let previewCacheFilePath;
const messages = [];
let start = false;
let checkStatus = false;
let compileStatus = false;
let receivedMsg_;
let errorInfo;
let compileWithCheck;
let globalVariable = [];
let propertyVariable = [];
let connectNum = 0;
const maxConnectNum = 8;

function init(port) {
  previewCacheFilePath =
    path.join(projectConfig.cachePath || projectConfig.buildPath, 'preview.ets');
  const rootFileNames = [];
  if (!fs.existsSync(previewCacheFilePath)) {
    writeFileSync(previewCacheFilePath, '');
  }
  rootFileNames.push(previewCacheFilePath);
  ts.createWatchProgram(
    createWatchCompilerHost(rootFileNames, resolveDiagnostic, delayPrintLogCount, true));
  const wss = new WebSocketServer({
    port: port,
    host: '127.0.0.1'
  });
  wss.on('connection', function(ws) {
    if (connectNum < maxConnectNum) {
      connectNum++;
      handlePluginConnect(ws);
    } else {
      ws.terminate();
    }
  });
}

function handlePluginConnect(ws) {
  ws.on('message', function(message) {
    pluginSocket = ws;
    const jsonData = JSON.parse(message);
    handlePluginCommand(jsonData);
  });
}

function handlePluginCommand(jsonData) {
  pluginCommandChannelMessageHandlers[jsonData.command]
    ? pluginCommandChannelMessageHandlers[jsonData.command](jsonData)
    : pluginCommandChannelMessageHandlers['default'](jsonData);
}

function handlePluginCompileComponent(jsonData) {
  if (jsonData) {
    messages.push(jsonData);
    if (receivedMsg_) {
      return;
    }
  } else if (messages.length > 0){
    jsonData = messages[0];
  } else {
    return;
  }
  start = true;
  const receivedMsg = jsonData;
  const compilerOptions = ts.readConfigFile(
    path.resolve(__dirname, '../tsconfig.json'), ts.sys.readFile).config.compilerOptions;
    Object.assign(compilerOptions, {
      "sourceMap": false,
    });
  const sourceNode = ts.createSourceFile('preview.ets',
    'struct preview{build(){' + receivedMsg.data.script + '}}',
    ts.ScriptTarget.Latest, true, ts.ScriptKind.ETS, compilerOptions);
  compileWithCheck = jsonData.data.compileWithCheck || 'true';
  checkPreparation(receivedMsg);
  const previewStatements = [];
  const log = [];
  supplement = {
    isAcceleratePreview: true,
    line: parseInt(JSON.parse(receivedMsg.data.offset).line),
    column: parseInt(JSON.parse(receivedMsg.data.offset).column),
    fileName: receivedMsg.data.filePath || ''
  }
  processComponentChild(sourceNode.statements[0].members[1].body, previewStatements, log, supplement);
  supplement.isAcceleratePreview = false;
  const newSource = ts.factory.updateSourceFile(sourceNode, previewStatements);
  const transformedSourceFile = transformResourceNode(newSource);
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const result = printer.printNode(ts.EmitHint.Unspecified, transformedSourceFile, transformedSourceFile);
  receivedMsg.data.script = ts.transpileModule(result, {}).outputText;
  processOffset(receivedMsg, log, sourceNode);
  receivedMsg.data.log = log;
  if (receivedMsg.data.viewID) {
    receivedMsg.data.script = `function quickPreview(context) {
      const fastPreview = function build(){
        ${receivedMsg.data.script}
      }.bind(context);
      fastPreview();
    }
    quickPreview(GetRootView().findChildByIdForPreview(${receivedMsg.data.viewID}))`
  }
  callEs2abc(receivedMsg);
}

function transformResourceNode(newSource) {
  const transformerFactory = (context) => {
    return (rootNode) => {
      function visit(node) {
        node = ts.visitEachChild(node, visit, context);
        return processResourceNode(node);
      }
      return ts.visitNode(rootNode, visit);
    }
  }  
  const transformationResult = ts.transform(newSource, [transformerFactory]);
  return transformationResult.transformed[0];
}

function processResourceNode(node) {
  if (isResource(node)) {
    return processResourceData(node);
  } else {
    return node;
  }
}

function checkPreparation(receivedMsg) {
  if (previewCacheFilePath && fs.existsSync(previewCacheFilePath) && compileWithCheck === 'true') {
    globalVariable = receivedMsg.data.globalVariable || globalVariable;
    propertyVariable = receivedMsg.data.propertyVariable || propertyVariable;
    writeFileSync(previewCacheFilePath, 'struct preview{build(){' + receivedMsg.data.script + '}}');
  }
}

function callEs2abc(receivedMsg) {
  if (fs.existsSync(es2abcFilePath + '.exe') || fs.existsSync(es2abcFilePath)){
    es2abc(receivedMsg);
  } else {
    es2abcFilePath = path.join(__dirname, '../bin/ark/build-mac/bin/es2abc');
    if (fs.existsSync(es2abcFilePath)) {
      es2abc(receivedMsg);
    }
  }
}

function processOffset(receivedMsg, log, sourceNode) {
  if (receivedMsg.data.offset) {
    for (let i = 0; i < log.length; i++) {
      let line = parseInt(sourceNode.getLineAndCharacterOfPosition(log[i].pos).line);
      let column = parseInt(sourceNode.getLineAndCharacterOfPosition(log[i].pos).character);
      if (line === 0) {
        log[i].line = parseInt(JSON.parse(receivedMsg.data.offset).line);
        log[i].column = parseInt(JSON.parse(receivedMsg.data.offset).column) + column - 15;
      } else {
        log[i].line = parseInt(JSON.parse(receivedMsg.data.offset).line) + line;
        log[i].column = column;
      }
    }
  }
}

function es2abc(receivedMsg) {
  const cmd = es2abcFilePath + ' --base64Input ' +
    Buffer.from(receivedMsg.data.script).toString('base64') + ' --base64Output';
  try {
    pipeProcess.exec(cmd, (error, stdout, stderr) => {
      if (stdout) {
        receivedMsg.data.script = stdout;
      } else {
        receivedMsg.data.script = "";
      }
      compileStatus = true;
      receivedMsg_ = receivedMsg;
      responseToPlugin();
    })
  } catch (e) {
  }
}

function resolveDiagnostic(diagnostic) {
  errorInfo = [];
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  if (validateError(message)) {
    if (diagnostic.file) {
      const { line, character } =
        diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errorInfo.push(
          `ETS:ERROR File: ${diagnostic.file.fileName}:${line + 1}:${character + 1}\n ${message}\n`);
    } else {
      errorInfo.push(`ETS:ERROR: ${message}`);
    }
  }
}

function delayPrintLogCount() {
  if (start == true) {
    checkStatus = true;
    responseToPlugin();
  }
}

function responseToPlugin() {
  if ((compileWithCheck !== "true" && compileStatus == true) ||
    (compileWithCheck === "true" && compileStatus == true && checkStatus == true) ) {
    if (receivedMsg_) {
      if (errorInfo) {
        receivedMsg_.data.log =  receivedMsg_.data.log || [];
        receivedMsg_.data.log.push(...errorInfo);
      }
      pluginSocket.send(JSON.stringify(receivedMsg_), (err) => {
        start = false;
        checkStatus = false;
        compileStatus = false;
        errorInfo = undefined;
        receivedMsg_ = undefined;
        messages.shift();
        if (messages.length > 0) {
          handlePluginCompileComponent();
        }
      });
    }
  }
}

function validateError(message) {
  const propInfoReg = /Cannot find name\s*'(\$?\$?[_a-zA-Z0-9]+)'/;
  const stateInfoReg = /Property\s*'(\$?[_a-zA-Z0-9]+)' does not exist on type/;
  if (matchMessage(message, [...globalVariable, ...props], propInfoReg) ||
    matchMessage(message, [...propertyVariable, ...props], stateInfoReg)) {
    return false;
  }
  return true;
}

function matchMessage(message, nameArr, reg) {
  if (reg.test(message)) {
    const match = message.match(reg);
    if (match[1] && nameArr.includes(match[1])) {
      return true;
    }
  }
  return false;
}

module.exports = {
  init
};
