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

const GROUPS = new Set(['unit', 'compile', 'project']);
const DIRECTIONS = new Set(['12-to-11', '11-to-12']);

function parseDirectArguments(argv) {
  const options = {
    group: 'unit',
    direction: undefined,
    keepArtifacts: false
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--keep-artifacts') {
      options.keepArtifacts = true;
      continue;
    }
    if (!['--group', '--direction'].includes(argument)) {
      throw new Error(`unknown argument: ${argument}`);
    }
    index += 1;
    if (index >= argv.length || argv[index].startsWith('--')) {
      throw new Error(`${argument} requires a value`);
    }
    if (argument === '--group') {
      options.group = argv[index];
    } else {
      options.direction = argv[index];
    }
  }
  if (!GROUPS.has(options.group)) {
    throw new Error(`invalid group ${options.group}`);
  }
  if (options.direction && !DIRECTIONS.has(options.direction)) {
    throw new Error(`invalid direction ${options.direction}`);
  }
  return options;
}

function directOptions(argv) {
  const parsed = parseDirectArguments(argv);
  return {
    group: parsed.group,
    direction: parsed.direction,
    keep: parsed.keepArtifacts,
    env: process.env
  };
}

module.exports = {
  DIRECTIONS,
  GROUPS,
  directOptions,
  parseDirectArguments
};
