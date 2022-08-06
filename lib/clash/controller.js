import fetch, { Request, Headers } from "node-fetch";

/**
 * https://github.com/Dreamacro/clash/wiki/external-controller-API-reference
 */
export class Controller {
    constructor(extCtl, secret) {
        this.extCtl = extCtl
        this.headers = new Headers({
            "Content-Type": "application/json"
        })
        if (secret)
            this.headers.append("Authorization", `Bearer ${secret}`)
    }

    async logs() {
        const url = new URL(this.extCtl)
        url.pathname = "/logs";
        const req = new Request(url, {
            headers: this.headers,
            method: "GET"
        })
    }

    async traffic() {
        const url = new URL(this.extCtl)
        url.pathname = "/traffic";
        const req = new Request(url, {
            headers: this.headers,
            method: "GET"
        })
    }

    async version() {
        const url = new URL(this.extCtl)
        url.pathname = "/version";
        const req = new Request(url, {
            headers: this.headers,
            method: "GET"
        })
        const res = await fetch(req)
        const txt = await res.text()
        return txt
    }

    /**
     * see https://github.com/Dreamacro/clash/issues/440
     * @param {string} profile absolute path for config file
     */
    async configs(method, ...args) {
        const url = new URL(this.extCtl)
        url.pathname = "/configs";
        if (method === "GET") {
            const req = new Request(url.toString(), {
                headers: this.headers,
                method: "GET",
            })
            const res = await fetch(req)
            const json = await res.json()
            return json
        }
        if (method === "PUT" || method === "reload") {
            const req = new Request(url.toString(), {
                headers: this.headers,
                method: "PUT",
                body: JSON.stringify({ "path": args[0] })
            })
            const res = await fetch(req)
            const txt = await res.text()
            console.log(txt)
            return txt

        }

        if (method === "PATCH") {

        }


    }
    async reload(profile) {
        this.configs("reload", profile)
    }
}
