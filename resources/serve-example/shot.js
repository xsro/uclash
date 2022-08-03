const fs = require("fs");
const cp = require("cp");
const os = require("os");

const mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

let type = mime.jpg
let file = path.resolve(os.tmpdir(), Date.now().toString() + ".jpg")
try {
    cp.execSync(`termux-camera-photo  ${file}`);
} catch (e) {

}

if (fs.existsSync(file)) {
    let s = fs.createReadStream(file);
    s.on('open', function () {
        res.setHeader('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.setHeader('Content-Type', 'text/plain');
        res.statusCode = 404;
        res.end('Not found');
    });
}
else {
    let url = "https://assets.new.siemens.com/siemens/assets/api/uuid:a2219da4-b350-4b2c-9c2e-33ae61a305ac/width:2000/crop:0,204:0,11682:0,764:0,88084/quality:high/snc-keyvisual-cmyk.jpg"

    fetch(url).then(
        response => {
            if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
            response.body.pipe(res)
        }
    )
}

