# Code Quality Review

> 独立记录已通过 Spec Compliance 的实现质量。若 Spec Compliance 未通过，本审查不得给出最终 Approved。

> 前置：`spec-compliance.md` Verdict = Approved（2026-10-29），本审查有效。

## Review Metadata

| Item | Value |
|------|-------|
| Change ID | issue-4719-require-type-check |
| Base / Head | Base = `508b60c80`（fork snapshot detached HEAD）/ Head = `单 commit（Change-Id Ieca81b2）` |
| Reviewed Scope | `单 commit（Change-Id Ieca81b2）` 净 diff：`compiler/src/process_custom_component.ts`（+77，2 hunks 纯插入）、`compiler/src/interop/src/process_custom_component.ts`（+77，纯插入）、`compiler/test/transform_ut/helpers/pathConfig.ts`（+2）、`compiler/test/transform_ut_error.json`（+12）、3 个新测试文件（2 fixture + 1 interop 用例）。合计 7 files, 373 insertions / 0 deletions |
| Reviewer / Date | AI Agent（ohos-review，GLM 5.3）/ 2026-10-29 |

> 提交策略注记（2026-10-29）：审查完成后，被审查代码 commit 与 SDD 文档 commit 应提交策略 squash 为单 commit（Change-Id Ieca81b2）；squash 后 `compiler/` 代码内容与本审查所见逐字节一致，Commit 追溯以 Change-Id 承载。

## Verdict

- [x] Approved
- [ ] Needs Changes
- [ ] Blocked

## Plan Scope vs Actual Code Scope

| Task | Planned Files/Symbols | Actual Files/Symbols | Commit | Deviation | Result |
|------|-----------------------|----------------------|--------|-----------|--------|
| TASK-1 | `compiler/src/process_custom_component.ts:validateRequireParamUndefinedType` + `validateCustomComponentPrams` 挂载行 | 同文件：4 函数（`isTypeIncludingUndefined`/`getStructDeclarationFromComponentUseSite`/`isRequireParamTypeExcludingUndefined`/`validateRequireParamUndefinedType`，:2077-2151）+ 挂载 :1575；无新 import（全部复用文件内既有模块级符号，:90-145 既有 import 覆盖） | `单 commit（Change-Id Ieca81b2）` | 函数签名省略 parentStructInfo（childStructInfo 内部派生）——已登记 execution-plan 偏差表，行为等价由测试覆盖 | PASS |
| TASK-2 | `compiler/src/interop/src/process_custom_component.ts` 镜像 + 挂载行 | 同文件：同 4 函数 :2093-2167 + 挂载 :1591；主/镜像新增块 `diff` 逐行 IDENTICAL（本审查复核） | `单 commit（Change-Id Ieca81b2）` | 无 | PASS |
| TASK-3 | 2 fixture 新建 + pathConfig/transform_ut_error.json 修改 + interop 用例新建 | 与计划一致：2 fixture（V1 正例+5 反例 / V2 正例+反例）、pathConfig :312-313 注册、JSON 追加 2 WARN 条目（274 页 valid）、interop 用例 2 it | `单 commit（Change-Id Ieca81b2）` | interop 用例复用 test.js 轻量驱动而非全管线 mock——已登记偏差表（ark_compiler_ut 无全管线先例，grep 证实；契约要求全部满足） | PASS |

## Findings

| Severity | File:Line | Finding | Impact | Required Fix |
|----------|-----------|---------|--------|--------------|
| Minor | `compiler/test/ark_compiler_ut/interop/process_custom_component.test.ts:77-80` | 用例设置 `process.env.compileTool/compiler/compileMode/rawFileResource` 未在 after() 恢复（after 仅 resetGlobalProgram/resetMain） | 理论上可能影响同 mocha 进程内后续用例；实测全量 interopArkTest 与基线失败名集合 IDENTICAL-19 零漂移，且仓内既有测试（test.js、ut_validate）同样直接改写这些全局不恢复（仓内惯例） | 无强制修复（与仓内惯例一致且实证零漂移）；可选改进：after() 中恢复 env |
| Minor | `.codespec/.../design.md`（ADR-2 附注） | ADR-2 附注"isBuilder 场景下集合为空自动跳过"与实测不符：同文件 @Builder 使用点集合已填充、正常告警（探针 `edge-probe-builder-multi.txt`） | 仅文档措辞不精确；实现行为符合 R-1 字面范围且方向一致（命中即告警），无行为风险 | 非代码修复项；登记开放问题，下次 design.md 触达时修正附注 |

> 无 Blocker / Major 发现。

## Quality Dimensions

| Dimension | Result | Evidence |
|-----------|--------|----------|
| Architecture / layering | PASS | 单点挂载：`validateCustomComponentPrams` 内与既有 3 个 validate*（validateInitDecorator/validateMandatoryToInitViaParam/validateInitParam）并列（主 :1572-1575，镜像 :1588-1591），符合 ADR-2；未触碰插件链/编译模式（ESMODULE/JSBUNDLE 行为均不变，校验在公共传参校验入口）；interop 镜像逐行同步、无跨工具链依赖（compiler↔arkui-plugins 边界未触碰）；src→lib 单向流水线遵守（lib 仅经 build/interopBuild 产出，无手改） |
| Code-fact baseline / existing pattern alignment | PASS | 命名沿用 validate* 家族与 camelCase；WARN 无码推送与既有 private 属性 WARN 先例同构（`validateIllegalInitFromParent` 的 WARN 分支）；undefined 标识符判定与 `api_validate_node.ts:168` 模式一致（ADR-4）；符号解析链与 `process_import.ts getDefinedNode` 先例一致（ADR-1）；name 提取两种风格（escapedText.toString()/getText()）均为文件内高频既有用法（:288/:434/:685 等） |
| Class/interface structure matches approved design | PASS | 4 函数拆分与 design 骨架一一对应（lint max-lines-per-function=50 约束下主函数 40 行）；签名偏差（省略 parentStructInfo，childStructInfo 内部派生）已登记且经 review 复核：调用点唯一、派生来源与 validateInitParam 的 StructInfo 用法同构（:389-391） |
| API / compatibility | PASS | 无 API 变更；新增 WARN 非阻断（LogType.WARN 不进 ERROR 通道，编译继续——Green 运行 transform 正常完成佐证）；存量工程仅新增预期告警（spec 兼容性声明） |
| State ownership / lifecycle / invariants | N/A | 无 STATE-*/INV-*：纯同步编译期诊断、零新增状态；只读消费既有集合（builderParam/prop/regular/state/provideInitialization、paramDecoratorMap）与 `CurrentProcessFile.getChecker()`；log push 走共享诊断通道，owner/清理时机不变 |
| Error handling / concurrency / security | PASS | ADR-6 保守回退全覆盖：checker 缺失/符号不可解析/非 struct 声明/成员未找到/类型不可判定 → 一律不告警正常返回（:2113-2121/:2087-2099/:2101-2110）；可选链空安全（`realSymbol?.declarations?.[0]`、`paramDecoratorInfo?.hasRequire`）；fork `getAliasedSymbol` 对非别名抛 Debug Failure 的坑已用 `SymbolFlags.Alias` 先判规避（:2092-2093）；单线程 transform 无并发面；无用户输入/安全面 |
| Build / generated files | PASS | lib/ 仅经 `npm run build`（114 files）与 `npm run interopBuild`（127 files）产出；declarations/components JSON 零改动；无手改生成物（净 diff 无 lib/declarations/components 路径） |
| Test quality / maintainability | PASS | fixture 遵循既有惯例（license 头、命名、目录、联合类型反例写法）；期望条目与消息模板逐字符对齐；interop 用例经 lib 产物消费（OH-ARCH-LAYERING）+ 断言计数/文案/ERROR=0 三重；Red→Green 成对证明断言非恒真；全量回归零漂移双证明（计数 + 失败名集合 diff）；边界探针补齐 VM 未显式要求的 R-1 逐字段与 @Builder 场景 |

## Conclusion

**Approved。** 优点：插入面极小（2 文件各 +77 纯插入、零删除、零新 import）、与既有校验函数族和诊断惯例完全同构、镜像逐行 IDENTICAL、回退方向保守（零误报优先）、测试断言精确到文案且 Red→Green/基线对照/边界探针三重防伪。

阻塞问题：无。Minor 2 项（测试 env 恢复惯例、design ADR-2 附注措辞）均不阻塞，已登记开放问题。

建议：提交时以单 commit 交付 7 个文件（4 修改 + 3 新增），保持主/镜像改动在同一 commit 内原子同步。
