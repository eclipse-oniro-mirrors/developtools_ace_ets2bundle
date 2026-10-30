# Review — issue-4719-require-type-check

> 汇总与索引文档：详细 AC 结论、finding、质量维度与执行记录见三份 Evidence，本文不复制明细。审查基准：Base `508b60c80`（fork snapshot detached HEAD）/ Head = 单 commit（Change-Id Ieca81b2，代码与 SDD 文档 squash 合并；代码净 diff 7 文件 373 insertions / 0 deletions）。三份 Evidence 与执行日志随单 commit 一并入库（`evidence/`），远端可直接复核对验证过程。

## GA — Spec Compliance

**Approved。** 实现与 spec AC-1.1～AC-1.6 / R-1～R-7 精确对应：不多（无超出声明范围行为）、不少（正例/反例/边界/多命中/定位契约全覆盖）、不误解（文案逐字符、WARN 无码、属性级锚点、零误报回退）。1 条解释性说明（@Builder 使用点告警属 R-1 字面范围，design ADR-2 附注措辞不精确，非代码问题）。

## GB — Code Quality

**Approved。** 无 Blocker/Major；Minor 2 项（测试 env 恢复惯例、design ADR-2 附注措辞）均不阻塞。插入面极小（2 文件各 +77 纯插入、零删除、零新 import），与既有 validate* 函数族同构，interop 镜像逐行 IDENTICAL，8 个质量维度全部 PASS/N/A（依据见 Evidence）。

## GC — Verification

**Approved。** 最终工作区状态 fresh 复跑：etsTest 357 passing / 2 failing、interopArkTest 1122 passing / 19 failing——失败均为预存基线（stash 对照逐名证明，未掩盖），本变更新增用例 4/4 全过（V1/V2 各恰 1 WARN 逐字符一致 + ERROR=0 + 反例 0 条）。证据链四层：Red→Green 成对（断言非恒真）、双基线对照（零漂移）、最终态复跑、边界探针（R-1 逐字段 + @Builder）。

## Evidence 索引

| Evidence | 路径 | Verdict |
|----------|------|---------|
| Spec Compliance（逐 AC 结论，Level D 真相源） | `evidence/reviews/spec-compliance.md` | Approved |
| Code Quality（范围对照/finding/质量维度） | `evidence/reviews/code-quality.md` | Approved |
| Verification（fresh 执行记录/覆盖/防伪） | `evidence/reviews/verification.md` | Approved |
| 实施期 Red→Green + 基线对照 + 最终态复跑 + 边界探针日志 | `evidence/checks/task3-red-green/`（README.md 证据矩阵 + 8 份日志） | — |

## 开放问题（非阻塞，归档前处置）

| # | 项 | Owner | 处置建议 |
|---|----|-------|----------|
| 1 | Commit 未提交：execution-plan 代码范围映射与本审查的 Commit 列待提交后回填 SHA（追溯链 Commit 环节） | 用户（提交触发） | 已处置（2026-10-29）：代码 commit `2cf37034d` 与文档 commit `ac4f12506` 应用户要求 squash 为单 commit（Signed-off-by + hook 保留 Change-Id Ieca81b2）；单 commit 无法自引用 SHA，追溯以 Change-Id 承载（execution-plan 11 处 Commit 单元格已同步）；`evidence/` 三份审查证据与执行日志随单 commit 一并入库 |
| 2 | manifest `func_id`/`feat_id` 与 proposal Owner 列为待填占位（社区 Issue 驱动、无认领人，不可虚构） | Owner | 已处置（2026-10-29）：owner @youzhi92 认领；func_id 09-01-01 / feat_id Feat-01 / 需求ID REQ-09-01-01-01 已落实；proposal 基线 v1.2 重确认（digest e28163fd，含风险状态列处置）；D 占位符门 PASS |
| 3 | profile 声明 `arkui/toolchain` + subprofile `toolchain` 不在插件扫描集（validate E 级 3 项）；按子 profile README 兜底规则应规范化为 `arkui` + 空 subprofiles（或新增 toolchain 子 profile） | Owner 确认（主类型 owner 定，本审查不自动改） | 已处置（2026-10-29）：owner 确认规范化为 `arkui` + 空 subprofiles，manifest/spec-for-validation/proposal/registry 已同步 |
| 4 | spec-for-validation.md 双 Owner 签署中（ReadyForReview，不阻塞主流程） | 双 Owner | 已处置（2026-10-29）：双 Owner（@youzhi92 一人双角色）签署，状态置 Approved；spec/design 来源 hash 经 CLI refresh 重绑定，check 15/15 PASS；D spec-for-validation 门 PASS |
| 5 | design.md ADR-2 附注"isBuilder 场景下集合为空自动跳过"与实测不符（同文件 @Builder 使用点正常告警，行为合规） | 下次 design.md 触达时 | 已处置（2026-10-29）：附注修正为「@Builder 内同文件使用点同样进入校验并告警（探针实证，属 R-1 字面范围）」；spec-for-validation 来源 hash 已重绑 |
| 6 | 预存基线失败（etsTest 2 例 + interopArkTest 19 例）为独立存量/环境问题，与本特性无关 | 上游/独立 issue | 保持登记（2026-10-29）：stash 对照已证明非本特性引入（零漂移）；不在本变更范围，如需修复另行立项 |

## 最终决策

**Review 通过（GA/GB/GC 全部 Approved）。** 全部处置闭环（2026-10-29）：开放问题 #1 已闭合（代码与文档 squash 为单 commit，Change-Id Ieca81b2；SHA 自引用限制以 Change-Id 承载追溯；evidence/ 随单 commit 入库）；归档门 #2/#3/#4 处置闭合（owner 认领与编号落实、profile 规范化、spec-for-validation 签署 Approved）；#5 design 附注已修正；#6 预存基线失败保持登记为独立上游问题。全量 validate 46 项 0 broken PASS，manifest.status=done，变更已归档（registry 状态 Release Ready）。
