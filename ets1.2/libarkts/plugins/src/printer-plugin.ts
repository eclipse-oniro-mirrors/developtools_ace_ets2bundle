/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import * as arkts from "@koalaui/libarkts"
import { PrintVisitor } from './print-visitor'

export interface TransformerOptions {
    trace?: boolean,
}

export function printerTransformer(
    userPluginOptions?: TransformerOptions
) {
    return (program: arkts.Program) => {
        return new PrintVisitor().visitor(program.ast)
    }
}

export function init(parsedJson?: Object, checkedJson?: Object) {
    let pluginContext = new arkts.PluginContextImpl()
    const parsedHooks = new arkts.DumpingHooks(arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED, "printer")
    const checkedHooks = new arkts.DumpingHooks(arkts.Es2pandaContextState.ES2PANDA_STATE_CHECKED, "printer")
    return {
        name: "printer",
        parsed(hooks: arkts.RunTransformerHooks = parsedHooks) {
            console.log("[printer-plugin] Run parsed state plugin")
            const transform = printerTransformer(parsedJson)
            const prog = arkts.arktsGlobal.compilerContext!.program
            const state = arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED
            try {
                arkts.runTransformer(prog, state, transform, pluginContext, hooks)
            } catch(e) {
                console.trace(e)
                throw e
            }
        },
        checked(hooks: arkts.RunTransformerHooks = checkedHooks) {
            console.log("[printer-plugin] Run checked state plugin")
            const transform = printerTransformer(checkedJson)
            const prog = arkts.arktsGlobal.compilerContext!.program
            const state = arkts.Es2pandaContextState.ES2PANDA_STATE_CHECKED
            try {
                arkts.runTransformer(prog, state, transform, pluginContext, hooks)
                arkts.recheckSubtree(prog.ast)
            } catch(e) {
                console.trace(e)
                throw e
            }
        },
    }
}
