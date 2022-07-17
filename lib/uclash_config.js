import * as os from "os";
import { profileMap } from "./utils/get-clash-profile.js";
import { logger } from "./utils/logger.js";
import { config } from "./util.js";


export function uclash_config(key, value, options) {
    logger.info(0, key, value, options);
    if (key && value === undefined) {
        console.log(config.get(key, options.listDefault));
    }
    else if (key && value) {
        config.set(key, value);
    }
    else if (options.listProfile) {
        console.log(Array.from(profileMap.entries()).map(val => `\t${val[0]}:\t${val[1]}`).join(os.EOL));
    }
    else if (options.list) {
        console.log("\t" + Object.entries(
            options.raw ? config._userConfig : config._parsed)
            .filter(val => val[0].match(key ? new RegExp(key) : undefined))
            .map(val => val[0] + ":\t" + val[1]).join("\n\t"));
    }
    else if (options.listDefault) {
        console.log("\t" + Object.entries(
            options.raw ? config._defaultConfig : config._parsedDefault)
            .filter(val => val[0].match(key ? new RegExp(key) : undefined))
            .map(val => val[0] + ":\t" + val[1]).join("\n\t"));
    } else {
        console.log(config._userConfigPath);
    }
}
