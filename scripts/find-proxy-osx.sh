proxy_ip=127.0.0.1
proxy_ui_port=9090
proxy_pac_path="/ui/c/index.txt"
logPath="/tmp/uclash.findproxy.log"
url="http://$proxy_ip:$proxy_ui_port$proxy_pac_path"
rm $logPath
curl $url -o $logPath
echo "downloaded $url"
cat $logPath | head -1
cat $logPath | grep $proxy_ip