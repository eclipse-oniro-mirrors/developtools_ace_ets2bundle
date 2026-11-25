# 17 - @deprecated 标签校验

> 标签：`@deprecated` | 常量：`DEPRECATED_TAG_CHECK_NAME` | 错误码：无（纯 Warning）
> 校验类型：无回调（标签存在即告警） | 告警级别：Warning

---

## 1. 概述

`@deprecated` 是标准 JSDoc 标签，标注 API 已废弃。使用已废弃 API 时触发告警。

```
@deprecated
@deprecated since 10
```

**校验模式**：无回调（模式 F）—— 这是唯一**没有** `checkJsDocSuppressorValidCallback` 的标签。标签存在即告警，不做版本范围检查，不支持告警抑制。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `DEPRECATED_TAG_CHECK_NAME` | `'deprecated'` | 标签名 |
| `DEPRECATED_TAG_CHECK_WARNING` | `"'{0}' has been deprecated."` | 告警消息 |

**错误码**：**不在** `ERROR_CODE_INFO` 中。纯 Warning。

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。无 check 回调。

---

## 3. 配置构建：getDeprecatedCheckConfig

> 源码：`api_check_utils.ts:568`

```typescript
function getDeprecatedCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const deprecatedConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [DEPRECATED_TAG_CHECK_NAME],
    message: DEPRECATED_TAG_CHECK_WARNING,       // 纯消息，无 code 前缀
    type: ts.DiagnosticCategory.Warning,          // 固定 Warning
    tagNameShouldExisted: false                   // 标签不应存在
    // 注意：没有 checkJsDocSuppressorValidCallback
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(deprecatedConfig));
}
```

> **关键区别**：没有 `checkJsDocSuppressorValidCallback`。tsc 的 `expressionCheckByJsDoc` 在发现 declaration 上有 `@deprecated` 标签且 `tagNameShouldExisted=false` 时，直接生成诊断，不调用任何回调。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:948`）

```typescript
getDeprecatedCheckConfig(checkConfigArray);   // :948，分支四中始终添加
```

在全量标签分支中**始终添加**（第一个添加的标签）。前提：声明方不含 `@Available`，且在 `allModulesPaths` 中或为 ArkUI 依赖。

---

## 5. 校验逻辑

### 5.1 无回调的工作机制

其余标签的校验流程：
```
tsc checkIdentifierJsDoc → expressionCheckByJsDoc → config.checkJsDocSuppressorValidCallback(jsDocTags, ...) → 返回 true/false
```

`@deprecated` 的校验流程：
```
tsc checkIdentifierJsDoc → expressionCheckByJsDoc → 无回调 → 标签存在且 tagNameShouldExisted=false → 直接告警
```

tsc 原生处理 `@deprecated` 标签：当 `tagNameShouldExisted=false` 且 declaration 上有该标签时，tsc 自动生成 Warning 诊断。不需要自定义回调判断。

### 5.2 行为总结

| 条件 | 结果 |
|------|------|
| API 有 `@deprecated` 标签 | 告警（Warning） |
| API 无 `@deprecated` 标签 | 不告警 |
| 版本范围 `[since x - y]` | **不处理**（无回调，忽略版本范围） |
| 告警抑制 | **不支持** |

> `@deprecated` 是最简单的标签：有标签就告警，没有版本范围逻辑，没有抑制策略。

---

## 6. 与其余标签对比

| 特性 | @deprecated | 其余标签 |
|------|------------|---------|
| check 回调 | 无 | 有 |
| 版本范围 | 不支持 | 支持（模式 A/B） |
| 告警抑制 | 不支持 | 部分支持（since/available/syscap/permission） |
| 告警级别 | 固定 Warning | 各异 |
| 错误码 | 无 | 部分有 |

---

## 7. 开发任务指南

### 7.1 修改告警级别

修改 `getDeprecatedCheckConfig`（`:568`）的 `type`。如改为 Error，需：
- 消息加 `code#` 前缀
- 在 `ERROR_CODE_INFO` 中注册错误码

### 7.2 添加 check 回调（如需版本范围或抑制）

1. 在 `getDeprecatedCheckConfig` 中添加 `checkJsDocSuppressorValidCallback`
2. 编写 `checkDeprecatedValue` 回调函数
3. 如需抑制：在 `SUPPRESSWARNINGS_RULE_INFO` 中注册，新建抑制器

---

## 8. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `DEPRECATED_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `DEPRECATED_TAG_CHECK_WARNING` | 告警消息 |
| `api_check_utils.ts` | `getDeprecatedCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件 |