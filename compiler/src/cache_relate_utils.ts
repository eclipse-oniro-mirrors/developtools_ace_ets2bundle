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

/**
 * Reason categories recorded as sub-events of the `etsTransformShouldInvalidCache` /
 * `etsCheckerShouldInvalidCache` hook events when the perf dotting is enabled.
 * Internal tool convention only, not a stable contract (see change: ets-transform-cache-invalid-dfx).
 *
 * Deliberately dependency-free: both the etsTransform and etsChecker plugins import it. Hosting
 * these constants inside rollup-plugin-ets-typescript would force the checker plugin to require
 * the transform plugin and widen the existing `ets_checker <-> rollup-plugin-ets-checker`
 * circular module init, which breaks load-order-sensitive entries.
 */
export const InvalidCacheReason = {
  SHOULD_DISABLE_CACHE: 'InvalidCacheReason: shouldDisableCache',
  ENABLE_DEBUG_LINE: 'InvalidCacheReason: enableDebugLine',
  NON_ENTRY_FILE: 'InvalidCacheReason: disableNonEntryFileCache',
  RESOURCE_INVALID: 'InvalidCacheReason: shouldInvalidFiles',
  RAW_FILE_CHANGE: 'InvalidCacheReason: checkRawFileChange',
  CHILDREN_HASH: 'InvalidCacheReason: childrenHash',
  CONST_ENUM: 'InvalidCacheReason: checkRelateToConstEnum',
  OBFUSCATION_CONFIG: 'InvalidCacheReason: obfuscationConfigChanged',
  TARGET_ES_VERSION_CHANGED: 'InvalidCacheReason: targetESVersionChanged',
  FRAMEWORK_INVALIDATED: 'InvalidCacheReason: frameworkInvalidated',
  CACHED: 'InvalidCacheReason: cached',
  UNATTRIBUTED: 'InvalidCacheReason: unattributed'
};