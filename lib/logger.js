import { config } from "./util.js";

class Logger {
    level = 4
    constructor(level) {
        if (config.get("log-level") !== undefined) {
            this.level = parseInt(config.get("log-level"))
        }
        if (level)
            this.level = level;
    }
    info(level, msg, ...moremsg) {
        if (level >= this.level) {
            console.log(`[info ${level}] ` + msg, ...moremsg)
        }
    }
}

export const logger = new Logger()