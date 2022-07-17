import fetch, { Request, Headers } from "node-fetch";


export class Controller {
    constructor(extCtl, secret) {
        this.extCtl = extCtl
        this.headers = new Headers({
            "Content-Type": "application/json"
        })
        if (secret)
            this.headers.append("Authorization", `Bearer ${secret}`)
    }

    /**
     * see https://github.com/Dreamacro/clash/issues/440
     * @param {string} profile absolute path for config file
     */
    async reload(profile) {
        const url = new URL(this.extCtl)
        url.pathname = "/configs";
        const req = new Request(url, {
            headers: this.headers,
            method: "PUT",
            body: JSON.stringify({ "path": profile })
        })
        const res = await fetch(req)
        const txt = await res.text()
        console.log(txt)
    }
}
