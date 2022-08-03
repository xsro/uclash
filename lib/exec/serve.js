import http from "http";
import { genPAC } from "./pac.js"
import fs, { link } from "fs";
import { paths, pack, config } from "../util.js";
import { terminalProxyCMD } from "./terminal.js"
import { ips } from "../ip.js";
import path from "path";
import fetch from "node-fetch";
import cp from "child_process";

function netInfo(html, ip = "127.0.0.1") {
    const info = JSON.parse(fs.readFileSync(paths.tmp("info.json"), "utf-8"))
    const _log = info.clash.logs.find(val => val.profileObj)
    const profileObj = _log.profileObj
    const terminalProxy = terminalProxyCMD(ip, profileObj);
    const net = info.net.find(val => val.ip == ip)
    if (net) {
        for (const val of html.match(/\$\{net.*?\}/g)) {
            html = html.replace(val, net[val.substring(6, val.length - 1)])
        }
        for (const val of html.match(/\$\{terminalProxy.*?\}/g)) {
            html = html.replace(val, terminalProxy[val.substring(16, val.length - 1)])
        }
        const dashboards = net.dashboards.map(p => '<a href="' + p.toString() + '">' + new URL(p).hostname + '</a>').join("\n")
        html = html.replace("{dashboards}", dashboards)
    }
    return html;
}

async function cb(req, res) {
    let ip = req.socket.localAddress
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "")
    if (ip.includes("::1")) ip = "127.0.0.1"
    let html = fs.readFileSync(paths.resources("index.html"), "utf-8")
    html = html
        .replace("{version}", pack.version)
        .replace("{description}", pack.description)
    html = netInfo(html, ip)
    const reqUrl = new URL("http://" + ip + req.url)
    if (reqUrl.pathname === "/") {
        res.end(html)
    }
    else if (reqUrl.pathname.endsWith(".pac")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        const pacName = reqUrl.pathname.replace(".pac", "").replace("/", "")
        genPAC(pacName, ip, undefined).then(
            pacText => res.end(pacText)
        );
    }
    else {
        const folder = config.get("serve-folder");
        const file = path.resolve(folder, "." + reqUrl.pathname + ".js")
        if (fs.existsSync(file)) {
            try {
                const mod = await import(file)
                const caller = mod.default
                if (typeof caller === "function") {
                    caller.call({
                        filename: file,
                        dirname: path.dirname(file),
                        preloaded: { http, fs, path, fetch, cp },
                        context: { paths, config, reqUrl }
                    },
                        req, res)
                }
                else {
                    console.log("can't find function")
                }
            } catch (e) {
                console.error(e)
            }
        }
        else {
            res.end(html)
        }
    }
}


export function serve(port = 7895) {
    const server = http.createServer(cb)
    server.listen(port, function () {
        const links = Object.entries(ips).map(val => `${val[0]}  http://${val[1]}:${port}`)
        console.log(`监听中`)
        console.log(links.join("\n"))
    });
    server.on("error", console.error)
}

