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

const STATIC_BUILTINS = new Set(['length', 'name', 'prototype']);

function cloneState(value) {
  if (Array.isArray(value)) {
    return value.map(cloneState);
  }
  if (value instanceof Map) {
    return new Map(Array.from(value, ([key, item]) => [cloneState(key), cloneState(item)]));
  }
  if (value instanceof Set) {
    return new Set(Array.from(value, cloneState));
  }
  if (value && typeof value === 'object') {
    const prototype = Object.getPrototypeOf(value);
    if (prototype === Object.prototype || prototype === null) {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, cloneState(item)]));
    }
  }
  return value;
}

function snapshotStaticFields(owner) {
  const snapshot = {};
  for (const key of Object.getOwnPropertyNames(owner)) {
    if (STATIC_BUILTINS.has(key)) {
      continue;
    }
    const descriptor = Object.getOwnPropertyDescriptor(owner, key);
    snapshot[key] = {
      ...descriptor,
      value: cloneState(descriptor.value)
    };
  }
  return snapshot;
}

function restoreStaticFields(owner, snapshot) {
  for (const key of Object.getOwnPropertyNames(owner)) {
    if (!STATIC_BUILTINS.has(key) && !Object.prototype.hasOwnProperty.call(snapshot, key)) {
      assert.ok(delete owner[key], `cannot remove added static field ${key}`);
    }
  }
  for (const [key, descriptor] of Object.entries(snapshot)) {
    Object.defineProperty(owner, key, {
      ...descriptor,
      value: cloneState(descriptor.value)
    });
  }
  assert.deepStrictEqual(snapshotStaticFields(owner), snapshot,
    `static fields were not restored for ${owner.name || 'anonymous owner'}`);
}

function captureDeclgenState(owners) {
  assert.ok(Array.isArray(owners) && owners.length === 3,
    'DeclfileProductor, FileManager and DeclgenLogger snapshots are all required');
  return owners.map(owner => ({
    owner,
    snapshot: snapshotStaticFields(owner)
  }));
}

function restoreDeclgenState(snapshots) {
  const report = [];
  for (let index = snapshots.length - 1; index >= 0; index -= 1) {
    const { owner, snapshot } = snapshots[index];
    restoreStaticFields(owner, snapshot);
    report.push({
      owner: owner.name || 'anonymous',
      fields: Object.keys(snapshot).sort(),
      restored: true
    });
  }
  return report.reverse();
}

module.exports = {
  captureDeclgenState,
  cloneState,
  restoreDeclgenState,
  snapshotStaticFields
};
