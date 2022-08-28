export enum LogLevel {
    debug = 0,
    info,
    warn,
    error,
    fatal,
    display,
}

class Logger {
    baseLogLevel: LogLevel = LogLevel.info;
    log(level: LogLevel, ...args: any[]) {
        if (level >= this.baseLogLevel) {
            console.log(...args)
        }
    }
    debug(...args: any[]) { this.log(LogLevel.debug, ...args) }
    info(...args: any[]) { this.log(LogLevel.info, ...args) }
    warn(...args: any[]) { this.log(LogLevel.warn, ...args) }
    error(...args: any[]) { this.log(LogLevel.error, ...args) }
    fatal(...args: any[]) { this.log(LogLevel.fatal, ...args) }
    display(...args: any[]) { this.log(LogLevel.fatal, ...args) }
}

const logger = new Logger()
export default logger
