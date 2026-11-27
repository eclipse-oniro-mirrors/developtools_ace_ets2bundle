# 12 - @famodelonly 标签校验

> 标签：`@famodelonly` / `@FAModelOnly` | 常量：`FA_TAG_CHECK_NAME` / `FA_TAG_HUMP_CHECK_NAME` | 错误码：`11706008`
> 校验类型：版本范围模式（模式 A） | 告警级别：Error

---

## 1. 概述

`@famodelonly`（或驼峰 `@FAModelOnly`）是 JSDoc 标签，标注 API 仅用于 FA（Feature Ability）模型。当项目使用 Stage 模型时引用 FA 专用 API，触发**错误**（阻塞编译）。

```
@famodelonly
@FAModelOnly
@famodelonly [since 10 - 20]
```

**校验模式**：版本范围模式（模式 A）—— 标签存在表示"限制使用"。

**与 `@stagemodelonly` 的关系**：两者互斥。Stage 模式下检查 `@famodelonly`，FA 模式下检查 `@stagemodelonly`。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `FA_TAG_CHECK_NAME` | `'famodelonly'` | 标签名（小写） |
| `FA_TAG_HUMP_CHECK_NAME` | `'FAModelOnly'` | 标签名（驼峰） |
| `FA_TAG_CHECK_ERROR` | `'This API is used only in FA Mode, but the current Mode is Stage.'` | 错误消息 |
| `STAGE_COMPILE_MODE` | `'moduleJson'` | Stage 模式标识 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
FA_TAG_CHECK_ERROR -> { code: '11706008', description: 'FA model interface used in Stage projects.' }
```

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

> **注意**：该标签为 **Error** 级别（`type: ts.DiagnosticCategory.Error`），消息带 `code#` 前缀，阻塞编译。不支持告警抑制。

---

## 3. 配置构建：getFAModuleCheckConfig

> 源码：`api_check_utils.ts:861`

```typescript
function getFAModuleCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(FA_TAG_CHECK_ERROR)?.code}#${FA_TAG_CHECK_ERROR}`;
  const faModelOnlyConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [FA_TAG_CHECK_NAME, FA_TAG_HUMP_CHECK_NAME],   // 两种写法都匹配
    message: diagnosticMessage,                               // 带 11706008# 前缀
    type: ts.DiagnosticCategory.Error,                        // 固定 Error
    tagNameShouldExisted: false,
    checkJsDocSuppressorValidCallback: checkFaModelOnlyValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(faModelOnlyConfig));
}
```

> **两种标签名**：`tagName` 数组含 `FA_TAG_CHECK_NAME`（`'famodelonly'`）和 `FA_TAG_HUMP_CHECK_NAME`（`'FAModelOnly'`），两种写法都识别。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:976-978`）

```typescript
if (process.env.compileMode === STAGE_COMPILE_MODE) {   // 'moduleJson'
  needCheckResult = true;
  getFAModuleCheckConfig(checkConfigArray);              // :978
}
```

**条件**：`process.env.compileMode === 'moduleJson'`（当前项目为 **Stage 模型**）。

> Stage 模型项目使用 FA 专用 API → 报错。FA 模型项目使用 FA 专用 API → 不校验（正常）。

---

## 5. Check 回调：checkFaModelOnlyValue

> 源码：`api_check_utils.ts:1834`

```typescript
export function checkFaModelOnlyValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkFaModelOnlyValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @famodelonly 或 @FAModelOnly 标签
  │    jsDocTag = jsDocTags.find(item =>
  │      item.tagName.getText() === 'FAModelOnly' ||
  │      item.tagName.getText() === 'famodelonly')
  │    if (!jsDocTag) → return false   // 无标签：不告警
  │
  ├─ 2. 版本范围检查
  │    versionRange = extractVersionRange(jsDocTag.comment)
  │    │
  │    ├─ 有版本范围：
  │    │    return checkVersionRangeIntersection(versionRange)
  │    │    // true = 相交 = 需告警（当前SDK在范围内，FA专用API在当前版本生效）
  │    │
  │    └─ 无版本范围：
         return true   // 有标签 = 需告警
```

### 5.2 版本范围语义

`@famodelonly [since 10 - 20]` 表示该 API 在版本 10-20 之间是 FA 专用。

- 当前 SDK 在范围内（相交）→ 报错
- 当前 SDK 不在范围（不相交）→ 不报错（该版本下非 FA 专用）

---

## 6. 阻塞编译原理

消息格式：`11706008#This API is used only in FA Mode, but the current Mode is Stage.`

带 `code#` 前缀的消息被 hvigor 识别为编译错误并阻塞。`type: ts.DiagnosticCategory.Error` 确保诊断级别为 Error。

---

## 7. 开发任务指南

### 7.1 修改编译模式判断

修改 `getJsDocNodeCheckConfig`（`:976`）的 `process.env.compileMode` 判断条件。

### 7.2 新增标签别名

在 `FA_TAG_CHECK_NAME` / `FA_TAG_HUMP_CHECK_NAME` 常量中添加，并更新 `tagName` 数组和回调中的 `find` 条件。

### 7.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册
2. 新建抑制器
3. 在 `checkFaModelOnlyValue` 中调用

---

## 8. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `FA_TAG_CHECK_NAME` | 标签名（小写） |
| `api_check_define.ts` | `FA_TAG_HUMP_CHECK_NAME` | 标签名（驼峰） |
| `api_check_define.ts` | `FA_TAG_CHECK_ERROR` | 错误消息 |
| `api_check_define.ts` | `STAGE_COMPILE_MODE` | Stage 模式标识 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706008 |
| `api_check_utils.ts` | `getFAModuleCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkFaModelOnlyValue` | check 回调 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件 |