import { pack } from "../util.js";
import * as parser1 from "./parser1.js";
import * as parser2 from "./parser2.js";

//write the infomation
function flat(info) {
    if (typeof info !== "object") return ""
    return Object.entries(info).sort(((a, b) => -(a[1] - b[1]))).map(val => `${val[0]}:${val[1]}`).join(",")
}

/**
 * parse the config file and return the 
 * @param {Object} config 
 * @returns {Promise<{text:string,updateTime:Date,areas:Object}>}:
 */
async function parse(config, cache) {
    let parsed = null;
    if (config.parser.type === 1) {
        parsed = await parser1.parse(config, cache)
    }
    if (config.parser.type === 2) {
        parsed = await parser2.parse(config, cache)
    }
    if (parsed) {
        parsed.updateTimeMsg = flat(parsed.updateTime)
        parsed.text = `#uclash ${pack.version}
#${parsed.updateTimeMsg}
`+ parsed.text;
    }
    return parsed
}

export default parse