import { readFileSync, writeFileSync } from "fs"
import { asAbsolutePath } from "./util.js";

export const defaultConfig = {
    "log-level": 4,
}

const localConfigPath = asAbsolutePath("tmp/config.json");

let _config = undefined;

try {
    const text = readFileSync(localConfigPath, "utf-8");
    const obj = JSON.parse(text);
    _config = { ...defaultConfig, ...obj }
} catch (e) {
    _config = defaultConfig;
}

export const config = _config;

process.on("exit",
    function () {
        writeFileSync(
            localConfigPath,
            JSON.stringify(config),
            "utf-8"
        )
    }
)