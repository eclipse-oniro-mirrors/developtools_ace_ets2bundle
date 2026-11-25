# 11 - @test 标签校验

> 标签：`@test` | 常量：`TEST_TAG_CHECK_NAME` | 错误码：无（纯 Warning）
> 校验类型：版本范围模式（模式 A） | 告警级别：Warning

---

## 1. 概述

`@test` 是 JSDoc 标签，标注 API 仅用于测试。在非测试目录中使用测试 API 时触发告警。

```
@test
@test [since 10 - 20]
```

**校验模式**：版本范围模式（模式 A）—— 标签存在表示"限制使用"。

**模式 A 逻辑**：
- 标签不存在 → 不告警
- 标签存在无版本范围 → 告警
- 标签存在有版本范围 → 当前 SDK 在范围内才告警

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `TEST_TAG_CHECK_NAME` | `'test'` | 标签名 |
| `TEST_TAG_CHECK_ERROR` | `"'{0}' can only be used for testing directories "` | 告警消息 |

**错误码**：**不在** `ERROR_CODE_INFO` 中。纯 Warning。

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

---

## 3. 配置构建：getTestCheckConfig

> 源码：`api_check_utils.ts:637`

```typescript
function getTestCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const testConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [TEST_TAG_CHECK_NAME],
    message: TEST_TAG_CHECK_ERROR,                // 纯消息
    type: ts.DiagnosticCategory.Warning,           // 固定 Warning
    tagNameShouldExisted: false,
    checkJsDocSuppressorValidCallback: checkTestValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(testConfig));
}
```

> 注意：常量名是 `TEST_TAG_CHECK_ERROR`，但 `type` 是 `Warning`（命名不一致，属历史遗留）。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`:957-963`）

```typescript
if (projectConfig.projectRootPath && projectConfig.modulePath) {
  const ohosTestDir = ts.sys.resolvePath(path.join(projectConfig.modulePath, 'src', 'ohosTest'));
  if (!ts.sys.resolvePath(fileName).startsWith(ohosTestDir)) {
    getTestCheckConfig(checkConfigArray);   // :962，引用方不在 ohosTest 目录时添加
  }
}
```

**条件**：
1. `projectConfig.projectRootPath` 和 `projectConfig.modulePath` 存在
2. **引用方文件**（`fileName`）不在 `src/ohosTest` 目录下

> 在 ohosTest 目录内使用 @test API 不告警（测试目录内允许使用测试 API）。

---

## 5. Check 回调：checkTestValue

> 源码：`api_check_utils.ts:1962`

```typescript
export function checkTestValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkTestValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @test 标签
  │    jsDocTag = jsDocTags.find(item => item.tagName.getText() === 'test')
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

> **注意**：`checkTestValue` **没有** `config.tagNameShouldExisted = !jsDocTag` 这行（不同于模式 B 的 form/crossplatform/atomicservice）。因为 test 的配置 `tagNameShouldExisted=false`（标签不应存在），不需要动态修改。

---

## 6. 版本范围语义

`@test [since 10 - 20]` 表示该 API 在版本 10-20 之间是测试 API。

- 当前 SDK 在范围内（相交）→ 告警
- 当前 SDK 不在范围（不相交）→ 不告警

版本范围函数详见 [10-systemapi-check.md](10-systemapi-check.md) §6。

---

## 7. 开发任务指南

### 7.1 修改测试目录判断

修改 `getJsDocNodeCheckConfig`（`:957-963`）中的 `ohosTestDir` 路径逻辑。

### 7.2 修改告警级别

修改 `getTestCheckConfig`（`:637`）的 `type`。

### 7.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册 `test`
2. 新建抑制器
3. 在 `checkTestValue` 中调用

---

## 8. 源码索引

| 文件 | 函数 | 职责 |
|------|------|------|
| `api_check_define.ts` | `TEST_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `TEST_TAG_CHECK_ERROR` | 告警消息 |
| `api_check_utils.ts` | `getTestCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkTestValue` | check 回调 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件（ohosTest 目录判断） |