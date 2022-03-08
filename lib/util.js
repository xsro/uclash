import path, { dirname } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from 'url';
import { homedir } from "os";

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url));
export const projectFolder = dirname(__dirname);

export const uclashConfigPath =
    process.env.UCLASH_CONFIG
        ? process.env.UCLASH_CONFIG
        : path.resolve(homedir(), ".config", "uclash", "config.json");


const _defaultConfig = {
    "log-level": 4,
    "ui-repo": undefined,// set "https://github.com/Dreamacro/clash-dashboard" or "https://github.com/haishanh/yacd"
    "ui-branch": "gh-pages",
    "ui-folder": "{project}/_ui",
    "config-repo": undefined,
    "config-branch": "main",
    "config-folder": "{HOME}/.config/uclash/_config/",
    "cache-folder": "{project}/tmp/",
    "ui-subfolder": "c",
}
const folderProperty = [
    "ui-folder", "config-folder", "cache-folder"
]

function validateConfig(_config) {
    const config = { ..._config }
    for (const i in config) {
        const [platform, name] = i.split(".");
        if (name) {
            if (platform === process.platform && config[i]) {
                config[name] = config[i]
            }
            delete config[i];
        }
    }
    const variableMap = new Map();
    variableMap.set("project", projectFolder);
    variableMap.set("HOME", homedir());
    for (const [k, v] of Object.entries(process.env)) {
        variableMap.set("env:" + k, v)
    }
    function resolveVariable(str) {
        if (typeof str !== "string") {
            return str
        }
        for (const r of str.matchAll(/{([:\w]*?)}/g)) {
            const [all, key] = r;
            if (variableMap.has(key)) {
                str = str.replace(all, variableMap.get(key))
            }
        }
        return str;
    }

    for (const i in config) {
        config[i] = resolveVariable(config[i]);
        if (folderProperty.includes(i) && config[i] && config[i].includes("/") && config[i].includes("\\")) {
            config[i] = path.resolve(config[i]);
            !existsSync(config[i]) && mkdirSync(config[i], { recursive: true })
        }
    }
    return config
}

export const defaultConfig = validateConfig(_defaultConfig)

let _config = undefined;
try {
    const text = readFileSync(uclashConfigPath, "utf-8");
    _config = JSON.parse(text);
} catch (e) {
    _config = null
}
export let config = _config !== null ? validateConfig({ ..._defaultConfig, ..._config }) : { ...defaultConfig };
export function setConfig(key, value) {
    if (_config === null) _config = {}
    _config[key] = value;
}

export const rawConfig = {
    _defaultConfig, _config
}

export function asCachePath(str) {
    return path.resolve(config["cache-folder"], str)
}

process.on("exit",
    function () {
        !existsSync(dirname(uclashConfigPath)) && mkdirSync(dirname(uclashConfigPath))
        writeFileSync(
            uclashConfigPath,
            JSON.stringify(_config, undefined, 4),
            "utf-8"
        )
    }
)