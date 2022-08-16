#!/usr/bin/env node
const { Command } = require("commander");
const {cli} = require("../lib/index");
const fs=require("fs");
const path = require("path");

const pack=JSON.parse(fs.readFileSync(path.resolve(__dirname,"..","package.json"),"utf-8"))

const program = new Command();

program
  .name(pack.name)
  .description(pack.description)
  .version(pack.version);

program.command('expr')
  .argument('<string>', 'string to eval as expression')
  .action(cli.expr);

program.parse();