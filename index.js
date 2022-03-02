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
import { existsSync, readFileSync } from "fs";
import { execSync } from "child_process";

async function getConfig(conf) {
    let configPath = conf;
    let configIdx = typeof conf === "string" && parseInt(conf) >= 0 ? parseInt(conf) : undefined;
    if (typeof configIdx === "number") {
        if (existsSync(asAbsolutePath("_config"))) {
            const files = await fs.readdir(asAbsolutePath("_config/"));
            const cfgs = files
                .filter(file => !file.startsWith("_") && file.endsWith(".yml"))
                .map(file => asAbsolutePath("_config/" + file));
            logger.info("finded " + Object.entries(cfgs).map(val => { let [k, v] = val; return `${k} ${v}` }).join("\t\n"))
            let i = conf ? parseInt(conf) : 0;
            configPath = cfgs[i]
        }
        else {
            if (conf === 1) {
                configPath = asAbsolutePath("config/GreenFish.json")
            }
            if (conf === 2) {
                configPath = asAbsolutePath("config/GreenFish.yml")
            }
            if (conf === 3) {
                configPath = asAbsolutePath("config/SS-Rule-Snippet.yml")
            }
        }
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
    .command("generate")
    .description("generate a profile from a uclash profile")
    .argument("[uclash_profile]", "use configuration from file, when undefined, all config will be used in _config")
    .option("-G,--no-git", "don't use git to commit generated clash profile")
    .option("--git-push", "push to remote if clash config profile changed")
    .action(async function (uclashProfile, options) {
        if (uclashProfile === undefined) {
            if (!existsSync(asAbsolutePath("_config"))) {
                console.error("can't find configs");
                return
            }
            const files = await fs.readdir(asAbsolutePath("_config/"));
            for (const file of files) {
                if (!file.startsWith("_") && file.endsWith(".yml")) {
                    const { config, configPath } = await getConfig("_config/" + file);
                    logger.info(4, "update " + configPath)
                    await updateClashProfile(config, options.git, options.gitPush)
                }
            }
        } else {
            const { config } = await getConfig(uclashProfile)
            await updateClashProfile(config, options.git, options.gitPush)
        }
    });


program
    .command("exec")
    .description("execute clash via child_process")
    .argument("<uclash-profile>", "use configuration from a file")
    .option("-u,--ui <path>", "start the ui from the path")
    .option("-D,--dryrun-deploy", "only generate clash command")
    .option("-d,--daemon <screen|pm2>", "use daemon to run clash")
    .option("-c,--clash-log <redirect|all|force>", "clash log")
    .option("-s,--secret [string]", "set secret for API")
    .option("-l,--log-level [string]", "set log level: 0:clash输出   2:  3:软件执行进度  4:部分重要执行结果 5:连接日志")
    .action(
        async function (uclashProfile, options) {
            if (options.logLevel === true) {
                logger.level = 0
            } else if (typeof options.logLevel === "string") {
                logger.level = parseInt(options.logLevel)
            }
            logger.info(1, options)

            if (existsSync(asAbsolutePath("_ui"))) {
                options.ui = asAbsolutePath("_ui");
            }

            const { config } = await getConfig(uclashProfile)

            const profileDst = config.parser.destination;

            if (options.update) {
                await updateClashProfile(config, options.git, options.gitPush).catch(console.error)
            }

            //run clash
            const profile_text = await fs.readFile(profileDst, { encoding: "utf-8" })
            const profile_obj = YAML.parse(profile_text);
            let daemon = options.daemon ? options.daemon : "screen"
            try {
                execSync("command -v " + daemon, { encoding: "utf-8" });
            } catch (e) {
                logger.info(4, `command ${daemon} not found`)
                daemon = undefined;
            }
            const clash = new Clash({
                f: profileDst,
                extUi: options.ui,
                secret: options.secret,
                clashLog: options.clashLog,
                daemon,
                dryrun: options.dryrunDeploy
            });
            if (options.dryrunDeploy) {
                return
            }

            let msg = `代理服务端口: ${profile_obj["port"]} socks: ${profile_obj["socks-port"]}`
            for (const net in ips) {
                for (const ip of ips[net]) {
                    const controller = profile_obj["external-controller"].replace("0.0.0.0", ip)
                    msg += `
===网络: ${net} ip地址:${ip}===
api: http://${controller}`
                    if (clash.secret) msg += ` secret: ${clash.secret}`;
                    const pacs = await genPAC(options.ui, controller, profile_obj, ip);
                    const uihosts = [
                        {
                            //https://github.com/Dreamacro/clash-dashboard
                            "website": "http://clash.razord.top/",
                            "host": "host",
                            "port": "port"
                        },
                        {
                            //https://github.com/haishanh/yacd
                            "website": "http://yacd.haishan.me/",
                        },
                    ];
                    if (options.ui && existsSync(resolve(options.ui, "CNAME"))) {
                        const originalWebsiteName = readFileSync(resolve(options.ui, "CNAME"), "utf-8");
                        const site = uihosts.find(val => val.website.includes(originalWebsiteName.trim()));
                        if (site) {
                            uihosts.push({ ...site, website: `http://${controller}/ui` })
                        }
                    }
                    const dashboards = uihosts.map(h => {
                        const url = new URL(h.website);
                        if (h.host)
                            url.searchParams.set(h.host, controller.split(":")[0]);
                        if (h.port)
                            url.searchParams.set(h.port, controller.split(":")[1]);
                        return url.toString();
                    });
                    msg += `
ui: http://${controller}/ui
controller: 
    ${dashboards.join("   ")},
pacs: 
    ${pacs.join("   ")}`
                }
            }
            logger.info(4, msg);
            return
        }
    )

program.parse()






