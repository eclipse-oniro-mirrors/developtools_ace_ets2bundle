# 06 - @since 标签校验

> 标签：`@since` | 常量：`SINCE_TAG_NAME` | 错误码：`11706011`
> 校验类型：版本比较（策略模式） | 告警级别：warn/error（可配）

---

## 1. 概述

`@since` 是 JSDoc 标签，标注 API 引入的 SDK 版本。当项目 `compatibleSdkVersion` 低于该版本时，触发兼容性告警。

**校验模式**：版本比较（模式 C）—— 使用 `SinceJSDocChecker`（策略模式）比较 API 要求版本与项目 SDK 版本，并支持多种告警抑制策略。

**与 `@Available` 的区别**：`@since` 是 JSDoc 标签（写在注释里），`@Available` 是装饰器（写在代码里）。两者共用同一告警级别配置 `apiCompatibilityCheck`，但版本提取和格式校验方式不同。

---

## 2. 常量定义

> 来源：`api_check_define.ts`

| 常量 | 值 | 用途 |
|------|----|------|
| `SINCE_TAG_NAME` | `'since'` | 标签名 |
| `SINCE_TAG_CHECK_ERROR` | `'The \'{0}\' API is supported since SDK version $SINCE1. However, the current compatible SDK version is $SINCE2.\n It is recommended to use apiAvailable to safeguard API compatibility.'` | 错误消息模板 |
| `SINCE_LEVEL_WARNING` | `'warn'` | 告警级别配置值 |
| `SINCE_LEVEL_ERROR` | `'error'` | 告警级别配置值 |
| `SINCE_LEVEL_CONFIG` | `Map { 'warn'->Warning, 'error'->Error }` | 级别映射 |

**错误码映射**（`ERROR_CODE_INFO`）：
```
SINCE_TAG_CHECK_ERROR -> { code: '11706011', description: 'The API requires version $ApiVersion or newer.' }
```

**告警抑制注册**：
- `SUPPRESSWARNINGS_RULE_INFO`: `[SINCE_TAG_NAME, 'SuppressWarnings']` — 支持 @SuppressWarnings 注解/注释抑制
- `ANNOTATION_RULE_INFO`: `[SINCE_TAG_NAME, 'SuppressWarningsType.COMPATIBILITY']` — 注解规则类型

---

## 3. 配置构建：getSinceCheckConfig

> 源码：`api_check_utils.ts:601`

```typescript
function getSinceCheckConfig(checkConfigArray: ts.JsDocNodeCheckConfigItem[]): void {
  const diagnosticType: ts.DiagnosticCategory = getSinceDiagnosticType(projectConfig.strictMode?.apiCompatibilityCheck);
  const diagnosticMessage: string = `${ERROR_CODE_INFO.get(SINCE_TAG_CHECK_ERROR)?.code}#${SINCE_TAG_CHECK_ERROR}`;
  const sinceConfig: JsDocNodeCheckConfigItemInterface = {
    tagName: [SINCE_TAG_NAME],
    message: diagnosticMessage,
    type: diagnosticType,            // Warning 或 Error，由配置决定
    tagNameShouldExisted: false,     // 标签不应存在（存在即可能告警）
    checkJsDocSuppressorValidCallback: checkSinceValue
  }
  checkConfigArray.push(getJsDocNodeCheckConfigItem(sinceConfig));
}
```

**告警级别决策函数**（`api_check_utils.ts:2775`）：
```typescript
function getSinceDiagnosticType(sinceErrorLevel?: string): ts.DiagnosticCategory {
  if (!sinceErrorLevel) {
    return ts.DiagnosticCategory.Warning;   // 默认 Warning
  }
  return SINCE_LEVEL_CONFIG.get(sinceErrorLevel) || ts.DiagnosticCategory.Warning;
}
```

**配置来源**：`projectConfig.strictMode?.apiCompatibilityCheck`，来自 `build-profile.json5`：
```json5
{ "app": { "strictMode": { "apiCompatibilityCheck": "error" } } }
```
- `"warn"` → `ts.DiagnosticCategory.Warning`（默认，不阻塞编译）
- `"error"` → `ts.DiagnosticCategory.Error`（阻塞编译）
- 未配置 → Warning

> **注意**：`apiCompatibilityCheck` 同时控制 `@since` 和 `@Available` 两条线（4 个生效点共用 `getSinceDiagnosticType`）。若需独立控制，需拆分配置。

---

## 4. 生效条件

> 源码：`getJsDocNodeCheckConfig`（`api_check_utils.ts:916`）分支四

`@since` 校验在以下条件**全部满足**时添加到校验配置：

1. 声明方文件含 `@Available` → 走分支三（仅 @Available 校验），**不添加 @since**
2. 否则，声明方在 `allModulesPaths` 中或为 ArkUI 依赖 → 进入全量标签分支
3. `sourceBaseName !== AVAILABLE_FILE_NAME`（即不是 `@ohos.annotation.d.ets`）→ 添加 `@since`

```
getJsDocNodeCheckConfig 分支四:
  if (sourceBaseName !== AVAILABLE_FILE_NAME) {
    getSinceCheckConfig(checkConfigArray);   // :951
  }
```

> `@ohos.annotation.d.ets` 是 `@Available` 装饰器的声明文件，其中的 API 不做 @since 校验。

> **重要（互斥分支）**：`@since` 和 `@Available` 在 `getJsDocNodeCheckConfig` 中是**互斥**的。声明方文件含 `@Available` → 走分支三（仅 @Available 校验），**不会添加 @since 校验**。只有不含 `@Available` 的声明方才走分支四（全量标签，含 @since）。修改 @since 逻辑时须注意：含 `@Available` 的 API 不走 @since 校验。详见 `07-available-check.md` §4。

---

## 5. Check 回调：checkSinceValue

> 源码：`api_check_utils.ts:1245`

```typescript
function checkSinceValue(jsDocTags, config, node?, declaration?): boolean
```

**返回值语义**：`true = 需要告警`，`false = 已抑制/无需告警`。

### 5.1 执行流程

```
checkSinceValue(jsDocTags, config, node, declaration)
  │
  ├─ 1. 前置检查（任一不满足则 return false）
  │    ├─ jsDocTags[0]?.parent?.parent 存在（有 JSDoc 节点）
  │    ├─ projectConfig.compatibleSdkVersion 存在
  │    ├─ node 存在
  │    └─ declaration 存在
  │
  ├─ 2. 获取 jsDocNode 和 sourcefile
  │    ├─ jsDocNode = jsDocTags[0].parent.parent
  │    ├─ jsDocNode.jsDoc 存在（否则 return false）
  │    └─ sourcefile.fileName 在 projectRootPath 下（否则 return false）
  │
  ├─ 3. 版本比较
  │    ├─ checker = new SinceJSDocChecker(typeChecker)
  │    └─ hasIncompatibility = checker.checkTargetVersion(jsDocNode)
  │       ├─ parseVersion(jsDocNode) → 提取 @since 版本，设 minApiVersion
  │       └─ compare() → versionCompareFunction(minApiVersion, sdkVersion, Trigger)
  │         返回 !result.result（true=不兼容）
  │
  ├─ 4. 兼容则 return false（不告警）
  │
  ├─ 5. 不兼容 → 告警抑制检查
  │    ├─ suppressor = new SinceWarningSuppressor(sdkVersion, minApiVersion, typeChecker, declaration)
  │    └─ suppressor.isApiVersionHandled(node)
  │       └─ CompositeValidator.validate(node) → 任一 Validator 通过即抑制
  │          ├─ TryCatchValidator
  │          ├─ UndefinedCheckValidator
  │          ├─ WhiteListValidator
  │          ├─ AvailableComparisonValidator
  │          ├─ SdkComparisonValidator
  │          ├─ AnnotateSuppressWarningsValidator
  │          └─ CommentSuppressWarningsValidator
  │
  ├─ 6. 被抑制 → return false（不告警）
  │
  └─ 7. 未抑制 → 填充消息并 return true（需告警）
       ├─ diagnosticType = getSinceDiagnosticType(projectConfig.strictMode?.apiCompatibilityCheck)
       ├─ diagnosticMessage = diagnosticType
       │    ? `${ERROR_CODE_INFO.get(SINCE_TAG_CHECK_ERROR)?.code}#${SINCE_TAG_CHECK_ERROR}`  // Error: 带 code 前缀
       │    : SINCE_TAG_CHECK_ERROR                                                             // Warning: 纯消息
       └─ config.message = diagnosticMessage
            .replace('$SINCE1', checker.getMinApiVersion())   // API 要求版本
            .replace('$SINCE2', checker.getSdkVersion())      // 当前 SDK 版本
```

### 5.2 阻塞编译原理

`ts.DiagnosticCategory` 枚举值：`Warning=0`（falsy）、`Error=1`（truthy）。

```typescript
const diagnosticMessage = diagnosticType
  ? `${code}#${SINCE_TAG_CHECK_ERROR}`   // Error(1,truthy) → 带 11706011# 前缀
  : SINCE_TAG_CHECK_ERROR;               // Warning(0,falsy) → 纯消息
```

带 `code#` 前缀的消息被 hvigor 识别为编译错误并阻塞；纯消息仅告警。

---

## 6. 版本检查器：SinceJSDocChecker

> 源码：`api_checker/since_version_checker.ts`
> 继承：`BaseVersionChecker`（策略模式 + 模板方法）

### 6.1 初始化 init()

```typescript
private init(): void {
  this.sdkVersion = projectConfig.originCompatibleSdkVersion?.toString() ||
                    projectConfig.compatibleSdkVersion.toString();
  this.versionCompareFunction = getValueChecker(SINCE_TAG_NAME);  // 外部插件或默认
  this.versionValidFunction = getFormatChecker(SINCE_TAG_NAME) || defaultFormatCheckerCompatibileIntegerAndMSF;
}
```

- **sdkVersion**：优先用 `originCompatibleSdkVersion`，回退 `compatibleSdkVersion`
- **versionCompareFunction**：从 `getValueChecker('since')` 获取，按 `${runtimeOS}/since` key 查外部插件，回退 `defaultValueChecker`
- **versionValidFunction**：从 `getFormatChecker('since')` 获取，回退 `defaultFormatCheckerCompatibileIntegerAndMSF`

### 6.2 版本提取 parseVersion(node)

```typescript
protected parseVersion(node: ts.Node): boolean {
  // 优先用外部设置的 jsDocTags
  if (this.jsDocTags && this.jsDocTags.length > 0) {
    return this._parseSinceFromTags(this.jsDocTags, node);
  }
  // 否则从 node 的 jsDoc 数组提取
  const jsDocs = node.jsDoc as ts.JSDoc[];
  for (const doc of jsDocs) {
    if (this._parseSinceFromTags(doc.tags, node)) return true;  // 返回第一个 @since
  }
  return false;
}
```

`_parseSinceFromTags`：遍历 tags，找 `tagName === 'since'`，用 `defaultFormatChecker` 校验格式，通过则设 `this.minApiVersion`。

> **格式校验**：`@since` 用 `defaultFormatChecker`（通用格式），支持 `21`、`19.1`、`19.1.2`。不同于 `@Available` 的 `defaultFormatCheckerCompatibileIntegerAndMSF`。

### 6.3 版本比较 compare()

```typescript
protected compare(): boolean {
  const compareResult = this.versionCompareFunction(
    this.minApiVersion,     // API 要求版本
    this.sdkVersion,        // 项目 SDK 版本
    ComparisonSenario.Trigger  // 0 = 生成告警场景
  );
  return !compareResult.result;  // result=true=兼容，!result=true=不兼容
}
```

**defaultValueChecker**（`api_check_utils.ts:1307`）：
```typescript
export function defaultValueChecker(sinceVersion, targetVersion, _triggerScene): VersionValidationResult {
  const triggerResult = comparePointVersion(targetVersion, sinceVersion);
  const isTargetGreaterOrEqual = triggerResult >= 0;  // target >= since = 兼容
  return { result: isTargetGreaterOrEqual, message: ... };
}
```

`comparePointVersion`（`:2154`）：逐段比较 M.S.F，`"21"` → `[21,0,0]`，NaN → Less。

---

## 7. 告警抑制：SinceWarningSuppressor

> 源码：`api_validator/since_warning_suppressor.ts`
> 继承：`BaseWarningSuppressor`（组合模式，任一 Validator 通过即抑制）

### 7.1 构造函数注册的 Validator

```typescript
constructor(projectCompatibleSdkVersion, minRequiredVersion, typeChecker?, declaration?) {
  super(SINCE_TAG_NAME);  // 注册 @SuppressWarnings 注解/注释抑制
  this.validators.addValidator([
    new TryCatchValidator(),
    new UndefinedCheckValidator(),
    new WhiteListValidator(declaration),
    new AvailableComparisonValidator(projectCompatibleSdkVersion, minRequiredVersion, typeChecker),
    new SdkComparisonValidator(projectCompatibleSdkVersion, minRequiredVersion, typeChecker, undefined, declaration)
  ]);
}
```

`super(SINCE_TAG_NAME)` 还会额外注册 `AnnotateSuppressWarningsValidator` 和 `CommentSuppressWarningsValidator`（因为 `SINCE_TAG_NAME` 在 `SUPPRESSWARNINGS_RULE_INFO` 中）。

### 7.2 各 Validator 抑制策略

| Validator | 策略 | 示例 |
|-----------|------|------|
| `TryCatchValidator` | API 调用在 try 块内（且有 catch） | `try { newApi() } catch(e) {}` |
| `UndefinedCheckValidator` | `if (api !== undefined)` 的 then 块内 | `if (newApi !== undefined) { newApi() }` |
| `WhiteListValidator` | API 在 `API_INTERFACE_WHITE_LIST` 允许列表中 | `@arkts.lang.d.ets` 的 `RetentionPolicy` 等 |
| `AvailableComparisonValidator` | 调用点外层 `@Available` 版本 >= API 声明版本 | 父函数 `@Available(26)` 内调用 `@since(24)` API |
| `SdkComparisonValidator` | `if (deviceInfo.sdkApiVersion >= 21)` 守卫内 | 支持 else/卫语句/三元/then 四种形态 |
| `AnnotateSuppressWarningsValidator` | `@SuppressWarnings({rules: [SuppressWarningsType.COMPATIBILITY]})` | 注解形式 |
| `CommentSuppressWarningsValidator` | `// @SuppressWarnings compatibility` | 注释形式 |

### 7.3 守卫形态检测（SdkComparisonValidator）

`SdkComparisonValidator` 通过 `isNodeInGuardPattern`（`api_validate_utils.ts`）检测四种守卫形态：

| 形态 | 示例 |
|------|------|
| else 分支 | `if (!guard) {...} else { api() }` |
| 卫语句 | `if (!guard) { return; } api();` |
| 三元 | `guard ? api() : fallback` |
| then 块 | `if (guard) { api() }`（含 && 链） |

`SdkComparisonHelper`（`api_validate_utils.ts`）支持：
- `isSdkComparisonHelper(expr)`：`deviceInfo.sdkApiVersion >= 21` 等比较
- `isApiAvailableHelper(expr)`：`deviceInfo.apiAvailable('26.0.0')` 调用
- 运算符处理：`>`/`>=`/`<`/`<=`/`==`/`===`/`!=`/`!==`，API 在左/右不同处理

---

## 8. 版本格式

| 格式 | 示例 | 说明 |
|------|------|------|
| 整数 | `21` | 传统版本号（<=25） |
| M.S.F | `5.0.0` | 主.次.特性（>=26.0.0） |
| M.S.F(X) | `5.0.3(22)` | 括号内为实际比较值 |
| OS 前缀 | `OpenHarmony 21` | 带 OS 名称 |

**分界点**：`MSF_INTEGER_VERSION = 26`。整数 <=25，M.S.F >=26.0.0。

**格式校验函数**：
- `defaultFormatChecker`（`:1337`）：通用，主版本 1-999
- `defaultFormatCheckerCompatibileIntegerAndMSF`（`:1355`）：OH 专用，整数或 M.S.F 且 M>=26
- `checkMSFVersionMajor`（`:1380`）：M.S.F 时 M 必须 >= 26
- `checkIntegerMoreVersion`（`:1396`）：整数时必须 < 26

---

## 9. 开发任务指南

### 9.1 修改 @since 告警级别

修改 `getSinceDiagnosticType`（`:2775`）的默认返回值或 `SINCE_LEVEL_CONFIG` 映射。注意 4 个生效点同步：
- `getSinceCheckConfig`（`:602`）— 配置 type
- `checkSinceValue`（`:1284`）— 消息体 code 前缀

### 9.2 修改版本比较逻辑

修改 `defaultValueChecker`（`:1307`）或 `SinceJSDocChecker.compare()`（`since_version_checker.ts:162`）。外部插件通过 `externalApiCheckPlugin` 加载。

### 9.3 新增抑制策略

1. `api_validator/api_validate_node.ts`：新增 Validator，继承 `BaseValidator`，实现 `validate(node)`
2. `since_warning_suppressor.ts` 构造函数中 `addValidator` 注册

### 9.4 修改版本提取

修改 `SinceJSDocChecker._parseSinceFromTags`（`since_version_checker.ts:185`）。

---

## 10. 源码索引

| 文件 | 函数/类 | 职责 |
|------|---------|------|
| `api_check_define.ts` | `SINCE_TAG_NAME` | 标签常量 |
| `api_check_define.ts` | `SINCE_TAG_CHECK_ERROR` | 错误消息模板 |
| `api_check_define.ts` | `ERROR_CODE_INFO` | 错误码 11706011 映射 |
| `api_check_define.ts` | `SINCE_LEVEL_*` | 告警级别配置 |
| `api_check_utils.ts` | `getSinceCheckConfig` | 配置构建 |
| `api_check_utils.ts` | `checkSinceValue` | check 回调 |
| `api_check_utils.ts` | `getSinceDiagnosticType` | 告警级别决策 |
| `api_check_utils.ts` | `defaultValueChecker` | 默认版本比较 |
| `api_check_utils.ts` | `defaultFormatChecker` | 通用格式校验 |
| `api_check_utils.ts` | `comparePointVersion` | 逐段版本比较 |
| `api_checker/since_version_checker.ts` | `SinceJSDocChecker` | @since 版本检查器 |
| `api_checker/base_version_checker.ts` | `BaseVersionChecker` | 抽象基类（模板方法） |
| `api_validator/since_warning_suppressor.ts` | `SinceWarningSuppressor` | @since 告警抑制器 |
| `api_validator/api_validate_node.ts` | `TryCatchValidator` 等 | 7 种抑制策略 |
| `api_validator/api_validate_utils.ts` | `SdkComparisonHelper` | SDK 版本比较辅助 |