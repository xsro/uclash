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
    "persist-folder": "{HOME}/.config/uclash",
    "log-level": 4,
    "ui-repo": undefined,// set "https://github.com/Dreamacro/clash-dashboard" or "https://github.com/haishanh/yacd"
    "ui-branch": "gh-pages",
    "ui-folder": "{project}/_ui",
    "config-repo": undefined,
    "config-branch": "main",
    "config-folder": "{persist}/_config",
    "cache-folder": "{project}/tmp/",
    "ui-subfolder": "c",

    "win32.persist-folder": "{USERPROFILE}\\.config\\uclash",
}
export const _c = _defaultConfig;
const pathProperty = [
    "ui-folder", "config-folder", "cache-folder", "persist-folder"
]

function validateConfig(config) {
    for (const i in config) {
        const [platform, name] = i.split(".");
        if (name) {
            if (platform === process.platform && config[i]) {
                config[name] = config[i]
            }
            delete config[i];
        }
    }
    const variableSet = { ...process.env, "project": projectFolder };
    function resolveVariable(str) {
        if (typeof str !== "string") {
            return str
        }
        for (const r of str.matchAll(/{(\w*?)}/g)) {
            const [all, key] = r;
            if (variableSet[key]) {
                str = str.replace(all, variableSet[key])
            }
        }
        return str;
    }
    const persistFolder = path.resolve(resolveVariable(config["persist-folder"]));
    variableSet["persist"] = persistFolder;
    !existsSync(persistFolder) && mkdirSync(persistFolder, { recursive: true })

    for (const i in config) {
        config[i] = resolveVariable(config[i]);
        if (pathProperty.includes(i) && config[i].includes("/") && config[i].includes("\\")) {
            config[i] = path.resolve(config[i]);
        }
    }
    return config
}

export const defaultConfig = validateConfig(_defaultConfig)

let _config = undefined;
try {
    const text = readFileSync(defaultConfig["uclash-config"], "utf-8");
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
        writeFileSync(
            uclashConfigPath,
            JSON.stringify(_config, undefined, 4),
            "utf-8"
        )
    }
)