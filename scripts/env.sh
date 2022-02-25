
function uclash(){
    echo xsro\'s manage clash profiles $uclash_folder
    clash_ui_folder="$uclash_folder/_ui"
    clash_command="node $uclash_folder exec --auto-update 0.5d --git-push  --deploy --secret lucky --ui $clash_ui_folder"
    case $1 in
    exec)
        $clash_command
        ;;
    screen)
        if [ "$2" = "" ]
		then
			screen -S clash -m $clash_command
        elif [ "$2" = "d" ]; then
            screen -S clash -dm $clash_command
		elif [ "$2" = "stop" ]; then
			screen -X -S clash quit
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
    u|upgrade)
        cd $uclash_folder
        git fetch
        git reset --hard origin/master
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

