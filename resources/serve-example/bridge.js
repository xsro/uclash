const fs = require("fs");
const os = require("os");

const link1 = "https://www.baidu.com/img/PCfb_5bf082d29588c07f842ccde3f97243ea.png"
const link2 = "https://assets.new.siemens.com/siemens/assets/api/uuid:a2219da4-b350-4b2c-9c2e-33ae61a305ac/width:2000/crop:0,204:0,11682:0,764:0,88084/quality:high/snc-keyvisual-cmyk.jpg"

module.exports = async function (req, res) {
    const { path } = this.preloaded
    const { reqUrl, getMime, download } = this.context;

    if (reqUrl.searchParams.get("link")) {
        let link = reqUrl.searchParams.get("link")
        if (link === "1") {
            link = link1
        }
        if (link === "2") {
            link = link2
        }
        link = new URL(link)
        let file = path.resolve(os.tmpdir(), Date.now() + path.basename(link.pathname))
        res.setHeader('Content-Type', getMime(path.extname(file)));
        await download(link.toString(), file)
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
}


