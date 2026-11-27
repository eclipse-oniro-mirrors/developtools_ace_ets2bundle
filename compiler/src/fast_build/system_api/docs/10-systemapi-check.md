# 10 - @systemapi 标签校验

> 标签：`@systemapi` | 常量：`SYSTEM_API_TAG_CHECK_NAME` | 错误码：无（纯 Warning）
> 校验类型：版本范围模式（模式 A） | 告警级别：Warning

---

## 1. 概述

`@systemapi` 是 JSDoc 标签，标注 API 为系统 API（仅供系统应用使用）。普通应用使用系统 API 时触发告警。

```
@systemapi
@systemapi [since 10 - 20]
```

**校验模式**：版本范围模式（模式 A）—— 标签存在表示"限制使用"，存在即可能告警。支持版本范围限定。

**模式 A 逻辑**：
- 标签不存在 → 不告警（API 非 systemapi）
- 标签存在无版本范围 → 告警（是系统 API）
- 标签存在有版本范围 → 当前 SDK 在范围内才告警（`checkVersionRangeIntersection` 返回 true=相交=告警）

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `SYSTEM_API_TAG_CHECK_NAME` | `'systemapi'` | 标签名 |
| `SYSTEM_API_TAG_CHECK_WARNING` | `"'{0}' is system api"` | 告警消息（`{0}` = API 名） |

**错误码**：**不在** `ERROR_CODE_INFO` 中。纯 Warning，消息不带 `code#` 前缀。

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。不支持 @SuppressWarnings 抑制。无专门抑制器。

---

## 3. 配置构建：getSystemApiCheckConfig

> 源码：`api_check_utils.ts:584`

```typescript
function getSystemApiCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const systemApiConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [SYSTEM_API_TAG_CHECK_NAME],
    message: SYSTEM_API_TAG_CHECK_WARNING,       // 纯消息，无 code 前缀
    type: ts.DiagnosticCategory.Warning,          // 固定 Warning
    tagNameShouldExisted: false,                  // 标签不应存在
    checkJsDocSuppressorValidCallback: checkSystemApiValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(systemApiConfig));
}
```

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:949`）

```typescript
getSystemApiCheckConfig(checkConfigArray);   // :949，分支四中始终添加
```

在全量标签分支中**始终添加**。前提：声明方不含 `@Available`，且在 `allModulesPaths` 中或为 ArkUI 依赖。

---

## 5. Check 回调：checkSystemApiValue

> 源码：`api_check_utils.ts:1774`

```typescript
export function checkSystemApiValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkSystemApiValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @systemapi 标签
  │    jsDocTag = jsDocTags.find(item => item.tagName.getText() === 'systemapi')
  │    if (!jsDocTag) → return false   // 无标签：不告警
  │
  ├─ 2. 版本范围检查
  │    versionRange = extractVersionRange(jsDocTag.comment)
  │    │
  │    ├─ 有版本范围：
  │    │    return checkVersionRangeIntersection(versionRange)
  │    │    // true = 相交（当前SDK在范围内）= 需告警
  │    │    // false = 不相交（当前SDK不在范围）= 不告警
  │    │
  │    └─ 无版本范围：
         return true   // 有标签 = 需告警
```

### 5.2 版本范围语义

`@systemapi [since 10 - 20]` 表示该 API 在版本 10-20 之间是系统 API。

- 当前 SDK 在 10-20 之间（相交）→ 告警
- 当前 SDK 不在范围（不相交）→ 不告警（该版本下非系统 API）

---

## 6. 版本范围函数

### 6.1 extractVersionRange（:477）

```typescript
function extractVersionRange(commentText): {start: string, end: string} | undefined
```

匹配 `[since x.y.z - a.b.c]` 格式，返回 `{start, end}` 或 `undefined`。

### 6.2 checkVersionRangeIntersection（:517）

```typescript
function checkVersionRangeIntersection(versionRange): boolean
```

**返回 `true = 相交`**（API 版本范围与项目 SDK 版本范围有重叠）。

> **重要**：`isVersionRangeIntersect`（:452）函数名与返回值语义不一致，实际返回 `true = 不相交`。`checkVersionRangeIntersection` 返回 `!isflag`，即 `true = 相交`。

项目 SDK 版本用 `projectConfig.compileSdkVersion`（minSDK 和 maxSDK 都是同一值，即点范围）。

---

## 7. 开发任务指南

### 7.1 修改告警级别

修改 `getSystemApiCheckConfig`（`:584`）的 `type`。如改为 Error，需同步：
- 消息加 `code#` 前缀：`${ERROR_CODE_INFO.get(SYSTEM_API_TAG_CHECK_WARNING)?.code}#${SYSTEM_API_TAG_CHECK_WARNING}`
- 在 `ERROR_CODE_INFO` 中注册错误码

### 7.2 新增版本范围逻辑

修改 `checkSystemApiValue`（`:1774`）或 `extractVersionRange`（`:477`）。

### 7.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册 `systemapi`
2. 新建 `SystemApiWarningSuppressor`（继承 `BaseWarningSuppressor`）
3. 在 `checkSystemApiValue` 中调用抑制器

---

## 8. 源码索引

| 文件 | 函数 | 职责 |
|------|------|------|
| `api_check_define.ts` | `SYSTEM_API_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `SYSTEM_API_TAG_CHECK_WARNING` | 告警消息 |
| `api_check_utils.ts` | `getSystemApiCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkSystemApiValue` | check 回调 |
| `api_check_utils.ts` | `extractVersionRange` | 版本范围提取 |
| `api_check_utils.ts` | `checkVersionRangeIntersection` | 版本范围相交检查 |