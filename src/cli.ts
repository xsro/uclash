import * as api from "./api"
import fs from "fs";
import logger from "./util/logger";
import YAML from "yaml"
import { clashDashboradInit } from "./clash_dashboard";

function readJson(p: any, keys: string) {
    let target: any = p;
    for (const key of keys.split(".")) {
        if (key in target) {
            target = target[key]
        }
        else {
            target = undefined
            break
        }
    }
    return target
}

export function expr(str: string, opts: { "replaceAt": boolean }) {
    logger.display(api.expr(str, opts))
}

export const setProjectFolder = (str: string) => api.config.projectFolder = str;

export function config(options: {
    key: string, abs: boolean,
    default: boolean, custom: boolean, merged: boolean,
    path: boolean
}) {
    if (options.key) {
        let out = api.config.get(options.key)
        if (options.abs) {
            out = api.config.paths.abs(out as string)
        }
        logger.display(out)
    }
    const keys: ("default" | "custom" | "merged")[] = ["default", "custom", "merged"]
    for (const key of keys)
        if (options[key]) {
            logger.display(api.config[key])
        }
    if (options.path) {
        logger.display(api.config.custom_path)
    }
}

export async function profile(label?: string, options?: { clashPath: boolean, key: string }) {
    const profileMap = api.getAppProfiles()
    if (label) {
        const p = await api.getAppProfile(label)
        if (options?.key || options?.clashPath) {
            if (options?.clashPath) {
                logger.display(p.clashPath)
            }
            if (options.key) {
                logger.display(readJson(p, options.key))
            }
        }
        else {
            logger.display(p)
        }
    } else {
        for (const [s, l] of Array.from(profileMap.entries())) {
            const info = await api.getAppProfile(s);
            logger.display(s, info.type, l)
        }
    }
}

export async function ip(proxy: string | undefined,
    options: { provider: string, key: string, list: boolean }) {

    if (options.list) {
        console.table(api.getPublicIpProviders())
    }
    else if (options.provider) {
        const r = api.publicIP(options.provider, proxy)
        if (r.json) {
            if (options.key) {
                logger.display(readJson(r.json, options.key))
            } else {
                logger.display(r.json)
            }
        } else {
            logger.display(r.text)
        }
    }
    else {
        const ips = api.systemIp()
        for (const name in ips) {
            logger.display("网卡" + name + " " + ips[name])
        }

        const ip192 = api.systemIp192()
        logger.display("192段：", ip192)

        const ipPublic = api.publicIP()
        logger.display(ipPublic.text?.trim())

        if (proxy) {
            const i = api.publicIP(undefined, proxy).text;
            logger.display("代理：", proxy, i?.trim())
        }
    }
}

export async function generate(profile: string) {
    const info = await api.getAppProfile(profile)
    if (info.type === api.ProfileType.clash) {
        logger.info("skip. it's a clash profile")
        return undefined;
    }
    else if (info.uclash) {
        const parsed = await api.parse(info)
        const dest = info.uclash.parser.destination;
        const former = fs.existsSync(dest)
            ? fs.readFileSync(dest, "utf-8")
            : "";
        const formerObj = YAML.parse(former)
        if (JSON.stringify(formerObj) === JSON.stringify(parsed.json)) {
            logger.display("[profile unchanged]")
            process.exit(200)
        } else {
            fs.writeFileSync(dest, parsed.text)
        }
    }
    else {
        logger.display(info, "not generated")
    }
}

export function ui(options: { list: boolean, init: string, unzip: boolean, allowReuse: boolean }) {
    const uis = api.config.get<api.ClashDashBoard>("ui", {})
    logger.display(options)
    if (options.list) {
        console.table(uis)
    }
    else if (options.init) {
        clashDashboradInit(uis, options.init, options.unzip, options.allowReuse)
    }
}

export function curl() {

}