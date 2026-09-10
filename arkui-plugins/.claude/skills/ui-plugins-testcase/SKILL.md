---
name: ui-plugins-testcase
description: 为 arkui-plugins 的 UI-Plugins 创建新的变换快照测试 testcase（PluginTester + uiTransform + 期望输出快照）。当需要为 UI 组件/装饰器变换（@State、@Link、@Builder 等 struct→class、状态管理变换）新增单测时使用。不适用于语法 lint 测试（ut/ui-plugins/unit/ 下的 uiSyntaxLinterTransform 模式）、不覆盖已有测试的调试与快照更新。
---

# 创建 UI-Plugins 变换快照测试用例

## 范围声明（先读）

本 skill **只覆盖**：在 `developtools/ace_ets2bundle/arkui-plugins/test` 下，为 UI-Plugins 的 **AST 变换快照测试**（`PluginTester` + `uiTransform` + 期望输出快照字符串）**创建新 testcase**。

**不覆盖**：
- 语法 lint 测试（`test/ut/ui-plugins/unit/` 目录下的 `uiSyntaxLinterTransform` + JSON 诊断模式——该目录被 jest 主配置 ignore，是 ui-syntax 规则测试专用）
- 已有测试的调试、快照不匹配的排查与更新
- memo-plugins / interop-plugins 测试（模式类似，但插件入口不同，参考各自 ut 目录现有测试）

**前置条件**（缺一不可，否则单测命令会失败）：
- `out/sdk/ohos-sdk/linux/ets/static/build-tools/ets2panda/lib/` 下存在 `libes2panda_public.so`（es2panda SDK 已构建）
- `out/sdk/ohos-sdk/linux/ets/static/build-tools/ui-plugins/lib/` 下已有编译后的插件产物（执行过 `cd arkui-plugins && npm run compile:plugins`，或完整 `npm run compile`）
- `arkui-plugins/node_modules/.bin/jest` 存在（依赖已安装）

## 主干流程（单文件、单期望快照 —— 最常见场景）

以 `@State` 装饰器基础类型测试为例，这是要新建一个变换快照 testcase 时每一步的完整动作。完整范例见
`test/ut/ui-plugins/decorators/state/state-basic-type.test.ts` + `test/demo/mock/decorators/state/state-basic-type.ets`。

工作目录约定：下文 `<ARKUI_PLUGINS>` = `developtools/ace_ets2bundle/arkui-plugins`，`<TEST>` = `<ARKUI_PLUGINS>/test`。

### Step 1: 确认 localtest 输入已更新（就绪检查）

创建任何 testcase 前，**第一件事是确认 `test/demo/localtest/` 下的输入文件已被用户更新**——这是用户"已准备好创建新 testcase"的信号。不要跳过本检查，也不要替用户编写 localtest 输入。

- 目标文件：`demo/localtest/entry/src/main/ets/pages/new.ets` —— localtest 工程的编译入口。`demo/localtest/build_config_template.json` 的 `compileFiles`/`entryFiles` 已预接线指向它，`main_pages.json` 已注册 `pages/new`
- 检查方法（在 `<TEST>` 目录执行）：

  ```bash
  find demo/localtest -newer package.json -type f
  ```

  输出中**关注 `.ets` 源文件**（如 `demo/localtest/entry/src/main/ets/pages/new.ets`，或用户声称准备的其它文件），列出即说明输入已更新。注意 `build_config.json` 是 localtest 的**生成物**（每次编译都会刷新 mtime）、`build_config_template.json` 可能因 Step 3 的批准修改而变新——这两类不代表用户准备了新输入，忽略即可。
- 判定与动作：
  - **已更新** → 用户已就绪，继续 Step 2
  - **未更新** → **停下来，请用户修改 `demo/localtest/entry/src/main/ets/pages/new.ets`（写入要测试的 ArkUI 场景源码）并确认准备就绪**。得到确认前不得继续后续步骤，也不得自行虚构测试场景

### Step 2: 规范化 localtest 输入（可选，需用户逐项批准）

Step 1 确认就绪后，可对 `demo/localtest/entry/src/main/ets/pages/new.ets` 做**可选**的规范化更新，使输入适配测试基建（mock 资源表没有 sys 资源、测试输入不需要导出符号）。**每一项更新都必须先列出受影响位置、请求用户批准，批准后才执行**；用户说 skip 则跳过该项。

| # | 更新项 | 规则 | 执行方式 |
|---|--------|------|----------|
| 1 | 统一 `$r()` 调用参数 | 所有 `$r('...')` → `$r('app.string.app_name')` | `sed -i "s/\$r('sys\.[^']*')/\$r('app.string.app_name')/g"`；先 `grep -n '\$r('` 列出位置报给用户 |
| 2 | 统一 `$rawfile()` 调用参数 | 所有 `$rawfile('...')` → `$rawfile('app.mock.txt')` | 同样先 `grep -n '\$rawfile('` 列位置；无调用则请用户批准 skip 或空操作 |
| 3 | 移除所有 `export` 关键字 | 删除语句行首的 `export `（interface/const/function/struct） | `sed -i 's/^export //; s/^  export /  /'`；先 `grep -n 'export'` 列出清单报给用户 |

流程约束：
- 顺序执行 1 → 2 → 3，每项独立请求批准（如"是否批准执行 Update 1？"）
- 每项执行后立即 `grep` 验证替换完整（残留计数为 0），并向用户报告结果再进入下一项
- 本步骤完成后才进入 Step 3

### Step 3: 编译验证 localtest（需用户确认完成）

Step 2 完成后，先检查编译配置再编译。**移除插件的动作需要用户批准**，编译结果必须报告给用户、由用户确认后本步骤才算完成。

**① 检查 plugins 配置（需用户批准才修改）**

读 `demo/localtest/build_config_template.json` 的 `"plugins"` 节：若**第一个插件是 `ui_syntax_plugin`，必须移除它**（语法 lint 插件会在编译期注入诊断，干扰变换结果观察）。移除前向用户展示 diff 并请求批准，例如：

```diff
  "plugins": {
-   "ui_syntax_plugin": "workspace/out/sdk/ohos-sdk/linux/ets/static/build-tools/ui-plugins/lib/ui-syntax-plugins/index",
    "ui_plugin": "workspace/out/sdk/ohos-sdk/linux/ets/static/build-tools/ui-plugins/lib/ui-plugins/index",
    "memo_plugin": "workspace/out/sdk/ohos-sdk/linux/ets/static/build-tools/ui-plugins/lib/memo-plugins/index"
  },
```

移除后第一个插件应为 `ui_plugin`。批准后用 `python3`+`json`（`object_pairs_hook=OrderedDict` 保持键序）删除，并 `grep` 验证。

**①′ 确认 compatibleSdkVersion（编译前询问用户）**

读 `demo/localtest/build_config_template.json` 的 `compatibleSdkVersion`（如 `"compatibleSdkVersion": 20`），**向用户确认是否就用该默认值编译**。若用户想改（如 26），先批准再修改模板后编译。

⚠️ 此值必须与后续 Step 6-2 中 testcase 的 `projectConfig.compatibleSdkVersion` **保持一致**——expectedScript 的 dump 由本步骤编译生成，两边不一致会导致 Step 8 快照比对失败（教训：dump 在默认 20 下生成、testcase 却设 26，比对必失败，只能改回默认）。

**② 执行编译**

在 `<TEST>`（`arkui-plugins/test`）目录运行：

```bash
npm run localtest
```

（脚本会先重新生成 `build_config.json` 并重新编译插件产物，再用 SDK driver 编译 `pages/new.ets`。）

**③ 判定编译结果并向用户报告**

成功标志（日志中依序出现）：
- `[Ets2panda] Parser plugins finished`
- `[Ets2panda] Checker plugins finished`
- `[Ets2panda] Compiled abc file for cycle SimultaneousBuildId`
- 产物生成：`dist/modules_static.abc`（及 `dist/cache/modules_intermediate.abc`）

常见的**非致命**输出（不构成失败，报告时说明即可）：
- 大量 `W125428`（SDK `.d.ets` 的 `'Memo'/'CommonMethod' has already imported`）——SDK 声明文件固有的重复导入提示
- 针对输入文件的 `W65001`（恒 false 等值判断）、`W670214`（过度类型转换）等代码质量警告

真实失败的标志：`ERROR: E******`、`FATAL`、无 abc 产物、npm 退出码非 0。

**④ 用户确认**

把成功/失败判定与关键证据（成功标志行、产物路径、警告摘要）报告给用户，**明确询问"本步骤是否可以视为完成？"**——用户确认后才进入 Step 4；若失败，先修复编译问题（通常是输入文件的语法/类型问题）并重复 ②③。

### Step 4: 准备测试输入与调试 dump（testcase 创建的前置步骤）

本步骤包含两个子步骤，为后续编写期望快照提供物料。

**4-1 复制改动的 `.ets` 到 mock 目录（目录与文件名必须询问用户）**

- 把 Step 1 确认的改动 `.ets` 文件内容复制到 `test/demo/mock/` 下的新文件，作为测试输入
- **目标文件夹和新文件名都由用户提供**——逐一询问，不要自行决定：
  - "请提供该文件在 `test/demo/mock/` 下的目标文件夹"
  - "请提供新文件名"
- 改动的 `.ets` 可能有多个，**逐个文件询问**目标位置与名称
- 复制后校验并报告：行数一致、Step 2 规范化内容已带入（如 `app.string.app_name` 计数）、无 `export` 残留
- 实操：`cp <localtest 源文件> demo/mock/<用户指定目录>/<用户指定名>.ets`

**4-2 打开调试 dump 开关并重新编译（需用户批准）**

1. 请求批准后，将 `<ARKUI_PLUGINS>/common/debug.ts` 中的：
   ```diff
   -const isDebugDump: boolean = false;
   +const isDebugDump: boolean = true;
   ```
2. 在 `<TEST>` 目录重跑 `npm run localtest`（判定标准同 Step 3③）
3. 编译成功后在 `<TEST>/dist/cache/` 下生成两个 dump 目录：
   - `dist/cache/BEFORE/_simult_/` —— 各变换阶段**前**的源码 dump
   - `dist/cache/AFTER/_simult_/` —— 各变换阶段**后**的源码 dump
   - 文件命名模式：`<阶段号>_<插件名>__<文件路径转换>.sts`（如 `3_uiTransform__entry.src.main.ets.pages.new.sts`）；目标文件的 dump 用文件名片段 grep 查找
   - 注意：目录实际在 `dist/cache/` 下（不是 `dist/` 直接下）；通常**没有** `DEBUG` 目录，以实际生成结果为准并向用户报告
4. **还原开关（步骤收尾的强制动作）**：拿到 dump 后，把 `common/debug.ts` 的 `isDebugDump` 改回 `false`——**必须在宣布 Step 4 完成之前完成**，避免污染后续正常编译产物
5. **向用户报告产物位置与目标文件的 dump 清单，由用户确认后本步骤才算完成**
6. 这两个目录（`BEFORE`/`AFTER`）是后续 Step 7 编写期望快照的对照物料

### Step 5: 创建 testcase 文件（只建文件，不填内容）

通过**逐级询问用户**定位新测试文件的位置——不要替用户决定目录层级：

**5-1 选择主目录**（`test/ut/` 下三选一或新建，向用户列出选项）：

| 选项 | 主目录 | 用途 |
|------|--------|------|
| A | `ut/common/` | 测试 `arkui-plugins/common` 下的公共工具功能 |
| B | `ut/memo-plugins/` | 仅测 memo 变换（通常不含 UI 变换） |
| C | `ut/ui-plugins/` | 测 UI 变换（可含 UI 变换后的 memo 变换） |
| D | 新建 | 用户提供名称 |

**5-2 选择子目录**：用户选定主目录后，`ls ut/<主目录>/` 列出现有子目录（可附各目录的 `.test.ts` 计数和含义说明），让用户挑选或提供新目录名。参考含义（`ui-plugins` 侧）：

| 子目录 | 含义 |
|--------|------|
| `advanced-ui-components/` | 高级 UI 组件（chip、popup 等） |
| `animation/` | 动画变换 |
| `builder-lambda/` | @Builder / @BuilderParam |
| `component/` | struct→class、组件变换 |
| `declarations/` | 声明类型交互（class/interface/function） |
| `decorators/<装饰器名>/` | 装饰器变换（@State/@Link/@Prop…，按装饰器再分孙目录） |
| `double-dollar/` | $$ 语法 |
| `entry/` | @Entry 路由/导航元数据 |
| `exports/`、`imports/` | export/import 行为 |
| `insight-intent/` | 用户意图 元数据 |
| `router-map-pages/` | 路由表 |
| `wrap-builder/` | wrap-builder |

⚠️ `ut/ui-plugins/unit/` 是语法 lint 测试专区（被 jest ignore），不要作为选项列出。

**5-3 testcase 命名**：请用户提供测试文件名（不带 `.test.ts` 后缀）。

**5-4 创建文件**：创建 `ut/<主目录>/<子目录>/<用户命名>.test.ts`，初始内容只写 Apache 版权头（拷贝任一现有 `.test.ts` 的头）。**到此为止——骨架与内容在 Step 6 填写。**

### Step 6: 填写 testcase 内容（逐项询问用户）

testcase 文件的结构与其它 `.test.ts` 一致（版权头、导入、buildConfig、插件、expectedScript、测试函数、run()）。填写前**按下列顺序逐项询问用户**（一次一个问题），收集完再一次性写入文件。回答过程中的约定：用户说 "stop" 表示**连当前正在询问的选项一并否决**。

**6-1 compileFiles**：确认需要编译的文件清单。默认仅 Step 4-1 复制的 mock 文件；若测试涉及本地依赖（多文件编译），把全部文件加入（范例：`ut/ui-plugins/imports/import-struct.test.ts`）。**路径必须真实存在，禁止写入无效路径**。

**6-2 projectConfig 附加字段**：默认用 `mockProjectConfig()`；列出可自定义字段（含默认值）让用户挑选，如 `compatibleSdkVersion`（默认未设置，常用 23/26，范例 `ut/ui-plugins/component/all-components.test.ts`）、`debugLine`、`uiTransformOptimization`（默认 false）、`compileHar`（默认 false）等。有自定义字段时按 `const projectConfig: ProjectConfig = mockProjectConfig(); projectConfig.<field> = <value>;` 写，并作为 `PluginTester` 构造第三参。⚠️ 若设置 `compatibleSdkVersion`，必须与 Step 3①′ 编译 localtest 时用的值**一致**（dump 以该值生成；不一致会让 Step 8 快照比对失败）。

**6-3 parsed 插件**：询问是否需要 after-parse 插件；惯例 `uiTransform().parsed`（范例 `mock-chip.test.ts`），变量名可自拟（如 `mockPopupParsed`）。

**6-4 after-checked 插件序列**：列出全部可选插件（`test/utils/plugins/`，**不含 `recheck`**），让用户挑选并**给出顺序**；`recheck` 自动追加在序列末尾（除非用户明说不要）：

| 导出名 | name | 作用 |
|--------|------|------|
| `beforeUINoRecheck` | `before-ui-no-recheck` | UI checked 变换前置准备 |
| `uiNoRecheck` | `ui-no-recheck` | UI checked 主变换（CheckedTransformer） |
| `collectNoRecheck` | `collect-no-recheck` | 元数据收集（UI+memo） |
| `memoNoRecheck` | `memo-no-recheck` | memo（unmemoize）变换 |
| `builderLambdaNoRecheck` | `builder-lambda-no-recheck` | builder lambda 变换 |
| `structNoRecheck` | `struct-no-recheck` | struct 相关变换 |
| `beforeInsightIntentNoRecheck` | `before-insight-intent-no-recheck` | 用户意图 前置 |
| `insightIntentNoRecheck` | `insight-intent-no-recheck` | 用户意图 变换 |

经典组合：UI 链路 `[parsed, beforeUINoRecheck, uiNoRecheck, recheck]`；UI+memo 双链路 `[parsed, collectNoRecheck, uiNoRecheck, memoNoRecheck, recheck]`（范例 `constant-usage.test.ts`）。

**6-5 test hooks**：逐个询问（每次报一个建议键，用户"是"则记录、"stop"则连当前提议一起否决并结束 hook 收集，也可指定其它键）。hook 键两类：裸状态（`parsed`/`checked`，全部插件执行完后触发一次）与插件专属（`<state>:<plugin name>`，特定插件执行完后触发）；机制见 `utils/plugin-tester.ts` 与 `utils/plugin-driver.ts` 的 `collectHistory()`。每个 hook 绑定一个测试函数（函数名自拟，如 `testMockPopupUITransformer`），断言 `this.scriptSnapshot` 与 expectedScript 经 `parseDumpSrc()` 归一化后的比对。

**6-6 early-stop**（必填，`pluginTester.run()` 第 4 参数的 `stopAfter`）：列出选项让用户挑——`'checked'`（最常用）与 `'parsed'`；其它状态（`afterNew`/`scopeInited`/`lowered`/`asmGenerated`/`binGenerated`/`clean`）按需提供。规则：hooks 执行到 after-check 就选 `'checked'`。

**6-7 tracing**：询问是否断言外部源（被 import 的依赖/SDK 模块）dump。是→先问 external source 名称，在第 4 参数加 `tracing: { externalSourceNames: ['<完整键名>'] }`（键名 = `<packageName>.<相对路径转换>`，范例 `ut/ui-plugins/declarations/class-observedV2-usage.test.ts`）；否→不加。

**6-8 命名**：询问两个名字——PluginTester 构造第一参（describe 名，惯例 `test <区域> <名称>`）与 `run()` 第一参（测试名，惯例 `transform <区域> <名称>`）。

**6-9 写入文件**：把收集的信息一次性填入 Step 5 创建的 `.test.ts`。expectedScript **留空串**（Step 7 从 dump 物料填充，见下节）。变量名（插件名、测试函数名、目录常量）可自行拟定，风格与同目录现有测试一致。

### Step 7: 填充期望快照（expectedScript）

**7-1 先缓存 dump（跑测试会清理 dist）**

把 Step 4-2 的 dump 目录拷到 `/tmp`（或任意 dist 外的位置）：

```bash
cp -r dist/cache/AFTER /tmp/<名称>-after && cp -r dist/cache/BEFORE /tmp/<名称>-before
```

**7-2 确认比对方式并向用户确认**：询问用户是否按 Step 6 收集的 hooks 比对（通常是的）。

**7-3 按 hook 规则定位 dump 文件**（目录 `<缓存>/AFTER/_simult_/`）：

| 维度 | 规则 |
|------|------|
| 阶段前缀 | hook 是 `checked` 系 → 找前缀 `3_`；hook 是 `parsed` 系 → 前缀 `1_` |
| 插件链 | UI 链（parsed 插件也算 UI）→ 找 `uiTransform`；memo 链 → 找 `unmemoizeTransform` |
| 文件名 | localtest 改动的主文件 → 含 `entry.src.main`；外部源 → 含 Step 6-7 问到的 external source 名 |

组合示例：hook `checked:ui-no-recheck` → `3_uiTransform__entry.src.main.ets.pages.new.sts`。

**7-4 拷贝 dump 内容到 expectedScript**

- dump 文件本身**不含版权头**，内容整体拷入 `expectedScript` 模板字符串
- 嵌入时转义：`\` → `\\`、`` ` `` → `` \` ``、`${` → `\${`（可用 python3 脚本处理），并校验运行时值与 dump 逐字节一致
- 模板字面量的结构（开头换行）要与 dump 自身的行首空行协调，避免整体偏移一行——以 node `eval` 运行时值与 dump 比对 `True` 为准

**7-5 可选的占位符/模板函数**（当需要手工精简快照时）：

- `parseDumpSrc()` 比对前会把两侧 `gensym___\d+`（及 `gensym%%_\d+`）归一化为 `<some_random_number>`、导入排序、空白折叠——gensym 数可直接写占位符
- getter/setter、constructor 样板可用 `utils/simplify-dump.ts`：`${dumpConstructor()}`、`dumpGetterSetter(GetSetDumper.BOTH, ...)`、`dumpAnnotation('<Name>')`

**7-6 向用户展示填充结果并请其审阅**（用户确认正确后本步骤完成）。

### Step 8: 微调 expectedScript 直到测试通过

目标：跑通新 testcase。**唯一的修复手段是修改 expectedScript**——不改输入 `.ets`、不改插件配置。

**8-1 运行测试**

在 `<TEST>` 目录：

```bash
npm run test -- test/ut/<主目录>/<子目录>/<名称>.test.ts
```

（等价的手动 jest 命令：在 `<ARKUI_PLUGINS>` 下 `LD_LIBRARY_PATH=$PWD/../out/sdk/ohos-sdk/linux/ets/static/build-tools/ets2panda/lib ./node_modules/.bin/jest test/ut/... --config ./jest-test.config.js --silent`。`LD_LIBRARY_PATH` 必须指向 es2panda native 库；`--config ./jest-test.config.js` 相对仓根解析。）

**8-2 分析失败 diff**

第一次运行大概率失败。用 `grep "^    [+-]"` 提取差异行，按类别归组。**localtest 与 testcase 环境存在正常差异**，已知类别：

| 差异类别 | localtest dump | testcase 实际 | 修复（只改 expectedScript） |
|----------|----------------|---------------|------------------------------|
| 资源引用展开 | `$r("app.string.app_name")` | `_r(16777216, 10003, "com.example.mock", "entry")`（app 资源被静态展开为 `_r(id, type, bundleName, module)`；id/type 由 `app.string` 决定，bundle/module 来自 `mockProjectConfig` 默认值） | 把 dump 中的 `$r("app.string.app_name")` 全部替换为 `_r(16777216, 10003, "com.example.mock", "entry")`（`sed`/python 全局替换后复跑） |

这正是 Step 2 统一 `$r()` 参数的价值：展开后的参数是确定性的，可写进快照。

**8-3 迭代**

每轮：替换 expectedScript 中对应差异 → 复跑 → 直到 `Tests: 1 passed`。若差异无法用"改 expectedScript"解释或消除（如 crash、编译错误），回查 Step 3①′（compatibleSdkVersion 是否与 dump 编译一致）或 Step 6 的配置是否与生成 dump 时一致。

**8-4 完成标准**

`Tests: 1 passed, 1 total`，且无 `Test Suites: failed`。全量回归（可选）：`npm run test`（在 `<ARKUI_PLUGINS>` 下；会先 clean 并重新部署插件产物）。

## 进阶变体

### A. 多文件编译

`compileFiles` 是数组，每个文件都会生成独立的 hook 实例（`[<state>:<fileName>] <package>: <file>: <testName>`）。依赖的本地模块以**普通相对路径 import** 引入即可，`mockBuildConfig` 的 `sourceRoots`/`moduleRootPath` 已把 `test/demo/mock` 设为模块根，arktsconfig 会自动解析。
范例：`test/ut/ui-plugins/declarations/constant-usage.test.ts`（输入 `constant-usage.ets` import `./utils/constant`，`utils/constant` 以 `.d.ets` 声明文件提供）。

### B. 断言依赖文件的变换结果（declContexts）

被 import 的**非编译入口**文件（如上面的 `./utils/constant`）的快照进入 `this.declContexts`，键为 `<packageName>.<相对路径转换的源名>`（如 `mock.demo.mock.declarations.utils.constant`；`packageName` 默认 `'mock'`）。注意：键名匹配规则是 `startsWith('<packageName>.') && endsWith('.<入口文件名>')`——tracing 的 `externalSourceNames` 要写完整键名（如 `mock.demo.mock.declarations.utils.constant`）。
范例：`test/ut/ui-plugins/declarations/constant-usage.test.ts` 中
`this.declContexts?.['mock.demo.mock.declarations.utils.constant']?.scriptSnapshot`。

### C. 自定义 projectConfig

需要 SDK 版本等条件时用 `mockProjectConfig()` 覆盖字段，作为 `PluginTester` 构造第三参传入：

```typescript
import { mockProjectConfig } from '../../../../utils/artkts-config';
import { ProjectConfig } from '../../../../../common/plugin-context';

const projectConfig: ProjectConfig = mockProjectConfig();
projectConfig.compatibleSdkVersion = 23;
const pluginTester = new PluginTester('test style optimization', buildConfig, projectConfig);
```

范例：`test/ut/ui-plugins/builder-lambda/style-optimization.test.ts`（`compatibleSdkVersion = 23`）、`component/all-components.test.ts`（26）。

### D. 插件数组与 hook 键组合

`pluginTester.run(testName, plugins, hooks, options)` 的机制：
- `plugins` 数组按声明顺序执行；每个插件的 name 与阶段组合出 hook 键。`MockPluginDriver` 会记录两类键：`<state>`（裸状态，匹配该状态所有文件）与 `<state>:<plugin name>`（匹配特定插件）
- `state` 取值：`parsed`（AST 解析后）、`checked`（类型检查后）
- 常用组合：

| 场景 | plugins | hooks 键 | options |
|------|---------|----------|---------|
| 仅 parsed 结构变换 | `[parsedTransform]` | `parsed: [fn]` | `stopAfter: 'parsed'` |
| UI 完整变换（parsed+checked） | `[parsedTransform, beforeUINoRecheck, uiNoRecheck, recheck]` | `'checked:ui-no-recheck': [fn]` | `stopAfter: 'checked'` |
| UI + memo 链路 | `[parsedTransform, collectNoRecheck, uiNoRecheck, memoNoRecheck, recheck]` | `'checked:ui-no-recheck': [fn]`, `'checked:memo-no-recheck': [fn]` | `stopAfter: 'checked'` |

- 同一状态多个插件时，用 `<state>:<plugin name>` 键分别断言各自阶段后的快照（如上例 UI 快照与 memo 快照分开断言）
- 范例：`test/ut/ui-plugins/declarations/constant-usage.test.ts`（UI+memo 双链路）

### E. tracing（外部源快照收集）

需要观察 import 的外部/依赖源码变换时，在 options 加 `tracing: { externalSourceNames: ['<完整键名>'] }`（键名规则见变体 B）。
范例：`test/ut/ui-plugins/animation/animation-basic.test.ts`（`tracing: { externalSourceNames: ['arkui.component.common'] }`）。

### F. `run()` 的 options 一览

`PluginTesterOptions`（`test/utils/plugin-tester.ts`）：
- `stopAfter`（必填）：`'parsed' | 'checked'`，编译停在哪个状态
- `buildConfig` / `projectConfig`（可选）：覆盖构造时传入的配置（多数测试不用）
- `tracing`（可选）：外部源快照收集，见变体 E

## 范例索引（仓内真实文件）

| 场景 | 范例 |
|------|------|
| 主干：装饰器变换 + `${dumpConstructor()}` 模板 | `test/ut/ui-plugins/decorators/state/state-basic-type.test.ts` |
| 多文件 + declContexts 断言 + UI/memo 双链路 | `test/ut/ui-plugins/declarations/constant-usage.test.ts` |
| 最简单骨架（无装饰器样板） | `test/ut/ui-plugins/use-namespace.test.ts` |
| 自定义 projectConfig | `test/ut/ui-plugins/builder-lambda/style-optimization.test.ts` |
| tracing | `test/ut/ui-plugins/animation/animation-basic.test.ts` |

## 支撑设施速查

| 设施 | 路径 | 用途 |
|------|------|------|
| 测试驱动器 | `test/utils/plugin-tester.ts` | `PluginTester` 类：编译 + hook 注册 |
| mock 构建配置 | `test/utils/artkts-config.ts` | `mockBuildConfig()`（packageName=`mock`）、`mockProjectConfig()` |
| 路径常量 | `test/utils/path-config.ts` | `getRootPath()`（=test 目录）、`MOCK_ENTRY_DIR_PATH`（=`demo/mock`） |
| 快照归一化 | `test/utils/parse-string.ts` | `parseDumpSrc()`：去版权头/导入排序/折叠空白/gensym 占位 |
| 快照模板函数 | `test/utils/simplify-dump.ts` | `dumpConstructor()`、`dumpGetterSetter()`、`dumpAnnotation()`、`GetSetDumper` |
| 阶段插件 | `test/utils/plugins/`（index.ts 汇出） | `beforeUINoRecheck`、`uiNoRecheck`、`collectNoRecheck`、`memoNoRecheck`、`recheck` 等 |
| jest 配置 | `jest-test.config.js`（仓根 `<ARKUI_PLUGINS>` 下） | testRegex、SDK 全局路径 |
