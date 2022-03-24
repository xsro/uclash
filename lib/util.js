import path, { dirname } from "path";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from 'url';
import { homedir } from "os";

// https://stackoverflow.com/a/50052194
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectFolder = dirname(__dirname);

export const paths = {
    projectFolder,
    cache: function (str) {
        return path.resolve(config.get("cache-folder"), str)
    },
    resources: function (str) {
        return path.resolve(projectFolder, "resources", str)
    },
    clashConfig: function (str) {
        return path.resolve(projectFolder, "config", str)
    },
}

const _defaultConfigText = readFileSync(paths.resources("uclash.default.config.json"), "utf-8")
const _defaultConfig = JSON.parse(_defaultConfigText);

class Config {
    _defaultConfig = _defaultConfig;
    _userConfig = {};
    _userConfigPath = path.resolve(homedir(), ".config", "uclash", "config.json")
    get userConfigPath() {
        if (process.env.UCLASH_CONFIG) {
            return process.env.UCLASH_CONFIG;
        } else {
            return this._userConfigPath
        }
    }

    constructor() {
        try {
            const text = readFileSync(this.userConfigPath, "utf-8");
            this._userConfig = JSON.parse(text);
        } catch (e) {
        }
    }
    get _target() {
        return {
            ...this._defaultConfig,
            ...this._userConfig,
        }
    }
    get _parsed() {
        return parseConfig(this._target)
    }
    get _parsedDefault() {
        return parseConfig(this._defaultConfig)
    }
    get(key, d = false) {
        if (d) {
            return this._parsedDefault[key]
        }
        return this._parsed[key]
    }
    set(key, value) {
        const _schema = readFileSync(paths.resources("uclash.config.schema.json"));
        const schema = JSON.parse(_schema);
        if (schema["properties"][key]["type"] === "number") {
            value = parseFloat(value)
        }
        this._userConfig[key] = value;
        !existsSync(dirname(this._userConfigPath))
            && mkdirSync(dirname(this._userConfigPath));
        const schemalinks = [
            paths.resources("uclash.config.schema.json"),
            `https://raw.githubusercontent.com/xsro/uclash/v${pack.version}/resources/uclash.config.schema.json`,
            `https://cdn.jsdelivr.net/npm/uclash@${pack.version}/resources/uclash.config.schema.json`
        ]
        writeFileSync(
            this._userConfigPath,
            JSON.stringify({
                ...this._userConfig,
                $schema: schemalinks[0]
            }, undefined, 4),
            "utf-8"
        )
    }
}

const folderProperty = [
    "ui-folder", "config-folder", "cache-folder"
]
function parseConfig(_config) {
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

export const config = new Config();


export const pack = JSON.parse(readFileSync(path.resolve(projectFolder, "./package.json"), "utf-8"))

// console.log(config, config._parsed, paths)