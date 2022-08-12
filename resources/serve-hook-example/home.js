function hook(req, res) {
    const { reqUrl, html } = this.context
    if (this.context.reqUrl.pathname === "/") {
        res.end(html)
        this.prevent()
    }
}

hook["bind-url"] = /^\/$/

export default hook