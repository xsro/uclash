function hook(req, res) {
    const { reqUrl, html } = this.context
    if (this.context.reqUrl.pathname === "/") {
        res.end(html)
    }
}

hook["bind-url"] = "/"

module.exports = hook