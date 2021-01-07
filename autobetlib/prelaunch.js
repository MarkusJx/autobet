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
fs.copyFileSync("./build/src/bin/autobetLib.node", bin_dir + "/autobetLib.node");
if (process.argv.length === 3 && process.argv[2] === "--dev") {
    fs.copyFileSync("./build/src/bin/autobetLib.pdb", bin_dir + "/autobetLib.pdb");
}