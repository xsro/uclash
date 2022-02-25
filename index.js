import updateClashProfile from "./lib/update.js";
import { program } from "commander";
import Clash from "./lib/clash.js";
import { asAbsolutePath } from "./lib/util.js";
import * as fs from "fs/promises";
import { logger } from "./lib/logger.js";
import { extname, resolve, isAbsolute, dirname } from "path";
import YAML from "yaml";
import { ips } from "./lib/ip.js";
import genPAC from "./lib/pac.js";
import { existsSync } from "fs";

async function getConfig(conf) {
    let configPath = conf;
    if (conf === "1") {
        configPath = asAbsolutePath("config/GreenFish.json")
    }
    if (conf === "2") {
        configPath = asAbsolutePath("config/GreenFish.yml")
    }
    if (conf === "3") {
        configPath = asAbsolutePath("config/SS-Rule-Snippet.yml")
    }

    if (!isAbsolute(configPath)) {
        configPath = resolve(process.cwd(), configPath)
    }
    const configText = await fs.readFile(configPath, { encoding: "utf-8" });
    let config = null
    switch (extname(configPath).toLowerCase()) {
        case ".yml":
        case ".yaml":
            config = YAML.parse(configText)
            break;
        case ".json":
            config = JSON.parse(configText)
            break
    }
    if (config === null) {
        throw new Error("can't read config file")
    }

    const { parser } = config;
    parser.destination = isAbsolute(parser.destination)
        ? parser.destination
        : resolve(dirname(configPath), parser.destination);
    if (parser[process.platform]) {
        for (const key in parser[process.platform]) {
            parser[key] = parser[process.platform][key];
        }
    }

    return { configPath, config }
}

program
    .command("generate [configuration]")
    .description("generate a profile from a configuration file")
    .option("-c,--configuration [string]", "use configuration")
    .option("-f,--copy-profile <string>", "the destination for copy profile to")
    .option("-G,--no-git", "don't use git to commit generated clash profile")
    .option("--git-push", "push to remote if clash config profile changed")
    .action(async function (configuration, options) {
        if (configuration) options.configuration = configuration;
        if (options.configuration === undefined) {
            if (!existsSync("_config")) {
                console.error("can't find configs");
                return
            }
            const files = await fs.readdir(asAbsolutePath("_config/"));
            for (const file of files) {
                if (!file.startsWith("_") && file.endsWith(".yml")) {
                    const { config } = await getConfig("_config/" + file);
                    await updateClashProfile(config, undefined, options.git, options.gitPush)
                }
            }
        } else {
            const { config } = await getConfig(options.configuration)
            await updateClashProfile(config, options.copyProfile, options.git, options.gitPush)
        }
    });


program
    .command("exec")
    .description("execute clash via child_process and update profile")
    .option("-c,--configuration [string]", "use configuration")
    .option("-a,--auto-update [string]", "auto update profile")
    .option("-G,--no-git", "don't use git to commit generated clash profile")
    .option("--git-push", "push to remote if clash config profile changed")
    .option("-f,--copy-profile <string>", "the destination for copy profile to")
    .option("-d,--deploy", "try to run clash to start proxy server")
    .option("-D,--dryrun-deploy", "only generate clash command")
    .option("-s,--secret [string]", "set secret for API")
    .option("-l,--log-level [string]", "set log level: 0:clash输出   2:  3:软件执行进度  4:部分重要执行结果 5:连接日志")
    .option("-u,--ui <path>", "start the ui from the path")
    .action(
        async function (options) {
            if (options.logLevel === true) {
                logger.level = 0
            } else if (typeof options.logLevel === "string") {
                logger.level = parseInt(options.logLevel)
            }
            logger.info(1, options)

            //define configuration file
            const { config } = await getConfig(options.configuration)

            const profileDst = config.parser.destination;

            //run clash
            const profile_text = await fs.readFile(profileDst, { encoding: "utf-8" })
            const profile_obj = YAML.parse(profile_text);
            const clash = new Clash({
                f: profileDst,
                extUi: options.ui,
                clashLog: options.clashLog,
                secret: options.secret,
                dryrun: options.dryrunDeploy
            });
            if (options.dryrunDeploy) {
                return
            }

            let msg = `代理服务端口: ${profile_obj["port"]} socks: ${profile_obj["socks-port"]}`
            for (const net in ips) {
                for (const ip of ips[net]) {
                    const host = profile_obj["external-controller"].replace("0.0.0.0", ip)
                    msg += `
网络: ${net} ip地址:${ip}
api: http://${host}`
                    if (clash.secret) msg += ` secret: ${clash.secret}`;
                    if (options.ui) {
                        const pacs = await genPAC(options.ui, host, profile_obj, ip)
                        msg += `
ui: http://${host}/ui
pacs: ${pacs.join(", ")}`
                    }
                }
            }
            logger.info(4, msg);

            await updateClashProfile(config, options.copyProfile, options.git, options.gitPush).catch(console.error)
            if (typeof options.autoUpdate === "string") {
                const autoUpdate = options.autoUpdate
                    .replace(/d/g, "*24h").replace(/h/g, "*60min")
                    .replace(/min/g, "60s").replace(/s/g, "*1000")
                    .split("*").reduce((pre, cur) => pre * cur);
                logger.info(4, `update interval ${autoUpdate / 1000} s`)

                let updateCount = 1;
                setInterval(async function () {
                    logger.info(4, `${updateCount++} auto update profile at ${new Date().toLocaleString()}`)
                    const { changed } = await updateClashProfile(config, options.copyProfile, options.git, options.gitPush).catch(console.error);
                    if (changed)
                        clash._cp.kill()
                }, autoUpdate)
            }
            return
        }
    )

program.parse()






