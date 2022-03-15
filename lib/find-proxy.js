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
    const output = [];
    let possible = a
        .map(val => `http://${val.ip}:${port}${path}`)
    possible.unshift(`http://127.0.0.1:${port}${path}`)
    if (ipFilter)
        possible = possible.filter(val => val.includes(ipFilter));
    for (const url of possible) {
        logger.info(3, "trying " + url)
        try {
            const res = await fetch(url);
            const text = await res.text();
            const obj = JSON.parse(text)
            const { net } = obj;
            const thisNet = net.find(val => url.includes(val.ip));
            if (onGet) onGet({ thisNet, ...obj })
            output.push({ thisNet, ...obj })
        }
        catch (e) {
            logger.info(3, e)
        }
    }
    return output
}

export default findProxy

