import { config, paths } from "../util.js";
import * as fs from "fs";
import { extname, resolve, isAbsolute, dirname } from "path";
import YAML from "yaml";

export const profileMap = new Map();
profileMap.set("x1", paths.clashConfig("example.js"))
profileMap.set("x0", paths.clashConfig("example.yml"))

if (fs.existsSync(config.get("config-folder"))) {
    const files = fs.readdirSync(config.get("config-folder"));
    const cfgs = files
        .filter(file => !file.startsWith("_") && (file.endsWith(".yml") || file.endsWith(".js")))
        .map(file => resolve(config.get("config-folder"), file));
    const offset = 1
    cfgs.forEach((val, idx) => profileMap.set(idx + offset, val))
}

export async function getClashConfig(conf) {
    let configPath = undefined;
    conf = (typeof conf === "string" && parseInt(conf) > 0) ? parseInt(conf) : conf;

    if (profileMap.has(conf)) {
        configPath = profileMap.get(conf)
    }
    else {
        configPath = resolve(process.cwd(), conf);
    }

    if (!fs.existsSync(configPath)) {
        throw new Error("can't read " + configPath)
    }
    const configText = fs.readFileSync(configPath, { encoding: "utf-8" });
    let configObj = null;
    switch (extname(configPath).toLowerCase()) {
        case ".yml":
        case ".yaml":
            configObj = YAML.parse(configText);
            break;
        case ".json":
            configObj = JSON.parse(configText);
            break;
        case ".js":
            const mod = await import(configPath);
            configObj = mod.default
            console.log(configObj);
            break;
    }
    if (configObj.parser === undefined) {
        return {
            configPath,
            isClash: true,
            isUclash: false,
            clash: configObj,
            uclash: undefined,
            config: configObj,
        }
    }
    if (configObj === null) {
        throw new Error("can't read config file");
    }

    const { parser } = configObj;
    parser.destination = isAbsolute(parser.destination)
        ? parser.destination
        : resolve(dirname(configPath), parser.destination);
    if (parser[process.platform]) {
        for (const key in parser[process.platform]) {
            parser[key] = parser[process.platform][key];
        }
    }
    const r = {
        configPath,
        isClash: false,
        isUclash: true,
        clash: undefined,
        uclash: configObj,
        config: configObj,
    }
    if (fs.existsSync(parser.destination)) {
        const str = fs.readFileSync(parser.destination, "utf-8")
        r.clash = YAML.parse(str)
    }
    return r
}
