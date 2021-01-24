'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

/**
 * Source: https://medium.com/@bargord11/write-your-first-node-js-terminal-progress-bar-5bd5edb8a563
 */
class ProgressBar {
    constructor() {
        this.activate = typeof process.stdout.clearLine == "function";
        this.total;
        this.current;
        this.bar_length = process.stdout.columns - 30;
    }

    init(total) {
        this.total = total;
        this.current = 0;
        this.update(this.current);
    }

    update(current) {
        if (!this.activate) return;
        this.current = current;
        const current_progress = this.current / this.total;
        this.draw(current_progress);
    }

    draw(current_progress) {
        if (!this.activate) return;
        const filled_bar_length = (current_progress * this.bar_length).toFixed(0);
        const empty_bar_length = this.bar_length - filled_bar_length;

        const filled_bar = this.get_bar(filled_bar_length, "█", a => `\x1b[37m${a}\x1b[0m`);
        const empty_bar = this.get_bar(empty_bar_length, "░", a => `\x1b[37m${a}\x1b[0m`);
        const percentage_progress = (current_progress * 100).toFixed(2);

        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(
            `\x1b[35mProgress:\x1b[0m |${filled_bar}${empty_bar}| ${percentage_progress}%`
        );
    }

    get_bar(length, char, color = a => a) {
        let str = "";
        for (let i = 0; i < length; i++) {
            str += char;
        }
        return color(str);
    }
};

/**
 * Download a file
 * 
 * @param {string} url the url of the file to download
 * @param {string} filePath the output path of the file
 * @param {fs.WriteStream} file the file stream
 */
async function download(url, filePath, file = null) {
    return new Promise((resolve, reject) => {
        let fileInfo = null, closeFile = true;
        if (file == null) file = fs.createWriteStream(filePath);
        else closeFile = false;

        const request = https.get(url, response => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location != undefined) {
                if (response.headers.location.startsWith("https://")) {
                    url = response.headers.location;
                } else {
                    const addr_regex = /^https:\/\/(www\.)?[a-zA-Z0-9\.]+\.[a-z]{1,5}/;
                    url = url.match(addr_regex)[0] + response.headers.location;
                }

                console.log(`\x1b[90mRedirecting to: ${url}\x1b[0m`);

                return download(url, filePath, file).then(resolve, reject);
            } else if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }

            fileInfo = {
                mime: response.headers['content-type'],
                size: parseInt(response.headers['content-length'], 10),
            };

            const bar = new ProgressBar();
            bar.init(fileInfo.size);

            let current = 0;
            response.on('data', chunk => {
                current += chunk.length;
                bar.update(current);
                file.write(chunk);

                if (current >= fileInfo.size) {
                    console.log();
                    file.end();
                }
            });
        });

        if (closeFile) {
            // The destination stream is ended by the time it's called
            file.on('finish', () => {
                resolve(fileInfo);
            });

            file.on('error', err => {
                fs.unlink(filePath, () => reject(err));
            });
        }

        request.on('error', err => {
            fs.unlink(filePath, () => reject(err));
        });

        request.end();
    });
}

// Source: https://stackoverflow.com/a/32197381
const deleteFolderRecursive = function (p) {
    if (fs.existsSync(p)) {
        fs.readdirSync(p).forEach((file) => {
            const curPath = path.join(p, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(p);
    }
};

function deleteIfExists(p) {
    if (fs.existsSync(p)) {
        if (fs.lstatSync(p).isDirectory()) {
            console.log(`Directory ${p} exists, deleting it`);
            deleteFolderRecursive(p);
        } else {
            console.log(`${p} exists, deleting it`);
            fs.unlinkSync(p);
        }
    }
}

function cleanUp() {
    const dist_dir = path.join(__dirname, "dist");
    const bin_dir = path.join(__dirname, "autobetlib", "bin");
    const conanbuildinfo_cmake = path.join(__dirname, "autobetlib", "conanbuildinfo.cmake");
    const conanbuildinfo_txt = path.join(__dirname, "autobetlib", "conanbuildinfo.txt");
    const conaninfo_txt = path.join(__dirname, "autobetlib", "conaninfo.txt");
    const graph_info_json = path.join(__dirname, "autobetlib", "graph_info.json");
    const out_dir = path.join(__dirname, 'out');

    deleteIfExists(dist_dir);
    deleteIfExists(bin_dir);
    deleteIfExists(out_dir);

    deleteIfExists(conanbuildinfo_cmake);
    deleteIfExists(conanbuildinfo_txt);
    deleteIfExists(conaninfo_txt);
    deleteIfExists(graph_info_json);
}

function full_clean() {
    cleanUp();

    const model_yml = path.join(__dirname, "resources", "data", "model.yml");
    const node_modules = path.join(__dirname, "node_modules");
    const lib_node_modules = path.join(__dirname, "autobetlib", "node_modules");
    const autobet_conf = path.join(__dirname, "autobet.conf");
    const autobet_log = path.join(__dirname, "autobet.log");
    const autobet_debug_log = path.join(__dirname, "autobet_debug.log");
    const winnings_dat = path.join(__dirname, "winnings.dat");

    deleteIfExists(model_yml);
    deleteIfExists(autobet_conf);
    deleteIfExists(autobet_log);
    deleteIfExists(autobet_debug_log);
    deleteIfExists(winnings_dat);

    deleteIfExists(node_modules);
    deleteIfExists(lib_node_modules);
}

async function downloadModel() {
    const dl_addr = "https://www.dropbox.com/s/wjmimum2lzmfdb2/model.yml?dl=1";
    const modelPath = path.join(__dirname, 'resources', 'data', 'model.yml');

    if (fs.existsSync(modelPath)) {
        console.log("The model file already exists, deleting it");
        fs.unlinkSync(modelPath);
        console.log(modelPath + " successfully deleted");
    }

    console.log("Downloading model.yml");
    await download(dl_addr, modelPath);
    console.log("\x1b[92mSuccessfully downloaded the model\x1b[0m");
}

function postbuild() {
    // Source: https://stackoverflow.com/a/26038979
    function copyFileSync(source, target) {
        var targetFile = target;

        // If target is a directory, a new file with the same name will be created
        if (fs.existsSync(target)) {
            if (fs.lstatSync(target).isDirectory()) {
                targetFile = path.join(target, path.basename(source));
            }
        }
        fs.writeFileSync(targetFile, fs.readFileSync(source));
    }

    function copyFolderRecursiveSync(source, target) {
        var files = [];

        // Check if folder needs to be created or integrated
        var targetFolder = path.join(target, path.basename(source));
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder);
        }

        // Copy
        if (fs.lstatSync(source).isDirectory()) {
            files = fs.readdirSync(source);
            files.forEach(function (file) {
                var curSource = path.join(source, file);
                if (fs.lstatSync(curSource).isDirectory()) {
                    copyFolderRecursiveSync(curSource, targetFolder);
                } else {
                    copyFileSync(curSource, targetFolder);
                }
            });
        }
    }

    const src = path.join(__dirname, 'src', 'main', 'qrcode');
    const dest = path.join(__dirname, 'out', 'main');
    copyFolderRecursiveSync(src, dest);
}

if (process.argv.length !== 3) {
    throw new Error("install.js called with invalid amount of arguments");
} else {
    switch (process.argv[2]) {
        case "--downloadModel":
            downloadModel();
            break;
        case "--postbuild":
            postbuild();
            break;
        case "--clean":
            cleanUp();
            break;
        case "--clean_all":
            full_clean();
            break;
        default:
            throw new Error(`Unknown argument: '${process.argv[2]}'`);
    }
}