# 架构设计

> 确认目标仓和模块的架构约束、关键设计决策、Spec 拆分方向。本变更为简单复杂度（单仓、无新 API、单函数级校验新增），按模板以精简深度填写；`design.md` 为四件套必需件。

## 设计元数据

| 字段 | 内容 |
|------|------|
| Design ID | DESIGN-require-type-check-001 |
| 关联需求 | `proposal.md`（issue-4719-require-type-check，基线 v1.8，Approved） |
| 关联 Epic | 无（独立特性） |
| 目标 Feature | REQ-09-01-01-01（沿用 proposal 需求ID / spec 特性编号） |
| 复杂度 | 简单 |
| 目标版本 | OpenHarmony-7.1-Release（引用 proposal.target_release） |
| Owner | 用户（本会话需求方） |
| 状态 | Approved |

## 需求基线

> 需求基线详见 proposal.md。以下仅列出设计阶段需要额外强调的要点。

| 项 | 补充说明（如需） |
|----|------------------|
| 范围 | 仅 `compiler/` 动态类型工具链，含 `src/interop/src/` 自包含镜像；不涉 arkui-plugins/ |
| 诊断契约 | LogType.WARN、无数字码（O-3）、文案为 spec 固定英文模板、锚点为传参属性节点（传值属性行，如 `字段名: undefined`）——四项均为固定契约，实现不得偏离 |
| 零误报约束 | R-3/R-4/R-5/R-6 反例与 R-7 保守边界（`any`/`unknown` 传入值、空值守卫收窄后传值）一律不告警；判定失败的保守方向是"不输出"（v1.8 传入值侧同向保守） |
| 不阻断 | 不新增 ERROR；既有诊断（10905316/10905321/10905359 及问号规则）行为不变 |

## 上下文和现状

### 涉及仓和模块

| 仓库 | 补充架构说明 |
|------|-------------|
| developtools/ace_ets2bundle（本仓） | 单仓变更。架构约束：① `src/`→`lib/` 单向 Babel 流水线，只能改 `src/`；② `src/interop/src/` 是自包含镜像工具链（目录内相对导入，`interopBuild` 只编译该目录），主链路改动须同步镜像副本，禁止跨目录共享模块；③ Rollup 插件链顺序固定（etsChecker 先于 etsTransform，checker/Program 在变换前创建）；④ compiler 与 arkui-plugins 为并行系统，运行时不得交叉依赖 |

### 代码事实基线

> 本变更涉及既有模块（构造传参校验函数族），条件必填。以下事实均于 2026-10-29 经源码 read/grep 逐一核验。

| 代码引用（文件:行/符号） | 已验证事实 | 关联架构规则 | 对本设计的约束 | 验证来源/可信度 |
|-------------------------|------------|--------------|----------------|-----------------|
| compiler/src/process_custom_component.ts:1542 / validateCustomComponentPrams | 自定义组件构造传参校验唯一入口（V1/V2 汇入，:338 调用）；遍历 node.arguments[0] 对象字面量属性（:1547-1566）后依次调用 validateInitDecorator / validateMandatoryToInitViaParam / validateInitParam（:1572-1574） | 仓内规则（校验逻辑集中于该函数族） | 新校验须作为同级 validate* 独立函数挂入该入口，复用同一入参（node/name/log/parentStructInfo） | 源码 read，高 |
| compiler/src/process_custom_component.ts:2038-2071 / validateInitDecorator | V1 @Require 必传校验：decoratorVariable = 5 个 Initialization 集合并集（builderParam/prop/regular/state/provide，填充于 validate_ui_syntax.ts:2413-2417）；缺失→ERROR 10905359（:2060）；紧随其后的 private 属性 WARN 无 code 字段（:2068-2071） | OH-ARCH-ERROR-LOG | V1 @Require 成员判定复用 decoratorVariable 同源集合；WARN 诊断不带数字码（先例） | 源码 read，高 |
| compiler/src/process_custom_component.ts:716-746 / validateInitParam | V2 必传校验：childStructInfo.paramDecoratorMap（Map&lt;string, ParamDecoratorInfo&gt;）的 hasRequire 成员→缺失 ERROR 10905321（:730-735）；childStructInfo 经 getAliasStructInfo(node) \|\| getOrCreateStructInfo(childName) 获取（:718-719） | OH-ARCH-ERROR-LOG | V2 @Require @Param 成员判定复用 paramDecoratorMap.hasRequire 同源；structInfo 获取方式照抄 | 源码 read，高 |
| compiler/src/process_custom_component.ts:2135-2136（v1.5 触发条件，2026-10-31 复核） | 语法级触发：ts.isIdentifier(initializer) && text === 'undefined'——`void 0`（VoidExpression）与联合类型变量（text ≠ 'undefined'）均不命中，构成 v1.8 缺口 | — | v1.8 替换点：触发条件升级为传入值解析类型含 `undefined` 成员（`undefined` 标识符/`void` 表达式/联合变量均命中；`any`/`unknown` 排除） | 源码 read，高 |
| compiler/src/process_custom_component.ts:2135-2136 / fork TS（compiler/node_modules/typescript）getLinterTypeChecker 类型解析探针（2026-10-31，v1.8 设计前置） | 构造传参各形态经 linter checker 解析：`void 0`/`undefined` 标识符→'undefined'；联合属性引用→'number \| undefined'/'string \| undefined'；`!== undefined` 守卫内引用收窄为 'number'；any 变量→'any'；对象字面量顶层类型不含 undefined | — | 类型级触发可行：收窄豁免成立（流分析生效）、`any` 需谓词显式排除、typeToString 渲染即 got 段文本（探针脚本为临时件未入库，结论由 fixture 固化） | 会话探针实测，高 |
| compiler/src/process_struct_componentV2.ts:80-83 / ParamDecoratorInfo | 仅含 initializer: ts.Expression 与 hasRequire: boolean，无类型信息 | — | 字段声明类型不可从 V2 集合获得，须经 checker 解析 | 源码 read，高 |
| compiler/src/utils.ts:1618-1623 / CurrentProcessFile.getChecker | .ets 文件返回 globalProgram.program.getLinterTypeChecker()，否则 getTypeChecker()；同上下文三处使用先例（process_custom_component.ts:658/1236/1817，均对自定义组件参数节点调用 getTypeAtLocation/getSymbolAtLocation） | OH-ARCH-LAYERING（消费 etsChecker 阶段创建的全局 Program） | 类型判定经此入口取 checker；checker 不可用→跳过校验（保守不告警） | 源码 read，高 |
| compiler/src/utils.ts:1583-1603 / getOriginPropertyType（:1563 isTypeAliasBySymbol） | 已导出的类型别名递归解析助手（visitedTypes 环保护） | — | TypeAlias 判定按需复用该助手（checker 已原生解析时可不调用） | 源码 read，高 |
| compiler/src/process_import.ts:790-800 / getDefinedNode（:873 判定） | 使用点→声明解析既有链：checker.getSymbolAtLocation(usedNode)→getAliasedSymbol→realSymbol.declarations[0]→isStructDeclaration 判断（originNode 为导入结构体原始声明） | 仓内规则（导入符号解析模式） | 子组件 struct 声明定位复用该链（getSymbolAtLocation + getAliasedSymbol + declarations[0]） | 源码 read，高 |
| compiler/src/fast_build/system_api/api_validator/api_validate_node.ts:168（另见 apiAvailable_validate_utils.ts:60） | 显式 undefined 标识符判定既有模式：ts.isIdentifier(node) && node.text === 'undefined' | — | 传值表达式判定采用同一模式（仅顶层 PropertyAssignment.initializer） | 源码 grep，高 |
| compiler/src/interop/src/process_custom_component.ts:1558（调用 :340；getChecker 先例 :667/:1251/:1833）+ interop/src/utils.ts:1582/:1608 | interop 镜像自包含（`from './utils'` 目录内导入），validateCustomComponentPrams/getOriginPropertyType/CurrentProcessFile 与主链路逐行平行 | 仓内规则（interop 镜像同步） | 主链路改动须同步镜像副本；禁止以共享模块替代复制 | 源码 grep/read，高 |
| compiler/compile_plugin.js:58-60（另见 :71/:73 顺序索引） | etsChecker 先于 etsTransform（memoryMonitor→watchChangeFiles→etsChecker→…→etsTransform 固定顺序） | OH-ARCH-COMPONENT-BUILD | checker/Program 在变换前从原始源创建，校验期可用；不改插件链与顺序 | 源码 read（插件数组与顺序索引），高 |
| compiler/test/transform_ut/ut_validate.test.ts:100-140 | 测试链路真实实例化 etsChecker() + etsTransform() 插件（RollUpPluginMock.build），断言 WARN/ERROR 计数与文案 vs test/transform_ut_error.json | 仓内规则（fixture+期望日志测试模式） | VM-1～VM-5 与 VM-7～VM-8 落点 = fixture 页 + helpers/pathConfig.ts UT_VALIDATE_PAGES 注册 + transform_ut_error.json 期望；checker 在测试环境可用（可验证性前提） | 源码 read，高 |
| compiler/src/process_component_member.ts:161（:499/:521 问号处理） | mandatoryToInitViaParamDecorators = {@Prop, @Link, @ObjectLink}，不含 @Require；@Require 与问号组合走既有问号限制规则 | 既有问号限制规则 | 可选类型测试用例须用 `number \| undefined` 联合写法（`@Require @Prop x?: number` 触发既有问号 ERROR，与本特性无关） | 源码 read，高 |

### 调用链层级分析

| 层 | 模块 | 职责 | 修改类型 |
|----|------|------|----------|
| 构建编排层（外部） | compile_plugin.js 插件链 | 固定顺序编排 etsChecker→etsTransform | 不修改 |
| TS 检查层 | src/ets_checker.ts / globalProgram（main.js） | 变换前创建 Program/Checker（原始源） | 不修改（仅消费） |
| UI 变换层 | src/fast_build/ets_ui/rollup-plugin-ets-typescript.ts | 驱动 etsTransform 全量变换 | 不修改 |
| 组件校验层 | src/process_custom_component.ts / validateCustomComponentPrams | 构造传参合法性校验（本变更落点） | 修改 |
| 类型判定 | 同文件新增私有校验函数 + CurrentProcessFile.getChecker | @Require 字段声明类型解析与 undefined 成员判定 | 新增 |
| interop 镜像 | src/interop/src/process_custom_component.ts | 与主链路行为一致的镜像校验 | 修改（同步副本） |
| 测试层 | test/transform_ut/… + test/ark_compiler_ut/interop/ | fixture + 期望日志断言 | 新增用例 |

**检查项：** 调用链每层已覆盖（构建编排→检查→变换→校验→镜像→测试）；每层职责边界清晰，无跨层违规（校验仅消费既有 Program，不新增跨层调用）；每层修改类型明确。

### 适用架构规则

| Rule ID | 适用原因 | 设计结论 | 验证方式 |
|---------|----------|----------|----------|
| OH-ARCH-LAYERING | 校验消费 etsChecker 层创建的 Program/Checker | 调用方向不变（组件校验层→TS 检查层产物），不引入反向或跨层依赖 | 代码评审 |
| OH-ARCH-ERROR-LOG | 新增编译期诊断 | LogType.WARN、无数字码（O-3）、spec 固定英文文案模板、锚点为传参属性节点 | VM-1～VM-5、VM-7～VM-8 单测断言（计数+文案+位置） |
| OH-ARCH-COMPONENT-BUILD | 变更落在 src/ 校验逻辑内 | 不改 BUILD.gn/插件链顺序/构建脚本；lib/ 由 npm run build 再生 | 构建通过（npm run build） |
| OH-ARCH-SUBSYSTEM | 单仓工具链内部 | N/A：无跨子系统调用 | — |
| OH-ARCH-IPC-SAF | 编译期工具链 | N/A：无跨进程/SA | — |
| OH-ARCH-API-LEVEL | 无 API 变更 | N/A（spec API 变更分析三子节均 N/A） | — |

### 既有模式复用

| 模式 | 参考代码（文件:行/符号） | 适用架构规则 | 必须复用的约定 | 本设计的复用方式 | 偏差及理由 | 关联 Task |
|------|-------------------------|--------------|------------------|------------------|------------|-----------|
| WARN 无码诊断推送 | compiler/src/process_custom_component.ts:2068-2071（private 属性 WARN） | OH-ARCH-ERROR-LOG | log.push({ type: LogType.WARN, message, pos })，不写 code 字段 | 直接复用 | 无 | TASK-1 |
| 校验函数挂载 | compiler/src/process_custom_component.ts:1572-1574（validateInitDecorator 等三连调用） | 仓内规则 | validate* 独立函数、validateCustomComponentPrams 内统一调用 | 扩展（新增第四个 validate* 调用） | 无 | TASK-1 |
| 使用点符号解析链 | compiler/src/process_import.ts:792-800（getSymbolAtLocation→getAliasedSymbol→declarations[0]） | 仓内规则 | CurrentProcessFile.getChecker() 获取 checker；解析失败返回空而非抛错 | 组合复用（struct 声明定位→成员声明→类型解析） | 无 | TASK-1 |
| 显式 undefined 标识符判定 | compiler/src/fast_build/system_api/api_validator/api_validate_node.ts:168 | — | ts.isIdentifier(node) && node.text === 'undefined' | v1.5 直接复用；v1.8 演进为类型级判定（解析类型含 `undefined` 成员，`any`/`unknown` 排除），语法级判定被替换 | owner 2026-10-31 确认语法级可绕过（`void 0`/联合变量） | TASK-4 |
| 类型别名解析助手 | compiler/src/utils.ts:1583（getOriginPropertyType） | — | visitedTypes 环保护递归；仅处理 aliasSymbol 场景 | 按需复用（checker 原生解析已覆盖常规场景） | 无 | TASK-1 |
| interop 镜像同步 | compiler/src/interop/src/process_custom_component.ts:1558（平行副本） | 仓内规则（镜像同步） | 逐行镜像改动 + 目录内相对导入，不共享模块 | 直接复用（同一改动复制至镜像文件） | 无 | TASK-2 |
| fixture+期望日志测试 | compiler/test/transform_ut/ut_validate.test.ts:88（ERROR_COLLECTION_PATH）+ compiler/test/transform_ut_error.json:2 + compiler/test/transform_ut/helpers/pathConfig.ts:248（UT_VALIDATE_PAGES） | 仓内规则 | UT_VALIDATE_PAGES 注册 fixture 页；期望 WARN/ERROR 条目登记 JSON；mocha 断言计数与文案 | 扩展（新 fixture 页 + 期望条目 + interop 用例） | 无 | TASK-3 |

## 不涉及项承接

> proposal「不涉及项确认」中仅「兼容性」标记为涉及（下游 spec.md），其余维度均否/N/A。本节给出兼容性的设计侧结论。

| 维度 | 设计结论 |
|------|----------|
| 兼容性 | 新增独立 WARN 诊断通道：不改任何既有诊断的级别/文案/触发条件（10905316/10905321/10905359 与问号规则原样保留）；不新增 ERROR；判定失败的保守路径是"不输出"；存量工程仅表现为新增非阻断告警（proposal 已识别的预期用户感知变化，发布说明缓解） |

## 关键设计决策

> 简单复杂度，按模板可精简为推荐方案+核心备选；本节仍记录关键取舍以约束实现。

| 决策 ID | 问题 | 推荐方案 | 探索过的替代方案 | 取舍理由 | 影响 |
|---------|------|----------|-----------------|------|------|
| ADR-1 | 字段声明类型"不含 undefined"的判定实现方式 | 校验点经 checker 解析：使用点符号解析（getSymbolAtLocation→getAliasedSymbol→declarations[0]）定位子组件 struct 成员声明→checker 取声明类型→undefined 成员判定（Any/Unknown/含 undefined 联合→不告警，其余→告警；TypeAlias 由 checker 原生解析，必要时以 getOriginPropertyType 辅助） | ① 收集期预计算布尔（validate_ui_syntax V1 + process_struct_componentV2 V2 + storedFileInfo 序列化 + 各自镜像）：改动面 4+ 文件×2 工具链，AST 节点不可序列化须预计算，footprint 与简单变更不成比例，放弃；② 纯语法类型节点遍历：无法可靠解析 TypeAlias 与跨文件类型引用，误报风险违背零误报约束（R-6），放弃 | 同文件 3 处 getChecker 先例 + getDefinedNode 全链先例；checker 原生覆盖别名/联合/any/unknown，与 spec 类型判定口径表逐项对齐；单一修改点（校验函数内） | 类型判定精度与 R-6 回退路径；AC-1.1/1.2/1.3 |
| ADR-2 | 校验逻辑插入点 | 新增独立函数（暂名 validateRequireParamUndefinedType），在 validateCustomComponentPrams 中与既有三个 validate* 并列调用 | ① 内联进 :1552 properties.forEach 循环：循环已承载多项职责，混入类型判定增加耦合，放弃；② 扩展 validateInitDecorator：其语义是"必传缺失"（ERROR），混入"传值类型"（WARN）模糊两类行为边界，放弃 | 与既有校验函数族同构；V1/V2 经同一入口天然覆盖（AC-1.1/1.2）；@Builder 内同文件使用点同样进入校验并告警（探针实证，属 R-1 字面范围） | 主链路单点修改；AC-1.1/1.2 |
| ADR-3 | @Require 成员判定来源 | V1：decoratorVariable 同源集合（5 个 Initialization 并集，与 10905359 同源）；V2：paramDecoratorMap.hasRequire（与 10905321 同源） | 直接扫描 struct 成员装饰器文本：独立实现第二套 @Require 识别，可能与既有集合语义漂移（如跨文件 storedFileInfo 合并），放弃 | 与既有必传校验完全同源，行为一致由构造保证 | AC-1.1/1.2/1.4 |
| ADR-4 | 传入值 undefined 判定（v1.8 升级为类型级） | 顶层 PropertyAssignment.initializer 的解析类型含 `undefined` 成员即命中：`undefined` 标识符、`void` 表达式（如 `void 0`）、类型含 `undefined` 的变量/表达式；空值守卫（`!== undefined`）收窄后解析类型不含 `undefined` 不命中；`any`/`unknown`（类型不明）排除。声明类型判定门（含 `undefined`/`any`/`unknown`/不可解析→跳过）保持在前 | ① 语法级判定（isIdentifier && text === 'undefined'，v1.5 方案）：`void 0`（VoidExpression）与联合类型变量可绕过，owner 2026-10-31 确认缺口，放弃；② getText() 字符串比较：受格式/注释影响，放弃；③ 递归检查嵌套对象属性内部：违背 AC-1.5/R-5（仅顶层），放弃 | 探针实证（fork linter checker）：收窄豁免成立（流分析生效）、typeToString 渲染即 got 段（`undefined`/联合文本）、`any` 排除守住零误报（与声明侧 R-6 同向保守）；Shorthand/Spread/Method 等非 PropertyAssignment 形态自然排除 | AC-1.6 正例 + AC-1.5 零误报；VM-7/VM-8 |
| ADR-5 | 诊断输出契约 | log.push({ type: LogType.WARN, message: spec 固定英文模板（paramName 插值）, pos: item.getStart() })，无 code 字段 | 锚定整个 CallExpression（10905359 风格）：spec R-1 已固定为传参属性节点锚点（`字段名: undefined` 行），放弃 | O-3 无码决策 + spec 消息模板为固定契约；属性级锚点定位更精确 | VM-1～VM-5、VM-7～VM-8 的文案/计数断言（interop 用例附加覆盖） |
| ADR-6 | 判定失败的回退方向 | checker 不可用 / 符号不可解析 / 成员找不到 / 类型不可判定（含 v1.8 传入值类型不明即 `any`/`unknown`） → 一律不告警并正常返回 | ① 此时仍告警：违背 R-6 零误报约束，放弃；② 输出内部错误/断言：将工具链内部不确定性暴露为用户可见错误，不可取 | 保守方向与 spec R-6/R-3（any/unknown/不可判定不告警）及 R-7 传入值侧边界一致 | 极端构建模式下静默；正例路径由 VM 用例证明可用性 |

## 设计骨架

### 骨架范围

| 骨架项 | 目标 | 不包含 | 验证方式 |
|--------|------|--------|----------|
| 校验函数骨架（主+镜像） | 函数签名、集合判定、undefined 传值判定（v1.8 类型级）、诊断推送骨架可编译 | 类型判定的全部边界分支 | npm run build 通过 |
| 测试骨架 | fixture 页 + pathConfig 注册 + 期望条目占位 | 全部反例矩阵 | npm run etsTest 可运行（Red） |

### 骨架 Spec 拆分

简单复杂度：不设独立骨架 Task，骨架随 TASK-1/TASK-3（v1.8 扩展随 TASK-4）一并落地；红绿转换由 VM-1～VM-5 与 VM-7～VM-8 的 Red 条件（实现前 0 告警 vs 期望条数 → mocha 断言失败）承载。

## 后续 Task 拆分

| Task ID | 目标 | 受影响文件 | 依赖 |
|---------|------|------------|------|
| TASK-1 | 主链路实现：新增校验函数（@Require 成员判定 + 显式 undefined 判定 + checker 类型判定 + WARN 推送）并挂入 validateCustomComponentPrams | compiler/src/process_custom_component.ts（必要时 compiler/src/utils.ts 增加判定助手） | design.md + spec.md Approved |
| TASK-2 | interop 镜像同步：同一改动复制到镜像副本并保持行为一致 | compiler/src/interop/src/process_custom_component.ts（必要时 interop/src/utils.ts） | TASK-1 完成 |
| TASK-3 | 测试落地：fixture 页（V1/V2/反例矩阵）+ pathConfig 注册 + transform_ut_error.json 期望 + interop 用例；运行 etsTest/interopArkTest 回归 | compiler/test/transform_ut/application/.../utForValidate/Decorators/process_custom_component/（新 fixture）、compiler/test/transform_ut/helpers/pathConfig.ts、compiler/test/transform_ut_error.json、compiler/test/ark_compiler_ut/interop/（新用例） | TASK-1/TASK-2 完成 |
| TASK-4 | v1.8 类型级触发扩展：主链与镜像触发条件替换（语法级→类型级，新增传入值 undefined 判定助手、`any`/`unknown` 排除、收窄豁免）+ Extension fixture 2 页（V1 含收窄/any 反例、V2 同正例集）+ pathConfig/transform_ut_error.json 登记 + interop 新增 2 用例（多 WARN 精确断言）；Red→Green 回归，既有 2 页零改动 | compiler/src/process_custom_component.ts、compiler/src/interop/src/process_custom_component.ts、compiler/test/transform_ut/application/.../process_custom_component/（新 2 fixture）、compiler/test/transform_ut/helpers/pathConfig.ts、compiler/test/transform_ut_error.json、compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts | TASK-1/TASK-2/TASK-3 完成 + v1.8 基线（proposal/spec）Approved |

## API 签名、Kit 与权限

### 新增 API

N/A：无新增 API（spec「API 变更分析」三子节均 N/A；编译期诊断，无对外接口）。

### 变更/废弃 API

N/A：不变更、不废弃任何 API。

## 构建系统影响

### BUILD.gn 变更

```
文件路径: 无
变更说明: 不涉及。变更仅在 compiler/src/ TypeScript 源内；lib/ 由既有 npm run build 流水线再生
```

### bundle.json 变更

无：不新增 component、不修改依赖关系。

## 测试输入约束

> 本节为测试输入旁路（spec-for-validation）提供各验收标准的可观察表面与测试侧验证输入；仅描述工具链对外可见的构建诊断行为。

| AC | 可观察表面 | 测试侧验证方式 | 环境/设备限制 | 不可自动化项 |
|---|---|---|---|---|
| AC-1.1 | 应用工程构建输出中的 1 条 WARNING 级别诊断：无数字错误码，文案为 spec 消息模板固定英文文案（`${paramName}` 为被传字段名），行列定位在构造传参对象中该字段的传值属性行（`字段名: undefined` 所在行）；编译继续完成、无新增 ERROR | 构建（编译）包含 V1 组件（`@Component`）构造传参对象的 ArkTS 应用工程：对象中向 `@Require` 修饰（单独或与 `@Prop`、`@State`、`@Provide`、`@BuilderParam` 组合，有无默认值不限）且声明类型不含 `undefined` 的字段显式传入 `undefined` 标识符；检查构建输出：该字段输出恰 1 条 WARNING，级别/文案/定位逐项核对，且编译不失败 | 需可运行的 ArkTS 应用工程与配套编译工具链（IDE 或命令行构建均可）；无需真机/模拟器（纯构建期行为） | 无 |
| AC-1.2 | 同 AC-1.1 的 WARNING（级别、文案、定位规则一致），场景为 V2 组件（`@ComponentV2`） | 构建（编译）包含 V2 组件构造传参对象的 ArkTS 应用工程：对象中向 `@Require` 与 `@Param` 共同修饰且声明类型不含 `undefined` 的字段显式传入 `undefined`；检查构建输出：恰 1 条与 AC-1.1 同级别、同文案的 WARNING，且编译不失败 | 同 AC-1.1 | 无 |
| AC-1.3 | 构建输出不出现本特性告警（既有行为不变） | 构建（编译）含以下 `@Require` 字段场景的 ArkTS 应用工程并检查输出不含本特性告警：① 声明类型含 `undefined`（`number` 与 `undefined` 的联合类型、可选属性等价形式）；② 类型为 `any` 或 `unknown`；均显式传入 `undefined` | 同 AC-1.1 | 无 |
| AC-1.4 | 构建输出不出现本特性告警 | 构建（编译）含"无 `@Require` 修饰的字段显式传入 `undefined`"场景的 ArkTS 应用工程；检查构建输出不含本特性告警 | 同 AC-1.1 | 无 |
| AC-1.5 | 构建输出不出现本特性告警 | 构建（编译）构造传参字段值不是 `undefined` 标识符且解析类型不含 `undefined` 的场景（普通变量/表达式传值、联合类型变量经空值守卫收窄后传值、对象字面量嵌套属性内部出现 `undefined`、`any`/`unknown` 动态类型值）；检查构建输出不含本特性告警 | 同 AC-1.1 | 无 |
| AC-1.6 | 应用工程构建输出中的 1 条 WARNING：同 AC-1.1 契约（级别/文案模板/无数字码/属性级定位），`${actualType}` 为传入值解析类型文本（`undefined` 标识符与 `void 0` 渲染为 `undefined`，联合类型变量渲染为该联合类型的类型文本，如 `number` 与 `undefined` 的联合类型）；编译继续完成、无新增 ERROR | 构建（编译）含 V1/V2 组件向 `@Require` 修饰且声明类型不含 `undefined` 的字段传入 `void 0` 或类型含 `undefined` 的变量/表达式的 ArkTS 应用工程；检查构建输出：每命中字段恰 1 条 WARNING 且 got 段与解析类型一致，编译不失败 | 同 AC-1.1 | 无 |

---

## 可选设计扩展

> 按模板条件触发逐节评估：**数据流/控制流**与**测试性设计**命中触发条件（本特性的核心流程与验证策略）展开如下；**架构图**（无跨模块依赖）、**类图**（无类/接口层级变化，单一函数新增）、**时序设计**（无 API/IPC/异步链）、**数据模型**（无数据结构/持久化）、**状态归属与不变量**（无运行时状态/缓存/并发，不引入 STATE-*/INV-*）、**算法与状态机**（无状态机）、**异常传播时序图**（无跨层调用）、**资源所有权矩阵**（无动态资源）、**接口参数规约**（无 API 变更）、**线程与并发模型**（单线程同步校验）、**安全基础检查**（proposal 安全与权限=N/A，整节省略）、**深度威胁分析**（无高风险判据命中）均按触发条件省略。

### 数据流/控制流

| 步骤 | 调用方 | 被调用方 | 数据/接口 | 说明 |
|------|--------|----------|-----------|------|
| 1 | validateCustomComponentPrams | 新校验函数 | node/name/log/parentStructInfo | 构造传参校验入口统一分派（与既有三个 validate* 并列） |
| 2 | 新校验函数 | 既有集合（V1）/ StructInfo（V2） | decoratorVariable / paramDecoratorMap.hasRequire | 识别 @Require 成员（与 10905359/10905321 同源） |
| 3 | 新校验函数 | 传入值 undefined 判定（v1.8 类型级） | 解析类型含 `undefined` 成员（`undefined` 标识符/`void` 表达式/联合变量；`any`/`unknown` 排除、收窄后不命中） | 仅顶层 PropertyAssignment.initializer 命中进入步骤 4 |
| 4 | 新校验函数 | CurrentProcessFile.getChecker → getSymbolAtLocation → getAliasedSymbol → declarations[0] | 使用点标识符→struct 声明 | 任一步失败→不告警返回（ADR-6） |
| 5 | 新校验函数 | checker 类型解析 | struct 成员声明→声明类型 | 定位与字段名匹配的 PropertyDeclaration |
| 6 | 新校验函数 | undefined 成员判定 | ts.Type（flags/union members/别名经 checker 解析） | 声明类型 Any/Unknown/含 undefined→跳过；否则对传入值解析类型判 `undefined` 成员（v1.8）：命中输出 WARN，got 段为传入值解析类型文本 |
| 7 | 新校验函数 | log.push | { type: LogType.WARN, message: 固定模板, pos: item.getStart() } | 无 code 字段（O-3）；每命中字段 1 条 |

### 测试性设计

| 测试层级 | 测试目标 | Mock 策略 | 验证方式 |
|----------|----------|-----------|----------|
| 单元测试（transform 校验回归） | AC-1.1～AC-1.6：V1/V2 既有正例页各输出恰 1 条 WARN、v1.8 Extension 页各恰 2 条 WARN，文案逐字符匹配；反例（含 undefined 类型/any 声明、无 @Require、非 undefined 标识符/嵌套对象/类型不含 undefined 的变量、收窄后联合变量、`any` 动态值）0 条 | 无 Mock：真实 etsChecker+etsTransform 插件链（RollUpPluginMock），期望日志登记 transform_ut_error.json | `cd compiler && npm run etsTest`（Red：实现前正例期望 1 条 vs 实际 0 条，mocha 断言失败；v1.8 Extension 页：期望 2 条 vs 实际 0 条） |
| 单元测试（interop 变体，附加覆盖） | interop 镜像输出与主链路一致的同文案 WARN（仓内架构铁律，非 AC 验收项） | 无 Mock：interopBuild 先编译 src/interop/src 入 lib/ | `cd compiler && npm run interopArkTest`（Red：镜像无此告警逻辑，断言失败） |
| 回归 | 既有诊断不变（10905xxx ERROR 计数、问号规则、@BuilderParam 等） | 同上 | 同上两命令的整体通过（期望计数不含本告警之外的漂移） |

## 风险和开放问题

| 项 | 类型 | 影响 | 处理方式 | Owner |
|----|------|------|----------|-------|
| 跨文件子组件符号解析在个别构建模式（旧 webpack 链路）下 checker 可用性未逐一验证 | 技术 | 中 | ADR-6 保守回退（不告警）；VM 用例覆盖 rollup esmodule 主链路与 interop；若实测存在大规模回退再评估收集期方案（ADR-1 备选①） | 用户（本会话需求方） |
| fork checker（getLinterTypeChecker）对 struct PropertyDeclaration 的类型返回行为需实现期实证 | 技术 | 低 | v1.8 已探针实证（`void 0`/联合/收窄/any 的解析与渲染）；TASK-4 fixture 复证；异常时回退 getOriginPropertyType/类型节点路径（ADR-1 已记录备选） | 用户（本会话需求方） |
| 存量工程新增告警的用户感知 | 兼容 | 低 | WARNING 非阻断（proposal 已识别，v1.8 扩展含 `void 0`/联合变量场景）；诊断文案含修正指引；发布说明同步 | 用户（本会话需求方） |
| interop 镜像与主链路漂移 | 技术 | 低 | TASK-2 强制同步（仓内架构铁律）+ interop 回归用例锁定行为一致（附加覆盖） | 用户（本会话需求方） |
| v1.8 类型级触发对既有 fixture 的漂移面 | 技术 | 低 | 已四轮源码排查（`void 0` 在 fixture 源码零使用；联合/可选类型变量不流入 @Require 构造参数）；TASK-4 Green 全量 etsTest 精确期望断言兜底 | 用户（本会话需求方） |

## 设计审批

- [x] 需求基线已确认，设计覆盖 P0/P1 AC（本特性 P1；AC-1.1～AC-1.6 全覆盖：ADR-1/2→AC-1.1/1.2，ADR-3→AC-1.4，ADR-4→AC-1.5/AC-1.6（v1.8 类型级触发），类型判定口径→AC-1.3；interop 镜像同步为仓内架构铁律，由 TASK-2 承载非 AC 项；v1.8 扩展由 TASK-4 承载）
- [x] 不涉及项已承接，N/A 和展开项都有结论（仅兼容性涉及，设计侧结论见「不涉及项承接」）
- [x] 涉及仓和模块职责清楚（单仓两文件族+测试，见「涉及仓和模块」）
- [x] 调用链层级分析完整，每层覆盖到位（构建编排→检查→变换→校验→镜像→测试）
- [x] 涉及既有实现时，代码事实基线使用文件:行/符号引用，且每项事实已转化为设计约束（12 项，均含设计约束列）
- [x] 已检索并记录既有模式复用；无 prior art 时有检索范围和理由（7 项复用，全部有 file:line 引用）
- [x] 适用架构规则已识别并形成设计结论（LAYERING/ERROR-LOG/COMPONENT-BUILD 适用，其余 N/A 附理由）
- [x] 分层和子系统边界合规（校验仅消费既有 Program，无跨层/跨子系统调用）
- [x] 命中类/接口关系触发条件时，类图与代码事实、ADR、Task 一致（未命中触发条件：单一函数新增，无类/接口层级变化，省略）
- [x] 涉及状态/资源/并发时，状态 Owner 唯一，生命周期、恢复和锁/消息模型无冲突（未命中触发条件：无运行时状态/资源/并发，省略）
- [x] 每项 INV-* 均关联 AC、Task 和可执行验证方式（无 INV-*：未引入状态不变量）
- [x] API 变更有签名、权限、错误码和兼容性说明（无 API 变更，N/A 附理由）
- [x] BUILD.gn/bundle.json 影响明确（均无变更，附说明）
- [x] 设计输出和后续 Task 拆分明确（TASK-1/2/3，含受影响文件与依赖）
- [x] 关键设计决策有理由和影响说明（ADR-1～ADR-6，均含备选与取舍）
- [x] 风险和开放问题有 Owner（4 项，均指定 Owner）

**结论:** 通过（用户于 2026-10-29 批准 Design；审批记录见 evidence/checks/check-design.md 一致性结论。v1.8 修订（2026-10-31）：ADR-4 升级为类型级触发、新增 TASK-4 与 VM-7/VM-8 测试输入、代码事实基线补 2 项，经 owner 会话批准 v1.8 方案与文档链先行后同步）
