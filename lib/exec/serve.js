import http from "http";
import { genPAC } from "./pac.js"
import fs from "fs";
import { paths, pack, config } from "../util.js";
import { terminalProxyCMD } from "./terminal.js"
import { ips } from "../ip.js";
import path from "path";
import fetch from "node-fetch";
import cp from "child_process";
import { download2 } from "../utils/download.js";

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

const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

function getMime(ext) {
    const k = Object.keys(mime).find(a => "." + a === ext)
    return k ? mime[k] : mime.txt
}

export function serve(port = 7895) {
    const server = http.createServer(async function (req, res) {
        let ip = req.socket.localAddress
        if (ip.startsWith("::ffff:")) ip = ip.replace("::ffff:", "")
        if (ip.includes("::1")) ip = "127.0.0.1"
        let html = fs.readFileSync(paths.resources("index.html"), "utf-8")
        html = html
            .replace("{version}", pack.version)
            .replace("{description}", pack.description)
        html = netInfo(html, ip)
        const reqUrl = new URL("http://" + ip + req.url)
        reqUrl.port = req.socket.localPort
        const folder = config.get("serve-folder");
        const file1 = path.resolve(folder, "." + reqUrl.pathname);
        const file2 = path.resolve(folder, "." + reqUrl.pathname + ".js")
        const hooksFolder = config.get("serve-hook-folder");

        let prevent = false
        let handlers = []

        async function import_mod(mod_file) {
            const mod = await import(mod_file)
            let caller = mod.hook;
            if (mod.hook === undefined)
                caller = mod.default
            if (typeof caller === "function") {
                async function func(req, res) {
                    try {
                        const r = await caller.call({
                            filename: mod_file,
                            dirname: path.dirname(mod_file),
                            preloaded: { http, fs, path, fetch, cp },
                            context: {
                                paths, config, reqUrl, mime, getMime, ip, html,
                                genPAC, download2
                            },
                            prevent: function () {
                                prevent = true
                            },
                            log: console.log
                        },
                            req, res)
                        return r
                    } catch (e) {
                        console.error(e)
                    }
                }
                return { func, bind: caller["bind-url"] }
            }
            else {
                console.error("can't find function")
            }
            return {}
        }

        for (const _file of fs.readdirSync(hooksFolder)) {
            const file = path.resolve(hooksFolder, _file);
            const { func, bind } = await import_mod(file)
            if (func && !prevent && reqUrl.pathname.match(bind)) {
                handlers.push(file)
                await func(req, res)
            }
        }
        if (prevent) {
            return;
        }
        if (fs.existsSync(file1) && fs.statSync(file1).isFile()) {
            handlers.push(file1)
            res.writeHeader('Content-Type', getMime(path.extname(file1)));
            const s = fs.createReadStream(file1);
            s.on('open', function () {
                s.pipe(res);
            });
            s.on('error', function (e) {
                console.log(e)
                // res.setHeader('Content-Type', 'text/plain');
                res.statusCode = 404;
                res.end('Not found');
            });
        }
        else if (fs.existsSync(file2) && fs.statSync(file2).isFile()) {
            try {
                const { func } = await import_mod(file2)
                if (typeof func === "function") {
                    handlers.push(file2)
                    func(req, res)
                }
                else {
                    console.log("can't find function")
                }
            } catch (e) {
                console.error(e)
                res.end(html)
            }
        }
        else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end(`404 nothing to serve, ${fs.readdirSync(folder)} and / and *.pac`)
        }
        console.log(new Date().toLocaleString() + " " + reqUrl + "-->" + handlers)
    })
    server.listen(port, function () {
        const links = Object.entries(ips).map(val => `${val[0]}  http://${val[1]}:${port}`)
        console.log(`监听中`)
        console.log(links.join("\n"))
    });
    server.on("error", console.error)
}

