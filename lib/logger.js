import logUpdate from 'log-update';

class Logger {
    level = 4
    constructor(level) {
        if (level)
            this.level = level;
    }
    info(level, msg, live) {
        if (level >= this.level) {
            if (live) { logUpdate(msg) }
            else { console.log('[info] ' + msg) }
        }
    }
}

export const logger = new Logger()