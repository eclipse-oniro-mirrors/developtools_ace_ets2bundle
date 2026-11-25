# AGENTS.md — system_api 模块

本 AGENTS.md 适用于 `compiler/src/fast_build/system_api/` 子目录及其全部子目录。它是 **系统 API 变换 + API 兼容性校验** 子系统的开发规范入口。

## 1. 模块定位

本模块是 ArkTS 编译工具链 Rollup 插件链中的 **apiTransform** 插件（第 6 位），有两条独立业务线：

| 业务线 | 触发方式 | 核心文件 |
|--------|----------|----------|
| 系统 API 变换 | Rollup 插件 hook | `rollup-plugin-system-api.ts` |
| API 兼容性校验 | tsc checker 回调（etsChecker 插件触发） | `api_check_utils.ts`、`api_checker/`、`api_validator/` |

**关键**：校验链路由 etsChecker 插件（第 3 位）的 `buildStart()` 触发，不是由 apiTransform 插件触发。

## 2. 文档路由

本目录的开发规范由仓库内 `docs/` 文档承载（随代码版本管理，团队共享）。修改任何文件前，按下方路由表阅读对应文档。

### 文档索引

| 文档 | 内容 |
|------|------|
| `docs/README.md` | 模块总览、文件结构、调用链路、架构图 |
| `docs/01-plugin-and-transform.md` | 插件入口与系统 API 变换 |
| `docs/02-define-and-permission.md` | 常量定义与权限校验 |
| `docs/03-check-utils.md` | 核心校验工具（getJsDocNodeCheckConfig 全链路） |
| `docs/04-version-checker.md` | 版本检查器（策略模式） |
| `docs/05-warning-suppressor.md` | 告警抑制系统（组合模式） |
| `docs/06-since-check.md` | @since 标签校验（版本比较，warn/error 可配） |
| `docs/07-available-check.md` | @Available 装饰器校验（含 apiAvailable） |
| `docs/08-permission-check.md` | @permission 标签校验（权限表达式解析） |
| `docs/09-syscap-check.md` | @syscap 标签校验（设备能力集 + canIUse） |
| `docs/10-systemapi-check.md` | @systemapi 标签校验（模式 A） |
| `docs/11-test-check.md` | @test 标签校验（模式 A） |
| `docs/12-famodelonly-check.md` | @famodelonly 标签校验（模式 A，Error） |
| `docs/13-stagemodelonly-check.md` | @stagemodelonly 标签校验（模式 A，Error） |
| `docs/14-form-check.md` | @form 标签校验（模式 B，Error） |
| `docs/15-crossplatform-check.md` | @crossplatform 标签校验（模式 B + 外部模块收集） |
| `docs/16-atomicservice-check.md` | @atomicservice 标签校验（模式 B，Error） |
| `docs/17-deprecated-check.md` | @deprecated 标签校验（无回调） |

## 3. 文件结构

```
system_api/
├── rollup-plugin-system-api.ts    # Rollup 插件入口 + 系统 API/libso 变换 + 模块/组件收集
├── api_check_define.ts            # 常量：标签名、错误消息、错误码映射、接口、枚举
├── api_check_permission.ts        # 权限表达式解析器：JsDocCheckService
├── api_check_utils.ts             # 核心工具：配置构建、check 回调、版本比较、插件系统
├── api_checker/                   # 版本检查器（策略模式 + 模板方法）
│   ├── base_version_checker.ts
│   ├── since_version_checker.ts
│   └── available_version_checker.ts
├── api_validator/                 # 告警抑制系统（组合模式）
│   ├── base_warning_suppressor.ts
│   ├── since_warning_suppressor.ts
│   ├── available_warning_suppressor.ts
│   ├── permission_warning_suppressor.ts
│   ├── syscap_warning_suppressor.ts
│   ├── api_validate_node.ts       # 8种 Validator 实现
│   ├── api_validate_utils.ts      # SdkComparisonHelper
│   └── apiAvailable_validate_utils.ts
└── docs/                          # 详细文档（01-05 概览 + 06-17 各标签校验）
```

## 4. 知识路由

### 任务路由
- 修改 `getJsDocNodeCheckConfig` 或 check 回调 -> 阅读 `docs/03-check-utils.md`
- 修改系统 API 变换 -> 阅读 `docs/01-plugin-and-transform.md`
- 修改版本比较/格式校验 -> 阅读 `docs/03-check-utils.md` §3 + `docs/04-version-checker.md`
- 修改告警抑制 -> 阅读 `docs/05-warning-suppressor.md`
- 修改权限表达式解析 -> 阅读 `docs/02-define-and-permission.md` Part B + `docs/08-permission-check.md`
- 新增/修改常量或错误码 -> 阅读 `docs/02-define-and-permission.md` Part A
- 新增校验标签 -> 阅读 `docs/02` + `docs/03`，参考 `docs/10-systemapi-check.md`（模式 A）或 `docs/14-form-check.md`（模式 B）
- 新增告警抑制策略 -> 阅读 `docs/05-warning-suppressor.md`
- 修改某个标签的校验逻辑 -> 阅读该标签对应的 `docs/06-17` 文档（见下方关键词路由表）

### 路径路由
- 修改 `api_check_utils.ts` -> 该文件是核心文件，先阅读 `docs/03-check-utils.md`
- 修改 `api_checker/*.ts` -> 先阅读 `base_version_checker.ts`（抽象基类）+ `docs/04-version-checker.md`
- 修改 `api_validator/*.ts` -> 先阅读 `base_warning_suppressor.ts` 和 `api_validate_node.ts` + `docs/05-warning-suppressor.md`
- 修改 `api_check_define.ts` -> 这是常量和错误码的唯一定义位置，影响全局，先阅读 `docs/02-define-and-permission.md`
- 修改 `rollup-plugin-system-api.ts` -> 注意 ESMODULE vs JSBUNDLE 分支，先阅读 `docs/01-plugin-and-transform.md`
- 修改 `api_check_permission.ts` -> 先阅读 `docs/08-permission-check.md`

### 关键词 -> 文档路由

当任务、issue、日志、API 或变更文件涉及以下关键词时，在规划前阅读对应文档：

| 关键词 | 阅读文档 |
|--------|---------|
| `@since` / `SINCE_TAG` / `checkSinceValue` / `SinceJSDocChecker` / `apiCompatibilityCheck` / `getSinceDiagnosticType` / `SINCE_LEVEL_CONFIG` | `docs/06-since-check.md` |
| `@Available` / `AVAILABLE_TAG` / `checkAvailableDecorator` / `AvailableAnnotationChecker` / `minApiVersion` / `apiAvailable` / `isAvailableDecorator` / `extractMinApiFromDecorator` | `docs/07-available-check.md` |
| `@permission` / `PERMISSION_TAG` / `checkPermissionValue` / `JsDocCheckService` / `validPermission` / `requestPermissions` / `configurePermission` | `docs/08-permission-check.md` |
| `@syscap` / `SYSCAP_TAG` / `checkSyscapAbility` / `syscapIntersectionSet` / `syscapUnionSet` / `canIUse` / `CanIUseValidator` / `externalApiCheckerMap` / `configureSyscapInfo` | `docs/09-syscap-check.md` |
| `@systemapi` / `SYSTEM_API_TAG` / `checkSystemApiValue` | `docs/10-systemapi-check.md` |
| `@test` / `TEST_TAG` / `checkTestValue` / `ohosTest` | `docs/11-test-check.md` |
| `@famodelonly` / `@FAModelOnly` / `FA_TAG` / `checkFaModelOnlyValue` / `moduleJson` / `compileMode` | `docs/12-famodelonly-check.md` |
| `@stagemodelonly` / `@StageModelOnly` / `STAGE_TAG` / `checkStageModuleValue` | `docs/13-stagemodelonly-check.md` |
| `@form` / `FORM_TAG` / `checkFormValue` / `isCardFile` / 卡片 / widget | `docs/14-form-check.md` |
| `@crossplatform` / `CROSSPLATFORM_TAG` / `checkCrossplatformValue` / `crossplatformDepsConfig` / `crossplatformExternalModule` / `ignoreCrossplatformCheck` | `docs/15-crossplatform-check.md` |
| `@atomicservice` / `ATOMICSERVICE_TAG` / `checkAtomicserviceValue` / `atomicService` / `bundleType` | `docs/16-atomicservice-check.md` |
| `@deprecated` / `DEPRECATED_TAG` | `docs/17-deprecated-check.md` |
| `getJsDocNodeCheckConfig` / `getXxxCheckConfig` / `checkXxxValue` | `docs/03-check-utils.md` + 对应标签文档 |
| 版本比较 / `comparePointVersion` / `parseVersionString` / `defaultValueChecker` / `defaultFormatChecker` | `docs/03-check-utils.md` §3 + `docs/04-version-checker.md` |
| `checkVersionRangeIntersection` / `extractVersionRange` / `isVersionRangeIntersect` / 版本范围 | `docs/03-check-utils.md` §2.6 + `docs/10-systemapi-check.md` §6（取反规则说明） |
| 告警抑制 / `BaseWarningSuppressor` / `CompositeValidator` / `TryCatchValidator` / `SdkComparisonValidator` / `@SuppressWarnings` / `SUPPRESSWARNINGS_RULE_INFO` | `docs/05-warning-suppressor.md` |
| `BaseVersionChecker` / `SinceJSDocChecker` / `AvailableAnnotationChecker` | `docs/04-version-checker.md` |
| `ERROR_CODE_INFO` / 错误码 / 11706006-11706017 | `docs/02-define-and-permission.md` |
| `buildErrorDiagnostic` / `sdkBuildErrorInfoFromDiagnostic` / `processDescriptionPlaceholders` / `PLACEHOLDER_HANDLERS` / 诊断构建 / hvigor 错误格式 / `code#` 前缀 / 阻塞编译 | `docs/03-check-utils.md` §9 |

## 5. 约束边界

### 不变量
- `getJsDocNodeCheckConfig` 的参数语义：`fileName` = 引用方（使用 API 的编译文件），`sourceFileName` = 声明方（API 声明所在文件）。JSDoc 标签从声明方读取，校验条件取决于引用方的项目上下文。
- check 回调返回值语义：`true = 需要告警`，`false = 已抑制/无需告警`。**不是** `true = 校验通过`。
- `checkVersionRangeIntersection` 返回 `!isflag`，即**相交**返回 true（注意 `isVersionRangeIntersect` 函数名与返回值语义不一致，其返回 true 表示不相交）。form/crossplatform/atomicservice 回调用 `!checkVersionRangeIntersection()`（不相交才告警），其余回调用 `checkVersionRangeIntersection()`（相交才告警）。详见 `docs/14-form-check.md` §6 取反规则说明。
- **SDK 版本字段对照（禁止混用）**：版本比较（@since/@Available 的 `SinceJSDocChecker`/`AvailableAnnotationChecker`）使用 `projectConfig.originCompatibleSdkVersion || projectConfig.compatibleSdkVersion`；版本范围（@form/@crossplatform 等的 `checkVersionRangeIntersection`）使用 `projectConfig.compileSdkVersion`。两者是**不同的字段**，修改版本比较逻辑时必须确认用的是哪个字段，误用会导致告警阈值错误。
- **@Available 与 @since 互斥**：`getJsDocNodeCheckConfig` 中，声明方含 `@Available` → 分支三（仅 @Available 校验，**不添加 @since**）；不含 → 分支四（全量标签，含 @since，**不含 @Available**）。两者不会同时生效。修改 @since 逻辑时须注意：含 @Available 的 API 不走 @since 校验。详见 `docs/07-available-check.md` §4。
- `BaseWarningSuppressor` 只为 `SUPPRESSWARNINGS_RULE_INFO` 中注册的标签（since/available/syscap/permission）添加 @SuppressWarnings 注解/注释抑制。
- 版本格式分界点 `MSF_INTEGER_VERSION = 26`：整数 <=25，M.S.F >=26.0.0。
- 系统 API 变换：ESMODULE 保留 import 语法仅规范化，JSBUNDLE 替换为 `requireNapi()`。

### 禁止事项
- 禁止直接编辑 `lib/`，必须编辑 `src/` 然后运行 `npm run build`
- 禁止硬编码标签名/装饰器名，必须使用 `api_check_define.ts` 中的常量
- 禁止硬编码错误码，必须使用 `ERROR_CODE_INFO` 映射
- 禁止混淆 ESMODULE 和 JSBUNDLE 变换逻辑
- 禁止在新增校验标签时不更新 `ERROR_CODE_INFO`
- 禁止在新增告警抑制策略时不检查 `SUPPRESSWARNINGS_RULE_INFO` 注册

### 缓存注意事项
- `jsDocNodeCheckConfigCache`：两级缓存（fileName -> sourceFileName -> config）
- `fileAvailableCheckPlugin` / `fileApiAvailableCheckPlugin`：文件级缓存
- `availableNodeCheckConfigCache`：节点级去重（fileName::pos::end）
- `arkuiDependenceMap`：ArkUI 依赖路径缓存
- 修改配置构建逻辑后需确保缓存 key 和失效逻辑正确

## 6. 全局状态依赖

依赖 `main.js` 中的全局可变状态：`projectConfig`、`systemModules`、`extendSdkConfigs`、`ohosSystemModulePaths`、`allModulesPaths`、`crossplatformExternalModule`、`crossplatformDepsConfig`、`externalApiCheckPlugin`、`externalApiCheckerMap`、`fileAvailableCheckPlugin`、`fileApiAvailableCheckPlugin`。

**构建间必须通过 `resetMain()` 重置。**

## 7. 验证闭环

从 `compiler/` 目录执行：
```bash
npm run build    # 构建，生成 lib/
npm run lint     # ESLint 检查
npm test         # 运行测试（UI/transform 回归）
npm run arkTest  # Ark 编译器测试
npm run etsTest  # Transform 测试
```

### 完成定义
- 请求的行为已实现
- `npm run build` 无错误通过
- `npm run lint` 通过
- `npm test` 在受影响区域通过
- 不包含无关的格式化、重构或顺手变更
