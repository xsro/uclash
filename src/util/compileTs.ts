import { resolve } from "path";
import os from "os";
import { copyFileSync, fstat, mkdirSync, readFileSync, watch, writeFileSync } from "fs";
import { execSync } from "child_process";

const tsconfig = {
    "compilerOptions": {
        "module": "commonjs",                                /* Specify what module code is generated. */
        "target": "es2017",
        "paths": {
            "uclash": ["/Users/apple/repo/uclash"]
        },                                                   /* Specify a set of entries that re-map imports to additional lookup locations. */
        "esModuleInterop": true,                             /* Emit additional JavaScript to ease support for importing CommonJS modules. This enables 'allowSyntheticDefaultImports' for type compatibility. */
        "forceConsistentCasingInFileNames": true,            /* Ensure that casing is correct in imports. */
        "strict": true,                                      /* Enable all strict type-checking options. */
        "skipLibCheck": true                                 /* Skip type checking all .d.ts files. */
    }
}

export function compileTs(profilePath: string) {
    const littleProjectPath = resolve(os.tmpdir(), "uclash-parse-ts")
    mkdirSync(littleProjectPath, { recursive: true })
    copyFileSync(profilePath, resolve(littleProjectPath, "profile.ts"))
    writeFileSync(resolve(littleProjectPath, "tsconfig.json"), JSON.stringify(tsconfig))
    execSync("tsc -p tsconfig.json", { cwd: littleProjectPath })
    return resolve(littleProjectPath, "profile.js")
}

export function watchTs(profilePath: string) {
    const littleProjectPath = resolve(os.tmpdir(), "uclash-parse-ts")
    mkdirSync(littleProjectPath, { recursive: true })
    const watcher = watch(profilePath);
    watcher.on("change", () => {
        copyFileSync(profilePath, resolve(littleProjectPath, "profile.ts"))
    })
    execSync("tsc -p tsconfig.json --watch", { cwd: littleProjectPath })
}