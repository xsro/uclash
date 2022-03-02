
function uclash(){
    echo xsro\'s manage clash profiles $uclash_folder
    clash_ui_folder="$uclash_folder/_ui"
    clash_config_folder="$uclash_folder/_config"
    clash_command="node $uclash_folder exec --secret lucky"
    case $1 in
    a|autoupdate)
        crond
        echo "add following command to the prompt window"
        echo "30 2 * * * node $uclash_folder generate >> ~/clash_gen.log"
        crontab -e 
    run)
        $clash_command
        ;;
    screen)
        if [ "$2" = "" ]
		then
			screen -S uclash -m $clash_command
        elif [ "$2" = "d" ]; then
            screen -S uclash -dm $clash_command
		elif [ "$2" = "stop" ]; then
			screen -X -S uclash quit
		fi
        ;;
    pm2)
        pm2 $clash_command
        ;;
    loop)
        for i in {1..100}
        do
            git fetch
            git reset --hard origin/master
            echo "Hai $i"
            $clash_command
        done
        ;;
    u|update)
        cd $uclash_folder
        git fetch
        git reset --hard origin/main
        cd -
        cd $clash_config_folder
        git fetch
        git reset --hard origin/main
        cd -
        cd $clash_ui_folder
        git fetch
        git reset --hard origin/gh-pages
        cd -
        ;;
    g)
        node $uclash_folder update -c3
        ;;
    *)
        node $uclash_folder $*
    esac
}

