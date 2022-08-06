import { pack } from "../util.js";
import * as parser1 from "./parser1.js";
import * as parser2 from "./parser2.js";
import { EOL } from "os";
import fetch from "node-fetch";
import YAML from "yaml";
import { download, download2 } from "../utils/download.js";
import { ip192, ips } from "../ip.js";


//write the infomation
function flat(info) {
    if (typeof info !== "object") return [""]
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
 * @param {Object|String} config 
 * @returns {Promise<{text:string,updateTime:Date,areas:Object,updateTimeMsg:string[]}>}:
 */
async function parse(config, cache) {
    let parsed = null;
    console.log(config.parser)
    if (config.parser.type === 1) {
        parsed = await parser1.parse(config, cache)
    }
    else if (config.parser.type === 2) {
        parsed = await parser2.parse(config, cache)
    }
    else if (config.parser.type === 3) {
        parsed = await config.gen.call(
            { download, download2, YAML, fetch, ips, ip192 }
        )
    } else {
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