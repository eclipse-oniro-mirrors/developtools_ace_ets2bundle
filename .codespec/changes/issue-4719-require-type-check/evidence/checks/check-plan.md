# check-plan — issue-4719-require-type-check（Plan 阶段一致性检查）

> 检查时间：2026-10-29；执行：ohos-plan（Agent）；profile：`arkui`（owner 约定值；subprofile `toolchain` 无对应文件——O-1 决策保留，编译/测试命令按仓内实际推导）。

## 信息检索手段记录

| 手段 | 检索内容 | 结果 |
|---|---|---|
| 源码核对（grep） | `compiler/package.json` 脚本链：build（babel src→lib，`--ignore ./src/interop`）、interopBuild（babel src/interop/src→lib）、etsTest（先 build 再 mocha）、interopArkTest（先 interopBuild 再 mocha）、lint（eslint ./src） | 5 个脚本名与依赖关系确认：etsTest 自带主链路 rebuild、interopArkTest 自带镜像 rebuild——TASK-3 的 Red 切换（临时注释挂载行后重跑）无需额外编译步骤 |
| 源码核对（read） | `compiler/test/transform_ut/ut_validate.test.ts:196-260` 断言机制 | 双重断言确认：`warnInfos.length === expectWarnInfos.length`（计数）+ 每条实际 warn 的 message 在期望列表 findIndex 匹配（文案）；errorCollection 按页面名取值，单对象或数组均可（`Array.isArray(errorVals) ? errorVals : [errorVals]`） |
| 目录核对（ls） | fixture 目录与命名惯例：`test/transform_ut/application/.../utForValidate/Decorators/process_custom_component/`（`validateXxx.ets` 系列 + `v2DecoratorInitFromParent.ets` V2 同目录先例）；`test/ark_compiler_ut/interop/`（`process_*.test.ts` 惯例） | TASK-3 的 5 个测试文件落点与命名均有目录先例支撑 |
| 源码核对（grep） | interop 用例加载模式：`process_static_interop_imports.test.ts:26`（`require('../../../lib/ets_checker')`） | interop 变体经 lib/ 消费确认（interopBuild 将 src/interop/src 编译入 lib 同路径） |
| 引擎核对（read） | `ohos_sdd_engine.py`：`_implementation_closure_status`（:493-496，manifest status ∈ {verifying, done, archived} 才触发回填校验）、`_task_source_reference_issues`（Spec/Design References 行级校验）、`_design_quality_issues`（plan 参数仅用于 INV-* Task 存在性交叉校验） | Plan 阶段（status=draft）回填列占位（`-`/Pending/待回填）安全；本 change 无 INV-*，design-quality 不因新增 plan 产生新风险 |
| 模板核对（read） | execution-plan.md 模板（230 行全结构）与 EP 必需锚点（`# 执行计划` + `## AC 到 Task 追溯`） | 逐节按模板落笔；列数对齐（AC 追溯 8 列、Task 列表 8 列、代码范围映射 9 列） |

## arkui Plan Gate 检查（gate-playbook.md:146-165）

| 检查项 | 结果 | 证据/缺口 | 确认来源 | 后续动作 |
|--------|------|-----------|----------|----------|
| Task 列表与 Task 详情一一对应 | 通过 | TASK-1/2/3 三行列表 + 三张完整 Task Card（含 Anti-Fake Completion、Verification、Review Handoff、状态所有权、任务间接口五要素齐备） | 文档交叉核对（execution-plan.md） | 无 |
| 每 Task 自闭环条件落位（gate 第 1-4 条） | 通过 | TASK-1：生产代码 + build/lint 编译闭环（行为断言显式声明由 TASK-3 回填，依赖列声明）；TASK-2：镜像代码 + interopBuild/lint；TASK-3：测试代码 + etsTest/interopArkTest 全量回归 | Task Card Verification/Anti-Fake 各表 | 实施会话按 Card 回填 fresh 证据，不跨会话补证 |
| 编译命令按子 profile 推导（gate 第 3 条） | 通过 | toolchain 子 profile 无文件（O-1），命令按仓内实际推导：`npm run build`/`npm run lint`/`npm run interopBuild`（Phase-1）、`npm run etsTest`/`npm run interopArkTest`（Phase-2），全部经 package.json 脚本名核验 | 源码核对（package.json） | 无 |
| 验证证据写入 Task Card（gate 第 5 条） | 通过 | 每张 Card 的 Verification 表保留 Actual Result 回填位 + 命令/路径/Expected 已固化；回填触发条件（manifest status → verifying）已核验 | Task Card + 引擎核对（_implementation_closure_status） | 实施会话回填 |
| SpecTest 适用性（gate 第 6-7 条） | N/A（有理由+替代验证） | 编译期诊断无 Host Preview/Inspector 可断言表面（manifest `spectest_feature_path` 已记 N/A）；替代验证 = VM-1～VM-6 mocha 单测（fixture+期望日志+文案逐字符匹配），TASK-3 承载 | manifest.md + spec.md 验证映射 | 无 |
| 文件范围纪律（gate「Plan 后实现审查」第 6 条前置） | 通过 | 每 Task 设 Files/禁止修改文件双表：src 两文件归 TASK-1/2 各自独占、测试 5 文件归 TASK-3、utils.ts/lib/ 声明禁改或只读；Red 采集的临时注释要求恢复（TASK-3 Steps + Anti-Fake「净 diff 为零」） | Task Card 各表 | 无 |
| 热路径/内存/组件兼容预登记 | N/A（有理由） | 编译期静态诊断不命中运行时热路径；TS 源无动态内存；不改组件 API/DSL/状态机（与 check-design 同结论，review 阶段复核） | design.md 调用链层级分析 + 不涉及项承接 | review 阶段执行 |

## ohos-plan skill 自检（Verification Checklist 结论）

机器项以 validate 结果为准：`--level B` PASS（6/6）；`--level C` **PASS（11/11，0 broken，0 warn）**——此前唯二缺失的 `spec→plan`（无 execution-plan.md）已随本文件对应 plan 落地闭合，`spec→execution-plan`/`plan→source-references`/`execution-plan→code` 三边全绿。

- spec 每个 AC 被至少一个 Task 覆盖：通过（AC-1.1～AC-1.6 全部映射 TASK-1～TASK-3；proposal 级 AC-1/AC-6 一并登记，8 行追溯）
- Task 粒度独立可验证：通过（3 Task = 主链路实现/镜像同步/测试落地，各自有独立验证命令与停止条件；依赖显式：TASK-2←TASK-1，TASK-3←TASK-1+TASK-2）
- 「AC 到 Task 追溯」为单一事实源：通过（计划列已填、回填列占位，列数 8 列与引擎回填校验对齐）
- STATE-*/INV-* 映射：无（design 未引入状态不变量，三张 Card 状态所有权节均按模板保留 N/A 行）
- Produces/Consumes 一致：通过（TASK-1 Produces 函数契约 + WARN 契约 → TASK-2 Consumes 镜像复制、TASK-3 Consumes 期望条目登记；函数名/参数/消息模板均显式写出，不靠推断）
- Task 只引用已存在编号/锚点：通过（AC-1.1～1.6、R-1～R-7、ADR-1～6、`spec.md#规则定义`/`spec.md#验证映射`/`design.md#关键设计决策`/`design.md#测试性设计` 全部经引擎 `plan→source-references` 行级校验）
- 生成文件声明：通过（lib/ 声明为 Babel 生成物，经 build/interopBuild 再生，禁手工编辑）
- 无 TBD/TODO/占位指令/跨 Task 隐式依赖/「参考 Task-N」式引用：通过（禁止项自查 6 项全勾；回填列的 `-`/Pending 为模板设计的实施期回填位，非执行指令）

## 校验与基线记录

| 项 | 结果 |
|---|---|
| `ohos-sdd validate --level B` | PASS（6/6） |
| `ohos-sdd validate --level C` | PASS（11/11，0 broken，0 warn） |
| approval.baseline_digest | `e8fc51f2d44d2cf2f04c527dcd5b14eff20b9e41dc5af80320687066ec474264`（与 proposal.md frontmatter 一致，未漂移——仅 proposal 需求基线参与哈希，plan 阶段未触碰） |
| `git diff --check`（.codespec/） | 无空白错误 |
| git 状态 | execution-plan.md 新增（untracked）；proposal/spec/design/manifest/registry 为此前阶段已修改；evidence/、spec-for-validation.md 为旁路产物 |

## 一致性结论

execution-plan.md 与已批准上游一致：design.md TASK-1～3 拆分、受影响文件与依赖关系被逐条承接（受影响文件全量清单覆盖 design 调用链 7 层 + lib/ 生成物声明；每张 Task Card 的 Files/Read-only Context/Reference Pattern 全部使用 design 代码事实基线的 file:line 引用）；spec R-1～R-7 语义、固定消息模板、VM-1～VM-6 验证映射在 Produces 契约、Steps、Verification 中逐项对齐（fixture 期望条目文案要求逐字符一致；反例可选字段用联合类型写法避开既有问号 ERROR——`process_component_member.ts:161` 事实落地为 TASK-3 设计约束）。Red→Green 采集机制（挂载行临时注释 + 脚本自带 rebuild）经 package.json 脚本链核验可行。

**Plan 审批闭环（2026-10-29）**：用户（本会话需求方/owner）于会话明确回复「批准 Plan」。execution-plan.md Plan 元数据状态已更新为 `Approved`，计划审批生效；`.codespec/registry.md` 行状态流转 `Plan → Implement`。审批人：用户（本会话需求方）；批准对象：execution-plan.md 全量内容（8 行 AC 追溯、受影响文件全量清单 7 层+lib 声明、TASK-1～3 三张 Task Card、代码范围映射 3 行、1 项开放问题承接）。批准后复验：`--level B` PASS（6/6）、`--level C` PASS（11/11，0 broken，0 warn）、`approval.baseline_digest` 不变（`e8fc51f2…`）、`git diff --check` 无空白错误。后续进入 ohos-implement 阶段（按 TASK-1 → TASK-2 → TASK-3 顺序执行，Phase-1 实现镜像 / Phase-2 测试回归）。
