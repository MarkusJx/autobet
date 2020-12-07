'use strict';

const fs = require('fs');
const path = require('path');
const request = require('request');

// Source: https://stackoverflow.com/a/32134846
const download = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const sendReq = request.get(url);

        // verify response code
        sendReq.on('response', (response) => {
            if (response.statusCode !== 200) {
                return reject('Response status was ' + response.statusCode);
            }

            sendReq.pipe(file);
        });

        // close() is async, call cb after close completes
        file.on('finish', () => file.close(resolve));

        // check for request errors
        sendReq.on('error', (err) => {
            fs.unlink(dest);
            return reject(err.message);
        });

        file.on('error', (err) => { // Handle errors
            fs.unlink(dest); // Delete the file async. (But we don't check the result)
            return reject(err.message);
        });
    });
};

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
        console.log(`${p} exists, deleting it`);
        deleteFolderRecursive(p);
    }
}

function cleanUp() {
    const dist_dir = path.join(__dirname, "dist");
    const bin_dir = path.join(__dirname, "autobetLib", "bin");
    const ext_dir = path.join(__dirname, "autobetLib", "external");
    const inc_dir = path.join(__dirname, "autobetLib", "include");
    const lib_lib_dir = path.join(__dirname, "autobetLib", "lib");
    const CppJsLib_dir = path.join(__dirname, "autobetLib", "src", "CppJsLib");
    const zip_dir = path.join(__dirname, "autobetLib", "src", "zip");

    deleteIfExists(dist_dir);
    deleteIfExists(bin_dir);
    deleteIfExists(ext_dir);
    deleteIfExists(inc_dir);
    deleteIfExists(lib_lib_dir);
    deleteIfExists(CppJsLib_dir);
    deleteIfExists(zip_dir);
}

function full_clean() {
    cleanUp();

    const model_yml = path.join(__dirname, "resources", "data", "model.yml");
    const node_modules = path.join(__dirname, "node_modules");
    const lib_node_modules = path.join(__dirname, "autobetLib", "node_modules");

    if (fs.existsSync(model_yml)) {
        console.log("The model file exists, deleting it");
        fs.unlinkSync(model_yml);
    }

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
    console.log("Successfully downloaded the model");
}

if (process.argv.length !== 3) {
    throw new Error("install.js called with invalid amount of arguments");
} else {
    switch (process.argv[2]) {
        case "--downloadModel":
            downloadModel();
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