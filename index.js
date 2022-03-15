#!/usr/bin/env node
import { execSync } from "child_process";
import { program } from "commander";
import * as fs from "fs";
import * as os from "os";
import { resolve } from "path";
import YAML from "yaml";
import Clash from "./lib/clash.js";
import findProxy from "./lib/find-proxy.js";
import { configMap, getClashConfig } from "./lib/getClashConfig.js";
import { ips } from "./lib/ip.js";
import { logger } from "./lib/logger.js";
import genPAC from "./lib/pac.js";
import updateClashProfile from "./lib/update.js";
import { config, defaultConfig, projectFolder, rawConfig, setConfig, uclashConfigPath, pack } from "./lib/util.js";

const execOpts = { cwd: projectFolder, stdio: "inherit", encoding: "utf-8" };

program
    .version(`
${fs.readFileSync(resolve(projectFolder, "resources/banner.txt"), "utf-8").trim()}

${pack.version}  ${os.platform}-${os.arch}
project dir:  ${projectFolder} 
process args: ${process.argv0}; ${process.argv} 
os version:   ${os.version()}
`)
    .description(pack.description)

program
    .command("config [key] [value]")
    .description(`update uclash configs in ${uclashConfigPath}, 
    if value set to null, the property will be removed, 
    if no value passed, the property will use the default.`)
    .option("-l,--list", "list the current config")
    .option("-d,--list-default", "list default config")
    .option("-r,--raw", "list raw config, with -l or -d")
    .action(function (key, value, options) {
        if (options.list) {
            console.log("\t" + Object.entries(
                options.raw ? rawConfig._config : config)
                .filter(val => val[0].match(key ? new RegExp(key) : undefined))
                .map(val => val[0] + ":\t" + val[1]).join("\n\t"))
            console.log("configs mapper")
            console.log(Array.from(configMap.entries()).map(val => `\t${val[0]}:\t${val[1]}`).join(os.EOL))
        }
        else if (options.listDefault) {
            console.log("\t" + Object.entries(
                options.raw ? rawConfig._defaultConfig : defaultConfig)
                .filter(val => val[0].match(key ? new RegExp(key) : undefined))
                .map(val => val[0] + ":\t" + val[1]).join("\n\t"))
        }
        else if (key) {
            if (value === "null") {
                value = null
            }
            key && setConfig(key, value)
        }
        logger.info(0, key, value)
    })

program
    .command("init")
    .argument("[folder]", "config or ui")
    .description("setup ui folder and clash config folder")
    .option("-f,--force", "rm all")
    .action(async function (folder, options) {
        if (folder === "config" || folder === undefined) {
            if (options.force) {
                fs.rm(config['config-folder'], { force: true, recursive: true })
            }
            if (config['config-folder']) {
                if (config["config-repo"]) {
                    if (fs.existsSync(config['config-folder'])) {
                        logger.info(4, `${config['config-folder']} has exists`)
                    } else {
                        execSync(`git clone ${config["config-repo"]} ${config['config-folder']} -b ${config["config-branch"]}`, execOpts)
                    }
                } else {
                    logger.info(4, "`config-repo` is not setted, skip")
                    //!fs.existsSync(config['config-folder']) && await fs.mkdir(config['config-folder'])
                }
            } else {
                logger.info(4, "`config-folder` is not setted")
            }
        }
        if (folder === "ui" || folder === undefined) {
            if (options.force) {
                fs.rm(config['ui-folder'], { force: true, recursive: true })
            }
            if (config['ui-folder']) {
                if (config["ui-repo"]) {
                    if (fs.existsSync(config['ui-folder'])) {
                        logger.info(4, `${config['ui-folder']} has exists`)
                    } else {
                        execSync(`git clone ${config["ui-repo"]} ${config['ui-folder']} -b ${config["ui-branch"]}`, execOpts)
                    }
                } else {
                    logger.info(4, "`ui-repo` is not setted, create a empty folder " + config['ui-folder']);
                    !fs.existsSync(config['ui-folder']) && fs.mkdirSync(config['ui-folder'])
                }
            }
            else {
                logger.info(4, "`ui-folder` is not setted")
            }
        }
    })

program
    .command("reset")
    .description("reset ui and config folder")
    .action(async function (options) {
        if (!fs.existsSync(config['ui-folder']) && config["ui-repo"]) {
            execSync(`git reset --hard origin/${config["ui-branch"]}`, { ...execOpts, cwd: config['config-folder'] })
        }
        if (!fs.existsSync(config['config-folder']) && config["config-repo"]) {
            execSync(`git reset --hard origin/${config["config-branch"]}`, { ...execOpts, cwd: config['config-folder'] })
        }
    })

program
    .command("crontab")
    .description("add crontab to update schedully")
    .action(async function () {
        fs.writeFileSync("30 6 * * * node $uclash_folder generate -cp >> ~/clash_gen.log", asCachePath("tab.txt"), "utf-8")
        execSync(`crond`, execOpts)
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
            if (!fs.existsSync(config['config-folder'])) {
                console.error("can't find configs");
                return
            } else {
                for (const profile of configMap.values()) {
                    const c = await getClashConfig(profile);
                    configs.push(c)
                }
            }
        } else {
            const c = await getClashConfig(uclashProfile);
            configs.push(c)
        }
        for (const c of configs) {
            logger.info(4, "update " + c.configPath);
            let before = "git pull";
            if (c.configPath.includes(projectFolder)) {
                before = ""
            }
            if (options.before) {
                before = options.before
            }
            await updateClashProfile(
                c.config,
                {
                    before,
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
    .option("-p,--command [cmd]", "the command to start clash, default is `clash`;-p means use `clash-premium`; -p cmd means use cmd you defined")
    .option("-D,--dryrun", "dry run")
    .option("-d,--daemon <screen|pm2|nohup&>", "use daemon to run clash, default is screen")
    .option("-c,--clash-log <redirect|all|force>", "clash log")
    .option("-s,--secret [string]", "set secret for API")
    .action(
        async function (uclashProfile, options) {
            logger.info(1, options)

            const clashConf = await getClashConfig(uclashProfile)

            const profileDst = clashConf.config.parser.destination;

            if (fs.existsSync(config['ui-folder'])) {
                options.ui = config['ui-folder'];
            }

            //run clash
            const profile_text = fs.readFileSync(profileDst, { encoding: "utf-8" })
            const profile_obj = YAML.parse(profile_text);
            options.daemon = options.daemon ? options.daemon : "screen";
            let daemonCommand = options.daemon.replace("&", "").trim();
            if (daemonCommand) {
                try {
                    execSync("command -v " + daemonCommand, { encoding: "utf-8" });
                } catch (e) {
                    logger.info(4, `command ${daemonCommand} not found`);
                    // console.error(e)
                    options.daemon = undefined;
                }
            }

            const clash = new Clash({
                f: profileDst,
                extUi: options.ui,
                secret: options.secret,
                clashCMD: options.command === true ? "clash-premium" : options.command,
                clashLog: options.clashLog,
                daemon: options.daemon,
                dryrun: options.dryrun
            });

            let msg = `代理服务端口: ` + Object.keys(profile_obj).filter(val => val.includes("port")).map(key => `${key}:${profile_obj[key]}`);

            let ui = {
                local: undefined,
                subFolder: undefined,
                subFolderSeg: undefined,
                link: undefined
            };
            if (options.ui) {
                const subFolderSeg = config["ui-subfolder"]
                const subFolder = resolve(config["ui-folder"], subFolderSeg);
                !fs.existsSync(subFolder) && fs.mkdirSync(subFolder);
                ui = {
                    local: options.ui,
                    //sub path for put files by uclash
                    subFolder, subFolderSeg
                }
            }

            const dashboardLinks = [
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
            if (options.ui && fs.existsSync(resolve(options.ui, "CNAME"))) {
                const originalWebsiteName = fs.readFileSync(resolve(ui.local, "CNAME"), "utf-8");
                const site = dashboardLinks.find(val => val.website.includes(originalWebsiteName.trim()));
                if (site) {
                    dashboardLinks.push({ ...site, website: `http://${controller}/ui` })
                }
            }
            const net = []; const subsubSegs = [];
            const getSubsubSeg = (ip) => {
                return ip.split(".").map(parseFloat).map(val => val.toString(16)).map(val => val.length === 2 ? val : "0" + val).join("") + "/"
            }
            for (const [name, _ips] of Object.entries(ips)) {
                for (const ip of _ips) {
                    const controller = "http://" + profile_obj["external-controller"].replace("0.0.0.0", ip);
                    const dashboards = dashboardLinks.map(h => {
                        const url = new URL(h.website);
                        if (h.host)
                            url.searchParams.set(h.host, ip);
                        if (h.port)
                            url.searchParams.set(h.port, controller.split(":")[2]);
                        return url;
                    });
                    if (ui.local) {
                        const uilink = new URL(controller + "/ui/");
                        const subsubSeg = getSubsubSeg(ip)
                        const subsubFolder = resolve(ui.subFolder, subsubSeg);
                        !fs.existsSync(subsubFolder) && fs.mkdirSync(subsubFolder);
                        const _pacs = await genPAC(subsubFolder, profile_obj, ip);
                        const pacs = _pacs.map(pac => {
                            const paclink = new URL(ui.subFolderSeg + '/' + subsubSeg + pac, uilink)
                            return paclink
                        })
                        net.push({ name, ip, controller, subsubSeg, uilink, pacs, dashboards })
                    } else {
                        net.push({ name, ip, controller, pacs: [], dashboards })
                    }

                }
            }

            for (const { name, ip, controller, uilink, subsubSeg, pacs, dashboards } of net) {
                const tab = num => os.EOL + " ".repeat(num)
                msg += `
===网络: ${name} ip地址:${ip}===
api: ${controller} ${clash.secret ? `secret: ${clash.secret}` : ""}
ui links: ${uilink ? uilink + ui.subFolderSeg : "not setted"}
pacs: 
    ${pacs.join(tab(4))}
dashboards: 
    ${dashboards.join(tab(4))}
`;
            }
            logger.info(4, msg);

            if (ui.local) {
                const temp = fs.readFileSync(resolve(projectFolder, "resources", "index.html"), "utf-8");
                const htmlmsg = temp
                    .replace("{version}", pack.version)
                    .replace("{description}", pack.description)
                    .replace("{net}", net.map(val => `
<div id="${val.ip}"}>
<h3>${val.name}: <a href="#${val.ip}">${val.ip}</a></h3>
<ul>
  <li>RESTful Api: <a href="${val.controller}">${val.controller}</a> , <a href="${val.uilink}">external-ui</a>,  <a href="${val.uilink + ui.subFolderSeg}">subfolder</a>
  <li>dashboard: 
${val.dashboards.map(p => `<a href="${p.toString()}">${p.hostname}</a>`).join(os.EOL)}</li>
  <li><a href="${val.uilink + ui.subFolderSeg + '/' + val.subsubSeg}">pacs</a>:
${val.pacs.map(p => `<a href="${p.toString()}">${p.pathname.substring(p.pathname.lastIndexOf("/") + 1)}</a>`).join(os.EOL)}</li>
</ul>
</div>
`).join(""))
                fs.writeFileSync(resolve(ui.subFolder, "index.html"), htmlmsg, "utf-8");
                fs.writeFileSync(resolve(ui.subFolder, "info.json"), JSON.stringify({ net, profile_obj, ui, clash }), "utf-8");
                logger.info(8, `visit this message from ${resolve(ui.subFolder, "index.html")}`)
            }
            return
        }
    )

program.command("find [ip-filter] [path] [port]")
    .description("find proxy in the local net")
    .action(findProxy)

program.parse()






