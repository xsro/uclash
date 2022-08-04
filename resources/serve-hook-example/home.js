module.exports = function (req, res) {
    const { reqUrl, html } = this.context
    if (this.context.reqUrl.pathname === "/") {
        res.end(html)
    }
}