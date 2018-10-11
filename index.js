#!/usr/bin/env node

if (process.argv[2] === "help") {
    console.log(
        "usage: snekserve [PORT]\n\n" +
        "PORT defaults to 8080 if not specified.\n" +
        "For help or suggestions visit: https://github.com/lap00zza/snek-serve"
    );
    process.exit(0);
}

const http = require("http");
const fs = require("fs");
const path = require("path");
const util = require("util");
const mime = require("mime-types");

const PORT = process.argv[2] || 8080;
const _access = util.promisify(fs.access);
const _readdir = util.promisify(fs.readdir);

const genDirHTML = (files) => {
    let d_listing = "<pre>\n";
    d_listing += "<a href=\"../\">../</a>\n";
    files.forEach(file => {
        file.isDir
            ? d_listing += `<a href="${file.name}/">${file.name}/</a>\n`
            : d_listing += `<a href="${file.name}">${file.name}</a>\n`;
    });
    return d_listing + "</pre>";
};

const server = http.createServer(async (req, res) => {
    console.log("::request::", req.url);
    const fp = path.join(process.cwd(), req.url);
    try {
        // if a file does not exist we send a 404 from catch
        await _access(fp, fs.constants.F_OK);
        const fstats = fs.statSync(fp);
        if (fstats.isDirectory()) {
            let files = await _readdir(fp);
            files = files.map(file => {
                let isDir = false;
                try {
                    isDir = fs.statSync(path.join(fp, file)).isDirectory();
                } catch (e) {
                    console.error(e);
                }
                return {
                    name: file,
                    isDir
                };
            });
            res.writeHead(200, {
                "Content-Type": "text/html",
                "Access-Control-Allow-Origin": "*"
            });
            res.end(genDirHTML(files));
        } else {
            res.writeHead(200, {
                "Content-Type": mime.lookup(path.extname(fp)) || "text/plain",
                "Content-Length": fstats.size,
                "Access-Control-Allow-Origin": "*"
            });
            fs.createReadStream(fp).pipe(res);
        }
    } catch (e) {
        console.error(e);
        res.writeHead(404);
        res.end(":(");
    }
});

server.listen(PORT, () => {
    console.log(`Serving on http://localhost:${PORT}`);
});
