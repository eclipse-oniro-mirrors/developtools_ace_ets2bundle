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

const fixtures = [
  {
    id: 'missing-all',
    boundary: 'Absent dynamic-to-static outputs retain the documented d.ets fallback path.',
    files: [],
    selected: '.d.ets',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ets-only',
    boundary: 'A sole ETS declaration is selected and its deletion returns to the fallback path.',
    files: [
      '.d.ets'
    ],
    selected: '.d.ets',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ats-only',
    boundary: 'A sole ATS declaration supersedes the absent ETS fallback.',
    files: [
      '.d.ats'
    ],
    selected: '.d.ats',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ets-override-only',
    boundary: 'A user ETS override is selected even when the generated base is absent.',
    files: [
      '.override.d.ets'
    ],
    selected: '.override.d.ets',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ats-override-only',
    boundary: 'A user ATS override is selected even when both generated bases are absent.',
    files: [
      '.override.d.ats'
    ],
    selected: '.override.d.ats',
    afterRemoval: '.d.ets'
  },
  {
    id: 'generated-pair',
    boundary: 'ATS wins when both generated declaration suffixes exist.',
    files: [
      '.d.ets',
      '.d.ats'
    ],
    selected: '.d.ats',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ets-override-over-ets',
    boundary: 'An ETS override wins over its generated ETS base.',
    files: [
      '.d.ets',
      '.override.d.ets'
    ],
    selected: '.override.d.ets',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ets-override-over-ats',
    boundary: 'An ETS override takes precedence over a generated ATS declaration.',
    files: [
      '.d.ats',
      '.override.d.ets'
    ],
    selected: '.override.d.ets',
    afterRemoval: '.d.ats'
  },
  {
    id: 'ats-override-over-ets',
    boundary: 'An ATS override wins over a generated ETS declaration.',
    files: [
      '.d.ets',
      '.override.d.ats'
    ],
    selected: '.override.d.ats',
    afterRemoval: '.d.ets'
  },
  {
    id: 'ats-override-over-ats',
    boundary: 'An ATS override wins over its generated ATS base.',
    files: [
      '.d.ats',
      '.override.d.ats'
    ],
    selected: '.override.d.ats',
    afterRemoval: '.d.ats'
  },
  {
    id: 'override-pair',
    boundary: 'ATS wins between the two user override forms.',
    files: [
      '.override.d.ets',
      '.override.d.ats'
    ],
    selected: '.override.d.ats',
    afterRemoval: '.override.d.ets'
  },
  {
    id: 'all-candidates',
    boundary: 'Selection among all candidates remains stable after deleting the highest-priority file.',
    files: [
      '.d.ets',
      '.d.ats',
      '.override.d.ets',
      '.override.d.ats'
    ],
    selected: '.override.d.ats',
    afterRemoval: '.override.d.ets'
  }
];

module.exports = { fixtures };
