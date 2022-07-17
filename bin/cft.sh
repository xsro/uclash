#!/usr/bin/env sh
current_path=$(readlink $0)
if [ "$current_path"a == ""a ]; then
    current_path=$0
fi
project_dir=$(dirname $current_path)
project_dir=$(dirname $project_dir)

case $1 in 
    i|install)
        bash $project_dir/scripts/install-clash.sh
        ;;
    p|install-premium)
        bash $project_dir/scripts/install-premium-in-termux.sh
        ;;
    s|setup)
        bash $project_dir/scripts/setup-in-termux.sh
        ;;
    r|reload)
        if [ -n $3 ]
        then controller=$3
        else controller="127.0.0.1:9090"
        fi
        file=$2
        curl -X PUT http://$controller/configs \
            -H "Content-Type:application/json" \
            -d "{\"path\":\"$file\"}"
        ;;
    *)
        uclash $*
esac
