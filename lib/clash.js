import { exec, execSync } from "child_process";
import generateP from "./randomString.js";
import { logger } from "./logger.js";
import * as fs from "fs";
import { paths } from "./util.js";

export class Clash {
    execOptions = { cwd: paths.projectFolder };
    clashCMD = "clash";
    processName = "uclash"
    secret = false;
    time = {
        start: new Date(),
    }
    log = { path: paths.cache("clash.log"), text: "" }
    constructor(options) {
        let args = [];
        const { d, extCtl, extUi, f, secret, t, v, daemon, dryrun, clashCMD } = options;
        if (clashCMD) {
            this.clashCMD = clashCMD;
        }
        if (d) {
            args.push(`-d "${d}"`)
        }
        if (f) {
            args.push(`-f "${f}"`)
        }
        if (extUi) {
            args.push(`-ext-ui "${extUi}"`)
        }
        if (secret) {
            if (secret === true) {
                this.secret = generateP(Math.ceil(Math.random() * 6))
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
            cmds.push(`nohup ${this.clashCMD} ${args.join(" ")} > $HOME/clash.out &`)
        }
        else if (daemon === "&") {
            cmds.push(`${this.clashCMD} ${args.join(" ")} > $HOME/clash.out &`)
        } else {
            let cmd = `${this.clashCMD} ${args.join(" ")}`
            if (clashLog === "redirect")
                cmd += `> ` + this.log.path
            const opts = {}
            if (clashLog === "force") {
                opts.stdio = "inherit"
            }
            cmds.push({ cmd, sync: false, opts })
        }

        if (dryrun) {
            console.log(cmds);
            return
        }
        for (let cmd of cmds) {
            if (typeof cmd === "string") {
                cmd = { cmd: cmd }
            }
            try {
                let opts = cmd.opts ? cmd.opts : { "encoding": "utf-8", "stdio": "inherit" }
                if (cmd.sync && cmd.sync === false) {
                    this._cp = exec(cmd, opts)
                } else {
                    execSync(cmd, opts)
                }
            } catch (e) {

            }
        }
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
                    fs.writeFile(this.log.path, this.log.text + `
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