import { config } from "./local.config.js";

class Logger {
    level = 4
    constructor(level) {
        if (config["log-level"] !== undefined) {
            this.level = parseInt(config["log-level"])
        }
        if (level)
            this.level = level;
    }
    info(level, msg, ...moremsg) {
        if (level >= this.level) {
            console.log('[info] ' + msg, ...moremsg)
        }
    }
}

export const logger = new Logger()