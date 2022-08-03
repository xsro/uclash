module.exports = function (req, res) {
    const { fs, path } = this.preloaded
    res.end(fs.readFileSync(path.resolve(__dirname, "live.html"), "utf-8"))
}