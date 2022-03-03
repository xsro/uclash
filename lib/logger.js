class Logger {
    level = 4
    constructor(level) {
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