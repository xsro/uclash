# 安装 clash

官方提供了 clash 的安装包，你可能需要

```sh
pkg install clash
```

运行 clash 代理需要一个 clash 配置文件，通常是一个 yaml 文件。
可以使用`curl`下载clash配置文件。

```sh
curl <订阅链接> -o <配置文件本地地址>
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

之后可以前往<http://clash.razord.top>设置好RESTful端口，就可以控制
