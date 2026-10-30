---
artifact: spec-for-validation
format_version: arkui-detailed-v1
status: Approved
source_spec: spec.md
source_spec_hash: 8b7425a60b0b24b5dbde66ab591774552dc9534dc5a76afcdc25a492437477d9
source_design: design.md
source_design_hash: e2f629fc84989ce89c0b8d5ba345f202ee64eacfcb5aeff6d895853e2f072ab0
source_consistency: current
profile: arkui
subprofiles: []
generated_at: 2026-10-29T13:16:01+00:00
---

# @Require 装饰器 non-null 字段 undefined 传值编译期新增告警 — 测试设计规格

> ArkUI 测试设计规格 | 格式版本: v1.0
>
> 本文档是测试用例设计的自包含输入件。需求目标、用户故事、规则、API、兼容性和非功能性要求来自 Approved `spec.md`；2D、2C、NFR 验证细项和 AC 验证点由测试输入分析补充。
> `GENERATED:*` 区域只能由 CLI 刷新；人工只填写 `TEST-ANALYSIS` 区域，不得摘要或改写来源规格。

---

## 元信息

| 字段 | 内容 |
|---|---|
| 需求编号 | issue-4719-require-type-check |
| 需求名称 | @Require 装饰器 non-null 字段 undefined 传值编译期新增告警 |
| 特性编号 | REQ-09-01-01-01（沿用 proposal 需求ID） |
| 需求来源 | 未声明 |
| 提出人 | 未声明 |
| 优先级 | P1 |
| 目标版本 | OpenHarmony-7.1-Release（引用 proposal.target_release） |
| SIG归属 | 无（单仓编译工具链变更） |
| 来源规格状态 | Approved |
| 产物状态 | Approved |
| 复杂度 | 简单 |
| 创建日期 | 2026-10-29 |
| 最后更新 | 2026-10-29 |

---

<!-- GENERATED:EXTERNAL-SPEC:BEGIN -->
## 一、需求目标与规格 `[源: spec.md]`

### 概述

| 属性 | 值 |
|------|-----|
| 特性名称 | @Require 装饰器 non-null 字段 undefined 传值编译期新增告警 |
| 特性编号 | REQ-09-01-01-01（沿用 proposal 需求ID） |
| 所属 Epic | 无（独立特性） |
| 优先级 | P1 |
| 目标版本 | OpenHarmony-7.1-Release（引用 proposal.target_release） |
| SIG 归属 | 无（单仓编译工具链变更） |
| 状态 | Approved |
| 复杂度 | 简单 |

### 用户故事

#### US-1: @Require 字段 undefined 传值编译期告警

**作为** ArkUI 应用开发者,
**我想要** 在向 `@Require` 修饰的 non-null（声明类型不含 `undefined`）字段显式传入 `undefined` 时获得编译期告警,
**以便** 在开发阶段发现并修正类型不一致，避免运行时异常。

**验收标准（AC, Acceptance Criteria）：**

| AC编号 | 验收标准 | 可观察表面 | 类型 |
|--------|----------|--------------|------|
| AC-1.1 | Given ArkTS 应用工程中 V1 组件（`@Component`）构造传参对象含 `@Require` 修饰（单独使用或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段，WHEN 构造传参中该字段显式传入 `undefined` 标识符后编译 THEN 编译输出 1 条 WARNING 级别诊断（无数字错误码，文案与定位见 R-1），且编译继续完成、无新增 ERROR | 终端用户（应用开发者编译/构建输出） | 正常 |
| AC-1.2 | Given ArkTS 应用工程中 V2 组件（`@ComponentV2`）构造传参对象含 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段，WHEN 构造传参中该字段显式传入 `undefined` 后编译 THEN 编译输出与 R-1 相同级别、相同文案的 1 条 WARNING，且编译继续完成 | 终端用户（应用开发者编译/构建输出） | 正常 |
| AC-1.3 | Given `@Require` 字段声明类型含 `undefined`（如 `number \| undefined` 联合类型），或字段类型不可解析/不可判定，WHEN 该字段显式传入 `undefined` 后编译 THEN 编译不输出本特性告警（既有行为不变） | 终端用户（应用开发者编译/构建输出） | 异常 |
| AC-1.4 | Given 构造传参对象中的字段无 `@Require` 修饰，WHEN 该字段显式传入 `undefined` 后编译 THEN 编译不输出本特性告警 | 终端用户（应用开发者编译/构建输出） | 异常 |
| AC-1.5 | Given 构造传参对象的字段值不是 `undefined` 标识符（如对象字面量，其嵌套属性内部出现 `undefined`；或变量/表达式传值），WHEN 编译该构造传参对象 THEN 编译不输出本特性告警 | 终端用户（应用开发者编译/构建输出） | 异常 |
| AC-1.6 | Given AC-1.1/AC-1.2 场景的 ArkTS 应用工程，WHEN 以 interop 编译模式构建 THEN 构建输出与主链路一致的同级别、同文案 WARNING | 终端用户（应用开发者编译/构建输出） | 正常 |

## 二、规则定义 `[源: spec.md]`

### 规则定义

| 规则ID | 类型 | 触发条件 | 预期行为 | 边界/约束 | 关联AC |
|--------|------|----------|----------|-----------|--------|
| R-1 | 行为 | V1 组件（`@Component`）构造传参对象中，字段带 `@Require`（单独或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 等合法组合），该字段声明类型（经类型别名解析后）不含 `undefined` 成员，且该字段传值表达式为显式 `undefined` 标识符 | 输出 1 条 WARNING 级别诊断：无数字错误码，文案为消息模板；同一传参对象中每个命中字段各输出 1 条；诊断行列定位该字段的传值属性（`字段名: undefined` 所在行） | 判定与字段有无默认值、装饰器组合方式无关；不产生 ERROR，编译继续 | AC-1.1 |
| R-2 | 行为 | V2 组件（`@ComponentV2`）构造传参对象中，`@Require`+`@Param` 字段、类型不含 `undefined`、显式传 `undefined` | 输出与 R-1 相同文案、相同级别的 1 条 WARNING，定位规则同 R-1 | V2 中 `@Require` 仅可与 `@Param` 组合 | AC-1.2 |
| R-3 | 边界 | `@Require` 字段声明类型含 `undefined` 成员（联合类型如 `number \| undefined`、可选属性语法等价形式、`any`、`unknown`）且显式传 `undefined` | 不输出本特性告警 | 类型判定仅看 `undefined` 成员：类型含 `null`（如 `number \| null`）不改变判定，仍按"不含 undefined"处理；显式传 `null` 值本身不在本特性范围 | AC-1.3 |
| R-4 | 边界 | 构造传参对象中，无 `@Require` 修饰的字段显式传 `undefined` | 不输出本特性告警 | — | AC-1.4 |
| R-5 | 边界 | 构造传参对象的字段值表达式不是 `undefined` 标识符（变量引用、对象字面量、调用表达式等；含嵌套属性内部出现 `undefined`） | 不输出本特性告警 | 仅顶层字段值本身为 `undefined` 标识符时进入判定 | AC-1.5 |
| R-6 | 行为 | interop 编译模式下出现 R-1/R-2 场景 | 输出与主链路一致的同级别、同文案、同定位规则的 WARNING | 主链路与 interop 镜像工具链行为保持一致 | AC-1.6 |
| R-7 | 边界 | 字段声明类型无法解析或无法判定是否含 `undefined`（如外部类型引用解析失败） | 不输出本特性告警 | 保守策略，保证零误报；类型别名优先按解析后的实际类型判定（见下表） | AC-1.3 |

**消息模板（R-1/R-2/R-6 统一）：**

```text
'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.
```

其中 `${paramName}` 为字段名，`${paramType}` 为该字段的声明类型文本（与下述类型判定口径同源；命中本告警时该类型必然不含 `undefined`），`${actualType}` 为实际传入值的类型文本（本告警触发条件为显式传入 `undefined`，故其恒为 `undefined`）。文案为英文，遵循仓内编译器诊断既有惯例（既有 `@Require` 诊断同族句式）。

**类型判定口径（"声明类型是否含 `undefined` 成员"，R-1/R-2/R-3/R-7 共用）：**

| 类型类别 | 示例 | 判定 |
|----------|------|------|
| 基本类型关键字 | `number` / `string` / `boolean` / `bigint` / `symbol` | 不含 `undefined`（告警适用） |
| 不含 `undefined` 的联合类型 | `number \| string` | 不含 `undefined`（告警适用） |
| 类/接口/枚举/字面量类型 | `MyClass` / 接口 / `enum` / `'a' \| 'b'` | 不含 `undefined`（告警适用） |
| 泛型引用 | `Array<number>` / `Map<string, number>` | 不含 `undefined`（告警适用） |
| 类型别名 | `type A = number \| string` | 按解析后的实际类型判定 |
| 含 `undefined` 的联合类型 | `number \| undefined` / `T \| undefined` | 含 `undefined`（不告警） |
| 可选属性语法 | `field?: number`（等价 `number \| undefined`） | 含 `undefined`（不告警） |
| `any` / `unknown` | `any` | 含 `undefined`（不告警，保守） |
| 无法解析/不可判定 | 外部类型引用解析失败 | 不告警（R-7 保守策略） |

> 约束：组合装饰器的既有问号限制规则不变（如 `@Require @Prop x?: number` 仍按既有规则报 ERROR），与本特性告警相互独立；类型判定的实现方式（TypeScript Checker 或类型节点分析）由 design.md 决定。

## 三、API 变更分析 `[源: spec.md]`

#### 新增 API

N/A：本特性为编译器诊断增强，不新增任何 Public/System/InnerAPI。

#### 变更/废弃 API

N/A：不变更、不废弃任何 API。

## 四、兼容性声明 `[源: spec.md]`

### 兼容性声明

- **已有 API 行为变更:** 否。新增 WARNING 不阻断编译；存量工程中显式向 `@Require` non-null 字段传 `undefined` 的代码会出现新告警（预期行为，属本特性目的），其余行为不变。
- **配置文件格式变更:** 否
- **数据存储格式变更:** 否
- **最低支持版本:** 随目标版本 OpenHarmony-7.1-Release 的编译工具链交付
- **API 版本号策略:** N/A（无 API）
<!-- GENERATED:EXTERNAL-SPEC:END -->

<!-- TEST-ANALYSIS:BEGIN -->
## 五、2D 能力特征分析

> 本章为测试独有内容。每个小节必须填写“是否涉及”；选择“是”时完成该小节全部细项，选择“否/N/A”时填写不涉及理由。

### 5.1 是否涉及新增开放 API

**是否涉及：** 否

**不涉及理由：** 本特性为编译期诊断增强，不新增任何 API（第三章 API 变更分析为 N/A），无 API 相关测试输入。

---

### 5.2 是否涉及应用兼容性

**是否涉及：** 是

| 兼容性维度 | 修改前规格 | 修改后规格 | 影响范围 | 关联 AC | 测试侧验证方式 |
|---|---|---|---|---|---|
| API/行为兼容 | 向 `@Require` 修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` 的存量工程：构建输出无本特性告警 | 同场景构建输出 1 条非阻断 WARNING（固定文案，见第二章消息模板）；编译继续完成、无新增 ERROR | 存量 ArkTS 应用工程构建输出新增非阻断告警（预期行为，属特性目的）；无编译阻断与产物格式变化 | AC-1.1、AC-1.2、AC-1.6 | 构建（编译）含该场景的 ArkTS 应用工程：核对输出恰 1 条 WARNING（级别/文案/定位）且编译完成；比对工具链升级前无此告警、升级后出现 |
| 配置/数据兼容 | 构建配置、工程数据与编译产物格式与该传值行为无关，不受影响 | 不变（仅新增告警输出，无配置、数据与产物格式变更） | 无 | AC-1.1 | 构建（编译）场景工程确认编译正常完成、产物生成无异常 |

**版本隔离与 changelog（应用兼容性四要素补全）：**

| 字段 | 内容 |
|---|---|
| 是否进行版本隔离 | 否（本特性无 API 版本号；告警行为随 OpenHarmony-7.1-Release 编译工具链版本统一生效，工具链升级即获得新告警，无版本开关与隔离版本号） |
| changelog | 随 OpenHarmony-7.1-Release 版本发布说明（Release Notes）同步描述存量工程新增非阻断告警（proposal「依赖、风险与外部约束」已将发布说明列为该兼容性风险的缓解措施）；本特性无独立 changelog 文件 |

---

### 5.3 是否涉及跨平台

**是否涉及：** 是

**支持的平台/承载链路：** 跨平台 ArkTS UI 构建（Arkoala/ArkUI-X 方向，Android/iOS 目标）经本仓 interop 编译模式承载——`compiler/src/interop/src/` 自包含镜像工具链 + `fast_build/ets_ui` 插件集（含 `arkoala-plugin.ts`）。本特性为构建期诊断，无跨平台运行时行为；跨平台维度的可观察输出为 interop 构建链路的告警一致性。

| 跨平台验证项 | 内容 | 关联 AC | 测试侧验证方式 |
|---|---|---|---|
| interop（跨平台构建链路）告警一致性 | interop 编译模式下 AC-1.1/AC-1.2 场景输出与主链路一致的同级别、同文案、同定位 WARNING，不因跨平台构建链路漂移 | AC-1.6 | 以 interop 编译模式构建（编译）同场景工程：比对告警级别、文案、定位与主链路一致（VM-6：`cd compiler && npm run interopArkTest` 回归承载） |

---

### 5.4 是否涉及 IDE 预览

**是否涉及：** 否

**不涉及理由：** 本特性为构建期静态诊断，不改变 IDE 预览的渲染与交互行为；预览构建与常规构建共用同一诊断输出，无预览专属可观察差异。

---

### 5.5 是否涉及编译工具链

**是否涉及：** 是

| 触发场景 | 错误类型 | 错误信息 | 报错位置 | 关联 AC | 测试侧验证方式 |
|---|---|---|---|---|---|
| V1 组件（`@Component`）构造传参对象中，向 `@Require` 修饰（单独或与 `@Prop`、`@State`、`@Provide`、`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段显式传入 `undefined` 标识符 | 告警（WARNING，无数字错误码，不阻断编译） | '@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.（消息模板见第二章，`${paramName}` 为字段名、`${paramType}` 为声明类型、`${actualType}` 为实际传入类型） | 构造传参对象中该字段的传值属性行（`字段名: undefined` 所在行） | AC-1.1 | 构建（编译）含该场景的 ArkTS 应用工程：核对输出恰 1 条该告警（级别/文案/定位），编译完成且无新增 ERROR |
| V2 组件（`@ComponentV2`）构造传参对象中，向 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` | 告警（WARNING，无数字错误码，不阻断编译） | 同 AC-1.1（相同消息模板） | 同 AC-1.1（传值属性行） | AC-1.2 | 构建（编译）含该场景的工程：核对输出恰 1 条与 AC-1.1 同级别、同文案的告警，编译完成 |
| `@Require` 字段声明类型含 `undefined`（`number` 与 `undefined` 的联合类型、可选属性等价形式、`any`、`unknown`）或类型不可解析、不可判定，且显式传入 `undefined` | 不涉及（不输出本特性告警） | 无本特性告警（既有行为不变） | 不适用 | AC-1.3 | 构建（编译）含上述反例字段的工程：检查输出不含本特性告警 |
| 构造传参对象中向无 `@Require` 修饰的字段显式传入 `undefined` | 不涉及（不输出本特性告警） | 无本特性告警 | 不适用 | AC-1.4 | 构建（编译）含该场景的工程：检查输出不含本特性告警 |
| 构造传参对象的字段值不是 `undefined` 标识符（变量或表达式传值；对象字面量嵌套属性内部出现 `undefined`） | 不涉及（不输出本特性告警） | 无本特性告警 | 不适用 | AC-1.5 | 构建（编译）含该场景的工程：检查输出不含本特性告警 |
| 以 interop 编译模式构建 AC-1.1/AC-1.2 场景 | 告警（与主链路同级别） | 同 AC-1.1（相同消息模板） | 同 AC-1.1（定位规则一致） | AC-1.6 | 以 interop 编译模式构建（编译）同场景工程：比对告警级别、文案、定位与主链路一致 |

---

### 5.6 是否涉及全球化语言

**是否涉及：** 否

**不涉及理由：** 诊断文案为固定英文，遵循编译器诊断既有惯例，无语言、区域差异化输入与输出。

---

### 5.7 是否涉及深浅色模式

**是否涉及：** 否

**不涉及理由：** 编译期行为，无 UI 呈现，深浅色模式下无差异化表现。

---

### 5.8 是否涉及新材质

**是否涉及：** 否

**不涉及理由：** 无 UI 与材质相关行为（编译期诊断不触及界面呈现）。

---

### 5.9 是否涉及无障碍

**是否涉及：** 否

**不涉及理由：** 编译期开发者诊断，不触及面向终端用户的无障碍能力（读屏、放大、高对比度等）。

---

### 5.10 是否涉及多设备差异

**是否涉及：** 否

**不涉及理由：** 编译期诊断与设备形态无关（spec 多设备适配声明为无差异，各设备形态上构建行为一致）。

---

### 5.11 是否涉及适老化

**是否涉及：** 否

**不涉及理由：** 编译期开发者工具链行为，无面向终端用户的适老化 UI 与交互。

---

### 5.12 是否涉及资料新增或变更

**是否涉及：** 否

**不涉及理由：** spec 与 design 未定义资料交付物及关联 AC；新增告警的对外说明由版本发布说明按发布流程同步（proposal 已列为兼容性风险缓解措施），不属于本特性测试输入中的可验证资料变更。

---

## 六、非功能性需求 `[源: spec.md]`

> 先读取以下来源规格，再把适用项展开为可直接转化为测试用例的条件、指标和测试侧验证方式。

<!-- GENERATED:NFR-SPEC:BEGIN -->
### 非功能性需求

N/A：本特性为编译期静态诊断，无运行时非功能指标（依据 proposal.md 不涉及项确认：性能否、安全与权限 N/A、IPC N/A 等）。可测试性由 VM-1～VM-6 承载；编译耗时影响限于构造传参遍历内的类型判定，无用户可感知阈值要求。

### 多设备适配声明

无差异：编译期诊断与设备形态无关（手机/平板/折叠屏等设备上编译行为一致）。

### 全局特性影响

| 特性 | 适用？ |
|---|---|
| 无障碍 | 否 |
| 大字体 | 否 |
| 深色模式 | 否 |
| 多窗口/分屏 | 否 |
| 多用户 | 否 |
| 版本升级 | 否 |
| 生态兼容 | 是 |
<!-- GENERATED:NFR-SPEC:END -->

### 6.1 是否涉及性能指标

**是否涉及：** 否

**不涉及理由：** 编译期静态诊断：类型判定在既有构造传参遍历内完成，无运行时热路径；spec 非功能性需求为 N/A，无用户可感知性能阈值。

---

### 6.2 是否涉及功耗指标

**是否涉及：** 否

**不涉及理由：** 编译期工具链行为，无运行时组件，不涉及功耗指标。

---

### 6.3 是否涉及稳定性 & 可靠性

**是否涉及：** 否

**不涉及理由：** 不引入运行时故障模式；类型判定失败的保守方向是不输出告警（R-7）且编译不失败，已由 AC-1.1/AC-1.2 的编译继续完成验收覆盖，无独立稳定性指标。

---

### 6.4 是否涉及安全隐私合规

**是否涉及：** 否

**不涉及理由：** 编译期诊断不触及数据收集、权限与安全编码面（proposal 安全与权限维度为 N/A）。

---

### 6.5 是否涉及 DFX

**是否涉及：** 否

**不涉及理由：** 无额外维测指标、日志格式与定界定位要求；诊断本身（级别、文案、行列定位）即为可观察输出，由 AC-1.1～AC-1.6 覆盖。

---

## 七、2C 功能体验分析

> 本章为测试独有内容，覆盖 UX、交互和用户数据相关测试维度。

### 7.1 是否涉及 UX — 静态 UI 效果

**是否涉及：** 否

**不涉及理由：** 构建期诊断，不改变任何静态 UI 呈现，无 UX 效果测试输入。

---

### 7.2 是否涉及 UX — 动态 UI 效果（动效）

**是否涉及：** 否

**不涉及理由：** 构建期诊断，无动效相关行为。

---

### 7.3 是否涉及 UX — 手势/事件/交互/焦点

**是否涉及：** 否

**不涉及理由：** 构建期诊断，无手势、事件、交互与焦点相关行为。

---

### 7.4 是否涉及用户数据

**是否涉及：** 否

**不涉及理由：** 编译期工具链诊断，不产生、消费或持久化任何用户数据。

---

## 八、AC 到验证点追溯

<!-- GENERATED:AC-VERIFICATION:BEGIN -->
| AC | 对外预期 | 验证点 | 测试侧验证方式 |
|---|---|---|---|
| AC-1 | 见对外行为规格 | proposal 级验收项（对应本文档 AC-1.1）：V1 组件向 `@Require` 修饰且声明类型不含 `undefined` 的字段显式传 `undefined` 时输出 1 条非阻断 WARNING | 构建（编译）含该场景的 ArkTS 应用工程：检查输出恰 1 条 WARNING（级别/文案/定位）且编译完成（同 AC-1.1） |
| AC-1.1 | 见对外行为规格 | V1 正例：恰 1 条 WARNING，无数字错误码，文案为消息模板，定位在传值属性行；编译继续完成、无新增 ERROR | 构建（编译）含 V1 场景（`@Component` 组件 + `@Require` 字段 + 显式 `undefined`）的 ArkTS 应用工程，逐项核对构建输出 |
| AC-1.2 | 见对外行为规格 | V2 正例：与 AC-1.1 同级别、同文案、同定位的 1 条 WARNING；编译继续完成 | 构建（编译）含 V2 场景（`@ComponentV2` 组件 + `@Require` 与 `@Param` 共同修饰字段 + 显式 `undefined`）的工程，核对构建输出 |
| AC-1.3 | 见对外行为规格 | 边界：类型含 `undefined`（`number` 与 `undefined` 联合类型、可选属性等价形式、`any`、`unknown`）或不可解析、不可判定时，0 条本特性告警 | 构建（编译）含上述反例字段的工程，检查输出不含本特性告警 |
| AC-1.4 | 见对外行为规格 | 边界：无 `@Require` 修饰的字段显式传 `undefined`，0 条本特性告警 | 构建（编译）含该场景的工程，检查输出不含本特性告警 |
| AC-1.5 | 见对外行为规格 | 边界：字段值非 `undefined` 标识符（变量、表达式传值；嵌套对象内部出现 `undefined`），0 条本特性告警 | 构建（编译）含该场景的工程，检查输出不含本特性告警 |
| AC-1.6 | 见对外行为规格 | interop 编译模式：输出与主链路一致的同级别、同文案、同定位 WARNING | 以 interop 编译模式构建（编译）AC-1.1/AC-1.2 同场景工程，比对输出与主链路一致 |
| AC-6 | 见对外行为规格 | proposal 级验收项（对应本文档 AC-1.6）：interop 编译模式下行为与主链路一致 | 以 interop 编译模式构建（编译）同场景工程并比对告警一致（同 AC-1.6） |
<!-- GENERATED:AC-VERIFICATION:END -->

### 测试可观察性与验证约束 `[源: design.md]`

<!-- GENERATED:DESIGN-CONSTRAINTS:BEGIN -->
### 测试输入约束

> 本节为测试输入旁路（spec-for-validation）提供各验收标准的可观察表面与测试侧验证输入；仅描述工具链对外可见的构建诊断行为。

| AC | 可观察表面 | 测试侧验证方式 | 环境/设备限制 | 不可自动化项 |
| --- | --- | --- | --- | --- |
| AC-1.1 | 应用工程构建输出中的 1 条 WARNING 级别诊断：无数字错误码，文案为 spec 消息模板固定英文文案（`${paramName}` 为被传字段名），行列定位在构造传参对象中该字段的传值属性行（`字段名: undefined` 所在行）；编译继续完成、无新增 ERROR | 构建（编译）包含 V1 组件（`@Component`）构造传参对象的 ArkTS 应用工程：对象中向 `@Require` 修饰（单独或与 `@Prop`、`@State`、`@Provide`、`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段显式传入 `undefined` 标识符；检查构建输出：该字段输出恰 1 条 WARNING，级别/文案/定位逐项核对，且编译不失败 | 需可运行的 ArkTS 应用工程与配套编译工具链（IDE 或命令行构建均可）；无需真机/模拟器（纯构建期行为） | 无 |
| AC-1.2 | 同 AC-1.1 的 WARNING（级别、文案、定位规则一致），场景为 V2 组件（`@ComponentV2`） | 构建（编译）包含 V2 组件构造传参对象的 ArkTS 应用工程：对象中向 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段显式传入 `undefined`；检查构建输出：恰 1 条与 AC-1.1 同级别、同文案的 WARNING，且编译不失败 | 同 AC-1.1 | 无 |
| AC-1.3 | 构建输出不出现本特性告警（既有行为不变） | 构建（编译）含以下 `@Require` 字段场景的 ArkTS 应用工程并检查输出不含本特性告警：① 声明类型含 `undefined`（`number` 与 `undefined` 的联合类型、可选属性等价形式）；② 类型为 `any` 或 `unknown`；均显式传入 `undefined` | 同 AC-1.1 | 无 |
| AC-1.4 | 构建输出不出现本特性告警 | 构建（编译）含"无 `@Require` 修饰的字段显式传入 `undefined`"场景的 ArkTS 应用工程；检查构建输出不含本特性告警 | 同 AC-1.1 | 无 |
| AC-1.5 | 构建输出不出现本特性告警 | 构建（编译）构造传参字段值不是 `undefined` 标识符的场景（变量或表达式传值；对象字面量嵌套属性内部出现 `undefined`）；检查构建输出不含本特性告警 | 同 AC-1.1 | 无 |
| AC-1.6 | 以 interop 编译模式构建 AC-1.1/AC-1.2 场景时，构建输出与主链路一致的同级别、同文案、同定位规则的 WARNING | 以 interop 编译模式构建（编译）AC-1.1/AC-1.2 同场景工程；比对构建输出的告警级别、文案、定位与主链路构建一致 | 需支持 interop 编译模式的构建环境 | 无 |

---
<!-- GENERATED:DESIGN-CONSTRAINTS:END -->

## 九、测试输入完备性

- 2D 能力特征分析（5.1～5.12）：12 个维度已逐项判定，“是”项（5.2 应用兼容性、5.3 跨平台、5.5 编译工具链）完成全部细项，其余均附不涉及理由。
- 非功能性需求（6.1～6.5）：5 个维度均判定为否并附不涉及理由。
- 2C 功能体验分析（7.1～7.4）：4 个维度均判定为否并附不涉及理由。
- AC 验证点追溯（第八章）：已覆盖 spec 全部 AC（AC-1、AC-1.1～AC-1.6、AC-6）及验证点、测试侧验证方式。
- 无遗留事项。
<!-- TEST-ANALYSIS:END -->

## 十、参考资料

| 文档 | 路径 | 状态/Hash |
|---|---|---|
| spec.md | `spec.md` | Approved / `7f860398a9a318c16313dcd950bf534d9bb4e1366ac77460a46fd5b3f8b377fb` |
| design.md | `design.md` | Approved / `e2f629fc84989ce89c0b8d5ba345f202ee64eacfcb5aeff6d895853e2f072ab0` |
| Profile playbook | `analysis/arkui/spec-for-validation.md` | Active |

## 十一、来源与审批

| 项 | 内容 |
|---|---|
| Spec 来源 | `spec.md` / `7f860398a9a318c16313dcd950bf534d9bb4e1366ac77460a46fd5b3f8b377fb` |
| Design 来源 | `design.md` / `e2f629fc84989ce89c0b8d5ba345f202ee64eacfcb5aeff6d895853e2f072ab0` |
| 开发/Spec Owner 结论 | Approved |
| 测试 Owner 结论 | Approved |

> 双 Owner 签署记录（2026-10-29，@youzhi92）：开发/Spec Owner 与测试 Owner 均为本会话用户（同一人双角色）批准——全文审查通过、spec/design 来源 hash 绑定一致、规格投影未改写；CLI check 15/15 PASS；验证经 VM-1～VM-6 mocha 单测承载。
>
> 修复追认记录（2026-10-29，@youzhi92 指示修复、同 owner 双角色签署）：按外部测试设计规则校验结论补全文档缺口——proposal 基线 v1.3（新增设备差异规格 1+8、DFX 设计显式不涉及声明）、spec.md AC 表改 Given/WHEN/THEN 三段式且类型列对齐 正常/异常、VM-1～VM-6 验证方式改述端到端构建输出断言口径（需求语义/范围/AC 行为无变更）；本文档 5.2 补应用兼容性四要素（版本隔离/changelog），5.3 跨平台由「否」修正为「是」（依据：interop 编译模式即本仓跨平台 ArkTS UI 构建链路——`src/interop/src/` 自包含镜像 + `fast_build/ets_ui/arkoala-plugin.ts`，AC-1.6/VM-6 已实测告警一致性），术语表补 interop 编译模式等 4 条；`refresh` 同步 GENERATED 区与 source_spec_hash 后八章验证点两列经 owner 回填复确认。修复后 CLI check 15/15 PASS、validate --level all 46 checks/0 broken PASS；测试输入语义与 AC 行为无变更。

## 附录：术语表

| 术语 | 定义 |
|---|---|
| 2D | 能力特征维度分析 |
| 2C | 功能体验维度分析 |
| interop 编译模式 | 本仓工具链的跨平台 ArkTS UI 构建链路：`compiler/src/interop/src/` 自包含镜像工具链 + `fast_build/ets_ui` 插件集（含 `arkoala-plugin.ts`），主链路改动须同步镜像副本；其行为一致性由 AC-1.6/VM-6 承载 |
| non-null 字段 | 声明类型不含 `undefined` 成员的字段（类型别名经解析后判定，见第二章类型判定口径表） |
| 消息模板 | WARN 诊断的固定英文文案模板（R-1/R-2/R-6 统一，`${paramName}` 为字段名占位） |
| Red 条件 | TDD 红灯信号：实现前运行验证命令应观察到的断言失败（spec.md 验证映射表列） |

---

**格式说明：**

1. 第一至四章来自 `spec.md`，不得摘要、删减或手工改写。
2. 第五章 2D、第六章 NFR 验证细项、第七章 2C 为测试输入分析区。
3. 每个“是否涉及”小节选择“是”时必须完成后续字段；选择“否/N/A”时必须填写不涉及理由。
4. `spec-for-validation.md` 只描述对外行为和测试侧验证输入，不记录开发自验证类型、用例、命令或执行结果。
