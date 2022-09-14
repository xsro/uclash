/**
 * https://github.com/Dreamacro/clash/wiki/External-controller-API-Reference
 */
import axios from "axios";
const default_url = new URL("http:/127.0.0.1:9090")

export class Controller {
    constructor(public url: URL) {
        this.get.url = url;
        this.put.url = url;
    }
    public control(path: string, method: string, data: any) {
        const url = new URL(path, this.url);
        return axios(url.toString(),
            {
                method,
                data,
                headers: {
                    "Content-Type": "application/json",
                }
            }
        )
    }
    get = {
        url: default_url,
        configs: function () {
            const url = new URL("configs", this.url)
            return axios.get(url.toString())
        },
        logs: function () {
            const url = new URL("logs", this.url)
            return axios.get(url.toString())
        }
    }
    put = {
        url: default_url,
        configs: function (path: string) {
            const url = new URL("configs", this.url)
            return axios.put(url.toString(), { path }, {
                headers: {
                    "Content-Type": "application/json",
                }
            })
        }
    }
}
