import * as api from "./api"

export function expr(str: string) {
    console.log(api.expr(str))
}

export const setProjectFolder = (str: string) => api.config.projectFolder = str;

export function config(options: { default: boolean, custom: boolean, merged: boolean }) {
    const keys:("default"|"custom"|"merged")[]=["default", "custom", "merged"]
    for (const key of keys)
        if (options[key]) {
            console.log(api.config[key])
        }
}