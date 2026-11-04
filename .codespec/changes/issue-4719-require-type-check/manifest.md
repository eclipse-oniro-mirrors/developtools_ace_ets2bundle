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
updated_at: 2026-11-03
related: []
related_tasks: []
related_decisions: []
func_id: 09-01-01
feat_id: Feat-01
design_path: ".codespec/changes/issue-4719-require-type-check/design.md"
plan_path: ".codespec/changes/issue-4719-require-type-check/execution-plan.md"
long_term_spec_path: "N/A（长期 specs/ 回灌为 ohos-sdd 工具链后续 batch 能力，archive 命令明示 P5；FuncID 09-01-01 已分配，回灌时使用）"
long_term_design_path: "N/A（同上）"
spectest_feature_path: "N/A（编译期诊断特性，无 SpecTest Host Preview 用例；验证经 VM-1～VM-5 mocha 单测承载——interop 专属用例已随 v1.10 从交付 MR 剔除）"
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

## 验证点6 移除与 demo.md 补充（2026-10-31 proposal v1.7）

- owner 指示（「不需要验证点6，请同步更新spec和spec-for-validation」，经确认按「全链路一致移除」口径）：移除 interop 一致性验收维度——spec.md/spec-for-validation.md 删 AC-1.6/AC-6、interop 规则（原 R-7 重编号为 R-6）、VM-6/验证点6；proposal.md 删 AC-6 行、成功标准 interop 行、风险表 interop 漂移行（v1.7 三处记录：frontmatter evidence、基线版本表、确认依据）；execution-plan.md AC-1.6/AC-6 追溯行改表后注记（证据保留），TASK-2/TASK-3 的 AC 映射与 Spec 引用改「interop 附加覆盖」口径（TASK-2 Spec 引用须含合法 AC，引擎 C 级检查要求）；design.md/review.md 同步；sfv 5.3 跨平台保留「是」的事实性承载描述并去验收化措辞，追认记录登记。
- 保留：interop 镜像代码与 2 个 interop 回归测试（附加覆盖，仓内架构铁律非 AC 验收项）；proposal/spec 事实与历史行（背景证据、范围边界 #6、影响范围、依据表、sfv 双 Owner 签署与历史追认记录）。
- demo.md 整体重写定稿（owner 四轮修正：标题「# 验证点N（VM-N / AC-1.X）：场景+预期」自含描述、去注释块标识；ArkTS 禁 any/unknown 改用 ESObject；WARN 注释内联至引入告警的传参代码行；owner 以验证点1 示范定格内联格式——注释挂参数属性行、构造调用为此拆行，验证点2 同步跟进，反例节 3/4/5 无告警注释保持原形式）：共 5 节（验证点1～5），反例节（3/4/5）纯反例不混正例锚点字段，验证点1/2 参数触发行内保留与 transform_ut_error.json 基线逐字一致的预期 WARN 注释；无验证点6。
- 引擎坑位（本轮新发现）：validate/sfv check 按 `AC-[0-9.]+` 全文提取 AC token——spec「AC-1～AC-5」范围表达会析出幻影 AC-5 并连锁触发 review 覆盖 FAIL；sfv 历史记录中的 AC-1.6/AC-6 字样仍计入集合导致 spec 与 sfv 集合不一致。已改写为非 token 表述（spec 输入文档注「以 AC-1 为首的 5 条 AC」、sfv 追认记录中性化措辞）。
- 哈希：baseline_digest `a619a94b…c14f1` 变更为 `8808e9a9…9c19b9`（v1.7 变更后复算，回填后复跑幂等）；source_spec_hash 变更为 `a74ddd81…5f15`；source_design_hash 变更为 `5f7d0066…7141`（spec/design 本轮均有变更，design 因 ADR-6 行 R-7 残留二次修正后定稿）。
- 验证：`ohos-sdd spec-for-validation check` 15/15 PASS；`ohos-sdd validate --level all` 46 checks / 0 broken / 0 warn PASS。

## v1.8 类型级触发扩展——文档链修订（2026-10-31 proposal v1.8，owner 批准「文档链先行」，代码待 plan 批准后执行）

- owner 需求：「当前没有考虑到传 void 0 或者传变量（xxx | undefined）的情况。」方案澄清选定「两者都告警（类型级触发）」，owner 回复「批准，文档链先行（推荐）」——先修订全链文档供审，批准 execution-plan 后再动代码（Red→Green）。
- 行为边界：`void 0`→WARN got `'undefined'`；联合变量→WARN got `'number | undefined'` 等；收窄后（`!== undefined` 守卫内）不告警；`any`/`unknown`（ESObject）不判定不告警；声明含 undefined/无 @Require/嵌套对象内部不变。WARN 契约 v1.5 逐字不动。
- 文档链：proposal.md（AC-5 行类型级重写 + AC-6 新增，baseline_digest 终值 `90954a24…85380`）；spec.md（AC-1.5 重写/AC-1.6 新增/R-5 重写/R-7 新增/VM-7～VM-8，VM-6 不复用；L114 表格内管道符转义修复）；design.md（ADR-4 类型级、探针行、TASK-4 拆分、测试输入约束 AC-1.5 重写 + AC-1.6 新增；探针行补 `文件:行号` 引用过 design-quality 门禁）；execution-plan.md（TASK-4 完整 Task Card + Phase-3 + AC 追溯 AC-6/AC-1.6 新行 + 编号复用注记）。
- sfv：refresh（v1.3 先例模式）+ owner 回填——frontmatter/元信息 ReadyForReview、八章 7 行（AC-1.5 v1.8 口径 + AC-1.6 新撰）、十一章重附 3 条追认记录 + 新增 v1.8 修订记录、附录重附 4 条术语 + 「类型级触发」新术语、5.2/5.3/5.5/6.5/九章类型级同步；source_design_hash 同步 `a416f735…dbcc9`。
- demo.md：验证点7（VM-7/AC-1.6 V1+V2 类型级正例，WARN 注释内联到引入告警的参数属性行）/验证点8（VM-8/AC-1.5 收窄+ESObject 反例）；验证点5 标题轻同步类型级口径。
- CLI 渲染坑位（本轮新发现）：sfv refresh 的 `_remove_developer_verification_columns` 按 `|` 朴素切分再拼接——design.md 测试输入约束表格行内 `\|` 转义必被拆裂为 `\ |`（转义失效拆裂单元格）；源头规避：该节行文禁用管道符（AC-1.6 行改「`number` 与 `undefined` 的联合类型」措辞）。
- validate 门禁实证：`validate --level all` 门禁 sfv 审批状态（D spec-for-validation 边要求 Approved）——v1.8 修订稿呈批期间该项 FAIL 属预期，owner 批准后置 Approved 闭合。
- 验证：`ohos-sdd spec-for-validation check` 15/15 PASS；`ohos-sdd validate --level all` 46 checks / 4 broken（全部为 TASK-4 待执行 + sfv 待批的 Phase Gate 预期项：TASK-4 完成回填 + review 三证据 + sfv 获批置 Approved 后闭合）。

## v1.8 类型级触发扩展——TASK-4 交付（2026-10-31）

- 代码：主链 `isTypeDefinitelyIncludingUndefined`（:2087-2097，Any/Unknown→false 与声明侧 `isTypeIncludingUndefined` 方向相反、同保守，函数头 2 行注释显式说明）+ 触发条件类型级替换（:2147-2148）；镜像逐行同步（helper :2103-2113/触发 :2163-2164，偏移 +16，HELPER/FUNC-REGION-IDENTICAL）；净 diff 恰 Files 表 7 项（2 src 各 +14/-2、pathConfig +2、`transform_ut_error.json` +20/-0 纯追加、interop 测试 +35/-0 纯追加 + 2 fixture 新建，既有 2 页与既有期望条目 diff=0）。
- 测试资产：Extension fixture 2 页——V1（`void 0` + 联合变量正例恰 2 WARN，独立反例 child `narrowed_value` 收窄传值/`any_var_value` ESObject 动态值 0 告警）、V2（`@Require @Param` 两正例恰 2 WARN）；interop 新增 `expectRequireUndefinedWarns` 多 WARN 精确断言 helper（既有单 WARN helper 不动）+ Extension V1/V2 用例 2 个。
- 三态验证（fresh）：基线 etsTest 357/2、interopArkTest 1122/19（IDENTICAL-19）→ Red 357/4、1122/21（新 2 页 `expected false to be true`/新 2 用例 `expected [] to have a length of 2`，errorInfos=0 断言先行通过反证无 ERROR 噪音）→ Green 359/2（`✔ 1-62/1-63`）、1124/19（`✔ V1/V2 extension`）；三态失败集零漂移、passing 恰 +2；build 114 files PASS；只读 eslint 新增区间 0 命中（103 error 全预存，主 50/镜像 53 行号均在编辑区外）。证据 `evidence/checks/task4-red-green/`（README + 8 份日志；与 v1.4/v1.5 措辞周期 `task4-warn-wording/` 编号复用、语义无关）。
- 回填闭环：execution-plan（状态行/AC 追溯 AC-6+AC-1.6 新行与 AC-1.5 v1.8 部分/Task 列表 Done/Steps 9 复选框/Anti-Fake Actual/Verification Actual/代码范围映射 TASK-4 行）、review.md（GA/GB/GC v1.8 括注 + Evidence 索引 task4 行 + 开放问题 #7 + 最终决策 v1.8 增补句）、evidence/reviews 三份 v1.8 增补段（Approved 维持，spec-compliance 基准 spec.md md5 `254bf315c9444956a20f9df36c717172`）、sfv 置 Approved（owner 指示「根据新的规格，更新代码实现」= 文档链批准 + TASK-4 执行授权；双 Owner 裸结论格 + 追认记录 v1.8 批准段承载依据）。
- 终验：`ohos-sdd spec-for-validation check` 15/15 PASS；`ohos-sdd validate --level all` 46 checks / 0 broken / 0 warn PASS——v1.8 文档链节登记的 4 项 Phase Gate 预期 broken（TASK-4 Actual/AC 状态、code-quality Task 覆盖、sfv 门）全部闭合。
- Commit：`单 commit（Change-Id Ia0e5e0a，2026-10-31）`——代码+文档同 commit，owner 指令上传，已推送 fork 分支并评论 start build 触发门禁；追溯同 #1 口径（review.md 开放问题 #7 已处置）。
- 引擎坑位（本轮新发现，validate 修复后闭合）：引擎表格解析按 `|` 朴素切分不识别 `\|` 转义——追溯表内 `\|` 使列位错列（AC-1.6 行 Commit 被错读为结果列）；AC 追溯结果列须裸 `pass`；Verification Actual 判定为 PASS 子串匹配（`passing` 即满足，eslint 行需显式 PASS 前缀）；code-quality 的 Task 覆盖按 H2 精确标题 `## Plan Scope vs Actual Code Scope` 提取（v1.8 增补段 H3 表不入场，TASK-4 行须登记进 H2 原表）；sfv 双 Owner 结论格 lower 后须精确等于 approved/pass/通过/同意（带括注长文本不匹配，批准依据入追认记录）。

## v1.9 评审意见处置修订——文档链澄清（2026-10-31 proposal v1.9，PR #1747 评审意见 owner 逐项拍板）

- 背景：design-docs 归档 PR #1747 收到 TerryTsao/caojin 10 条评审意见（resolved=False），owner 逐项拍板「1. 是，2. B，3. 不做，4. 不关闭，5. 我已手动回复，不用处理。」并补充「跨平台改成是」；处置映射：①proposal AC 改 GWT ②角色措辞「鸿蒙应用开发者」③静态工具链意见 owner 已手动回复（文档不动）④数组/集合口径明示 ⑤告警消息模板内嵌 AC ⑥5.3 跨平台按 ArkUI-X（iOS & Android）口径重写、interop 降格仓内镜像铁律、ArkUI-X 实测登记后续验证项（B 方案在本环境不可行——iOS 需 macOS+Xcode、ArkUI-X SDK 四源全断、PR #7243 未合入，经 owner 知悉后以「跨平台改成是」收口）⑦sfv 错误信息列反引号 ⑧5.12 理由补强 ⑨6.1 编译性能影响分析；另 #1655 保持开启（PR #1747 门禁维持重复 PR 检测封锁现状）。行为契约（触发条件/级别/文案模板/定位/反例边界）与代码零变更。
- proposal.md：frontmatter evidence/基线版本/确认依据三处 v1.9 记录；受众表 + US-1/US-2 措辞改「鸿蒙应用开发者」；AC-1～AC-6 改 Given/When/Then（对齐 spec AC-1.1～AC-1.6 既有三段式），AC-1 内嵌消息模板 + 数组/集合泛型引用括注，AC-5 反例补数组/集合元素级 undefined；baseline_digest 复算回填 `34e1df20…cc9b8`（回填后复算幂等）。
- spec.md：输入文档/关键文档 v1.9 标签；US-1/US-2 措辞；AC-1.1 THEN 内嵌消息模板（三插值说明），AC-1.2/AC-1.6 改引用 AC-1.1 模板；AC-1.1 Given 与 AC-1.5 反例补数组/集合口径；类型判定矩阵后新增「数组/集合等泛型引用类型口径（v1.9 注记）」两维度注记；R-5 触发条件补数组/集合字面量元素示例、边界列补「不展开类型参数与内部元素」。
- sfv：refresh（v1.8 先例模式，diff 全量核对仅预期变更：EXTERNAL-SPEC 投影 + hash 自动回填 + 骨架重置）+ 恢复清单回填（frontmatter status/subprofiles、产物状态、创建日期、八章两列——AC-1.5 行补数组/集合元素级反例、术语表 5 条、十一章审批区与 5 条追认记录）+ 手工区修订——5.3 跨平台重写（ArkUI-X 定性 + 后续验证项两行表）、5.5 AC-1.1/1.2/1.6 消息模板反引号 + AC-1.1/1.5 数组/集合括注、5.12 自解释型诊断理由补强、6.1 编译性能影响分析、术语表 interop 去跨平台化、十一章追加 v1.9 修订记录；source_spec_hash 由 refresh 自动回填 `2188bc41…260be`（design 未变更 `a416f735…dbcc9` 不动，ch10/十一章 hash 同步自动更新）。新坑位：refresh 将元信息「创建日期」重置为当日，恢复清单须一并恢复原值。
- review.md：GA v1.9 括注 + 最终决策 v1.9 增补句（文档修订零代码变更，GA/GB/GC Approved 维持；spec-compliance.md v1.8 增补段所录 spec md5 为当时审查基准的历史记录，不复改）。
- 验证：`ohos-sdd spec-for-validation check` 15/15 PASS；`ohos-sdd validate --level all` 46 checks / 0 broken / 0 warn PASS。
- 后续（待 owner 放行）：commit → push fork（PR #7243 随动）→ 同步 PR #1747 分支（10 文件 + PR 侧独有 feature.md/metadata_tracking.yaml）→ 逐条回复 TerryTsao（③跳过）→ 按配额评论 start build（#1655 未关，门禁仍会被封锁——届时与 owner 确认）。

## v1.10 交付 MR 测试资产剔除（2026-11-03）

- 背景：owner 会话指示（2026-11-03，方案 A）将 interop 专属单测文件 `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts` 从交付 MR #7243 剔除，且仅修订业务仓 .codespec（design-docs PR #1747 不动）。该文件为 MR 新增（v1.5 创建 2 用例 + v1.8 追加类型级用例与 helper，共 +156 行），以新 commit 删除、不改历史：`60eff618`（Change-Id Ibe0dab28，test: drop interop ark_compiler_ut unit test from @Require warning MR），已推送 fork（PR #7243 随动，47→46 文件，head `60eff6182e0ac777dcfde46e814a1db8adb237eb`）。
- 剔除安全性：`run:interopArkTest` 为纯通配发现（`mocha "arkTest_build/ark_compiler_ut/**/*.test.js"`），无 BUILD.gn/JSON 显式注册；主链 `run:arkTest` 本就排除 interop 目录；既有 interop 回归套件与主链 etsTest/transform_ut 断言不受影响。
- 范围口径：范围包含项7（proposal）由「主链路+interop 双路径」调整为主链路端到端断言承载；interop 镜像代码同步实现保留（仓内架构铁律），本特性在镜像链路无 MR 内行为级断言——镜像一致性由 TASK-2 逐行同步纪律承载；AC/行为契约/需求语义/其余范围无变更。
- 文档链注记（活范围声明；历史执行记录保持交付时点事实，evidence/ 为历史快照不回改）：proposal（包含项7/基线版本/frontmatter evidence 三处 v1.10 记录，baseline_digest 复算回填 `94263fe0…9c09`）、design（调用链测试层、既有模式复用、ADR-5 影响、TASK-3/4 拆分、测试性设计 interop 行、风险表 interop 行共 7 处注记，source_design_hash 回填 `103d131c…4fb`）、execution-plan（Plan 状态行、受影响文件全量清单测试层行、Task 列表 TASK-3/4 文件范围与 AC 映射括注、TASK-3 Produces、代码范围映射 TASK-3/4 实际列）、sfv（5.3 interop 行验证方式、术语表 interop 行、元信息产物状态/最后更新、十一章 v1.10 修订记录）、review（最终决策 v1.10 增补）、manifest（本节 + spectest_feature_path）。spec.md 零引用无变更（source_spec_hash 保持 `2188bc41…260be`）。
- 验证：`ohos-sdd spec-for-validation check` 15/15 PASS；`ohos-sdd validate --level all` 46 checks / 0 broken / 0 warn PASS。
- 后续（待 owner 指令）：PR #7243 门禁重触发（11-02 通过后因新 commit 推送重置，11-03 当日配额 0/3）；PR #1747（design-docs）刻意不同步——owner 拍板仅改业务仓，PR 侧文件保持 v1.9 内容，与业务仓 v1.10 暂时 divergent。

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
