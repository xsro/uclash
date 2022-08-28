import { execSync } from "child_process";
import { CurlOpts, CURL } from "./config";
import logger from "./logger";

export class curlCp implements CURL {
    static optionString(opts: CurlOpts = {}): string {
        let str = "";
        for (const key in opts) {
            if (opts[key] !== undefined)
                str += ` --${key} ${opts[key]}`
        }
        return str
    }
    constructor(public optsFromConfig: CurlOpts) { }
    get appOpts() {
        return curlCp.optionString(this.optsFromConfig)
    }
    cURL(url: string, options: CurlOpts = {}) {
        const optsFromConfig: CurlOpts = this.optsFromConfig;
        const opts = { ...optsFromConfig, ...options };
        const optsStr = curlCp.optionString(opts);
        let command = "curl " + optsStr + " " + url;
        logger.debug(command)
        let r: string = ""
        try {
            r = execSync(command, { encoding: "utf-8" })
        } catch (e) {
            logger.info("[error]")
            console.error(e)
            process.exit()
        }
        return r
    }

    curl(str: string) {
        const r = execSync("curl " + str, { encoding: "utf-8" })
        return r;
    }
}

