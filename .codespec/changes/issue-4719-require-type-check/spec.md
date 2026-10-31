# 特性规格

> 固化用户可见行为和验收标准。实现细节（类型判定的具体实现方式、代码结构）归 design.md。

## 概述

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

## 输入文档

| 文档 | 路径 | 状态 |
|------|------|------|
| Requirement | `proposal.md`（issue-4719-require-type-check，基线 v1.9） | Approved |

> AC 对应关系：proposal 以 AC-1 为首的 6 条 AC ↔ 本文档 AC-1.1～AC-1.6（顺序一一对应）。其中本文档 AC-1.6 为 v1.8 新增类型级触发正例，与 v1.7 移除的 interop 维度 AC-1.6 无关（编号复用，v1.8 基线记录注记）。需求基线、不涉及项、影响范围详见 proposal.md，本文档不重复摘录。

## 用户故事

### US-1: @Require 字段 undefined 传值编译期告警

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

### US-2: @Require 字段非标识符 undefined 传值编译期告警（v1.8）

**作为** 鸿蒙应用开发者,
**我想要** 以 `void 0` 或类型含 `undefined` 的变量等非标识符形式向 `@Require` 修饰的 non-null（声明类型不含 `undefined`）字段传入可能为 `undefined` 的值时，同样获得编译期告警,
**以便** 该写法不绕过显式 `undefined` 场景的检查。

**验收标准（AC, Acceptance Criteria）：**

| AC编号 | 验收标准 | 可观察表面 | 类型 |
|--------|----------|--------------|------|
| AC-1.6 | Given V1/V2 组件构造传参对象含 `@Require` 修饰（V1 单独使用或与 `@Prop`/`@State`/`@Provide`/`@BuilderParam` 组合；V2 `@Require`+`@Param`）且声明类型不含 `undefined` 的字段，WHEN 构造传参中该字段传入值不是 `undefined` 标识符、但其解析类型包含 `undefined`（如 `void 0` 表达式、类型为 `xxx \| undefined` 的变量或表达式）后编译 THEN 编译输出 1 条 WARNING 级别诊断（无数字错误码，文案为 AC-1.1 内嵌消息模板——`${actualType}` 为该传入值的解析类型文本，渲染口径见 R-7；定位同 AC-1.1），且编译继续完成、无新增 ERROR | 终端用户（应用开发者编译/构建输出） | 正常 |

## 验收追溯

| AC | 关联规则 | 可观察表面 |
|----|----------|--------------|
| AC-1.1 | R-1 | 终端用户（应用开发者编译/构建输出：WARNING 诊断） |
| AC-1.2 | R-2 | 终端用户（应用开发者编译/构建输出：WARNING 诊断） |
| AC-1.3 | R-3、R-6 | 终端用户（应用开发者编译/构建输出：无本特性告警） |
| AC-1.4 | R-4 | 终端用户（应用开发者编译/构建输出：无本特性告警） |
| AC-1.5 | R-5 | 终端用户（应用开发者编译/构建输出：无本特性告警） |
| AC-1.6 | R-7 | 终端用户（应用开发者编译/构建输出：WARNING 诊断） |

## 规则定义

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

## 验证映射

| 编号 | 对应规格项 | 测试入口 | 验证方式 | Red 条件（实现前失败信号） | 通过标准 |
|------|------------|----------|----------|---------------------------|----------|
| VM-1 | R-1 / AC-1.1 | `compiler/test/transform_ut/ut_validate.test.ts`（新增 V1 fixture 于 `test/transform_ut/application/entry/src/main/ets/pages/utForValidate/Decorators/process_custom_component/`，页面注册于 `test/transform_ut/helpers/pathConfig.ts`，期望日志登记于 `test/transform_ut_error.json`），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（transform_ut 完整编译管线 fixture：应用工程页面经真实插件链编译，mocha 断言 WARN 计数与文案） | 实现前运行 `npm run etsTest`：该 fixture 产生 0 条本告警，`ut_validate.test.ts` 断言 `warnInfos.length === expectWarnInfos.length` 失败（0 ≠ 期望 1），mocha 用例失败 | WARN 恰好 1 条且文案与消息模板逐字符一致；ERROR 计数与期望一致；transform 正常完成（编译不失败） |
| VM-2 | R-2 / AC-1.2 | 同 VM-1 测试套件（新增 V2 fixture：`@ComponentV2` + `@Require @Param` + 显式 `undefined`，参照既有 `v2_component_decorator/param/` fixture 模式），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（同 VM-1 管线，V2 场景） | 实现前 V2 场景同样 0 条 vs 期望 1 条，断言计数不符，mocha 用例失败 | WARN 恰好 1 条且与 VM-1 文案一致；编译不失败 |
| VM-3 | R-3、R-6 / AC-1.3 | 同 VM-1 测试套件（fixture 含反例字段：`number \| undefined`、`any` 等类型 + 显式 `undefined`），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（零误报回归：反例字段断言 0 条本告警） | 反例与 VM-1 正例置于同一 fixture/用例：实现前因正例字段期望 WARN 缺失（0 ≠ 1）整个用例失败，同时该用例承载反例字段 0 误报断言 | 正例字段输出 1 条；反例字段（含 `undefined` 类型、不可判定类型）输出 0 条本告警 |
| VM-4 | R-4 / AC-1.4 | 同 VM-1 测试套件（fixture 含无 `@Require` 字段 + 显式 `undefined`），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（零误报回归） | 同 VM-3：组合用例实现前因正例缺失失败，反例断言由同一用例承载 | 无 `@Require` 字段 0 条本告警；正例字段行为不变 |
| VM-5 | R-5 / AC-1.5 | 同 VM-1 测试套件（fixture 含嵌套对象内部 `undefined`、解析类型不含 `undefined` 的变量传值等非 `undefined` 标识符场景），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（零误报回归） | 同 VM-3：组合用例实现前因正例缺失失败 | 解析类型不含 `undefined` 的非标识符场景 0 条本告警；正例字段行为不变 |
| VM-7 | R-7 / AC-1.6 | 同 VM-1 测试套件（v1.8 新增 Extension fixture 2 页：`validateRequireParamUndefinedTypeExtension`（V1：`void 0` 与联合类型变量正例）与 `validateRequireParamUndefinedTypeExtensionV2`（V2：同正例集），页面注册于 `test/transform_ut/helpers/pathConfig.ts`、期望日志登记于 `test/transform_ut_error.json`，方式同 VM-1），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（transform_ut 完整编译管线：v1.8 类型级触发正例） | 实现前运行 `npm run etsTest`：新 fixture 正例字段产生 0 条本告警 vs 期望每页 2 条，断言计数不符，mocha 用例失败 | 每页 WARN 恰好 2 条且文案与消息模板逐字符一致（got 段分别为 `undefined` 与联合类型文本如 `number \| undefined`/`string \| undefined`）；ERROR 0；transform 正常完成（编译不失败） |
| VM-8 | R-5 / AC-1.5 | 同 VM-1 测试套件（V1 Extension fixture 内嵌 v1.8 扩展反例：联合类型变量经 `!== undefined` 空值守卫收窄后传值、`any` 动态类型变量传值），命令 `cd compiler && npm run etsTest` | 应用工程构建输出断言（零误报回归：v1.8 扩展反例边界） | 与 VM-7 同一 fixture/用例组合承载：实现前因正例缺失（0 ≠ 2）失败，反例断言由同一用例承载 | 收窄守卫与动态类型反例字段 0 条本告警；VM-5 既有反例行为不变 |

> **验证口径说明：** VM-1～VM-5、VM-7～VM-8 均为端到端构建输出断言——fixture 为完整应用工程页面（`test/transform_ut/application/entry/src/main/ets/pages/...`），经真实插件链（etsChecker→visualTransform→etsTransform→…）编译后对诊断输出断言，非函数级单测；「测试入口」列即触发入口（fixture 页面注册 + 构建命令）。VM-6 编号已随 v1.7 interop 维度移除，不复用。独立验收场景（构建 ArkTS 应用工程核对构建输出、比对工具链升级前后差异）由 spec-for-validation.md 八章（AC 验证点追溯）与 5.2（应用兼容性）承载。

## API 变更分析

### 新增 API

N/A：本特性为编译器诊断增强，不新增任何 Public/System/InnerAPI。

### 变更/废弃 API

N/A：不变更、不废弃任何 API。

### API 与错误码事实

N/A：本特性无 API 变更、不新增数字错误码（owner 决策 O-3：新增 WARN 级诊断不分配数字码，沿用仓内 WARN 无码惯例——`compiler/src/` 中 WARN 级诊断均无 `code` 字段，10905xxx 数字码仅用于 ERROR）。既有相关诊断行为不变，事实备查：10905359（V1 `@Require` 必传缺失，ERROR，`compiler/src/process_custom_component.ts` 及 interop 镜像）、10905321（V2 `@Param` 必传缺失，ERROR，同前）、10905316（`@Link`/`@ObjectLink` 必传缺失，ERROR，同前）。新告警的可观察契约（级别/文案/定位）由 R-1/R-2 与消息模板定义。

## 接口规格

N/A：无新增接口规格（编译期诊断，无对外接口；诊断行为契约见规则定义）。

## 兼容性声明

- **已有 API 行为变更:** 否。新增 WARNING 不阻断编译；存量工程中显式向 `@Require` non-null 字段传 `undefined` 的代码会出现新告警（预期行为，属本特性目的），其余行为不变。v1.8 类型级触发扩展后，传入 `void 0` 或解析类型含 `undefined` 的变量/表达式的代码同样出现新告警（同属预期行为，AC-1.6）；解析类型不含 `undefined` 的传值（含收窄后、动态类型值）行为不变。
- **配置文件格式变更:** 否
- **数据存储格式变更:** 否
- **最低支持版本:** 随目标版本 OpenHarmony-7.1-Release 的编译工具链交付
- **API 版本号策略:** N/A（无 API）

## 架构约束

| 关键约束 | 约束说明 | 影响 AC |
|----------|----------|---------|
| 主链路与 interop 镜像同步 | 告警逻辑须在 `compiler/src/` 主链路与 `compiler/src/interop/src/` 镜像同步实现，行为一致 | —（仓内架构铁律：镜像同步义务，非 AC 验收项） |
| 诊断级别与编码 | 固定 LogType.WARN、不分配数字错误码（owner 决策 O-3，见 evidence/checks/check-proposal.md） | AC-1.1、AC-1.2 |
| 既有诊断行为不变 | 既有 `@Require` 相关诊断（10905316/10905321/10905359，ERROR）与问号限制等规则保持不变，本特性仅新增告警 | AC-1.1～AC-1.6 |

## 非功能性需求

N/A：本特性为编译期静态诊断，无运行时非功能指标（依据 proposal.md 不涉及项确认：性能否、安全与权限 N/A、IPC N/A 等）。可测试性由 VM-1～VM-5 与 VM-7～VM-8 承载；编译耗时影响限于构造传参遍历内的类型判定，无用户可感知阈值要求。

## 多设备适配声明

无差异：编译期诊断与设备形态无关（手机/平板/折叠屏等设备上编译行为一致）。

## 全局特性影响

| 特性 | 适用？ | 结论 | 关联场景 |
|------|--------|------|----------|
| 无障碍 | 否 | 编译诊断，不触及无障碍能力 | — |
| 大字体 | 否 | 编译诊断，与显示无关 | — |
| 深色模式 | 否 | 编译诊断，与显示无关 | — |
| 多窗口/分屏 | 否 | 编译诊断，与窗口形态无关 | — |
| 多用户 | 否 | 编译诊断，与用户无关 | — |
| 版本升级 | 否 | 编译产物不变，仅新增构建期提示 | — |
| 生态兼容 | 是 | 存量工程可能出现新 WARNING（非阻断，不失败构建）；属本特性预期行为（v1.8 扩展含 `void 0`/联合类型变量场景） | AC-1.1、AC-1.6 |

## context-references

```yaml
context-queries:
  - repo: "openharmony/developtools_ace_ets2bundle"
    query: "构造传参校验入口 validateCustomComponentPrams 与既有 @Require 必传校验（10905316/10905321/10905359）在 compiler/src/process_custom_component.ts 的实现位置与告警锚点"
  - repo: "openharmony/developtools_ace_ets2bundle"
    query: "compiler/src/interop/src/ 镜像工具链的同名校验副本与 fast_build/ets_ui 插件集（interopBuild/interopArkTest 构建链）"
  - repo: "openharmony/developtools_ace_ets2bundle"
    query: "V1 @Require 合法搭配（process_component_member.ts SUPPORT_REQUIRE_DECORATOR/mandatoryToInitViaParamDecorators）与 V2 @Require+@Param 限制（process_struct_componentV2.ts）"
  - repo: "openharmony/developtools_ace_ets2bundle"
    query: "ut_validate.test.ts + transform_ut_error.json + helpers/pathConfig.ts 的 fixture 断言机制与 etsTest/interopArkTest 测试命令"
```

**关键文档：** `proposal.md`（issue-4719-require-type-check，Approved v1.9）；GitCode Issue https://gitcode.com/openharmony/developtools_ace_ets2bundle/issues/4719；知识库 `docs/specs/02-校验规则/02-05 @Require.md`（既有 `@Require` 规则先例）。
