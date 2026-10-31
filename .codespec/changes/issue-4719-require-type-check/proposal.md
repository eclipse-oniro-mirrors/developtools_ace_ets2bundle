---
phase_status: approved
approval:
  status: approved
  approver: "@youzhi92"
  evidence: "v1.1：2026-10-29 会话明确回复「批准 Define」；v1.2：同日 owner 会话逐项确认元数据补全（@youzhi92 认领、需求ID REQ-09-01-01-01、Profile 规范化 arkui），需求语义/范围/AC 无变更；v1.3：同日 owner 会话指示修复外部测试设计 skill 校验发现的文档缺口，新增设备差异规格（1+8）/DFX 设计显式不涉及声明，需求语义/范围/AC 无变更；v1.4：同日 owner 会话选定新告警文案模板（C-2：体现声明类型与实际赋值类型），spec.md/spec-for-validation.md/execution-plan.md 消息模板与 ${paramType} 口径同步更新，触发条件/级别/定位/反例口径不变，判定范围无扩大；v1.5：2026-10-30 owner 会话指示 got 段由硬编码 'undefined' 改为实际传入类型插值 ${actualType}（触发条件下渲染恒为 'undefined'，渲染结果逐字符不变），模板契约三插值齐备，触发/级别/定位/反例口径不变；v1.6：2026-10-30 owner 会话确认整改方案后回复「执行」，spec.md/spec-for-validation.md 消息模板口径说明段改写为实现中立表述（去除 checker API 调用与源码路径引用，系外部测试设计 skill arkui-spec-check AC-05 整改），模板本体/触发/级别/定位/反例口径与渲染结果不变；v1.7：2026-10-31 owner 会话指示全链路移除 interop 一致性验收维度（验证点6/AC-6/AC-1.6/VM-6/interop 规则 R-6，原 R-7 重编号为 R-6），spec/sfv/execution-plan/design/review 六文档同步，interop 镜像代码与既有 interop 回归测试保留为附加覆盖（仓内架构铁律，非 AC 验收项）；AC-1.1～AC-1.5 行为契约与需求语义无变更；v1.8：2026-10-31 owner 会话确认既有触发条件缺口（`void 0` 与类型含 `undefined` 的联合类型变量当前不告警），经方案澄清选定「两者都告警（类型级触发）」并批准 v1.8 方案与文档链先行：触发条件由「`undefined` 标识符」语法级升级为「传入值解析类型含 `undefined`」类型级（`any`/`unknown` 动态类型不判定、收窄后不触发，零误报口径不变），新增 US-2/AC-6，AC-1～AC-5 文案/级别/定位契约不变、AC-5 反例边界按类型级口径重写"
  approved_at: "2026-10-29"
  baseline_digest: 90954a24e283960fefb01eaa702290d1f211faf3f576337725583bbb85085380
target_release:
  id: OpenHarmony-7.1-Release
  status: proposed
---

# 需求文档

> 主文档只保存需求输入和已确认基线。澄清过程仅在 complex/critical，或出现澄清阻断、争议决策、跨 SIG/多仓协调时写入条件附录。

## 需求输入

### 基本信息

| 字段 | 内容 |
|------|------|
| 需求ID | REQ-09-01-01-01 |
| 需求名称 | @Require 装饰器 non-null 字段 undefined 传值编译期新增告警（issue 标题：@Require修饰的数据支持类型校验） |
| 来源 | GitCode Issue（编译器工具链需求） |
| 提出人 | 社区 Issue #4719 反馈 |
| 目标发行版本 | OpenHarmony-7.1-Release |
| 候选 Profile | arkui（owner 已于 2026-10-29 确认规范化：主类型 arkui、无子 profile；注：本仓不在 arkui profile 的 repos 列表内，属 owner 显式选择） |
| 优先级 | P1 |
| Define 阶段状态 | Approved |

### 原始描述

**原始问题：** 当前 ArkTS 动态编译为非严格类型校验，允许开发者显式传递 `undefined` 值到 `@Require` 修饰的 non-null 类型字段。编译器对该场景无任何提示，潜在运行时异常难以在开发阶段早期发现。要求编译器识别该场景并输出告警，提示开发者修正代码。

**问题场景：**

```typescript
@Component
struct Parent {
  build() {
    Column() {
      Child({ requiredNum: undefined })  // ← 应告警
    }
  }
}

@Component
struct Child {
  @Require requiredNum: number;  // non-null 类型

  build() {
    Column() {
      Text(`number: ${this.requiredNum}`)
    }
  }
}
```

| 用户类型 | 当前痛点 | 影响 |
|----------|----------|------|
| ArkUI 应用开发者 | 向 `@Require` 修饰的 non-null 字段显式传 `undefined` 时编译器无提示，可能引发运行时异常 | 潜在运行时错误难以早期发现 |
| 编译器工具链开发者 | 缺少对 `@Require` 字段传值类型一致性的静态检查能力 | 无法在编译阶段提前预警类型不匹配 |

**期望结果：** 向 `@Require` 修饰的 non-null（声明类型不含 `undefined`）字段显式传入 `undefined` 时，编译期输出 WARNING 级别告警提示开发者；可选类型等合法场景不产生告警；编译不被阻断。

### 背景证据

| 证据类型 | 链接/路径 | 说明 |
|----------|-----------|------|
| Issue | https://gitcode.com/openharmony/developtools_ace_ets2bundle/issues/4719 | 需求原始来源 |
| 源码事实 | `compiler/src/process_custom_component.ts`（`validateCustomComponentPrams` → `validateInitDecorator` / `validateMandatoryToInitViaParam` / `validateInitParam`） | 现有构造传参校验只检查"必传字段是否传入"（10905316/10905321/10905359，均 ERROR），不检查传入值与字段声明类型的一致性 |
| 源码事实 | `compiler/src/interop/src/process_custom_component.ts` | interop 镜像工具链存在同码校验副本，行为需同步 |
| 源码事实 | `arkui-plugins/collectors/ui-collectors/validators/rules/` | 静态工具链现有 `@Require` 规则（private/static 检查）均无 undefined 传值检查（本轮确认划出范围） |
| 知识库 | `docs/specs/02-校验规则/02-05 @Require.md` | `@Require` 既有校验规则先例（WARN 级别、跨工具链一致性） |

## 需求基线

### 基线信息

| 字段 | 内容 |
|------|------|
| 基线版本 | v1.8（2026-10-31 owner 确认触发条件缺口并批准类型级触发扩展：`void 0` 与联合类型变量等解析类型含 `undefined` 的传值纳入告警，新增 US-2/AC-6，范围包含项4/不包含项5 重写为类型级口径；`any`/`unknown` 动态值不判定、收窄后不触发，零误报约束不变；模板/级别/定位契约不变）。v1.7（2026-10-31 owner 指示全链路移除 interop 一致性验收维度：删除 AC-6/AC-1.6/VM-6/验证点6 与 interop 规则 R-6（原 R-7 重编号为 R-6），spec/sfv/execution-plan/design/review 同步；interop 镜像代码与既有 interop 回归测试保留为附加覆盖，非 AC 验收项；需求语义/范围/其余 AC 无变更）。v1.6（2026-10-30 owner 指示执行外部测试设计 skill arkui-spec-check 的 AC-05 整改：消息模板口径说明段改写为实现中立表述，去除 checker API 与源码路径引用；模板本体与渲染结果不变，sfv source_spec_hash 同步回填）。v1.5（2026-10-30 owner 指示 got 段占位符化：模板 `but got '${actualType}'`，实际传入类型经 checker 解析；渲染结果不变）。v1.4（2026-10-29 owner 选定新告警文案模板 C-2：消息体现声明类型与实际赋值类型，spec 模板与 ${paramType} 口径同步；触发条件/级别/定位/反例口径不变）。v1.3（2026-10-29 外部测试设计规则校验后的文档补全：新增「设备差异规格（1+8）」「DFX 设计」显式不涉及声明，需求语义/范围/AC 无变更）。v1.2（2026-10-29 v1.1 之上 owner 元数据补全：@youzhi92 认领、需求ID REQ-09-01-01-01、Profile 规范化 arkui；需求语义/范围/AC 无变更。v1.1：2026-08-11 v1.0 首次基线的模板迁移与范围刷新，明确 interop 覆盖与 target_release） |
| 基线日期 | 2026-10-29 |
| Owner | @youzhi92（2026-10-29 认领） |
| 确认人 | @youzhi92（用户，本会话需求方） |
| 确认依据 | v1.1：2026-10-29 会话明确回复「批准 Define」，批准候选基线（范围/非目标/AC 摘要已在会话中呈现）；v1.2：同日 owner 会话逐项确认元数据补全（Owner 认领、需求ID、Profile 规范化）；v1.3：同日 owner 会话指示修复外部测试设计 skill 校验发现的文档缺口（仅新增显式不涉及声明，语义/范围/AC 无变更）；v1.4：同日 owner 会话三轮候选（A/B/C → C → C-1/C-2/C-3）后明确回复「选择C-2」，批准新告警文案模板与文档同步；v1.5：2026-10-30 owner 会话明确指示「got 'undefined' 要改成 got '实际传入的类型'」，批准 got 段占位符化与文档同步；v1.6：2026-10-30 owner 会话针对外部测试设计 skill arkui-spec-check 的 AC-05 检查项（用户视角而非内部实现视角），确认口径说明段实现中立化改写方案后回复「执行」，批准该段改写与文档同步（需求语义/范围/AC 无变更）；v1.7：2026-10-31 owner 会话明确指示「不需要验证点6，请同步更新spec和spec-for-validation」并确认「全链路一致移除」口径，批准 interop 验收维度移除与六文档同步（AC-1.1～AC-1.5 行为契约不变）；v1.8：2026-10-31 owner 会话指出「当前没有考虑到传 void 0 或者传变量（xxx | undefined）的情况」，经方案澄清选定「两者都告警（类型级触发）」并回复「批准，文档链先行」，批准 v1.8 行为扩展方案（含行为变化表、新 fixture 策略、VM/验证点跳 6 编号） |
| 复杂度 | 简单 |
| Profile | arkui（owner 已确认规范化，2026-10-29） |
| 目标发行版本 | 引用 proposal.target_release（OpenHarmony-7.1-Release） |
| 版本状态 | proposed |
| 基线结论 | 通过 |

### 问题、目标与成功指标

**问题陈述：** 动态类型工具链（compiler/）对组件构造传参不做严格类型校验，`@Require` 修饰的 non-null 字段被显式传入 `undefined` 时编译器静默通过，运行时才暴露异常。受影响用户是使用 ArkUI 声明式 UI 的应用开发者；现在解决是因为该场景已有明确 issue 反馈且既有 `@Require` 校验链路（缺失即 ERROR）已就位，补齐传值类型一致性检查成本低、收益直接。

| 目标 | 成功指标 | 验证方式 |
|------|----------|----------|
| 编译期识别 `@Require` non-null 字段的 `undefined` 传值并告警（显式 `undefined` 标识符与解析类型含 `undefined` 的 `void 0`/联合类型变量/表达式） | 全部正例场景输出 WARNING（非 ERROR），编译不失败 | compiler 单测（构造传参校验相关套件） |
| 零误报：合法场景不受影响 | 可选类型字段、非 `@Require` 字段、嵌套属性内部 `undefined`、解析类型不含 `undefined` 的变量传值（含收窄后）、`any`/`unknown` 动态类型值均不触发该告警 | compiler 反例单测 |

### 用户故事与 AC

| Story ID | 用户故事 | 优先级 |
|----------|----------|--------|
| US-1 | 作为 ArkUI 应用开发者，我希望在向 `@Require` 修饰的 non-null 字段显式传入 `undefined` 时获得编译期告警，以便在开发阶段发现并修正类型不一致，避免运行时异常 | P0 |
| US-2 | 作为 ArkUI 应用开发者，我希望以 `void 0` 或类型含 `undefined` 的变量等非标识符形式向 `@Require` 修饰的 non-null 字段传入可能为 `undefined` 的值时，同样获得编译期告警，以免该写法绕过显式 `undefined` 场景的检查 | P0 |

| AC编号 | 验收标准 | 类型 | 关联Story |
|--------|----------|------|-----------|
| AC-1 | WHEN V1 组件（`@Component`）构造传参中，向 `@Require` 修饰（单独使用或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合）且声明类型不含 `undefined` 的字段显式传入 `undefined` THEN 编译输出一条 WARNING 级别诊断（指向该传值位置，含字段名），且编译继续不失败 | 正常 | US-1 |
| AC-2 | WHEN V2 组件（`@ComponentV2`）构造传参中，向 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` THEN 编译输出同一条 WARNING，且编译继续不失败 | 正常 | US-1 |
| AC-3 | WHEN `@Require` 字段声明类型含 `undefined`（如 `number \| undefined`）且显式传入 `undefined` THEN 编译不输出该告警 | 边界 | US-1 |
| AC-4 | WHEN 非 `@Require` 修饰的字段显式传入 `undefined` THEN 编译不输出该告警 | 边界 | US-1 |
| AC-5 | WHEN 构造传参对象的字段值不是 `undefined` 标识符且其解析类型不含 `undefined`（如普通变量/表达式传值、联合类型变量经空值守卫收窄后传值、嵌套属性内部出现 `undefined`、`any`/`unknown` 动态类型值）THEN 编译不输出该告警 | 边界 | US-1 |
| AC-6 | WHEN V1/V2 组件构造传参中，向 `@Require` 修饰且声明类型不含 `undefined` 的字段传入非 `undefined` 标识符、但解析类型含 `undefined` 的值（如 `void 0`、类型为 `xxx \| undefined` 的变量）THEN 编译输出与 AC-1 相同级别、相同文案模板的 1 条 WARNING（实际类型段为该传入值的解析类型文本），且编译继续不失败 | 正常 | US-2 |

### 范围边界

**包含：**

1. compiler/（动态类型工具链）组件构造传参阶段的 `@Require` 字段传值类型一致性告警
2. V1 与 V2 组件的 `@Require` 字段（V1：单独 `@Require` 或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合；V2：`@Require`+`@Param`）
3. non-null 判定：字段声明类型不含 `undefined`
4. `undefined` 传值检测（v1.8 类型级触发）：显式 `undefined` 标识符、`void` 表达式、解析类型含 `undefined` 的变量/表达式，仅顶层字段
5. WARNING 级别（非阻断）
6. interop 镜像路径（`compiler/src/interop/src/`）同步实现
7. 配套单元测试（正例/反例/双路径）

**不包含：**

1. arkui-plugins/（静态类型工具链）的对应规则（如需对齐另行立项）
2. 其它装饰器（`@Prop`、`@State` 等单独使用）的 `undefined` 传值检查
3. 可选类型字段（声明类型含 `undefined`）传 `undefined` 的告警
4. 显式 `null` 传值的告警
5. 解析类型不含 `undefined` 的变量/表达式传值（含联合类型变量经空值守卫收窄后传值）与 `any`/`unknown` 动态类型值——不判定为 `undefined` 传值，不告警（v1.8 类型级口径下的反例边界）
6. 嵌套对象属性内部的 `undefined` 检查
7. 运行时组件行为修改
8. 新增/修改/废弃公共 API
9. 编译模式（ESMODULE/JSBUNDLE）行为变更

| 阶段（如适用） | 范围 | 不做 | 进入条件 |
|----------------|------|------|----------|
| 骨架→完整 | 单次交付全部 AC | — | 基线批准 |

### Agent Scope Guard

> 只约束需求探索和上下文收集阶段可访问的仓库、模块与知识源，不维护实现文件清单。发现需要越界时必须停止并重新确认基线；精确代码文件范围由 execution-plan.md / task.md 持有。

| 维度 | 允许范围/限制 | 越界触发条件 | 处理规则 |
|------|---------------|--------------|----------|
| 允许检索仓库 | `developtools_ace_ets2bundle`（本仓，单仓需求） | 需要访问未列仓库（如 arkui_ace_engine、interface_sdk-js） | 停止探索，补充影响分析并重新确认基线 |
| 允许模块/目录 | `compiler/`（含 `compiler/src/interop/`、`compiler/test/`）、`docs/kb/`、`docs/specs/`、`.codespec/` | 需要扩大模块/目录（如 `arkui-plugins/`、`ets1.2/`） | 更新范围与影响范围，经 Owner 确认后继续 |
| 禁止访问/修改 | `compiler/lib/`（Babel 生成物）、`compiler/declarations/`（生成物）、`koala-wrapper/src/generated/`、凭据与私有目录、无关工作区 | 命中禁止项 | 标记 Blocked，不读取、不修改 |
| 外部网络/私有知识源 | N/A——仅本地源码检索与既有 GitCode issue 链接（只读引用），无新增网络知识源授权 | 需要新增权限或未授权来源 | 请求人工授权；未授权前不得使用 |

### 影响范围

| 子系统 | 仓库 | 模块/路径 | 当前职责 | 影响类型 | Owner |
|--------|------|-----------|----------|----------|-------|
| 编译工具链 | developtools_ace_ets2bundle | `compiler/src/`（组件构造传参校验链路） | 自定义组件构造参数校验与变换（含 `@Require` 必传校验） | 修改（新增告警逻辑） | @youzhi92 |
| 编译工具链 | developtools_ace_ets2bundle | `compiler/src/interop/src/`（镜像副本） | interop 模式下同职责 | 修改（同步告警逻辑） | @youzhi92 |
| 编译工具链 | developtools_ace_ets2bundle | `compiler/test/` | 编译器单元测试 | 新增（正例/反例用例） | @youzhi92 |

### API 变更项清单

> 涉及 API 变更时必填，作为 design.md 与 spec.md 的共享锚点。无 API 变更时填写 `N/A：<理由>`。

| API 名称 | 变更类型 | 开放范围 | 概要说明 |
|----------|----------|----------|----------|
| N/A：本需求仅新增编译器 WARNING 诊断，不新增/修改/废弃任何 Public/System/InnerAPI | — | — | — |

### 不涉及项确认

| 维度 | 涉及？ | 依据 | 若涉及，进入哪个下游文档 |
|------|--------|------|--------------------------|
| 性能 | 否 | 静态检查仅在既有构造传参遍历中增加类型判定，无运行时热路径；编译产物不变 | — |
| 安全与权限 | N/A | 编译期诊断，不触及安全/隐私/权限面 | — |
| 兼容性 | 是 | 新增 WARNING 改变开发者可见编译输出（存量工程可能出现新告警，v1.8 类型级触发扩展后 `void 0`/联合类型变量场景同样纳入新告警面）；非 ERROR，不阻断编译 | spec.md |
| API/SDK | 否 | 无 API/SDK 变更 | — |
| IPC/跨进程 | N/A | 编译期工具链，无跨进程交互 | — |
| 构建与部件 | 否 | 不改 GN/插件链顺序/构建脚本；仅在 `src/` 校验逻辑内新增（`lib/` 由 `npm run build` 再生成） | — |
| 国际化/无障碍 | N/A | 诊断文案遵循编译器既有英文诊断惯例 | — |
| 数据迁移 | N/A | 无数据/配置/持久化格式迁移 | — |

### 设备差异规格（1+8）

不涉及：本特性为编译器构建期静态诊断，与设备形态无关——手机及平板/折叠屏/大屏等 1+8 设备形态上编译行为一致，无设备差异化规格。该结论由 spec.md「多设备适配声明」（无差异）与「全局特性影响」表（大字体/多窗口分屏/多用户等均为否）承载。

### DFX 设计

不涉及：本特性为编译期 WARNING 诊断，无运行时维测、日志格式变更、定界定位等 DFX 指标要求。新增诊断本身（级别、文案、行列定位）即为可观察输出，可测试性由 spec.md 验证映射 VM-1～VM-5 与 VM-7～VM-8 承载（VM-6 编号已随 v1.7 interop 维度移除不复用）；编译耗时影响限于构造传参遍历内的类型判定，无用户可感知阈值要求（spec.md 非功能性需求 N/A）。

### 依赖、风险与外部约束

| 依赖/风险 | 类型 | 影响 | 缓解措施/Owner | 状态 |
|-----------|------|------|----------------|------|
| 存量工程可能出现新告警（用户感知变化） | 兼容 | 中 | WARNING 非阻断；诊断文案给出修正指引；发布说明同步 | 已确认（spec 兼容性声明承载；全量回归零漂移实测；v1.8 类型级扩展后新增告警面为 `void 0`/联合类型变量场景，回归口径见 spec VM-7/VM-8） |
| "类型不含 undefined"判定复杂度（联合类型、类型别名） | 技术 | 中 | 设计阶段基于 TS Checker/类型节点验证判定方案；反例单例覆盖（AC-3） | 已验证（design ADR-1 checker 判定落地；联合/any/嵌套反例 0 误报实测；v1.8 传入值侧同源口径已探针实测：`void 0`/联合变量命中、收窄豁免、`any` 排除） |
| 诊断码策略（是否分配 10905xxx 数字码） | 技术 | 低 | spec 阶段定；既有 WARN 先例存在无码告警（private 传参告警） | 已决策（spec O-3：WARN 无数字码，沿用仓内无码告警先例） |

### 依据与上下文引用

| 来源 | 查询/读取内容 | 基线采用的结论 | 可信度 | 证据路径/链接 |
|------|---------------|----------------|--------|---------------|
| 源码 | `compiler/src/pre_define.ts:50` | `@Require` 装饰器常量唯一来源（禁止硬编码） | 高 | 本仓 |
| 源码 | `compiler/src/process_custom_component.ts:1542-1575` | 构造传参校验入口 `validateCustomComponentPrams`；既有 `@Require` 必传校验 10905359（V1）/10905321（V2）均 ERROR；同文件存在 WARN 无码先例（private 传参） | 高 | 本仓 |
| 源码 | `compiler/src/process_component_member.ts:561-572`、`compiler/src/validate_ui_syntax.ts:2638-2645` | V1 `@Require` 可单独使用或与 `@Prop`/`@BuilderParam`/`@State`/`@Provide`/`@Watch` 组合 | 高 | 本仓 |
| 源码 | `compiler/src/process_struct_componentV2.ts:549` | V2 `@Require` 仅可与 `@Param` 组合 | 高 | 本仓 |
| 源码 | `compiler/src/interop/src/process_custom_component.ts` | interop 镜像副本存在同码 `@Require` 校验，需同步 | 高 | 本仓 |
| 源码 | `arkui-plugins/collectors/ui-collectors/validators/rules/` | 静态工具链无 undefined 传值检查；双工具链为并行系统不可交叉依赖 → 范围决策仅 compiler/ | 高 | 本仓 |
| Agent 指南 | 根 `AGENTS.md`、`compiler/AGENTS.md`、`arkui-plugins/AGENTS.md` | `lib/` 禁改（改 `src/` 后 `npm run build`）；装饰器名必须用常量；compiler 与 arkui-plugins 运行时不交叉依赖 | 高 | 本仓 |
| 知识库 | `docs/kb/02-装饰器速查.md`、`docs/specs/02-校验规则/02-05 @Require.md` | `@Require` 既有校验规则先例（WARN 级别；跨工具链一致性惯例） | 高 | 本仓 |
| Issue | issue 4719 | 需求原始来源与场景描述 | 中 | https://gitcode.com/openharmony/developtools_ace_ets2bundle/issues/4719 |
| 用户澄清 | 2026-10-29 会话（详见 `evidence/checks/check-proposal.md`） | 仅 compiler/；含 interop 副本；target_release=OpenHarmony-7.1-Release | 高 | `.codespec/changes/issue-4719-require-type-check/evidence/checks/check-proposal.md` |
| 设计前置实测 | 2026-10-31 会话探针验证（v1.8）：forked TS linter checker 对构造传参各形态的类型解析与渲染——`void 0`/`undefined` 标识符→`'undefined'`、联合属性→`'number \| undefined'`、空值守卫收窄后→`'number'`、`any`→`'any'`、嵌套对象顶层不含 `undefined` | 类型级触发方案可行：收窄豁免成立、`any` 需谓词显式排除；结论落入 design.md ADR 与 fixture 设计（探针脚本为临时件未入库） | 高 | 会话记录；结论固化于 design.md 与 spec-for-validation.md 验证点 |

### 变更控制与下游条件

| 变更类型 | 触发条件 | 处理规则 |
|----------|----------|----------|
| 范围新增 | 新增用户故事或仓/模块（如扩到 arkui-plugins/） | 重新评估复杂度和影响范围，重新确认基线 |
| AC 变更 | 修改可观察行为或错误码 | 重新审批基线和 Spec |
| API 变更 | 新增/修改 Public/System API | 触发设计审批 |
| Agent 探索范围变更 | 需要访问未列仓库/模块、禁止项或新知识源 | 停止探索，更新 Agent Scope Guard 后重新确认基线 |
| 非功能指标变更 | 性能/安全/兼容性阈值变化 | 重新确认验证计划 |
| 目标版本变更 | 交付版本调整 | 更新 proposal.target_release |

- [x] 所有 P0/P1 用户故事有可测试、可度量的 AC
- [x] 范围内外、影响范围、API 变化和不涉及项已确认
- [x] `proposal.target_release` 已确认（OpenHarmony-7.1-Release）
- [x] `manifest.profile` 已确认（arkui，owner 已确认规范化）
- [x] Agent Scope Guard 已基线化，未复制 Plan/Task 的实现文件清单
- [x] 基线结论为"通过"，且确认人和确认依据完整（2026-10-29 用户批准 Define）
- [x] 条件附录触发时，待澄清项和争议决策已关闭（简单复杂度无阻断，未启用附录；澄清过程见 `evidence/checks/check-proposal.md`）
