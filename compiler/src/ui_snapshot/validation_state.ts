/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import ts from 'typescript';
import { detachUISnapshotData } from './snapshot_data';

export type ValidationData = null | undefined | string | number | boolean | ValidationContainer;
export interface ValidationContainer {
  kind: 'node' | 'map' | 'set' | 'array' | 'record';
  name?: string;
  values?: ValidationData[];
  fields?: [string, ValidationData][];
  fileName?: string;
  pos?: number;
  end?: number;
  syntaxKind?: number;
}
export interface ValidationCodec {
  classes: Map<string, { new(): object }>;
  resolveNode: (data: ValidationContainer) => ts.Node;
}
export interface ValidationStateBinding {
  replaceMapEntries?: boolean;
  name: string;
  read: () => unknown;
  replace: (value: unknown) => void;
}
export interface ValidationStateChange {
  name: string;
  before: ValidationData;
  after: ValidationData;
}

export function encodeValidationState(value: unknown, codec: ValidationCodec,
  active: Set<object> = new Set()): ValidationData {
  if (value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value)) {
    return value as ValidationData;
  }
  if (typeof value !== 'object' || active.has(value)) {
    throw new Error('Executable or cyclic validation state');
  }
  for (const key of Reflect.ownKeys(value)) {
    if (!('value' in Object.getOwnPropertyDescriptor(value, key))) {
      throw new Error('Validation state accessor');
    }
  }
  if (typeof (value as ts.Node).getSourceFile === 'function' && typeof (value as ts.Node).kind === 'number') {
    const node = ts.getOriginalNode(value as ts.Node);
    const source = node.getSourceFile();
    if (!source || node.pos < 0) {
      throw new Error('Validation state contains an unlocatable AST');
    }
    return { kind: 'node', fileName: source.fileName, pos: node.pos, end: node.end, syntaxKind: node.kind };
  }
  active.add(value);
  try {
    return encodeContainer(value, codec, active);
  } finally {
    active.delete(value);
  }
}

function encodeContainer(value: object, codec: ValidationCodec, active: Set<object>): ValidationContainer {
  const encode = (item: unknown): ValidationData => encodeValidationState(item, codec, active);
  if (value instanceof Map) {
    const fields: [string, ValidationData][] = [];
    value.forEach((item, key) => {
      if (typeof key !== 'string') {
        throw new Error('Validation map keys must be strings');
      }
      fields.push([key, encode(item)]);
    });
    return { kind: 'map', fields };
  }
  if (value instanceof Set || Array.isArray(value)) {
    return { kind: value instanceof Set ? 'set' : 'array', values: Array.from(value, encode) };
  }
  const prototype = Object.getPrototypeOf(value);
  const name = [...codec.classes].find(([, constructor]) => constructor.prototype === prototype)?.[0];
  if (prototype !== Object.prototype && prototype !== null && !name) {
    throw new Error('Unregistered validation state class');
  }
  const fields: [string, ValidationData][] = [];
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !('value' in descriptor)) {
      throw new Error('Validation state accessor or symbol');
    }
    fields.push([key, encode(descriptor.value)]);
  }
  return { kind: 'record', name, fields };
}

export function decodeValidationState(data: ValidationData, codec: ValidationCodec): unknown {
  if (data === null || typeof data !== 'object') {
    return data;
  }
  const decode = (item: ValidationData): unknown => decodeValidationState(item, codec);
  if (data.kind === 'node') {
    return codec.resolveNode(data);
  }
  if (data.kind === 'array') {
    return data.values.map(decode);
  }
  if (data.kind === 'set') {
    return new Set(data.values.map(decode));
  }
  if (data.kind === 'map') {
    return new Map(data.fields.map(([key, value]) => [key, decode(value)]));
  }
  const constructor = data.name && codec.classes.get(data.name);
  if (data.name && !constructor) {
    throw new Error('Unknown validation state class: ' + data.name);
  }
  const value = constructor ? new constructor() : {};
  data.fields.forEach(([key, item]) => Object.defineProperty(value, key,
    { value: decode(item), enumerable: true, writable: true, configurable: true }));
  return value;
}

function sameData(a: ValidationData, b: ValidationData): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (a.kind !== b.kind || a.name !== b.name || a.fileName !== b.fileName || a.pos !== b.pos ||
    a.end !== b.end || a.syntaxKind !== b.syntaxKind) {
    return false;
  }
  if (a.values || b.values) {
    return !!a.values && !!b.values && a.values.length === b.values.length &&
      a.values.every((value, index) => sameData(value, b.values[index]));
  }
  const fields = new Map(b.fields);
  return (a.fields?.length || 0) === fields.size &&
    (a.fields || []).every(([key, value]) => fields.has(key) && sameData(value, fields.get(key)));
}

function isMatchingCollection(data: ValidationContainer, current: unknown): boolean {
  return data.kind === 'map' && current instanceof Map || data.kind === 'set' && current instanceof Set;
}

function mergeChange(current: unknown, before: ValidationData, after: ValidationData, codec: ValidationCodec): unknown {
  if (sameData(before, after)) {
    return current;
  }
  if (before === undefined && after && typeof after === 'object' &&
    isMatchingCollection(after, current)) {
    before = { kind: after.kind, fields: [], values: [] };
  }
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object' ||
    before.kind !== after.kind || before.name !== after.name) {
    return decodeValidationState(after, codec);
  }
  const oldContainer = before;
  if (oldContainer.kind === 'set' && current instanceof Set) {
    oldContainer.values.filter(value => !after.values.some(item => sameData(item, value)))
      .forEach(value => current.delete(decodeValidationState(value, codec)));
    after.values.filter(value => !oldContainer.values.some(item => sameData(item, value)))
      .forEach(value => current.add(decodeValidationState(value, codec)));
    return current;
  }
  if ((before.kind === 'map' && current instanceof Map) || (before.kind === 'record' && current)) {
    return mergeFields(current, before, after, codec);
  }
  return decodeValidationState(after, codec);
}

function mergeFields(current: unknown, before: ValidationContainer, after: ValidationContainer,
  codec: ValidationCodec): unknown {
  const oldFields = new Map(before.fields);
  const newFields = new Map(after.fields);
  const map = current instanceof Map ? current : undefined;
  oldFields.forEach((_, key) => {
    if (!newFields.has(key)) {
      if (map) {
        map.delete(key);
      } else {
        Reflect.deleteProperty(current as object, key);
      }
    }
  });
  newFields.forEach((value, key) => {
    if (oldFields.has(key) && sameData(oldFields.get(key), value)) {
      return;
    }
    const updated = mergeChange(map ? map.get(key) : current[key], oldFields.get(key), value, codec);
    if (map) {
      map.set(key, updated);
    } else {
      Object.defineProperty(current, key, { value: updated, enumerable: true, writable: true, configurable: true });
    }
  });
  return current;
}

function compactChange(before: ValidationData, after: ValidationData): [ValidationData, ValidationData] {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object' ||
    before.kind !== after.kind || before.name !== after.name) {
    return [before, after];
  }
  if (before.kind === 'map' || before.kind === 'record') {
    const oldFields = new Map(before.fields);
    const newFields = new Map(after.fields);
    const oldChanges: [string, ValidationData][] = [];
    const newChanges: [string, ValidationData][] = [];
    for (const key of new Set([...oldFields.keys(), ...newFields.keys()])) {
      if (oldFields.has(key) && newFields.has(key) && sameData(oldFields.get(key), newFields.get(key))) {
        continue;
      }
      const [oldValue, newValue] = compactChange(oldFields.get(key), newFields.get(key));
      if (oldFields.has(key)) {
        oldChanges.push([key, oldValue]);
      }
      if (newFields.has(key)) {
        newChanges.push([key, newValue]);
      }
    }
    return [{ ...before, fields: oldChanges }, { ...after, fields: newChanges }];
  }
  if (before.kind === 'set') {
    return [{ ...before, values: before.values.filter(value => !after.values.some(item => sameData(item, value))) },
      { ...after, values: after.values.filter(value => !before.values.some(item => sameData(item, value))) }];
  }
  return [before, after];
}

export function captureValidationState(bindings: ValidationStateBinding[], codec: ValidationCodec,
  validate: () => void): ValidationStateChange[] {
  const before = bindings.map(binding => encodeValidationState(binding.read(), codec));
  try {
    validate();
    const changes = bindings.map((binding, index) => ({ name: binding.name, before: before[index],
      after: encodeValidationState(binding.read(), codec) })).filter(change => !sameData(change.before, change.after));
    return detachUISnapshotData(changes.map(change => {
      const [oldValue, newValue] = compactChange(change.before, change.after);
      return { name: change.name, before: oldValue, after: newValue };
    }));
  } finally {
    bindings.forEach((binding, index) => binding.replace(decodeValidationState(before[index], codec)));
  }
}

function resolveBinding(change: ValidationStateChange,
  byName: Map<string, ValidationStateBinding>): ValidationStateBinding {
  const binding = byName.get(change.name);
  if (!binding) {
    throw new Error('Missing validation state binding: ' + change.name);
  }
  return binding;
}

function replaceMapEntries(current: Map<string, unknown>, before: ValidationContainer,
  after: ValidationContainer, codec: ValidationCodec): void {
  const keys = new Set(after.fields.map(([key]) => key));
  before.fields.filter(([key]) => !keys.has(key)).forEach(([key]) => current.delete(key));
  after.fields.forEach(([key, value]) => current.set(key, decodeValidationState(value, codec)));
}

function applyValidationChange(change: ValidationStateChange, binding: ValidationStateBinding,
  codec: ValidationCodec): void {
  const current = binding.read();
  if (binding.replaceMapEntries && current instanceof Map) {
    replaceMapEntries(current, change.before as ValidationContainer, change.after as ValidationContainer, codec);
    return;
  }
  binding.replace(mergeChange(current, change.before, change.after, codec));
}

export function restoreValidationState(changes: ValidationStateChange[], bindings: ValidationStateBinding[],
  codec: ValidationCodec): void {
  const byName = new Map(bindings.map(binding => [binding.name, binding]));
  const resolved = changes.map(change => ({ change, binding: resolveBinding(change, byName) }));
  resolved.forEach(({ change }) => decodeValidationState(change.after, codec));
  resolved.forEach(({ change, binding }) => applyValidationChange(change, binding, codec));
}
