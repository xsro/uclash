const fs = require("fs");
const os = require("os");

const link1 = "https://www.baidu.com/img/PCfb_5bf082d29588c07f842ccde3f97243ea.png"
const link2 = "https://assets.new.siemens.com/siemens/assets/api/uuid:a2219da4-b350-4b2c-9c2e-33ae61a305ac/width:2000/crop:0,204:0,11682:0,764:0,88084/quality:high/snc-keyvisual-cmyk.jpg"

async function cb(req, res) {
    const { path, fetch, cp } = this.preloaded
    const { reqUrl, mime, download } = this.context;

    let file = path.resolve(os.tmpdir(), Date.now().toString() + ".jpg")
    if (reqUrl.searchParams.get("link")) {
        let link = reqUrl.searchParams.get("link")
        if (link === "1") {
            link = link1
        }
        if (link === "2") {
            link = link2
        }
        await download(link, file)
    }
    else {
        console.log("termux-camera-photo " + file)
        try {
            const cameraId = reqUrl.searchParams.get("id") ?? "0"
            cp.execSync(`termux-camera-photo  -c ${cameraId} ${file}`);
        } catch (e) {
            console.log(e)
        }
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
    }
}

export default cb


