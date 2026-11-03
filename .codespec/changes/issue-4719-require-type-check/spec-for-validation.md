---
artifact: spec-for-validation
format_version: arkui-detailed-v1
status: Approved
source_spec: spec.md
source_spec_hash: 2188bc41b4e0fe56cfc112a52073dadf9a0a925179eeda5aa362fc891a7260be
source_design: design.md
source_design_hash: 103d131c760afde6f5c0c11754fa6cdd43a42aee07e989e0729759b69df5b4fb
source_consistency: current
profile: arkui
subprofiles: []
generated_at: 2026-10-31T07:09:54+00:00
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
| 产物状态 | Approved（v1.10 修订稿经 owner 批准——2026-11-03 指示将 interop 专属单测从交付 MR 剔除并同步修订测试范围声明（仅业务仓），行为契约与代码零变更；v1.9 修订稿经 owner 批准——2026-10-31 对 PR #1747（design-docs 归档）10 条评审意见逐项拍板后指示修订，行为契约与代码零变更；v1.8 已批准——owner 指示「根据新的规格，更新代码实现」；v1.5/v1.7 历史版本已批准，见第十一章追认记录） |
| 复杂度 | 简单 |
| 创建日期 | 2026-10-29 |
| 最后更新 | 2026-11-03 |

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

**作为** 鸿蒙应用开发者,
**我想要** 在向 `@Require` 修饰的 non-null（声明类型不含 `undefined`）字段显式传入 `undefined` 时获得编译期告警,
**以便** 在开发阶段发现并修正类型不一致，避免运行时异常。

**验收标准（AC, Acceptance Criteria）：**

| AC编号 | 验收标准 | 可观察表面 | 类型 |
|--------|----------|--------------|------|
| AC-1.1 | Given ArkTS 应用工程中 V1 组件（`@Component`）构造传参对象含 `@Require` 修饰（单独使用或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段（含数组/集合等泛型引用类型，如 `string[]`、`Array<number>`、`Map<string, number>`），WHEN 构造传参中该字段显式传入 `undefined` 标识符后编译 THEN 编译输出 1 条 WARNING 级别诊断（无数字错误码，文案为消息模板 `'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.`——`${paramName}` 为字段名、`${paramType}` 为该字段声明类型文本、`${actualType}` 为实际传入值类型文本（渲染口径见 R-1 消息模板说明）；诊断定位该字段的传值属性行），且编译继续完成、无新增 ERROR | 终端用户（应用开发者编译/构建输出） | 正常 |
| AC-1.2 | Given ArkTS 应用工程中 V2 组件（`@ComponentV2`）构造传参对象含 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段，WHEN 构造传参中该字段显式传入 `undefined` 后编译 THEN 编译输出与 AC-1.1 相同级别、相同文案（AC-1.1 内嵌消息模板）的 1 条 WARNING，且编译继续完成 | 终端用户（应用开发者编译/构建输出） | 正常 |
| AC-1.3 | Given `@Require` 字段声明类型含 `undefined`（如 `number \| undefined` 联合类型），或字段类型不可解析/不可判定，WHEN 该字段显式传入 `undefined` 后编译 THEN 编译不输出本特性告警（既有行为不变） | 终端用户（应用开发者编译/构建输出） | 异常 |
| AC-1.4 | Given 构造传参对象中的字段无 `@Require` 修饰，WHEN 该字段显式传入 `undefined` 后编译 THEN 编译不输出本特性告警 | 终端用户（应用开发者编译/构建输出） | 异常 |
| AC-1.5 | Given 构造传参对象的字段值不是 `undefined` 标识符，且其解析类型不含 `undefined`（如普通变量/表达式传值、联合类型变量经空值守卫收窄后传值、对象字面量及其嵌套属性内部出现 `undefined`、数组/集合字面量内部元素出现 `undefined`（如 `[1, undefined, 2]`，元素级嵌套值，判定不展开元素类型）、`any`/`unknown` 动态类型值），WHEN 编译该构造传参对象 THEN 编译不输出本特性告警 | 终端用户（应用开发者编译/构建输出） | 异常 |

#### US-2: @Require 字段非标识符 undefined 传值编译期告警（v1.8）

**作为** 鸿蒙应用开发者,
**我想要** 以 `void 0` 或类型含 `undefined` 的变量等非标识符形式向 `@Require` 修饰的 non-null（声明类型不含 `undefined`）字段传入可能为 `undefined` 的值时，同样获得编译期告警,
**以便** 该写法不绕过显式 `undefined` 场景的检查。

**验收标准（AC, Acceptance Criteria）：**

| AC编号 | 验收标准 | 可观察表面 | 类型 |
|--------|----------|--------------|------|
| AC-1.6 | Given V1/V2 组件构造传参对象含 `@Require` 修饰（V1 单独使用或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合；V2 `@Require`+`@Param`）且声明类型不含 `undefined` 的字段，WHEN 构造传参中该字段传入值不是 `undefined` 标识符、但其解析类型包含 `undefined`（如 `void 0` 表达式、类型为 `xxx \| undefined` 的变量或表达式）后编译 THEN 编译输出 1 条 WARNING 级别诊断（无数字错误码，文案为 AC-1.1 内嵌消息模板——`${actualType}` 为该传入值的解析类型文本，渲染口径见 R-7；定位同 AC-1.1），且编译继续完成、无新增 ERROR | 终端用户（应用开发者编译/构建输出） | 正常 |

## 二、规则定义 `[源: spec.md]`

### 规则定义

| 规则ID | 类型 | 触发条件 | 预期行为 | 边界/约束 | 关联AC |
|--------|------|----------|----------|-----------|--------|
| R-1 | 行为 | V1 组件（`@Component`）构造传参对象中，字段带 `@Require`（单独或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 等合法组合），该字段声明类型（经类型别名解析后）不含 `undefined` 成员，且该字段传值表达式为显式 `undefined` 标识符 | 输出 1 条 WARNING 级别诊断：无数字错误码，文案为消息模板；同一传参对象中每个命中字段各输出 1 条；诊断行列定位该字段的传值属性（`字段名: undefined` 所在行） | 判定与字段有无默认值、装饰器组合方式无关；不产生 ERROR，编译继续 | AC-1.1 |
| R-2 | 行为 | V2 组件（`@ComponentV2`）构造传参对象中，`@Require`+`@Param` 字段、类型不含 `undefined`、显式传 `undefined` | 输出与 R-1 相同文案、相同级别的 1 条 WARNING，定位规则同 R-1 | V2 中 `@Require` 仅可与 `@Param` 组合 | AC-1.2 |
| R-3 | 边界 | `@Require` 字段声明类型含 `undefined` 成员（联合类型如 `number \| undefined`、可选属性语法等价形式、`any`、`unknown`）且显式传 `undefined` | 不输出本特性告警 | 类型判定仅看 `undefined` 成员：类型含 `null`（如 `number \| null`）不改变判定，仍按"不含 undefined"处理；显式传 `null` 值本身不在本特性范围 | AC-1.3 |
| R-4 | 边界 | 构造传参对象中，无 `@Require` 修饰的字段显式传 `undefined` | 不输出本特性告警 | — | AC-1.4 |
| R-5 | 边界 | 构造传参对象的字段值表达式不是 `undefined` 标识符，且其解析类型不含 `undefined`（普通变量引用、对象字面量、调用表达式等；嵌套属性内部出现 `undefined`；数组/集合字面量内部元素出现 `undefined`（如 `[1, undefined, 2]`）；联合类型变量经空值守卫收窄后传值；`any`/`unknown` 动态类型值） | 不输出本特性告警 | 仅顶层字段值本身进入判定（数组/集合字面量不展开类型参数与内部元素，元素级 `undefined` 不触发）；非标识符但解析类型含 `undefined` 的传值归 R-7 判定 | AC-1.5 |
| R-6 | 边界 | 字段声明类型无法解析或无法判定是否含 `undefined`（如外部类型引用解析失败） | 不输出本特性告警 | 保守策略，保证零误报；类型别名优先按解析后的实际类型判定（见下表） | AC-1.3 |
| R-7 | 行为 | 构造传参对象中，字段带 `@Require`（V1 单独或合法组合、V2 `@Require`+`@Param`），该字段声明类型（经类型别名解析后）不含 `undefined` 成员，且传值表达式不是 `undefined` 标识符、但其解析类型包含 `undefined` 成员（如 `void 0`、类型为 `xxx \| undefined` 的变量或表达式） | 输出与 R-1 相同级别、相同消息模板的 1 条 WARNING：`${actualType}` 为该传入值的解析类型文本（如 `number \| undefined`；`void` 表达式与 `undefined` 标识符同样渲染为 `undefined`）；同一传参对象中每个命中字段各输出 1 条；诊断定位规则同 R-1 | 传入值解析类型不明（`any`/`unknown`，ArkTS 中如 `ESObject` 动态值）不判定为含 `undefined`，不触发（保守，零误报）；传入值经空值守卫（如 `!== undefined`）收窄后解析类型不含 `undefined` 时不触发 | AC-1.6 |

**消息模板（R-1/R-2 统一）：**

```text
'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.
```

其中 `${paramName}` 为字段名，`${paramType}` 为该字段的声明类型文本（与下述类型判定口径同源；命中本告警时该类型必然不含 `undefined`），`${actualType}` 为实际传入值的类型文本：`undefined` 标识符与 `void` 表达式（如 `void 0`）渲染为 `undefined`（R-1/R-2 触发条件），其余命中场景（R-7）为该传入值的解析类型文本（如 `number | undefined`）。文案为英文，遵循仓内编译器诊断既有惯例（既有 `@Require` 诊断同族句式）。

**类型判定口径（"声明类型是否含 `undefined` 成员"，R-1/R-2/R-3/R-6 共用）：**

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
| 无法解析/不可判定 | 外部类型引用解析失败 | 不告警（R-6 保守策略） |

**数组/集合等泛型引用类型口径（v1.9 注记）：** ① 字段声明类型为数组/集合等泛型引用（如 `string[]`、`Array<number>`、`Map<string, number>`）时，按上表「泛型引用」行判定为不含 `undefined`——构造传参中向该字段本身显式传入 `undefined`（或解析类型含 `undefined` 的值）属正例，告警适用（AC-1.1/AC-1.2/AC-1.6）；② 传入的数组/集合字面量内部元素出现 `undefined`（如 `[1, undefined, 2]`）——属传入值内部的元素级嵌套 `undefined`，判定不展开类型参数与元素类型、仅按传入值顶层类型判定，归 R-5 边界不告警（AC-1.5）。

> 约束：组合装饰器的既有问号限制规则不变（如 `@Require @Prop x?: number` 仍按既有规则报 ERROR），与本特性告警相互独立；类型判定的实现方式（TypeScript Checker 或类型节点分析）由 design.md 决定。

**传入值类型判定（R-7，v1.8）：** 判定传入值解析类型是否含 `undefined` 成员，与上表同源口径。差异两点：① `any`/`unknown` 传入值类型不明，不判定为含 `undefined`（不告警，保守零误报）——与声明类型侧（判定为含 `undefined`、不告警）方向相反，但同为保守策略；② 传入值解析类型经类型收窄（如空值守卫 `!== undefined` 分支内）后不含 `undefined` 成员时不触发。

## 三、API 变更分析 `[源: spec.md]`

#### 新增 API

N/A：本特性为编译器诊断增强，不新增任何 Public/System/InnerAPI。

#### 变更/废弃 API

N/A：不变更、不废弃任何 API。

## 四、兼容性声明 `[源: spec.md]`

### 兼容性声明

- **已有 API 行为变更:** 否。新增 WARNING 不阻断编译；存量工程中显式向 `@Require` non-null 字段传 `undefined` 的代码会出现新告警（预期行为，属本特性目的），其余行为不变。v1.8 类型级触发扩展后，传入 `void 0` 或解析类型含 `undefined` 的变量/表达式的代码同样出现新告警（同属预期行为，AC-1.6）；解析类型不含 `undefined` 的传值（含收窄后、动态类型值）行为不变。
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
| API/行为兼容 | 向 `@Require` 修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` 的存量工程：构建输出无本特性告警 | 同场景构建输出 1 条非阻断 WARNING（固定文案，见第二章消息模板）；编译继续完成、无新增 ERROR | 存量 ArkTS 应用工程构建输出新增非阻断告警（预期行为，属特性目的）；无编译阻断与产物格式变化 | AC-1.1、AC-1.2 | 构建（编译）含该场景的 ArkTS 应用工程：核对输出恰 1 条 WARNING（级别/文案/定位）且编译完成；比对工具链升级前无此告警、升级后出现 |
| 配置/数据兼容 | 构建配置、工程数据与编译产物格式与该传值行为无关，不受影响 | 不变（仅新增告警输出，无配置、数据与产物格式变更） | 无 | AC-1.1 | 构建（编译）场景工程确认编译正常完成、产物生成无异常 |
| API/行为兼容（v1.8 类型级触发扩展） | 向 `@Require` 修饰且声明类型不含 `undefined` 的字段传入 `void 0` 或类型含 `undefined` 的变量/表达式（非 `undefined` 标识符形态）的存量工程：构建输出无本特性告警（v1.8 前仅识别 `undefined` 标识符） | 同场景构建输出每命中字段 1 条非阻断 WARNING（同消息模板，`${actualType}` 为该传入值解析类型文本）；编译继续完成、无新增 ERROR | 存量 ArkTS 应用工程构建输出新增非阻断告警（预期行为，属特性目的）；无编译阻断与产物格式变化 | AC-1.6 | 构建（编译）含该场景的 ArkTS 应用工程：核对每命中字段恰 1 条 WARNING 且编译完成；比对工具链升级前无此告警、升级后出现 |

**版本隔离与 changelog（应用兼容性四要素补全）：**

| 字段 | 内容 |
|---|---|
| 是否进行版本隔离 | 否（本特性无 API 版本号；告警行为随 OpenHarmony-7.1-Release 编译工具链版本统一生效，工具链升级即获得新告警，无版本开关与隔离版本号） |
| changelog | 随 OpenHarmony-7.1-Release 版本发布说明（Release Notes）同步描述存量工程新增非阻断告警（proposal「依赖、风险与外部约束」已将发布说明列为该兼容性风险的缓解措施）；本特性无独立 changelog 文件 |

---

### 5.3 是否涉及跨平台

**是否涉及：** 是

**支持的平台/承载链路：** ArkUI-X 跨平台工程（iOS 与 Android 目标平台）。本特性告警产生于平台打包之前的 ArkTS 编译阶段（ArkTS 源码 → 编译工具链诊断输出），属构建期诊断，无跨平台运行时行为；ArkUI-X 编译工具链与本仓同源（ets_loader 派生，arkoala-plugin 为其接入点），本仓告警逻辑为其上游来源。（v1.9 修订注记：本节原表述将 interop 编译模式定性为「跨平台 ArkTS UI 构建链路」，该定性不准确——interop 为仓内镜像机制而非跨平台构建本身，见术语表与第十一章 v1.9 修订记录。）

| 跨平台验证项 | 内容 | 关联 AC | 测试侧验证方式 |
|---|---|---|---|
| ArkUI-X 工程（iOS & Android）端到端构建 | ArkUI-X 工程中向 `@Require` 修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` 或解析类型含 `undefined` 的值（`void 0`、联合类型变量），构建输出与本仓同契约的 WARNING（消息模板/级别/定位一致） | AC-1.1、AC-1.2、AC-1.6 | 后续验证项（本轮不闭环）：待本特性合入 OpenHarmony 主干且 ArkUI-X 工具链同步后执行——Android 目标可在 Linux/Windows 构建环境验证，iOS 目标需 macOS + Xcode 环境 |
| interop 镜像一致性（仓内架构铁律，非跨平台实测） | 主链路告警逻辑同步实现于 interop 镜像（仓内架构铁律，非 AC 验收项）；AC-1.1/AC-1.2/AC-1.6 场景（含 v1.8 类型级触发场景）在 interop 链路下行为与主链路一致 | —（非 AC） | 既有 interop 回归套件保留为常规回归（本特性专属 interop 用例已随 v1.10 从交付 MR 剔除——镜像一致性由仓内镜像同步纪律承载，本特性在 interop 链路无 MR 内行为级断言，见第十一章 v1.10 修订记录）：`cd compiler && npm run interopArkTest`（不设 AC 验证点） |

---

### 5.4 是否涉及 IDE 预览

**是否涉及：** 否

**不涉及理由：** 本特性为构建期静态诊断，不改变 IDE 预览的渲染与交互行为；预览构建与常规构建共用同一诊断输出，无预览专属可观察差异。

---

### 5.5 是否涉及编译工具链

**是否涉及：** 是

| 触发场景 | 错误类型 | 错误信息 | 报错位置 | 关联 AC | 测试侧验证方式 |
|---|---|---|---|---|---|
| V1 组件（`@Component`）构造传参对象中，向 `@Require` 修饰（单独或与 `@Prop`、`@State`、`@Provide`、`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段（含数组/集合等泛型引用类型，如 `string[]`、`Map<string, number>`）显式传入 `undefined` 标识符 | 告警（WARNING，无数字错误码，不阻断编译） | `'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.`（消息模板见第二章，`${paramName}` 为字段名、`${paramType}` 为声明类型、`${actualType}` 为实际传入类型） | 构造传参对象中该字段的传值属性行（`字段名: undefined` 所在行） | AC-1.1 | 构建（编译）含该场景的 ArkTS 应用工程：核对输出恰 1 条该告警（级别/文案/定位），编译完成且无新增 ERROR |
| V2 组件（`@ComponentV2`）构造传参对象中，向 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段显式传入 `undefined` | 告警（WARNING，无数字错误码，不阻断编译） | 同 AC-1.1（相同消息模板 `'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.`） | 同 AC-1.1（传值属性行） | AC-1.2 | 构建（编译）含该场景的工程：核对输出恰 1 条与 AC-1.1 同级别、同文案的告警，编译完成 |
| `@Require` 字段声明类型含 `undefined`（`number` 与 `undefined` 的联合类型、可选属性等价形式、`any`、`unknown`）或类型不可解析、不可判定，且显式传入 `undefined` | 不涉及（不输出本特性告警） | 无本特性告警（既有行为不变） | 不适用 | AC-1.3 | 构建（编译）含上述反例字段的工程：检查输出不含本特性告警 |
| 构造传参对象中向无 `@Require` 修饰的字段显式传入 `undefined` | 不涉及（不输出本特性告警） | 无本特性告警 | 不适用 | AC-1.4 | 构建（编译）含该场景的工程：检查输出不含本特性告警 |
| 构造传参对象的字段值不是 `undefined` 标识符且其解析类型不含 `undefined`（普通变量/表达式传值；联合类型变量经空值守卫收窄后传值；对象字面量嵌套属性内部出现 `undefined`；数组/集合字面量内部元素出现 `undefined`（如 `[1, undefined, 2]`，元素级嵌套值，判定不展开元素类型）；`any`/`unknown` 动态类型值传值） | 不涉及（不输出本特性告警） | 无本特性告警 | 不适用 | AC-1.5 | 构建（编译）含该场景的工程：检查输出不含本特性告警 |
| V1/V2 组件构造传参对象中，向 `@Require` 修饰（V1 单独或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合；V2 与 `@Param` 共同修饰）且声明类型不含 `undefined` 的字段传入值不是 `undefined` 标识符、但其解析类型含 `undefined`（如 `void 0` 表达式、类型含 `undefined` 的联合类型变量/表达式） | 告警（WARNING，无数字错误码，不阻断编译） | 同 AC-1.1 消息模板 `'@Require' decorated '${paramName}' expects type '${paramType}' but got '${actualType}' through the component constructor.`；`${actualType}` 为该传入值的解析类型文本（`void 0` 渲染为 `undefined`，联合类型变量渲染为该联合类型的类型文本） | 构造传参对象中该字段的传值属性行 | AC-1.6 | 构建（编译）含该场景的 ArkTS 应用工程：核对每命中字段恰 1 条该告警（级别/文案/定位/got 段），编译完成且无新增 ERROR |

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

**不涉及理由：** 本特性新增告警为自解释型开发期诊断——消息模板内含被传字段名（`${paramName}`）、期望声明类型（`${paramType}`）与实际传入类型（`${actualType}`），并以行列定位指向该字段的传值属性行，开发者无需额外资料即可直接定位并修正问题；存量工程的行为变化说明由版本发布说明（Release Notes）按发布流程同步（proposal 已列为兼容性风险缓解措施）；spec 与 design 未定义资料交付物及关联 AC，无资料变更测试输入。如需进一步增强说明文档（如编译器诊断手册条目），另行立项，不属本特性范围。

---

## 六、非功能性需求 `[源: spec.md]`

> 先读取以下来源规格，再把适用项展开为可直接转化为测试用例的条件、指标和测试侧验证方式。

<!-- GENERATED:NFR-SPEC:BEGIN -->
### 非功能性需求

N/A：本特性为编译期静态诊断，无运行时非功能指标（依据 proposal.md 不涉及项确认：性能否、安全与权限 N/A、IPC N/A 等）。可测试性由 VM-1～VM-5 与 VM-7～VM-8 承载；编译耗时影响限于构造传参遍历内的类型判定，无用户可感知阈值要求。

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

**不涉及理由：** 编译期静态诊断，无运行时热路径，无用户可感知性能阈值。编译性能影响分析（v1.9 补）：类型判定挂在既有构造传参校验遍历（`validateCustomComponentPrams`）内完成——每个命中 `@Require` 字段仅新增一次声明类型与一次传入值类型的类型查询，复用 etsChecker 既有 Program/Checker，不新增编译遍历阶段、不引入跨文件解析或全量再遍历，开销为 O(命中字段数)、有界且不随工程规模放大；既有实测（v1.5/v1.8 三态回归与 PR #7243 门禁构建）未观测到可感知编译耗时漂移，故不设性能阈值测试输入。

---

### 6.2 是否涉及功耗指标

**是否涉及：** 否

**不涉及理由：** 编译期工具链行为，无运行时组件，不涉及功耗指标。

---

### 6.3 是否涉及稳定性 & 可靠性

**是否涉及：** 否

**不涉及理由：** 不引入运行时故障模式；类型判定失败的保守方向是不输出告警（R-6）且编译不失败，已由 AC-1.1/AC-1.2 的编译继续完成验收覆盖，无独立稳定性指标。

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
| AC-1.5 | 见对外行为规格 | 边界（v1.8 重写口径，v1.9 补数组/集合元素级反例）：字段值不是 `undefined` 标识符且解析类型不含 `undefined`（普通变量/表达式传值、联合类型变量经空值守卫收窄后传值、嵌套对象内部出现 `undefined`、数组/集合字面量内部元素出现 `undefined`（如 `[1, undefined, 2]`）、`any`/`unknown` 动态类型值），0 条本特性告警 | 构建（编译）含该场景的工程，检查输出不含本特性告警 |
| AC-1.6 | 见对外行为规格 | 类型级正例（v1.8 新增）：V1/V2 组件向 `@Require` 修饰且声明类型不含 `undefined` 的字段传入 `void 0` 或类型含 `undefined` 的变量/表达式，每命中字段恰 1 条同契约 WARNING（`${actualType}` 为该传入值解析类型文本：`void 0` 渲染为 `undefined`，联合类型变量渲染为联合类型文本）；编译继续完成、无新增 ERROR | 构建（编译）含该场景的 ArkTS 应用工程，逐字段核对构建输出的告警计数、文案与定位 |
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
| AC-1.5 | 构建输出不出现本特性告警 | 构建（编译）构造传参字段值不是 `undefined` 标识符且解析类型不含 `undefined` 的场景（普通变量/表达式传值、联合类型变量经空值守卫收窄后传值、对象字面量嵌套属性内部出现 `undefined`、`any`/`unknown` 动态类型值）；检查构建输出不含本特性告警 | 同 AC-1.1 | 无 |
| AC-1.6 | 应用工程构建输出中的 1 条 WARNING：同 AC-1.1 契约（级别/文案模板/无数字码/属性级定位），`${actualType}` 为传入值解析类型文本（`undefined` 标识符与 `void 0` 渲染为 `undefined`，联合类型变量渲染为该联合类型的类型文本，如 `number` 与 `undefined` 的联合类型）；编译继续完成、无新增 ERROR | 构建（编译）含 V1/V2 组件向 `@Require` 修饰且声明类型不含 `undefined` 的字段传入 `void 0` 或类型含 `undefined` 的变量/表达式的 ArkTS 应用工程；检查构建输出：每命中字段恰 1 条 WARNING 且 got 段与解析类型一致，编译不失败 | 同 AC-1.1 | 无 |

---
<!-- GENERATED:DESIGN-CONSTRAINTS:END -->

## 九、测试输入完备性

- 2D 能力特征分析（5.1～5.12）：12 个维度已逐项判定，“是”项（5.2 应用兼容性、5.3 跨平台、5.5 编译工具链）完成全部细项，其余均附不涉及理由。
- 非功能性需求（6.1～6.5）：5 个维度均判定为否并附不涉及理由。
- 2C 功能体验分析（7.1～7.4）：4 个维度均判定为否并附不涉及理由。
- AC 验证点追溯（第八章）：已覆盖 spec 全部 AC（AC-1、AC-1.1～AC-1.6）及验证点、测试侧验证方式。
- 无遗留事项。
<!-- TEST-ANALYSIS:END -->

## 十、参考资料

| 文档 | 路径 | 状态/Hash |
|---|---|---|
| spec.md | `spec.md` | Approved / `2188bc41b4e0fe56cfc112a52073dadf9a0a925179eeda5aa362fc891a7260be` |
| design.md | `design.md` | Approved / `103d131c760afde6f5c0c11754fa6cdd43a42aee07e989e0729759b69df5b4fb` |
| Profile playbook | `analysis/arkui/spec-for-validation.md` | Active |

## 十一、来源与审批

| 项 | 内容 |
|---|---|
| Spec 来源 | `spec.md` / `2188bc41b4e0fe56cfc112a52073dadf9a0a925179eeda5aa362fc891a7260be` |
| Design 来源 | `design.md` / `103d131c760afde6f5c0c11754fa6cdd43a42aee07e989e0729759b69df5b4fb` |
| 开发/Spec Owner 结论 | Approved |
| 测试 Owner 结论 | Approved |

> 双 Owner 签署记录（2026-10-29，@youzhi92）：开发/Spec Owner 与测试 Owner 均为本会话用户（同一人双角色）批准——全文审查通过、spec/design 来源 hash 绑定一致、规格投影未改写；CLI check 15/15 PASS；验证经 VM-1～VM-6 mocha 单测承载。
>
> 修复追认记录（2026-10-29，@youzhi92 指示修复、同 owner 双角色签署）：按外部测试设计规则校验结论补全文档缺口——proposal 基线 v1.3（新增设备差异规格 1+8、DFX 设计显式不涉及声明）、spec.md AC 表改 Given/WHEN/THEN 三段式且类型列对齐 正常/异常、VM-1～VM-6 验证方式改述端到端构建输出断言口径（需求语义/范围/AC 行为无变更）；本文档 5.2 补应用兼容性四要素（版本隔离/changelog），5.3 跨平台由「否」修正为「是」（依据：interop 编译模式即本仓跨平台 ArkTS UI 构建链路——`src/interop/src/` 自包含镜像 + `fast_build/ets_ui/arkoala-plugin.ts`，当时的 interop 验收 AC 与 VM-6 已实测告警一致性），术语表补 interop 编译模式等 4 条；`refresh` 同步 GENERATED 区与 source_spec_hash 后八章验证点两列经 owner 回填复确认。修复后 CLI check 15/15 PASS、validate --level all 46 checks/0 broken PASS；测试输入语义与 AC 行为无变更。
>
> 基线追认记录（2026-10-31，@youzhi92 指示移除、同 owner 双角色签署）：按 owner 会话指示（「不需要验证点6，请同步更新spec和spec-for-validation」，经确认按「全链路一致移除」口径执行）移除 interop 一致性验收维度——本文档与 spec.md 同步删除该维度的 proposal 级/spec 级验收条目、interop 规则（原 R-7 重编号为 R-6）与 VM-6/验证点6；5.2 关联 AC、5.3 跨平台（保留「是」的事实性承载描述并去验收化措辞）、5.5 interop 场景行、六章 6.3/6.5、八章追溯、九章完备性、附录术语表同步更新；AC-1.1～AC-1.5 行为契约与需求语义无变更。interop 镜像代码与既有 interop 回归测试（`cd compiler && npm run interopArkTest`）保留为附加覆盖（仓内架构铁律，非 AC 验收项）。source_spec_hash/source_design_hash 同步回填。
>
> v1.8 修订记录（2026-10-31，@youzhi92 指示扩展、同 owner 双角色待批）：按 owner 需求（`@Require` 告警未覆盖传入 `void 0` 与联合类型变量的场景，经方案澄清定为类型级触发：两场景均告警、联合类型变量经空值守卫收窄后不告警、解析类型不明不判定）修订测试输入——第一至四章与 NFR 区经 `refresh` 自动同步 spec.md v1.8（AC-1.5 反例边界按传入值解析类型口径重写、新增 US-2 与 AC-1.6 类型级正例、R-5 重写与 R-7 新增、消息模板 `${actualType}` 渲染口径、验证维度 VM-7/VM-8）；DESIGN-CONSTRAINTS 区同步 design.md v1.8 测试输入约束（AC-1.5 重写 + AC-1.6 新增）；八章 AC-1.5 行按 v1.8 口径回填、新撰 AC-1.6 行；5.2 补 AC-1.6 兼容行、5.3 补类型级场景、5.5 AC-1.5 场景行重写并新增 AC-1.6 正例行、6.5 与九章完备性同步、附录补「类型级触发」术语；source_spec_hash/source_design_hash 同步回填。v1.5/v1.7 已批准内容的行为契约未变更（仅传入值判定口径扩展），本修订稿随 v1.8 文档链呈报 owner 批准后生效。CLI check 15/15 PASS；validate --level all 46 checks / 5 broken 归因：4 项为 TASK-4 待执行（Phase Gate：等 owner 批准修订后的 execution-plan）与本文档待批的预期项（TASK-4 完成+本文档获批置 Approved 后闭合），1 项 design.md 代码事实基线探针行引用格式缺陷当期已修复。
>
> v1.8 批准与交付追认记录（2026-10-31，@youzhi92 同 owner 双角色签署）：owner 批准 v1.8 文档链（「批准，文档链先行（推荐）」）后于同日指示「根据新的规格，更新代码实现」（= execution-plan v1.8 修订获批 + TASK-4 执行授权），本文档随文档链获批置 Approved。TASK-4 已交付并经 Red→Green 闭合：etsTest 359 passing / 2 failing、interopArkTest 1124 passing / 19 failing（fresh，三态失败集对照零漂移），验证点7/8 测试输入已由 Extension fixture（`validateRequireParamUndefinedTypeExtension.ets`/`...ExtensionV2.ets`）承载；执行侧回填见 execution-plan.md（AC 追溯/范围映射/Verification）与 evidence/reviews/ 三份 v1.8 增补段；证据 `evidence/checks/task4-red-green/`。Commit 已落地：单 commit（Change-Id Ia0e5e0a，代码+文档同 commit，2026-10-31 owner 指令上传并触发门禁）。
>
> v1.9 修订记录（2026-10-31，@youzhi92 逐项拍板 PR #1747 评审意见处置、同 owner 双角色签署）：按 design-docs 归档 PR #1747 评审意见（TerryTsao/caojin 10 条，owner 逐项拍板「1. 是，2. B，3. 不做，4. 不关闭，5. 我已手动回复，不用处理。」并补充「跨平台改成是」）修订测试输入——第一至四章经 `refresh` 同步 spec.md v1.9（用户故事角色措辞「鸿蒙应用开发者」、AC-1.1 THEN 内嵌消息模板、AC-1.2/AC-1.6 改引用该模板、AC-1.1/AC-1.5 补数组/集合口径、R-5 触发条件与边界列补数组/集合字面量元素示例、类型判定矩阵后新增数组/集合两维度注记）；5.3 跨平台定性修正——跨平台指 ArkUI-X 工程（iOS & Android），本告警产生于平台打包前的 ArkTS 编译阶段，ArkUI-X 工具链与本仓同源（ets_loader 派生、arkoala-plugin 为接入点），ArkUI-X 端到端构建登记为后续验证项（待本特性合入且 ArkUI-X 工具链同步后执行；Android 目标可在 Linux/Windows 环境验证，iOS 目标需 macOS），interop 降格为「仓内镜像铁律」表述（原「interop=跨平台」定性为 2026-10-29 修复追认记录的历史表述，历史记录不改写）；5.5 错误信息列消息文本加反引号并补数组/集合场景括注；5.12 不涉及理由补强（自解释型诊断文案内含字段名/期望类型/实际类型与定位，存量行为说明由版本发布说明承载）；6.1 补编译性能影响分析（挂既有构造传参校验遍历、O(命中字段数) 有界、既有实测无可感知漂移）；八章 AC-1.5 验证点补数组/集合元素级反例；术语表 interop 定义去跨平台化；source_spec_hash 同步回填（design 未变更，hash 不动）。行为契约（触发条件/级别/文案模板/定位/反例边界）与代码零变更，本修订随 owner 逐项拍板即生效。CLI check 15/15 PASS；validate --level all 46 checks / 0 broken / 0 warn PASS。
>
> v1.10 修订记录（2026-11-03，@youzhi92 指示剔除、同 owner 双角色签署）：按 owner 会话指示（MR #7243 剔除 interop 专属单测文件 `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts`——commit 60eff618，Change-Id Ibe0dab28；且仅修订业务仓 .codespec，design-docs PR #1747 不动）同步修订测试范围声明——5.3 interop 行测试侧验证方式改述（专属用例已剔除、镜像链路无 MR 内行为级断言、`interopArkTest` 回归套件保留为常规回归）、附录术语表 interop 行同步、元信息产物状态与最后更新；范围包含项7（proposal）由「主链路+interop 双路径」调整为主链路端到端断言承载（design/execution-plan 范围声明同步注记）。AC 验证点（VM-1～VM-5、VM-7～VM-8）全部由主链路 transform_ut fixture 端到端断言承载，不受影响；行为契约（触发条件/级别/文案模板/定位/反例边界）与代码实现零变更。source_design_hash 同步回填（design.md 范围声明注记）；source_spec_hash 不变（spec.md 无变更）。CLI check 15/15 PASS；validate --level all 46 checks / 0 broken / 0 warn PASS。

## 附录：术语表

| 术语 | 定义 |
|---|---|
| 2D | 能力特征维度分析 |
| 2C | 功能体验维度分析 |
| interop 编译模式 | 本仓工具链的仓内镜像构建链路：`compiler/src/interop/src/` 自包含镜像工具链 + `fast_build/ets_ui` 插件集（含 `arkoala-plugin.ts`），主链路改动须同步镜像副本（仓内架构铁律）；行为一致性由仓内镜像同步纪律承载，`interopArkTest` 回归套件保留为常规回归（非 AC 验收项；本特性专属 interop 用例已随 v1.10 从交付 MR 剔除）。注（v1.9 修订）：interop 为仓内镜像机制，不等于跨平台构建本身——跨平台指 ArkUI-X 工程（iOS & Android 目标），见 5.3 |
| non-null 字段 | 声明类型不含 `undefined` 成员的字段（类型别名经解析后判定，见第二章类型判定口径表） |
| 消息模板 | WARN 诊断的固定英文文案模板（R-1/R-2 统一，`${paramName}` 为字段名占位） |
| Red 条件 | TDD 红灯信号：实现前运行验证命令应观察到的断言失败（spec.md 验证映射表列） |
| 类型级触发 | 传入值解析类型含 `undefined` 成员即触发告警的判定口径（v1.8 起），区别于仅识别 `undefined` 标识符的语法级口径；传入值解析类型不明（`any`/`unknown`）不判定为含 `undefined`，不触发 |

---

**格式说明：**

1. 第一至四章来自 `spec.md`，不得摘要、删减或手工改写。
2. 第五章 2D、第六章 NFR 验证细项、第七章 2C 为测试输入分析区。
3. 每个“是否涉及”小节选择“是”时必须完成后续字段；选择“否/N/A”时必须填写不涉及理由。
4. `spec-for-validation.md` 只描述对外行为和测试侧验证输入，不记录开发自验证类型、用例、命令或执行结果。
