# 15 - @crossplatform 标签校验

> 标签：`@crossplatform` | 常量：`CROSSPLATFORM_TAG_CHECK_NAME` | 错误码：`11706007`
> 校验类型：版本范围模式（模式 B）+ 外部模块收集 | 告警级别：Error/Warning（可配）

---

## 1. 概述

`@crossplatform` 是 JSDoc 标签，标注 API 是否支持跨平台。在跨平台项目中使用不支持跨平台的 API 时，触发告警（默认 Error）。

```
@crossplatform
@crossplatform [since 10 - 20]
```

**校验模式**：版本范围模式（模式 B）+ 外部模块/组件依赖收集。

**特有逻辑**（其余模式 B 标签没有）：
- 告警级别可通过 `ignoreCrossplatformCheck` 配置为 Warning
- 有 `crossplatformDepsConfig` 时，按 API 路径收集外部模块/组件依赖

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `CROSSPLATFORM_TAG_CHECK_NAME` | `'crossplatform'` | 标签名 |
| `CROSSPLATFORM_TAG_CHECK_ERROR` | `"'{0}' can't support crossplatform application."` | 错误消息 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
CROSSPLATFORM_TAG_CHECK_ERROR -> { code: '11706007', description: "can't support crossplatform application." }
```

**告警抑制**：**不在** `SUPPRESSWARNINGS_RULE_INFO` 中。无专门抑制器。

---

## 3. 配置构建：getCrossplatformCheckConfig

> 源码：`api_check_utils.ts:690`

```typescript
function getCrossplatformCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[], logType: ts.DiagnosticCategory): void {
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(CROSSPLATFORM_TAG_CHECK_ERROR)?.code}#${CROSSPLATFORM_TAG_CHECK_ERROR}`;
  const crossplatformConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [CROSSPLATFORM_TAG_CHECK_NAME],
    message: diagnosticMessage,                   // 带 11706007# 前缀
    type: logType,                                 // Error 或 Warning，由调用方传入
    tagNameShouldExisted: true,
    checkJsDocSuppressorValidCallback: checkCrossplatformValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(crossplatformConfig));
}
```

> **注意**：`type` 是参数 `logType`，由 `getJsDocNodeCheckConfig` 调用时传入，这是唯一一个告警级别可动态配置的模式 B 标签。

---

## 4. 生效条件与告警级别

> 源码：`getJsDocNodeCheckConfig`（`:970-975`）

```typescript
if (projectConfig.isCrossplatform) {
  needCheckResult = true;
  const logType: ts.DiagnosticCategory = projectConfig.ignoreCrossplatformCheck !== true
    ? ts.DiagnosticCategory.Error      // 默认 Error
    : ts.DiagnosticCategory.Warning;   // ignoreCrossplatformCheck=true 时 Warning
  getCrossplatformCheckConfig(checkConfigArray, logType);
}
```

**条件**：`projectConfig.isCrossplatform` 为 true（跨平台项目）。

**告警级别**：
- `ignoreCrossplatformCheck !== true`（默认）→ **Error**（阻塞编译）
- `ignoreCrossplatformCheck === true` → **Warning**（仅告警）

---

## 5. Check 回调：checkCrossplatformValue

> 源码：`api_check_utils.ts:708`

```typescript
function checkCrossplatformValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkCrossplatformValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 基础版本范围检查
  │    mergingCommentHandle = checkCrossplatformValueMerge(jsDocTags, config, node, declaration)
  │    // 返回模式 B 的标准结果（见 §5.2）
  │
  ├─ 2. 外部模块收集（如有 crossplatformDepsConfig）
  │    if (!crossplatformDepsConfig):
  │      return mergingCommentHandle   // 无依赖配置，直接返回基础结果
  │    │
  │    ├─ apiFileName = path.basename(declaration.getSourceFile().fileName)
  │    │                 .replace(/\.d\.(ts|ets)$/, '')
  │    ├─ depsConfig = crossplatformDepsConfig.get(apiFileName)
  │    │    if (!depsConfig) → return mergingCommentHandle  // 该文件无依赖配置
  │    │
  │    ├─ functionKey = getApiPathFromNode(declaration)  // API 路径（# 拼接）
  │    ├─ 遍历 depsConfig，匹配 functionKey
  │    │    if (configInner.function === functionKey):
  │    │      collectCrossplatformExternalModule(node, configInner)  // 收集外部模块/组件
  │    │      return mergingCommentHandle
  │    │
  │    └─ return mergingCommentHandle
  │
  └─ 3. 返回基础结果（mergingCommentHandle）
```

> **关键**：外部模块收集**不影响**告警结果（`mergingCommentHandle` 始终是基础版本范围的判断）。收集的依赖信息写入全局 `crossplatformExternalModule`，供后续打包使用。

### 5.2 基础版本范围检查：checkCrossplatformValueMerge

> 源码：`api_check_utils.ts:1896`

```typescript
export function checkCrossplatformValueMerge(jsDocTags, config, node?, declaration?): boolean
```

标准模式 B 逻辑：

```
checkCrossplatformValueMerge(jsDocTags, config, node, declaration)
  │
  ├─ 1. 查找 @crossplatform 标签
  │    jsDocTag = jsDocTags.find(item => item.tagName.getText() === 'crossplatform')
  │
  ├─ 2. 动态修改 tagNameShouldExisted
  │    config.tagNameShouldExisted = !jsDocTag
  │
  ├─ 3. 无标签 → return true（需告警）
  │
  └─ 4. 有标签 → 版本范围检查
       versionRange = extractVersionRange(jsDocTag.comment)
       ├─ 有版本范围：return !checkVersionRangeIntersection(versionRange)  // 不相交=告警
       └─ 无版本范围：return false   // 不告警
```

---

## 6. 外部模块收集

### 6.1 getApiPathFromNode（:775）

从 declaration 向上遍历 AST，用 `#` 拼接 API 路径：

```typescript
function getApiPathFromNode(declaration: ts.Node): string {
  const pathParts: string[] = [];
  let currentNode = declaration;
  while (currentNode && !ts.isSourceFile(currentNode) && API_NODE_KIND.has(currentNode.kind)) {
    const name = getApiNodeName(currentNode);
    if (name) pathParts.unshift(name);
    currentNode = currentNode.parent;
  }
  return pathParts.join('#');
}
```

**示例**：`@ohos.network.d.ts` 中 `NetworkInfo.getConnectionInfo()` → 路径 `NetworkInfo#getConnectionInfo`。

**API_NODE_KIND**（:832）：支持的节点类型集合（MethodDeclaration、FunctionDeclaration、ClassDeclaration、InterfaceDeclaration 等）。

### 6.2 collectCrossplatformExternalModule（:740）

```typescript
function collectCrossplatformExternalModule(node: ts.Node, config: CrossplatformConfig): void
```

将匹配到的外部模块/组件依赖收集到全局 `crossplatformExternalModule: Map<filePath, {module, component}>`。

**CrossplatformConfig**（:702）：
```typescript
interface CrossplatformConfig {
  function: string;      // API 路径（用于匹配）
  module: string[];      // 外部模块依赖
  component: string[];   // 外部组件依赖
}
```

---

## 7. 全局状态依赖

| 全局变量 | 用途 |
|----------|------|
| `projectConfig.isCrossplatform` | 是否跨平台项目 |
| `projectConfig.ignoreCrossplatformCheck` | 是否忽略跨平台检查（true→Warning） |
| `crossplatformDepsConfig` | 跨平台依赖配置：`Map<apiFileName, CrossplatformConfig[]>` |
| `crossplatformExternalModule` | 收集的外部模块/组件依赖：`Map<filePath, {module, component}>` |

---

## 8. 开发任务指南

### 8.1 修改告警级别

修改 `getJsDocNodeCheckConfig`（`:972-973`）的 `logType` 逻辑。

### 8.2 修改外部模块收集

修改 `collectCrossplatformExternalModule`（`:740`）或 `getApiPathFromNode`（`:775`）。

### 8.3 新增抑制策略

1. 在 `SUPPRESSWARNINGS_RULE_INFO` 和 `ANNOTATION_RULE_INFO` 中注册
2. 新建抑制器
3. 在 `checkCrossplatformValue` 或 `checkCrossplatformValueMerge` 中调用

---

## 9. 源码索引

| 文件 | 函数/常量 | 职责 |
|------|-----------|------|
| `api_check_define.ts` | `CROSSPLATFORM_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `CROSSPLATFORM_TAG_CHECK_ERROR` | 错误消息 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706007 |
| `api_check_utils.ts` | `getCrossplatformCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkCrossplatformValue` | check 回调（含外部模块收集） |
| `api_check_utils.ts` | `checkCrossplatformValueMerge` | 基础版本范围检查 |
| `api_check_utils.ts` | `collectCrossplatformExternalModule` | 外部模块收集 |
| `api_check_utils.ts` | `getApiPathFromNode` | API 路径提取 |
| `api_check_utils.ts` | `getJsDocNodeCheckConfig` | 生效条件与告警级别 |