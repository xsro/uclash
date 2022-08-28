import { Config } from "./util/config"
import { curlCp } from "./util/curl"


export const config = new Config()
config.curl = new curlCp(config.get("curl", {}))
config.cURL = config.curl.cURL.bind(config.curl)

export default config




