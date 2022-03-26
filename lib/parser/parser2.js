import YAML from "yaml";
import { download2 } from "../download.js";

export async function parse(profile, allowCache = false) {
    while (true && profile["dns"]["fake-ip-filter"]) {
        const target = profile["dns"]["fake-ip-filter"];
        const idx = target.findIndex(val => val.use);
        if (idx > -1) {
            const item = target[idx];
            target.splice(idx, 1);
            const text = await download2(item.use, allowCache);
            const obj = YAML.parse(text);
            target.push(...obj["dns"]["fake-ip-filter"])
        } else {
            break
        }
    }
    let updateTime = {}
    while (true) {
        const idx = profile.proxies.findIndex(val => val.use);
        if (idx > -1) {
            const item = profile.proxies[idx];
            profile.proxies.splice(idx, 1);
            const text = await download2(item.use, allowCache);
            if (item.updateTime) {
                const r = new RegExp(item.updateTime);
                const re = r.exec(text);
                updateTime[item.label] = re[1]
            }
            const obj = YAML.parse(text);
            profile.proxies.push(...obj.proxies.map(val => {
                if (item.rename) {
                    let r = new RegExp(item.rename.from)
                    if (val.name)
                        val.name = val.name.replace(r, item.rename.to)
                }
                if (item.map) {
                    const mapper = new Function(["val", "idx", "arr"], item.map);
                    mapper(val)
                }
                return val
            }).filter(val => val))
        } else {
            break
        }
    }
    profile.proxies = profile.proxies.map(p => {
        if (typeof p.name === "string")
            p.name = p.name.trim();
        else
            console.log(p)
        return p
    })
    while (true) {
        const idx = profile.rules.findIndex(val => val.use);
        if (idx > -1) {
            const item = profile.rules[idx];
            const text = await download2(item.use, allowCache);
            const obj = YAML.parse(text);
            const insert = obj.rules.filter(n => !profile.rules.some(r => typeof r === "string" && r.includes(n.substring(0, n.lastIndexOf(",")))))
            profile.rules.splice(idx, 1, ...insert);
        } else {
            break
        }
    }
    for (const i in profile["proxy-groups"]) {
        const proxies = profile["proxy-groups"][i].proxies
        while (true) {
            const idx = proxies.findIndex(val => val.use);
            if (idx > -1) {
                const item = proxies[idx];
                proxies.splice(idx, 1);
                let p = undefined
                p = profile.proxies.filter((val, idx) => {
                    if (item.remove && item.remove.some(r => {
                        return typeof val.name === "string" && val.name.includes(r)
                    })) {
                        return false
                    }
                    if (item.filter && typeof val.name === "string" && val.name.includes(item.filter)) {
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

    const _config = { ...profile }
    _config.parser = undefined;
    return { text: YAML.stringify(_config), updateTime }
}