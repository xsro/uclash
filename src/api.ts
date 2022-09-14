import expr from "./expr";
import parse from "./parse/main";
import config from "./config";
import { systemIp, systemIp192, publicIP, getPublicIpProviders } from "./util/ip";
import { getAppProfiles, getAppProfile, ProfileInfo } from "./profile";
import { ProfileType } from "./profile.def";
import { ClashDashBoards } from "./util/default";
import { curlCp } from "./util/curl"
import { Controller } from "./clash/controller"

config.curl = new curlCp(config.get("curl", {}))
config.cURL = config.curl.cURL.bind(config.curl)

export {
     expr,
     config,
     getAppProfiles, getAppProfile,
     systemIp, systemIp192, publicIP, getPublicIpProviders,
     parse,
     Controller,
     ProfileInfo, ProfileType, ClashDashBoards as ClashDashBoard
};