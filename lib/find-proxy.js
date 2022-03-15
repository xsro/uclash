import arp from '@network-utils/arp-lookup';
import fetch from 'node-fetch';
import { logger } from './logger.js';

const a = await arp.getTable();

async function findProxy(ipFilter, path, port) {
    if (port === undefined) port = "9090"
    if (path === undefined) path = "/ui/c/info.json"
    const output = [];
    let possible = a
        .map(val => `http://${val.ip}:${port}${path}`)
    possible.unshift(`http://127.0.0.1:${port}${path}`)
    if (ipFilter)
        possible = possible.filter(val => val.includes(ipFilter));
    for (const url of possible) {
        logger.info(4, "trying " + url)
        try {
            const res = await fetch(url);
            const text = await res.text();
            const obj = JSON.parse(text)
            const { net, profile_obj, ui, clash } = obj;
            const thisNet = net.find(val => url.includes(val.ip));
            const { name, ip, controller, uilink, subsubSeg, pacs, dashboards } = thisNet
            let msg = `
===网络: ${name} ip地址:${ip}===
api: ${controller} ${clash.secret ? `secret: ${clash.secret}` : ""}
ui links: ${uilink ? uilink + ui.subFolderSeg : "not setted"}
pacs: 
    ${pacs.join("\t")}
dashboards: 
    ${dashboards.join("\t")}
            `
            logger.info(4, msg)
            output.push({ msg, net: thisNet, obj })
        }
        catch (e) {
            logger.info(0, e)
        }
    }
    return output
}

export default findProxy

