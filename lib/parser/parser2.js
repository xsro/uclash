import fetch from "node-fetch";
import YAML from "yaml";
import { download2 } from "../utils/download.js";
import { githublink } from "./githublink.js"

export async function parse(profile, cache) {
    while (true && profile["dns"] && profile["dns"]["fake-ip-filter"]) {
        const target = profile["dns"]["fake-ip-filter"];
        const idx = target.findIndex(val => val.use);
        if (idx > -1) {
            const item = target[idx];
            target.splice(idx, 1);
            const text = await download2(item.use, cache);
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
            item.use = Array.isArray(item.use) ? item.use : [item.use]
            profile.proxies.splice(idx, 1);
            if (item.ignore) continue
            let text = ""
            try {
                const cacheOpt = item.cache ? item.cache : cache;
                text = await download2(item.use, cacheOpt)
            }
            catch (e) {
                console.error(e)
                continue
            }
            if (item.updateTime) {
                const r = new RegExp(item.updateTime);
                const re = r.exec(text);
                if (re) updateTime[item.label] = re[1]
            } else {
                for (const { owner, repo, branch, path } of item.use.map(githublink.parse).filter(val => val)) {
                    const githubApi = new URL(`https://api.github.com/repos/${owner}/${repo}/commits?path=${path}&page=1&per_page=1`)
                    const res = await fetch(githubApi);
                    const obj = await res.json();
                    updateTime[item.label] = new Date(obj[0].commit.committer.date)
                    break
                }
            }
            const obj = YAML.parse(text);
            for (let newProxy of obj.proxies) {
                if (item.rename) {
                    let r = new RegExp(item.rename.from)
                    if (newProxy.name)
                        newProxy.name = newProxy.name.replace(r, item.rename.to)
                }
                if (item.map) {
                    // Closure in new Function: https://javascript.info/new-function?msclkid=5eea868ead9211ec891dd710488bef47#closure
                    const mapper = new Function(["val", "idx", "arr"], item.map);
                    newProxy = mapper(newProxy);
                }

                if (newProxy) {
                    const Dup = profile.proxies.some(p => {
                        return p.name == newProxy.name
                    })
                    if (!Dup) {
                        newProxy._origin_label = item.label;
                        profile.proxies.push(newProxy)
                    }
                }
            }
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
            const text = await download2(item.use, cache);
            const obj = YAML.parse(text);
            const insert = obj.rules.filter(n => !profile.rules.some(r => typeof r === "string" && r.includes(n.substring(0, n.lastIndexOf(",")))))
            profile.rules.splice(idx, 1, ...insert);
        } else {
            break
        }
    }
    for (const i in profile["proxy-groups"]) {
        const group = profile["proxy-groups"][i];
        if (group.use) {
            const text = await download2(group.use, cache);
            const obj = YAML.parse(text);
            profile["proxy-groups"].push(...obj["proxy-groups"]);
            profile["proxy-groups"].splice(i, 1);
        }
    }
    for (const i in profile["proxy-groups"]) {
        const group = profile["proxy-groups"][i];
        const proxies = group.proxies;
        while (true && !group.use) {
            const idx = proxies.findIndex(val => val.use);
            if (idx > -1) {
                const item = proxies[idx];
                proxies.splice(idx, 1);
                let filter = () => true;
                if (item.match)
                    filter = val => val.name.match(new RegExp(item.match))
                if (item.filter)
                    filter = new Function(["val", "idx", "arr"], item.filter);
                const targets = []
                if (item["proxies"] !== false) {

                    targets.push(...profile.proxies
                        .filter(p => {
                            return Array.isArray(item.use) ? item.use.includes(p._origin_label) : true
                        })
                        .filter(filter))
                }
                if (item["groups"] === true) {
                    targets.push(...profile["proxy-groups"].filter(filter))
                }
                proxies.push(...targets.map(val => val.name).filter(val => val))
            } else {
                break
            }
        }
    }

    const clashProfile = { ...profile }
    clashProfile.proxies = clashProfile.proxies.map(val => {
        if (val._origin_label) delete val._origin_label
        return val
    })
    delete clashProfile.parser;
    return {
        obj: clashProfile,
        text: YAML.stringify(clashProfile),
        updateTime
    }
}