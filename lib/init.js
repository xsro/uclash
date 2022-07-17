import { execSync } from "child_process";
import * as fs from "fs";
import { logger } from "./utils/logger.js";
import { config, execOpts } from "./util.js";


export async function init(folder, options) {
    if (folder === "config" || folder === undefined) {
        if (options.force) {
            fs.rmSync(config.get("config-folder"), { force: true, recursive: true });
        }
        if (config.get("config-folder")) {
            if (config.get("config-repo")) {
                if (fs.existsSync(config.get("config-folder"))) {
                    logger.info(4, `${config.get("config-folder")} has exists`);
                } else {
                    execSync(`git clone ${config.get("config-repo")} ${config.get("config-folder")} -b ${config.get("config-branch")}`, execOpts);
                }
            } else {
                logger.info(4, "`config-repo` is not setted, skip");
                //!fs.existsSync(config.get("config-folder")) && await fs.mkdir(config.get("config-folder"))
            }
        } else {
            logger.info(4, "`config-folder` is not setted");
        }
    }
    if (folder === "ui" || folder === undefined) {
        if (options.force) {
            fs.rmSync(config.get("ui-folder"), { force: true, recursive: true });
        }
        if (config.get("ui-folder")) {
            if (config.get("ui-repo")) {
                if (fs.existsSync(config.get("ui-folder"))) {
                    logger.info(4, `${config.get("ui-folder")} has exists`);
                } else {
                    execSync(`git clone ${config.get("ui-repo")} ${config.get("ui-folder")} -b ${config.get("ui-branch")}`, execOpts);
                }
            } else {
                logger.info(4, "`ui-repo` is not setted, create a empty folder " + config.get("ui-folder"));
                !fs.existsSync(config.get("ui-folder")) && fs.mkdirSync(config.get("ui-folder"));
            }
        }
        else {
            logger.info(4, "`ui-folder` is not setted");
        }
    }
}
