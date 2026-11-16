# 执行计划

> 将 Approved Spec 拆成可独立执行、可验证、可审查的 Task。每个 Task 用稳定 ID 和章节锚点引用上游事实，不复制 Spec/Design 正文。

## Plan 元数据

| 字段 | 内容 |
|------|------|
| Plan ID | PLAN-require-type-check-001 |
| 关联 Feature/Bug | REQ-09-01-01-01（沿用 proposal 需求ID）；GitCode Issue 4719（issue-4719-require-type-check） |
| 关联文档 | proposal.md / design.md / spec.md / spec-for-validation.md（Profile 旁路件） |
| 复杂度 | 简单 |
| 状态 | Approved（TASK-1～TASK-4 已交付：TASK-4 为 v1.8 修订新增，经 owner 2026-10-31 批准执行，代码与成对验证证据落地、本 Plan 已回填；已提交单 commit（Change-Id Ia0e5e0a，2026-10-31 owner 指令上传）；v1.11 修订（2026-11-06）：验证描述实现中立化（剥离验证技术载体字样），验证语义、Task 边界与追溯结构不变；v1.12 修订（2026-11-10）：owner 指示告警消息模板整体改写为「The type of property '{propName}' decorated with '@Require' is expected to be '{expectType}', but is actually '{actualType}' in the component constructor.」（占位符名 paramName→propName、paramType→expectType，actualType 不变，插值语义不变），新增 TASK-5 承载代码与期望登记的模板改写（待 owner 批准 v1.12 基线后执行），触发/级别/定位/反例口径与既有 Task 边界不变） |
| Owner | 用户（本会话需求方） |

## 输入状态

| 输入 | 路径 | 要求状态 |
|------|------|----------|
| Requirement | `proposal.md`（基线 v1.12，approval.baseline_digest 6e17643e…） | Approved |
| Design | `design.md`（DESIGN-require-type-check-001；ADR-1～ADR-6；TASK-1～TASK-5） | Approved |
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
| developtools/ace_ets2bundle | 验证层 | `compiler/test/` 下验证页面目录（v1.5 新建 2 页 + v1.8 新建 2 扩展页，既有 2 页零改动）；页面注册表文件；期望诊断登记文件 | 新增用例/修改注册 | VM-1～VM-5 落点（TASK-3）；VM-7～VM-8 落点（TASK-4） |
| developtools/ace_ets2bundle | 生成物（src→lib 流水线） | `compiler/lib/**` | 不手工修改 | Babel 生成物：主链路经 `npm run build` 再生、interop 镜像经 `npm run interopBuild` 再生；禁止直接编辑 |

**检查项：**
- [x] design.md 调用链每一层都有对应文件列出（7 层全覆盖 + lib/ 生成物声明）
- [x] 每个文件修改类型和职责说明明确
- [x] 无映射行的层意味着设计到实现的翻译缺失，需回溯补充 design.md（无缺失层）

## AC 到 Task 追溯

> AC = Acceptance Criteria（验收标准）。spec 中每个验收标准必须映射到至少一个 Task。proposal AC-1～AC-6 与 spec AC-1.1～AC-1.6 顺序对应（spec.md 输入文档节声明；v1.8 新增 AC-6/AC-1.6，AC-5/AC-1.5 反例边界按类型级口径重写），两套编号均登记以保完整追溯。计划阶段填 AC/Task/计划文件，实施后回填实际文件、Commit、Review Evidence。

| AC | 来源 | Task | 计划代码范围 | 实际 Code Ref | Commit | Review Evidence | 验证状态 |
|----|------|------|--------------|-----------------|--------|-----------------|----------|
| AC-1 | proposal.md（对应 spec AC-1.1） | TASK-1, TASK-3, TASK-5（v1.12 文案） | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V1 判定与挂载） | `compiler/src/process_custom_component.ts:2112-2151`（主函数）+ `:2077-2110`（3 个 helper）+ `:1575`（挂载行）；v1.12 文案已闭合（2026-11-10，TASK-5）：message 模板替换 :2163-2165（渲染与 spec v1.12 逐字符），断言经主链全量验证入口 6 条消息 Red→Green | v1.5：`单 commit（Change-Id Ieca81b2）`；v1.12：单 commit（代码+文档同 commit，2026-11-10 owner 授权，随 PR #7259 追加） | v1.5：Review Approved（2026-10-29）：`evidence/reviews/spec-compliance.md` + `code-quality.md` + `verification.md`（汇总 `review.md`）；v1.12：三份 v1.12 增补段（2026-11-10）；实施验证证据 `evidence/checks/task3-red-green/README.md` + `evidence/checks/task5-red-green/` | pass |
| AC-1.1 | spec.md | TASK-1, TASK-3, TASK-5（v1.12 文案） | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V1 @Require 集合同源判定 + 显式 undefined 判定 + WARN 推送） | 同 AC-1（V1 decoratorVariable 五集合并集 :2124-2130；顶层 undefined 判定 :2131-2135；WARN 推送 :2144-2149）；验证示例页面断言 validateRequireParamUndefinedType（正例 require_value 恰 1 WARN）；v1.12 文案已闭合（2026-11-10，TASK-5）：message 模板替换 :2163-2165，页面 1-60 断言红转绿（新模板 vs 新期望逐字符） | 同 AC-1（v1.5：Change-Id Ieca81b2；v1.12：单 commit 随 PR #7259 追加） | 同 AC-1 | pass |
| AC-1.2 | spec.md | TASK-1, TASK-3, TASK-5（v1.12 文案） | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（V2 paramDecoratorMap.hasRequire 分支） | 同 AC-1（:2122-2123 childStructInfo 派生 + :2137-2139 hasRequire 判定）；验证示例页面断言 validateRequireParamUndefinedTypeV2（@Require @Param 正例恰 1 WARN）；v1.12 文案已闭合（2026-11-10，TASK-5）：message 模板替换同主链单点，页面 1-61 断言红转绿 | 同 AC-1（v1.5：Change-Id Ieca81b2；v1.12：单 commit 随 PR #7259 追加） | 同 AC-1 | pass |
| AC-1.3 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（类型含 undefined、any、unknown、不可解析 → 不告警回退） | 同 AC-1（`isTypeIncludingUndefined` :2077-2085 含 any/unknown/undefined 联合回退；`:2087-2099` 符号链不可解析回退）；验证示例页面反例 union_value/any_value 0 告警 | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.4 | spec.md | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（无 @Require 字段排除） | 同 AC-1（:2147-2149 无 hasRequire 且不在 decoratorVariable → 跳过）；验证示例页面反例 no_require_value/V2 plain_param_value 0 告警 | `单 commit（Change-Id Ieca81b2）` | 同上 | pass |
| AC-1.5 | spec.md | TASK-1, TASK-3, TASK-4 | v1.8 重写边界：仅顶层 PropertyAssignment.initializer 进入判定；解析类型不含 `undefined` 的变量/表达式（含联合类型变量收窄后）与 `any`/`unknown` 动态值不告警 | v1.5 口径已闭合（2026-10-29）：同 AC-1（:2132-2134 语法级判定）+ 验证示例页面反例 variable_value（this.numValue）/nested_value（对象字面量内部 undefined）0 告警；v1.8 扩展反例已闭合（2026-10-31，TASK-4）：扩展验证示例页面独立反例 child `narrowed_value`（`!== undefined` 守卫内收窄传值）与 `any_var_value`（ESObject 动态值）类型级触发下 0 告警（既有全量验证入口计数+消息断言通过） | v1.5：`单 commit（Change-Id Ieca81b2）`；v1.8：`单 commit（Change-Id Ia0e5e0a）` | v1.5：同上（evidence/reviews/ 三份，2026-10-29 Approved）；v1.8：evidence/reviews/ 三份 v1.8 增补段（2026-10-31）+ `evidence/checks/task4-red-green/README.md` | pass |
| AC-6 | proposal.md（对应 spec AC-1.6） | TASK-4, TASK-5（v1.12 文案） | 主链+镜像传入值判定升级（语法级→类型级）+ 扩展验证示例页面 2 页正例断言（每页恰 2 WARN） | 主链 `isTypeDefinitelyIncludingUndefined`（:2087-2097；Any/Unknown→false 与声明侧方向相反、同保守）+ 触发条件类型级替换（:2147-2148）+ 镜像同构（helper :2103-2113/触发 :2163-2164，新增块 diff IDENTICAL）；验证示例页面 validateRequireParamUndefinedTypeExtension/...ExtensionV2 每页恰 2 WARN（既有全量验证入口断言通过）；v1.12 文案已闭合（2026-11-10，TASK-5）：消息模板随 AC-1 同一模板刷新（AC-6 引用 AC-1 文案，无独立实现），页面 1-62/1-63 断言红转绿 | v1.8：`单 commit（Change-Id Ia0e5e0a）`；v1.12：单 commit（随 PR #7259 追加） | evidence/reviews/ 三份 v1.8 增补段（2026-10-31 Approved）+ 三份 v1.12 增补段（2026-11-10）+ `evidence/checks/task4-red-green/README.md` + `evidence/checks/task5-red-green/` | pass |
| AC-1.6 | spec.md | TASK-4, TASK-5（v1.12 文案） | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（触发条件替换为传入值解析类型含 `undefined`，新判定 helper `isTypeDefinitelyIncludingUndefined`）+ `compiler/src/interop/src/process_custom_component.ts` 镜像同步 + 扩展验证示例页面 validateRequireParamUndefinedTypeExtension/...ExtensionV2（新建，V1/V2 各恰 2 WARN） | 同 AC-6（主链 helper :2087-2097 + 触发 :2147-2148、镜像 :2103-2113/:2163-2164；期望消息逐字符——actual 段 V1 `'undefined'` 与 number/undefined 联合文本、V2 `'undefined'` 与 string/undefined 联合文本，逐字符全文锚定 spec.md 验证映射 VM-7/VM-8 与 `evidence/checks/task4-red-green/README.md`）；v1.12 文案已闭合（2026-11-10，TASK-5）：message 模板替换（主 :2163-2165/镜像 :2179-2181，actual 段渲染口径不变），期望登记 4 条消息红→绿逐字符 | 同 AC-6（v1.8：Change-Id Ia0e5e0a；v1.12：单 commit 随 PR #7259 追加） | 同 AC-6（evidence/reviews/ 三份 v1.8 增补段 + v1.12 增补段 + task4/task5-red-green README） | pass |

> **附加覆盖注记（v1.7，2026-10-31 owner 指示移除 interop 验收维度）：** 原 AC-1.6/AC-6 追溯行（interop 镜像一致性）不再作为 AC 验收项——TASK-2 镜像同步依仓内架构铁律保留（主链路改动必须同步 `compiler/src/interop/src/` 镜像）。原行证据存档：镜像 `compiler/src/interop/src/process_custom_component.ts:2093-2167`（同 4 函数，与主链路逐行等价偏移 +16）+ `:1591` 挂载行；主/镜像新增块 diff 逐行 IDENTICAL；Commit `单 commit（Change-Id Ieca81b2）`；Review 同 evidence/reviews/ 三份（2026-10-29 Approved）。

> **编号复用注记（v1.8，2026-10-31）：** 上表新增的 AC-6/AC-1.6 行为 v1.8 类型级触发正例（proposal US-2/AC-6 ↔ spec AC-1.6），与 v1.7 移除的 interop 维度 AC-6/AC-1.6 编号相同、语义无关——AC 编号随 proposal/spec v1.8 基线顺延复用（spec.md 输入文档对应关系已注记），VM-6 编号则不复用（v1.8 新增验证维度顺延为 VM-7/VM-8）。TASK-4 执行前，AC-6/AC-1.6 行与 AC-1.5 行 v1.8 部分的实际 Code Ref/Commit/Review Evidence 为待回填状态。

> **v1.12 回填注记（2026-11-10）：** TASK-5 已交付（owner 双批准：v1.12 文档链 + TASK-5 执行授权）——AC-1/AC-1.1/AC-1.2/AC-1.6/AC-6 行的「TASK-5（v1.12 文案）」部分已按成对验证证据回填（主链三态 359/2 → 355/6 → 359/2 零漂移、镜像回归预存 19 例不变、message 区块主/镜像 IDENTICAL、eslint 替换区间 0 新增）；既有 v1.5/v1.8 交付证据对触发/级别/定位/反例契约持续有效。证据 `evidence/checks/task5-red-green/`。

## 首批实现边界

**首批必须实现（v1.5 周期，已交付）：** TASK-1 主链路校验函数（V1/V2 判定 + WARN 推送 + 挂载）；TASK-2 interop 镜像同步（同一改动逐行复制）；TASK-3 全部配套验证（V1/V2 验证示例页面含反例矩阵、页面注册表登记、期望诊断登记）及成对验证证据（实现前失败→实现后通过）。
**首批必须实现（v1.8 周期）：** TASK-4 类型级触发扩展（主链+镜像触发条件替换与新判定 helper、扩展验证示例页面 2 页、注册/期望、成对验证证据）。
**可后置：** 无（简单复杂度，各周期全部 Task 均为该周期首批交付内容）。
**不建议延后：** TASK-2/TASK-3 任一延后会导致 interop 镜像同步缺失（仓内架构铁律）与零误报反例（R-3/R-4/R-5/R-6）失去断言锁定；TASK-4 延后会导致 AC-1.6 类型级正例与 v1.8 扩展反例（收窄/`any`）失去断言锁定，v1.8 基线不闭合。

## 阶段计划（如适用）

| 阶段 | 目标 | 关键 Task | 结束门槛 | 最小验证 |
|------|------|-----------|----------|----------|
| Phase-1 | 主链路与镜像诊断实现 | TASK-1, TASK-2 | `npm run build`、`npm run lint`、`npm run interopBuild` 全通过；src 改动仅限两份 `process_custom_component.ts`（主链路 + 镜像） | `cd compiler && npm run build && npm run lint && npm run interopBuild` |
| Phase-2 | 验证锁定与回归（v1.5 周期，已交付） | TASK-3 | 既有全量验证入口与镜像回归入口全量通过；成对验证证据已存档；AC 追溯表回填完成 | 经既有全量验证入口与镜像回归入口运行 |
| Phase-3 | v1.8 类型级触发扩展与回归（成对验证） | TASK-4 | `npm run build` 通过；既有全量验证入口新增页实现前失败→实现后通过且既有用例零漂移（含既有 2 页 v1.5 期望零漂移、镜像回归入口既有回归零漂移）；成对验证证据存档 `evidence/checks/`；AC-1.5（v1.8 部分）/AC-6/AC-1.6 追溯行回填 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 |
| Phase-4 | v1.12 消息模板改写与回归（成对验证） | TASK-5 | `npm run build` 通过；既有全量验证入口 6 条消息断言先失败（Red）→镜像同步→更新期望后全量通过且预存基线不变（主链 2 例/镜像 19 例）；镜像回归入口零漂移；成对验证证据存档 `evidence/checks/`；AC-1/AC-1.1/AC-1.2/AC-1.6/AC-6 行 v1.12 部分回填 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 |

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
| TASK-3 | 验证落地：验证示例页面 + 注册 + 期望诊断登记，成对验证回归 | `compiler/test/` 下验证页面目录（新建 2 验证示例页面）；页面注册表文件；期望诊断登记文件 | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 | TASK-1, TASK-2 | 既有全量验证入口与镜像回归入口全量通过（既有用例零漂移）；实现前失败证据已存档 | 经既有全量验证入口与镜像回归入口运行 | Done |
| TASK-4 | v1.8 类型级触发扩展：主链+镜像传入值判定升级（语法级→类型级）+ 判定 helper，扩展验证示例页面 2 页 + 注册/期望，成对验证回归 | `compiler/src/process_custom_component.ts`；`compiler/src/interop/src/process_custom_component.ts`；`compiler/test/` 下验证页面目录（新建 2 扩展验证示例页面）；页面注册表文件；期望诊断登记文件 | AC-1.5（v1.8 扩展反例）, AC-1.6 | TASK-1, TASK-2, TASK-3（Done）+ proposal/spec/design v1.8 基线 Approved + 本 Plan v1.8 修订获 owner 批准 | `npm run build` 通过；既有全量验证入口全量通过（新增 2 页实现前失败→实现后通过、预存基线不变）；镜像回归入口全量通过（预存基线与本特性无关、零漂移）；既有 2 验证示例页面与其期望条目零改动；实现前失败证据存档 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 | Done |
| TASK-5 | v1.12 消息模板改写：主链+镜像 message 字符串模板整体替换（spec v1.12 新模板，占位符 propName/expectType/actualType；实现侧变量名沿用 paramName/declaredType/actualType 不变）+ 期望诊断登记 6 条期望消息文本同步 | `compiler/src/process_custom_component.ts`；`compiler/src/interop/src/process_custom_component.ts`；期望诊断登记文件 | AC-1, AC-1.1, AC-1.2, AC-1.6（文案契约刷新；AC-6/AC-1.5 反例无文案断言不受影响） | TASK-1～TASK-4（Done）+ proposal/spec/design v1.12 基线 Approved + 本 Plan v1.12 修订获 owner 批准 | `npm run build` 通过；既有全量验证入口 6 条消息断言先失败（Red）→镜像同步→更新期望后全量通过且预存基线不变（主链 2 例/镜像 19 例）；镜像回归入口零漂移；触发判定/级别/无码/锚点/验证页面/页面注册表零改动；成对验证证据存档 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 | Done |

## Task 详情

### TASK-1: 主链路校验函数实现

| 字段 | 内容 |
|------|------|
| 任务目标 | 在 `compiler/src/process_custom_component.ts` 新增校验函数 `validateRequireParamUndefinedType`（@Require 成员判定 + 顶层显式 undefined 传值判定 + checker 类型判定 + WARN 推送），挂入 `validateCustomComponentPrams` 与既有三个 validate* 并列调用，形成主链路最小能力闭环 |
| AC 映射 | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 |
| 前置依赖 | proposal.md/spec.md/design.md 均 Approved（已满足）；无前置 Task |
| 非目标 | 不改 interop 镜像（TASK-2）；不落验证示例页面/期望诊断登记/验证用例（TASK-3）；不改既有诊断（10905316/10905321/10905359、问号限制规则）的级别/文案/触发条件；不给 WARN 分配数字码（owner 决策 O-3）；不改 compile_plugin.js 插件链与构建脚本 |
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
| Produces | WARN 诊断契约：`log.push({ type: LogType.WARN, message: 消息模板以字段名插值, pos: item.getStart() })`，无 code 字段；消息模板 = spec.md 规则定义节固定英文模板（'@Require' decorated '字段名' expects type '声明类型' but got '实际传入类型' through the component constructor.） | TASK-1 → TASK-3 | TASK-3 的期望诊断登记条目按此契约登记 | 文案逐字符一致（验证入口断言消息匹配）；无数字码（O-3）；每命中字段恰 1 条 |
| Consumes | `CurrentProcessFile.getChecker()`（`compiler/src/utils.ts:1618-1623`，只读复用） | TASK-1 | 既有导出 | checker 不可用→按 ADR-6 保守回退（不告警、不抛错） |
| Consumes | `getOriginPropertyType`（`compiler/src/utils.ts:1583`，只读复用） | TASK-1 | 既有导出 | 仅 TypeAlias 场景按需调用；checker 原生解析已覆盖时不调用 |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/utils.ts:1583-1623` | 复用 `getOriginPropertyType` 与 `CurrentProcessFile.getChecker`（只读，禁止修改） |
| `compiler/src/process_import.ts:790-800` | 使用点符号解析链模式参考（getSymbolAtLocation→getAliasedSymbol→declarations[0]，ADR-1） |
| `compiler/src/fast_build/system_api/api_validator/api_validate_node.ts:168` | 显式 undefined 标识符判定既有模式参考（ADR-4） |
| `compiler/src/process_component_member.ts:161` | mandatoryToInitViaParamDecorators 不含 @Require 的事实（验证示例页面可选字段须用联合类型写法的依据） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | 代码事实基线（13 项 file:line）与 ADR-1～ADR-6、数据流/控制流 7 步 |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/process_custom_component.ts` | 新增 `validateRequireParamUndefinedType` 函数；在 `validateCustomComponentPrams`（:1542）内既有三连调用（:1572-1574）之后并列挂载调用 |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/utils.ts` | 只读复用既有导出；需改动时触发停止条件②，停止并修订 Plan |
| `compiler/src/interop/src/**` | TASK-2 所有（镜像同步独立闭环） |
| `compiler/test/**` | TASK-3 所有（验证落地独立闭环） |
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

- [x] 确认证据缺口与基线：核对 Read-only Context 5 处参考代码与 design.md 代码事实基线一致（不一致即停止回传）；当前主链路对 issue 4719 场景（@Require non-null 字段显式传 undefined）输出 0 条告警，即本 Task 要闭合的可复现证据缺口（实现前失败信号定义见 spec VM-1）
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
| Relevant verification | `npm run build` 与 `npm run lint` 直接覆盖本 Task 生产代码（非无关验证）；行为验证归 TASK-3 且已在依赖列声明 |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** AC-1.1～AC-1.5 编译闭环 PASS（build 114 files / 新增区间 lint 0 错误）；行为正例/反例/边界断言已由 TASK-3 以既有全量验证入口成对验证闭合（新增 2 页断言通过：正例恰 1 WARN + 反例矩阵 0 条），证据 `evidence/checks/task3-red-green/README.md`。
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
| AC 映射 | AC-1.1, AC-1.2（镜像同步义务为仓内架构铁律，v1.7 起非独立 AC 验收项） |
| 前置依赖 | TASK-1 完成（Consumes 其 Produces 契约） |
| 非目标 | 不改主链路文件（TASK-1 所有）；不落配套验证（TASK-3）；不抽取共享模块替代复制（镜像自包含约束，目录内相对导入） |
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
| Produces | interop 镜像变体的 `validateRequireParamUndefinedType`（`compiler/src/interop/src/process_custom_component.ts`，行为契约与主链路一致） | TASK-2 → TASK-3 | 镜像行为一致性由主/镜像新增块 diff IDENTICAL 同构复核承载（v1.7 起非 VM） | 同级别/同文案/同定位（与主链路行为一致，仓内架构铁律）；镜像自包含（from './utils' 目录内导入，不共享模块） |
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

- AC / Rules: `AC-1.1`, `AC-1.2`、`R-1`（镜像行为契约与主链路一致；镜像同步义务为仓内架构铁律，非独立 AC/Rules 项）
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
| AC closed | 镜像同步实现证据（仓内架构铁律，非 AC）：interopBuild+lint fresh 通过输出；与主链路逐行对照的镜像 diff（同名函数/同模板/同挂载）——行为一致性由主/镜像新增块 diff IDENTICAL 同构复核承载（依赖已声明） |
| Scope respected | 实际 diff 仅含 `compiler/src/interop/src/process_custom_component.ts`；与代码范围映射 TASK-2 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（镜像为纯同步诊断副本，无状态生命周期） |
| Interface contract matched | Consumes 与 TASK-1 Produces 的函数名/参数顺序/消息模板/pos 规则逐项一致；Produces 镜像行为一致性经主/镜像新增块 diff IDENTICAL 同构复核承载 |
| Relevant verification | `npm run interopBuild` 与 `npm run lint` 直接覆盖镜像文件（非无关验证） |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** 镜像同步证据 PASS（原 AC-1.6 验收口径，v1.7 起为仓内架构铁律、非 AC；interopBuild 127 files / 新增区间 lint 0 错误 / 主镜像新增块 diff 逐行 IDENTICAL，行为一致性由同构复核承载）；证据 `evidence/checks/task3-red-green/README.md`。
- **Scope respected：** 实际净 diff 仅 `compiler/src/interop/src/process_custom_component.ts`（+77 行纯插入：函数块 `:2093-2167` + 挂载行 `:1591`），与代码范围映射 TASK-2 行一致，无超范围。
- **State lifecycle complete：** N/A 维持。
- **Interface contract matched：** 与 TASK-1 Produces 的函数名/参数顺序/消息模板/pos 规则逐项一致（IDENTICAL diff 证明）；镜像行为一致性由主/镜像新增块 diff IDENTICAL 同构复核承载。
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
| Spec 引用 | `AC-1.1`, `AC-1.2`/ `R-1` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-2`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run interopBuild && npm run lint` / 期望: PASS |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | 镜像与主链路逐行一致性核对（同级别/同文案/同定位，仓内架构铁律非 AC）；偏差=无（或已修订 Plan） |
| Code Quality | 镜像文件 diff、Base/Head SHA、lint 结果；自包含约束（目录内相对导入）未破坏 |
| Verification | interopBuild/lint 的 Expected/Actual 与 fresh 输出路径；行为一致性由主/镜像新增块 diff IDENTICAL 同构复核承载 |

### TASK-3: 验证落地与成对验证回归

| 字段 | 内容 |
|------|------|
| 任务目标 | 落地 VM-1～VM-5 验证资产：新增 V1/V2 验证示例页面（含反例矩阵）、页面注册表登记、期望诊断登记条目；采集成对验证证据（实现前失败→实现后通过）并经既有全量验证入口与镜像回归入口全量回归 |
| AC 映射 | AC-1.1, AC-1.2, AC-1.3, AC-1.4, AC-1.5 |
| 前置依赖 | TASK-1、TASK-2 完成（实现前失败切换以两者的挂载行为为基准） |
| 非目标 | 不改 `src/` 生产代码（实现前失败证据采集仅临时注释挂载行并即时恢复，净 diff 不含 src 改动）；不新增本特性之外的用例；不调整既有验证示例页面/期望条目（回归基线） |
| 完成判据 | 既有全量验证入口与镜像回归入口全量通过且既有用例零漂移；新用例正例 WARN 计数=1、文案逐字符匹配，反例 0 条；实现前失败输出（挂载行注释状态下的失败记录）已存档；AC 追溯表全部行回填 |
| 停止条件 | ① 验证示例页面反例字段触发无法规避的既有诊断（期望计数无法收敛为 正例 1 条 WARN + 0 ERROR）——停止并回传调整验证示例页面设计；② 既有全量验证入口/镜像回归入口出现与本特性无关的既有用例失败——停止并报告环境问题，不得以修改期望条目方式掩盖 |
| Design 状态/不变量 | N/A（无 STATE-*/INV-*） |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：验证资产与期望登记为静态资产，不引入运行时状态） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用。本 Task 为末端 Task。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | VM-1～VM-5 验证资产：2 个验证示例页面 + 页面注册表登记 + 2 个期望 WARN 条目 | TASK-3（末端，供归档审查消费） | 消费 TASK-1/TASK-2 实现后的实际行为 | 验证示例页面字段名与 JSON message 插值逐字符一致；期望条目不得登记本告警之外的漂移 |
| Consumes | TASK-1 Produces 的 WARN 契约（type/message 模板/pos/无 code） | TASK-3 | TASK-1 | 期望诊断登记条目按契约登记（验证入口断言计数+消息双匹配） |
| Consumes | TASK-2 Produces 的镜像变体行为 | TASK-3 | TASK-2 | 镜像回归经既有镜像回归入口整体回归承载（本特性不设镜像链路行为级断言） |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| compiler/test/ 下既有验证入口的断言机制区域（88-260） | 断言机制：页面注册表逐页断言；告警/错误计数与消息双断言；期望集合按页面名取期望 |
| compiler/test/ 下页面注册表（248 区域） | 页面注册格式（无 .ets 后缀相对路径） |
| compiler/test/ 下期望诊断登记文件 | 期望条目格式：key=页面名，value 为单对象或数组（message + type；type=WARN 入告警期望集合） |
| compiler/test/ 下验证页面目录既有页面（validateInitDecorator、v2DecoratorInitFromParent 等） | 验证示例页面结构先例：父子组件构造传参场景（V1/V2 同目录先例） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | 测试性设计（实现前失败信号与替代验证）、测试输入约束（AC-1.1～AC-1.5 可观察表面） |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Create | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedType | V1 正例：`@Component` 子组件含 `@Require` 且声明类型不含 undefined 的字段（如 number），父组件构造传参显式传 `undefined` → 期望恰 1 条本告警；反例矩阵：类型含 undefined 的联合类型字段、any 字段、无 @Require 字段、变量传值、对象字面量嵌套内部 undefined（均不告警）。反例可选字段一律用联合类型写法，不用问号（问号触发既有 ERROR，`process_component_member.ts:161`） |
| Create | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedTypeV2 | V2 正例：`@ComponentV2` 子组件含 `@Require @Param` 且类型不含 undefined 的字段，构造传参显式传 `undefined` → 期望恰 1 条同文案告警；V2 反例（无 @Require 的 @Param 字段传 undefined 不告警） |
| Modify | compiler/test/ 下页面注册表文件 | 追加 2 个页面注册：validateRequireParamUndefinedType 与 validateRequireParamUndefinedTypeV2（无 .ets 后缀相对路径） |
| Modify | compiler/test/ 下期望诊断登记文件 | 追加 2 个期望条目：key=验证示例页面名，message=固定文案以实际字段名插值（须与页面字段名逐字符一致），type=WARN；若页面实测产生其他既有诊断，按实测同步登记（保持断言语义，且不得出现本告警之外的漂移） |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/**`、`compiler/src/interop/src/**` | TASK-1/TASK-2 所有；实现前失败采集的挂载行注释必须在采集后立即恢复（净 diff 为零） |
| `compiler/lib/**` | 生成物（验证入口运行自行再生） |
| 期望诊断登记文件既有条目、既有验证示例页面 | 回归基线，不得调整；出现漂移即停止条件② |
| 既有验证入口断言机制、页面注册表中既有注册 | 断言机制与既有注册不动，仅追加 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1.1`, `AC-1.2`, `AC-1.3`, `AC-1.4`, `AC-1.5`, `R-1`, `R-2`, `R-3`, `R-4`, `R-5`, `R-6`
- Anchors: `spec.md#规则定义`, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：期望条目文案与 spec 固定模板逐字符一致、type=WARN、无 code 断言漂移；Must Not：不借期望条目掩盖既有诊断漂移 |
| OH-ARCH-LAYERING | Must：配套验证仅经编译产物断言对外可见诊断（不跨目录共享）；Must Not：不在验证中直接 import src/ 源（须经编译产物） |
| OH-ARCH-COMPONENT-BUILD | Must：配套验证经既有验证入口（全量验证入口/镜像回归入口）驱动，build 由脚本内部再生；Must Not：不新增构建脚本或改插件链 |

**Steps**

- [x] 创建 V1 验证示例页面（正例 + 反例矩阵，字段名与后续 JSON message 插值保持一致；反例可选字段用联合类型写法，不用问号）
- [x] 创建 V2 验证示例页面（`@Require @Param` 正例 + 反例）
- [x] 页面注册表追加 2 个页面注册（无 .ets 后缀）
- [x] 期望诊断登记追加 2 个期望条目（message=固定文案以页面实际字段名插值，type=WARN；页面若实测产生其他既有诊断则同步如实登记）
- [x] 实现前失败（主链路）：临时注释 `validateCustomComponentPrams` 内新校验函数挂载行 → 经既有全量验证入口运行（脚本自动 rebuild lib）→ 确认新用例因正例 0 条 vs 期望 1 条断言失败、既有用例不受影响，保存失败输出 → 恢复挂载行
- [x] 实现后通过（主链路）：经既有全量验证入口运行，全量通过，保存通过输出
- [x] 回归：经既有镜像回归入口运行，既有回归预存基线不变（预存失败与本特性无关，零漂移）
- [x] 核对净 diff：src/ 两文件与 TASK-1/2 完成态一致（挂载行注释已恢复）
- [x] 回填 AC 追溯（全部行）、实际文件、Commit、Review Evidence、Actual Result 和计划偏差

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| compiler/test/ 下既有验证入口断言机制 | 验证：验证示例页面 + 期望诊断登记 + 告警计数与消息双断言 | 无 |
| compiler/test/ 下页面注册表 | 注册：无 .ets 后缀相对路径，仅追加 | 无 |
| compiler/test/ 下期望诊断登记既有 WARN 条目 | 期望条目：key=页面名、message、type；多条时数组形式 | 无 |
| compiler/test/ 下验证页面目录既有页面（validateInitDecorator、v2DecoratorInitFromParent 等） | 验证示例页面结构：父子组件构造传参场景（V1/V2 同目录先例） | 无 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | VM-1～VM-5 全绿输出（既有全量验证入口；镜像回归入口回归基线不变）：V1/V2 正例各恰 1 条 WARN 且文案逐字符匹配，反例（联合类型含 undefined、any、无 @Require、非 undefined 标识符、嵌套对象）0 条；既有用例零漂移；实现前失败输出证明断言非恒真（防只写 PASS 文本） |
| Scope respected | 净 diff 仅含 Files 表 4 项（2 验证示例页面 + 2 修改）；src/ 净改动为零（实现前失败注释已恢复）；与代码范围映射 TASK-3 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（验证资产无状态生命周期） |
| Interface contract matched | 期望条目 message 与 TASK-1 Produces 契约逐字符一致（字段名插值对齐） |
| Relevant verification | 既有全量验证入口直接断言本特性正反例（非无关验证）+ 镜像回归入口回归基线对照；成对验证证据（实现前失败→实现后通过） |

**Anti-Fake Actual 回填（2026-10-29）**

- **AC closed：** VM-1～VM-5 全部闭合——V1/V2 正例各恰 1 条 WARN 且文案逐字符匹配、反例矩阵（`number | undefined` 联合 / `any` / 无 @Require / `this.numValue` 变量 / 嵌套对象内 undefined / V2 plain @Param）0 条本告警、ERROR=0；实现前失败输出证明断言非恒真（主链路 `expected false to be true`）；既有用例零漂移（主链路失败集实现前→实现后恰差本特性 2 页；镜像失败名集合与基线逐名一致零漂移）。
- **Scope respected：** 净 diff 恰为 Files 表 4 项（2 验证示例页面新建 + 页面注册表 +2 行注册 + 期望诊断登记 +2 期望条目）；src/ 净改动为零（实现前失败注释已恢复，挂载行 ：1575/:1591 与 TASK-1/2 完成态一致）。验证运行产生的脏文件（ts_checker_cache、testdata build 产物等 5 个跟踪文件 + 若干未跟踪目录）已全部 `git checkout`/清理。
- **State lifecycle complete：** N/A 维持（验证资产无运行时状态）。
- **Interface contract matched：** 期望条目 message 与 TASK-1 Produces 契约逐字符一致（断言机制逐字符比对 PASS）。
- **Relevant verification：** 全量输出与基线对照存档 `evidence/checks/task3-red-green/`（5 份全量日志 + README.md 证据矩阵）；预存基线失败（主链 2 例 + 镜像回归 19 例，均与本特性无关）经 stash 对照证明非本特性引入，未修改任何既有期望条目掩盖，按停止条件②「报告而非掩盖」处置并如实记录。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 验证 | 经既有全量验证入口运行 | 全量通过；新增 2 用例：正例 WARN 计数=1、文案匹配、ERROR 计数与期望一致；反例 0 条本告警；既有用例零漂移 | **PASS（2026-10-29，新增用例视角）**：全量通过、预存基线 2 例失败不变——2 个失败为**预存基线**（ExtendOneChild 断言失败、StructNameWarn 页面在 HEAD 缺失 ENOENT），经 stash 基线对照证明与 HEAD 完全相同（同一两例）；本变更新增 2 页 validateRequireParamUndefinedType 与 ...V2 断言通过（正例 WARN 计数=1、契约文案逐字符匹配、ERROR=0、反例矩阵 0 条本告警），通过数恰 +2、失败集零漂移。日志：`evidence/checks/task3-red-green/main-green-full.txt`、基线对照说明见同目录 README.md |
| 验证 | 经既有镜像回归入口运行 | 既有回归预存基线不变（回归视角） | **PASS（2026-10-29，回归视角）**：全量通过、预存基线 19 例失败不变——19 个失败为**预存基线**（process Lazy Imports / module_mode / generateCompileContext / autoLazyImport 等环境相关用例），stash 基线对照与实现后失败用例名集合逐名一致、零回归。日志：`evidence/checks/task3-red-green/interop-green-full.txt` + `interop-baseline-full.txt` |
| 实现前失败证据 | 挂载行注释状态下重复上述验证入口（输出存档于 evidence/） | 新用例失败（正例 0 条 vs 期望 1 条），既有用例不受影响；恢复后全量通过 | **PASS（成对采集）**：主链路实现前失败（注释 :1575 挂载行）新增 2 页断言失败 `expected false to be true`（实际 WARN 0 vs 期望 1），预存基线 2 例不变；恢复后实现后全量通过（仅预存基线失败）。实现前失败注释均已恢复，净 diff 中 src 与 TASK-1/2 完成态一致。存档：`evidence/checks/task3-red-green/`（main-red/main-green/interop-red/interop-green/interop-baseline 5 份全量日志 + README.md 证据矩阵） |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-3：落地 VM-1～VM-5 验证资产，采集成对验证证据（实现前失败→实现后通过）并完成全量回归 |
| 允许修改 | compiler/test/ 下页面注册表文件、期望诊断登记文件 |
| 允许新建 | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedType、validateRequireParamUndefinedTypeV2 |
| 只读参考 | compiler/test/ 下既有验证入口断言机制、同目录既有验证示例页面 |
| Spec 引用 | `AC-1.1`～`AC-1.5` / `R-1`～`R-6` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | 经既有全量验证入口与镜像回归入口运行 / 期望: PASS |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | VM-1～VM-5 与 AC-1.1～AC-1.5 对照（含 spec-for-validation.md 测试输入约束）；期望条目与契约逐字符一致；既有用例零漂移结论 |
| Code Quality | 4 项验证文件 diff、Base/Head SHA、src/ 净改动为零核对；验证示例页面反例写法合规（联合类型而非问号） |
| Verification | 既有全量验证入口/镜像回归入口的 Expected/Actual、成对验证（实现前失败→实现后通过）fresh 输出路径、AC 追溯表全部行回填状态 |

### TASK-4: v1.8 类型级触发扩展与成对验证回归

| 字段 | 内容 |
|------|------|
| 任务目标 | 将主链 `validateRequireParamUndefinedType` 的传入值 undefined 判定由语法级（`ts.isIdentifier(initializer) && text === 'undefined'`，:2135-2136）升级为类型级（传入值解析类型含 `undefined` 成员）：新增严格判定 helper `isTypeDefinitelyIncludingUndefined`（Any/Unknown→false；联合递归判 Undefined 成员；否则 flags & Undefined），`declaredType` 声明侧判定门保持在实际类型解析之前，got 段渲染传入值解析类型文本；镜像逐行同步；落地扩展验证示例页面 2 页（V1：`void 0` + 联合类型变量正例恰 2 WARN，独立 child 承载收窄/`any` 反例；V2：两正例恰 2 WARN）+ 注册/期望，采集成对验证证据（实现前失败→实现后通过）且既有 2 页零改动 |
| AC 映射 | AC-1.5（v1.8 扩展反例）, AC-1.6 |
| 前置依赖 | TASK-1/TASK-2/TASK-3 已交付（v1.5 周期，单 commit Change-Id Ieca81b2，PR #7243 门禁绿）；proposal.md/spec.md/design.md v1.8 基线 Approved；本 Plan v1.8 修订获 owner 批准（2026-10-31「文档链先行」决策） |
| 非目标 | 不改既有 2 验证示例页面（validateRequireParamUndefinedType/...V2）与其期望诊断登记既有期望条目；不改 WARN 模板文本/LogType.WARN/无数字码/属性级锚点契约；不改声明侧判定门（`isTypeIncludingUndefined` 及其 any/unknown→含 undefined 语义保持）；不改既有诊断（10905316/10905321/10905359、问号限制规则）的级别/文案/触发条件；不改 `compile_plugin.js` 插件链/构建脚本/`utils.ts` |
| 完成判据 | `npm run build` 通过；既有全量验证入口全量通过（新增 2 页实现前失败→实现后通过，预存基线不变）；镜像回归入口全量通过（预存基线与本特性无关、零漂移）；既有 2 页与其期望条目零改动（git diff 核对）；成对验证证据存档 `evidence/checks/`；AC 追溯表 AC-6/AC-1.6 行与 AC-1.5 v1.8 部分回填 |
| 停止条件 | ① 类型级触发导致既有用例（任意验证示例页面/期望条目）出现新告警漂移且不可归因；② 实现需要修改 Files 表之外文件（含 `utils.ts`/共享模块）；③ got 段渲染与 spec 消息模板口径（`void` 表达式与 `undefined` 标识符→`'undefined'`，其余命中场景为解析类型文本）不符且无法以 checker typeToString 对齐。任一命中即停止并回传修订 Plan |

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
| Produces | 类型级触发条件：顶层 PropertyAssignment.initializer 满足 `isTypeDefinitelyIncludingUndefined(checker.getTypeAtLocation(initializer))` 即命中——`undefined` 标识符/`void` 表达式/类型含 `undefined` 的变量均命中，收窄后（解析类型不含 undefined）与 `any`/`unknown` 不命中；WARN 契约不变，got 段 = `checker.typeToString(checker.getTypeAtLocation(initializer))`（v1.5 已动态解析，核对渲染口径即可） | TASK-4 → 既有 2 页期望条目（应零漂移）+ 扩展新期望条目 | 既有 2 页在类型级触发下判定结果必须不变（`undefined` 标识符命中、全部反例不命中） | 消息模板/级别/无码/属性级锚点逐字符不变；每命中字段恰 1 条 |
| Produces | 扩展验证示例页面 2 页 + 页面注册表登记 + 期望诊断登记新期望条目（每页恰 2 WARN） | TASK-4 → 全量验证入口断言 | 消费 TASK-4 实现后实际输出 | 期望消息逐字符：V1 `'@Require' decorated 'void_value' expects type 'number' but got 'undefined' through the component constructor.` 与 `'@Require' decorated 'union_variable_value' expects type 'number' but got 'number \| undefined' through the component constructor.`；V2 同构（string，`void_param_value`/`union_param_value`，got 段 `undefined` 与 `string \| undefined`） |
| Consumes | TASK-1 交付的 `validateRequireParamUndefinedType` 既有结构（挂载点/decoratorVariable 五集合并集/childStructInfo 派生/declaredType 门/WARN 推送） | TASK-4 | 既有实现（:2112-2151/镜像 :2131-2172） | 仅替换传入值判定条件与新增 helper，其余结构不动 |
| Consumes | TASK-3 交付的验证基建（页面注册表登记模式、期望诊断登记条目模式） | TASK-4 | 既有实现 | 既有用例与既有期望条目不动，仅追加 |
| Consumes | `CurrentProcessFile.getChecker()`（`compiler/src/utils.ts:1618-1623`，只读复用） | TASK-4 | 既有导出 | checker 不可用→按 ADR-6 保守回退（不告警、不抛错） |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/process_custom_component.ts:2077-2151` | TASK-1 交付的 helper 三件套与主函数；触发条件替换点 :2135-2136；`isTypeIncludingUndefined` 声明侧语义对照（新 helper 与其方向相反、同保守） |
| `compiler/src/interop/src/process_custom_component.ts:2093-2167` | 镜像同构结构（偏移 +16），同步落点参照 |
| compiler/test/ 下验证页面目录既有页面 validateRequireParamUndefinedType、validateRequireParamUndefinedTypeV2 | 既有验证示例页面结构范本（父子组件、反例写法、联合类型而非问号） |
| `.codespec/changes/issue-4719-require-type-check/design.md` | ADR-4（v1.8 类型级口径）、代码事实基线（L2135-2136 触发缺口 + 探针实测行：收窄豁免/`any` 排除/typeToString 渲染即 got 段文本） |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/process_custom_component.ts` | 新增 `isTypeDefinitelyIncludingUndefined` helper（`isTypeIncludingUndefined` 旁并列）；:2135-2136 触发条件替换为类型级判定；got 段确认保持 `checker.typeToString(checker.getTypeAtLocation(...))` 动态渲染 |
| Modify | `compiler/src/interop/src/process_custom_component.ts` | 主链改动逐行同步（镜像偏移 +16 区域）；主/镜像新增块 diff 复核 IDENTICAL |
| Create | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedTypeExtension | V1 扩展验证示例页面：正例 child（`void_value: void 0`、`union_variable_value: this.plainUnion`）恰 2 WARN；独立反例 child（`!== undefined` 守卫内 `narrowed_value` 收窄传值、`any_var_value` ESObject 动态值传值）0 告警；父组件联合变量用普通成员 `plainUnion: number \| undefined = 1`（探针实证属性引用不被赋值收窄污染） |
| Create | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedTypeExtensionV2 | V2 扩展验证示例页面：`@Require @Param` 两正例（`void_param_value: void 0`；`union_param_value` ← `@Local unionParamVariable: string \| undefined`）恰 2 WARN |
| Modify | compiler/test/ 下页面注册表文件 | 追加 2 页注册（:312-313 区域后，无 .ets 后缀相对路径，仅追加） |
| Modify | compiler/test/ 下期望诊断登记文件 | 追加 2 页期望条目（每页恰 2 WARN，message/type 与契约逐字符） |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| `compiler/src/utils.ts` | 只读复用既有导出；需改动时触发停止条件②，停止并修订 Plan |
| 既有 2 验证示例页面（validateRequireParamUndefinedType/...V2）与期望诊断登记文件既有条目 | v1.5 期望零漂移是本 Task 完成判据；改动即破坏成对验证对照基线 |
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
| OH-ARCH-COMPONENT-BUILD | Must：变更限于 src/ 两份 `process_custom_component.ts` 与 Files 表验证资产，`lib/` 由 `npm run build` 再生；Must Not：不改 BUILD.gn/插件链顺序/构建脚本 |
| 镜像同步铁律（仓内架构约束） | Must：主链改动逐行同步 interop 镜像，主/镜像新增块 diff IDENTICAL；Must Not：镜像与主链行为漂移 |

**Steps**

- [x] 实现前基线复核：当前工作区经既有全量验证入口与镜像回归入口运行，预存基线失败（主链 2 例、镜像回归 19 例）与既往记录一致；不一致即停止排查（非本 Task 引入的漂移不掩盖，按停止条件①处置）
- [x] 新建扩展验证示例页面 2 页（V1/V2，场景设计见 Files 表）+ 页面注册表追加注册 + 期望诊断登记追加 2 页期望条目（消息逐字见 Produces 契约）
- [x] 实现前失败采集：经既有全量验证入口运行（预期新增 2 页 `expected false to be true` 类失败——期望 2 WARN vs 实际 0；预存基线 2 例不变）与经既有镜像回归入口运行（回归基线预存 19 例失败不变），全量输出存档 `evidence/checks/`（含基线对照说明）
- [x] 实现后通过（主链）：新增 `isTypeDefinitelyIncludingUndefined` helper；:2135-2136 触发条件替换为类型级判定；got 段渲染口径核对（探针已证 typeToString 输出即 got 段文本）
- [x] 实现后通过（镜像）：同一改动逐行同步 `compiler/src/interop/src/process_custom_component.ts`；主/镜像新增块 diff 复核 IDENTICAL
- [x] `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行（预期全量通过、预存基线失败不变——主链 2 例、镜像回归 19 例）；验证运行污染的被跟踪 testdata 脏文件 `git checkout --` 恢复
- [x] 只读 eslint：`./node_modules/.bin/eslint compiler/src/process_custom_component.ts compiler/src/interop/src/process_custom_component.ts --ext .ts` 核对新增区间 0 错误（禁用带 --fix 的 `npm run lint`，TASK-1 已证其污染 src）
- [x] 回填 AC 追溯表（AC-6/AC-1.6 行、AC-1.5 v1.8 部分）、代码范围映射 TASK-4 行、Anti-Fake Actual、Verification Actual；成对验证证据（实现前失败→实现后通过）归档 `evidence/checks/`

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| `compiler/src/process_custom_component.ts:2077-2085`（`isTypeIncludingUndefined`） | helper 布局：新 `isTypeDefinitelyIncludingUndefined` 旁并列；flags/联合判定句式同源 | Any/Unknown 方向相反（false vs true），系传入值侧保守口径（ADR-4），非复制偏差 |
| TASK-3 交付的验证示例页面/注册/期望模式（既有 2 页、页面注册表 :311-313、期望诊断登记既有条目） | 验证示例页面父子结构、注册与期望条目格式照抄 | 新页独立承载 v1.8 场景，不污染既有页（v1.5 期望零漂移） |
| design.md 代码事实基线探针行（fork TS linter checker 实测） | 收窄豁免/`any` 排除/typeToString 渲染结论直接落地扩展验证示例页面反例与 got 段口径 | 探针脚本为临时件未入库，结论由本 Task 扩展验证示例页面固化复证 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | AC-1.6 正例：扩展验证示例页面每页 WARN 恰 2 条且文案与契约逐字符一致（got 段 `'undefined'`/`'number \| undefined'`/`'string \| undefined'`）；AC-1.5 v1.8 扩展反例：收窄守卫内传值、`any` 动态值 0 条本告警；实现前失败输出证明断言非恒真（实现前新 2 页 0 WARN vs 期望 2）；既有用例零漂移（主链失败集实现前→实现后恰差新 2 页；镜像回归失败名集合与基线逐名一致、预存 19 例不变） |
| Scope respected | 净 diff 仅含 Files 表 6 项；既有 2 验证示例页面与既有期望条目 diff 为零（git diff 核对）；与代码范围映射 TASK-4 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（纯同步编译期诊断扩展，无状态生命周期） |
| Interface contract matched | 消息模板与 spec 逐字符（含模板尾部 ` through the component constructor.`）；主/镜像新增块 diff IDENTICAL；期望条目与实际输出逐字符；`isTypeDefinitelyIncludingUndefined` 与声明侧 `isTypeIncludingUndefined` 并存且方向语义符合 ADR-4 |
| Relevant verification | 既有全量验证入口直接断言本特性 v1.8 正反例（非无关验证）+ 镜像回归入口回归基线对照；成对验证（实现前失败→实现后通过）fresh 输出；探针结论经扩展验证示例页面复证 |

**Anti-Fake Actual 回填（2026-10-31）**

- **AC closed：** AC-6/AC-1.6 正例闭合——扩展验证示例页面每页 WARN 恰 2 条且消息逐字符（V1 got `'undefined'`/`'number | undefined'`、V2 got `'undefined'`/`'string | undefined'`；实现后经既有全量验证入口断言通过）；AC-1.5 v1.8 扩展反例闭合——收窄守卫内传值（`narrowed_value`）与 `any` 动态值（`any_var_value`）0 条本告警，ERROR=0 反证无噪音；实现前失败输出证明断言非恒真（实现前新 2 页 WARN 0≠2 `expected false to be true`）；既有用例零漂移（三态失败集：主链预存基线 2 例 → 实现前 4 例 → 实现后 2 例；镜像回归预存 19 例不变）。证据 `evidence/checks/task4-red-green/README.md`。
- **Scope respected：** 实际净 diff 仅 Files 表 6 项——2 src 各 +14/-2 + 页面注册表 +2 + 期望诊断登记 +20/-0 纯追加 + 2 扩展验证示例页面新建；既有 2 验证示例页面与既有期望条目 diff = 0；与代码范围映射 TASK-4 行一致。
- **State lifecycle complete：** N/A 维持（纯同步编译期诊断扩展，无 STATE-*/INV-*）。
- **Interface contract matched：** 消息模板与 spec v1.8 逐字符（含模板尾部 ` through the component constructor.`）；主/镜像新增块 HELPER-REGION-IDENTICAL + FUNC-REGION-IDENTICAL（偏移 +16 保持，helper 每文件恰 1 处）；期望条目与实际输出逐字符；`isTypeDefinitelyIncludingUndefined`（Any/Unknown→false）与声明侧 `isTypeIncludingUndefined`（any/unknown→true）并存且方向语义符合 ADR-4，函数头 2 行注释显式说明。
- **Relevant verification：** build 114 files PASS（`green-build.txt`）+ 只读 eslint 新增区间 0 命中（103 error 全预存，`green-eslint.txt`）+ 主链成对验证 fresh 输出（实现前新增 2 页失败 → 实现后全量通过、预存基线不变）与镜像回归基线对照（预存失败名集合逐名一致、零回归），全部直接覆盖本 Task 生产代码与断言。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 编译 | `cd compiler && npm run build` | build 全步无错误，主链+镜像新 helper/触发条件编译入 lib | **PASS（fresh，2026-10-31）**：`Successfully compiled 114 files with Babel`，copyJsonFiles 完成，无错误——`green-build.txt` |
| 验证 | 经既有全量验证入口运行 | 全量通过（新增 2 页实现前失败→实现后通过；预存基线 2 例失败不变；既有用例零漂移）；扩展验证示例页面正例恰 2 WARN、反例 0 条、ERROR 0 | **PASS（fresh，全量通过；预存基线 2 例失败不变）**：新增 2 页 validateRequireParamUndefinedTypeExtension、...ExtensionV2 断言通过（恰 2 WARN + ERROR 0 + 消息逐字符）；既有 2 页断言保持通过；失败仅预存基线 2 例（ExtendOneChild、StructNameWarn）——`green-etsTest.txt` |
| 验证 | 经既有镜像回归入口运行 | 全量通过（回归视角）；预存基线 19 例失败不变 | **PASS（fresh，全量通过，回归视角）**：失败集与基线逐名一致（预存 19 例不变，零回归）——`green-interopArkTest.txt` |
| 实现前失败证据 | 触发条件替换前经既有全量验证入口与镜像回归入口复跑（输出存档 evidence/checks/） | 新页失败（0 vs 期望 2），既有用例不受影响；实现后恢复 | **PASS（成对 fresh，实现前失败按预期成立）**：主链新增 2 页断言失败 `expected false to be true`（WARN 0≠2；预存基线 2 例不变）；镜像回归基线对照一致（预存 19 例不变）；基线对照为预存基线 2 例失败——`red-etsTest.txt`、`red-interopArkTest.txt`、`baseline-*.txt`（存档 `evidence/checks/task4-red-green/`） |
| 静态检查 | `./node_modules/.bin/eslint <主链/镜像两文件> --ext .ts`（只读） | 新增区间 0 error | PASS：103 error 全部预存（主 50/镜像 53，行号均在编辑区外：主 ≤2007、镜像 ≤2023+EOF）；新增区间（主 :2087-2097/:2147-2148、镜像 :2103-2113/:2163-2164）0 命中；exit=1 系预存违规所致——`green-eslint.txt` |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-4：v1.8 类型级触发扩展——主链+镜像传入值判定升级（语法级→类型级）+ 扩展验证示例页面 2 页 + 注册/期望，成对验证回归 |
| 允许修改 | `compiler/src/process_custom_component.ts`、`compiler/src/interop/src/process_custom_component.ts`、compiler/test/ 下页面注册表文件、compiler/test/ 下期望诊断登记文件 |
| 允许新建 | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedTypeExtension、validateRequireParamUndefinedTypeExtensionV2 |
| 只读参考 | `compiler/src/utils.ts`、既有 2 验证示例页面、compiler/test/ 下既有验证入口断言机制、design.md 探针结论行 |
| Spec 引用 | `AC-1.5`, `AC-1.6` / `R-5`, `R-7` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-1`, `ADR-4`, `ADR-5`, `ADR-6` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 / 期望: PASS（口径见 Verification 表） |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | AC-1.5（v1.8 边界）/AC-1.6 与 R-5/R-7 对照（含 spec-for-validation.md 验证点7/8 测试输入约束）；期望条目与契约逐字符一致；既有用例零漂移与 v1.5 期望零漂移结论 |
| Code Quality | 6 项文件 diff、Base/Head SHA、主/镜像新增块 IDENTICAL 复核、新增区间只读 eslint 结果；两 helper 方向语义（声明侧 vs 传入值侧）命名与注释核对 |
| Verification | 既有全量验证入口/镜像回归入口的 Expected/Actual、成对验证（实现前失败→实现后通过）fresh 输出路径、AC 追溯表 TASK-4 相关行回填状态、探针结论复证记录 |

### TASK-5: v1.12 消息模板改写与成对验证回归

| 字段 | 内容 |
|------|------|
| 任务目标 | 将主链与镜像 WARN 推送处 message 字符串模板整体替换为 spec v1.12 新模板（`The type of property '${propName}' decorated with '@Require' is expected to be '${expectType}', but is actually '${actualType}' in the component constructor.`）；实现侧变量名沿用 `paramName`/`declaredType`/`actualType` 不变（最小 diff：仅改 message 字符串字面量，渲染结果与 spec v1.12 模板逐字符一致）；期望诊断登记 6 条期望消息文本同步替换；触发判定/类型级口径（ADR-4）/LogType.WARN/无数字码/属性级锚点/验证页面/页面注册表零改动；成对验证（改主链代码→build→既有全量验证入口 6 条消息断言失败=Red→镜像逐行同步→更新期望→全量通过=Green） |
| AC 映射 | AC-1, AC-1.1, AC-1.2, AC-1.6（文案契约刷新；AC-6 引用 AC-1 同一模板随动刷新；AC-1.3/AC-1.4/AC-1.5 为反例无文案断言，不受影响） |
| 前置依赖 | TASK-1～TASK-4 已交付（Done）；proposal.md/spec.md/design.md v1.12 基线 Approved；本 Plan v1.12 修订获 owner 批准（2026-11-10 owner 指示） |
| 非目标 | 不改触发判定逻辑与类型级口径（ADR-4 的 `isTypeDefinitelyIncludingUndefined` 及声明侧判定门保持）；不改代码内部变量名（`paramName`/`declaredType`/`actualType`——重命名会造成无关大 diff）；不改 LogType.WARN/无数字码/属性级锚点（`pos: item.getStart()`）；不改 6 个验证示例页面与页面注册表（场景与字段零改动，仅消息文本变化）；不改既有诊断（10905316/10905321/10905359、问号规则）的级别/文案/触发条件；不改 `compile_plugin.js`/构建脚本/`utils.ts` |
| 完成判据 | `npm run build` 通过；既有全量验证入口 6 条消息断言先失败（Red：实际输出新模板 vs 期望旧模板）→更新期望后全量通过且预存基线不变（主链 2 例）；镜像回归入口零漂移（预存 19 例不变）；6 验证示例页面与页面注册表 diff=0（git diff 核对）；成对验证证据存档 `evidence/checks/`；AC 追溯表 AC-1/AC-1.1/AC-1.2/AC-1.6/AC-6 行 v1.12 部分与代码范围映射 TASK-5 行回填 |
| 停止条件 | ① 新模板渲染与 spec v1.12 口径不符（如 typeToString 输出与 actualType 段文本对不齐、expectType 段与声明类型文本不一致）；② 实现需要修改 Files 表之外文件（含验证页面/页面注册表/`utils.ts`）；③ 期望消息替换后既有用例出现不可归因漂移。任一命中即停止并回传修订 Plan |

**状态所有权和生命周期**

> 无状态变更时填写一行 `N/A`，不得删除本节。

| Design Ref | 状态 | Owner | Key / Index | 创建 | 读取/更新 | 清理触发 | 生命周期不变量 |
|------------|------|-------|-------------|------|-----------|----------|----------------|
| N/A | N/A（无状态变更：纯文案字符串替换，不引入运行时状态、缓存或并发） | N/A | N/A | N/A | N/A | N/A | N/A |

**任务间接口（Produces / Consumes）**

> `Produces` 必须能被后续 Task 的 `Consumes` 精确引用；函数名、参数、错误码和数据结构不得靠执行者自行推断。

| Direction | Contract | Provider / Consumer | Dependency | Compatibility Constraint |
|-----------|----------|---------------------|------------|--------------------------|
| Produces | 主链+镜像 message 模板（v1.12）：代码字面量 `` `The type of property '${paramName}' decorated with '@Require' is expected to be '${declaredType}', but is actually '${actualType}' in the component constructor.` ``（用既有变量名插值；`${paramName}`↔spec `${propName}`、`${declaredType}`↔spec `${expectType}`，渲染结果与 spec v1.12 模板逐字符一致） | TASK-5 → 期望诊断登记 6 条期望条目 | WARN 推送点主链 :2161-2166/镜像 :2177-2182（`log.push` 块） | 仅替换 message 字符串拼接（现 :2163-2165 两行），`type: LogType.WARN`/`pos: item.getStart()`/无 code 字段不动；主/镜像逐行一致（仓内架构铁律） |
| Produces | 期望诊断登记 6 条期望消息文本（v1.12 渲染，逐字符）：`The type of property 'require_value' decorated with '@Require' is expected to be 'number', but is actually 'undefined' in the component constructor.`；`require_param_value`（string/undefined）；`void_value`（number/undefined）；`union_variable_value`（number/`number \| undefined`）；`void_param_value`（string/undefined）；`union_param_value`（string/`string \| undefined`） | TASK-5 → 既有全量验证入口断言 | 4 键 validateRequireParamUndefinedType/V2/Extension/ExtensionV2 既有条目（每条仅 message 文本替换，type WARN 不动） | 6 条期望条目数量不变（不增不删）；JSON 结构与既有格式一致 |
| Consumes | TASK-1/TASK-4 交付的 `validateRequireParamUndefinedType` 既有结构（WARN 推送块、变量定义链 `paramName`/`declaredType`/`actualType`） | TASK-5 | 既有实现（主链 :2155-2169/镜像 :2171-2185） | 仅替换 message 字符串，其余结构不动 |
| Consumes | TASK-3/TASK-4 交付的期望诊断登记条目模式（4 键 6 条，message/type 字段） | TASK-5 | 既有实现 | 仅替换 message 文本，条目键与结构不动 |

**Read-only Context**

| 路径 | 读取目的 |
|------|----------|
| `compiler/src/process_custom_component.ts:2155-2169` | WARN 推送区：message 拼接两行（:2163-2165）与变量定义（`declaredType` :2156/`actualType` :2161）——确认插值源不动 |
| `compiler/src/interop/src/process_custom_component.ts:2171-2185` | 镜像同构结构（偏移 +16），同步落点参照 |
| 6 个验证示例页面（validateRequireParamUndefinedType/V2/Extension/ExtensionV2） | 只读确认场景字段名与类型（require_value:number、require_param_value:string、void_value:number、union_variable_value:`number \| undefined`、void_param_value:string、union_param_value:`string \| undefined`）——推导期望消息文本 |
| `.codespec/changes/issue-4719-require-type-check/design.md` | ADR-5（v1.12 占位符名 propName 与实现侧变量名 paramName 的对应说明） |

**Files**

| 操作 | 文件 | 说明 |
|------|------|------|
| Modify | `compiler/src/process_custom_component.ts` | WARN 推送处 message 字符串模板整体替换（:2163-2165 两行拼接改为 v1.12 模板单/双行拼接）；变量名与插值源不动 |
| Modify | `compiler/src/interop/src/process_custom_component.ts` | 主链改动逐行同步（镜像 :2179-2181）；主/镜像 message 区块 diff 复核 IDENTICAL |
| Modify | compiler/test/ 下期望诊断登记文件 | 6 条期望消息 message 文本替换（4 键，条目数与 type 字段不变） |

**禁止修改文件**

| 文件/路径 | 原因 |
|-----------|------|
| 6 个验证示例页面（validateRequireParamUndefinedType/...V2/...Extension/...ExtensionV2）与页面注册表文件 | 场景与字段零改动是本 Task 完成判据（仅消息文本变化）；改动即破坏零漂移对照基线 |
| 代码内部变量名 `paramName`/`declaredType`/`actualType`（两 src 文件） | 重命名造成无关大 diff，违背最小实现原则；spec v1.12 占位符名与实现变量名的对应关系已在 design.md ADR-5 注记 |
| `compiler/src/utils.ts` | 只读复用既有导出；需改动时触发停止条件②，停止并修订 Plan |
| `compiler/lib/**` | Babel 生成物，仅经 `npm run build` 再生，禁止手工编辑 |
| `compiler/compile_plugin.js`、`compiler/BUILD.gn`、根级构建脚本 | 插件链顺序与构建编排固定（OH-ARCH-COMPONENT-BUILD） |
| `compiler/src/ets_checker.ts`、`compiler/src/fast_build/ets_ui/**` | TS 检查层/UI 变换层仅消费，不修改 |

**Spec References**

> 只写已存在的编号和章节锚点，禁止复制正文。

- AC / Rules: `AC-1`, `AC-1.1`, `AC-1.2`, `AC-1.6`, `R-1`, `R-2`, `R-7`
- Anchors: `spec.md#规则定义`（消息模板节，v1.12 修订注记）, `spec.md#验证映射`

**Design References**

> 引用 `ADR-*` / `STATE-*` / `INV-*` 或 design.md 中已存在的章节锚点。

- IDs / Anchors: `ADR-5`, `design.md#关键设计决策`, `design.md#测试性设计`

**Required Rules**

| Rule ID | Must / Must Not |
|---------|-----------------|
| OH-ARCH-ERROR-LOG | Must：诊断保持 LogType.WARN、无数字码（O-3）、文案为 spec v1.12 固定英文模板、pos 为传值属性节点起点；Must Not：不新增 ERROR、不改既有 10905xxx 诊断的级别/文案/触发条件 |
| OH-ARCH-LAYERING | Must：类型判定与渲染仍经 `CurrentProcessFile.getChecker` 消费既有 checker；Must Not：不引入反向或跨层依赖 |
| OH-ARCH-COMPONENT-BUILD | Must：变更限于 src/ 两份 `process_custom_component.ts` 与期望诊断登记，`lib/` 由 `npm run build` 再生；Must Not：不改 BUILD.gn/插件链顺序/构建脚本 |
| 镜像同步铁律（仓内架构约束） | Must：主链改动逐行同步 interop 镜像，主/镜像 message 区块 diff IDENTICAL；Must Not：镜像与主链行为漂移 |

**Steps**

- [x] 实现前基线复核：工作区干净（HEAD=81cdef38c），经既有全量验证入口运行确认预存基线失败（主链 2 例）与既往记录一致（**359 passing / 2 failing**：ExtendOneChild、StructNameWarn）——`baseline-etsTest.txt`
- [x] Red 采集（主链）：替换主链 message 模板（:2163-2165）→ `cd compiler && npm run build`（114 files PASS）→ 经既有全量验证入口运行（**355 passing / 6 failing**：1-60～1-63 四页面用例消息断言失败 `expected false to be true` + 预存基线 2 例不变），输出存档 `evidence/checks/task5-red-green/`
- [x] 镜像同步：同一模板替换逐行同步 `compiler/src/interop/src/process_custom_component.ts`（:2179-2181）；主/镜像 message 区块 diff 复核 IDENTICAL（偏移 +16 保持）
- [x] Green：更新期望诊断登记 6 条期望消息文本（4 键，JSON valid 276 顶层键）→ `cd compiler && npm run build` → 经既有全量验证入口与镜像回归入口运行（主链 **359 passing / 2 failing**、镜像 **1120 passing / 19 failing**：预存基线主链 2 例/镜像 19 例不变）；验证运行污染的被跟踪 testdata 脏文件（.ts_checker_cache）`git checkout --` 恢复
- [x] 只读 eslint：`./node_modules/.bin/eslint compiler/src/process_custom_component.ts compiler/src/interop/src/process_custom_component.ts --ext .ts` 核对 message 替换区间 0 新增错误（103 error 全预存，主 50/镜像 53；禁用带 --fix 的 `npm run lint`，TASK-1 已证其污染 src）
- [x] 回填 AC 追溯表（AC-1/AC-1.1/AC-1.2/AC-1.6/AC-6 行 v1.12 部分）、代码范围映射 TASK-5 行、Anti-Fake Actual、Verification Actual；成对验证证据（Red→Green）归档 `evidence/checks/task5-red-green/`

**Reference Pattern**

| 参考实现 | 复用约定 | 偏差及理由 |
|----------|----------|------------|
| TASK-1 交付的 message 模板插值模式（主链 :2163-2165：两行模板字符串拼接 + `type`/`pos` 字段） | 替换方式照抄：仅字符串字面量整体替换，插值变量与 `log.push` 结构不动 | 新模板为单句完整文案，可保持两行拼接或合并单行——以主/镜像逐行一致为约束（仓内架构铁律），不为对齐旧换行而拆行 |
| TASK-3/TASK-4 交付的期望诊断登记条目模式（4 键 6 条） | 仅 message 文本替换，条目结构与 type 字段照抄 | 无偏差 |

**Anti-Fake Completion**

| Check | Required Evidence |
|-------|-------------------|
| AC closed | 6 条消息断言实现前失败（实际新模板 vs 期望旧模板）→实现后通过（新模板 vs 新期望逐字符）；既有用例零漂移（主链失败集实现前→实现后恰差 6 条消息断言；镜像回归失败名集合与基线逐名一致、预存 19 例不变）；触发/级别/定位契约经既有 6 页计数+定位断言保持 |
| Scope respected | 净 diff 仅含 Files 表 3 项（2 src 各 message 区块 + 期望诊断登记 6 条文本）；6 验证示例页面与页面注册表 diff 为零（git diff 核对）；与代码范围映射 TASK-5 行一致 |
| State lifecycle complete | N/A：无 STATE-*/INV-*（纯文案字符串替换，无状态生命周期） |
| Interface contract matched | 渲染结果与 spec v1.12 模板逐字符（含 expectType 段后逗号与模板尾部 ` in the component constructor.`）；主/镜像 message 区块 diff IDENTICAL；6 条期望条目与实际输出逐字符；条目数 6 不变 |
| Relevant verification | 既有全量验证入口直接断言本特性 6 条消息（非无关验证）+ 镜像回归入口回归基线对照；成对验证（Red→Green）fresh 输出 |

**Anti-Fake Actual 回填（2026-11-10）**

- **AC closed：** AC-1/AC-1.1/AC-1.2/AC-1.6 文案契约闭合——6 条消息断言实现前失败（1-60～1-63 四页面用例消息 findIndex 严格相等断言失败，实际输出新模板 vs 期望旧模板）→实现后通过（新模板 vs 新期望逐字符，WARN 计数+消息双断言）；既有用例零漂移（三态失败集：主链基线 2 例 → Red 6 例（4 页面+2 预存）→ Green 2 例；镜像回归预存 19 例不变、@Require 相关失败 0）；触发/级别/定位契约经 6 页计数+定位断言保持。证据 `evidence/checks/task5-red-green/`（baseline/red/green etsTest + green interopArkTest + eslint + build 共 6 份日志）。
- **Scope respected：** 实际净 diff 仅 Files 表 3 项——2 src 各 +2/-2（仅 message 两行字符串，变量名 paramName/declaredType/actualType 与 log.push 结构零改动）+ 期望诊断登记 6 条 message 文本替换（条目数与 type 字段不变，276 顶层键 JSON valid）；6 验证示例页面与页面注册表 diff = 0；与代码范围映射 TASK-5 行一致。
- **State lifecycle complete：** N/A 维持（纯文案字符串替换，无 STATE-*/INV-*）。
- **Interface contract matched：** 渲染结果与 spec v1.12 模板逐字符（含 expectType 段后逗号与模板尾部 ` in the component constructor.`）；主/镜像 message 区块 diff IDENTICAL（偏移 +16 保持）；6 条期望条目与实际输出逐字符（findIndex 严格相等断言 Green 全过）；条目数 6 不变。
- **Relevant verification：** build 114 files PASS + 只读 eslint message 替换区间 0 命中（103 error 全预存）+ 主链成对验证 fresh 输出（三态 359/2 → 355/6 → 359/2）与镜像回归基线对照（预存 19 例同构、零回归），全部直接覆盖本 Task 生产代码与断言。

**Verification**

| 证据类型 | 命令/路径 | Expected Result | Actual Result |
|----------|-----------|-----------------|---------------|
| 编译 | `cd compiler && npm run build` | build 全步无错误，主链+镜像新 message 模板编译入 lib | **PASS（fresh，2026-11-10）**：`Successfully compiled 114 files with Babel`（Red 阶段独立 build 与 Green 阶段 etsTest/interopArkTest 内置 build 同 src 状态均通过）——`green-build.txt`、`green-etsTest.txt`、`green-interopArkTest.txt` |
| 验证 | 经既有全量验证入口运行 | 全量通过（6 条消息断言 Red→Green；预存基线 2 例失败不变；既有用例零漂移） | **PASS（fresh，全量通过；预存基线 2 例失败不变）**：359 passing / 2 failing——1-60～1-63 四页面用例红转绿（WARN 计数+消息逐字符断言通过）；失败仅预存基线 2 例（ExtendOneChild、StructNameWarn）——`green-etsTest.txt` |
| 验证 | 经既有镜像回归入口运行 | 全量通过（回归视角）；预存基线 19 例失败不变 | **PASS（fresh，全量通过，回归视角）**：1120 passing / 19 failing——失败集与预存基线同构（Lazy Imports ×8 + static interop imports ×10 + module_mode ×1，全部环境相关预存；@Require 相关失败 0）——`green-interopArkTest.txt` |
| 实现前失败证据 | 期望更新前经既有全量验证入口复跑（输出存档 evidence/checks/task5-red-green/） | 6 条消息断言失败（实际新模板 vs 期望旧模板），既有用例不受影响；期望更新后恢复 | **PASS（成对 fresh，实现前失败按预期成立）**：355 passing / 6 failing——1-60～1-63 四页面用例消息断言失败（`expected false to be true`，findIndex 严格相等不匹配；实际输出新模板 vs 期望旧模板）+ 预存基线 2 例不变；三态对照 359/2 → 355/6 → 359/2 零漂移——`red-etsTest.txt`、`baseline-etsTest.txt` |
| 静态检查 | `./node_modules/.bin/eslint <主链/镜像两文件> --ext .ts`（只读） | message 替换区间 0 新增 error | PASS：103 error 全部预存（主 50/镜像 53，行号均在编辑区外：主 ≤2007、镜像 ≤2225）；message 替换区间（主 :2163-2164、镜像 :2179-2180）0 命中；exit=1 系预存违规所致——`green-eslint.txt` |

**Handoff Summary**

> 交接信息只登记稳定引用和本 Task 的执行边界，不复制上游文档正文。

| 项 | 内容 |
|----|------|
| 任务描述 | TASK-5：v1.12 消息模板改写——主链+镜像 message 字符串模板整体替换 + 期望诊断登记 6 条期望消息文本同步，成对验证回归（Red→Green） |
| 允许修改 | `compiler/src/process_custom_component.ts`、`compiler/src/interop/src/process_custom_component.ts`、compiler/test/ 下期望诊断登记文件 |
| 允许新建 | 无 |
| 只读参考 | 6 个验证示例页面、页面注册表文件、design.md ADR-5、spec.md 消息模板节（v1.12） |
| Spec 引用 | `AC-1`, `AC-1.1`, `AC-1.2`, `AC-1.6` / `R-1`, `R-2`, `R-7` / `spec.md#规则定义`, `spec.md#验证映射` |
| Design 引用 | `ADR-5` / `design.md#关键设计决策`, `design.md#测试性设计` |
| 执行步骤 | 本 Task Card 的 `Steps` |
| 验证命令 | `cd compiler && npm run build` 后经既有全量验证入口与镜像回归入口运行 / 期望: PASS（口径见 Verification 表） |
| 完成规则 | 不得修改允许范围外的文件；如需扩大范围，停止并修订 Plan；没有 fresh verification evidence，不得声明完成 |

**Review Handoff**

| Reviewer | Input |
|----------|-------|
| Spec Compliance | AC-1/AC-1.1/AC-1.2/AC-1.6（文案契约）与 R-1/R-2/R-7 消息模板节（v1.12）对照；6 条期望消息与 spec v1.12 模板渲染逐字符一致；既有用例零漂移结论 |
| Code Quality | 3 项文件 diff、Base/Head SHA、主/镜像 message 区块 IDENTICAL 复核、只读 eslint message 替换区间结果；变量名零改动核对（paramName/declaredType/actualType 保持） |
| Verification | 既有全量验证入口/镜像回归入口的 Expected/Actual、成对验证（Red→Green）fresh 输出路径、AC 追溯表 v1.12 部分回填状态 |

## 代码范围映射

> Plan 审批时填写计划范围；实现后**如实回填实际范围和 Commit**（纯文档变更照填文档路径，不要清空或写 N/A）。三类 Review Evidence 状态触发：本表「实际文件/符号」列的值包含**代码文件/符号** → 归档必须三份 Approved（Evidence 列填文件路径，不得以 N/A 规避；N/A 后夹带代码路径不放行）；实际范围仅文档类文件（.md 等）或 `N/A：理由` → evidence 可选，一旦生成任一 evidence 文件则三份必须齐全且 Approved。实际文件超出计划范围时必须先修订 Plan，不能仅在"偏差"列解释后继续。

| Task ID | 计划文件/符号 | 实际文件/符号 | 操作 | Commit | Spec Compliance | Code Quality | Verification | 偏差 |
|---------|---------------|---------------|------|--------|-----------------|--------------|--------------|------|
| TASK-1 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType`（新增）+ `validateCustomComponentPrams` 挂载行 | `compiler/src/process_custom_component.ts`：`isTypeIncludingUndefined`/`getStructDeclarationFromComponentUseSite`/`isRequireParamTypeExcludingUndefined`/`validateRequireParamUndefinedType`（:2077-2151）+ 挂载行 `:1575`（+77 行纯插入，净 diff 单文件） | Add/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（AC-1/AC-1.1～AC-1.5 PASS） | Approved：`evidence/reviews/code-quality.md`（范围一致 + Minor 2 项非阻塞；新增区间只读 eslint 0 错误） | Approved：`evidence/reviews/verification.md`（build PASS + 既有全量验证入口 fresh 全量通过、预存基线 2 例失败不变，日志 `etsTest-final-fresh.txt`） | 函数签名省略 parentStructInfo（childStructInfo 内部派生），见「实现偏差和开放问题」 |
| TASK-2 | `compiler/src/interop/src/process_custom_component.ts:validateRequireParamUndefinedType`（镜像新增）+ 挂载行 | `compiler/src/interop/src/process_custom_component.ts`：同 4 函数（:2093-2167）+ 挂载行 `:1591`（+77 行纯插入；主/镜像新增块 diff IDENTICAL） | Add/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（镜像同步 PASS，v1.7 起非 AC） | Approved：`evidence/reviews/code-quality.md`（镜像逐行 IDENTICAL 复核成立；新增区间只读 eslint 0 错误） | Approved：`evidence/reviews/verification.md`（interopBuild PASS + 既有镜像回归入口 fresh 全量通过、预存基线 19 例失败不变，日志 `interopArkTest-final-fresh.txt`） | 无 |
| TASK-3 | compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedType、validateRequireParamUndefinedTypeV2（新建）；compiler/test/ 下页面注册表文件、期望诊断登记文件（修改） | 与计划一致：2 验证示例页面新建（V1 正例+5 反例矩阵 / V2 @Require @Param 正例+反例）；页面注册表 +2 行注册（:311-313 区域）；期望诊断登记 +2 WARN 期望条目（274 页，JSON valid） | Create/Modify | `单 commit（Change-Id Ieca81b2）` | Approved：`evidence/reviews/spec-compliance.md`（期望文案与契约逐字符一致；@Builder 使用点属 R-1 字面范围，登记说明） | Approved：`evidence/reviews/code-quality.md`（与既有先例结构一致；Minor：测试 env 恢复惯例） | Approved：`evidence/reviews/verification.md`（成对验证（实现前失败→实现后通过）+ 双基线对照零漂移 + 最终态 fresh 复跑 + 边界探针，存档 `evidence/checks/task3-red-green/` 8 份日志 + README.md） | 无 |
| TASK-4 | `compiler/src/process_custom_component.ts`（触发条件类型级替换 + 新判定 helper `isTypeDefinitelyIncludingUndefined`）；`compiler/src/interop/src/process_custom_component.ts`（镜像同步）；compiler/test/ 下验证页面目录新增页面 validateRequireParamUndefinedTypeExtension、validateRequireParamUndefinedTypeExtensionV2（新建）；compiler/test/ 下页面注册表文件、期望诊断登记文件（追加） | 主链：`isTypeDefinitelyIncludingUndefined`（:2087-2097，含函数头 2 行方向语义注释）+ 触发条件类型级替换（:2147-2148），+14/-2；镜像同构：helper :2103-2113 / 触发 :2163-2164（偏移 +16，HELPER-REGION-IDENTICAL + FUNC-REGION-IDENTICAL），+14/-2；2 扩展验证示例页面新建（V1：`void 0` + 联合变量正例 + 独立反例 child `narrowed_value`/`any_var_value`；V2：两正例）；页面注册表 +2 注册；期望诊断登记 +20/-0 纯追加（276 页 JSON valid，既有期望条目 diff=0）；既有 2 验证示例页面 diff = 0 | Modify/Create | `单 commit（Change-Id Ia0e5e0a，2026-10-31）`（代码+文档同 commit，追溯同 TASK-1 口径） | Approved：`evidence/reviews/spec-compliance.md` v1.8 增补段（2026-10-31；AC-6/AC-1.6/AC-1.5 v1.8 扩展边界 PASS，基准 spec.md md5 `254bf315c9444956a20f9df36c717172`） | Approved：`evidence/reviews/code-quality.md` v1.8 增补段（2026-10-31；净 diff 与 Files 表 6 项一致，镜像 IDENTICAL，新增区间 eslint 0 命中，无新 finding） | Approved：`evidence/reviews/verification.md` v1.8 增补段（2026-10-31；成对验证 fresh 输出（实现前失败→实现后通过、预存基线不变）+ 回归基线对照预存失败名集合逐名一致，存档 `evidence/checks/task4-red-green/`） | 无（实际区间与 Files 表/计划一致；Commit 列开放状态登记于 review.md 开放问题 #7） |
| TASK-5 | `compiler/src/process_custom_component.ts`（WARN 推送处 message 字符串模板替换，仅 :2163-2165 两行 message 拼接）；`compiler/src/interop/src/process_custom_component.ts`（镜像同步，:2179-2181）；compiler/test/ 下期望诊断登记文件（6 条期望消息文本替换：4 键 validateRequireParamUndefinedType/V2/Extension/ExtensionV2） | 与计划一致：主链 :2163-2164 message 两行（+2/-2）、镜像 :2179-2180 同构（+2/-2，message 区块 diff IDENTICAL、偏移 +16 保持）；期望诊断登记 6 条 message 文本替换（4 键、条目数不变、276 顶层键 JSON valid）；6 验证示例页面与页面注册表 diff = 0；变量名 paramName/declaredType/actualType 与 log.push 结构零改动 | Modify | `单 commit（代码+文档同 commit，2026-11-10 owner 授权 TASK-5，随 PR #7259 追加）` | Approved：`evidence/reviews/spec-compliance.md` v1.12 增补段（2026-11-10；AC-1/AC-1.1/AC-1.2/AC-1.6/AC-6 文案契约 PASS，渲染与 spec v1.12 模板逐字符） | Approved：`evidence/reviews/code-quality.md` v1.12 增补段（2026-11-10；净 diff 3 项与 Files 表一致，镜像 message 区块 IDENTICAL，eslint 替换区间 0 命中，无新 finding） | Approved：`evidence/reviews/verification.md` v1.12 增补段（2026-11-10；成对验证 fresh 三态 359/2→355/6→359/2、镜像回归预存 19 例同构、@Require 相关失败 0，存档 `evidence/checks/task5-red-green/` 6 份日志） | 无（实际区间与 Files 表/计划一致） |

## 实现偏差和开放问题

| Task ID | 类型 | 问题/偏差 | 处理状态 | 回退能力/Owner |
|---------|------|-----------|----------|----------------|
| TASK-1 | dependency | fork checker（getLinterTypeChecker）对 struct PropertyDeclaration 的类型返回行为需实现期实证（design.md 风险表已登记） | **Closed（实证通过，2026-10-29）**：探针实证 fork linter checker 对 struct PropertyDeclaration 返回含 undefined 联合成员的完整类型（`CurrentProcessFile.getChecker()` 在 .ets 下自动取 `getLinterTypeChecker()`），TypeAlias 原生解析正常；无需 ADR-1 备选回退。附带发现并处置：本 fork `getAliasedSymbol` 对非别名符号抛 Debug Failure → 实现已先判 `SymbolFlags.Alias` 再取别名（与 ADR-3 符号链一致） | ohos-design/用户（本会话需求方） |
| TASK-1 | scope | `validateRequireParamUndefinedType(node, name, log)` 签名省略了计划中的 `parentStructInfo` 参数：childStructInfo 改由 `getStructDeclarationFromComponentUseSite(checker, node)` 经符号链内部派生（调用点 `validateCustomComponentPrams` 无需传入） | Closed（有意设计，不回退）：符号链派生使函数自包含且镜像同步零差异；行为等价性由既有全量验证入口与镜像回归入口的正反例断言覆盖。已在本表登记供 ohos-review 复核 | 可回退（恢复显式传参为纯签名变更，调用点唯一）；ohos-implement |
| TASK-1 | process | 首次运行带 `--fix` 的 `npm run lint` 污染约 186 个范围外 src 文件（行尾空格/缩进美化写回） | Closed（已完全回退）：`git checkout -- compiler/src/` 全量恢复后重放本 Task 改动并重建 build；后续一律改用只读 `./node_modules/.bin/eslint <file> --ext .ts` 核对新增区间（TASK-2 起未再触发）。净 diff 已核实仅含预期 4+3 文件 | 已回退（无残留）；ohos-implement |
| TASK-3 | baseline | 预存基线失败如实记录（未掩盖）：主链验证入口 2 例（`ExtendOneChild` 断言失败、`StructNameWarn` 页面在 HEAD 缺失致 ENOENT，注册存在于 HEAD 页面注册表 :371）+ 镜像回归入口 19 例（Lazy Imports/module_mode 等环境相关） | Closed（报告而非掩盖）：stash 基线对照证明两组失败在 HEAD 即存在且与本变更无关（主链路基线为同两例；镜像基线与实现后失败名集合逐名一致、预存 19 例不变）；未修改任何既有期望条目。触发的是停止条件②的「报告」分支而非修订分支 | 非本变更引入，无需回退；如需修复属独立问题；ohos-review 复核 / 上游 |
