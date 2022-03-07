var wall_proxy = "SOCKS5 127.0.0.1:1080; SOCKS 127.0.0.1:1080;";

function FindProxyForURL(url, host) {
    url = "" + url;
    host = "" + host;
    if (isPlainHostName(host) === true) {
        return direct;
    }
    return wall_proxy;
}