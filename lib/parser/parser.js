import { pack } from "../util.js";
import * as parser1 from "./parser1.js";
import * as parser2 from "./parser2.js";
import { EOL } from "os";

//write the infomation
function flat(info) {
    if (typeof info !== "object") return ""
    const msgs = Object.entries(info)
        .sort(((a, b) => -(a[1] - b[1])))
        .map(function (val) {
            const [name, time] = val
            return `${name}:${time instanceof Date ? time.toLocaleString() : time}`
        })
    return msgs
}

/**
 * parse the config file and return the 
 * @param {Object} config 
 * @returns {Promise<{text:string,updateTime:Date,areas:Object,updateTimeMsg:string[]}>}:
 */
async function parse(config, cache) {
    let parsed = null;
    if (config.parser.type === 1) {
        parsed = await parser1.parse(config, cache)
    }
    else {
        parsed = await parser2.parse(config, cache)
    }
    if (parsed) {
        parsed.updateTimeMsg = flat(parsed.updateTime)
        parsed.text = `#uclash ${pack.version}
#${parsed.updateTimeMsg.join(EOL + "#")}
`+ parsed.text;
    }
    return parsed
}

export default parse