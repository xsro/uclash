#!/usr/bin/env node
const { Command } = require("commander");
const {cli, api} = require("../lib/index");
const fs=require("fs");
const path = require("path");
const os=require("os");

const projectFolder=path.dirname(__dirname);
cli.setProjectFolder(projectFolder)

const pack=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","package.json"),"utf-8"))

const program = new Command();

program
  .name(pack.name)
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
  .option("-d, --default","print default config")
  .option("-c, --custom","print custom config")
  .option("-m, --merged","print merged config")
  .action(cli.config)

program.command("generate")
  .alias("g")
  .argument("<config>","the config to use")
  // .option("")
  .action(function(){

  });

program.parse();