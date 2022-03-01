import YAML from "yaml";
import { download2 } from "../download.js";
import getInfo from "./getInfo.js";

export async function parse(config) {
    while (true) {
        const idx = config.proxies.findIndex(val => val.use);
        if (idx > -1) {
            const item = config.proxies[idx];
            config.proxies.splice(idx, 1);
            const text = await download2(item.use, false);
            const obj = YAML.parse(text);
            config.proxies.push(...obj.proxies.map(val => {
                if (item.rename) {
                    let r = new RegExp(item.rename.from)
                    val.name = val.name.replace(r, item.rename.to)
                }
                return val
            }))
        } else {
            break
        }
    }
    config.proxies = config.proxies.map(p => {
        p.name = p.name.trim();
        return p
    })
    while (true) {
        const idx = config.rules.findIndex(val => val.use);
        if (idx > -1) {
            const item = config.rules[idx];
            const text = await download2(item.use);
            const obj = YAML.parse(text);
            const insert = obj.rules.filter(n => !config.rules.some(r => typeof r === "string" && r.includes(n.substring(0, n.lastIndexOf(",")))))
            config.rules.splice(idx, 1, ...insert);
        } else {
            break
        }
    }
    for (const i in config["proxy-groups"]) {
        const proxies = config["proxy-groups"][i].proxies
        while (true) {
            const idx = proxies.findIndex(val => val.use);
            if (idx > -1) {
                const item = proxies[idx];
                proxies.splice(idx, 1);
                let p = undefined
                p = config.proxies.filter((val, idx) => {
                    if (item.remove && item.remove.some(r => {
                        return val.name.includes(r)
                    })) {
                        return false
                    }
                    if (item.filter && val.name.includes(item.filter)) {
                        return true
                    }
                    if (item.filter === undefined) {
                        return true
                    }

                    return false
                })
                proxies.push(...p.map(val => val.name))
            } else {
                break
            }
        }
    }
    const info = getInfo(config.proxies, config)

    const _config = { ...config }
    _config.parser = undefined;
    return { text: YAML.stringify(_config), ...info }
}