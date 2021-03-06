import { download2 } from "../utils/download.js";
import YAML from "yaml";
import getInfo from "./getInfo.js";

function replace(text, profile) {
    //pre-process the content before parsing
    for (const { from, to, reg } of profile.text.change) {
        const _from = reg ? new RegExp(from, reg) : from;
        const _to = to ? to : "";
        text = text.replace(_from, _to)
    }

    const clash_obj = YAML.parse(text);

    for (const rule of profile.yaml.rules.add) {
        const idx = clash_obj.rules.findIndex(val =>
            typeof val === "string" && val.includes(rule.substring(0, rule.lastIndexOf(","))));
        if (idx >= 0) {
            clash_obj.rules[idx] = rule;
        } else {
            clash_obj.rules.unshift(rule);
        }
    }

    const proxyGroups = clash_obj["proxy-groups"];
    const idx = proxyGroups.findIndex(val => val.name.includes(profile.yaml["proxy-groups"].removeByName));
    if (idx >= 0) proxyGroups.splice(idx, 1);

    for (const [key, val] of Object.entries(profile.yaml["proxy-groups"]["change-select"])) {
        const p = proxyGroups.find(val => val.name === key && val.type === "select")
        if (p) p.proxies = val;
    }

    const prunes = profile.yaml["proxy-groups"].prune;
    for (const p of proxyGroups) {
        for (const prune of prunes) {
            if (prune.for === "all" && !prune.exclude.includes(p.name) || p.name.includes(prune.for)) {
                p.proxies = p.proxies.filter(_proxy => !prune.remove.some(_rule => _proxy.includes(_rule)))
            }
        }
    }

    return YAML.stringify(clash_obj);
}

export async function parse(config, allowCache = false) {
    const text = await download2(config.url, allowCache);
    const replaced = replace(text, config);
    const p = YAML.parse(text).proxies
    const info = getInfo(p, config);
    return {
        obj: replaced,
        text: replaced,
        ...info
    }
}