# check-design — issue-4719-require-type-check（Design 阶段一致性检查）

> 检查时间：2026-10-29；执行：ohos-design（Agent）；profile：`arkui`（owner 约定值；subprofile `toolchain` 无对应文件——O-1 决策保留）。

## 信息检索手段记录

| 手段 | 检索内容 | 结果 |
|---|---|---|
| 源码核对（read/grep） | `validateCustomComponentPrams` 入口/遍历/挂载结构（process_custom_component.ts:1542/:338/:1547-1574） | V1/V2 汇入单一校验入口，三 validate* 并列挂载 |
| 源码核对（read） | V1 @Require 集合（validateInitDecorator:2038-2071，decoratorVariable 五集合并集，validate_ui_syntax.ts:2413-2417 填充）；V2 paramDecoratorMap.hasRequire（validateInitParam:716-746）；ParamDecoratorInfo 定义（process_struct_componentV2.ts:80-83） | 成员判定同源集合确认；V2 集合无类型信息 |
| 源码核对（read） | checker 获取与使用先例：CurrentProcessFile.getChecker（utils.ts:1618-1623）、同文件三处使用（process_custom_component.ts:658/1236/1817） | .ets 走 getLinterTypeChecker；参数节点上 getTypeAtLocation/getSymbolAtLocation 有生产先例 |
| 源码核对（read） | 使用点→声明解析链：getDefinedNode（process_import.ts:790-800）+ :873 isStructDeclaration | getSymbolAtLocation→getAliasedSymbol→declarations[0] 全链先例 |
| 源码核对（read/grep） | 类型别名解析助手 getOriginPropertyType（utils.ts:1583-1603）；显式 undefined 判定模式（api_validate_node.ts:168、apiAvailable_validate_utils.ts:60） | 两项可直接复用的既有实现 |
| 源码核对（grep/read） | interop 镜像自包含性（interop/src/process_custom_component.ts:1558/:340/:667；interop/src/utils.ts:1582/:1608；`from './utils'` 目录内导入） | 镜像逐行平行，须复制式同步 |
| 源码核对（grep） | 插件链顺序（compile_plugin.js:58-60、:71/:73 顺序索引） | etsChecker 先于 etsTransform |
| 源码核对（read） | 测试链路（ut_validate.test.ts:100-140：真实实例化 etsChecker+etsTransform 插件） | checker 在测试环境可用 |
| 存量读取 | 本 change 遗留旧格式 design.md（全文 359 行） | 差异点甄别与处置（见 arkui-design-exit 第 3 行） |

## arkui-design-entry（交叉一致性）

| 检查项 | 结果 | 证据/缺口 | 确认来源 | 后续动作 |
|--------|------|-----------|----------|----------|
| spec.md 规则定义清晰 | 通过 | R-1～R-7（行为/边界）+ 类型判定口径表（9 类）+ 统一消息模板 + VM-1～VM-6 | 源码核对（spec.md 与本 gate 同会话产物） | 无 |
| design.md 分层/对象关系/验证路径/构建影响 | 通过 | 调用链层级分析（7 层，每层修改类型明确）；数据流/控制流 7 步；测试性设计（VM-1～VM-6 ↔ 命令）；构建系统影响（无 GN/bundle 变更） | 源码核对（design.md 各节） | 无 |
| design ↔ spec 交叉一致（API 名称） | 通过 | 两侧 API 均为 N/A（spec API 变更分析三子节 N/A；design「API 签名、Kit 与权限」N/A） | 文档交叉核对 | 无 |
| design ↔ spec 交叉一致（模块边界） | 通过 | spec 架构约束（主链路+interop 镜像同步、WARN 无码）↔ design「涉及仓和模块」与 ADR-5/镜像同步约束一致 | 文档交叉核对 | 无 |
| design ↔ spec 交叉一致（不涉及项） | 通过 | proposal 仅「兼容性」涉及 → spec 兼容性声明 ↔ design「不涉及项承接」设计侧结论一致（非阻断、既有诊断不变、保守回退不输出） | 文档交叉核对 | 无 |
| design ↔ spec 交叉一致（验证映射） | 通过 | spec VM-1～VM-6（etsTest/interopArkTest、Red 条件、通过标准）↔ design 测试性设计同命令同入口同 Red 条件 | 文档交叉核对 | 无 |
| 热路径 Performance & Memory Budget | N/A（有理由） | 编译期静态诊断，不命中 input/layout/render/animation 等运行时热路径（proposal 性能=否；spec 非功能 N/A）；编译耗时影响限于构造传参遍历内的类型判定 | proposal「不涉及项确认」+ spec 非功能性需求节 | 无 |
| 内存分配/释放点与所有权 | N/A（有理由） | TS 工具链单函数新增，无动态内存分配点/所有权变更（非 C++ 原生代码） | 变更性质判定（compiler/src/ TypeScript 源内） | 无 |
| 源码与 SDK 定义一致或差异已声明 | N/A（有理由） | 不涉及 SDK/API/声明文件变更 | proposal「API/SDK=否」 | 无 |
| 存量能力长期 specs 补录（specs/.../Feat-XX-*-spec.md） | N/A（有理由） | 本仓未建立长期 `specs/` 归档体系；FuncID/FeatID TBD（O-2 owner 决策）；无存量长期规格可补录 | 目录核对（`ls specs/` 不存在）；Owner 对话确认（O-2，evidence/checks/check-proposal.md） | 归档体系建立时补齐（manifest 已记 N/A 理由） |
| 功能域 specs/design.md 增量合并 | N/A（有理由） | 同上：无功能域长期 design.md，不存在平行顶层设计风险 | 目录核对 | 同上 |
| P0/P1 AC 映射到 Task 和验证命令 | 通过 | 特性 P1；AC-1.1/1.2/1.6→TASK-1/2（实现+镜像）、AC-1.1～1.5→TASK-3（fixture/断言）；验证命令 `npm run etsTest`/`npm run interopArkTest`（design 测试性设计 + 后续 Task 拆分） | 文档交叉核对 | 无 |
| SpecTest 映射（feature/suite/case/expected/节点 id/命令） | N/A（有理由+替代验证） | 编译期诊断为构建期 mocha 断言，无 Host Preview/Inspector 可断言表面与节点 id；替代验证 = VM-1～VM-6 单测（fixture+期望日志+文案逐字符匹配）；manifest `spectest_feature_path` 已记 N/A | 变更性质判定 + manifest.md | 无 |
| 骨架/状态/类图等条件节触发判定 | 通过 | 类图/状态归属/时序/并发等条件节均未命中触发（单一函数新增、无类层级、无运行时状态），已在 design「可选设计扩展」逐节注明省略理由；安全基础检查按 proposal 安全与权限=N/A 整节省略（skill 规则 9） | design.md 可选设计扩展节 | 无 |

## arkui-design-exit（设计基线核验）

| 检查项 | 结果 | 证据/缺口 | 确认来源 | 后续动作 |
|--------|------|-----------|----------|----------|
| gate 文件包含存量规格读取记录 | 通过 | 已读取本 change 遗留旧格式 design.md（359 行，全文）；读取记录见「信息检索手段记录」末行 | 存量文件读取（.codespec/changes/issue-4719-require-type-check/design.md 旧版，本 gate 同会话读取后被新格式替换） | 无 |
| design.md 关键结论源码核验（路径/API/类名/行为） | 通过 | 代码事实基线 12 项，全部含 `文件:行/符号` 引用并转化为设计约束：校验入口(:1542)、V1/V2 集合同源(:2038-2071/:716-746)、ParamDecoratorInfo(:80-83)、getChecker(:1618-1623)、getOriginPropertyType(:1583)、getDefinedNode(:790-800)、undefined 判定(:168)、镜像自包含(:1558/:340/:667)、插件链(:58-60)、测试链路(:100-140)、问号规则(:161/:499/:521) | 源码核对（各 file:line 见代码事实基线表） | 无 |
| Define 基线与存量设计差异已核验并记录 | 通过 | 三处实质差异及处置：① 遗留设计模块定位指向 process_component_build.ts/decorator_processor.ts/type_checker.ts——后两文件不存在（ls 核验）、真实入口为 process_custom_component.ts:1542（源码核验），新设计以核验事实为准；② 遗留设计 TypeAlias 解析失败默认 non-null（会导致告警）——与已批准 spec R-7（不可判定不告警）相反，按 spec 执行（ADR-6 保守回退）；③ 遗留设计告警文案为 PLACEHOLDER——spec 已定英文模板，ADR-5 落实。遗留 D-001～D-004 决策被 ADR-2/4/5 吸收修正；遗留 RequireTypeCheckContext 数据结构与伪代码归为实现细节，由 ADR-1 真实机制链（getDefinedNode 先例）替代 | 源码核对 + spec.md R-7 + 遗留 design.md 读取 | 无 |
| 每条检查项确认来源标注 | 通过 | 本 gate 两表所有「通过」行均标注 源码核对 path:line / 文档交叉核对 / 存量文件读取 / Owner 对话确认 之一 | 本文件各表 | 无 |
| 未核验项标记检查 | 通过 | 无「通过」结论建立在未核验内容之上；N/A 项均有理由（含替代验证） | 本文件各表 | 无 |

## ohos-design skill 自检（Verification Checklist 结论）

机器项以 validate 结果为准：`--level B` PASS（4/4）；`--level C` 仅剩 `spec→plan`（缺 execution-plan.md，属 ohos-plan 阶段预期）；`spec→design` 与 `design→design-quality` 边均通过。

- 设计决策有备选对比+理由：通过（ADR-1～ADR-6，均含探索过的替代方案与取舍理由）
- design AC ⊆ spec AC：通过（design 仅引用 AC-1.1～AC-1.6 / R-1～R-7 / VM-1～VM-6，全部存在于已批准 spec.md；引擎 spec→design AC 存在性校验通过）
- 分层合规、无跨层违规：通过（调用链层级分析 7 层；校验仅消费 etsChecker 阶段既有 Program）
- 命中条件时代码事实均有文件:行/符号引用且形成设计约束：通过（12 项，引擎 design→design-quality 行级校验通过）
- 既有模式复用或 no prior art 检索结论明确：通过（7 项复用均含 file:line 与关联 Task；无 no-prior-art 项）
- 类图与代码事实、ADR、Task 一致：未命中触发条件（无类/接口层级变化），省略
- 每个 INV-* 关联 AC、Task、验证方式：无 INV-*（未引入状态/不变量），省略
- 风险和开放问题有 Owner：通过（4 项均指定 Owner 并含处理方式）

## 一致性结论

design.md 与已批准上游一致：proposal v1.1（范围/兼容性唯一涉及项/O-3 无码决策）与 spec.md（R-1～R-7 语义、消息模板、VM-1～VM-6 验证映射、API N/A）交叉核对无漂移；类型判定口径表 ↔ ADR-1 checker 判定算法逐项对齐（Any/Unknown/含 undefined 联合/别名→不告警；基本/不含 undefined 联合/类接口枚举字面量/泛型→告警；不可判定→R-7 不告警）。遗留旧格式 design 的三处偏差已按已批准基线纠正并记录。

**Design 审批闭环（2026-10-29）**：用户（本会话需求方/owner）于会话明确回复「批准 Design」。design.md 设计元数据状态已更新为 `Approved`，设计审批结论生效；`.codespec/registry.md` 行状态流转 `Design → Plan`。审批人：用户（本会话需求方）；批准对象：design.md 全量内容（12 项代码事实基线、ADR-1～ADR-6、调用链 7 层分析、7 项模式复用、TASK-1～3 拆分、风险 4 项）。后续进入 ohos-plan 阶段（基于 TASK-1～3 生成 execution-plan.md）。

**批准后回流补充记录（2026-10-29，spec-for-validation 旁路触发）**：进入测试输入旁路时发现 design.md 缺少测试可观察性条件节（playbook「Design 输入约束」回流规则命中：`_design_test_constraints` 在 design.md 无 `## 测试输入约束`/`## 测试交接约束` 节时投影回退提示文本）。按 playbook 规定格式追加 `## 测试输入约束` 节（5 列：AC/可观察表面/测试侧验证方式/环境设备限制/不可自动化项；覆盖 AC-1.1～AC-1.6 全部 6 条，验证方式全部以"构建 ArkTS 应用工程 + 检查构建诊断输出"的用户可见行为表述，不含开发侧自验命令与内部实现引用）。该补充不改变任何已批准设计决策（ADR-1～ADR-6、代码事实基线、Task 拆分均未触碰），仅为测试输入规格补充对外可观察表面；节内容对齐 spec.md AC 原文与 R-1～R-7 语义。补充后复验：`approval-digest` 不变（`e8fc51f2…`，仅 proposal 需求基线参与哈希）、Level B/C 无回归。
