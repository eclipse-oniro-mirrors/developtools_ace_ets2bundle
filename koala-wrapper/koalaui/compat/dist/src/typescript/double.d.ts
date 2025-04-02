/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
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

import { float64, int32, float32 } from "./types";
export declare function asFloat64(value: string): float64;
export declare function asString(value: float64 | undefined): string | undefined;
export declare function float32FromBits(value: int32): float32;
export declare function int32BitsFromFloat(value: float32): int32;
//# sourceMappingURL=double.d.ts.map