
import getRandomEmoji from "./randomEmoji.js";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from "child_process";
import { asCachePath } from "./util.js";
import { logger } from "./logger.js";
import parse from "./parser/parser.js";
import { dirname } from "path";

export default async function updateClashProfile(config, git = {
    before: "git pull",
    add: true,
    commit: true,
    after: "git push",
}, allowCache = false) {

    const former = existsSync(config.parser.destination) ? readFileSync(config.parser.destination, { encoding: "utf-8" }) : "";
    const parsed = await parse(config, allowCache);

    const execOptions = {
        cwd: dirname(config.parser.destination),
        stdio: "inherit",
        encoding: "utf-8",
    }
    try {
        execSync("git status", execOptions)
    } catch (e) {
        logger.info(4, "not a git folder or git not found");
        git = {};
    }
    if (git.before) {
        execSync(git.before, execOptions)
    }
    const changed = former !== parsed.text;
    if (!changed) {
        logger.info(4, "config unchanged")
    } else {
        writeFileSync(config.parser.destination, parsed.text, { encoding: "utf-8" });
        logger.info(4, "config updated " + new Date().toLocaleTimeString());
    }

    const copyProfileDestinations = [];
    if (Array.isArray(config.parser.copy)) {
        copyProfileDestinations.push(...config.parser.copy)
    }
    if (typeof config.parser.copy === "string") {
        copyProfileDestinations.push(config.parser.copy)
    }

    for (const copyDst of copyProfileDestinations) {
        let configText = undefined;
        if (!existsSync(copyDst)) {
            console.warn("file not found, create " + copyDst)
        } else {
            configText = readFileSync(copyDst, { encoding: "utf-8" });
        }
        if (configText !== parsed.text) {
            writeFileSync(copyDst, parsed.text, { encoding: "utf-8" });
            logger.info(3, "copied to" + copyDst);
        }
    }

    //write the infomation
    const areas_msg = Object.entries(parsed.areas).sort(((a, b) => -(a[1] - b[1]))).map(val => `${val[0]}:${val[1]}`).join(",");
    const msg = `[profile] update nodes from ${parsed.updateTime} ${getRandomEmoji()}
${areas_msg}
runs on ${process.platform}-${process.arch}`;
    writeFileSync(asCachePath("1.txt"), msg, { encoding: "utf-8" });
    if (changed) {
        try {
            if (git.add) {
                execSync("git add .", execOptions);
            }
            if (git.commit) {
                execSync(`git commit -F ${asCachePath("1.txt")}`, execOptions);
            }
        } catch (e) {
            logger.info(3, "commit failed" + e)
        }
        if (git.after) {
            const out = execSync(`git push`, execOptions);
            logger.info(4, "pushed:" + out)
        }
    }
    return { changed }
}