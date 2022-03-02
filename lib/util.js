import path, { dirname } from "path";
import { statSync } from "fs";

export const projectFolder = statSync(process.argv[1]).isDirectory() ? process.argv[1] : dirname(process.argv[1]);

export function asAbsolutePath(...pathSegments) {
    return path.resolve(projectFolder, ...pathSegments)
}