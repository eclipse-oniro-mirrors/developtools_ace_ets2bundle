# 09 - @syscap 标签校验

> 标签：`@syscap` | 常量：`SYSCAP_TAG_CHECK_NAME` | 错误码：无（纯 Warning）
> 校验类型：设备能力集检查 + 外部扩展校验器 | 告警级别：Warning

---

## 1. 概述

`@syscap` 是 JSDoc 标签，标注 API 所需的设备系统能力（System Capability）。不同设备支持的能力集不同，当项目目标设备不支持该能力时，触发告警。

```
@syscap SystemCapability.ArkUI.ArkAnimator
```

**校验模式**：设备能力集（模式 E）—— 检查 `@syscap` 值是否在 `syscapIntersectionSet`（设备交集）中，并支持 `canIUse()` 条件守卫抑制和外部扩展校验器。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `SYSCAP_TAG_CHECK_NAME` | `'syscap'` | 标签名 |
| `SYSCAP_TAG_CHECK_WARNING` | `"The system capacity of this api '{0}' is not supported on all devices"` | 告警消息 |
| `SYSCAP_TAG_CONDITION_CHECK_WARNING` | `'The API is not supported on all devices. Use the canIUse condition to determine whether the API is supported.'` | 条件检查告警 |
| `CANIUSE_FUNCTION_NAME` | `'canIUse'` | canIUse 函数名 |

**错误码**：`SYSCAP_TAG_CHECK_WARNING` **不在** `ERROR_CODE_INFO` 中。纯 Warning。

**告警抑制注册**：
- `SUPPRESSWARNINGS_RULE_INFO`: `[SYSCAP_TAG_CHECK_NAME, 'SuppressWarnings']`
- `ANNOTATION_RULE_INFO`: `[SYSCAP_TAG_CHECK_NAME, 'SuppressWarningsType.SYSCAP']`

---

## 3. 配置构建：getSyscapCheckConfig

> 源码：`api_check_utils.ts:620`

```typescript
function getSyscapCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const syscapConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [SYSCAP_TAG_CHECK_NAME],
    message: SYSCAP_TAG_CHECK_WARNING,
    type: ts.DiagnosticCategory.Warning,        // 固定 Warning
    tagNameShouldExisted: false,
    checkJsDocSuppressorValidCallback: checkSyscapAbility
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(syscapConfig));
}
```

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`api_check_utils.ts:916`）分支四

```typescript
if (projectConfig.deviceTypes && projectConfig.deviceTypes.length > 0) {
  getSyscapCheckConfig(checkConfigArray);   // :955，有 deviceTypes 时才添加
}
```

**前提**：`projectConfig.deviceTypes` 非空。无设备类型配置时不校验 @syscap。

---

## 5. Check 回调：checkSyscapAbility

> 源码：`api_check_utils.ts:1622`

```typescript
export function checkSyscapAbility(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkSyscapAbility(jsDocTags, config, node, declaration)
  │
  ├─ 1. 提取 @syscap 标签值
  │    遍历 jsDocTags，找 tagName === 'syscap'
  │    currentSyscapValue = tag.comment
  │
  ├─ 2. 默认结果判断
  │    defaultResult = projectConfig.syscapIntersectionSet 存在
  │      且 !syscapIntersectionSet.has(currentSyscapValue)
  │    // true = 设备交集不支持该能力 → 需要告警
  │
  ├─ 3a. defaultResult = true（需要告警）
  │    ├─ suppressor = new SyscapWarningSuppressor(jsDocTags, config)
  │    ├─ suppressor.isApiVersionHandled(node)
  │    │   └─ CanIUseValidator + Annotate/Comment SuppressWarnings
  │    ├─ 被抑制 → return false
  │    └─ 未抑制 → return true（需告警）
  │
  └─ 3b. defaultResult = false（设备交集支持）
       ├─ externalCheckers = externalApiCheckerMap.get('syscap')
       ├─ 无外部校验器 → return false（不告警）
       ├─ 有外部校验器 → 遍历执行
       │    extrenalCheckResult = checker.check(node, declaration, projectConfig)
       │    if (!extrenalCheckResult.checkResult):
       │      return false  // 外部校验通过
       │    config.message = extrenalCheckResult.checkMessage
       ├─ suppressor = new SyscapWarningSuppressor(jsDocTags, config)
       ├─ suppressor.isApiVersionHandled(node)
       │   被抑制 → return false
       └─ 未抑制 → return true（需告警）
```

### 5.2 两种告警场景

| 场景 | 条件 | 消息 |
|------|------|------|
| 设备交集不支持 | `!syscapIntersectionSet.has(syscap)` | `SYSCAP_TAG_CHECK_WARNING`（替换 `{0}`） |
| 外部校验器不通过 | `externalApiCheckerMap` 校验失败 | 外部校验器返回的 `checkMessage` |

---

## 6. 设备能力集初始化

**`configureSyscapInfo`**（`api_check_utils.ts`，在 etsChecker 插件 `buildStart()` 中调用）：

```typescript
export function configureSyscapInfo(config: SystemConfig): void
```

从 `device-define/*.json` 读取设备 SysCap 列表，计算：
- `syscapIntersectionSet`：所有目标设备的**交集**（所有设备都支持的能力）
- `syscapUnionSet`：所有目标设备的**并集**（至少一台设备支持的能力）

**校验逻辑**：
- API 的 `@syscap` 值**不在交集** → 至少一台设备不支持 → 告警
- API 的 `@syscap` 值**在交集** → 所有设备都支持 → 默认不告警（但可能被外部校验器拦截）

---

## 7. 告警抑制：SyscapWarningSuppressor

> 源码：`api_validator/syscap_warning_suppressor.ts`

```typescript
constructor(jsDocTags, config) {
  super(SYSCAP_TAG_CHECK_NAME);  // 注册 @SuppressWarnings 注解/注释抑制
  this.validators.addValidator([
    new CanIUseValidator(jsDocTags, config)
  ]);
}
```

| Validator | 策略 |
|-----------|------|
| `CanIUseValidator` | `if (canIUse('xxx'))` 守卫内调用 |
| `AnnotateSuppressWarningsValidator` | `@SuppressWarnings({rules: [SuppressWarningsType.SYSCAP]})` |
| `CommentSuppressWarningsValidator` | `// @SuppressWarnings syscap` |

### 7.1 CanIUseValidator 详解

> 源码：`api_validator/api_validate_node.ts`

```typescript
class CanIUseValidator extends BaseValidator {
  validate(node: ts.Node): boolean {
    const needCanIUseCheck = /canIUse\(.*\)/.test(nodeSource.text);
    if (!needCanIUseCheck) return false;
    return this.conditionCheck(node, this.jsDocTags, this.config);
  }
}
```

**检测逻辑**：
1. 文件内容含 `canIUse(...)` 调用（正则预检，带缓存）
2. `conditionCheck`：
   - 提取 `@syscap` 标签值（`getSpecifyJsDocTagValue`）
   - `isNodeInCanIUseGuardPattern`：检测 API 调用是否在 `if (canIUse('xxx'))` 守卫内
   - 守卫内的 `canIUse` 参数与 `@syscap` 值匹配 → 抑制

**守卫形态**（与 SdkComparisonValidator 共用 `isNodeInGuardPattern`）：
- else 分支、卫语句、三元、then 块

**canIUse 参数解析**（`checkSyscapConditionValidCallback`）：
- 直接字符串字面量：`canIUse('SystemCapability.X')`
- 变量引用：通过 `resolveInitializerExpression` 解析常量初始化器

### 7.2 条件检查告警

当 `canIUse` 检测到 API 不在交集但在并集中时（部分设备支持），返回 `SYSCAP_TAG_CONDITION_CHECK_WARNING`（建议使用 `canIUse` 条件判断）。

---

## 8. 外部扩展校验器

**`externalApiCheckerMap`**：`Map<tagName, checker[]>`

```typescript
interface CheckSyscapResult {
  checkResult: boolean;       // true = 校验不通过（需告警）
  checkMessage?: string[];    // 外部校验器返回的消息
}
```

外部校验器通过 `checker.check(node, declaration, projectConfig)` 执行，返回 `checkResult` 和 `checkMessage`。

**用途**：当设备交集支持该能力时，仍可由外部校验器做额外检查（如特定设备型号限制）。

---

## 9. 开发任务指南

### 9.1 修改设备能力集判断

修改 `checkSyscapAbility`（`:1622`）的 `defaultResult` 逻辑或 `configureSyscapInfo`。

### 9.2 新增抑制策略

1. `api_validate_node.ts`：新增 Validator
2. `syscap_warning_suppressor.ts` 构造函数中 `addValidator` 注册

### 9.3 新增外部扩展校验器

修改 `externalApiCheckerMap` 的注册逻辑，新增 checker 实现 `check(node, declaration, projectConfig)` 接口。

---

## 10. 源码索引

| 文件 | 函数/类 | 职责 |
|------|---------|------|
| `api_check_define.ts` | `SYSCAP_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `SYSCAP_TAG_CHECK_WARNING` | 告警消息 |
| `api_check_define.ts` | `CANIUSE_FUNCTION_NAME` | canIUse 函数名 |
| `api_check_utils.ts` | `getSyscapCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkSyscapAbility` | check 回调 |
| `api_check_utils.ts` | `configureSyscapInfo` | 设备能力集初始化 |
| `api_validator/syscap_warning_suppressor.ts` | `SyscapWarningSuppressor` | 告警抑制器 |
| `api_validator/api_validate_node.ts` | `CanIUseValidator` | canIUse 守卫检测 |
| `api_validator/api_validate_utils.ts` | `isNodeInGuardPattern` | 守卫形态检测 |