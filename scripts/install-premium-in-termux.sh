#!/data/data/com.termux/files/usr/bin/bash
# This script file install clash premium in Termux inside android, use following command to install.
# 该脚本文件帮助在Termux中安装clash premium 可以使用下面的命令来在Termux中快速安装
#   curl -fsSL "https://raw.githubusercontent.com/xsro/uclash/main/scripts/install-premium-in-termux.sh" | bash
# 
# - premium release page：https://github.com/Dreamacro/clash/releases/tag/premium

# 修改此处可以设置不同的架构
arch="armv8"
# arch="armv5"
# arch="armv6"
# arch="armv7"

platform="linux"

#curl可以通过-x来设置代理，如"-x 127.0.0.1:7890"
# curl_proxy="-x 127.0.0.1:7890"

#下载文件
filename=$(curl -fsSL $curl_proxy "https://github.com/Dreamacro/clash/releases/tag/premium" | grep -oE "clash-$platform-$arch-[0-9]+.[0-9]+.[0-9]+" | head -1)
file="$filename.gz"

mkdir $TMPDIR/clash-premium/
curl -fSL $curl_proxy \
 https://github.com/Dreamacro/clash/releases/download/premium/$file \
 -o $TMPDIR/clash-premium/$file 

#解压文件
gunzip $TMPDIR/clash-premium/$file

#将文件移动到安装位置
bin_name="clash-premium"
bin_destination="/data/data/com.termux/files/usr/bin/$bin_name"
mv $TMPDIR/clash-premium/$filename $bin_destination
rmdir $TMPDIR/clash-premium/

#添加文件执行权限
chmod u+x $bin_destination

echo "[installed] $($bin_name -v)"
