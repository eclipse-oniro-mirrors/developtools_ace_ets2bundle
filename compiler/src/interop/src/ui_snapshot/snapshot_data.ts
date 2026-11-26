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

export function detachUISnapshotData<T>(value: T): T {
  const active: Set<object> = new Set();
  const copies: Map<object, object> = new Map();
  function copy(input: unknown, location: string): unknown {
    if (input === null || input === undefined ||
      ['string', 'number', 'boolean'].includes(typeof input)) {
      return input;
    }
    if (typeof input !== 'object' || active.has(input)) {
      throw new Error(`Unsafe UI snapshot value at ${location}`);
    }
    if (copies.has(input)) {
      return copies.get(input);
    }
    active.add(input);
    try {
      const result: object = copyContainer(input, location, copy);
      copies.set(input, result);
      return result;
    } finally {
      active.delete(input);
    }
  }
  return copy(value, 'snapshot') as T;
}

function rejectSnapshotMutation(): never {
  throw new Error('Published UI snapshot maps are read-only');
}

function freezeSnapshotMap(result: Map<string, unknown>): Map<string, unknown> {
  Object.defineProperties(result, {
    set: { value: rejectSnapshotMutation },
    delete: { value: rejectSnapshotMutation },
    clear: { value: rejectSnapshotMutation }
  });
  return Object.freeze(result);
}

const emptySnapshotMap: Map<string, unknown> = freezeSnapshotMap(new Map());

function copyContainer(input: object, location: string,
  copy: (value: unknown, location: string) => unknown): object {
  if (input instanceof Map && Object.getPrototypeOf(input) === Map.prototype) {
    if (Reflect.ownKeys(input).length) {
      throw new Error(`Unexpected UI snapshot Map fields at ${location}`);
    }
    if (input.size === 0) {
      return emptySnapshotMap;
    }
    const result: Map<string, unknown> = new Map();
    input.forEach((value, key) => {
      if (typeof key !== 'string') {
        throw new Error(`Non-string UI snapshot key at ${location}`);
      }
      result.set(key, copy(value, `${location}[${key}]`));
    });
    return freezeSnapshotMap(result);
  }
  const prototype: object = Object.getPrototypeOf(input);
  if (!Array.isArray(input) && prototype !== Object.prototype && prototype !== null) {
    throw new Error(`Non-data UI snapshot object at ${location}`);
  }
  const result: object = Array.isArray(input) ? [] : {};
  for (const key of Reflect.ownKeys(input)) {
    if (Array.isArray(input) && key === 'length') {
      continue;
    }
    const descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(input, key);
    if (typeof key !== 'string' || !('value' in descriptor)) {
      throw new Error(`Semantic reference or accessor at ${location}.${String(key)}`);
    }
    Object.defineProperty(result, key, {
      value: copy(descriptor.value, `${location}.${key}`), enumerable: true
    });
  }
  return Object.freeze(result);
}
