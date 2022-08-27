import { execSync } from "child_process";
import config from "../config";
import logger from "./logger";

type CurlOpts = { [id: string]: string }

function optionString(opts: CurlOpts = {}): string {
    let str = "";
    for (const key in opts) {
        if (opts[key] !== undefined)
            str += ` --${key} ${opts[key]}`
    }
    return str
}

function cURL(url: string, options: CurlOpts = {}) {
    const optsFromConfig: CurlOpts = config.get("curl", {});
    const opts = { ...optsFromConfig, ...options };
    const optsStr = optionString(opts);
    let command = "curl " + optsStr + " " + url;
    logger.debug(command)
    try {
        const r = execSync(command, { encoding: "utf-8" })
        return r
    } catch (e) {
        console.error((<any>e).stderr)
    }
    throw new Error()
}

function curl(str: string) {
    const r = execSync("curl " + str, { encoding: "utf-8" })
    return r;
}

export { curl, cURL }