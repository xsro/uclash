# clash-nodejs-utility

**uclash** is a CLI tool for managing clash profile. 
It is writen in javascript use [esm](https://nodejs.org/api/esm.html) and runs in nodejs runtime. 
uclash is originnally built for using in Termux to share proxy with hotpot. 

Now, it's opinioned and buggy

## Install

```shell
npm install -g uclash
yarn global add uclash
```

## Install latest unstable version from github

```shell
yarn global add https://github.com/xsro/uclash
npm install -g https://github.com/xsro/uclash
```

## Usage

type `uclash help`

## Troubleshoot

- shebang interpreter Error: 
  - Install [termux-exec](https://github.com/termux/termux-exec) for most cases
  - in some script like [Termux:Widge](https://wiki.termux.com/wiki/Termux:Widget): use `node $(which uclash)` command as an alternative
- Problems about esm: Upgrade nodejs

## know issue

- [ ] use white pac in android, bilibili app can't work
- [ ] use http(s) proxy in android, zhihu app can't work
