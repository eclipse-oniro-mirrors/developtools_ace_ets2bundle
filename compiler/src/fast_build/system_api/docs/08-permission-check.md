# 08 - @permission 标签校验

> 标签：`@permission` | 常量：`PERMISSION_TAG_CHECK_NAME` | 错误码：无（纯 Warning）
> 校验类型：权限表达式解析（递归求值） | 告警级别：Warning

---

## 1. 概述

`@permission` 是 JSDoc 标签，标注 API 所需的权限。支持 `and`/`or`/括号 组合的权限表达式。

```
@permission ohos.permission.A
@permission ohos.permission.A and ohos.permission.B
@permission (ohos.permission.A or ohos.permission.B) and ohos.permission.C
@permission ohos.permission.X [since 10 - 20]
```

当项目未申请所需权限时，触发告警。

**校验模式**：权限表达式（模式 D）—— 使用 `JsDocCheckService.validPermission` 递归求值权限表达式，支持版本范围限定。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `PERMISSION_TAG_CHECK_NAME` | `'permission'` | 标签名 |
| `PERMISSION_TAG_CHECK_ERROR` | `'To use this API, you need to apply for the permissions: $DT'` | 错误消息模板（`$DT` 为权限列表占位符） |

**错误码**：`PERMISSION_TAG_CHECK_ERROR` **不在** `ERROR_CODE_INFO` 中。该标签为纯 Warning，消息不带 `code#` 前缀，不阻塞编译。

**告警抑制注册**：
- `SUPPRESSWARNINGS_RULE_INFO`: `[PERMISSION_TAG_CHECK_NAME, 'SuppressWarnings']`
- `ANNOTATION_RULE_INFO`: `[PERMISSION_TAG_CHECK_NAME, 'SuppressWarningsType.PERMISSION']`

---

## 3. 配置构建：getPermissionCheckConfig

> 源码：`api_check_utils.ts:654`

```typescript
function getPermissionCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const permissionConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [PERMISSION_TAG_CHECK_NAME],
    message: PERMISSION_TAG_CHECK_ERROR,       // 纯消息，无 code 前缀
    type: ts.DiagnosticCategory.Warning,        // 固定 Warning
    tagNameShouldExisted: false,                // 标签不应存在
    checkJsDocSuppressorValidCallback: checkPermissionValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(permissionConfig));
}
```

**与 @since/@Available 的区别**：
- `type` 固定 `Warning`，不受 `apiCompatibilityCheck` 配置控制
- `message` 是纯消息模板（无 `code#` 前缀）
- 无版本检查器（不用 `BaseVersionChecker`）

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`api_check_utils.ts:916`）分支四

`@permission` 在全量标签分支中**始终添加**（`:965`）：

```typescript
getPermissionCheckConfig(checkConfigArray);   // :965，无条件
```

前提：声明方不含 `@Available`，且在 `allModulesPaths` 中或为 ArkUI 依赖。

---

## 5. Check 回调：checkPermissionValue

> 源码：`api_check_utils.ts:1714`

```typescript
export function checkPermissionValue(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkPermissionValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 过滤出 @permission 标签
  │    permissionTags = jsDocTags.filter(tag => tag.tagName.getText() === 'permission')
  │    如果为空 → return false（不告警）
  │
  ├─ 2. 遍历每个 @permission 标签
  │    for (const permissionTag of permissionTags):
  │    │
  │    ├─ 2a. 提取 comment（字符串或 JSDocComment）
  │    │
  │    ├─ 2b. 版本范围检查
  │    │    versionRange = extractVersionRange(permissionTag.comment)
  │    │    if (versionRange):
  │    │      if (checkVersionRangeIntersection(versionRange)):  // 相交=true
  │    │        comment = comment.replace(/\[since (.*?)\]/, '').trim()  // 去掉版本范围，继续校验
  │    │      else:
  │    │        continue  // 不相交 → 跳过（该权限在当前SDK版本不适用）
  │    │
  │    ├─ 2c. 权限表达式求值
  │    │    if (JsDocCheckService.validPermission(comment, permissionsArray)):
  │    │      continue  // 权限满足 → 跳过
  │    │
  │    ├─ 2d. 权限不满足 → 告警抑制检查
  │    │    suppressor = new PermissionWarningSuppressor()
  │    │    if (suppressor.isApiVersionHandled(node)):
  │    │      continue  // 被抑制 → 跳过
  │    │
  │    └─ 2e. 未抑制 → 收集未满足权限
  │         commentAll += `${comment} and `
  │
  └─ 3. 拼接消息
       if (commentAll !== ''):
         commentAll = PERMISSION_TAG_CHECK_ERROR.replace('$DT', commentAll)
         config.message = commentAll.replace(/\s*and\s*$/, '').trim()  // 去掉末尾 and
         return true（需告警）
       else:
         return false
```

### 5.2 版本范围语义

`@permission ohos.permission.X [since 10 - 20]` 表示该权限要求在 SDK 版本 10-20 之间生效。

- **相交**（当前 SDK 在 10-20 之间）：去掉 `[since 10 - 20]`，继续校验权限是否已申请
- **不相交**（当前 SDK 不在范围）：跳过该权限（`continue`），该权限在当前版本不适用

> `checkVersionRangeIntersection` 返回 `true = 相交`（详见 [14-crossplatform-check.md](14-crossplatform-check.md) §6）。

---

## 6. 权限表达式解析：JsDocCheckService

> 源码：`api_check_permission.ts`

### 6.1 入口

```typescript
static validPermission(comment: string, permissionsArray: string[]): boolean
```

**返回值**：`true = 权限满足`，`false = 权限不满足`。

### 6.2 解析算法

```
validPermission(comment, permissionsArray)
  │
  ├─ STEP1. 分词
  │    按 ' ' 分割 → 按 '(' 分割 → 按 ')' 分割 → 按 '\n' 分割
  │    得到 permissionsQueue（token 数组）
  │
  └─ STEP2. 递归求值
       validPermissionRecursion(permissionsQueue, permissions, calcValidResult)
       │
       ├─ 如果含 '(' 或 ')'：
       │    ├─ groupWithParenthesis(stack) → 括号分组
       │    │    遍历 token，遇到 '(' 开始新组，遇到 ')' 结束组
       │    │    返回 PermissionVaildCalcGroup[]（每组含 subQueue 和 includeParenthesis）
       │    │
       │    ├─ getGroupItemPermission(groups, ...) → 括号组递归求值
       │    │    对每个括号组：递归 validPermissionRecursion(子队列)
       │    │    括号组结果 true → push ''（空，代表通过）
       │    │    括号组结果 false → push 'NA'（代表不通过）
       │    │
       │    └─ getPermissionVaildAtoms(groupJoin, ...) → 原子求值
       │
       └─ 如果不含括号：
            getPermissionVaildAtoms(permissionsQueue, ...) → 直接原子求值
```

### 6.3 原子求值 getPermissionVaildAtoms

递归处理 token 数组，状态机式求值：

| 当前 token | 处理 |
|------------|------|
| `'and'` | 设 currentToken = And，继续下一个 |
| `'or'` | 设 currentToken = Or，继续下一个 |
| 权限名（And 后） | `inValidAndExpression`：前一个不匹配 **或** 当前不匹配 → 整体无效 |
| 权限名（Or 后） | `inValidOrExpression`：前一个不匹配 **且** 当前不匹配 → 整体无效 |
| 权限名（初始） | `validPermissionItem`：`configPermissions.includes(item)` → 匹配 |

**`validPermissionItem`**（`:229`）：
```typescript
private static validPermissionItem(atomStackItem: string, configPermissions: string[]): boolean {
  return atomStackItem === '' || configPermissions.includes(atomStackItem);
}
```
空字符串（括号组通过后 push 的 `''`）视为匹配。

### 6.4 求值示例

```
表达式：(A or B) and C
项目权限：[B, C]

分词：['(', 'A', 'or', 'B', ')', 'and', 'C']
括号分组：[{subQueue:['(','A','or','B',')'], includeParenthesis:true}, {subQueue:['and','C'], includeParenthesis:false}]
括号组递归：['A','or','B'] → A不匹配, B匹配 → Or: 前一个不匹配且当前不匹配? 否(B匹配) → 通过 → push ''
合并：['', 'and', 'C']
原子求值：'' 匹配, and, C 匹配 → 整体匹配 → return true
```

---

## 7. 告警抑制：PermissionWarningSuppressor

> 源码：`api_validator/permission_warning_suppressor.ts`

```typescript
constructor() {
  super(PERMISSION_TAG_CHECK_NAME);  // 仅注册 @SuppressWarnings 注解/注释抑制
}
```

`super(PERMISSION_TAG_CHECK_NAME)` 注册：
- `AnnotateAnimationsModuleValidator`：`@SuppressWarnings({rules: [SuppressWarningsType.PERMISSION]})`
- `CommentSuppressWarningsValidator`：`// @SuppressWarnings permission`

**注意**：PermissionWarningSuppressor **仅支持** @SuppressWarnings 抑制，不支持 TryCatch、UndefinedCheck、SdkComparison 等策略。

| Validator | 策略 |
|-----------|------|
| `AnnotateSuppressWarningsValidator` | `@SuppressWarnings({rules: [SuppressWarningsType.PERMISSION]})` 注解 |
| `CommentSuppressWarningsValidator` | `// @SuppressWarnings permission` 注释 |

---

## 8. 全局状态依赖

| 全局变量 | 用途 |
|----------|------|
| `projectConfig.requestPermissions` | 项目申请的权限列表（`permissionsArray`，`:947` 设置） |
| `projectConfig.compileSdkVersion` | 版本范围比较用（`checkVersionRangeIntersection`） |

**`configurePermission`**（`:1688`）：从配置初始化 `requestPermissions` 和 `definePermissions`，在 etsChecker 插件 `buildStart()` 中调用。

---

## 9. 开发任务指南

### 9.1 修改权限表达式解析

修改 `api_check_permission.ts` 的 `JsDocCheckService.validPermission` 及相关方法。

### 9.2 新增抑制策略

1. `api_validate_node.ts`：新增 Validator
2. `permission_warning_suppressor.ts` 构造函数中 `addValidator` 注册

### 9.3 修改版本范围语义

修改 `checkPermissionValue`（`:1736-1745`）中的版本范围分支。

---

## 10. 源码索引

| 文件 | 函数/类 | 职责 |
|------|---------|------|
| `api_check_define.ts` | `PERMISSION_TAG_CHECK_NAME` | 标签常量 |
| `api_check_define.ts` | `PERMISSION_TAG_CHECK_ERROR` | 错误消息模板 |
| `api_check_utils.ts` | `getPermissionCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkPermissionValue` | check 回调 |
| `api_check_utils.ts` | `configurePermission` | 权限配置初始化 |
| `api_check_permission.ts` | `JsDocCheckService` | 权限表达式解析器 |
| `api_check_permission.ts` | `validPermission` | 入口方法 |
| `api_check_permission.ts` | `groupWithParenthesis` | 括号分组 |
| `api_check_permission.ts` | `getPermissionVaildAtoms` | 原子求值 |
| `api_validator/permission_warning_suppressor.ts` | `PermissionWarningSuppressor` | 告警抑制器 |