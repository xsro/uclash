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
     * curl -X PUT http://192.168.1.6:9090/configs -H "Content-Type:application/json" -d '{"path":"/data/data/com.termux/files/home/ibcn.yml"}'
     * @param {*} profile 
     */
    async reload(profile) {
        const url = new URL(this.extCtl)
        url.pathname = "/configs";
        const req = new Request(url, {
            headers: this.headers,
            method: "PUT",
            body: `{"path":"${profile}"}`
        })
        const res = await fetch(req)
        const txt = await res.text()
        console.log(txt)
    }
}
