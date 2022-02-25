import * as parser1 from "./parser1.js";
import * as parser2 from "./parser2.js";

/**
 * parse the config file and return the 
 * @param {Object} config 
 * @returns {Promise<{text:string,updateTime:Date,areas:Object}>}:
 */
async function parse(config) {
    if (config.parser.type === 1) {
        return parser1.parse(config)
    }
    if (config.parser.type === 2) {
        return parser2.parse(config)
    }
}

export default parse