//https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file
const pacs = [
    {
        "_": "https://github.com/petronny/gfwlist2pac",
        "name": "black.pac",
        "base": [
            "https://raw.githubusercontent.com/petronny/gfwlist2pac/master/gfwlist.pac",
            "https://cdn.jsdelivr.net/gh/petronny/gfwlist2pac@master/gfwlist.pac"],
        "replace": "SOCKS5 127.0.0.1:1080",
        "to": "SOCKS5 @ip:@socks; SOCKS @ip:@socks; HTTPS @ip:@port; HTTP @ip:@port; PROXY @ip:@port"
    },
    {
        "_": "https://github.com/breakwa11/gfw_whitelist",
        "name": "white.pac",
        "base": [
            "https://raw.githubusercontent.com/breakwa11/gfw_whitelist/master/whitelist.pac",
            "https://cdn.jsdelivr.net/gh/breakwa11/gfw_whitelist@master/whitelist.pac"],
        "replace": "SOCKS5 127.0.0.1:1080; SOCKS 127.0.0.1:1080",
        "to": "SOCKS5 @ip:@socks; SOCKS @ip:@socks; HTTPS @ip:@port; HTTP @ip:@port; PROXY @ip:@port"
    }
]

export default pacs