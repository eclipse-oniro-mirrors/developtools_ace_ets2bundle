# TASK-4 Red→Green 回归证据（issue-4719-require-type-check，v1.8 类型级触发扩展）

日期：2026-10-31 · 环境：本仓 workspace，分支 `fix-4719-require-undefined-warning`，HEAD `321cd5dd6`（v1.8 变更前；PR #7243 门禁绿对该 head 有效）

> **编号复用注记：** 本目录对应 execution-plan v1.8 修订新增的 TASK-4（@Require 类型级触发扩展：`void 0` 与联合类型变量）。历史 `task4-warn-wording/` 为 v1.4/v1.5 措辞周期彼时 Plan 的 TASK-4（告警文案变更），与本任务编号复用、语义无关，该目录内容未改动。

## 证据矩阵

| # | 场景 | 命令 | 结果 | 判定 |
|---|------|------|------|------|
| 1 | Red 前基线（主链路） | `cd compiler && npm run etsTest` | 357 passing / 2 failing（预存基线：`ExtendOneChild`、`StructNameWarn`） | ✅ 基线一致，无环境漂移 |
| 2 | Red 前基线（interop） | `cd compiler && npm run interopArkTest` | 1122 passing / 19 failing（IDENTICAL-19：Lazy Imports ×8 + static interop imports ×10 + module_mode 18-18，全部环境相关预存） | ✅ 基线一致 |
| 3 | Red 主链路（Red 资产 4 件落地、src 未改） | `npm run etsTest` | 357 passing / **4 failing**：新 2 页 `1-62 validateRequireParamUndefinedTypeExtension`、`1-63 ...ExtensionV2`（`AssertionError: expected false to be true`，WARN 计数 0 ≠ 期望 2）+ 预存基线 2 例；既有 `1-60/1-61` 保持 ✔ | ✅ Red 成立：断言非恒真 |
| 4 | Red interop（同上） | `npm run interopArkTest` | 1122 passing / **21 failing**：新 2 用例 `expected [] to have a length of 2 but got +0`（warnInfos 空；`expectRequireUndefinedWarns` 内 errorInfos=0 断言先行通过 ⇒ Extension 页 ERROR=0 无噪音）+ IDENTICAL-19；既有 2 用例保持 ✔ | ✅ Red 成立 |
| 5 | Green build | `npm run build` | 114 files 编译 PASS，无错误 | ✅ |
| 6 | Green 只读 eslint | `./node_modules/.bin/eslint src/process_custom_component.ts src/interop/src/process_custom_component.ts --ext .ts` | 103 error 全部预存（主 50/镜像 53，行号均在编辑区外：主 ≤2007、镜像 ≤2023+EOF）；新增区间（主 :2087-2097/:2147-2148、镜像 :2103-2113/:2163-2164）0 命中；exit=1 系预存违规所致 | ✅ 新增区间 0 错误 |
| 7 | Green 主链路 | `npm run etsTest` | **359 passing / 2 failing**：`✔ 1-62`/`✔ 1-63` 红转绿（恰 +2 passing）；既有 1-60/1-61 保持 ✔（v1.5 期望零漂移）；失败仅余预存基线 2 例 | ✅ Green 成立 |
| 8 | Green interop | `npm run interopArkTest` | **1124 passing / 19 failing**：`✔ warns once per field for void expression and union variable in V1/V2 extension` 红转绿（恰 +2 passing）；失败集与基线 IDENTICAL-19 | ✅ Green 成立 |
| 9 | 镜像同构复核 | sed 区段 diff | HELPER-REGION-IDENTICAL + FUNC-REGION-IDENTICAL（主/镜像新增块逐行一致，偏移 +16 保持）；helper 每文件恰 1 处 | ✅ 镜像铁律 |
| 10 | Scope 核对 | `git status` / `git diff` | tracked 修改恰 = 5 M（2 src + pathConfig + JSON + interop 测试）+ 2 新建 fixture；`transform_ut_error.json` +20/-0 纯追加（276 页 JSON valid）；既有 2 fixture 页与既有期望条目 diff = 0 | ✅ 与 Files 表一致 |

## 断言收敛核验

- `ut_validate.test.ts` 断言机制（:230-:240 区域）：ERROR 计数与 WARN 计数**分离断言** + 消息逐条 findIndex——Green 全过同时证明计数精确（ERROR 0 + WARN 2）与消息逐字符匹配。
- Red 失败点在 WARN 计数断言（0 ≠ 2），且 ERROR 断言先行通过 ⇒ Red 期 fixture 无 ERROR 噪音（ESObject/`void 0`/if 守卫均未触发新诊断）；Green 转绿即反证 Red 失败原因纯净。
- 三态失败集对照零漂移：etsTest 基线 2 例 = Red 4 例 − 新 2 页 = Green 2 例；interop IDENTICAL-19 三态不变；passing 恰 +2（357→359、1122→1124）。

## 期望消息（逐字符）

- V1：`'@Require' decorated 'void_value' expects type 'number' but got 'undefined' through the component constructor.`；`'@Require' decorated 'union_variable_value' expects type 'number' but got 'number | undefined' through the component constructor.`
- V2：`'@Require' decorated 'void_param_value' expects type 'string' but got 'undefined' through the component constructor.`；`'@Require' decorated 'union_param_value' expects type 'string' but got 'string | undefined' through the component constructor.`

## 工作区污染恢复记录

- 每轮测试运行污染的被跟踪 testdata/build 产物按排除式清单 `git checkout --` 选择性恢复（排除 3 个 Red 资产 tracked 修改：`helpers/pathConfig.ts`、`transform_ut_error.json`、`ark_compiler_ut/interop/process_custom_component.test.ts`）；禁止整目录回滚（会一并回滚 Red 资产）。
- Green interop 轮出现 `EntryAbility.js`（` D` 删除态）——` M` 匹配遗漏，已单独 `git checkout --` 恢复；最终 tracked 修改恰 = 5 M。
- `compiler/debug.log`、`transform_ut/.../.ts_checker_cache`、`arkTest_build/**`、`etsTest_build/**` 为运行/构建副产物，不入库。

## 附带文件

`baseline-etsTest.txt`、`baseline-interopArkTest.txt`（基线计数存档）；`red-etsTest.txt`、`red-interopArkTest.txt`、`green-build.txt`、`green-eslint.txt`、`green-etsTest.txt`、`green-interopArkTest.txt`（Red/Green 全量捕获，含 mocha epilogue 与失败详情）。
