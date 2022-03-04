#!/usr/bin/env node
import updateClashProfile from "./lib/update.js";
import { program } from "commander";
import Clash from "./lib/clash.js";
import { config, defaultConfig, setConfig, projectFolder } from "./lib/util.js";
import * as fs from "fs/promises";
import { logger } from "./lib/logger.js";
import { join, resolve } from "path";
import YAML from "yaml";
import { ips } from "./lib/ip.js";
import genPAC from "./lib/pac.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";
import { getConfig } from "./lib/getConfig.js";

const execOpts = { cwd: projectFolder, stdio: "inherit", encoding: "utf-8" };

program
    .command("config [key] [value]")
    .description("manage configs")
    .option("-l,--list", "list the current config")
    .option("-d,--list-default", "list default config")
    .action(function (key, value, options) {
        if (options.list) {
            console.log("\t" + Object.entries(config).map(val => val[0] + ":\t" + val[1]).join("\n\t"))
        }
        if (options.listDefault) {
            console.log("\t" + Object.entries(defaultConfig).map(val => val[0] + ":\t" + val[1]).join("\n\t"))
        }
        key && setConfig(key, value)
    })

program
    .command("init")
    .option("-f,--force", "rm all")
    .action(async function (options) {
        if (options.force) {
            execSync("rm -rf _ui", execOpts)
            execSync("rm -rf _config", execOpts)
        }
        if (!existsSync(config['ui-folder']) && config["ui-repo"]) {
            execSync(`git clone ${config["ui-repo"]} ${config['ui-folder']} -b ${config["ui-branch"]}`, execOpts)
        }
        if (!existsSync(config['config-folder']) && config["config-repo"]) {
            execSync(`git clone ${config["config-repo"]} ${config['config-folder']} -b ${config["config-branch"]}`, execOpts)
        }
    })

program
    .command("reset")
    .action(async function (options) {
        if (!existsSync(config['ui-folder']) && config["ui-repo"]) {
            execSync(`git reset --hard origin/${config["ui-branch"]}`, { ...execOpts, cwd: config['config-folder'] })
        }
        if (!existsSync(config['config-folder']) && config["config-repo"]) {
            execSync(`git reset --hard origin/${config["config-branch"]}`, { ...execOpts, cwd: config['config-folder'] })
        }
    })

program
    .command("crontab")
    .action(async function () {
        writeFileSync("30 6 * * * node $uclash_folder generate -cp >> ~/clash_gen.log", asCachePath("tab.txt"), "utf-8")
        execSync(`crontab ` + asCachePath("tab.txt"), execOpts)
    })

program
    .command("generate")
    .description("generate a profile from a uclash profile")
    .argument("[uclash_profile]", "use configuration from file, when undefined, all config will be used in _config")
    .option("-c,--git-commit", "generate a git commit if config changed")
    .option("-p,--git-push", "push to remote if config changed")
    .option("-b,--before [string]", "command will be run before update profile,default is git pull")
    .option("-a,--allow-cache")
    .action(async function (uclashProfile, options) {
        const configs = [];
        if (uclashProfile === undefined) {
            if (!existsSync(config['config-folder'])) {
                console.error("can't find configs");
                return
            }
            const files = await fs.readdir(config['config-folder']);
            for (const file of files) {
                if (!file.startsWith("_") && file.endsWith(".yml")) {
                    const c = await getConfig("_config/" + file);
                    configs.push(c)
                }
            }
        } else {
            const c = await getConfig(uclashProfile);
            configs.push(c)
        }
        for (const c of configs) {
            logger.info(4, "update " + c.configPath)
            await updateClashProfile(
                c.config,
                {
                    before: options.before ? options.before : "git pull",
                    add: options.gitCommit,
                    commit: options.gitCommit,
                    after: options.gitPush ? "git push" : false
                },
                options.allowCache
            )
        }

    });


program
    .command("exec")
    .description("execute clash via child_process")
    .argument("<uclash-profile>", "use configuration from a file")
    .option("-u,--ui <path>", "start the ui from the path")
    .option("-D,--dryrun", "dry run")
    .option("-d,--daemon <screen|pm2>", "use daemon to run clash")
    .option("-c,--clash-log <redirect|all|force>", "clash log")
    .option("-s,--secret [string]", "set secret for API")
    .action(
        async function (uclashProfile, options) {
            logger.info(1, options)

            if (existsSync(config['ui-folder'])) {
                options.ui = config['ui-folder'];
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
                dryrun: options.dryrun
            });

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






