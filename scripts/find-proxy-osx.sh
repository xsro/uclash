proxy_ip=$(arp -a | grep -oE '192.168.[0-9]+.[0-9]+' | head -1)
proxy_ui_port=9090
proxy_pac_path="/ui/c/index.txt"
logPath="/tmp/uclash.findproxy.log"
url="http://$proxy_ip:$proxy_ui_port$proxy_pac_path"
rm $logPath
curl $url -o $logPath
echo "downloaded $url"

echo "==proxy server may on $proxy_ip==="
cat $logPath | head -1
cat $logPath | grep $proxy_ip