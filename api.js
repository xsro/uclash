import * as os from "os";
import { paths, pack } from "./lib/util.js";

import { cron } from "./lib/cron.js"
import { exec } from "./lib/exec.js"
import { find } from "./lib/find.js"
import { generate } from "./lib/generate.js"
import { init } from "./lib/init.js"
import { reload } from "./lib/reload.js"
import { reset } from "./lib/reset.js"
import { uclash_config } from "./lib/uclash_config.js"

export const version = `
██╗   ██╗ ██████╗██╗      █████╗ ███████╗██╗  ██╗
██║   ██║██╔════╝██║     ██╔══██╗██╔════╝██║  ██║
██║   ██║██║     ██║     ███████║███████╗███████║
██║   ██║██║     ██║     ██╔══██║╚════██║██╔══██║
╚██████╔╝╚██████╗███████╗██║  ██║███████║██║  ██║ ${pack.version}
 ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ${os.platform}-${os.arch}

project dir:  ${paths.projectFolder} 
process args: ${process.argv0}; ${process.argv} 
os version:   ${os.version()}
`
export const api = {
    cron,
    exec,
    find,
    generate,
    init,
    reload,
    reset,
    uclash_config,
}

