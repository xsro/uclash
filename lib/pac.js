// https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file
import { download2 } from "./download.js";
import pacs from "./pac.config.js";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { projectFolder } from "./util.js";

let count = 0;

async function genPAC(ui, host, obj, ip) {
    let links = [];
    count++;
    for (const pac of pacs) {
        let output = "";
        const template = typeof pac.base === "string" && existsSync(resolve(projectFolder, pac.base))
            ? readFileSync(resolve(projectFolder, pac.base), "utf-8")
            : await download2(pac.base).catch(console.error)
        if (template) {
            output = template.replace(pac.replace, pac.to)
            output = output
                .replace(/\@ip/g, ip)
                .replace(/\@port/g, obj["port"])
                .replace(/\@socks/g, obj["socks-port"])
            writeFileSync(resolve(ui, count + pac.name), output)
            links.push(`http://${host}/ui/${count + pac.name}`);
        }
    }
    return links
}

export default genPAC


