# Spec Compliance Review

> 独立记录实现对 `spec.md` 的逐 AC 符合性。不得用代码质量结论替代规格符合性结论。

## Review Metadata

| Item | Value |
|------|-------|
| Change ID | issue-4719-require-type-check |
| Spec Revision | `spec.md` md5 `18389cfede968245190cc3346fa877bd`（状态 Approved） |
| Plan Revision | `execution-plan.md` md5 `af4d3c2368b988d0db79edaa4a9533b7`（回填完成态） |
| Base / Head | Base = `508b60c80`（fork snapshot detached HEAD）/ Head = `单 commit（Change-Id Ieca81b2）`，diff 为纯插入 +77 行/文件 ×2（`git diff` 仅 2 hunks，无删除行） |
| Reviewer / Date | AI Agent（ohos-review，GLM 5.3）/ 2026-10-29 |

> 提交策略注记（2026-10-29）：审查完成后，被审查代码 commit 与 SDD 文档 commit 应提交策略 squash 为单 commit（Change-Id Ieca81b2）；squash 后 `compiler/` 代码内容与本审查所见逐字节一致，Commit 追溯以 Change-Id 承载。

## Verdict

- [x] Approved
- [ ] Needs Changes
- [ ] Blocked

> 批准条件见 Conclusion；Commit 已回填（`单 commit（Change-Id Ieca81b2）`，开放问题 #1 已处置）。

## AC → Task → Code → Commit → Review

> 行号基于提交源文件（`单 commit（Change-Id Ieca81b2）`）：主链路挂载 `:1575`、函数块 `:2077-2151`；镜像挂载 `:1591`、函数块 `:2093-2167`（主/镜像新增块 diff 逐行 IDENTICAL）。所有 Code Ref 均经本审查逐行核对源码。

| AC | Task | Code Ref | Commit | Verification Evidence | Result | Gap |
|----|------|----------|--------|-----------------------|--------|-----|
| AC-1（proposal，对应 AC-1.1） | TASK-1, TASK-3 | `compiler/src/process_custom_component.ts`：`validateRequireParamUndefinedType`（:2112-2151）+ 挂载 `:1575`；V1 判定 `decoratorVariable` 五集合并集（:2124-2130，与 10905359 同源） | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final；`code-quality.md`#mirror-sync | PASS | 无 |
| AC-1.1 | TASK-1, TASK-3 | 同上：顶层 undefined 判定 :2132-2134（`isPropertyAssignment && isIdentifier(initializer) && text==='undefined'`）；WARN 推送 :2144-2149（LogType.WARN、无 code 字段、`pos: item.getStart()` 属性级锚点） | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final（fixture `validateRequireParamUndefinedType`：正例 `require_value` 恰 1 WARN、文案逐字符一致、ERROR=0、编译完成）；#edge-probe（多命中字段 first_value/second_value 各 1 条、third_value 联合类型 0 条） | PASS | 无 |
| AC-1.2 | TASK-1, TASK-3 | 同上：childStructInfo 派生 :2122-2123（getAliasStructInfo 失败回退 getOrCreateStructInfo）+ `paramDecoratorMap.get(paramName)?.hasRequire`（:2137-2138，与 10905321 同源） | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final（fixture `validateRequireParamUndefinedTypeV2`：`@Require @Param require_param_value` 恰 1 WARN 同文案） | PASS | 无 |
| AC-1.3 | TASK-1, TASK-3 | `isTypeIncludingUndefined`（:2077-2085）：Any/Unknown flags → 含 undefined；联合类型 `types.some(Undefined flag)`；符号链不可解析回退（`getStructDeclarationFromComponentUseSite` :2087-2099 返回 undefined → 主函数 :2117-2121 早退；成员未找到 → :2101-2110 返回 false） | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final（反例 union_value（number 与 undefined 联合）、any_value（any）均 0 条） | PASS | 无 |
| AC-1.4 | TASK-1, TASK-3 | :2138 守卫（hasRequire 与 decoratorVariable 双条件，任一命中才进入类型判定）——两者均否 → 跳过 | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final（反例 no_require_value（V1 plain）、plain_param_value（V2 @Param 无 @Require）均 0 条） | PASS | 无 |
| AC-1.5 | TASK-1, TASK-3 | :2132-2134 守卫——仅顶层 `PropertyAssignment.initializer` 为 `undefined` **标识符**进入判定；forEach 仅遍历传参对象顶层属性（:2131），不递归 | `单 commit（Change-Id Ieca81b2）` | `verification.md`#etsTest-final（反例 variable_value=`this.numValue`（变量传值）、nested_value=`{ inner_value: undefined }`（嵌套对象内部）均 0 条） | PASS | 无 |
| AC-1.6 | TASK-2, TASK-3 | `compiler/src/interop/src/process_custom_component.ts`：同 4 函数 :2093-2167 + 挂载 :1591；与主链路新增块 diff IDENTICAL | `单 commit（Change-Id Ieca81b2）` | `verification.md`#interopArkTest-final（interop 用例经 `require('../../../lib/...')` 消费 interopBuild 产物：2/2 PASS，WARN 计数=1、文案与主链路逐字符一致、ERROR=0） | PASS | 无 |
| AC-6（proposal，对应 AC-1.6） | TASK-2, TASK-3 | 同 AC-1.6 | `单 commit（Change-Id Ieca81b2）` | 同上 | PASS | 无 |

## Extra Implementation

| Extra Behavior | File:Line | Risk | Required Action |
|----------------|-----------|------|-----------------|
| 无超出 Spec/Plan 声明的行为。说明：@Builder 函数内的自定义组件构造传 undefined 同样告警（探针实证，`edge-probe-builder-multi.txt` builder_use_site 场景）——经核对 R-1 触发条件为"构造传参对象中"未限定 build() 方法内，属规格字面范围内行为，非 Extra（详见 Interpretation Deviations） | `compiler/src/process_custom_component.ts:2131-2149` | 无（规格内） | Accept（无需动作） |

## Interpretation Deviations

| Topic | Spec Says | Implementation Does | Required Action |
|-------|-----------|---------------------|-----------------|
| @Builder 使用点 | R-1 触发条件"V1 组件构造传参对象中"，未限定使用点在 build() 内 | @Builder 内同文件子组件构造传 undefined 亦告警（探针实证） | 无代码动作（行为符合 R-1 字面范围且方向一致：命中即告警）；design.md ADR-2 附注"isBuilder 场景下集合为空自动跳过"与实测不符（同文件场景集合已填充），属设计文档措辞不精确，登记为开放问题 #5（非阻塞，可选下一次文档触达时修正） |
| V1 装饰器组合覆盖（AC-1.1"单独或与 @Prop/@State/@Provide/@BuilderParam 组合"） | 组合与有无默认值不限 | fixture 直接测试 plain `@Require`（带默认值）正例；组合场景由构造保证：`decoratorVariable` 为 10905359 同源五集合（builderParam/prop/regular/state/provide Initialization）并集，既有 fixture `validateInitDecorator.ets` 已证明该并集对 `@Require @State`/`@Require @Provide`/`@Require @Prop`/`@Require @BuilderParam` 均含对应字段名 | 无（VM-1 映射未要求组合矩阵逐项 fixture；同源构造 + 既有 10905359 组合用例承担覆盖） |
| R-1"每个命中字段各输出 1 条" | 同一传参对象多命中字段逐字段输出 | forEach + 逐属性 log.push；探针实证 2 命中字段 → 恰 2 条 WARN | 无 |
| 诊断定位（R-1"定位该字段的传值属性"） | 属性级锚点（`字段名: undefined` 所在行） | `pos: item.getStart()`（PropertyAssignment 节点起点）；探针日志含 pos 值 | 无（ut_validate 断言 message/type/计数，pos 由 ADR-5 契约 + 探针 pos 值佐证；如需更强断言可后续在期望条目中加 pos，非本审查缺口——spec VM 通过标准为计数+文案+ERROR 一致） |

## Spec Quality Boundary

| Check | Result | Evidence |
|-------|--------|----------|
| AC 可从终端用户或 Public/System/InnerAPI 表面观察 | PASS | 全部 AC 可观察表面=应用开发者编译/构建输出（WARNING 诊断/无诊断），spec 验收标准表逐条登记 |
| THEN 未混入内部数据结构、状态机、调用链、类/方法、锁或算法 | PASS | spec.md AC-1.1～AC-1.6 THEN 子句均为"编译输出 N 条 WARNING/不输出告警+编译继续"，无实现细节 |
| 变更/废弃 API 当前与目标开放级别一致、完整 | N/A | spec.md API 变更分析：无新增/变更/废弃 API（编译器诊断增强） |
| API/错误码事实含精确签名/数值、触发条件、外部行为、来源和 AC/验证映射 | N/A | 无 API 变更、无新增数字错误码（O-3 决策：WARN 无码沿用仓内惯例；既有 10905359/10905321/10905316 事实备查于 spec.md） |
| 每个 AC 的测试入口、Red 条件和通过标准真实可执行 | PASS | VM-1～VM-6 测试入口/命令/Red 条件/通过标准均已执行：Red 状态实测断言失败（主链路 `expected false to be true` 0≠1；interop `expected [] to have a length of 1`），Green 全过（`evidence/checks/task3-red-green/`） |

## Anti-Fake Completion Check

| Check | Result | Evidence |
|-------|--------|----------|
| 每个 AC 均有真实 Code Ref 和 Commit | PASS | 本表 AC 行 Code Ref（逐行核对源码）；Commit=`单 commit（Change-Id Ieca81b2）`、Base `508b60c80`、纯插入无删除（`git diff` 2 hunks）；SHA 已回填（开放问题 #1 已处置） |
| 正向、异常、边界和兼容路径均按 Spec 闭合 | PASS | 正向：V1/V2 各恰 1 WARN；边界：联合/any/无 @Require/变量/嵌套/多命中/@Builder 探针；兼容：全量回归零漂移（主链路失败集 Red→Green 恰差本特性 2 页；interop 失败名集合基线对照 IDENTICAL-19） |
| 没有用声明、占位实现或无关测试冒充完成 | PASS | Red→Green 成对证据证明断言非恒真；期望条目未篡改既有项（JSON 274 页仅追加 2 条）；预存基线失败未以任何方式掩盖（stash 对照证明，execution-plan 偏差表登记） |

## Conclusion

**Approved。** 逐 AC 核对结论：实现与 spec AC-1.1～AC-1.6 / R-1～R-7 精确对应——不多（无超出声明范围的行为；@Builder 使用点属 R-1 字面范围且已登记说明）、不少（正例/反例/边界/多命中/定位契约全覆盖，含 VM 映射未显式要求的 R-1 逐字段行为探针实证）、不误解（消息模板逐字符一致、WARN 无码、属性级锚点、零误报回退方向与 ADR-6 一致）。

条件与非阻塞项：
1. Commit SHA 已回填 execution-plan 代码范围映射与本表（`单 commit（Change-Id Ieca81b2）`，2026-10-29；追溯链 Commit 环节已闭合，开放问题 #1 已处置）。
2. design.md ADR-2 的 isBuilder 附注与实测不符（行为本身合规），列为开放问题，不阻塞。
3. 需回修的 Spec/Plan 项：无。

---

## v1.8 增补段（TASK-4 类型级触发扩展，2026-10-31）

> 本段为 execution-plan v1.8 修订新增 TASK-4 交付后的增补审查记录；上文 v1.5 周期审查内容为历史基线，不改写。v1.8 审查基准：`spec.md` md5 `254bf315c9444956a20f9df36c717172`（Approved，v1.8 基线；v1.5 周期为 `18389cfede968245190cc3346fa877bd`，见上文 Metadata）。

### v1.8 AC → Task → Code → Review

| AC | Task | Code Ref（工作区态） | Commit | Verification Evidence | Result | Gap |
|----|------|---------------------|--------|-----------------------|--------|-----|
| AC-6（proposal，对应 AC-1.6） | TASK-4 | 主链 `isTypeDefinitelyIncludingUndefined`（:2087-2097；Any/Unknown→false，与声明侧 `isTypeIncludingUndefined` 方向相反、同保守）+ 触发条件类型级替换（:2147-2148）；镜像同构（helper :2103-2113 / 触发 :2163-2164，新增块 diff IDENTICAL）；Extension fixture 2 页每页恰 2 WARN | `单 commit（Change-Id Ia0e5e0a）` | `evidence/checks/task4-red-green/README.md`（Red 357/4 + 1122/21 → Green 359/2 + 1124/19 成对 fresh） | PASS | 无 |
| AC-1.6（spec） | TASK-4 | 同 AC-6；期望消息逐字符：V1 got `'undefined'`/`'number \| undefined'`，V2 got `'undefined'`/`'string \| undefined'`；interop `expectRequireUndefinedWarns` 计数 + 逐条消息断言 | 同上 | 同上（Green `✔ 1-62/1-63`、`✔ V1/V2 extension`；ERROR=0 反证无噪音） | PASS | 无 |
| AC-1.5 v1.8 扩展边界 | TASK-4 | Extension fixture 独立反例 child：`narrowed_value`（`!== undefined` 守卫内收窄传值）、`any_var_value`（ESObject 动态值）——类型级触发下 0 告警；声明侧 `isTypeIncludingUndefined`（any/unknown→true）语义未动，两 helper 并存符合 ADR-4 | 同上 | 同上（反例含于同页 0 告警断言；三态失败集对照零漂移） | PASS | 无 |

### v1.8 Anti-Fake Completion Check

| Check | Result | Evidence |
|-------|--------|----------|
| 断言非恒真 | PASS | Red 态（实现前）新 2 页 WARN 计数 0≠2 断言失败、新 2 用例 `expected [] to have a length of 2`；ERROR 断言先行通过 ⇒ 无 ERROR 噪音（ESObject/`void 0`/if 守卫未触发新诊断） |
| 既有用例零漂移 | PASS | 既有 2 页/2 用例保持 ✔；etsTest 失败集三态（基线 2 → Red 4 → Green 2）与 interop IDENTICAL-19 对照一致；`transform_ut_error.json` 既有期望条目 diff = 0（+20/-0 纯追加） |
| 实现与声明范围一致 | PASS | 净 diff = execution-plan Files 表 7 项（2 src 修改 + pathConfig/JSON/interop 测试修改 + 2 fixture 新建），无超范围 |

### v1.8 Conclusion

**Approved（维持）。** TASK-4 实现与 spec AC-6/AC-1.6/AC-1.5 v1.8 扩展边界精确对应：正例（`void 0`、联合类型变量）每页恰 2 WARN 且文案逐字符，反例（收窄后联合变量、`any`/`unknown` 动态值）0 告警，既有 v1.5 行为零漂移。Commit 追溯待 owner 提交决策后以 Change-Id 承载（非阻塞，与 review.md 开放问题同口径）。
