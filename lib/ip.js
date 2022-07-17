import { networkInterfaces } from 'os';
import fetch from "node-fetch";
import { execSync } from 'child_process';

const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (net.family === 'IPv4') {
            if (!results[name]) {
                results[name] = [];
            }
            results[name].push(net.address);
        }
    }
}

export const ips = results;

/**
 * get public IP by https://www.ipip.net/
 * @param {string|undefined} proxy proxy for curl
 * @returns 
 */
export async function getPublicIP(proxy) {
    if (proxy === undefined) {
        const res = await fetch("http://myip.ipip.net");
        const text = await res.text();
        return { text };
    }
    if (typeof proxy === "string") {
        if (!proxy.includes(":"))
            proxy = "127.0.0.1:" + proxy
        const text = execSync(`curl -s http://myip.ipip.net -x ${proxy}`,
            { encoding: "utf-8" })
        return { text, proxy }
    }
}

export async function ip(options) {
    console.table(ips)
    const public_ip = await getPublicIP(options.proxy)
    const proxy = public_ip.proxy ? `(proxy:${public_ip.proxy})` : ""
    console.log(`public ip ${proxy}:`)
    console.log(public_ip.text)
}

