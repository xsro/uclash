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

When first installed, run `uclash init` to create folder for ui.

```sh
uclash config config-repo <repo> # <repo> is private repository link
uclash init                      # create folder for ui and clone config-repo to config-folder
uclash generate                  # update profiles in <repo>
uclash config -p                 # display a list of clash profiles
uclash exec 0                    # run clash to start proxy server with clash config path
```

## Troubleshoot

- shebang interpreter Error: 
  - Install [termux-exec](https://github.com/termux/termux-exec) for most cases
  - in some script like [Termux:Widge](https://wiki.termux.com/wiki/Termux:Widget): use `node $(which uclash)` command as an alternative
- Problems about esm: Upgrade nodejs

## know issue

- [ ] use white pac in android, bilibili app can't work
- [ ] use http(s) proxy in android, zhihu app can't work
