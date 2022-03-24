/**generate terminal proxy command */

export function terminalProxyCMD(ip, profile) {
    const http = `http://${ip}:${profile["port"]}`
    const https = `https://${ip}:${profile["port"]}`
    const socks = `socks5://${ip}:${profile["socks-port"]}`
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