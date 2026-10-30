# check-spec — issue-4719-require-type-check（Specify 阶段一致性检查）

> 检查时间：2026-10-29；执行：ohos-spec（Agent）；profile：`arkui`（owner 约定值，repos 不含本仓；subprofile `toolchain` 无对应文件，capi/component/render/sdk-api 为已注册值——O-1 决策保留）。

## 信息检索手段记录

| 手段 | 检索内容 | 结果 |
|---|---|---|
| 源码核对（grep/read） | `compiler/src/` WARN 级诊断是否带数字码 | WARN 均无 `code` 字段（如 `process_custom_component.ts:443/1730/2068`、`validate_ui_syntax.ts:2564`）；10905xxx 数字码仅用于 ERROR |
| 源码核对（grep/read） | `process_custom_component.ts` 校验入口与既有 @Require 码 | `validateCustomComponentPrams` ~L1542；10905359（V1 @Require 必传）/10905321（V2 @Param 必传）/10905316（@Link/@ObjectLink 必传）均 ERROR |
| 源码核对（read） | `process_component_member.ts:161` `mandatoryToInitViaParamDecorators` | = {`@Prop`,`@Link`,`@ObjectLink`}，不含 `@Require` → 可选类型用例须用 `number \| undefined` 联合写法（`@Require @Prop x?: number` 触发既有问号 ERROR） |
| 源码核对（read/grep） | 测试基建：`ut_validate.test.ts`（mocha 断言 WARN/ERROR 计数与文案）、`transform_ut_error.json`（期望日志）、`helpers/pathConfig.ts`（UT_VALIDATE_PAGES 注册）、既有 fixture `validateInitDecorator.ets` | fixture + 期望日志 + 断言机制确认 |
| 源码核对（grep） | `package.json` scripts | `etsTest`、`interopArkTest`（先 `interopBuild` 编译 `src/interop/src` 入 `lib/`）确认 |
| 目录核对（ls） | `src/interop/src/`（56 文件，含 `fast_build/ets_ui/` 完整插件集）；`interface/sdk-js` 存在性 | interop 镜像与测试命令可运行 |
| 存量读取 | 本 change 遗留旧格式 `spec.md` | 两个决策点甄别（见 arkui-specify-entry 存量读取行） |

## arkui-specify-entry（存量特性归档与 FeatID 连续性）

| 检查项 | 结果 | 证据/缺口 | 确认来源 | 后续动作 |
|--------|------|-----------|----------|----------|
| Define gate 前置 | 通过 | Define 已批准：`phase_status: approved`，approval 块完整，digest `e8fc51f2…474264` 与当前需求基线一致（Level C proposal→spec 审批边通过） | proposal.md approval 块；`ohos-sdd validate --level C` | 无 |
| FeatID 连续性预检 | N/A（有理由） | 当前 FeatID = TBD（O-2 owner 决策：社区 issue 无系统分配 ID，无编号可校验连续性）；本仓无 `specs/registry/functions.yaml`/`features.yaml`（`specs/` 目录不存在），无已注册 FeatID 列表可比对；非"声称 Feat-NN 而中间缺失"的 Blocked 情形 | Owner 对话确认（2026-10-29 O-2）；目录核对（`ls specs/` 不存在） | 待 Owner 将来分配 FuncID/FeatID 时补建长期归档并注册 |
| 存量 spec/design 归档读取 | N/A（有理由）+ 替代参考已读取 | 本仓无长期 `specs/` 归档，无存量长期 spec/design 可读。替代参考已读取并甄别：① 本 change 遗留旧格式 spec.md——其 TypeAlias 场景作为已批准基线"non-null=类型不含 undefined"的忠实细化纳入 R-1/R-3/R-7 与类型判定口径表；其中文告警文案与仓内英文诊断惯例冲突，弃用（沿用基线英文文案模板）；② 既有 `@Require` 规则先例 `docs/specs/02-校验规则/02-05 @Require.md`；③ 既有 fixture `validateInitDecorator.ets` 模式 | 存量文件读取（遗留 spec.md）；源码核对（fixture/源码） | 无 |
| P0/P1 AC 映射验证 | 通过 | 特性优先级 P1；AC-1.1～AC-1.6 全部映射 VM-1～VM-6（各含真实测试入口、实现前 Red 条件、通过标准） | spec.md 验证映射表 | 无 |

## arkui-specify-exit（短期规格产物完整 + 短期/长期分离）

| 检查项 | 结果 | 证据/缺口 | 确认来源 | 后续动作 |
|--------|------|-----------|----------|----------|
| spec.md 已创建且内容完整 | 通过 | 新格式 spec.md 已写入 `.codespec/changes/issue-4719-require-type-check/`（替换遗留旧格式）：概述/输入文档/用户故事+6 条 WHEN/THEN 同行 AC/验收追溯（AC/规则/可观察表面三列）/规则定义（R-1～R-7 + 类型判定口径表 + 统一消息模板）/验证映射 VM-1～VM-6/API 变更分析（三子节）/兼容性声明/架构约束/非功能/多设备/全局影响/context-references；概述状态 Approved | `ohos-sdd validate --level B` PASS（4/4 锚点标题）；测试入口与命令均经源码/目录核对（见上表） | 无（用户已于 2026-10-29 批准 Specify） |
| 长期 `specs/` 当前 Feat 文件状态 | N/A（有理由） | 本仓未建立长期 `specs/` 归档体系；FuncID/FeatID TBD（O-2），无长期文件可置状态 | 目录核对；Owner 对话确认（O-2） | 归档体系建立时补齐 |
| 后续 Design/Plan/长期归档路径记录 | 通过 | manifest.md 已补记：`design_path`/`plan_path`（change 目录内短期产物）；`long_term_spec_path`/`long_term_design_path`/`spectest_feature_path` 均附 N/A 理由 | manifest.md | ohos-design 阶段重写遗留 design.md；ohos-plan 阶段创建 execution-plan.md |
| 短期/长期分离 | 通过 | spec.md 写入 `.codespec/changes/{id}/`，未触碰长期目录（长期目录不存在） | 目录核对 | 无 |

## ohos-spec 规则 12 运行时自检（语义结论，不写入 spec.md）

机器项以 validate 结果为准：`--level B` PASS（4/4）；`--level C` 仅剩 `spec→plan`（缺 execution-plan.md，属 ohos-plan 阶段预期）；THEN 词法启发式 0 WARN（无需 `<!-- ext-ok -->` 豁免，无 gate-checklist 待记录项）。

- AC 用 WHEN/THEN 且可测可度量：6/6 通过；spec.md 内无可度量性违例词（grep `尽可能|快速|稳定|TBD` 等 0 命中）
- 每 AC 有可观察表面：6/6 声明"终端用户（应用开发者编译/构建输出）"
- THEN 无内部实现（数据结构/状态机/调用链/类方法/锁/算法）：语义复核通过（THEN 仅描述告警条数/级别/文案/编译是否继续等外部可判定结果）
- 验收追溯仅含 AC/关联规则/可观察表面：通过（三列表，未复制 Task/验证方式/执行证据）
- 每 AC 有测试入口、Red 条件、通过标准：6/6（VM-1～VM-6，Red 条件均为"实现前 0 条 vs 期望 1 条，mocha 断言失败"的具体信号）
- 兼容性声明 + API 变更清单：通过（新增/变更废弃/API 与错误码事实三子节均 N/A 附理由；既有 10905359/10905321/10905316 记为事实备查，含精确数值、触发条件、文件来源）
- 规则无重叠冲突、每 AC 可独立测试：通过（正例 R-1/R-2/R-6，反例 R-3/R-4/R-5/R-7 边界互斥；AC-1.1～AC-1.6 可由 VM-1～VM-6 独立承载）

## 一致性结论

spec.md 与已批准 proposal 基线 v1.1 一致：AC-1.1～AC-1.6 ↔ proposal AC-1～AC-6 一一对应、顺序一致；范围（仅 `compiler/` 含 `src/interop/src/` 镜像）、零误报约束、`null` 出范围等语义与基线一致。Owner 决策 O-3（无数字码 WARN）已落实于规则定义与 API 事实节。

**Specify 审批闭环（2026-10-29）**：用户（本会话需求方/owner）于会话明确回复「批准 Specify」。spec.md 概述状态已更新为 `Approved`；`.codespec/registry.md` 行状态流转 `Specify → Design`。审批人：用户（本会话需求方）；批准对象：spec.md 全量内容（6 AC / R-1～R-7 / 类型判定口径 / 统一消息模板 / VM-1～VM-6 / API 变更分析 N/A 三子节）。后续进入 ohos-design 阶段（重写遗留 design.md）。
