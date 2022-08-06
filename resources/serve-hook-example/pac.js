
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file

async function hook(req, res) {
    const { existsSync, readFileSync } = this.preloaded["fs"]
    const { resolve } = this.preloaded["path"]
    const { ip, download2, config, paths, reqUrl } = this.context

    const pacs = config.get("pacs");
    const cacheOpt = config.get("pacs-cache");

    async function genPAC(pac, ip, profileObj = { port: 7890, "socks-port": 7891 }) {
        if (!pac) return undefined

        let output = "";
        const template = typeof pac.base === "string" && existsSync(resolve(paths.projectFolder, pac.base))
            ? readFileSync(resolve(paths.projectFolder, pac.base), "utf-8")
            : await download2(pac.base, cacheOpt).catch(console.error)
        if (template) {
            if (Array.isArray(pac.replace)) {
                output = template
                for (const [from, to] of pac.replace) {
                    output = output.replace(from, to)
                }
            } else {
                output = template.replace(pac.replace, pac.to)
            }
            output = output
                .replace(/\@ip/g, ip)
                .replace(/\@port/g, profileObj["port"])
                .replace(/\@socks/g, profileObj["socks-port"]);
            return output
        }
    }
    if (reqUrl.pathname.endsWith(".pac")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        const pacName = reqUrl.pathname.replace("/", "")
        const pac = pacs.find(p => p.name === pacName)
        const pacText = await genPAC(pac, ip, undefined)
        const head = `
// ${pacName} ${new Date().toLocaleString()}
// base: ${pac.base}
`
        res.end(head + "\n" + pacText)
        this.prevent()
    }
}

hook["bind-url"] = /^.*\.pac$/
module.exports = hook