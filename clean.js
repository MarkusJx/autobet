const fs = require('fs');
const Path = require('path');

// Source: https://stackoverflow.com/a/32197381
const deleteFolderRecursive = function(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach((file) => {
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

function deleteIfExists(path) {
    if (fs.existsSync(path)) {
        console.log(path + " exists, deleting it");
        deleteFolderRecursive(path);
    }
}

function cleanUp() {
    const dist_dir = Path.join(__dirname, "dist");
    const bin_dir = Path.join(__dirname, "autobetLib", "bin");
    const ext_dir = Path.join(__dirname, "autobetLib", "external");
    const inc_dir = Path.join(__dirname, "autobetLib", "include");
    const lib_lib_dir = Path.join(__dirname, "autobetLib", "lib");
    const CppJsLib_dir = Path.join(__dirname, "autobetLib", "src", "CppJsLib");
    const zip_dir = Path.join(__dirname, "autobetLib", "src", "zip");

    deleteIfExists(dist_dir);
    deleteIfExists(bin_dir);
    deleteIfExists(ext_dir);
    deleteIfExists(inc_dir);
    deleteIfExists(lib_lib_dir);
    deleteIfExists(CppJsLib_dir);
    deleteIfExists(zip_dir);
}

cleanUp();