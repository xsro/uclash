#!/usr/bin/env sh
# xsro@foxmail.com
# find proxy in arp and history
TMPDIR=$PREFIX/tmp
previous_path=$HOME/.config/uclash/previous_proxy.txt
totry_path=$HOME/.config/uclash/totest.txt

#https://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux/28938235#28938235
green='\033[0;32m'
red='\033[0;31m'
NC='\033[0m' # No Color

function req(){
    local url=$1
    local proxy=$2
    local name=$3
    local FILE="$TMPDIR/uclash.findproxy.$name.html"
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
    local proxy=$1
    if req www.baidu.com $proxy baidu
    then 
        check_ip=$(node $(dirname $0)/../bin/uclash ip $proxy -p myip -k location.country_code | tail -1 2>/dev/null)
        printf "[location:${check_ip}]"
        return 0
    fi
    return 1
}

echo "">$totry_path
function appendline(){
    local line=$1
    echo "$line" >>$totry_path
}
for proxy_ip in $(arp -a | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
do 
    appendline http://$proxy_ip:7890
    appendline socks://$proxy_ip:7891
done

if [ -f "$previous_path" ]
then
    cat $previous_path >>$totry_path
fi

for proxy in $(sort $totry_path -u )
do
    printf "try $proxy\t"
    if [ "$1" = "-d" ]
    then echo "\tdry run"
    else
        #https://stackoverflow.com/questions/11287861/how-to-check-if-a-file-contains-a-specific-string-using-bash
        if (test_proxy $proxy) && !(grep -q "$proxy" "$previous_path")
        then echo $proxy >> $previous_path
        fi
        echo ""
    fi
done




