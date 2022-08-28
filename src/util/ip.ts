import { NetworkInterfaceInfo, networkInterfaces } from 'os';
import config from '../config';
import { PublicIpProviders } from './default';
import logger from './logger';

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

export function getPublicIpProviders() {
    return config.get<PublicIpProviders>("ip", {})
}

/**
 * get public IP by https://www.ipip.net/
 * @param {string|undefined} proxy proxy for curl
 * @returns 
 */
export function publicIP(_provider?: string, proxy?: string) {
    const result: { ip?: string, text?: string, json?: any } = {};
    const opts: any = {
        silent: "",
    }
    if (proxy && !proxy.includes(":"))
        proxy = "127.0.0.1:" + proxy
    opts.proxy = proxy;

    const providers = getPublicIpProviders()
    const provider = _provider ? providers[_provider] : Object.values(providers)[0]

    if (provider) {
        try {
            result.text = config.cURL(provider.url, opts);
        } catch (e) {
            logger.error("fetch error")
            process.exit()
        }
        if (provider.type === "text") {
            const re = /\d+\.\d+\.\d+\.\d+/.exec(result.text);
            if (re) result.ip = re[0]
        }
        else if (provider.type === "json") {
            result.json = JSON.parse(result.text)
        }
    }
    return result
}

const ip = { systemIp, systemIp192, publicIP };
export default ip;

