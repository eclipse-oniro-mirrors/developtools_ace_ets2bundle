/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
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

const { initConfig } = require('./lib/fast_build/common/init_config');
const { getCleanConfig } = require('./main');
const { etsTransform, createProgramPlugin } = require('./lib/fast_build/ets_ui/rollup-plugin-ets-typescript');
const { etsChecker } = require('./lib/fast_build/ets_ui/rollup-plugin-ets-checker');
const { apiTransform } = require('./lib/fast_build/system_api/rollup-plugin-system-api');
const { genAbc } = require('./lib/fast_build/ark_compiler/rollup-plugin-gen-abc');
const { watchChangeFiles } = require('./lib/fast_build/common/rollup-plugin-watch-change');
const { visualTransform } = require('./lib/fast_build/visual/rollup-plugin-visual');
const { terserPlugin } = require('./lib/fast_build/ark_compiler/terser-plugin');
const { babelPlugin } = require('./lib/fast_build/ark_compiler/babel-plugin');
const { JSBUNDLE, RELEASE } = require('./lib/fast_build/ark_compiler/common/ark_define');
const { generateConsumerObConfigFile } = require('./lib/fast_build/ark_compiler/common/ob_config_resolver');
const { etsStandaloneChecker } = require('./lib/ets_checker');
const { memoryMonitor } = require('./lib/fast_build/meomry_monitor/rollup-plugin-memory-monitor');

let initConfigForInterop = (interopConfig) => {
  return {};
};

try {
  ({ initConfigForInterop } = require('./lib/fast_build/ark_compiler/interop/interop_manager'));
} catch (err) {
  if (err.code !== 'MODULE_NOT_FOUND') {
    throw err;
  }
}

function initInteropConfig(interopConfig) {
  return initConfigForInterop(interopConfig);
}

exports.initConfig = initConfig;
exports.initInteropConfig = initInteropConfig;
exports.getCleanConfig = getCleanConfig;
exports.generateConsumerObConfigFile = generateConsumerObConfigFile;
exports.etsStandaloneChecker = etsStandaloneChecker;

// list of functional plugins
exports.sdkPlugins = (projectConfig) => {
    return [
        memoryMonitor(),
        watchChangeFiles(),
        etsChecker(),
        visualTransform(),
        etsTransform(),
        apiTransform(),
        genAbc(),
        projectConfig.buildMode?.toLowerCase() === RELEASE && terserPlugin(),
        projectConfig.compileMode === JSBUNDLE && babelPlugin(projectConfig),
        createProgramPlugin()
    ];
};
exports.sdkPluginsMap = {
    'memoryMonitor': 0,
    'watchChangeFiles': 1,
    'etsChecker': 2,
    'visualTransform': 3,
    'etsTransform': 4,
    'apiTransform': 5,
    'genAbc': 6,
    'terserPlugin': 7,
    'babelPlugin': 8,
    'createProgramPlugin': 9
};

exports.resolveFileExtensions = [];
