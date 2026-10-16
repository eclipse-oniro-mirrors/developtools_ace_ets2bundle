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

import ts from 'typescript';
import sourceMap from 'source-map';
import sourceMapUtils from 'source-map/lib/util';

interface DecodedMapping {
  generatedLine: number;
  generatedCharacter: number;
  sourceIndex?: number;
  sourceLine?: number;
  sourceCharacter?: number;
  nameIndex?: number;
}

interface MappingDecoder {
  next(): IteratorResult<DecodedMapping>;
  readonly error?: string;
}

interface MappingDecoderApi {
  decodeMappings(mappings: string): MappingDecoder;
}

/**
 * The source-map 0.7 consumer initializes WebAssembly asynchronously. Only the
 * synchronous operations needed by source-map's generator are implemented here.
 */
class SynchronousSourceMapConsumer {
  readonly file: string;
  readonly sourceRoot: string | null;
  readonly sources: string[];
  private readonly names: string[];
  private readonly sourceMap: sourceMap.RawSourceMap;
  private decodedMappings?: DecodedMapping[];

  constructor(map: sourceMap.RawSourceMap) {
    if (Number(map.version) !== 3) {
      throw new Error(`Unsupported version: ${map.version}`);
    }
    this.sourceMap = map;
    this.file = map.file;
    this.sourceRoot = map.sourceRoot ? sourceMapUtils.normalize(map.sourceRoot) : map.sourceRoot ?? null;
    this.names = (map.names === undefined ? [] : map.names).map(String);
    this.sources = map.sources.map(String).map(sourceMapUtils.normalize).map(source => {
      const relativeSource = this.sourceRoot && sourceMapUtils.isAbsolute(this.sourceRoot) && sourceMapUtils.isAbsolute(source) ?
        sourceMapUtils.relative(this.sourceRoot, source) : source;
      return sourceMapUtils.computeSourceURL(this.sourceRoot, relativeSource, null);
    });
  }

  eachMapping(callback: (mapping: sourceMap.MappingItem) => void): void {
    this.getMappings().forEach(mapping => callback(this.toMappingItem(mapping)));
  }

  sourceContentFor(source: string): string | null {
    return this.sourceMap.sourcesContent?.[this.sources.indexOf(source)] ?? null;
  }

  originalPositionFor(position: sourceMap.Position): sourceMap.MappingItem | undefined {
    const mappings = this.getMappings();
    let low = 0;
    let high = mappings.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      const mapping = mappings[middle];
      if (mapping.generatedLine < position.line - 1 ||
        (mapping.generatedLine === position.line - 1 && mapping.generatedCharacter <= position.column)) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    const mapping = mappings[low - 1];
    return mapping?.generatedLine === position.line - 1 ? this.toMappingItem(mapping) : undefined;
  }

  private getMappings(): DecodedMapping[] {
    if (!this.decodedMappings) {
      // OpenHarmony TypeScript exports this synchronous decoder without a public declaration.
      const decoder = (ts as unknown as MappingDecoderApi).decodeMappings(this.sourceMap.mappings);
      const mappings: DecodedMapping[] = [];
      let next = decoder.next();
      while (!next.done) {
        mappings.push(next.value);
        next = decoder.next();
      }
      if (decoder.error) {
        throw new Error(decoder.error);
      }
      // WASM consumers order equal generated positions by source index, original
      // position and name index; unmapped segments sort last at the same column.
      this.decodedMappings = mappings.sort((left, right) =>
        left.generatedLine - right.generatedLine || left.generatedCharacter - right.generatedCharacter ||
        compareOptionalIndex(left.sourceIndex, right.sourceIndex) || compareOptionalIndex(left.sourceLine, right.sourceLine) ||
        compareOptionalIndex(left.sourceCharacter, right.sourceCharacter) || compareOptionalIndex(left.nameIndex, right.nameIndex));
    }
    return this.decodedMappings;
  }

  private toMappingItem(mapping: DecodedMapping): sourceMap.MappingItem {
    return {
      generatedLine: mapping.generatedLine + 1,
      generatedColumn: mapping.generatedCharacter,
      source: mapping.sourceIndex === undefined ? null : this.sources[mapping.sourceIndex],
      originalLine: mapping.sourceLine === undefined ? null : mapping.sourceLine + 1,
      originalColumn: mapping.sourceCharacter ?? null,
      name: mapping.nameIndex === undefined ? null : this.names[mapping.nameIndex]
    };
  }
}

function compareOptionalIndex(left: number | undefined, right: number | undefined): number {
  if (left === right) {
    return 0;
  }
  if (left === undefined) {
    return 1;
  }
  return right === undefined ? -1 : left - right;
}

/** Merge maps synchronously while retaining the existing updateSourceMap output. */
export function updateSourceMapSync(originMap: sourceMap.RawSourceMap | undefined,
  newMap?: sourceMap.RawSourceMap): sourceMap.RawSourceMap | undefined {
  if (!originMap) {
    return newMap;
  }
  if (!newMap) {
    return originMap;
  }
  const originConsumer = new SynchronousSourceMapConsumer(originMap);
  const newConsumer = new SynchronousSourceMapConsumer(newMap);
  const newMappingList: sourceMap.MappingItem[] = [];
  newConsumer.eachMapping(mapping => {
    if (mapping.originalLine === null || mapping.originalLine === undefined) {
      return;
    }
    const original = originConsumer.originalPositionFor({ line: mapping.originalLine, column: mapping.originalColumn });
    if (original?.source === null || original?.source === undefined) {
      return;
    }
    mapping.originalLine = original.originalLine;
    mapping.originalColumn = original.originalColumn;
    newMappingList.push(mapping);
  });
  const generator = sourceMap.SourceMapGenerator.fromSourceMap(newConsumer as unknown as sourceMap.SourceMapConsumer);
  // Retain the same source/name tables and replacement semantics as updateSourceMap.
  const updatedGenerator = generator as sourceMap.SourceMapGenerator & {
    _file: string;
    _mappings: { _array: sourceMap.MappingItem[] };
  };
  updatedGenerator._file = originMap.file;
  updatedGenerator._mappings._array = newMappingList;
  return JSON.parse(updatedGenerator.toString());
}
