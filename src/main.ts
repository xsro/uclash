import { Command } from "commander";
import { api, cli } from "./index";
import fs from "fs";
import path from "path";
import os from "os";

const program = new Command();

if (__dirname) {
    const projectFolder = path.dirname(__dirname);
    cli.setProjectFolder(projectFolder)
    const pack = JSON.parse(fs.readFileSync(path.resolve(__dirname, "..", "package.json"), "utf-8"))
    program
        // .name(pack.name)
        .description(pack.description)
        .version(pack.version)
        .addHelpText("before", `
  ██╗   ██╗ ██████╗██╗      █████╗ ███████╗██╗  ██╗ 
  ██║   ██║██╔════╝██║     ██╔══██╗██╔════╝██║  ██║
  ██║   ██║██║     ██║     ███████║███████╗███████║ 
  ██║   ██║██║     ██║     ██╔══██║╚════██║██╔══██║
  ╚██████╔╝╚██████╗███████╗██║  ██║███████║██║  ██║ ${pack.version}
   ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ${os.platform}-${os.arch}
folder:  ${projectFolder}
`);
}

program.command('expr')
    .alias("e")
    .option("-R, --no-replace-at")
    .argument('<string>', 'string to eval as expression')
    .action(cli.expr);

program.command("config")
    .option("-k, --key <string>", "get config of key")
    .option("-a, --abs", "with -k, get config as abspath")
    .option("-d, --default", "print default config")
    .option("-c, --custom", "print custom config")
    .option("-m, --merged", "print merged config")
    .option("-p, --path", "print custom config path")
    .action(cli.config)

program.command("profile")
    .alias("p")
    .argument("[profile]")
    .option("-c,--clash-path")
    .option("-k,--key <string>")
    .action(cli.profile)

program.command("ip")
    .argument('[proxy]')
    .option("-l,--list")
    .option("-k,--key <string>")
    .option("-p,--provider <string>")
    .action(cli.ip)

program.command("generate")
    .alias("g")
    .argument("<profile>", "the profile to use")
    .action(cli.generate);

program.command("clash-dashboard")
    .alias("ui")
    .option("-l,--list")
    .option("-i,--init <ui>")
    .option("-u,--unzip")
    .option("-a,--allow-reuse")
    .action(cli.ui);

program.command("reload")
    .argument("<profile>")
    .option("-c,--controller [string]")
    .action(cli.reload)

program.command("get")
    .argument("<name>")
    .argument("[args...]")
    .option("-c,--controller [string]")
    .action(function (name: string, args: string[], options: { controller: string }) { cli.control("get", name, args, options) })

program.command("put")
    .argument("<name>")
    .argument("[args...]")
    .option("-c,--controller [string]")
    .action(function (name: string, args: string[], options: { controller: string }) { cli.control("put", name, args, options) })

function main(argv: string[]) {
    program.parse(argv);
}

export default main