import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import { config, paths, execOpts } from "./util.js";

/**
 * Add crontab to the system
 * @param {string} profile 
 * @param {*} options 
 */
export async function cron(profile, options) {
    const next = new Date(Date.now() + 1000 * 60 * 2);
    const schedule = options.schedule ? options.schedule : `${next.getMinutes()} 7,12,18,22 * * *`;
    const script = config.get("uclash-service");
    fs.writeFileSync(script, `
alias uclash="${process.argv[0]} ${process.argv[1]}"
if [[ "$(curl -s baidu.com)" == *"www.baidu.com"* ]];then
    echo "" 
    echo -e "\\033[31m==>\\033[0m update profile  \\033[32m$(date)\\033[0m"
    uclash generate ${profile} -cp 
    generated=$?
fi

if [[ "$(ps aux | grep clash | wc -l)" -eq "1" ]];then
    echo "clash is not started, try to start it"
    uclash exec ${profile} --daemon "nohup&"
elif [ "$generated" -eq "0" ];then
    uclash reload ${profile}
    echo -e "\\033[31m==>\\033[0mrestarted clash $(uclash ip -x 7890)"
fi
`, "utf-8");

    if (options.onlyScript) {
        console.log(paths.cache(script));
    } else {
        fs.writeFileSync(paths.cache("uclash-service.crontab"),
            `${schedule} bash ${script} >>"${config.get("crontab-log")}" 2>&1` + os.EOL,
            "utf-8");
        execSync(`crontab ` + paths.cache("uclash-service.crontab"), execOpts);
    }
}
