#!/usr/bin/env sh
proxy_ips=$(arp -a | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+ ')
proxy_ui_port=9090
TMPDIR=$PREFIX/tmp
previous_path=$HOME/.config/uclash/previous_proxy.txt
#https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux/28938235#28938235
green='\033[0;32m'
red='\033[0;31m'
NC='\033[0m' # No Color

function req(){
    url=$1
    proxy=$2
    name=$3
    FILE="$TMPDIR/uclash.findproxy.$name.html"
    if [ -f $FILE ]
    then rm $FILE
    fi
    result=$(curl -fsSL $url \
        -w '%{time_total}s' \
        --connect-timeout 1 \
        -x $proxy \
        -o $FILE \
        2>/dev/null)
    code=$?
    if [ -f $FILE ]
    then printf "[${name}: ${green}${result}${NC}]"
    else printf "[${name}: ${red}failed${NC}]"
    fi
    return $code
}

function test_proxy(){
    proxy=$1
    printf "try $proxy\t"
    if req www.baidu.com $proxy baidu
    then 
        check_ip=$(node $(dirname $0)/../bin/uclash ip $proxy -p myip -k location.country_code | tail -1)
        printf "[location:${check_ip}]"
    fi
    printf "\n"
}

for proxy_ip in $proxy_ips
do 
    test_proxy   http://$proxy_ip:7890  
    test_proxy   socks://$proxy_ip:7891 
done

echo "==testing $previous_path"
if [ -f "$previous_path" ]
then
    sort  $previous_path | uniq - $previous_path.uniq
    for proxy in $(cat $previous_path.uniq)
    do test_proxy $proxy norec
    done
    mv $previous_path.uniq $previous_path
fi

