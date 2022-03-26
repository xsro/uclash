uname -a 
arch

arch="amd64"

platform="linux"

#curl可以通过-x来设置代理，如"-x 127.0.0.1:7890"
# curl_proxy="-x 127.0.0.1:7890"

#下载文件
version=$(curl -fsSL $curl_proxy "https://github.com/Dreamacro/clash/releases" | grep -oE "v[0-9]+\.[0-9]+\.[0-9]+" | head -1)
filename="clash-$platform-$arch-$version"
file="$filename.gz"

tmpdir=$(pwd)/.clash
mkdir $tmpdir/
curl -fSL $curl_proxy \
 https://github.com/Dreamacro/clash/releases/download/$version/$file \
 -o $tmpdir/$file 

#解压文件
gunzip $tmpdir/$file

#将文件移动到安装位置
bin_name="clash"
bin_destination=$1/$bin_name
mv $tmpdir/$filename $bin_destination
rmdir $tmpdir/

#添加文件执行权限
chmod u+x $bin_destination

echo "[installed] $($bin_destination -v)"
