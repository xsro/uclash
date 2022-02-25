
import getRandomEmoji from "./randomEmoji.js";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from "child_process";
import { asAbsolutePath } from "./util.js";
import { logger } from "./logger.js";
import parse from "./parser/parser.js";
import { dirname } from "path";

export default async function updateClashProfile(config, outsideProfileDst, useGit, push) {
    const former = existsSync(config.parser.destination) ? readFileSync(config.parser.destination, { encoding: "utf-8" }) : "";
    const cc = await parse(config);
    //{ text, areas, updateTime }
    const changed = former !== cc.text;
    if (!changed) {
        logger.info(4, "config unchanged")
    } else {
        writeFileSync(config.parser.destination, cc.text, { encoding: "utf-8" });
        logger.info(4, "config updated " + new Date().toLocaleTimeString());
    }
    // const config_dst = process.argv[2];
    if (outsideProfileDst) {
        if (existsSync(outsideProfileDst)) {
            const configText = readFileSync(outsideProfileDst, { encoding: "utf-8" });
            if (configText !== cc.text) {
                writeFileSync(outsideProfileDst, cc.text, { encoding: "utf-8" });
                logger.info(3, "copied to" + outsideProfileDst);
            }
        } else {
            console.warn("file not found " + outsideProfileDst)
        }
    }

    //write the infomation
    const areas_msg = Object.entries(cc.areas).sort(((a, b) => -(a[1] - b[1]))).map(val => `${val[0]}:${val[1]}`).join(",");
    const msg = `[profile] update nodes from ${cc.updateTime} ${getRandomEmoji()}
${areas_msg}
runs on ${process.platform}-${process.arch}`;
    writeFileSync(asAbsolutePath("tmp/1.txt"), msg, { encoding: "utf-8" });
    if (changed && useGit) {
        const cwd = dirname(config.parser.destination);
        execSync("git add .", { cwd });
        try {
            execSync(`git commit -F ${asAbsolutePath("tmp/1.txt")}`, { cwd });
            if (push) {
                const out = execSync(`git push`, { encoding: "utf-8", cwd });
                logger.info(3, "pushed:" + out)
            }
        } catch (e) {
            logger.info(3, "no file for commit")
        }
    }
    return { changed }
}