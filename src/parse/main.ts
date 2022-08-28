import YAML from "yaml";
import { dirname } from "path";
import ip from "../util/ip";
import { ProfileInfo } from "../profile";
import config from "../config";
import { ProfileParsed } from "../profile.def";
import { Config } from "../util/config";

export interface genApi {
    __filename: string,
    __dirname: string,
    config: Config,
    YAML: typeof YAML,
    ip: typeof ip,
    info: ProfileInfo
}

async function parse(info: ProfileInfo): Promise<ProfileParsed> {
    const { uclash, path } = info;
    const thisArg: genApi = {
        config, YAML, ip,
        __dirname: dirname(path),
        __filename: path,
        info
    }
    if (uclash) {
        let parsed: ProfileParsed = await uclash.gen.call(thisArg)
        return parsed
    }
    throw new Error(info + "doesn't has uclash property")
}

export default parse