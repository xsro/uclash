import YAML from "yaml";
import { dirname } from "path";
import ip from "../util/ip";
import { ProfileInfo, ProfileType } from "../util/profile";
import config from "../util/config";

interface ProfileParsed {
    json: any,
    text: string,
}


async function parse(info: ProfileInfo):Promise<ProfileParsed> {
    const { uclash, path } = info
    let parsed: ProfileParsed = await uclash.gen.call(
        {
            config, YAML, ip,
            __dirname: dirname(path),
            __filename: path,
            info
        }
    )
    return parsed
}

export default parse