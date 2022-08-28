import path from "path";
import config from "./config";
import { ClashDashBoards } from "./util/default";
import os from "os";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import jszip from "jszip";
import logger from "./util/logger";

export async function clashDashboradInit(uis: ClashDashBoards, key: string, unzip: boolean, allowReuse: boolean) {
    if (uis[key]) {
        const { url: _url, dest: _dest, root } = uis[key]
        const url = new URL(_url);
        const dest = config.paths.abs(_dest)
        const output = path.resolve(os.tmpdir(), path.basename(url.pathname))
        if (existsSync(output) && allowReuse) {
            logger.info("reused " + output)
        }
        else {
            config.cURL(_url, { output, location: "" })
        }

        if (!unzip) {
            logger.info("unzip skipped, please unzip file " + output)
        }
        else {
            if (!existsSync(dest)) {
                mkdirSync(dest, { recursive: true })
            }
            const data = readFileSync(output)
            const zip = await jszip.loadAsync(data)
            const files = zip.files
            try {
                function write(p: string, data: Buffer) {
                    const d = path.dirname(p);
                    if (!existsSync(d)) {
                        mkdirSync(d, {
                            recursive: true
                        });
                    }
                    writeFileSync(p, data)
                    logger.info("writed " + p)
                }
                for (const filename of Object.keys(files)) {
                    let rel = filename;
                    if (root) {
                        rel = path.posix.relative("/" + root, "/" + filename)
                    }
                    const dst = path.join(dest, rel);
                    // 如果该文件为目录需先创建文件夹
                    if (!files[filename].dir) {
                        const content = await files[filename].async('nodebuffer')
                        write(dst, content);
                    }
                }
            } catch (error) {
                console.error('save zip files encountered error!', error);
                return error;
            }
        }
    }

}