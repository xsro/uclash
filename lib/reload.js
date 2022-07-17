import { getClashConfig } from "./utils/get-clash-profile.js";
import { Controller } from "./clash/controller.js";


export async function reload(profile) {
    const cprofile = await getClashConfig(profile);
    let url = new URL("http://127.0.0.1:9090");
    const extCtl = cprofile.config["external-controller"];
    if (extCtl) {
        const _url = new URL("http://" + extCtl);
        if (_url.port)
            url.port = _url.port;
    } else {
        console.log("no external-controller defined, try " + url);
    }
    const c = new Controller(url, cprofile.config["secret"]);
    await c.reload(cprofile.config.parser.destination);
    console.log("posted");
}
