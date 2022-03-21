#!/usr/bin/env sh
proxy_ips=$(arp -a | grep -oE '[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+')
proxy_ui_port=9090
for proxy_ip in $proxy_ips
do
    mkdir "$TMPDIR/uclash.findproxy/"
    FILE="$TMPDIR/uclash.findproxy/$proxy_ip.json"
    url="http://$proxy_ip:$proxy_ui_port/ui/c/info.json"
    echo "checking $proxy_ip with $url"
    if [ -f "$FILE" ];
    then
        rm $FILE
    fi

    curl $url \
        -fsSL --connect-timeout 2 \
        -o $FILE

    if [ -f "$FILE" ];
    then
        echo "==proxy server may on $proxy_ip==="
        open "http://$proxy_ip:$proxy_ui_port/ui/c/"
    fi
done