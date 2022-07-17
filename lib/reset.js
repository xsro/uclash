import { execSync } from "child_process";
import * as fs from "fs";
import { config, execOpts } from "./util.js";


export async function reset(options) {
    if (!fs.existsSync(config.get("ui-folder")) && config.get("ui-repo")) {
        execSync(`git reset --hard origin/${config.get("ui-branch")}`, { ...execOpts, cwd: config.get("ui-folder") });
    }
    if (!fs.existsSync(config.get("config-folder")) && config.get("config-repo")) {
        execSync(`git reset --hard origin/${config.get("config-branch")}`, { ...execOpts, cwd: config.get("config-folder") });
    }
}
