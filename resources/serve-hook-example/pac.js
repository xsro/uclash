
// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file


//Short code https://stackoverflow.com/questions/26246601/wildcard-string-comparison-in-javascript
function matchRuleShort(str, rule) {
    var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
}

async function hook(req, res) {
    const { existsSync, readFileSync } = this.preloaded["fs"]
    const { resolve } = this.preloaded["path"]
    const { ip, download2, config, paths, reqUrl, cprofile } = this.context

    const pacs = config.get("pacs");
    const cacheOpt = config.get("pacs-cache");

    async function genPAC(pac, ip, profileObj = { hosts: {}, port: 7890, "socks-port": 7891 }) {
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
            if (profileObj["hosts"]) {
                const hosts = Object.keys(profileObj["hosts"]).map(a => "'" + a + "'")
                const cond = `[${hosts.join(",")}].some(h => matchRuleShort(host,h))`
                output = (matchRuleShort.toString() + "\n" + output)
                    .replace(/\@host/g, cond)
            } else {
                output = output.replace(/\@host/g, "false")
            }

            return output
        }
    }
    if (reqUrl.pathname.endsWith(".pac")) {
        res.writeHead(200, { "Content-Type": "text/plain" });
        const pacName = reqUrl.pathname.replace("/", "")
        const pac = pacs.find(p => p.name === pacName)
        const pacText = await genPAC(pac, ip, cprofile?.clash)
        const head = `
// ${pacName} ${new Date().toLocaleString()}
// base: ${pac.base}
`
        res.end(head + "\n" + pacText)
        this.prevent()
    }
}

hook["bind-url"] = /^.*\.pac$/
export default hook