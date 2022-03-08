# 在 Termux 中部署 Clash

日常生活中，手机往往会被我随身携带。
将 clash 代理服务部署在手机中，在满足自身手机借助代理上网的同时也可以让局域网中所有设备都可以使用代理服务，
这样往往可以节省开支并减少在多台设备中部署的一些麻烦。

## 相关工具的官网介绍

- [Termux][termux]: an Android terminal emulator and Linux environment app that works directly with no rooting or setup required. A minimal base system is installed automatically - additional packages are available using the APT package manager.
- [Clash][clash]: A rule-based tunnel in Go.
- [Clash Dashboard][clash-dashboard]: Web Dashboard for Clash, now host on ClashX

[termux]: https://termux.com
[clash]: https://github.com/Dreamacro/clash
[clash-dashboard]: https://github.com/Dreamacro/clash-dashboard

## 1 安装 Termux

官方推荐从[F-Droid](https://f-droid.org/packages/com.termux/)中安装 Termux，
可以直接在网页中下载 APK 文件进行安装，也可以安装 F-Droid 以方便及时更新。
在完成 termux 安装之后最好先运行`termux-change-repo`来[切换软件源](https://mirrors.tuna.tsinghua.edu.cn/help/termux/)，这样之后的下载工作会方便很多。
为了方便可以在手机上运行 sshd 服务，从而实现在电脑上远程登录。

## 2 安装 clash

官方提供了 clash 的安装包，你可能需要

```sh
pkg install clash
```

运行 clash 代理需要一个 clash 配置文件，通常是一个 yaml 文件。

```sh
clash -f <配置文件本地地址>
```

终端会打印出相应服务运行所在的端口，包括 RESTful API，HTTP 代理，SOCKS 代理端口，
例如以下信息：

```plainText
INFO[0000] RESTful API listening at: [::]:9090
INFO[0000] HTTP proxy listening at: [::]:7890
INFO[0000] SOCKS proxy listening at: [::]:7891
```

还需要知道自己设备的端口，通常进入手机的 wifi 设置中可以看到自己手机在局域网中的 wifi 地址，
可以在 termux 中输入`ip addr`查看，以下命令可能可以帮助查找：

```sh
ip addr | grep -Eo '192.[0-9]+.[0-9]+.[0-9]+'|head -1
```

比如我的 ip 地址是`192.168.0.102`，可以到路由器中将 ip 设置为固定 ip（似乎也叫静态 ip，或者叫与 mac 绑定）。
也可以在手机中将 IP 设置（通常为 DHCP）改为静态并手动设置 IP。
这个 ip 地址就是我们运行代理服务的代理服务器地址。

## 3 管理 clash

[clash-dashboard][clash-dashboard]是一个 nodejs 程序，使用[pnpm][pnpm]管理依赖，并使用[vite][vite]作为开发工具所以需要先安装以上三个工具。

```sh
#安装需要使用的软件
pkg install nodejs-lts npm
npm install -g pnpm --registry=https://registry.npmmirror.com

#克隆基于vue的web应用来提供ui
git clone https://github.com/Dreamacro/clash-dashboard.git
#构建ui
cd clash-dashboard
pnpm install
pnpm build
cd ..
```

构建完成之后，文件位于`dist`目录。
可以使用通过 clash 的`-ui`参数来将构建好的 web 应用托管到网络中。

```sh
clash -f <配置文件本地地址> -ext-ui "clash-dashboard/dist"
```

在浏览器中打开`<ip地址>:<RESTful Api端口号>/ui`,就应该可以看到管理面板了，在打开的界面中填入 clash 服务的 ip 地址和 RESTful API 的端口号即可，即可进行控制。

![](/images/clash-dashboard-config.png)

[pnpm]: https://pnpm.io
[vite]: https://vitejs.dev

## 4 设置代理

### windows 设置系统代理

（我使用的是 win10）进入`设置`，`网络与Internet`，选择**代理**，在**手动设置代理**中填入代理服务器地址和端口，打开**使用代理服务器**。

### mac 设置 WiFi 代理

打开`设置`，进入`网络`，在 Wi-Fi 中选择高级，进入**代理**选项卡，在网页代理(HTTP)、安全网页代理(HTTPS)、SOCKS 代理中填入相应的代理服务器地址和端口，并应用。**忽略这些主机与域的代理设置**中可以设置如下内容

```plainText
192.168.0.0/16、10.0.0.0/8、172.16.0.0/12、127.0.0.1、localhost、*.local、timestamp.apple.com、*.cn
```

### 安卓设置 WiFi 代理

我使用的 MIUI12

- 点击`双卡与移动网络`，点击上完对应的卡，进入`接入点名称`，在选中的接入点中，设置代理
- 进入 Wi-Fi，点击连接的 Wifi，下滑在`代理`中选择手动，主机名填入代理服务器地址，端口填写 http 代理服务端口。
