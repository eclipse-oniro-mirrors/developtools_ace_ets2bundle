# TASK-3 Red→Green 回归证据（issue-4719-require-type-check）

日期：2026-10-29 · 环境：本仓 workspace（fork snapshot，HEAD detached）

## 证据矩阵

| # | 场景 | 命令 | 结果 | 判定 |
|---|------|------|------|------|
| 1 | 主链路 Red（挂载行 `validateRequireParamUndefinedType(node, name, log);` 临时注释） | `cd compiler && npm run etsTest` | 355 passing / **4 failing**：① `1-60 validateRequireParamUndefinedType` ② `1-61 validateRequireParamUndefinedTypeV2`（均为 `AssertionError: expected false to be true`，实际 WARN 0 条 vs 期望 1 条）③ `1-66 ExtendOneChild` ④ `1-117 StructNameWarn`（预存基线） | ✅ Red 成立：断言非恒真 |
| 2 | 主链路 Green（挂载行恢复） | `cd compiler && npm run etsTest` | **357 passing** / 2 failing（仅预存基线 ③④）；`✔ 1-60`、`✔ 1-61` | ✅ Green 成立 |
| 3 | 主链路基线对照（stash 4 个变更文件后） | `cd compiler && npm run etsTest` | 355 passing / 2 failing（`1-64 ExtendOneChild`、`1-115 StructNameWarn`——无本变更时同一两例） | ✅ 零漂移：失败集与 Green 完全一致，Green 比 Red 恰多我的 2 页 |
| 4 | interop Red（镜像挂载行临时注释） | `cd compiler && npm run interopArkTest` | 1120 passing / **21 failing**：含我的 2 用例（`AssertionError: expected [] to have a length of 1 but got +0`）+ 19 个预存基线失败 | ✅ Red 成立 |
| 5 | interop Green（镜像挂载行恢复） | `cd compiler && npm run interopArkTest` | **1122 passing** / 19 failing（仅预存基线）；`✔ warns once when a @Require regular param...`、`✔ warns once when a @Require @Param...in V2` | ✅ Green 成立 |
| 6 | interop 基线对照（stash + 暂移我的用例文件后） | `cd compiler && npm run interopArkTest` | 1120 passing / 19 failing | ✅ 零漂移：与 Green 失败用例名集合 diff = **IDENTICAL-19**（逐名比对） |

## 断言收敛核验

- V1 fixture `validateRequireParamUndefinedType.ets`：正例 `require_value`（`@Require number` 显式传 `undefined`）恰 1 条契约文案 WARN；反例矩阵（`number | undefined` 联合、`any`、无 `@Require`、`this.numValue` 变量传值、嵌套对象 `{ inner_value: undefined }`）0 条；0 ERROR。
- V2 fixture `validateRequireParamUndefinedTypeV2.ets`：正例 `require_param_value`（`@Require @Param string` 显式传 `undefined`）恰 1 条同文案 WARN；反例（无 `@Require` 的 `@Param` 传 `undefined`）0 条；0 ERROR。
- interop 用例（`test/ark_compiler_ut/interop/process_custom_component.test.ts`）经 `require('../../../lib/...')` 消费 interopBuild 产物（interop 变体），断言 WARN 计数=1、文案逐字符一致、ERROR=0。

## 预存基线失败（非本特性引入，未以任何方式掩盖或修改）

- etsTest：`Decorators/process_ui_syntax/ExtendOneChild`（断言失败）、`Decorators/vaildate_ui_syntax/StructNameWarn`（fixture 文件在 HEAD 中缺失，ENOENT；注册存在于 HEAD pathConfig.ts:371）。
- interopArkTest：19 例（process Lazy Imports / module_mode / generateCompileContext / autoLazyImport / transformLazyImport 等环境相关用例）。
- 证明方式：stash 基线对照（证据 #3、#6），失败集在有无本变更时逐名一致；本变更新增用例后 passing 数恰增 2（etsTest 355→357、interop 1120→1122），失败集不变。

## 附带文件

- `main-red-full.txt` / `main-green-full.txt`：etsTest 全量输出（Red/Green）。
- `interop-red-full.txt` / `interop-green-full.txt`：interopArkTest 全量输出（Red/Green）。
- `interop-baseline-full.txt`：interopArkTest 基线输出。
- 主链路基线输出未单独存文件（stash 会话内联采集：355 passing / 2 failing，见证据 #3）。
