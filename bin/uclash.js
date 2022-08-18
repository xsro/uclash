#!/usr/bin/env node
const { Command } = require("commander");
const {cli, api} = require("../lib/index");
const fs=require("fs");
const path = require("path");
const os=require("os");
const { execSync } = require("child_process");

const projectFolder=path.dirname(__dirname);
cli.setProjectFolder(projectFolder)

const pack=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","package.json"),"utf-8"))

const program = new Command();

program
  // .name(pack.name)
  .description(pack.description)
  .version(pack.version)
  .addHelpText("before",`
  ██╗   ██╗ ██████╗██╗      █████╗ ███████╗██╗  ██╗ 
  ██║   ██║██╔════╝██║     ██╔══██╗██╔════╝██║  ██║
  ██║   ██║██║     ██║     ███████║███████╗███████║ 
  ██║   ██║██║     ██║     ██╔══██║╚════██║██╔══██║
  ╚██████╔╝╚██████╗███████╗██║  ██║███████║██║  ██║ ${pack.version}
   ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ${os.platform}-${os.arch}
folder:  ${projectFolder}
`);

program.command('expr')
  .alias("e")
  .argument('<string>', 'string to eval as expression')
  .action(cli.expr);

program.command("config")
  .option("-k, --key <string>","get config of key")
  .option("-a, --abs","with -k, get config as abspath")
  .option("-d, --default","print default config")
  .option("-c, --custom","print custom config")
  .option("-m, --merged","print merged config")
  .option("-p, --path","print custom config path")
  .action(cli.config)

program.command("profile")
  .alias("p")
  .argument("[profile]")
  .option("-c,--clash-path")
  .option("-k,--key <string>")
  .action(cli.profile)

program.command("ip")
  .argument('[proxy]')
  .action(cli.ip)

program.command("generate")
  .alias("g")
  .argument("<profile>","the profile to use")
  .action(cli.generate);

program.parse();