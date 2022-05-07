#!/usr/bin/env node
import { program } from "commander";
import * as api from "../api.js";
import { getPublicIP } from "../lib/ip.js";
import { config, pack } from "../lib/util.js";

program
    .version(api.version)
    .description(pack.description)

program
    .command("config [key] [value]")
    .description(`update uclash configs in ${config._userConfigPath}, 
    if value set to null, the property will be removed, 
    if no value passed, the property will use the default.`)
    .option("-l,--list", "list the current config")
    .option("-d,--list-default", "list default config")
    .option("-r,--raw", "list raw config, with -l or -d")
    .option("-p,--list-profile", "list clash config profile")
    .action(api.uclash_config)

program
    .command("init")
    .argument("[folder]", "config or ui")
    .description("setup ui folder and clash config folder")
    .option("-f,--force", "rm all")
    .action(api.init)

program
    .command("reset")
    .description("reset ui and config folder")
    .action(api.reset)

program
    .command("cron")
    .description("add a crontab to termux")
    .argument("<profile>")
    .option("-f,--schedule <string>", "schedule expressions. see https://crontab.guru/")
    .option("--only-script", "generate script only")
    .action(api.cron)

program
    .command("generate")
    .description("generate a profile from a uclash profile")
    .argument("[uclash_profile]", "use configuration from file, when undefined, all config will be used in _config")
    .option("-c,--git-commit", "generate a git commit if config changed")
    .option("-p,--git-push", "push to remote if config changed")
    .option("-b,--before [string]", "command will be run before update profile,default is git pull")
    .action(api.generate);

program
    .command("exec")
    .description("execute clash via child_process")
    .argument("<uclash-profile>", "use configuration from a file")
    .option("-u,--ui <path>", "start the ui from the path")
    .option("-p,--command [cmd]", "the command to start clash, default is `clash`;-p means use `clash-premium`; -p cmd means use cmd you defined")
    .option("-D,--dryrun", "dry run")
    .option("-d,--daemon <screen|pm2|nohup&>", "use daemon to run clash")
    .option("-c,--clash-log <redirect|inhert|ignore>", "clash log, default is inherit to console")
    .option("-S,--secret [string]", "set secret for API")
    .option("-s,--silent", "don't print message for net")
    .action(api.exec)

program.command("find")
    .description("find proxy in the local network, powered by system command `arp -a`, can't work in termux")
    .argument('[ip-filter]', "the ip to find, or a expression for filter `arp -a` ips ")
    .argument("[path]", "the path to find infomation,default is `/ui/c/info.json`")
    .argument("[port]", "the port, default is 9090")
    .action(api.find)

program.command("ip")
    .option("-x,--proxy <string>")
    .action(function (options) {
        getPublicIP(options.proxy).then(console.log)
    })

program.command("reload")
    .argument("<profile>")
    .action(api.reload)

program.parse()






