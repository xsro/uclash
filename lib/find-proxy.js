import arp from '@network-utils/arp-lookup';
import fetch from 'node-fetch';
import { logger } from './logger.js';

async function findProxy(ipFilter, path, port, onGet) {
    let a = [];
    a = await arp.getTable().catch(e => {
        logger.info(4, e)
    });
    if (port === undefined) port = "9090"
    if (path === undefined) path = "/ui/c/info.json"
    let possible = a
        .map(val => `http://${val.ip}:${port}${path}`)
    possible.unshift(`http://127.0.0.1:${port}${path}`)
    if (ipFilter)
        possible = possible.filter(val => val.includes(ipFilter));

    const proxies = possible.map(async url => {
        logger.info(3, "trying " + url)
        try {
            const res = await fetch(url);
            const text = await res.text();
            const obj = JSON.parse(text)
            const { net } = obj;
            const thisNet = net.find(val => url.includes(val.ip));
            let verified = false;
            //check controller https://github.com/Dreamacro/clash/wiki/external-controller-API-reference#configs
            if (thisNet.controller) {
                const url = new URL(thisNet.controller);
                const secret = obj.clash.secret ? obj.clash.secret : obj.profile_obj.secret;
                const headers = {};
                if (secret) headers["Authorization"] = "Bearer " + secret;
                url.pathname = "/version"
                const res = await fetch(url, { headers });
                const clash = await res.json();
                verified = clash.version
            }
            if (onGet) onGet({ thisNet, ...obj, verified })
            return { thisNet, ...obj, verified }
        }
        catch (e) {
            return undefined
        }
    })
    const all = await Promise.all(proxies);
    const links = all.filter(val => val);
    return links
}

export default findProxy

