pkg install git clash nodejs-lts npm yarn

git clone https://gitee.com/xsro/uclash.git

cd uclash
echo "export uclash_folder=\"$(pwd)/\"" >> ~/.profile
echo ". $(pwd)/scripts/env.sh" >> ~/.profile

# git clone https://github.com/Dreamacro/clash-dashboard.git _ui -b gh-pages
git clone https://github.com/haishanh/yacd _ui/ -b gh-pages
git clone git@gitee.com:xsro/my-clash-configuration.git _config
yarn

mkdir _config
cd _config
git init
