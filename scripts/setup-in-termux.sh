pkg install clash nodejs-lts npm yarn

git clone https://github.com/Dreamacro/clash-dashboard.git -b gh-pages
git clone https://gitee.com/xsro/my-clash-configuration.git

cd my-clash-configuration
yarn

echo "export clash_ui_folder=\"$(pwd)/clash-dashboard/\"" >> ~/.profile
echo "export clash_config_folder=\"$(pwd)/my-clash-configuration/\"" >> ~/.profile
echo ". $(pwd)/my-clash-configuration/scripts/env.sh" >> ~/.profile
