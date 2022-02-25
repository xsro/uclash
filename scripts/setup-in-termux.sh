pkg install git clash nodejs-lts npm yarn

git clone https://github.com/Dreamacro/clash-dashboard.git -b gh-pages
git clone https://gitee.com/xsro/uclash.git

echo "export clash_ui_folder=\"$(pwd)/clash-dashboard/\"" >> ~/.profile
echo "export clash_config_folder=\"$(pwd)/uclash/\"" >> ~/.profile
echo "export uclash_config=\"$(pwd)/uclash/_config/base_config.yml\"" >> ~/.profile
echo ". $(pwd)/uclash/scripts/env.sh" >> ~/.profile

cd uclash
yarn

mkdir _config
cd _config
git init
