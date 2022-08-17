import * as api from "./api"
import { PublicIpProvider } from "./util/ip";
import fs from "fs";

export function expr(str: string) {
    console.log(api.expr(str))
}

export const setProjectFolder = (str: string) => api.config.projectFolder = str;

export function config(options: { default: boolean, custom: boolean, merged: boolean,path:boolean }) {
    const keys: ("default" | "custom" | "merged")[] = ["default", "custom", "merged"]
    for (const key of keys)
        if (options[key]) {
            console.log(api.config[key])
        }
    if(options.path){
        console.log(api.config.custom_path)
    }
}

export async function profile() {
    const profileMap = api.getAppProfiles()
    for (const [s,l] of Array.from(profileMap.entries())){
        const info=await api.getAppProfile(s);
        console.log(s,info.type,l)
    }
}

export async function ip(proxys: string[]|string|undefined) {
    const ip192 = api.systemIp192()
    const ipPublic = api.publicIP()
    const ips = api.systemIp()
    let ipProxies = "";
    if (proxys){
        if(!Array.isArray(proxys)){
            proxys=[proxys]
        }
        ipProxies = proxys.map(p => {
            const i = api.publicIP(PublicIpProvider.ipipNet, p).text;
            return p + " " + i?.trim()
        }).join("\n")
    }
    console.log(ipPublic.text?.trim() 
+ "\n常用 " +ip192
+ "\n代理 "+ ipProxies);
    for (const name in ips){
        console.log("网卡"+name+" "+ips[name])
    }
}

export async function  generate(profile:string) {
    const info=await api.getAppProfile(profile)
    const parsed=await api.parse(info)
    fs.writeFileSync(info.uclash.parser.destination as string,parsed.text)
}