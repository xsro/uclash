/**generate terminal proxy command */

export function terminalProxyCMD(ip, profile = { port: 7890, "socks-port": 7891 }) {
    let { port, "socks-port": socksPort } = profile
    if (profile["mixed-port"]) {
        port = profile["mixed-port"];
        socksPort = profile["mixed-port"];
    }
    const http = `http://${ip}:${port}`
    const https = `http://${ip}:${port}`
    const socks = `socks5://${ip}:${socksPort}`
    return {
        "sh": [
            `export http_proxy="${http}"`,
            `export https_proxy="${https}"`,
            `export all_proxy="${socks}"`
        ],
        "cmd": [
            `set HTTP_PROXY="${http}"`,
            `set HTTPS_PROXY="${https}"`,
            `set ALL_PROXY="${socks}"`
        ]
    };
}