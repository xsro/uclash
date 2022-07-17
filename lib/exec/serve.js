import http from "http";
import { genPAC } from "./pac.js"
import fs, { link } from "fs";
import { paths, pack, config } from "../util.js";
import { terminalProxyCMD } from "./terminal.js"
import { ips } from "../ip.js";

function netInfo(html, ip = "127.0.0.1") {
    const info = JSON.parse(fs.readFileSync(paths.tmp("info.json"), "utf-8"))
    const _log = info.clash.logs.find(val => val.profileObj)
    const profileObj = _log.profileObj
    const terminalProxy = terminalProxyCMD(ip, profileObj);
    const net = info.net.find(val => val.ip == ip)
    for (const val of html.match(/\$\{net.*?\}/g)) {
        html = html.replace(val, net[val.substring(6, val.length - 1)])
    }
    for (const val of html.match(/\$\{terminalProxy.*?\}/g)) {
        html = html.replace(val, terminalProxy[val.substring(16, val.length - 1)])
    }
    const dashboards = net.dashboards.map(p => '<a href="' + p.toString() + '">' + new URL(p).hostname + '</a>').join("\n")
    html = html.replace("{dashboards}", dashboards)
    return html;
}

function cb(req, res) {
    let ip = req.socket.localAddress
    if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "")
    if (req.url.endsWith(".pac")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        const pacName = req.url.replace(".pac", "").replace("/", "")
        genPAC(pacName, ip, undefined).then(
            pacText => res.end(pacText)
        );
    }
    else {
        let html = fs.readFileSync(paths.resources("index.html"), "utf-8")
        html = html
            .replace("{version}", pack.version)
            .replace("{description}", pack.description)
        html = netInfo(html, ip)
        res.end(html)
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

