const fs = require('fs');
const Path = require('path');

const bin_dir = "./bin";

// Source: https://stackoverflow.com/a/32197381
const deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file, index) => {
            const curPath = Path.join(path, file);
            if (fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};

if (fs.existsSync(bin_dir)) {
    deleteFolderRecursive(bin_dir);
}

fs.mkdirSync(bin_dir);
fs.copyFileSync("./build/Release/autobetLib.node", bin_dir + "/autobetLib.node");
fs.copyFileSync("./external/opencv_world412.dll", bin_dir + "/opencv_world412.dll");