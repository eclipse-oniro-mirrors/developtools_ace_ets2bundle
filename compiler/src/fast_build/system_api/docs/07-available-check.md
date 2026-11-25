# 07 - @Available 装饰器校验

> 标签：`@Available` | 常量：`AVAILABLE_TAG_NAME` | 错误码：`11706012`
> 校验类型：版本比较（策略模式，装饰器） | 告警级别：warn/error（可配）

---

## 1. 概述

`@Available` 是 TypeScript 装饰器（不是 JSDoc 标签），标注 API 可用的最小 SDK 版本：

```typescript
@Available({ minApiVersion: "5.0.0" })
function someApi(): void { ... }
```

当项目 `compatibleSdkVersion` 低于该版本时，触发兼容性告警。

**校验模式**：版本比较（模式 C）—— 使用 `AvailableAnnotationChecker`（策略模式）从装饰器提取版本并比较。

**与 `@since` 的区别**：
| 特性 | @since | @Available |
|------|--------|------------|
| 注解类型 | JSDoc 标签（注释） | 装饰器（代码） |
| 格式校验 | 始终用 `defaultFormatChecker` | 支持外部插件 `getFormatChecker('available')` |
| 版本信息 | `string` | `ParsedVersion`（含 OS） |
| 比较函数 | `getValueChecker('since')` | `getValueChecker('available')` |
| 版本层级校验 | 无 | 有（父节点更高版本则报 `AVAILABLE_SCOPE_ERROR`） |
| 告警级别控制 | `apiCompatibilityCheck` | `apiCompatibilityCheck`（共用） |

**关键**：`@Available` 和 `@since` 在 `getJsDocNodeCheckConfig` 中是**互斥分支**。声明方文件含 `@Available` → 走分支三（仅 @Available 校验）；否则走分支四（全量标签，含 @since）。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `AVAILABLE_TAG_NAME` | `'available'` | 标签名 |
| `AVAILABLE_DECORATOR_WARNING` | `'The \'{0}\' API is available since SDK version $SINCE1. However, the current compatible SDK version is $SINCE2.\n It is recommended to use apiAvailable to safeguard API compatibility.'` | 错误消息模板 |
| `AVAILABLE_FILE_NAME` | `'@ohos.annotation.d.ets'` | @Available 装饰器声明文件 |
| `AVAILABLE_VERSION_FORMAT_ERROR_PREFIX` | `'The runtime OS for the current project is $RUNTIMEOS. The OS version number $VERSION is invalid.'` | 版本格式错误 |
| `AVAILABLE_OSNAME_ERROR` | `'The runtime OS for the current project is $RUNTIMEOS. @Available is not supported on the OS: $OSNAME.'` | OS 名称错误 |
| `AVAILABLE_SCOPE_ERROR` | `'Unnecessary. The outer annotation already indicates that the version is greater than or equal to $VERSION.'` | 内层注解不必要 |
| `AVAILABLE_VERSION_FORMAT_ERROR` | OH 版本格式错误说明 | 格式校验失败提示 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
AVAILABLE_DECORATOR_WARNING           -> 11706012
AVAILABLE_VERSION_FORMAT_ERROR_PREFIX -> 11706016
AVAILABLE_OSNAME_ERROR                -> 11706017
```

**告警抑制注册**：
- `SUPPRESSWARNINGS_RULE_INFO`: `[AVAILABLE_TAG_NAME, 'SuppressWarnings']`
- `ANNOTATION_RULE_INFO`: `[AVAILABLE_TAG_NAME, 'SuppressWarningsType.COMPATIBILITY']`

---

## 3. 配置构建：getAvailableCheckConfig

> 源码：`api_check_utils.ts:549`

```typescript
function getAvailableCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticType: ts.DiagnosticCategory = getSinceDiagnosticType(projectConfig.strictMode?.apiCompatibilityCheck);
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(SINCE_TAG_CHECK_ERROR)?.code}#${SINCE_TAG_CHECK_ERROR}`;
  const availableConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [SINCE_TAG_NAME],           // 注意：tagName 用的是 SINCE_TAG_NAME
    message: diagnosticMessage,
    type: diagnosticType,
    tagNameShouldExisted: true,           // 标签应存在
    checkJsDocSuppressorValidCallback: checkAvailableDecorator
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(availableConfig));
}
```

> **注意**：`tagName` 设为 `[SINCE_TAG_NAME]`（`'since'`），但 `tagNameShouldExisted: true`。这与 `@since` 配置（`tagNameShouldExisted: false`）方向相反。实际校验由回调 `checkAvailableDecorator` 决定。

**告警级别**：与 `@since` 共用 `getSinceDiagnosticType`（`:2775`），配置项 `apiCompatibilityCheck`。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`api_check_utils.ts:916`）分支三

`@Available` 校验在以下条件满足时添加：

```typescript
if (checkFileHasAvailableByFileName(sourceFileName)) {
  needCheckResult = true;
  getAvailableCheckConfig(checkConfigArray);   // :945，分支三
} else if (...) {
  // 分支四：全量标签（含 @since，不含 @Available）
}
```

**`checkFileHasAvailableByFileName`**（`:2737`）：判断项目文件内容是否含 `@Available` 装饰器（带缓存 `fileAvailableCheckPlugin`）。非项目文件直接返回 false。

**互斥逻辑**：声明方含 `@Available` → 分支三（仅 @Available）；否则 → 分支四（全量标签含 @since）。两者不会同时生效。

---

## 5. Check 回调：checkAvailableDecorator

> 源码：`api_check_utils.ts:1177`（实际行号以源码为准，约 :1157-:1233）

```typescript
function checkAvailableDecorator(jsDocTags, config, node?, declaration?): boolean
```

### 5.1 执行流程

```
checkAvailableDecorator(jsDocTags, config, node, declaration)
  │
  ├─ 1. 前置检查
  │    ├─ declaration 存在
  │    ├─ declSourcefile.fileName 在 projectRootPath 下
  │    └─ typeChecker = CurrentProcessFile.getChecker()
  │
  ├─ 2. 版本比较
  │    ├─ checker = new AvailableAnnotationChecker(typeChecker)
  │    └─ hasIncompatibility = checker.checkTargetVersion(declaration)
  │       ├─ parseVersion(declaration)
  │       │   ├─ getValidDecoratorFromNode(declaration, isAvailableDecorator)
  │       │   │   → 递归向上查找 @Available 装饰器
  │       │   ├─ extractMinApiFromDecorator(decorator)
  │       │   │   → 提取 minApiVersion，返回 ParsedVersion
  │       │   └─ 设 minApiVersion 和 availableVersion
  │       └─ compare()
  │          ├─ getVersionByValueChecker(availableVersion, versionCompareFunction)
  │          │   → 默认用 .version，外部 checker 用 .formatVersion
  │          └─ versionCompareFunction(minApiVersion, sdkVersion, Trigger)
  │             返回 !result.result（true=不兼容）
  │
  ├─ 3. 兼容则 return false
  │
  ├─ 4. 不兼容 → 告警抑制检查
  │    ├─ suppressor = new AvailableWarningSuppressor(sdkVersion, minApiVersion, availableVersion, typeChecker, declaration)
  │    └─ suppressor.isApiVersionHandled(node)
  │       └─ CompositeValidator.validate(node)
  │          ├─ AvailableComparisonValidator
  │          ├─ SdkComparisonValidator
  │          ├─ AnnotateSuppressWarningsValidator
  │          └─ CommentSuppressWarningsValidator
  │
  ├─ 5. 被抑制 → return false
  │
  └─ 6. 未抑制 → 填充消息并 return true
       ├─ diagnosticType = getSinceDiagnosticType(...)
       ├─ diagnosticMessage = diagnosticType
       │    ? `${ERROR_CODE_INFO.get(AVAILABLE_DECORATOR_WARNING)?.code}#${AVAILABLE_DECORATOR_WARNING}`
       │    : AVAILABLE_DECORATOR_WARNING
       └─ config.message = diagnosticMessage
            .replace('$SINCE1', checker.getAvailableVersion()?.version || checker.getSdkVersion())
            .replace('$SINCE2', checker.getSdkVersion())
```

> **注意**：`checkAvailableDecorator` 用 `AVAILABLE_DECORATOR_WARNING`（错误码 11706012），而 `checkSinceValue` 用 `SINCE_TAG_CHECK_ERROR`（错误码 11706011）。两者的消息模板都用 `$SINCE1`/`$SINCE2` 占位符。

---

## 6. 版本检查器：AvailableAnnotationChecker

> 源码：`api_checker/available_version_checker.ts`
> 继承：`BaseVersionChecker`

### 6.1 初始化 init()

```typescript
private init(): void {
  this.sdkVersion = projectConfig.originCompatibleSdkVersion?.toString() ||
                    projectConfig.compatibleSdkVersion.toString();
  this.versionCompareFunction = getValueChecker(AVAILABLE_TAG_NAME);
  const formatChecker = getFormatChecker(AVAILABLE_TAG_NAME);
  if (formatChecker) {
    this.formatChecker = formatChecker;
    this.versionValidFunction = formatChecker;
  } else {
    this.formatChecker = defaultFormatCheckerCompatibileIntegerAndMSF;
    this.versionValidFunction = defaultFormatCheckerCompatibileIntegerAndMSF;
  }
}
```

与 `SinceJSDocChecker` 的区别：
- valueChecker key 用 `'available'` 而非 `'since'`
- formatChecker 支持外部插件（`@since` 始终用默认）
- 额外保存 `availableVersion: ParsedVersion`（含 OS 信息）

### 6.2 版本提取 parseVersion(node)

```typescript
protected parseVersion(node: ts.Node): boolean {
  const decorator = getValidDecoratorFromNode(node, isAvailableDecorator);  // 递归向上找装饰器
  if (decorator === null) return false;
  const minApi = extractMinApiFromDecorator(decorator);  // 提取 minApiVersion
  if (!minApi) return false;
  this.minApiVersion = minApi.version;
  this.availableVersion = minApi;  // ParsedVersion（含 os）
  return true;
}
```

**`isAvailableDecorator`**（`:2618`）：名为 `Available` + 能提取 `minApiVersion` + 格式校验通过。

**`getValidDecoratorFromNode`**（`:2424`）：递归向上查找节点及父节点的装饰器，支持 `ts.canHaveDecorators` 和 `ts.canHaveIllegalDecorators`。

**`extractMinApiFromDecorator`**（`:2349`）：从 `@Available({minApiVersion: "..."})` 提取版本，返回 `ParsedVersion`。

### 6.3 版本比较 compare()

```typescript
protected compare(): boolean {
  const compareResult = this.versionCompareFunction(
    getVersionByValueChecker(this.availableVersion, this.versionCompareFunction),  // 默认用 .version，外部用 .formatVersion
    this.sdkVersion,
    ComparisonSenario.Trigger
  );
  return !compareResult.result;
}
```

**`getVersionByValueChecker`**（`:2450`）：默认 checker 用 `ParsedVersion.version`，外部 checker 用 `ParsedVersion.formatVersion`。

---

## 7. 版本层级校验

`@Available` 特有的逻辑（`@since` 没有）：

### 7.1 isSourceRetentionAnnotationContentValid（:2473）

校验 `@Available` 装饰器内容：
1. 校验 `minApiVersion` 格式
2. `checkParentVersionHierarchy`：检查父节点是否有更高版本
3. 父节点版本更高 → 返回 `AVAILABLE_SCOPE_ERROR`（内层注解不必要）

### 7.2 checkParentVersionHierarchy（:2513）

```typescript
// 父节点有更高版本的 @Available → 内层 @Available 不必要
hasLargerVersionInParentNode(node) → AVAILABLE_SCOPE_ERROR
```

### 7.3 compareVersions（:2709）

按 OS 选场景比较：
- OpenHarmony → `ComparisonSenario.SuppressByOHVersion`
- 非 OH OS → `ComparisonSenario.SuppressByOtherOSVersion`

### 7.4 声明校验 isSourceRetentionDeclarationValid（:2458）

只允许 `Available` 和 `SuppressWarnings` 注解声明，且必须在 `@ohos.annotation.d.ets` 文件中。

---

## 8. 告警抑制：AvailableWarningSuppressor

> 源码：`api_validator/available_warning_suppressor.ts`

```typescript
constructor(projectCompatibleSdkVersion, minRequiredVersion, minAvailableVersion, typeChecker?, declaration?) {
  super(AVAILABLE_TAG_NAME);  // 注册 @SuppressWarnings 注解/注释抑制
  this.validators.addValidator([
    new AvailableComparisonValidator(projectCompatibleSdkVersion, minRequiredVersion, typeChecker, minAvailableVersion),
    new SdkComparisonValidator(projectCompatibleSdkVersion, minRequiredVersion, typeChecker, minAvailableVersion, declaration)
  ]);
}
```

**与 SinceWarningSuppressor 的区别**：
- **不支持** TryCatchValidator、UndefinedCheckValidator、WhiteListValidator
- AvailableComparisonValidator 额外接收 `minAvailableVersion`（ParsedVersion）
- SdkComparisonValidator 额外接收 `minAvailableVersion`

| Validator | 策略 |
|-----------|------|
| `AvailableComparisonValidator` | 调用点外层 @Available 版本 >= API 声明版本 |
| `SdkComparisonValidator` | `if (deviceInfo.sdkApiVersion >= 21)` 或 `deviceInfo.apiAvailable('26.0.0')` 守卫内 |
| `AnnotateSuppressWarningsValidator` | `@SuppressWarnings({rules: [SuppressWarningsType.COMPATIBILITY]})` |
| `CommentSuppressWarningsValidator` | `// @SuppressWarnings compatibility` |

---

## 9. apiAvailable() 校验

`@Available` 与 `apiAvailable()` 函数相关。`deviceInfo.apiAvailable('26.0.0')` 用于运行时判断 API 是否可用。

### 9.1 语句识别

- `isApiAvailableStatement(node)`（`:2788`）：通过 typeChecker 检查是否为 `deviceInfo.apiAvailable()` 调用
- `isApiAvailableGetTypeOfNodeStatement(node, typeOfNodeFunc)`（`:2850`）：通过外部 typeOfNodeFunc

### 9.2 规范校验 isApiAvailableVersionSpecifications（:2556）

1. `checkApiAvailableCache(node)`（`:2590`）：缓存检查文件是否含 `.apiAvailable`
2. 必须是 CallExpression
3. 必须是 `deviceInfo.apiAvailable`（propertyAccess）
4. 必须有 1 个参数
5. 类型检查通过 `isApiAvailableGetTypeOfNodeStatement`
6. 委托 `validateApiAvailableArgument`（`apiAvailable_validate_utils.ts`）

### 9.3 参数校验规则

> 来源：`api_validator/apiAvailable_validate_utils.ts`

| 参数类型 | OpenHarmony | DistributionOS |
|----------|-------------|----------------|
| 数字 | 十进制整数 1-25 | 非 OH 规则 |
| 字符串 | M.S.F 且 M>=26 | M.S.F 或 M.S.F(X)，M>=26，不允许括号 |

**错误码**：`APIAVAILABLE_CHECK_ERROR` = 11706013。

---

## 10. 开发任务指南

### 10.1 修改 @Available 告警级别

与 @since 共用 `getSinceDiagnosticType`。修改时注意 4 个生效点：
- `getAvailableCheckConfig`（`:550`）
- `checkAvailableDecorator`（`:1226`）

### 10.2 修改版本提取

修改 `extractMinApiFromDecorator`（`:2349`）或 `AvailableAnnotationChecker.parseVersion`。

### 10.3 修改版本层级校验

修改 `isSourceRetentionAnnotationContentValid`（`:2473`）、`checkParentVersionHierarchy`（`:2513`）、`hasLargerVersionInParentNode`（`:2651`）。

### 10.4 新增抑制策略

1. `api_validate_node.ts`：新增 Validator
2. `available_warning_suppressor.ts` 构造函数中 `addValidator` 注册

---

## 11. 源码索引

| 文件 | 函数/类 | 职责 |
|------|---------|------|
| `api_check_define.ts` | `AVAILABLE_TAG_NAME` | 标签常量 |
| `api_check_define.ts` | `AVAILABLE_DECORATOR_WARNING` | 错误消息模板 |
| `api_check_define.ts` | `AVAILABLE_FILE_NAME` | 装饰器声明文件 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706012 映射 |
| `api_check_utils.ts` | `getAvailableCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkAvailableDecorator` | check 回调 |
| `api_check_utils.ts` | `getValidDecoratorFromNode` | 装饰器查找 |
| `api_check_utils.ts` | `extractMinApiFromDecorator` | 版本提取 |
| `api_check_utils.ts` | `getVersionByValueChecker` | 版本选择 |
| `api_check_utils.ts` | `isSourceRetentionAnnotationContentValid` | 内容校验 |
| `api_check_utils.ts` | `checkParentVersionHierarchy` | 版本层级 |
| `api_check_utils.ts` | `isAvailableDecorator` | 装饰器识别 |
| `api_check_utils.ts` | `isApiAvailableVersionSpecifications` | apiAvailable 校验 |
| `api_check_utils.ts` | `checkFileHasAvailableByFileName` | 文件含 @Available 检查 |
| `api_checker/available_version_checker.ts` | `AvailableAnnotationChecker` | 版本检查器 |
| `api_validator/available_warning_suppressor.ts` | `AvailableWarningSuppressor` | 告警抑制器 |
| `api_validator/apiAvailable_validate_utils.ts` | `validateApiAvailableArgument` | apiAvailable 参数校验 |