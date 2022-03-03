import { asAbsolutePath } from "./util.js";
import * as fs from "fs/promises";
import { logger } from "./logger.js";
import { extname, resolve, isAbsolute, dirname } from "path";
import YAML from "yaml";
import { existsSync } from "fs";

export async function getConfig(conf) {
    let configPath = conf;
    let configIdx = typeof conf === "string" && parseInt(conf) >= 0 ? parseInt(conf) : undefined;
    if (typeof configIdx === "number") {
        if (existsSync(asAbsolutePath("_config"))) {
            const files = await fs.readdir(asAbsolutePath("_config/"));
            const cfgs = files
                .filter(file => !file.startsWith("_") && file.endsWith(".yml"))
                .map(file => asAbsolutePath("_config/" + file));
            logger.info("finded " + Object.entries(cfgs).map(val => { let [k, v] = val; return `${k} ${v}`; }).join("\t\n"));
            let i = conf ? parseInt(conf) : 0;
            configPath = cfgs[i];
        }
        else {
            if (conf === 1) {
                configPath = asAbsolutePath("config/GreenFish.json");
            }
            if (conf === 2) {
                configPath = asAbsolutePath("config/GreenFish.yml");
            }
            if (conf === 3) {
                configPath = asAbsolutePath("config/SS-Rule-Snippet.yml");
            }
        }
    }

    if (!isAbsolute(configPath)) {
        configPath = resolve(process.cwd(), configPath);
    }
    const configText = await fs.readFile(configPath, { encoding: "utf-8" });
    let config = null;
    switch (extname(configPath).toLowerCase()) {
        case ".yml":
        case ".yaml":
            config = YAML.parse(configText);
            break;
        case ".json":
            config = JSON.parse(configText);
            break;
    }
    if (config === null) {
        throw new Error("can't read config file");
    }

    const { parser } = config;
    parser.destination = isAbsolute(parser.destination)
        ? parser.destination
        : resolve(dirname(configPath), parser.destination);
    if (parser[process.platform]) {
        for (const key in parser[process.platform]) {
            parser[key] = parser[process.platform][key];
        }
    }
    return { configPath, config };
}
