# TASK-4 告警措辞变更证据（issue-4719-require-type-check，proposal v1.4→v1.5 / C-2 模板）

日期：2026-10-29（v1.4）/ 2026-10-30（v1.5）· 环境：本仓 workspace，分支 `fix-4719-require-undefined-warning`，HEAD `5d6b48025`（措辞变更前）

## 变更内容（owner 会话三轮候选 A/B/C → C → C-1/C-2/C-3 后选定 C-2；次日指示 got 段占位符化）

- 消息模板（触发条件/级别/定位/反例口径全部不变，仅文案替换）：

```text
旧（HEAD 前）：'@Require' decorated '${paramName}' cannot be initialized with 'undefined' through the component constructor, because its type does not include 'undefined'.
v1.4（C-2）：'@Require' decorated '${paramName}' expects type '${paramType}' but got 'undefined' through the component constructor.
v1.5（最终）：'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.
```

- `${paramType}` 口径：字段声明类型经 checker 解析的 `checker.typeToString` 文本，与"是否含 undefined"判定取自同一 `ts.Type`；命中告警时必然不含 `undefined`。
- `${actualType}` 口径：实际传入值（构造传参处 initializer）经 `checker.typeToString(checker.getTypeAtLocation(initializer))` 解析的类型文本；触发条件为显式 `undefined` 标识符，故渲染恒为 `'undefined'`——**v1.5 渲染结果与 v1.4 逐字符一致**（`transform_ut_error.json` 期望条目无需变更即通过）。
- helper 改名：`isRequireParamTypeExcludingUndefined` → `getRequireParamTypeExcludingUndefined`（boolean 判定 → 返回声明类型字符串，early-return `undefined`）。
- 涉及 4 文件：主链路 `compiler/src/process_custom_component.ts`、interop 镜像 `compiler/src/interop/src/process_custom_component.ts`（逐行 IDENTICAL，diff 证明见下）、`compiler/test/transform_ut_error.json`（2 条期望更新：`require_value` → `number`、`require_param_value` → `string`；v1.5 渲染不变故未再改）、`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（断言改 `requireUndefinedWarnMessage(paramName, declaredType, actualType)` 三参函数 + `expectSingleRequireUndefinedWarn` 四参，两用例传 `'number'/'undefined'` 与 `'string'/'undefined'`）。

## 验证矩阵（v1.5 最终态；v1.4 态曾单独跑过一轮，统计与本表逐字一致）

| # | 场景 | 命令 | 结果 | 判定 |
|---|------|------|------|------|
| 1 | 构建（lib/ 同步） | `cd compiler && npm run build` | 114 files compiled | ✅ PASS |
| 2 | 主链路 transform_ut | `cd compiler && npm run etsTest` | **357 passing** / 2 failing（仅预存基线 ExtendOneChild/StructNameWarn）；`✔ 1-60 validateRequireParamUndefinedType`、`✔ 1-61 validateRequireParamUndefinedTypeV2`（新文案逐字符断言通过，got 段渲染 `'undefined'`） | ✅ PASS，与 task3 Green 基线零漂移 |
| 3 | interop（含 interopBuild） | `cd compiler && npm run interopArkTest` | **1122 passing** / 19 failing（仅预存基线）；`✔ warns once when a @Require regular param is initialized with undefined`、`✔ warns once when a @Require @Param is initialized with undefined in V2`（三参断言通过） | ✅ PASS，与 task3 Green 基线零漂移 |
| 4 | 主链路/镜像逐行一致 | `diff <(主链路 getRequireParamTypeExcludingUndefined 起 52 行) <(镜像同函数起 52 行)` | 无输出（IDENTICAL） | ✅ R-6 契约保持 |
| 5 | fixture 期望与渲染一致 | `transform_ut_error.json` 期望 vs 实际 WARN 输出 | `require_value` 渲染 `expects type 'number' but got 'undefined'...`、`require_param_value` 渲染 `expects type 'string' but got 'undefined'...`（typeToString('number')/('string')、actualType 恒 'undefined'） | ✅ 逐字符一致 |

## lint 对照说明（重要坑位记录）

- `npm run lint` 实际为 `eslint --fix ./src --ext .ts`——**会改写工作区 src 文件**（自动格式修复），不可作为只读校验直接运行后再 diff；本任务一度将其与 stash 流程混用，已通过 `git checkout -- compiler/src/` 剔除全部 --fix 格式噪声后重做编辑（最终 diff 每文件 18 行纯契约变更，无格式化夹带）。
- 基线对照（stash 4 个变更文件前后各跑一次）：两轮均 `✖ 1004 problems (1004 errors, 0 warnings)`——全部为仓库预存（max-lines-per-function/complexity/unused-vars 等历史遗留规则，遍布未触碰的 180+ 文件），本变更零新增。
- 修改区域核验：两个 `process_custom_component.ts` 的 eslint 报错行号（L134/152-162/580/748/1304/1606 等）全部落在本次修改区域（L2100-2167）之外，且规则类型均为预存模式。

## 预存基线失败（非本特性引入）

与 task3-red-green 记录完全一致：etsTest 2 例（ExtendOneChild 断言失败、StructNameWarn fixture 缺失 ENOENT）；interopArkTest 19 例（Lazy Imports/module_mode 等环境相关）。本轮统计 357/2 与 1122/19 和 task3 Green 逐字一致，证明措辞变更零漂移。

## 附带文件

- `etsTest-after-wording-change.txt`：etsTest 全量输出（v1.5 最终轮）。
- `interopArkTest-after-wording-change.txt`：interopArkTest 全量输出（v1.5 最终轮）。
