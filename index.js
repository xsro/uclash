#!/usr/bin/env node
import { execSync } from "child_process";
import { program } from "commander";
import * as fs from "fs";
import * as os from "os";
import { resolve } from "path";
import YAML from "yaml";
import Clash from "./lib/clash.js";
import findProxy from "./lib/find-proxy.js";
import { profileMap, getClashConfig } from "./lib/get-clash-profile.js";
import { ips } from "./lib/ip.js";
import { logger } from "./lib/logger.js";
import genPAC from "./lib/pac.js";
import { terminalProxyCMD } from "./lib/terminal.js";
import updateClashProfile from "./lib/update.js";
import { config, paths, pack } from "./lib/util.js";

const execOpts = { cwd: paths.projectFolder, stdio: "inherit", encoding: "utf-8" };

program
    .version(`
${fs.readFileSync(paths.resources("banner.txt"), "utf-8").trim()}

${pack.version}  ${os.platform}-${os.arch}
project dir:  ${paths.projectFolder} 
process args: ${process.argv0}; ${process.argv} 
os version:   ${os.version()}
`)
    .description(pack.description)

program
    .command("config [key] [value]")
    .description(`update uclash configs in ${config._userConfigPath}, 
    if value set to null, the property will be removed, 
    if no value passed, the property will use the default.`)
    .option("-l,--list", "list the current config")
    .option("-d,--list-default", "list default config")
    .option("-r,--raw", "list raw config, with -l or -d")
    .option("-p,--list-profile", "list clash config profile")
    .action(function (key, value, options) {
        logger.info(0, key, value, options)
        if (key && value === undefined) {
            console.log(config.get(key, options.listDefault))
        }
        else if (key && value) {
            config.set(key, value)
        }
        else if (options.listProfile) {
            console.log(Array.from(profileMap.entries()).map(val => `\t${val[0]}:\t${val[1]}`).join(os.EOL))
        }
        else if (options.list) {
            console.log("\t" + Object.entries(
                options.raw ? config._userConfig : config._parsed)
                .filter(val => val[0].match(key ? new RegExp(key) : undefined))
                .map(val => val[0] + ":\t" + val[1]).join("\n\t"))
        }
        else if (options.listDefault) {
            console.log("\t" + Object.entries(
                options.raw ? config._defaultConfig : config._parsedDefault)
                .filter(val => val[0].match(key ? new RegExp(key) : undefined))
                .map(val => val[0] + ":\t" + val[1]).join("\n\t"))
        } else {
            console.log(config._userConfigPath)
        }
    })

program
    .command("init")
    .argument("[folder]", "config or ui")
    .description("setup ui folder and clash config folder")
    .option("-f,--force", "rm all")
    .action(async function (folder, options) {
        if (folder === "config" || folder === undefined) {
            if (options.force) {
                fs.rmSync(config.get("config-folder"), { force: true, recursive: true })
            }
            if (config.get("config-folder")) {
                if (config.get("config-repo")) {
                    if (fs.existsSync(config.get("config-folder"))) {
                        logger.info(4, `${config.get("config-folder")} has exists`)
                    } else {
                        execSync(`git clone ${config.get("config-repo")} ${config.get("config-folder")} -b ${config.get("config-branch")}`, execOpts)
                    }
                } else {
                    logger.info(4, "`config-repo` is not setted, skip")
                    //!fs.existsSync(config.get("config-folder")) && await fs.mkdir(config.get("config-folder"))
                }
            } else {
                logger.info(4, "`config-folder` is not setted")
            }
        }
        if (folder === "ui" || folder === undefined) {
            if (options.force) {
                fs.rmSync(config.get("ui-folder"), { force: true, recursive: true })
            }
            if (config.get("ui-folder")) {
                if (config.get("ui-repo")) {
                    if (fs.existsSync(config.get("ui-folder"))) {
                        logger.info(4, `${config.get("ui-folder")} has exists`)
                    } else {
                        execSync(`git clone ${config.get("ui-repo")} ${config.get("ui-folder")} -b ${config.get("ui-branch")}`, execOpts)
                    }
                } else {
                    logger.info(4, "`ui-repo` is not setted, create a empty folder " + config.get("ui-folder"));
                    !fs.existsSync(config.get("ui-folder")) && fs.mkdirSync(config.get("ui-folder"))
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
        if (!fs.existsSync(config.get("ui-folder")) && config.get("ui-repo")) {
            execSync(`git reset --hard origin/${config.get("ui-branch")}`, { ...execOpts, cwd: config.get("ui-folder") })
        }
        if (!fs.existsSync(config.get("config-folder")) && config.get("config-repo")) {
            execSync(`git reset --hard origin/${config.get("config-branch")}`, { ...execOpts, cwd: config.get("config-folder") })
        }
    })

program
    .command("cron")
    .description("add a crontab to termux")
    .argument("<profile>")
    .action(async function (profile) {
        const next = new Date(Date.now() + 1000 * 60);
        const hour = next.getHours();
        const hours = [hour, (hour + 6) % 24, (hour + 12) % 24, (hour + 18) % 24];
        const script = paths.cache("uclash-service.sh")
        fs.writeFileSync(script, `
logPath="${config.get("crontab-log")}"
echo "==>update profile $(date)" >>$logPath
uclash generate ${profile} -cp >>$logPath 2>&1
if [ $? -eq 0 ]  
then 
    pkill clash
    uclash exec ${profile} --silent --clash-log inherit --daemon "nohup&" >>$logPath 2>&1
    ps aux | grep clash | head -1
    echo "==>restarted clash" >>$logPath
fi`, "utf-8")
        fs.writeFileSync(paths.cache("uclash-service.crontab"),
            `${next.getMinutes()} ${hours.join(",")} * * * bash ${script}` + os.EOL,
            "utf-8")
        execSync(`crontab ` + paths.cache("uclash-service.crontab"), execOpts)
    })

program
    .command("generate")
    .description("generate a profile from a uclash profile")
    .argument("[uclash_profile]", "use configuration from file, when undefined, all config will be used in _config")
    .option("-c,--git-commit", "generate a git commit if config changed")
    .option("-p,--git-push", "push to remote if config changed")
    .option("-b,--before [string]", "command will be run before update profile,default is git pull")
    .action(async function (uclashProfile, options) {
        const configs = [];
        if (uclashProfile === undefined) {
            if (!fs.existsSync(config.get("config-folder"))) {
                console.error("can't find configs");
                return
            } else {
                for (const profile of profileMap.values()) {
                    const c = await getClashConfig(profile);
                    if (!c.configPath.includes(paths.projectFolder))
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
            if (c.configPath.includes(paths.projectFolder)) {
                before = ""
            }
            if (options.before) {
                before = options.before
            }
            const changed = await updateClashProfile(
                c.config,
                {
                    before,
                    commit: options.gitCommit,
                    after: options.gitPush ? "git push" : false
                }
            );
            process.exitCode = changed ? 0 : 24;//https://tldp.org/LDP/abs/html/exitcodes.html
        }
    });


program
    .command("exec")
    .description("execute clash via child_process")
    .argument("<uclash-profile>", "use configuration from a file")
    .option("-u,--ui <path>", "start the ui from the path")
    .option("-p,--command [cmd]", "the command to start clash, default is `clash`;-p means use `clash-premium`; -p cmd means use cmd you defined")
    .option("-D,--dryrun", "dry run")
    .option("-d,--daemon <screen|pm2|nohup&>", "use daemon to run clash")
    .option("-c,--clash-log <redirect|inhert|ignore>", "clash log, default is inherit to console")
    .option("-S,--secret [string]", "set secret for API")
    .option("-s,--silent", "don't print message for net")
    .action(
        async function (uclashProfile, options) {
            logger.info(1, options)

            const clashConf = await getClashConfig(uclashProfile)

            const profileDst = clashConf.config.parser.destination;

            if (fs.existsSync(config.get("ui-folder"))) {
                options.ui = config.get("ui-folder");
            }

            //run clash
            const profile_text = fs.readFileSync(profileDst, { encoding: "utf-8" })
            const profile_obj = YAML.parse(profile_text);

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
                const subFolderSeg = config.get("ui-subfolder")
                const subFolder = resolve(config.get("ui-folder"), subFolderSeg);
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
            const net = [];
            const getSubsubSeg = (ip) => {
                return ip.split(".").map(parseFloat).map(val => val.toString(16)).map(val => val.length === 2 ? val : "0" + val).join("") + "/"
            }
            for (const [name, _ips] of Object.entries(ips)) {
                for (const ip of _ips) {
                    const controller = new URL("http://" + profile_obj["external-controller"].replace("0.0.0.0", ip));
                    const localDashboard = []

                    if (ui.local) {
                        const uilink = new URL("/ui/", controller);
                        if (fs.existsSync(resolve(options.ui, "CNAME"))) {
                            const originalWebsiteName = fs.readFileSync(resolve(ui.local, "CNAME"), "utf-8");
                            const site = dashboardLinks.find(val => val.website.includes(originalWebsiteName.trim()));
                            if (site) {
                                localDashboard.push({ ...site, website: uilink })
                            }
                        }
                        const dashboards = [...dashboardLinks, ...localDashboard].map(
                            function (h) {
                                const url = new URL(h.website);
                                if (h.host)
                                    url.searchParams.set(h.host, controller.hostname);
                                if (h.port)
                                    url.searchParams.set(h.port, controller.port);
                                return url;
                            });
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
            (!options.silent) && logger.info(4, msg);

            if (ui.local) {
                const temp = fs.readFileSync(
                    resolve(paths.projectFolder, "resources", "index.html"),
                    "utf-8");

                const htmlmsg = temp
                    .replace("{version}", pack.version)
                    .replace("{description}", pack.description)
                    .replace("{net}", net.map(val => {
                        const terminalProxy = terminalProxyCMD(val.ip, profile_obj)
                        return `
<div id="${val.ip}"}>
<h3>${val.name}: <a href="#${val.ip}">${val.ip}</a></h3>
<ul>
  <li>RESTful Api: <a href="${val.controller}">${val.controller}</a> , <a href="${val.uilink}">external-ui</a>,  <a href="${val.uilink + ui.subFolderSeg}">subfolder</a>
  <li>dashboard: 
${val.dashboards.map(p => `<a href="${p.toString()}">${p.hostname}</a>`).join(os.EOL)}</li>
  <li><a href="${val.uilink + ui.subFolderSeg + '/' + val.subsubSeg}">pacs</a>:
${val.pacs.map(p => `<a href="${p.toString()}">${p.pathname.substring(p.pathname.lastIndexOf("/") + 1)}</a>`).join(os.EOL)}</li>
<details>
<summary> 终端命令
</summary>
<textarea style="width:30%;height:60px">${terminalProxy.cmd.join("\n")}</textarea>
<textarea style="width:30%;height:60px">${terminalProxy.sh.join("\n")}</textarea>
</details>

</ul>
</div>
`}).join(""))
                fs.writeFileSync(resolve(ui.subFolder, "index.html"), htmlmsg, "utf-8");
                const _profile_obj = {
                    "proxies": "removed for security consideration",
                    "proxy-groups": "removed for security consideration",
                }
                fs.writeFileSync(resolve(ui.subFolder, "info.json"), JSON.stringify({
                    net,
                    profile_obj: { ...profile_obj, ..._profile_obj },
                    ui,
                    clash: { ...clash, _cp: undefined }
                }), "utf-8");
                logger.info(8, `visit network message from ${resolve(ui.subFolder, "index.html")}`)
            }
            return
        }
    )

program.command("find [ip-filter] [path] [port]")
    .description("find proxy in the local network, powered by system command `arp -a`, can't work in termux")
    .action(async function (ipFilter, path, port) {
        const onGet = function ({ net, thisNet, clash, ui, profile_obj, verified }) {
            const { name, ip, controller, uilink, subsubSeg, pacs, dashboards } = thisNet
            let msg = `
===网络: ${name} ip地址:${ip} clash版本${verified}===
代理服务所在端口: ${Object.keys(profile_obj).filter(key => key.includes("port")).map(key => `${key}:${profile_obj[key]}`)}
clash 控制器: ${controller} ${clash.secret ? `secret: ${clash.secret}` : ""}
网页: ${uilink ? uilink + ui.subFolderSeg : "not setted"}
PACs: 
\t${pacs.join(os.EOL + "\t")}
dashboards: 
\t${dashboards.join(os.EOL + "\t")}`;
            console.log(msg)
        }
        const proxies = await findProxy(ipFilter, path, port, onGet);
        console.log(`Finded ${proxies.length} possible proxies`);
    })

program.parse()






