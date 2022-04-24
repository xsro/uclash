import { exec, execSync } from "child_process";
import generateP from "./randomString.js";
import { logger } from "./logger.js";
import * as fs from "fs";
import { paths, config } from "./util.js";
import { resolve } from "path";
import { homedir } from "os";
import YAML from "yaml"

/**
 * Interface to connect with Clash
 */
export class Clash {
    clashCMD = "clash";
    execOptions = { cwd: paths.projectFolder };
    /**
     * contruct a Clash object to handle clash process
     * @param {string} cmd the command to exec clash
     * @param {Object} execOptions the child process option
     */
    constructor(cmd, execOptions) {
        if (cmd) this.clashCMD = cmd;
        this.execOptions = execOptions;
    }

    version() {
        let ver = ""
        try {
            ver = execSync(this.clashCMD + " -v", { encoding: "utf-8" })
        } catch (e) {
            return undefined
        }
        return ver.trim()
    }

    processName = "uclash";
    clashLogPath = config.get("clash-log")
    logs = [{
        start: new Date(),
        profilePath: undefined,
        profileObj: undefined,
        commandOpts: undefined,
    }]
    secret;
    extCtl;
    extUi;
    run(options) {
        let args = [];
        const log = {
            start: new Date(),
            profilePath: resolve(homedir(), ".config/clash/config.yaml"),
            profileObj: {},
            commandOpts: options
        }

        const { d, extCtl, extUi, f, secret, t, v, daemon, dryrun, clashLog } = options;
        if (d) {
            args.push(`-d "${d}"`)
            log.profilePath = resolve(d, "clash/config.yaml")
        }
        if (f) {
            args.push(`-f "${f}"`);
            log.profilePath = f
        }
        if (fs.existsSync(log.profilePath)) {
            const data = fs.readFileSync(log.profilePath, "utf-8");
            log.profileObj = YAML.parse(data);
            if (log.profileObj.secret) this.secret = log.profileObj.secret
            if (log.profileObj["external-controller"]) this.extCtl = log.profileObj["external-controller"]
            if (log.profileObj["external-ui"]) this.extUi = log.profileObj["external-ui"]
        }

        if (extUi) {
            args.push(`-ext-ui "${extUi}"`)
            this.extUi = extUi
        }
        if (extCtl) {
            args.push(`-ext-ctl "${extCtl}`)
            this.extCtl = extCtl
        }
        if (secret) {
            if (secret === true) {
                this.secret = generateP(Math.ceil(2 + Math.random() * 6))
            } else if (typeof secret === "string") {
                this.secret = secret
            }
            args.push(`-secret "${this.secret}"`)
        }

        const cmds = [];
        if (daemon === "pm2") {
            cmds.push(`pm2 start ${this.clashCMD} --name ${this.processName} -- ${args.join(" ")}`)
        }
        else if (daemon === "screen") {
            try {
                cmds.push(`screen -X -S ${this.processName} quit`)
            } catch (e) { logger.info(0, e) }
            cmds.push(`screen -S ${this.processName} -dm ${this.clashCMD} ${args.join(" ")}`)
        }
        else if (daemon === "nohup&") {
            cmds.push(`nohup ${this.clashCMD} ${args.join(" ")} >  ${this.clashLogPath} &`)
        }
        else if (daemon === "&") {
            cmds.push(`${this.clashCMD} ${args.join(" ")} > ${this.clashLogPath} &`)
        } else {
            let cmd = `${this.clashCMD} ${args.join(" ")}`
            if (clashLog === "redirect")
                cmd += `> ` + this.clashLogPath
            const opts = { "stdio": "inherit" }
            if (clashLog === "ignore") {
                opts.stdio = "ignore"
            }
            cmds.push({ cmd, sync: false, opts })
        }
        this.logs.push(log)
        if (dryrun) {
            console.log(cmds);
            return log.profileObj
        }
        for (let command of cmds) {
            if (typeof command === "string") {
                command = { cmd: command, sync: true }
            }
            try {
                let opts = command.opts ? command.opts : {
                    "encoding": "utf-8",
                    "stdio": "inherit"
                }
                if (command.sync === false) {
                    this._cp = exec(command.cmd, opts, () => undefined)
                    if (opts.stdio === "inherit")
                        this._cp.stdout.pipe(process.stdout)
                } else {
                    execSync(command.cmd, opts)
                }
            } catch (e) {
                console.log(e)
            }
        }
        return log.profileObj
    }
    stop() {
        this._cp.removeAllListeners("exit");
        this._cp.kill()
    }
    restart() {
        this._cp.kill()
    }
    ilog() {
        let count = 0;
        this._cp.stdout.on("data", data => {
            data.split("\n").forEach(element => {
                const msg = element.match(/msg="\[(.*?)\] (.*):(\d+) --> (.*):(\d+) match (.*?) using (.*?)\[(.*?)\]"/);
                if (msg) {
                    //https://stackoverflow.com/questions/17309749/node-js-console-log-is-it-possible-to-update-a-line-rather-than-create-a-new-l
                    const [all, protocol, address1, port1, address2, port2, rule, group, proxy] = msg;
                    const message = `[${protocol}] ${count++} 
代理: ${proxy}
域名: ${address2}:${port2}
规则: ${rule}
策略: ${group}
来源: ${address1}:${port1}  
`;
                    logger.info(5, message, true);
                    fs.writeFile(this.clashLogPath, this.log.text + `
start: ${this.time.start.toISOString()} connections:${count}
${message}`, "utf-8", () => { })
                }
            });
        })
    }
    stop() {
        if (this._cp.exitCode === null)
            this._cp.kill()
    }
}

export default Clash