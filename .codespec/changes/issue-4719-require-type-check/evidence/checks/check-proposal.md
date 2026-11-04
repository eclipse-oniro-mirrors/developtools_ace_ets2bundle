# Check — proposal（Define）

- 变更：issue-4719-require-type-check
- 日期：2026-10-29
- 检查者：AI（ohos-propose）
- Provenance：本仓源码检索 + 既有 `.codespec/changes/issue-4719-require-type-check/` 遗留基线（2026-08-11）+ 用户澄清答复

## 澄清记录（2026-10-29 会话）

| 编号 | 问题 | 结论 | 来源 |
|------|------|------|------|
| C-1 | 告警实现于哪条工具链 | 仅 `compiler/`（动态类型工具链，痛点所在）；`arkui-plugins/`（静态类型工具链）另行立项 | 用户确认 |
| C-2 | 是否覆盖 interop 镜像副本 | 覆盖：`compiler/src/interop/src/` 与主链路同步实现，保持诊断一致 | 用户确认 |
| C-3 | target_release | OpenHarmony-7.1-Release（写入 proposal frontmatter） | 用户确认 |
| C-4 | 告警级别 / 触发条件 / 检查深度 / 类型判定 | WARNING 非阻断；仅显式 `undefined`；仅顶层字段；non-null = 声明类型不含 `undefined`（沿用 2026-08-11 已澄清基线，本轮未变） | 既有基线 |

## 源码核验

| 验证点 | 结果 |
|--------|------|
| `@Require` 常量唯一来源 | `compiler/src/pre_define.ts:50` `COMPONENT_REQUIRE_DECORATOR`（禁硬编码） |
| 构造传参校验入口 | `compiler/src/process_custom_component.ts:1542` `validateCustomComponentPrams` → `validateInitDecorator` / `validateMandatoryToInitViaParam` / `validateInitParam` |
| 既有 `@Require` 诊断 | 10905359（V1 `@Require` 必传缺失，ERROR）、10905321（V2 `@Param` 必传缺失，ERROR）、10905316（`@Link`/`@ObjectLink` 必传缺失，ERROR）；同文件存在 WARN 无码先例（private 传参告警，`LogType.WARN`） |
| V1 `@Require` 搭配 | 单独 `@Require` 或与 `@Prop`/`@BuilderParam`/`@State`/`@Provide`/`@Watch` 组合（`process_component_member.ts:561-572`、`validate_ui_syntax.ts:2638-2645`） |
| V2 `@Require` 搭配 | 仅 `@Param`（`process_struct_componentV2.ts:549`） |
| interop 镜像 | `compiler/src/interop/src/process_custom_component.ts` 存在同码校验副本（10905321/10905359） |
| 静态工具链 | `arkui-plugins/collectors/ui-collectors/validators/rules/check-require-decorator-regular.ts`（private+`@Require`）、`check-static-param-require.ts`（static 传参）均无 undefined 传值检查 |
| LogType 枚举 | `compiler/src/utils.ts:62-66`：ERROR/WARN/NOTE |
| 仓库 Agent 指南 | 根 `AGENTS.md`、`compiler/AGENTS.md`、`arkui-plugins/AGENTS.md` 已读；关键约束：`lib/` 禁改（编辑 `src/` 后 `npm run build`）、装饰器名必须用 `pre_define.ts`/`predefines.ts` 常量、compiler 与 arkui-plugins 为并行系统运行时不交叉依赖 |

## 一致性结论

proposal v1.1 与用户澄清结论（C-1～C-3）、既有已澄清语义（C-4）及上述源码事实一致。用户于 2026-10-29 会话明确回复「批准 Define」：`phase_status: approved`，approval 记录（approver/evidence/approved_at）完整，`baseline_digest: e8fc51f2d44d2cf2f04c527dcd5b14eff20b9e41dc5af80320687066ec474264` 与当前需求基线一致（Level C proposal→spec 审批边通过）。Define 阶段闭环。

profile 声明 `arkui/toolchain` 与 `subprofiles: [toolchain]` 为 owner 既有约定，非标准 profile 注册值（arkui profile 的 `repos` 不含本仓、无 `toolchain` 子 profile），待 owner 确认。

## Owner 确认记录（2026-10-29，Define 批准后同会话）

用户（本会话需求方/owner）对待跟进项 1-3 逐项确认：

| 编号 | 事项 | owner 决策 | 落点 |
|------|------|-----------|------|
| O-1 | Profile 声明 | 保持 `arkui/toolchain`（与本仓全部 4 个既有变更一致；本记录即 owner 确认证据，proposal/manifest 值不变） | evidence（本文件）；已批准基线不动 |
| O-2 | Owner / FuncID / FeatID | Owner = 用户（本会话需求方），写入 manifest `owner` 字段；FuncID/FeatID 保持 TBD（社区 issue 无系统分配 ID） | manifest.md（运行时元数据，不涉已批准基线 digest） |
| O-3 | 诊断码策略 | **不分配数字错误码**，沿用本仓 WARN 无码惯例（已核验：`compiler/src/` 中 WARN 级诊断均无 `code` 字段，10905xxx 数字码仅用于 ERROR）。该决策预约束 Specify 阶段：spec.md 错误码事实按"无数字码、WARN 级、以文案与级别标识"书写 | evidence（本文件）；spec.md 于 ohos-spec 阶段落实 |

> 说明：以上确认均为元数据级记录，未变更已批准需求基线的范围/AC/约束内容，故 `phase_status: approved` 与 `baseline_digest: e8fc51f2…` 保持有效；proposal 基线信息表中 Owner「TBD（待 owner 认领）」为批准时点快照，当前有效 owner 以 manifest 为准。
