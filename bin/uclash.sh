#!/usr/bin/env sh
current_path=$(readlink $0)
if [ -z $current_path ]
then current_path=$0
fi
project_dir=$(dirname $current_path)
project_dir=$(dirname $project_dir)

alias uclash="node $project_dir/bin/uclash.js"

case $1 in 
    i|install-clash)
        bash $project_dir/scripts/install-clash.sh
        ;;
    p|install-premium)
        bash $project_dir/scripts/install-premium-in-termux.sh
        ;;
    f|fine)
        bash $project_dir/scripts/find-proxy.sh
        ;;
    r|reload)
        file=$(uclash p -c $2)
        clash_controller=$3
        if [ -z $3 ]
        then clash_controller="127.0.0.1:9090"
        fi
        curl -X PUT http://$clash_controller/configs \
            -H "Content-Type:application/json" \
            -d "{\"path\":\"$file\"}"
        ;;
    *)
        uclash $*
esac
