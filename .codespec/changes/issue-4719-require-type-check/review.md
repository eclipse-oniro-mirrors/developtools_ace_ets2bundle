# Review — issue-4719-require-type-check

> 汇总与索引文档：详细 AC 结论、finding、质量维度与执行记录见三份 Evidence，本文不复制明细。审查基准：Base `508b60c80`（fork snapshot detached HEAD）/ Head = 单 commit（Change-Id Ieca81b2，代码与 SDD 文档 squash 合并；代码净 diff 7 文件 373 insertions / 0 deletions）。三份 Evidence 与执行日志随单 commit 一并入库（`evidence/`），远端可直接复核对验证过程。

## GA — Spec Compliance

**Approved。** 实现与 spec AC-1.1～AC-1.5 / R-1～R-6 精确对应：不多（无超出声明范围行为）、不少（正例/反例/边界/多命中/定位契约全覆盖）、不误解（文案逐字符、WARN 无码、属性级锚点、零误报回退）。1 条解释性说明（@Builder 使用点告警属 R-1 字面范围，design ADR-2 附注措辞不精确，非代码问题）。（v1.7 注记，2026-10-31：owner 指示移除 interop 一致性验收维度，spec 已删 AC-1.6/interop 规则 R-6/VM-6、原 R-7 重编号为 R-6；interop 镜像代码保留为附加覆盖，本节历史审查所涉 interop 证据仍然有效。）（v1.8 注记，2026-10-31：TASK-4 类型级触发扩展交付后，spec v1.8 基线新增 AC-1.6（类型级正例，与 v1.7 移除的 interop 维度 AC-1.6 编号复用、语义无关）；AC-1.5 v1.8 扩展边界 / AC-6 / AC-1.6 经三份 Evidence v1.8 增补段复核 **Approved 维持**——正例每页恰 2 WARN 且文案逐字符、反例（收窄/ESObject 动态值）0 告警、既有 v1.5 行为零漂移；spec.md md5 `254bf315c9444956a20f9df36c717172`。）（v1.9 注记，2026-10-31：PR #1747 评审意见处置的文档链修订——proposal AC 改 Given/When/Then 与「鸿蒙应用开发者」措辞、spec AC-1.1 内嵌消息模板与数组/集合口径注记、sfv 5.3 跨平台按 ArkUI-X（iOS & Android）定性修正、5.5 错误信息反引号、5.12/6.1 理由补强；行为契约、代码与验证证据零变更，**Approved 维持**——上方 v1.8 注记所录 spec md5 为当时审查基准的历史记录，spec 现行基线为 v1.9。）

## GB — Code Quality

**Approved。** 无 Blocker/Major；Minor 2 项（测试 env 恢复惯例、design ADR-2 附注措辞）均不阻塞。插入面极小（2 文件各 +77 纯插入、零删除、零新 import），与既有 validate* 函数族同构，interop 镜像逐行 IDENTICAL，8 个质量维度全部 PASS/N/A（依据见 Evidence）。（v1.8 注记，2026-10-31：TASK-4 净改动 2 文件各 +14/-2 完全对称、零新 import，helper 与声明侧 `isTypeIncludingUndefined` 旁并列，主/镜像新增块 diff IDENTICAL 复核通过，新增区间只读 eslint 0 命中，无新 finding——详见 `code-quality.md` v1.8 增补段，**Approved 维持**。）

## GC — Verification

**Approved。** 最终工作区状态 fresh 复跑：主链验证入口与镜像回归入口全量通过——失败均为预存基线（主链 2 例、镜像回归 19 例；stash 对照逐名证明，未掩盖），本变更新增验证用例 2/2 全过（V1/V2 各恰 1 WARN 逐字符一致 + ERROR=0 + 反例 0 条）。证据链四层：成对验证（实现前失败→实现后通过，断言非恒真）、双基线对照（零漂移）、最终态复跑、边界探针（R-1 逐字段 + @Builder）。（v1.8 注记，2026-10-31：TASK-4 成对验证 fresh——实现前新增 2 页断言失败 → 实现后主链全量通过（预存基线 2 例失败不变）、镜像回归基线对照失败名集合逐名一致（预存 19 例不变，零漂移），成对存档 `evidence/checks/task4-red-green/`（8 份日志 + README）；build 114 files PASS、只读 eslint 新增区间 0 命中——详见 `verification.md` v1.8 增补段，**Approved 维持**。）

## Evidence 索引

| Evidence | 路径 | Verdict |
|----------|------|---------|
| Spec Compliance（逐 AC 结论，Level D 真相源） | `evidence/reviews/spec-compliance.md` | Approved |
| Code Quality（范围对照/finding/质量维度） | `evidence/reviews/code-quality.md` | Approved |
| Verification（fresh 执行记录/覆盖/防伪） | `evidence/reviews/verification.md` | Approved |
| 实施期成对验证（实现前失败→实现后通过）+ 基线对照 + 最终态复跑 + 边界探针日志 | `evidence/checks/task3-red-green/`（README.md 证据矩阵 + 8 份日志） | — |
| TASK-4 v1.8 类型级触发扩展成对验证日志（2026-10-31） | `evidence/checks/task4-red-green/`（README.md 证据矩阵 + 8 份日志，含 TASK-4 编号复用注记） | — |

## 开放问题（非阻塞，归档前处置）

| # | 项 | Owner | 处置建议 |
|---|----|-------|----------|
| 1 | Commit 未提交：execution-plan 代码范围映射与本审查的 Commit 列待提交后回填 SHA（追溯链 Commit 环节） | 用户（提交触发） | 已处置（2026-10-29）：代码 commit `2cf37034d` 与文档 commit `ac4f12506` 应用户要求 squash 为单 commit（Signed-off-by + hook 保留 Change-Id Ieca81b2）；单 commit 无法自引用 SHA，追溯以 Change-Id 承载（execution-plan 11 处 Commit 单元格已同步）；`evidence/` 三份审查证据与执行日志随单 commit 一并入库 |
| 2 | manifest `func_id`/`feat_id` 与 proposal Owner 列为待填占位（社区 Issue 驱动、无认领人，不可虚构） | Owner | 已处置（2026-10-29）：owner @youzhi92 认领；func_id 09-01-01 / feat_id Feat-01 / 需求ID REQ-09-01-01-01 已落实；proposal 基线 v1.2 重确认（digest e28163fd，含风险状态列处置）；D 占位符门 PASS |
| 3 | profile 声明 `arkui/toolchain` + subprofile `toolchain` 不在插件扫描集（validate E 级 3 项）；按子 profile README 兜底规则应规范化为 `arkui` + 空 subprofiles（或新增 toolchain 子 profile） | Owner 确认（主类型 owner 定，本审查不自动改） | 已处置（2026-10-29）：owner 确认规范化为 `arkui` + 空 subprofiles，manifest/spec-for-validation/proposal/registry 已同步 |
| 4 | spec-for-validation.md 双 Owner 签署中（ReadyForReview，不阻塞主流程） | 双 Owner | 已处置（2026-10-29）：双 Owner（@youzhi92 一人双角色）签署，状态置 Approved；spec/design 来源 hash 经 CLI refresh 重绑定，check 15/15 PASS；D spec-for-validation 门 PASS |
| 5 | design.md ADR-2 附注"isBuilder 场景下集合为空自动跳过"与实测不符（同文件 @Builder 使用点正常告警，行为合规） | 下次 design.md 触达时 | 已处置（2026-10-29）：附注修正为「@Builder 内同文件使用点同样进入校验并告警（探针实证，属 R-1 字面范围）」；spec-for-validation 来源 hash 已重绑 |
| 6 | 预存基线失败（主链验证入口 2 例 + 镜像回归入口 19 例）为独立存量/环境问题，与本特性无关 | 上游/独立 issue | 保持登记（2026-10-29）：stash 对照已证明非本特性引入（零漂移）；不在本变更范围，如需修复另行立项 |
| 7 | v1.8 TASK-4 代码提交（Commit 列原「待 commit（owner 提交决策）」） | 用户（提交触发） | 已处置（2026-10-31）：owner 指令上传——单 commit（Change-Id Ia0e5e0a，代码+文档同 commit）已推送 fork 分支并评论 start build 触发门禁；追溯同 #1 口径（单 commit 无法自引用 SHA，以 Change-Id 承载） |

## 最终决策

**Review 通过（GA/GB/GC 全部 Approved）。** 全部处置闭环（2026-10-29）：开放问题 #1 已闭合（代码与文档 squash 为单 commit，Change-Id Ieca81b2；SHA 自引用限制以 Change-Id 承载追溯；evidence/ 随单 commit 入库）；归档门 #2/#3/#4 处置闭合（owner 认领与编号落实、profile 规范化、spec-for-validation 签署 Approved）；#5 design 附注已修正；#6 预存基线失败保持登记为独立上游问题。全量 validate 46 项 0 broken PASS，manifest.status=done，变更已归档（registry 状态 Release Ready）。（v1.8 增补，2026-10-31：TASK-4 类型级触发扩展交付——v1.8 文档链（proposal/spec/design/execution-plan/spec-for-validation）经 owner 批准并回填完毕；代码与成对验证（实现前失败→实现后通过）证据落地（主链验证入口与镜像回归入口 fresh 全量通过、预存基线失败不变，三态失败集零漂移）；GA/GB/GC 经三份 Evidence v1.8 增补段复核 **Approved 维持**；开放问题 #7 已处置（2026-10-31）：owner 指令上传——单 commit（Change-Id Ia0e5e0a，代码+文档同 commit）已推送 fork 分支并评论 start build 触发门禁（同 #1 Change-Id 承载口径）；终验与交付记录见 manifest.md「v1.8 类型级触发扩展——TASK-4 交付」节。）（v1.9 增补，2026-10-31：design-docs 归档 PR #1747 收到 TerryTsao/caojin 10 条评审意见，owner 逐项拍板后完成 v1.9 文档链修订（proposal/spec 措辞与口径澄清——GWT、鸿蒙应用开发者、数组/集合口径、消息模板内嵌；sfv 5.3 跨平台按 ArkUI-X 定性修正、5.12/6.1 理由补强、错误信息反引号、术语表去跨平台化）——行为契约、代码与验证证据零变更，GA/GB/GC **Approved 维持**，全量 validate 46 checks / 0 broken / 0 warn 复验通过；修订记录见 manifest.md「v1.9 评审意见处置修订」节。后续同步 PR #1747 分支并逐条回复评审，待 owner 放行后执行。）（v1.10 增补，2026-11-03：owner 会话确认交付 MR 测试承载口径并仅修订业务仓 .codespec——测试范围声明同步（proposal 包含项7、design 范围/测试性设计/风险表行、execution-plan 范围映射与 Task 列表/sfv 5.3 与术语表）；行为契约、AC 与代码实现零变更，本特性在 interop 镜像链路不设 MR 内行为级断言（镜像一致性由仓内镜像同步纪律承载），AC 全部由主链路端到端断言承载、不受影响；历史审查结论与成对验证（实现前失败→实现后通过）证据为交付时点事实保持有效，GA/GB/GC **Approved 维持**。修订记录见 manifest.md「v1.10 测试承载口径修订」节。）（v1.11 增补，2026-11-06：owner 指示交付文档验证描述实现中立化（剥离验证技术载体字样，v1.6 实现中立化先例推广至全链七文档）——文档链全量中性化修订（proposal/spec/design/execution-plan/spec-for-validation/manifest/review），历史审查注记同步改写（事实结论不变），行为契约、AC 与代码实现零变更，evidence/ 历史快照不回改（文件名引用保留），GA/GB/GC **Approved 维持**。修订记录见 manifest.md「v1.11 验证描述实现中立化修订」节。）（v1.12 增补，2026-11-10：owner 会话指示告警消息模板整体改写（占位符名 paramName→propName、paramType→expectType，actualType 不变，插值语义不变；触发/级别/定位/反例口径不变），经 v1.12 文档链呈批后 owner 双批准（文档链 + TASK-5 执行授权）——TASK-5 交付：主链+镜像 message 字符串模板替换（message 区块 diff IDENTICAL、偏移 +16 保持，变量名零改动）+ 期望诊断登记 6 条消息文本；成对验证（Red→Green）fresh 证据落地（主链三态 359/2 → 355/6 → 359/2 零漂移、镜像回归预存 19 例同构 @Require 相关失败 0、eslint 替换区间 0 新增、build 114 files PASS）；GA/GB/GC 经三份 Evidence v1.12 增补段复核 **Approved 维持**（Verdict 补登 Approver/Evidence 表，CLI 防自评新格式）；commit 以「代码+文档同 commit，随 PR #7259 追加」承载（owner 指令），Change-Id 追溯同 #1 口径。交付记录见 manifest.md「v1.12 消息模板改写」节。）
