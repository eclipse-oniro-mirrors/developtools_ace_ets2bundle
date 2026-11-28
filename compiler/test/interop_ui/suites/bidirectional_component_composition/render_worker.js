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
const { production } = require('../dynamic_calls_static_basic/unit.test');
const { ts } = require('../static_multifile_exports/declaration_ast');
const { writeJson } = require('../dynamic_calls_static_basic/harness');

function transform(root, fixture) {
  const { processUISyntax, validate, utils, main } = production();
  const file = path.join(root, 'Page.ets');
  fs.writeFileSync(file, fixture.source);
  main.projectConfig.projectPath = root;
  main.partialUpdateConfig.partialUpdateMode = true;
  process.env.compiler = 'on';
  validate.resetComponentCollection();
  validate.componentCollection.customComponents.clear();
  utils.componentInfo.id = 0;
  utils.storedFileInfo.setCurrentArkTsFile();
  const diagnostics = validate.validateUISyntax(fixture.source, fixture.source, file);
  const compilerRoot = path.resolve(__dirname, '../../../..');
  const config = ts.readConfigFile(path.join(compilerRoot, 'tsconfig.json'), ts.sys.readFile);
  const compilerOptions = { ...config.config.compilerOptions, sourceMap: false, module: ts.ModuleKind.ESNext };
  const transformed = ts.transpileModule(fixture.source, {
    fileName: file, compilerOptions, transformers: { before: [processUISyntax(null, true)] }
  });
  fs.writeFileSync(path.join(root, 'Page.js'), transformed.outputText);
  return { diagnostics, output: transformed.outputText };
}

const { root, fixture } = JSON.parse(fs.readFileSync(0, 'utf8'));
writeJson(path.join(root, 'render-evidence.json'), transform(root, fixture));
