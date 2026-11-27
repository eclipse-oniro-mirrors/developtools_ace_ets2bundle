# 16 - @atomicservice 标签校验

> 标签：`@atomicservice` | 常量：`ATOMICSERVICE_TAG_CHECK_NAME` | 错误码：`11706010`
> 校验类型：版本范围模式（模式 B） | 告警级别：Error

---

## 1. 概述

`@atomicservice` 是 JSDoc 标签，标注 API 是否支持原子化服务（AtomicService）。在原子化服务项目中使用不支持的 API 时，触发**错误**。

```
@atomicservice
@atomicservice [since 10 - 20]
```

**校验模式**：版本范围模式（模式 B）—— 标签存在表示"支持声明"。

**模式 B 逻辑**：
- 标签不存在 → 告警（API 未声明支持原子化服务）
- 标签存在无版本范围 → 不告警
- 标签存在有版本范围 → 当前 SDK 不在支持范围内才告警

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `ATOMICSERVICE_TAG_CHECK_NAME` | `'atomicservice'` | 标签名 |
| `ATOMICSERVICE_TAG_CHECK_ERROR` | `"'{0}' can't support atomicservice application."` | 错误消息 |
| `ATOMICSERVICE_BUNDLE_TYPE` | `'atomicService'` | 原子化服务 bundle 类型 |
| `ATOMICSERVICE_TAG_CHECK_VERSION` | `11` | 校验生效的最低 SDK 版本 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
ATOMICSERVICE_TAG_CHECK_ERROR -> { code: '11706010', description: "can't support atomicservice application." }
```

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

---

## 3. 配置构建：getAtomicserviceCheckConfig

> 源码：`api_check_utils.ts:897`

```typescript
function getAtomicserviceCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(ATOMICSERVICE_TAG_CHECK_ERROR)?.code}#${ATOMICSERVICE_TAG_CHECK_ERROR}`;
  const atomicserviceConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [ATOMICSERVICE_TAG_CHECK_NAME],
    message: diagnosticMessage,                   // 带 11706010# 前缀
    type: ts.DiagnosticCategory.Error,            // 固定 Error
    tagNameShouldExisted: true,                   // 标签应存在
    checkJsDocSuppressorValidCallback: checkAtomicserviceValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(atomicserviceConfig));
}
```

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:983-987`）

```typescript
if (projectConfig.bundleType === ATOMICSERVICE_BUNDLE_TYPE &&        // 'atomicService'
    projectConfig.compileSdkVersion >= ATOMICSERVICE_TAG_CHECK_VERSION) {  // >= 11
  needCheckResult = true;
  getAtomicserviceCheckConfig(checkConfigArray);   // :986
}
```

**条件**：
1. `projectConfig.bundleType === 'atomicService'`（原子化服务项目）
2. `projectConfig.compileSdkVersion >= 11`（SDK 版本 >= 11）

> SDK 版本低于 11 时不校验（原子化服务校验从 SDK 11 开始支持）。

---

## 5. Check 回调：checkAtomicserviceValue

> 源码：`api_check_utils.ts:1804`

```typescript
export function checkAtomicserviceValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkAtomicserviceValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @atomicservice 标签
  │    jsDocTag = jsDocTags.find(item => item.tagName.getText() === 'atomicservice')
  │
  ├─ 2. 动态修改 tagNameShouldExisted
  │    config.tagNameShouldExisted = !jsDocTag
  │    // 无标签 → true（应存在但不存在 → 报错）
  │    // 有标签 → false
  │
  ├─ 3. 无标签 → return true（需告警）
  │    // API 未声明支持原子化服务 → 报错
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
         return false   // 有标签 = 不告警
```

### 5.2 版本范围语义

`@atomicservice [since 10 - 20]` 表示该 API 在版本 10-20 之间支持原子化服务。

- 当前 SDK 在范围内（相交）→ 不告警
- 当前 SDK 不在范围（不相交）→ 告警

---

## 6. 模式 B 对照

`@atomicservice` 与 `@form`、`@crossplatform` 同属模式 B，逻辑一致：

| 标签 | 生效条件 | 告警级别 | 错误码 |
|------|---------|---------|--------|
| `@form` | `isCardFile(fileName)` | Error | 11706006 |
| `@crossplatform` | `projectConfig.isCrossplatform` | Error/Warning（可配） | 11706007 |
| `@atomicservice` | `bundleType === 'atomicService' && SDK >= 11` | Error | 11706010 |

取反规则说明详见 [14-form-check.md](14-form-check.md) §6。

---

## 7. 阻塞编译原理

消息格式：`11706010#'{0}' can't support atomicservice application.`

带 `code#` 前缀 + `type: Error` → hvigor 识别为编译错误，阻塞编译。

---

## 8. 开发任务指南

### 8.1 修改生效版本

修改 `ATOMICSERVICE_TAG_CHECK_VERSION`（`api_check_define.ts:47`）或 `getJsDocNodeCheckConfig`（`:983`）的条件。

### 8.2 修改告警级别

修改 `getAtomicserviceCheckConfig`（`:897`）的 `type`。

### 8.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册
2. 新建抑制器
3. 在 `checkAtomicserviceValue` 中调用

---

## 9. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `ATOMICSERVICE_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `ATOMICSERVICE_TAG_CHECK_ERROR` | 错误消息 |
| `api_check_define.ts` | `ATOMICSERVICE_BUNDLE_TYPE` | bundle 类型 |
| `api_check_define.ts` | `ATOMICSERVICE_TAG_CHECK_VERSION` | 生效版本 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706010 |
| `api_check_utils.ts` | `getAtomicserviceCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkAtomicserviceValue` | check 回调 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件 |