const os = require("os");
// const fs = require("fs");

function cb(req, res) {
    const { path, fetch, cp, fs } = this.preloaded;
    const { reqUrl, getMime } = this.context;
    const params = new URL(reqUrl).searchParams
    let file = params.has("path") ? params.get("path") : os.homedir();
    if (fs.existsSync(file)) {
        const s = fs.statSync(file)
        if (s.isFile()) {
            res.setHeader('Content-Type', getMime(path.extname(file)));
            let s = fs.createReadStream(file);
            s.on('open', function () {
                s.pipe(res);
            });
            s.on('error', function () {
                res.setHeader('Content-Type', 'text/plain');

                res.statusCode = 404;
                res.end('Not found');
            });
        }
        if (s.isDirectory()) {
            const subs = fs.readdirSync(file);
            subs.unshift("..", ".")
            const links = subs.map(f => {
                const u = new URL(reqUrl);
                u.searchParams.set("path", path.resolve(file, f))
                return u.absLink()
            })
            const text = subs.map((val, idx) => `<li><a href="${links[idx]}">${val}</a></li>`)
            res.setHeader('x-content-type-options', 'nosniff');
            res.setHeader('Content-Type', 'text/html');
            const home = new URL(reqUrl);
            home.searchParams.set("path", os.homedir())
            const tmp = new URL(reqUrl);
            tmp.searchParams.set("path", os.tmpdir())
            res.end(`
<html>
<body>
<a href="${home.absLink()}">HOME</a>
<a href="${tmp.absLink()}">tmp</a>
<ol>
${text.join("\n")}
</ol>
</body>
</html>
`)
        }
    }
    else {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 404;
        res.end('Not found');
    }
}
export default cb