import * as fs from "fs";
import * as os from "os";
import { resolve } from "path";
import Clash from "../clash/cli.js";
import { getClashConfig } from "../utils/get-clash-profile.js";
import { ips } from "../ip.js";
import { logger } from "../utils/logger.js";
import { config, paths, pack } from "../util.js";

/**
 * run clash to start the proxy server
 * @param {*} uclashProfile 
 * @param {*} options 
 * @returns 
 */
export async function exec(uclashProfile, options) {
    logger.info(1, options);

    const clashConf = await getClashConfig(uclashProfile);

    const profileDst = clashConf.config.parser.destination;

    if (fs.existsSync(config.get("ui-folder"))) {
        options.ui = config.get("ui-folder");
    }

    //run clash
    const clash = new Clash(
        options.command
    );
    const profileObj = clash.run({
        f: profileDst,
        extUi: options.ui,
        secret: options.secret,
        clashLog: options.clashLog,
        daemon: options.daemon,
        dryrun: options.dryrun
    });
    let msg = `代理服务端口: ` + Object.keys(profileObj).filter(val => val.includes("port")).map(key => `${key}:${profileObj[key]}`);

    let ui = {
        local: undefined,
        subFolder: undefined,
        subFolderSeg: undefined,
        link: undefined
    };
    if (options.ui) {
        const subFolderSeg = config.get("ui-subfolder");
        const subFolder = resolve(config.get("ui-folder"), subFolderSeg);
        !fs.existsSync(subFolder) && fs.mkdirSync(subFolder);
        ui = {
            local: options.ui,
            //sub path for put files by uclash
            subFolder, subFolderSeg
        };
    }

    const dashboardLinks = [
        {
            //https://github.com/Dreamacro/clash-dashboard
            "website": "http://clash.razord.top/",
            "host": "host",
            "port": "port",
            "secret": "secrect",
        },
        {
            //https://github.com/haishanh/yacd
            "website": "http://yacd.haishan.me/",
            "host": "hostname",
            "port": "port",
            "secret": "secrect",
        },
    ];
    const net = [];
    const _ips = Object.entries(ips);

    for (const [name, address] of _ips) {
        for (const ip of address) {
            const idx = net.findIndex(val => val.ip === ip);
            if (idx > -1)
                continue;

            const controller = profileObj["external-controller"]
                ? new URL("http://" + profileObj["external-controller"].replace("0.0.0.0", ip))
                : undefined;
            const localDashboard = [];

            if (controller) {
                const uilink = new URL("/ui/", controller);
                if (fs.existsSync(resolve(options.ui, "CNAME"))) {
                    const originalWebsiteName = fs.readFileSync(resolve(ui.local, "CNAME"), "utf-8");
                    const site = dashboardLinks.find(val => val.website.includes(originalWebsiteName.trim()));
                    if (site) {
                        localDashboard.push({ ...site, website: uilink });
                    }
                }
                const dashboards = [...dashboardLinks, ...localDashboard].map(
                    function (h) {
                        const url = new URL(h.website);
                        if (h.host)
                            url.searchParams.set(h.host, controller.hostname);
                        if (h.port)
                            url.searchParams.set(h.port, controller.port);
                        if (h.secret && clash.secret)
                            url.searchParams.set(h.secret, clash.secret);
                        return url;
                    });

                const info = { name, ip, controller, uilink, dashboards };
                net.push(info);
            } else {
                net.push({ name, ip, controller, pacs: [], dashboards: [] });
            }
        }
    }
    for (const { name, ip, controller, uilink, dashboards } of net) {
        if (name == "uclash previous ips")
            continue;
        const tab = num => os.EOL + " ".repeat(num);
        msg += `
===网络: ${name} ip地址:${ip}===
控制器api: ${controller} ${clash.secret ? `secret: ${clash.secret}` : ""}
ui链接: ${uilink ? uilink : "not setted"}
控制面板: 
    ${dashboards.join(tab(4))}
`;
    }
    (!options.silent) && logger.info(4, msg);

    const infojson = JSON.stringify(
        {
            date: new Date().toLocaleString(),
            version: {
                "uclash": pack.version,
                "os": os.version(),
                "node": process.version,
                "clash": clash.version()
            },
            net,
            ui,
            clash
        },
        function (key, val) {
            if (key === "_cp" && val) {
                return val.pid;
            }
            if (key === "proxy-groups" || key === "proxies") {
                return val.length;
            }
            if (key === "stream")
                return undefined;
            return val;
        }, "\t")
    fs.writeFileSync(resolve(ui.subFolder, "info.json"), infojson, "utf-8");
    fs.writeFileSync(paths.tmp("info.json"), infojson, "utf-8");
    logger.info(8, `visit network message from ${resolve(ui.subFolder, "index.html")}`);
    logger.info(8, resolve(ui.subFolder, "info.json"), paths.tmp("info.json"));

    return;
}
