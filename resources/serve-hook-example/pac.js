const cp = require("child_process")
const os = require("os")

// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file

async function callback(req, res) {
    const { existsSync, readFileSync } = this.preloaded["fs"]
    const { resolve } = this.preloaded["path"]
    const { ip, download2, config, paths, reqUrl } = this.context

    const pacs = config.get("pacs");
    const cacheOpt = config.get("pacs-cache");

    async function genPAC(pacname, ip, profileObj = { port: 7890, "socks-port": 7891 }) {
        const pac = pacs.find(p => p.name = pacname)
        if (!pac) return undefined

        let output = "";
        const template = typeof pac.base === "string" && existsSync(resolve(paths.projectFolder, pac.base))
            ? readFileSync(resolve(paths.projectFolder, pac.base), "utf-8")
            : await download2(pac.base, cacheOpt).catch(console.error)
        if (template) {
            output = template.replace(pac.replace, pac.to)
            output = output
                .replace(/\@ip/g, ip)
                .replace(/\@port/g, profileObj["port"])
                .replace(/\@socks/g, profileObj["socks-port"]);
            return output
        }
    }
    if (reqUrl.pathname.endsWith(".pac")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        const pacName = reqUrl.pathname.replace(".pac", "").replace("/", "")
        const pacText = await genPAC(pacName, ip, undefined)
        res.end("//" + pacName + "\t" + new Date().toLocaleString() + "\n" + pacText)
        this.prevent()
    }
}

module.exports = callback