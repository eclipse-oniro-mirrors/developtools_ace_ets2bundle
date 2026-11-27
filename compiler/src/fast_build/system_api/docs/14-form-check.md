# 14 - @form 标签校验

> 标签：`@form` | 常量：`FORM_TAG_CHECK_NAME` | 错误码：`11706006`
> 校验类型：版本范围模式（模式 B） | 告警级别：Error

---

## 1. 概述

`@form` 是 JSDoc 标签，标注 API 是否支持卡片（Form）场景。在卡片文件中使用不支持卡片的 API 时，触发**错误**。

```
@form
@form [since 10 - 20]
```

**校验模式**：版本范围模式（模式 B）—— 标签存在表示"支持声明"，标签不存在则告警。

**模式 B 逻辑**（与模式 A 相反）：
- 标签不存在 → 告警（API 未声明支持卡片）
- 标签存在无版本范围 → 不告警（API 声明支持卡片）
- 标签存在有版本范围 → 当前 SDK 不在支持范围内才告警（`!checkVersionRangeIntersection`，不相交=告警）

> **取反规则说明**：模式 B 用 `!checkVersionRangeIntersection()`，模式 A 用 `checkVersionRangeIntersection()`。详见 §6。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `FORM_TAG_CHECK_NAME` | `'form'` | 标签名 |
| `FORM_TAG_CHECK_ERROR` | `"'{0}' can't support form application."` | 错误消息 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
FORM_TAG_CHECK_ERROR -> { code: '11706006', description: "can't support form application." }
```

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

---

## 3. 配置构建：getFormCheckConfig

> 源码：`api_check_utils.ts:671`

```typescript
function getFormCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(FORM_TAG_CHECK_ERROR)?.code}#${FORM_TAG_CHECK_ERROR}`;
  const formConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [FORM_TAG_CHECK_NAME],
    message: diagnosticMessage,                   // 带 11706006# 前缀
    type: ts.DiagnosticCategory.Error,            // 固定 Error
    tagNameShouldExisted: true,                   // 标签应存在（与模式 A 相反）
    checkJsDocSuppressorValidCallback: checkFormValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(formConfig));
}
```

> `tagNameShouldExisted: true`：表示 API **应该**有 `@form` 标签声明是否支持卡片。没有标签 → 报错。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:966-969`）

```typescript
if (isCardFile(fileName)) {
  needCheckResult = true;
  getFormCheckConfig(checkConfigArray);   // :968
}
```

**条件**：引用方文件（`fileName`）是卡片入口文件（`isCardFile(fileName)` 返回 true）。

> 只有在卡片场景下才校验 `@form`。非卡片文件不校验。

---

## 5. Check 回调：checkFormValue

> 源码：`api_check_utils.ts:1927`

```typescript
export function checkFormValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkFormValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @form 标签
  │    jsDocTag = jsDocTags.find(item => item.tagName.getText() === 'form')
  │
  ├─ 2. 动态修改 tagNameShouldExisted
  │    config.tagNameShouldExisted = !jsDocTag
  │    // 无标签 → true（应存在但不存在 → 报错）
  │    // 有标签 → false（已声明）
  │
  ├─ 3. 无标签 → return true（需告警）
  │    // API 未声明支持卡片 → 报错
  │
  ├─ 4. 有标签 → 版本范围检查
  │    versionRange = extractVersionRange(jsDocTag.comment)
  │    │
  │    ├─ 有版本范围：
  │    │    return !checkVersionRangeIntersection(versionRange)
  │    │    // true = 不相交（当前SDK不在支持范围）= 需告警
  │    │    // false = 相交（当前SDK在支持范围）= 不告警
  │    │
  │    └─ 无版本范围：
         return false   // 有标签 = 不告警（API 声明支持卡片）
```

### 5.2 版本范围语义

`@form [since 10 - 20]` 表示该 API 在版本 10-20 之间支持卡片。

- 当前 SDK 在 10-20 之间（相交）→ 不告警（支持）
- 当前 SDK 不在范围（不相交）→ 告警（该版本不支持卡片）

---

## 6. 取反规则说明（模式 A vs 模式 B）

| 模式 | 标签含义 | 无标签 | 有标签无范围 | 有标签有范围 | 使用的函数 |
|------|---------|--------|-------------|-------------|-----------|
| A（systemapi/test/fa/stage） | 限制使用 | 不告警 | 告警 | `checkVersionRangeIntersection()`（相交=告警） | 直接用 |
| B（form/crossplatform/atomicservice） | 支持声明 | 告警 | 不告警 | `!checkVersionRangeIntersection()`（不相交=告警） | 取反 |

**`checkVersionRangeIntersection` 返回 `true = 相交`**（当前 SDK 在 API 版本范围内）。

- 模式 A：相交 = API 限制在当前版本生效 = 告警
- 模式 B：相交 = API 在当前版本支持 = 不告警（取反后告警 = 不相交）

> **修改模式 B 回调时务必确认取反方向**，错误取反会导致本该告警的不告警、不该告警的告警。

---

## 7. 阻塞编译原理

消息格式：`11706006#'{0}' can't support form application.`

带 `code#` 前缀 + `type: Error` → hvigor 识别为编译错误，阻塞编译。

---

## 8. 开发任务指南

### 8.1 修改卡片文件判断

修改 `isCardFile(fileName)` 函数或 `getJsDocNodeCheckConfig`（`:966`）的条件。

### 8.2 修改告警级别

修改 `getFormCheckConfig`（`:671`）的 `type`。

### 8.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册 `form`
2. 新建抑制器
3. 在 `checkFormValue` 中调用

---

## 9. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `FORM_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `FORM_TAG_CHECK_ERROR` | 错误消息 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706006 |
| `api_check_utils.ts` | `getFormCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkFormValue` | check 回调 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件（isCardFile） |