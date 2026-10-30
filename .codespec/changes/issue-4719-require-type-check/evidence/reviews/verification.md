# Verification

> 独立记录真实执行的验证。Expected Result 必须在执行前定义，Actual Result 必须来自 fresh output；不得只填写“PASS”。

## Verification Metadata

| Item | Value |
|------|-------|
| Change ID | issue-4719-require-type-check |
| Commit / Head | `单 commit（Change-Id Ieca81b2）`；Base = `508b60c80`（fork snapshot detached HEAD） |
| Environment | Linux host；Node.js + 仓内预装 node_modules（TypeScript/arkguard/declgen 经 install 脚本）；compiler/ 目录本地构建（npm run build / interopBuild / etsTest / interopArkTest） |
| Executor / Date | AI Agent（ohos-review，GLM 5.3）/ 2026-10-29（最终态 fresh 复跑）；实施期 Red→Green 采集同日早间 |

> 提交策略注记（2026-10-29）：审查完成后，被审查代码 commit 与 SDD 文档 commit 应提交策略 squash 为单 commit（Change-Id Ieca81b2）；squash 后 `compiler/` 代码内容与本审查所见逐字节一致，Commit 追溯以 Change-Id 承载。

## Verdict

- [x] Approved
- [ ] Needs Changes
- [ ] Blocked

## Execution Records

> 期望值定义于 spec.md 验证映射（VM-1～VM-6）与 execution-plan Verification 表。**#1/#2 为本审查对最终工作区状态的 fresh 复跑**（实施期基线对照流程曾将 lib/ 置为 HEAD 基线产物，为排除该干扰并取得最终态证据而复跑）；#3～#5 为实施期采集（同日）。

| Task / AC | Command / Evidence | Expected Result | Actual Result | Fresh Evidence | Result |
|-----------|--------------------|-----------------|---------------|----------------|--------|
| TASK-3 / AC-1、AC-1.1、AC-1.2、AC-1.3、AC-1.4、AC-1.5（VM-1～VM-5） | `cd compiler && npm run etsTest`（全量 359 页用例，含本变更新增 2 页） | 新增 2 页：正例 WARN 恰 1 条/文案逐字符一致/ERROR=0/编译完成；反例矩阵 0 条本告警；既有用例零漂移（允许且仅允许预存基线 2 失败） | 357 passing / 2 failing；`✔ 1-60 validateRequireParamUndefinedType`、`✔ 1-61 validateRequireParamUndefinedTypeV2`；2 失败为预存基线（ExtendOneChild、StructNameWarn——HEAD fixture 缺失），与 stash 基线对照（355/2，同一两例）一致，passing 恰 +2 | `evidence/checks/task3-red-green/etsTest-final-fresh.txt`（2026-10-29 最终态复跑）；实施期对照：`main-red-full.txt`（355/4）/`main-green-full.txt`（357/2） | PASS |
| TASK-3 / AC-6、AC-1.6（VM-6） | `cd compiler && npm run interopArkTest`（interopBuild → babel 测试 → mocha 全量） | interop 用例 2/2：WARN 计数=1、文案与主链路逐字符一致、ERROR=0；既有用例零漂移（允许且仅允许预存基线 19 失败） | 1122 passing / 19 failing；`✔ warns once when a @Require regular param...`、`✔ warns once when a @Require @Param...in V2`；19 失败与基线失败名集合 diff = IDENTICAL-19（逐名比对零漂移），passing 恰 +2 | `evidence/checks/task3-red-green/interopArkTest-final-fresh.txt`（2026-10-29 最终态复跑）；实施期对照：`interop-red-full.txt`（1120/21）/`interop-green-full.txt`（1122/19）/`interop-baseline-full.txt`（1120/19） | PASS |
| TASK-1 / AC-1、AC-1.1、AC-1.2、AC-1.3、AC-1.4、AC-1.5（编译+静态检查） | `cd compiler && npm run build`；只读 `./node_modules/.bin/eslint compiler/src/process_custom_component.ts --ext .ts` | build 无错误、新函数入 lib；新增区间 0 lint 错误（全仓 1005 为存量基线） | `Successfully compiled 114 files with Babel`；eslint 50 个存量 error 行号全部 ≤2007，新增区间（:1575/:2077-2151）0 命中 | 实施期输出（2026-10-29，execution-plan TASK-1 Verification 表回填）；本审查复核净 diff 无 lint 触发面变化 | PASS |
| TASK-2 / AC-6、AC-1.6（编译+静态检查） | `cd compiler && npm run interopBuild`；只读 `./node_modules/.bin/eslint compiler/src/interop/src/process_custom_component.ts --ext .ts` | interopBuild 无错误、镜像入 lib；新增区间 0 lint 错误 | `Successfully compiled 127 files with Babel`；eslint 53 个存量 error，新增区间（:1591/:2093-2167）0 命中；主/镜像新增块 diff IDENTICAL | 实施期输出（2026-10-29，execution-plan TASK-2 Verification 表回填）；本审查复核 IDENTICAL 结论成立 | PASS |
| TASK-3 / AC-1、AC-1.1、AC-1.2、AC-1.3、AC-1.4、AC-1.5、AC-6、AC-1.6（Red 证据） | 挂载行注释状态下 `npm run etsTest` / `npm run interopArkTest`（注释即时恢复，净 diff 与完成态一致） | 新用例失败（正例 0 条 vs 期望 1 条），既有用例不受影响——证明断言非恒真 | 主链路 Red：355/4（我的 2 页 `expected false to be true`）；interop Red：1120/21（我的 2 用例 `expected [] to have a length of 1`）；基线失败数不变 | `evidence/checks/task3-red-green/main-red-full.txt`、`interop-red-full.txt`（2026-10-29 实施期采集） | PASS |
| TASK-3 / AC-1、AC-1.1（边界补充：R-1 逐字段 + @Builder 使用点） | 探针脚本（test.js 轻量驱动模式 + fresh lib）：multi_hit 场景（2 个 @Require non-null + 1 个联合类型同对象传 undefined）、builder_use_site 场景（@Builder 内构造传 undefined） | R-1"每个命中字段各输出 1 条"：2 命中 → 恰 2 条 WARN，联合类型 0 条；@Builder 场景行为记录（R-1 未限定使用点） | multi_hit：first_value/second_value 各 1 条 WARN、third_value（number 与 undefined 联合）0 条；builder_use_site：1 条 WARN（与 R-1 字面范围一致） | `evidence/checks/task3-red-green/edge-probe-builder-multi.txt`（2026-10-29，本审查执行；探针脚本与 fixture 均在 /tmp，未污染工作区） | PASS |

## Coverage and Regression

| Scope | Covered? | Evidence | Gap / Follow-up |
|-------|----------|----------|-----------------|
| Positive path | Yes | V1（`require_value` 恰 1 WARN）、V2（`require_param_value` 恰 1 WARN）——etsTest fresh ✔ ×2 + interopArkTest fresh ✔ ×2 + 多命中探针 | 无 |
| Error / boundary path | Yes | 联合类型含 undefined、any、无 @Require（V1/V2 各一）、变量传值、嵌套对象内部 undefined、多命中逐字段、@Builder 使用点 | unknown/可选属性语法/含 null 联合（如 number 与 null 联合）未单列 fixture：与 any/联合走同一判定分支（`TypeFlags` 掩码/联合成员扫描，:2077-2085），由代码构造保证；如需逐类型 fixture 可后续补充（非 VM 映射要求） |
| Compatibility / regression | Yes | 全量双套件零漂移：etsTest 基线 355/2 → Green 357/2（失败集不变、passing 恰 +2）；interopArkTest 基线 1120/19 → Green 1122/19（失败名集合 diff = IDENTICAL-19） | 预存基线失败（etsTest 2 + interop 19）为独立环境/存量问题，stash 对照证明非本特性引入，未掩盖未修改（execution-plan 偏差表登记） |
| Profile-specific validation | N/A | manifest.profile=arkui/toolchain：base profile review 专项检查已应用（.codespec 产物一致性、N/A 项有理由）；SpecTest/Host Preview/设备验证不适用（manifest 已记录 N/A 理由：编译期诊断特性，VM-1～VM-6 mocha 单测承载） | 声明的 toolchain 子 profile 不存在于插件扫描集（E 级缺口，owner 确认项，见 review.md 开放问题 #3） |

## Anti-Fake Completion Check

| Check | Result | Evidence |
|-------|--------|----------|
| 命令与本次变更直接相关 | PASS | etsTest/interopArkTest 断言本特性 fixture/用例（VM-1～VM-6 定义）；build/interopBuild 编译本变更 src；eslint 核对新增区间；探针针对 R-1 逐字段与 @Builder 边界 |
| Actual Result 来自本次执行而非历史输出 | PASS | #1/#2/#6 为本审查对最终工作区 fresh 复跑/执行（含发现并排除 lib/ 基线残留干扰的过程记录）；#3～#5 为实施期当日采集，日志均存档于 evidence/checks/task3-red-green/ |
| 失败、跳过和环境阻塞均已显式记录 | PASS | 预存基线 2+19 失败逐名记录并 stash 对照定性；lint 全仓 1005 存量 error 对账说明（新增区间 0）；实施期 lint --fix 污染事件及回退记录于 execution-plan 偏差表；基线对照流程导致的 lib/ 残留已在本审查中发现并通过 fresh 复跑消除 |
| 未用空测试集、过滤错误或仅编译成功替代行为验证 | PASS | Red 状态下新用例实测失败（断言非恒真）；断言含 WARN 计数、逐字符文案、ERROR=0 三重；全量运行未用 grep/过滤缩小用例集（--level 全量 mocha） |

## Code-to-Spec Consistency Conclusion

代码与规格一致：AC-1.1～AC-1.6 全部经 fresh 执行验证闭合（正例计数/文案/级别/编译继续、反例零误报、interop 同构、既有行为零漂移），证据链含 Red→Green 成对、双基线对照、最终态复跑与边界探针四层。

剩余验证风险：极低。Commit 追溯已回填（`单 commit（Change-Id Ieca81b2）`，2026-10-29，开放问题 #1 已处置）。**允许进入 GC。**
