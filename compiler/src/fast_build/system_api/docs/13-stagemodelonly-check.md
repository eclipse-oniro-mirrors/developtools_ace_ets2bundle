# 13 - @stagemodelonly 标签校验

> 标签：`@stagemodelonly` / `@StageModelOnly` | 常量：`STAGE_TAG_CHECK_NAME` / `STAGE_TAG_HUMP_CHECK_NAME` | 错误码：`11706009`
> 校验类型：版本范围模式（模式 A） | 告警级别：Error

---

## 1. 概述

`@stagemodelonly`（或驼峰 `@StageModelOnly`）是 JSDoc 标签，标注 API 仅用于 Stage 模型。当项目使用 FA 模型时引用 Stage 专用 API，触发**错误**（阻塞编译）。

```
@stagemodelonly
@StageModelOnly
@stagemodelonly [since 10 - 20]
```

**校验模式**：版本范围模式（模式 A）—— 标签存在表示"限制使用"。

**与 `@famodelonly` 的关系**：两者互斥。Stage 模式下检查 `@famodelonly`，FA 模式下检查 `@stagemodelonly`。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `STAGE_TAG_CHECK_NAME` | `'stagemodelonly'` | 标签名（小写） |
| `STAGE_TAG_HUMP_CHECK_NAME` | `'StageModelOnly'` | 标签名（驼峰） |
| `STAGE_TAG_CHECK_ERROR` | `'This API is used only in Stage Mode, but the current Mode is FA.'` | 错误消息 |
| `STAGE_COMPILE_MODE` | `'moduleJson'` | Stage 模式标识 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
STAGE_TAG_CHECK_ERROR -> { code: '11706009', description: 'Stage model interface used in FA projects.' }
```

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

---

## 3. 配置构建：getStageModuleCheckConfig

> 源码：`api_check_utils.ts:879`

```typescript
function getStageModuleCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(STAGE_TAG_CHECK_ERROR)?.code}#${STAGE_TAG_CHECK_ERROR}`;
  const stageModelOnlyConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [STAGE_TAG_CHECK_NAME, STAGE_TAG_HUMP_CHECK_NAME],   // 两种写法都匹配
    message: diagnosticMessage,                                     // 带 11706009# 前缀
    type: ts.DiagnosticCategory.Error,                              // 固定 Error
    tagNameShouldExisted: false,
    checkJsDocSuppressorValidCallback: checkStageModuleValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(stageModelOnlyConfig));
}
```

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:976-982`）

```typescript
if (process.env.compileMode === STAGE_COMPILE_MODE) {       // Stage 模式
  getFAModuleCheckConfig(checkConfigArray);                   // 检查 @famodelonly
} else if (process.env.compileMode !== '') {                  // FA 模式（非空非 Stage）
  needCheckResult = true;
  getStageModuleCheckConfig(checkConfigArray);                 // :981，检查 @stagemodelonly
}
```

**条件**：`process.env.compileMode !== ''` 且 `!== 'moduleJson'`（当前项目为 **FA 模型**）。

> FA 模型项目使用 Stage 专用 API → 报错。Stage 模型项目使用 Stage 专用 API → 不校验（正常）。

---

## 5. Check 回调：checkStageModuleValue

> 源码：`api_check_utils.ts:1865`

```typescript
export function checkStageModuleValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkStageModuleValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @stagemodelonly 或 @StageModelOnly 标签
  │    jsDocTag = jsDocTags.find(item =>
  │      item.tagName.getText() === 'StageModelOnly' ||
  │      item.tagName.getText() === 'stagemodelonly')
  │    if (!jsDocTag) → return false   // 无标签：不告警
  │
  ├─ 2. 版本范围检查
  │    versionRange = extractVersionRange(jsDocTag.comment)
  │    │
  │    ├─ 有版本范围：
  │    │    return checkVersionRangeIntersection(versionRange)
  │    │    // true = 相交 = 需告警
  │    │
  │    └─ 无版本范围：
         return true   // 有标签 = 需告警
```

逻辑与 `checkFaModelOnlyValue` 完全一致，仅标签名不同。

---

## 6. 版本范围语义

`@stagemodelonly [since 10 - 20]` 表示该 API 在版本 10-20 之间是 Stage 专用。

- 当前 SDK 在范围内（相交）→ 报错
- 当前 SDK 不在范围（不相交）→ 不报错

版本范围函数详见 [10-systemapi-check.md](10-systemapi-check.md) §6。

---

## 7. 阻塞编译原理

消息格式：`11706009#This API is used only in Stage Mode, but the current Mode is FA.`

带 `code#` 前缀 + `type: Error` → hvigor 识别为编译错误，阻塞编译。

---

## 8. fa/stage 互斥逻辑对照

| 项目编译模式 | 检查的标签 | 含义 |
|-------------|-----------|------|
| `moduleJson`（Stage） | `@famodelonly` | Stage 项目不该用 FA 专用 API |
| 非 `moduleJson` 且非空（FA） | `@stagemodelonly` | FA 项目不该用 Stage 专用 API |
| 空字符串 | 都不检查 | 未配置编译模式 |

---

## 9. 开发任务指南

### 7.1 修改编译模式判断

修改 `getJsDocNodeCheckConfig`（`:976-982`）的 `process.env.compileMode` 分支。

### 7.2 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册
2. 新建抑制器
3. 在 `checkStageModuleValue` 中调用

---

## 10. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `STAGE_TAG_CHECK_NAME` | 标签名（小写） |
| `api_check_define.ts` | `STAGE_TAG_HUMP_CHECK_NAME` | 标签名（驼峰） |
| `api_check_define.ts` | `STAGE_TAG_CHECK_ERROR` | 错误消息 |
| `api_check_define.ts` | `STAGE_COMPILE_MODE` | Stage 模式标识 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706009 |
| `api_check_utils.ts` | `getStageModuleCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkStageModuleValue` | check 回调 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件 |