# TASK-5 Red→Green 回归证据（issue-4719-require-type-check，v1.12 消息模板改写）

日期：2026-11-10 · 环境：本仓 workspace，分支 `fix-4719-require-undefined-warning`，基线 HEAD `81cdef38c`（v1.11 交付态；TASK-5 净 diff 3 文件叠加其上）。执行授权：owner 2026-11-10 会话双批准（v1.12 文档链 + TASK-5）。

## 变更内容（Files 表 3 项）

- 主链 `src/process_custom_component.ts:2163-2164`：message 字符串模板整体替换（两行拼接结构保持，第一行 `` `The type of property '${paramName}' decorated with '@Require' is expected to be '${declaredType}', ` `` 结尾、第二行 `` `but is actually '${actualType}' in the component constructor.` ``）；变量名 paramName/declaredType/actualType 与 log.push 结构零改动。
- 镜像 `src/interop/src/process_custom_component.ts:2179-2180`：同构替换（message 区块 :2155-2170 vs :2171-2186 diff IDENTICAL，偏移 +16 保持）。
- `test/transform_ut_error.json`：6 条期望消息文本替换（4 键 validateRequireParamUndefinedType/V2/Extension/ExtensionV2；条目数与 type 字段不变；276 顶层键 JSON valid）。

## 证据矩阵

| # | 场景 | 命令 | 结果 | 判定 |
|---|------|------|------|------|
| 1 | 基线复核（主链路，改码前） | `cd compiler && npm run etsTest` | 359 passing / 2 failing（预存基线：`ExtendOneChild`、`StructNameWarn`） | ✅ 基线一致，无环境漂移 |
| 2 | Red（主链 message 替换后、期望更新前） | `npm run build`（114 files PASS）→ `npm run etsTest` | 355 passing / **6 failing**：1-60～1-63 四页面用例消息 findIndex 严格相等断言失败（`expected false to be true`，实际输出新模板 vs 期望旧模板）+ 预存基线 2 例；既有其余用例保持 ✔ | ✅ Red 成立：断言非恒真 |
| 3 | 镜像同步复核 | sed 区段 diff | MESSAGE-REGION-IDENTICAL（主/镜像 message 区块逐行一致，偏移 +16 保持） | ✅ 镜像铁律 |
| 4 | Green（镜像同步 + 期望更新后，主链路） | `npm run etsTest` | **359 passing / 2 failing**：1-60～1-63 四页面用例红转绿（WARN 计数+消息逐字符断言通过，恰 +4 passing 回归）；失败仅余预存基线 2 例 | ✅ Green 成立 |
| 5 | Green（镜像回归） | `npm run interopArkTest` | **1120 passing / 19 failing**：失败集与预存基线同构（Lazy Imports ×8 + static interop imports ×10 + module_mode ×1，全部环境相关预存）；**@Require 相关失败 0**（v1.10 起 interop @Require 用例已移出 MR，镜像行为正确性由代码 diff IDENTICAL + interopBuild 编译承载） | ✅ 镜像零漂移 |
| 6 | Green 只读 eslint | `./node_modules/.bin/eslint src/process_custom_component.ts src/interop/src/process_custom_component.ts --ext .ts` | 103 error 全部预存（主 50/镜像 53，行号均在编辑区外：主 ≤2007、镜像 ≤2225）；message 替换区间（主 :2163-2164、镜像 :2179-2180）0 命中；exit=1 系预存违规所致 | ✅ 新增区间 0 错误 |
| 7 | Scope 核对 | `git status` / `git diff` | tracked 修改恰 = 3 代码文件（2 src 各 +2/-2 + JSON 6 条文本）；6 fixture 页与页面注册表 diff = 0；.ts_checker_cache 运行污染已 `git checkout --` 恢复 | ✅ 与 Files 表一致 |

## 断言收敛核验

- `ut_validate.test.ts` 断言机制：WARN 计数与消息 `findIndex(value.message === message)` **严格相等**双断言——Red 失败点在消息匹配（计数不变、文本不匹配），Green 转绿即证明渲染与期望逐字符一致（含 expectType 段后逗号与模板尾部 ` in the component constructor.`）。
- 三态失败集对照零漂移：主链 etsTest 2 → 6 → 2（Red 差集恰 4 页面用例承载 6 条消息断言，每用例首条消息断言失败即中断）；镜像回归预存 19 例三态不变；passing 恰 -4/+4（359→355→359）。
- 6 条新期望消息逐字符（渲染样例）：`The type of property 'require_value' decorated with '@Require' is expected to be 'number', but is actually 'undefined' in the component constructor.`；require_param_value（string/undefined）；void_value（number/undefined）；union_variable_value（number/`number | undefined`）；void_param_value（string/undefined）；union_param_value（string/`string | undefined`）。

## 工作区污染恢复记录

- etsTest 运行污染的 tracked 缓存 `.ts_checker_cache`（transform_ut application entry build）单文件 `git checkout --` 恢复；无删除态文件。
- `compiler/debug.log`、`etsTest_build/**`、`arkTest_build/**` 为运行/构建副产物（untracked），不入库。
