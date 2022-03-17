# clash-nodejs-utility

**uclash** is a CLI tool for managing clash profile. 
uclash is writen in javascript using [esm](https://nodejs.org/api/esm.html)
 and runs in nodejs runtime. 
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

## Install Clash in Termux

```sh
#install clash
pkg install clash
#install clash premium
curl -fsSL "https://raw.githubusercontent.com/xsro/uclash/main/scripts/install-premium-in-termux.sh" | bash
```

## Usage

type `uclash help`.

## Quick start

```sh
#uclash config config-repo <repo>     # set a repo for uclash profiles
uclash init                 # create folder for ui and clone `config-repo` to `config-folder`
uclash config -p            # display a list of clash profiles with id, 0 is built in profile
uclash generate 0           # update profiles, `0` can be the path of your config or config id
uclash exec 0               # exec clash to start proxy server with clash config path or id
```

## Troubleshoot

- shebang interpreter Error: 
  - Install [termux-exec](https://github.com/termux/termux-exec) for most cases
  - in some script like [Termux:Widge](https://wiki.termux.com/wiki/Termux:Widget): use `node $(which uclash)` command as an alternative
- Problems about esm: Upgrade nodejs

## know issue

- [ ] use white pac in android, bilibili app can't work
- [ ] use http(s) proxy in android, zhihu app can't work
