# 在 Termux 中部署 Clash

日常生活中，手机往往会被我随身携带。
将 clash 代理服务部署在手机中，在满足自身手机借助代理上网的同时也可以让局域网中所有设备都可以使用代理服务。

- 优点：
  - 共享代理给其他设备，节约成本
  - 免除多次部署的麻烦
  - 一般都会带着手机，可能便于切换各种网络环境
- 缺点：
  - 增加手机电池🔋消耗

## 相关工具的官网介绍

- [Termux][termux]: an Android terminal emulator and Linux environment app that works directly with no rooting or setup required. A minimal base system is installed automatically - additional packages are available using the APT package manager.
- [Clash][clash]: A rule-based tunnel in Go.
- [Clash Dashboard][clash-dashboard]: Web Dashboard for Clash, now host on ClashX

[termux]: https://termux.com
[clash]: https://github.com/Dreamacro/clash
[clash-dashboard]: https://github.com/Dreamacro/clash-dashboard

## 安装 Termux

官方推荐从[F-Droid](https://f-droid.org/packages/com.termux/)中安装 Termux，
可以直接在网页中下载 APK 文件进行安装，也可以安装 F-Droid 以方便及时更新。
在完成 termux 安装之后最好先运行`termux-change-repo`来[切换软件源](https://mirrors.tuna.tsinghua.edu.cn/help/termux/)，这样之后的下载工作会方便很多。
为了方便可以在手机上运行 sshd 服务，从而实现在电脑上远程登录。

## 安装 uclash

```sh
# 安装clash等依赖
pkg install git clash nodejs-lts npm

npm install -g uclash
# 或使用如下命令安装
pkg install yarn
yarn global add uclash

#初始化相关文件夹
uclash init


#更新配置文件
uclash generate 0
#启动clash，并打印相关信息, 0 表示配置文件夹中的第0个配置
uclash exec 0
```

## 配置方法

参看 [/config](../config/)， 如果没有设置配置文件夹(`config-folder`)，会默认使用这里面的配置。
如果有放配置文件的仓库可以设置`config-repo`，并初始化

```sh
#设置存放clash配置来源的仓库地址
uclash config config-repo git@gitee.com:xsro/my-clash-configuration.git
#克隆仓库到相应路径
uclash init
#列出配置文件列表
uclash config -p
```

## 设置代理

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

如果需要全局代理，可以使用[socksdroid](https://play.google.com/store/apps/details?id=net.typeblog.socks)，通过vpnservice来接管各个软件浏览，然后通过socks将流量转发给clash。其代码位于[github](https://github.com/bndeff/socksdroid)。

注意：一定要将termux添加到白名单，不然会浏览在两个软件之间反复转发。
