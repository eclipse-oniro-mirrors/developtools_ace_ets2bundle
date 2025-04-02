/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { pointer } from './InteropTypes'
import { int32, int64 } from '@koalaui/common'

// stub wrapper for KInteropBuffer
export class NativeBuffer extends ArrayBuffer {
    public data:pointer = 0
    public length: int64 = 0
    public resourceId: int32 = 0
    public hold:pointer = 0
    public release: pointer = 0

    constructor(data:pointer, length: int64, resourceId: int32, hold:pointer, release: pointer) {
        super(length)
        this.data = data
        this.length = length
        this.resourceId = resourceId
        this.hold = hold
        this.release = release
    }

    static wrap(data:pointer, length: int64, resourceId: int32, hold:pointer, release: pointer): NativeBuffer {
        return new NativeBuffer(data, length, resourceId, hold, release)
    }
}
