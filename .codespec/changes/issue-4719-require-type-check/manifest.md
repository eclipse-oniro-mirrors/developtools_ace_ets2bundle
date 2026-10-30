---
id: issue-4719-require-type-check
type: feature
title: "@Require修饰的数据支持类型校验"
spec_schema: ohos-sdd/v1
profile: arkui
complexity: simple
lineage: new
status: done
owner: "@youzhi92"
source_issue: "https://gitcode.com/openharmony/developtools_ace_ets2bundle/issues/4719"
created_at: 2026-08-11
updated_at: 2026-10-29
related: []
related_tasks: []
related_decisions: []
func_id: 09-01-01
feat_id: Feat-01
design_path: ".codespec/changes/issue-4719-require-type-check/design.md"
plan_path: ".codespec/changes/issue-4719-require-type-check/execution-plan.md"
long_term_spec_path: "N/A（长期 specs/ 回灌为 ohos-sdd 工具链后续 batch 能力，archive 命令明示 P5；FuncID 09-01-01 已分配，回灌时使用）"
long_term_design_path: "N/A（同上）"
spectest_feature_path: "N/A（编译期诊断特性，无 SpecTest Host Preview 用例；验证经 VM-1～VM-6 mocha 单测承载）"
subprofiles: []
profile_source: owner
code_refs:
  - "developtools/ace_ets2bundle/compiler/"
commits: []
---

# 运行记录

## 告警措辞变更（2026-10-29 proposal v1.4 / 2026-10-30 v1.5，owner 三轮候选选定 C-2 后再指示 got 段占位符化）

- 最终消息模板：`'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.`（`${paramType}` = 声明类型 `checker.typeToString` 文本；`${actualType}` = 实际传入值 initializer 的 `checker.typeToString(getTypeAtLocation(...))` 文本，触发条件下渲染恒 `'undefined'`）；helper 改名 `getRequireParamTypeExcludingUndefined`；触发/级别/定位/反例口径不变。
- 代码 4 文件（主链路+interop 镜像逐行 IDENTICAL+`transform_ut_error.json`+interop 测试三参断言），验证：build PASS、etsTest 357/2（新 1-60/1-61 ✔）、interopArkTest 1122/19（新 2 例 ✔）、基线零漂移；v1.4 与 v1.5 两轮统计逐字一致；证据 `evidence/checks/task4-warn-wording/`。
- 文档同步：spec.md / spec-for-validation.md 消息模板+`${paramType}`/`${actualType}` 口径、execution-plan.md Produces 行模板引用、proposal.md v1.4/v1.5 记录；baseline_digest 重算回填 `1072a95a…38b127`，source_spec_hash 同步 `aa782ec0…b9aec`。
- 坑位：`npm run lint` = `eslint --fix`（改写 src 工作区文件），已剔除其格式噪声并记录于 task4 README，最终 diff 零格式化夹带。

## 外部测试设计 skill 校验与 AC-05 整改（2026-10-30 proposal v1.6）

- 三 skill 校验（owner 指定 GitCode main 最新版）：`ohos-test-proposal-checking` proposal.md PASS 18/18；`ohos-test-spec-rule-checking v2.8.0` spec.md 43 pass + 8 skip + 0 fail（语义门禁 43 条清零，5 条机械 fail 均确认误报）；`arkui-spec-check` spec-for-validation.md Layer B 57 条零 ❌，Layer A 报 AC-05 Blocker（用户视角而非内部实现视角：口径说明段含 `checker.typeToString`/`checker.getTypeAtLocation` 内部调用与源码路径）。
- 整改（owner 确认方案后回复「执行」）：spec.md/spec-for-validation.md 消息模板口径说明段改写为实现中立表述（占位符口径保留、内部 API/源码路径引用去除），模板本体/触发/级别/定位/反例口径与渲染结果不变；顺手更新 spec.md 滞后标签（输入文档 v1.3→v1.6、关键文档 v1.1→v1.6，skill2 观察项③）。
- 哈希：baseline_digest `1072a95a…38b127` → `a619a94b…c14f1`（v1.6 记录合法变化，复算自稳定）；source_spec_hash 同步 `8b7425a6…77d9`（含标签修正）。skill 报告留 `/tmp/opencode/skill-checks/reports/`（跟随 v1.3 先例不进 .codespec），MR #7243 评论留痕。

## spec-for-validation refresh 后恢复清单（2026-10-29 固化）

`ohos-sdd spec-for-validation refresh <change>` 全量重渲染模板（仅保留 `TEST-ANALYSIS` 人工区），以下 owner 回填内容会被重置为骨架；未来因 spec.md/design.md 变更再次 refresh 后，须按本清单恢复并重跑校验：

1. frontmatter：`status` → Draft（恢复 Approved）、`subprofiles` → `- none`（恢复 `[]`）
2. 元信息表「产物状态」→ Draft（恢复 Approved）
3. 八章 `GENERATED:AC-VERIFICATION` 表「验证点/测试侧验证方式」两列 → 「待确认」（引擎 `_ac_verification_table()` 恒生成骨架，owner 回填是唯一来源）
4. 附录术语表 → 2D/2C 骨架（恢复 4 条领域术语：interop 编译模式、non-null 字段、消息模板、Red 条件）
5. 十一章审批区 → 待审批（恢复 Approved + 双 Owner 签署记录 + 修复追认记录）
6. `evidence/checks/check-spec-for-validation.md` 被 Draft-FAIL 覆写（恢复后重跑 check 再生）

**恢复基准**：本分支 `fix(spec): 补全外部测试设计规则校验发现的文档缺口` commit 中的 `spec-for-validation.md` 完整回填态（`git show <commit>:.codespec/changes/issue-4719-require-type-check/spec-for-validation.md` 取回），仅按本次 refresh 实际同步项复核 hash。

**恢复后必跑**：`ohos-sdd spec-for-validation check <change>`（预期 15/15 PASS）与 `ohos-sdd validate <change> --level all`（预期 46 checks/0 broken PASS）。
