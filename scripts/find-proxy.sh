#!/usr/bin/env sh
proxy_ips=$(arp -a | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+ ')
proxy_ui_port=9090
TMPDIR=$PREFIX/tmp
for proxy_ip in $proxy_ips
do
    mkdir -p "$TMPDIR/uclash.findproxy/"
    possible_proxies=(
        http://$proxy_ip:7890,
        socks://$proxy_ip:7890,
    )

    for proxy in $possible_proxies
    do
        echo "try $proxy"
        FILE="$TMPDIR/uclash.findproxy/$proxy_ip.json"
        curl $url \
            -fsSL --connect-timeout 2 \
            -x $proxy_ip:7890 \
            -o $FILE \
            baidu.com 2>/dev/null

        if [ -f "$FILE" ];
        then
            echo "==>http proxy: $proxy"
        fi
    done
done