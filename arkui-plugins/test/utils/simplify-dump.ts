/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

enum GetSetDumper {
    GET,
    SET,
    BOTH,
}

function dumpGetterSetter(
    getOrSet: GetSetDumper,
    name: string,
    type: string,
    annotations: string[] = [],
    paramAnnotations: string[] = [],
    hasBody: boolean = true,
    body: string | undefined = undefined
): string {
    if (getOrSet === GetSetDumper.BOTH) {
        return [
            dumpGetterSetter(GetSetDumper.GET, name, type, annotations, paramAnnotations, hasBody),
            dumpGetterSetter(GetSetDumper.SET, name, type, annotations, paramAnnotations, hasBody)
        ].join('\n\n');
    }
    let methodStr: string;
    if (getOrSet === GetSetDumper.GET) {
        methodStr = `get ${name}(): ${type}`;
        if (hasBody) {
            body = '{\nreturn undefined;\n}\n';
        }
    } else {
        const paramStr = [...paramAnnotations, name].join(' ');
        methodStr = `set ${name}(${paramStr}: ${type})`;
        if (hasBody) {
            body = '{\nthrow new InvalidStoreAccessError();\n}\n';
        }
    }
    const strList: string[] = [...annotations, methodStr, ...(!!body ? [body] : [])];
    return strList.join(' ');
}

function stringifyWithoutKeyQuotes(obj: Record<string, unknown>): string {
  const jsonString = JSON.stringify(obj);
  return jsonString.replace(/"([^"]+)":/g, '$1:');
}

function dumpAnnotation(annotationName: string, properties: Record<string, unknown> = {}): string {
    const propertyStr: string = Object.keys(properties).length > 0 ? stringifyWithoutKeyQuotes(properties) : '';
    return `@${annotationName}(${propertyStr})`;
}

function ignoreNewLines(dumpStr: string): string {
    return dumpStr.replaceAll(/\n[\s]+/g, '');
}

function dumpConstructor(): string {
    return `
    public constructor(useSharedStorage: (boolean | undefined), storage: (LocalStorage | undefined)) {
    super(useSharedStorage, storage);
  }

    public constructor(useSharedStorage: (boolean | undefined)) {
    this(useSharedStorage, undefined);
  }
    
  public constructor() {
    this(undefined, undefined);
  }`
}

export { GetSetDumper, dumpGetterSetter, dumpAnnotation, ignoreNewLines, dumpConstructor };
