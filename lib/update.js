
import getRandomEmoji from "./randomEmoji.js";
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from "child_process";
import { config, paths } from "./util.js";
import { logger } from "./logger.js";
import parse from "./parser/parser.js";
import { dirname } from "path";

const cacheOpt = config.get("profile-cache")

export default async function updateClashProfile(config, git = {
    before: "git pull",
    commit: true,
    after: "git push",
}) {
    const textBeforeGit = existsSync(config.parser.destination)
        ? readFileSync(config.parser.destination, { encoding: "utf-8" })
        : "";
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

    let former = "";
    if (existsSync(config.parser.destination)) {
        former = readFileSync(config.parser.destination, { encoding: "utf-8" });
    }
    const removeComment = function (str) {
        return str.split("\n").filter(val => !val.trim().startsWith("#")).join("\n")
    }
    const parsed = await parse(config, cacheOpt);
    const changed = removeComment(former) !== removeComment(parsed.text);
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

    const msg = `[profile]  ${getRandomEmoji()} runs on ${process.platform}-${process.arch}
${parsed.updateTimeMsg.join("\n")}
`;
    writeFileSync(paths.cache("1.txt"), msg, { encoding: "utf-8" });
    try {
        if (git.commit) {
            execSync(`git add ${config.parser.destination}`, execOptions)
            execSync(`git commit -a -F ${paths.cache("1.txt")}`, execOptions);
        }
    } catch (e) {
        logger.info(3, "commit failed" + e)
    }
    if (git.after) {
        execSync(`git push`, execOptions);
        logger.info(4, "pushed")
    }
    return { changed: removeComment(parsed.text) !== removeComment(textBeforeGit) }
}