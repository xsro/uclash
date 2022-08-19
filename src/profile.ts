import config from "./config";
import * as fs from "fs";
import { extname, resolve, isAbsolute, dirname } from "path";
import YAML from "yaml";
import { Profile, ProfileType } from "./profile.def";

export function getAppProfiles() {
    const profileMap = new Map();
    if (config.paths.valueMap.has("project")) {
        profileMap.set("x0", config.paths.resolve("{project}/profiles/" + "empty.yml"))
        profileMap.set("x1", config.paths.resolve("{project}/profiles/" + "example.js"))
    }

    const _configFolder = config.get<string>("profiles.folder")
    if (_configFolder) {
        const configFolder = config.paths.abs(_configFolder);
        if (fs.existsSync(configFolder)) {
            const files = fs.readdirSync(configFolder);
            const cfgs = files
                .filter(file => !file.startsWith("_") && (file.endsWith(".yml") || file.endsWith(".js")))
                .map(file => resolve(configFolder, file));
            const offset = 1
            cfgs.forEach((val, idx) => profileMap.set((idx + offset).toString(), val))
        }
    }
    return profileMap;
}

export interface ProfileInfo {
    path: string,
    clashPath: string,
    type: ProfileType,
    clash?: any,
    uclash?: Profile,
}

export async function getAppProfile(label: string): Promise<ProfileInfo> {
    const profileMap = getAppProfiles();
    let profilePath: string | undefined = undefined;
    if (profileMap.has(label)) {
        profilePath = profileMap.get(label)
    }
    else {
        profilePath = resolve(process.cwd(), label);
    }

    if (profilePath === undefined) {
        throw new Error(profilePath + " is undefined")
    }
    if (profilePath && !fs.existsSync(profilePath)) {
        throw new Error("no such file " + profilePath)
    }
    const configText = fs.readFileSync(profilePath, { encoding: "utf-8" });
    let obj = null;
    switch (extname(profilePath).toLowerCase()) {
        case ".yml":
        case ".yaml":
            obj = YAML.parse(configText);
            break;
        case ".json":
            obj = JSON.parse(configText);
            break;
        case ".js":
            const mod = await import(profilePath);
            obj = mod.default
            // console.log(obj);
            break;
    }
    if (obj === null) {
        throw new Error("obj is null")
    }
    if ("parser" in obj) {
        const { parser } = obj as any;
        parser.destination = isAbsolute(parser.destination)
            ? parser.destination
            : resolve(dirname(profilePath), parser.destination);
        if (parser[process.platform]) {
            for (const key in parser[process.platform]) {
                parser[key] = parser[process.platform][key];
            }
        }
        if (parser.type === undefined) {
            parser.type = ProfileType.use
        }
        const r = {
            path: profilePath,
            clashPath: parser.destination,
            type: parser.type as ProfileType,
            clash: undefined,
            uclash: obj,
        }
        if (fs.existsSync(parser.destination)) {
            const str = fs.readFileSync(parser.destination, "utf-8")
            r.clash = YAML.parse(str)
        }
        return r
    }
    else {
        return {
            path: profilePath,
            clashPath: profilePath,
            type: ProfileType.clash,
            clash: obj,
            uclash: undefined,
        }
    }
}
