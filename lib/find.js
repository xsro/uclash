import * as os from "os";
import arp from '@network-utils/arp-lookup';
import fetch from 'node-fetch';
import { logger } from './utils/logger.js';

async function findProxy(ipFilter, path = "/ui/c/info.json", port = "9090", onGet) {
    let a = [];
    a = await arp.getTable().catch(e => {
        logger.info(4, e)
    });
    let possible = a
        .map(val => `http://${val.ip}:${port}${path}`)
    possible.unshift(`http://127.0.0.1:${port}${path}`)
    if (ipFilter)
        possible = possible.filter(val => val.match(new RegExp(ipFilter)));
    if (possible.length === 0) {
        possible.push(`http://${ipFilter}:${port}${path}`)
    }

    const proxies = possible.map(async url => {
        logger.info(3, "trying " + url)
        let obj
        try {
            const res = await fetch(url);
            const text = await res.text();
            obj = JSON.parse(text);
        }
        catch (e) {
            logger.info(2, e)
            return undefined
        }
        if (obj) {
            const { profileObj, secret } = obj.clash.logs[obj.clash.logs.length - 1];
            const { net } = obj;
            const thisNet = net.find(val => url.includes(val.ip));
            let verified = false;
            //check controller https://github.com/Dreamacro/clash/wiki/external-controller-API-reference#configs
            if (thisNet && thisNet.controller) {
                const url = new URL(thisNet.controller);
                const headers = {};
                if (secret) headers["Authorization"] = "Bearer " + secret;
                url.pathname = "/version"
                const res = await fetch(url, { headers });
                const clash = await res.json();
                verified = clash.version
            }
            if (onGet) onGet({ url, thisNet, profileObj, ...obj, verified })
            return true
        }
        return false
    })
    const all = await Promise.all(proxies);
    const links = all.filter(val => val);
    return links
}

export default findProxy



export async function find(ipFilter, path, port) {
    const onGet = function (result) {
        if (result.thisNet === undefined) {
            console.log(`${result.url} has no information of the network`);
            return;
        }
        const { net, thisNet, clash, ui, profileObj, verified } = result;
        const { name, ip, controller, uilink, subsubSeg, pacs, dashboards } = thisNet;
        let msg = `
===网络: ${name} ip地址:${ip} clash版本${verified}===
代理服务所在端口: ${Object.keys(profileObj).filter(key => key.includes("port")).map(key => `${key}:${profileObj[key]}`)}
clash 控制器: ${controller} ${clash.secret ? `secret: ${clash.secret}` : ""}
网页: ${uilink ? uilink + ui.subFolderSeg : "not setted"}
PACs: 
\t${pacs.join(os.EOL + "\t")}
dashboards: 
\t${dashboards.join(os.EOL + "\t")}`;
        console.log(msg);
    };
    const proxies = await findProxy(ipFilter, path, port, onGet);
    console.log(`Finded ${proxies.length} possible proxies`);
}
