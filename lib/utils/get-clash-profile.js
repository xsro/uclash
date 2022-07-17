import { config, paths } from "../util.js";
import * as fs from "fs";
import { extname, resolve, isAbsolute, dirname } from "path";
import YAML from "yaml";

export const profileMap = new Map();
profileMap.set(0, paths.clashConfig("SS-Rule-Snippet.yml"))

if (fs.existsSync(config.get("config-folder"))) {
    const files = fs.readdirSync(config.get("config-folder"));
    const cfgs = files
        .filter(file => !file.startsWith("_") && file.endsWith(".yml"))
        .map(file => resolve(config.get("config-folder"), file));
    const offset = Array.from(profileMap.keys()).length
    cfgs.forEach((val, idx) => profileMap.set(idx + offset, val))
}

export async function getClashConfig(conf) {
    let configPath = undefined;
    conf = (typeof conf === "string" && parseInt(conf) >= 0) ? parseInt(conf) : conf;

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
    return { configPath, config: configObj };
}
