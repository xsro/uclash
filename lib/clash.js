import { exec, execSync } from "child_process";
import generateP from "./randomString.js";
import { logger } from "./logger.js";
import * as fs from "fs";
import { asAbsolutePath } from "./util.js";

export class Clash {
    execOptions = { cwd: asAbsolutePath(".") }
    secret = false;
    time = {
        start: new Date(),
    }
    log = { path: asAbsolutePath("tmp/clash.log"), text: "" }
    constructor(options) {
        let args = [];
        const { d, extCtl, extUi, f, secret, t, v, daemon, log, dryrun } = options;
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

        if (daemon === "pm2") {
            execSync(`pm2 start clash -- ${args.join(" ")}`, { "encoding": "utf-8" })
        } else if (daemon === "screen") {
            execSync(`screen -S clash -dm clash ${args.join(" ")}`, { "encoding": "utf-8" })
        }

        const command = `clash ${args.join(" ")} ` + (log === "redirect" ? `> tmp/clash.log` : "")
        logger.info(4, command);

        if (!dryrun && !daemon) {
            function daemonExec(child, command, execOptions) {
                if (child && child.exitCode) {
                    logger.info(5, `clash exited with ${child.exitCode} now restarted`)
                }

                child = exec(command, execOptions);
                child.stdout.on("data", data => logger.info(0, data))
                child.stderr.pipe(process.stderr);
                child.on("exit", () => {
                    daemonExec(child, command)
                });
                if (log === "live") {
                    this.ilog();
                }
                if (log === "all") {
                    this._cp.stdout.on("data", data => logger.info(0, data));
                }
            }
            daemonExec(this._cp, command, this.execOptions);
        }
        if (fs.existsSync(this.log.path)) {
            this.log.text = fs.readFileSync(this.log.path, "utf-8");
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