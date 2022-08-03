const cp = require("child_process")
const os = require("os")

module.exports = function (req, res) {
    const ls = cp.execSync("whoami")
    res.end(ls + this.filename + "\n" + os.version())
    return
}