const fs = require("fs");
const os = require("os");


const link1 = "https://www.baidu.com/img/PCfb_5bf082d29588c07f842ccde3f97243ea.png"
const link2 = "https://assets.new.siemens.com/siemens/assets/api/uuid:a2219da4-b350-4b2c-9c2e-33ae61a305ac/width:2000/crop:0,204:0,11682:0,764:0,88084/quality:high/snc-keyvisual-cmyk.jpg"


module.exports = function (req, res) {
    const { path, fetch, cp } = this.preloaded
    const { reqUrl, mime } = this.context;

    if (reqUrl.searchParams.has("link")) {
        let link = reqUrl.searchParams.get("link")
        if (link === "1") {
            link = link1
        }
        if (link === "2") {
            link = link2
        }
        fetch(link).then(
            response => {
                if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
                response.body.pipe(res)
            }
        )
    }
    else {
        let file = path.resolve(os.tmpdir(), Date.now().toString() + ".jpg")
        console.log("termux-camera-photo " + file)
        try {
            cp.execSync(`termux-camera-photo  ${file}`);
        } catch (e) {
            console.log(e)
        }
        console.log(fs.existsSync(file) ? "exist" : "miss")
        if (fs.existsSync(file)) {
            let s = fs.createReadStream(file);
            s.on('open', function () {
                res.setHeader('Content-Type', mime.jpg);
                s.pipe(res);
            });
            s.on('error', function () {
                res.setHeader('Content-Type', 'text/plain');
                res.statusCode = 404;
                res.end('Not found');
            });
        }
        else {
            fetch(link1).then(
                response => {
                    if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
                    response.body.pipe(res)
                }
            )
        }
    }
}


