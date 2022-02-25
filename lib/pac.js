// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file
import { download2 } from "./download.js";
import pacs from "./pac.config.js";
import { writeFileSync } from "fs";
import { resolve } from "path";

async function genPAC(ui, host, obj, ip) {
    let links = [];
    for (const pac of pacs) {
        let output = ""
        const template = await download2(pac.base).catch(console.error)
        if (template) {
            output = template.replace(pac.replace, pac.to)
            output = output
                .replace(/\@ip/g, ip)
                .replace(/\@port/g, obj["port"])
                .replace(/\@socks/g, obj["socks-port"])
            writeFileSync(resolve(ui, pac.name), output)
            links.push(`http://${host}/ui/${pac.name}`);
        }
    }
    return links
}

export default genPAC


