
function uclash(){
    echo xsro\'s manage clash profiles $uclash_folder
    clash_ui_folder="$uclash_folder/_ui"
    clash_config_folder="$uclash_folder/_config"
    clash_command="node $uclash_folder exec --secret lucky"
    case $1 in
    a|autoupdate)
        crond
        echo "start cron to exec"
        echo "30 6 * * * node $uclash_folder generate -cp >> ~/clash_gen.log" > $TMPDIR/uclash_crontab.txt
        crontab $TMPDIR/uclash_crontab.txt
        ;;
    c|configlog)
        cd $clash_config_folder
        git log
        cd -
        ;;
    r|run)
        $clash_command
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
        git reset --hard "origin/gh-pages"
        cd -
        ;;
    config|generate|exec|help|-h|--help)
        node $uclash_folder $*
        ;;
    *)
        echo "no such command $*"
        ;;
    esac
}

