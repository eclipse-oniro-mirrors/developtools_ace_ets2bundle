# 执行计划

> 将 Approved Spec 拆成可独立执行、可验证、可审查的 Task。每个 Task 用稳定 ID 和章节锚点引用上游事实，不复制 Spec/Design 正文。

## Plan 元数据

| 字段 | 内容 |
|------|------|
| Plan ID | PLAN-require-type-check-001 |
| 关联 Feature/Bug | REQ-09-01-01-01（沿用 proposal 需求ID）；GitCode Issue 4719（issue-4719-require-type-check） |
| 关联文档 | proposal.md / design.md / spec.md / spec-for-validation.md（Profile 旁路件） |
| 复杂度 | 简单 |
| 状态 | Approved（TASK-1～TASK-4 已交付：TASK-4 为 v1.8 修订新增，经 owner 2026-10-31 批准执行，代码与 Red→Green 证据落地、本 Plan 已回填；已提交单 commit（Change-Id Ia0e5e0a，2026-10-31 owner 指令上传）；v1.10 注记（2026-11-03）：interop 专属单测文件已按 owner 指示从交付 MR 剔除（commit 60eff618，Change-Id Ibe0dab28），范围声明同步注记，AC 验证点全部由主链路 transform_ut 落点承载） |
| Owner | 用户（本会话需求方） |

## 输入状态

| 输入 | 路径 | 要求状态 |
|------|------|----------|
| Requirement | `proposal.md`（基线 v1.8，approval.baseline_digest 90954a24e283…） | Approved |
| Design | `design.md`（DESIGN-require-type-check-001；ADR-1～ADR-6；TASK-1～TASK-4） | Approved |
| Spec | `spec.md`（AC-1.1～AC-1.6；R-1～R-7；VM-1～VM-5 与 VM-7～VM-8；VM-6 已随 v1.7 移除不复用） | Approved |

> spec-for-validation.md 为测试输入旁路件（ReadyForReview，双 Owner 签署中，不阻塞主流程）；其约束已回流 design.md「测试输入约束」章节，本 Plan 的 TASK-3 与 TASK-4 与之对齐（TASK-4 对应 v1.8 新增验证点7/8 的测试输入）。

## 执行原则

- **Spec 权威：** 实现与 AC、错误码、兼容性声明冲突时，停止并修订 spec/design/plan，不能在代码里自行改语义。
- **测试/证据先行：** 每个 Task 先确认失败测试或可复现证据缺口，再做最小实现并取得 fresh PASS 证据。
- **任务小型化：** 一个 Task 只覆盖一个独立闭环；跨接口、事件链、状态生命周期或构建边界的工作应拆分。
- **文件边界：** 只能修改 Task 的 Files/允许修改范围；需要额外文件时先修订 Plan。
- **状态所有权唯一：** 新增或修改状态必须明确 owner、key/index、创建、读取、更新、清理触发和不变量。
- **证据回填：** Task 完成当次会话回填追溯状态、实际文件、Commit、Review Evidence 和 Actual Result，不跨会话补证。
- **反伪完成：** 只补声明、只写存储、只覆盖 happy path、只跑无关测试或只填写 PASS 文本，都不能替代 AC 闭环。
- **生成文件：** 只修改生成源并运行生成命令；手工改生成物不能作为最终交付。

## 受影响文件全量清单

> 对照 design.md 调用链层级分析，逐层列出每层涉及的具体文件。本变更为编译期诊断增强：4 层不修改（仅消费/环境约束），3 层为实际落点。

| 仓 | 层（来自 design.md） | 文件路径 | 修改类型 | 说明 |
|----|---------------------|----------|----------|------|
| developtools/ace_ets2bundle | 构建编排层（外部） | `compiler/compile_plugin.js` | 不修改 | 插件链顺序固定（etsChecker 先于 etsTransform），本变更仅作为环境约束 |
| developtools/ace_ets2bundle | TS 检查层 | `compiler/src/ets_checker.ts`（globalProgram 于 `compiler/main.js`） | 不修改 | 变换前创建 Program/Checker；校验仅消费其产物 |
| developtools/ace_ets2bundle | UI 变换层 | `compiler/src/fast_build/ets_ui/rollup-plugin-ets-typescript.ts` | 不修改 | 驱动 etsTransform，本变更不改变换逻辑 |
| developtools/ace_ets2bundle | 组件校验层 | `compiler/src/process_custom_component.ts` | 修改 | 新增 `validateRequireParamUndefinedType` 并挂入 `validateCustomComponentPrams`（TASK-1 落点）；v1.8 传入值判定升级为类型级（新增严格判定 helper、替换语法级触发条件，TASK-4 落点） |
| developtools/ace_ets2bundle | 类型判定 | `compiler/src/process_custom_component.ts`（新函数体）；`compiler/src/utils.ts`（只读） | 新增（utils.ts 只读复用） | checker 类型解析与 undefined 成员判定；复用 `utils.ts` 既有 `getOriginPropertyType`/`CurrentProcessFile.getChecker`，不修改 utils.ts |
| developtools/ace_ets2bundle | interop 镜像 | `compiler/src/interop/src/process_custom_component.ts` | 修改（同步副本） | 主链路改动逐行复制至镜像，镜像自包含（目录内相对导入），TASK-2 落点；v1.8 触发条件升级同步（TASK-4 落点） |
| developtools/ace_ets2bundle | 测试层 | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/`（v1.5 新建 2 fixture + v1.8 新建 2 Extension fixture，既有 2 页零改动）；`compiler/test/transform_ut/helpers/pathConfig.ts`；`compiler/test/transform_ut_error.json`；`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（新建 + v1.8 追加用例；v1.10 已从交付 MR 剔除） | 新增用例/修改注册 | VM-1～VM-5 落点（TASK-3）；VM-7～VM-8 落点（TASK-4）；v1.10 注记：interop 附加覆盖用例已从交付 MR 剔除，AC 验证点全部由主链路 transform_ut 落点承载 |
| developtools/ace_ets2bundle | 生成物（src→lib 流水线） | `compiler/lib/**` | 不手工修改 | Babel 生成物：主链路经 `npm run build` 再生、interop 镜像经 `npm run interopBuild` 再生；禁止直接编辑 |

**检查项：**
- [x] design.md 调用链每一层都有对应文件列出（7 层全覆盖 + lib/ 生成物声明）
- [x] 每个文件修改类型和职责说明明确
- [x] 无映射行的层意味着设计到实现的翻译缺失，需回溯补充 design.md（无缺失层）

## AC 到 Task 追溯

> AC = Acceptance Criteria（验收标准）。spec 中每个验收标准必须映射到至少一个 Task。proposal AC-1～AC-6 与 spec AC-1.1～AC-1.6 顺序对应（spec.md 输入文档节声明；v1.8 新增 AC-6/AC-1.6，AC-5/AC-1.5 反例边界按类型级口径重写），两套编号均登记以保完整追溯。计划阶段填 AC/Task/计划文件，实施后回填实际文件、Commit、Review Evidence。

| AC | 来源 | Task | 计划代码范围 | 实际 Code Ref | Commit | Review Evidence | 验证状态 |
|----|------|------|--------------|-----------------|--------|-----------------|----------|
| AC-1 | proposal.md（对应 spec AC-1.1） | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V1 判定与挂载） | `compiler/src/process_custom_component.ts:2112-2151`（主函数）+ `:2077-2110`（3 个 helper）+ `:1575`（挂载行） | `单 commit（Change-Id Ieca81b2）` | Review Approved（2026-10-29）：`evidence/reviews/spec-compliance.md` + `code-quality.md` + `verification.md`（汇总 `review.md`）；实施验证证据 `evidence/checks/task3-red-green/README.md` | pass |
| AC-1.1 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V1 @Require 集合同源判定 + 显式 undefined 判定 + WARN 推送） | 同 AC-1（V1 decoratorVariable 五集合并集 :2124-2130；顶层 undefined 判定 :2131-2135；WARN 推送 :2144-2149）；fixture 断言 `validateRequireParamUndefinedType.ets`（正例 require_value 恰 1 WARN） | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.2 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V2 paramDecoratorMap.hasRequire 分支） | 同 AC-1（:2122-2123 childStructInfo 派生 + :2137-2139 hasRequire 判定）；fixture 断言 `validateRequireParamUndefinedTypeV2.ets`（@Require @Param 正例恰 1 WARN） | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.3 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（类型含 undefined、any、unknown、不可解析 → 不告警回退） | 同 AC-1（`isTypeIncludingUndefined` :2077-2085 含 any/unknown/undefined 联合回退；`:2087-2099` 符号链不可解析回退）；fixture 反例 union_value/any_value 0 告警 | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.4 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（无 @Require 字段排除） | 同 AC-1（:2147-2149 无 hasRequire 且不在 decoratorVariable → 跳过）；fixture 反例 no_require_value/V2 plain_param_value 0 告警 | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.5 | spec.md | TASK-1, TASK-3, TASK-4 | v1.8 重写边界：仅顶层 PropertyAssignment.initializer 进入判定；解析类型不含 `undefined` 的变量/表达式（含联合类型变量收窄后）与 `any`/`unknown` 动态值不告警 | v1.5 口径已闭合（2026-10-29）：同 AC-1（:2132-2134 语法级判定）+ fixture 反例 variable_value（this.numValue）/nested_value（对象字面量内部 undefined）0 告警；v1.8 扩展反例已闭合（2026-10-31，TASK-4）：Extension fixture 独立反例 child `narrowed_value`（`!== undefined` 守卫内收窄传值）与 `any_var_value`（ESObject 动态值）类型级触发下 0 告警（etsTest `✔ 1-62` 计数+消息断言通过） | v1.5：`单 commit（Change-Id Ieca81b2）`；v1.8：`单 commit（Change-Id Ia0e5e0a）` | v1.5：同上（evidence/reviews/ 三份，2026-10-29 Approved）；v1.8：evidence/reviews/ 三份 v1.8 增补段（2026-10-31）+ `evidence/checks/task4-red-green/README.md` | pass |
| AC-6 | proposal.md（对应 spec AC-1.6） | TASK-4 | 主链+镜像传入值判定升级（语法级→类型级）+ Extension fixture 2 页正例断言（每页恰 2 WARN）+ interop 新用例 | 主链 `isTypeDefinitelyIncludingUndefined`（:2087-2097；Any/Unknown→false 与声明侧方向相反、同保守）+ 触发条件类型级替换（:2147-2148）+ 镜像同构（helper :2103-2113/触发 :2163-2164，新增块 diff IDENTICAL）；fixture `validateRequireParamUndefinedTypeExtension.ets`/`...ExtensionV2.ets` 每页恰 2 WARN（etsTest `✔ 1-62/1-63`）；interop 新用例 2 个（`✔`） | `单 commit（Change-Id Ia0e5e0a）` | evidence/reviews/ 三份 v1.8 增补段（2026-10-31 Approved）+ `evidence/checks/task4-red-green/README.md` | pass |
| AC-1.6 | spec.md | TASK-4 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（触发条件替换为传入值解析类型含 `undefined`，新判定 helper `isTypeDefinitelyIncludingUndefined`）+ `compiler/src/interop/src/process_custom_component.ts` 镜像同步 + `compiler/test/transform_ut/.../validateRequireParamUndefinedTypeExtension.ets`/`...ExtensionV2.ets`（新建，V1/V2 各恰 2 WARN）+ interop 追加 2 用例 | 同 AC-6（主链 helper :2087-2097 + 触发 :2147-2148、镜像 :2103-2113/:2163-2164；期望消息逐字符——got 段 V1 `'undefined'` 与 number/undefined 联合文本、V2 `'undefined'` 与 string/undefined 联合文本，逐字符全文锚定 spec.md 验证映射 VM-7/VM-8 与 `evidence/checks/task4-red-green/README.md`；interop `expectRequireUndefinedWarns` 计数+逐条消息断言） | `单 commit（Change-Id Ia0e5e0a）` | 同 AC-6（evidence/reviews/ 三份 v1.8 增补段 + task4-red-green README） | pass |

> **附加覆盖注记（v1.7，2026-10-31 owner 指示移除 interop 验收维度）：** 原 AC-1.6/AC-6 追溯行（interop 镜像一致性）不再作为 AC 验收项——TASK-2 镜像同步依仓内架构铁律保留（主链路改动必须同步 `compiler/src/interop/src/` 镜像），TASK-3 的 interop 用例保留为附加回归覆盖。原行证据存档：镜像 `compiler/src/interop/src/process_custom_component.ts:2093-2167`（同 4 函数，与主链路逐行等价偏移 +16）+ `:1591` 挂载行；主/镜像新增块 diff 逐行 IDENTICAL；interop 用例经 lib 变体断言同文案 WARN（2/2 PASS）；Commit `单 commit（Change-Id Ieca81b2）`；Review 同 evidence/reviews/ 三份（2026-10-29 Approved）。

> **编号复用注记（v1.8，2026-10-31）：** 上表新增的 AC-6/AC-1.6 行为 v1.8 类型级触发正例（proposal US-2/AC-6 ↔ spec AC-1.6），与 v1.7 移除的 interop 维度 AC-6/AC-1.6 编号相同、语义无关——AC 编号随 proposal/spec v1.8 基线顺延复用（spec.md 输入文档对应关系已注记），VM-6 编号则不复用（v1.8 新增验证维度顺延为 VM-7/VM-8）。TASK-4 执行前，AC-6/AC-1.6 行与 AC-1.5 行 v1.8 部分的实际 Code Ref/Commit/Review Evidence 为待回填状态。

## 首批实现边界

**首批必须实现（v1.5 周期，已交付）：** TASK-1 主链路校验函数（V1/V2 判定 + WARN 推送 + 挂载）；TASK-2 interop 镜像同步（同一改动逐行复制）；TASK-3 全部测试（V1/V2 fixture 含反例矩阵、pathConfig 注册、transform_ut_error.json 期望、interop 用例）及 Red→Green 证据。
**首批必须实现（v1.8 周期）：** TASK-4 类型级触发扩展（主链+镜像触发条件替换与新判定 helper、Extension fixture 2 页、注册/期望/interop 新用例、Red→Green 证据）。
**可后置：** 无（简单复杂度，各周期全部 Task 均为该周期首批交付内容）。
**不建议延后：** TASK-2/TASK-3 任一延后会导致 interop 镜像同步缺失（仓内架构铁律）与零误报反例（R-3/R-4/R-5/R-6）失去断言锁定；TASK-4 延后会导致 AC-1.6 类型级正例与 v1.8 扩展反例（收窄/`any`）失去断言锁定，v1.8 基线不闭合。

## 阶段计划（如适用）

| 阶段 | 目标 | 关键 Task | 结束门槛 | 最小验证 |
|------|------|-----------|----------|----------|
| Phase-1 | 主链路与镜像诊断实现 | TASK-1, TASK-2 | `npm run build`、`npm run lint`、`npm run interopBuild` 全通过；src 改动仅限两份 `process_custom_component.ts`（主链路 + 镜像） | `cd compiler && npm run build && npm run lint && npm run interopBuild` |
| Phase-2 | 测试锁定与回归（v1.5 周期，已交付） | TASK-3 | `npm run etsTest`、`npm run interopArkTest` 全量通过；Red→Green 证据已存档；AC 追溯表回填完成 | `cd compiler && npm run etsTest && npm run interopArkTest` |
| Phase-3 | v1.8 类型级触发扩展与回归（Red→Green） | TASK-4 | `npm run build` 通过；`etsTest`/`interopArkTest` 新增页/用例红转绿且既有用例零漂移（含既有 2 页 v1.5 期望零漂移）；Red→Green 证据存档 `evidence/checks/`；AC-1.5（v1.8 部分）/AC-6/AC-1.6 追溯行回填 | `cd compiler && npm run build && npm run etsTest && npm run interopArkTest` |

## Task 粒度原则

- 每个 Task 对应一个可独立验收的最小能力闭环
- 两项改动共享同一规则上下文和同一最小验证闭环 → 合并为一张 Task Card
- 文件范围、验证闭环和风险边界足够分离 → 拆分为多张 Task Card
- 简单变更：1-2 张 Task Card；复杂变更：按接线层/规则层/恢复层拆分
- 每个 Task 是可独立验证的最小能力闭环，任务边界由能力闭环决定，不单纯按代码行数或预估时间划定
- 单 Task 上下文（Spec + Design + 代码 + 测试）超过 3000 行时优先沿 AC/文件边界拆分；Handoff Summary 只引用本 Task 直接相关的 AC、规则和设计锚点

## 禁止项

执行计划和 Task 不得出现以下内容：

- [x] 占位符检查通过（无未解决占位项，人工全文核对）
- [x] 没有"根据需要实现""酌情处理"等模糊指令
- [x] 没有跨 Task 隐式依赖（依赖必须显式声明在前置依赖列）
- [x] 没有要求 Agent 自行寻找未列出的上下文文件
- [x] 没有无验证方式的 AC
- [x] 没有"与 Task-N 类似""参考 Task-N 实现"等引用（每个 Task 自包含）

## Task 列表

| Task ID | 目标 | 文件范围 | AC 映射 | 前置依赖 | 完成判据 | 验证命令 | 状态 |
|---------|------|----------|---------|----------|----------|----------|------|
| TASK-1 | 主链路新增校验函数并挂入构造传参校验入口 | `compiler/src/process_custom_component.ts` | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 | 无（proposal/spec/design Approved） | `npm run build` 与 `npm run lint` 通过；新函数在 `validateCustomComponentPrams` 内单点挂载；`utils.ts` 等共享模块零改动 | `cd compiler && npm run build && npm run lint` | Done |
| TASK-2 | interop 镜像同步同一改动 | `compiler/src/interop/src/process_custom_component.ts` | —（镜像铁律，非 AC） | TASK-1 | `npm run interopBuild` 与 `npm run lint` 通过；镜像改动与主链路逐行等价 | `cd compiler && npm run interopBuild && npm run lint` | Done |
| TASK-3 | 测试落地：fixture + 注册 + 期望日志 + interop 用例，Red→Green 回归 | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/`（新建 2 fixture）；`compiler/test/transform_ut/helpers/pathConfig.ts`；`compiler/test/transform_ut_error.json`；`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（新建；v1.10 已从交付 MR 剔除） | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5（interop 附加覆盖已随 v1.10 剔除，AC 断言全部由主链路承载） | TASK-1, TASK-2 | `npm run etsTest` 与 `npm run interopArkTest` 全量通过（既有用例零漂移）；Red 证据已存档 | `cd compiler && npm run etsTest && npm run interopArkTest` | Done |
| TASK-4 | v1.8 类型级触发扩展：主链+镜像传入值判定升级（语法级→类型级）+ 判定 helper，Extension fixture 2 页 + 注册/期望 + interop 新用例，Red→Green 回归 | `compiler/src/process_custom_component.ts`；`compiler/src/interop/src/process_custom_component.ts`；`compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/`（新建 2 Extension fixture）；`compiler/test/transform_ut/helpers/pathConfig.ts`；`compiler/test/transform_ut_error.json`；`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（追加用例；v1.10 已从交付 MR 剔除） | AC-1.5（v1.8 扩展反例）, AC-1.6 | TASK-1, TASK-2, TASK-3（Done）+ proposal/spec/design v1.8 基线 Approved + 本 Plan v1.8 修订获 owner 批准 | `npm run build` 通过；`etsTest` 全量 359 passing / 2 failing（新增 2 页红转绿、预存基线 2 例不变）；`interopArkTest` 全量 1124 passing / 19 failing（新增 2 用例红转绿、IDENTICAL-19 不变）；既有 2 fixture 页与其期望条目零改动；Red 证据存档 | `cd compiler && npm run build && npm run etsTest && npm run interopArkTest` | Done |

## Task 详情

### TASK-1: 主链路校验函数实现

| 字段 | 内容 |
|------|------|
| 任务目标 | 在 `compiler/src/process_custom_component.ts` 新增校验函数 `validateRequireParamUndefinedType`（@Require 成员判定 + 顶层显式 undefined 传值判定 + checker 类型判定 + WARN 推送），挂入 `validateCustomComponentPrams` 与既有三个 validate* 并列调用，形成主链路最小能力闭环 |
| AC 映射 | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 |
| 前置依赖 | proposal.md/spec.md/design.md 均 Approved（已满足）；无前置 Task |
| 非目标 | 不改 interop 镜像（TASK-2）；不落 fixture/期望日志/测试用例（TASK-3）；不改既有诊断（10905316/10905321/10905359、问号限制规则）的级别/文案/触发条件；不给 WARN 分配数字码（owner 决策 O-3）；不改 compile_plugin.js 插件链与构建脚本 |
| 完成判据 | `npm run build` 与 `npm run lint` 通过；新函数在 `validateCustomComponentPrams` 内单点挂载；`utils.ts`、`ets_checker.ts` 等共享模块零改动；`lib/` 仅经 build 再生。行为级 AC 证据（正例 1 条/反例 0 条）由 TASK-3 的 VM-1～VM-5 断言回填至追溯表（依赖已显式声明） |
| 停止条件 | ① checker（getLinterTypeChecker）对 struct PropertyDeclaration 的类型解析与 ADR-1 预期不符，且 getOriginPropertyType/类型节点备选路径均不可行；② 实现需要修改 `utils.ts` 或两份 `process_custom_component.ts` 之外的文件；③ 需要改动插件链顺序/构建脚本。任一命中即停止并回传修订 Plan |
| Design 状态/不变量 | N/A（design.md 未引入 STATE-*/INV-*；校验函数为纯同步诊断，无运行时状态） |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：纯同步编译期诊断，不引入运行时状态、缓存或并发） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用；函数名、参数、错误码和数据结构不得靠执行者自行推断。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | 函数 `validateRequireParamUndefinedType`：挂入 `validateCustomComponentPrams`，入参与既有 validate*（`validateInitDecorator` 等，`compiler/src/process_custom_component.ts:1572-1574`）一致（node/name/log/parentStructInfo），对构造传参对象逐字段判定 | TASK-1 → TASK-2 | TASK-2 将同一函数逐行镜像复制至 `compiler/src/interop/src/process_custom_component.ts` | 函数名、参数顺序、判定逻辑在主链路与镜像间逐行一致（镜像行为契约；仓内架构铁律，v1.7 起非 AC）；镜像保持目录内相对导入 |
| Produces | WARN 诊断契约：`log.push({ type: LogType.WARN, message: 消息模板以字段名插值, pos: item.getStart() })`，无 code 字段；消息模板 = spec.md 规则定义节固定英文模板（'@Require' decorated '字段名' expects type '声明类型' but got '实际传入类型' through the component constructor.） | TASK-1 → TASK-3 | TASK-3 的 transform_ut_error.json 期望条目按此契约登记 | 文案逐字符一致（ut_validate 断言消息匹配）；无数字码（O-3）；每命中字段恰 1 条 |
| Consumes | `CurrentProcessFile.getChecker()`（`compiler/src/utils.ts:1618-1623`，只读复用） | TASK-1 | 既有导出 | checker 不可用→按 ADR-6 保守回退（不告警、不抛错） |
| Consumes | `getOriginPropertyType`（`compiler/src/utils.ts:1583`，只读复用） | TASK-1 | 既有导出 | 仅 TypeAlias 场景按需调用；checker 原生解析已覆盖时不调用 |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/utils.ts:1583-1623` | 复用 `getOriginPropertyType` 与 `CurrentProcessFile.getChecker`（只读，禁止修改） |
| `compiler/src/process_import.ts:790-800` | 使用点符号解析链模式参考（getSymbolAtLocation→getAliasedSymbol→declarations[0]，ADR-1） |
| `compiler/src/fast_build/system_api/api_validator/api_validate_node.ts:168` | 显式 undefined 标识符判定既有模式参考（ADR-4） |
| `compiler/src/process_component_member.ts:161` | mandatoryToInitViaParamDecorators 不含 @Require 的事实（fixture 可选字段须用联合类型写法的依据） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | 代码事实基线（12 项 file:line）与 ADR-1～ADR-6、数据流/控制流 7 步 |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/process_custom_component.ts` | 新增 `validateRequireParamUndefinedType` 函数；在 `validateCustomComponentPrams`（:1542）内既有三连调用（:1572-1574）之后并列挂载调用 |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/utils.ts` | 只读复用既有导出；需改动时触发停止条件②，停止并修订 Plan |
| `compiler/src/interop/src/**` | TASK-2 所有（镜像同步独立闭环） |
| `compiler/test/**` | TASK-3 所有（测试落地独立闭环） |
| `compiler/lib/**` | Babel 生成物，仅经 `npm run build` 再生，禁止手工编辑 |
| `compiler/compile_plugin.js`、`compiler/BUILD.gn`、根级构建脚本 | 插件链顺序与构建编排固定（OH-ARCH-COMPONENT-BUILD） |
| `compiler/src/ets_checker.ts`、`compiler/src/fast_build/ets_ui/**` | TS 检查层/UI 变换层仅消费，不修改 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1.1`, `AC-1.2`, `AC-1.3`, `AC-1.4`, `AC-1.5`, `R-1`, `R-2`, `R-3`, `R-4`, `R-5`, `R-6`
- Anchors: `spec.md#规则定义`, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-1`, `ADR-2`, `ADR-3`, `ADR-4`, `ADR-5`, `ADR-6`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：诊断为 LogType.WARN、无数字码（O-3）、文案为 spec 固定英文模板、pos 为传值属性节点起点；Must Not：不新增 ERROR、不改既有 10905xxx 诊断的级别/文案/触发条件 |
| OH-ARCH-LAYERING | Must：类型判定仅经 `CurrentProcessFile.getChecker` 消费 etsChecker 阶段创建的全局 Program；Must Not：不引入反向或跨层依赖 |
| OH-ARCH-COMPONENT-BUILD | Must：变更限于 src/ 校验逻辑，`lib/` 由 `npm run build` 再生；Must Not：不改 BUILD.gn/插件链顺序/构建脚本 |

**Steps**

- [x] 确认证据缺口与基线：核对 Read-only Context 5 处参考代码与 design.md 代码事实基线一致（不一致即停止回传）；当前主链路对 issue 4719 场景（@Require non-null 字段显式传 undefined）输出 0 条告警，即本 Task 要闭合的可复现证据缺口（Red 信号定义见 spec VM-1）
- [x] 实现 @Require 成员判定：V1 用 decoratorVariable 同源集合（5 个 Initialization 并集，与 10905359 同源，`compiler/src/process_custom_component.ts:2038-2071`）；V2 用 `paramDecoratorMap.hasRequire`（与 10905321 同源，:716-746）
- [x] 实现顶层显式 undefined 传值判定：`ts.isPropertyAssignment(item) && ts.isIdentifier(item.initializer) && item.initializer.text === 'undefined'`（仅构造传参对象顶层字段值）
- [x] 实现 checker 类型判定链：`CurrentProcessFile.getChecker()` → getSymbolAtLocation→getAliasedSymbol→declarations[0] 定位子组件 struct 声明 → 与字段名匹配的 PropertyDeclaration → 声明类型 undefined 成员判定（any/unknown/含 undefined 联合→跳过；TypeAlias 由 checker 原生解析，必要时 `getOriginPropertyType` 辅助；不可解析→按 ADR-6 不告警返回）
- [x] 实现 WARN 推送（Produces 契约）：`log.push({ type: LogType.WARN, message: 模板插值, pos: item.getStart() })`，无 code 字段
- [x] 在 `validateCustomComponentPrams` 内挂载调用（与既有三个 validate* 并列）
- [x] 运行 `cd compiler && npm run build` 与 `cd compiler && npm run lint`，确认通过（含 fork checker 对 struct PropertyDeclaration 类型返回的实证，异常时按 ADR-1 备选回退）
- [x] 回填 AC 追溯、实际文件、Commit、Review Evidence、Actual Result 和计划偏差

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| `compiler/src/process_custom_component.ts:2068-2071`（private 属性 WARN 无码推送） | 日志/错误处理：log.push type LogType.WARN、无 code 字段 | 无 |
| `compiler/src/process_custom_component.ts:1572-1574`（validate* 三连挂载） | 调用链：validateCustomComponentPrams 内并列调用既有 validate* | 无 |
| `compiler/src/process_import.ts:790-800`（getDefinedNode 符号解析链） | 调用链：getSymbolAtLocation→getAliasedSymbol→declarations[0]，解析失败返回空不抛错 | 无 |
| `compiler/src/fast_build/system_api/api_validator/api_validate_node.ts:168` | 判定：ts.isIdentifier && node.text === 'undefined' | 无 |
| `compiler/src/utils.ts:1583-1623` | getOriginPropertyType（visitedTypes 环保护）/ CurrentProcessFile.getChecker 只读复用 | 无 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | AC-1.1～AC-1.5 的实现证据：build+lint fresh 通过输出（本 Task 编译闭环）；行为正例/反例/边界断言由 TASK-3 的 VM-1～VM-5 回填（依赖已显式声明于 Task 列表前置依赖列，本 Task 不得以编译通过替代 AC 行为闭环声明） |
| Scope respected | 实际 diff 仅含 `compiler/src/process_custom_component.ts`；与代码范围映射 TASK-1 行一致；超范围即触发停止条件② |
| State lifecycle complete | N/A：无 STATE-*/INV-*（纯同步编译期诊断，无状态生命周期） |
| Interface contract matched | WARN 契约（type/message/pos/无 code）与 Consumes 的 checker 入口行为一致；Produces 供 TASK-2 逐行镜像、TASK-3 期望条目登记，签名与模板逐字符对齐 |
| Relevant verification | `npm run build` 与 `npm run lint` 直接覆盖本 Task 生产代码（非无关测试）；行为验证归 TASK-3 且已在依赖列声明 |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** AC-1.1～AC-1.5 编译闭环 PASS（build 114 files / 新增区间 lint 0 错误）；行为正例/反例/边界断言已由 TASK-3 以 etsTest Red→Green 闭合（`✔ 1-60/1-61`，正例恰 1 WARN + 反例矩阵 0 条），证据 `evidence/checks/task3-red-green/README.md`。
- **Scope respected：** 实际净 diff 仅 `compiler/src/process_custom_component.ts`（+77 行纯插入：3 helper `:2077-2110` + 主函数 `:2112-2151` + 挂载行 `:1575`），与代码范围映射 TASK-1 行一致，无超范围。
- **State lifecycle complete：** N/A 维持（纯同步编译期诊断，无新增运行时状态）。
- **Interface contract matched：** WARN 契约（type/message/pos/无 code）与 spec 逐字符对齐；Produces 被 TASK-2 逐行镜像（主/镜像新增块 diff IDENTICAL）、被 TASK-3 期望条目逐字符消费（文案断言 PASS）。实现偏差 1 项：函数签名省略 parentStructInfo 参数（childStructInfo 内部派生），详见「实现偏差记录」表。
- **Relevant verification：** build/lint 输出见 Verification 表；行为验证 TASK-3 已完成并回填。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 编译 | `cd compiler && npm run build` | build 全步（generateDeclarations→babel src→lib→uglify→copyJsonFiles）无错误，新函数编译入 lib | **PASS（2026-10-29）**：`Successfully compiled 114 files with Babel (3239ms)`，copyJsonFiles 完成，新函数编译入 lib（grep lib 产物含 `validateRequireParamUndefinedType`）。净 diff 仅 1 个 src 文件。注：首次 build 后运行 `npm run lint`（带 --fix）曾污染约 186 个范围外 src 文件（行尾空格/缩进美化），已 `git checkout -- compiler/src/` 全量回退并重放本 Task 改动后重建 |
| 静态检查 | `cd compiler && npm run lint` | eslint 0 error（warning 按仓内既有基线） | **PASS（新增区间 0 错误）**：全仓 `npm run lint` 报 1005 error——经与 HEAD 逐行对账全部为存量基线（该仓 lint 基线非干净）；只读 `./node_modules/.bin/eslint compiler/src/process_custom_component.ts --ext .ts` 核对：50 个存量 error 行号全部 ≤2007，本 Task 新增区间（:1575 挂载行、:2077-2151 函数块）0 命中。--fix 污染已回退（见上行注），AGENTS.md 认可只读 eslint 替代 |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-1：主链路新增 `validateRequireParamUndefinedType` 校验函数并挂入 `validateCustomComponentPrams`（V1/V2 判定 + WARN 推送） |
| 允许修改 | `compiler/src/process_custom_component.ts` |
| 允许新建 | 无 |
| 只读参考 | `compiler/src/utils.ts`、`compiler/src/process_import.ts`、`compiler/src/fast_build/system_api/api_validator/api_validate_node.ts`、`compiler/src/process_component_member.ts` |
| Spec 引用 | `AC-1.1`～`AC-1.5` / `R-1`～`R-5`, `R-6` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-1`～`ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run build && npm run lint` / 期望: PASS |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | AC-1.1～AC-1.5 与 R-1～R-5/R-6 的实现对照；诊断契约（WARN/无码/固定模板/属性级 pos）；偏差=无（或已修订 Plan） |
| Code Quality | 实际代码范围（单文件 diff）、Base/Head SHA、lint 结果；内存/热路径不适用（编译期一次性遍历，无运行时开销） |
| Verification | build/lint 的 Expected/Actual 与 fresh 输出路径；AC 追溯表 TASK-1 相关行回填状态；行为断言证据指向 TASK-3 |

### TASK-2: interop 镜像同步

| 字段 | 内容 |
|------|------|
| 任务目标 | 将 TASK-1 的同一改动逐行复制到 `compiler/src/interop/src/process_custom_component.ts` 镜像副本（同名函数、同消息模板、同判定逻辑、同挂载位置），保持 interop 工具链与主链路行为一致 |
| AC 映射 | AC-1.1, AC-1.2（interop 附加覆盖；镜像同步义务为仓内架构铁律，v1.7 起非独立 AC 验收项） |
| 前置依赖 | TASK-1 完成（Consumes 其 Produces 契约） |
| 非目标 | 不改主链路文件（TASK-1 所有）；不落测试（TASK-3）；不抽取共享模块替代复制（镜像自包含约束，目录内相对导入） |
| 完成判据 | `npm run interopBuild` 与 `npm run lint` 通过；镜像文件改动与主链路实现逐行等价（同名函数、同模板、同挂载） |
| 停止条件 | ① 镜像文件与主链路同名函数/上下文存在无法逐行对应的漂移（镜像基线 ：1558/调用 ：340 与主链路 ：1542/调用 ：1572-1574 对应关系核对失败）；② 需要修改 `interop/src/utils.ts` 或镜像目录外文件。任一命中即停止并回传修订 Plan |
| Design 状态/不变量 | N/A（无 STATE-*/INV-*） |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：镜像为同一纯同步诊断的副本） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | interop 镜像变体的 `validateRequireParamUndefinedType`（`compiler/src/interop/src/process_custom_component.ts`，行为契约与主链路一致） | TASK-2 → TASK-3 | TASK-3 的 interop 用例经 lib/ 加载镜像变体断言（附加覆盖，v1.7 起非 VM） | 同级别/同文案/同定位（与主链路行为一致，仓内架构铁律）；镜像自包含（from './utils' 目录内导入，不共享模块） |
| Consumes | TASK-1 Produces 的函数结构、判定逻辑与 WARN 契约（函数名/参数顺序/消息模板/pos 规则） | TASK-2 | TASK-1 | 签名与行为与主链路逐行一致；utils 复用镜像目录内平行副本（`interop/src/utils.ts:1582/:1608`，只读） |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/process_custom_component.ts`（TASK-1 完成态） | 镜像复制的源实现 |
| `compiler/src/interop/src/utils.ts:1582-1608` | 镜像内 `getOriginPropertyType`/`CurrentProcessFile` 平行副本（只读复用，禁止修改） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | 代码事实基线 interop 镜像事实行（自包含约束）与既有模式复用「interop 镜像同步」行 |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/interop/src/process_custom_component.ts` | 将 TASK-1 改动逐行复制至镜像副本：新增同名函数、在镜像 `validateCustomComponentPrams`（:1558，调用点 :340）同位置挂载 |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/**`（主链路） | TASK-1 所有 |
| `compiler/test/**` | TASK-3 所有 |
| `compiler/lib/**` | 生成物，仅经 `npm run interopBuild` 再生，禁止手工编辑 |
| `compiler/src/interop/src/utils.ts` | 只读复用镜像内平行副本；需改动时触发停止条件② |
| `compiler/compile_plugin.js`、构建脚本 | 插件链与构建编排固定 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1.1`, `AC-1.2`（interop 附加覆盖）、`R-1`（镜像行为契约与主链路一致；镜像同步义务为仓内架构铁律，非独立 AC/Rules 项）
- Anchors: `spec.md#规则定义`, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-2`, `ADR-5`, `ADR-6`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：镜像诊断与主链路同级别（WARN）、同文案、同定位、无数字码；Must Not：不新增 ERROR |
| OH-ARCH-LAYERING | Must：类型判定经镜像目录内 `CurrentProcessFile.getChecker` 平行副本消费既有 Program；Must Not：不跨目录共享主链路模块 |
| OH-ARCH-COMPONENT-BUILD | Must：`lib/` 镜像产物由 `npm run interopBuild` 再生；Must Not：不改构建脚本与插件链 |

**Steps**

- [x] 核对镜像基线对应关系：镜像 `validateCustomComponentPrams`（:1558，调用点 :340；getChecker 先例 :667/:1251/:1833）与主链路 TASK-1 完成态（:1542，挂载行）逐行对应；不一致即停止回传
- [x] 将 TASK-1 改动逐行复制至镜像副本（同名函数 `validateRequireParamUndefinedType`、同消息模板、同判定链、同挂载位置；导入保持目录内相对形式）
- [x] 运行 `cd compiler && npm run interopBuild`（将 `src/interop/src` 编译入 lib）
- [x] 运行 `cd compiler && npm run lint`
- [x] 回填 AC 追溯、实际文件、Commit、Review Evidence、Actual Result 和计划偏差

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| `compiler/src/interop/src/process_custom_component.ts:1558`（镜像 validateCustomComponentPrams，调用点 :340） | 镜像同步：逐行复制改动、目录内相对导入、不共享模块 | 无 |
| `compiler/src/interop/src/process_custom_component.ts:667、:1251、:1833` | 镜像内 getChecker 使用先例（判定链复用位置） | 无 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | 镜像同步实现证据（仓内架构铁律，非 AC）：interopBuild+lint fresh 通过输出；与主链路逐行对照的镜像 diff（同名函数/同模板/同挂载）；行为一致性断言由 TASK-3 interop 用例（interopArkTest 附加覆盖）回填（依赖已声明） |
| Scope respected | 实际 diff 仅含 `compiler/src/interop/src/process_custom_component.ts`；与代码范围映射 TASK-2 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（镜像为纯同步诊断副本，无状态生命周期） |
| Interface contract matched | Consumes 与 TASK-1 Produces 的函数名/参数顺序/消息模板/pos 规则逐项一致；Produces 镜像行为供 TASK-3 interop 用例消费 |
| Relevant verification | `npm run interopBuild` 与 `npm run lint` 直接覆盖镜像文件（非无关测试） |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** 镜像同步证据 PASS（原 AC-1.6 验收口径，v1.7 起为仓内架构铁律、非 AC；interopBuild 127 files / 新增区间 lint 0 错误 / 主镜像新增块 diff 逐行 IDENTICAL）；行为一致性已由 TASK-3 interopArkTest 闭合（interop 用例 2/2 `✔`，WARN 计数=1 且文案与主链路逐字符一致），证据 `evidence/checks/task3-red-green/README.md`。
- **Scope respected：** 实际净 diff 仅 `compiler/src/interop/src/process_custom_component.ts`（+77 行纯插入：函数块 `:2093-2167` + 挂载行 `:1591`），与代码范围映射 TASK-2 行一致，无超范围。
- **State lifecycle complete：** N/A 维持。
- **Interface contract matched：** 与 TASK-1 Produces 的函数名/参数顺序/消息模板/pos 规则逐项一致（IDENTICAL diff 证明）；镜像行为已被 TASK-3 interop 用例经 `require('../../../lib/...')` 消费并通过。
- **Relevant verification：** interopBuild/lint 输出见 Verification 表；行为验证 TASK-3 已完成并回填。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 编译 | `cd compiler && npm run interopBuild` | interopBuild（generateDeclarations→babel src/interop/src→lib→uglify→interopCopyJsonFiles）无错误，镜像编译入 lib | **PASS（2026-10-29）**：`Successfully compiled 127 files with Babel (3423ms)`，镜像新函数编译入 lib（grep lib 产物含 `validateRequireParamUndefinedType`）。主/镜像新增块（4 函数 + 挂载行）`diff` 逐行 **IDENTICAL**；净 diff 恰为 2 个声明文件（主链路 + 镜像），utils.ts 等共享模块零改动 |
| 静态检查 | `cd compiler && npm run lint` | eslint 0 error（含 src/interop；warning 按仓内既有基线） | **PASS（新增区间 0 错误）**：只读 `./node_modules/.bin/eslint compiler/src/interop/src/process_custom_component.ts --ext .ts` 报 53 个存量 error（镜像文件历史基线），新增区间（:1591 挂载行、:2093-2167 函数块）0 命中（grep 函数名/错误定位均无新错误）。未再运行带 --fix 的 `npm run lint`，避免对范围外文件的写回污染（TASK-1 已回退处理一次） |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-2：将 TASK-1 校验函数逐行同步至 interop 镜像副本并保持行为一致 |
| 允许修改 | `compiler/src/interop/src/process_custom_component.ts` |
| 允许新建 | 无 |
| 只读参考 | `compiler/src/process_custom_component.ts`（TASK-1 完成态）、`compiler/src/interop/src/utils.ts` |
| Spec 引用 | `AC-1.1`, `AC-1.2`（interop 附加覆盖）/ `R-1` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-2`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run interopBuild && npm run lint` / 期望: PASS |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | 镜像与主链路逐行一致性核对（同级别/同文案/同定位，仓内架构铁律非 AC）；偏差=无（或已修订 Plan） |
| Code Quality | 镜像文件 diff、Base/Head SHA、lint 结果；自包含约束（目录内相对导入）未破坏 |
| Verification | interopBuild/lint 的 Expected/Actual 与 fresh 输出路径；行为一致性证据指向 TASK-3 interop 用例（附加覆盖） |

### TASK-3: 测试落地与 Red→Green 回归

| 字段 | 内容 |
|------|------|
| 任务目标 | 落地 VM-1～VM-5 与 interop 附加覆盖用例：新增 V1/V2 fixture（含反例矩阵）、`pathConfig.ts` 页面注册、`transform_ut_error.json` 期望条目、interop 用例；采集 Red→Green 证据并运行 etsTest/interopArkTest 全量回归 |
| AC 映射 | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5（interop 用例为附加覆盖，不挂 AC） |
| 前置依赖 | TASK-1、TASK-2 完成（Red 切换以两者的挂载行为为基准） |
| 非目标 | 不改 `src/` 生产代码（Red 证据采集仅临时注释挂载行并即时恢复，净 diff 不含 src 改动）；不新增本特性之外的用例；不调整既有 fixture/期望条目（回归基线） |
| 完成判据 | `npm run etsTest` 与 `npm run interopArkTest` 全量通过且既有用例零漂移；新用例正例 WARN 计数=1、文案逐字符匹配，反例 0 条；Red 输出（挂载行注释状态下的失败记录）已存档；AC 追溯表全部行回填 |
| 停止条件 | ① fixture 反例字段触发无法规避的既有诊断（期望计数无法收敛为 正例 1 条 WARN + 0 ERROR）——停止并回传调整 fixture 设计；② etsTest/interopArkTest 出现与本特性无关的既有用例失败——停止并报告环境问题，不得以修改期望条目方式掩盖 |
| Design 状态/不变量 | N/A（无 STATE-*/INV-*） |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：测试文件与期望日志为静态资产，不引入运行时状态） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用。本 Task 为末端 Task。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | VM-1～VM-5 验证资产：2 个 fixture 页 + UT_VALIDATE_PAGES 注册 + 2 个期望 WARN 条目（原含 interop 附加覆盖用例 `process_custom_component.test.ts`，已随 v1.10 从交付 MR 剔除——本 Task 交付资产以主链路 transform_ut 为准） | TASK-3（末端，供归档审查消费） | 消费 TASK-1/TASK-2 实现后的实际行为 | fixture 字段名与 JSON message 插值逐字符一致；期望条目不得登记本告警之外的漂移 |
| Consumes | TASK-1 Produces 的 WARN 契约（type/message 模板/pos/无 code） | TASK-3 | TASK-1 | `transform_ut_error.json` 期望条目按契约登记（ut_validate 断言计数+消息双匹配） |
| Consumes | TASK-2 Produces 的镜像变体行为 | TASK-3 | TASK-2 | interop 用例经 `require('../../../lib/...')` 加载 interop 变体（interopArkTest 先执行 interopBuild） |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/test/transform_ut/ut_validate.test.ts:88-260` | 断言机制：UT_VALIDATE_PAGES 逐页 mocha.it；warnInfos/errorInfos 计数与消息 findIndex 双断言；errorCollection 按页面名取期望 |
| `compiler/test/transform_ut/helpers/pathConfig.ts:248` | UT_VALIDATE_PAGES 注册格式（无 .ets 后缀相对路径） |
| `compiler/test/transform_ut_error.json` | 期望条目格式：key=页面名，value 为单对象或数组（message + type；type=WARN 入 expectWarnInfos） |
| `compiler/test/ark_compiler_ut/interop/process_static_interop_imports.test.ts:26` | interop 用例加载模式：`require('../../../lib/ets_checker')` 经 lib 消费 interop 变体 |
| `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/` 既有 `validateXxx.ets`、`v2DecoratorInitFromParent.ets` | fixture 结构先例：父子组件构造传参场景（V1/V2 同目录先例） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | 测试性设计（Red 条件与替代验证）、测试输入约束（AC-1.1～AC-1.5 可观察表面） |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Create | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedType.ets` | V1 正例：`@Component` 子组件含 `@Require` 且声明类型不含 undefined 的字段（如 number），父组件构造传参显式传 `undefined` → 期望恰 1 条本告警；反例矩阵：类型含 undefined 的联合类型字段、any 字段、无 @Require 字段、变量传值、对象字面量嵌套内部 undefined（均不告警）。反例可选字段一律用联合类型写法，不用问号（问号触发既有 ERROR，`process_component_member.ts:161`） |
| Create | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedTypeV2.ets` | V2 正例：`@ComponentV2` 子组件含 `@Require @Param` 且类型不含 undefined 的字段，构造传参显式传 `undefined` → 期望恰 1 条同文案告警；V2 反例（无 @Require 的 @Param 字段传 undefined 不告警） |
| Modify | `compiler/test/transform_ut/helpers/pathConfig.ts` | UT_VALIDATE_PAGES 追加 2 个页面注册：`Decorators/process_custom_component/validateRequireParamUndefinedType` 与 `...V2`（无 .ets 后缀） |
| Modify | `compiler/test/transform_ut_error.json` | 追加 2 个期望条目：key=fixture 页面名，message=固定文案以实际字段名插值（须与 fixture 字段名逐字符一致），type=WARN；若 fixture 实测产生其他既有诊断，按实测同步登记（保持断言语义，且不得出现本告警之外的漂移） |
| Create | `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts` | interop 变体用例：复用 ut_validate 的 fixture+日志断言模式，经 `require('../../../lib/...')` 加载 interop 变体，断言与主链路同文案 WARN |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/**`、`compiler/src/interop/src/**` | TASK-1/TASK-2 所有；Red 采集的挂载行注释必须在采集后立即恢复（净 diff 为零） |
| `compiler/lib/**` | 生成物（etsTest/interopArkTest 自行再生） |
| `compiler/test/transform_ut_error.json` 既有条目、既有 fixture | 回归基线，不得调整；出现漂移即停止条件② |
| `compiler/test/transform_ut/ut_validate.test.ts`、`compiler/test/transform_ut/helpers/pathConfig.ts` 中既有注册 | 断言机制与既有注册不动，仅追加 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1.1`, `AC-1.2`, `AC-1.3`, `AC-1.4`, `AC-1.5`, `R-1`, `R-2`, `R-3`, `R-4`, `R-5`, `R-6`（interop 用例为附加覆盖，不挂 AC/Rules）
- Anchors: `spec.md#规则定义`, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：期望条目文案与 spec 固定模板逐字符一致、type=WARN、无 code 断言漂移；Must Not：不借期望条目掩盖既有诊断漂移 |
| OH-ARCH-LAYERING | Must：interop 用例经 lib 变体验证镜像行为（不跨目录共享）；Must Not：不在测试中直接 import src/ 源（须经编译产物） |
| OH-ARCH-COMPONENT-BUILD | Must：测试经既有脚本入口（etsTest/interopArkTest）驱动，build 由脚本内部再生；Must Not：不新增构建脚本或改插件链 |

**Steps**

- [x] 创建 V1 fixture（正例 + 反例矩阵，字段名与后续 JSON message 插值保持一致；反例可选字段用联合类型写法，不用问号）
- [x] 创建 V2 fixture（`@Require @Param` 正例 + 反例）
- [x] `pathConfig.ts` 的 UT_VALIDATE_PAGES 追加 2 个页面注册（无 .ets 后缀）
- [x] `transform_ut_error.json` 追加 2 个期望条目（message=固定文案以 fixture 实际字段名插值，type=WARN；fixture 若实测产生其他既有诊断则同步如实登记）
- [x] Red（主链路）：临时注释 `validateCustomComponentPrams` 内新校验函数挂载行 → 运行 `cd compiler && npm run etsTest`（脚本自动 rebuild lib）→ 确认新用例因正例 0 条 vs 期望 1 条断言失败、既有用例不受影响，保存失败输出 → 恢复挂载行
- [x] Green（主链路）：运行 `cd compiler && npm run etsTest`，全量通过，保存通过输出
- [x] 创建 interop 用例 `process_custom_component.test.ts`（require 加载 lib 中 interop 变体，复用 fixture+日志断言模式）
- [x] Red（interop）：临时注释镜像挂载行 → 运行 `cd compiler && npm run interopArkTest`（脚本自动 interopBuild）→ 保存新用例失败输出 → 恢复
- [x] Green（interop）：运行 `cd compiler && npm run interopArkTest`，全量通过
- [x] 核对净 diff：src/ 两文件与 TASK-1/2 完成态一致（挂载行注释已恢复）
- [x] 回填 AC 追溯（全部行）、实际文件、Commit、Review Evidence、Actual Result 和计划偏差

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| `compiler/test/transform_ut/ut_validate.test.ts:88`（ERROR_COLLECTION_PATH）、:196-260（计数+消息双断言） | 测试：fixture 页 + transform_ut_error.json 期望 + warnInfos.length 与消息 findIndex 断言 | 无 |
| `compiler/test/transform_ut/helpers/pathConfig.ts:248`（UT_VALIDATE_PAGES） | 注册：无 .ets 后缀相对路径，仅追加 | 无 |
| `compiler/test/transform_ut_error.json` 既有 WARN 条目 | 期望条目：key=页面名、message、type；多条时数组形式 | 无 |
| `compiler/test/ark_compiler_ut/interop/process_static_interop_imports.test.ts:26` | interop 用例：`require('../../../lib/...')` 加载 lib 中 interop 变体 | 无 |
| `compiler/test/transform_ut/application/.../process_custom_component/validateInitDecorator.ets`、`v2DecoratorInitFromParent.ets` | fixture 结构：父子组件构造传参场景（V1/V2 同目录先例） | 无 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | VM-1～VM-5 全绿输出 + interop 附加覆盖用例通过（etsTest/interopArkTest）：V1/V2 正例各恰 1 条 WARN 且文案逐字符匹配，反例（联合类型含 undefined、any、无 @Require、非 undefined 标识符、嵌套对象）0 条；既有用例零漂移；Red 输出证明断言非恒真（防只写 PASS 文本） |
| Scope respected | 净 diff 仅含 Files 表 5 项（2 fixture + 2 修改 + 1 interop 用例）；src/ 净改动为零（Red 注释已恢复）；与代码范围映射 TASK-3 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（测试资产无状态生命周期） |
| Interface contract matched | 期望条目 message 与 TASK-1 Produces 契约逐字符一致（字段名插值对齐）；interop 用例消费 TASK-2 Produces 的镜像行为且文案与主链路一致 |
| Relevant verification | etsTest/interopArkTest 直接断言本特性正反例（非无关测试）；Red→Green 成对证据 |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** VM-1～VM-5 全部闭合 + interop 附加覆盖用例通过——V1/V2 正例各恰 1 条 WARN 且文案逐字符匹配、反例矩阵（`number | undefined` 联合 / `any` / 无 @Require / `this.numValue` 变量 / 嵌套对象内 undefined / V2 plain @Param）0 条本告警、ERROR=0；Red 输出证明断言非恒真（主链路 `expected false to be true`、interop `expected [] to have a length of 1`）；既有用例零漂移（主链路失败集 Red→Green 恰差我的 2 页；interop 失败名集合基线对照 IDENTICAL-19）。
- **Scope respected：** 净 diff 恰为 Files 表 5 项（2 fixture 新建 + pathConfig.ts +2 行注册 + transform_ut_error.json +2 期望条目 + interop 用例新建）；src/ 净改动为零（Red 注释已恢复，挂载行 ：1575/:1591 与 TASK-1/2 完成态一致）。测试运行产生的脏文件（ts_checker_cache、testdata build 产物等 5 个跟踪文件 + 若干未跟踪目录）已全部 `git checkout`/清理。
- **State lifecycle complete：** N/A 维持（测试资产无运行时状态；interop 用例内的共享状态处置见「实现偏差记录」interop 驱动行）。
- **Interface contract matched：** 期望条目 message 与 TASK-1 Produces 契约逐字符一致（断言机制逐字符比对 PASS）；interop 用例消费 TASK-2 镜像行为且文案与主链路一致（2/2 PASS）。
- **Relevant verification：** 全量输出与基线对照存档 `evidence/checks/task3-red-green/`（5 份全量日志 + README.md 证据矩阵）；预存基线失败（etsTest 2 例 + interopArkTest 19 例）经 stash 对照证明非本特性引入，未修改任何既有期望条目掩盖，按停止条件②「报告而非掩盖」处置并如实记录。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 测试 | `cd compiler && npm run etsTest` | 全量 mocha 通过；新增 2 用例：正例 WARN 计数=1、文案匹配、ERROR 计数与期望一致；反例 0 条本告警；既有用例零漂移 | **PASS（2026-10-29，新增用例视角）**：357 passing / 2 failing——2 个失败为**预存基线**（`Decorators/process_ui_syntax/ExtendOneChild` 断言失败、`Decorators/vaildate_ui_syntax/StructNameWarn` fixture 在 HEAD 缺失 ENOENT），经 stash 基线对照证明与 HEAD 完全相同（基线 355 passing / 2 failing，同一两例）；本变更新增 2 页 `✔ 1-60 validateRequireParamUndefinedType`、`✔ 1-61 ...V2`（正例 WARN 计数=1、契约文案逐字符匹配、ERROR=0、反例矩阵 0 条本告警），passing 恰 +2、失败集零漂移。日志：`evidence/checks/task3-red-green/main-green-full.txt`、基线对照说明见同目录 README.md |
| 测试 | `cd compiler && npm run interopArkTest` | 全量 mocha 通过；interop 用例 WARN 计数=1 且文案与主链路一致 | **PASS（2026-10-29，新增用例视角）**：1122 passing / 19 failing——19 个失败为**预存基线**（process Lazy Imports / module_mode / generateCompileContext / autoLazyImport 等环境相关用例），stash+暂移用例的基线对照（1120 passing / 19 failing）与 Green 失败用例名集合 diff = **IDENTICAL-19**（逐名一致）；本变更 interop 用例 2/2 `✔`（WARN 计数=1、文案与主链路逐字符一致、ERROR=0），passing 恰 +2。日志：`evidence/checks/task3-red-green/interop-green-full.txt` + `interop-baseline-full.txt` |
| Red 证据 | 挂载行注释状态下重复上述两命令（输出存档于 evidence/） | 新用例失败（正例 0 条 vs 期望 1 条），既有用例不受影响；恢复后 Green | **PASS（成对采集）**：主链路 Red（注释 :1575 挂载行）355 passing / 4 failing——新增 2 页断言失败 `expected false to be true`（实际 WARN 0 vs 期望 1），基线 2 例不变；恢复后 Green 357/2。interop Red（注释镜像 :1591 挂载行）1120 passing / 21 failing——新增 2 用例断言失败 `expected [] to have a length of 1 but got +0`，基线 19 例不变；恢复后 Green 1122/19。Red 注释均已恢复，净 diff 中 src 与 TASK-1/2 完成态一致。存档：`evidence/checks/task3-red-green/`（main-red/main-green/interop-red/interop-green/interop-baseline 5 份全量日志 + README.md 证据矩阵） |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-3：落地 VM-1～VM-5 测试资产与 interop 附加覆盖用例，采集 Red→Green 证据并完成全量回归 |
| 允许修改 | `compiler/test/transform_ut/helpers/pathConfig.ts`、`compiler/test/transform_ut_error.json` |
| 允许新建 | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedType.ets`、同目录 `validateRequireParamUndefinedTypeV2.ets`、`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts` |
| 只读参考 | `compiler/test/transform_ut/ut_validate.test.ts`、`compiler/test/ark_compiler_ut/interop/process_static_interop_imports.test.ts`、同目录既有 fixture |
| Spec 引用 | `AC-1.1`～`AC-1.5` / `R-1`～`R-6` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run etsTest && npm run interopArkTest` / 期望: PASS |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | VM-1～VM-5 与 AC-1.1～AC-1.5 对照（含 spec-for-validation.md 测试输入约束）；期望条目与契约逐字符一致；既有用例零漂移结论 |
| Code Quality | 5 项测试文件 diff、Base/Head SHA、src/ 净改动为零核对；fixture 反例写法合规（联合类型而非问号） |
| Verification | etsTest/interopArkTest 的 Expected/Actual、Red→Green 成对 fresh 输出路径、AC 追溯表全部行回填状态 |

### TASK-4: v1.8 类型级触发扩展与 Red→Green 回归

| 字段 | 内容 |
|------|------|
| 任务目标 | 将主链 `validateRequireParamUndefinedType` 的传入值 undefined 判定由语法级（`ts.isIdentifier(initializer) && text === 'undefined'`，:2135-2136）升级为类型级（传入值解析类型含 `undefined` 成员）：新增严格判定 helper `isTypeDefinitelyIncludingUndefined`（Any/Unknown→false；联合递归判 Undefined 成员；否则 flags & Undefined），`declaredType` 声明侧判定门保持在实际类型解析之前，got 段渲染传入值解析类型文本；镜像逐行同步；落地 Extension fixture 2 页（V1：`void 0` + 联合类型变量正例恰 2 WARN，独立 child 承载收窄/`any` 反例；V2：两正例恰 2 WARN）+ 注册/期望/interop 新用例，采集 Red→Green 证据且既有 2 页零改动 |
| AC 映射 | AC-1.5（v1.8 扩展反例）, AC-1.6 |
| 前置依赖 | TASK-1/TASK-2/TASK-3 已交付（v1.5 周期，单 commit Change-Id Ieca81b2，PR #7243 门禁绿）；proposal.md/spec.md/design.md v1.8 基线 Approved；本 Plan v1.8 修订获 owner 批准（2026-10-31「文档链先行」决策） |
| 非目标 | 不改既有 2 fixture 页（`validateRequireParamUndefinedType.ets`/`...V2.ets`）与其 `transform_ut_error.json` 既有期望条目；不改 WARN 模板文本/LogType.WARN/无数字码/属性级锚点契约；不改声明侧判定门（`isTypeIncludingUndefined` 及其 any/unknown→含 undefined 语义保持）；不改既有诊断（10905316/10905321/10905359、问号限制规则）的级别/文案/触发条件；不改 `compile_plugin.js` 插件链/构建脚本/`utils.ts` |
| 完成判据 | `npm run build` 通过；`etsTest` 全量 359 passing / 2 failing（新增 2 页红转绿，预存基线 2 例不变）；`interopArkTest` 全量 1124 passing / 19 failing（新增 2 用例红转绿，IDENTICAL-19 基线不变）；既有 2 页与其期望条目零改动（git diff 核对）；Red→Green 证据存档 `evidence/checks/`；AC 追溯表 AC-6/AC-1.6 行与 AC-1.5 v1.8 部分回填 |
| 停止条件 | ① 类型级触发导致既有用例（任意 fixture/期望条目）出现新告警漂移且不可归因；② 实现需要修改 Files 表之外文件（含 `utils.ts`/共享模块）；③ got 段渲染与 spec 消息模板口径（`void` 表达式与 `undefined` 标识符→`'undefined'`，其余命中场景为解析类型文本）不符且无法以 checker typeToString 对齐。任一命中即停止并回传修订 Plan |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：纯同步编译期诊断扩展，不引入运行时状态、缓存或并发） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用；函数名、参数、错误码和数据结构不得靠执行者自行推断。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | 判定 helper `isTypeDefinitelyIncludingUndefined(type: ts.Type): boolean`：Any/Unknown→false（与声明侧 `isTypeIncludingUndefined` 方向相反、同保守）；union→递归 some 判 Undefined 成员；否则 flags & ts.TypeFlags.Undefined。主链+镜像同名同实现，置于 `isTypeIncludingUndefined`（:2077-2085/镜像 :2093 起）旁并列 | TASK-4 → 本 Task 校验函数与后续维护 | 主链触发条件替换点（:2135-2136）与镜像对应点消费 | 声明侧 `isTypeIncludingUndefined`（any/unknown→true）语义不动，两函数并存；主/镜像逐行一致（仓内架构铁律） |
| Produces | 类型级触发条件：顶层 PropertyAssignment.initializer 满足 `isTypeDefinitelyIncludingUndefined(checker.getTypeAtLocation(initializer))` 即命中——`undefined` 标识符/`void` 表达式/类型含 `undefined` 的变量均命中，收窄后（解析类型不含 undefined）与 `any`/`unknown` 不命中；WARN 契约不变，got 段 = `checker.typeToString(checker.getTypeAtLocation(initializer))`（v1.5 已动态解析，核对渲染口径即可） | TASK-4 → 既有 2 页期望条目（应零漂移）+ Extension 新期望条目 | 既有 2 页在类型级触发下判定结果必须不变（`undefined` 标识符命中、全部反例不命中） | 消息模板/级别/无码/属性级锚点逐字符不变；每命中字段恰 1 条 |
| Produces | Extension fixture 2 页 + pathConfig 注册 + `transform_ut_error.json` 新期望条目（每页恰 2 WARN）+ interop 追加用例（多 WARN 精确断言 helper + 2 用例） | TASK-4 → etsTest/interopArkTest 断言 | 消费 TASK-4 Green 后实际输出 | 期望消息逐字符：V1 `'@Require' decorated 'void_value' expects type 'number' but got 'undefined' through the component constructor.` 与 `'@Require' decorated 'union_variable_value' expects type 'number' but got 'number \| undefined' through the component constructor.`；V2 同构（string，`void_param_value`/`union_param_value`，got 段 `undefined` 与 `string \| undefined`） |
| Consumes | TASK-1 交付的 `validateRequireParamUndefinedType` 既有结构（挂载点/decoratorVariable 五集合并集/childStructInfo 派生/declaredType 门/WARN 推送） | TASK-4 | 既有实现（:2112-2151/镜像 :2131-2172） | 仅替换传入值判定条件与新增 helper，其余结构不动 |
| Consumes | TASK-3 交付的测试基建（pathConfig UT_VALIDATE_PAGES 注册模式、transform_ut_error.json 期望条目模式、interop 测试文件与 `requireUndefinedWarnMessage`/`expectSingleRequireUndefinedWarn` 断言模式） | TASK-4 | 既有实现 | 既有用例与既有断言 helper 不动，仅追加 |
| Consumes | `CurrentProcessFile.getChecker()`（`compiler/src/utils.ts:1618-1623`，只读复用） | TASK-4 | 既有导出 | checker 不可用→按 ADR-6 保守回退（不告警、不抛错） |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/process_custom_component.ts:2077-2151` | TASK-1 交付的 helper 三件套与主函数；触发条件替换点 :2135-2136；`isTypeIncludingUndefined` 声明侧语义对照（新 helper 与其方向相反、同保守） |
| `compiler/src/interop/src/process_custom_component.ts:2093-2167` | 镜像同构结构（偏移 +16），同步落点参照 |
| `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts:51-110` | `requireUndefinedWarnMessage` 与 `expectSingleRequireUndefinedWarn` 断言模式（多 WARN 精确断言 helper 的扩展基础） |
| `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedType.ets`、同目录 `...V2.ets` | 既有 fixture 结构范本（父子组件、反例写法、联合类型而非问号） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | ADR-4（v1.8 类型级口径）、代码事实基线（L2135-2136 触发缺口 + 探针实测行：收窄豁免/`any` 排除/typeToString 渲染即 got 段文本） |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/process_custom_component.ts` | 新增 `isTypeDefinitelyIncludingUndefined` helper（`isTypeIncludingUndefined` 旁并列）；:2135-2136 触发条件替换为类型级判定；got 段确认保持 `checker.typeToString(checker.getTypeAtLocation(...))` 动态渲染 |
| Modify | `compiler/src/interop/src/process_custom_component.ts` | 主链改动逐行同步（镜像偏移 +16 区域）；主/镜像新增块 diff 复核 IDENTICAL |
| Create | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedTypeExtension.ets` | V1 Extension fixture：正例 child（`void_value: void 0`、`union_variable_value: this.plainUnion`）恰 2 WARN；独立反例 child（`!== undefined` 守卫内 `narrowed_value` 收窄传值、`any_var_value` ESObject 动态值传值）0 告警；父组件联合变量用普通成员 `plainUnion: number \| undefined = 1`（探针实证属性引用不被赋值收窄污染） |
| Create | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedTypeExtensionV2.ets` | V2 Extension fixture：`@Require @Param` 两正例（`void_param_value: void 0`；`union_param_value` ← `@Local unionParamVariable: string \| undefined`）恰 2 WARN |
| Modify | `compiler/test/transform_ut/helpers/pathConfig.ts` | UT_VALIDATE_PAGES 追加 2 页注册（:312-313 区域后，无 .ets 后缀相对路径，仅追加） |
| Modify | `compiler/test/transform_ut_error.json` | 追加 2 页期望条目（每页恰 2 WARN，message/type 与契约逐字符） |
| Modify | `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts` | 新增多 WARN 精确断言 helper + Extension V1/V2 用例 2 个；既有 2 用例与 `expectSingleRequireUndefinedWarn` 不动 |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/utils.ts` | 只读复用既有导出；需改动时触发停止条件②，停止并修订 Plan |
| 既有 2 fixture 页（`validateRequireParamUndefinedType.ets`/`...V2.ets`）与 `transform_ut_error.json` 既有条目 | v1.5 期望零漂移是本 Task 完成判据；改动即破坏 Red→Green 对照基线 |
| `compiler/lib/**` | Babel 生成物，仅经 `npm run build` 再生，禁止手工编辑 |
| `compiler/compile_plugin.js`、`compiler/BUILD.gn`、根级构建脚本 | 插件链顺序与构建编排固定（OH-ARCH-COMPONENT-BUILD） |
| `compiler/src/ets_checker.ts`、`compiler/src/fast_build/ets_ui/**` | TS 检查层/UI 变换层仅消费，不修改 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1.5`, `AC-1.6`, `R-1`, `R-2`, `R-3`, `R-4`, `R-5`, `R-6`, `R-7`
- Anchors: `spec.md#规则定义`, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：诊断保持 LogType.WARN、无数字码（O-3）、文案为 spec 固定英文模板、pos 为传值属性节点起点；Must Not：不新增 ERROR、不改既有 10905xxx 诊断的级别/文案/触发条件 |
| OH-ARCH-LAYERING | Must：类型判定仅经 `CurrentProcessFile.getChecker` 消费 etsChecker 阶段创建的全局 Program；Must Not：不引入反向或跨层依赖 |
| OH-ARCH-COMPONENT-BUILD | Must：变更限于 src/ 两份 `process_custom_component.ts` 与 Files 表测试资产，`lib/` 由 `npm run build` 再生；Must Not：不改 BUILD.gn/插件链顺序/构建脚本 |
| 镜像同步铁律（仓内架构约束） | Must：主链改动逐行同步 interop 镜像，主/镜像新增块 diff IDENTICAL；Must Not：镜像与主链行为漂移 |

**Steps**

- [x] Red 前基线复核：当前工作区 `npm run etsTest` 357 passing / 2 failing、`npm run interopArkTest` 1122 passing / 19 failing（IDENTICAL-19）；不一致即停止排查（非本 Task 引入的漂移不掩盖，按停止条件①处置）
- [x] 新建 Extension fixture 2 页（V1/V2，场景设计见 Files 表）+ pathConfig 追加注册 + `transform_ut_error.json` 追加 2 页期望条目（消息逐字见 Produces 契约）
- [x] interop 测试新增多 WARN 精确断言 helper（既有 `expectSingleRequireUndefinedWarn` 不动）+ Extension V1/V2 用例 2 个
- [x] Red 采集：`npm run etsTest`（预期 357 passing / 4 failing：新 2 页 `expected false to be true` 类失败——期望 2 WARN vs 实际 0；预存基线 2 例不变）与 `npm run interopArkTest`（预期 1122 passing / 21 failing：新 2 用例计数断言失败；IDENTICAL-19 不变），全量输出存档 `evidence/checks/`（含基线对照说明）
- [x] Green 主链：新增 `isTypeDefinitelyIncludingUndefined` helper；:2135-2136 触发条件替换为类型级判定；got 段渲染口径核对（探针已证 typeToString 输出即 got 段文本）
- [x] Green 镜像：同一改动逐行同步 `compiler/src/interop/src/process_custom_component.ts`；主/镜像新增块 diff 复核 IDENTICAL
- [x] `cd compiler && npm run build` → `npm run etsTest`（预期 359 passing / 2 failing）→ `npm run interopArkTest`（预期 1124 passing / 19 failing）；测试污染的被跟踪 testdata 脏文件 `git checkout --` 恢复
- [x] 只读 eslint：`./node_modules/.bin/eslint compiler/src/process_custom_component.ts compiler/src/interop/src/process_custom_component.ts --ext .ts` 核对新增区间 0 错误（禁用带 --fix 的 `npm run lint`，TASK-1 已证其污染 src）
- [x] 回填 AC 追溯表（AC-6/AC-1.6 行、AC-1.5 v1.8 部分）、代码范围映射 TASK-4 行、Anti-Fake Actual、Verification Actual；Red→Green 成对证据归档 `evidence/checks/`

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| `compiler/src/process_custom_component.ts:2077-2085`（`isTypeIncludingUndefined`） | helper 布局：新 `isTypeDefinitelyIncludingUndefined` 旁并列；flags/联合判定句式同源 | Any/Unknown 方向相反（false vs true），系传入值侧保守口径（ADR-4），非复制偏差 |
| TASK-3 交付的 fixture/注册/期望模式（既有 2 页、pathConfig :311-313、transform_ut_error.json 既有条目） | fixture 父子结构、注册与期望条目格式照抄 | 新页独立承载 v1.8 场景，不污染既有页（v1.5 期望零漂移） |
| `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts:103-110`（`expectSingleRequireUndefinedWarn` 恰 1 WARN 断言） | 多 WARN 精确断言 helper 扩展其模式（逐条消息 findIndex + 计数） | Extension 页每页恰 2 WARN 需多消息断言；既有 helper 与用例不动 |
| design.md 代码事实基线探针行（fork TS linter checker 实测） | 收窄豁免/`any` 排除/typeToString 渲染结论直接落地 fixture 反例与 got 段口径 | 探针脚本为临时件未入库，结论由本 Task fixture 固化复证 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | AC-1.6 正例：Extension 每页 WARN 恰 2 条且文案与契约逐字符一致（got 段 `'undefined'`/`'number \| undefined'`/`'string \| undefined'`）；AC-1.5 v1.8 扩展反例：收窄守卫内传值、`any` 动态值 0 条本告警；Red 输出证明断言非恒真（实现前新 2 页 0 WARN vs 期望 2）；既有用例零漂移（主链失败集 Red→Green 恰差新 2 页；interop 失败名集合与基线 IDENTICAL-19） |
| Scope respected | 净 diff 仅含 Files 表 7 项；既有 2 fixture 页与既有期望条目 diff 为零（git diff 核对）；与代码范围映射 TASK-4 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（纯同步编译期诊断扩展，无状态生命周期） |
| Interface contract matched | 消息模板与 spec 逐字符（含模板尾部 ` through the component constructor.`）；主/镜像新增块 diff IDENTICAL；期望条目与实际输出逐字符；`isTypeDefinitelyIncludingUndefined` 与声明侧 `isTypeIncludingUndefined` 并存且方向语义符合 ADR-4 |
| Relevant verification | etsTest/interopArkTest 直接断言本特性 v1.8 正反例（非无关测试）；Red→Green 成对 fresh 输出；探针结论经 fixture 复证 |

**Anti-Fake Actual 回填（2026-10-31）**

- **AC closed：** AC-6/AC-1.6 正例闭合——Extension 每页 WARN 恰 2 条且消息逐字符（V1 got `'undefined'`/`'number | undefined'`、V2 got `'undefined'`/`'string | undefined'`；etsTest `✔ 1-62/1-63` Green）；AC-1.5 v1.8 扩展反例闭合——收窄守卫内传值（`narrowed_value`）与 `any` 动态值（`any_var_value`）0 条本告警，ERROR=0 反证无噪音；Red 输出证明断言非恒真（实现前新 2 页 WARN 0≠2 `expected false to be true`、新 2 用例 `expected [] to have a length of 2 but got +0`）；既有用例零漂移（三态失败集：etsTest 基线 2 → Red 4 → Green 2，interop IDENTICAL-19 不变，passing 恰 +2）。证据 `evidence/checks/task4-red-green/README.md`。
- **Scope respected：** 实际净 diff 仅 Files 表 7 项——2 src 各 +14/-2 + pathConfig +2 + `transform_ut_error.json` +20/-0 纯追加 + interop 测试 +35/-0 纯追加 + 2 fixture 新建；既有 2 fixture 页与既有期望条目 diff = 0；与代码范围映射 TASK-4 行一致。
- **State lifecycle complete：** N/A 维持（纯同步编译期诊断扩展，无 STATE-*/INV-*）。
- **Interface contract matched：** 消息模板与 spec v1.8 逐字符（含模板尾部 ` through the component constructor.`）；主/镜像新增块 HELPER-REGION-IDENTICAL + FUNC-REGION-IDENTICAL（偏移 +16 保持，helper 每文件恰 1 处）；期望条目与实际输出逐字符；`isTypeDefinitelyIncludingUndefined`（Any/Unknown→false）与声明侧 `isTypeIncludingUndefined`（any/unknown→true）并存且方向语义符合 ADR-4，函数头 2 行注释显式说明。
- **Relevant verification：** build 114 files PASS（`green-build.txt`）+ 只读 eslint 新增区间 0 命中（103 error 全预存，`green-eslint.txt`）+ etsTest/interopArkTest Red→Green 成对 fresh 输出（357/4 + 1122/21 → 359/2 + 1124/19，四份日志存档），全部直接覆盖本 Task 生产代码与断言。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 编译 | `cd compiler && npm run build` | build 全步无错误，主链+镜像新 helper/触发条件编译入 lib | **PASS（fresh，2026-10-31）**：`Successfully compiled 114 files with Babel`，copyJsonFiles 完成，无错误——`green-build.txt` |
| 测试 | `cd compiler && npm run etsTest` | 全量 359 passing / 2 failing（新增 2 页红转绿；预存基线 2 例不变；既有用例零漂移）；Extension 页正例恰 2 WARN、反例 0 条、ERROR 0 | **359 passing / 2 failing（fresh）**：`✔ 1-62 validateRequireParamUndefinedTypeExtension`、`✔ 1-63 ...ExtensionV2`（恰 2 WARN + ERROR 0 + 消息逐字符）；既有 1-60/1-61 保持 ✔；失败仅预存基线 2 例（ExtendOneChild、StructNameWarn）——`green-etsTest.txt` |
| 测试 | `cd compiler && npm run interopArkTest` | 全量 1124 passing / 19 failing（新增 2 用例红转绿；IDENTICAL-19 不变）；Extension 用例每页 WARN 计数=2 且文案与主链一致 | **1124 passing / 19 failing（fresh）**：`✔ warns once per field for void expression and union variable in V1/V2 extension`（计数=2 + 文案与主链一致 + ERROR=0）；失败集与基线 IDENTICAL-19——`green-interopArkTest.txt` |
| Red 证据 | 触发条件替换前重复 etsTest/interopArkTest（输出存档 evidence/checks/） | 新页/新用例失败（0 vs 期望 2），既有用例不受影响；Green 后恢复 | **Red 成立（成对 fresh）**：etsTest 357 passing / 4 failing（新 2 页 `expected false to be true`，WARN 0≠2；既有零漂移）；interopArkTest 1122 passing / 21 failing（新 2 用例 `expected [] to have a length of 2 but got +0`，errorInfos=0 断言先行通过 ⇒ 无 ERROR 噪音）；基线对照 357/2、1122/19 一致——`red-etsTest.txt`、`red-interopArkTest.txt`、`baseline-*.txt`（存档 `evidence/checks/task4-red-green/`） |
| 静态检查 | `./node_modules/.bin/eslint <主链/镜像两文件> --ext .ts`（只读） | 新增区间 0 error | PASS：103 error 全部预存（主 50/镜像 53，行号均在编辑区外：主 ≤2007、镜像 ≤2023+EOF）；新增区间（主 :2087-2097/:2147-2148、镜像 :2103-2113/:2163-2164）0 命中；exit=1 系预存违规所致——`green-eslint.txt` |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-4：v1.8 类型级触发扩展——主链+镜像传入值判定升级（语法级→类型级）+ Extension fixture 2 页 + 注册/期望/interop 新用例，Red→Green 回归 |
| 允许修改 | `compiler/src/process_custom_component.ts`、`compiler/src/interop/src/process_custom_component.ts`、`compiler/test/transform_ut/helpers/pathConfig.ts`、`compiler/test/transform_ut_error.json`、`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts` |
| 允许新建 | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedTypeExtension.ets`、同目录 `validateRequireParamUndefinedTypeExtensionV2.ets` |
| 只读参考 | `compiler/src/utils.ts`、既有 2 fixture 页、`compiler/test/transform_ut/ut_validate.test.ts`、design.md 探针结论行 |
| Spec 引用 | `AC-1.5`, `AC-1.6` / `R-5`, `R-7` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run build && npm run etsTest && npm run interopArkTest` / 期望: PASS（359/2 与 1124/19 口径见 Verification 表） |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | AC-1.5（v1.8 边界）/AC-1.6 与 R-5/R-7 对照（含 spec-for-validation.md 验证点7/8 测试输入约束）；期望条目与契约逐字符一致；既有用例零漂移与 v1.5 期望零漂移结论 |
| Code Quality | 7 项文件 diff、Base/Head SHA、主/镜像新增块 IDENTICAL 复核、新增区间只读 eslint 结果；两 helper 方向语义（声明侧 vs 传入值侧）命名与注释核对 |
| Verification | etsTest/interopArkTest 的 Expected/Actual、Red→Green 成对 fresh 输出路径、AC 追溯表 TASK-4 相关行回填状态、探针结论复证记录 |

## 代码范围映射

> Plan 审批时填写计划范围；实现后**如实回填实际范围和 Commit**（纯文档变更照填文档路径，不要清空或写 N/A）。三类 Review Evidence 状态触发：本表「实际文件/符号」列的值包含**代码文件/符号** → 归档必须三份 Approved（Evidence 列填文件路径，不得以 N/A 规避；N/A 后夹带代码路径不放行）；实际范围仅文档类文件（.md 等）或 `N/A：理由` → evidence 可选，一旦生成任一 evidence 文件则三份必须齐全且 Approved。实际文件超出计划范围时必须先修订 Plan，不能仅在"偏差"列解释后继续。

| Task ID | 计划文件/符号 | 实际文件/符号 | 操作 | Commit | Spec Compliance | Code Quality | Verification | 偏差 |
|---------|---------------|---------------|------|--------|-----------------|--------------|--------------|------|
| TASK-1 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（新增）+ `validateCustomComponentPrams` 挂载行 | `compiler/src/process_custom_component.ts`：`isTypeIncludingUndefined`/`getStructDeclarationFromComponentUseSite`/`isRequireParamTypeExcludingUndefined`/`validateRequireParamUndefinedType`（:2077-2151）+ 挂载行 `:1575`（+77 行纯插入，净 diff 单文件） | Add/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（AC-1/AC-1.1～AC-1.5 PASS） | Approved：`evidence/reviews/code-quality.md`（范围一致 + Minor 2 项非阻塞；新增区间只读 eslint 0 错误） | Approved：`evidence/reviews/verification.md`（build PASS + etsTest fresh 357/2，`✔ 1-60/1-61`，日志 `etsTest-final-fresh.txt`） | 函数签名省略 parentStructInfo（childStructInfo 内部派生），见「实现偏差和开放问题」 |
| TASK-2 | `compiler/src/interop/src/process_custom_component.ts:validateRequireParamUndefinedType`（镜像新增）+ 挂载行 | `compiler/src/interop/src/process_custom_component.ts`：同 4 函数（:2093-2167）+ 挂载行 `:1591`（+77 行纯插入；主/镜像新增块 diff IDENTICAL） | Add/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（镜像同步 PASS，v1.7 起非 AC） | Approved：`evidence/reviews/code-quality.md`（镜像逐行 IDENTICAL 复核成立；新增区间只读 eslint 0 错误） | Approved：`evidence/reviews/verification.md`（interopBuild PASS + interopArkTest fresh 1122/19，用例 2/2 `✔`，日志 `interopArkTest-final-fresh.txt`） | 无 |
| TASK-3 | `compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedType.ets`、同目录 `validateRequireParamUndefinedTypeV2.ets`（新建）；`compiler/test/transform_ut/helpers/pathConfig.ts`、`compiler/test/transform_ut_error.json`（修改）；`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（新建） | 与计划一致：2 fixture 新建（V1 正例+5 反例矩阵 / V2 @Require @Param 正例+反例）；pathConfig.ts +2 行注册（:311-313 区域）；transform_ut_error.json +2 WARN 期望条目（274 页，JSON valid）；interop 用例新建（2 it，经 `require('../../../lib/...')` 消费 interop 变体；该文件 v1.10 已从交付 MR 剔除） | Create/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（期望文案与契约逐字符一致；@Builder 使用点属 R-1 字面范围，登记说明） | Approved：`evidence/reviews/code-quality.md`（与既有先例结构一致；Minor：测试 env 恢复惯例） | Approved：`evidence/reviews/verification.md`（Red→Green 成对 + 双基线对照零漂移 + 最终态 fresh 复跑 + 边界探针，存档 `evidence/checks/task3-red-green/` 8 份日志 + README.md） | interop 用例驱动方式为计划偏差（复用 test.js 轻量驱动模式而非全管线 mock），见「实现偏差和开放问题」 |
| TASK-4 | `compiler/src/process_custom_component.ts`（触发条件类型级替换 + 新判定 helper `isTypeDefinitelyIncludingUndefined`）；`compiler/src/interop/src/process_custom_component.ts`（镜像同步）；`compiler/test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/validateRequireParamUndefinedTypeExtension.ets`、同目录 `validateRequireParamUndefinedTypeExtensionV2.ets`（新建）；`compiler/test/transform_ut/helpers/pathConfig.ts`、`compiler/test/transform_ut_error.json`（追加）；`compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`（追加用例） | 主链：`isTypeDefinitelyIncludingUndefined`（:2087-2097，含函数头 2 行方向语义注释）+ 触发条件类型级替换（:2147-2148），+14/-2；镜像同构：helper :2103-2113 / 触发 :2163-2164（偏移 +16，HELPER-REGION-IDENTICAL + FUNC-REGION-IDENTICAL），+14/-2；2 fixture 新建（V1：`void 0` + 联合变量正例 + 独立反例 child `narrowed_value`/`any_var_value`；V2：两正例）；pathConfig +2 注册；`transform_ut_error.json` +20/-0 纯追加（276 页 JSON valid，既有期望条目 diff=0）；interop 测试 +35/-0（新 `expectRequireUndefinedWarns` 多 WARN 断言 helper + V1/V2 Extension 用例 2 个；该文件 v1.10 已从交付 MR 剔除）；既有 2 fixture 页 diff = 0 | Modify/Create | `单 commit（Change-Id Ia0e5e0a，2026-10-31）`（代码+文档同 commit，追溯同 TASK-1 口径） | Approved：`evidence/reviews/spec-compliance.md` v1.8 增补段（2026-10-31；AC-6/AC-1.6/AC-1.5 v1.8 扩展边界 PASS，基准 spec.md md5 `254bf315c9444956a20f9df36c717172`） | Approved：`evidence/reviews/code-quality.md` v1.8 增补段（2026-10-31；净 diff 与 Files 表 7 项一致，镜像 IDENTICAL，新增区间 eslint 0 命中，无新 finding） | Approved：`evidence/reviews/verification.md` v1.8 增补段（2026-10-31；Red→Green 成对 fresh 359/2 + 1124/19，存档 `evidence/checks/task4-red-green/`） | 无（实际区间与 Files 表/计划一致；Commit 列开放状态登记于 review.md 开放问题 #7） |

## 实现偏差和开放问题

| Task ID | 类型 | 问题/偏差 | 处理状态 | 回退能力/Owner |
|---------|------|-----------|----------|----------------|
| TASK-1 | dependency | fork checker（getLinterTypeChecker）对 struct PropertyDeclaration 的类型返回行为需实现期实证（design.md 风险表已登记） | **Closed（实证通过，2026-10-29）**：探针实证 fork linter checker 对 struct PropertyDeclaration 返回含 undefined 联合成员的完整类型（`CurrentProcessFile.getChecker()` 在 .ets 下自动取 `getLinterTypeChecker()`），TypeAlias 原生解析正常；无需 ADR-1 备选回退。附带发现并处置：本 fork `getAliasedSymbol` 对非别名符号抛 Debug Failure → 实现已先判 `SymbolFlags.Alias` 再取别名（与 ADR-3 符号链一致） | ohos-design/用户（本会话需求方） |
| TASK-1 | scope | `validateRequireParamUndefinedType(node, name, log)` 签名省略了计划中的 `parentStructInfo` 参数：childStructInfo 改由 `getStructDeclarationFromComponentUseSite(checker, node)` 经符号链内部派生（调用点 `validateCustomComponentPrams` 无需传入） | Closed（有意设计，不回退）：符号链派生使函数自包含且镜像同步零差异；行为等价性由 etsTest/interopArkTest 正反例断言覆盖。已在本表登记供 ohos-review 复核 | 可回退（恢复显式传参为纯签名变更，调用点唯一）；ohos-implement |
| TASK-3 | scope | interop 用例驱动方式偏离计划原文（计划期望全管线 rollup mock）：实际复用 `test/test.js` 轻量驱动模式——`validateUISyntax` 前置 + `ts.createProgram`+emit 注入 `processUISyntax(null, true, ...)` + `globalProgram.program`/`CurrentProcessFile.setIsProcessingFileETS` 状态准备 | Closed（有意设计，不回退）：ark_compiler_ut 无全管线先例（grep 证实），轻量驱动与 test.js 先例一致；契约要求（经 `require('../../../lib/...')` 消费 interop 变体 + 同文案 WARN 断言）已全部满足。附带坑位已处置：全量运行需显式 `process.env.compileTool='rollup'` + `storedFileInfo.addFileCacheInfo(fixturePath)`（否则 validate_ui_syntax:322 `hasEntry` 访问 undefined），已写入用例 | 可回退（用例自包含）；ohos-implement |
| TASK-1 | process | 首次运行带 `--fix` 的 `npm run lint` 污染约 186 个范围外 src 文件（行尾空格/缩进美化写回） | Closed（已完全回退）：`git checkout -- compiler/src/` 全量恢复后重放本 Task 改动并重建 build；后续一律改用只读 `./node_modules/.bin/eslint <file> --ext .ts` 核对新增区间（TASK-2 起未再触发）。净 diff 已核实仅含预期 4+3 文件 | 已回退（无残留）；ohos-implement |
| TASK-3 | baseline | 预存基线失败如实记录（未掩盖）：etsTest 2 例（`ExtendOneChild` 断言失败、`StructNameWarn` fixture 在 HEAD 缺失致 ENOENT，注册存在于 HEAD pathConfig.ts:371）+ interopArkTest 19 例（Lazy Imports/module_mode 等环境相关） | Closed（报告而非掩盖）：stash 基线对照证明两组失败在 HEAD 即存在且与本变更无关（主链路基线 355/2 同两例；interop 基线 1120/19 与 Green 失败名集合 diff = IDENTICAL-19）；未修改任何既有期望条目。触发的是停止条件②的「报告」分支而非修订分支 | 非本变更引入，无需回退；如需修复属独立问题；ohos-review 复核 / 上游 |
