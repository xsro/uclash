import { NetworkInterfaceInfo, networkInterfaces } from 'os';
import config from '../config';

export function systemIp(): { [id: string]: string[] } {
    const nets = networkInterfaces();
    const results: { [id: string]: string[] } = {};

    for (const name in nets) {
        for (const net of (nets[name] as NetworkInterfaceInfo[])) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4') {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return results
}

export function systemIp192() {
    const res = systemIp();
    for (const name in res) {
        for (const ip of res[name]) {
            if (ip.includes("192")) {
                return ip
            }
        }
    }
}


export enum PublicIpProvider {
    ipipNet = "http://myip.ipip.net",
    myipLaEn = "https://api.myip.la/en?json",
    myipLaCn = "https://api.myip.la/cn?json"
}

/**
 * get public IP by https://www.ipip.net/
 * @param {string|undefined} proxy proxy for curl
 * @returns 
 */
export function publicIP(provider: PublicIpProvider = PublicIpProvider.ipipNet, proxy?: string) {
    const result: { ip?: string, text?: string, json?: any } = {};
    const opts: any = {
        silent: "",
    }
    if (proxy && !proxy.includes(":"))
        proxy = "127.0.0.1:" + proxy
    opts.proxy = proxy;

    switch (provider) {
        case PublicIpProvider.ipipNet:
            result.text = config.cURL(provider, opts);
            const re = /\d+\.\d+\.\d+\.\d+/.exec(result.text);
            if (re) result.ip = re[0]
            break
    }
    return result
}

const ip = { systemIp, systemIp192, publicIP };
export default ip;

