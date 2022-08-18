#!/usr/bin/env sh
current_path=$(readlink $0)
if [ -z $current_path ]
then current_path=$0
fi
project_dir=$(dirname $current_path)
project_dir=$(dirname $project_dir)

cd $project_dir
project_dir=`pwd -P`
cd - >/dev/null

alias uclash="node $project_dir/bin/uclash.js"

case $1 in 
    install-clash)
        bash $project_dir/scripts/install-clash.sh
        ;;
    install-premium)
        bash $project_dir/scripts/install-premium-in-termux.sh
        ;;
    f|find)
        bash $project_dir/scripts/find-proxy.sh
        ;;
    g|gen)
        profiles=$(uclash config -a -k profiles.folder)
        emoji=$(uclash expr "rE()")
        message=$(uname -mnrs)
        cd $profiles
        git pull
        uclash g $2 $3 $4 $5
        git add .
        git commit -m"$emoji $message"
        git push
        cd -
        if (command -v clash)
        then
            clash -t -f $(uclash p -c $2)
        fi
        ;;
    cron)
        profile=$2
        cat <<EOF >$HOME/.clash-update.sh
if (sh $project_dir/bin/uclash.sh gen $profile)
then
    sh $project_dir/bin/uclash.sh reload $profile
fi
EOF
        echo "* */4 * * * sh $HOME/.clash-update.sh >>$HOME/.clash-update.log" >$PREFIX/tmp/uclash.crontab
        crontab $PREFIX/tmp/uclash.crontab
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
