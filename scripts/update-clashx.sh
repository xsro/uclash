cd $(dirname $(dirname $0))
git pull
node . update --git-push -f "$HOME/.config/clash/config.yaml"
cd -