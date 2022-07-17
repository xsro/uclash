import { getClashConfig } from "./utils/get-clash-profile.js";
import { Controller } from "./clash/controller.js";

export async function reload(profile, options = { extCtl: "http://127.0.0.1:9090", isclash: false }) {
    console.log(options, profile)
    let url = new URL("http://127.0.0.1:9090")
    let secret = undefined
    let clash_profile = undefined
    if (!options.isclash) {
        const cprofile = await getClashConfig(profile);
        const extCtl = cprofile.config["external-controller"];
        clash_profile = cprofile.config.parser.destination
        if (extCtl) {
            const _url = new URL("http://" + extCtl);
            if (_url.port)
                url.port = _url.port;
        } else {
            console.log("no external-controller defined, try " + url);
        }
        secret = cprofile.config["secret"]
    }
    if (options.extCtl) {
        url = new URL(options.extCtl)
    }
    const c = new Controller(url, secret);
    await c.reload(clash_profile);
    console.log("posted");
}
