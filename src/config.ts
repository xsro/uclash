import fs from "fs";
import { Paths } from "./util/paths";
import default_config, { AppConfig } from "./util/default";
import YAML from "yaml";
import { curl, cURL } from "./util/curl";
import logger, { LogLevel } from "./util/logger";

class Config {
    _projectFolder = "";
    custom_Config_Paths = [
        "{home}/.config/uclash/config.",
        "{home}/.config/uclash.",
        "{home}/.uclash.",
    ];
    custom_Config_Exts = [
        "yml", "json", "yaml"
    ]

    default: AppConfig = default_config;
    custom: { [id: string]: any } = {};
    merged: AppConfig;
    paths: Paths = new Paths();
    custom_path: string = "";

    set projectFolder(str: string) {
        this._projectFolder = str;
        this.paths.valueMap.set("project", this._projectFolder);
    }

    constructor() {
        a:
        for (const _custom_path of this.custom_Config_Paths) {
            for (const ext of this.custom_Config_Exts) {
                const custom_path = this.paths.resolve(_custom_path + ext)
                if (fs.existsSync(custom_path)) {
                    const custom_str = fs.readFileSync(custom_path, "utf-8");
                    switch (ext) {
                        case "json":
                            this.custom = JSON.parse(custom_str);
                            break;
                        case "yaml":
                        case "yml":
                            this.custom = YAML.parse(custom_str);
                            break
                    }
                    this.custom_path = custom_path;
                    break a;
                }
            }
        }
        this.merged = { ...this.default, ...this.custom } as AppConfig;
        const name = this.get<keyof typeof LogLevel>("log", "info");
        logger.baseLogLevel = LogLevel[name];
    }

    get<T>(longKey: string, default_val: T): T
    get<T>(longKey: string): T | undefined
    get<T>(longKey: string, default_val?: T): T | undefined {
        let target: any = this.custom;
        for (const key of longKey.split(".")) {
            if (key in target) {
                target = target[key]
            }
            else {
                target = undefined
                break
            }
        }
        let default_target: any = this.default
        for (const key of longKey.split(".")) {
            if (key in default_target) {
                default_target = default_target[key]
            }
            else {
                default_target = undefined
                break
            }
        }
        const isObject = (obj: any) => typeof obj === "object" && obj !== null
        if (isObject(target) && isObject(default_target)) {
            return { ...default_target, ...target } as T
        }
        if (target === undefined) {
            return default_val;
        }
        return target as T
    }

    curl = curl;
    cURL = cURL;

    toString() {
        return JSON.stringify(this.merged)
    }
}

const config = new Config()

export default config




